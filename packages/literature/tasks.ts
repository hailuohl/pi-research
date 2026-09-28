import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import type {ResearchApp} from '../research-app.js';
import type {Actor,Row} from '../domain/types.js';
import {USER} from '../domain/types.js';
import type {SearchInput} from '../connectors/contracts.js';
import {parseSearch,routePaperId} from '../connectors/contracts.js';
import {connectorSettings} from '../connectors/settings.js';
import type {SearchRecord} from '../connectors/service.js';
import type {DocumentAcquireInput} from '../documents/types.js';
import {ensure,DomainError} from '../domain/errors.js';
import {object,oneOf,text,integer} from '../contracts/validation.js';
import {userOnly,scope} from '../policy/permissions.js';
import {assertProjectWritable} from '../policy/lifecycle.js';
import {digest} from '../storage/store.js';

export type LiteratureRequest={kind:'search';search:SearchInput}|{kind:'retrieve';target:DocumentAcquireInput};
export interface LiteratureTask {
 kindOfTask:'search'|'retrieve';request:LiteratureRequest;state:'queued'|'running'|'succeeded'|'partial'|'failed'|'cancelled'|'interrupted';
 phase:'queued'|'requesting'|'publishing'|'done';settingsVersion:number;generation:number;leaseUntil:number;deadline:number;cancelRequested:boolean;workerPid?:number;
 resultSearchId?:string;documentVersionId?:string;error?:{code:string;message:string};previousTaskId?:string;startedAt?:string;endedAt?:string;
}
export type LiteratureTaskDTO=Omit<Row<LiteratureTask>,'workerPid'|'leaseUntil'|'deadline'>&{searchResult:Row<SearchRecord>|null};
const TERMINAL=['succeeded','partial','failed','cancelled','interrupted'];
const LEASE_MS=30000;
export class LiteratureTaskService {
 constructor(private app:ResearchApp,private spawnWorker:typeof spawn=spawn){}
 private parse(value:unknown):LiteratureRequest {const x=object(value),kind=oneOf(x.kind,['search','retrieve'] as const,'kind');if(kind==='search')return {kind,search:parseSearch(x.search)};const t=object(x.target),target=routePaperId(t.id,t.source);return {kind,target:{...target,format:oneOf(t.format,['provider-text','original-pdf'] as const,'format'),...(t.requestedVersion===undefined?{}:{requestedVersion:text(t.requestedVersion,'requestedVersion',40)})}};}
 create(actor:Actor,pid:string,value:unknown,previousTaskId?:string):LiteratureTaskDTO {
  userOnly(actor);scope(actor,pid);const request=this.parse(value);
  return this.app.store.transaction(()=>{assertProjectWritable(this.app.store,pid);const cfg=connectorSettings(this.app.store,pid),sources=request.kind==='search'?request.search.sources:[request.target.source];ensure(sources.some(s=>cfg.enabled[s]),'SOURCE_DISABLED','需要用户先启用所选文献来源',403);
   const queued=Number(this.app.store.db.prepare("SELECT count(*) n FROM records WHERE kind='literature-task' AND project_id=? AND json_extract(data,'$.state') IN ('queued','running')").get(pid)!.n);ensure(queued<30,'LITERATURE_QUEUE_FULL','本项目文献任务等待与运行数量已达30',409);
   const row=this.app.store.create<LiteratureTask>('literature-task',pid,{kindOfTask:request.kind,request,state:'queued',phase:'queued',settingsVersion:cfg.version,generation:0,leaseUntil:0,deadline:0,cancelRequested:false,...(previousTaskId?{previousTaskId}:{})});this.app.store.event(pid,'literature.task_queued',{taskId:row.id,kind:request.kind});return this.inspect(actor,pid,row.id);
  });
 }
 inspect(actor:Actor,pid:string,id:string):LiteratureTaskDTO {userOnly(actor);scope(actor,pid);const row=this.app.store.get<LiteratureTask>('literature-task',id,pid),{workerPid,leaseUntil,deadline,...publicRow}=row;return {...publicRow,searchResult:row.resultSearchId?this.app.store.get<SearchRecord>('connector-search',row.resultSearchId,pid):null};}
 list(actor:Actor,pid:string,limit=30):LiteratureTaskDTO[] {userOnly(actor);scope(actor,pid);integer(limit,'limit',1,100);return this.app.store.db.prepare("SELECT id FROM records WHERE kind='literature-task' AND project_id=? ORDER BY rowid DESC LIMIT ?").all(pid,limit).map(r=>this.inspect(actor,pid,String(r.id)));}
 cancel(actor:Actor,pid:string,id:string) {userOnly(actor);return this.app.store.transaction(()=>{const row=this.app.store.get<LiteratureTask>('literature-task',id,pid);if(!TERMINAL.includes(row.state)){this.app.store.update<LiteratureTask>('literature-task',id,row.version,{cancelRequested:true,...(row.state==='queued'?{state:'cancelled',phase:'done',endedAt:new Date().toISOString()}:{} )});this.app.store.event(pid,'literature.task_cancel_requested',{taskId:id});}return this.inspect(actor,pid,id);});}
 retry(actor:Actor,pid:string,id:string,expectedVersion:number) {userOnly(actor);return this.app.store.transaction(()=>{const row=this.app.store.get<LiteratureTask>('literature-task',id,pid);ensure(row.version===expectedVersion,'VERSION_CONFLICT','文献任务已更新');ensure(['failed','cancelled','interrupted'].includes(row.state),'LITERATURE_NOT_RETRYABLE','只可显式重试失败、取消或中断任务');return this.create(actor,pid,row.request,row.id);});}
 private validate(id:string,generation:number) {
  const row=this.app.store.get<LiteratureTask>('literature-task',id);ensure(row.state==='running'&&row.generation===generation&&row.leaseUntil>Date.now(),'LITERATURE_LEASE_EXPIRED','旧文献执行器不能发布结果');ensure(!row.cancelRequested,'LITERATURE_CANCELLED','文献任务已取消');ensure(Date.now()<=row.deadline,'LITERATURE_TIMEOUT','文献任务超过执行期限');assertProjectWritable(this.app.store,row.projectId!);ensure(connectorSettings(this.app.store,row.projectId!).version===row.settingsVersion,'CONNECTOR_SETTINGS_CHANGED','来源设置已改变，未采纳新结果');return row;
 }
 private recoverPublished(row:Row<LiteratureTask>,fence=false):boolean {
  const search=row.request.kind==='search',scope=search?`connector-search:${row.projectId}:user:root`:`document-acquire:${row.projectId}`,input=row.request.kind==='search'?row.request.search:row.request.target;
  const receipt=this.app.store.operationResult<Record<string,unknown>>(scope,`literature-task:${row.id}`,input);if(!receipt.found)return false;
  const value=receipt.value;ensure(typeof value.id==='string','LITERATURE_RECEIPT_INVALID','文献结果回执没有有效记录');const actual=this.app.store.get(search?'connector-search':'document-version',value.id,row.projectId!);ensure(digest(actual)===digest(value),'LITERATURE_RECEIPT_INVALID','文献结果回执与固定记录不符');
  const state=search&&value.status==='partial'?'partial':'succeeded';this.app.store.update<LiteratureTask>('literature-task',row.id,row.version,{state,phase:'done',generation:row.generation+(fence?1:0),leaseUntil:0,endedAt:new Date().toISOString(),error:undefined,...(search?{resultSearchId:value.id}:{documentVersionId:value.id})});this.app.store.event(row.projectId,'literature.task_completed',{taskId:row.id,state,resultId:value.id,recovered:true});return true;
 }
 tick() {
  const store=this.app.store,expired=store.db.prepare("SELECT id FROM records WHERE kind='literature-task' AND json_extract(data,'$.state')='running' AND json_extract(data,'$.leaseUntil')<=? ORDER BY rowid LIMIT 32").all(Date.now());
  for(const item of expired)store.transaction(()=>{const row=store.get<LiteratureTask>('literature-task',String(item.id));if(row.state==='running'&&row.leaseUntil<=Date.now()){let invalid=false;try{if(this.recoverPublished(row,true))return;}catch{invalid=true;}store.update<LiteratureTask>('literature-task',row.id,row.version,{state:'interrupted',phase:'done',generation:row.generation+1,leaseUntil:0,endedAt:new Date().toISOString(),error:{code:invalid?'LITERATURE_RECEIPT_INVALID':'LITERATURE_INTERRUPTED',message:invalid?'结果回执与固定记录不符，请核对后处理':'执行器失联，请核对后显式重试；可能已发出的请求不会自动重发'}});store.event(row.projectId,'literature.task_interrupted',{taskId:row.id});}});
  const claimed=store.transaction(()=>{
   const active=Number(store.db.prepare("SELECT count(*) n FROM records WHERE kind='literature-task' AND json_extract(data,'$.state')='running'").get()!.n);if(active>=2)return null;
   for(const item of store.db.prepare("SELECT id FROM records WHERE kind='literature-task' AND json_extract(data,'$.state')='queued' ORDER BY rowid LIMIT 16").all()){
    const row=store.get<LiteratureTask>('literature-task',String(item.id));try{assertProjectWritable(store,row.projectId!);ensure(connectorSettings(store,row.projectId!).version===row.settingsVersion,'CONNECTOR_SETTINGS_CHANGED','来源配置已改变，请重新提交');}catch(error){store.update<LiteratureTask>('literature-task',row.id,row.version,{state:'failed',phase:'done',endedAt:new Date().toISOString(),error:{code:error instanceof DomainError?error.code:'LITERATURE_FAILED',message:error instanceof DomainError?error.message:'任务不能启动'}});store.event(row.projectId,'literature.task_failed',{taskId:row.id});continue;}
    return store.update<LiteratureTask>('literature-task',row.id,row.version,{state:'running',phase:'requesting',generation:row.generation+1,leaseUntil:Date.now()+LEASE_MS,deadline:Date.now()+120000,startedAt:new Date().toISOString()});
   }return null;
  });
  if(!claimed)return;
  const env=Object.fromEntries(['PATH','SystemRoot','WINDIR','OPENALEX_API_KEY','NCBI_API_KEY','NCBI_EMAIL'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  const child=this.spawnWorker(process.execPath,[fileURLToPath(new URL('../../apps/literature-worker/index.js',import.meta.url)),this.app.context.dataDir,this.app.context.repoRoot,claimed.id,String(claimed.generation)],{env,shell:false,detached:true,windowsHide:true,stdio:'ignore'});
  child.once('error',()=>{try{store.transaction(()=>{const row=store.get<LiteratureTask>('literature-task',claimed.id);if(row.state==='running'&&row.generation===claimed.generation)store.update<LiteratureTask>('literature-task',row.id,row.version,{state:'failed',phase:'done',leaseUntil:0,endedAt:new Date().toISOString(),error:{code:'LITERATURE_WORKER_UNAVAILABLE',message:'文献执行器未能启动，没有自动重试'}});});}catch{/* A closed controller leaves recovery to the durable lease. */}});
  if(child.pid)store.transaction(()=>{const row=store.get<LiteratureTask>('literature-task',claimed.id);if(row.state==='running'&&row.generation===claimed.generation)store.update<LiteratureTask>('literature-task',row.id,row.version,{workerPid:child.pid});});child.unref();
 }
 async execute(id:string,generation:number) {
  const controller=new AbortController(),store=this.app.store;let validationError:unknown;
  const timer=setInterval(()=>{try{store.transaction(()=>{const row=this.validate(id,generation);store.update<LiteratureTask>('literature-task',id,row.version,{leaseUntil:Date.now()+LEASE_MS});});}catch(error){validationError=error;controller.abort();}},2000);timer.unref();
  try{
   const row=this.validate(id,generation),validate=()=>{this.validate(id,generation);};
   const result=row.request.kind==='search'?await this.app.connectors.discover(USER,row.projectId!,row.request.search,`literature-task:${id}`,validate,controller.signal):await this.app.documents.acquire(USER,row.projectId!,row.request.target,`literature-task:${id}`,validate,controller.signal);
   store.transaction(()=>{const current=store.get<LiteratureTask>('literature-task',id);ensure(current.state==='running'&&current.generation===generation,'LITERATURE_LEASE_EXPIRED','旧执行器不能完成任务');
    // Service publication rechecked cancellation in its transaction. A cancel arriving afterwards cannot undo that completed acquisition.
    const state=row.request.kind==='search'&&(result as Row<SearchRecord>).status==='partial'?'partial':'succeeded';store.update<LiteratureTask>('literature-task',id,current.version,{state,phase:'done',leaseUntil:0,endedAt:new Date().toISOString(),...(row.request.kind==='search'?{resultSearchId:result.id}:{documentVersionId:result.id})});store.event(current.projectId,'literature.task_completed',{taskId:id,state,resultId:result.id});
   });
  }catch(caught){const error=validationError??caught;store.transaction(()=>{const row=store.get<LiteratureTask>('literature-task',id);if(row.state!=='running'||row.generation!==generation)return;store.update<LiteratureTask>('literature-task',id,row.version,{state:row.cancelRequested?'cancelled':'failed',phase:'done',leaseUntil:0,endedAt:new Date().toISOString(),error:{code:error instanceof DomainError?error.code:'LITERATURE_FAILED',message:error instanceof DomainError?error.message:'文献获取失败；未把失败当作没有原文'}});store.event(row.projectId,'literature.task_failed',{taskId:id});});}
  finally{clearInterval(timer);}
 }
}
