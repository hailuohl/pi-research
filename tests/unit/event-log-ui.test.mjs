import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {ProjectEventFeed}=await import('../../dist/web/assets/event-feed.js');
const {LogView,LOG_PAGE_BYTES}=await import('../../dist/web/assets/log-view.js');
const {ApiError,eventStream,setToken}=await import('../../dist/web/assets/api.js');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function view(read){const v=synchronousState(new LogView({read,streamLabel:'日志流'}));synchronousState(v);return v;}
const page=(start,content,extra={})=>({start,content,cursor:start+Buffer.byteLength(content),size:start+Buffer.byteLength(content),identity:'stream-1',complete:false,...extra});

test('event acknowledgements are project-scoped and wait for successful snapshots including reset',async t=>{
 const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;const storage=new Map([['pi-research-events:p','1000001']]);
 globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};t.after(()=>{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;});
 let apply=false;const requested=[];globalThis.fetch=async url=>{requested.push(url);return {ok:true,json:async()=>({items:[{seq:1000002}],cursor:1000002,latestCursor:1000002,hasMore:false,reset:false})};};
 const feed=new ProjectEventFeed('p',async()=>apply,()=>{});t.after(()=>feed.stop());await feed.drain();assert.equal(storage.get('pi-research-events:p'),'1000001');
 apply=true;await feed.drain();assert.equal(storage.get('pi-research-events:p'),'1000002');assert.ok(requested.every(url=>url.includes('projectId=p')&&url.includes('after=1000001')));
 globalThis.fetch=async()=>({ok:true,json:async()=>({items:[],cursor:5,latestCursor:5,hasMore:false,reset:true})});await feed.drain();assert.equal(storage.get('pi-research-events:p'),'5');
 let snapshots=0;globalThis.fetch=async()=>{throw Error('events offline');};const other=new ProjectEventFeed('q',async()=>{snapshots++;return true;},()=>{});await other.drain();other.stop();assert.equal(snapshots,1);assert.equal(storage.has('pi-research-events:q'),false);
});

test('event catch-up is three pages and stream authentication stays in headers',async t=>{
 const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldSession=globalThis.sessionStorage;t.after(()=>{setToken('');globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;globalThis.sessionStorage=oldSession;});
 globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.sessionStorage={setItem(){}};let calls=0;
 globalThis.fetch=async()=>({ok:true,json:async()=>({items:[{seq:++calls}],cursor:calls,latestCursor:100,hasMore:true,reset:false})});
 const feed=new ProjectEventFeed('p',async()=>true,()=>{});await feed.drain();feed.stop();assert.equal(calls,3);
 setToken('unit-token');let request;globalThis.fetch=async(url,options)=>{request={url,options};return {ok:true,body:new ReadableStream({start(c){c.close();}}),headers:new Headers({'content-type':'text/event-stream'})};};
 await eventStream('/events/stream?projectId=p&after=3',new AbortController().signal);assert.ok(!request.url.includes('unit-token'));assert.equal(request.options.headers.Authorization,'Bearer unit-token');
});

test('UTF-8 log windows stay bounded and record observed byte boundaries',async()=>{
 const requests=[],first='x'.repeat(LOG_PAGE_BYTES-3)+'你',second='🙂'.repeat(16000);
 const v=view(async request=>{requests.push(request);return request.cursor===0?page(0,first,{size:200000}):page(LOG_PAGE_BYTES,second,{size:200000});});
 v.state.following=false;await v.load(0);await v.load(LOG_PAGE_BYTES);
 assert.equal(v.state.page.content,second);assert.ok(Buffer.byteLength(v.state.page.content)<=LOG_PAGE_BYTES);assert.equal(requests[1].identity,'stream-1');
 assert.deepEqual(v.starts.slice(0,3),[0,LOG_PAGE_BYTES,LOG_PAGE_BYTES+Buffer.byteLength(second)]);
 v.navigate(0);await tick();assert.equal(v.state.page.content,first);v.componentWillUnmount();
});

