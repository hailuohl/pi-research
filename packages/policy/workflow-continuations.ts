import type {ResearchApp} from '../research-app.js';
import type {Actor,Approval,ChangeProposal,Message,Project,Row,Session} from '../domain/types.js';
import type {ResearchBrief} from '../research-workflows/briefs.js';
import type {Campaign,ResearchRound} from '../research-workflows/types.js';
import type {PermissionReference} from './session-permissions.js';
import {ensure} from '../domain/errors.js';
import {userOnly,scope} from './permissions.js';
import {digest} from '../storage/store.js';
import {sourceManifest} from '../workspace/files.js';
import {validateSourceRevision} from '../workspace/source-access.js';
import {object,integer,oneOf,text} from '../contracts/validation.js';

type Kind='brief'|'campaign'|'change';
interface Source {sourceKind:Kind;sourceId:string;sourceDigest:string;}
interface WorkflowContinuation extends Source {
    rootSessionId:string;permission:PermissionReference;modelDigest:string;lifecycleEpoch:number;
    humanMessageId:string|null;sourceProof:string;bindingDigest:string;initialMessageId?:string;resultId?:string;
    invalidatedReasonCode?:string;blockReason?:string;
}
interface Action {sessionId:string;workflowContinuationId?:string;workflowApprovalNoticeMessageId?:string;state:string;approvalId:string;operation:string;input:Record<string,unknown>;policy:PermissionReference;source:string;}
interface BoundResearchRequest {rootSessionId:string;originMessageId:string;originDigest:string;permission:PermissionReference;modelDigest:string;lifecycleEpoch:number;}
interface ExistingHandoffReader {assertReference(projectId:string,request:BoundResearchRequest):unknown;assertCurrent(id:string):unknown;}
export interface WorkflowStatus extends Source {id:string;route:'workflow'|'existing-handoff';state:'blocked'|'pending'|'queued'|'running'|'completed'|'failed'|'cancelled'|'superseded';reasonCode?:string;reason?:string;resultId?:string;}
const USER={type:'user'} as const;
const reasons:Record<string,string>={
    WORKFLOW_SOURCE_STALE:'固定来源已改变；请发新的人工指令核对后继续。',WORKFLOW_REQUEST_CHANGED:'新的人工请求已取代本次续接。',
    WORKFLOW_PERMISSION_CHANGED:'原权限已改变；本次续接不会重新取得权限。',WORKFLOW_MODEL_CHANGED:'原模型已改变或不可用；请发新的人工指令核对。',
    WORKFLOW_STOPPED:'会话已中止或归档；原确认和整合记录保留。',WORKFLOW_WORKSPACE_UNAVAILABLE:'工作区无法核验；请核对后发新的人工指令。',
    WORKFLOW_MODEL_UNAVAILABLE:'模型尚未就绪；请配置后发新的人工指令继续。',WORKFLOW_WAITING:'等待当前会话、人工输入或执行容量。',
    HANDOFF_INVALID:'原研究续接来源不可用；未创建替代通知。',HANDOFF_SERVICE_UNAVAILABLE:'当前版本没有原研究续接服务；未创建替代通知。',
    HANDOFF_NOT_REGISTERED:'原来源已确认或整合；既有研究续接尚未登记。',HANDOFF_NOT_QUEUED:'准确研究续接已存在；既有宿主尚未排队。',HANDOFF_WAITING:'原研究续接等待既有宿主执行；请查看原通知的具体状态。',
};
export class WorkflowContinuationService {
    constructor(private app:ResearchApp){}
    private root(projectId:string,id:string){const root=this.app.store.get<Session>('session',id,projectId),project=this.app.store.get<Project>('project',projectId);ensure(!project.archived&&project.status==='active'&&root.state!=='archived'&&root.role==='coordinator'&&!root.taskId&&!root.teamId&&!root.parentSessionId,'WORKFLOW_STOPPED',reasons.WORKFLOW_STOPPED);return root;}
    private identity(projectId:string,rootSessionId:string,source:Source){return digest({projectId,rootSessionId,...source});}
    private modelIdentity(root:Row<Session>){const change=this.app.store.db.prepare("SELECT MAX(seq) seq FROM events WHERE project_id=? AND type='session.model_changed' AND json_extract(payload,'$.sessionId')=?").get(root.projectId!,root.id);return digest({identity:this.app.researchAutomation.modelIdentity(root),selection:change?.seq??null});}
    private row(projectId:string,source:Source){return this.app.store.get(source.sourceKind==='brief'?'research-brief':source.sourceKind==='campaign'?'campaign':'change-proposal',source.sourceId,projectId);}
    private bound(row:Record<string,unknown>){return Object.hasOwn(row,'requestRef')||Object.hasOwn(row,'processingNotice')||Object.hasOwn(row,'researchRequest');}
    private eligibility(projectId:string,root:Row<Session>,source:Source){
        const row=this.row(projectId,source);ensure(row.rootSessionId===root.id,'SCOPE_DENIED','固定事项不属于当前主会话',403);
        ensure((source.sourceKind==='campaign'?row.planDigest:row.digest)===source.sourceDigest,'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);
        ensure(!row.automaticApproval,'WORKFLOW_AUTOMATIC_DENIED','自动处理的事项不能额外续接');
        if(row.approvalId){const approval=this.app.store.get<Approval>('approval',String(row.approvalId),projectId);ensure(!approval.automaticApproval&&!approval.fullAccess,'WORKFLOW_AUTOMATIC_DENIED','自动或完全访问批准不能额外续接');}
        return row;
    }
    private proof(projectId:string,root:Row<Session>,source:Source){
        const row=this.eligibility(projectId,root,source);ensure(!this.bound(row),'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);
        if(source.sourceKind==='brief'){
            const brief=row as unknown as Row<ResearchBrief>;ensure(root.researchBriefId===brief.id,'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);
            this.app.researchBriefs.assertReference(USER,projectId,root.id,{id:brief.id,digest:brief.digest,revision:brief.revision,rootSessionId:root.id});
            this.app.draftReads.assertCurrent(root,brief.draftFiles);
            return digest({id:brief.id,digest:brief.digest,revision:brief.revision});
        }
        if(source.sourceKind==='campaign'){
            const campaign=row as unknown as Row<Campaign>,{goal,rootSessionId,rootModel,baselineExperimentId,contractDigest,primaryMetric,limits,autoAnalyze}=campaign;
            ensure(digest({goal,rootSessionId,rootModel,baselineExperimentId,contractDigest,primaryMetric,limits,autoAnalyze})===campaign.planDigest,'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);this.app.campaigns.assertActive(campaign);this.app.approvals.assert(campaign.approvalId,projectId,campaign.id,campaign.planDigest,'campaign.activate');
            ensure(digest(campaign.rootModel)===digest(root.model),'WORKFLOW_MODEL_CHANGED',reasons.WORKFLOW_MODEL_CHANGED);
            const round=this.app.store.get<ResearchRound>('research-round',campaign.currentRoundId,projectId),baseline=this.app.experiments.get(USER,round.parentExperimentId);
            ensure(round.campaignId===campaign.id&&round.parentSource&&baseline.lifecycle!=='archived'&&baseline.contractDigest===campaign.contractDigest,'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);
            const revision=validateSourceRevision(this.app.context,projectId,round.parentSource.snapshotId),sourceDigest=sourceManifest(this.app.store.paths.physical(baseline.workspace)).digest;
            ensure(revision.experimentId===baseline.id&&revision.revision===baseline.revision&&revision.sourceDigest===round.parentSource.sourceDigest&&sourceDigest===revision.sourceDigest,'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);
            return digest({plan:campaign.planDigest,round:campaign.currentRoundId,source:sourceDigest,revision:baseline.revision});
        }
        const proposal=row as unknown as Row<ChangeProposal>;this.app.changes.inspect(USER,proposal.id);
        ensure(proposal.state==='applied'&&proposal.appliedExperimentId&&proposal.sourceValidity!=='stale','WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);
        this.app.approvals.assertEffect(proposal.approvalId,projectId,proposal.id,proposal.digest,'change.integrate');
        if(proposal.reviewId)this.app.developmentReviews.assertPassed(USER,projectId,proposal.reviewId,(proposal as ChangeProposal&{composition?:{testedSnapshot:{digest:string}}}).composition?.testedSnapshot.digest??proposal.candidateSnapshot.digest);
        const child=this.app.experiments.get(USER,proposal.appliedExperimentId);
        ensure(child.lifecycle!=='archived'&&child.changeProposalId===proposal.id&&child.contractDigest===proposal.contractDigest&&sourceManifest(this.app.store.paths.physical(child.workspace)).digest===proposal.candidateSnapshot.digest,'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);
        return digest({proposal:proposal.digest,child:child.id,revision:child.revision,source:proposal.candidateSnapshot.digest});
    }
    confirm(actor:Actor,projectId:string,sessionId:string,value:unknown):WorkflowStatus {
        userOnly(actor);scope(actor,projectId);const input=object(value);ensure(Object.keys(input).every(key=>['sourceKind','sourceId','sourceDigest','expectedVersion','approvalId','expectedApprovalVersion'].includes(key)),'INVALID_INPUT','工作流确认包含未知字段');
        const source:Source={sourceKind:oneOf(input.sourceKind,['brief','campaign','change'] as const,'sourceKind'),sourceId:text(input.sourceId,'sourceId',100),sourceDigest:text(input.sourceDigest,'sourceDigest',64)},expectedVersion=integer(input.expectedVersion,'expectedVersion',1);
        return this.app.store.transaction(()=>{
            const root=this.root(projectId,sessionId),row=this.eligibility(projectId,root,source),id=this.identity(projectId,sessionId,source),old=this.app.store.maybe<WorkflowContinuation>('workflow-continuation',id);
            if(old){ensure(source.sourceKind==='brief'?input.approvalId===undefined&&input.expectedApprovalVersion===undefined:input.approvalId===row.approvalId,'APPROVAL_STALE','重试必须仍引用同一准确批准');return this.status(old);}
            const permission=this.app.sessionPermissions.capture(root.id);ensure(permission.mode!=='fullAccess','WORKFLOW_AUTOMATIC_DENIED','完全访问上下文不能额外续接');
            ensure(row.version===expectedVersion,'VERSION_CONFLICT','固定事项版本已变化，请刷新核对');
            if(source.sourceKind==='brief'){
                ensure(input.approvalId===undefined&&input.expectedApprovalVersion===undefined,'INVALID_INPUT','计划确认不接受审批标识');
                ensure(root.researchBriefId===row.id,'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);
                if(row.status==='ready')this.app.researchBriefs.confirm(actor,projectId,sessionId,{briefId:row.id,expectedVersion});
                else ensure(row.status==='confirmed','BRIEF_NOT_READY','只能确认当前 ready 计划');
            }else{
                const approval=this.app.store.get<Approval>('approval',text(input.approvalId,'approvalId',100),projectId);
                ensure(approval.id===row.approvalId&&approval.subjectId===row.id&&approval.digest===source.sourceDigest&&approval.scope===(source.sourceKind==='campaign'?'campaign.activate':'change.integrate'),'APPROVAL_STALE','批准不属于此固定事项');
                ensure(approval.version===integer(input.expectedApprovalVersion,'expectedApprovalVersion',1),'VERSION_CONFLICT','准确批准版本已变化');
                if(approval.status==='pending')this.app.approvals.decide(actor,approval.id,approval.version,true);else ensure(approval.status==='approved','APPROVAL_STALE','准确批准不可用');
                if(source.sourceKind==='campaign'){if(row.state==='draft')this.app.campaigns.activate(actor,row.id,row.version);else ensure(row.state==='active','CAMPAIGN_STATE_INVALID','研究计划当前不可继续');}
                else this.app.changes.apply(actor,row.id);
            }
            const updated=this.row(projectId,source);
            if(this.bound(updated))return this.existingHandoffStatus(projectId,root.id,source);
            const fixed={...source,rootSessionId:root.id,permission,modelDigest:this.modelIdentity(root),lifecycleEpoch:this.app.store.get<Project>('project',projectId).lifecycleEpoch,humanMessageId:root.lastConsumedHumanMessageId??null,sourceProof:this.proof(projectId,root,source),...(source.sourceKind==='change'?{resultId:String(updated.appliedExperimentId)}:{})};
            const receipt=this.app.store.create<WorkflowContinuation>('workflow-continuation',projectId,{...fixed,bindingDigest:digest(fixed)},id);
            const message=this.app.sessions.workflowNotice(root.id,id,`【固定事项处理通知】这是用户确认的原事项续接，不是新的人工研究请求。请回读当前准确来源并继续原对话；所有工具、计算和整合仍遵守原权限及逐项审批。遇到缺口或失效说明原因并停止。\n${JSON.stringify({sourceKind:source.sourceKind,sourceId:source.sourceId,sourceDigest:source.sourceDigest,...(fixed.resultId?{experimentId:fixed.resultId}:{})})}`,permission);
            return this.status(this.app.store.update<WorkflowContinuation>('workflow-continuation',id,receipt.version,{initialMessageId:message.id}));
        });
    }
    existingHandoffStatus(projectId:string,rootSessionId:string,source:Source):WorkflowStatus {
        const stage=source.sourceKind==='brief'?'plan-confirmed':'change-applied',kind=source.sourceKind==='brief'?'research-brief':'change-proposal',id=digest({stage,sourceKind:kind,sourceId:source.sourceId}),base={...source,id,route:'existing-handoff' as const};
        const blocked=(reasonCode:string):WorkflowStatus=>({...base,state:'blocked',reasonCode,reason:reasons[reasonCode]});
        const candidate=(this.app as ResearchApp&{researchHandoffs?:unknown}).researchHandoffs;
        if(!candidate||typeof (candidate as ExistingHandoffReader).assertReference!=='function'||typeof (candidate as ExistingHandoffReader).assertCurrent!=='function')return blocked('HANDOFF_SERVICE_UNAVAILABLE');
        try{
            const row=this.row(projectId,source),request=(row.requestRef??row.researchRequest) as BoundResearchRequest|undefined;
            ensure(request&&request.rootSessionId===rootSessionId&&typeof request.originMessageId==='string'&&typeof request.originDigest==='string'&&typeof request.modelDigest==='string'&&Number.isInteger(request.lifecycleEpoch)&&request.permission?.rootSessionId===rootSessionId,'HANDOFF_INVALID',reasons.HANDOFF_INVALID);
            const reader=candidate as ExistingHandoffReader;reader.assertReference(projectId,request);
            const handoff=this.app.store.maybe('research-handoff',id);if(!handoff)return blocked('HANDOFF_NOT_REGISTERED');
            ensure(handoff.projectId===projectId&&handoff.stage===stage&&handoff.sourceKind===kind&&handoff.sourceId===source.sourceId&&digest(handoff.request)===digest(request),'HANDOFF_INVALID',reasons.HANDOFF_INVALID);reader.assertCurrent(id);
            const wakeup=this.app.store.maybe('wakeup',digest({kind:'research-handoff',id}));if(!wakeup)return blocked('HANDOFF_NOT_QUEUED');
            ensure(wakeup.projectId===projectId&&wakeup.rootSessionId===rootSessionId&&wakeup.handoffId===id&&wakeup.ownerId===id&&wakeup.sourceId===id&&wakeup.sourceDigest===handoff.digest,'HANDOFF_INVALID',reasons.HANDOFF_INVALID);
            return {...base,state:wakeup.state as WorkflowStatus['state'],...(wakeup.blockReason||wakeup.error?{reasonCode:'HANDOFF_WAITING',reason:reasons.HANDOFF_WAITING}:{})};
        }catch{return blocked('HANDOFF_INVALID');}
    }
    assertBindingCurrent(id:string){
        const receipt=this.app.store.get<WorkflowContinuation>('workflow-continuation',id),{id:recordId,kind,projectId,version,createdAt,updatedAt,bindingDigest,initialMessageId,invalidatedReasonCode,blockReason,...fixed}=receipt;
        ensure(this.identity(receipt.projectId!,receipt.rootSessionId,{sourceKind:receipt.sourceKind,sourceId:receipt.sourceId,sourceDigest:receipt.sourceDigest})===id&&digest(fixed)===bindingDigest,'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);
        ensure(!receipt.invalidatedReasonCode,receipt.invalidatedReasonCode??'WORKFLOW_SOURCE_STALE',reasons[receipt.invalidatedReasonCode??'WORKFLOW_SOURCE_STALE']);
        const root=this.root(receipt.projectId!,receipt.rootSessionId);ensure(this.app.store.get<Project>('project',receipt.projectId!).lifecycleEpoch===receipt.lifecycleEpoch,'WORKFLOW_STOPPED',reasons.WORKFLOW_STOPPED);
        ensure((root.lastConsumedHumanMessageId??null)===receipt.humanMessageId,'WORKFLOW_REQUEST_CHANGED',reasons.WORKFLOW_REQUEST_CHANGED);
        ensure(this.modelIdentity(root)===receipt.modelDigest,'WORKFLOW_MODEL_CHANGED',reasons.WORKFLOW_MODEL_CHANGED);
        ensure(digest(this.app.sessionPermissions.capture(root.id))===digest(receipt.permission),'WORKFLOW_PERMISSION_CHANGED',reasons.WORKFLOW_PERMISSION_CHANGED);this.app.sessionPermissions.assert(receipt.permission,false);
        ensure(this.proof(receipt.projectId!,root,receipt)===receipt.sourceProof,'WORKFLOW_SOURCE_STALE',reasons.WORKFLOW_SOURCE_STALE);return receipt;
    }
    forMessage(message:Message|undefined){
        if(message?.workflowContinuationId)return message.workflowContinuationId;
        if(message?.approvalNoticeId)return this.app.store.get<Action>('session-action',message.approvalNoticeId).workflowContinuationId;
    }
    assertClaim(message:Row<Message>){
        const id=this.forMessage(message);if(!id)return;
        const receipt=this.assertBindingCurrent(id);ensure(message.projectId===receipt.projectId&&message.sessionId===receipt.rootSessionId&&message.status==='queued'&&!message.wakeupId&&digest(message.permission)===digest(receipt.permission),'WORKFLOW_NOTICE_INVALID','固定通知不可领取');
        if(message.approvalNoticeId){const action=this.app.store.get<Action>('session-action',message.approvalNoticeId,receipt.projectId!);ensure(message.role==='user'&&!message.origin&&message.generation===undefined&&action.workflowContinuationId===id&&action.workflowApprovalNoticeMessageId===message.id&&action.sessionId===receipt.rootSessionId&&action.state==='approved','WORKFLOW_ACTION_CONSUMED','准确操作已经消费或通知不匹配');this.app.sessionPermissions.validate(action.policy,action.sessionId,action.operation,action.input,action.id);}
        else ensure(receipt.initialMessageId===message.id&&message.role==='system'&&message.origin==='automation'&&message.generation===undefined,'WORKFLOW_NOTICE_INVALID','原通知不能重复领取');
        return receipt;
    }
    assertActor(actor:Actor){
        ensure(actor.type==='agent'&&actor.workflowContinuationId&&actor.workflowNoticeMessageId&&!actor.messageId&&!actor.wakeupId&&!actor.continuationId&&!actor.approvalResumeId&&!actor.taskId&&!actor.attemptId,'WORKFLOW_NOTICE_INVALID','需要宿主绑定的固定通知身份');
        const receipt=this.assertBindingCurrent(actor.workflowContinuationId),root=this.root(receipt.projectId!,receipt.rootSessionId),message=this.app.store.get<Message>('message',actor.workflowNoticeMessageId,receipt.projectId!);
        ensure(root.projectId===actor.projectId&&root.id===actor.sessionId&&root.state==='running'&&root.generation===actor.generation&&root.leaseUntil>Date.now()&&message.sessionId===root.id&&message.status==='running'&&message.generation===root.generation&&message.workflowConsumedGeneration===root.generation&&this.forMessage(message)===receipt.id&&digest(actor.permission)===digest(receipt.permission),'WORKFLOW_NOTICE_INVALID','固定通知尚未消费或代际已失效');
        if(message.approvalNoticeId){const action=this.app.store.get<Action>('session-action',message.approvalNoticeId,receipt.projectId!);ensure(actor.approvalNoticeMessageId===message.id&&action.workflowApprovalNoticeMessageId===message.id&&['approved','executing','completed'].includes(action.state),'WORKFLOW_NOTICE_INVALID','精准恢复通知不匹配');}
        else ensure(message.id===receipt.initialMessageId&&message.role==='system'&&message.origin==='automation','WORKFLOW_NOTICE_INVALID','原通知绑定不匹配');return receipt;
    }
    consumed(message:Row<Message>,generation:number){
        const id=this.forMessage(message);if(!id)return false;
        const receipt=this.assertBindingCurrent(id);ensure(message.projectId===receipt.projectId&&message.sessionId===receipt.rootSessionId&&message.generation===generation&&message.status==='running','WORKFLOW_NOTICE_INVALID','通知消费来源已变化');
        this.app.store.update<Message>('message',message.id,message.version,{workflowConsumedGeneration:generation});return true;
    }
    humanConsumed(sessionId:string,messageId:string){
        const root=this.app.store.get<Session>('session',sessionId),message=this.app.store.get<Message>('message',messageId,root.projectId!);
        ensure(message.sessionId===sessionId&&message.role==='user'&&message.origin!=='automation'&&!message.wakeupId&&!message.approvalNoticeId&&message.status==='running'&&message.generation===root.generation,'WORKFLOW_NOTICE_INVALID','人工输入未在当前代际消费');
        if(root.lastConsumedHumanMessageId!==messageId)this.app.store.update<Session>('session',root.id,root.version,{lastConsumedHumanMessageId:messageId});
        for(const receipt of this.app.store.list<WorkflowContinuation>('workflow-continuation',root.projectId!).filter(row=>row.rootSessionId===root.id&&row.humanMessageId!==messageId))this.invalidate(receipt.id,'WORKFLOW_REQUEST_CHANGED');
    }
    invalidate(id:string,reasonCode:string){
        const receipt=this.app.store.get<WorkflowContinuation>('workflow-continuation',id);
        const code=receipt.invalidatedReasonCode??(reasons[reasonCode]?reasonCode:'WORKFLOW_SOURCE_STALE');if(!receipt.invalidatedReasonCode)this.app.store.update<WorkflowContinuation>('workflow-continuation',id,receipt.version,{invalidatedReasonCode:code,blockReason:undefined});
        for(const message of this.app.sessions.messages(USER,receipt.rootSessionId).filter(row=>row.status==='queued'&&this.forMessage(row)===id))this.app.store.update<Message>('message',message.id,message.version,{status:'cancelled',error:reasons[code]});
        const root=this.app.store.get<Session>('session',receipt.rootSessionId);if(reasonCode!=='WORKFLOW_STOPPED'&&root.state==='queued'&&!this.app.sessions.messages(USER,root.id).some(message=>message.status==='queued'))this.app.store.update<Session>('session',root.id,root.version,{state:'failed',lastError:reasons[code]});
    }
    stop(sessionId:string){for(const receipt of this.app.store.list<WorkflowContinuation>('workflow-continuation').filter(row=>row.rootSessionId===sessionId))this.invalidate(receipt.id,'WORKFLOW_STOPPED');}
    waiting(message:Message){const id=this.forMessage(message);if(!id)return;const row=this.app.store.get<WorkflowContinuation>('workflow-continuation',id);if(row.blockReason!=='WORKFLOW_WAITING')this.app.store.update<WorkflowContinuation>('workflow-continuation',id,row.version,{blockReason:'WORKFLOW_WAITING'});}
    fail(message:Row<Message>,code:string){
        const id=this.forMessage(message);if(!id)return;
        if(code==='WORKFLOW_ACTION_CONSUMED'&&message.approvalNoticeId){const action=this.app.store.get<Action>('session-action',message.approvalNoticeId);if(action.state==='completed'&&action.workflowApprovalNoticeMessageId===message.id){const current=this.app.store.get<Message>('message',message.id);if(current.status==='queued')this.app.store.update<Message>('message',current.id,current.version,{status:'cancelled',error:'准确操作已由原轮消费，未再启动恢复轮'});const root=this.app.store.get<Session>('session',message.sessionId);if(root.state==='queued'&&!this.app.sessions.messages(USER,root.id).some(row=>row.status==='queued'))this.app.store.update<Session>('session',root.id,root.version,{state:'idle'});return;}}
        this.invalidate(id,code);
    }
    status(receipt:Row<WorkflowContinuation>):WorkflowStatus {
        let code=receipt.invalidatedReasonCode;
        if(!code)try{this.assertBindingCurrent(receipt.id);}catch(error){code=(error as {code?:string}).code;code=code&&reasons[code]?code:'WORKFLOW_SOURCE_STALE';}
        const message=receipt.initialMessageId?this.app.store.maybe<Message>('message',receipt.initialMessageId):undefined;
        return {id:receipt.id,sourceKind:receipt.sourceKind,sourceId:receipt.sourceId,sourceDigest:receipt.sourceDigest,route:'workflow',state:code?'superseded':message?.status??'blocked',...(receipt.resultId?{resultId:receipt.resultId}:{}),...(code||receipt.blockReason?{reasonCode:code??receipt.blockReason,reason:reasons[code??receipt.blockReason!]}:{})};
    }
    list(actor:Actor,projectId:string,sessionId:string){scope(actor,projectId);this.app.store.get<Session>('session',sessionId,projectId);const statuses=this.app.store.list<WorkflowContinuation>('workflow-continuation',projectId).filter(row=>row.rootSessionId===sessionId).map(row=>this.status(row));for(const kind of ['research-brief','change-proposal'] as const)for(const row of this.app.store.list(kind,projectId).filter(row=>row.rootSessionId===sessionId&&this.bound(row)&&(kind==='research-brief'?row.status==='confirmed':row.state==='applied')))statuses.push(this.existingHandoffStatus(projectId,sessionId,{sourceKind:kind==='research-brief'?'brief':'change',sourceId:row.id,sourceDigest:String(row.digest)}));return statuses;}
}
