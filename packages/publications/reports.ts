import type {ResearchApp} from '../research-app.js';
import type {PublicationBuildResult,ManuscriptRevision} from './build-types.js';
import {randomUUID} from 'node:crypto';
import {basename,dirname,isAbsolute} from 'node:path';
import {assertProjectWritable,assertExperimentSourceCurrent} from '../policy/lifecycle.js';
import {verifyRunRecord} from '../evidence/run-verifier.js';
import {verifyDocumentLink} from '../evidence/document-link.js';
import {checkDocumentVersion} from '../documents/parse-service.js';
import type {DocumentVersion} from '../documents/types.js';
import type {DocumentParseResult,DocumentParseJob} from '../documents/parse-types.js';
import {assertAcceptanceCurrent} from '../evidence/acceptance.js';
import type {AppContext} from '../domain/context.js';
import type {Actor,Run,Claim,Row,Artifact,Experiment,ChangeProposal,Evidence,Task,Approval} from '../domain/types.js';
import type {SandboxJob} from '../execution/contracts.js';
import type {DevelopmentReview} from '../development/reviews-types.js';
import {assertWorkingGrantJob} from '../policy/working-grants.js';
import type {GitSourceBinding} from '../workspace/git-types.js';
import {scope,userOnly} from '../policy/permissions.js';
import {object,text,strings,integer} from '../contracts/validation.js';
import {ensure,asError} from '../domain/errors.js';
import {digest} from '../storage/store.js';
import {readStableFile} from '../workspace/stable-file.js';
import {verifySnapshot,safePath} from '../workspace/files.js';
import type {EvidenceService} from '../evidence/service.js';
import type {ReportBindings,ReportReference,ReportRun,ReportRecord,ReportInspection,ReportExportCollection} from './report-types.js';

