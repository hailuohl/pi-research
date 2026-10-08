import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {setup,USER,approve} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ComputeQueue} from '../../dist/packages/scheduler/compute-queue.js';
import {ComputeConnectionService,ComputeConnectionMonitor} from '../../dist/packages/runners/compute-connections.js';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {systemInstruction} from '../../dist/packages/pi-adapter/options.js';
import {SshTargetService} from '../../dist/packages/runners/ssh-targets.js';
import {digest} from '../../dist/packages/storage/store.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';

function config(s,id='one'){const identityFile=join(s.dir,id+'-identity'),knownHostsFile=join(s.dir,id+'-known-hosts');writeFileSync(identityFile,'fixture private identity');writeFileSync(knownHostsFile,'fixture known host');return {id,host:id+'.invalid',user:'research',identityFile,knownHostsFile,remoteRoot:'/srv/pi/jobs',expectedVersion:0,gpuProtocol:true};}
const reply=id=>({engineId:'engine-'+id,protocolDigest:digest(readFileSync('scripts/ssh-runner-gpu.py'))});
const view=s=>s.app.operations.execute(USER,'execution_environment_list',{}, {projectId:s.project.id});
const ssh=(s,id='one')=>view(s).connections.ssh.find(x=>x.id===id);
const owner=(s,name,input,key=name)=>s.app.operations.execute(USER,name,input,{projectId:s.project.id,idempotencyKey:key});
const prefs=(s,input,key)=>owner(s,'ssh_target_preferences_configure',input,key);
const device={uuid:'GPU-11111111-1111-1111-1111-111111111111',name:'fixture GPU',memoryMb:1024};
const health=id=>({supervisor:'ready',docker:'ready',workspace:'ready',...reply(id),cpus:6,memoryMb:12288});
async function until(check){const deadline=Date.now()+2000;while(!check()){assert.ok(Date.now()<deadline,'background observation timeout');await new Promise(r=>setTimeout(r,5));}}
async function gpuFixture(s,inventory,fn){const saved=childProcess.spawn;childProcess.spawn=(executable,args)=>{assert.equal(executable,'ssh');const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new PassThrough();child.kill=()=>{};queueMicrotask(()=>{child.stdout.end(JSON.stringify({protocol:1,ok:true,...reply('one'),inventory}));child.stderr.end();child.emit('close',0);});return child;};syncBuiltinESMExports();try{return await fn();}finally{childProcess.spawn=saved;syncBuiltinESMExports();}}

