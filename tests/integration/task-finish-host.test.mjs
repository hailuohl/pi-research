import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {writeFileSync,chmodSync} from 'node:fs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {setup,USER,approve} from '../support/research.mjs';
import {startTeam,spec} from '../support/collaboration.mjs';
import {publicationFixture} from '../support/publication.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const deps={inspect:()=>({ready:true,code:'OFFLINE_IPC',message:'Fixture, no model'}),workerEntry:resolve('tests/fixtures/task-finish-worker.mjs')};
async function until(h,fn){for(let i=0;i<250;i++){h.tick();if(fn())return;await pause(20);}throw Error('Host lifecycle fixture timeout');}
function start(s,h,mode,outcome='completed'){const team=startTeam(s,[spec('finish',{objective:`HOST_FINISH ${mode} ${outcome}`})]);h.tick();return s.app.teams.tasks(USER,team.id)[0];}

test('publication review streaming uses cheap fences while tools and heartbeats still verify fixed inputs',async t=>{
 for(const stale of [false,true])await t.test(stale?'changed input is fenced':'normal stream and submission',async()=>{
  const s=setup(),h=new AgentHost(s.app,deps);
  try{
   const fixture=publicationFixture(s.app,s.project.id),project=s.app.projects.get(USER,s.project.id);
   s.app.projects.settings(USER,project.id,{expectedVersion:project.version,enabled:true});
   const review=s.app.publicationReviews.prepare(USER,project.id,{resultId:fixture.result.id,rootSessionId:s.session.id});
   approve(s.app,review.approvalId);s.app.teams.activate(USER,review.teamId);
   let validations=0;const original=s.app.teams.reviewValidator;
   s.app.teams.reviewValidator=task=>{validations++;return original(task);};
   h.tick();const task=s.app.teams.tasks(USER,review.teamId)[0],active=h.active.get(task.sessionId),initial=validations;
   assert.ok(active);
   // Hold the heartbeat clock while draining a real IPC burst; no timing threshold or mock delta handler.
   for(let i=0;i<250;i++){
    active.lastHeartbeat=Date.now();
    if(s.app.store.events().filter(e=>e.type==='session.delta'&&e.payload.sessionId===task.sessionId).length===160)break;
    await pause(20);
   }
   assert.equal(s.app.store.events().filter(e=>e.type==='session.delta'&&e.payload.sessionId===task.sessionId).length,160);
   assert.equal(validations,initial,'160 chunks must not trigger fixed artifact revalidation');
   if(stale){
    await h.tools.execute(active.actor,'task_context_read',{},'cached-context');
    const artifact=s.app.store.get('artifact',fixture.result.pdf.artifactId);
    const artifactPath=s.app.store.paths.physical(artifact.path);chmodSync(artifactPath,0o600);writeFileSync(artifactPath,'UNIT changed fixed PDF');
    const replay=new Promise(resolve=>{const receive=m=>{if(m.type==='fixture_context_result'){active.child.off('message',receive);resolve(m);}};active.child.on('message',receive);});
    active.child.send({type:'fixture_context'});
    const replayed=await replay;assert.equal(replayed.hasResult,false,'cached reads must not bypass the Host input check');assert.equal(replayed.errorCode,'ARTIFACT_CORRUPTED');
    await assert.rejects(h.tools.execute(active.actor,'task_context_read',{},'stale-context'));
    assert.ok(validations>initial,'controlled tools still deeply validate immediately');
    const before=validations,lease=s.app.store.get('task-attempt',task.attemptId).leaseUntil;active.lastHeartbeat=Date.now()-3001;h.tick();
    assert.ok(validations>before&&validations<=before+2,'heartbeat and dispatch checks remain bounded');assert.ok(active.stopError,'heartbeat rejects stale inputs before renewing the lease');
    assert.equal(s.app.store.get('task-attempt',task.attemptId).leaseUntil,lease);
    await until(h,()=>h.active.size===0);
    assert.equal(s.app.sessions.get(USER,task.sessionId).state,'failed');
    assert.equal(s.app.store.list('task-result').length,0);
   }else{
    active.lastHeartbeat=Date.now()-3001;h.tick();assert.ok(validations>initial&&validations<=initial+2,'heartbeat plus the normal team dispatch check verify fixed inputs');
    active.child.send({type:'fixture_submit'});await until(h,()=>h.active.size===0);
    assert.equal(s.app.sessions.get(USER,task.sessionId).state,'idle');
    assert.equal(s.app.store.get('task-attempt',task.attemptId).state,'finished');
    assert.equal(s.app.store.list('task-result').length,1);
    assert.ok(validations<20,'remaining verification is bounded by tools, not chunks');
   }
   assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
  }finally{await h.stop();s.close();}
 });
});

