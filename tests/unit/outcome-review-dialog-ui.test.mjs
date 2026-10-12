import test from 'node:test';
import assert from 'node:assert/strict';
import {OutcomeReview} from '../../dist/web/assets/workbench.js';
import {synchronousState} from '../support/ui.mjs';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children??node.children)];
const run=(extra={})=>({id:'r',projectId:'p',experimentId:'e',version:1,state:'failed',answerDisposition:'needs_review',...extra});
const modal=view=>elements(view.render()).find(node=>node.type?.name==='Modal');
const input=view=>elements(modal(view)).find(node=>node.type==='textarea');
const fill=(view,value)=>input(view).props.onChange({target:{value}});
const submit=view=>{modal(view).props.onSubmit(new FormData());return view.lastSave;};
const response=()=>({ok:true,json:async()=>run({version:2,answerDisposition:'unanswered'})});
// React renders new props before didUpdate; setState inside didUpdate commits a second render.
const update=(view,props)=>{const previous=view.props;view.props=props;view.committed=view.render();view.componentDidUpdate?.(previous);};
const fixtures=new WeakSet();
function fixture(t,perform=async fn=>fn()){
 if(!fixtures.has(t)){fixtures.add(t);const previous={document:globalThis.document,prompt:globalThis.prompt};t.after(()=>Object.assign(globalThis,previous));}
 globalThis.document={body:{nodeType:1}};globalThis.prompt=()=>{throw Error('native prompt must not open');};
 const view=synchronousState(new OutcomeReview({run:run(),perform})),save=view.save.bind(view),setState=view.setState;view.setState=(...args)=>{setState(...args);view.committed=view.render();};view.save=(...args)=>view.lastSave=save(...args);t.after(()=>view.componentWillUnmount());return view;
}

test('review rejects excessive reasons, keeps cancelled callbacks inert and does not report a skipped perform as saved',async t=>{
 const view=fixture(t);let writes=0;t.mock.method(globalThis,'fetch',async()=>{writes++;return response();});
 view.open('unanswered');fill(view,'x'.repeat(4001));await submit(view);assert.equal(writes,0);assert.ok(modal(view).props.submitDisabled);assert.ok(view.state.error);
 const old=modal(view);old.props.onClose();view.open('answered');fill(view,'New reason');await old.props.onSubmit(new FormData());old.props.onClose();assert.equal(writes,0);assert.equal(view.state.reason,'New reason');assert.ok(modal(view));
 view.props={...view.props,perform:async()=>undefined};await submit(view);assert.ok(modal(view));assert.equal(view.state.reason,'New reason');assert.equal(view.state.saving,false);assert.ok(view.state.error);assert.equal(writes,0);
});

test('queued review callbacks recheck every frozen target field, eligibility, ABA and unmount before POST',async t=>{
 for(const kind of ['id','version','projectId','experimentId','state','disposition','archive','roundtrip','unmount']){
  let callback,writes=0;const view=fixture(t,fn=>new Promise(resolve=>{callback=()=>resolve(fn());}));t.mock.method(globalThis,'fetch',async()=>{writes++;return response();});
  view.open('unanswered');fill(view,'Original reason');const pending=submit(view),original=view.props;
  const changed=kind==='archive'?{...original,readOnly:true}:{...original,run:run(kind==='disposition'?{answerDisposition:'unanswered'}:kind==='state'?{state:'running'}:kind==='version'?{version:2}:kind==='roundtrip'?{id:'other'}:{[kind]:'other'})};
  if(kind==='unmount')view.componentWillUnmount();else{update(view,changed);if(kind==='roundtrip')update(view,original);}
  callback();await pending;assert.equal(writes,0,kind);assert.equal(view.state.reason,'Original reason',kind);if(kind!=='unmount'){assert.ok(modal(view),kind);assert.ok(modal(view).props.submitDisabled,kind);assert.ok(view.state.error,kind);}
 }
});

