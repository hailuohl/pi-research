import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';

const {ScrollHistory,mergeHistoryMessages,mergeHistoryPage,reconcileHistoryWindow}=await import('../../dist/web/assets/scroll-history.js');
const {SessionHistory}=await import('../../dist/web/assets/session-history.js');
const response=data=>({ok:true,json:async()=>data});
const message=(id,version=1)=>({id,version,projectId:'p',sessionId:'s',role:'assistant',status:'completed',content:`body ${id}`});
const pageHistory=(beforeMessageId=null,afterMessageId=null,atLatest=afterMessageId===null)=>({beforeMessageId,afterMessageId,atLatest,previewCharacters:4000,byteLimit:262144,returnedBytes:100});
const sessionView=(messages,history,sessionId='s',projectId='p')=>({session:{id:sessionId,projectId},messages,history});
const props=overrides=>({projectId:'p',sessionId:'s',messages:[],history:null,historyAnchor:null,onNavigate(){},perform(){},...overrides});

test('prepends in server order and keeps the newest version for duplicate ids',()=>{
    const merged=mergeHistoryMessages([message('m-20'),message('m-21')],[message('m-19'),message('m-20',2)],'before');
    assert.deepEqual(merged.map(row=>row.id),['m-19','m-20','m-21']);
    assert.equal(merged[1].version,2);assert.equal(new Set(merged.map(row=>row.id)).size,merged.length);
});

test('the cache stays at 200 rows and exposes the cursor at the trimmed edge',()=>{
    const olderWindow={messages:Array.from({length:200},(_,index)=>message(`m-${index+20}`)),beforeCursor:'m-20',afterCursor:null,atLatest:true};
    const older=mergeHistoryPage(olderWindow,Array.from({length:20},(_,index)=>message(`m-${index}`)),pageHistory('older-cursor','m-19',false),'before');
    assert.equal(older.messages.length,200);assert.equal(older.messages[0].id,'m-0');assert.equal(older.messages.at(-1).id,'m-199');
    assert.equal(older.beforeCursor,'older-cursor');assert.equal(older.afterCursor,'m-199');

    const newerWindow={messages:Array.from({length:200},(_,index)=>message(`m-${index}`)),beforeCursor:'m-0',afterCursor:'m-199',atLatest:false};
    const newer=mergeHistoryPage(newerWindow,Array.from({length:20},(_,index)=>message(`m-${index+200}`)),pageHistory('m-200',null,true),'after');
    assert.equal(newer.messages.length,200);assert.equal(newer.messages[0].id,'m-20');assert.equal(newer.messages.at(-1).id,'m-219');
    assert.equal(newer.beforeCursor,'m-20');assert.equal(newer.afterCursor,null);assert.equal(newer.atLatest,true);
});

test('a short window keeps auto-fill on one edge until user scrolls the other way',()=>{
    const view=synchronousState(new ScrollHistory(props({messages:[message('m-1')],history:pageHistory('m-1','m-2',false)}))),directions=[];
    const scroller={scrollTop:0,scrollHeight:80,clientHeight:80,getBoundingClientRect:()=>({top:0})};
    view.root.current={getBoundingClientRect:()=>({top:0,bottom:20})};view.findScrollElement=()=>scroller;view.isHostVisible=()=>true;view.isInsideHost=()=>true;
    view.mounted=true;view.autoDirection='before';view.autoPages=0;view.state={...view.state,beforeCursor:'older',afterCursor:'newer'};
    view.load=(direction,automatic)=>{directions.push(direction);if(automatic)view.autoPages++;};
    for(let index=0;index<12;index++)view.checkEdges();
    assert.equal(directions.length,10);assert.ok(directions.every(direction=>direction==='before'));
    view.onWheel({deltaY:1});assert.equal(directions.at(-1),'after');
    view.componentWillUnmount();
});

test('scroll and wheel listeners follow the active scroll host after a viewport resize',t=>{
    const oldWindow=globalThis.window,oldDocument=globalThis.document;
    t.after(()=>{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;});
    const browserWindow=new EventTarget(),desktopScroller=new EventTarget(),view=synchronousState(new ScrollHistory(props()));let desktop=true,edges=0;
    globalThis.window=browserWindow;globalThis.document={documentElement:{scrollHeight:0}};
    view.findScrollElement=()=>desktop?desktopScroller:null;view.checkEdges=()=>edges++;
    view.bindScrollEvents();desktopScroller.dispatchEvent(new Event('scroll'));assert.equal(edges,1);
    desktop=false;const beforeMobileResize=edges;view.onResize();const afterMobileResize=edges;assert.equal(afterMobileResize,beforeMobileResize+1);
    desktopScroller.dispatchEvent(new Event('scroll'));browserWindow.dispatchEvent(new Event('scroll'));assert.equal(edges,afterMobileResize+1);
    desktop=true;view.onResize();const afterDesktopResize=edges;browserWindow.dispatchEvent(new Event('scroll'));desktopScroller.dispatchEvent(new Event('scroll'));assert.equal(edges,afterDesktopResize+1);
    view.componentWillUnmount();
});

