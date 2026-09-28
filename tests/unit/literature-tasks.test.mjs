import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {DocumentService} from '../../dist/packages/documents/service.js';
import {LiteratureTaskService} from '../../dist/packages/literature/tasks.js';
const search={kind:'search',search:{query:'fixture only',sources:['crossref'],limit:1}};
const crossref={DOI:'10.1000/fixture',title:['Fixture paper'],published:{'date-parts':[[2024,1,1]]}};
function network(s,fetcher){s.app.connectors=new ConnectorService(s.app.context,s.app.evidence,{transport:new ConnectorTransport({fetcher}),credentials:()=>({})});s.app.documents=new DocumentService(s.app.context,s.app.evidence,s.app.connectors);}
function start(s,id){const r=s.app.store.get('literature-task',id);s.app.store.update('literature-task',id,r.version,{state:'running',phase:'requesting',generation:r.generation+1,leaseUntil:Date.now()+30000,deadline:Date.now()+60000});return r.generation+1;}
const call=(s,name,input,key='fixture-key')=>s.app.operations.execute(USER,name,input,{projectId:s.project.id,idempotencyKey:key});

test('durable owner task submission replays without network and inspect retains old search results beyond recent history',async()=>{
 const s=setup();let calls=0;try{network(s,async()=>{calls++;return new Response(JSON.stringify({message:{items:[crossref]}}),{headers:{'Content-Type':'application/json'}});});const task=await call(s,'literature_task_create',search);assert.equal(task.state,'queued');assert.equal(calls,0);assert.deepEqual(await call(s,'literature_task_create',search),task);
  const gen=start(s,task.id);await s.app.literatureTasks.execute(task.id,gen);const done=await call(s,'literature_task_inspect',{taskId:task.id});assert.equal(done.state,'succeeded');assert.equal(done.searchResult.items[0].id,crossref.DOI);assert.equal(calls,1);for(let i=0;i<40;i++)s.app.store.create('connector-search',s.project.id,{items:[],fixture:true});assert.equal(s.app.literatureTasks.inspect(USER,s.project.id,task.id).searchResult.id,done.resultSearchId);
  assert.ok(!('workerPid' in done));assert.ok(!('leaseUntil' in done));assert.throws(()=>s.app.literatureTasks.create({type:'agent',projectId:s.project.id},s.project.id,search),{code:'PERMISSION_DENIED'});
 }finally{s.close();}
});

test('running cancellation and source revocation stop publication without replaying unknown requests',async()=>{
 const s=setup();let calls=0;try{network(s,async(url,options)=>{calls++;return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('Fixture aborted')),{once:true}));});const task=s.app.literatureTasks.create(USER,s.project.id,search),gen=start(s,task.id),running=s.app.literatureTasks.execute(task.id,gen);while(!calls)await new Promise(r=>setImmediate(r));s.app.literatureTasks.cancel(USER,s.project.id,task.id);await running;assert.equal(s.app.literatureTasks.inspect(USER,s.project.id,task.id).state,'cancelled');assert.equal(s.app.store.list('connector-search',s.project.id).length,0);assert.equal(calls,1);
  network(s,async()=>{const cfg=s.app.connectors.settings(USER,s.project.id);s.app.connectors.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{crossref:false}});return new Response(JSON.stringify({message:{items:[crossref]}}));});const second=s.app.literatureTasks.create(USER,s.project.id,search),g=start(s,second.id);await s.app.literatureTasks.execute(second.id,g);assert.equal(s.app.literatureTasks.inspect(USER,s.project.id,second.id).error.code,'CONNECTOR_SETTINGS_CHANGED');assert.equal(s.app.store.list('connector-search',s.project.id).length,0);
 }finally{s.close();}
});

test('two controllers share two literature workers and expired ownership requires explicit new attempts',async()=>{
 const s=setup(),other=new ResearchApp(s.dir,process.cwd());let forks=0;const fake=()=>{forks++;return Object.assign(new EventEmitter(),{pid:undefined,unref(){}});};
 try{const a=new LiteratureTaskService(s.app,fake),b=new LiteratureTaskService(other,fake);const tasks=Array.from({length:3},()=>a.create(USER,s.project.id,search));a.tick();b.tick();a.tick();assert.equal(forks,2);assert.equal(s.app.store.list('literature-task',s.project.id).filter(t=>t.state==='running').length,2);
  const queued=s.app.store.get('literature-task',tasks[2].id);a.cancel(USER,s.project.id,queued.id);for(const task of tasks.slice(0,2)){const r=s.app.store.get('literature-task',task.id);s.app.store.update('literature-task',r.id,r.version,{leaseUntil:0});}a.tick();assert.equal(forks,2);const old=a.inspect(USER,s.project.id,tasks[0].id);assert.equal(old.state,'interrupted');const retry=a.retry(USER,s.project.id,old.id,old.version);assert.notEqual(retry.id,old.id);assert.equal(retry.previousTaskId,old.id);assert.equal(forks,2);await a.execute(old.id,1);assert.equal(a.inspect(USER,s.project.id,old.id).state,'interrupted');assert.equal(s.app.store.list('connector-call',s.project.id).length,0);
 }finally{other.close();s.close();}
});

