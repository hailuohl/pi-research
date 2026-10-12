import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {synchronousState} from '../support/ui.mjs';

// Read current source without replacing the shared browser build.
const built=await build({stdin:{contents:"export {App} from './apps/web/src/app.tsx';",resolveDir:fileURLToPath(new URL('../../',import.meta.url)),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',logLevel:'silent'});
const module={exports:{}};
new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {App}=module.exports;
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const button=(view,label)=>elements(view.render()).find(node=>node.type==='button'&&(text(node)===label||node.props['aria-label']===label));
const drawer=view=>elements(view.render()).find(node=>node.type==='aside'&&node.props.id==='chat-task-drawer');
const session=id=>({id,projectId:'p',version:1,title:id,role:'coordinator',state:'archived',model:{provider:'test',model:'test',thinking:'high'}});

function harness(t,{archived=true,selected='s'}={}){
 const previous={localStorage:globalThis.localStorage,fetch:globalThis.fetch};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 const requests=[];globalThis.fetch=(...args)=>{requests.push(args);throw Error('history entry must not request work');};
 const app=synchronousState(new App({}));app.refresh=async()=>false;
 Object.assign(app.state,{projectId:'p',sessionId:selected,tab:'workspace',boot:{projects:[],runtime:{ready:true}},data:{project:{id:'p',name:'Project',archived,settings:{enabled:false}},sessions:[session('s'),session('other')],experiments:[],runs:[],teams:[],wakeups:[]}});
 const focus=[],trigger={focus:()=>focus.push('entry')},archive={focus:()=>focus.push('archive'),getBoundingClientRect:()=>({top:360})},note={focus:()=>focus.push('note'),getBoundingClientRect:()=>({top:140})};
 let chat,key,viewer;
 const connect=()=>{
  const element=elements(app.render()).find(node=>node.type?.name==='Chat');
  if(!element)return;
  if(!chat||key!==element.key){chat?.componentWillUnmount();chat=synchronousState(new element.type(element.props));key=element.key;viewer=undefined;}
  else chat.props=element.props;
  const history=chat.props.archivedHistory;
  if(history){if(!viewer)viewer=synchronousState(new history.type(history.props));else viewer.props=history.props;}
  else viewer=undefined;
  if(element.props.ref)element.props.ref.current=chat;
  chat.drawerContent.current={scrollTop:0,getBoundingClientRect:()=>({top:100}),querySelector:selector=>selector==='[aria-label="归档项目历史"]'?archive:selector==='.chat-drawer-history-note'?note:null};
  chat.drawerClose.current={focus:()=>focus.push('close')};
 };
 connect();const update=app.setState;
 app.setState=(value,callback)=>update(value,()=>{connect();callback?.();});
 const open=()=>button(app,'查看历史资料').props.onClick({currentTarget:trigger});
 t.after(()=>{chat.componentWillUnmount();app.componentWillUnmount();Object.assign(globalThis,previous);});
 return {app,get chat(){return chat;},get viewer(){return viewer;},open,trigger,focus,requests,connect};
}

test('archived project entry opens chat and focuses and scrolls to the actual read-only viewer',t=>{
 const h=harness(t);h.open();
 assert.equal(h.app.state.tab,'chat');assert.equal(drawer(h.chat).props.hidden,false);
 assert.deepEqual(h.focus,['archive']);assert.equal(h.chat.drawerContent.current.scrollTop,260);
 assert.equal(button(h.app,'收起历史资料').props['aria-expanded'],true);
 const viewer=h.chat.props.archivedHistory;
 assert.equal(viewer.props.data.project.id,'p');assert.equal(new viewer.type(viewer.props).render().props.tabIndex,-1);
 assert.equal(new viewer.type(viewer.props).render().props.children.at(-1).props.readOnly,true);
 assert.equal(h.chat.canSend(),false);assert.deepEqual(h.requests,[]);
});

test('X, Escape and top collapse synchronize the entry and restore its focus',t=>{
 for(const close of ['X','Escape','top']){
  const h=harness(t);h.open();
  if(close==='X')button(h.chat,'关闭任务与审批').props.onClick();
  else if(close==='top')button(h.app,'收起历史资料').props.onClick({currentTarget:h.trigger});
  else {let prevented=false;h.chat.render().props.onKeyDown({key:'Escape',defaultPrevented:false,target:{closest:()=>null},preventDefault:()=>prevented=true});assert.equal(prevented,true);}
  assert.equal(drawer(h.chat).props.hidden,true,close);assert.equal(h.app.state.archiveHistoryOpen,false,close);
  assert.equal(button(h.app,'查看历史资料').props['aria-expanded'],false,close);assert.equal(h.chat.props.archivedHistory,null,close);assert.equal(h.focus.at(-1),'entry',close);
 }
});

test('same-session polling does not reopen or steal focus; session and project changes discard the viewer',async t=>{
 const h=harness(t);h.open();const focused=h.focus.length;
 h.app.setState({data:{...h.app.state.data}});h.chat.render();assert.equal(h.focus.length,focused);assert.equal(drawer(h.chat).props.hidden,false);
 button(h.chat,'关闭任务与审批').props.onClick();const closedFocus=h.focus.length;
 h.app.setState({data:{...h.app.state.data}});h.chat.render();assert.equal(h.focus.length,closedFocus);assert.equal(drawer(h.chat).props.hidden,true);
 h.open();h.app.selectSession('other');assert.equal(h.app.state.archiveHistoryOpen,false);assert.equal(h.chat.props.archivedHistory,null);assert.equal(drawer(h.chat).props.hidden,true);
 h.open();await h.app.switchProject('q');assert.equal(h.app.state.archiveHistoryOpen,false);assert.equal(h.app.state.data,null);assert.equal(h.focus.at(-1),'archive');
});

test('loading a selected session absent from the recent snapshot preserves the open drawer and archive selection',t=>{
 const h=harness(t,{selected:'historical'});assert.equal(h.chat.props.session,undefined);h.open();
 h.viewer.setState({kind:'documents',document:{documentVersionId:'document-version',parseResultId:'parse-result'},reportId:'saved-report'});
 const chat=h.chat,viewer=h.viewer,selection={...viewer.state},focused=h.focus.length;
 h.app.setState({data:{...h.app.state.data,sessions:[...h.app.state.data.sessions,session('historical')]}});
 assert.equal(h.app.state.sessionId,'historical');assert.equal(h.chat.props.session.id,'historical');
 assert.equal(drawer(h.chat).props.hidden,false);assert.equal(button(h.app,'收起历史资料').props['aria-expanded'],true);
 assert.equal(h.chat,chat);assert.equal(h.viewer,viewer);assert.deepEqual(h.viewer.state,selection);assert.equal(h.focus.length,focused);
 h.app.selectSession('other');assert.notEqual(h.chat,chat);assert.equal(drawer(h.chat).props.hidden,true);assert.equal(h.viewer,undefined);
 assert.equal(button(h.app,'查看历史资料').props['aria-expanded'],false);assert.equal(h.focus.length,focused);assert.deepEqual(h.requests,[]);
});

test('a delayed entry callback keeps the original trigger and cannot open a newly selected session',t=>{
 const h=harness(t),callbacks=[],update=h.app.setState;
 h.app.setState=(value,callback)=>update(value,()=>{if(callback)callbacks.push(callback);});
 const event={currentTarget:h.trigger};button(h.app,'查看历史资料').props.onClick(event);event.currentTarget=null;
 callbacks.shift()();assert.equal(drawer(h.chat).props.hidden,false);assert.deepEqual(h.focus,['archive']);
 button(h.chat,'关闭任务与审批').props.onClick();assert.equal(h.focus.at(-1),'entry');
 h.open();h.app.selectSession('other');callbacks.shift()();assert.equal(drawer(h.chat).props.hidden,true);assert.equal(h.chat.props.archivedHistory,null);
});

test('unmounted drawer callbacks cannot focus old content or collapse the next session history',t=>{
 const h=harness(t),old=h.chat,callbacks=[],update=old.setState;
 old.setState=(value,callback)=>update(value,()=>{if(callback)callbacks.push(callback);});
 h.open();h.app.selectSession('other');callbacks.shift()();assert.deepEqual(h.focus,[]);
 h.open();const focused=h.focus.length;
 old.closeDrawer();callbacks.shift()();assert.equal(h.focus.length,focused);assert.equal(h.app.state.archiveHistoryOpen,true);assert.equal(drawer(h.chat).props.hidden,false);
});

test('an archived project without a selected session still opens project history',t=>{
 const h=harness(t,{selected:''});h.open();
 assert.equal(h.chat.props.session,undefined);assert.equal(drawer(h.chat).props.hidden,false);assert.deepEqual(h.focus,['archive']);assert.equal(h.chat.props.archivedHistory.props.data.project.id,'p');assert.deepEqual(h.requests,[]);
});

test('ordinary task drawer keeps its toggle, close and trigger focus behavior',t=>{
 const h=harness(t,{archived:false}),task={focus:()=>h.focus.push('task')};
 button(h.chat,'任务与审批').props.onClick({currentTarget:task});assert.equal(drawer(h.chat).props.hidden,false);assert.deepEqual(h.focus,['close']);
 button(h.chat,'关闭任务与审批').props.onClick();assert.equal(drawer(h.chat).props.hidden,true);assert.equal(h.focus.at(-1),'task');assert.equal(h.app.state.archiveHistoryOpen,false);
 button(h.chat,'历史').props.onClick({currentTarget:task});assert.equal(drawer(h.chat).props.hidden,false);assert.equal(h.focus.at(-1),'note');assert.equal(h.chat.drawerContent.current.scrollTop,40);
 button(h.chat,'任务与审批').props.onClick({currentTarget:task});assert.equal(drawer(h.chat).props.hidden,true);assert.equal(h.focus.at(-1),'task');assert.deepEqual(h.requests,[]);
});

test('active-project archived source sessions retain rename and branch while send and retry stay disabled',t=>{
 const h=harness(t,{archived:false});
 h.app.setState({messages:[{id:'failed',version:1,projectId:'p',sessionId:'s',role:'user',status:'failed',content:'Original question'}]});
 assert.equal(h.chat.canSend(),false);assert.equal(button(h.chat,'重命名会话').props.disabled,false);
 const scrollElement=elements(h.chat.render()).find(node=>node.type?.name==='ScrollHistory'),scroll=synchronousState(new scrollElement.type(scrollElement.props));
 const historyElement=elements(scroll.render()).find(node=>node.type?.name==='SessionHistory'),history=synchronousState(new historyElement.type(historyElement.props));
 assert.equal(button(history,'从此处分支').props.disabled,false);assert.equal(button(history,'重试此消息').props.disabled,true);
 history.componentWillUnmount();scroll.componentWillUnmount();assert.deepEqual(h.requests,[]);
});
