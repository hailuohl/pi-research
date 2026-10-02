import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';

const {SessionList}=await import('../../dist/web/assets/session-list.js');
const {SessionHistory}=await import('../../dist/web/assets/session-history.js');
const {Chat}=await import('../../dist/web/assets/workbench.js');
const {App}=await import('../../dist/web/assets/app.js');
const response=data=>({ok:true,json:async()=>data});
function component(element,name){
    if(Array.isArray(element))return element.map(child=>component(child,name)).find(Boolean);
    if(!element||typeof element!=='object')return null;
    return element.type?.name===name?element:component(element.props?.children,name);
}

test('session catalog requests bounded stable pages and keeps the selected row visible',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
    const requests=[];
    globalThis.fetch=async(_url,options)=>{const body=JSON.parse(options.body);requests.push(body.input);return response({items:[{id:'recent',title:'Recent',state:'open'}],nextCursor:body.input.beforeSessionId?'': 'cursor-10'});};
    const list=synchronousState(new SessionList({projectId:'p',selectedId:'old',selected:{id:'old',title:'Older selected',state:'open'},onSelect(){},onNew(){}}));
    await list.load();assert.deepEqual(requests[0],{query:'',role:'coordinator',limit:10});
    const markup=JSON.stringify(list.render());assert.match(markup,/Older selected/);
    list.next();await new Promise(resolve=>setImmediate(resolve));assert.equal(requests[1].beforeSessionId,'cursor-10');
    list.componentWillUnmount();
});

test('message reader uses returned byte cursors, versions, and ignores stale responses',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
    const pending=[];globalThis.fetch=(_url,options)=>new Promise(resolve=>pending.push({input:JSON.parse(options.body).input,resolve}));
    const props={projectId:'p',sessionId:'s',messages:[{id:'m',version:2,content:'preview',previewTruncated:true,contentBytes:20000,role:'assistant'}],history:null,historyAnchor:null,onNavigate(){},perform(){}};
    const reader=synchronousState(new SessionHistory(props));
    const first=reader.read('m',0,2);assert.deepEqual(pending[0].input,{sessionId:'s',messageId:'m',cursor:0,limit:16000,expectedVersion:2});
    pending[0].resolve(response({sessionId:'s',messageId:'m',version:2,content:'你',cursor:0,end:3,total:20000,complete:false,cursorUnit:'utf8-byte',sourceTruncated:false}));await first;
    const second=reader.read('m',reader.state.page.end,reader.state.page.version);assert.equal(pending[1].input.cursor,3);assert.equal(pending[1].input.expectedVersion,2);
    reader.close();pending[1].resolve(response({sessionId:'s',messageId:'m',version:2,content:'stale',cursor:3,end:8,total:20000,complete:false}));await second;
    assert.equal(reader.state.page,null);reader.componentWillUnmount();
});

test('message reader rejects mismatched identity, version, encoding, and byte bounds',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
    const props={projectId:'p',sessionId:'s',messages:[{id:'m',version:2,content:'preview',role:'assistant'}],history:null,historyAnchor:null,onNavigate(){},perform(){}};
    const valid={sessionId:'s',messageId:'m',version:2,content:'你',cursor:0,end:3,total:10,complete:false,cursorUnit:'utf8-byte',sourceTruncated:false};
    for(const mismatch of [{sessionId:'other'},{messageId:'other'},{version:3},{cursorUnit:'unicode-code-point'},{cursor:4},{end:4},{total:2}]){
        globalThis.fetch=async()=>response({...valid,...mismatch});
        const reader=synchronousState(new SessionHistory(props));await reader.read('m',0,2);
        assert.equal(reader.state.page,null);assert.match(reader.state.error,/响应与请求不一致/);reader.componentWillUnmount();
    }
});

test('a history anchor keeps return-to-live visible after the last newer page',()=>{
    const reader=synchronousState(new SessionHistory({projectId:'p',sessionId:'s',messages:[],history:{beforeMessageId:null,afterMessageId:null,atLatest:true},historyAnchor:{direction:'after',id:'m'},onNavigate(){},perform(){}}));
    assert.match(JSON.stringify(reader.render()),/返回最新/);reader.componentWillUnmount();
});

test('task and archived sessions cannot send; task view hides agent interrupt',()=>{
    const base={data:{project:{settings:{enabled:false}},wakeups:[]},boot:{runtime:{ready:true,message:''}},messages:[],history:null,historyAnchor:null,stream:'',perform(){},onNew(){},onExperiments(){},onWorkspace(){},onSession(){},onHistory(){}};
    const task=synchronousState(new Chat({...base,session:{id:'s',taskId:'t',state:'running',model:{provider:'x',model:'y'}}}));task.state.draft='hello';
    const taskView=JSON.stringify(task.render());assert.match(taskView,/团队任务控件/);assert.doesNotMatch(taskView,/停止 Agent/);assert.match(taskView,/"disabled":true/);
    const archived=synchronousState(new Chat({...base,session:{id:'a',state:'archived',model:{provider:'x',model:'y'}}}));archived.state.draft='hello';assert.match(JSON.stringify(archived.render()),/已归档会话不可发送/);
});