test('the first mobile mount binds window scroll, wheel, and touch listeners',t=>{
    const oldWindow=globalThis.window;t.after(()=>{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;});
    const browserWindow=new EventTarget(),view=synchronousState(new ScrollHistory(props()));let edges=0;
    globalThis.window=browserWindow;view.findScrollElement=()=>null;view.isHostVisible=()=>true;view.isInsideHost=()=>true;view.scrollToBottom=()=>{};view.checkEdges=()=>edges++;
    view.componentDidMount();browserWindow.dispatchEvent(new Event('scroll'));assert.equal(edges,2);
    const wheel=new Event('wheel');wheel.deltaY=-1;browserWindow.dispatchEvent(wheel);assert.equal(view.autoDirection,'before');
    const start=new Event('touchstart');start.touches=[{clientY:100}];browserWindow.dispatchEvent(start);
    const move=new Event('touchmove');move.touches=[{clientY:90}];browserWindow.dispatchEvent(move);assert.equal(view.autoDirection,'after');
    view.componentWillUnmount();const before=edges;browserWindow.dispatchEvent(new Event('scroll'));assert.equal(edges,before);
});

test('a non-overlapping refresh preserves a history gap unless the reader is at the live bottom',()=>{
    const window={messages:[message('old-10'),message('old-11')],beforeCursor:'old-9',afterCursor:null,atLatest:true},latest=[message('new-100'),message('new-101')],latestPage=pageHistory('new-100',null,true);
    const readingHistory=reconcileHistoryWindow(window,latest,latestPage,false);
    assert.deepEqual(readingHistory.messages.map(row=>row.id),['old-10','old-11']);assert.equal(readingHistory.afterCursor,'old-11');
    const readingLatest=reconcileHistoryWindow({...window,atLatest:true},latest,latestPage,true);
    assert.deepEqual(readingLatest.messages.map(row=>row.id),['new-100','new-101']);assert.equal(readingLatest.afterCursor,null);
});

test('a full window does not evict the reading edge when a newer overlapping refresh arrives',()=>{
    const window={messages:Array.from({length:200},(_,index)=>message(`m-${index}`)),beforeCursor:null,afterCursor:null,atLatest:true};
    const latest=Array.from({length:10},(_,index)=>message(`m-${index+191}`,2));
    const next=reconcileHistoryWindow(window,latest,pageHistory('m-191',null,true),false);
    assert.equal(next.messages.length,200);assert.equal(next.messages[0].id,'m-0');assert.equal(next.messages.at(-1).id,'m-199');
    assert.equal(next.messages.at(-1).version,2);assert.equal(next.afterCursor,'m-199');assert.equal(next.atLatest,false);
    const continued=mergeHistoryPage(next,[message('m-200',2)],pageHistory('m-200',null,true),'after');
    assert.equal(continued.messages.at(-1).id,'m-200');assert.equal(continued.messages[0].id,'m-1');
});

test('return latest clears an old anchor and resets the local window',()=>{
    const navigated=[],latest=[message('m-30'),message('m-31')],view=synchronousState(new ScrollHistory(props({messages:latest,history:pageHistory('m-30',null,true),historyAnchor:{direction:'before',id:'m-10'},onNavigate:anchor=>navigated.push(anchor)})));
    view.setState({messages:[message('m-1'),message('m-2')],beforeCursor:null,afterCursor:'m-2',atLatest:false});
    view.navigate(null);
    assert.deepEqual(navigated,[null]);assert.deepEqual(view.state.messages,latest);assert.equal(view.state.afterCursor,null);assert.equal(view.state.atLatest,true);
    view.componentWillUnmount();
});

