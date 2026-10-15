import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fork} from 'node:child_process';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {setup,USER,approve,fixtureFinish} from '../support/research.mjs';

test('owned Run analysis uses isolated native context and preserves the interactive conversation path',async()=>{
 const s=setup(),host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'IPC_FIXTURE_ONLY',message:'test fixture'}),workerEntry:resolve('tests/fixtures/owned-run-analysis-ipc.mjs')});
 try{
  s.app.sessions.configure(USER,{provider:'test',model:'fixture',thinking:'off'});
  let root=s.app.sessions.get(USER,s.session.id);root=s.app.store.update('session',root.id,root.version,{model:s.app.sessions.model(),skillBundleId:s.app.skills.configuration(s.project.id).bundleId});
  const native=join(s.dir,'sessions',root.id,'pi','interactive.jsonl');mkdirSync(join(s.dir,'sessions',root.id,'pi'),{recursive:true});writeFileSync(native,'private interactive native history');
  root=s.app.store.update('session',root.id,root.version,{piSessionPath:s.app.store.paths.reference(native)});
  s.app.sessions.system(root.id,'PRIVATE_ORIGINAL_NOTICES');
  s.app.store.create('message',s.project.id,{sessionId:root.id,role:'user',mode:'prompt',status:'completed',content:'PRIVATE_ORIGINAL_CHAT'});
  const intent=s.app.runs.prepare(USER,s.baseline.id,root.id,true);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);fixtureFinish(s,run);
  for(let i=0;i<150;i++){host.tick();if(s.app.wakeups.list(USER,s.project.id).some(w=>w.sourceKind==='run-result'&&w.state==='completed'))break;await new Promise(r=>setTimeout(r,20));}
  const wakeups=s.app.wakeups.list(USER,s.project.id).filter(w=>w.sourceKind==='run-result');assert.equal(wakeups.length,1);assert.equal(wakeups[0].state,'completed',JSON.stringify({wakeup:wakeups[0],session:s.app.sessions.get(USER,root.id)}));
  const messages=s.app.sessions.messages(USER,root.id),reply=JSON.parse(messages.find(m=>m.origin==='automation'&&m.role==='assistant').content);
  assert.equal(reply.history,null);assert.equal(reply.piSessionPath,null);assert.deepEqual(reply.hostMessages,[]);
  assert.match(reply.sessionDir,/pi-analysis/);assert.equal(reply.tools.includes('run_submit'),false);assert.equal(reply.tools.includes('research_brief_inspect'),false);
  assert.equal(s.app.sessions.get(USER,root.id).piSessionPath,root.piSessionPath);assert.ok(wakeups[0].analysisSessionPath);
  assert.equal(s.app.budget.summary(intent.id).used,1);for(let i=0;i<4;i++)host.tick();assert.equal(s.app.wakeups.list(USER,s.project.id).filter(w=>w.sourceKind==='run-result').length,1);
 }finally{await host.stop();s.close();}
});

test('a synchronous fork failure permits only explicit user retry, while a returned child consumes uncertain analysis budget',async()=>{
 for(const failure of ['before-fork','after-fork']){
  const s=setup();let calls=0,fail=true,spawned=false;
  const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'IPC_FIXTURE_ONLY',message:'test fixture'}),workerEntry:resolve('tests/fixtures/owned-run-analysis-ipc.mjs'),fork:(...args)=>{calls++;if(fail&&failure==='before-fork')throw Error('known fork failure');const child=fork(...args);spawned=true;return child;}});
  const execute=s.app.store.db.exec.bind(s.app.store.db);
  try{
   s.app.sessions.configure(USER,{provider:'test',model:'fixture',thinking:'off'});
   const root=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',root.id,root.version,{model:s.app.sessions.model(),skillBundleId:s.app.skills.configuration(s.project.id).bundleId});
   const intent=s.app.runs.prepare(USER,s.baseline.id,root.id,true);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);fixtureFinish(s,run);
   s.app.store.db.exec=sql=>{if(sql==='COMMIT'&&fail&&failure==='after-fork'&&spawned){spawned=false;throw Error('failure committing child creation');}return execute(sql);};
   host.tick();s.app.store.db.exec=execute;
   let wakeup=s.app.wakeups.list(USER,s.project.id).find(w=>w.sourceKind==='run-result');assert.equal(wakeup.state,'failed');
   for(let i=0;i<4;i++)host.tick();assert.equal(calls,1,'failure must not automatically retry');
   if(failure==='after-fork'){
    const held=s.app.store.list('agent-admission').find(a=>a.sessionId===root.id);assert.equal(held.spawnRequested,true);assert.ok(held.workerPid);assert.equal(held.state,'stopping');assert.equal(s.app.agentAdmission.snapshot().counts.held,1);
    assert.equal(s.app.budget.summary(intent.id).unknown,1);assert.throws(()=>s.app.wakeups.retry(USER,wakeup.id),{code:'WAKEUP_NOT_RETRYABLE'});
   }else{
    assert.equal(wakeup.generation,undefined);assert.equal(wakeup.attempts,0);assert.equal(s.app.budget.summary(intent.id).used,0);
    s.app.wakeups.retry(USER,wakeup.id);fail=false;
    for(let i=0;i<150;i++){host.tick();wakeup=s.app.wakeups.get(USER,wakeup.id);if(wakeup.state==='completed')break;await new Promise(r=>setTimeout(r,20));}
    assert.equal(wakeup.state,'completed');assert.equal(calls,2);assert.equal(s.app.budget.summary(intent.id).used,1);
   }
  }finally{s.app.store.db.exec=execute;await host.stop();s.close();}
 }
});
