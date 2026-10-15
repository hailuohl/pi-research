import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {setup,USER,fixtureFinish,campaign,enroll,submit} from '../support/research.mjs';
import {actor,spec,startTeam} from '../support/collaboration.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';
import {INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/inputs.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

const SHA='a'.repeat(40),OTHER_SHA='b'.repeat(40);
function setting(s){return s.app.store.create('github-setting',s.project.id,{enabled:true,epoch:1,account:{id:123,login:'private-account'},repository:{id:456,fullName:'private-account/private-repository',private:true},origin:'user-project-setting'},s.project.id);}
function job(s,extra={},projectId=s.project.id){return s.app.store.create('github-upload-job',projectId,{commit:SHA,ref:'refs/heads/main',state:'queued',epoch:1,snapshot:{path:'private-snapshot',files:[]},marker:'private-marker',workerPid:process.pid,error:{code:'GITHUB_FIXTURE',message:'private-stderr'},...extra});}
function root(s){const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{state:'running',generation:current.generation+1,leaseUntil:Date.now()+120000,skillBundleId:s.app.skills.configuration(s.project.id).bundleId});return {type:'agent',role:'coordinator',projectId:s.project.id,sessionId:current.id,generation:current.generation+1};}
function inspect(s,input={},who=USER,key='inspect'){return s.app.operations.execute(who,'project_inspect',input,{projectId:s.project.id,idempotencyKey:key});}
function receipt(s,who,key){return s.app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(`agent:${who.sessionId}`,key);}

test('exact SHA receipts are opt-in, closed, bounded, scoped and use current enabled without filtering old epochs',()=>{
 const s=setup();try{
  assert.ok(!('github' in inspect(s)));assert.deepEqual(inspect(s,{githubCommit:SHA}).github.receipts,[]);assert.equal(inspect(s,{githubCommit:SHA}).github.enabled,false);
  const config=setting(s),states=['queued','creating','uploading','synced','failed','unknown','paused'];
  const rows=states.map((state,i)=>job(s,{state,ref:`refs/heads/ref-${i}`,...(i?{operationId:`operation-${i}`}:{error:undefined})}));
  const foreign=s.app.projects.create(USER,{name:'foreign'}),foreignJob=job(s,{ref:'refs/heads/foreign'},foreign.id);job(s,{commit:OTHER_SHA,ref:'refs/heads/other-sha'});
  const view=inspect(s,{githubCommit:SHA});validateSchema(OUTPUT_SCHEMAS.project_inspect,view,'output');assert.ok(Number.isFinite(Date.parse(view.github.observedAt)));
  assert.deepEqual(view.github.receipts.map(r=>r.state),states.toReversed());assert.deepEqual(view.github.receipts.map(r=>r.jobId),rows.map(r=>r.id).toReversed());assert.equal(view.github.hasMore,false);assert.equal(view.github.enabled,true);
  assert.deepEqual(Object.keys(view.github).sort(),['commit','enabled','hasMore','observedAt','receipts']);
  assert.deepEqual(Object.keys(view.github.receipts.at(-1)).sort(),['jobId','recordedAt','ref','state']);assert.deepEqual(Object.keys(view.github.receipts[0]).sort(),['errorCode','jobId','operationId','recordedAt','ref','state']);assert.equal(view.github.receipts[0].recordedAt,rows.at(-1).updatedAt);
  for(const secret of ['private-account','private-repository','private-snapshot','private-marker','private-stderr',foreignJob.id])assert.equal(JSON.stringify(view).includes(secret),false);
  s.app.store.update('github-setting',config.id,config.version,{enabled:false,epoch:2});assert.equal(inspect(s,{githubCommit:SHA}).github.enabled,false);assert.equal(inspect(s,{githubCommit:SHA}).github.receipts.length,7);
  for(let i=0;i<14;i++)job(s,{ref:`refs/heads/extra-${i}`});const bounded=inspect(s,{githubCommit:SHA}).github;assert.equal(bounded.receipts.length,20);assert.equal(bounded.hasMore,true);assert.equal(bounded.receipts[0].ref,'refs/heads/extra-13');
  const empty=inspect(s,{githubCommit:'c'.repeat(40)}).github;assert.deepEqual(empty.receipts,[]);assert.equal(empty.hasMore,false);assert.ok(!('state' in empty));
  for(const githubCommit of [null,false,1,'abc123',SHA.toUpperCase(),' '+SHA,SHA+'\n','https://github.com/private', '../state.db']){assert.throws(()=>inspect(s,{githubCommit}),{code:'INVALID_INPUT'});assert.throws(()=>s.app.github.inspectCommit(USER,s.project.id,githubCommit),{code:'INVALID_INPUT'});}
  for(const extra of [{projectId:foreign.id},{repository:'private'},{ref:'refs/heads/main'},{unknown:true}])assert.throws(()=>inspect(s,{githubCommit:SHA,...extra}),{code:'INVALID_INPUT'});
  validateSchema(INPUT_SCHEMAS.project_inspect,TOOL_DEFINITIONS.project_inspect.example);assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.project_inspect,{...view,github:{...view.github,account:{id:1}}},'output'),{code:'INVALID_OUTPUT'});
 }finally{s.close();}
});

