import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve} from '../support/research.mjs';
import {unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {operationRoute} from '../../dist/apps/server/operation-routes.js';

function prepared(s){const intent=s.app.runs.prepare(USER,s.baseline.id,s.session.id);const approval=approve(s.app,intent.approvalId);return {intent,approval,input:{intentId:intent.id,expectedVersion:intent.version,approvalId:approval.id,expectedApprovalVersion:approval.version,manifestDigest:intent.manifestDigest}};}
const context=(s,key='withdraw')=>({projectId:s.project.id,sessionId:s.session.id,idempotencyKey:key});
const snapshot=s=>JSON.stringify({records:s.app.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all(),events:s.app.store.db.prepare('SELECT * FROM events ORDER BY seq').all(),operations:s.app.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all(),queue:s.app.store.db.prepare('SELECT * FROM compute_queue ORDER BY sequence').all()});

test('user withdraws only the exact approved unsubmitted intent and preserves its immutable history',()=>{
 const s=setup();try{
  const previous=prepared(s),historical=s.app.runs.submit(USER,previous.intent.id),queueBefore=s.app.store.db.prepare('SELECT * FROM compute_queue ORDER BY sequence').all(),message=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'user',content:'synthetic queued continuation',status:'queued'});
  const {intent,approval,input}=prepared(s),before=s.app.store.get('run-intent',intent.id),sibling=s.app.approvals.request(s.project.id,'run-intent',intent.id,intent.manifestDigest,'run.submit','Sibling approval');
  let receipt;assert.doesNotThrow(()=>{receipt=s.app.operations.execute(USER,'run_intent_withdraw',input,context(s));});
  assert.deepEqual(receipt,{intentId:intent.id,approvalId:approval.id,manifestDigest:intent.manifestDigest,approvalStatus:'stale',approvalVersion:approval.version+1});
  assert.deepEqual(s.app.store.get('run-intent',intent.id),before);
  assert.equal(s.app.store.get('approval',approval.id).status,'stale');assert.equal(s.app.store.get('approval',approval.id).decidedAt,approval.decidedAt);
  assert.deepEqual(s.app.store.get('approval',sibling.id),sibling);assert.deepEqual(s.app.store.list('run',s.project.id),[historical]);assert.deepEqual(s.app.store.db.prepare('SELECT * FROM compute_queue ORDER BY sequence').all(),queueBefore);assert.deepEqual(s.app.store.get('message',message.id),message);
  validateSchema(TOOL_DEFINITIONS.run_intent_withdraw.outputSchema,receipt);
  const events=s.app.store.events().filter(event=>event.type==='run-intent.withdrawn');assert.equal(events.length,1);assert.deepEqual(events[0].payload,{intentId:intent.id,approvalId:approval.id,manifestDigest:intent.manifestDigest,sessionId:s.session.id,approvalVersion:approval.version+1});
 }finally{s.close();}
});

test('withdrawal removes authority even if frozen source, experiment and runtime are unavailable',()=>{
 const s=setup();try{
  const {intent,input}=prepared(s),before=s.app.store.get('run-intent',intent.id),path=s.app.store.paths.physical(intent.manifest.snapshotPath);
  assert.ok(path.startsWith(s.dir));unlinkSync(join(path,intent.manifest.sourceFiles[0].path));
  s.app.store.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run('experiment',intent.experimentId);
  s.app.runs.researchSourceGuard=()=>{throw Error('Source/runtime check must not block removing authority');};
  assert.equal(s.app.runs.withdrawIntent(USER,s.project.id,s.session.id,input).approvalStatus,'stale');assert.deepEqual(s.app.store.get('run-intent',intent.id),before);
 }finally{s.close();}
});

