import {App} from '../../dist/web/assets/app.js';
import {ProjectEventFeed} from '../../dist/web/assets/event-feed.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {SessionList} from '../../dist/web/assets/session-list.js';
const elements=n=>Array.isArray(n)?n.flatMap(elements):!n||typeof n!=='object'?[]:[n,...elements(n.props?.children)];
const s=(id,extra={})=>({id,title:id,projectId:'p',version:1,state:'idle',role:'coordinator',...extra});
const list=()=>{const l=synchronousState(new SessionList({projectId:'p',selectedId:'a',selected:s('a'),creationSignal:0,busy:false,onSelect(){},onChanged(){}}));l.state.page={items:[s('a'),s('b')],nextCursor:null};return l;};
const button=(l,label)=>elements(l.render()).find(n=>n.type==='button'&&n.props['aria-label']===label);
const dialog=l=>elements(l.render()).find(n=>n.type?.name==='Modal');
const flush=()=>new Promise(r=>setImmediate(r));
test('list exposes lifecycle actions and freezes target, version and request key across failure and double-submit',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const l=list(),calls=[];let finish,changed=[];l.props.onChanged=(...a)=>changed.push(a);
 assert.ok(button(l,'归档会话：b'));button(l,'删除会话：b').props.onClick();assert.equal(dialog(l).props.title,'删除会话');const input=elements(dialog(l)).find(n=>n.type==='input');input.props.onChange({target:{value:'b'}});
 globalThis.fetch=(url,init)=>{calls.push({url,body:JSON.parse(init.body),key:init.headers['Idempotency-Key']});return new Promise(r=>finish=r);};
 const first=dialog(l).props.onSubmit(new FormData()),second=dialog(l).props.onSubmit(new FormData());await flush();assert.equal(calls.length,1);assert.deepEqual(calls[0].body,{expectedVersion:1,confirmTitle:'b'});
 finish({ok:false,status:409,json:async()=>({error:{code:'SESSION_BUSY',message:'busy'}})});await Promise.all([first,second]);assert.ok(dialog(l));assert.match(JSON.stringify(l.render()),/busy/);
 const retry=dialog(l).props.onSubmit(new FormData());await flush();assert.deepEqual(calls[1],calls[0]);finish({ok:true,json:async()=>s('b',{state:'archived',deletedAt:'now',version:2})});await retry;assert.equal(changed.length,1);assert.equal(changed[0][0].id,'b');l.componentWillUnmount();
});
test('context switch invalidates an outstanding cleanup receipt and leaves the new list unchanged',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const l=list();let finish,changes=0;l.props.onChanged=()=>changes++;globalThis.fetch=url=>url.includes('/operations/')?Promise.resolve({ok:true,json:async()=>({items:[],nextCursor:null})}):new Promise(r=>finish=r);
 button(l,'归档会话：b').props.onClick();const request=dialog(l).props.onSubmit(new FormData());await flush();const previous=l.props;l.props={...previous,selectedId:'other'};l.componentDidUpdate(previous);finish({ok:true,json:async()=>s('b',{state:'archived',version:2})});await request;assert.equal(changes,0);assert.equal(dialog(l),undefined);l.componentWillUnmount();
});
test('running, task and archived-project rows disable lifecycle actions',()=>{for(const extra of [{state:'running'},{taskId:'t'}]){const l=list();l.state.page.items=[s('b',extra)];assert.equal(button(l,'删除会话：b').props.disabled,true);}const l=list();l.props={...l.props,projectArchived:true};assert.equal(button(l,'归档会话：b').props.disabled,true);});

test('deleted saved session and a deletion between state/view reads recover inside the same project',async t=>{
 const previous={fetch:globalThis.fetch,localStorage:globalThis.localStorage},start=ProjectEventFeed.prototype.start;globalThis.localStorage={getItem:()=>null,setItem(){}};ProjectEventFeed.prototype.start=function(){};t.after(()=>{Object.assign(globalThis,previous);ProjectEventFeed.prototype.start=start;});
 for(const race of [false,true]){const app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',sessionId:'deleted',historyAnchor:{direction:'before',id:'old-message'}});const requests=[];
 globalThis.fetch=async url=>{requests.push(url);const data=url.endsWith('/bootstrap')?{projects:[{id:'p'},{id:'other'}]}:url.includes('model-management')?{schemaVersion:2,providers:[]}:url.includes('/projects/p/state')?{project:{id:'p'},sessions:[s('fallback')],experiments:[]}:url.includes('/sessions/fallback/view')?{session:s('fallback'),messages:[],progress:{active:false}}:null;
 if(url.includes('/state?')&&!race||url.includes('/sessions/deleted/view'))return {ok:false,status:410,json:async()=>({error:{code:'SESSION_DELETED',message:'deleted'}})};return {ok:true,json:async()=>data};};
 assert.equal(await app.refresh(),true);assert.equal(app.state.projectId,'p');assert.equal(app.state.sessionId,'fallback');assert.equal(app.state.historyAnchor,null);assert.ok(!requests.some(url=>url.includes('/projects/other')));app.componentWillUnmount();}
});
test('deleting a non-current session keeps current messages; current deletion selects another valid session',()=>{
 const previous=globalThis.localStorage;globalThis.localStorage={getItem:()=>null,setItem(){}};try{const app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',sessionId:'a',data:{project:{id:'p'},sessions:[s('a'),s('b')]},messages:[{id:'retained'}]});
 app.confirmSessionLifecycle(s('b',{deletedAt:'now',state:'archived',version:2}),'delete');assert.equal(app.state.sessionId,'a');assert.deepEqual(app.state.messages,[{id:'retained'}]);app.state.data.sessions.push(s('c'));app.confirmSessionLifecycle(s('a',{deletedAt:'now',state:'archived',version:2}),'delete');assert.equal(app.state.sessionId,'c');assert.deepEqual(app.state.messages,[]);app.componentWillUnmount();}finally{globalThis.localStorage=previous;}
});