test('refresh keeps an explicitly selected old session and its history anchor',async t=>{
    const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;t.after(()=>{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;});
    globalThis.localStorage={getItem:()=>null,setItem(){}};
    const app=synchronousState(new App({}));app.feed={projectId:'p',stop(){}};app.state.projectId='p';app.state.sessionId='old';app.state.historyAnchor={direction:'before',id:'m10'};
    const urls=[];globalThis.fetch=async url=>{urls.push(url);if(url.endsWith('/bootstrap'))return response({projects:[{id:'p'}]});if(url.includes('/state'))return response({sessions:[{id:'recent',role:'coordinator'}],experiments:[]});return response({session:{id:'old',role:'coordinator',generation:1},messages:[{id:'m1'}],history:{beforeMessageId:'m1',afterMessageId:'m2',atLatest:false},progress:{generation:1,active:true,content:'hidden'}});};
    assert.equal(await app.refresh(),true);assert.equal(app.state.sessionId,'old');assert.equal(app.state.messages[0].id,'m1');assert.equal(app.state.stream,'');
    assert.ok(urls.some(url=>url.includes('/state?sessionId=old')));assert.ok(urls.some(url=>url.includes('/sessions/old/view?beforeMessageId=m10')));
    app.componentWillUnmount();
});

test('implementation, campaign and Run links reset history for sessions outside recent state',()=>{
    const oldStorage=globalThis.localStorage;globalThis.localStorage={getItem:()=>null,setItem(){}};
    try{
        const app=synchronousState(new App({}));app.refresh=async()=>true;
        Object.assign(app.state,{projectId:'p',sessionId:'recent',boot:{projects:[{id:'p'}]},data:{project:{id:'p'},sessions:[{id:'recent'}],experiments:[],runs:[]}});
        for(const [tab,name,callback,targetTab] of [['implementation','ImplementationView','onSession','implementation'],['campaigns','CampaignView','onImplementation','implementation'],['experiments','Experiments','onSession','chat']]){
            Object.assign(app.state,{tab,sessionId:'recent',messages:[{id:'old-body'}],history:{atLatest:false},historyAnchor:{direction:'before',id:'old-cursor'},stream:'old stream'});
            const view=component(app.render(),name);assert.ok(view,`${name} rendered`);view.props[callback]('older-root');
            assert.equal(app.state.sessionId,'older-root');assert.equal(app.state.tab,targetTab);assert.deepEqual(app.state.messages,[]);assert.equal(app.state.history,null);assert.equal(app.state.historyAnchor,null);assert.equal(app.state.stream,'');
        }
        app.componentWillUnmount();
    }finally{globalThis.localStorage=oldStorage;}
});

test('foreign session selection reports scoped failure without showing the previous body',async t=>{
    const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;t.after(()=>{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;});
    globalThis.localStorage={getItem:()=>null,setItem(){}};
    const app=synchronousState(new App({}));app.feed={projectId:'p',stop(){}};
    Object.assign(app.state,{projectId:'p',sessionId:'recent',messages:[{id:'previous-body'}],historyAnchor:{direction:'before',id:'previous-cursor'}});
    const urls=[];globalThis.fetch=async url=>{urls.push(url);return url.endsWith('/bootstrap')?response({projects:[{id:'p'}]}):{ok:false,status:403,json:async()=>({error:{code:'SCOPE_DENIED',message:'会话不属于此项目'}})};};
    app.selectSession('foreign');await app.refresh();
    assert.deepEqual(app.state.messages,[]);assert.equal(app.state.historyAnchor,null);assert.match(app.state.error,/不属于此项目/);
    assert.ok(urls.some(url=>url.includes('/state?sessionId=foreign')));assert.ok(!urls.some(url=>url.includes('/sessions/foreign/view')));
    app.componentWillUnmount();
});

test('project and session creation clear the prior history selection',async t=>{
    const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;t.after(()=>{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;});
    globalThis.localStorage={getItem:()=>null,setItem(){}};
    globalThis.fetch=async url=>response(url.endsWith('/projects')?{id:'new-project'}:url.endsWith('/sessions')?{id:'new-session'}:{});
    const app=synchronousState(new App({}));app.perform=async fn=>fn();app.refresh=async()=>true;
    Object.assign(app.state,{projectId:'old-project',sessionId:'old-session',modal:'project',messages:[{id:'old-body'}],historyAnchor:{direction:'before',id:'old-cursor'}});
    await app.modalView().props.onSubmit({get:()=>''});
    assert.equal(app.state.projectId,'new-project');assert.equal(app.state.sessionId,'new-session');assert.deepEqual(app.state.messages,[]);assert.equal(app.state.historyAnchor,null);
    Object.assign(app.state,{messages:[{id:'old-body'}],historyAnchor:{direction:'before',id:'old-cursor'}});
    await app.newSession();assert.deepEqual(app.state.messages,[]);assert.equal(app.state.historyAnchor,null);
    app.componentWillUnmount();
});
