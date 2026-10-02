import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {EventStreamHub,MAX_EVENT_STREAMS} from '../../dist/apps/server/event-stream.js';
import {Store,EVENT_PAGE_PAYLOAD_BYTES} from '../../dist/packages/storage/store.js';
import {USER} from '../../dist/packages/domain/types.js';
async function setup(){const dir=mkdtempSync(join(tmpdir(),'events-http-')),service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0}),port=await service.listen(),base=`http://127.0.0.1:${port}/api`;const headers={};return {dir,service,base,headers,async get(path,extra={}){const response=await fetch(base+path,{headers:{...headers,...extra}});return {status:response.status,value:await response.json()};},async close(){await service.close();rmSync(dir,{recursive:true,force:true});}};}
function timeout(promise){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('SSE fixture timeout')),3000);promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});}
function frames(response){const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';return {reader,async next(){while(!buffer.includes('\n\n')){const item=await timeout(reader.read());if(item.done)return null;buffer+=decoder.decode(item.value,{stream:true});}const at=buffer.indexOf('\n\n'),frame=buffer.slice(0,at);buffer=buffer.slice(at+2);return frame;}};}
const wake=frame=>JSON.parse(frame.split('\n').find(line=>line.startsWith('data: ')).slice(6));

test('event HTTP pages retain durable ordered cursors, project isolation, safe integers, bounds and reset semantics',async()=>{
 const s=await setup();try {
  const a=s.service.app.projects.create(USER,{name:'events A'}),b=s.service.app.projects.create(USER,{name:'events B'}),store=s.service.app.store,start=store.eventCursor(a.id),expected=[];
  store.transaction(()=>{for(let n=0;n<17;n++){expected.push(store.event(a.id,'fixture.a',{n}).seq);store.event(b.id,'fixture.b',{n});}});
  let cursor=start,actual=[];for(let page=0;page<10;page++){const response=await s.get(`/events?projectId=${a.id}&after=${cursor}&limit=3`);assert.equal(response.status,200);assert.equal(response.value.reset,false);assert.ok(response.value.items.length<=3);assert.ok(response.value.items.every(item=>item.projectId===a.id));actual.push(...response.value.items.map(item=>item.seq));cursor=response.value.cursor;if(!response.value.hasMore)break;}
  assert.deepEqual(actual,expected);assert.deepEqual((await s.get(`/events?projectId=${a.id}&after=${start}&limit=3`)).value.items.map(item=>item.seq),expected.slice(0,3));
  const reset=await s.get(`/events?projectId=${a.id}&after=${Number.MAX_SAFE_INTEGER}`);assert.deepEqual(reset.value,{items:[],cursor:cursor,hasMore:false,latestCursor:cursor,reset:true});
  store.db.prepare('INSERT INTO events(seq,id,project_id,type,payload,created_at) VALUES(?,?,?,?,?,?)').run(1000005,randomUUID(),a.id,'fixture.large-seq','{}',new Date().toISOString());
  const large=await s.get(`/events?projectId=${a.id}&after=1000000`);assert.equal(large.status,200);assert.equal(large.value.cursor,1000005);
  for(const query of ['after=-1','after=9007199254740992','after=1.5','limit=501','limit=0','after=0&after=1','token=forbidden'])assert.equal((await s.get('/events?'+query)).status,400,query);
  assert.equal((await s.get('/events?projectId=not-found')).status,404);
  assert.equal((await fetch(s.base+'/events')).status,200);assert.equal((await s.get('/events',{Origin:'http://other.invalid'})).status,403);
  const before=store.eventCursor(a.id);store.event(a.id,'fixture.oversize',{body:'x'.repeat(100000)});for(let n=0;n<8;n++)store.event(a.id,'fixture.medium',{body:'x'.repeat(60000)});
  const bounded=(await s.get(`/events?projectId=${a.id}&after=${before}`)).value;assert.equal(bounded.items.length,9);assert.equal(bounded.items[0].omitted,true);assert.equal(bounded.items[0].payload,null);assert.ok(bounded.items.filter(item=>!item.omitted).reduce((sum,item)=>sum+Buffer.byteLength(JSON.stringify(item.payload)),0)<=EVENT_PAGE_PAYLOAD_BYTES);assert.equal(bounded.cursor,bounded.latestCursor);
 }finally{await s.close();}
});

test('SSE opens without a token, sends only coalesced wakeups, reconnects by cursor and closes with the HTTP service',async()=>{
 const s=await setup();let stream,second;try {
  const p=s.service.app.projects.create(USER,{name:'stream'}),store=s.service.app.store,initial=store.eventCursor(p.id);
  assert.equal((await fetch(s.base+'/events/stream?token=legacy')).status,400);
  assert.equal((await s.get('/events/stream?token=ignored')).status,400);
  assert.equal((await s.get('/events/stream?after=1',{'Last-Event-ID':'2'})).status,400);assert.equal((await s.get('/events/stream',{'Last-Event-ID':'invalid'})).status,400);
  const response=await fetch(s.base+`/events/stream?projectId=${p.id}&after=${initial}`,{headers:s.headers});assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/event-stream/);stream=frames(response);assert.deepEqual(wake(await stream.next()),{cursor:initial,reset:false});
  for(let n=0;n<30;n++)store.event(p.id,'fixture.delta',{text:'business payload never in SSE',n});
  const latest=store.eventCursor(p.id),frame=await stream.next();assert.deepEqual(wake(frame),{cursor:latest,reset:false});assert.ok(!frame.includes('business payload'));
  await stream.reader.cancel();stream=null;const added=store.event(p.id,'fixture.offline',{n:31});
  const reconnect=await fetch(s.base+`/events/stream?projectId=${p.id}`,{headers:{...s.headers,'Last-Event-ID':String(latest)}});second=frames(reconnect);assert.equal(wake(await second.next()).cursor,added.seq);
  const replay=await s.get(`/events?projectId=${p.id}&after=${latest}`);assert.deepEqual(replay.value.items.map(item=>item.seq),[added.seq]);
  await timeout(s.service.close());await timeout(second.reader.read().catch(()=>({done:true})));second=null;
 }finally{await stream?.reader.cancel().catch(()=>{});await second?.reader.cancel().catch(()=>{});await s.close();}
});

