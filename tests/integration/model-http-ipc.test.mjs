import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
import {fork} from 'node:child_process';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {setup,USER} from '../support/research.mjs';
import {startTeam,spec} from '../support/collaboration.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms)),deps={inspect:()=>({ready:true,code:'IPC_FIXTURE',message:'No model/network'}),workerEntry:resolve('tests/fixtures/model-http-worker.mjs')};
async function until(fn){const end=Date.now()+10000;while(Date.now()<end){if(fn())return;await pause(20);}throw Error('IPC fixture did not settle');}

test('two Workers settle HTTP during micro-delta floods without replay or preview after final',async()=>{
 const s=setup(),stats=[],deltaCounts=new Map(),h=new AgentHost(s.app,{...deps,fork:(...args)=>{const child=fork(...args);child.on('message',m=>{if(m.type==='fixture_stats')stats.push(m.requests);});return child;}}),receive=h.onMessage.bind(h),wait=new Int32Array(new SharedArrayBuffer(4));
 h.onMessage=async(a,m,...rest)=>{if(m.type==='delta'){deltaCounts.set(a.sessionId,(deltaCounts.get(a.sessionId)??0)+1);Atomics.wait(wait,0,0,10);}return receive(a,m,...rest);};
 try{
  const second=s.app.sessions.create(USER,s.project.id,{title:'second flood fixture'}),sessions=[s.session,second];
  for(const session of sessions){s.app.sessions.send(USER,session.id,{content:'flood micro-deltas'});h.tick();}
  await until(()=>h.active.size===0);
  assert.deepEqual(stats,[1,1],'one fake external request per Worker');
  const rows=s.app.modelHttp.inspect(USER,s.project.id).items;assert.equal(rows.length,2);assert.ok(rows.every(r=>r.state==='succeeded'));
  for(const session of sessions){
   const current=s.app.sessions.get(USER,session.id);assert.equal(current.state,'idle',current.lastError);assert.ok(deltaCounts.get(session.id)<=2);
   const messages=s.app.sessions.messages(USER,session.id);assert.equal(messages.find(m=>m.role==='assistant').content,'微'.repeat(200));
   const events=s.app.store.events(0,s.project.id,500).filter(e=>e.payload.sessionId===session.id),final=events.find(e=>e.type==='session.message_completed');
   assert.ok(final);assert.ok(!events.some(e=>e.type==='session.delta'&&e.seq>final.seq));
  }
 }finally{await h.stop();s.close();}
});

test('a lost finish ACK preserves task failure and unknown budget even when HTTP was settled',async()=>{
 const s=setup();let receipt,identity,requests=0;
 const h=new AgentHost(s.app,{...deps,fork:(...args)=>{const child=fork(...args),send=child.send.bind(child);
  child.send=(m,...rest)=>m.type==='model_http_response'&&m.requestId===receipt?.requestId?true:send(m,...rest);
  child.on('message',m=>{if(m.type==='model_http_finish')receipt=m;if(m.type==='fixture_stats')requests+=m.requests;});return child;
 }}),receive=h.onMessage.bind(h);
 h.onMessage=async(a,m,...rest)=>{if(m.type==='model_http_finish')identity=a;return receive(a,m,...rest);};
 try{
  const team=startTeam(s,[spec('flood')]);h.tick();await until(()=>h.active.size===0);
  const task=s.app.teams.tasks(USER,team.id)[0],before=s.app.budget.summary(team.id);
  assert.equal(requests,1);assert.equal(task.execution,'failed');assert.equal(before.unknown,1);assert.equal(before.used,0);assert.equal(before.reserved,0);
  assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items[0].state,'succeeded');
  await receive(identity,receipt,'');await receive(identity,{type:'done'},'');
  assert.equal(s.app.teams.tasks(USER,team.id)[0].execution,'failed');assert.deepEqual(s.app.budget.summary(team.id),before);
  assert.match(s.app.sessions.get(USER,identity.sessionId).lastError,/MODEL_HTTP_CONTROL_TIMEOUT/);
 }finally{await h.stop();s.close();}
});

