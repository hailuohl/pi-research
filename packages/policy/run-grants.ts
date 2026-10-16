import {randomUUID} from 'node:crypto';
import type {ResearchApp} from '../research-app.js';
import type {Actor,Approval,Experiment,Row,RunIntent,Session,Task} from '../domain/types.js';
import {object,integer,strings,text} from '../contracts/validation.js';
import {ensure,asError} from '../domain/errors.js';
import {scope,userOnly} from './permissions.js';
import {assertProjectWritable,assertExperimentSourceCurrent} from './lifecycle.js';
import {assertOutcomeBoundary} from '../runners/outcome.js';
import {digest,now} from '../storage/store.js';
import type {RunGrant,RunGrantDTO,RunGrantEntry,RunGrantUse} from './run-grant-types.js';
import {assertRunGrantEntry,assertRunGrantRecord,assertRunGrantReference,assertRunGrantTaskBinding,buildRunGrantTaskBinding,runGrantPayload,runGrantReference} from './run-grant-validation.js';
export type {RunGrant,RunGrantDTO,RunGrantEntry,RunGrantReference,RunGrantTaskBinding,RunGrantUse} from './run-grant-types.js';
export {assertRunGrantRun,assertRunGrantIntent} from './run-grant-validation.js';

export class RunGrantService {
    constructor(private app:ResearchApp){}
    private source(intent:Row<RunIntent>){
        const e=this.app.store.get<Experiment>('experiment',intent.experimentId,intent.projectId!);ensure(e.lifecycle!=='archived'&&e.revision===intent.manifest.experimentRevision&&e.contractDigest===intent.manifest.contractDigest,'APPROVAL_STALE','实验修订、契约或生命周期改变');assertExperimentSourceCurrent(this.app.store,e);assertOutcomeBoundary(this.app.store,e);this.app.runs.researchSourceGuard?.(e.id,'submit',intent.id);
    }
    private fresh(pid:string,g:RunGrant,intent:Row<RunIntent>){
        const a=assertRunGrantEntry(this.app.store,pid,g,intent);ensure(intent.status==='prepared'&&!intent.runId&&!intent.runGrant&&!a.runGrant&&a.status==='pending','RUN_GRANT_INTENT_UNAVAILABLE','只能选用未提交、未绑定且原批准待处理的清单');this.source(intent);
    }
    inspect(actor:Actor,pid:string,id:string):RunGrantDTO {
        userOnly(actor);scope(actor,pid);const g=this.app.store.get<RunGrant>('run-grant',id,pid),uses=this.app.store.list<RunGrantUse>('run-grant-use',pid).filter(u=>u.grantId===id),reasons:string[]=[];
        try{const {approval}=assertRunGrantRecord(this.app.store,pid,id);if(g.state==='active'){assertRunGrantReference(this.app.store,pid,runGrantReference(g));if(g.taskBinding)assertRunGrantTaskBinding(this.app.store,pid,g);}else if(g.state==='draft')ensure(['pending','approved'].includes(approval.status),'APPROVAL_STALE','授权草案批准已失效');
            for(const entry of g.entries){const intent=this.app.store.get<RunIntent>('run-intent',entry.intentId,pid);assertRunGrantEntry(this.app.store,pid,g,intent);if(g.state==='active'){const a=this.app.store.get<Approval>('approval',intent.approvalId,pid);ensure(a.status==='approved'&&digest(a.runGrant)===digest(runGrantReference(g))&&digest(intent.runGrant)===digest(runGrantReference(g)),'RUN_GRANT_STALE','绑定清单或派生批准已改变');}}
        }catch(error){reasons.push(asError(error).code);}
        if(g.state==='revoked')reasons.push('RUN_GRANT_REVOKED');const remaining=Math.max(0,g.maxRuns-uses.length),effectiveState=g.state==='revoked'?'revoked':reasons.length?'stale':g.state==='draft'?'draft':Date.now()>=Date.parse(g.expiresAt)?'expired':remaining===0?'exhausted':'active';
        return {...g,effectiveState,validity:reasons.length?'stale':'current',reasons,usage:{limit:g.maxRuns,used:uses.length,remaining,unit:'run-submission'},uses,manifests:g.entries.map(entry=>{const m=this.app.store.get<RunIntent>('run-intent',entry.intentId,pid).manifest;return {...entry,...(m.threadLimit===undefined?{}:{threadLimit:m.threadLimit}),contract:m.contract,files:m.sourceFiles};})};
    }
    prepare(actor:Actor,pid:string,value:unknown):RunGrantDTO {
        userOnly(actor);scope(actor,pid);const x=object(value);ensure(Object.keys(x).every(k=>['sessionId','taskId','intentIds','maxRuns','expiresAt'].includes(k)),'INVALID_INPUT','运行授权草案包含未知字段',400);ensure((x.sessionId===undefined)!==(x.taskId===undefined),'INVALID_INPUT','sessionId 与 taskId 必须且只能指定一个',400);
        return this.app.store.transaction(()=>{
            assertProjectWritable(this.app.store,pid);const task=x.taskId===undefined?undefined:this.app.store.get<Task>('task',text(x.taskId,'taskId',100),pid),session=task?undefined:this.app.store.get<Session>('session',text(x.sessionId,'sessionId',100),pid);let taskDetails:ReturnType<typeof buildRunGrantTaskBinding>|undefined;
            if(task){ensure(task.role==='analyst'&&task.execution==='pending'&&task.attemptCount===0&&!task.attemptId&&!task.sessionId&&!task.runGrantId,'RUN_GRANT_TASK_REQUIRED','只能为尚未派发且未绑定运行授权的 analyst Task 准备 Grant');taskDetails=buildRunGrantTaskBinding(this.app.store,pid,task);}
            else {ensure(session!.role==='coordinator'&&!session!.taskId&&session!.state!=='archived','RUN_GRANT_SESSION_REQUIRED','需要可用的独立主协调会话');ensure(!session!.runGrantId,'RUN_GRANT_ALREADY_BOUND','会话已绑定运行授权；改变范围请使用新会话');}
            const ids=strings(x.intentIds,'intentIds',20);ensure(ids.length>0&&new Set(ids).size===ids.length,'INVALID_INPUT','需要1至20项不重复的冻结清单',400);
            const entries:RunGrantEntry[]=ids.map(id=>{const i=this.app.store.get<RunIntent>('run-intent',id,pid);return {intentId:i.id,experimentId:i.experimentId,experimentRevision:i.manifest.experimentRevision,manifestDigest:i.manifestDigest,sourceDigest:i.manifest.snapshotDigest,contractDigest:i.manifest.contractDigest,approvalId:i.approvalId};});
            const expiresAt=text(x.expiresAt,'expiresAt',50);ensure(Number.isFinite(Date.parse(expiresAt))&&Date.parse(expiresAt)>Date.now()&&Date.parse(expiresAt)<=Date.now()+24*60*60*1000,'INVALID_INPUT','期限必须在未来24小时内',400);
            const id=randomUUID(),approval=this.app.approvals.request(pid,'run-grant',id,'','run-grant.activate','仅批准显式冻结清单集合中的有限正式Run；不授权新代码、新清单、模型或其他行为');
            const fields={sessionId:taskDetails?.sessionId??session!.id,...(task?{taskBinding:taskDetails!.binding}:{}),model:taskDetails?.model??session!.model,entries,maxRuns:integer(x.maxRuns,'maxRuns',1,ids.length),expiresAt:new Date(expiresAt).toISOString(),approvalId:approval.id},hash=digest(fields),g:RunGrant={...fields,digest:hash,state:'draft'};
            entries.forEach(e=>this.fresh(pid,g,this.app.store.get<RunIntent>('run-intent',e.intentId,pid)));this.app.store.update<Approval>('approval',approval.id,approval.version,{digest:hash});this.app.store.create<RunGrant>('run-grant',pid,g,id);if(task)this.app.store.update<Task>('task',task.id,task.version,{runGrantId:id});this.app.store.event(pid,'run-grant.prepared',{grantId:id,...(task?{taskId:task.id,teamId:task.teamId}:{sessionId:session!.id}),approvalId:approval.id});return this.inspect(actor,pid,id);
        });
    }
    activate(actor:Actor,pid:string,value:unknown):RunGrantDTO {
        userOnly(actor);scope(actor,pid);const x=object(value);
        return this.app.store.transaction(()=>{
            assertProjectWritable(this.app.store,pid);const {grant:g}=assertRunGrantRecord(this.app.store,pid,text(x.grantId,'grantId',100)),s=g.taskBinding?undefined:this.app.store.get<Session>('session',g.sessionId,pid);
            if(g.state==='active'){if(g.taskBinding)assertRunGrantTaskBinding(this.app.store,pid,g);else ensure(s?.runGrantId===g.id,'RUN_GRANT_STALE','会话绑定已改变');return this.inspect(actor,pid,g.id);}ensure(g.state==='draft','RUN_GRANT_REVOKED','已撤销授权不能重新激活');ensure(g.version===integer(x.expectedVersion,'expectedVersion',1),'VERSION_CONFLICT','授权草案已变化');if(g.taskBinding)assertRunGrantTaskBinding(this.app.store,pid,g,{requireUnclaimed:true});else ensure(s&&!s.runGrantId&&s.role==='coordinator'&&!s.taskId&&s.state!=='archived'&&digest(s.model)===digest(g.model),'RUN_GRANT_SCOPE_CHANGED','指定会话、模型或已有授权已改变');ensure(Date.parse(g.expiresAt)>Date.now(),'RUN_GRANT_EXPIRED','授权已过期');this.app.approvals.assert(g.approvalId,pid,g.id,g.digest,'run-grant.activate');
            for(const entry of g.entries)this.fresh(pid,g,this.app.store.get<RunIntent>('run-intent',entry.intentId,pid));const ref=runGrantReference(g);
            for(const entry of g.entries){const i=this.app.store.get<RunIntent>('run-intent',entry.intentId,pid),a=this.app.store.get<Approval>('approval',i.approvalId,pid);this.app.store.update<RunIntent>('run-intent',i.id,i.version,{runGrant:ref});this.app.store.update<Approval>('approval',a.id,a.version,{status:'approved',runGrant:ref,decidedAt:now(),reason:'由冻结集合RunGrant派生；提交时永久计次，不批准集合外清单'});}
            if(s)this.app.store.update<Session>('session',s.id,s.version,{runGrantId:g.id});this.app.store.update<RunGrant>('run-grant',g.id,g.version,{state:'active',activatedAt:now()});this.app.store.event(pid,'run-grant.activated',{grantId:g.id,...(g.taskBinding?{taskId:g.taskBinding.taskId}:{sessionId:s!.id})});return this.inspect(actor,pid,g.id);
        });
    }
    revoke(actor:Actor,pid:string,value:unknown):RunGrantDTO {
        userOnly(actor);scope(actor,pid);const x=object(value);return this.app.store.transaction(()=>{const g=this.app.store.get<RunGrant>('run-grant',text(x.grantId,'grantId',100),pid);if(g.state==='revoked')return this.inspect(actor,pid,g.id);this.app.store.update<RunGrant>('run-grant',g.id,integer(x.expectedVersion,'expectedVersion',1),{state:'revoked',revokedAt:now()});this.app.approvals.stale(g.id);this.app.store.event(pid,'run-grant.revoked',{grantId:g.id});return this.inspect(actor,pid,g.id);});
    }
}
