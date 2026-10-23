import {assertAutomaticApprovalReference,assertAutomaticTextContinuation} from './automatic-approval-proof.js';
import {randomUUID} from 'node:crypto';
import type {ResearchApp} from '../research-app.js';
import type {Actor,Approval,Artifact,Evidence,ModelConfig,Row,Session} from '../domain/types.js';
import type {DocumentVersion} from '../documents/types.js';
import type {DocumentParseJob,DocumentParseResult} from '../documents/parse-types.js';
import type {Corpus,Configuration,DocumentSourceRef} from '../text-evidence/service.js';
import {Store,digest,now} from '../storage/store.js';
import {ensure,asError} from '../domain/errors.js';
import {object,text,integer} from '../contracts/validation.js';
import {scope,userOnly} from './permissions.js';
import {assertProjectWritable} from './lifecycle.js';
import {assertDiscoveryDocument} from './discovery-grant-validation.js';
import {assertPmcArtifactRead,isPmcArtifact,pmcOwner,verifyPmcText} from '../documents/pmc-text.js';

export interface TextCorpusGrantReference {id:string;digest:string;approvalId:string;}
export interface TextCorpusGrant {
    automaticApproval?:import('./automatic-approvals.js').AutomaticApprovalReference;
    sessionId:string;model:ModelConfig;corpusId:string;configurationVersion:number;
    documents:Array<{documentVersionId:string;parseResultId:string;sourceDigest:string}>;
    pmcDocuments?:Array<{documentVersionId:string;sourceDigest:string}>;
    maxSearches:number;expiresAt:string;approvalId:string;digest:string;
    state:'draft'|'active'|'revoked';activatedAt?:string;revokedAt?:string;
}
export interface TextCorpusGrantUse {grantId:string;grantDigest:string;sessionId:string;requestDigest:string;searchId:string;}
export type TextCorpusGrantDTO=Row<TextCorpusGrant>&{effectiveState:'draft'|'active'|'revoked'|'stale'|'expired'|'exhausted';validity:'current'|'stale';reasons:string[];usage:{limit:number;used:number;remaining:number;unit:'search'};uses:Array<Row<TextCorpusGrantUse>>;searchResults:Array<Row>};
export const textCorpusGrantReference=(g:Row<TextCorpusGrant>):TextCorpusGrantReference=>({id:g.id,digest:g.digest,approvalId:g.approvalId});
const payload=(g:TextCorpusGrant)=>{const {sessionId,model,corpusId,configurationVersion,documents,maxSearches,expiresAt,approvalId}=g;return {sessionId,model,corpusId,configurationVersion,documents,maxSearches,expiresAt,approvalId,...(g.pmcDocuments?{pmcDocuments:g.pmcDocuments}:{})};};
const pairKey=(p:{documentVersionId:string;parseResultId:string})=>`${p.documentVersionId}\0${p.parseResultId}`;