test('two SSH profiles, owner inspect and independent preferences survive reopen without changing frozen identity or approval',async()=>{
 const s=setup();try{
  const one=config(s),two=config(s,'two');owner(s,'ssh_target_configure',one,'config-one');owner(s,'ssh_target_configure',two,'config-two');
  assert.equal(ssh(s).status,'unverified');assert.deepEqual(ssh(s).capabilities,{cpu:false,gpu:false});
  const inspected=owner(s,'ssh_target_inspect',{id:'one'});validateSchema(OUTPUT_SCHEMAS.ssh_target_inspect,inspected,'output');assert.equal(inspected.identityFile,one.identityFile);assert.equal(inspected.knownHostsFile,one.knownHostsFile);
  s.app.sshTargets.request=async t=>reply(t.id);await owner(s,'ssh_target_probe',{id:'one'},'verify-one');await owner(s,'ssh_target_probe',{id:'two'},'verify-two');
  const frozen=JSON.stringify(s.app.sshTargets.frozen('one',true)),savedConfig=readFileSync(join(s.dir,'ssh-targets.json'),'utf8');
  const changed=prefs(s,{id:'one',expectedVersion:0,cpu:false,gpu:true},'prefs-one');validateSchema(OUTPUT_SCHEMAS.ssh_target_preferences_configure,changed,'output');assert.deepEqual(changed,{id:'one',version:1,cpu:false,gpu:true});
  assert.equal(readFileSync(join(s.dir,'ssh-targets.json'),'utf8'),savedConfig);assert.equal(JSON.stringify(s.app.sshTargets.frozen('one',true)),frozen);assert.deepEqual(ssh(s,'two').preferences,{version:0,cpu:true,gpu:false});
  assert.throws(()=>prefs(s,{id:'one',expectedVersion:0,cpu:true,gpu:false},'conflict'),{code:'VERSION_CONFLICT'});assert.throws(()=>prefs(s,{id:'one',expectedVersion:1,cpu:false,gpu:false},'empty'),{code:'INVALID_INPUT'});
  const contract={runner:'ssh',sshTargetId:'one',image:'python@sha256:'+'a'.repeat(64),command:['python','main.py'],environment:{},datasetVersion:'v1',evaluationProtocolVersion:'v1',metrics:{score:{unit:'ratio',direction:'max'}},expectedArtifacts:['metrics.json'],cpus:1,memoryMb:128,timeoutSeconds:10};
  const e=s.app.experiments.create(USER,s.project.id,{title:'SSH approval fixture',contract,files:{'main.py':'print(1)'}}),intent=s.app.runs.prepare(USER,e.id);
  prefs(s,{id:'one',expectedVersion:1,cpu:true,gpu:true},'prefs-two');assert.throws(()=>s.app.runs.submit(USER,intent.id),{code:'APPROVAL_REQUIRED'});approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);
  assert.throws(()=>owner(s,'ssh_target_configure',{...one,expectedVersion:1},'busy-config'),{code:'SSH_TARGET_BUSY'});assert.equal(JSON.stringify(s.app.store.get('run',run.id).manifest.sshTarget),frozen);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.deepEqual(ssh(s).preferences,{version:2,cpu:true,gpu:true});assert.equal(view(s).connections.ssh.length,2);assert.equal(JSON.stringify(s.app.store.get('run',run.id).manifest.sshTarget),frozen);
 }finally{s.close();}
});

test('failed SSH observation clears readiness and neither old success nor old failure can overwrite a concurrent reconfiguration',async()=>{
 const s=setup();try{
  const c=config(s);s.app.sshTargets.configure(USER,c);s.app.sshTargets.request=async()=>reply('one');await s.app.sshTargets.probe(USER,'one');const history=JSON.stringify(s.app.sshTargets.frozen('one'));
  s.app.sshTargets.request=async()=>{throw new Error(c.identityFile+' private stderr');};await assert.rejects(s.app.sshTargets.probe(USER,'one'),{code:'SSH_TARGET_UNAVAILABLE'});
  assert.equal(ssh(s).status,'unavailable');assert.equal(ssh(s).capabilities.cpu,false);assert.equal(s.app.store.db.prepare("SELECT status FROM compute_contexts WHERE context='ssh:one'").get().status,'unavailable');assert.equal(JSON.stringify(s.app.sshTargets.frozen('one')),history);assert.ok(!JSON.stringify(view(s)).includes('private stderr'));
  for(const fail of [false,true]){
   let release;s.app.sshTargets.request=()=>new Promise((resolve,reject)=>{release=()=>fail?reject(new Error('old error')):resolve(reply('one'));});const pending=s.app.sshTargets.probe(USER,'one');
   const another=new ResearchApp(s.dir,process.cwd());try{const current=another.sshTargets.inspect(USER,'one');another.sshTargets.configure(USER,{...c,host:fail?'new-two.invalid':'new-one.invalid',expectedVersion:current.version});}finally{another.close();}
   release();await assert.rejects(pending);assert.equal(ssh(s).status,'unverified');assert.deepEqual(ssh(s).capabilities,{cpu:false,gpu:false});
  }
 }finally{s.close();}
});

