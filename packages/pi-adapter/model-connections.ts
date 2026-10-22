import {closeSync,constants,existsSync,fsyncSync,fstatSync,lstatSync,openSync,readFileSync,renameSync,unlinkSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {ModelRuntime} from '@earendil-works/pi-coding-agent';
import type {AppContext} from '../domain/context.js';
import type {Actor,ModelConfig} from '../domain/types.js';
import {DomainError,ensure} from '../domain/errors.js';
import {integer,object,text,oneOf} from '../contracts/validation.js';
import {userOnly} from '../policy/permissions.js';
import {digest} from '../storage/store.js';
import type {ModelDefinitionInput} from './model-management-types.js';
import {validateModelDefinition,defaultModelDefinition} from './model-definition.js';
import {isProviderTimeout,PROVIDER_TIMEOUT_FAILURE} from './runtime.js';

export const CONNECTION_APIS=['openai-completions','openai-responses','anthropic-messages'] as const;
export const CONNECTION_FILE='model-connections.json';
export const EMPTY_MODEL_CREDENTIALS={read:async()=>undefined,list:async()=>[],modify:async()=>undefined,delete:async()=>{}};
export interface StoredModel extends ModelDefinitionInput {restoreEpoch?:number;enabled:boolean;deletedAt:string|null;order:number;revision:number;controlOnly?:boolean;}
export interface ModelConnection {provider:string;name:string;baseUrl:string;api:typeof CONNECTION_APIS[number];apiKey:string;enabled?:boolean;deletedAt?:string|null;order?:number;models?:StoredModel[];credentialRevision?:number;controlOnly?:boolean;requiresCredential?:boolean;}
export type PublicModelConnection=Omit<ModelConnection,'apiKey'>&{hasApiKey:boolean};
interface ConnectionView {version:number;connections:PublicModelConnection[];supportedApis:typeof CONNECTION_APIS;liveVerified:false;}
export interface ConnectionState {schemaVersion?:2;version:number;connections:ModelConnection[];receipt?:{key:string;hash:string};}

function plainPath(path:string){for(let part=resolve(path);;part=dirname(part)){try{ensure(!lstatSync(part).isSymbolicLink(),'MODEL_CONNECTION_PATH_DENIED','模型连接配置不能经过链接',403);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}if(dirname(part)===part)break;}}
function baseUrl(value:unknown){
 const raw=text(value,'baseUrl',2000);let url:URL;try{url=new URL(raw);}catch{throw new DomainError('INVALID_INPUT','Base URL 必须是完整 HTTP(S) 地址',400);}
 ensure(!url.username&&!url.password&&!url.search&&!url.hash&&!/[\s\x00-\x1f\\]/.test(raw)&&(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)),'INVALID_INPUT','Base URL 仅支持 HTTPS 或本机回环 HTTP，不能包含凭据、查询或片段',400);
 const normalized=url.href.replace(/\/$/,'');ensure(normalized.length<=2000,'INVALID_INPUT','规范化后的 Base URL 最多2000字符',400);return normalized;
}
export function parseModelConnection(value:unknown):ModelConnection {
 const x=object(value),provider=text(x.provider,'provider',100),name=text(x.name??provider,'name',100),api=oneOf(x.api,CONNECTION_APIS,'api');
 ensure(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(provider),'INVALID_INPUT','供应商 ID 仅支持字母、数字、点、下划线与连字符',400);
 ensure(typeof x.apiKey==='string'&&x.apiKey.length>0&&x.apiKey.length<=8192&&!/\s|[\x00-\x1f\x7f]/.test(x.apiKey),'INVALID_INPUT','API Key 必须是非空且不含空白的文本',400);
 return {provider,name,baseUrl:baseUrl(x.baseUrl),api,apiKey:x.apiKey};
}
/** The same normalized schema gates disk reads and every mutation before a temporary file is opened. */
export function validateModelState(value:unknown):ConnectionState {
 try {
  const raw=object(value);ensure(Object.keys(raw).every(k=>['schemaVersion','version','connections','receipt'].includes(k))&&(raw.schemaVersion===undefined||raw.schemaVersion===2),'MODEL_CONNECTION_INVALID','模型配置格式无效',409);
  const version=integer(raw.version,'version',1,Number.MAX_SAFE_INTEGER);ensure(Array.isArray(raw.connections),'MODEL_CONNECTION_INVALID','模型连接列表无效',409);
  ensure(raw.connections.length<=20,'MODEL_CONNECTION_LIMIT','最多保存20个供应商（包括历史控制条目）',413);let modelCount=0;
  const connections=raw.connections.map((item,i)=>{
   const v=object(item);ensure(Object.keys(v).every(k=>['provider','name','baseUrl','api','apiKey','enabled','deletedAt','order','models','credentialRevision','controlOnly','requiresCredential'].includes(k)),'MODEL_CONNECTION_INVALID','供应商状态包含未知字段',409);
   ensure(v.enabled===undefined||typeof v.enabled==='boolean','MODEL_CONNECTION_INVALID','启用状态无效',409);ensure(v.controlOnly===undefined||typeof v.controlOnly==='boolean','MODEL_CONNECTION_INVALID','历史控制状态无效',409);
   const deletedAt=v.deletedAt??null;ensure(deletedAt===null||typeof deletedAt==='string'&&Number.isFinite(Date.parse(deletedAt)),'MODEL_CONNECTION_INVALID','删除状态无效',409);
   ensure(v.requiresCredential===undefined||typeof v.requiresCredential==='boolean','MODEL_CONNECTION_INVALID','恢复凭据状态无效',409);ensure(v.requiresCredential!==true||!deletedAt&&v.controlOnly!==true,'MODEL_CONNECTION_INVALID','恢复凭据标记只适用于已管理连接',409);
   const keyless=!!deletedAt||v.controlOnly===true||v.requiresCredential===true;ensure(!keyless||v.apiKey==='','MODEL_CONNECTION_INVALID','删除、历史控制或待恢复凭据条目不能保存凭据',409);
   const base=parseModelConnection({...v,apiKey:keyless?'state-placeholder':v.apiKey});ensure(v.models===undefined||Array.isArray(v.models),'MODEL_CONNECTION_INVALID','模型列表无效',409);
   const stored=(v.models??[]) as unknown[];modelCount+=stored.length;ensure(modelCount<=100,'MODEL_CONNECTION_LIMIT','模型目录最多100个模型（包含历史控制条目）',413);
   const models=stored.map(item=>{const m=object(item),{enabled,deletedAt,order,revision,controlOnly,restoreEpoch,...definition}=m;ensure(typeof enabled==='boolean'&&(deletedAt===null||typeof deletedAt==='string'&&Number.isFinite(Date.parse(deletedAt)))&&(controlOnly===undefined||typeof controlOnly==='boolean'),'MODEL_CONNECTION_INVALID','模型状态无效',409);return {...validateModelDefinition(definition,base.api),...(integer(restoreEpoch??0,'restoreEpoch',0,Number.MAX_SAFE_INTEGER)>0?{restoreEpoch:restoreEpoch as number}:{}),enabled,deletedAt:deletedAt as string|null,...(controlOnly?{controlOnly:true}:{}),order:integer(order,'order',0,100),revision:integer(revision,'revision',1,Number.MAX_SAFE_INTEGER)};});
   ensure(new Set(models.map(m=>m.model)).size===models.length,'MODEL_CONNECTION_INVALID','模型ID重复',409);
   return {...base,apiKey:keyless?'':base.apiKey,enabled:v.enabled??true,deletedAt:deletedAt as string|null,order:integer(v.order??i,'order',0,100),models,credentialRevision:integer(v.credentialRevision??1,'credentialRevision',0,Number.MAX_SAFE_INTEGER),...(v.controlOnly?{controlOnly:true}:{}),...(v.requiresCredential?{requiresCredential:true}:{})};
  });
  ensure(new Set(connections.map(c=>c.provider)).size===connections.length,'MODEL_CONNECTION_INVALID','模型连接供应商重复',409);
  let receipt:ConnectionState['receipt'];if(raw.receipt!==undefined){const r=object(raw.receipt);ensure(Object.keys(r).length===2&&typeof r.hash==='string'&&/^[a-f0-9]{64}$/.test(r.hash),'MODEL_CONNECTION_INVALID','保存回执无效',409);receipt={key:text(r.key,'receipt.key',200),hash:r.hash};}
  return {...(raw.schemaVersion===2?{schemaVersion:2 as const}:{}),version,connections,...(receipt?{receipt}:{})};
 }catch(error){if(error instanceof DomainError&&['MODEL_CONNECTION_LIMIT','MODEL_CONNECTION_INVALID'].includes(error.code))throw error;throw new DomainError('MODEL_CONNECTION_INVALID','模型连接配置结构无效，原文件保持不变',409);}
}
export function readModelState(dataDir:string):ConnectionState {
 const path=join(dataDir,CONNECTION_FILE);plainPath(path);let fd:number;
 try{fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {version:0,connections:[]};throw new DomainError('MODEL_CONNECTION_READ_FAILED','模型连接配置无法读取',500);}
 try{const stat=fstatSync(fd);ensure(stat.isFile()&&stat.size<=512*1024,'MODEL_CONNECTION_INVALID','模型连接配置不是受支持的普通文件',409);return validateModelState(JSON.parse(readFileSync(fd,'utf8')));}
 catch{throw new DomainError('MODEL_CONNECTION_INVALID','模型连接配置损坏；原文件保留，请核对本机配置',409);}finally{closeSync(fd);}
}
const view=(state:ConnectionState):ConnectionView=>({version:state.version,connections:state.connections.map(({provider,name,baseUrl,api,apiKey})=>({provider,name,baseUrl,api,hasApiKey:!!apiKey})),supportedApis:CONNECTION_APIS,liveVerified:false});
export function inspectModelConnections(c:AppContext,actor:Actor){userOnly(actor);return view(readModelState(c.dataDir));}
export function selectedModelConnection(dataDir:string,provider:string){return modelConnectionSnapshot(dataDir,provider).connection;}
/** Only endpoint/transport changes alter image approval provenance. Keys never enter its digest. */
const connectionCatalog=(state:ConnectionState)=>state.connections.flatMap(p=>{
 const models=(p.models??[]).filter(m=>!m.controlOnly||!m.enabled||m.deletedAt||m.restoreEpoch).map(({name,order,revision,configuration,...m})=>m.controlOnly?{model:m.model,enabled:m.enabled,deletedAt:m.deletedAt,...(m.restoreEpoch?{restoreEpoch:m.restoreEpoch}:{})}:{...m,reasoning:{defaultLevel:m.reasoning.defaultLevel,levels:m.reasoning.levels.map(({label,...level})=>level).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)}}).sort((a,b)=>a.model<b.model?-1:a.model>b.model?1:0);
 if(p.controlOnly&&p.enabled!==false&&!p.deletedAt&&!models.length)return [];
 return [{provider:p.provider,...(!p.controlOnly?{baseUrl:p.baseUrl,api:p.api}:{}),...(p.requiresCredential?{requiresCredential:true}:{}),...(p.enabled===false||p.deletedAt?{enabled:p.enabled,deletedAt:p.deletedAt}:{}),...(models.length?{models}:{})}];
}).sort((a,b)=>a.provider<b.provider?-1:a.provider>b.provider?1:0);
export function modelConnectionCatalog(dataDir:string){return connectionCatalog(readModelState(dataDir));}
/** One read binds the selected credential/endpoint and its public catalog against A→B→A edits. */
export function modelConnectionSnapshot(dataDir:string,provider:string){const state=readModelState(dataDir),connection=state.connections.find(c=>c.provider===provider);return {version:state.version,connection:connection?.controlOnly?undefined:connection,catalog:connectionCatalog(state)};}
export function modelNeedsCredential(connection:ModelConnection|undefined){return !!connection&&!connection.controlOnly&&!connection.deletedAt&&(connection.requiresCredential===true||!connection.apiKey);}
/** A restored ID is a new execution identity; historical selections stay readable. */
export function assertModelRestoreCurrent(dataDir:string,selected:Pick<ModelConfig,'provider'|'model'|'restoreEpoch'>,captured?:ModelConnection){const connection=captured??readModelState(dataDir).connections.find(c=>c.provider===selected.provider),model=connection?.models?.find(m=>m.model===selected.model);ensure((selected.restoreEpoch??0)===(model?.restoreEpoch??0),'MODEL_RESTORE_STALE','此模型已恢复为新的配置身份；请明确重新选择模型或新建会话',409);}
/** Only explicit owner selection captures the current restore identity. */
export function bindModelRestoreEpoch(dataDir:string,selected:ModelConfig):ModelConfig{const {restoreEpoch:ignored,...model}=selected,epoch=readModelState(dataDir).connections.find(c=>c.provider===model.provider)?.models?.find(m=>m.model===model.model)?.restoreEpoch;return {...model,...(epoch?{restoreEpoch:epoch}:{})};}
export function assertModelEnabled(dataDir:string,selected:{provider:string;model:string;thinking?:string},captured?:ModelConnection){const provider=captured??readModelState(dataDir).connections.find(c=>c.provider===selected.provider);ensure(!provider?.deletedAt&&provider?.enabled!==false,'MODEL_DISABLED','供应商已停用或删除');ensure(!modelNeedsCredential(provider),'MODEL_CREDENTIAL_REQUIRED','连接从备份恢复后需要重新保存API Key，不能使用环境或原生认证回退');const model=provider?.models?.find(m=>m.model===selected.model);ensure(!provider?.models?.length||model,'MODEL_NOT_CONFIGURED','此供应商的模型目录中没有该模型');ensure(!model?.deletedAt&&model?.enabled!==false,'MODEL_DISABLED','模型已停用或删除');ensure(!model||model.controlOnly||selected.thinking===undefined||model.reasoning.levels.some(l=>l.id===selected.thinking),'MODEL_REASONING_UNAVAILABLE','推理等级已移除或失效');return model?.controlOnly?undefined:model;}

