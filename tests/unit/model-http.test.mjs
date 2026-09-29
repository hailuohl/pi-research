import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {managedModelFetch} from '../../dist/packages/pi-adapter/model-fetch.js';

function worker(s,session=s.session){const row=s.app.store.get('session',session.id);const current=s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+60000}),slot=s.app.agentAdmission.tryAcquire(current,1,'fixture-host');assert.ok(slot);s.app.agentAdmission.markRunning(slot.id,'fixture-host',1,process.pid);const a=s.app.store.get('agent-admission',slot.id);s.app.store.update('agent-admission',a.id,a.version,{httpManagedVersion:1});return {admissionId:slot.id,sessionId:row.id,generation:1,ownerHost:'fixture-host'};}
function configure(s,maxRequests){return s.app.modelHttp.configure(USER,{expectedVersion:s.app.modelHttp.inspect(USER).configuration.version,maxRequests},s.project.id);}
const view=s=>s.app.modelHttp.inspect(USER,s.project.id);
const pause=ms=>new Promise(r=>setTimeout(r,ms));

test('HTTP capacity is owner-only, distinct from Workers, FIFO and persistent across configuration changes',()=>{const s=setup();try{
 const a=worker(s),b=worker(s,s.app.sessions.create(USER,s.project.id,{title:'second'}));configure(s,1);assert.equal(s.app.agentAdmission.snapshot().counts.held,2);
 assert.equal(s.app.modelHttp.acquire(a,'a').allowed,true);assert.equal(s.app.modelHttp.acquire(b,'b').allowed,false);assert.equal(view(s).counts.queued,1);configure(s,0);assert.equal(view(s).counts.active,1);
 s.app.modelHttp.finish(a,'a',{state:'succeeded',httpStatus:200,receivedBytes:123});assert.equal(s.app.modelHttp.acquire(b,'b').allowed,false);configure(s,1);assert.equal(s.app.modelHttp.acquire(b,'b').allowed,true);
 assert.throws(()=>s.app.modelHttp.acquire(a,'a'),{code:'MODEL_HTTP_ALREADY_FINISHED'});assert.throws(()=>s.app.modelHttp.configure({type:'agent'},{expectedVersion:1,maxRequests:32}),{code:'PERMISSION_DENIED'});
 s.app.modelHttp.finish(b,'b',{state:'cancelled'});assert.equal(view(s).available,1);assert.equal(view(s).items.length,2);assert.ok(view(s).items.every(r=>!('ownerHost'in r)));
 const page=s.app.modelHttp.inspect(USER,s.project.id,{limit:1});assert.ok(page.nextCursor);assert.equal(s.app.modelHttp.inspect(USER,s.project.id,{cursor:page.nextCursor,limit:1}).items[0].id,view(s).items[1].id);
}finally{s.close();}});

test('expired and superseded identity cannot dispatch; unknown keeps capacity until confirmed worker exit',()=>{const s=setup();try{
 const a=worker(s),b=worker(s,s.app.sessions.create(USER,s.project.id,{title:'queued'}));configure(s,1);s.app.modelHttp.acquire(a,'sent');s.app.modelHttp.acquire(b,'waiting');
 const old=s.app.store.get('session',a.sessionId);s.app.store.update('session',old.id,old.version,{generation:2});s.app.modelHttp.recover();assert.deepEqual(view(s).counts,{active:0,queued:1,unknown:1});assert.equal(s.app.modelHttp.acquire(b,'waiting').allowed,false);
 assert.throws(()=>s.app.modelHttp.acquire(a,'new'),{code:'MODEL_HTTP_SCOPE_EXPIRED'});assert.throws(()=>s.app.modelHttp.workerExited(a.admissionId,'foreign',1),{code:'MODEL_HTTP_SCOPE_DENIED'});
 s.app.modelHttp.workerExited(a.admissionId,a.ownerHost,a.generation);assert.equal(s.app.modelHttp.acquire(b,'waiting').allowed,true);assert.equal(view(s).items.find(r=>r.sessionId===a.sessionId).outcome,'worker-exit-provider-outcome-unknown');
 s.app.modelHttp.finish(b,'waiting',{state:'failed',httpStatus:429});assert.equal(view(s).available,1);
}finally{s.close();}});

test('legacy uninstrumented workers block new HTTP instead of being miscounted as idle',()=>{const s=setup();try{
 const a=worker(s),legacySession=s.app.sessions.create(USER,s.project.id,{title:'legacy'}),legacy=s.app.agentAdmission.tryAcquire(legacySession,1,'old-host');assert.ok(legacy);configure(s,2);
 assert.equal(view(s).coverage,'legacy-workers-present');assert.equal(view(s).legacyWorkerCount,1);assert.equal(s.app.modelHttp.acquire(a,'a').allowed,false);
 s.app.agentAdmission.release(legacy.id,'old-host',1,'not-forked');assert.equal(s.app.modelHttp.acquire(a,'a').allowed,true);assert.equal(view(s).coverage,'managed-fetch');
}finally{s.close();}});

