import type {Store} from '../storage/store.js';
import {digest} from '../storage/store.js';
import type {Actor,Approval,Artifact,Experiment,Row,Run,RunIntent,Session} from '../domain/types.js';
import type {RunGrant,RunGrantReference,RunGrantUse} from './run-grant-types.js';
import {ensure} from '../domain/errors.js';
import {verifySnapshot} from '../workspace/files.js';
import {assertExperimentSourceCurrent} from './lifecycle.js';

export function runGrantPayload(g:RunGrant){const {sessionId,model,entries,maxRuns,expiresAt,approvalId}=g;return {sessionId,model,entries,maxRuns,expiresAt,approvalId};}
export const runGrantReference=(g:Row<RunGrant>):RunGrantReference=>({id:g.id,digest:g.digest,approvalId:g.approvalId});
export function assertRunGrantRecord(store:Store,pid:string,id:string){
    const grant=store.get<RunGrant>('run-grant',id,pid);ensure(digest(runGrantPayload(grant))===grant.digest,'RUN_GRANT_CORRUPTED','冻结运行授权内容已改变');
    const approval=store.get<Approval>('approval',grant.approvalId,pid);ensure(approval.subjectKind==='run-grant'&&approval.subjectId===grant.id&&approval.digest===grant.digest&&approval.scope==='run-grant.activate'&&!approval.workingGrant&&!approval.runGrant,'APPROVAL_STALE','运行授权的原批准身份不符');return {grant,approval};
}
export function assertRunGrantReference(store:Store,pid:string,ref:RunGrantReference,admission=false){
    const {grant:g,approval}=assertRunGrantRecord(store,pid,ref.id);ensure(g.digest===ref.digest&&g.approvalId===ref.approvalId,'RUN_GRANT_STALE','运行授权的原身份已改变');ensure(g.state==='active','RUN_GRANT_REVOKED','运行授权尚未激活或已撤销');ensure(approval.status==='approved','APPROVAL_STALE','运行授权的原批准已失效');
    if(admission){ensure(Date.parse(g.expiresAt)>Date.now(),'RUN_GRANT_EXPIRED','运行授权已到期；历史结果保留');const s=store.get<Session>('session',g.sessionId,pid);ensure(s.runGrantId===g.id&&s.role==='coordinator'&&!s.taskId&&s.state!=='archived'&&digest(s.model)===digest(g.model),'RUN_GRANT_SCOPE_CHANGED','指定会话或模型已改变');}return g;
}
export function assertRunGrantEntry(store:Store,pid:string,g:RunGrant,intent:Row<RunIntent>){
    const e=g.entries.find(e=>e.intentId===intent.id),m=intent.manifest;ensure(e&&intent.experimentId===e.experimentId&&intent.approvalId===e.approvalId&&intent.manifestDigest===e.manifestDigest&&digest(m)===e.manifestDigest&&m.experimentId===e.experimentId&&m.experimentRevision===e.experimentRevision&&m.snapshotDigest===e.sourceDigest&&m.contractDigest===e.contractDigest&&digest(m.contract)===e.contractDigest&&digest(m.sourceFiles)===e.sourceDigest,'RUN_GRANT_INTENT_CHANGED','清单不在批准集合或原清单、源码、契约、批准身份已改变');
    const approval=store.get<Approval>('approval',e.approvalId,pid);ensure(approval.subjectKind==='run-intent'&&approval.subjectId===intent.id&&approval.scope==='run.submit'&&approval.digest===e.manifestDigest&&!approval.workingGrant,'APPROVAL_STALE','冻结清单的精确批准不符');
    verifySnapshot(m.snapshotPath,m.sourceFiles);assertExperimentSourceCurrent(store,store.get<Experiment>('experiment',intent.experimentId,pid));return approval;
}
export function assertRunGrantIntent(store:Store,intent:Row<RunIntent>,admission=false){
    const a=store.get<Approval>('approval',intent.approvalId,intent.projectId!);
    if(!intent.runGrant){ensure(!a.runGrant&&!store.list<RunGrantUse>('run-grant-use',intent.projectId!).some(u=>u.intentId===intent.id),'RUN_GRANT_STALE','清单丢失运行授权依据');return;}
    const g=assertRunGrantReference(store,intent.projectId!,intent.runGrant,admission),approval=assertRunGrantEntry(store,intent.projectId!,g,intent);ensure(approval.status==='approved'&&digest(approval.runGrant)===digest(intent.runGrant),'APPROVAL_STALE','清单的派生批准与原运行授权不一致');return g;
}
/** Read-only; callers use admission=true only before actual persisted start. */
export function assertRunGrantRun(store:Store,run:Row<Run>,admission=false){
    const intent=store.get<RunIntent>('run-intent',run.intentId,run.projectId!);ensure(digest(run.runGrant)===digest(intent.runGrant),'RUN_GRANT_STALE','Run与清单的原授权不一致');const g=assertRunGrantIntent(store,intent,admission);if(!g)return;
    ensure(intent.runId===run.id&&intent.status==='submitted'&&run.experimentId===intent.experimentId&&run.manifestDigest===intent.manifestDigest&&digest(run.manifest)===run.manifestDigest,'RUN_GRANT_INTENT_CHANGED','Run不属于已授权的固定清单');const id=digest({grantId:g.id,intentId:intent.id}),u=store.get<RunGrantUse>('run-grant-use',id,run.projectId!);
    ensure(u.grantId===g.id&&u.grantDigest===g.digest&&u.grantApprovalId===g.approvalId&&u.intentId===intent.id&&u.manifestDigest===run.manifestDigest&&u.approvalId===intent.approvalId&&u.runId===run.id,'RUN_GRANT_USE_MISMATCH','Run与永久提交计次不匹配');
}
export function assertRunGrantActor(store:Store,actor:Actor,intent:Row<RunIntent>){
    if(actor.type!=='agent')return;
    const s=actor.sessionId?store.get<Session>('session',actor.sessionId,intent.projectId!):undefined;
    if(!s?.runGrantId&&!intent.runGrant)return;
    ensure(s&&actor.role==='coordinator'&&s.role==='coordinator'&&!s.taskId&&!actor.taskId&&!actor.wakeupId&&s.runGrantId===intent.runGrant?.id,'RUN_GRANT_SCOPE_DENIED','指定会话只能使用其运行授权集合',403);
    const g=store.get<RunGrant>('run-grant',intent.runGrant!.id,intent.projectId!);ensure(g.sessionId===s.id,'RUN_GRANT_SCOPE_DENIED','运行授权属于其他会话',403);
    ensure(s.state==='running'&&s.generation===actor.generation&&s.leaseUntil>Date.now(),'LEASE_EXPIRED','提交会话租约已失效');
}
export function assertRunGrantArtifact(store:Store,pid:string,artifact:Row<Artifact>){if(!artifact.runId)return;const run=store.get<Run>('run',artifact.runId,pid);ensure(artifact.projectId===pid&&run.artifactIds.includes(artifact.id),'RUN_GRANT_ARTIFACT_CHANGED','产物不属于固定运行来源');assertRunGrantRun(store,run,false);}
/** Caller holds the Run creation transaction. Submission is permanently counted. */
export function consumeRunGrant(store:Store,intent:Row<RunIntent>,runId:string){
    const g=assertRunGrantIntent(store,intent,true);if(!g)return;
    const id=digest({grantId:g.id,intentId:intent.id});ensure(!store.maybe('run-grant-use',id),'RUN_GRANT_USE_MISMATCH','清单已计次但Run回执缺失，不能重复提交');
    ensure(store.list<RunGrantUse>('run-grant-use',intent.projectId!).filter(u=>u.grantId===g.id).length<g.maxRuns,'RUN_GRANT_EXHAUSTED','冻结运行授权提交次数已用完；失败、取消和未知状态不退次数');
    const use=store.create<RunGrantUse>('run-grant-use',intent.projectId,{grantId:g.id,grantDigest:g.digest,grantApprovalId:g.approvalId,intentId:intent.id,manifestDigest:intent.manifestDigest,approvalId:intent.approvalId,runId},id);store.event(intent.projectId,'run-grant.used',{grantId:g.id,intentId:intent.id,runId,useId:use.id});return use;
}