export function mutateModelState(c:AppContext,expected:number,key:string,input:unknown,change:(state:ConnectionState)=>void):ConnectionState {
 text(key,'Idempotency-Key',200);return c.store.transaction(()=>{const state=readModelState(c.dataDir),hash=digest(input);if(state.receipt?.key===key){ensure(state.receipt.hash===hash,'IDEMPOTENCY_CONFLICT','相同幂等键不能改变模型管理请求');return state;}ensure(state.version===expected,'VERSION_CONFLICT','模型配置已变化，请刷新后核对草稿');change(state);state.schemaVersion=2;state.version++;state.receipt={key,hash};writeState(c.dataDir,state);return state;});
}
function writeState(dataDir:string,state:ConnectionState){const bytes=JSON.stringify(validateModelState(state));ensure(Buffer.byteLength(bytes)<=512*1024,'MODEL_CONNECTION_LIMIT','模型连接配置总量最多512 KiB',413);const file=join(dataDir,CONNECTION_FILE),tmp=file+'.'+randomUUID()+'.tmp';plainPath(file);plainPath(tmp);let fd:number|undefined;
 try{fd=openSync(tmp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW??0),0o600);writeFileSync(fd,bytes);fsyncSync(fd);closeSync(fd);fd=undefined;renameSync(tmp,file);}catch{throw new DomainError('MODEL_CONNECTION_SAVE_FAILED','模型连接保存未确认；请刷新核对，草稿应保留',500);}finally{if(fd!==undefined)closeSync(fd);try{unlinkSync(tmp);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw new DomainError('MODEL_CONNECTION_SAVE_FAILED','模型连接临时文件清理失败，请核对本机配置',500);}}
}
/** Offline restore only: publish the validated credential-free state once into a new staging directory. */
export function restoreModelManagementState(dataDir:string,state:ConnectionState){ensure(!existsSync(join(dataDir,CONNECTION_FILE)),'MODEL_RESTORE_TARGET_EXISTS','模型恢复目标已存在，禁止覆盖',409);writeState(dataDir,state);}