test('service and operation reject every nonordinary, nonowner, mismatched or submitted binding without writes',()=>{
 const cases={
  pending:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{status:'pending'}),
  rejected:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{status:'rejected'}),
  stale:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{status:'stale'}),
  intentGrant:(s,f)=>s.app.store.update('run-intent',f.intent.id,f.intent.version,{runGrant:{id:'grant'}}),
  approvalGrant:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{runGrant:{id:'grant'}}),
  workingGrant:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{workingGrant:{id:'grant'}}),
  fullAccess:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{fullAccess:{continuationId:'continuation'}}),
  automaticApproval:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{automaticApproval:{id:'auto'}}),
  automaticExecution:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{automaticExecution:{state:'completed'}}),
  subject:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{subjectId:'foreign'}),
  subjectKind:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{subjectKind:'development-task'}),
  scope:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{scope:'development.test'}),
  digest:(s,f)=>s.app.store.update('approval',f.approval.id,f.approval.version,{digest:'foreign'}),
  approvalReference:(s,f)=>s.app.store.update('run-intent',f.intent.id,f.intent.version,{approvalId:'other'}),
  owner:(s,f)=>s.app.store.update('run-intent',f.intent.id,f.intent.version,{rootSessionId:'foreign'}),
  ownerless:(s,f)=>s.app.store.update('run-intent',f.intent.id,f.intent.version,{rootSessionId:undefined}),
  submitted:(s,f)=>s.app.store.update('run-intent',f.intent.id,f.intent.version,{status:'submitted'}),
  runId:(s,f)=>s.app.store.update('run-intent',f.intent.id,f.intent.version,{runId:'existing'}),
  detachedRun:(s,f)=>s.app.store.create('run',s.project.id,{intentId:f.intent.id,state:'queued'}),
  archivedSession:s=>s.app.store.update('session',s.session.id,s.session.version,{state:'archived'}),
  taskSession:s=>s.app.store.update('session',s.session.id,s.session.version,{taskId:'task'}),
  teamSession:s=>s.app.store.update('session',s.session.id,s.session.version,{teamId:'team'}),
  wrongRole:s=>s.app.store.update('session',s.session.id,s.session.version,{role:'reviewer'}),
  missingSession:s=>s.app.store.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run('session',s.session.id),
  archivedProject:s=>s.app.store.update('project',s.project.id,s.project.version,{status:'archived'}),
  deletedProject:s=>s.app.store.update('project',s.project.id,s.project.version,{status:'trashed'}),
 };
 for(const [name,change] of Object.entries(cases)){
  const s=setup();try{
   const fixed=prepared(s);change(s,fixed);
   fixed.input.expectedVersion=s.app.store.get('run-intent',fixed.intent.id).version;fixed.input.expectedApprovalVersion=s.app.store.get('approval',fixed.approval.id).version;
   const before=snapshot(s);
   assert.throws(()=>s.app.runs.withdrawIntent(USER,s.project.id,s.session.id,fixed.input),undefined,name+' service');
   assert.throws(()=>s.app.operations.execute(USER,'run_intent_withdraw',fixed.input,context(s)),undefined,name+' operation');assert.equal(snapshot(s),before,name);
  }finally{s.close();}
 }
});

test('exact input versions, digest, identity, project and closed schema are mandatory',()=>{
 const s=setup();try{
  const {input}=prepared(s),foreign=s.app.projects.create(USER,{name:'foreign'}),before=snapshot(s);
  for(const patch of [{expectedVersion:input.expectedVersion+1},{expectedApprovalVersion:input.expectedApprovalVersion+1},{manifestDigest:'changed'},{approvalId:'foreign'},{intentId:'foreign'},{unexpected:true},{expectedVersion:0},{expectedApprovalVersion:1.5}]){
   assert.throws(()=>s.app.runs.withdrawIntent(USER,s.project.id,s.session.id,{...input,...patch}));assert.throws(()=>s.app.operations.execute(USER,'run_intent_withdraw',{...input,...patch},context(s)));
  }
  assert.throws(()=>s.app.operations.execute(USER,'run_intent_withdraw',input,{...context(s),sessionId:undefined}),{code:'SESSION_REQUIRED'});
  assert.throws(()=>s.app.operations.execute(USER,'run_intent_withdraw',input,{...context(s),idempotencyKey:undefined}),{code:'OPERATION_ID_REQUIRED'});
  assert.throws(()=>s.app.operations.execute(USER,'run_intent_withdraw',input,{...context(s),projectId:foreign.id}));
  assert.throws(()=>s.app.runs.withdrawIntent(USER,foreign.id,s.session.id,input));assert.equal(snapshot(s),before);
 }finally{s.close();}
});

