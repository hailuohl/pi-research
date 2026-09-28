import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
const start=(s,generation)=>{const row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation});s.app.store.event(s.project.id,'agent.started',{sessionId:row.id,generation});};
const delta=(s,generation,text,truncated=false)=>s.app.store.event(s.project.id,'session.delta',{sessionId:s.session.id,generation,text,truncated});
const finishMessage=(s,generation,content)=>s.app.store.transaction(()=>{const m=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'assistant',content,mode:'prompt',status:'completed'});s.app.store.event(s.project.id,'session.message_completed',{sessionId:s.session.id,generation,messageId:m.id});return m;});

test('session view restores only the current generation and latest unfinished answer, without replaying historical deltas',()=>{
 const s=setup();try{
  start(s,1);delta(s,1,'old preview');finishMessage(s,1,'old final');start(s,2);delta(s,2,'当前');
  s.app.sessions.system(s.session.id,'independent durable notice');delta(s,2,'输出🙂');delta(s,1,'late stale preview');
  const other=s.app.projects.create(USER,{name:'Other events',template:'empty'});for(let i=0;i<700;i++)s.app.store.event(other.id,'session.delta',{sessionId:'unrelated',generation:2,text:'not this session'});
  const view=s.app.sessions.view(USER,s.session.id);assert.equal(view.progress.content,'当前输出🙂');assert.equal(view.progress.generation,2);assert.equal(view.progress.active,true);assert.equal(view.messages[0].content,'old final');
  assert.deepEqual(s.app.sessions.view(USER,s.session.id),view,'rereading cannot duplicate preview text');
  finishMessage(s,2,'当前完整输出🙂');assert.equal(s.app.sessions.view(USER,s.session.id).progress.content,'');assert.equal(s.app.sessions.view(USER,s.session.id).messages.at(-1).content,'当前完整输出🙂');
  delta(s,2,'next answer');assert.equal(s.app.sessions.view(USER,s.session.id).progress.content,'next answer');
  const row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{state:'interrupted',generation:3});assert.deepEqual(s.app.sessions.view(USER,row.id).progress,{generation:3,active:false,content:'',truncated:false,cursor:s.app.store.eventCursor(s.project.id)});
  assert.throws(()=>s.app.sessions.view({type:'agent',projectId:s.project.id},row.id),{code:'PERMISSION_DENIED'});
 }finally{s.close();}
});

test('preview is bounded by both event count and text length and marks omitted live text',()=>{
 const s=setup();try{
  start(s,1);for(let i=0;i<300;i++)delta(s,1,String(i)+';');let v=s.app.sessions.view(USER,s.session.id);assert.equal(v.progress.truncated,true);assert.equal(v.progress.content,Array.from({length:256},(_,i)=>String(i+44)+';').join(''));
  finishMessage(s,1,'checkpoint');for(let i=0;i<10;i++)delta(s,1,'🙂'.repeat(2000));v=s.app.sessions.view(USER,s.session.id);assert.equal(v.progress.content.length,32000);assert.equal(v.progress.truncated,true);assert.equal(v.progress.content,'🙂'.repeat(16000));
  finishMessage(s,1,'checkpoint two');delta(s,1,'bounded original chunk',true);assert.equal(s.app.sessions.view(USER,s.session.id).progress.truncated,true);
  start(s,2);assert.equal(s.app.sessions.view(USER,s.session.id).progress.truncated,false);
  const row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{generation:3});s.app.store.event(s.project.id,'agent.started',{sessionId:row.id});delta(s,2,'legacy unknown turn');assert.equal(s.app.sessions.view(USER,row.id).progress.content,'');
 }finally{s.close();}
});

test('message and preview reads use one WAL snapshot without blocking another writer',()=>{
 const s=setup(),other=new ResearchApp(s.dir,process.cwd());try{
  start(s,1);delta(s,1,'before');const original=s.app.sessions.messages.bind(s.app.sessions);let once=false;
  s.app.sessions.messages=(...args)=>{if(!once){once=true;other.store.transaction(()=>{const row=other.sessions.get(USER,s.session.id);other.store.update('session',row.id,row.version,{generation:2});other.store.create('message',s.project.id,{sessionId:row.id,role:'assistant',content:'after',mode:'prompt',status:'completed'});other.store.event(s.project.id,'agent.started',{sessionId:row.id,generation:2});other.store.event(s.project.id,'session.delta',{sessionId:row.id,generation:2,text:'after preview'});});}return original(...args);};
  const before=s.app.sessions.view(USER,s.session.id);assert.equal(before.session.generation,1);assert.equal(before.messages.length,0);assert.equal(before.progress.content,'before');
  const after=s.app.sessions.view(USER,s.session.id);assert.equal(after.session.generation,2);assert.equal(after.messages[0].content,'after');assert.equal(after.progress.content,'after preview');
 }finally{other.close();s.close();}
});

test('real IPC fixture persists generation boundaries and explicitly labels clipped model text',async()=>{
 const s=setup(),worker=join(s.dir,'long-output-fixture.mjs');
 writeFileSync(worker,`// UNIT IPC fixture, no SDK/model call.\nprocess.on('message',m=>{if(m.type==='start'){process.send({type:'delta',text:'x'.repeat(5000)});process.send({type:'assistant_message',content:'y'.repeat(33000),usage:{fixture:true}});process.send({type:'done'});}});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'FIXTURE',message:'No model'}),workerEntry:worker});
 try{const msg=s.app.sessions.send(USER,s.session.id,{content:'fixture output'});host.tick();const end=Date.now()+5000;while(Date.now()<end&&s.app.store.get('message',msg.id).status==='running')await new Promise(r=>setTimeout(r,20));
  const view=s.app.sessions.view(USER,s.session.id);assert.equal(view.progress.active,false);assert.equal(view.progress.content,'');const final=view.messages.find(m=>m.role==='assistant');assert.equal(final.content.length,32000);assert.equal(final.contentTruncated,true);
  const events=s.app.store.events(0,s.project.id);const d=events.find(e=>e.type==='session.delta');assert.equal(d.payload.generation,1);assert.equal(d.payload.text.length,4000);assert.equal(d.payload.truncated,true);assert.equal(events.find(e=>e.type==='session.message_completed').payload.generation,1);
 }finally{await host.stop();s.close();}
});