export function configureModelConnection(c:AppContext,actor:Actor,value:unknown,key:string){
 userOnly(actor);const x=object(value);ensure(Object.keys(x).every(k=>['expectedVersion','provider','name','baseUrl','api','apiKey'].includes(k)),'INVALID_INPUT','模型连接包含未知字段',400);
 const expected=integer(x.expectedVersion,'expectedVersion',0);text(key,'Idempotency-Key',200);
 return view(mutateModelState(c,expected,key,value,old=>{
  const prior=old.connections.find(v=>v.provider===x.provider);ensure(!prior?.deletedAt,'MODEL_DELETED','已删除供应商ID不能重新使用');const next=parseModelConnection({...x,apiKey:x.apiKey===undefined?prior?.apiKey:x.apiKey});
  for(const m of prior?.models??[]){const {enabled,deletedAt,order,revision,controlOnly,restoreEpoch,...definition}=m;validateModelDefinition(definition,next.api);}
  const connections=[...old.connections.filter(v=>v.provider!==next.provider),next];ensure(connections.length<=20,'MODEL_CONNECTION_LIMIT','最多保存20个供应商连接');
  old.connections=[...old.connections.filter(v=>v.provider!==next.provider),{...prior,...next,controlOnly:false,requiresCredential:false,enabled:prior?.enabled??true,deletedAt:null,order:prior?.order??old.connections.length,models:prior?.models??[],credentialRevision:(prior?.credentialRevision??0)+(next.apiKey!==prior?.apiKey?1:0)}];
 }));
}