test('owner SHA inspection uses one read snapshot, with no writer recovery, process, client or network calls',()=>{
 const s=setup();let concurrent;try{
  setting(s);const row=job(s),before=s.app.store.db.prepare('SELECT * FROM records ORDER BY rowid').all(),events=s.app.store.events().length,original=s.app.github.inspectCommit.bind(s.app.github),write=s.app.store.transaction;
  const savedFetch=globalThis.fetch,savedSpawn=childProcess.spawn,savedSpawnSync=childProcess.spawnSync,savedExec=childProcess.execFile,savedExecSync=childProcess.execFileSync,savedKill=process.kill;
  const forbidden=()=>assert.fail('SHA inspection must not run recovery, processes, clients or network requests');
  s.app.github.client=new Proxy({}, {get:()=>forbidden});s.app.github.inspect=s.app.github.processNext=s.app.github.source=forbidden;
  globalThis.fetch=childProcess.spawn=childProcess.spawnSync=childProcess.execFile=childProcess.execFileSync=process.kill=forbidden;syncBuiltinESMExports();s.app.store.transaction=forbidden;
  try{validateSchema(OUTPUT_SCHEMAS.project_inspect,inspect(s,{githubCommit:SHA}),'output');assert.equal(s.app.github.inspectCommit(USER,s.project.id,SHA).receipts[0].jobId,row.id);}finally{globalThis.fetch=savedFetch;childProcess.spawn=savedSpawn;childProcess.spawnSync=savedSpawnSync;childProcess.execFile=savedExec;childProcess.execFileSync=savedExecSync;process.kill=savedKill;syncBuiltinESMExports();s.app.store.transaction=write;}
  assert.deepEqual(s.app.store.db.prepare('SELECT * FROM records ORDER BY rowid').all(),before);assert.equal(s.app.store.events().length,events);assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM operations WHERE key=?').get('inspect').n,0);
  concurrent=new DatabaseSync(s.app.store.path);concurrent.exec('PRAGMA busy_timeout=1');let inSnapshot=false;
  s.app.github.inspectCommit=(...args)=>{inSnapshot=s.app.store.db.isTransaction;concurrent.prepare("UPDATE records SET data=json_set(data,'$.enabled',0) WHERE kind='github-setting' AND id=?").run(s.project.id);concurrent.prepare("UPDATE records SET data=json_set(data,'$.state','synced') WHERE kind='github-upload-job' AND id=?").run(row.id);return original(...args);};
  const view=inspect(s,{githubCommit:SHA});assert.equal(inSnapshot,true);assert.equal(view.github.enabled,true);assert.equal(view.github.receipts[0].state,'queued');assert.equal(s.app.store.get('github-upload-job',row.id).state,'synced');assert.equal(s.app.store.db.isTransaction,false);
 }finally{concurrent?.close();s.close();}
});