test('managed fetch holds its slot through streamed body and preserves bytes and response metadata',async()=>{const s=setup();try{
 const w=worker(s),stop=new AbortController();let body,requests=0;
 const fake=async()=>{requests++;return new Response(new ReadableStream({start(c){body=c;}}),{headers:{'Content-Type':'text/event-stream'}});};
 const fetcher=managedModelFetch(fake,k=>Promise.resolve(s.app.modelHttp.acquire(w,k)),(k,r)=>Promise.resolve(s.app.modelHttp.finish(w,k,r)),stop.signal);
 const response=await fetcher('https://provider.invalid/test',{headers:{Authorization:'Bearer DO-NOT-PERSIST'},body:'private prompt',method:'POST'});assert.equal(view(s).counts.active,1);assert.equal(requests,1);
 const text=response.text();body.enqueue(new TextEncoder().encode('data: {"ok":true}\n\n'));assert.equal(view(s).counts.active,1);body.close();assert.equal(await text,'data: {"ok":true}\n\n');assert.equal(view(s).counts.active,0);assert.equal(view(s).items[0].receivedBytes,19);assert.equal(view(s).items[0].httpStatus,200);
 assert.doesNotMatch(JSON.stringify(s.app.store.list('model-http-request')),/DO-NOT-PERSIST|private prompt|provider.invalid/);
}finally{s.close();}});

test('cancelled queued fetch never sends and cancelling a live body releases only its own slot',async()=>{const s=setup();try{
 const w=worker(s),stop=new AbortController();configure(s,0);let requests=0;const fetcher=managedModelFetch(async()=>{requests++;return new Response('never');},k=>Promise.resolve(s.app.modelHttp.acquire(w,k)),(k,r)=>Promise.resolve(s.app.modelHttp.finish(w,k,r)),stop.signal);
 const waiting=fetcher('https://provider.invalid');await pause(10);assert.equal(view(s).counts.queued,1);stop.abort();await assert.rejects(waiting);assert.equal(requests,0);assert.equal(view(s).items[0].outcome,'cancelled-before-dispatch');
 configure(s,1);const liveStop=new AbortController(),f=managedModelFetch(async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([1,2,3]));}})),k=>Promise.resolve(s.app.modelHttp.acquire(w,k)),(k,r)=>Promise.resolve(s.app.modelHttp.finish(w,k,r)),liveStop.signal);const response=await f('https://provider.invalid');assert.equal(view(s).counts.active,1);await response.body.cancel();assert.equal(view(s).counts.active,0);assert.equal(view(s).items[0].state,'cancelled');
}finally{s.close();}});

test('fetch and body errors retain failed attempts while releasing completed transport capacity',async()=>{for(const mode of ['fetch','body']){const s=setup();try{
 const w=worker(s),f=managedModelFetch(async()=>{if(mode==='fetch')throw Error('fixture network');return new Response(new ReadableStream({pull(c){c.error(Error('fixture body'));}}));},k=>Promise.resolve(s.app.modelHttp.acquire(w,k)),(k,r)=>Promise.resolve(s.app.modelHttp.finish(w,k,r)),new AbortController().signal);
 await assert.rejects(async()=>{const r=await f('https://provider.invalid');await r.text();},/fixture/);assert.equal(view(s).counts.active,0);assert.equal(view(s).items[0].state,'failed');
}finally{s.close();}}});

test('abort during a pending body read rejects truncated content and persists cancellation, never success',async()=>{const s=setup();try{
 const w=worker(s),stop=new AbortController();const f=managedModelFetch(async()=>new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('partial'));}})),k=>Promise.resolve(s.app.modelHttp.acquire(w,k)),(k,r)=>Promise.resolve(s.app.modelHttp.finish(w,k,r)),stop.signal);
 const response=await f('https://provider.invalid'),body=response.text();await pause(10);stop.abort();await assert.rejects(body);assert.equal(view(s).counts.active,0);assert.equal(view(s).items[0].state,'cancelled');assert.equal(view(s).items[0].receivedBytes,7);
}finally{s.close();}});

test('two independent controllers atomically compete for one shared HTTP slot',async()=>{const s=setup();try{
 const ids=[worker(s),worker(s,s.app.sessions.create(USER,s.project.id,{title:'second controller'}))];configure(s,1);const module=pathToFileURL(resolve('dist/packages/research-app.js')).href,buffer=new SharedArrayBuffer(4);let ready=0;
 const workers=ids.map((identity,i)=>new Worker(`const {parentPort,workerData:d}=require('node:worker_threads');(async()=>{const {ResearchApp}=await import(d.module);const app=new ResearchApp(d.dir,d.repo);parentPort.postMessage({ready:true});Atomics.wait(new Int32Array(d.buffer),0,0);try{parentPort.postMessage(app.modelHttp.acquire(d.identity,'race-'+d.i));}catch(e){parentPort.postMessage({error:e.code??String(e)});}finally{app.close();}})();`,{eval:true,workerData:{module,dir:s.dir,repo:process.cwd(),identity,i,buffer}}));
 const exits=workers.map(w=>new Promise(r=>w.on('exit',r))),results=workers.map(w=>new Promise((resolve,reject)=>{w.on('message',m=>{if(m.ready){if(++ready===2){Atomics.store(new Int32Array(buffer),0,1);Atomics.notify(new Int32Array(buffer),0);}}else resolve(m);});w.on('error',reject);}));const done=await Promise.all(results);await Promise.all(exits);assert.equal(done.filter(r=>r.allowed===true).length,1);assert.equal(done.filter(r=>r.allowed===false).length,1);assert.deepEqual(view(s).counts,{queued:1,active:1,unknown:0});
}finally{s.close();}});
