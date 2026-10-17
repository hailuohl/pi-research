import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {createServer} from 'node:http';
import {writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {inputEnvelope} from '../../dist/packages/pi-adapter/attachment-input.js';
async function until(predicate){const end=Date.now()+20000;while(Date.now()<end){if(predicate())return;await delay(10);}assert.fail('queue fixture timed out');}

function approvedNotice(s,a,operation,key){
 const input=operation==='literature_search'?{query:'offline '+key}:{title:key,content:'fixed '+key};
 assert.throws(()=>s.app.operations.execute(a,operation,input,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:key}),{code:'APPROVAL_REQUIRED'});
 const action=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);s.app.sessionPermissions.decide(USER,s.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true});
 return {action,notice:s.app.sessions.messages(USER,s.session.id).find(m=>m.approvalNoticeId===action.id)};
}

for(const [initialNetwork,nextOperation,compatible] of [[false,'literature_search',false],[true,'artifact_create',false],[false,'artifact_create',false]])test(`approval steer ${initialNetwork?'network':'text-capable'} to ${nextOperation} ${compatible?'is consumed by the same worker':'waits for the next worker catalog'}`,async()=>{
 const s=setup(),entry=join(s.dir,'approval-scope-worker.mjs'),events=[];
 writeFileSync(entry,`process.on('message',m=>{if(m.type==='start')process.send({type:'assistant_message',content:JSON.stringify({fixture:'start',execute:m.tools.some(t=>t.name==='session_action_execute')})});if(m.type==='steer'){process.send({type:'message_ack',messageId:m.messageId});process.send({type:'input_consumed',messageId:m.messageId});if(!m.content.includes('固定操作 '))return;for(const [tool,input,requestId] of [['research_action_prepare',{kind:'history',history:{kind:'reports'}},1],['session_action_execute',{actionId:m.content.match(/固定操作 ([a-f0-9]{64})/)[1]},2]]){process.send({type:'tool_execution_start',tool,toolCallId:'approval-'+requestId});process.send({type:'tool',tool,toolCallId:'approval-'+requestId,requestId,input});}}if(m.type==='tool_response')process.send({type:'assistant_message',content:JSON.stringify({fixture:'response',requestId:m.requestId,result:m.result,error:m.error})});if(m.type==='fixture_finish'||m.type==='abort')process.send({type:'done'});});`);
 s.app.sessionPermissions.initialize(s.session.id,'confirm');const host=new AgentHost(s.app,{inspect:()=>({ready:true}),workerEntry:entry});
 try{
  let initial=s.app.sessions.send(USER,s.session.id,{content:'initial human request'});host.tick();let active=host.active.get(s.session.id);active.child.on('message',m=>{if(m.type==='assistant_message')events.push(JSON.parse(m.content));});await until(()=>events.some(e=>e.fixture==='start'));
  if(initialNetwork){initial=approvedNotice(s,active.actor,'literature_search','initial-network').notice;active.child.send({type:'fixture_finish'});await until(()=>!host.active.size);host.tick();active=host.active.get(s.session.id);assert.ok(active,JSON.stringify(s.app.store.get('session',s.session.id)));active.child.on('message',m=>{if(m.type==='assistant_message')events.push(JSON.parse(m.content));});await until(()=>events.filter(e=>e.fixture==='start').length===2);}
  assert.equal(active.advertisedTools.has('session_action_execute'),!initialNetwork);
  if(initialNetwork){const human=s.app.sessions.send(USER,s.session.id,{content:'ordinary steer during a network approval'});s.app.sessions.queueAction(USER,s.session.id,{messageId:human.id,expectedVersion:human.version,action:'steer'});host.tick();await until(()=>active.consumedIds.has(human.id));assert.equal(active.currentMessageId,human.id);active.advertisedTools=undefined;assert.equal(host.advertisedTools(active).has('session_action_execute'),false,'fallback retains the launch approval identity after an ordinary steer');}
  const {action,notice}=approvedNotice(s,active.actor,nextOperation,'next-approval'),steer=s.app.sessions.queueAction(USER,s.session.id,{messageId:notice.id,expectedVersion:notice.version,action:'steer'});host.tick();
  if(compatible){
   await until(()=>events.filter(e=>e.fixture==='response').length===2);assert.equal(active.currentMessageId,null);assert.ok(active.consumedIds.has(steer.id));assert.equal(host.contextRecoveryEligible(active),false);assert.equal(events.find(e=>e.requestId===1).error.code,'RESEARCH_ACTION_ORIGIN_REQUIRED');assert.equal(events.find(e=>e.requestId===2).result.actionId,action.id);assert.equal(s.app.store.get('session-action',action.id).state,'completed');assert.equal(active.advertisedTools.has('session_action_execute'),true,'startup catalog stays fixed after consumption');
  }else{assert.equal(s.app.store.get('message',steer.id).status,'queued');assert.equal(active.messageIds.includes(steer.id),false);assert.equal(active.consumedIds.has(steer.id),false);}
  active.child.send({type:'fixture_finish'});await until(()=>!host.active.size);assert.equal(s.app.store.get('message',initial.id).status,'completed');
  if(compatible)assert.equal(s.app.store.get('message',steer.id).status,'completed');
  else{assert.equal(s.app.store.get('message',steer.id).status,'queued');host.tick();const next=host.active.get(s.session.id);assert.ok(next);assert.notEqual(next.child.pid,active.child.pid);assert.equal(next.advertisedTools.has('session_action_execute'),nextOperation==='artifact_create');assert.equal(next.currentMessageId,null);next.child.send({type:'fixture_finish'});await until(()=>!host.active.size);assert.equal(s.app.store.get('message',steer.id).status,'completed');}
 }finally{await host.stop();s.close();}
});

