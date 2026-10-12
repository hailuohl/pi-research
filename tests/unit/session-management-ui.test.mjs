import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {SessionList} from '../../dist/web/assets/session-list.js';
import {SessionHistory} from '../../dist/web/assets/session-history.js';
import {App} from '../../dist/web/assets/app.js';
import {setup,USER} from '../support/research.mjs';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children??node.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const response=data=>({ok:true,json:async()=>data});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const session=(id,extra={})=>({id,version:1,projectId:'p',title:id,role:'coordinator',state:'idle',model:{provider:'test',model:'test',thinking:'high'},...extra});
const message={id:'m',projectId:'p',sessionId:'s',version:1,role:'user',status:'failed',mode:'prompt',content:'Original question',createdAt:'2026-10-12T00:00:00Z'};
const renameDialog=view=>elements(view.render()).find(node=>node.type?.name==='Modal'&&node.props.title==='重命名会话');
const rename=async(view,title)=>{button(view,'重命名会话').props.onClick();const dialog=renameDialog(view);if(title===null){dialog.props.onClose();return;}elements(dialog).find(node=>node.type==='input').props.onChange({target:{value:title}});return dialog.props.onSubmit(new FormData());};
const button=(view,label)=>elements(view.render()).find(node=>node.type==='button'&&(text(node)===label||node.props['aria-label']===label));
function appView(){
 const app=synchronousState(new App({}));app.refresh=async()=>false;
 Object.assign(app.state,{projectId:'p',sessionId:'s',boot:{projects:[{id:'p',name:'Project'}],runtime:{ready:true}},data:{project:{id:'p',settings:{enabled:false},archived:false},sessions:[session('s'),session('other')],experiments:[],runs:[],teams:[],wakeups:[]},messages:[message]});
 const chatElement=elements(app.render()).find(node=>node.type?.name==='Chat'),chat=synchronousState(new chatElement.type(chatElement.props));
 const scrollElement=elements(chat.render()).find(node=>node.type?.name==='ScrollHistory'),scroll=synchronousState(new scrollElement.type(scrollElement.props));
 const historyElement=elements(scroll.render()).find(node=>node.type?.name==='SessionHistory'),history=synchronousState(new historyElement.type(historyElement.props));
 return {app,chat,scroll,history};
}
function restore(t){const previous={fetch:globalThis.fetch,prompt:globalThis.prompt,document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage};globalThis.document={body:{nodeType:1}};globalThis.prompt=()=>{throw Error('native prompt must not open');};globalThis.window={setTimeout:()=>0};globalThis.localStorage={getItem:()=>null,setItem(){}};t.after(()=>Object.assign(globalThis,previous));}

test('same-session rename refreshes the catalog without resetting search, role or current cursor',async t=>{
 restore(t);const requests=[];globalThis.fetch=async(_url,init)=>{requests.push(JSON.parse(init.body).input);return response({items:[session('s',{title:'Renamed'})],nextCursor:null});};
 const list=synchronousState(new SessionList({projectId:'p',selectedId:'s',selected:session('s'),creationSignal:0,busy:false,onSelect(){}}));
 Object.assign(list.state,{query:'Renamed',draft:'Renamed',role:'all',stateFilter:'all',index:1,cursors:[undefined,'cursor'],page:{items:[session('s')],nextCursor:null}});
 const previous=list.props;list.props={...previous,selected:session('s',{title:'Renamed',version:2})};list.componentDidUpdate(previous);await flush();
 assert.deepEqual(requests,[{query:'Renamed',role:'all',stateFilter:'all',limit:10,beforeSessionId:'cursor'}]);assert.equal(list.state.index,1);assert.equal(list.state.draft,'Renamed');assert.match(JSON.stringify(list.render()),/Renamed/);
 const beforePoll=list.props;list.props={...beforePoll,selected:{...beforePoll.selected,version:3}};list.componentDidUpdate(beforePoll);await flush();assert.equal(requests.length,1);list.componentWillUnmount();
});

