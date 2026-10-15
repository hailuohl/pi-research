import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,mkdirSync,lstatSync,openSync,readSync,closeSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {setup,USER,approve} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {validateContract} from '../../dist/packages/runners/contracts.js';
import {validateGpu} from '../../dist/packages/runners/gpu.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {localEnvironment} from '../../dist/packages/runners/local-runtime.js';
import {createArgs} from '../../dist/packages/execution/docker.js';
import {superviseLocalRun} from '../../dist/packages/runners/local-supervisor.js';
const UUID='GPU-11111111-1111-1111-1111-111111111111';
const root=process.cwd();
function diagnose(app,id,reason){
 try{const run=app.runs.get(USER,id);console.error('local Run failure: '+JSON.stringify({id,reason,state:run.state,execution:run.execution,supervisorPid:run.supervisorPid,heartbeat:run.heartbeat,startedAt:run.startedAt,error:run.error}));
  const control=app.store.paths.physical(run.execution.controlDir);
  for(const name of ['supervisor.log','stdout.log','stderr.log','native-start.json','native-result.json']){
   let fd;try{const path=join(control,name);assert.ok(lstatSync(path).isFile(),'not a regular file');fd=openSync(path,'r');const bytes=Buffer.alloc(4096),count=readSync(fd,bytes,0,bytes.length,0);console.error(`local Run ${id} ${name}: ${bytes.subarray(0,count).toString('utf8')}`);}
   catch(error){console.error(`local Run ${id} ${name}: ${error.code??error.message}`);}finally{if(fd!==undefined)closeSync(fd);}
  }
 }catch(error){console.error(`local Run ${id} diagnostics unavailable: ${error.code??error.message}`);}
}
async function wait(app,id,timeout){const end=Date.now()+timeout;while(Date.now()<end){app.runs.reconcile();app.runs.launchPending();const run=app.runs.get(USER,id);if(['succeeded','failed','cancelled','unknown'].includes(run.state)){if(run.state==='unknown')diagnose(app,id,'unknown result');return run;}await new Promise(r=>setTimeout(r,50));}diagnose(app,id,'wait timeout');throw new Error('Run timeout: '+JSON.stringify(app.runs.get(USER,id)));}
const contract={runner:'local',localRuntimeId:'node',command:['node','main.mjs'],environment:{},datasetVersion:'local-test-v1',evaluationProtocolVersion:'fixed-v1',metrics:{value:{unit:'count',direction:'max'}},expectedArtifacts:['metrics.json'],networkPolicy:'host',timeoutSeconds:15,cpus:1,memoryMb:128};
function prepared(s,code='import {writeFileSync} from "node:fs";if(process.platform==="win32"&&!process.env.ProgramFiles)throw Error("NVML_SYSTEM_ENV_MISSING");writeFileSync(process.env.PI_OUTPUT_DIR+"/metrics.json",JSON.stringify({value:42}));',gpu,timeoutSeconds=15){
 if(!s.app.localRuntimes.list().length)s.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:0});
 writeFileSync(join(s.app.store.paths.physical(s.project.workspace),'main.mjs'),code);
 const e=s.app.experiments.create(USER,s.project.id,{title:'Local exact source',contract:{...contract,timeoutSeconds,...(gpu?{gpu:{vendor:'nvidia',deviceIds:gpu}}:{})}}),i=s.app.runs.prepare(USER,e.id);approve(s.app,i.approvalId);return s.app.runs.submit(USER,i.id);
}
test('local CPU runtime freezes public identity without path and executes approved source without Python',async()=>{
 const s=setup();try{const run=prepared(s);assert.equal(JSON.stringify(run.manifest).includes(process.execPath),false);assert.equal(run.manifest.localExecution.isolation,'none');assert.equal(run.manifest.contract.gpu,undefined);
  const q=s.app.store.db.prepare('SELECT * FROM compute_queue WHERE id=?').get(run.id);assert.equal(q.backend,'local');assert.equal(q.bound,1);assert.equal(q.target_id,run.manifest.localRuntime.hostId);
  const done=await wait(s.app,run.id,20000);assert.equal(done.state,'succeeded',JSON.stringify(done));assert.equal(done.integrity,'complete');assert.equal(done.metrics.value,42);
  if(process.platform==='win32')assert.match(readFileSync(join(s.app.store.paths.physical(run.execution.controlDir),'supervisor.log'),'utf8'),/PI_LOCAL_STAGE:boot[\s\S]*PI_LOCAL_STAGE:spec-ready[\s\S]*PI_LOCAL_STAGE:interop-ready/);
  const env=s.app.operations.execute(USER,'execution_environment_list',{}, {projectId:s.project.id});validateSchema(OUTPUT_SCHEMAS.execution_environment_list,env,'output');
 }finally{s.close();}
});