test('Docker owner probe reports real metadata, records failure after success, and expires without a process refresh',async()=>{
 const s=setup();try{
  let fails=false,calls=0;s.app.compute=new ComputeQueue(s.app.context,{probe:async()=>{calls++;if(fails)throw new Error('sensitive docker stderr');return {targetId:'docker-fixture',engineId:'engine',endpoint:'unix:///fixture.sock',serverVersion:'28.0',cpus:8,memoryMb:4096};}});
  const result=await owner(s,'docker_connection_probe',{context:'fixture'},'docker-ok');validateSchema(OUTPUT_SCHEMAS.docker_connection_probe,result,'output');assert.equal(result.status,'verified');assert.equal(result.cpus,8);assert.equal(result.memoryMb,4096);assert.equal(result.serverVersion,'28.0');
  s.app.store.db.prepare("UPDATE compute_contexts SET status='unavailable' WHERE context='fixture'").run();assert.equal(view(s).connections.docker[0].status,'unavailable');s.app.store.db.prepare("UPDATE compute_contexts SET status='ready' WHERE context='fixture'").run();
  const record=s.app.store.get('compute-connection','docker:fixture');s.app.store.update('compute-connection',record.id,record.version,{observation:{...record.observation,validUntil:new Date(0).toISOString()}});assert.equal(view(s).connections.docker[0].status,'stale');assert.equal(calls,1);
  fails=true;const failure=await owner(s,'docker_connection_probe',{context:'fixture'},'docker-fail');assert.equal(failure.status,'unavailable');assert.equal(failure.errorCode,'COMPUTE_TARGET_UNAVAILABLE');assert.equal(failure.serverVersion,undefined);assert.equal(s.app.store.db.prepare("SELECT status FROM compute_contexts WHERE context='fixture'").get().status,'unavailable');assert.ok(!JSON.stringify(view(s)).includes('sensitive'));
  const hardware=view(s).local.hardware;assert.ok(hardware.logicalCpus>0&&hardware.totalMemoryMb>0&&hardware.freeMemoryMb>=0&&hardware.cpuModel&&hardware.arch);
 }finally{s.close();}
});

test('SSH GPU requires a fresh device observation bound to current configuration, and failed probes preserve only historical target data',async()=>{
 const s=setup();try{
  const c=config(s);s.app.sshTargets.configure(USER,c);s.app.sshTargets.request=async()=>reply('one');await s.app.sshTargets.probe(USER,'one');assert.deepEqual(ssh(s).capabilities,{cpu:true,gpu:false});
  await gpuFixture(s,'',()=>s.app.gpus.probe(USER,{backend:'ssh',sshTargetId:'one',image:'python@sha256:'+'a'.repeat(64)}));assert.equal(ssh(s).capabilities.gpu,false);
  const expired=s.app.store.get('compute-connection','ssh:one');s.app.store.update('compute-connection',expired.id,expired.version,{observation:{...expired.observation,validUntil:new Date(0).toISOString()}});assert.equal(ssh(s).status,'stale');
  await gpuFixture(s,`${device.uuid}, ${device.name}, ${device.memoryMb}`,()=>s.app.gpus.probe(USER,{backend:'ssh',sshTargetId:'one',image:'python@sha256:'+'a'.repeat(64)}));assert.equal(ssh(s).capabilities.gpu,true);const historical=JSON.stringify(s.app.gpus.list());
  const gpuObservation=s.app.store.get('compute-gpu-observation','ssh:one');assert.equal(ssh(s).gpuValidUntil,gpuObservation.observation.validUntil);
  s.app.store.update('compute-gpu-observation',gpuObservation.id,gpuObservation.version,{observation:{...gpuObservation.observation,validUntil:new Date(0).toISOString()}});assert.equal(ssh(s).status,'verified');assert.equal(ssh(s).capabilities.gpu,false);assert.equal(ssh(s).gpuValidUntil,undefined);
  const restoreGpu=s.app.store.get('compute-gpu-observation','ssh:one');s.app.store.update('compute-gpu-observation',restoreGpu.id,restoreGpu.version,{observation:gpuObservation.observation});
  s.app.store.db.prepare("UPDATE compute_contexts SET status='unavailable' WHERE context='ssh:one'").run();assert.equal(ssh(s).status,'unavailable');assert.deepEqual(ssh(s).capabilities,{cpu:false,gpu:false});s.app.store.db.prepare("UPDATE compute_contexts SET status='ready' WHERE context='ssh:one'").run();
  await gpuFixture(s,'invalid reply',()=>assert.rejects(s.app.gpus.probe(USER,{backend:'ssh',sshTargetId:'one',image:'python@sha256:'+'a'.repeat(64)}),{code:'GPU_PROBE_INVALID'}));assert.equal(ssh(s).capabilities.gpu,false);assert.equal(JSON.stringify(s.app.gpus.list()),historical);
  await gpuFixture(s,`${device.uuid}, ${device.name}, ${device.memoryMb}`,()=>s.app.gpus.probe(USER,{backend:'ssh',sshTargetId:'one',image:'python@sha256:'+'a'.repeat(64)}));
  const latestHistorical=JSON.stringify(s.app.gpus.list());s.app.sshTargets.configure(USER,{...c,expectedVersion:1,host:'new.invalid'});await s.app.sshTargets.probe(USER,'one');assert.equal(ssh(s).capabilities.cpu,true);assert.equal(ssh(s).capabilities.gpu,false);assert.deepEqual(ssh(s).gpuDevices,[]);assert.equal(JSON.stringify(s.app.gpus.list()),latestHistorical);
 }finally{s.close();}
});