test('agents cannot withdraw through service, registry or raw dispatcher and never receive the user tool',async()=>{
 const s=setup();try{
  const {input}=prepared(s),session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});
  const agent={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator',generation:1},before=snapshot(s),dispatcher=new ToolDispatcher(s.app);
  assert.throws(()=>s.app.runs.withdrawIntent(agent,s.project.id,s.session.id,input),{code:'PERMISSION_DENIED'});
  assert.throws(()=>s.app.operations.execute(agent,'run_intent_withdraw',input,context(s)),{code:'TOOL_DENIED'});
  await assert.rejects(dispatcher.execute(agent,'run_intent_withdraw',input,'withdraw-agent'),{code:'TOOL_DENIED'});
  assert.equal(dispatcher.definitions('coordinator').some(tool=>tool.name==='run_intent_withdraw'),false);assert.equal(snapshot(s),before);
 }finally{s.close();}
});

test('response-loss and reopen replay the original receipt once while a new key conflicts',()=>{
 const s=setup();try{
  const previous=prepared(s),historical=s.app.runs.submit(USER,previous.intent.id),previousIntent=s.app.store.get('run-intent',previous.intent.id),queueBefore=s.app.store.db.prepare('SELECT * FROM compute_queue ORDER BY sequence').all();
  const {intent,approval,input}=prepared(s),before=s.app.store.get('run-intent',intent.id);
  const receipt=s.app.operations.execute(USER,'run_intent_withdraw',input,context(s)),events=s.app.store.events().length;
  assert.deepEqual(s.app.operations.execute(USER,'run_intent_withdraw',input,context(s)),receipt);assert.equal(s.app.store.events().length,events);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  assert.deepEqual(s.app.operations.execute(USER,'run_intent_withdraw',input,context(s)),receipt);assert.equal(s.app.store.events().length,events);
  assert.throws(()=>s.app.operations.execute(USER,'run_intent_withdraw',input,context(s,'fresh')),{code:'VERSION_CONFLICT'});
  assert.deepEqual(s.app.store.get('run-intent',intent.id),before);assert.equal(s.app.store.get('approval',approval.id).decidedAt,approval.decidedAt);
  assert.throws(()=>s.app.runs.submit(USER,intent.id),{code:'APPROVAL_STALE'});assert.deepEqual(s.app.store.list('run',s.project.id),[historical]);assert.deepEqual(s.app.store.get('run-intent',previous.intent.id),previousIntent);assert.deepEqual(s.app.store.db.prepare('SELECT * FROM compute_queue ORDER BY sequence').all(),queueBefore);
 }finally{s.close();}
});

test('withdrawal audit and receipt commit atomically with approval mutation',()=>{
 const s=setup();try{
  const {input}=prepared(s),before=snapshot(s),event=s.app.store.event;s.app.store.event=()=>{throw Error('synthetic audit failure');};
  assert.throws(()=>s.app.operations.execute(USER,'run_intent_withdraw',input,context(s)),/synthetic audit failure/);s.app.store.event=event;assert.equal(snapshot(s),before);
  assert.equal(s.app.operations.execute(USER,'run_intent_withdraw',input,context(s)).approvalStatus,'stale');
 }finally{s.close();}
});

test('HTTP operation adapter uses the same closed user contract and durable receipt',()=>{
 const s=setup();try{
  const {input}=prepared(s),body={projectId:s.project.id,sessionId:s.session.id,input},signal=new AbortController().signal;
  const call=(value=body,key='http-withdraw')=>operationRoute(s.app,'/operations/run_intent_withdraw',value,key,signal,'POST','');
  assert.throws(()=>call({...body,input:{...input,approved:false}}),{code:'INVALID_INPUT'});
  const first=call();assert.equal(first.result.approvalStatus,'stale');assert.deepEqual(call(),first);
 }finally{s.close();}
});

test('CLI withdrawal and HTTP retry share the original receipt across independent processes',()=>{
 const s=setup();try{
  const {input}=prepared(s),command=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','run_intent_withdraw','--project',s.project.id,'--session',s.session.id,'--input',JSON.stringify(input),'--key','cli-withdraw','--data',s.dir],{encoding:'utf8',timeout:15000,env:{...process.env,NODE_NO_WARNINGS:'1'}});
  assert.equal(command.status,0,command.stderr);const receipt=JSON.parse(command.stdout);assert.equal(receipt.approvalStatus,'stale');
  const replay=operationRoute(s.app,'/operations/run_intent_withdraw',{projectId:s.project.id,sessionId:s.session.id,input},'cli-withdraw',new AbortController().signal,'POST','');assert.deepEqual(replay.result,receipt);assert.equal(s.app.store.events().filter(event=>event.type==='run-intent.withdrawn').length,1);
 }finally{s.close();}
});