test('committed completed, partial and blocked results drain normally, fence new writes and settle once',async t=>{
 for(const outcome of ['completed','partial','blocked'])await t.test(outcome,async()=>{
  const s=setup(),h=new AgentHost(s.app,deps);
  try{
   const task=start(s,h,'normal',outcome);
   await until(h,()=>s.app.store.get('task-attempt',task.attemptId).state==='finished');
   assert.equal(s.app.agentAdmission.snapshot().counts.held,1,'committed result cannot release a live child');
   await until(h,()=>h.active.size===0);
   const session=s.app.sessions.get(USER,task.sessionId),finished=s.app.store.get('task',task.id);
   assert.equal(session.state,'idle');assert.equal(session.lastError,undefined);
   assert.equal(finished.result.outcome,outcome);assert.equal(finished.execution,outcome==='completed'?'output_submitted':'blocked');
   assert.equal(finished.acceptance,outcome==='completed'?'accepted':'pending');
   assert.equal(s.app.store.list('task-result').length,1);assert.equal(s.app.budget.summary(task.teamId).used,1);
   assert.equal(s.app.budget.summary(task.teamId).unknown,0);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
   assert.equal(s.app.sessions.messages(USER,task.sessionId).filter(m=>m.status==='failed').length,0);
  }finally{await h.stop();s.close();}
 });
});

test('real error, unsolicited abort, and process exit stay failed after a durable result',async t=>{
 for(const mode of ['provider','aborted','crash'])await t.test(mode,async()=>{
  const s=setup(),h=new AgentHost(s.app,deps);
  try{
   const task=start(s,h,mode);await until(h,()=>h.active.size===0);
   const session=s.app.sessions.get(USER,task.sessionId);
   assert.equal(session.state,'failed');assert.match(session.lastError,mode==='provider'?/fixture failure/:mode==='aborted'?/中止/:/Worker 退出/);
   assert.equal(s.app.store.get('task-attempt',task.attemptId).state,'finished');
   assert.equal(s.app.store.get('task',task.id).result.outcome,'completed');assert.equal(s.app.store.list('task-result').length,1);
   assert.equal(s.app.budget.summary(task.teamId).used,1);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
  }finally{await h.stop();s.close();}
 });
});

test('a settled helper with no result fails the session without turning known usage into unknown',async()=>{
 const s=setup(),h=new AgentHost(s.app,deps);
 try{const task=start(s,h,'missing');await until(h,()=>h.active.size===0);
  assert.equal(s.app.sessions.get(USER,task.sessionId).state,'failed');assert.match(s.app.sessions.get(USER,task.sessionId).lastError,/没有提交结构化结果/);
  assert.equal(s.app.store.get('task-attempt',task.attemptId).state,'failed');assert.equal(s.app.store.list('task-result').length,0);
  assert.equal(s.app.budget.summary(task.teamId).used,1);assert.equal(s.app.budget.summary(task.teamId).unknown,0);
 }finally{await h.stop();s.close();}
});

test('cancel, newer session generation and timeout cannot be revived by late IPC',async t=>{
 for(const action of ['cancel','interrupt','timeout'])await t.test(action,async()=>{
  const s=setup(),h=new AgentHost(s.app,deps);
  try{
   const task=start(s,h,'hold');await until(h,()=>h.active.get(task.sessionId)?.child.connected);
   // The timeout path keeps its valid generation; cancellation paths must fence late output.
   if(action==='cancel')s.app.teams.cancel(USER,task.id);
   else if(action==='interrupt')s.app.sessions.interrupt(USER,task.sessionId);
   else h.active.get(task.sessionId).started=Date.now()-300001;
   await until(h,()=>h.active.size===0);
   assert.equal(s.app.sessions.get(USER,task.sessionId).state,action==='interrupt'?'interrupted':'failed');
   assert.equal(s.app.store.list('task-result').length,0);assert.equal(s.app.budget.summary(task.teamId).unknown,1);
   assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
   if(action!=='timeout')assert.equal(s.app.sessions.messages(USER,task.sessionId).length,0,'stale generation output must not persist');
   assert.equal(s.app.store.events().some(e=>e.type==='task.progress'&&JSON.stringify(e.payload).includes('LATE_ABORT_WRITE')),false);
  }finally{await h.stop();s.close();}
 });
});