test('interactive Agent catalog performs no process/network probes and excludes SSH configuration secrets; new operations remain user-only',async()=>{
 const s=setup();try{
  const c=config(s);s.app.sshTargets.configure(USER,c);s.app.sshTargets.request=async()=>reply('one');await s.app.sshTargets.probe(USER,'one');prefs(s,{id:'one',expectedVersion:0,cpu:true,gpu:true},'agent-prefs');
  const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{state:'running',generation:1,leaseUntil:Date.now()+120000,skillBundleId:s.app.skills.configuration(s.project.id).bundleId});
  const actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,generation:1,role:'coordinator'},tools=new ToolDispatcher(s.app),spawn=childProcess.spawn,spawnSync=childProcess.spawnSync,fetch=globalThis.fetch;
  childProcess.spawn=childProcess.spawnSync=()=>assert.fail('directory spawned a process');globalThis.fetch=()=>assert.fail('directory requested network');syncBuiltinESMExports();
  try{const catalog=await tools.execute(actor,'execution_environment_list',{},'safe-directory');validateSchema(OUTPUT_SCHEMAS.execution_environment_list,catalog,'output');const json=JSON.stringify(catalog);for(const secret of [c.identityFile,c.knownHostsFile,c.host,c.user,c.remoteRoot,'identityDigest','identityFile','knownHostsFile'])assert.ok(!json.includes(secret),secret);assert.equal(catalog.connections.ssh[0].preferences.gpu,true);}
  finally{childProcess.spawn=spawn;childProcess.spawnSync=spawnSync;globalThis.fetch=fetch;syncBuiltinESMExports();}
  for(const name of ['docker_connection_probe','ssh_target_inspect','ssh_target_preferences_configure'])await assert.rejects(tools.execute(actor,name,{},'denied-'+name),{code:'TOOL_DENIED'});
 }finally{s.close();}
});

