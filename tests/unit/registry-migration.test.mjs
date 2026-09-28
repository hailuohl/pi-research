import test from 'node:test';
import assert from 'node:assert/strict';
import {setup, USER} from '../support/research.mjs';
import {startTeam, spec, actor} from '../support/collaboration.mjs';
import {INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/inputs.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {operationRoute} from '../../dist/apps/server/operation-routes.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {DomainError} from '../../dist/packages/domain/errors.js';
const options = (s, key, sessionId) => ({projectId:s.project.id,idempotencyKey:key,...(sessionId?{sessionId}:{})});
test('every legacy research action is registered with the canonical input and output contract', () => {
 const s=setup();try {
  const specs=s.app.operations.specs();
  for(const name of Object.keys(INPUT_SCHEMAS)) {
   const entry=specs.find(x=>x.id===name);assert.ok(entry,name);assert.deepEqual(entry.inputSchema,INPUT_SCHEMAS[name]);assert.deepEqual(entry.outputSchema,OUTPUT_SCHEMAS[name]);
  }
 }finally{s.close();}
});
test('owner session-relative actions require context and host-only actions reject owner identity', () => {
 const s=setup();try {
  for(const name of ['session_notice_read','collaboration_plan_submit','agent_delegate']) {
   const input=name==='session_notice_read'?{messageId:'notice'}:{goal:'g',tasks:[spec('a')]};
   assert.throws(()=>s.app.operations.execute(USER,name,input,options(s,name)),{code:'SESSION_REQUIRED'});
  }
  for(const [name,input] of [['task_context_read',{}],['task_progress_report',{message:'fake'}],['task_result_submit',{summary:'fake',outcome:'completed'}]])
   assert.throws(()=>s.app.operations.execute(USER,name,input,options(s,name,s.session.id)),{code:'PERMISSION_DENIED'});
  assert.throws(()=>s.app.operations.execute(USER,'artifact_create',{title:'x',content:'x',actor:{type:'agent'}},options(s,'spoof')),{code:'INVALID_INPUT'});
 }finally{s.close();}
});

test('coordinator progress remains available without a delegated task and still respects its lease', () => {
 const s=setup();try {
  const old=s.app.store.get('session',s.session.id);
  s.app.store.update('session',old.id,old.version,{state:'running',generation:1,leaseUntil:Date.now()+30000});
  const actor={type:'agent',projectId:s.project.id,sessionId:old.id,role:'coordinator',generation:1};
  const progress=s.app.operations.execute(actor,'task_progress_report',{message:'Reading the selected source'},options(s,'progress',old.id));
  assert.equal(progress.type,'task.progress');assert.equal(progress.payload.sessionId,old.id);assert.equal(progress.payload.taskId,undefined);
  const current=s.app.store.get('session',old.id);s.app.store.update('session',old.id,current.version,{leaseUntil:0});
  assert.throws(()=>s.app.operations.execute(actor,'task_progress_report',{message:'late'},options(s,'late',old.id)),{code:'LEASE_EXPIRED'});
 }finally{s.close();}
});
test('legacy artifact creation shares canonical receipt and refuses unknown body fields', () => {
 const s=setup();try {
  const body={projectId:s.project.id,title:'raw',content:'content'};
  const old=operationRoute(s.app,'/artifacts',body,'one',new AbortController().signal,'POST','').result;
  const replay=s.app.operations.execute(USER,'artifact_create',{title:'raw',content:'content'},options(s,'one'));
  assert.equal(replay.id,old.id);assert.equal(s.app.store.list('artifact',s.project.id).length,1);
  assert.throws(()=>operationRoute(s.app,'/artifacts',{...body,unknown:true},'two',new AbortController().signal,'POST',''),{code:'INVALID_INPUT'});
 }finally{s.close();}
});
test('completed artifact reads recheck task resource grants before replay', async () => {
 const s=setup();try {
  const a=s.app.evidence.put(s.project.id,'input.txt',Buffer.from('input'));
  const e=s.app.evidence.register(USER,s.project.id,a.id,0,5,'input');
  const t=startTeam(s,[spec('reader',{inputEvidenceIds:[e.id]})]), claim=s.app.teams.claim(t.id), who=actor(claim);
  const opts={projectId:s.project.id,idempotencyKey:'read',sessionId:who.sessionId};
  const first=s.app.operations.execute(who,'artifact_read',{artifactId:a.id},opts);assert.equal(first.content,'input');
  s.app.teams.assertResource=()=>{throw new DomainError('TASK_SCOPE_DENIED','grant revoked',403);};
  assert.throws(()=>s.app.operations.execute(who,'artifact_read',{artifactId:a.id},opts),{code:'TASK_SCOPE_DENIED'});
 }finally{s.close();}
});
test('discovery adopts old HTTP service receipts and rechecks disabled providers', async () => {
 const s=setup();try {
  let requests=0;
  s.app.connectors=new ConnectorService(s.app.context,s.app.evidence,{transport:new ConnectorTransport({minIntervalMs:0,fetcher:async()=>{requests++;return new Response(JSON.stringify({results:[{id:'https://openalex.org/W123',title:'fixture',doi:null}]}),{headers:{'Content-Type':'application/json'}});}}),credentials:()=>({})});
  let cfg=s.app.connectors.settings(USER,s.project.id);s.app.connectors.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{openalex:true}});
  const input={query:'fixture',sources:['openalex']};
  const old=await s.app.connectors.discover(USER,s.project.id,input,'http:old');
  const replay=await s.app.operations.execute(USER,'literature_discover',input,options(s,'old'));
  assert.equal(replay.id,old.id);assert.equal(requests,1);
  cfg=s.app.connectors.settings(USER,s.project.id);s.app.connectors.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{openalex:false}});
  await assert.rejects(async()=>s.app.operations.execute(USER,'literature_discover',input,options(s,'old')),{code:'SOURCE_DISABLED'});
  assert.equal(requests,1);
 }finally{s.close();}
});
