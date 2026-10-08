import {assertDiscoveryArtifact,assertDiscoveryDocument} from '../policy/discovery-grant-validation.js';
import {assertPdfArtifactRead,assertTextCorpusGrantActor,type TextCorpusGrantReference} from '../policy/text-corpus-grants.js';
import {verifyDocumentLink} from './document-link.js';
import {assertPmcArtifactRead,pmcOwner,verifyPmcText} from '../documents/pmc-text.js';
import type {ProviderTextEvidenceLink} from '../documents/types.js';
import type {DocumentParseResult} from '../documents/parse-types.js';
import {captureAcceptance,assertAcceptanceCurrent} from './acceptance.js';
import {assertProjectWritable} from '../policy/lifecycle.js';
import { readFileSync } from 'node:fs';
import {prepareArtifactBlob} from '../storage/artifact-blob.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Artifact, Evidence, Claim, Task, Row } from '../domain/types.js';
import { scope, userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { text, integer, strings } from '../contracts/validation.js';
import {environmentSecrets,redactEnvironment} from '../runtime/environment.js';
export class EvidenceService {
    constructor(private c: AppContext) { }
    /** Host-only staging: immutable CAS bytes, without publishing any database record. */
    prepareArtifact(projectId: string, title: string, bytes: Buffer, mediaType = 'text/plain', origin = 'user', extra: Partial<Artifact> = {}):Artifact {
        this.c.store.get('project', projectId);
        if(origin.startsWith('agent:')) {
            const secrets=environmentSecrets(this.c.dataDir);
            ensure(!secrets.some(secret=>mediaType.includes(secret)),'ARTIFACT_SECRET_METADATA','产物格式包含环境变量敏感值，未创建',409);
            title=redactEnvironment(this.c.dataDir,title);
            if(secrets.some(secret=>bytes.includes(Buffer.from(secret)))) {
                let content:string;try{content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);ensure(!content.includes('\0'),'ARTIFACT_SECRET_BINARY','二进制产物包含环境变量敏感值，未创建',409);}catch{ensure(false,'ARTIFACT_SECRET_BINARY','二进制产物包含环境变量敏感值，未创建',409);}
                bytes=Buffer.from(redactEnvironment(this.c.dataDir,content));
            }
        }
        text(title, 'title', 200);
        ensure(bytes.length <= 32 * 1024 * 1024, 'ARTIFACT_TOO_LARGE', '产物超过 32 MiB', 413);
        const blob=prepareArtifactBlob(this.c.store,bytes);
        return { ...extra, title, digest:blob.digest, size:blob.size, path:blob.blobPath, mediaType, origin };
    }
    /** Receives only host-prepared descriptors; callers fence authorization inside the publish transaction. */
    publishPrepared(projectId:string,prepared:Artifact){this.c.store.get('project',projectId);return this.c.store.create<Artifact>('artifact',projectId,prepared);}
    put(projectId:string,title:string,bytes:Buffer,mediaType='text/plain',origin='user',extra:Partial<Artifact>={}){return this.publishPrepared(projectId,this.prepareArtifact(projectId,title,bytes,mediaType,origin,extra));}
    read(actor: Actor, id: string) { const a = this.c.store.get<Artifact>('artifact', id); scope(actor, a.projectId!); ensure(a.origin!=='native-continuation'||actor.type!=='agent','NATIVE_CONTINUATION_PRIVATE','原生续跑材料不向普通助手提供',403); assertPmcArtifactRead(this.c.store,actor,a.projectId!,id); assertPdfArtifactRead(this.c.store,actor,a.projectId!,id); const bytes = readFileSync(this.c.store.paths.physical(a.path)); ensure(digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '产物内容校验失败', 409); return { artifact: a, bytes }; }
    register(actor: Actor, projectId: string, artifactId: string, start: number, end: number, description: string, type: Evidence['type'] = 'artifact', runId?: string) {
        scope(actor, projectId);
        const a = this.c.store.get<Artifact>('artifact', artifactId, projectId);
        ensure(a.origin!=='native-continuation','NATIVE_CONTINUATION_PRIVATE','原生续跑协议材料不能登记为科研证据或导出来源',403);
        assertDiscoveryArtifact(this.c.store,projectId,a);
        const { bytes } = this.read(actor, a.id);
        ensure(bytes.length <= 2 * 1024 * 1024 && !bytes.includes(0), 'EVIDENCE_TEXT_REQUIRED', '需要可定位的文本产物', 400);
        const content = bytes.toString('utf8');
        integer(start, 'start', 0, content.length);
        integer(end, 'end', start + 1, content.length);
        if (runId)
            this.c.store.get('run', runId, projectId);
        return this.c.store.create<Evidence>('evidence', projectId, { type, artifactId: a.id, digest: a.digest, locator: { start, end }, quote: content.slice(start, end), description: text(description, 'description', 2000), ...(runId ? { runId } : {}) });
    }
    verify(projectId: string, evidenceId: string, current=true) { const e = this.c.store.get<Evidence>('evidence', evidenceId, projectId); const { artifact, bytes } = this.read({ type: 'system' }, e.artifactId); ensure(artifact.projectId === projectId && artifact.digest === e.digest && bytes.toString('utf8').slice(e.locator.start, e.locator.end) === e.quote, 'EVIDENCE_INVALID', '证据引用或内容已失效', 409); if(current)assertDiscoveryArtifact(this.c.store,projectId,artifact); if(e.providerText)verifyPmcText(this.c,projectId,e.providerText.documentVersionId,e.providerText,e.artifactId); if(e.document){const link=verifyDocumentLink(this.c,projectId,e.document,e.artifactId);if(current)assertDiscoveryDocument(this.c.store,projectId,link.document);} return e; }
    /** Host local search only; no caller-supplied authority flag or new agent tool. */
    registerProviderText(actor:Actor,projectId:string,providerText:ProviderTextEvidenceLink,start:number,end:number,description:string){
        pmcOwner(actor);scope(actor,projectId);assertProjectWritable(this.c.store,projectId);
        return this.registerProviderTextCore(actor,projectId,providerText,start,end,description);
    }
    /** Host search path only; never exposed as a tool or a caller-supplied authority flag. */
    registerGrantedProviderText(actor:Actor,projectId:string,providerText:ProviderTextEvidenceLink,start:number,end:number,description:string,reference?:TextCorpusGrantReference){
        return this.c.store.transaction(()=>{
            ensure(reference,'TEXT_GRANT_REQUIRED','缺少固定检索授权');
            const grant=assertTextCorpusGrantActor(this.c.store,actor,projectId,reference);
            ensure(grant.pmcDocuments?.some(p=>p.documentVersionId===providerText.documentVersionId),'TEXT_GRANT_SOURCE_DENIED','PMC 证据来源不在授权内',403);
            return this.registerProviderTextCore({type:'system'},projectId,providerText,start,end,description);
        });
    }
    private registerProviderTextCore(actor:Actor,projectId:string,providerText:ProviderTextEvidenceLink,start:number,end:number,description:string){
        return this.c.store.transaction(()=>{const {document}=verifyPmcText(this.c,projectId,providerText.documentVersionId,providerText);const e=this.register(actor,projectId,document.derivedText!.artifactId,start,end,description,'paper');return this.c.store.update<Evidence>('evidence',e.id,e.version,{providerText});});
    }
    registerDocument(actor:Actor,projectId:string,input:{documentVersionId:string;parseResultId:string;pageNumber:number;start:number;end:number;description:string}) {
        userOnly(actor);scope(actor,projectId);assertProjectWritable(this.c.store,projectId);
        return this.registerDocumentCore(actor,projectId,input);
    }
    /** Host search path only; no tool exposes this method or accepts an authority flag. */
    registerGrantedDocument(actor:Actor,projectId:string,input:Parameters<EvidenceService['registerDocument']>[2],reference?:TextCorpusGrantReference){
        return this.c.store.transaction(()=>{
            ensure(reference,'TEXT_GRANT_REQUIRED','缺少固定检索授权');
            const grant=assertTextCorpusGrantActor(this.c.store,actor,projectId,reference);
            ensure(grant.documents.some(p=>p.documentVersionId===input.documentVersionId&&p.parseResultId===input.parseResultId),'TEXT_GRANT_SOURCE_DENIED','证据来源不在授权内',403);
            return this.registerDocumentCore({type:'system'},projectId,input);
        });
    }
    private registerDocumentCore(actor:Actor,projectId:string,input:Parameters<EvidenceService['registerDocument']>[2]) {
        return this.c.store.transaction(()=>{
            const result=this.c.store.get<DocumentParseResult>('document-parse-result',input.parseResultId,projectId);
            const page=result.pages.find(p=>p.pageNumber===integer(input.pageNumber,'pageNumber',1,10000));ensure(page,'DOCUMENT_PAGE_NOT_FOUND','原文没有该页',404);
            const document={documentVersionId:input.documentVersionId,rawDigest:result.rawDigest,parseResultId:result.id,pageNumber:page.pageNumber,textArtifactDigest:page.textArtifactDigest};
            assertDiscoveryDocument(this.c.store,projectId,verifyDocumentLink(this.c,projectId,document,page.textArtifactId).document);
            const e=this.register(actor,projectId,page.textArtifactId,input.start,input.end,input.description,'paper');
            return this.c.store.update<Evidence>('evidence',e.id,e.version,{document});
        });
    }
    proposeClaim(actor: Actor, projectId: string, statement: string, evidenceIds: string[], limitations: string[] = [], taskId?: string) {
        scope(actor,projectId);ensure(evidenceIds.length>0,'EVIDENCE_REQUIRED','结论候选必须引用证据',400);
        evidenceIds.forEach(id=>this.verify(projectId,id));
        const task=taskId ? this.c.store.get<Task>('task',taskId,projectId) : undefined;
        return this.c.store.create<Claim>('claim',projectId,{statement:text(statement,'statement',10000),evidenceIds:strings(evidenceIds,'evidenceIds'),
            limitations:strings(limitations,'limitations'),status:'proposal',validity:'current',
            ...(task?{taskId:task.id,sourceAttemptId:task.attemptId,sourceResultDigest:task.result ? digest(task.result):undefined}:{})});
    }
    /** File hashes establish integrity; acceptance bindings establish applicability. */
    assertClaimCurrent(claim: Row<Claim>) {
        ensure(claim.validity!=='stale','CLAIM_STALE','结论依赖的前提或审查已撤销，不能作为当前结论使用');
        const sourceTasks=new Set(claim.taskId?[claim.taskId]:[]);
        claim.evidenceIds.forEach(id=>{const e=this.verify(claim.projectId!,id);const a=this.c.store.get<Artifact>('artifact',e.artifactId,claim.projectId!);if(a.taskId)sourceTasks.add(a.taskId);});
        const refs=claim.sourceAcceptanceIds ?? (claim.sourceAcceptanceId?[claim.sourceAcceptanceId]:[]);
        const bound=new Set(refs.map(id=>assertAcceptanceCurrent(this.c.store,claim.projectId!,id).taskId));
        ensure([...sourceTasks].every(id=>bound.has(id)),'CLAIM_REAPPROVAL_REQUIRED','历史任务结论缺少当前版本采纳依据，请重新核验后采纳');
        return claim;
    }
    decideClaim(actor: Actor, id: string, version: number, status: Claim['status']) {
        userOnly(actor);
        return this.c.store.transaction(()=>{
            const c=this.c.store.get<Claim>('claim',id);scope(actor,c.projectId!);assertProjectWritable(this.c.store,c.projectId!);
            ensure(['accepted','rejected','disputed'].includes(status),'INVALID_INPUT','结论状态无效',400);
            const taskIds=new Set(c.taskId?[c.taskId]:[]);
            c.evidenceIds.forEach(id=>{const e=this.verify(c.projectId!,id,status==='accepted');const a=this.c.store.get<Artifact>('artifact',e.artifactId,c.projectId!);if(a.taskId)taskIds.add(a.taskId);});
            const refs:string[]=[];
            if(status==='accepted') {
                ensure(c.validity!=='stale','CLAIM_STALE','旧前提已撤销，需要新任务结果或显式重新研究，不能直接重置历史结论');
                if(c.taskId) {
                    const t=this.c.store.get<Task>('task',c.taskId,c.projectId!);
                    ensure((!c.sourceAttemptId || c.sourceAttemptId===t.attemptId) && (!c.sourceResultDigest || c.sourceResultDigest===digest(t.result)) &&
                        t.result?.claims.some(p=>p.statement===c.statement && digest(p.evidenceIds)===digest(c.evidenceIds)),
                        'CLAIM_STALE','结论不属于当前任务提交版本');
                }
                for(const tid of taskIds) refs.push(captureAcceptance(this.c.store,c.projectId!,tid).id);
            }
            const sourceAcceptanceId=c.taskId && status==='accepted' ? refs.find(ref=>this.c.store.get('acceptance-record',ref).taskId===c.taskId):c.sourceAcceptanceId;
            const next=this.c.store.update<Claim>('claim',id,version,{status,...(status==='accepted'?{sourceAcceptanceId,sourceAcceptanceIds:refs,validity:'current'}:{})});
            this.c.store.event(c.projectId,'claim.decided',{claimId:id,status,sourceAcceptanceIds:refs});return next;
        });
    }
}
