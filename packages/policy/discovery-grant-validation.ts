import type {Store} from '../storage/store.js';
import {digest} from '../storage/store.js';
import type {Actor,Approval,Artifact,Row,Session} from '../domain/types.js';
import type {DiscoveryGrant,DiscoveryGrantReference,DiscoveryContext,DiscoveryOperation,DiscoveryCall} from './discovery-grant-types.js';
import {ensure} from '../domain/errors.js';
import {connectorSettings,assertSourceEnabled} from '../connectors/settings.js';
import {parseSearch,routePaperId,type SourceId} from '../connectors/contracts.js';
import type {SearchRecord} from '../connectors/service.js';
import type {DocumentVersion} from '../documents/types.js';
import type {DocumentParseJob} from '../documents/parse-types.js';
import {assertProjectWritable} from './lifecycle.js';

export function discoveryGrantPayload(g:DiscoveryGrant){const {sessionId,model,settingsVersion,sources,searches,targets,allowSearchResults,formats,maxRequests,maxResponseBytes,expiresAt,approvalId}=g;return {sessionId,model,settingsVersion,sources,searches,targets,allowSearchResults,formats,maxRequests,maxResponseBytes,expiresAt,approvalId};}
export const discoveryReference=(g:Row<DiscoveryGrant>):DiscoveryGrantReference=>({id:g.id,digest:g.digest,approvalId:g.approvalId});
export function assertDiscoveryGrantRecord(store:Store,pid:string,id:string){const g=store.get<DiscoveryGrant>('discovery-grant',id,pid),a=store.get<Approval>('approval',g.approvalId,pid);ensure(digest(discoveryGrantPayload(g))===g.digest,'DISCOVERY_GRANT_CORRUPTED','固定发现授权已改变');ensure(a.subjectKind==='discovery-grant'&&a.subjectId===g.id&&a.digest===g.digest&&a.scope==='discovery-grant.activate'&&!a.workingGrant&&!a.runGrant,'APPROVAL_STALE','发现授权原批准身份不符');return {grant:g,approval:a};}
export function assertDiscoveryGrantReference(store:Store,pid:string,ref:DiscoveryGrantReference){const {grant:g,approval}=assertDiscoveryGrantRecord(store,pid,ref.id);ensure(g.digest===ref.digest&&g.approvalId===ref.approvalId,'DISCOVERY_GRANT_STALE','发现授权原身份已改变');ensure(g.state==='active'&&approval.status==='approved','DISCOVERY_GRANT_REVOKED','发现授权未激活或已撤销');return g;}
export function assertDiscoveryContext(store:Store,pid:string,ctx:DiscoveryContext,newRequest=false){const g=assertDiscoveryGrantReference(store,pid,ctx.reference),s=store.get<Session>('session',g.sessionId,pid);ensure(s.discoveryGrantId===g.id&&s.role==='coordinator'&&!s.taskId&&s.state!=='archived'&&digest(s.model)===digest(g.model),'DISCOVERY_SCOPE_CHANGED','指定会话或模型已改变');ensure(connectorSettings(store,pid).version===g.settingsVersion,'DISCOVERY_SETTINGS_CHANGED','来源设置已改变，请使用新的授权');if(newRequest)ensure(Date.now()<Date.parse(g.expiresAt),'DISCOVERY_GRANT_EXPIRED','发现授权已到期');return g;}
export function normalizedDiscoveryOperation(operation:DiscoveryOperation):DiscoveryOperation {
 if(operation.kind==='search')return {kind:'search',search:{...parseSearch(operation.search),sources:[...parseSearch(operation.search).sources].sort()}};
 const t=operation.target,target=routePaperId(t.id,t.source);let id=target.id,requestedVersion=t.requestedVersion;
 if(requestedVersion){ensure(target.source==='alphaxiv'||target.source==='biorxiv'&&t.format==='original-pdf','PAPER_VERSION_UNSUPPORTED','此来源不能指定版本');const v=requestedVersion.replace(/^v/,'');ensure(/^[1-9]\d{0,5}$/.test(v),'INVALID_INPUT','版本必须是正整数');if(target.source==='biorxiv')return {kind:'retrieve',target:{...target,format:t.format,requestedVersion:v}};const embedded=id.match(/v([1-9]\d*)$/)?.[1];ensure(!embedded||embedded===v,'PAPER_VERSION_MISMATCH','版本不一致');id=id.replace(/v[1-9]\d*$/,'')+'v'+v;requestedVersion=v;}
 // The canonical identifier itself fixes an arXiv version; avoid two equivalent policy forms.
 return {kind:'retrieve',target:{source:target.source,id,format:t.format}};
}
export function discoveryContext(store:Store,pid:string,actor:Actor,operation:DiscoveryOperation,key:string,ref?:DiscoveryGrantReference):DiscoveryContext|undefined {
 const s=actor.sessionId?store.get<Session>('session',actor.sessionId,pid):undefined;
 if(!ref&&!s?.discoveryGrantId)return undefined;
 const reference=ref??discoveryReference(store.get<DiscoveryGrant>('discovery-grant',s!.discoveryGrantId!,pid));
 const g=assertDiscoveryGrantReference(store,pid,reference);ensure(!actor.sessionId||actor.sessionId===g.sessionId,'DISCOVERY_SCOPE_DENIED','发现授权不属于此会话');
 if(actor.type==='agent')ensure(actor.role==='coordinator'&&!actor.taskId&&!actor.wakeupId&&actor.sessionId===g.sessionId,'DISCOVERY_SCOPE_DENIED','此授权仅用于指定的主协调会话');
 const normalized=normalizedDiscoveryOperation(operation),ctx={reference,sessionId:g.sessionId,operation:normalized,operationKey:key,callIds:[] as string[]};assertDiscoveryContext(store,pid,ctx,true);
 if(normalized.kind==='search')ensure(g.searches.some(q=>digest(q)===digest(normalized.search)),'DISCOVERY_REQUEST_DENIED','检索请求不在批准范围');
 else {const t=normalized.target;ensure(g.sources.includes(t.source)&&g.formats.includes(t.format),'DISCOVERY_TARGET_DENIED','来源或资料格式不在批准范围');const explicit=g.targets.some(v=>digest(normalizedDiscoveryOperation({kind:'retrieve',target:v}))===digest(normalized));
  const matches=(h:{source:SourceId;id:string})=>{try{return h.source===t.source&&routePaperId(h.id,h.source).id===t.id;}catch{return false;}};
  const hit=g.allowSearchResults&&!t.requestedVersion&&store.list<SearchRecord>('connector-search',pid).some(r=>r.discoveryGrant&&digest(r.discoveryGrant)===digest(reference)&&r.scopeSessionId===g.sessionId&&g.searches.some(q=>digest(q)===digest(r.request))&&r.items.some(h=>matches(h)||h.duplicates.some(matches)));
  ensure(explicit||hit,'DISCOVERY_TARGET_DENIED','资料不是明确批准目标或本授权检索命中');}
 return ctx;
}
export const discoveryScope=(scope:string,ctx?:DiscoveryContext|DiscoveryGrantReference)=>ctx?`${scope}:grant:${'reference'in ctx?ctx.reference.id:ctx.id}`:scope;
export function reserveConnectorCall(store:Store,pid:string,source:SourceId,url:URL,ctx?:DiscoveryContext):Row<DiscoveryCall>{return store.transaction(()=>{assertProjectWritable(store,pid);assertSourceEnabled(store,pid,source);const cfg=connectorSettings(store,pid),calls=store.list<DiscoveryCall>('connector-call',pid);ensure(calls.length<cfg.requestLimit,'CONNECTOR_BUDGET_EXCEEDED','已达到项目网络请求次数上限');let fields:Partial<DiscoveryCall>={},id:string|undefined;
 if(ctx){const g=assertDiscoveryContext(store,pid,ctx,true);ensure(g.sources.includes(source),'DISCOVERY_SOURCE_DENIED','请求来源未获批准');const safe=new URL(url);for(const name of ['api_key','email','mailto'])safe.searchParams.delete(name);const operationKeyDigest=digest(ctx.operationKey),requestDigest=digest(ctx.operation),requestUrlDigest=digest(safe.toString());id=digest({grantId:g.id,operationKeyDigest,source,requestUrlDigest});ensure(!store.maybe('connector-call',id),'DISCOVERY_REQUEST_ALREADY_SENT','该请求已保留外发记录；无最终回执时须核对后显式重试');ensure(calls.filter(c=>c.discoveryGrant?.id===g.id).length<g.maxRequests,'DISCOVERY_GRANT_EXHAUSTED','发现授权的HTTP请求额度已用完');fields={discoveryGrant:ctx.reference,operationKeyDigest,requestDigest,requestUrlDigest};}
 const call=store.create<DiscoveryCall>('connector-call',pid,{source,host:url.hostname,status:'reserved',startedAt:new Date().toISOString(),...fields},id);ctx?.callIds.push(call.id);return call;});}
