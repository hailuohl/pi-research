import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {setup,USER,approve,fixtureFinish,campaign,enroll,submit} from '../support/research.mjs';
import {actor,spec,startTeam} from '../support/collaboration.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';
import {INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/inputs.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

function run(s){const intent=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,intent.approvalId);return s.app.runs.submit(USER,intent.id);}
function root(s){const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{state:'running',generation:current.generation+1,leaseUntil:Date.now()+120000,skillBundleId:s.app.skills.configuration(s.project.id).bundleId});return {type:'agent',role:'coordinator',projectId:s.project.id,sessionId:current.id,generation:current.generation+1};}
function inspect(s,r,input={},who=USER,key='inspect'){return s.app.operations.execute(who,'run_inspect',{runId:r.id,...input},{projectId:s.project.id,idempotencyKey:key});}
function receipt(s,who,key){return s.app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(`agent:${who.sessionId}`,key);}
function computeSnapshot(s){return ['compute_queue','compute_limits','compute_contexts','compute_gpu_claims'].map(table=>s.app.store.db.prepare(`SELECT * FROM ${table}`).all());}

test('owner scheduling uses a stable read snapshot without a writer lock or filesystem recovery',()=>{
 const s=setup();let concurrent;try{
  const r=run(s),before=s.app.store.get('run',r.id),original=s.app.compute.inspectRun.bind(s.app.compute),write=s.app.store.transaction;
  concurrent=new DatabaseSync(s.app.store.path);concurrent.exec('PRAGMA busy_timeout=1');let committed=false,inSnapshot=false;
  s.app.compute.inspectRun=(...args)=>{inSnapshot=s.app.store.db.isTransaction;concurrent.prepare("UPDATE records SET data=json_set(data,'$.state','failed'),version=version+1 WHERE kind='run' AND id=?").run(r.id);committed=true;return original(...args);};
  s.app.store.transaction=()=>assert.fail('Owner scheduling must not invoke writer recovery');
  let view;try{view=inspect(s,r,{includeScheduling:true});}finally{s.app.compute.inspectRun=original;s.app.store.transaction=write;}
  assert.equal(view.state,'queued');assert.equal(view.scheduling.queue?.state,'queued');assert.equal(inSnapshot,true);assert.equal(committed,true);
  assert.equal(s.app.store.get('run',r.id).state,'failed');assert.deepEqual(s.app.store.get('run',r.id).manifest,before.manifest);assert.equal(s.app.store.db.isTransaction,false);
 }finally{concurrent?.close();s.close();}
});

test('Run scheduling is an opt-in, closed, read-only projection with terminal and legacy fallbacks',()=>{
 const s=setup();try{
  const r=run(s),other=run(s),before=s.app.store.get('run',r.id),snapshot=computeSnapshot(s),events=s.app.store.events().length;
  assert.ok(!('scheduling' in inspect(s,r)));assert.deepEqual(inspect(s,r,{includeScheduling:false}),inspect(s,r));
  const savedFetch=globalThis.fetch,savedSpawn=childProcess.spawn,savedSpawnSync=childProcess.spawnSync;
  globalThis.fetch=childProcess.spawn=childProcess.spawnSync=()=>assert.fail('Scheduling inspection must not start a process or network request');syncBuiltinESMExports();
  let view;try{view=inspect(s,r,{includeScheduling:true});}finally{globalThis.fetch=savedFetch;childProcess.spawn=savedSpawn;childProcess.spawnSync=savedSpawnSync;syncBuiltinESMExports();}
  validateSchema(OUTPUT_SCHEMAS.run_inspect,view,'output');assert.ok(Number.isFinite(Date.parse(view.scheduling.observedAt)));
  assert.deepEqual(Object.keys(view.scheduling).sort(),['observedAt','queue']);assert.deepEqual(Object.keys(view.scheduling.queue).sort(),['backend','held','nextAttemptAt','reason','requested','state','targetId']);
  assert.equal(view.scheduling.queue.reason,'ready');assert.equal(view.scheduling.queue.held,false);assert.equal(view.scheduling.queue.backend,'trusted-example');
  assert.deepEqual(view.scheduling.queue.requested,{cpus:r.manifest.contract.cpus,memoryMb:r.manifest.contract.memoryMb});assert.equal(JSON.stringify(view.scheduling).includes(other.id),false);
  assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.run_submit,view,'output'),{code:'INVALID_OUTPUT'});assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.run_inspect,{...view,scheduling:{...view.scheduling,usage:{jobs:0}}},'output'),{code:'INVALID_OUTPUT'});
  assert.deepEqual(s.app.store.get('run',r.id),before);assert.deepEqual(computeSnapshot(s),snapshot);assert.equal(s.app.store.events().length,events);
  assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM operations WHERE key=?').get('inspect').n,0);
  s.app.store.db.prepare("DELETE FROM compute_queue WHERE kind='run' AND id=?").run(r.id);
  assert.deepEqual(inspect(s,r,{includeScheduling:true}).scheduling.unavailableReason,'not_recorded');assert.equal(inspect(s,r,{includeScheduling:true}).scheduling.queue,null);
  fixtureFinish(s,other);s.app.store.db.prepare("UPDATE compute_queue SET phase='queued',held=1,next_attempt_at=? WHERE kind='run' AND id=?").run(Date.now()+100000,other.id);
  assert.deepEqual(inspect(s,other,{includeScheduling:true}).scheduling.unavailableReason,'terminal');assert.equal(inspect(s,other,{includeScheduling:true}).scheduling.queue,null);
  validateSchema(INPUT_SCHEMAS.run_inspect,TOOL_DEFINITIONS.run_inspect.example);
  for(const includeScheduling of [null,'true',1])assert.throws(()=>inspect(s,r,{includeScheduling}),{code:'INVALID_INPUT'});
 }finally{s.close();}
});