test('a catalog edit before HTTP admission does not impose image authorization on a text-only request',async()=>{
 const s=setup();let changed=false;const h=new AgentHost(s.app,{...deps,fork:(...args)=>{const child=fork(...args);child.prependListener('message',m=>{if(m.type==='model_http_acquire'&&!changed){changed=true;writeFileSync(resolve(s.dir,'models.json'),JSON.stringify({providers:{}}));}});return child;}});
 try{s.app.sessions.send(USER,s.session.id,{content:'text-only catalog control'});h.tick();await until(()=>h.active.size===0);assert.ok(changed);assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items[0].state,'succeeded');assert.equal(s.app.sessions.get(USER,s.session.id).lastError,undefined);}finally{await h.stop();s.close();}
});

for(const crash of [false,true])test(`real IPC admits two HTTP requests across two Hosts and ${crash?'recovers a confirmed child exit':'retains streamed ownership until completion'}`,async()=>{
 const s=setup(),other=new ResearchApp(s.dir,process.cwd()),replies=[],controlled={...deps,fork:(...args)=>{const child=fork(...args),send=child.send.bind(child);child.send=(m,...rest)=>{if(m.type==='model_http_response'&&m.result?.allowed){replies.push(()=>send(m,...rest));return true;}return send(m,...rest);};return child;}},a=new AgentHost(s.app,controlled),b=new AgentHost(other,controlled);try{
  const second=s.app.sessions.create(USER,s.project.id,{title:'second HTTP fixture'});
  s.app.sessions.send(USER,s.session.id,{content:crash?'crash after admission':'stream first'});a.tick();s.app.sessions.send(USER,second.id,{content:'stream second'});b.tick();
  await until(()=>replies.length===2);assert.equal(s.app.modelHttp.inspect(USER,s.project.id).counts.active,2);for(const release of replies.splice(0))release();await until(()=>a.active.size+b.active.size===0);
  const rows=s.app.modelHttp.inspect(USER,s.project.id).items;assert.equal(rows.length,2);assert.equal(rows.filter(r=>r.state==='succeeded').length,crash?1:2);
  assert.equal(rows.filter(r=>r.state==='interrupted').length,crash?1:0);const ordered=rows.sort((x,y)=>x.startedAt.localeCompare(y.startedAt));assert.ok(Date.parse(ordered[1].startedAt)<Date.parse(ordered[0].endedAt));assert.equal(s.app.modelHttp.inspect(USER).available,null);
  assert.equal(s.app.sessions.get(USER,second.id).state,'idle');assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
 }finally{await a.stop();await b.stop();other.close();s.close();}
});

test('another controller cannot cancel between task validation and HTTP admission; a committed cancel prevents dispatch',async()=>{
 const s=setup(),other=new ResearchApp(s.dir,process.cwd()),h=new AgentHost(s.app,deps);let blocked=false,retrying=false,release,cancelled=false;const barrier=new Promise(resolve=>{release=resolve;}),receive=h.onMessage.bind(h),acquire=s.app.modelHttp.acquire.bind(s.app.modelHttp);let acquisitions=0;
 h.onMessage=async(a,m,...rest)=>{if(m.type==='model_http_acquire'&&acquisitions){retrying=true;await barrier;}if(m.type==='model_http_finish'&&m.result?.state==='cancelled')cancelled=true;return receive(a,m,...rest);};
 s.app.modelHttp.acquire=(...args)=>++acquisitions===1?{allowed:false,requestId:'fixture-wait-before-dispatch'}:acquire(...args);
 try{
  other.store.db.exec('PRAGMA busy_timeout=1');const team=startTeam(s,[spec('request')]),active=s.app.teams.active.bind(s.app.teams);
  s.app.teams.active=who=>{const result=active(who);if(!blocked){assert.throws(()=>other.teams.cancel(USER,who.taskId),/locked/);blocked=true;}return result;};
  h.tick();await until(()=>retrying);assert.ok(blocked);
  const task=s.app.teams.tasks(USER,team.id)[0];other.teams.cancel(USER,task.id);release();await until(()=>h.active.size===0);
  assert.ok(cancelled);assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items.length,0);assert.equal(acquisitions,1,'cancelled retry never reaches HTTP admission');assert.equal(s.app.teams.tasks(USER,team.id)[0].execution,'cancelled');
 }finally{release();await h.stop();other.close();s.close();}
});
