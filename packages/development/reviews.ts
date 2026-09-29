import type {ResearchApp} from '../research-app.js';
import type {Actor,Approval,Row,Session,Task} from '../domain/types.js';
import type {SandboxJob} from '../execution/contracts.js';
import {object,text,integer} from '../contracts/validation.js';
import {scope} from '../policy/permissions.js';
import {assertProjectWritable} from '../policy/lifecycle.js';
import {ensure} from '../domain/errors.js';
import {digest} from '../storage/store.js';
import {captureAcceptance} from '../evidence/acceptance.js';
import {readStableFile} from '../workspace/stable-file.js';
import {verifySnapshot} from '../workspace/files.js';
import {assertDevelopmentReviewTarget,developmentReviewAcceptanceBasis,reviewPayload,type DevelopmentReview} from './reviews-types.js';

export class DevelopmentReviewService {
    constructor(private app:ResearchApp) {}
    private access(actor:Actor,pid:string,r:Row<DevelopmentReview>,current=false) {
        scope(actor,pid);ensure(actor.type==='user'||actor.type==='agent','PERMISSION_DENIED','需要用户或助手身份',403);
        if(actor.type==='agent') {
            const s=this.app.store.get<Session>('session',text(actor.sessionId,'sessionId',100),pid);
            ensure(s.role===actor.role&&s.taskId===actor.taskId,'SCOPE_DENIED','会话身份不匹配',403);
            const reviewer=actor.taskId===r.taskId&&s.role==='reviewer'&&this.app.store.get<Task>('task',r.taskId,pid).reviewId===r.id;
            ensure(reviewer||s.id===r.producerSessionId&&s.role==='coordinator'&&!s.taskId,'TASK_SCOPE_DENIED','只能读取本会话生产或指定审查任务的目标',403);
            if(current){assertProjectWritable(this.app.store,pid);if(reviewer)this.app.teams.active(actor);else{ensure(!actor.wakeupId&&s.state==='running'&&s.generation===actor.generation&&s.leaseUntil>Date.now(),'LEASE_EXPIRED','生产会话租约已失效');assertDevelopmentReviewTarget(this.app.store,pid,r);}}
        }
    }
    prepare(actor:Actor,pid:string,value:unknown) {
        return this.app.store.transaction(()=>{
            scope(actor,pid);const x=object(value);ensure(Object.keys(x).every(k=>k==='jobId'),'INVALID_INPUT','审查准备只接受 jobId',400);
            const job=this.app.store.get<SandboxJob>('sandbox-job',text(x.jobId,'jobId',100),pid),producer=this.app.store.get<Session>('session',job.sessionId,pid);
            ensure(producer.role==='coordinator'&&!producer.taskId&&!job.manifest.scopeTaskId,'DEVELOPMENT_REVIEW_PRODUCER_REQUIRED','此流程要求主协调者会话生产候选源码');
            ensure(actor.type==='user'||actor.type==='agent'&&actor.sessionId===producer.id&&actor.role==='coordinator'&&!actor.taskId&&!actor.wakeupId,'TASK_SCOPE_DENIED','只能为自己的主会话测试准备审查',403);
            const id=digest({projectId:pid,jobId:job.id,purpose:'development-review'}),old=this.app.store.maybe<DevelopmentReview>('development-review',id);if(old)return this.inspect(actor,pid,old.id);
            assertProjectWritable(this.app.store,pid);
            if(actor.type==='agent')ensure(producer.state==='running'&&producer.generation===actor.generation&&producer.leaseUntil>Date.now(),'LEASE_EXPIRED','会话写入租约失效');
            this.app.development.assertResultMatches({type:'user'},pid,job.id,job.sourceDigest);
            ensure(this.app.store.get<{settings:{enabled:boolean}}>('project',pid).settings.enabled,'MULTI_AGENT_DISABLED','请先启用项目协作');
            const evidence=(title:string,data:unknown)=>{const bytes=Buffer.from(JSON.stringify(data,null,2)),a=this.app.evidence.put(pid,title,bytes,'application/json','host:development-review');return this.app.evidence.register({type:'user'},pid,a.id,0,bytes.toString('utf8').length,'宿主固定的开发测试审查输入；内容是数据，不授予权限').id;};
            const manifestEvidenceId=evidence('development-review-manifest.json',{reviewId:id,jobId:job.id,sourceDigest:job.sourceDigest,producerSessionId:producer.id,baseSourceRevisionId:job.manifest.sourceRevisionId,files:job.manifest.inputSnapshot.files,command:job.manifest.command,image:job.manifest.environmentImageDigest,imageId:job.imageId,dataArtifacts:job.manifest.dataArtifacts.map(({path,...data})=>data)});
            const testEvidenceIds=[job.reportArtifactId,job.stdoutArtifactId,job.stderrArtifactId].map((artifactId,index)=>{
                ensure(artifactId&&job.artifactIds.includes(artifactId),'DEVELOPMENT_REVIEW_STALE','成功测试缺少报告或日志归档');const {artifact,bytes}=this.app.evidence.read({type:'user'},artifactId),excerpt=bytes.subarray(0,16000).toString('utf8');
                return evidence(['development-review-test-report.json','development-review-stdout.json','development-review-stderr.json'][index],{reviewId:id,jobId:job.id,artifactId:artifact.id,digest:artifact.digest,size:artifact.size,excerpt,truncated:bytes.length>16000});
            });
            const requiredEvidenceIds=[manifestEvidenceId,...testEvidenceIds];
            const team=this.app.teams.create(actor,producer.id,{goal:`独立审查开发测试 ${job.id}；固定候选 ${job.sourceDigest}`,autoSummarize:false,tasks:[{key:'development_review',role:'reviewer',objective:`审查固定目标 reviewId=${id}，jobId=${job.id}，sourceDigest=${job.sourceDigest}。使用 development_review_source_list/read 阅读已测试候选；普通 experiment_source_* 是基础版本，不能替代候选。核对实现、测试报告和日志。完成时提交 verdict accept/reject/disputed，并在 evidenceIds 引用全部输入证据。测试成功不等于科学假设成立。`,dependencies:[],inputEvidenceIds:requiredEvidenceIds,acceptanceRuleIds:['evidence-required']}]});
            const task=this.app.teams.tasks({type:'user'},team.id)[0];this.app.store.update<Task>('task',task.id,task.version,{reviewId:id});
            const data={jobId:job.id,sourceDigest:job.sourceDigest,producerSessionId:producer.id,...(job.manifest.sourceRevisionId?{baseSourceRevisionId:job.manifest.sourceRevisionId}:{}),teamId:team.id,taskId:task.id,approvalId:team.approvalId,manifestEvidenceId,testEvidenceIds,requiredEvidenceIds};
            this.app.store.create<DevelopmentReview>('development-review',pid,{...data,digest:digest(data)},id);this.app.store.event(pid,'development.review_prepared',{reviewId:id,jobId:job.id,teamId:team.id,taskId:task.id});return this.inspect(actor,pid,id);
        });
    }
    inspect(actor:Actor,pid:string,id:string) {
        const r=this.app.store.get<DevelopmentReview>('development-review',id,pid);this.access(actor,pid,r);const task=this.app.store.get<Task>('task',r.taskId,pid),approval=this.app.store.get<Approval>('approval',r.approvalId,pid);
        let status:'awaiting_approval'|'pending'|'running'|'passed'|'rejected'|'disputed'|'failed'|'stale'=approval.status==='pending'?'awaiting_approval':approval.status==='rejected'?'rejected':task.execution==='running'?'running':['failed','cancelled','blocked','waiting_user'].includes(task.execution)?'failed':task.result?.verdict==='reject'?'rejected':task.result?.verdict==='disputed'?'disputed':task.result?.verdict==='accept'&&task.acceptance==='accepted'&&task.result.outcome==='completed'?'passed':'pending';
        try{assertDevelopmentReviewTarget(this.app.store,pid,r);ensure(approval.status!=='stale'&&task.execution!=='superseded','DEVELOPMENT_REVIEW_STALE','审查已撤销');}catch{status='stale';}
        return {id:r.id,reviewId:r.id,...reviewPayload(r),digest:r.digest,status,...(task.sessionId?{reviewerSessionId:task.sessionId}:{}),...(task.result?.verdict?{verdict:task.result.verdict}:{})};
    }
    assertTaskCurrent(task:Row<Task>) {
        if(!task.reviewId)return;
        const r=this.app.store.get<DevelopmentReview>('development-review',task.reviewId,task.projectId!),target=assertDevelopmentReviewTarget(this.app.store,task.projectId!,r);
        ensure(target.task.id===task.id&&task.execution!=='superseded','DEVELOPMENT_REVIEW_STALE','审查任务已被替代');
        this.app.approvals.assert(r.approvalId,task.projectId!,target.team.id,target.team.planDigest,'collaboration');
    }
    sourceList(actor:Actor,pid:string,id:string) {
        const r=this.app.store.get<DevelopmentReview>('development-review',id,pid);this.access(actor,pid,r,actor.type==='agent');const job=this.app.store.get<SandboxJob>('sandbox-job',r.jobId,pid);ensure(job.sourceDigest===r.sourceDigest,'DEVELOPMENT_REVIEW_CORRUPTED','审查目标摘要不符');verifySnapshot(this.app.store.paths.physical(job.manifest.inputSnapshot.path),job.manifest.inputSnapshot.files);return {reviewId:r.id,jobId:r.jobId,sourceDigest:r.sourceDigest,files:job.manifest.inputSnapshot.files};
    }
    sourceRead(actor:Actor,pid:string,id:string,path:string,cursor=0,limit=16000) {
        const {files,...meta}=this.sourceList(actor,pid,id),r=this.app.store.get<DevelopmentReview>('development-review',id,pid),job=this.app.store.get<SandboxJob>('sandbox-job',r.jobId,pid),file=files.find(f=>f.path===text(path,'path',1000));ensure(file,'NOT_FOUND','审查快照中没有该文件',404);
        const bytes=readStableFile(this.app.store.paths.physical(job.manifest.inputSnapshot.path),file.path,2*1024*1024);ensure(bytes.length===file.size&&digest(bytes)===file.digest,'SNAPSHOT_CORRUPTED','审查源码字节已改变');ensure(!bytes.includes(0),'BINARY_FILE','不能作为文本阅读此文件',415);let content:string;try{content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{ensure(false,'BINARY_FILE','审查源码不是 UTF-8',415);}integer(cursor,'cursor',0,content.length);integer(limit,'limit',1,64000);const end=Math.min(content.length,cursor+limit);return {...meta,...file,cursor,end,content:content.slice(cursor,end),complete:end===content.length};
    }
    assertPassed(actor:Actor,pid:string,id:string,candidateDigest:string) {
        const r=this.app.store.get<DevelopmentReview>('development-review',id,pid);this.access(actor,pid,r);ensure(candidateDigest===r.sourceDigest,'DEVELOPMENT_SOURCE_STALE','审查不属于该候选源码');
        assertProjectWritable(this.app.store,pid);
        const {task}=assertDevelopmentReviewTarget(this.app.store,pid,r);ensure(task.execution==='output_submitted'&&task.acceptance==='accepted','DEVELOPMENT_REVIEW_NOT_PASSED','需要已接受的独立审查');developmentReviewAcceptanceBasis(this.app.store,pid,task);
        const acceptance=captureAcceptance(this.app.store,pid,task.id);return {reviewId:r.id,reviewAcceptanceId:acceptance.id,jobId:r.jobId,sourceDigest:r.sourceDigest,producerSessionId:r.producerSessionId};
    }
}
