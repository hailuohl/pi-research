import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {renderToStaticMarkup} from 'react-dom/server';
import {synchronousState} from '../support/ui.mjs';
import {EventStreamHub} from '../../dist/apps/server/event-stream.js';
import {ProjectEventFeed} from '../../dist/web/assets/event-feed.js';
import {ConversationActivity} from '../../dist/web/assets/session-history.js';

const nodes=node=>Array.isArray(node)?node.flatMap(nodes):!node||typeof node!=='object'?[]:[node,...nodes(node.props?.children)];
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function preview(t,initial=''){
 const element=nodes(ConversationActivity({active:true,content:initial})).find(node=>typeof node.type==='function'&&'content' in node.props);
 const view=synchronousState(new element.type(element.props));
 view.componentDidMount?.();t.after(()=>view.componentWillUnmount?.());
 return {view,read:()=>renderToStaticMarkup(view.render()).replace(/<[^>]*>/g,''),update(content){const previous=view.props;view.props={...previous,content};const state=view.constructor.getDerivedStateFromProps?.(view.props,view.state);if(state)Object.assign(view.state,state);view.componentDidUpdate?.(previous);}};
}

test('SSE exposes the latest coalesced cursor within 150ms and remains idle without events',t=>{
 t.mock.timers.enable({apis:['setInterval','Date'],now:1000});let cursor=1;
 const hub=new EventStreamHub({visibleEventCursor:()=>cursor});t.after(()=>hub.close());
 class Response extends EventEmitter{frames=[];setHeader(){}flushHeaders(){}write(frame){this.frames.push(frame);return true;}end(){}destroy(){this.emit('close');}}
 const res=new Response();hub.open(new EventEmitter(),res,{after:0});cursor=30;
 t.mock.timers.tick(149);assert.equal(res.frames.length,1);t.mock.timers.tick(1);assert.match(res.frames[1]??'',/"cursor":30/);
 t.mock.timers.tick(900);assert.equal(res.frames.length,2);
});

test('frontend wake bursts apply one snapshot in 150ms and never add idle polling',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;t.after(()=>{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;});
 globalThis.localStorage={getItem:()=>null,setItem(){}};let requests=0,snapshots=0;
 globalThis.fetch=async()=>{requests++;return {ok:true,json:async()=>({items:[],cursor:0,latestCursor:0,hasMore:false,reset:false})};};
 const feed=new ProjectEventFeed('p',async()=>{snapshots++;return true;},()=>{});t.after(()=>feed.stop());
 for(let n=0;n<20;n++)feed.wake();t.mock.timers.tick(149);await turn();assert.equal(snapshots,0);
 t.mock.timers.tick(1);await turn();assert.equal(snapshots,1);assert.equal(requests,1);
 t.mock.timers.tick(20000);await turn();assert.equal(requests,1);
});

test('active preview reveals appended Unicode in small batches and catches growing backlog within 200ms',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});const p=preview(t,'开始');
 const text='开始'+'你🙂'.repeat(30);p.update(text);assert.equal(p.read(),'开始');t.mock.timers.tick(32);
 const first=p.read();assert.ok(first.length>0&&first.length<text.length);assert.equal(first.isWellFormed(),true);
 p.update(text+'追加'.repeat(200));t.mock.timers.tick(168);assert.equal(p.read(),text+'追加'.repeat(200));
});

test('replacement, clearing, and unmount discard pending old preview frames while initial content is immediate',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});const p=preview(t,'已有历史');assert.equal(p.read(),'已有历史');
 p.update('已有历史'+'旧'.repeat(50));t.mock.timers.tick(32);p.update('替换');assert.equal(p.read(),'替换');t.mock.timers.tick(1000);assert.equal(p.read(),'替换');
 p.update('替换'+'新'.repeat(50));p.update('');t.mock.timers.tick(1000);assert.equal(p.read(),'');
 p.update('卸载后不能出现'.repeat(20));let updates=0;p.view.setState=()=>{updates++;};p.view.componentWillUnmount?.();t.mock.timers.tick(1000);assert.equal(updates,0);
});

test('reduced motion and hidden-tab recovery show the authoritative preview without queued playback',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});const oldWindow=globalThis.window,oldDocument=globalThis.document,listeners=new Map();
 const media={matches:true,addEventListener(name,fn){listeners.set('media',fn);},removeEventListener(){listeners.delete('media');}};
 globalThis.window={matchMedia:()=>media};globalThis.document={hidden:false,addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name){listeners.delete(name);}};
 t.after(()=>{globalThis.window=oldWindow;globalThis.document=oldDocument;});const p=preview(t,'减少');
 p.update('减少动态');assert.equal(p.read(),'减少动态');media.matches=false;listeners.get('media')?.();
 p.update('减少动态'+'后台'.repeat(20));document.hidden=true;listeners.get('visibilitychange')?.();assert.equal(p.read(),'减少动态'+'后台'.repeat(20));
 p.update('减少动态'+'后台'.repeat(40));assert.equal(p.read(),'减少动态'+'后台'.repeat(40));document.hidden=false;listeners.get('visibilitychange')?.();t.mock.timers.tick(1000);assert.equal(p.read(),'减少动态'+'后台'.repeat(40));
 p.view.componentWillUnmount?.();assert.equal(listeners.size,0);
});

test('every long-preview frame preserves Unicode boundaries and the exact latest message',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});const p=preview(t,''),text='长文🙂𠮷'.repeat(8000);p.update(text);
 let prior='';for(let frame=0;frame<7;frame++){t.mock.timers.tick(32);const shown=p.read();assert.equal(shown.isWellFormed(),true);assert.ok(shown.startsWith(prior));assert.ok(text.startsWith(shown));prior=shown;}
 assert.equal(p.read(),text);
});

test('queued React updates cannot append an old preview after replacement or unmount',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});const p=preview(t,'start'),pending=[];
 p.view.setState=(update,callback)=>pending.push({update,callback});p.update('start'+'old'.repeat(30));t.mock.timers.tick(32);assert.equal(pending.length,1);
 p.update('replacement');assert.equal(pending[0].update(),null);pending[0].callback();assert.equal(p.read(),'replacement');
 p.update('replacement'+'tail'.repeat(30));t.mock.timers.tick(32);p.view.componentWillUnmount();assert.equal(pending.at(-1).update(),null);pending.at(-1).callback();t.mock.timers.tick(1000);assert.equal(p.read(),'replacement');
});