test('late review success and failure preserve a switched or reopened reason and leave unmounted state untouched',async t=>{
 for(const result of ['success','failure'])for(const kind of ['switch','roundtrip','unmount']){
  const view=fixture(t);let finish,fail;t.mock.method(globalThis,'fetch',()=>new Promise((resolve,reject)=>{finish=resolve;fail=reject;}));
  view.open('unanswered');fill(view,'Old reason');const pending=submit(view),original=view.props;
  if(kind==='unmount')view.componentWillUnmount();else{update(view,{...original,run:run({id:'other'})});if(kind==='roundtrip')update(view,original);modal(view).props.onClose();view.open('answered');fill(view,'New reason');}
  const before={...view.state};if(result==='success')finish(response());else fail(Error('old failure'));await pending;
  assert.deepEqual(view.state,before,result+' '+kind);
 }
});

test('known terminal state, disposition, archive or target changes invalidate old opens and preserve the draft until cancellation',async t=>{
 for(const change of [{state:'running'},{state:'succeeded'},{answerDisposition:'answered'},{projectId:'other'},{experimentId:'other'}]){
  const view=fixture(t);view.open('unanswered');fill(view,'Keep reason');const old=modal(view);update(view,{...view.props,run:run(change)});
  await old.props.onSubmit(new FormData());assert.equal(view.state.reason,'Keep reason');assert.ok(modal(view).props.submitDisabled);assert.ok(view.state.error);modal(view).props.onClose();
  view.open('answered');assert.equal(!!modal(view),['succeeded','failed','cancelled'].includes(view.props.run.state)&&view.props.run.answerDisposition==='needs_review');
 }
 for(const change of [{state:'running'},{answerDisposition:'answered'},{answerDisposition:'unanswered'},{metrics:{score:1}},{metrics:{score:1},answerDisposition:'unanswered'},{state:'cancelled',answerDisposition:undefined}]){const view=fixture(t);view.props={...view.props,run:run(change)};view.open('unanswered');assert.equal(modal(view),undefined);}
 const empty=fixture(t);empty.props={...empty.props,run:run({answerDisposition:undefined,metrics:{}})};empty.open('unanswered');assert.ok(modal(empty));
 const disposed=fixture(t);disposed.componentWillUnmount();disposed.open('unanswered');assert.equal(modal(disposed),undefined);
});

test('review portal isolates form and keys, retains textarea newlines, and visibly locks all close paths during one POST',async t=>{
 const view=fixture(t);let finish,writes=0;t.mock.method(globalThis,'fetch',()=>{writes++;return new Promise(resolve=>finish=resolve);});view.open('unanswered');fill(view,'Reason\nwith newline');
 const portal=elements(view.render()).find(node=>node.$$typeof===Symbol.for('react.portal'));assert.equal(portal.containerInfo,document.body);let stopped=0;portal.children.props.onSubmit({stopPropagation(){stopped++;}});portal.children.props.onKeyDown({key:'Enter',stopPropagation(){stopped++;}});assert.equal(stopped,2);assert.equal(input(view).props.onKeyDown,undefined);assert.equal(view.state.reason,'Reason\nwith newline');
 const pending=submit(view);await submit(view);const element=modal(view);assert.equal(element.props.closeDisabled,true);assert.equal(input(view).props.disabled,true);const shared=new element.type(element.props),tree=shared.render();
 const section=elements(tree).find(node=>node.type==='section'),cancel=elements(tree).find(node=>node.type==='button'&&node.props.className==='secondary'),close=elements(tree).find(node=>node.props?.['aria-label']==='关闭对话框');assert.equal(cancel.props.disabled,true);assert.equal(close.props.disabled,true);
 cancel.props.onClick();close.props.onClick();section.props.onKeyDown({key:'Escape',target:{closest(){return null;}}});const backdrop={};tree.props.onMouseDown({target:backdrop,currentTarget:backdrop});assert.ok(modal(view));assert.equal(writes,1);finish(response());await pending;assert.equal(modal(view),undefined);
});