test('a published immutable document wins over a later cancellation and remains independently inspectable',async()=>{
 const s=setup();try{network(s,async()=>new Response(JSON.stringify({message:crossref})));const task=s.app.literatureTasks.create(USER,s.project.id,{kind:'retrieve',target:{source:'crossref',id:crossref.DOI,format:'provider-text'}}),generation=start(s,task.id),acquire=s.app.documents.acquire.bind(s.app.documents);
  s.app.documents.acquire=async(...args)=>{const doc=await acquire(...args);s.app.literatureTasks.cancel(USER,s.project.id,task.id);return doc;};await s.app.literatureTasks.execute(task.id,generation);const done=s.app.literatureTasks.inspect(USER,s.project.id,task.id);assert.equal(done.state,'succeeded');assert.ok(done.documentVersionId);assert.equal(s.app.documents.inspect(USER,s.project.id,done.documentVersionId).contentKind,'metadata');assert.equal(s.app.store.list('document-version',s.project.id).length,1);
 }finally{s.close();}
});

test('an expired task recovers an already committed exact service receipt without another request or document',async()=>{
 const s=setup();let requests=0;try{network(s,async url=>{requests++;return new Response(JSON.stringify({message:url.pathname.includes('/works/')?crossref:{items:[crossref]}}));});
  const task=s.app.literatureTasks.create(USER,s.project.id,{kind:'retrieve',target:{source:'crossref',id:crossref.DOI,format:'provider-text'}}),generation=start(s,task.id);const acquired=await s.app.documents.acquire(USER,s.project.id,task.request.target,`literature-task:${task.id}`);const active=s.app.store.get('literature-task',task.id);s.app.store.update('literature-task',active.id,active.version,{leaseUntil:0});s.app.literatureTasks.tick();const restored=s.app.literatureTasks.inspect(USER,s.project.id,task.id);assert.equal(restored.state,'succeeded');assert.equal(restored.documentVersionId,acquired.id);assert.equal(restored.generation,generation+1);assert.equal(requests,1);assert.equal(s.app.store.list('document-version',s.project.id).length,1);
  const searchTask=s.app.literatureTasks.create(USER,s.project.id,search);start(s,searchTask.id);const result=await s.app.connectors.discover(USER,s.project.id,searchTask.request.search,`literature-task:${searchTask.id}`);const r=s.app.store.get('literature-task',searchTask.id);s.app.store.update('literature-task',r.id,r.version,{leaseUntil:0});s.app.literatureTasks.tick();assert.equal(s.app.literatureTasks.inspect(USER,s.project.id,r.id).resultSearchId,result.id);assert.equal(requests,2);
 }finally{s.close();}
});

test('project archival cannot strand a document computation or an active literature task',()=>{
 const s=setup();try{const task=s.app.literatureTasks.create(USER,s.project.id,search);assert.throws(()=>s.app.projects.archive(USER,s.project.id,s.project.version),{code:'PROJECT_BUSY'});s.app.literatureTasks.cancel(USER,s.project.id,task.id);
  const job=s.app.store.create('document-parse-job',s.project.id,{state:'unknown',generation:1,leaseUntil:0,manifest:{dockerContext:'fixture',resources:{cpus:1,memoryMb:512}}});assert.throws(()=>s.app.projects.archive(USER,s.project.id,s.project.version),{code:'PROJECT_BUSY'});s.app.store.update('document-parse-job',job.id,job.version,{state:'failed'});assert.equal(s.app.projects.archive(USER,s.project.id,s.project.version).archived,true);
 }finally{s.close();}
});

test('a durable multi-source task preserves successful hits when another source is rate limited',async()=>{
 const s=setup();try{network(s,async url=>url.hostname==='api.openalex.org'?new Response('limited',{status:429,headers:{'Retry-After':'120'}}):new Response(JSON.stringify({message:{items:[crossref]}})));const cfg=s.app.connectors.settings(USER,s.project.id);s.app.connectors.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{openalex:true}});
  const task=s.app.literatureTasks.create(USER,s.project.id,{kind:'search',search:{query:'mixed fixture',sources:['openalex','crossref'],limit:1}});await s.app.literatureTasks.execute(task.id,start(s,task.id));const done=s.app.literatureTasks.inspect(USER,s.project.id,task.id);assert.equal(done.state,'partial');assert.equal(done.searchResult.items[0].id,crossref.DOI);assert.equal(done.searchResult.sources.find(x=>x.source==='openalex').error,'CONNECTOR_RATE_LIMITED');assert.equal(done.searchResult.sources.find(x=>x.source==='crossref').status,'succeeded');assert.equal(s.app.connectors.observations(USER,s.project.id).find(x=>x.source==='openalex').retryAfter,'120');
 }finally{s.close();}
});