test('local approved CPU source executes from a Unicode and space data path with matching native receipts',async()=>{
 const s=setup();try{s.app.close();s.app=new ResearchApp(join(s.dir,'中文 数据目录'),root);s.project=s.app.projects.create(USER,{name:'Unicode local',template:'curve-fit'});
  const run=prepared(s),done=await wait(s.app,run.id,20000);assert.equal(done.state,'succeeded',JSON.stringify(done));assert.equal(done.integrity,'complete');assert.equal(done.metrics.value,42);
  const control=s.app.store.paths.physical(run.execution.controlDir),start=JSON.parse(readFileSync(join(control,'native-start.json'),'utf8')),result=JSON.parse(readFileSync(join(control,'native-result.json'),'utf8'));assert.equal(start.manifestDigest,run.manifestDigest);assert.equal(result.manifestDigest,run.manifestDigest);assert.equal(result.exitCode,0);if(process.platform==='win32')assert.equal(result.stopped,true);
 }finally{s.close();}
});

test('local approved CPU source and receipts support a non-BMP data path',async()=>{
 const s=setup();try{s.app.close();s.app=new ResearchApp(join(s.dir,'中文 数据目录 🧪'),root);s.project=s.app.projects.create(USER,{name:'Non-BMP local',template:'curve-fit'});
  const run=prepared(s),done=await wait(s.app,run.id,20000);assert.equal(done.state,'succeeded',JSON.stringify(done));assert.equal(done.integrity,'complete');assert.equal(done.metrics.value,42);
  const control=s.app.store.paths.physical(run.execution.controlDir),start=JSON.parse(readFileSync(join(control,'native-start.json'),'utf8')),result=JSON.parse(readFileSync(join(control,'native-result.json'),'utf8'));assert.equal(start.manifestDigest,run.manifestDigest);assert.equal(result.manifestDigest,run.manifestDigest);assert.equal(result.exitCode,0);if(process.platform==='win32')assert.equal(result.stopped,true);
 }finally{s.close();}
});

test('Windows helper failure records diagnostics and retains uncertain execution resources', {skip:process.platform!=='win32'},async()=>{
 const s=setup();try{const run=prepared(s),control=s.app.store.paths.physical(run.execution.controlDir);mkdirSync(join(control,'stdout.log'),{recursive:true});
  const done=await wait(s.app,run.id,20000);assert.equal(done.state,'unknown');assert.equal(done.execution.startRequested,true);assert.equal(s.app.store.db.prepare('SELECT held FROM compute_queue WHERE id=?').get(run.id).held,1);assert.equal(existsSync(join(control,'native-result.json')),false);assert.match(readFileSync(join(control,'supervisor.log'),'utf8'),/LOG_OPEN_FAILED/);
 }finally{s.close();}
});