test('HTTP explicitly starts independent background targets, skips installing, waits before closing, and restores on reopen',async()=>{
 const s=setup();let service,release,currentAvailable=true;try{
  assert.equal(view(s).connections.currentDockerContext,undefined);
  for(const id of ['slow','ready','installing','broken'])s.app.sshTargets.configure(USER,config(s,id));
  s.app.store.create('ssh-setup',null,{state:'installing',until:Date.now()+60000},'installing');s.app.close();
  const attach=(enabled)=>{service=createHttpServer({dataDir:s.dir,repoRoot:process.cwd(),port:0,computeMonitoring:enabled});let dockerCalls=0,slowCalls=0,readyCalls=0;
   service.app.compute=new ComputeQueue(service.app.context,{probe:async()=>{dockerCalls++;return {targetId:'docker-fixture',engineId:'engine',endpoint:'unix:///fixture.sock',cpus:8,memoryMb:4096};}});
   service.app.sshTargets.onboarding=async t=>{if(t.id==='installing')assert.fail('installation must not be observed');if(t.id==='broken')throw new Error('private connection failure');if(t.id==='ready'){readyCalls++;return health(t.id);}slowCalls++;return await new Promise(resolve=>{release=()=>resolve(health(t.id));});};
   service.app.computeMonitor=new ComputeConnectionMonitor(service.app,10,()=>{if(!currentAvailable)throw new Error('context discovery failed');return 'fixture';});return ()=>({dockerCalls,slowCalls,readyCalls});};
  let counts=attach(false);await service.listen();await new Promise(r=>setTimeout(r,30));assert.deepEqual(counts(),{dockerCalls:0,slowCalls:0,readyCalls:0});assert.equal(service.app.operations.execute(USER,'execution_environment_list',{}, {projectId:s.project.id}).connections.currentDockerContext,undefined);await service.close();
  counts=attach(true);assert.equal(counts().dockerCalls,0);await service.listen();await until(()=>counts().dockerCalls>=3&&counts().readyCalls>=3);assert.equal(counts().slowCalls,1);
  const directory=service.app.operations.execute(USER,'execution_environment_list',{}, {projectId:s.project.id});assert.equal(directory.connections.ssh.find(t=>t.id==='ready').cpus,6);assert.equal(directory.connections.ssh.find(t=>t.id==='ready').memoryMb,12288);assert.equal(directory.connections.ssh.find(t=>t.id==='ready').gpuStatus,'unverified');
  assert.equal(directory.connections.currentDockerContext,'fixture');validateSchema(OUTPUT_SCHEMAS.execution_environment_list,directory,'output');
  currentAvailable=false;await until(()=>service.app.computeMonitor.currentDockerContext==='current');const unavailable=service.app.operations.execute(USER,'execution_environment_list',{}, {projectId:s.project.id});assert.equal(unavailable.connections.currentDockerContext,'current');assert.equal(unavailable.connections.docker.find(t=>t.context==='current').status,'unavailable');validateSchema(OUTPUT_SCHEMAS.execution_environment_list,unavailable,'output');currentAvailable=true;
  assert.equal(directory.connections.ssh.find(t=>t.id==='broken').status,'unavailable');assert.equal(directory.connections.ssh.find(t=>t.id==='installing').status,'unverified');assert.ok(!JSON.stringify(directory).includes('private connection failure'));
  const historical=readFileSync(join(s.dir,'ssh-targets.json'),'utf8');let closed=false;const closing=service.close().then(()=>{closed=true;});await new Promise(r=>setTimeout(r,20));assert.equal(closed,false);assert.equal(service.app.store.list('compute-connection').length>0,true);release();await closing;
  const stopped=counts();await new Promise(r=>setTimeout(r,30));assert.deepEqual(counts(),stopped);
  counts=attach(true);assert.equal(readFileSync(join(s.dir,'ssh-targets.json'),'utf8'),historical);assert.equal(service.app.store.get('compute-connection','ssh:slow').observation.status,'unverified');await service.listen();await until(()=>counts().readyCalls>0&&counts().slowCalls>0);release();await service.close();
 }finally{release?.();if(service)await service.close();s.close();}
});

test('background first identity is idle-only; existing frozen identity and unknown setup history cannot be rewritten',async()=>{
 const s=setup();try{
  s.app.sshTargets.configure(USER,config(s));s.app.sshTargets.onboarding=async()=>health('one');await s.app.sshTargets.observe('one');
  const directory=ssh(s);assert.deepEqual(directory.runTarget,{runner:'ssh',sshTargetId:'one'});assert.deepEqual(directory.capabilities,{cpu:true,gpu:false});validateSchema(OUTPUT_SCHEMAS.execution_environment_list,view(s),'output');
  const history=readFileSync(join(s.dir,'ssh-targets.json'),'utf8');await s.app.sshTargets.observe('one');assert.equal(readFileSync(join(s.dir,'ssh-targets.json'),'utf8'),history);
  s.app.store.create('ssh-setup',null,{state:'unknown',until:Date.now()-1},'one');await s.app.sshTargets.observe('one');assert.equal(s.app.store.get('ssh-setup','one').state,'unknown');assert.deepEqual(ssh(s).capabilities,{cpu:false,gpu:false});assert.equal(readFileSync(join(s.dir,'ssh-targets.json'),'utf8'),history);
  s.app.sshTargets.onboarding=async()=>({...health('one'),engineId:'changed'});await assert.rejects(s.app.sshTargets.observe('one'),{code:'SSH_TARGET_CHANGED'});assert.equal(ssh(s).status,'unavailable');assert.deepEqual(ssh(s).capabilities,{cpu:false,gpu:false});assert.equal(readFileSync(join(s.dir,'ssh-targets.json'),'utf8'),history);
  s.app.sshTargets.configure(USER,config(s,'blocked'));s.app.store.create('ssh-setup',null,{state:'unknown',until:Date.now()-1},'blocked');s.app.sshTargets.onboarding=async t=>health(t.id);await assert.rejects(s.app.sshTargets.observe('blocked'),{code:'SSH_TARGET_BUSY'});assert.equal(s.app.sshTargets.directory().find(x=>x.target.id==='blocked').target.verified,undefined);
 }finally{s.close();}
});

