import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
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
async function wait(app,id,timeout){const end=Date.now()+timeout;while(Date.now()<end){app.runs.reconcile();app.runs.launchPending();const run=app.runs.get(USER,id);if(['succeeded','failed','cancelled','unknown'].includes(run.state))return run;await new Promise(r=>setTimeout(r,50));}throw new Error('Run timeout: '+JSON.stringify(app.runs.get(USER,id)));}
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
  const env=s.app.operations.execute(USER,'execution_environment_list',{}, {projectId:s.project.id});validateSchema(OUTPUT_SCHEMAS.execution_environment_list,env,'output');
 }finally{s.close();}
});

test('local approved CPU source executes from a Unicode and space data path with matching native receipts',async()=>{
 const s=setup();try{s.app.close();s.app=new ResearchApp(join(s.dir,'中文 数据目录'),root);s.project=s.app.projects.create(USER,{name:'Unicode local',template:'curve-fit'});
  const run=prepared(s),done=await wait(s.app,run.id,20000);assert.equal(done.state,'succeeded',JSON.stringify(done));assert.equal(done.integrity,'complete');assert.equal(done.metrics.value,42);
  const control=s.app.store.paths.physical(run.execution.controlDir),start=JSON.parse(readFileSync(join(control,'native-start.json'),'utf8')),result=JSON.parse(readFileSync(join(control,'native-result.json'),'utf8'));assert.equal(start.manifestDigest,run.manifestDigest);assert.equal(result.manifestDigest,run.manifestDigest);assert.equal(result.exitCode,0);if(process.platform==='win32')assert.equal(result.stopped,true);
 }finally{s.close();}
});

test('Windows helper failure records diagnostics and retains uncertain execution resources', {skip:process.platform!=='win32'},async()=>{
 const s=setup();try{const run=prepared(s),control=s.app.store.paths.physical(run.execution.controlDir);mkdirSync(join(control,'stdout.log'),{recursive:true});
  const done=await wait(s.app,run.id,20000);assert.equal(done.state,'unknown');assert.equal(done.execution.startRequested,true);assert.equal(s.app.store.db.prepare('SELECT held FROM compute_queue WHERE id=?').get(run.id).held,1);assert.equal(existsSync(join(control,'native-result.json')),false);assert.match(readFileSync(join(control,'supervisor.log'),'utf8'),/LOG_OPEN_FAILED/);
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
 const s=setup();try{const code='import {spawn} from "node:child_process";import {writeFileSync} from "node:fs";spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore"});writeFileSync(process.env.PI_OUTPUT_DIR+"/ready","yes");setInterval(()=>{},1000);',run=prepared(s,code);s.app.runs.launchPending();const ready=join(s.app.store.paths.physical(run.outputDir),'ready');const deadline=Date.now()+15000;while(!existsSync(ready)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));assert.ok(existsSync(ready),JSON.stringify(s.app.runs.get(USER,run.id)));s.app.close();s.app=new ResearchApp(s.dir,root);s.app.runs.cancel(USER,run.id);const done=await wait(s.app,run.id,15000);assert.equal(done.state,'cancelled',JSON.stringify(done));assert.equal(s.app.store.db.prepare('SELECT held FROM compute_queue WHERE id=?').get(run.id).held,0);
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
