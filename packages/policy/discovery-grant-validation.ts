import type {Store} from '../storage/store.js';
import {digest} from '../storage/store.js';
import type {Actor,Approval,Artifact,Row,Session,Task,TaskAttempt,TaskSpec,Team} from '../domain/types.js';
import type {DiscoveryGrant,DiscoveryGrantReference,DiscoveryContext,DiscoveryOperation,DiscoveryCall,DiscoveryTaskBinding} from './discovery-grant-types.js';
import {ensure} from '../domain/errors.js';
import {connectorSettings,assertSourceEnabled} from '../connectors/settings.js';
import {parseSearch,routePaperId,type SearchInput,type SourceId} from '../connectors/contracts.js';
import {pubmedOffset} from '../connectors/providers.js';
import type {SearchPageRequest,SearchRecord} from '../connectors/service.js';
import type {DocumentVersion} from '../documents/types.js';
import type {DocumentParseJob} from '../documents/parse-types.js';
import {assertProjectWritable} from './lifecycle.js';

export function discoveryGrantPayload(g:DiscoveryGrant){const {sessionId,model,settingsVersion,sources,searches,targets,allowSearchResults,formats,maxRequests,maxResponseBytes,expiresAt,approvalId,taskBinding}=g;return {...(taskBinding?{}:{sessionId}),model,settingsVersion,sources,searches,targets,allowSearchResults,formats,maxRequests,maxResponseBytes,expiresAt,approvalId,...(taskBinding?{taskBinding}:{})};}
export const discoveryReference=(g:Row<DiscoveryGrant>):DiscoveryGrantReference=>({id:g.id,digest:g.digest,approvalId:g.approvalId});
export function assertDiscoveryGrantRecord(store:Store,pid:string,id:string){const g=store.get<DiscoveryGrant>('discovery-grant',id,pid),a=store.get<Approval>('approval',g.approvalId,pid);ensure(digest(discoveryGrantPayload(g))===g.digest,'DISCOVERY_GRANT_CORRUPTED','固定发现授权已改变');ensure(a.subjectKind==='discovery-grant'&&a.subjectId===g.id&&a.digest===g.digest&&a.scope==='discovery-grant.activate'&&!a.workingGrant&&!a.runGrant,'APPROVAL_STALE','发现授权原批准身份不符');return {grant:g,approval:a};}
export function assertDiscoveryGrantReference(store:Store,pid:string,ref:DiscoveryGrantReference){const {grant:g,approval}=assertDiscoveryGrantRecord(store,pid,ref.id);ensure(g.digest===ref.digest&&g.approvalId===ref.approvalId,'DISCOVERY_GRANT_STALE','发现授权原身份已改变');ensure(g.state==='active'&&approval.status==='approved','DISCOVERY_GRANT_REVOKED','发现授权未激活或已撤销');return g;}
type TeamPlan=Row<{sourceRevisionId?:string;teamId:string;planVersion:number;directiveVersion:number;tasks:TaskSpec[];goal:string;digest:string;model:Session['model']}>;
const specFields=['skillIds','key','role','objective','dependencies','critical','reviewOf','required','inputEvidenceIds','expectedOutputs','acceptanceRuleIds'] as const;
export function discoveryTaskSpec(task:Row<Task>):TaskSpec {const spec:Record<string,unknown>={};for(const key of specFields)if(task[key]!==undefined)spec[key]=task[key];return spec as unknown as TaskSpec;}
export function discoveryTeamPlanDigest(plan:TeamPlan){return digest({id:plan.id,...(plan.sourceRevisionId?{sourceRevisionId:plan.sourceRevisionId}:{}),teamId:plan.teamId,planVersion:plan.planVersion,directiveVersion:plan.directiveVersion,tasks:plan.tasks,goal:plan.goal,digest:plan.digest,model:plan.model});}
export function buildDiscoveryTaskBinding(store:Store,pid:string,task:Row<Task>){
 const team=store.get<Team>('team',task.teamId,pid),plans=store.list<TeamPlan>('team-plan',pid).filter(p=>p.teamId===team.id);ensure(plans.length===1,'DISCOVERY_TASK_PLAN_INVALID','任务没有唯一的原始团队计划');const plan=plans[0]!;
 const approval=store.get<Approval>('approval',team.approvalId,pid);ensure(approval.subjectKind==='team'&&approval.subjectId===team.id&&approval.digest===team.planDigest&&approval.scope==='collaboration'&&!approval.workingGrant&&!approval.runGrant&&approval.status!=='rejected'&&approval.status!=='stale','DISCOVERY_TASK_APPROVAL_STALE','原团队计划批准身份无效');
 const spec=discoveryTaskSpec(task),specDigest=digest(spec);ensure(plan.teamId===team.id&&plan.planVersion===team.planVersion&&plan.directiveVersion===team.directiveVersion&&plan.digest===team.planDigest&&plan.tasks.some(x=>digest(x)===specDigest),'DISCOVERY_TASK_PLAN_INVALID','任务与原始团队计划不符');
 const binding:DiscoveryTaskBinding={taskId:task.id,teamId:team.id,teamApprovalId:team.approvalId,planDigest:team.planDigest,planVersion:team.planVersion,directiveVersion:team.directiveVersion,taskSpecDigest:specDigest,teamPlanId:plan.id,teamPlanVersion:plan.version,teamPlanDigest:discoveryTeamPlanDigest(plan),role:'literature'};
 return {binding,model:plan.model,team,plan};
}
export function assertTaskDiscoveryBinding(store:Store,pid:string,g:Row<DiscoveryGrant>,options:{requireUnclaimed?:boolean;requireApproved?:boolean}={}){
 const b=g.taskBinding;ensure(b,'DISCOVERY_TASK_BINDING_REQUIRED','此任务缺少固定发现授权');const task=store.get<Task>('task',b.taskId,pid),team=store.get<Team>('team',b.teamId,pid),plan=store.get<TeamPlan>('team-plan',b.teamPlanId,pid),approval=store.get<Approval>('approval',b.teamApprovalId,pid);
 ensure(task.id===b.taskId&&task.discoveryGrantId===g.id&&task.teamId===b.teamId&&task.role==='literature'&&b.role==='literature','DISCOVERY_TASK_BINDING_REQUIRED','任务发现授权标记或角色不符');
 ensure(team.id===b.teamId&&team.approvalId===b.teamApprovalId&&team.planDigest===b.planDigest&&team.planVersion===b.planVersion&&team.directiveVersion===b.directiveVersion,'DISCOVERY_TASK_PLAN_STALE','原团队计划或批准已改变');
 ensure(approval.subjectKind==='team'&&approval.subjectId===team.id&&approval.digest===b.planDigest&&approval.scope==='collaboration'&&!approval.workingGrant&&!approval.runGrant&&approval.status!=='rejected'&&approval.status!=='stale','DISCOVERY_TASK_APPROVAL_STALE','原团队批准已失效');if(options.requireApproved)ensure(approval.status==='approved','DISCOVERY_TASK_APPROVAL_REQUIRED','原团队计划尚未批准');
 ensure(plan.id===b.teamPlanId&&plan.version===b.teamPlanVersion&&plan.teamId===team.id&&plan.planVersion===b.planVersion&&plan.directiveVersion===b.directiveVersion&&plan.digest===b.planDigest&&discoveryTeamPlanDigest(plan)===b.teamPlanDigest&&digest(plan.model)===digest(g.model),'DISCOVERY_TASK_PLAN_STALE','原团队计划记录或模型已改变');
 const specDigest=digest(discoveryTaskSpec(task));ensure(specDigest===b.taskSpecDigest&&plan.tasks.some(x=>digest(x)===specDigest),'DISCOVERY_TASK_SPEC_STALE','文献任务规范已改变');
 ensure(isTaskDiscoveryScope(g),'DISCOVERY_TASK_SCOPE_INVALID','任务发现授权超出固定 Crossref 范围');
 if(options.requireUnclaimed)ensure(task.execution==='pending'&&task.attemptCount===0&&!task.attemptId&&!task.sessionId,'DISCOVERY_TASK_ALREADY_DISPATCHED','只能为尚未派发的文献任务授权');
 return {task,team,plan,approval};
}
export function isTaskDiscoveryScope(g:Pick<DiscoveryGrant,'sources'|'searches'|'targets'|'allowSearchResults'|'formats'|'maxRequests'>){
 const fixed=g.sources.length===1&&g.sources[0]==='crossref'&&g.maxRequests===1&&!g.allowSearchResults&&g.formats.length===1&&g.formats[0]==='provider-text';
 const search=g.searches.length===1&&g.searches[0]!.sources.length===1&&g.searches[0]!.sources[0]==='crossref'&&g.searches[0]!.strategy==='keyword'&&g.searches[0]!.prioritize==='default'&&g.targets.length===0;
 const target=g.targets[0];let doi=false;
 if(g.searches.length===0&&g.targets.length===1&&target?.source==='crossref'&&target.format==='provider-text'&&!target.requestedVersion){try{const routed=routePaperId(target.id,target.source);doi=routed.source==='crossref'&&routed.id===target.id&&/^10\.\d{4,9}\//.test(target.id);}catch{/* Invalid stored/input DOI is outside Task scope. */}}
 return fixed&&(search||doi);
}
export function assertDiscoveryContext(store:Store,pid:string,ctx:DiscoveryContext,newRequest=false){const g=assertDiscoveryGrantReference(store,pid,ctx.reference);if(g.taskBinding){const {task}=assertTaskDiscoveryBinding(store,pid,g,{requireApproved:true}),s=store.get<Session>('session',ctx.sessionId,pid),a=ctx.attemptId?store.get<TaskAttempt>('task-attempt',ctx.attemptId,pid):undefined;ensure(ctx.taskId===task.id&&!!a&&task.execution==='running'&&task.attemptId===a.id&&task.sessionId===s.id&&task.generation===ctx.generation&&a.generation===ctx.generation&&a.taskId===task.id&&a.sessionId===s.id&&a.state==='running'&&a.leaseUntil>Date.now()&&a.discoveryGrant?.id===g.id&&a.discoveryGrant.digest===g.digest&&a.discoveryGrant.approvalId===g.approvalId,'DISCOVERY_TASK_BINDING_REQUIRED','发现授权与当前任务尝试不符');ensure(s.discoveryGrantId===g.id&&s.taskId===task.id&&s.teamId===task.teamId&&s.role==='literature'&&s.state==='running'&&s.leaseUntil>Date.now()&&digest(s.model)===digest(g.model),'DISCOVERY_SCOPE_CHANGED','任务会话、角色、模型或租约已改变');}else{const s=store.get<Session>('session',g.sessionId!,pid);ensure(ctx.sessionId===g.sessionId&&s.discoveryGrantId===g.id&&s.role==='coordinator'&&!s.taskId&&s.state!=='archived'&&digest(s.model)===digest(g.model),'DISCOVERY_SCOPE_CHANGED','指定会话或模型已改变');}ensure(connectorSettings(store,pid).version===g.settingsVersion,'DISCOVERY_SETTINGS_CHANGED','来源设置已改变，请使用新的授权');if(newRequest)ensure(Date.now()<Date.parse(g.expiresAt),'DISCOVERY_GRANT_EXPIRED','发现授权已到期');return g;}
export function normalizedDiscoveryOperation(operation:DiscoveryOperation):DiscoveryOperation {
 if(operation.kind==='search')return {kind:'search',search:{...parseSearch(operation.search),sources:[...parseSearch(operation.search).sources].sort()}};
 const t=operation.target,target=routePaperId(t.id,t.source);let id=target.id,requestedVersion=t.requestedVersion;
 if(requestedVersion){ensure(target.source==='alphaxiv'||target.source==='biorxiv'&&t.format==='original-pdf','PAPER_VERSION_UNSUPPORTED','此来源不能指定版本');const v=requestedVersion.replace(/^v/,'');ensure(/^[1-9]\d{0,5}$/.test(v),'INVALID_INPUT','版本必须是正整数');if(target.source==='biorxiv')return {kind:'retrieve',target:{...target,format:t.format,requestedVersion:v}};const embedded=id.match(/v([1-9]\d*)$/)?.[1];ensure(!embedded||embedded===v,'PAPER_VERSION_MISMATCH','版本不一致');id=id.replace(/v[1-9]\d*$/,'')+'v'+v;requestedVersion=v;}
 // The canonical identifier itself fixes an arXiv version; avoid two equivalent policy forms.
 return {kind:'retrieve',target:{source:target.source,id,format:t.format}};
}
export function discoveryContext(store:Store,pid:string,actor:Actor,operation:DiscoveryOperation,key:string,ref?:DiscoveryGrantReference):DiscoveryContext|undefined {
 const s=actor.sessionId?store.get<Session>('session',actor.sessionId,pid):undefined;
 let reference:DiscoveryGrantReference|undefined,scope:{sessionId:string;taskId?:string;attemptId?:string;generation?:number};
 if(actor.taskId){
  const task=store.get<Task>('task',actor.taskId,pid),attempt=actor.attemptId?store.get<TaskAttempt>('task-attempt',actor.attemptId,pid):undefined,markers=[task.discoveryGrantId,s?.discoveryGrantId,attempt?.discoveryGrant?.id].filter((id):id is string=>!!id);
  if(!markers.length&&!ref){ensure(!store.list<DiscoveryGrant>('discovery-grant',pid).some(g=>g.taskBinding?.taskId===task.id),'DISCOVERY_TASK_BINDING_REQUIRED','任务发现授权标记缺失');return undefined;}
  ensure(!!task.discoveryGrantId&&markers.every(id=>id===task.discoveryGrantId)&&(!ref||ref.id===task.discoveryGrantId),'DISCOVERY_TASK_BINDING_REQUIRED','任务发现授权标记缺失或不匹配');
  ensure(actor.type==='agent'&&actor.sessionId&&actor.attemptId&&!actor.wakeupId&&s,'DISCOVERY_TASK_BINDING_REQUIRED','需要真实任务会话和尝试身份');
  const g=store.get<DiscoveryGrant>('discovery-grant',task.discoveryGrantId!,pid);reference=discoveryReference(g);scope={sessionId:s.id,taskId:task.id,attemptId:actor.attemptId,generation:actor.generation};
 }else{
  if(!ref&&!s?.discoveryGrantId)return undefined;
  reference=ref??discoveryReference(store.get<DiscoveryGrant>('discovery-grant',s!.discoveryGrantId!,pid));
  const g=store.get<DiscoveryGrant>('discovery-grant',reference.id,pid);ensure(!actor.sessionId||actor.sessionId===g.sessionId,'DISCOVERY_SCOPE_DENIED','发现授权不属于此会话');
  if(actor.type==='agent')ensure(actor.role==='coordinator'&&!actor.wakeupId&&actor.sessionId===g.sessionId,'DISCOVERY_SCOPE_DENIED','此授权仅用于指定的主协调会话');
  scope={sessionId:g.sessionId!};
 }
 const normalized=normalizedDiscoveryOperation(operation),ctx={reference, ...scope,operation:normalized,operationKey:key,callIds:[] as string[]},g=assertDiscoveryContext(store,pid,ctx);
 if(normalized.kind==='search')ensure(g.searches.some(q=>digest(q)===digest(normalized.search)),'DISCOVERY_REQUEST_DENIED','检索请求不在批准范围');
 else {const t=normalized.target;ensure(g.sources.includes(t.source)&&g.formats.includes(t.format),'DISCOVERY_TARGET_DENIED','来源或资料格式不在批准范围');const explicit=g.targets.some(v=>digest(normalizedDiscoveryOperation({kind:'retrieve',target:v}))===digest(normalized));
  const matches=(h:{source:SourceId;id:string})=>{try{return h.source===t.source&&routePaperId(h.id,h.source).id===t.id;}catch{return false;}};
  const hit=g.allowSearchResults&&!t.requestedVersion&&store.list<SearchRecord>('connector-search',pid).some(r=>r.discoveryGrant&&digest(r.discoveryGrant)===digest(reference)&&r.scopeSessionId===g.sessionId&&g.searches.some(q=>digest(q)===digest(r.request))&&r.items.some(h=>matches(h)||h.duplicates.some(matches)));
  ensure(explicit||hit,'DISCOVERY_TARGET_DENIED','资料不是明确批准目标或本授权检索命中');}
 return ctx;
}
export const discoveryScope=(scope:string,ctx?:DiscoveryContext|DiscoveryGrantReference)=>ctx?`${scope}:grant:${'reference'in ctx?ctx.reference.id:ctx.id}`:scope;
export function reserveConnectorCall(store:Store,pid:string,source:SourceId,url:URL,ctx?:DiscoveryContext,ownerPage?:{id:string;requestDigest:string}):Row<DiscoveryCall>{return store.transaction(()=>{assertProjectWritable(store,pid);assertSourceEnabled(store,pid,source);const cfg=connectorSettings(store,pid),calls=store.list<DiscoveryCall>('connector-call',pid);ensure(calls.length<cfg.requestLimit,'CONNECTOR_BUDGET_EXCEEDED','已达到项目网络请求次数上限');let fields:Partial<DiscoveryCall>={},id:string|undefined;
 if(ctx){const g=assertDiscoveryContext(store,pid,ctx,true);ensure(g.sources.includes(source),'DISCOVERY_SOURCE_DENIED','请求来源未获批准');const safe=new URL(url);for(const name of ['api_key','email','mailto'])safe.searchParams.delete(name);const operationKeyDigest=digest(ctx.operationKey),requestDigest=digest(ctx.operation),requestUrlDigest=digest(safe.toString());id=digest({grantId:g.id,operationKeyDigest,source,requestUrlDigest});ensure(!store.maybe('connector-call',id),'DISCOVERY_REQUEST_ALREADY_SENT','该请求已保留外发记录；无最终回执时须核对后显式重试');ensure(calls.filter(c=>c.discoveryGrant?.id===g.id).length<g.maxRequests,'DISCOVERY_GRANT_EXHAUSTED','发现授权的HTTP请求额度已用完');fields={discoveryGrant:ctx.reference,operationKeyDigest,requestDigest,requestUrlDigest,...(g.taskBinding?{scopeSessionId:ctx.sessionId,scopeTaskId:ctx.taskId!,scopeAttemptId:ctx.attemptId!,scopeGeneration:ctx.generation!}:{})};}
 else if(ownerPage){const safe=new URL(url);for(const name of ['api_key','email','mailto'])safe.searchParams.delete(name);const requestUrlDigest=digest(safe.toString()),requestDigest=digest({operation:ownerPage.requestDigest,requestUrlDigest}),existing=store.maybe<DiscoveryCall>('connector-call',ownerPage.id);if(existing){ensure(existing.source===source&&existing.host===url.hostname&&existing.requestDigest===requestDigest&&existing.requestUrlDigest===requestUrlDigest,'CONNECTOR_REQUEST_ID_CONFLICT','分页请求标识已用于不同外发内容');ensure(false,'DISCOVERY_REQUEST_ALREADY_SENT','该分页请求已有外发记录；无最终回执时须核对后显式重试');}id=ownerPage.id;fields={requestDigest,requestUrlDigest};}
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
export function ownerSearchNextPage(store:Store,pid:string,previousSearchId:string):{search:SearchInput;pageRequest:SearchPageRequest}{
 const previous=store.get<SearchRecord>('connector-search',previousSearchId,pid),search=parseSearch(previous.request),page=previous.page,source=search.sources[0];
 ensure(!previous.discoveryGrant&&previous.scopeSessionId==null&&previous.scopeTaskId==null&&previous.scopeAttemptId==null,'LITERATURE_PAGE_OWNER_ONLY','只有 owner 的普通搜索结果可以继续',403);
 ensure(previous.settingsVersion===connectorSettings(store,pid).version,'CONNECTOR_SETTINGS_CHANGED','文献来源设置已改变；请重新提交第一页');
 ensure(digest(search)===digest(previous.request)&&previous.query===search.query&&search.sources.length===1&&(source==='crossref'||source==='openalex'||source==='biorxiv'||source==='pubmed')&&search.strategy==='keyword'&&search.prioritize==='default'&&previous.status==='complete'&&previous.sources.length===1&&previous.sources[0].source===source&&previous.sources[0].status==='succeeded'&&previous.items.every(hit=>hit.source===source),'LITERATURE_PAGE_SOURCE_INVALID','前页不是可继续的单来源默认排序成功结果');
 assertSourceEnabled(store,pid,source);
 ensure(page&&Number.isSafeInteger(page.number)&&page.number>=1&&typeof page.cursor==='string'&&page.cursor.length>0&&page.cursor.length<=5000&&Number.isSafeInteger(page.rawItemCount)&&page.rawItemCount>=0&&page.rawItemCount<=search.limit&&(source!=='crossref'||page.rawItemCount>=search.limit),'LITERATURE_PAGE_SOURCE_INVALID','前页没有有效的分页记录');
 ensure(page.number===1?page.previousSearchId===null&&page.cursor==='*'&&page.expiresAt===null:typeof page.previousSearchId==='string'&&page.cursor!=='*'&&typeof page.expiresAt==='string'&&Number.isFinite(Date.parse(page.expiresAt)),'LITERATURE_PAGE_SOURCE_INVALID','前页分页链不完整');
 ensure(typeof page.nextCursor==='string'&&page.nextCursor.length>0&&typeof page.nextCursorExpiresAt==='string'&&Number.isFinite(Date.parse(page.nextCursorExpiresAt)),'LITERATURE_PAGE_TERMINAL','前页没有可继续的下一游标');
 ensure(page.nextCursor.length<=5000,'LITERATURE_PAGE_SOURCE_INVALID','前页下一游标长度无效');
 if(source==='pubmed')ensure(page.rawItemCount>0&&pubmedOffset(page.nextCursor)===pubmedOffset(page.cursor)+page.rawItemCount,'LITERATURE_PAGE_SOURCE_INVALID','PubMed 下一偏移与前页原始数量不符');
 ensure(Date.now()<Date.parse(page.nextCursorExpiresAt),'LITERATURE_PAGE_EXPIRED','下一游标已过期，请从第一页重新检索');
 ensure(Number.isSafeInteger(page.number+1),'LITERATURE_PAGE_SOURCE_INVALID','分页页号超出安全范围');return {search,pageRequest:{number:page.number+1,previousSearchId:previous.id,cursor:page.nextCursor,expiresAt:page.nextCursorExpiresAt}};
}
