import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {configureModelConnection} from '../../dist/packages/pi-adapter/model-connections.js';
import {setup,USER} from '../support/research.mjs';
const secret='FAKE_timeout_key',selection={provider:'timeout-fixture',model:'fixed-model',thinking:'max'},timeout=/^PROVIDER_TIMEOUT: 模型请求等待超时；/;
const pause=()=>delay(10);
async function until(predicate){const end=Date.now()+20000;while(Date.now()<end){const result=predicate();if(result)return result;await pause();}assert.fail('offline timeout fixture did not reach expected state');}
function chunk(delta,finish_reason=null){return `data: ${JSON.stringify({id:'timeout-fixture',object:'chat.completion.chunk',created:1,model:selection.model,choices:[{index:0,delta,finish_reason}]})}\n\n`;}
const answer=chunk({role:'assistant',content:'Offline response completed.'})+chunk({},'stop')+'data: [DONE]\n\n';
const brief={expectedRevisionId:null,question:'Fixed offline question',scope:'Fixture scope',constraints:[],successCriteria:['Keep the committed plan'],clarificationQuestions:[],literatureSummary:'No research claim',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Inspect the saved plan'}],status:'ready'};
const toolReply=chunk({role:'assistant',tool_calls:[{index:0,id:'save-once',type:'function',function:{name:'research_brief_save',arguments:JSON.stringify({input:brief})}}]})+chunk({},'tool_calls')+'data: [DONE]\n\n';
function fixture(managed,mode,endpoint='http://127.0.0.1:1/v1'){
 const s=setup(),events=[];
 if(managed)configureModelConnection(s.app.context,USER,{expectedVersion:0,provider:selection.provider,name:'Offline fixture',baseUrl:endpoint,api:'openai-completions',apiKey:secret},'fixture-connection');
 else writeFileSync(join(s.dir,'models.json'),JSON.stringify({providers:{[selection.provider]:{baseUrl:endpoint,api:'openai-completions',apiKey:secret,models:[{id:selection.model,input:['text'],reasoning:true,contextWindow:32768,maxTokens:2048}]}}}));
 s.app.sessions.configure(USER,selection);const session=s.app.sessions.create(USER,s.project.id,{title:'Timeout offline fixture'}),p=s.app.sessionPermissions.status(USER,session.id);s.app.sessionPermissions.set(USER,session.id,{mode:'autoEdit',expectedVersion:p.version});
 const dependencies={workerEntry:resolve('tests/fixtures/provider-timeout-clock-worker.mjs'),fork:(entry,args,options)=>{const child=fork(entry,args,{...options,env:{...options.env,PI_TIMEOUT_FIXTURE_MODE:mode,PI_TIMEOUT_FIXTURE_REPO:process.cwd()}});child.on('message',m=>events.push(m));child.stderr.on('data',data=>events.push({fixture:'stderr',error:data.toString()}));return child;}};let host=new AgentHost(s.app,dependencies);
 const start=content=>{const m=s.app.sessions.send(USER,session.id,{content});host.tick();return m;};
 const child=()=>host.active.get(session.id)?.child;
 const command=async(type,fields={})=>{const key=crypto.randomUUID();assert.ok(child());child().send({type,key,...fields});return until(()=>events.find(e=>e.fixture==='ack'&&e.key===key));};
 const request=async count=>{await until(()=>{if(events.filter(e=>e.fixture==='request').length>=count)return true;if(!host.active.has(session.id))assert.fail(JSON.stringify(events.filter(e=>e.type==='failure'||e.fixture==='stderr')));});return events.filter(e=>e.fixture==='request')[count-1].body;};
 const settled=async()=>until(()=>!host.active.has(session.id));
 const safe=()=>{const row=s.app.sessions.get(USER,session.id),native=readFileSync(s.app.store.paths.physical(row.piSessionPath),'utf8');for(const text of [native,JSON.stringify(events),...['records','events','operations'].map(table=>JSON.stringify(s.app.store.db.prepare(`SELECT * FROM ${table}`).all()))])assert.doesNotMatch(text,/FAKE_timeout_key|FAKE_PRIVATE_TIMEOUT_BODY/);const http=s.app.modelHttp.inspect(USER,s.project.id);assert.equal(http.counts.active,0);assert.equal(http.counts.unknown,0);assert.ok(http.items.every(i=>['succeeded','failed','cancelled','interrupted'].includes(i.state)));assert.equal(s.app.store.events(0,s.project.id).filter(e=>e.type==='model-http.finished').length,http.items.length,'each request has one terminal receipt');return {row,native};};
 return {...s,get app(){return s.app;},get host(){return host;},session,events,start,command,request,settled,safe,async reopen(){await host.stop();s.app.close();s.app=new ResearchApp(s.dir,process.cwd());host=new AgentHost(s.app,dependencies);},async close(){await host.stop();s.close();}};
}

test('real Pi request accepts a 130-second response and rejects the finite 600-second limit without retry or fallback',async t=>{
 for(const managed of [false,true])await t.test(managed?'managed connection':'legacy catalog',async()=>{
  const f=fixture(managed,'virtual');try{
   const first=f.start('Offline delayed response');const body=await f.request(1);assert.equal(body.model,selection.model);assert.equal(f.events.find(e=>e.fixture==='budget').ms,600000,'real SDK received the finite request budget');
   const tick=await f.command('fixture_sdk_tick',{ms:130000});if(tick.pending)await f.command('fixture_response',{text:answer});await f.settled();assert.equal(f.app.store.get('message',first.id).status,'completed',f.app.sessions.get(USER,f.session.id).lastError);assert.deepEqual(f.app.sessions.get(USER,f.session.id).model,selection);assert.equal(f.events.filter(e=>e.fixture==='request').length,1);
   const second=f.start('Offline response exceeds finite budget');await f.request(2);await f.command('fixture_sdk_tick',{ms:600001});await f.settled();assert.equal(f.app.store.get('message',second.id).status,'failed');assert.match(f.app.sessions.get(USER,f.session.id).lastError,timeout);assert.equal(f.events.filter(e=>e.fixture==='request').length,2,'failed request is never retried');assert.deepEqual(f.app.sessions.get(USER,f.session.id).model,selection);f.safe();
  }finally{await f.close();}
 });
});

test('cancel keeps its identity, and timeout preserves a successful tool, confirmed brief and the exact native session for continuation',async t=>{
 for(const managed of [false,true])await t.test(managed?'managed connection':'legacy catalog',async()=>{
  const f=fixture(managed,'virtual');try{
   // This temporary fixture's user authorizes the saved tool effect; no host command is executed.
   f.app.hostAccess.enable(USER,f.session.id,{expectedVersion:0,acknowledgedSameUserAccess:true});
   const original=f.start('Save the fixed offline plan once');await f.request(1);await f.command('fixture_response',{text:toolReply});const afterTool=await f.request(2);assert.ok(afterTool.messages.some(m=>m.role==='tool'&&m.tool_call_id==='save-once'));
   const saved=f.app.store.list('research-brief',f.project.id);assert.equal(saved.length,1);f.app.researchBriefs.confirm(USER,f.project.id,f.session.id,{briefId:saved[0].id,expectedVersion:saved[0].version});const nativePath=f.app.sessions.get(USER,f.session.id).piSessionPath;
   await f.command('fixture_sdk_tick',{ms:600001});await f.settled();assert.equal(f.app.store.get('message',original.id).status,'failed');const before=f.safe();assert.match(before.row.lastError,timeout);assert.match(before.native,/research_brief_save/);assert.match(before.native,/save-once/);const nativeId=JSON.parse(before.native.split('\n')[0]).id;assert.equal(f.app.researchBriefs.inspect(USER,f.project.id,f.session.id).brief.status,'confirmed');
   await f.reopen();
   // Reopening uses the same file; this new message only asks to continue from saved work.
   const continuation=f.start('Continue from the already saved plan; do not save it again');const resumed=await f.request(3);assert.ok(resumed.messages.some(m=>m.role==='tool'&&m.tool_call_id==='save-once'));await f.command('fixture_response',{text:answer});await f.settled();assert.equal(f.app.store.get('message',continuation.id).status,'completed');assert.equal(f.app.store.list('research-brief',f.project.id).length,1);const after=f.safe();assert.equal(after.row.piSessionPath,nativePath);assert.equal(JSON.parse(after.native.split('\n')[0]).id,nativeId);assert.deepEqual(after.row.model,selection);
   const cancel=f.start('Offline cancellation');await f.request(4);f.app.sessions.interrupt(USER,f.session.id);f.host.tick();await f.settled();assert.equal(f.app.store.get('message',cancel.id).status,'cancelled');assert.doesNotMatch(f.app.sessions.get(USER,f.session.id).lastError??'',/^PROVIDER_TIMEOUT:/);assert.equal(f.events.filter(e=>e.fixture==='request').length,4);f.safe();
  }finally{await f.close();}
 });
});

test('real Worker HTTP parser accepts 310-second header/body waits and diagnoses an over-budget SSE idle gap',async t=>{
 for(const managed of [false,true])await t.test(managed?'managed connection':'legacy catalog',async()=>{
  let response;const requests=[],server=createServer(async(req,res)=>{let body='';for await(const part of req)body+=part;requests.push(JSON.parse(body));response=res;});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const f=fixture(managed,'transport',`http://127.0.0.1:${server.address().port}/v1`);try{
   const first=f.start('Offline real HTTP parser wait');await until(()=>requests.length===1);await f.command('fixture_transport_tick',{ms:0});await f.command('fixture_transport_tick',{ms:310000});assert.ok(f.host.active.has(f.session.id),'headers wait is not truncated by a 300-second transport default');response.writeHead(200,{'content-type':'text/event-stream'});response.write(chunk({role:'assistant',content:'Partial offline response.'}));await until(()=>f.events.some(e=>e.type==='delta'));
   await f.command('fixture_transport_tick',{ms:0});await f.command('fixture_transport_tick',{ms:310000});assert.ok(f.host.active.has(f.session.id),'stream idle wait is not truncated by a 300-second transport default');response.end(chunk({},'stop')+'data: [DONE]\n\n');await f.settled();assert.equal(f.app.store.get('message',first.id).status,'completed');
   const second=f.start('Offline SSE idle exceeds budget');await until(()=>requests.length===2);response.writeHead(200,{'content-type':'text/event-stream'});response.write(chunk({role:'assistant',content:'Second partial.'}));await until(()=>f.events.filter(e=>e.type==='delta').length>=2);await f.command('fixture_transport_tick',{ms:0});await f.command('fixture_transport_tick',{ms:600001});await f.settled();assert.equal(f.app.store.get('message',second.id).status,'failed');assert.match(f.app.sessions.get(USER,f.session.id).lastError,timeout);assert.equal(requests.length,2);assert.deepEqual(f.app.sessions.get(USER,f.session.id).model,selection);f.safe();
  }finally{await f.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
 });
});
