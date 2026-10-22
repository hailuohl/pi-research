import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {ModelManagementPanel} from '../../dist/web/assets/model-management-view.js';
import {Modal} from '../../dist/web/assets/ui.js';
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const find=(tree,predicate)=>elements(tree).find(predicate);
const response=data=>({ok:true,json:async()=>data});
const failed=(status,message)=>({ok:false,status,json:async()=>({error:{message}})});
const selection={provider:'first',model:'default',thinking:'low'};
const capabilities={text:true,image:false,pdf:false,video:false,structuredOutput:false,nativeWebSearch:false,midConversationSystem:false};
const definition=(model='default')=>({model,name:model,nativeProfile:'none',contextWindow:32768,maxTokens:4096,capabilities:{...capabilities},reasoning:{defaultLevel:'low',levels:['off','low','high','xhigh','max'].map(id=>({id,label:id,piLevel:id,parameters:{}}))},parameters:{},structuredOutput:null,configuration:{mode:'manual',overrides:[]}});
const managed=(model='default',order=0)=>({...definition(model),enabled:true,deletedAt:null,order,revision:1,source:'managed',effectiveCapabilities:Object.fromEntries(Object.keys(capabilities).map(key=>[key,{declared:capabilities[key],state:capabilities[key]?'available':'disabled',reason:'Observed adapter state'}])),test:null});
const provider=(id='first',models=[managed(),managed('large',1)])=>({provider:id,name:id,enabled:true,deletedAt:null,order:id==='first'?0:1,source:'managed',baseUrl:'https://api.example.com/v1',api:'openai-responses',hasApiKey:true,models,test:null});
const data=(version=1,providers=[provider(),provider('second',[managed('fast')])],defaultModelVersion=1)=>({version,schemaVersion:2,defaultModel:{...selection},defaultModelVersion,defaultUsable:true,providers,presets:[{id:'openai',name:'OpenAI',group:'全球',providerBrand:'openai',baseUrl:'https://api.openai.com/v1',api:'openai-responses'}],supportedApis:['openai-completions','openai-responses','anthropic-messages']});
const boot={model:selection,models:[selection],modelVersion:1,runtime:{ready:true}};
const panel=()=>{const view=synchronousState(new ModelManagementPanel({boot,perform:async fn=>fn()}));view.observe(data());return view;};
function mock(t,fetch){const previous=globalThis.fetch;globalThis.fetch=fetch;t.after(()=>globalThis.fetch=previous);}


const confirmation=view=>find(view.render(),n=>n.type===Modal);
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('delete opens an accurate styled confirmation inside the editor, outside its form, with inert content',async t=>{
 const posts=[];mock(t,async(_url,init)=>{posts.push(JSON.parse(init.body));const next=data(2);next.providers[0].models[1].deletedAt='2026-10-12';return response(next);});
 const view=panel();view.chooseModel('large');view.openEditor('model');view.updateDefinition({name:'Local draft'});const trigger={focus(){},isConnected:true};
 find(view.render(),n=>n.props.children==='删除模型').props.onClick({currentTarget:trigger});const modal=confirmation(view);assert.ok(modal);assert.equal(modal.props.alert,true);assert.match(JSON.stringify(modal),/large/);assert.match(JSON.stringify(modal),/first/);assert.match(modal.props.description,/保留历史.*恢复为停用/);assert.equal(posts.length,0);
 let stopped=false;find(view.render(),n=>n.props['data-model-delete-confirmation']).props.onSubmit({stopPropagation(){stopped=true;}});assert.equal(stopped,true);const dialog=find(view.render(),n=>n.type==='dialog');assert.ok(find(dialog,n=>n.type===Modal));assert.equal(find(find(dialog,n=>n.type==='form'),n=>n.type===Modal),undefined);for(const name of ['management-editor-heading','management-editor-scroll','management-editor-footer'])assert.equal(find(dialog,n=>n.props.className===name).props.inert,true);
 modal.props.onSubmit();modal.props.onSubmit();await settle();assert.deepEqual(posts,[{expectedVersion:1,action:'model.delete',provider:'first',model:'large'}]);assert.equal(view.state.model,'default');assert.equal(confirmation(view),undefined);assert.equal(view.state.modelDrafts[JSON.stringify(['first','large'])].name,'Local draft');assert.match(JSON.stringify(view.render()),/large.*2026-10-12/);
});

