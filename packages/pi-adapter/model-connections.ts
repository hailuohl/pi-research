import {closeSync,constants,fsyncSync,fstatSync,lstatSync,openSync,readFileSync,renameSync,unlinkSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {ModelRuntime} from '@earendil-works/pi-coding-agent';
import type {AppContext} from '../domain/context.js';
import type {Actor,ModelConfig} from '../domain/types.js';
import {DomainError,ensure} from '../domain/errors.js';
import {integer,object,text,oneOf} from '../contracts/validation.js';
import {userOnly} from '../policy/permissions.js';
import {digest} from '../storage/store.js';

export const CONNECTION_APIS=['openai-completions','openai-responses','anthropic-messages'] as const;
export const CONNECTION_FILE='model-connections.json';
export interface ModelConnection {provider:string;name:string;baseUrl:string;api:typeof CONNECTION_APIS[number];apiKey:string;}
export type PublicModelConnection=Omit<ModelConnection,'apiKey'>&{hasApiKey:boolean};
interface ConnectionView {version:number;connections:PublicModelConnection[];supportedApis:typeof CONNECTION_APIS;liveVerified:false;}
interface ConnectionState {version:number;connections:ModelConnection[];receipt?:{key:string;hash:string};}

function plainPath(path:string){for(let part=resolve(path);;part=dirname(part)){try{ensure(!lstatSync(part).isSymbolicLink(),'MODEL_CONNECTION_PATH_DENIED','模型连接配置不能经过链接',403);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}if(dirname(part)===part)break;}}
function baseUrl(value:unknown){
 const raw=text(value,'baseUrl',2000);let url:URL;try{url=new URL(raw);}catch{throw new DomainError('INVALID_INPUT','Base URL 必须是完整 HTTP(S) 地址',400);}
 ensure(!url.username&&!url.password&&!url.search&&!url.hash&&!/[\s\x00-\x1f\\]/.test(raw)&&(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)),'INVALID_INPUT','Base URL 仅支持 HTTPS 或本机回环 HTTP，不能包含凭据、查询或片段',400);
 const normalized=url.href.replace(/\/$/,'');ensure(normalized.length<=2000,'INVALID_INPUT','规范化后的 Base URL 最多2000字符',400);return normalized;
}
function connection(value:unknown):ModelConnection {
 const x=object(value),provider=text(x.provider,'provider',100),name=text(x.name??provider,'name',100),api=oneOf(x.api,CONNECTION_APIS,'api');
 ensure(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(provider),'INVALID_INPUT','供应商 ID 仅支持字母、数字、点、下划线与连字符',400);
 ensure(typeof x.apiKey==='string'&&x.apiKey.length>0&&x.apiKey.length<=8192&&!/\s|[\x00-\x1f\x7f]/.test(x.apiKey),'INVALID_INPUT','API Key 必须是非空且不含空白的文本',400);
 return {provider,name,baseUrl:baseUrl(x.baseUrl),api,apiKey:x.apiKey};
}
function readState(dataDir:string):ConnectionState {
 const path=join(dataDir,CONNECTION_FILE);plainPath(path);let fd:number;
 try{fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {version:0,connections:[]};throw new DomainError('MODEL_CONNECTION_READ_FAILED','模型连接配置无法读取',500);}
 try{
  const stat=fstatSync(fd);ensure(stat.isFile()&&stat.size<=512*1024,'MODEL_CONNECTION_INVALID','模型连接配置不是受支持的普通文件',409);
  const raw=JSON.parse(readFileSync(fd,'utf8')) as ConnectionState;
  ensure(Number.isSafeInteger(raw.version)&&raw.version>=1&&Array.isArray(raw.connections)&&raw.connections.length<=20,'MODEL_CONNECTION_INVALID','模型连接配置结构无效',409);
  const connections=raw.connections.map(connection);ensure(new Set(connections.map(c=>c.provider)).size===connections.length,'MODEL_CONNECTION_INVALID','模型连接供应商重复',409);
  return {...raw,connections};
 }catch{throw new DomainError('MODEL_CONNECTION_INVALID','模型连接配置损坏；原文件保留，请核对本机配置',409);}finally{closeSync(fd);}
}
const view=(state:ConnectionState):ConnectionView=>({version:state.version,connections:state.connections.map(({provider,name,baseUrl,api,apiKey})=>({provider,name,baseUrl,api,hasApiKey:!!apiKey})),supportedApis:CONNECTION_APIS,liveVerified:false});
export function inspectModelConnections(c:AppContext,actor:Actor){userOnly(actor);return view(readState(c.dataDir));}
export function selectedModelConnection(dataDir:string,provider:string){return modelConnectionSnapshot(dataDir,provider).connection;}
/** Only endpoint/transport changes alter image approval provenance. Keys never enter its digest. */
const connectionCatalog=(state:ConnectionState)=>state.connections.map(({provider,baseUrl,api})=>({provider,baseUrl,api})).sort((a,b)=>a.provider<b.provider?-1:a.provider>b.provider?1:0);
export function modelConnectionCatalog(dataDir:string){return connectionCatalog(readState(dataDir));}
/** One read binds the selected credential/endpoint and its public catalog against A→B→A edits. */
export function modelConnectionSnapshot(dataDir:string,provider:string){const state=readState(dataDir);return {connection:state.connections.find(c=>c.provider===provider),catalog:connectionCatalog(state)};}

