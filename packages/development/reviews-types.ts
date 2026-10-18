import {assertDiscoveryArtifact} from '../policy/discovery-grant-validation.js';
import {assertRunGrantArtifact} from '../policy/run-grant-validation.js';
import {dirname,basename} from 'node:path';
import type {Store} from '../storage/store.js';
import {digest} from '../storage/store.js';
import type {Artifact,Approval,Evidence,Experiment,Row,Session,SourceRevision,Task,Team,ResearchBriefRef} from '../domain/types.js';
import type {SandboxJob} from '../execution/contracts.js';
import {ensure} from '../domain/errors.js';
import {assertExperimentSourceCurrent} from '../policy/lifecycle.js';
import {verifySnapshot} from '../workspace/files.js';
import {readStableFile} from '../workspace/stable-file.js';
import {assertAcceptanceCurrent} from '../evidence/acceptance.js';
import {assertWorkingGrantJob} from '../policy/working-grant-validation.js';
import {fixedResearchBrief} from '../research-workflows/briefs.js';
import type {ResearchSourceInput} from '../research-workflows/source-inputs.js';
import {DEVELOPMENT_REVIEW_PROTOCOL,BEARING_REVIEW_PROTOCOL,buildReviewInventory,validateDevelopmentAssessment,type ReviewTestArtifact,type ReviewInventory} from './review-assessment.js';
import {assertFrozenMethod,assertDevelopmentMethodArchive,methodRequiredPaths,closedPaired} from '../research-workflows/method-contracts.js';
import type {DraftRole,ProtocolDocument} from '../research-workflows/method-contracts.js';

export interface DevelopmentReview {
    jobId:string;sourceDigest:string;producerSessionId:string;baseSourceRevisionId?:string;
    teamId:string;taskId:string;approvalId:string;manifestEvidenceId:string;testEvidenceIds:string[];requiredEvidenceIds:string[];digest:string;
    dataArtifacts?:Array<Omit<SandboxJob['manifest']['dataArtifacts'][number],'path'>>;
    protocolVersion?:1|2;briefArtifact?:{id:string;digest:string;size:number;path:string};surfaceInventory?:ReviewInventory;researchBrief?:ResearchBriefRef;sourceInputs?:ResearchSourceInput[];testArtifacts?:ReviewTestArtifact[];
    draftRoles?:DraftRole[];protocolDocument?:ProtocolDocument;
}
const bearingBinding=(r:Pick<DevelopmentReview,'briefArtifact'|'surfaceInventory'>)=>r.surfaceInventory===undefined?{}:{briefArtifact:r.briefArtifact,surfaceInventory:r.surfaceInventory};
export function reviewInputBinding(r:Pick<DevelopmentReview,'jobId'|'dataArtifacts'|'protocolVersion'|'researchBrief'|'sourceInputs'|'testArtifacts'|'draftRoles'|'protocolDocument'|'briefArtifact'|'surfaceInventory'>&{id:string}) {return {reviewId:r.id,jobId:r.jobId,...bearingBinding(r),...(r.dataArtifacts===undefined?{}:{dataArtifacts:r.dataArtifacts}),...(r.protocolVersion===undefined?{}:{protocolVersion:r.protocolVersion,researchBrief:r.researchBrief,sourceInputs:r.sourceInputs,testArtifacts:r.testArtifacts}),...(r.protocolDocument===undefined?{}:{protocolDocument:r.protocolDocument,draftRoles:r.draftRoles})};}
export type DevelopmentReviewInputBinding=ReturnType<typeof reviewInputBinding>;
export function reviewPayload(r:DevelopmentReview) {const {jobId,sourceDigest,producerSessionId,baseSourceRevisionId,teamId,taskId,approvalId,manifestEvidenceId,testEvidenceIds,requiredEvidenceIds}=r;return {jobId,sourceDigest,producerSessionId,...bearingBinding(r),...(baseSourceRevisionId?{baseSourceRevisionId}:{}),teamId,taskId,approvalId,manifestEvidenceId,testEvidenceIds,requiredEvidenceIds,...(r.dataArtifacts===undefined?{}:{dataArtifacts:r.dataArtifacts}),...(r.protocolVersion===undefined?{}:{protocolVersion:r.protocolVersion,researchBrief:r.researchBrief,sourceInputs:r.sourceInputs,testArtifacts:r.testArtifacts}),...(r.protocolDocument===undefined?{}:{protocolDocument:r.protocolDocument,draftRoles:r.draftRoles})};}