test('actual Host IPC pins a pending tool to its old input and binds a consumed human steer to new requests',async()=>{
 const s=setup(),entry=join(s.dir,'research-origin-worker.mjs'),responses=[];
 writeFileSync(entry,`const input={kind:'history',history:{kind:'reports'}};let replies=0;const begin=id=>process.send({type:'tool_execution_start',tool:'research_action_prepare',toolCallId:id});const call=(id,requestId)=>process.send({type:'tool',tool:'research_action_prepare',toolCallId:id,requestId,input});process.on('message',m=>{if(m.type==='start'){begin('initial');call('initial',1);}if(m.type==='tool_response'){process.send({type:'assistant_message',content:JSON.stringify({fixtureResponse:m.requestId,result:m.result,error:m.error})});if(m.requestId===1)begin('old-pending');else if(++replies===3)process.send({type:'done'});}if(m.type==='steer'){if(!m.content.endsWith('\\n\\n<pi-research-input:'+m.messageId+'>'))throw Error('Missing host input envelope');process.send({type:'message_ack',messageId:m.messageId});process.send({type:'input_consumed',messageId:'not-delivered'});process.send({type:'input_consumed',messageId:m.messageId});call('old-pending',2);begin('new-call');call('new-call',3);call('missing-start',4);}if(m.type==='abort')process.send({type:'done',aborted:true});});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true}),workerEntry:entry});
 try{
  const initial=s.app.sessions.send(USER,s.session.id,{content:'Read existing reports'});host.tick();const active=host.active.get(s.session.id);active.child.on('message',m=>{if(m.type==='assistant_message')responses.push(JSON.parse(m.content));});
  await until(()=>active.callIdActors?.has('old-pending'));const original=s.app.store.list('research-action',s.project.id)[0];assert.equal(original.originMessageId,initial.id);assert.equal(active.callIdActors.get('old-pending').actor.messageId,initial.id);
  s.app.operations.execute(USER,'research_action_decide',{requestId:original.id,expectedVersion:1,decision:'dismiss'},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'reject-original'});
  const queued=s.app.sessions.send(USER,s.session.id,{content:'Please read reports again'}),steer=s.app.sessions.queueAction(USER,s.session.id,{messageId:queued.id,expectedVersion:queued.version,action:'steer'});host.tick();assert.equal(s.app.store.get('message',steer.id).generation,active.generation);
  await until(()=>host.active.size===0);const requests=s.app.store.list('research-action',s.project.id);assert.equal(requests.length,2);assert.equal(requests.find(r=>r.id===original.id).state,'rejected');assert.equal(requests.find(r=>r.id!==original.id).originMessageId,steer.id);assert.equal(requests.find(r=>r.id!==original.id).state,'pending');
  assert.equal(responses.find(r=>r.fixtureResponse===2).result.id,original.id);assert.equal(responses.find(r=>r.fixtureResponse===2).result.state,'rejected');assert.equal(responses.find(r=>r.fixtureResponse===4).error.code,'RESEARCH_ACTION_ORIGIN_REQUIRED');assert.equal(active.actor.messageId,initial.id);assert.equal(active.callIdActors.get('new-call').actor.messageId,steer.id);assert.equal(s.app.store.get('message',steer.id).status,'completed');
 }finally{await host.stop();s.close();}
});

test('Host launches writer-claimed edited body; queued follow-up stays editable and ACK alone is not consumption',async()=>{
 const s=setup(),entry=join(s.dir,'queue-worker.mjs');
 writeFileSync(entry,`process.on('message',m=>{if(m.type==='start')process.send({type:'assistant_message',content:m.prompt});if(m.type==='steer'){process.send({type:'message_ack',messageId:m.messageId});setTimeout(()=>process.send({type:'done'}),100);}if(m.type==='abort')process.send({type:'done',aborted:true});});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true}),workerEntry:entry});
 try{
  const initial=s.app.sessions.send(USER,s.session.id,{content:'stale body'}),claim=host.claimSession.bind(host);let edited=false;
  host.claimSession=(...args)=>{if(!edited){edited=true;s.app.sessions.queueAction(USER,s.session.id,{messageId:initial.id,expectedVersion:initial.version,action:'edit',content:'writer latest body'});}return claim(...args);};
  host.tick();await until(()=>s.app.sessions.messages(USER,s.session.id).some(m=>m.role==='assistant'));
  assert.equal(s.app.sessions.messages(USER,s.session.id).find(m=>m.role==='assistant').content,'writer latest body'+inputEnvelope(initial.id));
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
  assert.deepEqual(users.slice(-4),['duplicate','duplicate','/skill:missing args','/missing-template args'].map((content,i)=>content+inputEnvelope(steers[i].id)));
  host.tick();assert.notEqual(host.active.get(row.id)?.child.pid,initialPid);await until(()=>host.active.size===0);assert.equal(s.app.store.get('message',follow.id).status,'completed');
 }finally{releaseFirst();await host.stop();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));s.close();}
});