const clean=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const escaped=(value:string)=>value.replace(/([\\`*_{}\[\]()<>#!|])/g,'\\$1').replace(/\r?\n/g,' ');
const excluded=(path:string)=>path.split(/[\\/]/).some(p=>/^(\.git|\.git-credentials|\.ssh|\.aws|\.kube|\.docker|\.pi|\.pi-research|\.pi-runtime|\.npmrc|\.pypirc|\.env(?:\..*)?|access\.token|auth\.json|id_rsa|id_ed25519|credentials(?:\..*)?|diagnostic\.log|supervisor\.log)$/i.test(p));
const claimContent=(c:Claim)=>clean({statement:c.statement,evidenceIds:c.evidenceIds,limitations:c.limitations,taskId:c.taskId,sourceAttemptId:c.sourceAttemptId,sourceResultDigest:c.sourceResultDigest,sourceAcceptanceId:c.sourceAcceptanceId,sourceAcceptanceIds:c.sourceAcceptanceIds});
const payload=(r:ReportRecord)=>clean({artifactId:r.artifactId,artifactDigest:r.artifactDigest,title:r.title,formatVersion:r.formatVersion,runIds:r.runIds,claimIds:r.claimIds,evidenceIds:r.evidenceIds,references:r.references,runs:r.runs,bindings:r.bindings});
function safeExportBytes(bytes:Buffer,context:Pick<AppContext,'dataDir'|'repoRoot'>) {
    const value=bytes.toString('utf8');
    const roots=[context.dataDir,context.repoRoot].map(path=>path.replaceAll('\\','/').replace(/\/+$/,'').toLowerCase());
    let decoded=value;
    ensure(!roots.some(root=>root.length>1&&value.replaceAll('\\','/').toLowerCase().includes(root)),'EXPORT_HOST_PATH_DETECTED','导出内容包含宿主路径；请检查原始运行记录，文件不会被自动改写',400);
    try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{
        // ponytail: binary path heuristics cover readable ASCII runs of 8+ bytes; a format-aware metadata audit is needed for encoded payloads.
        decoded=(bytes.toString('latin1').match(/[\x09\x0a\x0d\x20-\x7e]{8,}/g)??[]).join('\n');
    }
    for(let layer=0;layer<5;layer++) {
        const normalized=decoded.replaceAll('\\','/'),lower=normalized.toLowerCase();
        const hostPath=roots.some(root=>root.length>1&&lower.includes(root))||/(?:^|[^A-Za-z0-9_])[A-Za-z]:\//.test(normalized)||/(?:^|[\s"'(=,])\/{2,}[^\s/"']+\/+[^\s/"']+/.test(normalized)||/\b(?:host[_ -]?(?:path|directory)|(?:bind(?: mount)?|mount) source(?: path)?|snapshotPath|controlDir)\b[^\r\n/]{0,96}\/[^\s"'<>]+/i.test(normalized)||/--mount[^\r\n]{0,300}[,\s]src=\/[^\s"'<>]+/i.test(normalized);
        ensure(!hostPath,'EXPORT_HOST_PATH_DETECTED','导出内容包含宿主路径；请检查原始运行记录，文件不会被自动改写',400);
        const next=decoded.replace(/\\u([a-f0-9]{4})|\\(["\\/])/gi,(_match,unicode:string|undefined,literal:string|undefined)=>unicode?String.fromCharCode(parseInt(unicode,16)):literal!);
        if(next===decoded)break;decoded=next;
    }
    ensure(!/-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{16,}|(?:AKIA|ASIA)[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b|\bBearer\s+[A-Za-z0-9._~-]{12,}|https?:\/\/[^\s\/:]+:[^\s@]+@|["']?(?:api[_-]?key|access[_-]?token|password|client[_-]?secret)["']?\s*[:=]\s*["']?[^\s"',;}]{8,}/i.test(value),'EXPORT_SENSITIVE_CONTENT','导出内容疑似包含凭据；请检查所选固定源码或产物，原始字节不会被自动改写',400);
}

export class ReportService {
    constructor(private c:AppContext,private evidence:EvidenceService,private app?:ResearchApp) {}
    private record(actor:Actor,pid:string,id:string) {userOnly(actor);scope(actor,pid);return this.c.store.get<ReportRecord>('report',id,pid);}
    private bytes(pid:string,id:string,expected?:{digest:string;size?:number}) {
        const a=this.c.store.get<Artifact>('artifact',id,pid),bytes=readStableFile(dirname(a.path),basename(a.path),32*1024*1024);
        ensure(bytes.length===a.size&&digest(bytes)===a.digest&&(!expected||a.digest===expected.digest&&(expected.size===undefined||a.size===expected.size)),'ARTIFACT_CORRUPTED','报告引用的不可变文件已改变');return {artifact:a,bytes};
    }
    private checkRecord(r:Row<ReportRecord>) {
        ensure(r.formatVersion===1&&r.bindings&&r.references&&r.runs&&r.bindingsDigest===digest(payload(r)),'REPORT_BINDING_INVALID','报告绑定缺失或已改变');
        this.bytes(r.projectId!,r.artifactId,{digest:r.artifactDigest!});return r as Row<ReportRecord>&{bindings:ReportBindings;references:ReportReference[];runs:ReportRun[];bindingsDigest:string};
    }
    private publication(actor:Actor,pid:string,id:string) {
        ensure(this.app,'PUBLICATION_UNAVAILABLE','文稿服务不可用');
        const result=this.app.publicationBuilds.result(actor,pid,id),job=this.app.publicationBuilds.get(actor,pid,result.jobId);
        ensure(result.pdf&&result.status==='succeeded'&&job.state==='succeeded'&&job.integrity==='complete'&&job.exitCode===0,'REPORT_PUBLICATION_INCOMPLETE','成果报告只接受完整成功的文稿 PDF');
        const revision=this.app.publicationBuilds.assertCurrent(job,true);
        ensure(result.revisionId===revision.id,'PUBLICATION_RESULT_INVALID','结果文稿版本不符');
        return {result:this.c.store.get<PublicationBuildResult>('publication-build-result',id,pid),revision,job};
    }
    private figureJob(pid:string,id:string) {
        ensure(this.app,'PUBLICATION_UNAVAILABLE','文稿服务不可用');const job=this.c.store.get<SandboxJob>('sandbox-job',id,pid);
        ensure(job.state==='succeeded'&&job.integrity==='complete'&&job.exitCode===0,'REPORT_FIGURE_SOURCE_INVALID','图形来源作业必须完整成功');
        this.app.development.assertCurrent(job,true);job.artifactIds.forEach(id=>this.bytes(pid,id));return job;
    }
    private checkProposal(pid:string,p:Row<ChangeProposal>) {
        const {baseExperimentId,baseRevision,baseSnapshot,contractDigest,title,hypothesis,changes,candidateSnapshot}=p;
        const value={baseExperimentId,baseRevision,baseSnapshot,contractDigest,title,hypothesis,changes,candidateSnapshot,...(p.testJobId?{testJobId:p.testJobId}:{}),...(p.flow?{flow:p.flow,reviewId:p.reviewId,reviewAcceptanceId:p.reviewAcceptanceId}:{})};
        ensure(digest(value)===p.digest&&p.sourceValidity!=='stale','CHANGE_SOURCE_STALE','整合提案的固定绑定已改变或失效');
        ensure(digest(candidateSnapshot.files)===candidateSnapshot.digest,'SNAPSHOT_CORRUPTED','整合候选清单摘要不符');verifySnapshot(candidateSnapshot.path,candidateSnapshot.files);
        const approval=this.c.store.get<Approval>('approval',p.approvalId,pid);ensure(approval.status==='approved'&&approval.subjectId===p.id&&approval.scope==='change.integrate'&&approval.digest===p.digest,'APPROVAL_STALE','整合审批已失效');
        if(p.testJobId){const j=this.c.store.get<SandboxJob>('sandbox-job',p.testJobId,pid),grant=this.c.store.get<Approval>('approval',j.grantId,pid);assertWorkingGrantJob(this.c.store,j);
            ensure(j.state==='succeeded'&&j.integrity==='complete'&&j.exitCode===0&&j.sourceDigest===candidateSnapshot.digest&&j.manifest.inputSnapshot.digest===j.sourceDigest&&digest(j.manifest.inputSnapshot.files)===j.sourceDigest&&digest(j.manifest)===j.manifestDigest,'REPORT_TEST_BINDING_INVALID','测试结果不属于该整合候选');
            ensure(grant.status==='approved'&&grant.scope==='development.test'&&grant.subjectKind==='development-task'&&grant.subjectId===j.developmentTaskId&&grant.digest===j.manifestDigest,'APPROVAL_STALE','开发测试审批已失效');
            verifySnapshot(j.manifest.inputSnapshot.path,j.manifest.inputSnapshot.files);j.artifactIds.forEach(id=>this.bytes(pid,id));
            for(const data of j.manifest.dataArtifacts){this.bytes(pid,data.id,data);if(data.sourceAcceptanceId)assertAcceptanceCurrent(this.c.store,pid,data.sourceAcceptanceId);}
        }
        if(p.flow==='reviewed-development'||p.reviewId||p.reviewAcceptanceId){ensure(p.reviewId&&p.reviewAcceptanceId&&p.testJobId,'REPORT_REVIEW_BINDING_INVALID','缺少受审整合绑定');const review=this.c.store.get<DevelopmentReview>('development-review',p.reviewId,pid),acceptance=assertAcceptanceCurrent(this.c.store,pid,p.reviewAcceptanceId);ensure(review.jobId===p.testJobId&&review.sourceDigest===candidateSnapshot.digest&&acceptance.taskId===review.taskId,'REPORT_REVIEW_BINDING_INVALID','独立审查不属于该测试和候选源码');}
    }
    private document(pid:string,e:Row<Evidence>,checked:Set<string>) {
        const chain=verifyDocumentLink(this.c,pid,e.document!,e.artifactId),{document:d,result:r,job,manifest,bytes}=chain,content=bytes.toString('utf8');
        integer(e.locator.start,'start',0,content.length);integer(e.locator.end,'end',e.locator.start+1,content.length);
        ensure(e.digest===chain.page.textArtifactDigest&&content.slice(e.locator.start,e.locator.end)===e.quote,'EVIDENCE_INVALID','报告页段引用或内容已失效');
        const approval=this.c.store.get<Approval>('approval',job.approvalId,pid);
        ensure(approval.status==='approved'&&approval.scope==='document.parse'&&approval.subjectKind==='document-parse-job'&&approval.subjectId===job.id&&approval.digest===job.manifestDigest,'APPROVAL_STALE','文档解析批准已失效');
        if(!checked.has(r.id)) {
            const original=this.c.store.get<Artifact>('artifact',d.original.artifactId,pid),output=this.c.store.get<Artifact>('artifact',r.manifestArtifactId,pid);
            ensure(original.size===d.original.size&&original.mediaType===d.original.mediaType&&original.mediaType==='application/pdf'&&output.mediaType==='application/json','REPORT_DOCUMENT_CHANGED','文档产物固定类型或长度已改变');
            ensure(manifest.formatVersion===1&&manifest.profileId===r.profileId&&r.profileId===job.manifest.profileId&&r.profileDigest===job.manifest.profileDigest&&r.imageId===job.imageId&&r.pageCount===manifest.pageCount&&r.pages.length===manifest.pages.length&&digest(r.quality)===digest(manifest.quality),'REPORT_DOCUMENT_CHANGED','解析身份或提取质量已改变');
            for(const [index,page] of r.pages.entries()) {
                const fixed=manifest.pages[index],t=this.c.store.get<Artifact>('artifact',page.textArtifactId,pid),i=this.c.store.get<Artifact>('artifact',page.imageArtifactId,pid);
                ensure(fixed&&page.pageNumber===fixed.pageNumber&&page.textArtifactDigest===fixed.textDigest&&page.imageArtifactDigest===fixed.imageDigest&&t.digest===fixed.textDigest&&i.digest===fixed.imageDigest&&t.size===fixed.textBytes&&i.size===fixed.imageBytes&&t.mediaType==='text/plain'&&i.mediaType==='image/png'&&digest(page.paragraphs)===digest(fixed.paragraphs)&&page.textStatus===fixed.textStatus&&page.pageLabel===fixed.pageLabel&&page.width===fixed.width&&page.height===fixed.height&&page.imageWidth===fixed.imageWidth&&page.imageHeight===fixed.imageHeight,'REPORT_DOCUMENT_CHANGED','固定页元数据已改变');
            }
            // Version markers may occur on an unquoted page; check its text without exporting it.
            const texts=d.source.provider==='alphaxiv'?r.pages.map(p=>this.bytes(pid,p.textArtifactId,{digest:p.textArtifactDigest}).bytes.toString('utf8')):[];
            ensure(digest(checkDocumentVersion(d.source,texts))===digest({requestedVersion:r.requestedVersion,observedVersion:r.observedVersion,versionAssurance:r.versionAssurance}),'REPORT_DOCUMENT_CHANGED','PDF 版本保证记录已改变');
            checked.add(r.id);
        }
        return chain;
    }
    create(actor:Actor,pid:string,value:unknown) {
        userOnly(actor);scope(actor,pid);
        return this.c.store.transaction(()=>{
            assertProjectWritable(this.c.store,pid);const x=object(value),title=text(x.title??'研究结果记录','title',200),runIds=[...new Set(strings(x.runIds??[],'runIds',100))],claimIds=[...new Set(strings(x.claimIds??[],'claimIds',100))],publicationResultIds=[...new Set(strings(x.publicationResultIds??[],'publicationResultIds',20))],campaignIds=[...new Set(strings(x.campaignIds??[],'campaignIds',5))];
            ensure(Object.keys(x).every(k=>['projectId','title','runIds','claimIds','publicationResultIds','campaignIds'].includes(k))&&(!x.projectId||x.projectId===pid),'INVALID_INPUT','报告只接受当前项目的运行、结论与固定文稿结果 ID',400);
            ensure(!campaignIds.length||this.app,'RESEARCH_PLANS_UNAVAILABLE','固定研究方案服务不可用');
            const research=campaignIds.map(id=>this.app!.researchPlans.reportSnapshot(actor,pid,id));
            for(const snapshot of research){ensure(snapshot.plans.length>0,'REPORT_PLAN_REQUIRED','活动尚未保存固定研究方案');for(const id of [...snapshot.results.map(r=>r.runId),...snapshot.plans.flatMap(p=>p.plan.controlRunIds)])if(!runIds.includes(id)){ensure(runIds.length<100,'REPORT_TOO_LARGE','报告关联运行超过上限',413);runIds.push(id);}}
            const publications=publicationResultIds.map(id=>this.publication(actor,pid,id));
            for(const {revision} of publications)for(const file of revision.files)if(file.provenance.kind==='run'&&!runIds.includes(file.provenance.id!)){ensure(runIds.length<100,'REPORT_TOO_LARGE','报告关联运行超过上限',413);runIds.push(file.provenance.id!);}
            const claims=claimIds.map(id=>this.c.store.get<Claim>('claim',id,pid));
            for(const claim of claims)for(const id of claim.evidenceIds){const e=this.c.store.get<Evidence>('evidence',id,pid);
                const artifact=this.c.store.get<Artifact>('artifact',e.artifactId,pid),runId=e.runId??artifact.runId;if(runId&&!runIds.includes(runId)){ensure(runIds.length<100,'REPORT_TOO_LARGE','报告关联运行超过上限',413);runIds.push(runId);}}
            const runs=runIds.map(id=>this.c.store.get<Run>('run',id,pid));
            ensure(runs.length+claims.length+publications.length>0,'REPORT_EMPTY','请选择真实运行、已采纳结论或完整文稿结果',400);ensure(runs.every(r=>['succeeded','failed','cancelled'].includes(r.state)),'RUN_NOT_TERMINAL','未终态运行不能列为最终结果');
            ensure(new Set(runs.map(r=>r.manifest.contractDigest)).size<=1,'INCOMPARABLE_CONTRACTS','不同运行契约不能直接合并比较');
            claims.forEach(c=>{ensure(c.status==='accepted','CLAIM_NOT_ACCEPTED','报告确定性结论只允许已采纳 Claim');this.evidence.assertClaimCurrent(c);});
            for(const r of runs){verifyRunRecord(r,this.evidence);assertExperimentSourceCurrent(this.c.store,this.c.store.get<Experiment>('experiment',r.experimentId,pid));verifySnapshot(r.manifest.snapshotPath,r.manifest.sourceFiles);}
            const bindings:ReportBindings={runs:[],sources:[],artifacts:[],claims:[],proposals:[],objects:[]},references:ReportReference[]=[],summaries:ReportRun[]=[];
            const add=(ref:Omit<ReportReference,'id'>,data?:unknown)=>{
                const id=digest({type:ref.type,targetId:ref.targetId,runId:ref.runId??null,path:ref.path??null,relation:ref.relation??null});
                if(!references.some(r=>r.id===id)){ensure(references.length<12000,'REPORT_TOO_LARGE','报告引用数量超过上限',413);references.push(clean({...ref,id}));if(data!==undefined)bindings.objects.push({referenceId:id,mediaType:'application/json',content:JSON.stringify(clean(data),null,2)});}return id;
            };
            const artifact=(id:string,runId?:string)=>{const a=bindings.artifacts.find(b=>b.id===id)??this.bytes(pid,id).artifact;if(excluded(a.title))return undefined;if(!bindings.artifacts.some(b=>b.id===id))bindings.artifacts.push({id,digest:a.digest,size:a.size,title:a.title,mediaType:a.mediaType});return add({type:'artifact',targetId:id,label:a.title,digest:a.digest,...(runId?{runId}:{})});};
            const checkedDocuments=new Set<string>();
            const evidence=(id:string)=>{
                const prior=references.find(ref=>ref.type==='evidence'&&ref.targetId===id);if(prior)return prior.id;
                const e=this.c.store.get<Evidence>('evidence',id,pid);if(!e.document)this.evidence.verify(pid,id);ensure(artifact(e.artifactId,e.runId),'REPORT_UNSAFE_REFERENCE','证据指向不适合交付的凭据或宿主诊断文件');
                let document:ReportReference['document'],provenance:ReportBindings['documents'];
                if(e.document) {
                    const {document:d,result:r,page,job}=this.document(pid,e,checkedDocuments);
                    for(const id of [d.original.artifactId,page.imageArtifactId,r.manifestArtifactId])ensure(artifact(id),'REPORT_UNSAFE_REFERENCE','文档来源产物不适合交付');
                    bindings.documents??=[];let binding=bindings.documents.find(b=>b.parseResultId===r.id);
                    if(!binding){
                        const {title,original,derivedText,source,contentKind,acquiredAt,license,rawResponseArtifactIds,scopeSessionId,scopeTaskId,limitations}=d;
                        const {documentVersionId,jobId,rawDigest,manifestDigest,profileId,profileDigest,imageId,pageCount,manifestArtifactId,manifestArtifactDigest,versionAssurance,requestedVersion,observedVersion,quality}=r;
                        const {lockDigest,scriptDigest,environmentImageDigest,resources}=job.manifest;
                        binding=clean({documentVersionId:d.id,documentDigest:digest(d),parseResultId:r.id,resultDigest:digest(r),document:{title,original,derivedText,source,contentKind,acquiredAt,license,rawResponseArtifactIds,scopeSessionId,scopeTaskId,limitations},result:{documentVersionId,jobId,rawDigest,manifestDigest,profileId,profileDigest,imageId,pageCount,manifestArtifactId,manifestArtifactDigest,versionAssurance,requestedVersion,observedVersion,quality,pages:[]},parser:{profileId,profileDigest,lockDigest,scriptDigest,environmentImageDigest,resources,approvalId:job.approvalId}});bindings.documents.push(binding);
                    }
                    if(!binding.result.pages.some(p=>p.pageNumber===page.pageNumber))binding.result.pages.push(clean(page));
                    document={...e.document,...e.locator,pageLabel:page.pageLabel,rawArtifactId:d.original.artifactId,imageArtifactId:page.imageArtifactId};
                    provenance=[clean({...binding,result:{...binding.result,pages:[page]}})];
                }
                return add({type:'evidence',targetId:id,label:e.description,digest:e.digest,...(e.runId?{runId:e.runId}:{}),...(document?{document}:{})},{evidenceId:e.id,artifactId:e.artifactId,digest:e.digest,locator:e.locator,quote:e.quote,description:e.description,type:e.type,runId:e.runId,...(document?{document,provenance,locatorUnit:'UTF-16 code units',licenseNotice:'License statements are retained as supplied; local export does not grant redistribution permission.'}:{})});
            };
            for(const snapshot of research){
                const referenceId=add({type:'research-comparison',targetId:snapshot.campaignId,label:`固定研究比较 ${snapshot.campaignId}`,digest:digest(snapshot)},snapshot);
                const planReferences=snapshot.plans.map(inspection=>{
                    for(const binding of inspection.plan.dataBindings)ensure(artifact(binding.artifactId),'REPORT_UNSAFE_REFERENCE','方案数据产物不适合交付');
                    const referenceId=add({type:'experiment-plan',targetId:inspection.plan.id,label:`固定研究方案 ${inspection.plan.id}`,digest:digest(inspection)},inspection);
                    return {planRevisionId:inspection.plan.id,referenceId};
                });
                snapshot.results.flatMap(r=>r.evidenceIds).forEach(evidence);
                (bindings.researchCampaigns??=[]).push({campaignId:snapshot.campaignId,snapshot:clean(snapshot),snapshotDigest:digest(snapshot),referenceId,planReferences});
            }
            for(const {result,revision,job} of publications) {
                for(const id of [revision.manifestArtifactId,...revision.files.map(f=>f.artifactId),result.manifestArtifactId,...result.logs.map(f=>f.artifactId),...result.previews.map(f=>f.artifactId),result.pdf!.artifactId])ensure(artifact(id),'REPORT_UNSAFE_REFERENCE','文稿产物不适合交付');
                const {profileId,profileDigest,lockDigest,scriptDigest,dockerfileDigest,environmentImageDigest,command,resources}=job.manifest;
                const compiler={profileId,profileDigest,lockDigest,scriptDigest,dockerfileDigest,environmentImageDigest,command,resources,imageId:result.imageId,approvalId:job.approvalId};
                const referenceId=add({type:'publication',targetId:result.id,label:revision.title,digest:digest(result)},{resultId:result.id,revisionId:revision.id,revision,result,compiler,notice:'编译成功仅验证文稿构建，不证明科学结论或图形数值。'});
                (bindings.publications??=[]).push(clean({resultId:result.id,resultDigest:digest(result),revisionId:revision.id,revisionDigest:digest(revision),revision,result,compiler,referenceId}));
                for(const file of revision.files) {
                    const provenance=file.provenance;let source:unknown={notice:'来源未验证；未推断数据、绘图脚本或数值关系。'};
                    if(provenance.kind==='run')source={runId:provenance.id,notice:'Run 归档产物；仅 Run 指标证据验证实测数值，不表示已验证图形逐点数据映射。'};
                    if(provenance.kind==='sandbox-job') {
                        const figure=this.figureJob(pid,provenance.id!);
                        const dataArtifacts=figure.manifest.dataArtifacts.map(({path,...a})=>a);
                        if(!(bindings.figureSources??=[]).some(b=>b.jobId===figure.id)) {
                            bindings.figureSources.push(clean({jobId:figure.id,manifestDigest:figure.manifestDigest,sourceDigest:figure.sourceDigest,files:figure.manifest.inputSnapshot.files,artifactIds:figure.artifactIds,dataArtifacts}));
                            for(const id of [...figure.artifactIds,...dataArtifacts.map(a=>a.id)])ensure(artifact(id),'REPORT_UNSAFE_REFERENCE','图形来源产物不适合交付');
                            for(const f of figure.manifest.inputSnapshot.files){ensure(!excluded(f.path),'REPORT_UNSAFE_REFERENCE','图形固定源码含不适合交付的文件');add({type:'figure-source-code',targetId:figure.id,path:f.path,digest:f.digest,label:f.path,relation:'exact'});}
                        }
                        source={jobId:figure.id,sourceDigest:figure.sourceDigest,manifestDigest:figure.manifestDigest,command:figure.manifest.command,image:figure.manifest.environmentImageDigest,imageId:figure.imageId,approvalId:figure.grantId,...(figure.manifest.workingGrant?{workingGrant:this.app!.workingGrants.inspect({type:'user'},pid,figure.manifest.workingGrant.id)}:{}),dataArtifacts,artifactIds:figure.artifactIds,notice:'已声明输入与同作业产物；未证明每项输入均被使用，未验证图形逐点科学数值映射。'};
                    }
                    add({type:'figure-source',targetId:revision.id,path:file.path,label:`文稿文件来源：${file.path}`,digest:file.digest},{revisionId:revision.id,file,source});
                }
            }
            if(publications.length)bindings.publicationReviews=[];
            for(const {result} of publications) {
                const reviews=this.app!.publicationReviews.list(actor,pid,{resultId:result.id}).sort((a,b)=>a.id.localeCompare(b.id));
                ensure(reviews.length<=20,'REPORT_TOO_LARGE','单个文稿结果关联审查超过 20 个',413);
                const frozen:NonNullable<ReportBindings['publicationReviews']>[number]={resultId:result.id,reviewIds:reviews.map(review=>review.id),reviews:[]};
                for(const review of reviews) {
                    const snapshot=this.app!.publicationReviews.snapshot(actor,pid,review.id),snapshotDigest=digest(snapshot);
                    snapshot.artifacts.forEach(a=>ensure(artifact(a.id),'REPORT_UNSAFE_REFERENCE','论文审查输入产物不适合交付'));
                    snapshot.evidence.forEach(e=>evidence(e.id));
                    const referenceId=add({type:'publication-review',targetId:review.id,label:`固定论文审查：${review.status}`,digest:snapshotDigest},snapshot);
                    frozen.reviews.push({snapshot:clean(snapshot),snapshotDigest,referenceId});
                }
                bindings.publicationReviews!.push(frozen);
            }
            for(const r of runs){
                bindings.runs.push({runId:r.id,manifestDigest:r.manifestDigest,sourceDigest:r.manifest.snapshotDigest,contractDigest:r.manifest.contractDigest,artifactIds:[...r.artifactIds],evidenceIds:[...r.evidenceIds]});bindings.sources.push({runId:r.id,sourceDigest:r.manifest.snapshotDigest,files:structuredClone(r.manifest.sourceFiles)});
                const binding=r.manifest.sourceRevisionId?this.c.store.maybe<GitSourceBinding>('git-source-binding',r.manifest.sourceRevisionId):undefined,gitCommit=r.manifest.gitCommit??(binding?.sourceDigest===r.manifest.snapshotDigest?binding.gitCommit:undefined);
                add({type:'run',targetId:r.id,label:`Run ${r.id}`,runId:r.id,digest:r.manifestDigest},{runId:r.id,experimentId:r.experimentId,revision:r.manifest.experimentRevision,state:r.state,integrity:r.integrity,judgment:r.judgment,exitCode:r.exitCode,metrics:r.metrics,startedAt:r.startedAt,endedAt:r.endedAt,manifestDigest:r.manifestDigest,sourceDigest:r.manifest.snapshotDigest,gitCommit,contract:r.manifest.contract});
                r.artifactIds.forEach(id=>artifact(id,r.id));const refs=new Map(r.evidenceIds.map(id=>[id,evidence(id)]));
                const metricEvidence=r.evidenceIds.find(id=>{const e=this.c.store.get<Evidence>('evidence',id,pid);return this.c.store.get<Artifact>('artifact',e.artifactId,pid).title==='metrics.json';});
                summaries.push(clean({runId:r.id,experimentId:r.experimentId,revision:r.manifest.experimentRevision,state:r.state,integrity:r.integrity,judgment:r.judgment,sourceDigest:r.manifest.snapshotDigest,gitCommit,metrics:Object.entries(r.metrics??{}).map(([name,value])=>({name,value,unit:r.manifest.contract.metrics[name]?.unit??'未定义',referenceId:refs.get(metricEvidence!)!}))}));
                for(const f of r.manifest.sourceFiles)add({type:'run-source',targetId:r.id,runId:r.id,path:f.path,digest:f.digest,label:f.path,relation:'exact'});
                const seen=new Set<string>();let experiment:Row<Experiment>|undefined=this.c.store.get<Experiment>('experiment',r.experimentId,pid);
                while(experiment){ensure(!seen.has(experiment.id),'EXPERIMENT_CYCLE','实验血缘存在循环');seen.add(experiment.id);
                    if(experiment.changeProposalId){const p=this.c.store.get<ChangeProposal>('change-proposal',experiment.changeProposalId,pid);this.checkProposal(pid,p);const relation=p.candidateSnapshot.digest===r.manifest.snapshotDigest?'exact' as const:'ancestry' as const;
                        if(!bindings.proposals.some(b=>b.id===p.id))bindings.proposals.push(clean({id:p.id,digest:p.digest,sourceDigest:p.candidateSnapshot.digest,reviewId:p.reviewId,reviewAcceptanceId:p.reviewAcceptanceId,jobId:p.testJobId}));
                        if(p.testJobId){const job=this.c.store.get<SandboxJob>('sandbox-job',p.testJobId,pid);ensure(relation!=='exact'||job.sourceDigest===r.manifest.snapshotDigest,'REPORT_TEST_BINDING_INVALID','该测试未覆盖当前运行源码');add({type:'development-job',targetId:job.id,runId:r.id,digest:job.manifestDigest,relation,label:relation==='exact'?'该源码版本的开发测试':'祖先版本的开发测试'},{jobId:job.id,sourceDigest:job.sourceDigest,manifestDigest:job.manifestDigest,state:job.state,integrity:job.integrity,exitCode:job.exitCode,command:job.manifest.command,image:job.manifest.environmentImageDigest,imageId:job.imageId,artifactIds:job.artifactIds,...(job.manifest.workingGrant?{workingGrant:this.app!.workingGrants.inspect({type:'user'},pid,job.manifest.workingGrant.id)}:{}),relation});job.artifactIds.forEach(id=>artifact(id));}
                        if(p.reviewId){const review=this.c.store.get<DevelopmentReview>('development-review',p.reviewId,pid),task=this.c.store.get<Task>('task',review.taskId,pid);ensure(relation!=='exact'||review.sourceDigest===r.manifest.snapshotDigest,'REPORT_REVIEW_BINDING_INVALID','该审查未覆盖当前运行源码');add({type:'development-review',targetId:review.id,runId:r.id,digest:review.digest,relation,label:relation==='exact'?'该源码版本的独立审查':'祖先版本的独立审查'},{reviewId:review.id,jobId:review.jobId,sourceDigest:review.sourceDigest,reviewDigest:review.digest,taskId:task.id,attemptId:task.attemptId,verdict:task.result?.verdict,acceptance:task.acceptance,summary:task.result?.summary,reviewAcceptanceId:p.reviewAcceptanceId,requiredEvidenceIds:review.requiredEvidenceIds,relation});review.requiredEvidenceIds.forEach(evidence);}
                    }
                    experiment=experiment.parentId?this.c.store.get<Experiment>('experiment',experiment.parentId,pid):undefined;
                }
            }
            for(const c of claims){const acceptanceIds=c.sourceAcceptanceIds??(c.sourceAcceptanceId?[c.sourceAcceptanceId]:[]);bindings.claims.push({id:c.id,contentDigest:digest(claimContent(c)),acceptanceIds});add({type:'claim',targetId:c.id,label:c.statement.slice(0,120),digest:digest(claimContent(c))},{claimId:c.id,...claimContent(c),status:c.status,validity:c.validity??'current'});c.evidenceIds.forEach(evidence);}
            const id=randomUUID(),link=(referenceId:string,label:string)=>`[${escaped(label)}](pi-research://report/${id}/reference/${referenceId})`,body=[`# ${escaped(title)}`,'\n这是根据所选实际终态运行、已采纳结论和固定文稿构建结果生成的确定性记录，不是新的模型推断。进程成功或审查通过不等于科学假设成立。',...summaries.map(r=>`\n## Run ${r.runId}\n\n执行：${r.state}；完整性：${r.integrity}；科研判断：${r.judgment}\n\n固定源码摘要：${r.sourceDigest}\n\n${r.metrics.length?'| 指标 | 实测值 | 单位 |\n|---|---:|---|\n'+r.metrics.map(m=>`| ${escaped(m.name)} | ${link(m.referenceId,String(m.value))} | ${escaped(m.unit)} |`).join('\n'):'未获得完整实测指标。'}`),...claims.map(c=>`\n## 已采纳结论\n\n${escaped(c.statement)}\n\n限制：${escaped(c.limitations.join('；')||'未填写；不意味着不存在限制。')}`),...publications.map(({result,revision})=>`\n## 固定文稿\n\n${escaped(revision.title)}；修订：${revision.id}；PDF：${result.pdf!.digest}\n\n图形关联仅说明固定来源、已声明输入与同作业产物，不代表已验证逐点科学数值。未知来源保持未验证。`),...bindings.publicationReviews?.map(b=>`\n## 固定论文审查\n\n构建结果：${b.resultId}；${b.reviews.length?b.reviews.map(({snapshot})=>`${snapshot.review.id}：${snapshot.review.status}`).join('；'):'not-reviewed（未审查）'}。\n\n论文审查仅覆盖固定文本、证据与构建日志，不表示模型已视觉审读 PDF；代码审查单独记录。`)??[],...research.map(snapshot=>`\n## 固定研究方案与实际比较\n\n活动：${snapshot.campaignId}；状态：${snapshot.state}；指标：${escaped(snapshot.primaryMetric)}（${escaped(snapshot.unit)}）；固定方案 ${snapshot.plans.length} 份。\n\n核验观测 ${snapshot.results.filter(r=>r.validation==='verified').length}；未核验/无结论观测 ${snapshot.results.filter(r=>r.validation!=='verified').length}。结论：requires_review（需要研究者审阅），不自动判定科学成功。\n\n限制与停止原因：${escaped(snapshot.blockers.join('；')||'无已记录阻断，不表示研究结论成立。')}`),'\n## 固定引用\n',...references.map(r=>`- ${link(r.id,r.label)}${r.relation==='ancestry'?'（仅为祖先来源，不表示当前源码通过该测试或审查）':''}`),'\n## 适用性与限制\n\n报告原文是生成时的历史记录。使用结论或导出成果前，应在工作台重新核对前提与审查是否仍有效。模板中的合成数据不代表真实材料性能；其他研究结论也必须根据自己的数据和协议判断。'].join('\n');
            const datedBody=body.replace('\n',`\n\n生成时间：${new Date().toISOString()}\n`);
            const a=this.evidence.put(pid,title.slice(0,197)+'.md',Buffer.from(datedBody),'text/markdown','report'),data:ReportRecord={artifactId:a.id,artifactDigest:a.digest,title,formatVersion:1,runIds,claimIds,evidenceIds:[...new Set([...runs.flatMap(r=>r.evidenceIds),...claims.flatMap(c=>c.evidenceIds)])],references,runs:summaries,bindings};
            this.c.store.create<ReportRecord>('report',pid,{...data,bindingsDigest:digest(payload(data))},id);this.c.store.event(pid,'report.created',{reportId:id,artifactId:a.id,runIds,claimIds});return a;
        });
    }
    inspect(actor:Actor,pid:string,id:string):ReportInspection {
        const r=this.record(actor,pid,id),result:ReportInspection={id:r.id,artifactId:r.artifactId,title:r.title??this.c.store.get<Artifact>('artifact',r.artifactId,pid).title,formatVersion:r.formatVersion===1?1:0,integrity:'verified',validity:r.formatVersion===1?'current':'legacy',reasons:[],references:[],runs:[]};
        const fail=(error:unknown,integrity=false)=>{if(integrity)result.integrity='invalid';if(r.formatVersion===1)result.validity='stale';result.reasons.push(asError(error).code);};
        if(r.formatVersion!==1){try{this.bytes(pid,r.artifactId);}catch(error){fail(error,true);}result.reasons.push('REPORT_LEGACY_BINDINGS_UNAVAILABLE');return result;}
        let bound:ReturnType<ReportService['checkRecord']>;try{bound=this.checkRecord(r);result.references=bound.references;result.runs=bound.runs;if(bound.bindings.publications)result.publications=bound.bindings.publications.map(b=>({resultId:b.resultId,revisionId:b.revisionId,jobId:b.result.jobId,title:b.revision.title,sourceDigest:b.revision.sourceDigest,pdfArtifactId:b.result.pdf!.artifactId,pdfDigest:b.result.pdf!.digest,pages:b.result.pdf!.pages,referenceId:b.referenceId}));}catch(error){fail(error,true);return result;}
        if(bound.bindings.researchCampaigns)result.researchCampaigns=bound.bindings.researchCampaigns.map(b=>({campaignId:b.campaignId,state:b.snapshot.state,primaryMetric:b.snapshot.primaryMetric,unit:b.snapshot.unit,conclusion:b.snapshot.conclusion,referenceId:b.referenceId,planReferences:b.planReferences}));
        for(const b of bound.bindings.researchCampaigns??[])try{
            ensure(this.app,'RESEARCH_PLANS_UNAVAILABLE','固定研究方案服务不可用');
            ensure(digest(this.app.researchPlans.reportSnapshot(actor,pid,b.campaignId))===b.snapshotDigest,'REPORT_RESEARCH_CHANGED','研究方案、观测或研究状态已改变，请重新生成报告');
        }catch(error){fail(error);}
        for(const a of bound.bindings.artifacts)try{const current=this.bytes(pid,a.id,a).artifact;ensure(current.title===a.title&&current.mediaType===a.mediaType,'REPORT_SOURCE_CHANGED','报告产物元数据已改变');}catch(error){fail(error,true);}
        for(const b of bound.bindings.documents??[])try{
            ensure(digest(this.c.store.get<DocumentVersion>('document-version',b.documentVersionId,pid))===b.documentDigest&&digest(this.c.store.get<DocumentParseResult>('document-parse-result',b.parseResultId,pid))===b.resultDigest,'REPORT_DOCUMENT_CHANGED','报告固定文档或解析记录已改变');
            ensure(this.c.store.get<DocumentParseJob>('document-parse-job',b.result.jobId,pid).approvalId===b.parser.approvalId,'REPORT_DOCUMENT_CHANGED','报告固定解析批准已改变');
        }catch(error){fail(error,true);}
        for(const b of bound.bindings.publications??[])try {
            ensure(digest(this.c.store.get<ManuscriptRevision>('manuscript-revision',b.revisionId,pid))===b.revisionDigest&&digest(this.c.store.get<PublicationBuildResult>('publication-build-result',b.resultId,pid))===b.resultDigest,'REPORT_PUBLICATION_CHANGED','固定文稿或结果记录改变');
            const {job}=this.publication(actor,pid,b.resultId);ensure(job.approvalId===b.compiler.approvalId,'REPORT_PUBLICATION_CHANGED','固定编译批准身份改变');
        }catch(error){fail(error);}
        if(bound.bindings.publicationReviews)result.publicationReviews=bound.bindings.publicationReviews.map(b=>({resultId:b.resultId,reviewIds:b.reviewIds,reviews:b.reviews.map(r=>({...r.snapshot.review,referenceId:r.referenceId}))}));
        for(const b of bound.bindings.publicationReviews??[])try {
            ensure(this.app,'PUBLICATION_UNAVAILABLE','论文审查服务不可用');
            const ids=this.app.publicationReviews.list(actor,pid,{resultId:b.resultId}).map(review=>review.id).sort();
            ensure(digest(ids)===digest([...b.reviewIds].sort()),'REPORT_PUBLICATION_REVIEWS_CHANGED','固定文稿的完整审查集合改变，请重新生成报告');
            for(const review of b.reviews)ensure(digest(this.app.publicationReviews.snapshot(actor,pid,review.snapshot.review.id))===review.snapshotDigest,'REPORT_PUBLICATION_REVIEW_CHANGED','固定论文审查状态或输入改变，请重新生成报告');
        }catch(error){fail(error);}
        for(const b of bound.bindings.figureSources??[])try {const job=this.figureJob(pid,b.jobId);ensure(job.manifestDigest===b.manifestDigest&&job.sourceDigest===b.sourceDigest&&digest(job.artifactIds)===digest(b.artifactIds),'REPORT_FIGURE_SOURCE_INVALID','图形来源记录改变');}catch(error){fail(error);}
        const checkedDocuments=new Set<string>();
        for(const ref of bound.references.filter(ref=>ref.document))try{
            const e=this.c.store.get<Evidence>('evidence',ref.targetId,pid),frozen=JSON.parse(bound.bindings.objects.find(o=>o.referenceId===ref.id)!.content);
            ensure(e.document&&digest({...e.document,...e.locator,pageLabel:ref.document!.pageLabel,rawArtifactId:ref.document!.rawArtifactId,imageArtifactId:ref.document!.imageArtifactId})===digest(ref.document)&&e.artifactId===frozen.artifactId&&e.digest===frozen.digest&&e.quote===frozen.quote&&e.description===frozen.description&&e.type===frozen.type&&e.runId===frozen.runId,'REPORT_DOCUMENT_CHANGED','报告页段证据已改变');
            this.document(pid,e,checkedDocuments);
        }catch(error){fail(error,asError(error).code!=='APPROVAL_STALE');}
        for(const b of bound.bindings.runs)try{const run=this.c.store.get<Run>('run',b.runId,pid);ensure(run.manifestDigest===b.manifestDigest&&run.manifest.snapshotDigest===b.sourceDigest,'REPORT_SOURCE_CHANGED','报告运行绑定已变化');verifyRunRecord(run,this.evidence);verifySnapshot(run.manifest.snapshotPath,run.manifest.sourceFiles);}catch(error){fail(error,true);}
        for(const b of bound.bindings.runs)try{const run=this.c.store.get<Run>('run',b.runId,pid);assertExperimentSourceCurrent(this.c.store,this.c.store.get<Experiment>('experiment',run.experimentId,pid));}catch(error){fail(error);}
        for(const b of bound.bindings.claims)try{const claim=this.c.store.get<Claim>('claim',b.id,pid);ensure(claim.status==='accepted'&&digest(claimContent(claim))===b.contentDigest,'CLAIM_STALE','报告结论采纳或内容已变化');this.evidence.assertClaimCurrent(claim);b.acceptanceIds.forEach(id=>assertAcceptanceCurrent(this.c.store,pid,id));}catch(error){fail(error);}
        for(const b of bound.bindings.proposals)try{const p=this.c.store.get<ChangeProposal>('change-proposal',b.id,pid);ensure(p.digest===b.digest&&p.testJobId===b.jobId&&p.reviewId===b.reviewId&&p.reviewAcceptanceId===b.reviewAcceptanceId,'CHANGE_SOURCE_STALE','报告来源整合已改变');this.checkProposal(pid,p);}catch(error){fail(error);}
        result.reasons=[...new Set(result.reasons)].sort();return result;
    }
    readReference(actor:Actor,pid:string,id:string,referenceId:string,cursor=0,limit=16000) {
        const r=this.checkRecord(this.record(actor,pid,id)),reference=r.references.find(ref=>ref.id===text(referenceId,'referenceId',100));ensure(reference,'NOT_FOUND','引用不属于该报告',404);
        let bytes:Buffer,mediaType:string;
        if(reference.type==='artifact'){const binding=r.bindings.artifacts.find(a=>a.id===reference.targetId);ensure(binding,'REPORT_BINDING_INVALID','缺少产物绑定');({bytes}=this.bytes(pid,binding.id,binding));mediaType=binding.mediaType==='application/octet-stream'&&/\.(csv|tsv)$/i.test(binding.title)?'text/plain':binding.mediaType;}
        else if(reference.type==='figure-source-code'){const b=r.bindings.figureSources?.find(b=>b.jobId===reference.targetId),job=this.c.store.get<SandboxJob>('sandbox-job',reference.targetId,pid),file=b?.files.find(f=>f.path===reference.path);ensure(b&&file&&job.manifestDigest===b.manifestDigest&&digest(job.manifest)===b.manifestDigest,'REPORT_SOURCE_CHANGED','固定图形源码绑定不符');bytes=readStableFile(job.manifest.inputSnapshot.path,file.path,2*1024*1024);ensure(bytes.length===file.size&&digest(bytes)===file.digest,'SNAPSHOT_CORRUPTED','图形源码引用已改变');mediaType='text/plain';}
        else if(reference.type==='run-source'){const run=this.c.store.get<Run>('run',reference.targetId,pid),binding=r.bindings.runs.find(b=>b.runId===run.id),file=r.bindings.sources.find(b=>b.runId===run.id)?.files.find(f=>f.path===reference.path);ensure(binding&&file&&digest(run.manifest)===binding.manifestDigest&&run.manifestDigest===binding.manifestDigest,'REPORT_SOURCE_CHANGED','固定运行源码绑定不符');bytes=readStableFile(run.manifest.snapshotPath,file.path,2*1024*1024);ensure(bytes.length===file.size&&digest(bytes)===file.digest,'SNAPSHOT_CORRUPTED','源码引用已改变');mediaType='text/plain';}
        else {const frozen=r.bindings.objects.find(o=>o.referenceId===reference.id);ensure(frozen,'REPORT_BINDING_INVALID','缺少固定引用内容');bytes=Buffer.from(frozen.content);mediaType=frozen.mediaType;}
        ensure(!bytes.includes(0)&&!/^(image|audio|video)\//.test(mediaType)&&!/^application\/(pdf|zip|octet-stream)/.test(mediaType),'BINARY_FILE','二进制引用不能作为文本预览',415);let content:string;try{content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{ensure(false,'BINARY_FILE','引用内容不是 UTF-8 文本',415);}
        integer(cursor,'cursor',0,content.length);integer(limit,'limit',1,64000);const end=Math.min(content.length,cursor+limit);return {reference,content:content.slice(cursor,end),mediaType,cursor,end,complete:end===content.length};
    }
    private stateDigest(pid:string) {
        // Conservative metadata fence: unrelated edits may require retry, never permit a stale export.
        return digest(this.c.store.db.prepare("SELECT kind,id,version FROM records WHERE project_id=? AND kind IN ('project','report','run','run-intent','experiment','source-revision','claim','artifact','evidence','acceptance-record','change-proposal','development-review','development-task','sandbox-job','approval','task','task-attempt','team','session','document-version','document-parse-result','document-parse-job','manuscript-revision','publication-build-job','publication-build-result','publication-review','task-result','context-snapshot','campaign','research-round','campaign-member','run-observation','campaign-decision','experiment-plan-revision','research-candidate','working-grant','working-grant-use','budget','reservation','wakeup') ORDER BY kind,id").all(pid));
    }
    assertExportCurrent(actor:Actor,pid:string,id:string,expectedBindingsDigest:string,expectedStateDigest:string) {
        const r=this.record(actor,pid,id);assertProjectWritable(this.c.store,pid);ensure(r.formatVersion===1&&r.bindingsDigest===expectedBindingsDigest&&digest(payload(r))===expectedBindingsDigest&&this.stateDigest(pid)===expectedStateDigest,'REPORT_EXPORT_STALE','打包期间报告或关联状态已变化，请重新导出');
    }
    collectExport(actor:Actor,pid:string,id:string):ReportExportCollection {
        const raw=this.record(actor,pid,id);ensure(raw.formatVersion===1,'REPORT_LEGACY','旧报告没有生成时绑定，请重新生成报告后导出成果包');const r=this.checkRecord(raw),stateBefore=this.stateDigest(pid),inspection=this.inspect(actor,pid,id);assertProjectWritable(this.c.store,pid);
        ensure(inspection.integrity==='verified'&&inspection.validity==='current','REPORT_STALE','报告前提或文件已失效，保留历史阅读但不能作为当前成果导出');
        const files:ReportExportCollection['files']=[],seen=new Map<string,string>();let total=0;
        const add=(path:string,bytes:Buffer,mode?:'100644'|'100755')=>{ensure(!isAbsolute(path)&&!path.includes('\\')&&path.split('/').every(p=>p&&p!=='.'&&p!=='..')&&!excluded(path),'EXPORT_PATH_DENIED','成果包路径无效或属于敏感文件',400);safeExportBytes(bytes,this.c);const prior=seen.get(path),hash=digest(bytes);if(prior){ensure(prior===hash,'EXPORT_PATH_CONFLICT','成果包存在冲突路径');return;}ensure(files.length<10000&&(total+=bytes.length)<=30*1024*1024,'EXPORT_TOO_LARGE','成果包原始文件超过 30 MiB 或数量上限',413);seen.set(path,hash);files.push({path,bytes,...(mode?{mode}:{})});};
        add('report.md',this.bytes(pid,r.artifactId,{digest:r.artifactDigest!}).bytes);
        for(const source of r.bindings.sources){const run=this.c.store.get<Run>('run',source.runId,pid);for(const file of source.files){safePath(run.manifest.snapshotPath,file.path);const bytes=readStableFile(run.manifest.snapshotPath,file.path,Math.min(30*1024*1024,file.size));ensure(bytes.length===file.size&&digest(bytes)===file.digest,'SNAPSHOT_CORRUPTED','导出源码与固定绑定不符');add(`sources/${source.sourceDigest}/${file.path}`,bytes,file.mode);}}
        for(const source of r.bindings.figureSources??[]){const job=this.c.store.get<SandboxJob>('sandbox-job',source.jobId,pid);for(const file of source.files){const bytes=readStableFile(job.manifest.inputSnapshot.path,file.path,Math.min(30*1024*1024,file.size));ensure(bytes.length===file.size&&digest(bytes)===file.digest,'SNAPSHOT_CORRUPTED','图形源码与固定绑定不符');add(`sources/${source.sourceDigest}/${file.path}`,bytes,file.mode);}}
        for(const publication of r.bindings.publications??[]){for(const file of publication.revision.files)add(`manuscripts/${publication.revisionId}/${file.path}`,this.bytes(pid,file.artifactId,file).bytes);const pdf=publication.result.pdf!;add(`publications/${publication.resultId}/document.pdf`,this.bytes(pid,pdf.artifactId,{digest:pdf.digest,size:pdf.bytes}).bytes);}
        for(const group of r.bindings.publicationReviews??[])for(const review of group.reviews){const frozen=r.bindings.objects.find(o=>o.referenceId===review.referenceId);ensure(frozen,'REPORT_BINDING_INVALID','缺少固定论文审查内容');add(`reviews/${review.snapshot.review.id}.json`,Buffer.from(frozen.content));}
        for(const group of r.bindings.researchCampaigns??[]){
            for(const binding of [{referenceId:group.referenceId,path:`research/${group.campaignId}.json`},...group.planReferences.map(p=>({referenceId:p.referenceId,path:`plans/${p.planRevisionId}.json`}))]){
                const frozen=r.bindings.objects.find(o=>o.referenceId===binding.referenceId);ensure(frozen,'REPORT_BINDING_INVALID','缺少固定研究记录');add(binding.path,Buffer.from(frozen.content));
            }
        }
        for(const artifact of r.bindings.artifacts){ensure(!excluded(artifact.title),'EXPORT_PATH_DENIED','产物名称属于敏感文件');add(`artifacts/${artifact.digest}`,this.bytes(pid,artifact.id,artifact).bytes);}
        const manifest:ReportExportCollection['manifest']={formatVersion:1,report:inspection,bindingsDigest:r.bindingsDigest,stateDigest:stateBefore,bindings:r.bindings},manifestBytes=Buffer.from(JSON.stringify(manifest));safeExportBytes(manifestBytes,this.c);ensure(total+manifestBytes.length<=30*1024*1024,'EXPORT_TOO_LARGE','成果包文件与清单合计超过 30 MiB',413);ensure(this.stateDigest(pid)===stateBefore,'REPORT_EXPORT_STALE','收集期间报告或关联状态发生变化');return {manifest,files};
    }
}
