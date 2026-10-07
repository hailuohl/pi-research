import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {join,resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
import {once} from 'node:events';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {setup,USER,campaign,enroll,submit,fixtureFinish} from '../support/research.mjs';
import {startTeam,spec} from '../support/collaboration.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const deps={inspect:()=>({ready:true,code:'UNIT_FIXTURE',message:'No model calls'}),workerEntry:resolve('tests/fixtures/ipc-worker.mjs')};
const config=(s,maxWorkers)=>{const project=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,project.id,{expectedVersion:project.version,maxActiveAgents:Math.max(2,maxWorkers),maxConcurrentAssistants:Math.min(project.settings.maxConcurrentAssistants,Math.max(1,maxWorkers-1))});};
async function until(fn){for(let n=0;n<150;n++){if(fn())return;await pause(20);}throw new Error('Fixture condition timed out');}

test('legacy host cap cannot limit multiple local sessions but project quota and duplicate fencing remain',()=>{
 const s=setup();try{config(s,4);const legacy=s.app.store.get('agent-capacity','global');s.app.store.update('agent-capacity',legacy.id,legacy.version,{maxWorkers:1});
  const sessions=[s.session,...Array.from({length:4},(_,i)=>s.app.sessions.create(USER,s.project.id,{title:'unlimited '+i}))];
  for(const session of sessions.slice(0,4))assert.ok(s.app.agentAdmission.tryAcquire(session,1,'fixture'));
  assert.equal(s.app.agentAdmission.tryAcquire(sessions[4],1,'fixture'),null);assert.equal(s.app.agentAdmission.tryAcquire(sessions[0],2,'other'),null);assert.equal(s.app.agentAdmission.snapshot().maxWorkers,null);assert.equal(s.app.agentAdmission.snapshot(s.project.id).project.available,0);
 }finally{s.close();}
});

test('two Hosts with independent Store connections share project worker limits and release only on child exit',async()=>{
 const s=setup(),other=new ResearchApp(s.dir,process.cwd()),a=new AgentHost(s.app,deps),b=new AgentHost(other,deps);
 try {
  config(s,2);for(let n=0;n<4;n++){const session=n===0?s.session:s.app.sessions.create(USER,s.project.id,{title:'parallel '+n});s.app.sessions.send(USER,session.id,{content:'UNIT real-fork fixture '+n});}
  a.tick();b.tick();assert.equal(s.app.agentAdmission.inspect(USER).counts.held,2);assert.equal(a.active.size+b.active.size,2);assert.equal(b.status().maxModelWorkers,null);assert.equal(b.status().httpConcurrencyMeasured,false);
  await a.stop();assert.equal(s.app.agentAdmission.inspect(USER).counts.held,0);b.tick();assert.equal(s.app.agentAdmission.inspect(USER).counts.held,2);
 }finally{await a.stop();await b.stop();other.close();s.close();}
});

test('project total, project assistant and team assistant quotas count durable workers independently',()=>{
 const s=setup();try {
  config(s,8);const p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true,maxActiveAgents:3,maxConcurrentAssistants:2});
  const lowProject=s.app.projects.get(USER,p.id);s.app.projects.settings(USER,p.id,{expectedVersion:lowProject.version,maxConcurrentAssistants:1});const one=startTeam(s,[spec('one',{role:'implementer'}),spec('two',{role:'implementer'})]);
  const raised=s.app.projects.get(USER,p.id);s.app.projects.settings(USER,p.id,{expectedVersion:raised.version,maxConcurrentAssistants:2});const two=startTeam(s,[spec('other',{role:'reviewer'})]);
  const x=s.app.teams.claim(two.id);assert.ok(x);const y=s.app.teams.claim(one.id);assert.ok(y,'another team running must not consume this team-specific ceiling');
  const service=s.app.agentAdmission,root=service.tryAcquire(s.session,1,'host');assert.ok(root);
  const sx=s.app.store.get('session',x.attempt.sessionId),sy=s.app.store.get('session',y.attempt.sessionId);
  assert.ok(service.tryAcquire(sx,1,'host',two.id));assert.ok(service.tryAcquire(sy,1,'host',one.id));
  assert.equal(service.check(s.project.id,'coordinator'),false);assert.equal(service.check(s.project.id,'reviewer',two.id),false);assert.equal(service.snapshot(s.project.id).project.assistantHeld,2);
  service.release(root.id,'host',1,'not-forked');assert.equal(service.check(s.project.id,'coordinator'),true);assert.equal(service.check(s.project.id,'implementer',one.id),false);
  assert.equal(JSON.stringify(service.inspect(USER,s.project.id)).includes('workerPid'),false);assert.equal(JSON.stringify(service.inspect(USER,s.project.id)).includes('ownerHost'),false);
  assert.throws(()=>service.configure({type:'agent',projectId:s.project.id},{expectedVersion:service.snapshot().version,maxWorkers:32}),{code:'PERMISSION_DENIED'});
  assert.throws(()=>service.configure(USER,{expectedVersion:1,maxWorkers:32}),{code:'HOST_CAPACITY_DISABLED'});
 }finally{s.close();}
});

