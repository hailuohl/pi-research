import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {setup,USER} from '../support/research.mjs';
import {startTeam,spec} from '../support/collaboration.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const deps={inspect:()=>({ready:true,code:'OFFLINE_IPC',message:'Fixture, no model'}),workerEntry:resolve('tests/fixtures/task-finish-worker.mjs')};
async function until(h,fn){for(let i=0;i<250;i++){h.tick();if(fn())return;await pause(20);}throw Error('Host lifecycle fixture timeout');}
function start(s,h,mode,outcome='completed'){const team=startTeam(s,[spec('finish',{objective:`HOST_FINISH ${mode} ${outcome}`})]);h.tick();return s.app.teams.tasks(USER,team.id)[0];}

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
