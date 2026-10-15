import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {synchronousState} from '../support/ui.mjs';

// Exercise current source without writing or replacing the browser build.
const built=await build({stdin:{contents:"export {Chat} from './apps/web/src/workbench.tsx'; export {ComposerControls} from './apps/web/src/composer-controls.tsx';",resolveDir:fileURLToPath(new URL('../../',import.meta.url)),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',logLevel:'silent'});
const module={exports:{}};
new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {Chat,ComposerControls}=module.exports;
const originalFetch=globalThis.fetch;
const nodes=node=>Array.isArray(node)?node.flatMap(nodes):!node||typeof node!=='object'?[]:[node,...nodes(node.props?.children)];
const response=data=>({ok:true,json:async()=>data});
const model={provider:'uiqa-local-20261012',model:'fixture',thinking:'off'};
const session={id:'s',projectId:'p',version:1,role:'coordinator',state:'idle',model,title:'QA'};
const attachment=id=>({documentVersionId:id,artifactId:id+'-artifact',digest:'a'.repeat(64),title:id+'.txt',mediaType:'text/plain',size:265});
const types={model,types:[{mediaType:'text/plain',extensions:['.txt'],maxBytes:33554432,native:false},{mediaType:'text/markdown',extensions:['.md'],maxBytes:33554432,native:false}],fileCapabilityReason:'TXT/MD only'};
const file=(name,size=27)=>({name,size,arrayBuffer:async()=>new TextEncoder().encode('public fixture').buffer});
const failure={ok:false,status:503,json:async()=>({error:{code:'QA_SEND_FAILED',message:'unconfirmed send'}})};
const deferred=()=>{let resolve;return {promise:new Promise(done=>resolve=done),resolve:value=>resolve(value)};};

function harness(t,send=async body=>response(receipt(body))){
 const requests=[],failures=[],confirmed=[];
 globalThis.fetch=async(url,init)=>{
  const body=init.body?JSON.parse(init.body):undefined;requests.push({url,body,key:init.headers?.['Idempotency-Key']});
  if(url.endsWith('/messages'))return send(body);
  if(url.endsWith('/attachment-types'))return response(types);
  if(url.endsWith('/attachments'))return response({id:'new',title:body.title,original:{artifactId:'new-artifact',digest:'b'.repeat(64),size:265,mediaType:'text/plain'}});
  throw Error('unexpected mocked request: '+url);
 };
 const chat=synchronousState(new Chat({data:{project:{id:'p',archived:false,settings:{enabled:false}},teams:[],wakeups:[],approvals:[]},boot:{runtime:{ready:true},models:[model]},session,messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,stream:'',busy:false,perform:async fn=>{try{return await fn();}catch(error){failures.push(error.message);}},onMessageConfirmed:row=>confirmed.push(row),onHistory(){},onToggle(){},onSession(){},onExperiment(){},onRun(){}}));
 chat.state.draft='UIQA upload';chat.state.attachments=[attachment('original')];
 let controls,key;
 const connect=()=>{
  const element=nodes(chat.render()).find(node=>node.type===ComposerControls);
  if(!controls||key!==element.key){controls?.componentWillUnmount();controls=synchronousState(new ComposerControls(element.props));controls.state.attachmentTypes=types;key=element.key;}
  else controls.props=element.props;
  if(element.props.ref)element.props.ref.current=controls;
 };
 connect();const update=chat.setState;chat.setState=(value,callback)=>update(value,()=>{connect();callback?.();});
 t.after(()=>{chat.componentWillUnmount();controls.componentWillUnmount();globalThis.fetch=originalFetch;});
 return {chat,get controls(){return controls;},requests,failures,confirmed,connect,send:()=>chat.submit({preventDefault(){}}),reject:()=>controls.addFiles([file('unsupported.pdf')])};
}
function receipt(body){return {id:'sent',projectId:'p',sessionId:'s',version:1,role:'user',status:'queued',content:body.content,mode:body.mode,attachments:[attachment('original')]};}
function uploadAlert(view){return nodes(view.render()).find(node=>node.props?.role==='alert'&&node.props?.className==='error-text composer-control-error');}

test('confirmed TXT send consumes the old PDF rejection without refresh',async t=>{
 const h=harness(t);await h.reject();assert.ok(uploadAlert(h.controls));
 await h.send();assert.equal(h.controls.state.uploadError,'');assert.equal(uploadAlert(h.controls),undefined);
 assert.equal(h.chat.state.draft,'');assert.deepEqual(h.chat.state.attachments,[]);assert.equal(h.confirmed.length,1);
 assert.deepEqual(h.requests.filter(row=>row.url.endsWith('/messages'))[0].body,{content:'UIQA upload',mode:'prompt',attachmentDocumentIds:['original']});
 assert.deepEqual(h.confirmed[0].attachments,[attachment('original')]);
});

test('type, empty, size, count and native-byte rejections preserve draft and attachments',async t=>{
 for(const bad of [file('unsupported.pdf'),file('unsupported.bin'),file('empty.txt',0),file('large.txt',33554433)]){
  const h=harness(t);await h.controls.addFiles([bad]);assert.match(h.controls.state.uploadError,/文件类型或大小/);assert.ok(uploadAlert(h.controls));
  assert.equal(h.chat.state.draft,'UIQA upload');assert.deepEqual(h.chat.state.attachments,[attachment('original')]);assert.equal(h.requests.length,0);
 }
 const h=harness(t);await h.controls.addFiles(Array.from({length:5},()=>file('valid.txt')));assert.match(h.controls.state.uploadError,/最多附加 5/);assert.deepEqual(h.chat.state.attachments,[attachment('original')]);
 h.controls.state.attachmentTypes={...types,types:[...types.types,{mediaType:'application/pdf',extensions:['.pdf'],maxBytes:20971520,native:true}]};
 await h.controls.addFiles([file('first.pdf',11000000),file('second.pdf',11000000)]);assert.match(h.controls.state.uploadError,/合计最多20 MiB/);assert.deepEqual(h.chat.state.attachments,[attachment('original')]);assert.equal(h.requests.length,0);
});

test('failed or mismatched send keeps draft, attachments and upload diagnostics',async t=>{
 for(const send of [async()=>failure,async body=>response({...receipt(body),sessionId:'wrong'})]){
  const h=harness(t,send);await h.reject();const error=h.controls.state.uploadError;await h.send();
  assert.equal(h.controls.state.uploadError,error);assert.equal(h.chat.state.draft,'UIQA upload');assert.deepEqual(h.chat.state.attachments,[attachment('original')]);assert.equal(h.confirmed.length,0);assert.equal(h.failures.length,1);
 }
});

test('same-text new upload rejection is not consumed by an earlier send receipt',async t=>{
 const pending=deferred(),h=harness(t,()=>pending.promise);await h.reject();const error=h.controls.state.uploadError;
 const sending=h.send();await h.reject();assert.equal(h.controls.state.uploadError,error);
 pending.resolve(response(receipt({content:'UIQA upload',mode:'prompt'})));await sending;
 assert.equal(h.controls.state.uploadError,error);assert.ok(uploadAlert(h.controls));assert.deepEqual(h.chat.state.attachments,[]);
});

test('an idempotent retry preserves a same-text error created after the unknown first send',async t=>{
 let count=0;const h=harness(t,async body=>++count===1?failure:response(receipt(body)));
 await h.reject();await h.send();const error=h.controls.state.uploadError;await h.reject();await h.send();
 const posts=h.requests.filter(row=>row.url.endsWith('/messages'));assert.equal(posts.length,2);assert.equal(posts[0].key,posts[1].key);
 assert.equal(h.controls.state.uploadError,error);assert.ok(uploadAlert(h.controls));assert.equal(h.confirmed.length,1);assert.deepEqual(h.chat.state.attachments,[]);
});

test('a new text draft survives while the consumed old upload error clears',async t=>{
 const pending=deferred(),h=harness(t,()=>pending.promise);await h.reject();const sending=h.send();
 h.chat.setState({draft:'new text',draftVersion:1});pending.resolve(response(receipt({content:'UIQA upload',mode:'prompt'})));await sending;
 assert.equal(h.chat.state.draft,'new text');assert.equal(h.controls.state.uploadError,'');assert.deepEqual(h.chat.state.attachments,[]);
});

test('new attachment upload and its later failure survive a delayed send',async t=>{
 const pending=deferred(),h=harness(t,()=>pending.promise);await h.reject();const sending=h.send();
 await h.controls.addFiles([file('new.txt',265)]);assert.deepEqual(h.chat.state.attachments.map(row=>row.documentVersionId),['original','new']);
 await h.reject();const error=h.controls.state.uploadError;pending.resolve(response(receipt({content:'UIQA upload',mode:'prompt'})));await sending;
 assert.deepEqual(h.chat.state.attachments.map(row=>row.documentVersionId),['new']);assert.equal(h.controls.state.uploadError,error);
});

test('a new in-flight upload failure is retained after the old send succeeds',async t=>{
 const send=deferred(),upload=deferred(),h=harness(t,()=>send.promise);await h.reject();const sending=h.send();
 const fetch=globalThis.fetch;globalThis.fetch=(url,init)=>url.endsWith('/attachments')?upload.promise:fetch(url,init);
 const uploading=h.controls.addFiles([file('new.txt',265)]);await new Promise(resolve=>setImmediate(resolve));assert.equal(h.controls.state.uploading,true);
 send.resolve(response(receipt({content:'UIQA upload',mode:'prompt'})));await sending;upload.resolve(failure);await uploading;
 assert.equal(h.controls.state.uploadError,'unconfirmed send');assert.ok(uploadAlert(h.controls));assert.deepEqual(h.chat.state.attachments,[]);
});

test('a same-text capability failure arriving after send capture is retained',async t=>{
 const send=deferred(),capability=deferred(),h=harness(t,()=>send.promise);
 const fetch=globalThis.fetch;globalThis.fetch=(url,init)=>url.endsWith('/attachment-types')?capability.promise:fetch(url,init);
 const loading=h.controls.loadAttachmentTypes();h.controls.state.uploadError='unconfirmed send';const sending=h.send();
 capability.resolve(failure);await loading;send.resolve(response(receipt({content:'UIQA upload',mode:'prompt'})));await sending;
 assert.equal(h.controls.state.uploadError,'unconfirmed send');assert.ok(uploadAlert(h.controls));
});

test('session, model and unmount changes invalidate an old send error snapshot',async t=>{
 for(const change of ['session','model','unmount']){
  const pending=deferred(),h=harness(t,()=>pending.promise);await h.reject();const old=h.controls,sending=h.send();
  if(change==='session'){h.chat.props={...h.chat.props,session:{...session,id:'other'}};h.connect();await h.reject();}
  else if(change==='model'){h.chat.props={...h.chat.props,session:{...session,model:{...model,model:'other'}}};h.connect();}
  else {old.componentWillUnmount();h.chat.componentWillUnmount();}
  const error=h.controls.state.uploadError;pending.resolve(response(receipt({content:'UIQA upload',mode:'prompt'})));await sending;
  assert.equal(h.controls.state.uploadError,error,change);
 }
});