test('a PID confirmed gone releases the worker slot without refunding unknown attempt usage',async()=>{
 const s=setup();let child;try {
  const team=startTeam(s,[spec('gone')]),claimed=s.app.teams.claim(team.id),session=s.app.store.get('session',claimed.attempt.sessionId),service=s.app.agentAdmission,slot=service.tryAcquire(session,1,'crashed-host',team.id);
  service.markSpawnRequested(slot.id,'crashed-host',1);child=fork(deps.workerEntry,[],{stdio:['ignore','ignore','ignore','ipc']});service.markRunning(slot.id,'crashed-host',1,child.pid);
  const stopped=once(child,'exit');child.kill('SIGKILL');await stopped;
  s.app.teams.fail(claimed.attempt.id,'UNIT lost worker usage',true);const current=s.app.store.get('agent-admission',slot.id);s.app.store.update('agent-admission',slot.id,current.version,{leaseUntil:0});service.recover();
  assert.equal(service.snapshot().counts.held,0);assert.equal(s.app.budget.summary(team.id).unknown,1);
 }finally{child?.kill('SIGKILL');s.close();}
});

test('submitted task keeps its worker slot until the actual child exits',async()=>{
 const s=setup();let child,realKill;const worker=join(s.dir,'holding-worker.mjs');
 writeFileSync(worker,`// Deterministic test IPC only; no SDK or model.\nsetInterval(()=>{},1000);process.on('message',m=>{if(m.type==='start')process.send({type:'tool',tool:'task_result_submit',requestId:1,toolCallId:'unit-result',input:{summary:'unit fixture',outcome:'completed',artifactIds:[],evidenceIds:[],claims:[],unresolvedQuestions:[]}});if(m.type==='tool_response')process.send({type:'done'});});`);
 const h=new AgentHost(s.app,{...deps,workerEntry:worker,fork:(...args)=>{child=fork(...args);realKill=child.kill.bind(child);child.kill=()=>true;return child;}});
 try {config(s,1);const team=startTeam(s,[spec('done'),spec('waiting')]);h.tick();await until(()=>s.app.teams.tasks(USER,team.id).some(t=>t.execution==='output_submitted'));await until(()=>s.app.agentAdmission.snapshot().counts.stopping===1);h.tick();assert.equal(s.app.agentAdmission.snapshot().counts.held,1);assert.equal(s.app.teams.tasks(USER,team.id).filter(t=>t.execution==='pending').length,1);assert.equal(h.active.size,1);realKill('SIGKILL');await until(()=>s.app.agentAdmission.snapshot().counts.held===0);
 }finally{if(child&&realKill){child.kill=realKill;realKill('SIGKILL');}await h.stop();s.close();}
});

