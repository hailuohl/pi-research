import {join} from 'node:path';
import {readStableFile} from '../workspace/stable-file.js';
import {verifySnapshot} from '../workspace/files.js';
import {modelConnectionSnapshot} from '../pi-adapter/model-connections.js';
import {publicationImageCatalog} from '../pi-adapter/publication-image.js';
import {validateSourceRevision} from '../workspace/source-access.js';
import {assertExperimentSourceCurrent} from './lifecycle.js';
import type {Actor,Approval,Message,Row,Session,RunIntent,Run,Experiment} from '../domain/types.js';
import type {DevelopmentTask,SandboxJob} from '../execution/contracts.js';
import type {ResearchApp} from '../research-app.js';
import type {Store} from '../storage/store.js';
import {digest,now} from '../storage/store.js';
import {ensure} from '../domain/errors.js';
import type {PermissionReference} from './session-permissions.js';
import type {HostAccessGrant} from './host-access.js';
import type {ResearchAutomationPolicy} from './host-access.js';
import {userOnly,scope} from './permissions.js';
import {object,integer,oneOf,text,strings} from '../contracts/validation.js';

export const AUTOMATION_LIMITS={development:3,run:2,continuations:6,durationMs:2*60*60*1000} as const;
export const APPROVAL_RESUME_TOOLS=['development_inspect','development_submit','development_logs'];
export const CONTINUATION_TOOLS=['research_task_checkpoint','project_inspect','execution_environment_list','research_brief_inspect','workspace_list','workspace_read','workspace_write','workspace_prepare_from_revision','experiment_source_list','experiment_source_read','experiment_plan_submit','development_prepare','development_submit','development_inspect','development_logs','development_review_prepare','development_review_inspect','development_review_source_list','development_review_source_read','run_prepare','run_submit','run_inspect','run_logs','run_source_list','run_source_read','artifact_read','evidence_read','research_skill_list','research_skill_read'];
export interface ApprovalResumeBinding {rootSessionId:string;originMessageId:string;originDigest:string;modelDigest:string;permission:PermissionReference;}
export interface FullAccessReference {continuationId:string;digest:string;}
interface Runtime {runtimeId:string;leaseUntil:number;state:'active'|'stopped';authorities?:string[];}
export interface ResearchContinuation {
    rootSessionId:string;originMessageId:string;originDigest:string;permission:PermissionReference;runtimeId:string;modelDigest:string;
    sourceRevisionId?:string;lifecycleEpoch?:number;expiresAt:string|null;limits:ResearchAutomationPolicy['limits'];policy?:ResearchAutomationPolicy;digest:string;state:'active'|'paused'|'blocked'|'cancelled'|'completed';reason?:string;
}
export interface Authorization {continuationId:string;subjectKind:'development-task'|'run-intent';subjectId:string;manifestDigest:string;approvalId:string;dockerTarget?:{context:string;targetId:string;engineId:string;endpoint:string};jobId?:string;}

function modelDigest(store:Store,s:Session){const snapshot=modelConnectionSnapshot(store.paths.dataDir,s.model.provider);return digest({model:s.model,connectionVersion:snapshot.version,connectionDigest:digest(snapshot.connection??null),catalogDigest:publicationImageCatalog(join(store.paths.dataDir,'models.json'),snapshot.catalog)});}