test('Windows interop compiler errors stay in supervisor diagnostics and retain unknown resources', {skip:process.platform!=='win32'},async()=>{
 const s=setup();try{const run=prepared(s),control=s.app.store.paths.physical(run.execution.controlDir);mkdirSync(join(control,'tmp','interop.dll'),{recursive:true});
  const done=await wait(s.app,run.id,20000);assert.equal(done.state,'unknown');assert.equal(done.execution.startRequested,true);assert.equal(s.app.store.db.prepare('SELECT held FROM compute_queue WHERE id=?').get(run.id).held,1);for(const name of ['stdout.log','stderr.log','native-start.json','native-result.json'])assert.equal(existsSync(join(control,name)),false);const log=readFileSync(join(control,'supervisor.log'),'utf8');assert.match(log,/CS\d{4}/);assert.match(log,/INTEROP_COMPILE_FAILED/);
 }finally{s.close();}
});

test('Windows helper resolves only PSHOME system modules despite external same-name modules', {skip:process.platform!=='win32'},()=>{
 const s=setup();try{const control=join(s.dir,'module-control'),work=join(control,'work'),external=join(s.dir,'external-modules'),marker=join(s.dir,'external-module-loaded');mkdirSync(work,{recursive:true});
  for(const name of ['Microsoft.PowerShell.Management','Microsoft.PowerShell.Utility']){const path=join(external,name);mkdirSync(path,{recursive:true});writeFileSync(join(path,name+'.psm1'),'[IO.File]::WriteAllText($env:PI_MODULE_SENTINEL,"loaded");throw "EXTERNAL_MODULE_LOADED"');}
  const spec=join(control,'native-spec.json'),wrapper=join(s.dir,'verify-modules.ps1');writeFileSync(spec,JSON.stringify({executable:process.execPath,argv:['-e','console.log(42)'],env:localEnvironment(control,control),work,control,manifestDigest:'module-isolation-check'}));
  writeFileSync(wrapper,`param($HelperPath,$SpecPath)
$ErrorActionPreference='Stop'
& $HelperPath $SpecPath
$expected=[IO.Path]::Combine($PSHOME,'Modules')
if($env:PSModulePath -ne $expected){throw 'MODULE_SEARCH_NOT_SYSTEM_ONLY'}
foreach($name in @('Microsoft.PowerShell.Management','Microsoft.PowerShell.Utility')){if((Get-Module -Name $name).Path -ne [IO.Path]::Combine($expected,$name,$name+'.psd1')){throw 'MODULE_SOURCE_NOT_PSHOME'}}
`);
  const result=spawnSync('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',wrapper,join(root,'scripts','local-windows-runner.ps1'),spec],{windowsHide:true,encoding:'utf8',timeout:20000,env:{...localEnvironment(control,control),PSModulePath:external,PI_MODULE_SENTINEL:marker}});
  assert.equal(result.status,0,result.stderr||result.error?.message);assert.equal(existsSync(marker),false);assert.equal(readFileSync(join(control,'stdout.log'),'utf8').trim(),'42');const receipt=JSON.parse(readFileSync(join(control,'native-result.json'),'utf8'));assert.equal(receipt.exitCode,0);assert.equal(receipt.stopped,true);assert.equal(receipt.manifestDigest,'module-isolation-check');
 }finally{s.close();}
});

