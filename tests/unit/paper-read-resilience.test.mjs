import test from 'node:test';
import assert from 'node:assert/strict';
import timers,{setImmediate as turn} from 'node:timers/promises';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {DomainError} from '../../dist/packages/domain/errors.js';
import {safeToolDiagnostic,toolResultDiagnostic,toolFailureMessage} from '../../dist/packages/pi-adapter/tool-diagnostic.js';

function clock(t){
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:Date.now()});
 // Imported timer promises also need a local mock; only the fixture owns this clock.
 t.mock.method(timers,'setTimeout',(ms,value,{signal}={})=>new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(signal.reason);},timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve(value);},ms);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();}));
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

const searchPolicy={networkTimeoutMs:30000};
function jsonBody(signal,delay,value){return body(signal,delay,JSON.stringify(value));}

test('five searches share three slots and complete two 15s rounds without the ordinary 12s cutoff',async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController();let sent=0,active=0,peak=0;
 const transport=new ConnectorTransport({fetcher:async(_url,{signal})=>{sent++;active++;peak=Math.max(peak,active);setTimeout(()=>active--,15000);return jsonBody(signal,15000,{message:{items:[]}});}}),c=connector(s,transport);
 const pending=Array.from({length:5},(_,i)=>c.discover(USER,s.project.id,{query:`round ${i}`,sources:['crossref']},`round-${i}`,()=>{},caller.signal));pending.forEach(observe);
 try{await tick(12001);assert.equal(sent,3);await tick(2999);await tick(30);assert.equal(sent,5);await tick(15000);const rows=await Promise.all(pending);assert.ok(rows.every(r=>r.status==='complete'));assert.equal(peak,3);assert.equal(s.app.store.list('connector-call',s.project.id).length,5);for(const call of c.observations(USER,s.project.id)){assert.ok(call.sentAt);assert.ok(call.headersAt);assert.ok(call.finishedAt);assert.ok(call.receivedBytes>0);assert.equal(call.failureStage,null);}}
 finally{caller.abort();await Promise.allSettled(pending);s.close();}
});

for(const [delay,code] of [[13000,null],[31000,'CONNECTOR_TIMEOUT']])test(`search transport 30s network budget handles a ${delay/1000}s body`,async t=>{
 const tick=clock(t),caller=new AbortController(),observations=[],transport=new ConnectorTransport({fetcher:async(_url,{signal})=>body(signal,delay)});
 const pending=transport.text(new URL('https://api.crossref.org/works'),{},()=>{},1000,caller.signal,v=>observations.push(v),undefined,searchPolicy);observe(pending);
 try{await turn();await tick(code?30000:delay);if(code){await assert.rejects(pending,{code});assert.equal(observations.at(-1).failureStage,'body');assert.equal(observations.at(-1).receivedBytes,8);}else assert.match((await pending).text,/complete original/);}
 finally{caller.abort();await pending.catch(()=>{});}
});

test('search network timeout before headers has no invented headers timestamp and no retry',async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController();let sends=0;
 const c=connector(s,new ConnectorTransport({fetcher:async(_url,{signal})=>{sends++;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));}}));
 const pending=c.discover(USER,s.project.id,{query:'headers',sources:['crossref']},'headers',()=>{},caller.signal);observe(pending);
 try{await tick(30000);await assert.rejects(pending,{code:'CONNECTOR_ALL_FAILED'});const [call]=c.observations(USER,s.project.id);assert.equal(call.error,'CONNECTOR_TIMEOUT');assert.equal(call.failureStage,'headers');assert.equal(call.headersAt,null);assert.ok(call.sentAt);assert.ok(call.finishedAt);assert.equal(sends,1);unpublished(s);}
 finally{caller.abort();await pending.catch(()=>{});s.close();}
});