test('all idle close paths preserve the Run and return focus without writes',t=>{
 const view=fixture(t),original=structuredClone(view.props.run);let writes=0,returned=0;t.mock.method(globalThis,'fetch',async()=>{writes++;return response();});
 for(const kind of ['cancel','close','escape','backdrop']){
  view.open('unanswered');fill(view,'Discard draft');const element=modal(view),shared=new element.type(element.props),tree=shared.render(),section=elements(tree).find(node=>node.type==='section');document.activeElement={focus(){returned++;}};shared.componentDidMount();
  if(kind==='cancel')elements(tree).find(node=>node.type==='button'&&node.props.className==='secondary').props.onClick();
  if(kind==='close')elements(tree).find(node=>node.props?.['aria-label']==='关闭对话框').props.onClick();
  if(kind==='escape')section.props.onKeyDown({key:'Escape',target:{closest(){return null;}}});
  if(kind==='backdrop'){const backdrop={};tree.props.onMouseDown({target:backdrop,currentTarget:backdrop});}
  shared.componentWillUnmount();assert.equal(modal(view),undefined,kind);assert.equal(view.state.reason,'');assert.deepEqual(view.props.run,original);
 }
 assert.equal(writes,0);assert.equal(returned,4);
});

test('old opener, submit, close and reason handlers cannot affect a new or ABA context',async t=>{
 const view=fixture(t);let writes=0;t.mock.method(globalThis,'fetch',async()=>{writes++;return response();});
 const opener=elements(view.render()).find(node=>node.type==='button'),original=view.props;update(view,{...original,run:run({id:'other'})});update(view,original);opener.props.onClick();assert.equal(modal(view),undefined);
 view.open('unanswered');const old=modal(view),oldInput=input(view);old.props.onClose();view.open('answered');fill(view,'Keep new reason');oldInput.props.onChange({target:{value:'Old input'}});old.props.onClose();await old.props.onSubmit(new FormData());assert.equal(view.state.reason,'Keep new reason');assert.equal(view.state.target.disposition,'answered');assert.equal(writes,0);
});

test('409 and network failures preserve reasons and retry only the frozen version',async t=>{
 for(const conflict of [true,false]){
  const view=fixture(t),requests=[];t.mock.method(globalThis,'fetch',async(_url,options)=>{requests.push(JSON.parse(options.body));if(requests.length===1){if(!conflict)throw Error('network unavailable');return {ok:false,status:409,json:async()=>({error:{code:'VERSION_CONFLICT',message:'Version conflict'}})};}return response();});
  view.open('unanswered');fill(view,'  First\nreason  ');await submit(view);assert.equal(view.state.reason,'  First\nreason  ');assert.ok(view.state.error);assert.equal(view.state.saving,false);assert.equal(modal(view).props.closeDisabled,false);await submit(view);assert.deepEqual(requests,[{expectedVersion:1,disposition:'unanswered',reason:'First\nreason'},{expectedVersion:1,disposition:'unanswered',reason:'First\nreason'}]);assert.equal(modal(view),undefined);
 }
});

test('an old completion cannot unlock or close a new pending review',async t=>{
 const view=fixture(t),finishes=[];t.mock.method(globalThis,'fetch',()=>new Promise(resolve=>finishes.push(resolve)));
 view.open('unanswered');fill(view,'Old request');const old=submit(view);update(view,{...view.props,run:run({id:'other'})});modal(view).props.onClose();view.open('answered');fill(view,'New request');const current=submit(view);
 finishes[0](response());await old;assert.equal(view.state.reason,'New request');assert.equal(view.state.saving,true);assert.equal(modal(view).props.closeDisabled,true);modal(view).props.onClose();await submit(view);assert.equal(finishes.length,2);assert.ok(modal(view));finishes[1](response());await current;assert.equal(modal(view),undefined);
});

for(const kind of ['terminal-transition','idle-version-update','read-only-to-writable'])test('newly committed opener is usable after '+kind,t=>{
 const view=fixture(t);view.props={...view.props,run:run(kind==='terminal-transition'?{state:'running'}:{}),readOnly:kind==='read-only-to-writable'};
 const old=elements(view.render()).find(node=>node.type==='button');update(view,{...view.props,run:run(kind==='idle-version-update'?{version:2}:{}),readOnly:false});
 const current=elements(view.committed).find(node=>node.type==='button');old?.props.onClick();assert.equal(modal(view),undefined,'old opener stays invalid');current.props.onClick();assert.ok(modal(view),'current committed opener works immediately');
});