/** Frozen proof remains readable; only admission and live execution require the owner lease. */
export function assertResearchReference(store:Store,pid:string,ref:FullAccessReference,current=false,execution=false) {
    const c=store.get<ResearchContinuation>('research-continuation',ref.continuationId,pid);
    const {id,kind,projectId,version,createdAt,updatedAt,state,reason,digest:hash,...fixed}=c;
    ensure(hash===ref.digest&&digest(fixed)===hash,'AUTOMATION_STALE','持续任务的固定授权已变化',403);
    if(!current)return c;
    const s=store.get<Session>('session',c.rootSessionId,pid),grant=store.get<HostAccessGrant>('host-access',s.id,pid);
    const permission=store.maybe<{epoch:number}>('session-permission',s.id),runtime=store.maybe<Runtime>('research-runtime','owner');
    ensure((c.state==='active'||execution&&c.policy&&c.state==='paused')&&(c.expiresAt===null||Date.parse(c.expiresAt)>Date.now()),'AUTOMATION_STOPPED',c.reason??'持续任务已停止或过期',403);
    ensure(!store.get('project',pid).archived&&s.state!=='archived'&&!s.parentSessionId&&!s.taskId&&!s.teamId&&s.role==='coordinator','AUTOMATION_STALE','持续任务的项目或根会话已失效',403);
    if(c.policy)ensure(c.lifecycleEpoch===store.get('project',pid).lifecycleEpoch,'AUTOMATION_STALE','项目已归档或重开，原任务授权不能复活',403);
    const repairSource=c.policy?store.maybe<{sourceRevisionId:string}>('research-repair-source',c.id):undefined;
    ensure(!s.workingGrantId&&!s.runGrantId&&!s.discoveryGrantId&&!s.textCorpusGrantId&&modelDigest(store,s)===c.modelDigest&&s.sourceRevisionId===(c.sourceRevisionId??repairSource?.sourceRevisionId),'AUTOMATION_STALE','持续任务的模型、来源或授权绑定已变化',403);
    ensure((permission?.epoch??0)===c.permission.epoch&&grant.epoch===c.permission.hostEpoch&&grant.runtimeId===c.runtimeId&&grant.state==='enabled'&&(c.policy?grant.researchAutomationScope===2&&digest(grant.researchAutomationPolicy)===digest(c.policy):grant.researchAutomationScope===1),'AUTOMATION_REVOKED','当前自主计算授权已撤销或替换',403);
    if(!execution||!c.policy)ensure((c.policy||runtime?.runtimeId===c.runtimeId)&&runtime?.state==='active'&&runtime.leaseUntil>Date.now(),'AUTOMATION_RUNTIME_EXPIRED','授权执行端已停止或租约失效',403);
    const origin=store.get<Message>('message',c.originMessageId,pid);
    ensure(origin.sessionId===s.id&&origin.role==='user'&&!origin.origin&&!origin.wakeupId&&!origin.approvalNoticeId&&digest(origin.content)===c.originDigest&&digest(origin.permission)===digest(c.permission),'AUTOMATION_STALE','原用户任务已变化',403);
    const stopped=store.db.prepare("SELECT 1 FROM events WHERE project_id=? AND seq>(SELECT COALESCE(MIN(seq),0) FROM events WHERE project_id=? AND type='research.continuation_created' AND json_extract(payload,'$.continuationId')=?) AND (type='project.archived' OR type='session.interrupted' AND json_extract(payload,'$.sessionId')=?) LIMIT 1").get(pid,pid,c.id,s.id);
    ensure(c.policy||!stopped,'AUTOMATION_STOPPED','原任务已停止或归档，重开不能恢复旧授权',403);
    return c;
}

