import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {createServer} from 'node:http';
import {writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
async function until(predicate){const end=Date.now()+20000;while(Date.now()<end){if(predicate())return;await delay(10);}assert.fail('queue fixture timed out');}

test('Host launches writer-claimed edited body; queued follow-up stays editable and ACK alone is not consumption',async()=>{
 const s=setup(),entry=join(s.dir,'queue-worker.mjs');
 writeFileSync(entry,`process.on('message',m=>{if(m.type==='start')process.send({type:'assistant_message',content:m.prompt});if(m.type==='steer'){process.send({type:'message_ack',messageId:m.messageId});setTimeout(()=>process.send({type:'done'}),100);}if(m.type==='abort')process.send({type:'done',aborted:true});});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true}),workerEntry:entry});
 try{
  const initial=s.app.sessions.send(USER,s.session.id,{content:'stale body'}),claim=host.claimSession.bind(host);let edited=false;
  host.claimSession=(...args)=>{if(!edited){edited=true;s.app.sessions.queueAction(USER,s.session.id,{messageId:initial.id,expectedVersion:initial.version,action:'edit',content:'writer latest body'});}return claim(...args);};
  host.tick();await until(()=>s.app.sessions.messages(USER,s.session.id).some(m=>m.role==='assistant'));
  assert.equal(s.app.sessions.messages(USER,s.session.id).find(m=>m.role==='assistant').content,'writer latest body');
  const follow=s.app.sessions.send(USER,s.session.id,{content:'durable FIFO'});host.tick();assert.equal(s.app.store.get('message',follow.id).status,'queued');
  const edit=s.app.sessions.queueAction(USER,s.session.id,{messageId:follow.id,expectedVersion:follow.version,action:'edit',content:'FIFO edited'});assert.equal(edit.content,'FIFO edited');
  const immediate=s.app.sessions.send(USER,s.session.id,{content:'ACK does not prove consumption'}),steer=s.app.sessions.queueAction(USER,s.session.id,{messageId:immediate.id,expectedVersion:immediate.version,action:'steer'});host.tick();
  const claimed=s.app.store.get('message',steer.id);assert.equal(claimed.status,'running');
  assert.throws(()=>s.app.sessions.queueAction(USER,s.session.id,{messageId:claimed.id,expectedVersion:claimed.version,action:'cancel'}),{code:'MESSAGE_STALE'});
  const delayed=s.app.sessions.send(USER,s.session.id,{content:'promoted against old generation'}),promotion=s.app.sessions.queueAction(USER,s.session.id,{messageId:delayed.id,expectedVersion:delayed.version,action:'steer'});
  await until(()=>host.active.size===0);assert.equal(s.app.store.get('message',steer.id).status,'failed');assert.match(s.app.store.get('message',steer.id).error,/未确认处理/);assert.equal(s.app.store.get('message',follow.id).status,'queued');assert.equal(s.app.store.get('message',initial.id).status,'completed');
  host.tick();host.tick();assert.equal(s.app.store.get('message',follow.id).status,'running');assert.equal(s.app.store.get('message',promotion.id).status,'queued','old promotion cannot be injected into a new generation');
 }finally{await host.stop();s.close();}
});

test('actual Host and pinned SDK consume duplicate and slash-prefix steers in order; follow-up waits for worker exit',async()=>{
 const s=setup(),requests=[],events=[];let releaseFirst;
 const firstGate=new Promise(resolve=>releaseFirst=resolve);
 const server=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;requests.push(JSON.parse(body));const n=requests.length;if(n===1)await firstGate;res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:`queue-${n}`,object:'chat.completion.chunk',created:1,model:'fixture',choices:[{index:0,delta,finish_reason}]})}\n\n`);chunk({role:'assistant',content:`answer ${n}`});chunk({},'stop');res.end('data: [DONE]\n\n');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 writeFileSync(join(s.dir,'models.json'),JSON.stringify({providers:{'offline-queue':{api:'openai-completions',baseUrl:`http://127.0.0.1:${server.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:1024}]}}}));
 const row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{model:{provider:'offline-queue',model:'fixture',thinking:'off'}});
 const host=new AgentHost(s.app,{fork:(entry,args,options)=>fork(entry,args,{...options,env:{...options.env,PI_API_KEY:undefined,PI_OFFLINE:'1'}})});let initialPid;
 try{
  const initial=s.app.sessions.send(USER,row.id,{content:'duplicate'});host.tick();initialPid=host.active.get(row.id)?.child.pid;
  assert.ok(initialPid);host.active.get(row.id).child.on('message',m=>events.push(m));await until(()=>requests.length===1);
  const follow=s.app.sessions.send(USER,row.id,{content:'normal next worker'}),steers=[];
  for(const content of ['duplicate','duplicate','/skill:missing args','/missing-template args']){const m=s.app.sessions.send(USER,row.id,{content});steers.push(s.app.sessions.queueAction(USER,row.id,{messageId:m.id,expectedVersion:m.version,action:'steer'}));}
  host.tick();await until(()=>events.filter(e=>e.type==='message_ack').length===steers.length);
  assert.equal(s.app.store.get('message',follow.id).status,'queued');assert.equal(requests.length,1);assert.equal(s.app.agentAdmission.snapshot().counts.held,1);
  releaseFirst();await until(()=>host.active.size===0);
  assert.deepEqual(events.filter(e=>e.type==='input_consumed').map(e=>e.messageId),steers.map(m=>m.id));
  for(const m of [initial,...steers])assert.equal(s.app.store.get('message',m.id).status,'completed');
  assert.equal(s.app.store.get('message',follow.id).status,'queued');assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
  const current=s.app.sessions.get(USER,row.id),native=readFileSync(s.app.store.paths.physical(current.piSessionPath),'utf8').trim().split(/\r?\n/).map(JSON.parse),users=native.filter(e=>e.message?.role==='user').map(e=>e.message.content.filter(p=>p.type==='text').map(p=>p.text).join(''));
  assert.deepEqual(users.slice(-4),['duplicate','duplicate','/skill:missing args','/missing-template args']);
  host.tick();assert.notEqual(host.active.get(row.id)?.child.pid,initialPid);await until(()=>host.active.size===0);assert.equal(s.app.store.get('message',follow.id).status,'completed');
 }finally{releaseFirst();await host.stop();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));s.close();}
});