test('interactive Agent scheduling replay is fresh, reauthorized, preserves receipts and survives reopen',async()=>{
 const s=setup();try{
  const r=run(s),who=root(s),tools=new ToolDispatcher(s.app),input={runId:r.id,includeScheduling:true},key='fresh-scheduling';
  const first=await tools.execute(who,'run_inspect',input,key),saved=receipt(s,who,key),manifest=structuredClone(r.manifest);
  const plain=inspect(s,r,{},who,'plain-cached'),explicitFalse=inspect(s,r,{includeScheduling:false},who,'false-cached');
  s.app.compute.configure(USER,{expectedVersion:s.app.compute.inspect(USER).configuration.version,limits:{maxRuns:0}});
  assert.equal((await tools.execute(who,'run_inspect',input,key)).scheduling.queue.reason,'request_too_large');assert.deepEqual(receipt(s,who,key),saved);
  assert.throws(()=>inspect(s,r,{includeScheduling:false},who,key),{code:'IDEMPOTENCY_CONFLICT'});
  s.app.sessions.interrupt(USER,s.session.id);assert.throws(()=>inspect(s,r,{includeScheduling:true},who,key),{code:'LEASE_EXPIRED'});
  const resumed=root(s);assert.equal(inspect(s,r,{includeScheduling:true},resumed,key).scheduling.queue.reason,'request_too_large');
  const session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{teamId:'noninteractive-marker'});
  assert.throws(()=>inspect(s,r,{includeScheduling:true},resumed,key),{code:'INVALID_ROOT_SESSION'});
  const restored=s.app.store.get('session',s.session.id);s.app.store.update('session',restored.id,restored.version,{teamId:undefined});
  fixtureFinish(s,r);const terminal=inspect(s,r,{includeScheduling:true},resumed,key);assert.equal(terminal.state,'succeeded');assert.equal(terminal.scheduling.unavailableReason,'terminal');assert.equal(terminal.scheduling.queue,null);
  assert.deepEqual(inspect(s,r,{},resumed,'plain-cached'),plain);assert.deepEqual(inspect(s,r,{includeScheduling:false},resumed,'false-cached'),explicitFalse);
  assert.deepEqual(receipt(s,who,key),saved);assert.equal(JSON.parse(saved.response).state,first.state);assert.deepEqual(s.app.store.get('run',r.id).manifest,manifest);assert.ok(!('scheduling' in s.app.store.get('run',r.id)));
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());const reopened=inspect(s,r,{includeScheduling:true},resumed,key);assert.equal(reopened.state,'succeeded');assert.equal(reopened.scheduling.unavailableReason,'terminal');assert.deepEqual(receipt(s,who,key),saved);assert.deepEqual(reopened.manifest,manifest);
  const foreignProject=s.app.projects.create(USER,{name:'Foreign',template:'curve-fit'}),foreignExperiment=s.app.experiments.create(USER,foreignProject.id,{title:'Foreign'}),intent=s.app.runs.prepare(USER,foreignExperiment.id);approve(s.app,intent.approvalId);const foreign=s.app.runs.submit(USER,intent.id);
  for(const caller of [USER,resumed])assert.throws(()=>inspect(s,foreign,{includeScheduling:true},caller,'foreign'),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});

test('Tasks and active wakeups retain default Run access but cannot opt into scheduling',()=>{
 const s=setup();try{
  const r=fixtureFinish(s,run(s)),team=startTeam(s,[spec('reader',{inputEvidenceIds:r.evidenceIds})]),claim=s.app.teams.claim(team.id),who=actor(claim),session=s.app.store.get('session',who.sessionId);
  s.app.store.update('session',session.id,session.version,{state:'running',generation:who.generation,leaseUntil:Date.now()+120000});
  assert.equal(inspect(s,r,{},who,'task-default').id,r.id);assert.equal(inspect(s,r,{includeScheduling:false},who,'task-false').id,r.id);assert.throws(()=>inspect(s,r,{includeScheduling:true},who,'task-true'),{code:'TASK_SCOPE_DENIED'});
  const c=campaign(s,{autoAnalyze:true}),automatic=submit(s,enroll(s,c));fixtureFinish(s,automatic);s.app.campaigns.observe();s.app.wakeups.reconcile();const w=s.app.wakeups.list(USER,s.project.id).find(w=>w.ownerId===c.id),dispatch=s.app.wakeups.dispatch(w.id,{ready:true});assert.ok(dispatch);
  const rootActor=root(s),message=dispatch.message;s.app.store.update('message',message.id,message.version,{status:'running'});s.app.wakeups.markStarted(w.id,rootActor.sessionId,rootActor.generation,message.id);const wakeup={...rootActor,wakeupId:w.id};
  assert.equal(inspect(s,automatic,{},wakeup,'wakeup-default').id,automatic.id);assert.equal(inspect(s,automatic,{includeScheduling:false},wakeup,'wakeup-false').id,automatic.id);assert.throws(()=>inspect(s,automatic,{includeScheduling:true},wakeup,'wakeup-true'),{code:'TASK_SCOPE_DENIED'});
 }finally{s.close();}
});
