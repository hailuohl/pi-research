import {resolve} from 'node:path';
import {ResearchApp} from '../../packages/research-app.js';
import {USER} from '../../packages/domain/types.js';
import {ensure} from '../../packages/domain/errors.js';

/** Target credentials stay in the local owner CLI, outside operation request journals. */
export async function sshTargetCli(args:string[],root:string,dataDir:string):Promise<boolean>{
 if(args[0]!=='ssh-target')return false;
 const sub=args[1]??'help',option=(name:string)=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
 if(sub==='help'){
  console.log('ssh-target configure --id <id> --host <host> --user <user> --identity-file <path> --known-hosts-file <path> --remote-root <absolute Linux path> [--port <n>] [--expected-version <n>] [--data <dir>]\n新配置使用独立 ssh-runner-gpu.py 协议，服务 CPU/NVIDIA；旧目标仅保留已有作业对账。\nssh-target probe|get --id <id> [--data <dir>]\nssh-target list [--data <dir>]');
  return true;
 }
 ensure(['configure','probe','get','list'].includes(sub),'INVALID_INPUT','未知 SSH 目标命令');
 const required=(name:string)=>{const value=option(name);ensure(value&&!value.startsWith('--'),'INVALID_INPUT',`需要 ${name}`);return value;};
 const app=new ResearchApp(dataDir,root);
 try{
  let result:unknown;
  if(sub==='configure'){
   const port=option('--port'),expectedVersion=option('--expected-version');
   result=app.sshTargets.configure(USER,{id:required('--id'),host:required('--host'),user:required('--user'),identityFile:resolve(required('--identity-file')),knownHostsFile:resolve(required('--known-hosts-file')),remoteRoot:required('--remote-root'),gpuProtocol:true,...(port===undefined?{}:{port:Number(port)}),...(expectedVersion===undefined?{}:{expectedVersion:Number(expectedVersion)})});
  }else if(sub==='probe')result=await app.sshTargets.probe(USER,required('--id'));
  else if(sub==='get')result=app.sshTargets.get(USER,required('--id'));
  else result=app.sshTargets.list(USER);
  console.log(JSON.stringify(result,null,2));
 }finally{app.close();}
 return true;
}
