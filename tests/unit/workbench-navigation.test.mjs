import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {App} from '../../dist/web/assets/app.js';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const response=data=>({ok:true,json:async()=>data});

test('other workflow buttons preserve project and session while closing mobile navigation',()=>{
  const app=synchronousState(new App({}));
  Object.assign(app.state,{boot:{projects:[]},projectId:'project',sessionId:'session',navigationOpen:true});
  const buttons=elements(app.render()).filter(node=>node.type==='button'&&node.props.onClick&&node.props.children?.[1]?.type==='span');
  const workflowButtons=buttons.filter(node=>text(node.props.children[1])!=='新建会话');
  assert.deepEqual(workflowButtons.map(node=>text(node.props.children[1])).sort(),['实验与运行','文献检索','项目工作区','资料与证据','报告与成果','技能与连接器','资源与调度','设置与能力'].sort());
  for(const button of workflowButtons){
    app.state.navigationOpen=true;button.props.onClick({currentTarget:{closest:()=>null}});
    assert.equal(app.state.navigationOpen,false);
    assert.equal(app.state.projectId,'project');assert.equal(app.state.sessionId,'session');
    const current=elements(app.render()).filter(node=>node.props?.['aria-current']==='page');
    assert.equal(current.length,1);assert.equal(text(current[0]),text(button));
  }
  app.componentWillUnmount();
});

test('new-session navigation button creates within the current project and preserves the view on failure',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const app=synchronousState(new App({}));app.refresh=async()=>true;
  Object.assign(app.state,{projectId:'project',sessionId:'old-session',tab:'reports',navigationOpen:true,messages:[{id:'old-message'}],pendingMessages:[{id:'old-pending'}],pendingTotal:1,pendingNextCursor:'q',canSteer:true,history:{atLatest:false},historyAnchor:{direction:'before',id:'old-cursor'},stream:'old stream'});
  const getCreateButton=()=>elements(app.render()).find(node=>node.type==='button'&&text(node.props.children?.[1])==='新建会话');
  assert.equal(getCreateButton().props.disabled,false);
  app.state.busy=true;assert.equal(getCreateButton().props.disabled,true);
  app.state.busy=false;app.state.projectId='';assert.equal(getCreateButton().props.disabled,true);
  app.state.projectId='project';
  const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return response({id:'new-session'});};
  await getCreateButton().props.onClick();
  assert.deepEqual(requests,[{url:'/api/sessions',body:{projectId:'project',title:'新的研究会话'}}]);
  assert.equal(app.state.projectId,'project');assert.equal(app.state.sessionId,'new-session');assert.equal(app.state.tab,'chat');assert.equal(app.state.navigationOpen,false);
  assert.deepEqual(app.state.messages,[]);assert.deepEqual(app.state.pendingMessages,[]);assert.equal(app.state.historyAnchor,null);assert.equal(app.state.sessionCreationSignal,1);

  Object.assign(app.state,{boot:{runtime:{ready:true},projects:[{id:'project',name:'Project'}]},data:{project:{id:'project',name:'Project',settings:{enabled:false},version:1},sessions:[{id:'new-session',title:'New',state:'open'}],experiments:[],runs:[],teams:[],campaigns:[],evidence:[],tasks:[],wakeups:[]},sessionId:'new-session',tab:'chat',navigationOpen:true,messages:[{id:'keep-message'}],pendingMessages:[{id:'keep-pending'}],pendingTotal:1,pendingNextCursor:'keep-q',canSteer:true,history:{atLatest:false},historyAnchor:{direction:'before',id:'keep-cursor'},stream:'keep stream'});
  const chatKey=()=>elements(app.render()).find(node=>node.type?.name==='Chat')?.key,previousChatKey=chatKey();
  globalThis.fetch=async()=>({ok:false,status:403,json:async()=>({error:{code:'SCOPE_DENIED',message:'会话不属于此项目'}})});
  await getCreateButton().props.onClick();
  assert.equal(app.state.projectId,'project');assert.equal(app.state.sessionId,'new-session');assert.equal(app.state.tab,'chat');assert.equal(app.state.navigationOpen,true);
  assert.deepEqual(app.state.messages,[{id:'keep-message'}]);assert.deepEqual(app.state.pendingMessages,[{id:'keep-pending'}]);assert.equal(app.state.pendingTotal,1);assert.equal(app.state.pendingNextCursor,'keep-q');assert.equal(app.state.historyAnchor.id,'keep-cursor');assert.equal(app.state.stream,'keep stream');assert.equal(app.state.sessionCreationSignal,1);assert.equal(chatKey(),previousChatKey);assert.match(app.state.error,/不属于此项目/);
  app.componentWillUnmount();
});