test('unknown slots are conservative, stale owners cannot release them, and recovery rechecks refreshed leases',()=>{
 const s=setup();try {
  const service=s.app.agentAdmission,slot=service.tryAcquire(s.session,1,'owner');service.markSpawnRequested(slot.id,'owner',1);
  let current=s.app.store.get('agent-admission',slot.id);s.app.store.update('agent-admission',slot.id,current.version,{leaseUntil:0});service.recover();current=s.app.store.get('agent-admission',slot.id);assert.equal(current.state,'unknown');service.recover();assert.equal(s.app.store.get('agent-admission',slot.id).version,current.version);
  assert.throws(()=>service.release(slot.id,'owner',1,'not-forked'),{code:'ADMISSION_RELEASE_DENIED'});assert.throws(()=>service.release(slot.id,'other-owner',1,'confirmed-exit'),{code:'LEASE_EXPIRED'});assert.throws(()=>service.release(slot.id,'owner',2,'confirmed-exit'),{code:'LEASE_EXPIRED'});
  service.release(slot.id,'owner',1,'confirmed-exit');const fresh=service.tryAcquire(s.session,2,'next-owner');service.release(slot.id,'owner',1,'confirmed-exit');assert.equal(s.app.store.get('agent-admission',fresh.id).state,'reserved');
  s.app.store.update('agent-admission',fresh.id,fresh.version,{leaseUntil:0});const originalTransaction=s.app.store.transaction.bind(s.app.store);let admissionRenewed=false;s.app.store.transaction=fn=>{if(!admissionRenewed){admissionRenewed=true;originalTransaction(()=>{const latest=s.app.store.get('agent-admission',fresh.id);s.app.store.update('agent-admission',latest.id,latest.version,{leaseUntil:Date.now()+30000});});}return originalTransaction(fn);};try{service.recover();}finally{s.app.store.transaction=originalTransaction;}assert.equal(s.app.store.get('agent-admission',fresh.id).state,'reserved');
  const team=startTeam(s,[spec('race')]),claimed=s.app.teams.claim(team.id),attempt=s.app.store.get('task-attempt',claimed.attempt.id);s.app.store.update('task-attempt',attempt.id,attempt.version,{leaseUntil:0});
  const transaction=s.app.store.transaction.bind(s.app.store);let renewed=false;s.app.store.transaction=fn=>{if(!renewed){renewed=true;transaction(()=>{const a=s.app.store.get('task-attempt',attempt.id);s.app.store.update('task-attempt',a.id,a.version,{leaseUntil:Date.now()+30000});});}return transaction(fn);};
  try{s.app.teams.recover();}finally{s.app.store.transaction=transaction;}assert.equal(s.app.store.get('task-attempt',attempt.id).state,'running');assert.equal(s.app.budget.summary(team.id).unknown,0);
 }finally{s.close();}
});

test('expired admission before any fork request releases capacity and fences the old owner without changing budget',()=>{
 const s=setup();try {
  config(s,1);const team=startTeam(s,[spec('not-forked')]),claimed=s.app.teams.claim(team.id),session=s.app.store.get('session',claimed.attempt.sessionId),service=s.app.agentAdmission;
  const slot=service.tryAcquire(session,1,'crashed-before-fork',team.id),budget=s.app.budget.summary(team.id);
  s.app.store.update('agent-admission',slot.id,slot.version,{leaseUntil:0});service.recover();
  assert.equal(service.snapshot().counts.held,0);assert.equal(service.snapshot().available,null);assert.deepEqual(s.app.budget.summary(team.id),budget);
  assert.throws(()=>service.markSpawnRequested(slot.id,'crashed-before-fork',1),{code:'LEASE_EXPIRED'});
 }finally{s.close();}
});

test('synchronous fork failure releases admission and unspent wakeup budget',async()=>{
 const s=setup(),h=new AgentHost(s.app,{...deps,fork:()=>{throw new Error('UNIT synchronous fork failure');}});
 try{const c=campaign(s,{autoAnalyze:true}),run=submit(s,enroll(s,c));fixtureFinish(s,run);h.tick();assert.equal(s.app.agentAdmission.snapshot().counts.held,0);const wakeup=s.app.wakeups.list(USER,s.project.id)[0];assert.equal(wakeup.state,'failed');assert.equal(s.app.budget.summary(c.id).used,0);assert.equal(s.app.budget.summary(c.id).reserved,0);assert.equal(s.app.budget.summary(c.id).unknown,0);}finally{await h.stop();s.close();}
});