test('the cached catalog row shows a confirmed rename while its recheck is delayed or fails',async t=>{
 restore(t);
 for(const outcome of ['delayed','failed']){
  let finish,fail;const requests=[];globalThis.fetch=(_url,init)=>{requests.push(JSON.parse(init.body).input);return new Promise((resolve,reject)=>{finish=resolve;fail=reject;});};
  const original=session('s',{title:'Old',version:1}),renamed=session('s',{title:'Renamed',version:2});
  const list=synchronousState(new SessionList({projectId:'p',selectedId:'s',selected:original,creationSignal:0,busy:false,onSelect(){}}));
  Object.assign(list.state,{query:'Old',draft:'Old',role:'all',stateFilter:'all',index:1,cursors:[undefined,'cursor'],page:{items:[original],nextCursor:null}});
  const previous=list.props;list.props={...previous,selected:renamed};list.componentDidUpdate(previous);
  const selectedRow=()=>elements(list.render()).find(node=>node.type==='button'&&node.props['aria-current']==='page');
  assert.equal(list.state.busy,true);assert.equal(selectedRow().props.title,'Renamed',outcome);assert.equal(text(selectedRow()),'Renamed',outcome);assert.equal(list.state.page.items[0].title,'Old');
  assert.deepEqual(requests,[{query:'Old',role:'all',stateFilter:'all',limit:10,beforeSessionId:'cursor'}]);assert.equal(list.state.index,1);assert.equal(list.state.query,'Old');assert.equal(list.state.role,'all');assert.deepEqual(list.state.cursors,[undefined,'cursor']);
  if(outcome==='failed')fail(Error('catalog unavailable'));else finish(response({items:[renamed],nextCursor:null}));await flush();
  assert.equal(list.state.busy,false);assert.equal(selectedRow().props.title,'Renamed');assert.equal(text(selectedRow()),'Renamed');if(outcome==='failed'){assert.match(list.state.error,/catalog unavailable/);assert.equal(list.state.page.items[0].title,'Old');}
  assert.equal(list.state.index,1);assert.equal(list.state.query,'Old');assert.equal(list.state.role,'all');assert.deepEqual(list.state.cursors,[undefined,'cursor']);list.componentWillUnmount();
 }
});

test('an older selected session cannot overwrite a newer version in the catalog row',()=>{
 const list=synchronousState(new SessionList({projectId:'p',selectedId:'s',selected:session('s',{title:'Earlier selected',version:2}),creationSignal:0,busy:false,onSelect(){}}));
 list.state.page={items:[session('s',{title:'Latest catalog',version:3})],nextCursor:null};
 const row=elements(list.render()).find(node=>node.type==='button'&&node.props['aria-current']==='page');assert.equal(row.props.title,'Latest catalog');assert.equal(text(row),'Latest catalog');list.componentWillUnmount();
});

test('rename confirms the heading and catalog even if the following refresh is unavailable',async t=>{
 restore(t);const {app,chat}=appView(),renamed=session('s',{title:'Renamed',version:2});globalThis.fetch=async()=>response(renamed);
 await rename(chat,renamed.title);assert.equal(app.state.data.sessions[0].title,'Renamed');assert.equal(app.state.sessionId,'s');
 const next=elements(app.render()).find(node=>node.type?.name==='Chat');chat.props=next.props;assert.match(text(chat.render()),/Renamed/);
 const list=elements(app.render()).find(node=>node.type?.name==='SessionList');assert.equal(list.props.selected.title,'Renamed');chat.componentWillUnmount();app.componentWillUnmount();
});

test('branch receipt opens the new session once and preserves the source and saved selection',async t=>{
 restore(t);let saved;globalThis.localStorage.setItem=(_key,value)=>saved=JSON.parse(value);const {app,chat,history}=appView(),original=app.state.data.sessions.slice(),branched=session('branch',{parentSessionId:'s',version:2}),requests=[];let finish;
 globalThis.fetch=(url,init)=>{requests.push({url,key:init.headers['Idempotency-Key']});return new Promise(resolve=>finish=resolve);};
 const action=button(history,'从此处分支').props.onClick(),duplicate=button(history,'从此处分支').props.onClick();await flush();assert.equal(requests.length,1);finish(response(branched));await Promise.all([action,duplicate]);
 assert.equal(app.state.sessionId,'branch');assert.equal(app.state.sessionCreationSignal,1);assert.deepEqual(app.state.data.sessions,[...original,branched]);assert.deepEqual(app.state.messages,[]);
 const before={...app.state,sessionId:'s'};app.componentDidUpdate({},before);assert.equal(saved.sessionId,'branch');globalThis.localStorage.getItem=()=>JSON.stringify(saved);const restored=synchronousState(new App({}));assert.equal(restored.state.sessionId,'branch');restored.componentWillUnmount();
 const list=elements(app.render()).find(node=>node.type?.name==='SessionList');assert.equal(list.props.selected.id,'branch');assert.equal(list.props.creationSignal,1);history.componentWillUnmount();chat.componentWillUnmount();app.componentWillUnmount();
});

