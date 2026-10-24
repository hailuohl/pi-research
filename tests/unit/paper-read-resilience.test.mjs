import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as turn} from 'node:timers/promises';
import {join} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {DomainError} from '../../dist/packages/domain/errors.js';
import {safeToolDiagnostic,toolResultDiagnostic,toolFailureMessage} from '../../dist/packages/pi-adapter/tool-diagnostic.js';

function clock(t){
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:Date.now()});
 // Node's native AbortSignal.timeout does not use the mockable global timer.
 t.mock.method(AbortSignal,'timeout',ms=>{const controller=new AbortController();setTimeout(()=>controller.abort(new DOMException('Timed out','TimeoutError')),ms);return controller.signal;});
 return async ms=>{t.mock.timers.tick(ms);await turn();};
}
function body(signal,delay,content='# Paper\nA complete original para-\ngraph.\n'){
 let timer,abort;
 const stream=new ReadableStream({
  start(controller){
   controller.enqueue(Buffer.from(content.slice(0,8)));
   abort=()=>{clearTimeout(timer);controller.error(new DOMException('Aborted','AbortError'));};
   signal.addEventListener('abort',abort,{once:true});
   timer=setTimeout(()=>{signal.removeEventListener('abort',abort);controller.enqueue(Buffer.from(content.slice(8)));controller.close();},delay);
  },
  cancel(){clearTimeout(timer);signal.removeEventListener('abort',abort);},
 });
 return new Response(stream,{headers:{'Content-Type':'text/markdown'}});
}
function connector(s,transport){return new ConnectorService(s.app.context,s.app.evidence,{transport,credentials:()=>({})});}
function unpublished(s){assert.equal(s.app.store.list('paper-read',s.project.id).length,0);assert.equal(s.app.store.list('artifact',s.project.id).length,0);}
function observe(promise){let state='pending';promise.then(()=>{state='succeeded';},()=>{state='failed';});return ()=>state;}

test('HTTP 200 paper bodies can exceed both old 12s and 18s limits and publish only complete original text',async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController(),original='# Paper\nA complete original para-\ngraph.\n';
 const c=connector(s,new ConnectorTransport({fetcher:async(_url,{signal})=>body(signal,20000,original)}));
 const pending=c.paper(USER,s.project.id,{id:'2401.01234v2'},'slow',()=>{},caller.signal),state=observe(pending);
 try{
  await tick(12001);assert.equal(state(),'pending','the transport must not truncate a successful slow body at 12s');unpublished(s);
  await tick(6000);assert.equal(state(),'pending','the paper operation must not stop at the old 18s deadline');unpublished(s);
  await tick(1999);const result=await pending;
  assert.equal(result.fullTextRead,true);assert.equal(s.app.evidence.read(USER,result.artifactId).bytes.toString(),original);
  assert.equal(s.app.store.list('paper-read',s.project.id).length,1);assert.equal(result.rawArtifactIds.length,1);
  assert.equal(s.app.evidence.read(USER,result.rawArtifactIds[0]).bytes.toString(),original);
 }finally{caller.abort();await pending.catch(()=>{});s.close();}
});

test('paper total deadline stops an incomplete HTTP 200 body at 60s without publishing artifacts',async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController();
 const c=connector(s,new ConnectorTransport({fetcher:async(_url,{signal})=>body(signal,65000)}));
 const pending=c.paper(USER,s.project.id,{id:'2401.01234'},'deadline',()=>{},caller.signal),state=observe(pending);
 try{
  await tick(59999);assert.equal(state(),'pending');unpublished(s);
  await tick(1);await assert.rejects(pending,{code:'CONNECTOR_CANCELLED'});unpublished(s);
  assert.equal(s.app.store.list('connector-call',s.project.id)[0].status,'failed-or-unknown');
 }finally{caller.abort();await pending.catch(()=>{});s.close();}
});

test('paper queue time shares its 60s deadline instead of starting another body budget after admission',async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController(),blockers=new AbortController();
 const transport=new ConnectorTransport({fetcher:async(url,{signal})=>body(signal,url.pathname==='/hold'?30000:35000)});
 const held=Array.from({length:3},()=>transport.text(new URL('https://www.alphaxiv.org/hold'),{},()=>{},1000,blockers.signal,undefined,undefined,60000));
 for(const p of held)observe(p);
 const c=connector(s,transport),pending=c.paper(USER,s.project.id,{id:'2401.01234'},'queued',()=>{},caller.signal),state=observe(pending);
 try{
  await tick(30000);await Promise.all(held);await tick(30);unpublished(s);
  await tick(29969);assert.equal(state(),'pending');unpublished(s);
  await tick(1);await assert.rejects(pending,{code:'CONNECTOR_CANCELLED'});unpublished(s);
 }finally{caller.abort();blockers.abort();await Promise.allSettled([...held,pending]);s.close();}
});