/** Shared by dispatch and acceptance: historical records cannot silently acquire a new test target. */
export function assertDevelopmentReviewTarget(store:Store,pid:string,r:Row<DevelopmentReview>) {
    ensure(digest(reviewPayload(r))===r.digest,'DEVELOPMENT_REVIEW_CORRUPTED','审查绑定摘要已改变');
    const job=store.get<SandboxJob>('sandbox-job',r.jobId,pid),s=store.get<Session>('session',r.producerSessionId,pid);
    assertWorkingGrantJob(store,job,false);
    ensure(s.role==='coordinator'&&!s.taskId&&job.sessionId===s.id&&job.manifest.sessionId===s.id&&!job.manifest.scopeTaskId&&s.sourceRevisionId===r.baseSourceRevisionId&&job.manifest.sourceRevisionId===r.baseSourceRevisionId,'DEVELOPMENT_REVIEW_STALE','审查生产者或源码来源已改变');
    ensure(job.state==='succeeded'&&job.integrity==='complete'&&job.exitCode===0&&job.sourceDigest===r.sourceDigest&&job.manifest.inputSnapshot.digest===r.sourceDigest&&digest(job.manifest.inputSnapshot.files)===r.sourceDigest&&digest(job.manifest)===job.manifestDigest,'DEVELOPMENT_REVIEW_STALE','审查测试不是当前成功且完整的固定源码结果');
    const grant=store.get<Approval>('approval',job.grantId,pid);ensure(grant.status==='approved'&&grant.scope==='development.test'&&grant.subjectKind==='development-task'&&grant.subjectId===job.developmentTaskId&&grant.digest===job.manifestDigest,'APPROVAL_STALE','开发测试审批已失效');
    if(job.manifest.metricArtifact&&job.manifest.researchBrief&&fixedResearchBrief(store,pid,job.manifest.researchBrief).sourceInputs!==undefined)ensure(r.protocolVersion===DEVELOPMENT_REVIEW_PROTOCOL||r.protocolVersion===BEARING_REVIEW_PROTOCOL,'DEVELOPMENT_REVIEW_STALE','来源绑定的科学测试必须使用原固定审查协议，不能降级为旧accept');
    if(r.dataArtifacts!==undefined){
        const manifest=store.get<Evidence>('evidence',r.manifestEvidenceId,pid);let fixed:{reviewId?:string;dataArtifacts?:unknown};
        try{fixed=JSON.parse(manifest.quote);}catch{ensure(false,'DEVELOPMENT_REVIEW_CORRUPTED','固定审查输入清单已损坏');}
        ensure(fixed&&typeof fixed==='object','DEVELOPMENT_REVIEW_CORRUPTED','固定审查输入清单无效');
        ensure(digest(r.dataArtifacts)===digest(job.manifest.dataArtifacts.map(({path,...a})=>a))&&fixed.reviewId===r.id&&digest(fixed.dataArtifacts)===digest(r.dataArtifacts),'DEVELOPMENT_REVIEW_STALE','审查数据输入与原测试或获批清单不符');
        const team=store.get<Team>('team',r.teamId,pid),plan=store.list<{teamId:string;digest:string;developmentReviewInputs?:unknown}>('team-plan',pid).find(p=>p.teamId===r.teamId);
        ensure(plan&&plan.digest===team.planDigest&&digest(plan.developmentReviewInputs)===digest(reviewInputBinding(r)),'DEVELOPMENT_REVIEW_STALE','精确审查数据输入未绑定原团队批准计划');
    }
    if(r.protocolVersion!==undefined){
        ensure((r.protocolVersion===DEVELOPMENT_REVIEW_PROTOCOL||r.protocolVersion===BEARING_REVIEW_PROTOCOL)&&r.researchBrief&&digest(r.researchBrief)===digest(job.manifest.researchBrief)&&r.researchBrief.rootSessionId===s.id,'DEVELOPMENT_REVIEW_STALE','科学审查协议或研究计划引用与测试不符');
        const brief=fixedResearchBrief(store,pid,r.researchBrief);ensure(brief.sourceInputs!==undefined&&digest(brief.sourceInputs)===digest(r.sourceInputs),'DEVELOPMENT_REVIEW_STALE','审查研究输入不是原固定计划来源');
        if(closedPaired(brief.methodContract)){ensure(r.protocolVersion===BEARING_REVIEW_PROTOCOL&&r.briefArtifact&&r.surfaceInventory,'DEVELOPMENT_REVIEW_STALE','闭合profile不能降级原五区协议或遗漏全部表面');const a=store.get<Artifact>('artifact',r.briefArtifact.id,pid),path=store.paths.physical(a.path),bytes=readStableFile(dirname(path),basename(path),2*1024*1024);ensure(a.origin==='host:development-review'&&a.digest===r.briefArtifact.digest&&a.size===r.briefArtifact.size&&bytes.equals(Buffer.from(JSON.stringify(brief,null,2)))&&digest(bytes)===a.digest&&digest(buildReviewInventory(store,pid,r))===digest(r.surfaceInventory),'DEVELOPMENT_REVIEW_STALE','固定brief全文或全部输出inventory不再准确');}
        const wrapper=JSON.parse(store.get<Evidence>('evidence',r.manifestEvidenceId,pid).quote);if(r.protocolVersion===BEARING_REVIEW_PROTOCOL)ensure(digest(wrapper.briefArtifact)===digest(r.briefArtifact)&&digest(wrapper.surfaceInventory)===digest(r.surfaceInventory),'DEVELOPMENT_REVIEW_STALE','批准清单未绑定准确全文/inventory');ensure(wrapper.protocolVersion===r.protocolVersion&&digest(wrapper.researchBrief)===digest(r.researchBrief)&&digest(wrapper.sourceInputs)===digest(r.sourceInputs)&&digest(wrapper.testArtifacts)===digest(r.testArtifacts),'DEVELOPMENT_REVIEW_STALE','审查清单未绑定准确协议、来源和测试产物');
        if(brief.protocolDocument)ensure(digest(r.protocolDocument)===digest(brief.protocolDocument)&&digest(r.draftRoles)===digest(brief.draftRoles)&&digest(wrapper.protocolDocument)===digest(r.protocolDocument)&&digest(wrapper.draftRoles)===digest(r.draftRoles),'DEVELOPMENT_REVIEW_STALE','完整protocol角色/全文绑定不能被降级或替换');
        const metrics=job.artifactIds.map(id=>store.get<Artifact>('artifact',id,pid)).filter(a=>a.title===`output/${job.manifest.metricArtifact}`);
        ensure(metrics.length===1&&r.testArtifacts&&new Set(r.testArtifacts.map(a=>a.id)).size===r.testArtifacts.length,'DEVELOPMENT_REVIEW_STALE','指标产物或测试归档绑定缺失');
        const required=r.protocolVersion===BEARING_REVIEW_PROTOCOL?[...job.artifactIds]:[job.reportArtifactId,metrics[0].id,...(brief.methodContract?methodRequiredPaths(brief.methodContract).map(path=>{const match=job.artifactIds.map(id=>store.get<Artifact>('artifact',id,pid)).filter(a=>a.title===`output/${path}`);ensure(match.length===1,'METHOD_RESULT_CORRUPTED',`缺少唯一的方法审查产物：${path}`);return match[0].id;}):[])];ensure(digest(r.testArtifacts.filter(a=>a.required).map(a=>a.id).sort())===digest(required.sort()),'DEVELOPMENT_REVIEW_STALE','必须固定原测试报告、实际指标和规范方法产物');
        assertDevelopmentMethodArchive(store,job,brief.methodContract,assertFrozenMethod(store,pid,brief.methodContract,brief.sourceInputs)?.protocol);
        for(const bound of r.testArtifacts){const a=store.get<Artifact>('artifact',bound.id,pid);ensure(job.artifactIds.includes(a.id)&&a.digest===bound.digest&&a.size===bound.size&&a.title===bound.path,'DEVELOPMENT_REVIEW_STALE','测试产物不属于原准确归档');}
    }
    if(r.baseSourceRevisionId){const source=store.get<SourceRevision>('source-revision',r.baseSourceRevisionId,pid);ensure(source.sourceDigest===source.snapshot.digest&&digest(source.snapshot.files)===source.sourceDigest,'SNAPSHOT_CORRUPTED','基础源码摘要已改变');assertExperimentSourceCurrent(store,store.get<Experiment>('experiment',source.experimentId,pid));verifySnapshot(store.paths.physical(source.snapshot.path),source.snapshot.files);}
    verifySnapshot(store.paths.physical(job.manifest.inputSnapshot.path),job.manifest.inputSnapshot.files);
    for(const a of job.manifest.dataArtifacts){const actual=store.get<Artifact>('artifact',a.id,pid),bytes=readStableFile(dirname(store.paths.physical(actual.path)),basename(store.paths.physical(actual.path)),32*1024*1024);assertRunGrantArtifact(store,pid,actual);assertDiscoveryArtifact(store,pid,actual);ensure(actual.path===a.path&&actual.digest===a.digest&&actual.size===a.size&&bytes.length===a.size&&digest(bytes)===a.digest,'ARTIFACT_CORRUPTED','测试输入数据已改变');if(a.sourceAcceptanceId)assertAcceptanceCurrent(store,pid,a.sourceAcceptanceId);}
    for(const id of job.artifactIds){const a=store.get<Artifact>('artifact',id,pid),bytes=readStableFile(dirname(store.paths.physical(a.path)),basename(store.paths.physical(a.path)),32*1024*1024);ensure(bytes.length===a.size&&digest(bytes)===a.digest,'ARTIFACT_CORRUPTED','测试归档已改变');}
    for(const id of r.requiredEvidenceIds){const e=store.get<Evidence>('evidence',id,pid),a=store.get<Artifact>('artifact',e.artifactId,pid),bytes=readStableFile(dirname(store.paths.physical(a.path)),basename(store.paths.physical(a.path)),2*1024*1024);ensure(digest(bytes)===a.digest&&a.digest===e.digest&&bytes.toString('utf8').slice(e.locator.start,e.locator.end)===e.quote,'EVIDENCE_INVALID','审查输入证据已改变');}
    const task=store.get<Task>('task',r.taskId,pid),team=store.get<Team>('team',r.teamId,pid);
    ensure(task.reviewId===r.id&&task.role==='reviewer'&&task.teamId===team.id&&team.rootSessionId===s.id&&team.approvalId===r.approvalId&&digest(task.inputEvidenceIds??[])===digest(r.requiredEvidenceIds),'DEVELOPMENT_REVIEW_STALE','审查任务不再绑定固定目标');
    if(task.sessionId){const reviewer=store.get<Session>('session',task.sessionId,pid);ensure(reviewer.id!==s.id&&reviewer.role==='reviewer'&&reviewer.taskId===task.id,'REVIEW_NOT_INDEPENDENT','审查必须由独立 Reviewer 会话完成');}
    return {job,task,team};
}
export function developmentReviewAcceptanceBasis(store:Store,pid:string,task:Row<Task>) {
    if(!task.reviewId)return undefined;
    const review=store.get<DevelopmentReview>('development-review',task.reviewId,pid),target=assertDevelopmentReviewTarget(store,pid,review),approval=store.get<Approval>('approval',review.approvalId,pid);
    ensure(target.task.id===task.id&&approval.status==='approved'&&approval.digest===target.team.planDigest&&approval.scope==='collaboration'&&approval.subjectId===target.team.id,'APPROVAL_STALE','审查计划审批已失效');
    ensure(task.result?.outcome==='completed'&&task.result.verdict==='accept'&&review.requiredEvidenceIds.every(id=>task.result!.evidenceIds.includes(id)),'DEVELOPMENT_REVIEW_NOT_PASSED','必须完成独立审查、接受并引用全部必要输入');
    validateDevelopmentAssessment(store,pid,review,task,task.result);
    return {reviewId:review.id,digest:review.digest,jobId:review.jobId,sourceDigest:review.sourceDigest,manifestEvidenceId:review.manifestEvidenceId,testEvidenceIds:review.testEvidenceIds,inputAcceptanceIds:target.job.manifest.dataArtifacts.flatMap(a=>a.sourceAcceptanceId?[a.sourceAcceptanceId]:[])};
}