test('failed branches retain the source and retry the same request key; invalid receipts cannot create a success entry',async t=>{
 restore(t);
 for(const outcome of ['network','foreign','wrong-parent','same-id','invalid-version']){
  const {app,chat,history}=appView(),original=app.state.data.sessions.slice(),requests=[];
  globalThis.fetch=async(url,init)=>{requests.push({url,key:init.headers['Idempotency-Key'],body:JSON.parse(init.body)});if(outcome==='network')throw Error('network unavailable');return response(session(outcome==='same-id'?'s':'branch',{parentSessionId:outcome==='wrong-parent'?'other':'s',projectId:outcome==='foreign'?'foreign':'p',version:outcome==='invalid-version'?0:2}));};
  await button(history,'从此处分支').props.onClick();assert.equal(app.state.sessionId,'s',outcome);assert.deepEqual(app.state.data.sessions,original,outcome);assert.equal(app.state.sessionCreationSignal,0,outcome);assert.ok(app.state.error,outcome);
  if(outcome==='network'){await button(history,'从此处分支').props.onClick();assert.deepEqual(requests[1],requests[0]);}
  history.componentWillUnmount();chat.componentWillUnmount();app.componentWillUnmount();
 }
});

test('a replayed branch receipt cannot downgrade a newer known target after a lost response',async t=>{
 restore(t);
 for(const state of ['idle','archived']){
  const {app,chat,history}=appView(),receipt=session('branch',{parentSessionId:'s',version:2}),known={...receipt,title:'Latest branch title',version:3,state},original=app.state.data.sessions.slice(),requests=[];
  globalThis.fetch=async(url,init)=>{requests.push({url,key:init.headers['Idempotency-Key'],body:JSON.parse(init.body)});if(requests.length===1)throw Error('response lost after server created branch');return response(receipt);};
  await button(history,'从此处分支').props.onClick();assert.equal(app.state.sessionId,'s');assert.equal(app.state.sessionCreationSignal,0);
  app.state.data={...app.state.data,sessions:[...original,known]};
  await button(history,'从此处分支').props.onClick();assert.deepEqual(requests[1],requests[0]);assert.deepEqual(app.state.data.sessions,[...original,known]);
  if(state==='archived'){assert.equal(app.state.sessionId,'s');assert.equal(app.state.sessionCreationSignal,0);assert.match(app.state.error,/归档/);}else{assert.equal(app.state.sessionId,'branch');assert.equal(app.state.sessionCreationSignal,1);assert.equal(app.state.error,'');}
  history.componentWillUnmount();chat.componentWillUnmount();app.componentWillUnmount();
 }
});

test('branch confirmation rechecks target version and archive state when React applies its updater',async t=>{
 restore(t);
 for(const state of ['idle','archived']){
  const {app,chat,history}=appView(),receipt=session('branch',{parentSessionId:'s',version:2}),known={...receipt,title:'Changed before state commit',version:3,state},updates=[];
  app.setState=(update,callback)=>{if(typeof update==='function')updates.push(update);else Object.assign(app.state,update);callback?.();};
  app.confirmSessionBranch(receipt);assert.equal(updates.length,1);app.state.data={...app.state.data,sessions:[...app.state.data.sessions,known]};Object.assign(app.state,updates[0](app.state));
  assert.equal(app.state.data.sessions.at(-1),known);assert.equal(app.state.sessionId,state==='archived'?'s':'branch');assert.equal(app.state.sessionCreationSignal,state==='archived'?0:1);if(state==='archived')assert.match(app.state.error,/归档/);
  history.componentWillUnmount();chat.componentWillUnmount();app.componentWillUnmount();
 }
});

test('project archive and busy states disable and guard rename, branch and retry through the full component chain',async t=>{
 restore(t);let requests=0;globalThis.fetch=async()=>{requests++;throw Error('must not write');};
 for(const kind of ['project','busy']){
  const {app,chat}=appView();if(kind==='project')chat.props={...chat.props,data:{...chat.props.data,project:{...chat.props.data.project,archived:true}}};if(kind==='busy')chat.props={...chat.props,busy:true};
  const rename=button(chat,'重命名会话');assert.equal(rename.props.disabled,true,kind+' rename');await rename.props.onClick();
  const scrollElement=elements(chat.render()).find(node=>node.type?.name==='ScrollHistory'),scroll=synchronousState(new scrollElement.type(scrollElement.props)),historyElement=elements(scroll.render()).find(node=>node.type?.name==='SessionHistory'),history=synchronousState(new historyElement.type(historyElement.props));
  for(const label of ['从此处分支','重试此消息']){const control=button(history,label);assert.equal(control.props.disabled,true,kind+' '+label);await control.props.onClick();}assert.equal(requests,0);history.componentWillUnmount();chat.componentWillUnmount();app.componentWillUnmount();
 }
});