test('cancel and editor Escape retain drafts, restore the delete trigger and close only confirmation',async t=>{
 let calls=0;mock(t,async()=>{calls++;return response(data(2));});const view=panel();view.chooseModel('large');view.openEditor('model');view.openJson('parameters');const key=view.state.jsonTarget;view.editJson(key,view.editorScope().sequence,'{"keep":true}');const before=JSON.stringify(view.state.jsonBuffers);let focused=0;const trigger={focus(){focused++;},isConnected:true};view.remove('model',trigger);const old=confirmation(view);old.props.onClose();assert.equal(focused,1);assert.equal(view.state.editorOpen,true);assert.equal(JSON.stringify(view.state.jsonBuffers),before);old.props.onSubmit();await settle();assert.equal(calls,0);
 view.remove('model',trigger);const dialog=find(view.render(),n=>n.type==='dialog');dialog.props.onCancel({preventDefault(){}});assert.equal(confirmation(view),undefined);assert.equal(view.state.editorOpen,true);assert.equal(focused,2);assert.equal(JSON.stringify(view.state.jsonBuffers),before);
 view.remove('model',trigger);const host=find(view.render(),n=>n.props['data-model-delete-confirmation']);let prevented=false,stopped=false;host.props.onKeyDownCapture({key:'Escape',preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});assert.equal(prevented,true);assert.equal(stopped,true);assert.equal(view.state.editorOpen,true);assert.equal(calls,0);
 for(const action of ['close','backdrop']){view.remove('model',trigger);const ui=new Modal(confirmation(view).props).render();if(action==='close')find(ui,n=>n.props['aria-label']==='关闭对话框').props.onClick();else ui.props.onMouseDown({target:ui,currentTarget:ui});assert.equal(confirmation(view),undefined);assert.equal(JSON.stringify(view.state.jsonBuffers),before);}assert.equal(calls,0);
});

test('network and 409 errors remain in confirmation and identical retry keeps the mutation key',async t=>{
 const posts=[];let failure=503;mock(t,async(_url,init)=>{posts.push({body:JSON.parse(init.body),key:init.headers['Idempotency-Key']});return failure?failed(failure,'delete failed'):response(data(2));});const view=panel();view.chooseProvider('second');view.openEditor('connection');view.updateProvider({name:'Kept',apiKey:'FAKE_secret'});view.remove('provider');const frozen=confirmation(view);frozen.props.onSubmit();await settle();assert.match(JSON.stringify(confirmation(view)),/delete failed/);assert.equal(view.providerDraft().name,'Kept');failure=409;confirmation(view).props.onSubmit();await settle();assert.match(JSON.stringify(confirmation(view)),/刷新当前版本.*保留/);assert.equal(posts[0].key,posts[1].key);assert.equal(posts[0].body.expectedVersion,1);assert.equal(posts[1].body.expectedVersion,1);assert.equal(confirmation(view).props.busy,false);assert.equal(confirmation(view).props.closeDisabled,false);
});

test('stale confirmation rejects known version changes, selection ABA, editor reopen, defaults, tombstones and unmount',async t=>{
 let posts=0;mock(t,async()=>{posts++;return response(data(2));});
 const changes=[v=>v.observe(data(2)),v=>{v.observe(data(2));v.observe(data(1));},v=>{v.chooseModel('default');v.chooseModel('large');},v=>{v.closeEditor();v.openEditor('model');},v=>v.changeTab('advanced'),v=>{const next=data();next.defaultModel.model='large';v.observe(next);},v=>{const next=data();next.providers[0].models[1].deletedAt='deleted';v.observe(next);},v=>v.componentWillUnmount()];
 for(const change of changes){const view=panel();view.chooseModel('large');view.openEditor('model');view.remove('model');const old=confirmation(view);change(view);old.props.onSubmit();await settle();assert.equal(posts,0);}
 const view=panel();view.chooseModel('large');view.remove('model');const old=confirmation(view);old.props.onClose();view.remove('model');old.props.onSubmit();await settle();assert.equal(posts,0);assert.ok(confirmation(view));
});

test('perform delay rechecks at actual POST and stale success cannot move a changed selection',async t=>{
 let calls=0,start;mock(t,async()=>{calls++;return response(data(2));});const view=panel();view.props={...view.props,perform:fn=>new Promise(resolve=>{start=async()=>{await fn();resolve();};})};view.chooseModel('large');view.openEditor('model');view.remove('model');confirmation(view).props.onSubmit();assert.equal(confirmation(view).props.closeDisabled,true);confirmation(view).props.onClose();assert.ok(confirmation(view));view.observe(data(2));await start().catch(()=>{});await settle();assert.equal(calls,0);assert.match(JSON.stringify(confirmation(view)),/失效/);
 let finish;mock(t,async()=>new Promise(resolve=>{finish=()=>resolve(response(data(2)));}));const other=panel();other.chooseModel('large');other.openEditor('model');other.remove('model');confirmation(other).props.onSubmit();other.closeEditor();other.openEditor('connection');finish();await settle();assert.equal(other.state.model,'large');
});


test('queued React state cannot revive a cancelled confirmation or a changed default selection',async t=>{
 let posts=0;mock(t,async()=>{posts++;return response(data(2));});const view=panel();view.chooseModel('large');view.openEditor('model');const queue=[];view.setState=(update,callback)=>queue.push([update,callback]);const flush=()=>{while(queue.length){const [update,callback]=queue.shift();Object.assign(view.state,typeof update==='function'?update(view.state,view.props):update);callback?.();}};
 view.remove('model');view.remove('provider');flush();const old=confirmation(view);assert.equal(old.props.title,'删除模型');old.props.onClose();old.props.onSubmit();view.remove('model');old.props.onSubmit();await settle();assert.equal(posts,0);flush();assert.ok(confirmation(view));
 view.updateSelection({thinking:'high'});view.updateSelection({thinking:'low'});confirmation(view).props.onSubmit();flush();await settle();assert.equal(posts,0);assert.match(JSON.stringify(confirmation(view)),/失效/);
});