test('interactive SHA replay is fresh and reauthorized, preserves the original receipt and survives reopen',async()=>{
 const s=setup();try{
  setting(s);const row=job(s),who=root(s),tools=new ToolDispatcher(s.app),input={githubCommit:SHA},key='fresh-github';
  const first=await tools.execute(who,'project_inspect',input,key),saved=receipt(s,who,key),plain=inspect(s,{},who,'plain-cached');
  const changed=s.app.store.update('github-upload-job',row.id,row.version,{state:'synced',error:undefined});const config=s.app.store.get('github-setting',s.project.id);s.app.store.update('github-setting',config.id,config.version,{enabled:false,epoch:2});
  const fresh=await tools.execute(who,'project_inspect',input,key);assert.equal(fresh.github.receipts[0].state,'synced');assert.equal(fresh.github.enabled,false);assert.equal(fresh.github.receipts[0].recordedAt,changed.updatedAt);assert.deepEqual(receipt(s,who,key),saved);assert.equal(JSON.parse(saved.response).github.receipts[0].state,first.github.receipts[0].state);
  for(const conflict of [{},{githubCommit:OTHER_SHA}])assert.throws(()=>inspect(s,conflict,who,key),{code:'IDEMPOTENCY_CONFLICT'});
  s.app.sessions.interrupt(USER,s.session.id);assert.throws(()=>inspect(s,input,who,key),{code:'LEASE_EXPIRED'});const resumed=root(s);assert.throws(()=>inspect(s,input,who,key),{code:'LEASE_EXPIRED'});assert.equal(inspect(s,input,resumed,key).github.receipts[0].ref,row.ref);
  const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{teamId:'noninteractive'});assert.throws(()=>inspect(s,input,resumed,key),{code:'INVALID_ROOT_SESSION'});assert.throws(()=>s.app.github.inspectCommit(resumed,s.project.id,SHA),{code:'INVALID_ROOT_SESSION'});const restored=s.app.store.get('session',s.session.id);s.app.store.update('session',restored.id,restored.version,{teamId:undefined});
  const fenced={...resumed,permission:s.app.sessionPermissions.capture(resumed.sessionId)};assert.equal(inspect(s,input,fenced,key).github.receipts[0].state,'synced');const permission=s.app.sessionPermissions.status(USER,resumed.sessionId);s.app.sessionPermissions.set(USER,resumed.sessionId,{mode:'readOnly',expectedVersion:permission.version});assert.throws(()=>inspect(s,input,fenced,key),{code:'SESSION_PERMISSION_STALE'});assert.equal(inspect(s,input,resumed,key).github.receipts[0].state,'synced');
  assert.deepEqual(inspect(s,{},resumed,'plain-cached'),plain);s.app.close();s.app=new ResearchApp(s.dir,process.cwd());const reopened=inspect(s,input,resumed,key);assert.equal(reopened.github.receipts[0].state,'synced');assert.equal(reopened.github.receipts[0].jobId,row.id);assert.equal(reopened.github.receipts[0].ref,row.ref);assert.deepEqual(receipt(s,who,key),saved);
  const foreign=s.app.projects.create(USER,{name:'foreign'}),foreignJob=job(s,{commit:OTHER_SHA},foreign.id);assert.deepEqual(inspect(s,{githubCommit:OTHER_SHA},resumed,'empty').github.receipts,[]);assert.equal(JSON.stringify(inspect(s,input,resumed,key)).includes(foreignJob.id),false);
  assert.throws(()=>s.app.github.inspectCommit(resumed,foreign.id,SHA),{code:'SCOPE_DENIED'});assert.throws(()=>s.app.operations.execute(resumed,'project_inspect',input,{projectId:foreign.id,idempotencyKey:'foreign'}),{code:'SCOPE_DENIED'});
  const other=s.app.sessions.create(USER,s.project.id,{}, {role:'reviewer'}),running=s.app.store.update('session',other.id,other.version,{state:'running',generation:1,leaseUntil:Date.now()+120000}),reviewer={type:'agent',role:'reviewer',projectId:s.project.id,sessionId:running.id,generation:1};assert.ok(!('github' in inspect(s,{},reviewer,'role-default')));assert.throws(()=>inspect(s,input,reviewer,'role-sha'),{code:'TASK_SCOPE_DENIED'});assert.throws(()=>s.app.github.inspectCommit(reviewer,s.project.id,SHA),{code:'TASK_SCOPE_DENIED'});
 }finally{s.close();}
});

test('Task and active wakeup keep default project access but cannot inspect SHA receipts',()=>{
 const s=setup();try{
  const team=startTeam(s,[spec('reader')]),claim=s.app.teams.claim(team.id),who=actor(claim),session=s.app.store.get('session',who.sessionId);s.app.store.update('session',session.id,session.version,{state:'running',generation:who.generation,leaseUntil:Date.now()+120000});
  assert.equal(inspect(s,{},who,'task-default').project.id,s.project.id);assert.throws(()=>inspect(s,{githubCommit:SHA},who,'task-sha'),{code:'TASK_SCOPE_DENIED'});assert.throws(()=>s.app.github.inspectCommit(who,s.project.id,SHA),{code:'TASK_SCOPE_DENIED'});
  const c=campaign(s,{autoAnalyze:true}),automatic=submit(s,enroll(s,c));fixtureFinish(s,automatic);s.app.campaigns.observe();s.app.wakeups.reconcile();const w=s.app.wakeups.list(USER,s.project.id).find(w=>w.ownerId===c.id),dispatch=s.app.wakeups.dispatch(w.id,{ready:true});assert.ok(dispatch);
  const rootActor=root(s),message=dispatch.message;s.app.store.update('message',message.id,message.version,{status:'running'});s.app.wakeups.markStarted(w.id,rootActor.sessionId,rootActor.generation,message.id);const wakeup={...rootActor,wakeupId:w.id};
  assert.equal(inspect(s,{},wakeup,'wakeup-default').project.id,s.project.id);assert.throws(()=>inspect(s,{githubCommit:SHA},wakeup,'wakeup-sha'),{code:'TASK_SCOPE_DENIED'});assert.throws(()=>s.app.github.inspectCommit(wakeup,s.project.id,SHA),{code:'TASK_SCOPE_DENIED'});
 }finally{s.close();}
});
