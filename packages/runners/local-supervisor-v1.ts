import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync,lstatSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
import type {AppContext} from '../domain/context.js';
import type {DockerRun,DockerSupervisorCallbacks} from './adapter.js';
import {LocalRuntimeService,localEnvironment} from './local-runtime.js';
import {assertLocalEntry,LOCAL_ENTRY_HINT} from './local-entry.js';
import {assertGpuDevices,nativeGpuInventory} from './gpu.js';
import {verifySnapshot,safePath} from '../workspace/files.js';
import {readStableFile} from '../workspace/stable-file.js';
import {ensure} from '../domain/errors.js';
import {digest} from '../storage/store.js';
import {environmentVariables} from '../runtime/environment.js';

export async function superviseLegacyLocalRun(initial:DockerRun,c:AppContext,callbacks:DockerSupervisorCallbacks){
 const generation=initial.execution.generation,control=c.store.paths.physical(initial.execution.controlDir),output=c.store.paths.physical(initial.outputDir),work=join(control,'work');let possible=initial.execution.startRequested,lost=false;
 const read=()=>{callbacks.fence();return callbacks.read();};
 const patch=(value:Parameters<DockerSupervisorCallbacks['patch']>[0])=>{const r=read();return callbacks.patch({...value,execution:{...r.execution,...value.execution}});};
 const finish=async(state:'failed'|'cancelled'|'succeeded',exitCode:number|null,error?:string,incomplete=false)=>callbacks.finalize({generation,state,exitCode,error,incomplete,logTruncated:false,outputExceeded:false});
 const timer=setInterval(()=>{try{const r=read();patch({heartbeat:Date.now(),execution:{...r.execution,leaseUntil:Date.now()+60000}});}catch{lost=true;}},3000);
 try {
  const run=read();ensure(!run.execution.startRequested,'LOCAL_STATE_UNKNOWN','本地未知启动不得重复执行');callbacks.assertGrant(run);
  const runtime=new LocalRuntimeService(c).resolve(run.manifest.contract.localRuntimeId!,run.manifest.localRuntime);
  assertLocalEntry(run.manifest.contract,runtime,run.manifest.sourceFiles);
  if(run.manifest.contract.gpu)assertGpuDevices(run.manifest.contract.gpu,await nativeGpuInventory());
  verifySnapshot(c.store.paths.physical(run.manifest.snapshotPath),run.manifest.sourceFiles);
  mkdirSync(work,{recursive:true,mode:0o700});mkdirSync(output,{recursive:true,mode:0o700});
  for(const f of run.manifest.sourceFiles){const bytes=readStableFile(c.store.paths.physical(run.manifest.snapshotPath),f.path,f.size);ensure(digest(bytes)===f.digest,'SNAPSHOT_CORRUPTED','固定源码已变化');const path=safePath(work,f.path);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes,{flag:'wx',mode:f.mode==='100755'?0o700:0o600});}
  const temp=join(control,'tmp');mkdirSync(temp,{recursive:true});
  const specPath=join(control,'native-spec.json'),baseEnvironment=localEnvironment(temp,output,run.manifest.contract.gpu?.deviceIds),spec={executable:runtime.executable,argv:run.manifest.contract.command.slice(1),env:{...environmentVariables(c.dataDir),...baseEnvironment},work,control,manifestDigest:run.manifestDigest};
  writeFileSync(specPath,JSON.stringify(spec),{mode:0o600});let cleared=false;
  const clearEnvironment=()=>{if(!cleared){writeFileSync(specPath,JSON.stringify({...spec,env:baseEnvironment}),{mode:0o600});cleared=true;}};
  callbacks.assertGrant(read());ensure(!read().cancelRequested,'RUN_CANCELLED','作业已取消');patch({startedAt:new Date().toISOString(),execution:{...read().execution,startRequested:true}});possible=true;
  const windows=process.platform==='win32';
  const child=windows?spawn('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',join(c.repoRoot,'scripts','local-windows-runner.ps1'),specPath],{windowsHide:true,env:localEnvironment(temp,output),stdio:['ignore','inherit','inherit']}):spawn(process.execPath,[join(c.repoRoot,'scripts','local-posix-runner.mjs'),specPath],{detached:true,env:localEnvironment(temp,output),stdio:'ignore'});
  let closed=false,spawnError=false;child.on('error',()=>{spawnError=true;});child.on('close',()=>{closed=true;});let stopping:'failed'|'cancelled'|undefined,reason:string|undefined;
  const outputSize=()=>{let total=0,count=0;const pending=[output];while(pending.length){for(const e of readdirSync(pending.pop()!,{withFileTypes:true})){if(++count>5000||e.isSymbolicLink())throw new Error('OUTPUT_LIMIT');const p=join(e.parentPath,e.name),stat=lstatSync(p);if(stat.isDirectory())pending.push(p);else{ensure(stat.isFile(),'OUTPUT_LIMIT','输出类型无效');total+=stat.size;}}}return total;};
  while(!closed){const r=read();if(lost)throw new Error('LEASE_EXPIRED');
   if(r.cancelRequested){stopping='cancelled';reason='RUN_CANCELLED';}
   else if(Date.now()>Date.parse(r.startedAt!)+r.manifest.contract.timeoutSeconds*1000){stopping='failed';reason='LOCAL_TIMEOUT';}
   else try{callbacks.assertGrant(r);const logBytes=['stdout.log','stderr.log'].reduce((sum,n)=>sum+(existsSync(join(control,n))?lstatSync(join(control,n)).size:0),0);ensure(logBytes<=r.manifest.contract.logBytes!&&outputSize()<=r.manifest.contract.outputBytes!,'OUTPUT_LIMIT','日志或输出超过上限');}catch(error){stopping='failed';reason=(error as {code?:string}).code??'LOCAL_MONITOR_FAILED';}
   if(stopping)writeFileSync(join(control,'native-cancel'),'cancel',{mode:0o600});
   if(existsSync(join(control,'native-start.json'))){clearEnvironment();if(r.state==='submitting')patch({state:r.cancelRequested?'cancelling':'running'});}
   await pause(100);
  }
  clearEnvironment();
  if(spawnError){await finish('failed',null,'LOCAL_HELPER_UNAVAILABLE',true);return;}
  const result=JSON.parse(readFileSync(join(control,'native-result.json'),'utf8'));ensure(result.manifestDigest===run.manifestDigest,'LOCAL_STATE_UNKNOWN','本地回执不符');
  if(windows)ensure(result.stopped===true,'LOCAL_STATE_UNKNOWN','尚未确认进程树终止');
  else {let stopped=false;for(let attempt=0;attempt<20;attempt++){const ps=spawnSync('/bin/ps',['-axo','pgid=,stat='],{encoding:'utf8',timeout:5000});ensure(ps.status===0,'LOCAL_STATE_UNKNOWN','无法核对进程组');stopped=!ps.stdout.split('\n').some(line=>{const [group,status]=line.trim().split(/\s+/);return Number(group)===child.pid&&!status?.startsWith('Z');});if(stopped)break;await pause(50);}ensure(stopped,'LOCAL_STATE_UNKNOWN','尚未确认进程组终止');}
  await finish(stopping??(result.exitCode===0?'succeeded':'failed'),result.exitCode,reason??result.error,!!stopping||result.exitCode!==0);
 }catch(error){if(!lost){try{const r=read(),code=(error as {code?:string}).code??'LOCAL_PREPARATION_FAILED';if(possible)patch({state:'unknown',integrity:'incomplete',error:'LOCAL_STATE_UNKNOWN: 保留资源；不按旧 PID 重启或取消',execution:{...r.execution,leaseUntil:0}});else await finish(r.cancelRequested?'cancelled':'failed',null,code==='LOCAL_ENTRY_INVALID'?code+': '+LOCAL_ENTRY_HINT:code,true);}catch{/* A newer authority owns state. */}}}
 finally{clearInterval(timer);}
}