test('local failure diagnostics read only bounded approved control files',t=>{
 const s=setup();try{const run=prepared(s),control=s.app.store.paths.physical(run.execution.controlDir),lines=[];mkdirSync(control,{recursive:true});writeFileSync(join(control,'supervisor.log'),'x'.repeat(8192));writeFileSync(join(control,'native-spec.json'),'PRIVATE_SPEC_MUST_NOT_BE_READ');t.mock.method(console,'error',line=>lines.push(line));
  diagnose(s.app,run.id,'test timeout');assert.equal(lines.length,6);assert.match(lines[0],/"state":"queued"/);assert.match(lines[0],/"execution":/);assert.equal(lines[1].split(': ')[1].length,4096);assert.match(lines[2],/stdout.log: ENOENT/);assert.match(lines[5],/native-result.json: ENOENT/);assert.ok(!lines.join('\n').includes('PRIVATE_SPEC_MUST_NOT_BE_READ'));
 }finally{s.close();}
});
test('local configuration changes reject pending intent and active Run; historical public data survives configuration removal',()=>{
 const s=setup();try{s.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:0});const e=s.app.experiments.create(USER,s.project.id,{title:'local stale',contract}),i=s.app.runs.prepare(USER,e.id);approve(s.app,i.approvalId);s.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:1});assert.throws(()=>s.app.runs.submit(USER,i.id),{code:'LOCAL_RUNTIME_CHANGED'});
 const run=prepared(s);assert.throws(()=>s.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:2}),{code:'LOCAL_RUNTIME_BUSY'});s.app.runs.cancel(USER,run.id);writeFileSync(join(s.dir,'local-runtimes.json'),'{}');assert.deepEqual(s.app.runs.get(USER,run.id).manifest,run.manifest);
 }finally{s.close();}
});
test('GPU claims survive unknown and lease expiry, reject overlapping admission, release only at terminal',()=>{
 const s=setup();try{const runtime=s.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:0});s.app.store.create('gpu-target',null,{target:{backend:'local',targetId:runtime.hostId,observedAt:new Date().toISOString(),devices:[{uuid:UUID,name:'fixture',memoryMb:1024}]}},'test');
 s.app.compute.configure(USER,{expectedVersion:1,limits:{maxRuns:3,maxJobs:3}});
 const a=prepared(s,undefined,[UUID]),b=prepared(s,undefined,[UUID]);const admit=id=>s.app.compute.withAdmission('run',id,()=>{const r=s.app.store.get('run',id);return s.app.store.update('run',id,r.version,{state:'submitting',execution:{...r.execution,generation:1,leaseUntil:0}});});
 assert.ok(admit(a.id));assert.equal(admit(b.id),null);let r=s.app.store.get('run',a.id);s.app.store.update('run',a.id,r.version,{state:'unknown'});assert.equal(admit(b.id),null);assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM compute_gpu_claims').get().n,1);r=s.app.store.get('run',a.id);s.app.store.update('run',a.id,r.version,{state:'failed'});assert.ok(admit(b.id));
 }finally{s.close();}
});
test('GPU malformed selection and local isolation misrepresentation are refused without execution',()=>{
 for(const deviceIds of [['0'],['all'],[UUID,UUID],[]])assert.throws(()=>validateGpu({vendor:'nvidia',deviceIds}),{code:'GPU_INVALID'});
 assert.throws(()=>validateContract({...contract,networkPolicy:'none'}),{code:'CONTRACT_INVALID'});assert.throws(()=>validateContract({...contract,command:['other','main.mjs']}),{code:'LOCAL_RUNTIME_INVALID'});
 const env=localEnvironment('/private/temp','/approved/output',[UUID]);for(const key of ['NODE_OPTIONS','PYTHONPATH','PYTHONSTARTUP','GH_TOKEN','OPENAI_API_KEY','PI_CREDENTIAL'])assert.equal(env[key],undefined);assert.equal(env.CUDA_VISIBLE_DEVICES,UUID);if(process.platform==='win32')assert.equal(env.ProgramFiles,process.env.ProgramFiles??'','NVML resolves driver components through ProgramFiles');
});
test('local and Docker GPU requests share exact UUID claims while another queued device can proceed',()=>{
 const s=setup();try{const other='GPU-22222222-2222-2222-2222-222222222222',runtime=s.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:0}),devices=[UUID,other].map(uuid=>({uuid,name:'fixture',memoryMb:1024}));s.app.store.create('gpu-target',null,{target:{backend:'local',targetId:runtime.hostId,observedAt:new Date().toISOString(),devices}},'local-test');s.app.store.create('gpu-target',null,{target:{backend:'docker',targetId:'docker-fixture',context:'gpu-fixture',observedAt:new Date().toISOString(),devices}},'docker-test');s.app.store.db.prepare("INSERT INTO compute_contexts(context,target_id,engine_id,endpoint,status,next_probe_at) VALUES('gpu-fixture','docker-fixture','engine','unix:///fixture','ready',?)").run(Date.now()+60000);s.app.compute.configure(USER,{expectedVersion:1,limits:{maxRuns:4,maxJobs:4}});
 const a=prepared(s,undefined,[UUID]),admit=id=>s.app.compute.withAdmission('run',id,()=>{const r=s.app.store.get('run',id);return s.app.store.update('run',id,r.version,{state:'submitting',execution:{...r.execution,generation:1,leaseUntil:Date.now()+60000}});});assert.ok(admit(a.id));
 const {localRuntimeId,...base}=contract;const e=s.app.experiments.create(USER,s.project.id,{title:'Docker GPU fixture',contract:{...base,runner:'docker',dockerContext:'gpu-fixture',image:'python@sha256:'+'a'.repeat(64),command:['python','main.py'],networkPolicy:'none',gpu:{vendor:'nvidia',deviceIds:[UUID]}}}),i=s.app.runs.prepare(USER,e.id);approve(s.app,i.approvalId);const dockerRun=s.app.runs.submit(USER,i.id);assert.equal(admit(dockerRun.id),null);
 const blocked=prepared(s,undefined,[UUID]),independent=prepared(s,undefined,[other]);assert.equal(admit(blocked.id),null);assert.ok(admit(independent.id));assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM compute_gpu_claims').get().n,2);
 const args=createArgs({id:'fixture',containerName:'fixture',manifestDigest:'digest',outputDir:'/output',controlDir:'/control',manifest:{inputSnapshot:{path:'/source',files:[],digest:'source'},dataArtifacts:[],command:['python','main.py'],environmentImageDigest:'image@sha256:'+'a'.repeat(64),dockerContext:'gpu-fixture',resources:{cpus:1,memoryMb:128,pids:16,workMb:16,logBytes:100,gpu:{vendor:'nvidia',deviceIds:[UUID]}}}});assert.equal(args[args.indexOf('--gpus')+1],'device='+UUID);assert.ok(!args.includes('all'));
 }finally{s.close();}
});