test('the real session service permits archived-source rename and branch, but rejects retry and project writes',()=>{
 const isolated=setup();try{
  const {app,project,session:source}=isolated;
  const failed=app.store.create('message',project.id,{sessionId:source.id,role:'user',content:'Failed original question',mode:'prompt',status:'failed'}),answer=app.store.create('message',project.id,{sessionId:source.id,role:'assistant',content:'Saved answer',mode:'prompt',status:'completed'});
  const archived=app.sessions.archive(USER,source.id,source.version),history=app.sessions.messages(USER,source.id);
  const renamed=app.sessions.rename(USER,source.id,'Archived source renamed',archived.version);assert.equal(renamed.state,'archived');assert.equal(renamed.title,'Archived source renamed');assert.deepEqual(app.sessions.messages(USER,source.id),history);
  const branch=app.sessions.branch(USER,source.id,answer.id);assert.equal(branch.state,'idle');assert.equal(branch.parentSessionId,source.id);assert.equal(branch.title,'Archived source renamed · 分支');assert.deepEqual(app.sessions.get(USER,source.id),renamed);assert.deepEqual(app.sessions.messages(USER,source.id),history);assert.deepEqual(app.sessions.messages(USER,branch.id).map(row=>row.content),history.map(row=>row.content));
  assert.throws(()=>app.sessions.retry(USER,source.id,failed.id),{code:'SESSION_ARCHIVED'});assert.deepEqual(app.sessions.get(USER,source.id),renamed);assert.deepEqual(app.sessions.messages(USER,source.id),history);
  const currentProject=app.projects.get(USER,project.id);app.store.update('project',project.id,currentProject.version,{archived:true});const before=app.store.list('session',project.id);
  assert.throws(()=>app.sessions.rename(USER,source.id,'Blocked project rename',renamed.version),{code:'PROJECT_ARCHIVED'});assert.throws(()=>app.sessions.branch(USER,source.id,answer.id),{code:'PROJECT_ARCHIVED'});assert.deepEqual(app.store.list('session',project.id),before);assert.deepEqual(app.sessions.messages(USER,source.id),history);
 }finally{isolated.close();}
});

test('an archived source in an active project can be renamed and branched in the UI while retry stays disabled',async t=>{
 restore(t);const {app,chat}=appView(),source=session('s',{state:'archived'}),renamed={...source,title:'Archived source renamed',version:2},branch=session('branch',{parentSessionId:'s',title:'Archived source renamed · 分支',version:2}),requests=[];
 app.state.data={...app.state.data,sessions:app.state.data.sessions.map(row=>row.id===source.id?source:row)};chat.props={...chat.props,data:app.state.data,session:source};
 globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return response(url.endsWith('/branch')?branch:renamed);};
 const rename=button(chat,'重命名会话');assert.equal(rename.props.disabled,false);rename.props.onClick();const dialog=renameDialog(chat);elements(dialog).find(node=>node.type==='input').props.onChange({target:{value:renamed.title}});await dialog.props.onSubmit(new FormData());assert.deepEqual(app.state.data.sessions[0],renamed);assert.equal(app.state.sessionId,'s');
 chat.props={...chat.props,data:app.state.data,session:renamed};const scrollElement=elements(chat.render()).find(node=>node.type?.name==='ScrollHistory'),scroll=synchronousState(new scrollElement.type(scrollElement.props)),historyElement=elements(scroll.render()).find(node=>node.type?.name==='SessionHistory'),history=synchronousState(new historyElement.type(historyElement.props));
 assert.equal(button(history,'重试此消息').props.disabled,true);await button(history,'重试此消息').props.onClick();assert.equal(requests.length,1);
 assert.equal(button(history,'从此处分支').props.disabled,false);await button(history,'从此处分支').props.onClick();assert.equal(app.state.sessionId,'branch');assert.equal(app.state.sessionCreationSignal,1);assert.deepEqual(app.state.data.sessions[0],renamed);assert.equal(app.state.data.sessions[0].state,'archived');assert.deepEqual(app.state.data.sessions.at(-1),branch);assert.deepEqual(requests.map(row=>row.url),['/api/sessions/s','/api/sessions/s/branch']);
 history.componentWillUnmount();chat.componentWillUnmount();app.componentWillUnmount();
});