/** Metadata only: reject stale authority before opening any original or page file. */
export function assertCorpusDocument(store:Store,pid:string,ref:DocumentSourceRef){
    const d=store.get<DocumentVersion>('document-version',ref.documentVersionId,pid),r=store.get<DocumentParseResult>('document-parse-result',ref.parseResultId,pid),j=store.get<DocumentParseJob>('document-parse-job',r.jobId,pid),a=store.get<Approval>('approval',j.approvalId,pid);
    ensure(d.contentKind==='original-pdf'&&d.original.mediaType==='application/pdf'&&digest(d)===ref.documentDigest&&digest(r)===ref.resultDigest&&r.documentVersionId===d.id&&r.rawDigest===d.original.digest&&r.pageCount===r.pages.length&&r.pages.every((p,i)=>p.pageNumber===i+1)&&digest(r.pages)===digest(ref.pages),'TEXT_DOCUMENT_STALE','固定 PDF 文档或解析结果已改变');
    ensure(j.id===ref.jobId&&j.documentVersionId===d.id&&j.state==='succeeded'&&j.integrity==='complete'&&j.resultId===r.id&&j.manifestDigest===ref.manifestDigest&&r.manifestDigest===j.manifestDigest&&digest(j.manifest)===j.manifestDigest&&j.manifest.documentDigest===ref.documentDigest&&j.manifest.rawDigest===r.rawDigest&&j.approvalId===ref.approvalId,'TEXT_DOCUMENT_STALE','固定解析任务已改变');
    ensure(a.subjectKind==='document-parse-job'&&a.subjectId===j.id&&a.scope==='document.parse'&&a.digest===j.manifestDigest&&a.status==='approved'&&!a.runGrant&&!a.workingGrant,'APPROVAL_STALE','固定解析批准已失效');
    assertDiscoveryDocument(store,pid,d);
}
function record(store:Store,pid:string,id:string){
    const g=store.get<TextCorpusGrant>('text-corpus-grant',id,pid),a=store.get<Approval>('approval',g.approvalId,pid);
    ensure(digest(payload(g))===g.digest&&Number.isInteger(g.maxSearches)&&g.maxSearches>=1&&g.maxSearches<=2,'TEXT_GRANT_CORRUPTED','固定原文授权已改变');
    ensure(g.pmcDocuments===undefined?g.documents.length>0:g.pmcDocuments.length===1&&g.documents.length===0,'TEXT_GRANT_CORRUPTED','PMC 授权只允许一份固定文档，不能混入 PDF');
    ensure(a.subjectKind==='text-corpus-grant'&&a.subjectId===g.id&&a.digest===g.digest&&a.scope==='text-corpus-grant.activate'&&!a.runGrant&&!a.workingGrant,'APPROVAL_STALE','原文授权批准身份不符');
    return {grant:g,approval:a};
}
function sources(store:Store,pid:string,g:TextCorpusGrant){
    const config=store.get<Configuration>('text-evidence-settings',pid,pid);
    ensure(config.enabled,'TEXT_EVIDENCE_DISABLED','本地原文检索已关闭');
    ensure(config.corpusId===g.corpusId&&config.version===g.configurationVersion,'TEXT_EVIDENCE_CONFIGURATION_CHANGED','文献集合已改变');
    const corpus=store.get<Corpus>('text-corpus',g.corpusId,pid);
    ensure(digest({projectId:pid,sources:corpus.sources,documents:corpus.documents,parserVersion:corpus.parserVersion,...(corpus.pmcDocuments?{pmcDocuments:corpus.pmcDocuments}:{})})===g.corpusId,'TEXT_DOCUMENT_STALE','固定语料内容与标识不符');
    const refs=g.documents.map(p=>{const ref=corpus.documents?.find(r=>pairKey(r)===pairKey(p));ensure(ref&&digest(ref)===p.sourceDigest,'TEXT_DOCUMENT_STALE','固定授权来源已改变');return ref;});
    for(const p of g.pmcDocuments??[]){const ref=corpus.pmcDocuments?.find(r=>r.documentVersionId===p.documentVersionId);ensure(ref&&digest(ref)===p.sourceDigest&&digest(store.get<DocumentVersion>('document-version',p.documentVersionId,pid))===ref.documentDigest,'PMC_SOURCE_STALE','固定 PMC 授权来源已改变');}
    refs.forEach(ref=>assertCorpusDocument(store,pid,ref));return refs;
}
export function assertTextCorpusGrantActor(store:Store,actor:Actor,pid:string,reference?:TextCorpusGrantReference){
    scope(actor,pid);assertProjectWritable(store,pid);
    ensure(actor.type==='agent'&&actor.sessionId&&actor.role==='coordinator'&&!actor.taskId&&(!actor.wakeupId||!!actor.continuationId),'PERMISSION_DENIED','PDF 检索仅允许明确授权的主 Pi 会话',403);
    const s=store.get<Session>('session',actor.sessionId,pid);
    ensure(s.textCorpusGrantId,'PERMISSION_DENIED','此主会话没有固定 PDF 检索授权',403);
    const {grant:g,approval}=record(store,pid,s.textCorpusGrantId);
    if(g.automaticApproval)assertAutomaticApprovalReference(store,g.automaticApproval);
    if(actor.wakeupId){ensure(g.automaticApproval,'PERMISSION_DENIED','原文续接需要新的准确派生授权');assertAutomaticTextContinuation(store,actor,g.automaticApproval);}
    ensure(!reference||digest(reference)===digest(textCorpusGrantReference(g)),'TEXT_GRANT_STALE','检索授权引用不符');
    ensure(g.state==='active'&&approval.status==='approved','TEXT_GRANT_REVOKED','原文授权未激活或已撤销');
    ensure(g.sessionId===s.id&&s.role==='coordinator'&&!s.taskId&&s.state!=='archived'&&digest(s.model)===digest(g.model),'TEXT_GRANT_SCOPE_CHANGED','指定主会话或模型已改变');
    ensure(s.generation===actor.generation&&s.state==='running'&&s.leaseUntil>Date.now(),'LEASE_EXPIRED','会话已中止或租约过期');
    ensure(Date.now()<Date.parse(g.expiresAt),'TEXT_GRANT_EXPIRED','原文授权已到期');
    sources(store,pid,g);return g;
}
/** A PDF grant never permits reading an entire parser artifact through a generic tool. */
export function isPdfArtifact(store:Store,pid:string,id:string){
    const a=store.get<Artifact>('artifact',id,pid);
    // ponytail: scan existing provenance records; add an artifact index if PDF catalogs grow.
    return a.origin==='document-parser'||store.list<DocumentVersion>('document-version',pid).some(d=>d.contentKind==='original-pdf'&&(d.original.artifactId===id||d.derivedText?.artifactId===id))||store.list<DocumentParseResult>('document-parse-result',pid).some(r=>r.manifestArtifactId===id||r.pages.some(p=>p.textArtifactId===id||p.imageArtifactId===id));
}
export function assertPdfArtifactRead(store:Store,actor:Actor,pid:string,id:string){
    if(actor.type==='agent'&&!actor.taskId&&(!actor.wakeupId||!!actor.continuationId))ensure(!isPdfArtifact(store,pid,id),'TEXT_GRANT_TOOL_DENIED','PDF 原件和解析页仅通过固定授权词项检索读取',403);
}

