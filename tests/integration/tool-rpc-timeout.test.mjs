import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import * as processCoordination from '../../dist/packages/storage/process-coordination.js';
import {Store} from '../../dist/packages/storage/store.js';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';

const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
const chunk=(delta,finish_reason=null)=>`data: ${JSON.stringify({id:'rpc-fixture',object:'chat.completion.chunk',created:1,model:'fixture',choices:[{index:0,delta,finish_reason}]})}\n\n`;
async function until(predicate,description='expected worker state',timeout=8000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){const result=predicate();if(result)return result;await delay(10);}
 assert.fail(`offline RPC fixture did not reach ${description}`);
}

// Production worker + pinned Pi SDK. Only the model and host RPC reply are local fixtures.
async function worker(t,tool='host_execute'){
 const home=mkdtempSync(join(tmpdir(),'pi-tool-rpc-')),events=[],requests=[],calls=[];
 let child,stderr='',finalResponse;
 const server=createServer(async(req,res)=>{
  let body='';for await(const part of req)body+=part;requests.push(JSON.parse(body));
  res.writeHead(200,{'content-type':'text/event-stream'});
  if(requests.length>1){finalResponse=res;return;}
  const input=tool==='host_execute'?{argv:['offline-command'],timeoutMs:60000}:tool==='paper_read'?{id:'2401.01234v2'}:tool==='literature_search'?{query:'offline retrieval'}:tool==='literature_discover'?{query:'offline retrieval',sources:['crossref']}:{};
  res.end(chunk({role:'assistant',tool_calls:[{index:0,id:'original-call-1',type:'function',function:{name:tool,arguments:JSON.stringify({input})}}]})+chunk({},'tool_calls')+'data: [DONE]\n\n');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{
  if(child&&child.exitCode===null){child.kill();await new Promise(resolve=>child.once('exit',resolve));}
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  rmSync(home,{recursive:true,force:true});
 });
 const store=new Store(join(home,'state.db'));store.close();
 for(const dir of ['workspace','agent','sessions'])mkdirSync(join(home,dir));
 const modelsPath=join(home,'models.json');
 writeFileSync(modelsPath,JSON.stringify({providers:{'offline-rpc':{api:'openai-completions',baseUrl:`http://127.0.0.1:${server.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:1024}]}}}));
 const env={PI_OFFLINE:'1',HOME:home,USERPROFILE:home,APPDATA:home,LOCALAPPDATA:home};
 for(const key of ['SystemRoot','WINDIR','PATH','TEMP','TMP'])if(process.env[key])env[key]=process.env[key];
 child=fork(join(repoRoot,'tests/fixtures/tool-rpc-clock-worker.mjs'),[],{cwd:repoRoot,env,silent:true});
 child.stderr.on('data',part=>{stderr+=part;});child.stdout.resume();
 const ended=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
 child.on('message',message=>{events.push(message);if(message.type==='tool')calls.push(message);});
 // Support both the registered-on-start worker and the in-flight adopted-claim worker.
 const coordination=new Store(join(home,'state.db')),processClaim=processCoordination.registerForkedProcessClaim?coordination.transaction(()=>processCoordination.registerForkedProcessClaim(coordination.db,home,child.pid)):undefined;coordination.close();
 child.send({type:'start',processClaim,dataDir:home,repoRoot,workspace:join(home,'workspace'),agentDir:join(home,'agent'),sessionDir:join(home,'sessions'),modelsPath,piSessionPath:null,role:'coordinator',model:{provider:'offline-rpc',model:'fixture',thinking:'off'},prompt:'Offline RPC lifecycle fixture.',history:null,tools:[{name:tool,...TOOL_DEFINITIONS[tool]}]});
 const call=await until(()=>{if(child.exitCode!==null)assert.fail(`worker exited before tool call: ${stderr} ${JSON.stringify(events)}`);return calls[0];},'first tool call',25000);
 const command=async(type,fields={})=>{
  const key=crypto.randomUUID();child.send({type,key,...fields});
  return until(()=>events.find(event=>event.fixture==='ack'&&event.key===key),'clock acknowledgement');
 };
 const respond=fields=>child.send({type:'tool_response',requestId:call.requestId,...fields});
 const toolEnd=()=>until(()=>events.find(event=>event.type==='tool_execution_end'),'tool result');
 const finish=async()=>{
  await until(()=>finalResponse,'provider continuation');
  finalResponse.end(chunk({role:'assistant',content:'Offline fixture finished.'})+chunk({},'stop')+'data: [DONE]\n\n');
  await until(()=>child.exitCode!==null,`worker exit: ${stderr}`);
  assert.equal((await ended).code,0,stderr);
 };
 const receipts=()=>{
  const ready=events.find(event=>event.type==='ready');
  return readFileSync(ready.sessionFile,'utf8').trim().split(/\r?\n/).map(line=>JSON.parse(line)).filter(entry=>entry.message?.role==='toolResult').map(entry=>entry.message);
 };
 return {child,events,requests,calls,call,command,respond,toolEnd,finish,receipts,diagnostics:()=>({events,stderr,exitCode:child.exitCode,signalCode:child.signalCode,requests:requests.length})};
}

for(const elapsed of [45000,74000])test(`host_execute keeps the original call alive for a ${elapsed/1000}-second host response`,async t=>{
 const f=await worker(t);
 await f.command('fixture_tick',{ms:elapsed});
 f.respond({result:{state:'completed',stdout:'one confirmed result'}});
 assert.equal((await f.toolEnd()).isError,false,'legal host execution must outlive the old 30-second RPC budget');
 assert.equal((await f.command('fixture_inspect')).timers,0,'confirmed response clears its RPC timer');
 await f.finish();
 assert.equal(f.calls.length,1);assert.equal(f.receipts().length,1);
 assert.equal(f.receipts()[0].toolCallId,f.call.toolCallId);
 assert.match(JSON.stringify(f.receipts()[0]),/one confirmed result/);
});

test('other tools retain their 30-second RPC budget',async t=>{
 const f=await worker(t,'task_context_read');
 await f.command('fixture_tick',{ms:29999});
 assert.equal(f.events.some(event=>event.type==='tool_execution_end'),false);
 await f.command('fixture_tick',{ms:1});
 assert.equal((await f.toolEnd()).isError,true);
 await f.finish();assert.equal(f.calls.length,1);
});

test('80-second host timeout preserves uncertain identity and ignores a late receipt without resending',async t=>{
 const f=await worker(t);
 await f.command('fixture_tick',{ms:79999});
 assert.equal(f.events.some(event=>event.type==='tool_execution_end'),false);
 await f.command('fixture_tick',{ms:1});
 assert.equal((await f.toolEnd()).isError,true);
 await until(()=>f.requests.length===2,'provider continuation with timeout receipt');
 f.respond({result:{state:'completed',stdout:'late-result-must-not-replace-timeout'}});
 assert.equal((await f.command('fixture_inspect')).timers,0);
 await f.finish();
 assert.equal(f.calls.length,1,'worker must not automatically resend the timed out tool');
 assert.equal(f.events.filter(event=>event.type==='tool_execution_end').length,1);
 const receipts=f.receipts();assert.equal(receipts.length,1);
 const text=JSON.stringify(receipts[0]);
 assert.match(text,/结果未确认/);assert.match(text,/不要自动重试/);
 assert.ok(text.includes(`tool=${f.call.tool}`));
 assert.ok(text.includes(`toolCallId=${f.call.toolCallId}`));
 assert.ok(text.includes(`requestId=${f.call.requestId}`));
 assert.doesNotMatch(text,/late-result-must-not-replace-timeout/);
});

test('host rejection remains an error and clears the tool RPC timer',async t=>{
 const f=await worker(t);
 f.respond({error:{code:'HOST_ACCESS_DISABLED',message:'offline permission rejection'}});
 assert.equal((await f.toolEnd()).isError,true);
 assert.equal((await f.command('fixture_inspect')).timers,0);
 await f.finish();
 assert.match(JSON.stringify(f.receipts()),/HOST_ACCESS_DISABLED/);
 assert.equal(f.calls.length,1);
});

test('abort while waiting for host RPC settles without advancing the timeout clock',async t=>{
 const f=await worker(t);
 f.child.send({type:'abort'});
 await until(()=>f.events.some(event=>event.type==='done'),'aborted worker completion without a host reply',3000).catch(error=>assert.fail(`${error.message}\n${JSON.stringify(f.diagnostics())}`));
 assert.equal(f.events.find(event=>event.type==='done').aborted,true);
 assert.equal(f.requests.length,1,'abort must not start a further model turn');
 await until(()=>f.child.exitCode!==null,'aborted worker exit');
 assert.equal(f.calls.length,1);
});

test('paper_read accepts its original confirmed response after 45 seconds over real Worker IPC',async t=>{
 const f=await worker(t,'paper_read');
 await f.command('fixture_tick',{ms:45000});
 const result={artifactId:'offline-paper-artifact',contentKind:'full_text',fullTextRead:true};
 f.respond({result});
 assert.equal((await f.toolEnd()).isError,false,'paper reads must outlive the old 30-second RPC budget');
 assert.equal((await f.command('fixture_inspect')).timers,0);
 await f.finish();
 assert.equal(f.calls.length,1);const receipts=f.receipts();assert.equal(receipts.length,1);
 assert.equal(receipts[0].toolCallId,f.call.toolCallId);assert.deepEqual(JSON.parse(receipts[0].content[0].text),result);
});

test('paper_read receives the original service failure during its delivery margin without retrying',async t=>{
 const f=await worker(t,'paper_read');
 await f.command('fixture_tick',{ms:74000});
 f.respond({error:{code:'CONNECTOR_CANCELLED',message:'文献读取超时或已取消，未完成结果未保存'}});
 const end=await f.toolEnd();assert.equal(end.isError,true);assert.deepEqual(end.diagnostic,{code:'CONNECTOR_CANCELLED'});
 assert.equal((await f.command('fixture_inspect')).timers,0);
 await f.finish();
 assert.equal(f.calls.length,1);const receipts=f.receipts();assert.equal(receipts.length,1);
 assert.equal(receipts[0].toolCallId,f.call.toolCallId);assert.match(JSON.stringify(receipts[0]),/CONNECTOR_CANCELLED/);
 assert.doesNotMatch(JSON.stringify(receipts[0]),/结果未确认/);
});

test('paper_read stops waiting at 80 seconds and ignores a late result without resending',async t=>{
 const f=await worker(t,'paper_read');
 await f.command('fixture_tick',{ms:79999});
 assert.equal(f.events.some(event=>event.type==='tool_execution_end'),false);
 await f.command('fixture_tick',{ms:1});assert.equal((await f.toolEnd()).isError,true);
 await until(()=>f.requests.length===2,'provider continuation with paper RPC timeout receipt');
 f.respond({result:{artifactId:'late-paper-must-not-replace-timeout'}});
 assert.equal((await f.command('fixture_inspect')).timers,0);
 await f.finish();
 assert.equal(f.calls.length,1);assert.equal(f.events.filter(event=>event.type==='tool_execution_end').length,1);
 const receipts=f.receipts();assert.equal(receipts.length,1);const text=JSON.stringify(receipts[0]);
 assert.match(text,/结果未确认/);assert.match(text,/不要自动重试/);
 assert.ok(text.includes(`tool=${f.call.tool}`));assert.ok(text.includes(`toolCallId=${f.call.toolCallId}`));assert.ok(text.includes(`requestId=${f.call.requestId}`));
 assert.doesNotMatch(text,/late-paper-must-not-replace-timeout/);
});

for(const tool of ['literature_search','literature_discover','session_action_resume'])test(`${tool} accepts its original response after the old 30-second RPC limit`,async t=>{
 const f=await worker(t,tool);await f.command('fixture_tick',{ms:74000});f.respond({result:{confirmed:'original retrieval receipt'}});assert.equal((await f.toolEnd()).isError,false);assert.equal((await f.command('fixture_inspect')).timers,0);await f.finish();assert.equal(f.calls.length,1);assert.match(JSON.stringify(f.receipts()),/original retrieval receipt/);
});
for(const tool of ['literature_search','literature_discover'])test(`${tool} retains an uncertain timeout at 75 seconds without resending`,async t=>{
 const f=await worker(t,tool);await f.command('fixture_tick',{ms:74999});assert.equal(f.events.some(event=>event.type==='tool_execution_end'),false);await f.command('fixture_tick',{ms:1});assert.equal((await f.toolEnd()).isError,true);await f.finish();assert.equal(f.calls.length,1);assert.match(JSON.stringify(f.receipts()),/结果未确认/);
});
