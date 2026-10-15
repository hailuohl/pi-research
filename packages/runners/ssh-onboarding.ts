import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {existsSync,lstatSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {isAbsolute,join} from 'node:path';
import {performance} from 'node:perf_hooks';
import type {AppContext} from '../domain/context.js';
import {DomainError,ensure} from '../domain/errors.js';
import {digest} from '../storage/store.js';
import {sshArgs,sshEnvironment} from './ssh.js';
import type {PrivateSshTarget} from './ssh-targets.js';

export interface SshHealth {supervisor:'ready'|'missing'|'mismatch'|'unsafe'|'unknown';docker:'ready'|'missing'|'unavailable'|'unsupported'|'unknown';workspace:'ready'|'missing'|'invalid'|'unknown';errorCode?:string;engineId?:string;protocolDigest?:string;cpus?:number;memoryMb?:number;}
export interface HostKey {keyType:string;key:string;fingerprint:string;}
export interface SshChallenge extends HostKey {challengeId:string;expiresAt:string;target:Omit<PrivateSshTarget,'knownHostsFile'|'hostKeyDigest'|'verified'>;expectedVersion:number;confirmedVersion?:number;}
export const SSH_SETUP_CODES=new Set(['SSH_PYTHON_REQUIRED','SSH_LINUX_REQUIRED','SSH_AUTHENTICATION_FAILED','SSH_HOST_KEY_CHANGED','SSH_TARGET_UNAVAILABLE','SSH_SUPERVISOR_MISSING','SSH_PROTOCOL_MISMATCH','SSH_SUPERVISOR_UNSAFE','SSH_SETUP_PERMISSION_REQUIRED','SSH_WORKSPACE_MISSING','SSH_WORKSPACE_INVALID','SSH_DOCKER_MISSING','SSH_DOCKER_UNAVAILABLE','SSH_DOCKER_UNSUPPORTED','SSH_SETUP_UNKNOWN','SSH_TARGET_CHANGED','SSH_TARGET_BUSY']);
export function setupError(error:unknown){return error instanceof DomainError&&SSH_SETUP_CODES.has(error.code)?error.code:'SSH_TARGET_UNAVAILABLE';}
export function sshPrivateDir(c:AppContext){const path=join(c.dataDir,'ssh-private');mkdirSync(path,{recursive:true,mode:0o700});ensure(lstatSync(path).isDirectory()&&!lstatSync(path).isSymbolicLink(),'SSH_TARGET_CHANGED','SSH 私有目录无效');return path;}
export function privateJson<T>(c:AppContext,name:string):T|undefined {const dir=join(c.dataDir,'ssh-private'),file=join(dir,name);if(!existsSync(dir))return;ensure(lstatSync(dir).isDirectory()&&!lstatSync(dir).isSymbolicLink(),'SSH_TARGET_CHANGED','SSH 私有目录无效');if(!existsSync(file))return;ensure(lstatSync(file).isFile()&&!lstatSync(file).isSymbolicLink(),'SSH_TARGET_CHANGED','SSH 私有文件无效');return JSON.parse(readFileSync(file,'utf8'));}
export function savePrivateJson(c:AppContext,name:string,value:unknown){const dir=sshPrivateDir(c),tmp=join(dir,randomUUID()+'.tmp');writeFileSync(tmp,JSON.stringify(value),{mode:0o600,flag:'wx'});renameSync(tmp,join(dir,name));}
export function challengeName(id:string){ensure(/^[a-f0-9-]{36}$/.test(id),'INVALID_INPUT','SSH 挑战标识无效',400);return 'challenge-'+id+'.json';}
export function endpoint(t:{host:string;port:number}){return t.host.toLowerCase().replace(/\.$/,'')+':'+t.port;}
export function trustName(t:{host:string;port:number}){return 'trust-'+digest(endpoint(t))+'.json';}
export function hostToken(t:{host:string;port:number}){return t.port===22?t.host:`[${t.host}]:${t.port}`;}

/** Validate the SSH wire key before hashing it; scanner output never supplies a hostname or options. */
export function parseHostKeys(output:string):HostKey[]{
 const keys=new Map<string,HostKey>();
 for(const line of output.split(/\r?\n/)){if(!line.trim()||line.startsWith('#'))continue;const parts=line.trim().split(/\s+/);ensure(parts.length===3,'SSH_HOST_KEY_INVALID','服务器主机密钥响应无效');const [,keyType,key]=parts;
  ensure(['ssh-ed25519','ecdsa-sha2-nistp256','ecdsa-sha2-nistp384','ecdsa-sha2-nistp521','ssh-rsa'].includes(keyType)&&/^[A-Za-z0-9+/]+={0,2}$/.test(key)&&key.length<16384,'SSH_HOST_KEY_INVALID','服务器主机密钥类型或内容无效');
  const bytes=Buffer.from(key,'base64');ensure(bytes.toString('base64')===key,'SSH_HOST_KEY_INVALID','服务器主机密钥编码无效');let offset=0;
  const field=()=>{ensure(offset+4<=bytes.length,'SSH_HOST_KEY_INVALID','服务器主机密钥结构无效');const length=bytes.readUInt32BE(offset);offset+=4;ensure(length>0&&offset+length<=bytes.length,'SSH_HOST_KEY_INVALID','服务器主机密钥结构无效');const value=bytes.subarray(offset,offset+length);offset+=length;return value;};
  ensure(field().toString()===keyType,'SSH_HOST_KEY_INVALID','服务器主机密钥类型不符');
  if(keyType==='ssh-ed25519')ensure(field().length===32,'SSH_HOST_KEY_INVALID','Ed25519 主机密钥无效');
  else if(keyType==='ssh-rsa'){const exponent=field(),modulus=field();ensure(exponent.length<=8&&exponent[0]<128&&modulus.length>=256&&modulus.length<=1025&&modulus[0]<128,'SSH_HOST_KEY_INVALID','RSA 主机密钥无效');}
  else{const curve=keyType.slice('ecdsa-sha2-'.length);ensure(field().toString()===curve,'SSH_HOST_KEY_INVALID','ECDSA 曲线不符');const point=field();ensure(point[0]===4&&point.length===({nistp256:65,nistp384:97,nistp521:133} as Record<string,number>)[curve],'SSH_HOST_KEY_INVALID','ECDSA 主机密钥无效');}
  ensure(offset===bytes.length,'SSH_HOST_KEY_INVALID','服务器主机密钥尾部无效');const fingerprint='SHA256:'+createHash('sha256').update(bytes).digest('base64').replace(/=+$/,'');
  ensure(!keys.has(keyType)||keys.get(keyType)!.key===key,'SSH_HOST_KEY_CONFLICT','服务器返回冲突主机密钥');keys.set(keyType,{keyType,key,fingerprint});
 }
 ensure(keys.size>0,'SSH_HOST_KEY_UNAVAILABLE','未取得服务器主机密钥');return [...keys.values()].sort((a,b)=>['ssh-ed25519','ecdsa-sha2-nistp256','ecdsa-sha2-nistp384','ecdsa-sha2-nistp521','ssh-rsa'].indexOf(a.keyType)-['ssh-ed25519','ecdsa-sha2-nistp256','ecdsa-sha2-nistp384','ecdsa-sha2-nistp521','ssh-rsa'].indexOf(b.keyType));
}

function bounded(executable:string,args:string[],input:string,timeout:number):Promise<{code:number|null;stdout:string;stderr:string}>{return new Promise((resolve,reject)=>{
 const child=spawn(executable,args,{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe'],env:sshEnvironment()});let stdout='',stderr='',failed=false,terminationTimer:ReturnType<typeof setTimeout>|undefined;
 const fail=()=>{if(failed)return;failed=true;clearTimeout(timer);terminationTimer=setTimeout(()=>child.kill('SIGKILL'),1000);child.kill();};const timer=setTimeout(fail,timeout);
 child.stdout.on('data',(b:Buffer)=>{if(failed)return;stdout+=b.toString();if(Buffer.byteLength(stdout)>512*1024)fail();});child.stderr.on('data',(b:Buffer)=>{if(failed)return;stderr+=b.toString();if(Buffer.byteLength(stderr)>64*1024)fail();});child.stdin.on('error',()=>{});child.on('error',fail);child.on('close',code=>{clearTimeout(timer);clearTimeout(terminationTimer);if(failed)reject(new DomainError('SSH_TARGET_UNAVAILABLE','SSH 连接未完成，请重新检测',409));else resolve({code,stdout,stderr});});child.stdin.end(input);
});}
export async function scanHostKeys(t:{host:string;port:number}){
 const deadline=performance.now()+15000,args=['-T','10','-p',String(t.port),'-t','ed25519,ecdsa,rsa','--',t.host];let r=await bounded('ssh-keyscan',args,'',15000);
 // Some Windows OpenSSH builds advertise a KEX they cannot use; Git bundles a separate OpenSSH scanner.
 if(process.platform==='win32'&&r.code!==0&&/choose_kex: unsupported KEX method/.test(r.stderr)){
  const roots=[process.env.LOCALAPPDATA?join(process.env.LOCALAPPDATA,'Programs'):undefined,process.env.ProgramFiles,process.env['ProgramFiles(x86)']];
  const scanner=roots.filter((root):root is string=>typeof root==='string'&&isAbsolute(root)).map(root=>join(root,'Git','usr','bin','ssh-keyscan.exe')).find(file=>{try{const stat=lstatSync(file);return stat.isFile()&&!stat.isSymbolicLink();}catch{return false;}});
  if(scanner&&performance.now()<deadline)r=await bounded(scanner,args,'',Math.max(1,deadline-performance.now()));
 }
 ensure(r.code===0,'SSH_HOST_KEY_UNAVAILABLE',/choose_kex: unsupported KEX method/.test(r.stderr)?(process.platform==='win32'?'本机 SSH 主机密钥扫描器不兼容；请安装或更新 Git for Windows 后重新获取指纹':'本机 SSH 主机密钥扫描器不兼容；请更新本机 OpenSSH 后重新获取指纹'):'无法取得 SSH 主机密钥；请检查地址和端口');return parseHostKeys(r.stdout);
}
/** The command is bundled code only. All values, including helper bytes, travel as JSON over stdin. */
export async function sshOnboardingRequest(c:AppContext,t:PrivateSshTarget,action:'inspect'|'install'):Promise<SshHealth>{
 const source=readFileSync(join(c.repoRoot,'scripts','ssh-onboarding.py')),helper=readFileSync(join(c.repoRoot,'scripts','ssh-runner-gpu.py'));
 const command=`python3 -c 'import base64;exec(base64.b64decode("${source.toString('base64')}"))'`,args=sshArgs(t);args[args.length-1]=command;
 const r=await bounded('ssh',args,JSON.stringify({action,root:t.remoteRoot,digest:digest(helper),...(action==='install'?{helper:helper.toString('base64'),bootstrap:source.toString('base64')}:{})}),60000);
 if(r.code!==0){const code=/REMOTE HOST IDENTIFICATION HAS CHANGED|Host key verification failed/i.test(r.stderr)?'SSH_HOST_KEY_CHANGED':/Permission denied.*publickey|Authentication failed/i.test(r.stderr)?'SSH_AUTHENTICATION_FAILED':/python3.*(?:not found|No such file)/i.test(r.stderr)?'SSH_PYTHON_REQUIRED':'SSH_TARGET_UNAVAILABLE';throw new DomainError(code,'SSH 检查失败：'+code,409);}
 let value:any;try{value=JSON.parse(r.stdout);}catch{throw new DomainError('SSH_PROTOCOL_INVALID','SSH 检查响应无效',409);}
 ensure(value?.protocol===1&&['ready','missing','mismatch','unsafe','unknown'].includes(value.supervisor)&&['ready','missing','unavailable','unsupported','unknown'].includes(value.docker)&&['ready','missing','invalid','unknown'].includes(value.workspace),'SSH_PROTOCOL_INVALID','SSH 检查响应无效');
 ensure(value.errorCode===undefined||SSH_SETUP_CODES.has(value.errorCode),'SSH_PROTOCOL_INVALID','SSH 检查错误码无效');
 if(value.engineId!==undefined)ensure(typeof value.engineId==='string'&&/^[A-Za-z0-9._:-]{1,200}$/.test(value.engineId),'SSH_PROTOCOL_INVALID','Docker 身份无效');
 if(value.protocolDigest!==undefined)ensure(value.protocolDigest===digest(helper),'SSH_PROTOCOL_MISMATCH','监管器版本不符');
 for(const key of ['cpus','memoryMb'])if(value[key]!==undefined)ensure(Number.isSafeInteger(value[key])&&value[key]>0,'SSH_PROTOCOL_INVALID','SSH 资源信息无效');
 return {supervisor:value.supervisor,docker:value.docker,workspace:value.workspace,...(value.errorCode?{errorCode:value.errorCode}:{}),...(value.engineId?{engineId:value.engineId}:{}),...(value.protocolDigest?{protocolDigest:value.protocolDigest}:{}),...(value.cpus!==undefined?{cpus:value.cpus}:{}),...(value.memoryMb!==undefined?{memoryMb:value.memoryMb}:{})};
}
