import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve,waitRun} from '../support/research.mjs';
import {digest} from '../../dist/packages/storage/store.js';
const root=s=>{const row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+30000});return {type:'agent',projectId:s.project.id,sessionId:row.id,role:'coordinator',generation:1};};
const operation=(s,actor,name,input={},key=crypto.randomUUID())=>s.app.operations.execute(actor,name,input,{projectId:s.project.id,idempotencyKey:key});

test('Pi reads fixed parameters and derives a complete candidate only while the parent revision still matches',()=>{
 const s=setup();try{
  const actor=root(s),read=operation(s,actor,'experiment_source_read',{experimentId:s.baseline.id,revision:1,path:'config.json'}),config=JSON.parse(read.content);
  const candidate=operation(s,actor,'experiment_plan_submit',{title:'Agent parameter candidate',hypothesis:'Test a complete configuration',parentId:s.baseline.id,expectedParentRevision:1,config:{...config,polynomialDegree:2}});
  assert.equal(candidate.parentId,s.baseline.id);assert.deepEqual(JSON.parse(s.app.experiments.readFile(USER,candidate.id,'config.json').content),{...config,polynomialDegree:2});
  const file=s.app.experiments.readFile(USER,s.baseline.id,'config.json'),before=s.app.experiments.get(USER,s.baseline.id);
  s.app.experiments.writeFile(USER,s.baseline.id,'config.json',JSON.stringify({...config,polynomialDegree:3}),file.digest,before.version);
  const count=s.app.store.list('experiment',s.project.id).length;
  assert.throws(()=>operation(s,actor,'experiment_plan_submit',{title:'Stale candidate',parentId:s.baseline.id,expectedParentRevision:1,config}),{code:'EXPERIMENT_REVISION_CHANGED'});
  assert.equal(s.app.store.list('experiment',s.project.id).length,count);
  assert.throws(()=>operation(s,actor,'experiment_plan_submit',{title:'Missing parent',expectedParentRevision:1}),{code:'INVALID_INPUT'});
 }finally{s.close();}
});

test('ordinary dialogue intents bind the trusted root, retain approval hashes and reject another root before submission replay',async()=>{
 const s=setup();try{
  const actor=root(s),intent=operation(s,actor,'run_prepare',{experimentId:s.baseline.id});
  assert.equal(intent.rootSessionId,s.session.id);assert.equal(intent.manifestDigest,digest(intent.manifest));assert.equal(s.app.store.get('approval',intent.approvalId).digest,intent.manifestDigest);
  assert.throws(()=>operation(s,actor,'run_prepare',{experimentId:s.baseline.id,rootSessionId:'injected'}),{code:'INVALID_INPUT'});
  const pending=operation(s,actor,'project_inspect',{runIntentId:intent.id}).runIntents;
  assert.equal(pending.items[0].id,intent.id);assert.equal(pending.items[0].approvalStatus,'pending');
  assert.throws(()=>operation(s,actor,'run_submit',{intentId:intent.id}),{code:'APPROVAL_REQUIRED'});
  const other=s.app.sessions.create(USER,s.project.id,{title:'Other root'});s.app.store.update('session',other.id,other.version,{state:'running',generation:1,leaseUntil:Date.now()+30000});const peer={...actor,sessionId:other.id};
  assert.equal(operation(s,peer,'project_inspect').runIntents.items.length,0);
  assert.throws(()=>operation(s,peer,'project_inspect',{runIntentId:intent.id}),{code:'RUN_SESSION_DENIED'});
  approve(s.app,intent.approvalId);
  assert.throws(()=>operation(s,peer,'run_submit',{intentId:intent.id}),{code:'RUN_SESSION_DENIED'});
  const submitted=operation(s,actor,'run_submit',{intentId:intent.id},'submit-fixed');
  assert.equal(operation(s,actor,'run_submit',{intentId:intent.id},'submit-fixed').id,submitted.id);
  assert.equal(operation(s,actor,'run_submit',{intentId:intent.id}).id,submitted.id);
  assert.throws(()=>s.app.runs.submit(peer,intent.id),{code:'RUN_SESSION_DENIED'});
  const run=await waitRun(s,submitted.id);assert.equal(run.state,'succeeded');assert.equal(run.integrity,'complete');assert.equal(typeof run.metrics.mse,'number');
  const completed=operation(s,actor,'project_inspect',{runIntentId:intent.id});assert.equal(completed.runIntents.items[0].runId,run.id);assert.equal(completed.runIntents.items[0].status,'submitted');
  const legacy=s.app.runs.prepare(USER,s.baseline.id);assert.equal(legacy.rootSessionId,undefined);assert.ok(!operation(s,actor,'project_inspect').runIntents.items.some(i=>i.id===legacy.id));
 }finally{s.close();}
});

test('dialogue intent index is bounded and explicit lookup retains older owned history without exposing unbound records',()=>{
 const s=setup();try{
  const actor=root(s),intents=[];for(let i=0;i<22;i++)intents.push(operation(s,actor,'run_prepare',{experimentId:s.baseline.id}));
  const page=operation(s,actor,'project_inspect').runIntents;assert.equal(page.items.length,20);assert.equal(page.hasMore,true);assert.equal(page.items[0].id,intents.at(-1).id);
  const oldest=operation(s,actor,'project_inspect',{runIntentId:intents[0].id}).runIntents;assert.equal(oldest.items.length,1);assert.equal(oldest.items[0].id,intents[0].id);assert.equal(oldest.hasMore,false);
  const ownerBound=s.app.operations.execute(USER,'run_prepare',{experimentId:s.baseline.id},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'owner-context'});assert.equal(ownerBound.rootSessionId,s.session.id);
  const unbound=s.app.runs.prepare(USER,s.baseline.id);assert.throws(()=>operation(s,actor,'project_inspect',{runIntentId:unbound.id}),{code:'RUN_SESSION_DENIED'});
 }finally{s.close();}
});

test('trusted run preparation ownership is part of receipt identity and never claims a legacy unowned intent',()=>{
 const s=setup();try{
  const peer=s.app.sessions.create(USER,s.project.id,{title:'Peer root'}),input={experimentId:s.baseline.id};
  const prepare=(sid,key)=>s.app.operations.execute(USER,'run_prepare',input,{projectId:s.project.id,sessionId:sid,idempotencyKey:key});
  const first=prepare(s.session.id,'fixed-root');assert.equal(prepare(s.session.id,'fixed-root').id,first.id);
  assert.throws(()=>prepare(peer.id,'fixed-root'),{code:'IDEMPOTENCY_CONFLICT'});
  s.app.operations.execute(USER,'run_prepare',input,{projectId:s.project.id,idempotencyKey:'modern-unbound'});
  assert.throws(()=>prepare(s.session.id,'modern-unbound'),{code:'IDEMPOTENCY_CONFLICT'});
  const legacy=s.app.store.operation('POST:/run-intents','legacy-receipt',{body:input,query:''},()=>s.app.runs.prepare(USER,s.baseline.id));
  const owned=prepare(s.session.id,'legacy-receipt');assert.notEqual(owned.id,legacy.id);assert.equal(owned.rootSessionId,s.session.id);
  assert.equal(s.app.store.get('run-intent',legacy.id).rootSessionId,undefined);
 }finally{s.close();}
});