test('background first identity rechecks configuration, installation and queued Run after network reply',async()=>{
 for(const race of ['configuration','installation','queued']){
  const s=setup();try{
   const c=config(s);s.app.sshTargets.configure(USER,c);let release;s.app.sshTargets.onboarding=()=>new Promise(resolve=>{release=()=>resolve(health('one'));});const pending=s.app.sshTargets.observe('one');
   if(race==='configuration')s.app.sshTargets.configure(USER,{...c,expectedVersion:1,host:'changed.invalid'});
   else if(race==='installation')s.app.store.create('ssh-setup',null,{state:'installing',until:Date.now()+60000},'one');
   else s.app.store.db.prepare("INSERT INTO compute_queue(kind,id,project_id,backend,context_name,phase,held,cpu_millis,memory_mb,source_version) VALUES('run','queued-fixture',?,'ssh','ssh:one','queued',0,1000,128,1)").run(s.project.id);
   release();await assert.rejects(pending);assert.equal(s.app.sshTargets.directory()[0].target.verified,undefined);assert.equal(ssh(s).capabilities.cpu,false);
  }finally{s.close();}
 }
});

test('catalog selections enter existing approved Run flow and coordinator instructions require fresh catalog',async()=>{
 const s=setup();try{
  s.app.sshTargets.configure(USER,config(s));s.app.sshTargets.onboarding=async()=>health('one');await s.app.sshTargets.observe('one');
  const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{state:'running',generation:1,leaseUntil:Date.now()+120000,skillBundleId:s.app.skills.configuration(s.project.id).bundleId});const actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,generation:1,role:'coordinator'},tools=new ToolDispatcher(s.app);
  const catalog=await tools.execute(actor,'execution_environment_list',{},'selected-directory'),target=catalog.connections.ssh[0].runTarget;
  const contract={...target,image:'python@sha256:'+'a'.repeat(64),command:['python','main.py'],environment:{},datasetVersion:'v1',evaluationProtocolVersion:'v1',metrics:{score:{unit:'ratio',direction:'max'}},expectedArtifacts:['metrics.json'],cpus:1,memoryMb:128,timeoutSeconds:10};
  const experiment=await tools.execute(actor,'experiment_plan_submit',{title:'directory-selected SSH',contract,config:{polynomialDegree:2}},'selected-root');for(const [key,value] of Object.entries(contract))assert.deepEqual(experiment.contract[key],value);
  await assert.rejects(tools.execute(actor,'experiment_plan_submit',{title:'forbidden target change',parentId:experiment.id,expectedParentRevision:1,contract:{...experiment.contract,sshTargetId:'different'}},'forbidden-child'),{code:'CONTRACT_CHANGED'});
  const intent=await tools.execute(actor,'run_prepare',{experimentId:experiment.id},'selected-prepare');assert.equal(intent.manifest.contract.runner,'ssh');assert.equal(intent.manifest.contract.sshTargetId,target.sshTargetId);assert.equal(s.app.store.get('approval',intent.approvalId).status,'pending');await assert.rejects(tools.execute(actor,'run_submit',{intentId:intent.id},'selected-denied'),{code:'APPROVAL_REQUIRED'});assert.equal(s.app.store.list('run',s.project.id).length,0);
  approve(s.app,intent.approvalId);const run=await tools.execute(actor,'run_submit',{intentId:intent.id},'selected-submit'),frozen=JSON.stringify(run.manifest);await s.app.sshTargets.observe('one');assert.equal(JSON.stringify(s.app.store.get('run',run.id).manifest),frozen);assert.equal(run.state,'queued');
  const instructions=systemInstruction('coordinator');assert.match(instructions,/execution_environment_list/);assert.match(instructions,/runTarget/);assert.match(instructions,/GPU未核验/);assert.match(instructions,/完整contract/);assert.match(instructions,/config仅/);
 }finally{s.close();}
});