test('SSE backpressure halts writes until drain, heartbeats are bounded and connection cleanup is complete',t=>{
 t.mock.timers.enable({apis:['setInterval','Date'],now:1000});let cursor=1;
 const hub=new EventStreamHub({eventCursor:()=>cursor});
 class Response extends EventEmitter {frames=[];blocked=true;headers={};setHeader(k,v){this.headers[k]=v;}flushHeaders(){}write(frame){this.frames.push(frame);return !this.blocked;}end(){}destroy(){this.emit('close');}}
 const req=new EventEmitter(),res=new Response();hub.open(req,res,{after:0});assert.equal(res.frames.length,1);cursor=20;t.mock.timers.tick(20000);assert.equal(res.frames.length,1,'no buffered write queue while socket is blocked');
 res.blocked=false;res.emit('drain');assert.equal(res.frames.length,2);assert.equal(wake(res.frames[1]).cursor,20);t.mock.timers.tick(15000);assert.equal(res.frames.at(-1),': heartbeat\n\n');
 const more=[];for(let n=1;n<MAX_EVENT_STREAMS;n++){const r=new Response(),q=new EventEmitter();hub.open(q,r,{after:cursor});more.push(r);}assert.throws(()=>hub.open(new EventEmitter(),new Response(),{after:0}),{code:'EVENT_STREAM_LIMIT'});
 res.emit('close');assert.equal(res.listenerCount('drain'),0);assert.equal(req.listenerCount('aborted'),0);assert.equal(hub.size,MAX_EVENT_STREAMS-1);hub.close();assert.equal(hub.size,0);const count=more.reduce((sum,r)=>sum+r.frames.length,0);t.mock.timers.tick(30000);assert.equal(more.reduce((sum,r)=>sum+r.frames.length,0),count);
});

test('migration four adds read indexes and consistent read snapshots do not reserve the writer lock',()=>{
 const dir=mkdtempSync(join(tmpdir(),'event-snapshot-')),a=new Store(join(dir,'state.db')),b=new Store(join(dir,'state.db'));try {
  a.event('p','before',{});const before=a.eventCursor('p');a.readSnapshot(()=>{assert.equal(a.eventCursor('p'),before);b.event('p','concurrent',{});assert.equal(a.eventCursor('p'),before);assert.equal(a.readSnapshot(()=>a.eventCursor('p')),before);});assert.equal(a.eventCursor('p'),before+1);
  assert.throws(()=>a.readSnapshot(()=>a.event('p','must-not-write',{})));assert.throws(()=>a.readSnapshot(()=>Promise.resolve()),{code:'ASYNC_TRANSACTION'});a.transaction(()=>{a.event('p','inside-write',{});assert.ok(a.readSnapshot(()=>a.eventCursor('p'))>before);});
  assert.ok(a.db.prepare('SELECT 1 FROM schema_migrations WHERE version=4').get());for(const name of ['events_project_sequence','events_session_type_sequence','records_kind_session'])assert.ok(a.db.prepare("SELECT 1 FROM sqlite_master WHERE type='index' AND name=?").get(name));
  assert.match(JSON.stringify(a.db.prepare('EXPLAIN QUERY PLAN SELECT max(seq) FROM events WHERE project_id=?').all('p')),/events_project_sequence/);
 }finally{b.close();a.close();rmSync(dir,{recursive:true,force:true});}
});
