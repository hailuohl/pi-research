import {readFileSync} from 'node:fs';
import type {AppContext} from '../domain/context.js';
import type {Actor,Artifact} from '../domain/types.js';
import type {DocumentVersion,ProviderTextEvidenceLink} from './types.js';
import {parsePmcFullText} from '../connectors/pmc.js';
import {ensure} from '../domain/errors.js';
import {digest, type Store} from '../storage/store.js';
import {userOnly} from '../policy/permissions.js';

export function pmcOwner(actor:Actor){userOnly(actor);ensure(!actor.sessionId&&!actor.taskId&&!actor.attemptId&&!actor.wakeupId,'PMC_OWNER_ONLY','PMC 原文仅允许未绑定会话的所有者操作',403);}

/** Classification is independent of corpus membership and optional evidence bindings. */
export function isPmcArtifact(store:Store,pid:string,id:string){
 const a=store.get<Artifact>('artifact',id,pid);
 // ponytail: scan provenance records; add an artifact index if the document catalog grows.
 return a.origin==='connector:pubmed:provider-text'||store.list<DocumentVersion>('document-version',pid).some(d=>d.source.provider==='pubmed'&&d.contentKind==='provider-text'&&[d.original.artifactId,d.derivedText?.artifactId,...(d.rawResponseArtifactIds??[])].includes(id))||store.list<{source:string;contentKind:string;artifactId:string;rawArtifactIds?:string[]}>('paper-read',pid).some(p=>p.source==='pubmed'&&p.contentKind==='full_text'&&[p.artifactId,...(p.rawArtifactIds??[])].includes(id));
}
export function assertPmcArtifactRead(store:Store,actor:Actor,pid:string,id:string){
 if(actor.type==='agent')ensure(!isPmcArtifact(store,pid,id),'PMC_OWNER_ONLY','PMC 原件和派生文本未授权给 Agent',403);
}

/** Verify saved XML and derived bytes locally; never acquire or refresh a provider record. */
export function verifyPmcText(c:AppContext,pid:string,id:string,expected?:ProviderTextEvidenceLink,artifactId?:string){
 const d=c.store.get<DocumentVersion>('document-version',id,pid),v=d.source.reportedVersion;
 ensure(d.contentKind==='provider-text'&&d.source.kind==='connector'&&d.source.provider==='pubmed'&&d.source.versionAssurance==='provider-record'&&!!v&&/^PMC[1-9]\d*\.[1-9]\d*$/.test(v)&&d.source.resolvedId===v&&d.source.requestedVersion===null&&!!d.source.requestedId&&/^[1-9]\d{0,11}$/.test(d.source.requestedId)&&d.pageMapping==='unavailable'&&!d.scopeSessionId&&!d.scopeTaskId&&!d.discoveryGrant&&d.license.assurance==='provider-reported'&&!!d.license.value&&d.original.mediaType==='application/xml'&&d.derivedText?.mediaType==='text/plain'&&d.rawResponseArtifactIds?.[0]===d.original.artifactId,'PMC_SOURCE_INVALID','只接受已固定的 owner PMC OA XML 与派生全文');
 const read=(ref:DocumentVersion['original'],origin:string)=>{const a=c.store.get<Artifact>('artifact',ref.artifactId,pid),bytes=readFileSync(c.store.paths.physical(a.path));ensure(a.origin===origin&&!a.taskId&&!a.runId&&!a.wakeupId&&!a.discoveryGrant&&a.digest===ref.digest&&a.size===ref.size&&a.mediaType===ref.mediaType&&bytes.length===ref.size&&digest(bytes)===ref.digest,'PMC_SOURCE_INVALID','PMC 来源产物描述或字节已改变');return bytes;};
 const raw=read(d.original,'connector:pubmed:raw'),bytes=read(d.derivedText!,'connector:pubmed:provider-text');
 let xml:string;try{xml=new TextDecoder('utf-8',{fatal:true}).decode(raw);}catch{ensure(false,'PMC_SOURCE_INVALID','PMC XML 不是 UTF-8');}
 const parsed=parsePmcFullText(xml!,d.source.requestedId!,v!.split('.')[0]!,d.pmcTextProfile);
 ensure(parsed.reportedVersion===v&&parsed.license===d.license.value&&digest(Buffer.from(parsed.content))===d.derivedText!.digest&&(!artifactId||artifactId===d.derivedText!.artifactId),'PMC_SOURCE_INVALID','PMC XML 身份、许可或派生文本绑定不一致');
 const link:ProviderTextEvidenceLink={documentVersionId:d.id,documentDigest:digest(d),rawDigest:d.original.digest,textArtifactDigest:d.derivedText!.digest,reportedVersion:v!};
 if(expected)ensure(digest(expected)===digest(link),'PMC_SOURCE_STALE','固定 PMC 文档版本已改变');
 return {document:d,link,bytes,content:parsed.content};
}