export function assertDiscoveryArtifact(store:Store,pid:string,a:Row<Artifact>){
 // Parsed pages retain their source through the existing fixed parser manifest.
 for(const r of store.db.prepare("SELECT data FROM records WHERE kind='document-parse-job' AND project_id=? AND EXISTS(SELECT 1 FROM json_each(data,'$.artifactIds') WHERE value=?)").all(pid,a.id)){
  const job=JSON.parse(r.data as string) as Row<DocumentParseJob>;assertDiscoveryDocument(store,pid,store.get<DocumentVersion>('document-version',job.documentVersionId,pid));
 }
 const producer=store.db.prepare("SELECT data FROM records WHERE kind='paper-read' AND project_id=? AND (json_extract(data,'$.artifactId')=? OR EXISTS(SELECT 1 FROM json_each(data,'$.rawArtifactIds') WHERE value=?)) AND json_extract(data,'$.discoveryGrant.id') IS NOT NULL LIMIT 2").all(pid,a.id,a.id).map(r=>JSON.parse(r.data as string));
 if(!a.discoveryGrant&&!producer.length)return;ensure(a.discoveryGrant&&producer.length===1&&digest(producer[0].discoveryGrant)===digest(a.discoveryGrant),'DISCOVERY_SOURCE_STALE','资料的发现授权绑定改变');assertDiscoveryGrantReference(store,pid,a.discoveryGrant);
 ensure(Array.isArray(producer[0].discoveryCallIds)&&producer[0].discoveryCallIds.length>0,'DISCOVERY_SOURCE_STALE','资料缺少实际请求绑定');for(const id of producer[0].discoveryCallIds){const c=store.get<DiscoveryCall>('connector-call',id,pid);ensure(c.status==='succeeded'&&digest(c.discoveryGrant)===digest(a.discoveryGrant)&&c.requestDigest===producer[0].discoveryRequestDigest,'DISCOVERY_SOURCE_STALE','资料与原请求回执不一致');}
}
export function assertDiscoveryDocument(store:Store,pid:string,d:Row<DocumentVersion>){
 for(const item of [d.original,...(d.derivedText?[d.derivedText]:[])]){const a=store.get<Artifact>('artifact',item.artifactId,pid);ensure(digest(d.discoveryGrant)===digest(a.discoveryGrant),'DISCOVERY_SOURCE_STALE','文档与原件的发现授权绑定改变');assertDiscoveryArtifact(store,pid,a);}
}
export const discoveryProof=(ctx?:DiscoveryContext)=>ctx?{discoveryGrant:ctx.reference,discoveryCallIds:[...ctx.callIds],discoveryRequestDigest:digest(ctx.operation)}:{};