test('returning from an anchor waits through the empty transition for the authoritative latest page',()=>{
    const old=[message('m-10'),message('m-11')],view=synchronousState(new ScrollHistory(props({messages:old,history:pageHistory('m-10','m-11',false),historyAnchor:{direction:'before',id:'m-10'}})));
    const reads=[];view.mounted=true;view.root.current={getBoundingClientRect:()=>({top:0,bottom:20})};view.findScrollElement=()=>({scrollTop:0,scrollHeight:80,clientHeight:80});view.isHostVisible=()=>true;view.scrollToBottom=()=>{};view.load=direction=>reads.push(direction);
    let previous=view.props;view.props=props({messages:[],history:pageHistory('m-10','m-11',false)});
    view.componentDidUpdate(previous,view.state,{atBottom:true,visible:false});
    assert.deepEqual(view.state.messages,[]);assert.equal(view.state.afterCursor,null);assert.deepEqual(reads,[]);
    previous=view.props;view.props=props({messages:[message('m-100'),message('m-101')],history:pageHistory('m-100',null,true)});
    view.componentDidUpdate(previous,view.state,{atBottom:true,visible:false});
    assert.deepEqual(view.state.messages.map(row=>row.id),['m-100','m-101']);assert.equal(view.state.afterCursor,null);assert.equal(view.state.atLatest,true);assert.ok(!reads.includes('after'));
    view.componentWillUnmount();
});

test('a before-page request is read-only, scoped, and merges the returned ascending page',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
    const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,options});return response(sessionView(Array.from({length:20},(_,index)=>message(`m-${index}`)),pageHistory(null,'m-19',false)));};
    const view=synchronousState(new ScrollHistory(props({messages:[message('m-20'),message('m-21')],history:pageHistory('m-20',null,true)})));
    await view.load('before');
    assert.equal(requests.length,1);assert.match(requests[0].url,/^\/api\/sessions\/s\/view\?beforeMessageId=m-20&limit=20$/);
    assert.equal(requests[0].options.method,'GET');assert.equal(requests[0].options.body,undefined);
    assert.deepEqual(view.state.messages.map(row=>row.id),Array.from({length:22},(_,index)=>`m-${index}`));
    view.componentWillUnmount();
});

test('a replaced live window cancels an older pending page without mixing or leaving loading behind',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
    let resolveFetch;globalThis.fetch=()=>new Promise(resolve=>{resolveFetch=resolve;});
    const view=synchronousState(new ScrollHistory(props({messages:[message('m-20'),message('m-21')],history:pageHistory('m-20',null,true)})));
    view.isHostVisible=()=>false;
    const pending=view.load('before');await new Promise(resolve=>setImmediate(resolve));
    const previous=view.props;view.props=props({messages:[message('m-100'),message('m-101')],history:pageHistory('m-100',null,true)});
    view.componentDidUpdate(previous,view.state,{atBottom:true,visible:false});
    resolveFetch(response(sessionView([message('m-18'),message('m-19')],pageHistory('m-18','m-19',false))));await pending;
    assert.deepEqual(view.state.messages.map(row=>row.id),['m-100','m-101']);assert.equal(view.state.loading,null);assert.equal(view.loadingDirection,null);
    view.componentWillUnmount();
});

test('a failed page leaves the current transcript in place and offers one retry control',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
    globalThis.fetch=async()=>{throw Error('offline');};
    const existing=[message('m-20'),message('m-21')],view=synchronousState(new ScrollHistory(props({messages:existing,history:pageHistory('m-20',null,true)})));
    await view.load('before');
    assert.deepEqual(view.state.messages,existing);assert.match(view.state.error,/保留/);assert.equal(view.state.failedDirection,'before');
    const rendered=JSON.stringify(view.render());assert.match(rendered,/重试/);assert.match(rendered,/role":"alert/);
    view.componentWillUnmount();
});

test('late responses from a prior project and session are discarded',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
    let resolveFetch;globalThis.fetch=()=>new Promise(resolve=>{resolveFetch=resolve;});
    const view=synchronousState(new ScrollHistory(props({messages:[message('old-20')],history:pageHistory('old-20',null,true)})));
    const pending=view.load('before');await new Promise(resolve=>setImmediate(resolve));
    const previous=view.props;view.props=props({projectId:'q',sessionId:'new-session',messages:[{...message('new-1'),projectId:'q',sessionId:'new-session'}],history:pageHistory(null,null,true)});
    view.componentDidUpdate(previous,view.state,null);
    resolveFetch(response(sessionView([message('stale')],pageHistory(null,null,true))));await pending;
    assert.deepEqual(view.state.messages.map(row=>row.id),['new-1']);assert.equal(view.state.messages[0].projectId,'q');
    view.componentWillUnmount();
});

test('message history has no permanent earlier/newer controls and tolerates a missing page',()=>{
    const ordinary=synchronousState(new SessionHistory(props({messages:[message('m-1')]}))).render(),ordinaryText=JSON.stringify(ordinary);
    assert.doesNotMatch(ordinaryText,/更早消息|更新消息|返回最新/);
    const anchored=synchronousState(new SessionHistory(props({historyAnchor:{direction:'before',id:'m-1'}}))).render();
    assert.match(JSON.stringify(anchored),/返回最新/);
});