/** Runtime registration never writes models.json/auth.json or interprets a key as a config command. */
export async function applyModelConnection(sdk:Pick<typeof import('@earendil-works/pi-coding-agent'),'ModelRuntime'>,source:ModelRuntime,selected:ModelConfig,config:Omit<ModelConnection,'apiKey'>,apiKey:string,authPath:string|null):Promise<ModelRuntime>{
 ensure(!config.requiresCredential&&!!apiKey,'MODEL_CREDENTIAL_REQUIRED','需要重新保存模型连接凭据，不能使用其他凭据回退');
 const existing=source.getModel(selected.provider,selected.model);
 const definition=config.models?.find(m=>m.model===selected.model&&!m.controlOnly);ensure(config.enabled!==false&&!config.deletedAt&&definition?.enabled!==false&&!definition?.deletedAt,'MODEL_DISABLED','模型或供应商已停用或删除');
 const fallback=defaultModelDefinition(selected.model),metadata=existing??{id:selected.model,name:selected.model,reasoning:selected.thinking!=='off',input:['text'] as ('text'|'image')[],cost:{input:0,output:0,cacheRead:0,cacheWrite:0},contextWindow:fallback.contextWindow,maxTokens:fallback.maxTokens};
 // modelsPath:null discards provider/model/modelOverrides headers; merging overrides cannot remove old credentials.
 const runtime=await sdk.ModelRuntime.create({...(authPath?{authPath}:{credentials:EMPTY_MODEL_CREDENTIALS}),modelsPath:null,refreshOnCreate:false});
 runtime.registerProvider(selected.provider,{baseUrl:config.baseUrl,api:config.api,models:[{...metadata,...(definition?{name:definition.name,contextWindow:definition.contextWindow,maxTokens:definition.maxTokens,input:(definition.capabilities.image?['text','image']:['text']) as ('text'|'image')[],reasoning:definition.reasoning.levels.some(l=>l.piLevel!=='off'),samplingParams:undefined,compat:{...existing?.compat,supportsMidConvoSystemMessages:definition.capabilities.midConversationSystem}}:{}),headers:undefined,api:config.api,baseUrl:config.baseUrl}]});
 await runtime.setRuntimeApiKey(selected.provider,apiKey);
 return runtime;
}

