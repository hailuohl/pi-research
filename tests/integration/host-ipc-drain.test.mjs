import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {setup,USER} from '../support/research.mjs';

// Real child IPC only. A busy parent can observe exit before the child's final messages.
for(const hasDone of [true,false])test(`host drains exited worker IPC ${hasDone?'before accepting done':'before declaring missing done'}`,async()=>{
 const s=setup(),worker=join(s.dir,'ipc-drain.mjs');
 writeFileSync(worker,`process.on('message',m=>{if(m.type!=='start')return;process.send({type:'delta',deltaId:1,text:'fixture preview'});setTimeout(()=>{process.send({type:'tool',tool:'artifact_create',requestId:1,toolCallId:'after-exit',input:{title:'must-not-exist.txt',content:'late side effect'}});process.send({type:'assistant_message',content:'complete fixture answer',stopReason:'stop',usage:{fixture:true}});${hasDone?"process.send({type:'done'});":''}setTimeout(()=>process.exit(0),50);},20);});`);
 const h=new AgentHost(s.app,{inspect:()=>({ready:true,code:'IPC_FIXTURE',message:'No SDK or model'}),workerEntry:worker}),events=[];let exitState;
 try{
  const input=s.app.sessions.send(USER,s.session.id,{content:'offline IPC drain fixture'});h.tick();
  const active=h.active.get(s.session.id),child=active.child;
  let blocked=false;
  child.prependListener('message',message=>{events.push(message.type);if(message.type==='delta'&&!blocked){blocked=true;const end=Date.now()+1200;while(Date.now()<end){/* Simulate synchronous host processing while the child completes. */}}});
  child.on('exit',()=>{events.push('exit');h.tick();exitState={observed:active.exitObserved,held:s.app.agentAdmission.snapshot().counts.held,state:s.app.sessions.get(USER,s.session.id).state};});
  child.on('close',()=>events.push('close'));
  const end=Date.now()+7000;while(h.active.size&&Date.now()<end)await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(h.active.size,0,JSON.stringify(events));
  assert.ok(events.includes('close'));assert.ok(events.includes('assistant_message'));
  // Windows reproduces the production ordering; other platforms may drain IPC before exit.
  if(process.platform==='win32')assert.ok(events.indexOf('exit')<events.indexOf('assistant_message'),JSON.stringify(events));
  const exitedBeforeOutput=events.indexOf('exit')<events.indexOf('assistant_message');
  if(exitedBeforeOutput){assert.deepEqual(exitState,{observed:true,held:1,state:'running'});assert.equal(s.app.store.list('artifact').some(a=>a.title==='must-not-exist.txt'),false,'buffered tools cannot run after confirmed exit');}
  const messages=s.app.sessions.messages(USER,s.session.id),assistant=messages.find(m=>m.role==='assistant');
  assert.equal(assistant?.content,'complete fixture answer');assert.equal(assistant.status,'completed');
  assert.equal(s.app.store.list('model-usage').length,1);
  assert.equal(s.app.sessions.get(USER,s.session.id).state,hasDone?'idle':'failed');
  assert.equal(s.app.store.get('message',input.id).status,hasDone?'completed':'failed');
  if(!hasDone)assert.match(s.app.sessions.get(USER,s.session.id).lastError,/Worker 退出/);
  assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
 }finally{await h.stop();s.close();}
});
