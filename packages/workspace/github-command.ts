import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {DomainError,ensure} from '../domain/errors.js';
import {gitEnvironment} from './git-command.js';
import type {GitHubAccount,GitHubRepository,GitHubStatus} from './github-types.js';

export interface RemoteRepository extends Omit<GitHubRepository,'private'> {private:boolean;ownerId:number;description:string|null;}
export interface GitHubConnection {account:GitHubAccount;repository(name:string):Promise<RemoteRepository|null>;create(name:string,marker:string):Promise<RemoteRepository>;ref(name:string,ref:string):Promise<string|null>;push(repoPath:string,name:string,commit:string,ref:string):Promise<void>;}
export interface GitHubClient {status():Promise<GitHubStatus>;connect(accountId:number):Promise<GitHubConnection>;}
type Result={code:number;stdout:string};
// Deliberately return no child stderr: gh/git may echo credentials or remote content.
export function githubProcess(command:string,args:string[],env:NodeJS.ProcessEnv,input?:string,timeoutMs=60000):Promise<Result> {
 return new Promise((resolve,reject)=>{const child=spawn(command,args,{shell:false,windowsHide:true,env,stdio:['pipe','pipe','pipe']});let bytes=0,out='',failure=false;
  const timer=setTimeout(()=>{failure=true;child.kill();},timeoutMs);
  child.stdout.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>2*1024*1024){failure=true;child.kill();}else out+=chunk.toString('utf8');});child.stderr.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>2*1024*1024){failure=true;child.kill();}});child.stdin.on('error',()=>{});
  child.on('error',()=>{clearTimeout(timer);reject(new DomainError('GITHUB_PROGRAM_UNAVAILABLE','无法启动 Git 或 GitHub CLI'));});
  child.on('close',code=>{clearTimeout(timer);if(failure)reject(new DomainError('GITHUB_RESPONSE_UNKNOWN','GitHub 请求超时或响应过大；需要核对远端结果'));else resolve({code:code??-1,stdout:out});});child.stdin.end(input);
 });
}
const networkEnvironment=()=>Object.fromEntries(['HTTPS_PROXY','HTTP_PROXY','ALL_PROXY','NO_PROXY','https_proxy','http_proxy','all_proxy','no_proxy','SSL_CERT_FILE','SSL_CERT_DIR','GIT_SSL_CAINFO','GIT_SSL_CAPATH','CURL_CA_BUNDLE'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
function ghEnvironment(){return {...Object.fromEntries(['PATH','SystemRoot','WINDIR','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','XDG_CONFIG_HOME','XDG_RUNTIME_DIR','DBUS_SESSION_BUS_ADDRESS','GH_CONFIG_DIR','TEMP','TMP','GH_TOKEN','GITHUB_TOKEN'].filter(k=>process.env[k]).map(k=>[k,process.env[k]])),...networkEnvironment(),GH_PROMPT_DISABLED:'1',GH_HOST:'github.com',NO_COLOR:'1'};}
const validName=(s:string)=>{ensure(/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(s),'GITHUB_NAME_INVALID','GitHub 仓库名无效',400);return s;};
const validRef=(s:string)=>{ensure(/^refs\/heads\/(?:main|session-[a-f0-9-]+|source-[a-f0-9-]+)$/.test(s),'GITHUB_REF_INVALID','只允许固定受管分支',400);return s;};
const sha=(s:unknown)=>{ensure(typeof s==='string'&&/^[a-f0-9]{40}$/.test(s),'GITHUB_RESPONSE_INVALID','GitHub 提交标识无效');return s;};
class Connection implements GitHubConnection {
 constructor(readonly account:GitHubAccount,private token:string,private run:typeof githubProcess=githubProcess){}
 async api(path:string,method='GET',body?:unknown):Promise<{status:number;value:any}> {
  const result=await this.run('gh',['api','--hostname','github.com','--method',method,'--include',path,...(body===undefined?[]:['--input','-'])],{...ghEnvironment(),GH_TOKEN:this.token,GITHUB_TOKEN:undefined},body===undefined?undefined:JSON.stringify(body));
  const header=/^HTTP\/[^\s]+\s+(\d{3})[^\r\n]*\r?\n/.exec(result.stdout);ensure(header,'GITHUB_RESPONSE_UNKNOWN','未收到可核实的 GitHub HTTP 回执');
  const split=result.stdout.search(/\r?\n\r?\n/);let value:any;try{value=JSON.parse(result.stdout.slice(split).trim());}catch{throw new DomainError('GITHUB_RESPONSE_UNKNOWN','GitHub 回执不是有效 JSON');}
  const status=Number(header[1]);ensure((status>=200&&status<300)=== (result.code===0),'GITHUB_RESPONSE_UNKNOWN','GitHub CLI 与 HTTP 状态不一致');return {status,value};
 }
 private parsed(value:any):RemoteRepository {ensure(value&&Number.isSafeInteger(value.id)&&value.id>0&&value.owner?.id===this.account.id&&value.owner?.type==='User'&&typeof value.private==='boolean'&&typeof value.name==='string'&&value.full_name===`${this.account.login}/${value.name}`&&value.html_url===`https://github.com/${value.full_name}`,'GITHUB_REPOSITORY_MISMATCH','远端仓库账号、身份或私密性不匹配');return {id:value.id,fullName:value.full_name,url:value.html_url,private:value.private,ownerId:value.owner.id,description:typeof value.description==='string'?value.description:null};}
 async repository(name:string){const r=await this.api(`repos/${this.account.login}/${validName(name)}`);if(r.status===404)return null;ensure(r.status===200,'GITHUB_REMOTE_UNAVAILABLE','无法核对远端仓库');return this.parsed(r.value);}
 async create(name:string,marker:string){const r=await this.api('user/repos','POST',{name:validName(name),private:true,auto_init:false,description:marker});if(r.status===422&&Array.isArray(r.value?.errors)&&r.value.errors.some((e:any)=>e.field==='name'&&/already exists/i.test(String(e.message))))throw new DomainError('GITHUB_NAME_EXISTS','仓库名称已存在');const rejected=r.status>=400&&r.status<500&&r.status!==408&&r.status!==499;ensure(r.status===201,rejected?'GITHUB_CREATE_FAILED':'GITHUB_RESPONSE_UNKNOWN',rejected?'GitHub 明确拒绝私密仓库创建请求':'GitHub 仓库创建结果未知；须按原候选名称核对');return this.parsed(r.value);}
 async ref(name:string,ref:string){validRef(ref);const r=await this.api(`repos/${this.account.login}/${validName(name)}/git/ref/${ref.slice(5)}`);if(r.status===404||r.status===409)return null;ensure(r.status===200,'GITHUB_REMOTE_UNAVAILABLE','无法核对远端分支');return sha(r.value?.object?.sha);}
 async push(repoPath:string,name:string,commit:string,ref:string){sha(commit);validRef(ref);const auth=Buffer.from(`x-access-token:${this.token}`).toString('base64');
  const result=await this.run('git',['--git-dir',repoPath,'-c',`core.hooksPath=${join(repoPath,'disabled-hooks')}`,'-c','credential.helper=','-c','http.followRedirects=false','push','--porcelain','--',`https://github.com/${this.account.login}/${validName(name)}.git`,`${commit}:${ref}`],{...gitEnvironment(),...networkEnvironment(),GIT_ALLOW_PROTOCOL:'https',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:`AUTHORIZATION: basic ${auth}`});
  ensure(result.code===0,'GITHUB_PUSH_UNKNOWN','Git 推送未确认成功；先核对固定远端分支');
 }
}
export class GitHubCommand implements GitHubClient {
 constructor(private run:typeof githubProcess=githubProcess){}
 private async credentials(run=this.run){const result=await run('gh',['auth','token','--hostname','github.com'],ghEnvironment());const token=result.stdout.trim();ensure(result.code===0&&token.length>0&&token.length<4096&&!/[\s\0]/.test(token),'GITHUB_AUTH_REQUIRED','请先使用 GitHub CLI 登录 github.com');const connection=new Connection({id:0,login:''},token,run),r=await connection.api('user');ensure(r.status===200&&Number.isSafeInteger(r.value?.id)&&r.value.id>0&&r.value.type==='User'&&/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(r.value.login),'GITHUB_AUTH_REQUIRED','需要可核实的 github.com 个人账号');return new Connection({id:r.value.id,login:r.value.login},token,run);}
 async connect(accountId:number){const c=await this.credentials();ensure(c.account.id===accountId,'GITHUB_ACCOUNT_CHANGED','当前 GitHub 账号与创建时选择不一致');return c;}
 async status():Promise<GitHubStatus>{const result:GitHubStatus={ready:false,gitInstalled:false,cliInstalled:false,state:'unavailable',message:'GitHub 暂不可用',checkedAt:new Date().toISOString()};
  const deadline=Date.now()+15000,run:typeof githubProcess=(command,args,env,input)=>this.run(command,args,env,input,Math.max(1,Math.min(5000,deadline-Date.now())));
  try{result.gitInstalled=(await run('git',['--version'],gitEnvironment())).code===0;}catch{}
  try{const r=await run('gh',['--version'],ghEnvironment());result.cliInstalled=r.code===0;const version=/^gh version ([0-9]+\.[0-9]+\.[0-9]+)/.exec(r.stdout);if(r.code===0&&version)result.version=version[1];}catch{}
  if(!result.gitInstalled)return {...result,state:'missing-git',message:'请先安装 Git'};if(!result.cliInstalled)return {...result,state:'missing-cli',message:'请先安装 GitHub CLI'};
  try{const auth=await run('gh',['auth','status','--active','--hostname','github.com'],ghEnvironment());ensure(auth.code===0,'GITHUB_AUTH_REQUIRED','GitHub CLI 登录不可用');const c=await this.credentials(run);return {...result,ready:true,state:'ready',account:c.account,message:'GitHub CLI 已登录；仓库写入权限将在同步时核验'};}catch{return {...result,state:'unauthenticated',message:'请核对 github.com 登录、账号权限及网络'};}
 }
}