/** An owner-configured endpoint is a model-only outlet; redirects cannot forward its credential. */
export function connectionFetch(fetcher:typeof fetch,endpoint:string):typeof fetch {
 const origin=new URL(endpoint).origin;
 return async(input,init)=>{
  const target=new URL(input instanceof Request?input.url:input.toString());
  ensure(target.origin===origin&&!target.username&&!target.password,'MODEL_CONNECTION_ORIGIN_DENIED','模型请求离开已配置的连接地址',403);
  let response:Response;try{response=await fetcher(input,{...init,redirect:'error'});}catch(error){if((error as {name?:string})?.name==='AbortError'||isProviderTimeout(error))throw new DOMException('模型请求已中止','AbortError');throw new Error('PROVIDER_REQUEST_FAILED: 模型连接请求失败或被中止，请核对配置与网络');}
  if(!response.ok){await response.body?.cancel();return new Response('Model provider request failed',{status:response.status,headers:{'content-type':'text/plain'}});}
  return response;
 };
}

type ProviderStream=ReturnType<ModelRuntime['streamSimple']>;
type ProviderMessage=Awaited<ReturnType<ProviderStream['result']>>;
const STREAM_FAILURE='PROVIDER_STREAM_FAILED: 模型返回错误或流中断，请核对连接与模型服务';
/** Sanitize the SDK protocol before the agent sees or persists its final message, including HTTP 200 errors. */
export function safeConnectionStream<T extends ProviderStream>(source:T):T {
 const safe=(message:ProviderMessage):ProviderMessage=>message.errorMessage===undefined?message:{...message,errorMessage:message.stopReason==='aborted'?'模型请求已中止':isProviderTimeout(message.errorMessage)?PROVIDER_TIMEOUT_FAILURE:STREAM_FAILURE};
 const iterate=source[Symbol.asyncIterator].bind(source),result=source.result.bind(source);
 source[Symbol.asyncIterator]=async function*(){
  try{for await(const event of {[Symbol.asyncIterator]:iterate})yield event.type==='error'?{...event,error:safe(event.error)}:event.type==='done'?{...event,message:safe(event.message)}:'partial' in event?{...event,partial:safe(event.partial)}:event;}
  catch(error){throw new Error(isProviderTimeout(error)?PROVIDER_TIMEOUT_FAILURE:STREAM_FAILURE);}
 };
 source.result=async()=>{try{return safe(await result());}catch(error){throw new Error(isProviderTimeout(error)?PROVIDER_TIMEOUT_FAILURE:STREAM_FAILURE);}};
 return source;
}