test('queue exhaustion is separate from a sent timeout and preserves reserved attempts',async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController(),blockers=new AbortController();let sends=0;
 const transport=new ConnectorTransport({fetcher:async(_url,{signal})=>{sends++;return body(signal,100000);}}),held=Array.from({length:3},()=>transport.text(new URL('https://www.alphaxiv.org/hold'),{},()=>{},1000,blockers.signal,undefined,undefined,100000));held.forEach(observe);
 const c=connector(s,transport),pending=c.discover(USER,s.project.id,{query:'queued',sources:['crossref']},'queue',()=>{},caller.signal);observe(pending);
 try{await tick(65000);await assert.rejects(pending,{code:'CONNECTOR_OPERATION_TIMEOUT'});const [call]=c.observations(USER,s.project.id);assert.equal(call.error,'CONNECTOR_QUEUE_TIMEOUT');assert.equal(call.failureStage,'queue');assert.equal(call.sentAt,null);assert.equal(call.receivedBytes,0);assert.equal(sends,3);assert.equal(s.app.store.list('connector-call',s.project.id).length,1);}
 finally{caller.abort();blockers.abort();await Promise.allSettled([...held,pending]);s.close();}
});

for(const interruption of ['deadline','caller cancellation','source revocation','approved deadline','grant revocation','lease expiry','project archive','transaction revocation'])test(`completed source survives only its own deadline: ${interruption}`,async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController();let sends=0;
 const c=connector(s,new ConnectorTransport({minIntervalMs:45000,fetcher:async(url,{signal})=>{sends++;return url.hostname==='api.crossref.org'?Response.json({message:{items:[{DOI:'10.1000/complete',title:['Complete source']}]}}):jsonBody(signal,25000,url.pathname.includes('esearch')?{esearchresult:{idlist:['123']}}:{unfinished:true});}}));
 const query={query:'partial deadline',sources:['crossref','pubmed']};let actor=USER,grant;
 if(['approved deadline','grant revocation'].includes(interruption)){grant=s.app.discoveryGrants.prepare(USER,s.project.id,{sessionId:s.session.id,searches:[query],targets:[],allowSearchResults:true,formats:['provider-text'],maxRequests:3,maxResponseBytes:16384,expiresAt:new Date(Date.now()+120000).toISOString()});approve(s.app,grant.approvalId);grant=s.app.discoveryGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});}
 if(['approved deadline','grant revocation','lease expiry'].includes(interruption)){const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator',generation:1};}
 const pending=c.discover(actor,s.project.id,query,interruption,()=>{},caller.signal);observe(pending);
 try{await tick(25000);await tick(20000);await tick(19999);assert.equal(s.app.store.list('connector-search',s.project.id).length,0);if(interruption==='caller cancellation')caller.abort();if(interruption==='source revocation')c.configure(USER,s.project.id,{expectedVersion:c.settings(USER,s.project.id).version,enabled:{pubmed:false}});
 if(interruption==='grant revocation'){const row=s.app.store.get('discovery-grant',grant.id);s.app.discoveryGrants.revoke(USER,s.project.id,{grantId:row.id,expectedVersion:row.version});}
 if(interruption==='lease expiry'){const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{leaseUntil:Date.now()});}
 if(interruption==='project archive')s.app.projects.archive(USER,s.project.id,s.app.store.get('project',s.project.id).version);
 if(interruption==='transaction revocation'){const transaction=s.app.store.transaction.bind(s.app.store);let injected=false;s.app.store.transaction=fn=>transaction(()=>{if(!injected&&s.app.store.list('connector-call',s.project.id).some(r=>r.error==='CONNECTOR_OPERATION_TIMEOUT')){injected=true;const cfg=c.settings(USER,s.project.id);if(cfg.enabled.pubmed)c.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{pubmed:false}});}return fn();});}
 await tick(1);
  if(['deadline','approved deadline'].includes(interruption)){const row=await pending;assert.equal(row.status,'partial');assert.equal(row.items[0].id,'10.1000/complete');assert.equal(row.sources.find(r=>r.source==='pubmed').error,'CONNECTOR_OPERATION_TIMEOUT');assert.match(row.coverage,/incomplete/i);}else{await assert.rejects(pending,{code:({'caller cancellation':'CONNECTOR_CANCELLED','source revocation':'CONNECTOR_SETTINGS_CHANGED','grant revocation':'DISCOVERY_GRANT_REVOKED','lease expiry':'LEASE_EXPIRED','project archive':'PROJECT_ARCHIVED','transaction revocation':'CONNECTOR_SETTINGS_CHANGED'})[interruption]});assert.equal(s.app.store.list('connector-search',s.project.id).length,0);}assert.equal(sends,3);unpublished(s);
 }finally{caller.abort();await pending.catch(()=>{});s.close();}
});

