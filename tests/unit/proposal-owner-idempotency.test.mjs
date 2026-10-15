import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';

function coordinator(s){
 const session=s.app.store.get('session',s.session.id);
 s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});
 return {type:'agent',projectId:s.project.id,sessionId:session.id,generation:1,role:'coordinator'};
}
const campaignInput=(s,extra={})=>({goal:'当前对话的有界研究目标',baselineExperimentId:s.baseline.id,...extra});
function changeInput(s){
 const artifact=s.app.evidence.put(s.project.id,'config.json',Buffer.from('{"polynomialDegree":2,"ridge":0.000001}'));
 const base=s.app.experiments.readFile(USER,s.baseline.id,'config.json');
 return {baseExperimentId:s.baseline.id,expectedRevision:1,title:'Owned change',hypothesis:'Keep ownership through replay',changes:[{path:'config.json',artifactId:artifact.id,expectedDigest:base.digest}]};
}

test('USER proposal and campaign receipts isolate owners and replay within each session',()=>{
 const s=setup();
 try{
  const other=s.app.sessions.create(USER,s.project.id,{title:'Other root'});
  for(const [name,input] of [['campaign_prepare',campaignInput(s)],['change_proposal_prepare',changeInput(s)]]){
   const call=sessionId=>s.app.operations.execute(USER,name,input,{projectId:s.project.id,sessionId,idempotencyKey:name});
   const first=call(s.session.id),second=call(other.id);
   assert.equal(first.rootSessionId,s.session.id);assert.equal(second.rootSessionId,other.id);
   assert.notEqual(first.id,second.id);assert.deepEqual(call(s.session.id),first);assert.deepEqual(call(other.id),second);
   const changed=name==='campaign_prepare'?{...input,goal:'Changed goal'}:{...input,title:'Changed title'};
   assert.throws(()=>s.app.operations.execute(USER,name,changed,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:name}),{code:'IDEMPOTENCY_CONFLICT'});
   assert.equal(s.app.store.list(name==='campaign_prepare'?'campaign':'change-proposal',s.project.id).length,2);
  }
 }finally{s.close();}
});

test('owned proposal receipts neither reuse nor pollute legacy unowned receipts',()=>{
 const s=setup();
 try{
  const input=changeInput(s),legacy={scope:'POST:/change-proposals',input:{body:{projectId:s.project.id,...input},query:''}};
  const call=(key,options={})=>s.app.operations.execute(USER,'change_proposal_prepare',input,{projectId:s.project.id,idempotencyKey:key,...options});
  const old=s.app.changes.prepare(USER,s.project.id,input);
  s.app.store.operation(legacy.scope,'legacy-first',legacy.input,()=>old);
  const owned=call('legacy-first',{sessionId:s.session.id});
  assert.equal(owned.rootSessionId,s.session.id);assert.notEqual(owned.id,old.id);
  assert.deepEqual(call('legacy-first',{legacy}),old);assert.deepEqual(call('legacy-first'),old);
  const ownedFirst=call('owned-first',{sessionId:s.session.id,legacy});
  const unowned=call('owned-first',{legacy});
  assert.equal(ownedFirst.rootSessionId,s.session.id);assert.equal(unowned.rootSessionId,undefined);
  assert.notEqual(ownedFirst.id,unowned.id);assert.deepEqual(call('owned-first'),unowned);
  assert.deepEqual(call('owned-first',{sessionId:s.session.id}),ownedFirst);
  const dir=s.dir;s.app.close();s.app=new ResearchApp(dir,process.cwd());
  assert.deepEqual(call('legacy-first',{legacy}),old);
  assert.deepEqual(call('owned-first',{sessionId:s.session.id}),ownedFirst);
 }finally{s.close();}
});

test('old agent proposal receipt cannot masquerade as a newly owned proposal',()=>{
 const s=setup();
 try{
  const root=coordinator(s),input=changeInput(s),old=s.app.changes.prepare(USER,s.project.id,input);
  s.app.store.operation(`agent:${s.session.id}`,'old-proposal',{name:'change_proposal_prepare',input},()=>old);
  assert.throws(()=>s.app.operations.execute(root,'change_proposal_prepare',input,{projectId:s.project.id,idempotencyKey:'old-proposal'}),{code:'IDEMPOTENCY_CONFLICT'});
  const result=s.app.operations.execute(root,'change_proposal_prepare',input,{projectId:s.project.id,idempotencyKey:'new-proposal'});
  assert.equal(result.rootSessionId,s.session.id);
  assert.deepEqual(s.app.operations.execute(root,'change_proposal_prepare',input,{projectId:s.project.id,idempotencyKey:'new-proposal'}),result);
  assert.equal(s.app.store.get('change-proposal',old.id).rootSessionId,undefined);
 }finally{s.close();}
});
