import {closeSync,constants,fsyncSync,fstatSync,lstatSync,openSync,readFileSync,renameSync,unlinkSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {AppContext} from '../domain/context.js';
import type {Actor} from '../domain/types.js';
import {DomainError,ensure} from '../domain/errors.js';
import {integer,object,text,oneOf} from '../contracts/validation.js';
import {userOnly} from '../policy/permissions.js';
import {digest} from '../storage/store.js';

export const ENVIRONMENT_FILE='environment-variables.json';
interface State {version:number;variables:Record<string,string>;history:string[];receipt?:{key:string;hash:string};}
const maximum=2*1024*1024;
const denied=/^(?:PATH|PATHEXT|HOME|USERPROFILE|TMP|TEMP|TMPDIR|SYSTEMROOT|WINDIR|COMSPEC|SHELL|ENV|BASH_ENV|IFS|OUTPUT_DIR|CUDA_VISIBLE_DEVICES|NVIDIA_VISIBLE_DEVICES|RUBYOPT|RUBYLIB|PERL5OPT|PERL5LIB|JAVA_TOOL_OPTIONS|JDK_JAVA_OPTIONS|_JAVA_OPTIONS|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|NO_PROXY|REQUESTS_CA_BUNDLE|CURL_CA_BUNDLE|SSL_CERT_FILE|SSL_CERT_DIR|NODE_.*|LD_.*|DYLD_.*|PYTHON.*|GIT_.*|BASH_.*|DOTNET_.*|PI_(?!API_KEY$).*)$/;
function name(value:unknown){ensure(typeof value==='string'&&/^[A-Z_][A-Z0-9_]{0,127}$/.test(value)&&!denied.test(value),'INVALID_INPUT','变量名须为大写字母、数字或下划线，且不能覆盖宿主、解释器或网络代理设置',400);return value;}
function secret(value:unknown){ensure(typeof value==='string'&&value.trim().length>0&&value.length<=8192&&!/[\x00-\x1f\x7f]/.test(value),'INVALID_INPUT','变量值须为非空文本，最多8192字符且不能包含控制字符',400);return value;}
function plainPath(path:string){for(let part=resolve(path);;part=dirname(part)){try{ensure(!lstatSync(part).isSymbolicLink(),'ENVIRONMENT_PATH_DENIED','环境变量配置不能经过链接',403);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}if(dirname(part)===part)break;}}
function read(dataDir:string):State {
 const path=join(dataDir,ENVIRONMENT_FILE);plainPath(path);let fd:number;
 try{fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return {version:0,variables:{},history:[]};throw new DomainError('ENVIRONMENT_READ_FAILED','环境变量配置无法读取',500);}
 try{const stat=fstatSync(fd);ensure(stat.isFile()&&stat.size<=maximum,'ENVIRONMENT_INVALID','环境变量配置文件无效',409);const raw=JSON.parse(readFileSync(fd,'utf8')) as State;
  ensure(Number.isSafeInteger(raw.version)&&raw.version>=1&&Array.isArray(raw.history)&&raw.history.length<=4096,'ENVIRONMENT_INVALID','环境变量配置结构无效',409);
  const variables=Object.fromEntries(Object.entries(object(raw.variables)).map(([key,value])=>[name(key),secret(value)]));ensure(Object.keys(variables).length<=128,'ENVIRONMENT_INVALID','环境变量数量无效',409);
  const history=raw.history.map(secret);ensure(Object.values(variables).every(value=>history.includes(value)),'ENVIRONMENT_INVALID','环境变量遮罩记录不完整',409);return {...raw,variables,history};
 }catch{throw new DomainError('ENVIRONMENT_INVALID','环境变量配置损坏；原文件保留，请核对本机配置',409);}finally{closeSync(fd);}
}
const view=(state:State)=>({version:state.version,variables:Object.keys(state.variables).sort().map(name=>({name,hasValue:true as const})),scope:'local' as const});
export function environmentVariables(dataDir:string):Record<string,string>{return read(dataDir).variables;}
export function inspectEnvironment(c:AppContext,actor:Actor){userOnly(actor);return view(read(c.dataDir));}
export function configureEnvironment(c:AppContext,actor:Actor,value:unknown,key:string){
 userOnly(actor);const x=object(value);ensure(Object.keys(x).every(k=>['action','expectedVersion','name','value'].includes(k)),'INVALID_INPUT','环境变量请求包含未知字段',400);
 const action=oneOf(x.action,['set','delete'] as const,'action'),expected=integer(x.expectedVersion,'expectedVersion',0),variable=name(x.name);text(key,'Idempotency-Key',200);
 const next=action==='set'?secret(x.value):undefined;ensure(action==='set'||x.value===undefined,'INVALID_INPUT','删除请求不能包含变量值',400);
 return c.store.transaction(()=>{const old=read(c.dataDir),hash=digest(value);if(old.receipt?.key===key){ensure(old.receipt.hash===hash,'IDEMPOTENCY_CONFLICT','相同幂等键不能改变环境变量请求');return view(old);}
  ensure(old.version===expected,'VERSION_CONFLICT','环境变量已变化，请刷新后核对草稿');
  const variables={...old.variables};if(next===undefined)delete variables[variable];else variables[variable]=next;
  const history=[...new Set([...old.history,...(next===undefined?[]:[next])])];ensure(Object.keys(variables).length<=128&&history.length<=4096,'ENVIRONMENT_LIMIT','环境变量或历史遮罩数量达到上限；旧遮罩不会被丢弃',409);
  const state:State={version:old.version+1,variables,history,receipt:{key,hash}},bytes=JSON.stringify(state);ensure(Buffer.byteLength(bytes)<=maximum,'ENVIRONMENT_LIMIT','环境变量与历史遮罩总量最多2 MiB',413);
  const file=join(c.dataDir,ENVIRONMENT_FILE),tmp=file+'.'+randomUUID()+'.tmp';plainPath(file);plainPath(tmp);let fd:number|undefined;
  try{fd=openSync(tmp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW??0),0o600);writeFileSync(fd,bytes);fsyncSync(fd);closeSync(fd);fd=undefined;renameSync(tmp,file);}
  catch{throw new DomainError('ENVIRONMENT_SAVE_FAILED','环境变量保存未确认；请刷新核对，草稿应保留',500);}
  finally{if(fd!==undefined)closeSync(fd);try{unlinkSync(tmp);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw new DomainError('ENVIRONMENT_SAVE_FAILED','环境变量临时文件清理失败',500);}}
  return view(state);
 });
}
/** Deleted/rotated values remain private, solely to protect historical output. */
export function environmentSecrets(dataDir:string){return [...new Set(read(dataDir).history.flatMap(value=>[value,JSON.stringify(value).slice(1,-1)]))].sort((a,b)=>b.length-a.length);}
const secretPattern=(secrets:string[])=>new RegExp(secrets.map(secret=>secret.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
export function redactEnvironment(dataDir:string,value:string):string {const secrets=environmentSecrets(dataDir);return secrets.length?value.replace(secretPattern(secrets),'[REDACTED]'):value;}
export function hasEnvironmentSecrets(dataDir:string){return read(dataDir).history.length>0;}
/** Keep enough raw tail that no credential can cross an already published boundary. */
export function redactEnvironmentChunk(dataDir:string,value:string){
 const secrets=environmentSecrets(dataDir);let cut=Math.max(0,value.length-Math.max(0,...secrets.map(secret=>secret.length-1)));
 if(secrets.length){const pattern=secretPattern(secrets);let match:RegExpExecArray|null;while((match=pattern.exec(value))&&match.index<cut)if(match.index+match[0].length>cut){cut=match.index;break;}}
 if(cut>0&&/[\uD800-\uDBFF]/.test(value[cut-1])&&/[\uDC00-\uDFFF]/.test(value[cut]??''))cut--;
 const prefix=value.slice(0,cut);return {text:secrets.length?prefix.replace(secretPattern(secrets),'[REDACTED]'):prefix,tail:value.slice(cut)};
}