export class ResearchAutomationService {
    modelIdentity(session:Session){return modelDigest(this.app.store,session);}
    private ownerStarted=false;
    private ownerClaimed=false;
    private ownerSuperseded=false;
    constructor(private app:ResearchApp){}
    isOwner(){const r=this.app.store.maybe<Runtime>('research-runtime','owner');return r?.runtimeId===this.app.hostAccess.researchRuntimeId()&&r.state==='active'&&r.leaseUntil>Date.now();}
    private cancelOwnedChains(reason:string){for(const c of this.app.store.list<ResearchContinuation>('research-continuation').filter(c=>!c.policy&&c.runtimeId===this.app.hostAccess.researchRuntimeId()&&c.state==='active'))this.app.store.update<ResearchContinuation>('research-continuation',c.id,c.version,{state:'cancelled',reason});}
    startOwner(){if(this.ownerStarted)return;this.ownerStarted=true;this.ownerClaimed=false;this.ownerSuperseded=false;this.heartbeatOwner();}
    heartbeatOwner(){
        if(!this.ownerStarted){this.startOwner();return;}
        if(this.ownerSuperseded)return;
        this.app.store.transaction(()=>{
            const id=this.app.hostAccess.researchRuntimeId(),r=this.app.store.maybe<Runtime>('research-runtime','owner');
            // A replaced host keeps ordinary work alive, but never reclaims the other owner's lease.
            if(this.ownerClaimed&&r?.runtimeId!==id){this.ownerSuperseded=true;return;}
            const authorized=this.app.store.list<HostAccessGrant>('host-access').some(g=>(g.researchAutomationScope===2||g.researchAutomationScope===1&&g.runtimeId===id)&&g.state==='enabled'&&this.app.hostAccess.status({type:'user'},g.sessionId).researchAutomation);
            if(!authorized){
                if(this.ownerClaimed&&r?.runtimeId===id&&r.state==='active'){this.app.store.update<Runtime>('research-runtime',r.id,r.version,{state:'stopped',leaseUntil:0});this.cancelOwnedChains('自主计算授权已停用');}
                return;
            }
            if(r?.runtimeId===id&&r.state==='active'&&r.leaseUntil>Date.now()){
                this.ownerClaimed=true;
                if(r.leaseUntil-Date.now()<20000)this.app.store.update<Runtime>('research-runtime',r.id,r.version,{leaseUntil:Date.now()+30000});
                return;
            }
            const grants=this.app.store.list<HostAccessGrant>('host-access').filter(g=>g.state==='enabled'&&!!g.researchAutomationScope),authority=(g:HostAccessGrant)=>digest({sessionId:g.sessionId,epoch:g.epoch,runtimeId:g.runtimeId});
            if(r&&r.runtimeId!==id&&r.state==='active'&&r.leaseUntil>Date.now()&&!grants.some(g=>g.runtimeId===id&&!r.authorities?.includes(authority(g))))return;
            if(r?.runtimeId===id)this.cancelOwnedChains('原自主执行端已停止或租约过期；旧任务不能恢复');
            const value:Runtime={runtimeId:id,leaseUntil:Date.now()+30000,state:'active',authorities:grants.map(authority)};
            if(r)this.app.store.update('research-runtime',r.id,r.version,value);else this.app.store.create('research-runtime',null,value,'owner');
            for(const c of this.app.store.list<ResearchContinuation>('research-continuation').filter(c=>c.policy&&!c.policy.recoverAfterRestart&&(c.runtimeId!==id||!!r)&&c.state==='active'))this.app.store.update<ResearchContinuation>('research-continuation',c.id,c.version,{state:'paused',reason:'原执行端中断；本授权要求明确恢复'});
            this.ownerClaimed=true;
        });
    }
    stopOwner(){
        if(!this.ownerStarted)return;
        this.app.store.transaction(()=>{const r=this.app.store.maybe<Runtime>('research-runtime','owner');if(this.ownerClaimed&&r?.runtimeId===this.app.hostAccess.researchRuntimeId()){if(r.state==='active')this.app.store.update<Runtime>('research-runtime',r.id,r.version,{state:'stopped',leaseUntil:0});this.cancelOwnedChains('自主执行端已停止；旧任务不能恢复');}});
        this.ownerStarted=false;this.ownerClaimed=false;this.ownerSuperseded=false;
    }
    cancelSession(sessionId:string,reason:string){for(const c of this.app.store.list<ResearchContinuation>('research-continuation').filter(c=>c.rootSessionId===sessionId&&['active','paused','blocked'].includes(c.state)))this.app.store.update<ResearchContinuation>('research-continuation',c.id,c.version,{state:'cancelled',reason});}
    pauseSession(sessionId:string,reason:string){for(const c of this.app.store.list<ResearchContinuation>('research-continuation').filter(c=>c.rootSessionId===sessionId&&c.state==='active'))this.app.store.update<ResearchContinuation>('research-continuation',c.id,c.version,{state:c.policy?'paused':'cancelled',reason});}
    inspect(actor:Actor,id:string){const c=this.app.store.get<ResearchContinuation>('research-continuation',id);scope(actor,c.projectId!);return {...c,budget:this.app.budget.summary(id),checkpoint:this.app.store.maybe('research-checkpoint',id)??null,authorizations:this.app.store.list<Authorization>('research-authorization',c.projectId!).filter(a=>a.continuationId===id)};}
    list(actor:Actor,sessionId:string){const s=this.app.sessions.get(actor,sessionId);return this.app.store.list<ResearchContinuation>('research-continuation',s.projectId!).filter(c=>c.rootSessionId===s.id).map(c=>this.inspect(actor,c.id));}
    checkpoint(actor:Actor,input:unknown){return this.app.store.transaction(()=>{const c=this.assertActor(actor),x=object(input);ensure(c.policy,'AUTOMATION_SCOPE_DENIED','旧授权不支持持久完成检查点');const state=oneOf(x.state,['completed','waiting','needs_attention'] as const,'state'),runIds=strings(x.runIds,'runIds',30),developmentJobIds=strings(x.developmentJobIds,'developmentJobIds',30),summary=text(x.summary,'summary',4000);for(const id of runIds){const r=this.app.store.get<Run>('run',id,c.projectId!);ensure(this.authorization(r.intentId)?.continuationId===c.id&&this.resultReady(c,r)&&['succeeded','failed'].includes(r.state),'AUTOMATION_CHECKPOINT_INVALID','完成引用必须为本任务已核验终态Run');}for(const id of developmentJobIds){const j=this.app.store.get<SandboxJob>('sandbox-job',id,c.projectId!);ensure(this.authorization(j.developmentTaskId)?.continuationId===c.id&&this.resultReady(c,j)&&['succeeded','failed'].includes(j.state),'AUTOMATION_CHECKPOINT_INVALID','完成引用必须为本任务已核验终态测试');}if(state==='completed'){ensure(runIds.length+developmentJobIds.length>0,'AUTOMATION_CHECKPOINT_INVALID','完成必须引用本任务实际结果');for(const a of this.app.store.list<Authorization>('research-authorization',c.projectId!).filter(a=>a.continuationId===c.id)){ensure(a.jobId,'AUTOMATION_CHECKPOINT_INVALID','仍有未提交的准确计算计划');const j=this.app.store.get<SandboxJob|Run>(a.subjectKind==='run-intent'?'run':'sandbox-job',a.jobId,c.projectId!);ensure(['succeeded','failed'].includes(j.state)&&this.resultReady(c,j),'AUTOMATION_CHECKPOINT_INVALID','在途或未知作业不能记为完成');}}
        const value={continuationId:c.id,state,summary,runIds,developmentJobIds,scientificConclusion:false as const},old=this.app.store.maybe('research-checkpoint',c.id);if(old)this.app.store.update('research-checkpoint',c.id,old.version,value);else this.app.store.create('research-checkpoint',c.projectId,value,c.id);if(state!=='waiting')this.app.store.update<ResearchContinuation>('research-continuation',c.id,c.version,{state:state==='completed'?'completed':'paused',reason:summary});this.app.store.event(c.projectId,'research.checkpoint',value);return value;});}
    control(actor:Actor,id:string,input:unknown){userOnly(actor);const x=object(input);ensure(Object.keys(x).every(k=>['action','expectedVersion'].includes(k)),'INVALID_INPUT','任务控制包含未知字段');const action=oneOf(x.action,['pause','resume','cancel'] as const,'action');return this.app.store.transaction(()=>{const c=this.app.store.get<ResearchContinuation>('research-continuation',id);scope(actor,c.projectId!);ensure(c.policy&&c.version===integer(x.expectedVersion,'expectedVersion',1),'VERSION_CONFLICT','任务不支持持久控制或版本已变化');ensure(!['cancelled','completed'].includes(c.state),'AUTOMATION_STOPPED','取消或已完成的任务不可恢复');if(action==='resume'){ensure(c.state==='paused'||c.state==='active','AUTOMATION_STOPPED','未知或失效任务须先核对，不能直接恢复');const active=this.app.store.update<ResearchContinuation>('research-continuation',c.id,c.version,{state:'active',reason:undefined});assertResearchReference(this.app.store,c.projectId!,{continuationId:c.id,digest:c.digest},true);this.app.store.event(c.projectId,'research.continuation_resumed',{continuationId:id});return active;}const next=this.app.store.update<ResearchContinuation>('research-continuation',c.id,c.version,{state:action==='pause'?'paused':'cancelled',reason:action==='pause'?'用户暂停持续任务':'用户取消持续任务'});this.app.store.event(c.projectId,'research.continuation_'+action,{continuationId:id});return next;});}
    block(id:string,reason:string){const c=this.app.store.get<ResearchContinuation>('research-continuation',id);if(c.state==='active')this.app.store.update<ResearchContinuation>('research-continuation',id,c.version,{state:'blocked',reason});}
    assertActor(actor:Actor){
        ensure(actor.type==='agent'&&actor.continuationId&&actor.wakeupId&&!actor.taskId&&!actor.attemptId,'AUTOMATION_SCOPE_DENIED','缺少宿主持续任务身份',403);
        const c=this.app.store.get<ResearchContinuation>('research-continuation',actor.continuationId,actor.projectId!),w=this.app.store.get<{continuationId?:string;rootSessionId:string;state:string;generation?:number}>('wakeup',actor.wakeupId,actor.projectId!),s=this.app.store.get<Session>('session',c.rootSessionId,actor.projectId!);
        assertResearchReference(this.app.store,actor.projectId!,{continuationId:c.id,digest:c.digest},true);
        ensure(this.isOwner(),'AUTOMATION_RUNTIME_EXPIRED','当前进程不是持续任务的执行owner',403);
        ensure(w.continuationId===c.id&&w.rootSessionId===s.id&&w.state==='running'&&w.generation===actor.generation&&actor.sessionId===s.id&&s.state==='running'&&s.generation===actor.generation&&s.leaseUntil>Date.now(),'AUTOMATION_STALE','续接来源或执行租约失效',403);return c;
    }
    captureResume(actor:Actor):ApprovalResumeBinding|undefined {
        if(actor.type!=='agent'||!actor.sessionId||!actor.messageId||actor.taskId||actor.wakeupId)return;
        const s=this.app.store.get<Session>('session',actor.sessionId,actor.projectId!),m=this.app.store.get<Message>('message',actor.messageId,actor.projectId!);
        if(s.role!=='coordinator'||s.teamId||s.parentSessionId||m.role!=='user'||m.origin==='automation'||m.wakeupId||m.approvalNoticeId||m.sessionId!==s.id)return;
        ensure(m.status==='running'&&m.generation===actor.generation&&actor.researchModelDigest===this.modelIdentity(s),'APPROVAL_RESUME_SOURCE_STALE','准备时的用户任务或模型连接失效');
        return {rootSessionId:s.id,originMessageId:m.id,originDigest:digest(m.content),modelDigest:actor.researchModelDigest,permission:this.app.sessionPermissions.capture(s.id,true)};
    }
    assertResume(task:Row<DevelopmentTask>){const ref=task.resume;ensure(ref&&digest(task.manifest)===task.manifestDigest&&task.manifest.approvalResumeDigest===digest(ref),'APPROVAL_RESUME_UNBOUND','旧测试没有固定恢复来源');const s=this.app.store.get<Session>('session',ref.rootSessionId,task.projectId!),m=this.app.store.get<Message>('message',ref.originMessageId,task.projectId!);this.app.sessionPermissions.assert(ref.permission,false);ensure(s.id===task.sessionId&&s.role==='coordinator'&&!s.taskId&&!s.teamId&&!s.parentSessionId&&s.state!=='archived'&&this.modelIdentity(s)===ref.modelDigest&&m.sessionId===s.id&&m.role==='user'&&m.origin!=='automation'&&!m.wakeupId&&!m.approvalNoticeId&&digest(m.content)===ref.originDigest,'APPROVAL_RESUME_SOURCE_STALE','原准备任务、用户来源或模型连接已变化');return ref;}
    private chain(actor:Actor):Row<ResearchContinuation>|undefined {
        if(actor.continuationId)return this.assertActor(actor);
        if(actor.type!=='agent'||actor.wakeupId||!actor.sessionId||!actor.messageId)return;
        const grant=this.app.store.maybe<HostAccessGrant>('host-access',actor.sessionId);
        if(!grant?.researchAutomationScope||!this.app.hostAccess.status({type:'user'},actor.sessionId).enabled)return;
        this.app.hostAccess.assertAgent(actor);
        const s=this.app.store.get<Session>('session',actor.sessionId,actor.projectId!),m=this.app.store.get<Message>('message',actor.messageId,actor.projectId!);
        const policy=this.app.sessionPermissions.capture(s.id);
        ensure(actor.researchModelDigest===this.modelIdentity(s),'AUTOMATION_MODEL_CHANGED','模型连接已变化或执行身份未固定模型来源',403);
        ensure(m.sessionId===s.id&&m.role==='user'&&!m.origin&&!m.wakeupId&&!m.approvalNoticeId&&m.status==='running'&&m.generation===actor.generation&&digest(m.permission)===digest(policy)&&Date.parse(m.createdAt)>=Date.parse(grant.researchAutomationAcknowledgedAt!),'AUTOMATION_ORIGIN_REQUIRED','只允许本次新授权之后的当前用户任务',403);
        const active=this.app.store.list<ResearchContinuation>('research-continuation',s.projectId!).find(c=>c.rootSessionId===s.id&&c.state==='active');
        if(active)return assertResearchReference(this.app.store,s.projectId!,{continuationId:active.id,digest:active.digest},true);
        const id=digest({rootSessionId:s.id,messageId:m.id}),old=this.app.store.maybe<ResearchContinuation>('research-continuation',id);
        if(old)return assertResearchReference(this.app.store,s.projectId!,{continuationId:id,digest:old.digest},true);
        const limits=grant.researchAutomationPolicy?.limits??AUTOMATION_LIMITS;
        const fixed={rootSessionId:s.id,originMessageId:m.id,originDigest:digest(m.content),permission:policy,runtimeId:grant.runtimeId,modelDigest:modelDigest(this.app.store,s),...(s.sourceRevisionId?{sourceRevisionId:s.sourceRevisionId}:{}),expiresAt:limits.durationMs===null?null:new Date(Date.parse(m.createdAt)+limits.durationMs).toISOString(),limits,...(grant.researchAutomationPolicy?{policy:grant.researchAutomationPolicy,lifecycleEpoch:this.app.store.get('project',s.projectId!).lifecycleEpoch as number}:{})};
        const c=this.app.store.create<ResearchContinuation>('research-continuation',s.projectId,{...fixed,digest:digest(fixed),state:'active'},id);
        this.app.budget.configure(s.projectId!,id,limits.continuations);this.app.store.event(s.projectId,'research.continuation_created',{continuationId:id,sessionId:s.id,messageId:m.id});
        return assertResearchReference(this.app.store,s.projectId!,{continuationId:id,digest:c.digest},true);
    }
    private target(context:string,fresh=true){const row=this.app.store.db.prepare('SELECT * FROM compute_contexts WHERE context=?').get(context);ensure(row?.status==='ready'&&(!fresh||Number(row.next_probe_at)>Date.now())&&typeof row.endpoint==='string'&&(/^(unix:\/\/\/|npipe:\/\/)/.test(row.endpoint))&&row.engine_id&&row.target_id,'AUTOMATION_LOCAL_DOCKER_REQUIRED','自主开发测试需要已核验的本机 Docker endpoint 和 engine',403);return {context,targetId:String(row.target_id),engineId:String(row.engine_id),endpoint:row.endpoint};}
    authorize(actor:Actor,approval:Row<Approval>,dockerContext?:string,runner?:string,experimentId?:string){
        if(runner&&runner!=='local'&&runner!=='trusted-example')return undefined;
        const c=this.chain(actor);if(!c)return undefined;
        ensure(approval.subjectKind==='development-task'||approval.subjectKind==='run-intent','AUTOMATION_SCOPE_DENIED','该审批不属于自主计算范围',403);
        if(runner)ensure(runner==='local'||runner==='trusted-example','AUTOMATION_TARGET_DENIED','自主运行仅限已保存的本机运行时或可信示例',403);
        if(runner)ensure(experimentId&&this.experimentInScope(c,experimentId),'AUTOMATION_EXPERIMENT_UNBOUND','自主运行只接受原任务之前已存在的合法实验或本链配置变体',403);
        const dockerTarget=dockerContext?this.target(dockerContext):undefined,ref={continuationId:c.id,digest:c.digest};
        this.app.store.create<Authorization>('research-authorization',approval.projectId,{continuationId:c.id,subjectKind:approval.subjectKind,subjectId:approval.subjectId,manifestDigest:approval.digest,approvalId:approval.id,...(dockerTarget?{dockerTarget}:{})},approval.subjectId);
        this.app.store.update<Approval>('approval',approval.id,approval.version,{status:'approved',fullAccess:ref,decidedAt:now(),reason:'当前用户明确授权的有界自主计算；仅批准此准确冻结清单，不是人工逐项批准'});return ref;
    }
    assertApproval(a:Row<Approval>,current=false,execution=false){if(!a.fullAccess)return;const c=assertResearchReference(this.app.store,a.projectId!,a.fullAccess,current,execution),auth=this.app.store.get<Authorization>('research-authorization',a.subjectId,a.projectId!);ensure(!a.workingGrant&&!a.runGrant&&auth.continuationId===c.id&&auth.subjectId===a.subjectId&&auth.approvalId===a.id&&auth.manifestDigest===a.digest&&auth.subjectKind===a.subjectKind&&(a.subjectKind==='development-task'&&a.scope==='development.test'||a.subjectKind==='run-intent'&&a.scope==='run.submit'),'APPROVAL_STALE','自主计算的准确派生依据不符',403);if(current&&auth.dockerTarget)ensure(digest(this.target(auth.dockerTarget.context,false))===digest(auth.dockerTarget),'AUTOMATION_TARGET_CHANGED','本机 Docker 目标已变化',403);return c;}
    private submissionChain(actor:Actor):Row<ResearchContinuation>|undefined {
        if(actor.continuationId)return this.assertActor(actor);
        if(actor.type!=='agent'||actor.wakeupId||actor.taskId||!actor.sessionId)return;
        const grant=this.app.store.maybe<HostAccessGrant>('host-access',actor.sessionId);
        if(!grant?.researchAutomationScope||!this.app.hostAccess.status({type:'user'},actor.sessionId).enabled)return;
        const chains=this.app.store.list<ResearchContinuation>('research-continuation',actor.projectId!).filter(c=>c.rootSessionId===actor.sessionId&&c.runtimeId===grant.runtimeId&&c.permission.hostEpoch===grant.epoch);
        const c=chains.find(c=>c.originMessageId===actor.messageId)??chains.find(c=>c.state==='active')??chains.at(-1);
        if(!c)return;
        this.app.hostAccess.assertAgent(actor);
        return assertResearchReference(this.app.store,actor.projectId!,{continuationId:c.id,digest:c.digest},true);
    }
    /** Read-only admission check; consume repeats it inside the job-creation transaction. */
    assertSubmission(actor:Actor,a:Row<Approval>):Row<Authorization>|undefined {
        if(actor.approvalResumeId){
            const resume=this.app.wakeups.assertApprovalResume(actor,a.subjectId);
            ensure(a.subjectKind==='development-task'&&resume.approvalId===a.id&&!a.fullAccess,'AUTOMATION_APPROVAL_REQUIRED','批准恢复只允许这一次准确人工批准测试',403);
            return;
        }
        const required=this.submissionChain(actor);
        if(required)ensure(a.fullAccess?.continuationId===required.id&&a.fullAccess.digest===required.digest,'AUTOMATION_APPROVAL_REQUIRED','自动提交需要当前持续任务的准确派生批准',403);
        const c=this.assertApproval(a,true);if(!c)return;
        if(actor.type==='agent')ensure(required?.id===c.id&&actor.sessionId===c.rootSessionId,'AUTOMATION_APPROVAL_REQUIRED','执行身份不属于此持续任务',403);
        const auth=this.app.store.get<Authorization>('research-authorization',a.subjectId,a.projectId!);
        ensure(!auth.jobId,'AUTOMATION_ALREADY_CONSUMED','该计算授权已消费');
        const limit=a.subjectKind==='development-task'?c.limits.development:c.limits.run;
        const count=this.app.store.db.prepare("SELECT count(*) n FROM records WHERE kind='research-authorization' AND project_id=? AND json_extract(data,'$.continuationId')=? AND json_extract(data,'$.subjectKind')=? AND json_extract(data,'$.jobId') IS NOT NULL").get(a.projectId!,c.id,a.subjectKind)!;
        ensure(limit===null||Number(count.n)<limit,'AUTOMATION_BUDGET_EXHAUSTED','本任务计算次数已用完');
        const unfinished=this.app.store.db.prepare("SELECT j.data FROM records a JOIN records j ON j.id=json_extract(a.data,'$.jobId') AND j.project_id=a.project_id AND j.kind=CASE json_extract(a.data,'$.subjectKind') WHEN 'development-task' THEN 'sandbox-job' ELSE 'run' END WHERE a.kind='research-authorization' AND a.project_id=? AND json_extract(a.data,'$.continuationId')=? AND (json_extract(j.data,'$.state') NOT IN ('succeeded','failed','cancelled','timed_out') OR json_extract(j.data,'$.integrity')<>'complete')").all(a.projectId!,c.id);
        for(const row of unfinished){
            const j=JSON.parse(String(row.data)) as Row<SandboxJob|Run>;
            ensure(['succeeded','failed','cancelled','timed_out'].includes(String(j.state)),'AUTOMATION_COMPUTE_BUSY','本任务已有在途或未知计算');
            ensure(this.resultReady(c,j),'AUTOMATION_RESULT_INCOMPLETE','前次归档不完整，不自动继续计算');
        }
        return auth;
    }
    consume(actor:Actor,a:Row<Approval>,jobId:string){const auth=this.assertSubmission(actor,a);if(auth)this.app.store.update<Authorization>('research-authorization',auth.id,auth.version,{jobId});}
    resultReady(c:ResearchContinuation,j:Row<SandboxJob|Run>){if(j.integrity==='complete')return true;if(!c.policy||j.state!=='failed'||!('intentId'in j))return false;try{this.app.runs.assertDiagnostic({type:'user'},j.id);return true;}catch{return false;}}
    authorizeSource(actor:Actor,source:{id:string;experimentId:string;sourceDigest:string}){const c=this.assertActor(actor),bound=c.sourceRevisionId??this.app.store.maybe<{sourceRevisionId:string}>('research-repair-source',c.id)?.sourceRevisionId;if(bound){ensure(bound===source.id,'AUTOMATION_SOURCE_CHANGED','不能替换已冻结的私有源码来源');return;}ensure(c.policy,'AUTOMATION_SOURCE_CHANGED','旧续接不能替换冻结源码来源');const prior=this.app.store.list<Authorization>('research-authorization',c.projectId!).filter(a=>a.continuationId===c.id&&a.subjectKind==='run-intent'&&a.jobId).map(a=>this.app.store.get<Run>('run',a.jobId!,c.projectId!)).find(r=>r.experimentId===source.experimentId&&r.manifest.snapshotDigest===source.sourceDigest&&r.manifest.sourceRevisionId===source.id&&r.failureDiagnostic);ensure(prior,'AUTOMATION_SOURCE_CHANGED','私有修复只能从本任务准确失败Run初始化');this.app.runs.assertDiagnostic({type:'user'},prior.id);this.app.store.create('research-repair-source',c.projectId,{sourceRevisionId:source.id,sourceDigest:source.sourceDigest,runId:prior.id},c.id);}
    private experimentInScope(c:Row<ResearchContinuation>,id:string){return !!this.app.store.db.prepare("SELECT 1 FROM records e JOIN records m ON m.id=? AND m.kind='message' AND m.project_id=e.project_id WHERE e.id=? AND e.kind='experiment' AND e.project_id=? AND e.rowid<m.rowid").get(c.originMessageId,id,c.projectId!)||this.app.store.maybe<{continuationId:string}>('research-variant',id)?.continuationId===c.id;}
    variantSource(actor:Actor,pid:string,input:Record<string,unknown>){
        const c=this.assertActor(actor);ensure(c.projectId===pid&&typeof input.parentId==='string'&&Number.isSafeInteger(input.expectedParentRevision)&&(input.repair||input.config&&typeof input.config==='object'&&!Array.isArray(input.config))&&input.contract===undefined,'AUTOMATION_VARIANT_DENIED','续接只允许明确父修订的配置变体或已验证修复，不能创建新根或改变契约',403);
        const parent=this.app.store.get<Experiment>('experiment',input.parentId,pid);
        ensure(this.experimentInScope(c,parent.id),'AUTOMATION_VARIANT_DENIED','父实验不属于原有合法来源或本链配置变体',403);
        ensure(parent.revision===input.expectedParentRevision&&parent.lifecycle!=='archived'&&['local','trusted-example'].includes(parent.contract.runner),'AUTOMATION_VARIANT_DENIED','父修订、生命周期或本机计算契约已变化',403);assertExperimentSourceCurrent(this.app.store,parent);
        const source=validateSourceRevision(this.app.context,pid,digest({projectId:pid,experimentId:parent.id,revision:parent.revision}));
        if(input.repair){
            ensure(c.policy&&parent.contract.runner==='local','AUTOMATION_REPAIR_DENIED','只有新持久授权可建立本地技术修复候选');const repair=object(input.repair);ensure(Object.keys(repair).every(k=>['runId','jobId','reviewId'].includes(k))&&typeof repair.runId==='string'&&typeof repair.jobId==='string','AUTOMATION_REPAIR_DENIED','修复必须绑定准确失败Run和成功测试');
            const run=this.app.store.get<Run>('run',repair.runId,pid),job=this.app.store.get<SandboxJob>('sandbox-job',repair.jobId,pid);this.app.runs.assertDiagnostic({type:'user'},run.id);
            const bound=c.sourceRevisionId??this.app.store.maybe<{sourceRevisionId:string}>('research-repair-source',c.id)?.sourceRevisionId;
            ensure(run.experimentId===parent.id&&run.manifest.experimentRevision===parent.revision&&this.authorization(run.intentId)?.continuationId===c.id&&this.authorization(job.developmentTaskId)?.continuationId===c.id&&job.sessionId===c.rootSessionId&&job.manifest.sourceRevisionId===bound&&!!bound&&job.sourceDigest!==run.manifest.snapshotDigest&&digest(job.manifest.researchBrief)===digest(run.manifest.researchBrief)&&job.manifest.methodContractDigest===run.manifest.methodContractDigest,'AUTOMATION_REPAIR_DENIED','修复必须属于同任务、原父源码及固定科学计划');
            this.app.development.assertResultMatches({type:'user'},pid,job.id,job.sourceDigest);
            if(run.manifest.methodContractDigest||repair.reviewId){ensure(typeof repair.reviewId==='string','DEVELOPMENT_REVIEW_REQUIRED','科学方法修复需要已通过的独立审查');const reviewed=this.app.developmentReviews.assertPassed({type:'user'},pid,repair.reviewId,job.sourceDigest);ensure(reviewed.jobId===job.id&&reviewed.producerSessionId===c.rootSessionId,'AUTOMATION_REPAIR_DENIED','审查与准确修复测试不符');}
            if(input.config!==undefined){const f=job.manifest.inputSnapshot.files.find(f=>f.path==='config.json');ensure(f&&digest(input.config)===digest(JSON.parse(readStableFile(this.app.store.paths.physical(job.manifest.inputSnapshot.path),'config.json',f.size).toString('utf8'))),'AUTOMATION_REPAIR_DENIED','已测试修复不能附带未测试配置');}
            verifySnapshot(this.app.store.paths.physical(job.manifest.inputSnapshot.path),job.manifest.inputSnapshot.files);
            return {...source,snapshot:job.manifest.inputSnapshot,sourceDigest:job.sourceDigest,repair:{runId:run.id,jobId:job.id,...(repair.reviewId?{reviewId:repair.reviewId}:{}),parentSourceDigest:source.sourceDigest}};
        }
        return source;
    }
    recordVariant(actor:Actor,child:Row<Experiment>,source:{id:string;sourceDigest:string;repair?:{parentSourceDigest:string}}){const c=this.assertActor(actor);this.app.store.create('research-variant',child.projectId,{continuationId:c.id,parentId:child.parentId,parentSourceRevisionId:source.id,parentSourceDigest:source.repair?.parentSourceDigest??source.sourceDigest,testedSourceDigest:source.sourceDigest,contractDigest:child.contractDigest,...(source.repair?{repair:source.repair}:{})},child.id);}
    authorization(subjectId:string){return this.app.store.maybe<Authorization>('research-authorization',subjectId);}
    recoveryReceipts(id:string){const c=this.app.store.get<ResearchContinuation>('research-continuation',id);return this.app.store.db.prepare("SELECT key,response FROM operations WHERE scope=? AND created_at>=? ORDER BY created_at DESC LIMIT 30").all('agent:'+c.rootSessionId,c.createdAt).map(r=>{const response=JSON.parse(String(r.response));return {callId:String(r.key),result:Object.fromEntries(['id','kind','jobId','runId','sourceDigest','manifestDigest','digest','path','state','status'].filter(k=>response&&response[k]!==undefined).map(k=>[k,response[k]]))};});}
    paused(subjectId:string){const a=this.authorization(subjectId);return !!a&&this.app.store.get<ResearchContinuation>('research-continuation',a.continuationId).state==='paused';}
    resultSources(){return this.app.store.db.prepare("SELECT a.data FROM records a JOIN records c ON c.kind='research-continuation' AND c.id=json_extract(a.data,'$.continuationId') WHERE a.kind='research-authorization' AND json_extract(a.data,'$.jobId') IS NOT NULL AND json_extract(c.data,'$.state')='active' AND NOT EXISTS(SELECT 1 FROM records w WHERE w.kind='wakeup' AND json_extract(w.data,'$.sourceKind')='task-continuation' AND json_extract(w.data,'$.sourceId')=json_extract(a.data,'$.jobId'))").all().map(row=>{const a=JSON.parse(String(row.data)) as Row<Authorization>,c=this.app.store.get<ResearchContinuation>('research-continuation',a.continuationId),j=this.app.store.get<SandboxJob|Run>(a.subjectKind==='development-task'?'sandbox-job':'run',a.jobId!,a.projectId!);return {a,c,j};});}
}
