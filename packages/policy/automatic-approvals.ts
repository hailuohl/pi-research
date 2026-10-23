import {assertAutomaticApprovalReference} from './automatic-approval-proof.js';
import type {Actor,Approval,Message,Project,Row,Session,RunIntent,Experiment,Run} from '../domain/types.js';
import type {ResearchApp} from '../research-app.js';
import type {PermissionReference} from './session-permissions.js';
import type {HostAccessGrant} from './host-access.js';
import {digest,now} from '../storage/store.js';
import {captureSourceRevision,sourceMetadata,validateSourceRevision} from '../workspace/source-access.js';
import type {CampaignDecision,Campaign,PlanSource} from '../research-workflows/types.js';
import type {ResearchContinuation,Authorization} from './research-automation.js';
import type {SandboxJob} from '../execution/contracts.js';
import {CONTINUATION_TOOLS} from './research-automation.js';
import {interactiveCoordinator} from './permissions.js';
import {asError,ensure} from '../domain/errors.js';
export interface AutomaticApprovalReference {
    scopeVersion:1;rootSessionId:string;originMessageId:string;originDigest:string;permission:PermissionReference;
    runtimeId:string;modelDigest:string;lifecycleEpoch:number;sourceRevisionId?:string;
    subjectKind:string;subjectId:string;subjectDigest:string;subjectScope:string;requestDigest:string;digest:string;
}
export interface AutomaticExecution {state:'completed'|'failed'|'unknown'|'needs_attention'|'waiting';reason?:string;}
type Subject={subjectKind:string;subjectId:string;digest:string;scope:string};
interface DecisionRunBinding {continuationId:string;continuationDigest:string;decisionId:string;decisionApprovalId:string;decisionDigest:string;decisionProofDigest:string;campaignId:string;roundId:string;parentSource:PlanSource;experimentId:string;experimentRevision:number;intentId:string;approvalId:string;manifestDigest:string;contractDigest:string;sourceDigest:string;digest:string;}
const PREPARES=new Set(['run_prepare','development_prepare','collaboration_plan_submit','agent_delegate','development_review_prepare','formal_report_review_prepare','publication_review_prepare','change_proposal_prepare','reviewed_change_prepare','campaign_prepare','campaign_decision_submit','publication_prepare','research_brief_save','research_action_prepare']);
export class AutomaticApprovalService {
    constructor(private app:ResearchApp){}
    continuationTools(sessionId:string){return this.app.store.maybe<HostAccessGrant>('host-access',sessionId)?.automaticApprovalScope===1?[...CONTINUATION_TOOLS,'research_brief_save','research_action_prepare','research_action_inspect','research_history_list','research_method_compile','research_fixture_prepare','artifact_create','evidence_register','reviewed_change_prepare','change_proposal_prepare','collaboration_plan_submit','agent_delegate','task_inspect','task_result_read','campaign_prepare','campaign_inspect','campaign_enroll','campaign_decision_submit','formal_report_review_prepare','formal_report_review_inspect','formal_report_review_source_read','publication_templates','publication_template_inspect','publication_template_read','manuscript_create','manuscript_list','manuscript_inspect','manuscript_source_read','publication_status','publication_prepare','publication_inspect','publication_result','publication_build_list','publication_review_prepare','publication_review_inspect','publication_review_list','publication_citation_check','text_evidence_search']:CONTINUATION_TOOLS;}
    isContinuation(actor:Actor){return !!actor.continuationId&&!!this.origin(actor);}
    coordinator(actor:Actor,pid:string,s:Row<Session>){if(!actor.wakeupId||!this.isContinuation(actor))return interactiveCoordinator(actor,pid,s);ensure(actor.projectId===pid&&actor.sessionId===s.id&&s.state==='running'&&s.generation===actor.generation&&s.leaseUntil>Date.now(),'AUTOMATIC_APPROVAL_DENIED','只允许准确原任务继续执行',403);return s;}
    private origin(actor:Actor){
        if(actor.type!=='agent'||actor.taskId||actor.attemptId||actor.approvalResumeId||!actor.sessionId||!actor.messageId||actor.wakeupId&&!actor.continuationId)return;
        const s=this.app.store.get<Session>('session',actor.sessionId,actor.projectId!),g=this.app.store.maybe<HostAccessGrant>('host-access',s.id);
        if(g?.automaticApprovalScope!==1||g.state!=='enabled'||!actor.continuationId&&!this.app.hostAccess.status({type:'user'},s.id).enabled)return;
        ensure(!s.parentSessionId&&!s.taskId&&!s.teamId&&s.role==='coordinator','AUTOMATIC_APPROVAL_DENIED','自动批准只属于原根任务',403);
        let m:Row<Message>,permission:PermissionReference;
        if(actor.continuationId){const c=this.app.researchAutomation.assertActor(actor);m=this.app.store.get<Message>('message',c.originMessageId,s.projectId!);permission=c.permission;}
        else {this.app.hostAccess.assertAgent(actor);m=this.app.store.get<Message>('message',actor.messageId,s.projectId!);permission=actor.permission??this.app.sessionPermissions.capture(s.id);ensure(m.status==='running'&&m.generation===actor.generation,'AUTOMATIC_APPROVAL_ORIGIN_STALE','只允许本次实际消费的人工输入',403);}
        ensure(m.sessionId===s.id&&m.role==='user'&&!m.origin&&!m.wakeupId&&!m.approvalNoticeId&&!m.queueRemoved&&digest(m.permission)===digest(permission)&&Date.parse(m.createdAt)>=Date.parse(g.automaticApprovalAcknowledgedAt!),'AUTOMATIC_APPROVAL_ORIGIN_STALE','自动批准必须绑定本次新授权后的原人工任务',403);
        ensure(actor.researchModelDigest===this.app.researchAutomation.modelIdentity(s),'AUTOMATIC_APPROVAL_MODEL_CHANGED','原模型连接已改变',403);
        this.app.sessionPermissions.assert(permission);
        return {s,g,m,permission};
    }
    reference(actor:Actor,subject:Subject,request:unknown):AutomaticApprovalReference|undefined {
        const c=this.origin(actor);if(!c)return;
        const fixed={scopeVersion:1 as const,rootSessionId:c.s.id,originMessageId:c.m.id,originDigest:digest(c.m.content),permission:c.permission,runtimeId:c.g.runtimeId,modelDigest:this.app.researchAutomation.modelIdentity(c.s),lifecycleEpoch:this.app.store.get<Project>('project',c.s.projectId!).lifecycleEpoch,...(c.s.sourceRevisionId?{sourceRevisionId:c.s.sourceRevisionId}:{}),subjectKind:subject.subjectKind,subjectId:subject.subjectId,subjectDigest:subject.digest,subjectScope:subject.scope,requestDigest:digest(request)};
        const ref={...fixed,digest:digest(fixed)};
        if(!this.app.store.maybe('automatic-approval-proof',ref.digest))this.app.store.create('automatic-approval-proof',c.s.projectId,{reference:ref},ref.digest);
        return ref;
    }
    assert(ref:AutomaticApprovalReference,current=true){assertAutomaticApprovalReference(this.app.store,ref,current);if(current)this.app.sessionPermissions.assert(ref.permission,false);}
    /** Only explicit host-delegated service entries receive this identity, after exact proof validation. */
    delegate(actor:Actor,ref:AutomaticApprovalReference,subjectKind:string,subjectId:string):Actor {
        this.assert(ref);const c=this.origin(actor);ensure(c&&c.s.id===ref.rootSessionId&&c.m.id===ref.originMessageId&&ref.subjectKind===subjectKind&&ref.subjectId===subjectId,'AUTOMATIC_APPROVAL_DENIED','派生执行不属于当前根请求和准确对象',403);
        return {type:'user',projectId:c.s.projectId!};
    }
    integratedExperiment(c:import('./research-automation.js').ResearchContinuation,id:string){
        const e=this.app.store.maybe<import('../domain/types.js').Experiment>('experiment',id);if(!e?.changeProposalId)return false;
        const p=this.app.store.get<import('../domain/types.js').ChangeProposal>('change-proposal',e.changeProposalId,e.projectId!),a=this.app.store.get<Approval>('approval',p.approvalId,e.projectId!),ref=a.automaticApproval;
        if(!ref||ref.originMessageId!==c.originMessageId||ref.rootSessionId!==c.rootSessionId||ref.permission.hostEpoch!==c.permission.hostEpoch||p.rootSessionId!==c.rootSessionId||p.state!=='applied'||p.appliedExperimentId!==id||e.parentId!==p.baseExperimentId)return false;
        this.assertApproval(a);return true;
    }
    assertApproval(a:Row<Approval>){if(a.automaticApproval){this.assert(a.automaticApproval,false);ensure(a.automaticApproval.subjectKind===a.subjectKind&&a.automaticApproval.subjectId===a.subjectId&&a.automaticApproval.subjectDigest===a.digest&&a.automaticApproval.subjectScope===a.scope,'APPROVAL_STALE','自动批准与准确冻结对象不符',403);}}
    approve(actor:Actor,a:Row<Approval>,request:unknown){
        const ref=this.reference(actor,a,request);if(!ref)return;
        this.assert(ref);ensure(a.status==='pending'||a.status==='approved'&&!!a.fullAccess,'APPROVAL_NOT_PENDING','原批准已处理或失效');
        const next=this.app.store.update<Approval>('approval',a.id,a.version,{status:'approved',automaticApproval:ref,decidedAt:now(),reason:'当前根任务完全访问范围内自动批准；保留准确对象与执行记录'});this.app.store.event(a.projectId,'approval.automatically_decided',{approvalId:a.id,originMessageId:ref.originMessageId,subjectId:a.subjectId});return next;
    }
    private execution(kind:string,id:string,state:AutomaticExecution){const row=this.app.store.get(kind,id);this.app.store.update(kind,id,row.version,{automaticExecution:state});}
    private effect(kind:string,id:string,ref:AutomaticApprovalReference,run:()=>unknown,completion?:()=>AutomaticExecution):unknown {
        const receiptId=digest({approval:ref.digest,kind,id}),old=this.app.store.maybe<{state:string;result?:unknown;reason?:string}>('automatic-approval-effect',receiptId);
        if(old)return old.result;
        this.assert(ref);this.app.store.create('automatic-approval-effect',this.app.store.get('automatic-approval-proof',ref.digest).projectId,{state:'executing',referenceDigest:ref.digest},receiptId);
        try{const result=run();ensure(!(result instanceof Promise),'AUTOMATIC_APPROVAL_ASYNC_REQUIRED','异步动作必须使用持久提交入口');const state=completion?.()??{state:'completed' as const},row=this.app.store.get('automatic-approval-effect',receiptId);this.app.store.update('automatic-approval-effect',receiptId,row.version,{state:state.state,result});this.execution(kind,id,state);return result;}
        catch(error){const e=asError(error),row=this.app.store.get('automatic-approval-effect',receiptId);this.app.store.update('automatic-approval-effect',receiptId,row.version,{state:'failed',reason:e.code+': '+e.message});this.execution(kind,id,{state:'failed',reason:e.code+': '+e.message});return undefined;}
    }
    bindDecisionRun(c:Row<ResearchContinuation>,ref:AutomaticApprovalReference,d:Row<CampaignDecision>,intent:Row<RunIntent>){
        this.assert(ref);const campaign=this.app.store.get<Campaign>('campaign',d.campaignId,d.projectId!),effects=d.effects,e=this.app.store.get<Experiment>('experiment',intent.experimentId,d.projectId!),round=this.app.store.get<{parentExperimentId:string}>('research-round',effects!.roundId,d.projectId!);
        ensure(d.status==='applied'&&effects&&!effects.stopped&&ref.subjectKind==='campaign-decision'&&ref.subjectId===d.id&&ref.subjectDigest===d.decisionDigest&&ref.originMessageId===c.originMessageId&&ref.rootSessionId===c.rootSessionId&&ref.permission.hostEpoch===c.permission.hostEpoch&&campaign.rootSessionId===c.rootSessionId&&intent.rootSessionId===c.rootSessionId&&effects.intentIds.includes(intent.id)&&effects.experimentIds.includes(e.id)&&e.parentId===round.parentExperimentId,'AUTOMATIC_DECISION_SCOPE_DENIED','候选必须属于原根任务和本次准确决定效果',403);
        ensure(!!this.app.store.db.prepare("SELECT 1 FROM records e,records i,records d WHERE e.kind='experiment' AND e.id=? AND i.kind='run-intent' AND i.id=? AND d.kind='campaign-decision' AND d.id=? AND e.project_id=d.project_id AND i.project_id=d.project_id AND e.rowid>d.rowid AND i.rowid>d.rowid").get(e.id,intent.id,d.id),'AUTOMATIC_DECISION_SCOPE_DENIED','决定不能接管此前已有的实验或运行意向',403);
        const parent=this.app.store.get<Experiment>('experiment',round.parentExperimentId,d.projectId!),parentSource=sourceMetadata(captureSourceRevision(this.app.context,parent));
        const fixed={continuationId:c.id,continuationDigest:c.digest,decisionId:d.id,decisionApprovalId:d.approvalId,decisionDigest:d.decisionDigest,decisionProofDigest:ref.digest,campaignId:campaign.id,roundId:effects.roundId,parentSource,experimentId:e.id,experimentRevision:e.revision,intentId:intent.id,approvalId:intent.approvalId,manifestDigest:intent.manifestDigest,contractDigest:e.contractDigest,sourceDigest:intent.manifest.snapshotDigest},binding={...fixed,digest:digest(fixed)},old=this.app.store.maybe<DecisionRunBinding>('automatic-decision-run',intent.id);
        if(old)ensure(old.digest===binding.digest,'AUTOMATIC_DECISION_STALE','同一决定意向不能替换固定派生依据',403);else this.app.store.create<DecisionRunBinding>('automatic-decision-run',d.projectId,binding,intent.id);
        this.assertDecisionBinding(c,binding,true);return binding;
    }
    private assertDecisionBinding(c:ResearchContinuation,b:DecisionRunBinding,current:boolean){
        const {id,kind,projectId,version,createdAt,updatedAt,digest:hash,...fixed}=b as Row<DecisionRunBinding>,d=this.app.store.get<CampaignDecision>('campaign-decision',b.decisionId),pid=d.projectId!,a=this.app.store.get<Approval>('approval',b.decisionApprovalId,pid),i=this.app.store.get<RunIntent>('run-intent',b.intentId,pid),e=this.app.store.get<Experiment>('experiment',b.experimentId,pid),campaign=this.app.store.get<Campaign>('campaign',b.campaignId,pid),effects=d.effects;
        ensure(hash===digest(fixed)&&b.continuationId===digest({rootSessionId:c.rootSessionId,messageId:c.originMessageId})&&b.continuationDigest===c.digest&&a.automaticApproval?.digest===b.decisionProofDigest&&a.subjectKind==='campaign-decision'&&a.subjectId===d.id&&a.digest===b.decisionDigest&&d.decisionDigest===b.decisionDigest&&d.approvalId===a.id&&d.status==='applied'&&effects?.roundId===b.roundId&&effects.intentIds.includes(i.id)&&effects.experimentIds.includes(e.id)&&campaign.rootSessionId===c.rootSessionId&&i.rootSessionId===c.rootSessionId&&i.experimentId===e.id&&i.approvalId===b.approvalId&&i.manifestDigest===b.manifestDigest&&digest(i.manifest)===b.manifestDigest&&i.manifest.snapshotDigest===b.sourceDigest&&i.manifest.experimentRevision===b.experimentRevision&&i.manifest.contractDigest===b.contractDigest&&e.revision===b.experimentRevision&&e.contractDigest===b.contractDigest&&campaign.contractDigest===b.contractDigest&&e.parentId===b.parentSource.experimentId,'AUTOMATIC_DECISION_STALE','决定、候选来源、契约或准确运行清单已改变',403);
        const body={campaignId:d.campaignId,roundId:d.roundId,action:d.action,reason:d.reason,observationIds:d.observationIds,...(d.selectedRunId?{selectedRunId:d.selectedRunId}:{}),candidates:d.candidates,inputDigest:d.inputDigest,...(d.planRevisionId?{planRevisionId:d.planRevisionId,planDigest:d.planDigest}:{})};
        ensure(digest(body)===d.decisionDigest&&a.automaticApproval!.originMessageId===c.originMessageId&&a.automaticApproval!.permission.hostEpoch===c.permission.hostEpoch,'AUTOMATIC_DECISION_STALE','原决定或任务证明已变化',403);this.assertApproval(a);this.assert(a.automaticApproval!,current);
        if(current){ensure(a.status==='approved','APPROVAL_STALE','原自动决定批准已失效，不能派生新的计算',403);this.app.campaigns.assertActive(campaign);ensure((!!i.runId||campaign.currentRoundId===b.roundId)&&!effects.stopped,'AUTOMATIC_DECISION_STALE','原候选轮次已停止或变化',403);ensure(digest(sourceMetadata(validateSourceRevision(this.app.context,pid,b.parentSource.snapshotId)))===digest(b.parentSource),'AUTOMATIC_DECISION_STALE','固定父来源已变化',403);this.app.researchPlans.assertDecision(d);}
        return i;
    }
    decisionExperiment(c:ResearchContinuation,id:string){const bindings=this.app.store.list<DecisionRunBinding>('automatic-decision-run').filter(b=>b.continuationId===digest({rootSessionId:c.rootSessionId,messageId:c.originMessageId})&&b.experimentId===id);if(!bindings.length)return false;for(const b of bindings)this.assertDecisionBinding(c,b,true);return true;}
    assertDecisionRun(c:ResearchContinuation,a:Row<Approval>,current:boolean){const b=this.app.store.maybe<DecisionRunBinding>('automatic-decision-run',a.subjectId);if(b){const i=this.assertDecisionBinding(c,b,current);ensure(a.id===i.approvalId&&a.digest===b.manifestDigest,'APPROVAL_STALE','运行批准不属于原决定准确意向',403);}}
    private decisionCompletion(d:Row<CampaignDecision>):AutomaticExecution {
        for(const id of d.effects?.intentIds??[]){const i=this.app.store.get<RunIntent>('run-intent',id,d.projectId!),a=this.app.store.get<Approval>('approval',i.approvalId,d.projectId!);if(a.automaticExecution?.state==='failed'||a.automaticExecution?.state==='unknown')return a.automaticExecution;}
        if((d.effects?.intentIds??[]).some(id=>!this.app.researchAutomation.authorization(id)?.jobId))return {state:'waiting',reason:'准确候选已自动批准，等待本任务前一计算终态后由持久续接提交，无需人工批准'};
        if((d.effects?.candidateIds?.length??0)>(d.effects?.intentIds.length??0))return {state:'waiting',reason:'固定方案含待实现的受审代码候选；尚未形成可提交的准确运行意向'};
        return {state:'completed'};
    }
    decisionRunConsumed(a:Row<Approval>){const b=this.app.store.maybe<DecisionRunBinding>('automatic-decision-run',a.subjectId);if(!b)return;this.execution('approval',a.id,{state:'completed'});const d=this.app.store.get<CampaignDecision>('campaign-decision',b.decisionId,a.projectId!),state=this.decisionCompletion(d);this.execution('approval',d.approvalId,state);const receipt=this.app.store.maybe('automatic-approval-effect',digest({approval:b.decisionProofDigest,kind:'approval',id:d.approvalId}));if(receipt)this.app.store.update('automatic-approval-effect',receipt.id,receipt.version,{state:state.state});}
    preparedDecisionWait(intentId:string){
        const b=this.app.store.maybe<DecisionRunBinding>('automatic-decision-run',intentId);if(!b)return;
        const auth=this.app.researchAutomation.authorization(intentId),approval=this.app.store.get<Approval>('approval',b.approvalId);ensure(approval.status==='approved','APPROVAL_STALE','准确候选批准已失效，不能派发计算续接',403);ensure(auth?.continuationId===b.continuationId,'AUTOMATIC_DECISION_STALE','等待意向不属于原决定计算链',403);const c=this.app.store.get<ResearchContinuation>('research-continuation',b.continuationId,auth.projectId!);
        for(const a of this.app.store.list<Authorization>('research-authorization',auth.projectId!).filter(a=>a.continuationId===c.id&&a.jobId)){const job=this.app.store.get<Run|SandboxJob>(a.subjectKind==='run-intent'?'run':'sandbox-job',a.jobId!,auth.projectId!);if(!['succeeded','failed','cancelled','timed_out'].includes(job.state))return '等待本任务在途或未知计算终态；准确候选保持自动批准，不消费新的续接尝试';if(!this.app.researchAutomation.resultReady(c,job))return '前次计算结果或归档不完整，保留真实阻断，不派发新的计算续接';}
    }
    private continueDecision(actor:Actor,ref:AutomaticApprovalReference,d:Row<CampaignDecision>){
        const ids=d.effects?.intentIds??[];ensure(new Set(ids).size===ids.length,'AUTOMATIC_DECISION_STALE','决定效果不能重复运行意向',403);
        for(const id of ids){const intent=this.app.store.get<RunIntent>('run-intent',id,d.projectId!);this.app.researchAutomation.authorizeDecisionRun(actor,ref,d,intent);const approval=this.app.store.get<Approval>('approval',intent.approvalId,d.projectId!);if(!approval.automaticApproval)this.approve(actor,approval,{decisionId:d.id,decisionDigest:d.decisionDigest,intentId:id,manifestDigest:intent.manifestDigest});}
        for(const id of ids){const i=this.app.store.get<RunIntent>('run-intent',id,d.projectId!),a=this.app.store.get<Approval>('approval',i.approvalId,d.projectId!);if(i.runId)continue;try{this.app.researchAutomation.assertSubmission(actor,a);}catch(error){const e=asError(error);if(e.code==='AUTOMATION_COMPUTE_BUSY'){this.execution('approval',a.id,{state:'waiting',reason:'等待本任务前一计算终态；此准确意向已经自动批准'});continue;}this.execution('approval',a.id,{state:'failed',reason:e.code+': '+e.message});throw error;}this.effect('approval',a.id,a.automaticApproval!,()=>this.app.runs.submit(actor,id));}
        return this.decisionCompletion(d);
    }
    postPrepare(actor:Actor,operation:string,input:Record<string,unknown>,value:unknown,preparedAfter:number):unknown {
        if(!PREPARES.has(operation)||!this.origin(actor))return value;
        const v=value as Record<string,unknown>,pid=actor.projectId!;
        const fresh=(kind:string,id:string)=>!!this.app.store.db.prepare('SELECT 1 FROM records WHERE kind=? AND id=? AND project_id=? AND rowid>?').get(kind,id,pid,preparedAfter);
        if(operation==='research_brief_save'){
            const b=this.app.store.get<import('../research-workflows/briefs.js').ResearchBrief>('research-brief',v.id as string,pid);if(b.status!=='ready'||!fresh('research-brief',b.id))return value;
            const ref=this.reference(actor,{subjectKind:'research-brief',subjectId:b.id,digest:b.digest,scope:'research-brief.confirm'},input)!;
            this.app.store.update('research-brief',b.id,b.version,{automaticApproval:ref});this.effect('research-brief',b.id,ref,()=>this.app.researchBriefs.confirmAutomatic(actor,ref,pid,b.rootSessionId,{briefId:b.id,expectedVersion:b.version+1}));return this.app.store.get('research-brief',b.id,pid);
        }
        if(operation==='research_action_prepare'){
            const r=this.app.store.get<import('../research-workflows/actions.js').ResearchAction>('research-action',v.id as string,pid);if(r.actionKind==='history'||r.state!=='pending'||!fresh('research-action',r.id))return value;
            const ref=this.reference(actor,{subjectKind:'research-action',subjectId:r.id,digest:r.requestDigest,scope:'research-action.decide'},input)!;
            this.app.store.update('research-action',r.id,r.version,{automaticApproval:ref});const decision=r.input.kind==='claim_decision'?r.input.claim.proposedDecision:'confirm';
            if(!decision)this.execution('research-action',r.id,{state:'needs_attention',reason:'结论没有明确提案，保留待处理状态'});
            else this.effect('research-action',r.id,ref,()=>this.app.researchActions.decideAutomatic(actor,ref,pid,r.sessionId,{requestId:r.id,expectedVersion:r.version+1,decision}));
            return this.app.researchActions.inspect(actor,pid,r.sessionId,r.id);
        }
        let approvalId=(v.approvalId??(v.approval as {id?:string}|undefined)?.id) as string|undefined;
        if(operation==='publication_prepare')approvalId=this.app.store.get('publication-build-job',v.jobId as string,pid).approvalId as string;
        ensure(approvalId,'AUTOMATIC_APPROVAL_SUBJECT_MISSING','准备结果缺少准确审批对象');
        const a=this.app.store.get<Approval>('approval',approvalId,pid);
        // Existing receipts never turn historical pending work into new authority.
        if(a.automaticApproval||!fresh('approval',a.id))return value;
        const approved=this.approve(actor,a,input);if(!approved)return value;const ref=approved.automaticApproval!;
        let decisionExecution:AutomaticExecution|undefined;
        this.effect('approval',a.id,ref,()=>{
            if(operation==='run_prepare')return this.app.runs.submit(actor,a.subjectId);
            if(operation==='development_prepare')return this.app.development.submit(actor,pid,a.subjectId);
            if(['collaboration_plan_submit','agent_delegate','development_review_prepare','formal_report_review_prepare','publication_review_prepare'].includes(operation))return this.app.teams.activateAutomatic(actor,ref,a.subjectId);
            if(operation==='change_proposal_prepare'||operation==='reviewed_change_prepare')return this.app.changes.applyAutomatic(actor,ref,a.subjectId);
            if(operation==='campaign_prepare')return this.app.campaigns.activateAutomatic(actor,ref,a.subjectId,this.app.store.get('campaign',a.subjectId).version);
            if(operation==='campaign_decision_submit'){const decision=this.app.decisions.applyAutomatic(actor,ref,a.subjectId,this.app.store.get('campaign-decision',a.subjectId).version);decisionExecution=this.continueDecision(actor,ref,decision);return decision;}
            if(operation==='publication_prepare')return this.app.publicationBuilds.submitAutomatic(actor,ref,pid,a.subjectId);
        },()=>decisionExecution??{state:'completed'});
        if(operation==='publication_prepare')return this.app.publicationBuilds.inspect(actor,pid,v.jobId as string);
        if(operation==='run_prepare')return {...v,...this.app.store.get('run-intent',a.subjectId,pid),approval:this.app.store.get('approval',a.id,pid)};
        if(operation==='development_prepare')return this.app.development.get(actor,pid,a.subjectId);
        if(['collaboration_plan_submit','agent_delegate','campaign_prepare','campaign_decision_submit','change_proposal_prepare','reviewed_change_prepare'].includes(operation))return this.app.store.get(a.subjectKind,a.subjectId,pid);
        if(operation==='development_review_prepare')return this.app.developmentReviews.inspect(actor,pid,v.id as string);
        if(operation==='formal_report_review_prepare')return this.app.formalReportReviews.inspect(actor,pid,v.id as string);
        if(operation==='publication_review_prepare')return this.app.publicationReviews.inspect(actor,pid,v.id as string);
        return value;
    }
}