export class TextCorpusGrantService {
    constructor(private app:ResearchApp){}
    inspect(actor:Actor,pid:string,id:string):TextCorpusGrantDTO {
        userOnly(actor);scope(actor,pid);const g=this.app.store.get<TextCorpusGrant>('text-corpus-grant',id,pid),reasons:string[]=[];if(g.pmcDocuments)pmcOwner(actor);
        try{const {approval}=record(this.app.store,pid,id);ensure(g.state==='draft'?['pending','approved'].includes(approval.status):g.state==='active'&&approval.status==='approved','TEXT_GRANT_REVOKED','原文授权已失效');const s=this.app.store.get<Session>('session',g.sessionId,pid);ensure(s.role==='coordinator'&&!s.taskId&&s.state!=='archived'&&digest(s.model)===digest(g.model)&&(g.state!=='active'||s.textCorpusGrantId===g.id),'TEXT_GRANT_SCOPE_CHANGED','指定会话或模型改变');sources(this.app.store,pid,g);}catch(error){reasons.push(asError(error).code);}
        const uses=this.app.store.list<TextCorpusGrantUse>('text-corpus-grant-use',pid).filter(u=>u.grantId===id),remaining=Math.max(0,g.maxSearches-uses.length);
        const effectiveState=g.state==='revoked'?'revoked':reasons.length?'stale':Date.now()>=Date.parse(g.expiresAt)?'expired':g.state==='draft'?'draft':remaining===0?'exhausted':'active';
        return {...g,effectiveState,validity:reasons.length?'stale':'current',reasons,usage:{limit:g.maxSearches,used:uses.length,remaining,unit:'search'},uses,searchResults:uses.map(u=>this.app.store.get('text-evidence-search',u.searchId,pid))};
    }
    prepare(actor:Actor,pid:string,value:unknown){
        userOnly(actor);scope(actor,pid);const x=object(value);ensure(Object.keys(x).every(k=>['sessionId','documents','pmcDocuments','corpusId','configurationVersion','maxSearches','expiresAt'].includes(k)),'INVALID_INPUT','原文授权包含未知字段');
        if(x.pmcDocuments!==undefined)pmcOwner(actor);
        return this.app.store.transaction(()=>{
            assertProjectWritable(this.app.store,pid);const s=this.app.store.get<Session>('session',text(x.sessionId,'sessionId',100),pid);
            ensure(s.role==='coordinator'&&!s.taskId&&s.state!=='archived'&&!s.textCorpusGrantId,'TEXT_GRANT_SESSION_REQUIRED','请选择尚未绑定原文授权的主协调会话');
            const selected=this.app.textEvidence.authorizeSearch(actor,pid,{documents:x.documents,pmcDocuments:x.pmcDocuments,corpusId:x.corpusId,configurationVersion:x.configurationVersion});
            ensure(x.pmcDocuments===undefined?selected.pairs.length>0:selected.pmcPairs.length===1&&selected.pairs.length===0,'TEXT_SOURCE_REQUIRED','请选择精确 PDF 解析版本，或单独选择一份 PMC 文档');
            selected.pmcRefs.forEach(({title,...ref})=>verifyPmcText(this.app.context,pid,ref.documentVersionId,ref));
            const expiresAt=text(x.expiresAt,'expiresAt',50);ensure(Date.parse(expiresAt)>Date.now()&&Date.parse(expiresAt)<=Date.now()+86400000,'INVALID_INPUT','期限必须在未来24小时内');
            const fixed={sessionId:s.id,model:s.model,corpusId:selected.config.corpusId!,configurationVersion:selected.config.version,documents:selected.documentRefs.map(ref=>({documentVersionId:ref.documentVersionId,parseResultId:ref.parseResultId,sourceDigest:digest(ref)})),...(selected.pmcRefs.length?{pmcDocuments:selected.pmcRefs.map(ref=>({documentVersionId:ref.documentVersionId,sourceDigest:digest(ref)}))}:{}),maxSearches:integer(x.maxSearches,'maxSearches',1,2),expiresAt:new Date(expiresAt).toISOString()};
            const id=randomUUID(),a=this.app.approvals.request(pid,'text-corpus-grant',id,'','text-corpus-grant.activate','仅批准指定主 Pi 会话对选定固定原文最多两次新词项检索；不授权全文下载、联网、计算或科学结论'),hash=digest({...fixed,approvalId:a.id});
            this.app.store.update<Approval>('approval',a.id,a.version,{digest:hash});this.app.store.create<TextCorpusGrant>('text-corpus-grant',pid,{...fixed,approvalId:a.id,digest:hash,state:'draft'},id);this.app.store.event(pid,'text-corpus-grant.prepared',{grantId:id,sessionId:s.id,approvalId:a.id});return this.inspect(actor,pid,id);
        });
    }
    activate(actor:Actor,pid:string,value:unknown){
        userOnly(actor);scope(actor,pid);const x=object(value);return this.app.store.transaction(()=>{
            assertProjectWritable(this.app.store,pid);const {grant:g}=record(this.app.store,pid,text(x.grantId,'grantId',100)),s=this.app.store.get<Session>('session',g.sessionId,pid);
            if(g.pmcDocuments)pmcOwner(actor);
            ensure(g.state==='draft'&&g.version===integer(x.expectedVersion,'expectedVersion',1),'VERSION_CONFLICT','草案已变化或撤销');
            ensure(!s.textCorpusGrantId&&s.role==='coordinator'&&!s.taskId&&s.state!=='archived'&&digest(s.model)===digest(g.model),'TEXT_GRANT_SCOPE_CHANGED','指定会话或模型改变');
            ensure(Date.now()<Date.parse(g.expiresAt),'TEXT_GRANT_EXPIRED','原文授权已到期');sources(this.app.store,pid,g);this.app.approvals.assert(g.approvalId,pid,g.id,g.digest,'text-corpus-grant.activate');
            for(const p of g.pmcDocuments??[])verifyPmcText(this.app.context,pid,p.documentVersionId);
            this.app.store.update<Session>('session',s.id,s.version,{textCorpusGrantId:g.id});this.app.store.update<TextCorpusGrant>('text-corpus-grant',g.id,g.version,{state:'active',activatedAt:now()});this.app.store.event(pid,'text-corpus-grant.activated',{grantId:g.id,sessionId:s.id});return this.inspect(actor,pid,g.id);
        });
    }
    revoke(actor:Actor,pid:string,value:unknown){
        userOnly(actor);scope(actor,pid);const x=object(value);return this.app.store.transaction(()=>{const g=this.app.store.get<TextCorpusGrant>('text-corpus-grant',text(x.grantId,'grantId',100),pid);if(g.state==='revoked')return this.inspect(actor,pid,g.id);this.app.store.update<TextCorpusGrant>('text-corpus-grant',g.id,integer(x.expectedVersion,'expectedVersion',1),{state:'revoked',revokedAt:now()});this.app.approvals.stale(g.id);this.app.store.event(pid,'text-corpus-grant.revoked',{grantId:g.id});return this.inspect(actor,pid,g.id);});
    }
    authorizeContent(actor:Actor,pid:string,name:string,x:Record<string,unknown>){
        let pmcEvidence:Evidence|undefined;
        if(actor.type==='agent'){
            if(name==='artifact_read'||name==='evidence_register')assertPmcArtifactRead(this.app.store,actor,pid,x.artifactId as string);
            if(name==='evidence_read'){
                const e=this.app.store.get<Evidence>('evidence',x.evidenceId as string,pid);
                if(e.providerText||isPmcArtifact(this.app.store,pid,e.artifactId)){
                    const session=actor.sessionId?this.app.store.get<Session>('session',actor.sessionId,pid):undefined;
                    const grant=session?.textCorpusGrantId?this.app.store.get<TextCorpusGrant>('text-corpus-grant',session.textCorpusGrantId,pid):undefined;
                    ensure(e.providerText&&!actor.taskId&&(!actor.wakeupId||this.app.automaticApprovals.isContinuation(actor))&&grant?.pmcDocuments,'PMC_OWNER_ONLY','PMC 原文证据未授权给此 Agent',403);
                    pmcEvidence=e;
                }
            }
        }
        if(actor.type!=='agent'||actor.taskId||actor.wakeupId&&!this.app.automaticApprovals.isContinuation(actor))return;
        if(name==='artifact_read'||name==='evidence_register'){assertPdfArtifactRead(this.app.store,actor,pid,x.artifactId as string);return;}
        if(name!=='evidence_read')return;
        const evidence=this.app.store.get<Evidence>('evidence',x.evidenceId as string,pid);
        if(!pmcEvidence&&!evidence.document&&!isPdfArtifact(this.app.store,pid,evidence.artifactId))return;
        const g=assertTextCorpusGrantActor(this.app.store,actor,pid);
        if(pmcEvidence)ensure(g.pmcDocuments?.some(p=>p.documentVersionId===evidence.providerText!.documentVersionId),'TEXT_GRANT_EVIDENCE_DENIED','PMC 证据来源不在此授权内',403);
        const allowed=this.app.store.list<TextCorpusGrantUse>('text-corpus-grant-use',pid).filter(u=>u.grantId===g.id&&u.grantDigest===g.digest&&u.sessionId===g.sessionId).some(u=>{
            type Hit={evidenceId:string|null;artifactId:string;digest:string;locator:Evidence['locator'];providerText?:Evidence['providerText'];quote?:string;alternativeSources?:Hit[]};
            const search=this.app.store.get<{textCorpusGrant:TextCorpusGrantReference;hits:Hit[]}>('text-evidence-search',u.searchId,pid);
            const matches=(h:Hit,quote?:string)=>h.evidenceId===evidence.id&&(!pmcEvidence||(h.artifactId===evidence.artifactId&&h.digest===evidence.digest&&digest(h.locator)===digest(evidence.locator)&&digest(h.providerText)===digest(evidence.providerText)&&quote===evidence.quote));
            return digest(search.textCorpusGrant)===digest(textCorpusGrantReference(g))&&search.hits.some(h=>matches(h,h.quote)||h.alternativeSources?.some(a=>matches(a,h.quote)));
        });
        ensure(allowed,'TEXT_GRANT_EVIDENCE_DENIED','只能回查此授权已返回的原文证据',403);
        // Agent evidence_read receipts also replay: validate bytes before returning a cached quote.
        if(pmcEvidence)this.app.evidence.verify(pid,evidence.id,false);
    }
}