test('a completed create for a previous project cannot replace the newly selected project session',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const app=synchronousState(new App({}));app.refresh=async()=>true;
  Object.assign(app.state,{projectId:'old-project',sessionId:'old-session',navigationOpen:true});
  let resolvePost,request;
  globalThis.fetch=async(_url,options)=>{request=JSON.parse(options.body);return new Promise(resolve=>{resolvePost=resolve;});};
  const createButton=elements(app.render()).find(node=>node.type==='button'&&text(node.props.children?.[1])==='新建会话');
  const creating=createButton.props.onClick();
  app.switchProject('new-project');
  resolvePost(response({id:'created-in-old-project'}));
  await creating;
  assert.deepEqual(request,{projectId:'old-project',title:'新的研究会话'});
  assert.equal(app.state.projectId,'new-project');assert.equal(app.state.sessionId,'');assert.equal(app.state.sessionCreationSignal,0);
  app.componentWillUnmount();
});

test('legacy workflow tabs reopen in chat and retain their exact campaign selection',t=>{
  const previousStorage=globalThis.localStorage;t.after(()=>{globalThis.localStorage=previousStorage;});
  for(const tab of ['campaigns','implementation','changes']){
    globalThis.localStorage={getItem:()=>JSON.stringify({projectId:'p',sessionId:'historical-root',tab,selectedCampaign:'historical-campaign',historyAnchor:{projectId:'p',sessionId:'historical-root',anchor:{direction:'before',id:'m10'}}}),setItem(){}};
    const app=synchronousState(new App({}));
    assert.equal(app.state.tab,'chat');assert.equal(app.state.sessionId,'historical-root');assert.equal(app.state.selectedCampaign,'historical-campaign');
    assert.deepEqual(app.state.messages,[]);assert.equal(app.state.history,null);assert.equal(app.state.stream,'');
    assert.deepEqual(app.state.historyAnchor,{direction:'before',id:'m10'});
    app.componentWillUnmount();
  }
});

test('report campaign links select the exact root session even when it is outside recent sessions',()=>{
  const previousStorage=globalThis.localStorage;globalThis.localStorage={getItem:()=>null,setItem(){}};
  try{
    const app=synchronousState(new App({}));app.refresh=async()=>true;
    Object.assign(app.state,{tab:'reports',boot:{projects:[{id:'p'}]},projectId:'p',sessionId:'recent',data:{project:{id:'p',name:'Project'},sessions:[{id:'recent'}],experiments:[],runs:[],teams:[],campaigns:[{id:'historic-campaign',rootSessionId:'historic-root'}]},messages:[{id:'old-body'}],history:{atLatest:false},historyAnchor:{direction:'before',id:'old-cursor'},stream:'old stream'});
    const reports=elements(app.render()).find(node=>node.type?.name==='ReportsView');assert.ok(reports);
    reports.props.onCampaign('historic-campaign');
    assert.equal(app.state.projectId,'p');assert.equal(app.state.sessionId,'historic-root');assert.equal(app.state.selectedCampaign,'historic-campaign');assert.equal(app.state.tab,'chat');
    assert.deepEqual(app.state.messages,[]);assert.equal(app.state.history,null);assert.equal(app.state.historyAnchor,null);assert.equal(app.state.stream,'');
    app.componentWillUnmount();
  }finally{globalThis.localStorage=previousStorage;}
});

test('experiment selections restore per project and storage failure keeps the current view usable',t=>{
  const previousStorage=globalThis.localStorage;t.after(()=>{globalThis.localStorage=previousStorage;});
  let persisted;
  globalThis.localStorage={getItem:()=>null,setItem:(_key,value)=>{persisted=JSON.parse(value);}};
  const app=synchronousState(new App({}));app.refresh=async()=>true;
  Object.assign(app.state,{projectId:'p',selectedExp:'p-exp',selectedRun:'old-run',data:{project:{id:'p'},experiments:[{id:'p-exp'}]}});
  app.switchProject('q');assert.equal(app.state.selectedExp,'');assert.equal(app.state.selectedRun,'');
  Object.assign(app.state,{selectedExp:'q-exp',data:{project:{id:'q'},experiments:[{id:'q-exp'}]}});
  const previous={...app.state,selectedExp:''};app.componentDidUpdate({},previous);
  assert.deepEqual(persisted.experimentSelections,{p:'p-exp',q:'q-exp'});
  app.switchProject('p');assert.equal(app.state.selectedExp,'p-exp');
  app.switchProject('q');assert.equal(app.state.selectedExp,'q-exp');
  globalThis.localStorage.setItem=()=>{throw Error('storage blocked');};
  assert.doesNotThrow(()=>app.componentDidUpdate({},previous));
  app.componentWillUnmount();
});