test('legacy literature search streams beyond 12s and finalizes its latest observed call version',async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController();let sends=0;
 t.mock.method(globalThis,'fetch',async(_url,{signal})=>{sends++;return jsonBody(signal,13000,{message:{items:[{DOI:'10.1000/legacy',title:['Legacy']}]}});});
 const pending=s.app.literature.search(s.project.id,'legacy',1,'legacy',()=>{},USER,caller.signal);observe(pending);
 try{await tick(13000);const row=await pending;assert.equal(row.items[0].doi,'10.1000/legacy');assert.equal((await s.app.literature.search(s.project.id,'legacy',1,'legacy',()=>{},USER,caller.signal)).id,row.id);assert.equal(sends,1);const [call]=s.app.store.list('connector-call',s.project.id);assert.equal(call.status,'succeeded');assert.ok(call.sentAt&&call.headersAt&&call.finishedAt);}
 finally{caller.abort();await pending.catch(()=>{});s.close();}
});

test('old connector observations remain readable with unknown optional phases',()=>{const s=setup();try{s.app.store.create('connector-call',s.project.id,{source:'crossref',host:'api.crossref.org',status:'failed-or-unknown',startedAt:new Date().toISOString(),error:'CONNECTOR_CANCELLED'});const [call]=s.app.operations.execute(USER,'connector_status',{},{projectId:s.project.id}).observations;for(const field of ['sentAt','headersAt','finishedAt','receivedBytes','failureStage'])assert.equal(call[field],null);}finally{s.close();}});

for(const interruption of ['none','approval revoked','lease expired','budget exceeded'])test(`fixed approved resume retains the original retrieval binding: ${interruption}`,async t=>{
 const tick=clock(t),s=setup(),caller=new AbortController();let sends=0;
 s.app.connectors=connector(s,new ConnectorTransport({minIntervalMs:0,fetcher:async(url,{signal})=>{sends++;return body(signal,20000,url.pathname.includes('esearch')?JSON.stringify({esearchresult:{idlist:['123']}}):'<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>123</PMID><Article><ArticleTitle>Resumed paper</ArticleTitle></Article></MedlineCitation></PubmedArticle></PubmedArticleSet>');}}));
 let pending;
 try{
  s.app.sessionPermissions.initialize(s.session.id,'confirm');const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});
  let actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator',generation:1,permission:s.app.sessionPermissions.capture(s.session.id)};
  const execute=(name,input={},key=crypto.randomUUID())=>s.app.operations.execute(actor,name,input,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:key,signal:caller.signal});
  if(interruption==='budget exceeded'){const cfg=s.app.connectors.settings(USER,s.project.id);s.app.connectors.configure(USER,s.project.id,{expectedVersion:cfg.version,requestLimit:1});}
  await assert.rejects(async()=>execute('literature_discover',{query:'fixed approved PubMed',sources:['pubmed'],limit:1},'propose'),{code:'APPROVAL_REQUIRED'});assert.equal(sends,0);
  const action=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);s.app.sessionPermissions.decide(USER,s.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true});
  const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{state:'running',generation:2,leaseUntil:Date.now()+120000});const notice=s.app.sessions.messages(USER,s.session.id).find(m=>m.approvalNoticeId===action.id);s.app.store.update('message',notice.id,notice.version,{status:'running',generation:2});actor={...actor,generation:2,approvalNoticeMessageId:notice.id};
  pending=execute('session_action_resume');observe(pending);await turn();await tick(20000);
  if(interruption==='approval revoked'){const approval=s.app.store.get('approval',action.approvalId);s.app.store.update('approval',approval.id,approval.version,{status:'rejected'});}
  if(interruption==='lease expired'){const session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{leaseUntil:Date.now()});}
  await tick(20000);
  if(interruption==='none'){const result=await pending;assert.equal(result.actionId,action.id);assert.equal(result.operation,'literature_discover');assert.equal(result.result.items[0].id,'123');assert.equal(sends,2);assert.equal(s.app.store.get('session-action',action.id).state,'completed');await assert.rejects(async()=>execute('session_action_resume'),{code:'SESSION_ACTION_NOT_APPROVED'});assert.equal(sends,2);}
  else{await assert.rejects(pending);assert.equal(s.app.store.list('connector-search',s.project.id).length,0);assert.ok(sends<=2);if(interruption==='budget exceeded')assert.equal(sends,1);}
  unpublished(s);
 }finally{caller.abort();await pending?.catch(()=>{});s.close();}
});