test('late branch success and failure cannot select another project or a reopened source instance',async t=>{
 restore(t);
 for(const outcome of ['success','failure'])for(const scope of ['session','project','reopen','unmount']){
  const {app,chat,history}=appView();let finish,fail;globalThis.fetch=()=>new Promise((resolve,reject)=>{finish=resolve;fail=reject;});const action=button(history,'从此处分支').props.onClick();await flush();
  if(scope==='project')app.switchProject('other-project');else if(scope!=='unmount'){app.selectSession('other');if(scope==='reopen')app.selectSession('s');}history.componentWillUnmount();chat.componentWillUnmount();
  const expected=app.state.sessionId;Object.assign(app.state,{error:'current error',notice:'current notice'});if(outcome==='success')finish(response(session('branch',{parentSessionId:'s',version:2})));else fail(Error('old failure'));await action;
  assert.equal(app.state.sessionId,expected,outcome+' '+scope);assert.equal(app.state.sessionCreationSignal,0);assert.equal(app.state.error,'current error');assert.equal(app.state.notice,'current notice');app.componentWillUnmount();
 }
});

test('cancelled, blank, failed and mismatched rename requests preserve the current session',async t=>{
 restore(t);
 for(const kind of ['cancel','blank','failure','overlong','foreign','wrong-id','stale','missing-model']){
  const {app,chat}=appView(),original=app.state.data.sessions.slice();let writes=0;const title=kind==='cancel'?null:kind==='blank'?'   ':kind==='overlong'?'x'.repeat(161):'Renamed';globalThis.fetch=async()=>{writes++;if(kind==='failure')throw Error('rename failed');if(kind==='overlong')return {ok:false,status:400,json:async()=>({error:{code:'INVALID_INPUT',message:'title too long'}})};return response(session(kind==='wrong-id'?'other':'s',{projectId:kind==='foreign'?'foreign':'p',title:'Renamed',version:kind==='stale'?1:2,...(kind==='missing-model'?{model:null}:{})}));};
  await rename(chat,title);assert.deepEqual(app.state.data.sessions,original,kind);assert.equal(app.state.sessionId,'s');assert.equal(app.state.sessionCreationSignal,0);if(['cancel','blank','overlong'].includes(kind))assert.equal(writes,0);else assert.ok(app.state.error);if(kind!=='cancel'){assert.ok(elements(renameDialog(chat)).some(node=>node.props?.role==='alert'),kind);assert.equal(elements(renameDialog(chat)).find(node=>node.type==='input').props.value,title,kind);}chat.componentWillUnmount();app.componentWillUnmount();
 }
});

test('the message action lock prevents duplicate posts before parent busy props arrive',async t=>{
 restore(t);const requests=[],confirmed=[];let finish;globalThis.fetch=(url,init)=>{requests.push(url);return new Promise(resolve=>finish=resolve);};
 const history=synchronousState(new SessionHistory({projectId:'p',sessionId:'s',messages:[message],history:null,historyAnchor:null,onNavigate(){},perform:async fn=>fn(),onBranch:row=>confirmed.push(row)}));
 const first=button(history,'从此处分支').props.onClick(),second=button(history,'从此处分支').props.onClick();assert.equal(requests.length,1);finish(response(session('branch',{parentSessionId:'s',version:2})));await Promise.all([first,second]);assert.equal(confirmed.length,1);history.componentWillUnmount();
});

test('a reused history instance discards branch receipts after session A to B to A',async t=>{
 restore(t);const confirmed=[];let finish;globalThis.fetch=()=>new Promise(resolve=>finish=resolve);
 const history=synchronousState(new SessionHistory({projectId:'p',sessionId:'s',messages:[message],history:null,historyAnchor:null,onNavigate(){},perform:async fn=>fn(),onBranch:row=>confirmed.push(row)}));
 const action=button(history,'从此处分支').props.onClick();const original=history.props;history.props={...original,sessionId:'other'};history.componentDidUpdate(original);const other=history.props;history.props=original;history.componentDidUpdate(other);finish(response(session('branch',{parentSessionId:'s',version:2})));await action;assert.deepEqual(confirmed,[]);history.componentWillUnmount();
});