test('late stream responses are discarded and reset or invalid encoding pause following',async()=>{
 const pending=[];const v=view((request,signal)=>new Promise((resolve,reject)=>pending.push({request,signal,resolve,reject})));
 const old=v.load(0);v.selectStream('stderr');assert.equal(pending[0].signal.aborted,true);
 pending[1].resolve(page(0,'stderr',{complete:true}));await tick();pending[0].resolve(page(0,'old stdout'));await old;
 assert.equal(v.state.page.content,'stderr');assert.equal(v.state.stream,'stderr');
 const reset=v.load(6);pending[2].reject(new ApiError('LOG_RESET','reset',409));await reset;assert.equal(v.state.reset,true);assert.equal(v.state.following,false);assert.equal(v.state.page.content,'stderr');
 v.fromStart();assert.equal(pending[3].request.identity,undefined);pending[3].reject(new ApiError('LOG_ENCODING_INVALID','invalid',415));await tick();assert.equal(v.state.following,false);assert.match(v.state.error,/UTF-8/);v.componentWillUnmount();
});

test('following catches up three pages per turn and retains the last visible page at EOF',async()=>{
 let calls=0;const v=view(async({cursor})=>{calls++;return page(cursor,'x'.repeat(LOG_PAGE_BYTES),{size:10*LOG_PAGE_BYTES});});
 await v.follow();assert.equal(calls,3);assert.equal(v.state.page.content.length,LOG_PAGE_BYTES);v.componentWillUnmount();
 const done=view(async({cursor})=>page(cursor,'',{complete:true}));done.state.page=page(0,'retained',{complete:false});await done.follow();assert.equal(done.state.page.content,'retained');assert.equal(done.state.page.complete,true);done.componentWillUnmount();
});

test('a partial event catch-up failure does not self-poll and the notice clears after recovery',async t=>{
 const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;t.after(()=>{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;});
 globalThis.localStorage={getItem:()=>null,setItem(){}};let requests=0;const notices=[];
 globalThis.fetch=async()=>{if(++requests===2)throw Error('second page offline');return {ok:true,json:async()=>({items:[{seq:1}],cursor:1,latestCursor:100,hasMore:true,reset:false})};};
 const feed=new ProjectEventFeed('p',async()=>true,value=>notices.push(value));feed.disconnected=false;
 await feed.drain();assert.equal(requests,2);assert.equal(feed.pending,false);assert.equal(feed.scheduled,undefined);assert.match(notices.at(-1),/补拉暂不可用/);
 globalThis.fetch=async()=>({ok:true,json:async()=>({items:[],cursor:1,latestCursor:1,hasMore:false,reset:false})});await feed.drain();assert.equal(notices.at(-1),'');feed.stop();
});

test('session display replaces partial output from the authoritative generation and cancels stale selection errors',async t=>{
 const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;
 t.after(()=>{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;});
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 const {App}=await import('../../dist/web/assets/app.js');
 const app=synchronousState(new App({}));synchronousState(app);app.feed={projectId:'p',stop(){}};app.state.projectId='p';app.state.sessionId='s';app.state.stream='old partial';
 const session={id:'s',role:'coordinator',state:'running',generation:8};let active=true;
 globalThis.fetch=async url=>({ok:true,json:async()=>url.endsWith('/bootstrap')?{projects:[{id:'p'}]}:url.endsWith('/state')?{sessions:[session],experiments:[]}: {session,messages:[{id:'m',content:'complete previous message'}],progress:{generation:8,active,content:'snapshot tail',truncated:true,cursor:123}}});
 assert.equal(await app.refresh(),true);assert.equal(app.state.stream,'snapshot tail');assert.equal(app.state.streamTruncated,true);
 active=false;await app.refresh();assert.equal(app.state.stream,'');assert.equal(app.state.messages[0].id,'m');
 let rejectOld,signal;globalThis.fetch=(_url,options)=>{signal=options.signal;return new Promise((_resolve,reject)=>{rejectOld=reject;});};const request=app.refresh();app.invalidateRead();app.state.connected=true;rejectOld(Error('stale offline'));await request;assert.equal(signal.aborted,true);assert.equal(app.state.connected,true);app.componentWillUnmount();
});