test('ordinary transport calls retain the existing 12s timeout',async t=>{
 const tick=clock(t),transport=new ConnectorTransport({fetcher:async(_url,{signal})=>body(signal,13000)});
 const pending=transport.text(new URL('https://api.openalex.org/works'),{},()=>{}),state=observe(pending);
 await tick(11999);assert.equal(state(),'pending');await tick(1);await assert.rejects(pending,{code:'CONNECTOR_CANCELLED'});
});

for(const cause of ['caller cancellation','source revocation'])test(`${cause} while a paper body streams prevents publication`,async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController(),c=connector(s,new ConnectorTransport({fetcher:async(_url,{signal})=>body(signal,20000)}));
 const pending=c.paper(USER,s.project.id,{id:'2401.01234'},cause,()=>{},caller.signal);observe(pending);
 try{
  await tick(1000);unpublished(s);
  if(cause==='caller cancellation')caller.abort();else c.configure(USER,s.project.id,{expectedVersion:c.settings(USER,s.project.id).version,enabled:{alphaxiv:false}});
  await tick(150);await assert.rejects(pending,{code:cause==='caller cancellation'?'CONNECTOR_CANCELLED':'CONNECTOR_SETTINGS_CHANGED'});unpublished(s);
 }finally{caller.abort();await pending.catch(()=>{});s.close();}
});

const recoveryCodes=['CONNECTOR_CANCELLED','CONNECTOR_UNAVAILABLE','CONNECTOR_RATE_LIMITED','CONNECTOR_HTTP_ERROR','CONNECTOR_RESPONSE_TOO_LARGE','CONNECTOR_HOST_DENIED','CONNECTOR_BUDGET_EXCEEDED','CONNECTOR_SETTINGS_CHANGED','CONNECTOR_SECRET_IN_RESPONSE','CONNECTOR_CREDENTIAL_REQUIRED','CONNECTOR_FAILED','PAPER_NOT_FOUND','FULL_TEXT_UNAVAILABLE','PAPER_ID_MISMATCH','PAPER_ID_INVALID','PAPER_SOURCE_MISMATCH','PROVIDER_SCHEMA_INVALID','SOURCE_DISABLED'];
test('paper connector failures retain exact safe codes and fixed recovery hints through SDK diagnostics',()=>{
 const raw='raw-canary https://private.invalid/full-paper?api_key=secret-canary';
 for(const code of recoveryCodes){
  const diagnostic=safeToolDiagnostic({},code,raw);assert.deepEqual(diagnostic,{code},code);
  assert.deepEqual(toolResultDiagnostic({},{content:[{type:'text',text:`${code}: ${raw}`}]}),{code});
  const message=toolFailureMessage('paper_read',diagnostic);assert.ok(message.includes(code));assert.match(message,/。.+。/);assert.doesNotMatch(message,/raw-canary|private.invalid|secret-canary/);
  assert.equal(safeToolDiagnostic({},code+'suffix',raw),undefined);
 }
 assert.match(toolFailureMessage('paper_read',{code:'CONNECTOR_CANCELLED'}),/超时|取消/);
 assert.match(toolFailureMessage('paper_read',{code:'CONNECTOR_CANCELLED'}),/未.*保存|不.*登记|未.*采纳/);
});

test('public paper_read failure notices retain a safe timeout code without raw provider text',async()=>{
 const s=setup();
 try{
  const session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});
  const host=new AgentHost(s.app),sent=[],a={sessionId:session.id,generation:1,ended:false,actor:{type:'agent',projectId:s.project.id,sessionId:session.id,role:'coordinator',generation:1},child:{connected:true,send:value=>sent.push(value)},advertisedTools:new Set(['paper_read'])};
  host.tools.execute=async()=>{throw new DomainError('CONNECTOR_CANCELLED','raw-canary https://private.invalid/?api_key=secret-canary',503);};
  await host.onMessage(a,{type:'tool',tool:'paper_read',toolCallId:'timeout',requestId:1,input:{id:'2401.01234'}},join(s.dir,'sessions',session.id));
  assert.equal(sent.at(-1).error.code,'CONNECTOR_CANCELLED');
  await host.onMessage(a,{type:'tool_execution_end',tool:'paper_read',toolCallId:'timeout',isError:true},join(s.dir,'sessions',session.id));
  const notice=s.app.sessions.messages(USER,session.id).filter(m=>m.role==='system').at(-1);
  assert.equal(notice.status,'failed');assert.match(notice.content,/CONNECTOR_CANCELLED/);assert.match(notice.content,/超时|取消/);assert.doesNotMatch(notice.content,/raw-canary|private.invalid|secret-canary/);
 }finally{s.close();}
});