test('same-context temporary SSH services serialize owner and queue checks; background never replaces an in-flight attempt',async()=>{
 const s=setup();try{
  s.app.sshTargets.configure(USER,config(s));let release,calls=0;s.app.sshTargets.onboarding=()=>{calls++;return new Promise(resolve=>{release=()=>resolve(health('one'));});};
  const background=s.app.sshTargets.observe('one'),attempt=s.app.store.get('compute-connection','ssh:one').observation.attempt;
  const owner=new SshTargetService(s.app.context,async()=>{calls++;return reply('one');}),queued=owner.verify('one');await new Promise(r=>setTimeout(r,5));assert.equal(calls,1);assert.equal(s.app.store.get('compute-connection','ssh:one').observation.attempt,attempt);
  await assert.rejects(new SshTargetService(s.app.context).observe('one'),{code:'SSH_TARGET_BUSY'});assert.equal(s.app.store.get('compute-connection','ssh:one').observation.attempt,attempt);release();await background;await queued;assert.equal(calls,2);assert.equal(ssh(s).status,'verified');
  let ownerRelease;owner.request=()=>new Promise(resolve=>{ownerRelease=()=>resolve(reply('one'));});const checking=owner.verify('one'),ownerAttempt=s.app.store.get('compute-connection','ssh:one').observation.attempt;await assert.rejects(s.app.sshTargets.observe('one'),{code:'SSH_TARGET_BUSY'});assert.equal(s.app.store.get('compute-connection','ssh:one').observation.attempt,ownerAttempt);ownerRelease();await checking;
 }finally{s.close();}
});

test('Docker background skips an owner gate and owner waits for the full background observation',async()=>{
 const s=setup();let monitor;const releases=[],pending=[];let calls=0,active=0,maxActive=0;try{
  s.app.compute=new ComputeQueue(s.app.context,{probe:async()=>{calls++;active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>releases.push(resolve));active--;return {targetId:'docker-fixture',engineId:'engine',endpoint:'unix:///fixture.sock'};}});
  monitor=new ComputeConnectionMonitor(s.app,60000,()=> 'fixture');monitor.start();await Promise.resolve();const owner=s.app.compute.probeContext(USER,'fixture');pending.push(owner);await new Promise(resolve=>setTimeout(resolve,5));assert.equal(calls,1);assert.equal(maxActive,1);
  releases.shift()();await new Promise(resolve=>setTimeout(resolve,5));assert.equal(calls,2);assert.equal(s.app.store.db.prepare("SELECT status FROM compute_contexts WHERE context='fixture'").get().status,'ready');releases.shift()();await owner;await monitor.stop();
  const second=s.app.compute.probeContext(USER,'fixture');pending.push(second);const attempt=s.app.store.get('compute-connection','docker:fixture').observation.attempt;monitor.start();await new Promise(resolve=>setTimeout(resolve,5));assert.equal(calls,3);assert.equal(s.app.store.get('compute-connection','docker:fixture').observation.attempt,attempt);releases.shift()();await second;await monitor.stop();assert.equal(maxActive,1);
 }finally{releases.splice(0).forEach(resolve=>resolve());await Promise.allSettled(pending);if(monitor)await monitor.stop();s.close();}
});
