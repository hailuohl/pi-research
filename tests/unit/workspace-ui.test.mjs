import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {WorkspaceView} from '../../dist/web/assets/data-views.js';
import {App} from '../../dist/web/assets/app.js';

const nodes=n=>Array.isArray(n)?n.flatMap(nodes):!n||typeof n!=='object'?[]:[n,...nodes(n.children??n.props?.children)];
const text=n=>Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):typeof n==='string'?n:'';
const button=(v,label)=>nodes(v.render()).find(n=>n.type==='button'&&text(n)===label);
const reply=data=>({ok:true,json:async()=>data});
const mockedGlobals=new WeakMap();
function mockGlobal(t,name,value){let names=mockedGlobals.get(t);if(!names){names=new Set();mockedGlobals.set(t,names);}if(!names.has(name)){names.add(name);const previous=Object.getOwnPropertyDescriptor(globalThis,name);t.after(()=>{if(previous)Object.defineProperty(globalThis,name,previous);else delete globalThis[name];});}Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const data=(id='p',archived=false)=>({project:{id,name:id,archived,settings:{enabled:false}},sessions:[],experiments:[],runs:[],teams:[],campaigns:[],evidence:[],wakeups:[],intents:[]});
function workspace(extra={}){const v=synchronousState(new WorkspaceView({data:data(),perform:async fn=>fn(),...extra}));Object.assign(v.state,{path:'notes.md',content:'draft',digest:'D0',dirty:true});return v;}
const modal=v=>nodes(v.render()).find(n=>n.type?.name==='Modal');
function answer(v,accepted){const m=modal(v);assert.ok(m,'discard Modal must be visible');assert.match(m.props.title,/放弃/);if(accepted)m.props.onSubmit(new FormData());else m.props.onClose();}
function createPath(v,path){const m=modal(v);assert.ok(m);assert.equal(m.props.title,'新建文件');const fd=new FormData();fd.set('path',path);m.props.onSubmit(fd);}
async function newDraft(v,path){const creating=v.newFile();if(modal(v)?.props.title.includes('放弃'))answer(v,true);await creating;createPath(v,path);}
const edit=(v,content)=>nodes(v.render()).find(n=>n.type==='textarea').props.onChange({target:{value:content}});
function updateWorkspace(v,extra){const previous=v.props;v.props={...v.props,...extra};v.componentDidUpdate(previous);}

test('returning to workspace refreshes added and removed files without touching the draft',async t=>{
 const requests=[],v=workspace({active:true}),draft={path:v.state.path,content:v.state.content,digest:v.state.digest,dirty:v.state.dirty},generation=v.draftGeneration;
 v.state.files=[{path:'removed.md',size:1}];mockGlobal(t,'fetch',async url=>{requests.push(url);return reply([{path:'external.txt',size:2}]);});
 updateWorkspace(v,{active:false});assert.equal(requests.length,0);updateWorkspace(v,{active:true});await tick();
 assert.deepEqual(v.state.files,[{path:'external.txt',size:2}]);assert.deepEqual(Object.fromEntries(Object.keys(draft).map(key=>[key,v.state[key]])),draft);assert.equal(v.draftGeneration,generation);assert.equal(modal(v),undefined);assert.deepEqual(requests,['/api/projects/p/files']);
 updateWorkspace(v,{data:data()});await tick();assert.equal(requests.length,1,'unrelated App data refresh must not reload the directory');
});

test('directory refresh failures retain the readable list and only current visible requests apply',async t=>{
 const errors=[],pending=[],v=workspace({active:false,perform:async fn=>{try{await fn();}catch(e){errors.push(e.message);}}}),old=[{path:'retained.md',size:1}];v.state.files=old;
 mockGlobal(t,'fetch',url=>new Promise((resolve,reject)=>pending.push({url,resolve,reject})));
 updateWorkspace(v,{active:true});assert.equal(pending.length,1);pending[0].reject(Error('current list offline'));await tick();assert.equal(v.state.files,old);assert.deepEqual(errors,['current list offline']);
 updateWorkspace(v,{active:false});updateWorkspace(v,{active:true});updateWorkspace(v,{active:false});updateWorkspace(v,{active:true});assert.equal(pending.length,3);
 pending[2].resolve(reply([{path:'newest.txt',size:2}]));await tick();pending[1].resolve(reply([{path:'stale.txt',size:3}]));await tick();assert.deepEqual(v.state.files,[{path:'newest.txt',size:2}]);
 updateWorkspace(v,{active:false});updateWorkspace(v,{active:true});updateWorkspace(v,{active:false});pending[3].reject(Error('hidden failure'));await tick();assert.deepEqual(errors,['current list offline']);
 updateWorkspace(v,{active:true});updateWorkspace(v,{data:data('q')});updateWorkspace(v,{data:data()});pending[4].resolve(reply([{path:'old-project.txt',size:3}]));await tick();assert.deepEqual(v.state.files,[{path:'newest.txt',size:2}]);assert.equal(v.state.content,'draft');assert.equal(v.state.digest,'D0');assert.equal(v.state.dirty,true);assert.equal(modal(v),undefined);
});

test('first entry during the initial directory read still selects a file exactly once',async t=>{
 mockGlobal(t,'window',{addEventListener(){},removeEventListener(){}});const pending=[],reads=[],v=synchronousState(new WorkspaceView({data:data(),active:false,perform:async fn=>fn()}));
 mockGlobal(t,'fetch',url=>url.includes('?path=')?(reads.push(url),Promise.resolve(reply({content:'initial text',digest:'INITIAL'}))):new Promise(resolve=>pending.push(resolve)));
 v.componentDidMount();updateWorkspace(v,{active:true});assert.equal(pending.length,2);pending[1](reply([{path:'fresh.md',size:1}]));await tick();assert.equal(v.state.path,'fresh.md');assert.equal(v.state.content,'initial text');assert.equal(v.state.dirty,false);
 pending[0](reply([{path:'stale.md',size:1}]));await tick();updateWorkspace(v,{active:false});updateWorkspace(v,{active:true});pending[2](reply([{path:'external.md',size:2}]));await tick();assert.equal(v.state.path,'fresh.md');assert.deepEqual(reads,['/api/projects/p/files?path=fresh.md']);v.componentWillUnmount();
});

test('initial and returning directory reads never ask to discard an anonymous edited draft',async t=>{
 mockGlobal(t,'window',{addEventListener(){},removeEventListener(){}});const pending=[],v=synchronousState(new WorkspaceView({data:data(),active:false,perform:async fn=>fn()}));mockGlobal(t,'fetch',url=>{assert.equal(url.includes('?path='),false);return new Promise(resolve=>pending.push(resolve));});
 v.componentDidMount();edit(v,'anonymous draft');updateWorkspace(v,{active:true});pending[1](reply([{path:'first.md',size:1}]));pending[0](reply([{path:'old.md',size:1}]));await tick();assert.equal(v.state.path,'');assert.equal(v.state.content,'anonymous draft');assert.equal(v.state.digest,null);assert.equal(v.state.dirty,true);assert.equal(modal(v),undefined);v.componentWillUnmount();
});

test('hiding the workspace only invalidates its directory request, not a pending file read',async t=>{
 const v=workspace({active:true});v.state.dirty=false;let release;mockGlobal(t,'fetch',()=>new Promise(resolve=>release=resolve));const reading=v.open('selected.md');await tick();updateWorkspace(v,{active:false});release(reply({content:'selected text',digest:'SELECTED'}));await reading;assert.equal(v.state.path,'selected.md');assert.equal(v.state.content,'selected text');assert.equal(v.state.digest,'SELECTED');assert.equal(v.state.loading,false);
});

test('a directory update queued by React cannot apply after the workspace is hidden',async t=>{
 const v=workspace({active:true}),old=[{path:'retained.md',size:1}],updates=[],update=v.setState;v.state.files=old;mockGlobal(t,'fetch',async()=>reply([{path:'late.txt',size:2}]));v.setState=(value,callback)=>updates.push([value,callback]);
 const loading=v.loadFiles();await tick();assert.equal(updates.length,1);updateWorkspace(v,{active:false});v.setState=update;for(const [value,callback] of updates)update(value,callback);await loading;assert.equal(v.state.files,old);assert.equal(v.state.content,'draft');assert.equal(v.state.dirty,true);
});

test('a saved directory refresh releases App busy when a queued project switch discards child callbacks',async t=>{
 mockGlobal(t,'window',{removeEventListener(){},setTimeout:()=>0});const app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',data:data(),tab:'workspace'});app.refresh=async()=>true;const v=workspace({active:true,perform:app.perform});app.workspace.current=v;t.after(()=>{v.componentWillUnmount();app.componentWillUnmount();});
 let releaseDirectory;mockGlobal(t,'fetch',async(_url,options)=>options.body?reply({digest:'D1'}):new Promise(resolve=>releaseDirectory=()=>resolve(reply([{path:'notes.md',size:1}]))));let saveSettled=false;const saving=v.save().then(()=>saveSettled=true);await tick();assert.equal(v.state.digest,'D1');assert.ok(releaseDirectory);assert.equal(app.state.busy,true);
 const parentUpdates=[],appUpdate=app.setState;app.setState=(value,callback)=>parentUpdates.push([value,callback]);const switching=app.switchProject('q');answer(v,true);await tick();assert.equal(parentUpdates.length,1,'confirmed project switch queues its parent update before the directory returns');const childUpdates=[];v.setState=(value,callback)=>childUpdates.push([value,callback]);releaseDirectory();await tick();assert.ok(childUpdates.length,'directory state is queued before the parent update commits');
 for(const [value,callback] of parentUpdates)appUpdate(value,()=>{if(app.state.data===null){v.componentWillUnmount();app.workspace.current=null;}callback?.();});await switching;await tick();
 // Parent deletion drops every queued child callback; a completed save may invalidate that switch.
 assert.equal(saveSettled,true);assert.equal(app.state.busy,false);assert.equal(v.saving,false);assert.equal(childUpdates.filter(([,callback])=>callback).length,0);await saving;
});

test('initial auto-selection protects edits even before React commits dirty state',async t=>{
 const v=synchronousState(new WorkspaceView({data:data(),perform:async fn=>fn()}));let release;mockGlobal(t,'fetch',()=>new Promise(resolve=>release=resolve));const loading=v.loadFiles(),updates=[],update=v.setState;v.setState=(value,callback)=>updates.push([value,callback]);edit(v,'queued anonymous draft');v.setState=update;assert.equal(v.state.dirty,false);
 release(reply([{path:'first.md',size:1}]));await loading;assert.equal(modal(v),undefined);assert.equal(v.state.path,'');for(const [value,callback] of updates)update(value,callback);assert.equal(v.state.content,'queued anonymous draft');assert.equal(v.state.dirty,true);
});

test('App workspace entries expose active visibility and Chat uses the common navigation action',()=>{
 const app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',boot:{projects:[]},data:data(),tab:'workspace'});const element=()=>nodes(app.render()).find(n=>n.type?.name==='WorkspaceView');assert.equal(element().props.active,true);
 app.selectTab('settings');assert.equal(element().props.active,false);app.selectTab('chat');assert.equal(element().props.active,false);app.state.navigationOpen=true;const intent=app.projectIntent;nodes(app.render()).find(n=>n.type?.name==='Chat').props.onWorkspace();assert.equal(app.state.tab,'workspace');assert.equal(app.state.navigationOpen,false);assert.equal(app.projectIntent,intent+1);assert.equal(element().props.active,true);
 app.selectTab('chat');nodes(app.render()).find(n=>n.type?.name==='ConversationLayout').props.panel.props.onWorkspace();assert.equal(element().props.active,true);app.componentWillUnmount();
});

test('workspace stays mounted across management and chat navigation; cancelling a project switch preserves its draft',async t=>{
 const v=synchronousState(new App({}));Object.assign(v.state,{projectId:'p',boot:{projects:[]},data:data(),tab:'workspace'});v.refresh=async()=>true;
 const before=nodes(v.render()).find(n=>n.type?.name==='WorkspaceView'),draft=workspace();
 v.selectTab('settings');const hidden=nodes(v.render()).find(n=>n.type?.name==='WorkspaceView');assert.ok(hidden);assert.equal(hidden.key,before.key);assert.equal(hidden.props.ref,before.props.ref);
 before.props.ref.current=draft;
 v.selectTab('chat');assert.ok(nodes(v.render()).find(n=>n.type?.name==='WorkspaceView'));
 const cancelled=v.switchProject('q');answer(draft,false);assert.equal(await cancelled,false);assert.equal(v.state.projectId,'p');assert.equal(draft.state.content,'draft');
 await v.switchProject('p');assert.equal(v.state.data.project.id,'p');
 const switching=v.switchProject('q');answer(draft,true);assert.equal(await switching,true);assert.equal(v.state.projectId,'q');v.componentWillUnmount();
});

test('new file and reread can be cancelled before discarding; cancelling project creation keeps the draft',async t=>{
 const v=workspace();
 const cancelledNew=button(v,'新建文件').props.onClick();answer(v,false);await cancelledNew;assert.equal(v.state.path,'notes.md');assert.equal(v.state.content,'draft');
 const cancelledRead=button(v,'重新读取').props.onClick();answer(v,false);await cancelledRead;assert.equal(v.state.content,'draft');
 const app=synchronousState(new App({}));app.workspace.current=v;const cancelledProject=app.open('project');answer(v,false);await cancelledProject;assert.equal(app.state.modal,'');
 const creatingProject=app.open('project');answer(v,true);await creatingProject;assert.equal(app.state.modal,'project');app.close();assert.equal(v.state.content,'draft');assert.equal(v.state.dirty,true);
 await newDraft(v,'new.md');assert.equal(v.state.path,'new.md');assert.equal(v.state.content,'');assert.equal(v.state.digest,null);assert.equal(v.state.dirty,true);
});

test('dirty or saving workspace requests the browser unload confirmation and cleans up its listener',async t=>{
 const listeners=new Map();mockGlobal(t,'window',{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{assert.equal(listeners.get(name),fn);listeners.delete(name);}});
 const v=workspace();v.loadFiles=async()=>{};v.componentDidMount();let prevented=0;const event={preventDefault(){prevented++;},returnValue:undefined};listeners.get('beforeunload')(event);assert.equal(prevented,1);assert.equal(event.returnValue,'');
 v.state.dirty=false;listeners.get('beforeunload')({preventDefault(){assert.fail('clean draft should not prompt');}});v.state.saving=true;listeners.get('beforeunload')(event);assert.equal(prevented,2);v.componentWillUnmount();assert.equal(listeners.size,0);
});

test('saving an edited snapshot retains newer edits and uses the new digest for the next save; reopens saved text',async t=>{
 const v=workspace(),requests=[];let release,stored='old',digest='D0';
 mockGlobal(t,'fetch',async(url,options)=>{if(options.body){const body=JSON.parse(options.body);requests.push(body);if(requests.length===1)return new Promise(resolve=>{release=()=>{stored=body.content;digest='D1';resolve(reply({digest}));};});assert.equal(body.expectedDigest,digest);stored=body.content;digest='D2';return reply({digest});}return reply(url.includes('?path=')?{content:stored,digest}:[{path:'notes.md',size:stored.length}]);});
 const saving=button(v,'保存文件').props.onClick();await tick();edit(v,'newer draft');await button(v,'保存文件').props.onClick();assert.equal(requests.length,1);assert.equal(button(v,'保存文件').props.disabled,true);
 release();await saving;assert.equal(v.state.content,'newer draft');assert.equal(v.state.dirty,true);assert.equal(v.state.digest,'D1');
 await button(v,'保存文件').props.onClick();assert.equal(v.state.dirty,false);assert.deepEqual(requests,[{path:'notes.md',content:'draft',expectedDigest:'D0'},{path:'notes.md',content:'newer draft',expectedDigest:'D1'}]);
 await v.open('notes.md');assert.equal(v.state.content,'newer draft');assert.equal(v.state.digest,'D2');
});

test('an older save receipt cannot clear edits made while its request was pending',async t=>{
 let release;const v=workspace();mockGlobal(t,'fetch',async(_url,options)=>options.body?new Promise(resolve=>release=()=>resolve(reply({digest:'D1'}))):reply([{path:'notes.md',size:5}]));
 const saving=button(v,'保存文件').props.onClick();await tick();edit(v,'unsaved after request');release();await saving;assert.equal(v.state.content,'unsaved after request');assert.equal(v.state.dirty,true);assert.equal(v.state.digest,'D1');
});

test('save conflicts and network failures retain the current draft and digest',async t=>{
 for(const network of [false,true]){const errors=[],v=workspace({perform:async fn=>{try{return await fn();}catch(e){errors.push(e);}}});mockGlobal(t,'fetch',async()=>{if(network)throw Error('offline');return {ok:false,status:409,json:async()=>({error:{code:'DIGEST_CONFLICT',message:'file changed'}})};});await button(v,'保存文件').props.onClick();assert.equal(v.state.content,'draft');assert.equal(v.state.digest,'D0');assert.equal(v.state.dirty,true);assert.equal(v.state.saving,false);assert.equal(errors.length,1);}
});

test('late reads cannot replace a new draft, another file, or an unmounted project',async t=>{
 const pending=[];mockGlobal(t,'fetch',()=>new Promise(resolve=>pending.push(resolve)));
 const v=workspace();const reading=v.open('old.md');answer(v,true);await tick();await newDraft(v,'new.md');pending.shift()(reply({content:'late read',digest:'OLD'}));await reading;assert.equal(v.state.path,'new.md');assert.equal(v.state.content,'');assert.equal(v.state.dirty,true);
 const clean=workspace();clean.state.dirty=false;const first=clean.open('first.md');await tick();const second=clean.open('second.md');await tick();pending[1](reply({content:'second',digest:'SECOND'}));await second;pending[0](reply({content:'first',digest:'FIRST'}));await first;pending.length=0;assert.equal(clean.state.path,'second.md');
 const stale=clean.open('old-project.md');await tick();clean.componentWillUnmount();pending.shift()(reply({content:'foreign',digest:'FOREIGN'}));await stale;assert.equal(clean.state.path,'second.md');
});

test('late saves cannot mark another file or an unmounted project saved',async t=>{
 for(const unmount of [false,true]){let release;const v=workspace();mockGlobal(t,'fetch',async(_url,options)=>options.body?new Promise(resolve=>release=()=>resolve(reply({digest:'OLD-SAVE'}))):reply([]));const saving=button(v,'保存文件').props.onClick();await tick();if(unmount)v.componentWillUnmount();else await newDraft(v,'new.md');release();await saving;assert.equal(v.state.dirty,true);assert.equal(v.state.digest,unmount?'D0':null);assert.equal(v.state.content,unmount?'draft':'');}
});

for(const fail of [false,true])test(`real App.perform does not announce a late save ${fail?'failure':'success'} in another project`,async t=>{
 mockGlobal(t,'window',{setTimeout:()=>0,removeEventListener(){}});
  const app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',data:data()});app.refresh=async()=>true;
  const v=workspace({perform:app.perform});app.workspace.current=v;let release;
  mockGlobal(t,'fetch',()=>new Promise((resolve,reject)=>{release=()=>fail?reject(Error('old project offline')):resolve(reply({digest:'OLD-SAVE'}));}));
  const saving=button(v,'保存文件').props.onClick();await tick();const switching=app.switchProject('q');answer(v,true);assert.equal(await switching,true);v.componentWillUnmount();Object.assign(app.state,{data:data('q'),notice:'',error:'current project message'});
  release();await saving;assert.equal(app.state.projectId,'q');assert.equal(app.state.notice,'');assert.equal(app.state.error,'current project message');assert.equal(v.state.dirty,true);app.componentWillUnmount();
});

test('list failures are reported without clearing a draft and stale lists do not open a file',async t=>{
 const errors=[],v=workspace({perform:async fn=>{try{await fn();}catch(e){errors.push(e);}}});mockGlobal(t,'fetch',async()=>{throw Error('list offline');});await v.loadFiles();assert.equal(v.state.content,'draft');assert.equal(errors.length,1);
 let release;mockGlobal(t,'fetch',()=>new Promise(resolve=>release=()=>resolve(reply([{path:'old.md',size:1}]))));const loading=v.loadFiles();v.componentWillUnmount();release();await loading;assert.deepEqual(v.state.files,[]);
});

test('archived and loading editors reject direct write handlers while retaining readable saved files',async t=>{
 const v=workspace({data:data('p',true)}),requests=[];mockGlobal(t,'fetch',async(url,options)=>{requests.push({url,options});return reply({content:'saved',digest:'SAVED'});});mockGlobal(t,'confirm',()=>true);mockGlobal(t,'prompt',()=>assert.fail('archived new-file handler must not prompt'));
 edit(v,'must not write');button(v,'新建文件').props.onClick();await button(v,'保存文件').props.onClick();assert.equal(v.state.content,'draft');assert.equal(requests.length,0);
 const reading=v.open('notes.md');answer(v,true);await reading;assert.equal(v.state.content,'saved');assert.equal(requests[0].options.method,'GET');assert.equal(nodes(v.render()).find(n=>n.type==='textarea').props.readOnly,true);
 const active=workspace();active.state.loading=true;edit(active,'must not replace an in-flight read');assert.equal(active.state.content,'draft');
});

test('workspace discard uses an in-page confirmation and resolves only after the user acts',async t=>{
 const v=workspace();mockGlobal(t,'confirm',()=>assert.fail('native confirm must not run'));
 const result=v.confirmDiscard();assert.equal(typeof result?.then,'function');
 const modal=nodes(v.render()).find(n=>n.type?.name==='Modal');assert.ok(modal);assert.equal(v.state.content,'draft');modal.props.onClose();assert.equal(await result,false);assert.equal(v.state.content,'draft');
});

test('workspace new-file path cancellation after confirming discard keeps the whole original draft',async t=>{
 const v=workspace();mockGlobal(t,'confirm',()=>assert.fail('native confirm must not run'));mockGlobal(t,'prompt',()=>assert.fail('native prompt must not run'));
 const creating=v.newFile();const confirmation=nodes(v.render()).find(n=>n.type?.name==='Modal');assert.ok(confirmation);confirmation.props.onSubmit(new FormData());await tick();await creating;
 const path=nodes(v.render()).find(n=>n.type?.name==='Modal');assert.ok(path);assert.notEqual(path.props.title,confirmation.props.title);path.props.onClose();assert.equal(v.state.path,'notes.md');assert.equal(v.state.content,'draft');assert.equal(v.state.digest,'D0');assert.equal(v.state.dirty,true);
});

test('illegal paths retain the original draft and entered path; a valid submission runs once',async()=>{
 const v=workspace(),creating=v.newFile();answer(v,true);await creating;
 for(const path of ['', '../secret.md', '/outside.md', 'C:/outside.md', 'a\\b.md', '.env', '.pi/settings.json']){createPath(v,path);assert.ok(modal(v));assert.equal(v.state.newPath,path);assert.ok(nodes(v.render()).find(n=>n.props?.role==='alert'));assert.equal(v.state.path,'notes.md');assert.equal(v.state.content,'draft');assert.equal(v.state.digest,'D0');}
 const old=modal(v);createPath(v,'notes/new.md');const generation=v.draftGeneration;old.props.onSubmit(new FormData());assert.equal(v.draftGeneration,generation);assert.equal(v.state.path,'notes/new.md');assert.equal(v.state.content,'');assert.equal(v.state.digest,null);assert.equal(v.state.dirty,true);
});

test('edits immediately invalidate pending discard and path dialogs, including before React commits the edit',async t=>{
 mockGlobal(t,'fetch',()=>assert.fail('stale discard must not read'));
 for(const afterConfirmation of [false,true]){
  const v=workspace(),reading=v.open('other.md');const old=modal(v);
  if(afterConfirmation)answer(v,true);
  const updates=[],update=v.setState;v.setState=(value,callback)=>updates.push([value,callback]);edit(v,'newer draft');v.setState=update;
  for(const [value,callback] of updates)update(value,callback);
  old.props.onSubmit(new FormData());await reading;assert.equal(v.state.content,'newer draft');assert.equal(v.state.path,'notes.md');assert.equal(v.state.dirty,true);
 }
 const v=workspace(),creating=v.newFile();answer(v,true);await creating;const old=modal(v);edit(v,'changed during path entry');const fd=new FormData();fd.set('path','stale.md');old.props.onSubmit(fd);assert.equal(v.state.content,'changed during path entry');assert.equal(v.state.path,'notes.md');assert.equal(modal(v),undefined);
});

test('cancelled and duplicate confirmations, ABA context changes and unmount cannot revive old handlers',async()=>{
 const v=workspace(),first=v.confirmDiscard(),old=modal(v);answer(v,false);assert.equal(await first,false);
 const second=v.confirmDiscard(),fresh=v.state.dialog;old.props.onSubmit(new FormData());assert.equal(v.state.dialog,fresh);assert.equal(await v.confirmDiscard(),false);answer(v,true);assert.equal(await second,true);
 const third=v.confirmDiscard(),thirdModal=modal(v);let previous=v.props;v.props={...v.props,data:data('q')};v.componentDidUpdate(previous);previous=v.props;v.props={...v.props,data:data()};v.componentDidUpdate(previous);thirdModal.props.onSubmit(new FormData());assert.equal(await third,false);assert.equal(v.state.content,'draft');
 const pending=v.confirmDiscard(),last=modal(v);v.componentWillUnmount();last.props.onSubmit(new FormData());assert.equal(await pending,false);assert.equal(v.state.content,'draft');
});

test('path dialog rechecks archive status, and failed rereads preserve the original draft and digest',async t=>{
 const v=workspace(),creating=v.newFile();answer(v,true);await creating;const old=modal(v),previous=v.props;v.props={...v.props,data:data('p',true)};v.componentDidUpdate(previous);const fd=new FormData();fd.set('path','forbidden.md');old.props.onSubmit(fd);assert.equal(v.state.path,'notes.md');assert.equal(v.state.content,'draft');assert.equal(v.state.digest,'D0');
 const errors=[],readingView=workspace({perform:async fn=>{try{await fn();}catch(e){errors.push(e);}}});mockGlobal(t,'fetch',async()=>{throw Error('offline reread');});const reading=readingView.open('notes.md');answer(readingView,true);await reading;assert.equal(readingView.state.content,'draft');assert.equal(readingView.state.digest,'D0');assert.equal(readingView.state.dirty,true);assert.equal(readingView.state.loading,false);assert.match(errors[0].message,/offline reread/);
});

test('hidden workspaces confirm in the body portal and stop submit and keyboard propagation',async t=>{
 const body={nodeType:1};mockGlobal(t,'document',{body});
 for(const tab of ['chat','settings']){
  const v=workspace(),app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',data:data(),boot:{projects:[]},tab});app.refresh=async()=>true;app.workspace.current=v;
  const hidden=nodes(app.render()).find(n=>n.type?.name==='WorkspaceView');assert.ok(hidden);const pending=app.switchProject('q'),portal=nodes(v.render()).find(n=>n.containerInfo===body);assert.ok(portal);assert.equal(modal(v).props.alert,true);let stopped=0;portal.children.props.onSubmit({stopPropagation(){stopped++;}});portal.children.props.onKeyDown({stopPropagation(){stopped++;}});assert.equal(stopped,2);answer(v,false);assert.equal(await pending,false);assert.equal(app.state.projectId,'p');assert.equal(v.state.content,'draft');app.componentWillUnmount();
 }
});

test('project selection waits for state completion and rejects duplicate, edited and ABA intentions',async()=>{
 const v=workspace(),app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',data:data()});app.refresh=async()=>true;app.workspace.current=v;
 const pending=app.switchProject('q');answer(v,true);edit(v,'after confirmation');assert.equal(await pending,false);assert.equal(app.state.projectId,'p');assert.equal(v.state.content,'after confirmation');
 const first=app.switchProject('q'),old=modal(v);assert.equal(await app.switchProject('q'),false);old.props.onSubmit(new FormData());assert.equal(await first,false);assert.equal(app.state.projectId,'p');
 const stale=app.switchProject('q'),staleModal=modal(v);await app.switchProject('p');staleModal.props.onSubmit(new FormData());assert.equal(await stale,false);assert.equal(app.state.projectId,'p');
 const callbacks=[],update=app.setState;app.setState=(value,callback)=>update(value,()=>{if(callback)callbacks.push(callback);});let resolved=false;const switching=app.switchProject('q').then(result=>{resolved=true;return result;});answer(v,true);await tick();assert.equal(resolved,false);assert.equal(app.state.projectId,'q');callbacks.shift()();assert.equal(await switching,true);app.componentWillUnmount();
});

test('pending project creation and old project management callbacks cannot replace or close a newer modal',async()=>{
 const v=workspace(),app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',data:data()});app.refresh=async()=>true;app.workspace.current=v;
 const creating=app.open('project'),old=modal(v);await app.open('claim');old.props.onSubmit(new FormData());await creating;assert.equal(app.state.modal,'claim');assert.equal(v.state.content,'draft');
 await app.open('projects');const management=app.modalView();const cancelled=management.props.onOpen('q');answer(v,false);await cancelled;assert.equal(app.state.modal,'projects');assert.equal(app.state.projectId,'p');
 const opening=management.props.onOpen('q'),confirmation=modal(v);confirmation.props.onSubmit(new FormData());await app.open('config',{content:'new modal'});await opening;assert.equal(app.state.modal,'config');assert.equal(app.state.projectId,'p');
 await management.props.onOpen('q');assert.equal(app.state.modal,'config');assert.equal(app.state.projectId,'p');
 await app.open('projects');const current=app.modalView(),success=current.props.onOpen('q');answer(v,true);await success;assert.equal(app.state.projectId,'q');assert.equal(app.state.modal,'');app.componentWillUnmount();
});

test('switch-project select captures its target before the asynchronous confirmation resumes',async()=>{
 const v=workspace(),app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',data:data(),boot:{projects:[{id:'p',name:'P'},{id:'q',name:'Q'}]}});app.refresh=async()=>true;app.workspace.current=v;
 const select=nodes(app.render()).find(n=>n.type==='select'&&n.props['aria-label']==='当前项目'),event={target:{value:'q'}};select.props.onChange(event);event.target.value='other';answer(v,true);await tick();assert.equal(app.state.projectId,'q');app.componentWillUnmount();
});

test('X, cancel, Escape and backdrop close both workspace steps without discarding the draft',async()=>{
 for(const step of ['discard','path'])for(const mode of ['X','cancel','Escape','backdrop']){
  const v=workspace(),operation=v.newFile();if(step==='path'){answer(v,true);await operation;}
  const element=modal(v),frame=new element.type(element.props),tree=frame.render();
  if(mode==='X')nodes(tree).find(n=>n.type==='button'&&n.props['aria-label']==='关闭对话框').props.onClick();
  else if(mode==='cancel')nodes(tree).find(n=>n.type==='button'&&text(n)==='取消').props.onClick();
  else if(mode==='Escape')nodes(tree).find(n=>n.type==='section').props.onKeyDown({key:'Escape',target:{closest:()=>null},stopPropagation(){},preventDefault(){}});
  else {const backdrop=nodes(tree).find(n=>n.props?.className==='modal-backdrop'),target={};backdrop.props.onMouseDown({target,currentTarget:target});}
  await operation;assert.equal(modal(v),undefined);assert.equal(v.state.path,'notes.md');assert.equal(v.state.content,'draft');assert.equal(v.state.digest,'D0');assert.equal(v.state.dirty,true);
 }
});

test('Windows-invalid new-file paths preserve the original draft before clearing it',async()=>{
 const invalid=['notes/new.md.','notes/new.md ','notes./new.md','notes /new.md','CON','con.txt','NUL.tar.gz','PRN.md','AUX','COM1.md','LPT9','COM¹.txt','LPT².md','CONIN$','conout$','notes/a<b.md','notes/a>b.md','notes/a"b.md','notes/a|b.md','notes/a?b.md','notes/a*b.md','notes/a\u0001b.md','.GIT/config','.ENV','nested/.Env.production','Model-Connections.JSON'];
 for(const path of invalid){const v=workspace(),creating=v.newFile();answer(v,true);await creating;createPath(v,path);assert.ok(modal(v),path);assert.equal(v.state.newPath,path);assert.equal(v.state.path,'notes.md');assert.equal(v.state.content,'draft');assert.equal(v.state.digest,'D0');assert.equal(v.state.dirty,true);assert.ok(nodes(v.render()).find(n=>n.props?.role==='alert'),path);}
 for(const path of ['notes/new.md','研究/分析.v1.json','.gitignore','console.md','COM10.md','LPT10.md','result~1.md']){const v=workspace();await newDraft(v,path);assert.equal(modal(v),undefined);assert.equal(v.state.path,path);assert.equal(v.state.content,'');assert.equal(v.state.digest,null);assert.equal(v.state.dirty,true);}
});

test('mobile project selection closes navigation and focuses its visible entry before showing discard',async t=>{
 mockGlobal(t,'window',{innerWidth:390,removeEventListener(){}});
 const v=workspace(),app=synchronousState(new App({})),order=[];Object.assign(app.state,{projectId:'p',data:data(),boot:{projects:[{id:'p',name:'P'},{id:'q',name:'Q'}]},navigationOpen:true,tab:'chat'});app.refresh=async()=>true;app.workspace.current=v;app.navigationToggle={focus(){order.push('visible-entry');}};
 const confirm=v.confirmDiscard.bind(v);v.confirmDiscard=()=>{assert.equal(app.state.navigationOpen,false);assert.deepEqual(order,['visible-entry']);return confirm();};
 const select=nodes(app.render()).find(n=>n.type==='select'&&n.props['aria-label']==='当前项目'),event={target:{value:'q'}};select.props.onChange(event);event.target.value='other';assert.equal(app.state.navigationOpen,false);assert.ok(modal(v));answer(v,false);await tick();assert.equal(app.state.projectId,'p');assert.equal(app.state.navigationOpen,false);assert.equal(v.state.content,'draft');assert.deepEqual(order,['visible-entry']);app.componentWillUnmount();
});

test('late mobile project-select callbacks cannot overwrite newer navigation, modal or draft intentions',async t=>{
 mockGlobal(t,'document',{getElementById:()=>({focus(){}})});
 for(const change of ['navigation-ABA','modal','draft','tab-ABA','unmount']){
  const v=workspace(),app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',data:data(),boot:{projects:[{id:'p',name:'P'},{id:'q',name:'Q'}]},navigationOpen:true,tab:'chat'});app.refresh=async()=>true;app.workspace.current=v;app.navigationToggle={focus(){assert.fail('stale project choice must not steal focus');}};
  const callbacks=[],update=app.setState;app.setState=(value,callback)=>update(value,()=>{if(callback)callbacks.push(callback);});
  const select=nodes(app.render()).find(n=>n.type==='select'&&n.props['aria-label']==='当前项目');select.props.onChange({target:{value:'q'}});assert.equal(modal(v),undefined);const callback=callbacks.shift();assert.ok(callback);
  if(change==='navigation-ABA'){app.toggleNavigation();app.toggleNavigation();}else if(change==='modal')await app.open('claim');else if(change==='draft')edit(v,'newer edit');else if(change==='tab-ABA'){app.selectTab('settings');app.selectTab('chat');}else app.componentWillUnmount();
  callback();await tick();assert.equal(modal(v),undefined);assert.equal(app.state.projectId,'p');if(change==='modal')assert.equal(app.state.modal,'claim');if(change==='draft')assert.equal(v.state.content,'newer edit');app.componentWillUnmount();
 }
});
