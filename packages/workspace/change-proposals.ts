import {captureAcceptance,assertAcceptanceCurrent} from '../evidence/acceptance.js';
import {randomUUID} from 'node:crypto';
import {mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import type {ResearchApp} from '../research-app.js';
import type {Actor,Artifact,Task,Row,Experiment,ChangeProposal} from '../domain/types.js';
import type {SandboxJob} from '../execution/contracts.js';
import {scope,userOnly} from '../policy/permissions.js';
import {ensure} from '../domain/errors.js';
import {object,text,integer} from '../contracts/validation.js';
import {digest} from '../storage/store.js';
import {safePath,snapshotDirectory,verifySnapshot,setSourceModes} from './files.js';
import {readStableFile} from './stable-file.js';
import {validateSourceRevision} from './source-access.js';

/** Immutable, explicitly reviewed file handoff. This is NOT a Git merge or a test runner. */
export class ChangeProposalService {
    constructor(private app:ResearchApp){}
    get(actor:Actor,id:string){const p=this.app.store.get<ChangeProposal>('change-proposal',id);scope(actor,p.projectId!);return p;}
    private payload(p:ChangeProposal){const {baseExperimentId,baseRevision,baseSnapshot,contractDigest,title,hypothesis,changes,candidateSnapshot}=p;return {baseExperimentId,baseRevision,baseSnapshot,contractDigest,title,hypothesis,changes,candidateSnapshot,...(p.testJobId?{testJobId:p.testJobId}:{}),...(p.flow?{flow:p.flow,reviewId:p.reviewId,reviewAcceptanceId:p.reviewAcceptanceId}:{})};}
    private content(actor:Actor,projectId:string,id:string){
        const a=this.app.store.get<Artifact>('artifact',id,projectId);
        if(actor.type==='agent'){
            ensure(actor.role==='coordinator' && !actor.taskId && !actor.wakeupId,'TOOL_DENIED','只有交互式主协调者可以准备整合提案',403);
            ensure(a.taskId || a.origin===`agent:${actor.sessionId}` || a.origin==='user','CHANGE_SOURCE_DENIED','必须选用本会话、用户提供或已验收任务的产物',403);
        }
        let taskResultDigest:string|undefined,sourceAcceptanceId:string|undefined;
        if(a.taskId){const t=this.app.store.get<Task>('task',a.taskId,projectId);ensure(t.acceptance==='accepted' && t.execution==='output_submitted' && t.result?.artifactIds.includes(a.id),'TASK_NOT_ACCEPTED','只能整合当前已验收任务明确交付的产物');taskResultDigest=digest(t.result);sourceAcceptanceId=captureAcceptance(this.app.store,projectId,t.id).id;}
        const {bytes}=this.app.evidence.read(actor,a.id);
        ensure(bytes.length===a.size && bytes.length<=2*1024*1024 && !bytes.includes(0),'CHANGE_TEXT_REQUIRED','当前整合仅接受不超过 2 MiB 的 UTF-8 文本文件',400);
        new TextDecoder('utf-8',{fatal:true}).decode(bytes);
        return {artifact:a,bytes,taskResultDigest,sourceAcceptanceId};
    }
    prepare(actor:Actor,projectId:string,value:unknown){
        scope(actor,projectId);
        ensure(actor.type==='user'||actor.type==='agent'&&actor.role==='coordinator'&&!actor.taskId&&!actor.wakeupId,'TOOL_DENIED','此操作需要用户或交互式主协调者',403);
        const project=this.app.projects.get(actor,projectId);ensure(!project.archived,'PROJECT_ARCHIVED','项目已归档');
        const x=object(value),base=this.app.store.get<Experiment>('experiment',text(x.baseExperimentId,'baseExperimentId',100),projectId);
        ensure(x.flow===undefined&&x.reviewId===undefined&&x.reviewAcceptanceId===undefined,'CHANGE_FLOW_REQUIRED','受审整合只能从固定审查记录准备',400);
        ensure(base.lifecycle!=='archived','EXPERIMENT_ARCHIVED','基准实验已归档');
        ensure(base.revision===integer(x.expectedRevision,'expectedRevision',1),'CHANGE_BASE_STALE','基准代码版本已变化');
        const title=text(x.title,'title',200),hypothesis=text(x.hypothesis,'hypothesis',10000),testJobId=x.testJobId===undefined?undefined:text(x.testJobId,'testJobId',100);
        ensure(Array.isArray(x.changes)&&x.changes.length>0&&x.changes.length<=50,'CHANGE_INVALID','需要 1–50 个明确的文件变更',400);
        const root=join(this.app.context.dataDir,'snapshots'),baseSnapshot=snapshotDirectory(base.workspace,root);
        const paths=new Set<string>();
        const changes=x.changes.map(raw=>{
            const c=object(raw),path=text(c.path,'path',1000);ensure(path.split('/').every(Boolean),'PATH_DENIED','变更路径必须是无重复分隔符的规范相对路径',403);safePath(base.workspace,path);
            ensure(!paths.has(path) && ![...paths].some(p=>p.startsWith(path+'/')||path.startsWith(p+'/')),'CHANGE_PATH_CONFLICT','同一提案中的文件路径重复或互相覆盖');paths.add(path);
            const old=baseSnapshot.files.find(f=>f.path===path),expectedDigest=c.expectedDigest===null?null:text(c.expectedDigest,'expectedDigest',64);
            ensure((old?.digest??null)===expectedDigest,'FILE_VERSION_CONFLICT','文件与提案所基于的版本不一致');
            if(c.artifactId===null){ensure(!!old,'CHANGE_INVALID','不能删除不存在的文件');return {path,expectedDigest,artifactId:null,artifactDigest:null};}
            const content=this.content(actor,projectId,text(c.artifactId,'artifactId',100));
            return {path,expectedDigest,artifactId:content.artifact.id,artifactDigest:content.artifact.digest,...(content.artifact.taskId?{taskId:content.artifact.taskId,taskResultDigest:content.taskResultDigest,sourceAcceptanceId:content.sourceAcceptanceId}:{})};
        });
        const staging=join(this.app.context.dataDir,'integration-staging',randomUUID());
        mkdirSync(staging,{recursive:true,mode:0o700});
        try{
            for(const f of baseSnapshot.files){const dst=safePath(staging,f.path);mkdirSync(dirname(dst),{recursive:true});writeFileSync(dst,readStableFile(baseSnapshot.path,f.path,64*1024*1024),{mode:0o600});}
            setSourceModes(staging,baseSnapshot.files);
            for(const c of changes){const dst=safePath(staging,c.path);if(c.artifactId===null)rmSync(dst);else{const {bytes}=this.content(actor,projectId,c.artifactId);ensure(digest(bytes)===c.artifactDigest,'ARTIFACT_CORRUPTED','准备过程中产物发生变化');mkdirSync(dirname(dst),{recursive:true});writeFileSync(dst,bytes,{mode:0o600});}}
            const candidateSnapshot=snapshotDirectory(staging,root);
            ensure(candidateSnapshot.digest!==baseSnapshot.digest,'CHANGE_EMPTY','提案没有实际改变源码');
            ensure(snapshotDirectory(base.workspace,root).digest===baseSnapshot.digest,'CHANGE_BASE_STALE','准备过程中基准源码发生变化');
            return this.app.store.transaction(()=>{
                for(const c of changes) if('sourceAcceptanceId' in c && c.sourceAcceptanceId) assertAcceptanceCurrent(this.app.store,projectId,c.sourceAcceptanceId);
                ensure(this.app.store.get<Experiment>('experiment',base.id).revision===base.revision,'CHANGE_BASE_STALE','基准版本已变化');
                if(testJobId)this.app.development.assertResultMatches(actor,projectId,testJobId,candidateSnapshot.digest);
                const data={...(testJobId?{testJobId}:{}),baseExperimentId:base.id,baseRevision:base.revision,baseSnapshot,contractDigest:base.contractDigest,title,hypothesis,changes,candidateSnapshot};
                const id=randomUUID(),hash=digest(data),a=this.app.approvals.request(projectId,'change-proposal',id,hash,'change.integrate','审阅固定变更后创建新子实验；不执行测试、不自动运行、不修改父实验');
                const proposal=this.app.store.create<ChangeProposal>('change-proposal',projectId,{...data,digest:hash,approvalId:a.id,state:'prepared',testsStatus:testJobId?'passed':'not_run'},id);
                this.app.store.event(projectId,'change.prepared',{proposalId:id,baseExperimentId:base.id,candidateDigest:candidateSnapshot.digest});return proposal;
            });
        }finally{rmSync(staging,{recursive:true,force:true});rmSync(staging+'.source-modes.json',{force:true});}
    }
    /** The reviewed flow derives the entire candidate from tested CAS, never caller-supplied file mappings. */
    prepareReviewed(actor:Actor,projectId:string,value:unknown) {
        scope(actor,projectId);ensure(actor.type==='user'||actor.type==='agent'&&actor.role==='coordinator'&&!actor.taskId&&!actor.wakeupId,'TOOL_DENIED','受审整合需要用户或交互式主协调者',403);const x=object(value);ensure(Object.keys(x).every(k=>['reviewId','title','hypothesis'].includes(k)),'INVALID_INPUT','受审整合只接受审查 ID、名称和假设',400);
        const reviewId=text(x.reviewId,'reviewId',100),title=text(x.title,'title',200),hypothesis=text(x.hypothesis,'hypothesis',10000);
        return this.app.store.transaction(()=>{
            const review=this.app.developmentReviews.inspect(actor,projectId,reviewId),proof=this.app.developmentReviews.assertPassed(actor,projectId,reviewId,review.sourceDigest);
            const job=this.app.store.get<SandboxJob>('sandbox-job',proof.jobId,projectId),sourceId=job.manifest.sourceRevisionId;
            ensure(sourceId,'CHANGE_SOURCE_REQUIRED','先从明确实验版本准备实现，才能自动整合受审候选');
            const source=validateSourceRevision(this.app.context,projectId,sourceId),base=this.app.store.get<Experiment>('experiment',source.experimentId,projectId);
            this.app.projects.get(actor,projectId);ensure(base.lifecycle!=='archived'&&base.revision===source.revision,'CHANGE_BASE_STALE','原实验版本已变化或归档，请重新准备');
            const baseSnapshot=source.snapshot,candidateSnapshot=job.manifest.inputSnapshot;
            ensure(snapshotDirectory(base.workspace,join(this.app.context.dataDir,'snapshots'),{legacy:baseSnapshot.files.every(f=>f.mode===undefined)}).digest===baseSnapshot.digest,'CHANGE_BASE_STALE','原实验工作目录与固定来源不一致');
            this.app.development.assertResultMatches(actor,projectId,job.id,candidateSnapshot.digest);
            verifySnapshot(candidateSnapshot.path,candidateSnapshot.files);
            const before=new Map(baseSnapshot.files.map(f=>[f.path,f])),after=new Map(candidateSnapshot.files.map(f=>[f.path,f])),changes:ChangeProposal['changes']=[];
            for(const path of [...new Set([...before.keys(),...after.keys()])].sort()) {
                const a=before.get(path),b=after.get(path);
                if(a&&b&&a.digest===b.digest&&(a.mode??'100644')===(b.mode??'100644'))continue;
                ensure(changes.length<50,'CHANGE_INVALID','受审整合当前最多50个变更文件',400);
                if(!b){changes.push({path,expectedDigest:a!.digest,artifactId:null,artifactDigest:null,...(a?.mode?{beforeMode:a.mode}:{})});continue;}
                const bytes=readStableFile(candidateSnapshot.path,path,2*1024*1024);ensure(bytes.length===b.size&&digest(bytes)===b.digest&&!bytes.includes(0),'CHANGE_TEXT_REQUIRED','变更源码必须是完整 UTF-8 文本文件',400);
                new TextDecoder('utf-8',{fatal:true}).decode(bytes);
                const artifact=this.app.evidence.put(projectId,path,bytes,'text/plain',`development-source:${job.id}`);
                changes.push({path,expectedDigest:a?.digest??null,artifactId:artifact.id,artifactDigest:artifact.digest,mode:b.mode??'100644',...(a?.mode?{beforeMode:a.mode}:{})});
            }
            ensure(changes.length>0,'CHANGE_EMPTY','测试候选与基准源码没有实际变化');
            const data={flow:'reviewed-development' as const,reviewId,reviewAcceptanceId:proof.reviewAcceptanceId,testJobId:job.id,baseExperimentId:base.id,baseRevision:base.revision,baseSnapshot,contractDigest:base.contractDigest,title,hypothesis,changes,candidateSnapshot};
            const id=randomUUID(),hash=digest(data),approval=this.app.approvals.request(projectId,'change-proposal',id,hash,'change.integrate','审阅已测试且独立审查通过的固定源码，批准后创建新子实验；正式运行仍需另行批准');
            const proposal=this.app.store.create<ChangeProposal>('change-proposal',projectId,{...data,digest:hash,approvalId:approval.id,state:'prepared',testsStatus:'passed'},id);
            this.app.store.event(projectId,'change.reviewed_prepared',{proposalId:id,reviewId,testJobId:job.id,candidateDigest:candidateSnapshot.digest});return proposal;
        });
    }
    inspect(actor:Actor,id:string){const p=this.get(actor,id);ensure(digest(this.payload(p))===p.digest,'CHANGE_PROPOSAL_CORRUPTED','变更提案摘要不一致');return {proposal:p,files:p.changes.map(c=>({path:c.path,expectedDigest:c.expectedDigest,artifactDigest:c.artifactDigest,beforeMode:c.beforeMode,afterMode:c.mode,before:c.expectedDigest?readStableFile(p.baseSnapshot.path,c.path,2*1024*1024).toString('utf8'):null,after:c.artifactId?this.app.evidence.read(actor,c.artifactId).bytes.toString('utf8'):null}))};}
    apply(actor:Actor,id:string){
        userOnly(actor);
        return this.app.store.transaction(()=>{
            const p=this.get(actor,id);ensure(digest(this.payload(p))===p.digest,'CHANGE_PROPOSAL_CORRUPTED','变更提案已被改变');
            if(p.state==='applied')return this.app.experiments.get(actor,p.appliedExperimentId!);
            ensure(p.sourceValidity!=='stale','CHANGE_SOURCE_STALE','提案的来源审查已撤销，需重新准备并批准');
            ensure(!this.app.projects.get(actor,p.projectId!).archived,'PROJECT_ARCHIVED','项目已归档');
            this.app.approvals.assert(p.approvalId,p.projectId!,p.id,p.digest,'change.integrate');
            const base=this.app.experiments.get(actor,p.baseExperimentId);
            ensure(base.lifecycle!=='archived' && base.revision===p.baseRevision && base.contractDigest===p.contractDigest && snapshotDirectory(base.workspace,join(this.app.context.dataDir,'snapshots'),{legacy:p.baseSnapshot.files.every(f=>f.mode===undefined)}).digest===p.baseSnapshot.digest,'CHANGE_BASE_STALE','基准已经变化，请基于新版本重新准备和批准');
            for(const c of p.changes)if(c.artifactId){const v=this.content(actor,p.projectId!,c.artifactId);ensure(v.artifact.digest===c.artifactDigest && v.taskResultDigest===c.taskResultDigest && v.sourceAcceptanceId===c.sourceAcceptanceId,'CHANGE_SOURCE_STALE','产物或任务验收已发生变化');}
            verifySnapshot(p.candidateSnapshot.path,p.candidateSnapshot.files);
            if(p.testJobId)this.app.development.assertResultMatches(actor,p.projectId!,p.testJobId,p.candidateSnapshot.digest);
            if(p.flow==='reviewed-development') {
                ensure(p.reviewId&&p.reviewAcceptanceId&&p.testJobId,'REVIEW_REQUIRED','受审提案缺少固定审查或测试');
                assertAcceptanceCurrent(this.app.store,p.projectId!,p.reviewAcceptanceId);
                const proof=this.app.developmentReviews.assertPassed(actor,p.projectId!,p.reviewId,p.candidateSnapshot.digest);
                ensure(proof.reviewAcceptanceId===p.reviewAcceptanceId&&proof.jobId===p.testJobId,'CHANGE_SOURCE_STALE','审查或开发测试绑定已经变化');
            }
            const child=this.app.experiments.createApprovedChild(actor,p);
            this.app.store.update<ChangeProposal>('change-proposal',p.id,p.version,{state:'applied',appliedExperimentId:child.id});
            this.app.store.event(p.projectId,'change.applied',{proposalId:p.id,experimentId:child.id});return child;
        });
    }
}