test('upgrade admission holds new GPU work behind every CPU Docker kind and legacy SSH, including queued and unknown',()=>{
 const s=setup();try{
  const runtime=s.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:0});s.app.store.create('gpu-target',null,{target:{backend:'local',targetId:runtime.hostId,observedAt:new Date().toISOString(),devices:[{uuid:UUID,name:'admission fixture',memoryMb:1024}]}},'compat-gpu');s.app.compute.configure(USER,{expectedVersion:1,limits:{maxRuns:10,maxDevelopment:10,maxJobs:10}});const gpu=prepared(s,undefined,[UUID]);
  for(const context of ['compat-cpu','ssh:compat'])s.app.store.db.prepare("INSERT INTO compute_contexts(context,target_id,engine_id,endpoint,status,next_probe_at) VALUES(?,?,?,?,'ready',?)").run(context,'compat-'+context,'engine',context,Date.now()+60000);
  // Scheduler fixtures only; no container or SSH process is started.
  for(const [kind,queueKind] of [['run','run'],['sandbox-job','development'],['document-parse-job','document'],['publication-build-job','publication'],['legacy-ssh','run']])for(const state of ['queued','unknown']){
   const legacy=kind==='legacy-ssh',recordKind=legacy?'run':kind,manifest=recordKind==='run'?{contract:{runner:legacy?'ssh':'docker',sshTargetId:legacy?'compat':undefined,dockerContext:legacy?undefined:'compat-cpu',cpus:1,memoryMb:128},...(legacy?{sshTarget:{}}:{})}:{dockerContext:'compat-cpu',resources:{cpus:1,memoryMb:128}};
   const blocker=s.app.store.create(recordKind,s.project.id,{state,manifest});assert.equal(s.app.compute.inspect(USER).items.find(q=>q.id===gpu.id).reason,'gpu_busy',kind+'/'+state);assert.ok(!s.app.compute.candidates('run').includes(gpu.id));assert.equal(s.app.compute.withAdmission('run',gpu.id,()=>assert.fail('GPU cannot claim during legacy CPU exposure')),null);
   if(state==='queued'&&!legacy){const admitted=s.app.compute.withAdmission(queueKind,blocker.id,()=>{const current=s.app.store.get(recordKind,blocker.id);return s.app.store.update(recordKind,blocker.id,current.version,{state:'running'});});assert.ok(admitted,'CPU continues to dispatch: '+kind);}
   const current=s.app.store.get(recordKind,blocker.id);s.app.store.update(recordKind,blocker.id,current.version,{state:'failed'});assert.ok(s.app.compute.candidates('run').includes(gpu.id),'terminal compatibility blocker releases: '+kind+'/'+state);
  }
  s.app.store.create('run',s.project.id,{state:'unknown',manifest:{contract:{runner:'ssh',sshTargetId:'compat',cpus:1,memoryMb:128},sshTarget:{gpuProtocol:true}}});assert.ok(s.app.compute.candidates('run').includes(gpu.id),'v2 CPU SSH does not block GPU admission');
 }finally{s.close();}
});
test('local managed process tree cancellation is observed, not inferred from request, and survives controller reopen',async()=>{
 const s=setup();try{const code='import {spawn} from "node:child_process";import {writeFileSync} from "node:fs";spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore"});writeFileSync(process.env.PI_OUTPUT_DIR+"/ready","yes");setInterval(()=>{},1000);',run=prepared(s,code);s.app.runs.launchPending();const ready=join(s.app.store.paths.physical(run.outputDir),'ready');const deadline=Date.now()+15000;while(!existsSync(ready)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));if(!existsSync(ready))diagnose(s.app,run.id,'ready marker missing');assert.ok(existsSync(ready),JSON.stringify(s.app.runs.get(USER,run.id)));s.app.close();s.app=new ResearchApp(s.dir,root);s.app.runs.cancel(USER,run.id);const done=await wait(s.app,run.id,15000);assert.equal(done.state,'cancelled',JSON.stringify(done));assert.equal(s.app.store.db.prepare('SELECT held FROM compute_queue WHERE id=?').get(run.id).held,0);
 }finally{s.close();}
});
test('local prior uncertain start stays unknown without relaunching or signalling its stored PID',async()=>{
 const s=setup();try{let run=prepared(s);run=s.app.compute.withAdmission('run',run.id,()=>s.app.store.update('run',run.id,run.version,{state:'submitting',childPid:process.pid,execution:{...run.execution,startRequested:true,generation:1,leaseUntil:Date.now()+60000}}));
 const cb={read:()=>s.app.store.get('run',run.id),fence(){},assertGrant(){throw new Error('must not reauthorize a prior start');},patch(value){const r=this.read();return s.app.store.update('run',r.id,r.version,value);},finalize(){assert.fail('cannot release uncertain workload');}};
 await superviseLocalRun(run,s.app.context,cb);assert.equal(cb.read().state,'unknown');assert.equal(s.app.store.db.prepare('SELECT held FROM compute_queue WHERE id=?').get(run.id).held,1);assert.equal(cb.read().childPid,process.pid);assert.equal(cb.read().execution.generation,1);
 }finally{s.close();}
});
test('local timeout requires confirmed managed process exit before releasing resources',async()=>{
 const s=setup();try{const run=prepared(s,'setInterval(()=>{},1000);',undefined,1);const done=await wait(s.app,run.id,15000);assert.equal(done.state,'failed',JSON.stringify(done));assert.match(done.error,/LOCAL_TIMEOUT/);assert.equal(s.app.store.db.prepare('SELECT held FROM compute_queue WHERE id=?').get(run.id).held,0);
 }finally{s.close();}
});
