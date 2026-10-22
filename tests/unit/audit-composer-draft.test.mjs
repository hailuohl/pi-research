import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {synchronousState} from '../support/ui.mjs';

const built=await build({stdin:{contents:"export {Chat} from './apps/web/src/workbench.tsx';export {SessionHistory} from './apps/web/src/session-history.tsx';",resolveDir:fileURLToPath(new URL('../../',import.meta.url)),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',logLevel:'silent'});
const module={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {Chat,SessionHistory}=module.exports,model={provider:'fixture',model:'fixture',thinking:'off'};
const attachment={documentVersionId:'doc',artifactId:'artifact',digest:'a'.repeat(64),title:'public.txt',mediaType:'text/plain',size:12};
function storage(t){const old={sessionStorage:globalThis.sessionStorage,window:globalThis.window,fetch:globalThis.fetch},values=new Map(),listeners=new Map();globalThis.sessionStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};globalThis.window={addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:(k,v)=>{if(listeners.get(k)===v)listeners.delete(k);}};t.after(()=>Object.assign(globalThis,old));return {values,listeners};}
function chat(projectId,sessionId='s'){return synchronousState(new Chat({data:{project:{id:projectId,archived:false,settings:{enabled:false}},teams:[],wakeups:[],approvals:[]},boot:{runtime:{ready:true},models:[model]},session:{id:sessionId,projectId,version:1,role:'coordinator',state:'idle',model},messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,stream:'',busy:false,perform:async fn=>fn(),onHistory(){},onToggle(){},onSession(){},onExperiment(){},onRun(){}}));}
function edit(view,draft,attachments=[]){const previous={...view.state};view.setState({draft,attachments,draftVersion:view.state.draftVersion+1});view.componentDidUpdate(view.props,previous);}

test('unsent text and fixed attachment references survive switching and reload without crossing project/session',t=>{storage(t);const a=chat('draft-switch');edit(a,'Unsent public fixture',[attachment]);a.componentWillUnmount();assert.equal(chat('draft-switch','other').state.draft,'');assert.equal(chat('other-project').state.draft,'');const restored=chat('draft-switch');assert.equal(restored.state.draft,'Unsent public fixture');assert.deepEqual(restored.state.attachments,[attachment]);assert.equal(chat('draft-switch').state.draft,'Unsent public fixture');});

test('a deferred scope change restores its draft without closing an invalidated rename or accepting an old send receipt',async t=>{
 const {values}=storage(t),keys=[];
 const next=chat('draft-rename','next');edit(next,'Next draft',[attachment]);
 globalThis.fetch=async(_url,init)=>{keys.push(init.headers['Idempotency-Key']);throw Error('unknown send result');};
 await assert.rejects(()=>next.submit({preventDefault(){}}));next.componentWillUnmount();
 const view=chat('draft-rename');edit(view,'Original draft');let finish;
 globalThis.fetch=(_url,init)=>{keys.push(init.headers['Idempotency-Key']);return new Promise(resolve=>finish=()=>resolve({ok:true,json:async()=>({id:'old-message',projectId:'draft-rename',sessionId:'s',role:'user',version:1,status:'queued',content:'Original draft',mode:'prompt'})}));};
 const pending=view.submit({preventDefault(){}});view.renameSession();view.setState({renameTitle:'Unsubmitted name'});
 const originalTarget=view.state.renameTarget,previousProps=view.props,previousState={...view.state,draft:'',draftVersion:0},updates=[];
 // Model a draft edit batched with new props, then delay the restored state commit.
 view.setState=(update,callback)=>updates.push({update,callback});
 const flush=()=>{if(!updates.length)return;const previous={...view.state};for(const {update,callback} of updates.splice(0)){Object.assign(view.state,typeof update==='function'?update(view.state,view.props):update);callback?.();}view.componentDidUpdate(view.props,previous);};
 view.props={...view.props,session:{...view.props.session,id:'next'}};view.componentDidUpdate(previousProps,previousState);
 const saved=sessionId=>JSON.parse(values.get('pi-research-composer-v1:'+JSON.stringify(['draft-rename',sessionId])));
 assert.equal(saved('next').draft,'Next draft');assert.equal(saved('next').pending.key,keys[0]);assert.equal(saved('s').pending.key,keys[1]);
 flush();assert.equal(view.state.draft,'Next draft');assert.deepEqual(view.state.attachments,[attachment]);
 assert.equal(view.state.renameTarget,originalTarget);assert.equal(view.state.renameTitle,'Unsubmitted name');assert.ok(view.state.renameError);assert.equal(view.state.renameSaving,false);
 finish();await pending;flush();assert.equal(view.state.draft,'Next draft');assert.deepEqual(view.state.attachments,[attachment]);assert.equal(saved('next').pending.key,keys[0]);
 globalThis.fetch=async(_url,init)=>{keys.push(init.headers['Idempotency-Key']);throw Error('still unknown');};
 await assert.rejects(()=>view.submit({preventDefault(){}}));flush();assert.equal(keys[2],keys[0]);view.componentWillUnmount();
});

test('an unconfirmed send retains its original idempotency key after reload, and confirmation clears only that draft',async t=>{storage(t);const keys=[];let fail=true;globalThis.fetch=async(_url,init)=>{keys.push(init.headers['Idempotency-Key']);if(fail)throw Error('transport result unknown');const body=JSON.parse(init.body);return {ok:true,json:async()=>({id:'message',projectId:'draft-send',sessionId:'s',role:'user',version:1,status:'queued',content:body.content,mode:body.mode})};};const other=chat('draft-send','other');edit(other,'Keep other draft');other.componentWillUnmount();const first=chat('draft-send');edit(first,'Ambiguous send',[attachment]);await assert.rejects(()=>first.submit({preventDefault(){}}));first.componentWillUnmount();const reopenedWithoutSending=chat('draft-send');reopenedWithoutSending.componentWillUnmount();const restored=chat('draft-send');assert.equal(restored.state.draft,'Ambiguous send');fail=false;await restored.submit({preventDefault(){}});restored.componentWillUnmount();assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);assert.equal(chat('draft-send').state.draft,'');assert.equal(chat('draft-send').state.attachments.length,0);assert.equal(chat('draft-send','other').state.draft,'Keep other draft');});

test('editing an unconfirmed draft creates a new intent rather than replaying the earlier send',async t=>{storage(t);const keys=[];globalThis.fetch=async(_url,init)=>{keys.push(init.headers['Idempotency-Key']);throw Error('unknown');};const first=chat('draft-edited');edit(first,'First intent');await assert.rejects(()=>first.submit({preventDefault(){}}));first.componentWillUnmount();const restored=chat('draft-edited');edit(restored,'Changed intent');await assert.rejects(()=>restored.submit({preventDefault(){}}));assert.notEqual(keys[0],keys[1]);restored.componentWillUnmount();});

test('storage failure retains the in-tab draft and warns before unloading',t=>{const {listeners}=storage(t);globalThis.sessionStorage.setItem=()=>{throw Error('storage full');};const first=chat('draft-full');first.componentDidMount?.();edit(first,'Cannot persist',[attachment]);assert.ok(first.state.draftSaveError);let prevented=false;const event={preventDefault(){prevented=true;},returnValue:undefined};assert.equal(typeof listeners.get('beforeunload'),'function');listeners.get('beforeunload')(event);assert.equal(prevented,true);first.componentWillUnmount();assert.equal(chat('draft-full').state.draft,'Cannot persist');});


test('branch history visibly retains its original message identity without copying native request authority',t=>{storage(t);const message={id:'branch-message',projectId:'branch-ui',sessionId:'branch',role:'assistant',mode:'prompt',status:'completed',content:'Partial original',contentTruncated:true,createdAt:'2026-10-22T00:00:00Z',version:1,branchSource:{sessionId:'source-session',messageId:'source-message'}};const view=new SessionHistory({projectId:'branch-ui',sessionId:'branch',messages:[message],history:null,historyAnchor:null,onNavigate(){},perform:async fn=>fn()});const rendered=JSON.stringify(view.render());assert.ok(rendered.includes('source-session')&&rendered.includes('source-message'));assert.equal(message.nativeRequestId,undefined);});


test('explicit model selection sends only editable identity fields, leaving restore epoch binding to the server',async t=>{storage(t);let sent;globalThis.fetch=async(_url,init)=>{sent=JSON.parse(init.body);return {ok:true,json:async()=>({id:'s',projectId:'draft-model',model:{...model,restoreEpoch:2}})};};const view=chat('draft-model');await view.changeModel({...model,restoreEpoch:2});assert.deepEqual(sent.model,model);view.componentWillUnmount();});


test('a restored model is not sendable from an old session until explicit selection binds the current epoch',t=>{storage(t);const view=chat('draft-restored');view.props={...view.props,boot:{...view.props.boot,models:[{...model,restoreEpoch:1}]}};assert.equal(view.canSend(),false);view.props={...view.props,session:{...view.props.session,model:{...model,restoreEpoch:1}}};assert.equal(view.canSend(),true);view.componentWillUnmount();});