for(const cause of ['grant expiry','source revocation'])test(`observation after authorized dispatch respects ${cause}`,async t=>{
 clock(t);const authorizedUntil=Date.now()+1000;let revoked=false,sends=0;
 const code=cause==='grant expiry'?'DISCOVERY_GRANT_EXPIRED':'CONNECTOR_SETTINGS_CHANGED';
 const validate=()=>{if(revoked)throw new DomainError(code,'Source authorization revoked',403);};
 const beforeSend=()=>{if(cause==='grant expiry'&&Date.now()>=authorizedUntil)throw new DomainError(code,'Grant expired before dispatch',403);};
 const transport=new ConnectorTransport({fetcher:async()=>{sends++;return Response.json({message:{items:[]}});}});
 const observation=value=>{if(value.sentAt){if(cause==='grant expiry')t.mock.timers.setTime(authorizedUntil+4000);else revoked=true;}};
 const pending=transport.text(new URL('https://api.crossref.org/works'),{},validate,1000,undefined,observation,beforeSend,searchPolicy);
 if(cause==='source revocation')await assert.rejects(pending,{code});else assert.ok((await pending).text);
 assert.equal(sends,1,'the observer runs after an authorized dispatch; later source revocation still prevents publication');
});

test('search network budget includes blocking observation after actual dispatch',async t=>{
 const tick=clock(t);let sends=0,blocked=false;const caller=new AbortController(),transport=new ConnectorTransport({fetcher:async(_url,{signal})=>{sends++;return body(signal,31000);}});
 const pending=transport.text(new URL('https://api.crossref.org/works'),{},()=>{},1000,caller.signal,value=>{if(value.sentAt&&!blocked){blocked=true;t.mock.timers.setTime(Date.now()+5000);}},undefined,searchPolicy);const state=observe(pending);
 try{await turn();await tick(24999);assert.equal(state(),'pending');await tick(1);await assert.rejects(pending,{code:'CONNECTOR_TIMEOUT'});assert.equal(sends,1);}
 finally{caller.abort();await pending.catch(()=>{});}
});

test('a rejected final send fence records no sentAt when fetcher was never invoked',async()=>{
 let sends=0;const recorded={},transport=new ConnectorTransport({fetcher:async()=>{sends++;return Response.json({message:{items:[]}});}});
 await assert.rejects(transport.text(new URL('https://api.crossref.org/works'),{},()=>{},1000,undefined,value=>Object.assign(recorded,value),()=>{throw new DomainError('DISCOVERY_GRANT_EXPIRED','Expired before dispatch',403);},searchPolicy),{code:'DISCOVERY_GRANT_EXPIRED'});
 assert.equal(sends,0);assert.equal(recorded.sentAt,undefined,'a refused dispatch has no sending timestamp');assert.equal(recorded.failureStage,'validation');
});

test('sentAt measures actual dispatch and a 29s network response excludes pre-dispatch observation delay',async t=>{
 const tick=clock(t),caller=new AbortController(),recorded={};let dispatchedAt,blocked=false;
 const transport=new ConnectorTransport({fetcher:async(_url,{signal})=>{dispatchedAt=Date.now();return body(signal,29000);}});
 const pending=transport.text(new URL('https://api.crossref.org/works'),{},()=>{},1000,caller.signal,value=>{Object.assign(recorded,value);if(value.sentAt&&!blocked){blocked=true;t.mock.timers.setTime(Date.now()+5000);}},undefined,searchPolicy);observe(pending);
 try{await turn();await tick(dispatchedAt+29000-Date.now());assert.match((await pending).text,/complete original/);assert.equal(Date.parse(recorded.sentAt),dispatchedAt);assert.equal(Date.parse(recorded.finishedAt)-Date.parse(recorded.sentAt),29000);}
 finally{caller.abort();await pending.catch(()=>{});}
});
