import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {WorkspaceView} from '../../dist/web/assets/data-views.js';
import {App} from '../../dist/web/assets/app.js';

const nodes=n=>Array.isArray(n)?n.flatMap(nodes):!n||typeof n!=='object'?[]:[n,...nodes(n.props?.children)];
const text=n=>Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):typeof n==='string'?n:'';
const button=(v,label)=>nodes(v.render()).find(n=>n.type==='button'&&text(n)===label);
const reply=data=>({ok:true,json:async()=>data});
const mockedGlobals=new WeakMap();
function mockGlobal(t,name,value){let names=mockedGlobals.get(t);if(!names){names=new Set();mockedGlobals.set(t,names);}if(!names.has(name)){names.add(name);const previous=Object.getOwnPropertyDescriptor(globalThis,name);t.after(()=>{if(previous)Object.defineProperty(globalThis,name,previous);else delete globalThis[name];});}Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const data=(id='p',archived=false)=>({project:{id,name:id,archived,settings:{enabled:false}},sessions:[],experiments:[],runs:[],teams:[],campaigns:[],evidence:[],wakeups:[],intents:[]});
function workspace(extra={}){const v=synchronousState(new WorkspaceView({data:data(),perform:async fn=>fn(),...extra}));Object.assign(v.state,{path:'notes.md',content:'draft',digest:'D0',dirty:true});return v;}
const edit=(v,content)=>nodes(v.render()).find(n=>n.type==='textarea').props.onChange({target:{value:content}});

test('workspace stays mounted across management and chat navigation; cancelling a project switch preserves its draft',t=>{
 const v=synchronousState(new App({}));Object.assign(v.state,{projectId:'p',boot:{projects:[]},data:data(),tab:'workspace'});v.refresh=async()=>true;
 const before=nodes(v.render()).find(n=>n.type?.name==='WorkspaceView'),draft=workspace();
 v.selectTab('settings');const hidden=nodes(v.render()).find(n=>n.type?.name==='WorkspaceView');assert.ok(hidden);assert.equal(hidden.key,before.key);assert.equal(hidden.props.ref,before.props.ref);
 before.props.ref.current=draft;
 v.selectTab('chat');assert.ok(nodes(v.render()).find(n=>n.type?.name==='WorkspaceView'));
 mockGlobal(t,'confirm',()=>false);v.switchProject('q');assert.equal(v.state.projectId,'p');assert.equal(draft.state.content,'draft');
 v.switchProject('p');assert.equal(v.state.data.project.id,'p');
 mockGlobal(t,'confirm',()=>true);v.switchProject('q');assert.equal(v.state.projectId,'q');v.componentWillUnmount();
});

test('new file and reread can be cancelled before discarding; cancelling project creation keeps the draft',async t=>{
 const v=workspace();mockGlobal(t,'prompt',()=> 'new.md');mockGlobal(t,'confirm',()=>false);
 button(v,'新建文件').props.onClick();assert.equal(v.state.path,'notes.md');assert.equal(v.state.content,'draft');
 await button(v,'重新读取').props.onClick();assert.equal(v.state.content,'draft');
 const app=synchronousState(new App({}));app.workspace.current=v;app.open('project');assert.equal(app.state.modal,'');
 mockGlobal(t,'confirm',()=>true);app.open('project');assert.equal(app.state.modal,'project');app.close();assert.equal(v.state.content,'draft');assert.equal(v.state.dirty,true);
 button(v,'新建文件').props.onClick();assert.equal(v.state.path,'new.md');assert.equal(v.state.content,'');assert.equal(v.state.digest,null);assert.equal(v.state.dirty,true);
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
 const pending=[];mockGlobal(t,'fetch',()=>new Promise(resolve=>pending.push(resolve)));mockGlobal(t,'confirm',()=>true);mockGlobal(t,'prompt',()=> 'new.md');
 const v=workspace();const reading=v.open('old.md');button(v,'新建文件').props.onClick();pending.shift()(reply({content:'late read',digest:'OLD'}));await reading;assert.equal(v.state.path,'new.md');assert.equal(v.state.content,'');assert.equal(v.state.dirty,true);
 v.state.dirty=false;const first=v.open('first.md'),second=v.open('second.md');pending[1](reply({content:'second',digest:'SECOND'}));await second;pending[0](reply({content:'first',digest:'FIRST'}));await first;pending.length=0;assert.equal(v.state.path,'second.md');
 const stale=v.open('old-project.md');v.componentWillUnmount();pending.shift()(reply({content:'foreign',digest:'FOREIGN'}));await stale;assert.equal(v.state.path,'second.md');
});

test('late saves cannot mark another file or an unmounted project saved',async t=>{
 for(const unmount of [false,true]){let release;const v=workspace();mockGlobal(t,'confirm',()=>true);mockGlobal(t,'prompt',()=> 'new.md');mockGlobal(t,'fetch',async(_url,options)=>options.body?new Promise(resolve=>release=()=>resolve(reply({digest:'OLD-SAVE'}))):reply([]));const saving=button(v,'保存文件').props.onClick();await tick();if(unmount)v.componentWillUnmount();else button(v,'新建文件').props.onClick();release();await saving;assert.equal(v.state.dirty,true);assert.equal(v.state.digest,unmount?'D0':null);assert.equal(v.state.content,unmount?'draft':'');}
});

for(const fail of [false,true])test(`real App.perform does not announce a late save ${fail?'failure':'success'} in another project`,async t=>{
 mockGlobal(t,'window',{setTimeout:()=>0,removeEventListener(){}});mockGlobal(t,'confirm',()=>true);
  const app=synchronousState(new App({}));Object.assign(app.state,{projectId:'p',data:data()});app.refresh=async()=>true;
  const v=workspace({perform:app.perform});app.workspace.current=v;let release;
  mockGlobal(t,'fetch',()=>new Promise((resolve,reject)=>{release=()=>fail?reject(Error('old project offline')):resolve(reply({digest:'OLD-SAVE'}));}));
  const saving=button(v,'保存文件').props.onClick();await tick();app.switchProject('q');v.componentWillUnmount();Object.assign(app.state,{data:data('q'),notice:'',error:'current project message'});
  release();await saving;assert.equal(app.state.projectId,'q');assert.equal(app.state.notice,'');assert.equal(app.state.error,'current project message');assert.equal(v.state.dirty,true);app.componentWillUnmount();
});

test('list failures are reported without clearing a draft and stale lists do not open a file',async t=>{
 const errors=[],v=workspace({perform:async fn=>{try{await fn();}catch(e){errors.push(e);}}});mockGlobal(t,'fetch',async()=>{throw Error('list offline');});await v.loadFiles();assert.equal(v.state.content,'draft');assert.equal(errors.length,1);
 let release;mockGlobal(t,'fetch',()=>new Promise(resolve=>release=()=>resolve(reply([{path:'old.md',size:1}]))));const loading=v.loadFiles();v.componentWillUnmount();release();await loading;assert.deepEqual(v.state.files,[]);
});

test('archived and loading editors reject direct write handlers while retaining readable saved files',async t=>{
 const v=workspace({data:data('p',true)}),requests=[];mockGlobal(t,'fetch',async(url,options)=>{requests.push({url,options});return reply({content:'saved',digest:'SAVED'});});mockGlobal(t,'confirm',()=>true);mockGlobal(t,'prompt',()=>assert.fail('archived new-file handler must not prompt'));
 edit(v,'must not write');button(v,'新建文件').props.onClick();await button(v,'保存文件').props.onClick();assert.equal(v.state.content,'draft');assert.equal(requests.length,0);
 await v.open('notes.md');assert.equal(v.state.content,'saved');assert.equal(requests[0].options.method,'GET');assert.equal(nodes(v.render()).find(n=>n.type==='textarea').props.readOnly,true);
 const active=workspace();active.state.loading=true;edit(active,'must not replace an in-flight read');assert.equal(active.state.content,'draft');
});
