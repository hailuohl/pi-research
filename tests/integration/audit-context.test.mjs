import test from 'node:test';import assert from 'node:assert/strict';import {join,resolve} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(h,fn){for(let i=0;i<100;i++){h.tick();if(fn())return;await sleep(15);}throw new Error('IPC timeout');}
test('A12 restored session receives and acknowledges fresh host notifications only once',async()=>{
 const s=setup(),h=new AgentHost(s.app,{inspect:()=>({ready:true,code:'IPC_FIXTURE',message:'No model'}),workerEntry:resolve('tests/fixtures/context-worker.mjs')});try{
 let session=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',session.id,session.version,{piSessionPath:join(s.dir,'sessions',session.id,'pi','existing.jsonl')});
 const note=s.app.sessions.system(session.id,'A12_RESULT_NEW_HOST_CONTEXT');
 const m=s.app.sessions.send(USER,session.id,{content:'Summarize'});await until(h,()=>s.app.store.get('message',m.id).status==='completed');
 let replies=s.app.sessions.messages(USER,session.id).filter(m=>m.role==='assistant').map(m=>JSON.parse(m.content));assert.equal(replies[0].hostMessages?.[0]?.id,note.id);assert.match(replies[0].hostMessages[0].content,/A12_RESULT/);
 const m2=s.app.sessions.send(USER,session.id,{content:'Next question'});await until(h,()=>s.app.store.get('message',m2.id).status==='completed');
 replies=s.app.sessions.messages(USER,session.id).filter(m=>m.role==='assistant').map(m=>JSON.parse(m.content));assert.equal(replies[1].hostMessages.length,0);
 }finally{await h.stop();s.close();}
});