export function configureModelConnection(c:AppContext,actor:Actor,value:unknown,key:string){
 userOnly(actor);const x=object(value);ensure(Object.keys(x).every(k=>['expectedVersion','provider','name','baseUrl','api','apiKey'].includes(k)),'INVALID_INPUT','模型连接包含未知字段',400);
 const expected=integer(x.expectedVersion,'expectedVersion',0);text(key,'Idempotency-Key',200);
 return c.store.transaction(()=>{
  const old=readState(c.dataDir),hash=digest(value);
  if(old.receipt?.key===key){ensure(old.receipt.hash===hash,'IDEMPOTENCY_CONFLICT','相同幂等键不能改变模型连接请求');return view(old);}
  ensure(old.version===expected,'VERSION_CONFLICT','模型连接配置已变化，请刷新后核对草稿');
  const prior=old.connections.find(v=>v.provider===x.provider),next=connection({...x,apiKey:x.apiKey===undefined?prior?.apiKey:x.apiKey});
  const connections=[...old.connections.filter(v=>v.provider!==next.provider),next];ensure(connections.length<=20,'MODEL_CONNECTION_LIMIT','最多保存20个供应商连接');
  const state:ConnectionState={version:old.version+1,connections},response=view(state);state.receipt={key,hash};
  const bytes=JSON.stringify(state);ensure(Buffer.byteLength(bytes)<=512*1024,'MODEL_CONNECTION_LIMIT','模型连接配置总量最多512 KiB',413);
  // The file is the sole authority; SQLite only serializes writers. A lost reply can replay this receipt.
  const file=join(c.dataDir,CONNECTION_FILE),tmp=file+'.'+randomUUID()+'.tmp';plainPath(file);plainPath(tmp);let fd:number|undefined;
  try{fd=openSync(tmp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW??0),0o600);writeFileSync(fd,bytes);fsyncSync(fd);closeSync(fd);fd=undefined;renameSync(tmp,file);}
  catch{throw new DomainError('MODEL_CONNECTION_SAVE_FAILED','模型连接保存未确认；请刷新核对，草稿应保留',500);}
  finally{if(fd!==undefined)closeSync(fd);try{unlinkSync(tmp);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw new DomainError('MODEL_CONNECTION_SAVE_FAILED','模型连接临时文件清理失败，请核对本机配置',500);}}
  return response;
 });
}

/** Runtime registration never writes models.json/auth.json or interprets a key as a config command. */
export async function applyModelConnection(sdk:Pick<typeof import('@earendil-works/pi-coding-agent'),'ModelRuntime'>,source:ModelRuntime,selected:ModelConfig,config:Omit<ModelConnection,'apiKey'>,apiKey:string,authPath:string):Promise<ModelRuntime>{
 const existing=source.getModel(selected.provider,selected.model);
 const metadata=existing??{id:selected.model,name:selected.model,reasoning:selected.thinking!=='off',input:['text'] as ('text'|'image')[],cost:{input:0,output:0,cacheRead:0,cacheWrite:0},contextWindow:32768,maxTokens:4096};
 // modelsPath:null discards provider/model/modelOverrides headers; merging overrides cannot remove old credentials.
 const runtime=await sdk.ModelRuntime.create({authPath,modelsPath:null,refreshOnCreate:false});
 runtime.registerProvider(selected.provider,{baseUrl:config.baseUrl,api:config.api,models:[{...metadata,headers:undefined,api:config.api,baseUrl:config.baseUrl}]});
 await runtime.setRuntimeApiKey(selected.provider,apiKey);
 return runtime;
}

/** An owner-configured endpoint is a model-only outlet; redirects cannot forward its credential. */
export function connectionFetch(fetcher:typeof fetch,endpoint:string):typeof fetch {
 const origin=new URL(endpoint).origin;
 return async(input,init)=>{
  const target=new URL(input instanceof Request?input.url:input.toString());
  ensure(target.origin===origin&&!target.username&&!target.password,'MODEL_CONNECTION_ORIGIN_DENIED','模型请求离开已配置的连接地址',403);
  let response:Response;try{response=await fetcher(input,{...init,redirect:'error'});}catch{throw new Error('PROVIDER_REQUEST_FAILED: 模型连接请求失败或被中止，请核对配置与网络');}
  if(!response.ok){await response.body?.cancel();return new Response('Model provider request failed',{status:response.status,headers:{'content-type':'text/plain'}});}
  return response;
 };
}

type ProviderStream=ReturnType<ModelRuntime['streamSimple']>;
type ProviderMessage=Awaited<ReturnType<ProviderStream['result']>>;
const STREAM_FAILURE='PROVIDER_STREAM_FAILED: 模型返回错误或流中断，请核对连接与模型服务';
/** Sanitize the SDK protocol before the agent sees or persists its final message, including HTTP 200 errors. */
export function safeConnectionStream<T extends ProviderStream>(source:T):T {
 const safe=(message:ProviderMessage):ProviderMessage=>message.errorMessage===undefined?message:{...message,errorMessage:message.stopReason==='aborted'?'模型请求已中止':STREAM_FAILURE};
 const iterate=source[Symbol.asyncIterator].bind(source),result=source.result.bind(source);
 source[Symbol.asyncIterator]=async function*(){
  try{for await(const event of {[Symbol.asyncIterator]:iterate})yield event.type==='error'?{...event,error:safe(event.error)}:event.type==='done'?{...event,message:safe(event.message)}:'partial' in event?{...event,partial:safe(event.partial)}:event;}
  catch{throw new Error(STREAM_FAILURE);}
 };
 source.result=async()=>{try{return safe(await result());}catch{throw new Error(STREAM_FAILURE);}};
 return source;
}
