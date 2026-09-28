import {captureAcceptance,assertAcceptanceCurrent} from '../evidence/acceptance.js';
import {randomUUID} from 'node:crypto';
import {mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import type {ResearchApp} from '../research-app.js';
import type {Actor,Artifact,Task,Row,Experiment,ChangeProposal} from '../domain/types.js';
import {scope,userOnly} from '../policy/permissions.js';
import {ensure} from '../domain/errors.js';
import {object,text,integer} from '../contracts/validation.js';
import {digest} from '../storage/store.js';
import {safePath,snapshotDirectory,verifySnapshot} from './files.js';
import {readStableFile} from './stable-file.js';

/** Immutable, explicitly reviewed file handoff. This is NOT a Git merge or a test runner. */
export class ChangeProposalService {
    constructor(private app:ResearchApp){}
    get(actor:Actor,id:string){const p=this.app.store.get<ChangeProposal>('change-proposal',id);scope(actor,p.projectId!);return p;}
    private payload(p:ChangeProposal){const {baseExperimentId,baseRevision,baseSnapshot,contractDigest,title,hypothesis,changes,candidateSnapshot}=p;return {baseExperimentId,baseRevision,baseSnapshot,contractDigest,title,hypothesis,changes,candidateSnapshot,...(p.testJobId?{testJobId:p.testJobId}:{})};}
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
        }finally{rmSync(staging,{recursive:true,force:true});}
    }
    inspect(actor:Actor,id:string){const p=this.get(actor,id);ensure(digest(this.payload(p))===p.digest,'CHANGE_PROPOSAL_CORRUPTED','变更提案摘要不一致');return {proposal:p,files:p.changes.map(c=>({path:c.path,expectedDigest:c.expectedDigest,artifactDigest:c.artifactDigest,before:c.expectedDigest?readStableFile(p.baseSnapshot.path,c.path,2*1024*1024).toString('utf8'):null,after:c.artifactId?this.app.evidence.read(actor,c.artifactId).bytes.toString('utf8'):null}))};}
    apply(actor:Actor,id:string){
        userOnly(actor);
        return this.app.store.transaction(()=>{
            const p=this.get(actor,id);ensure(digest(this.payload(p))===p.digest,'CHANGE_PROPOSAL_CORRUPTED','变更提案已被改变');
            if(p.state==='applied')return this.app.experiments.get(actor,p.appliedExperimentId!);
            ensure(p.sourceValidity!=='stale','CHANGE_SOURCE_STALE','提案的来源审查已撤销，需重新准备并批准');
            ensure(!this.app.projects.get(actor,p.projectId!).archived,'PROJECT_ARCHIVED','项目已归档');
            this.app.approvals.assert(p.approvalId,p.projectId!,p.id,p.digest,'change.integrate');
            const base=this.app.experiments.get(actor,p.baseExperimentId);
            ensure(base.lifecycle!=='archived' && base.revision===p.baseRevision && base.contractDigest===p.contractDigest && snapshotDirectory(base.workspace,join(this.app.context.dataDir,'snapshots')).digest===p.baseSnapshot.digest,'CHANGE_BASE_STALE','基准已经变化，请基于新版本重新准备和批准');
            for(const c of p.changes)if(c.artifactId){const v=this.content(actor,p.projectId!,c.artifactId);ensure(v.artifact.digest===c.artifactDigest && v.taskResultDigest===c.taskResultDigest && v.sourceAcceptanceId===c.sourceAcceptanceId,'CHANGE_SOURCE_STALE','产物或任务验收已发生变化');}
            verifySnapshot(p.candidateSnapshot.path,p.candidateSnapshot.files);
            if(p.testJobId)this.app.development.assertResultMatches(actor,p.projectId!,p.testJobId,p.candidateSnapshot.digest);
            const child=this.app.experiments.createApprovedChild(actor,p);
            this.app.store.update<ChangeProposal>('change-proposal',p.id,p.version,{state:'applied',appliedExperimentId:child.id});
            this.app.store.event(p.projectId,'change.applied',{proposalId:p.id,experimentId:child.id});return child;
        });
    }
}
