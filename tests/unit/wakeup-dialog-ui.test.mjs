import test from 'node:test';
import assert from 'node:assert/strict';
import {WakeupPanel} from '../../dist/web/assets/campaigns.js';
import {synchronousState} from '../support/ui.mjs';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children??node.children)];
const text=node=>Array.isArray(node)?node.map(text).join(' '):!node||typeof node==='boolean'?'':typeof node==='object'?text(node.props?.children??node.children):String(node);
const wakeup=(extra={})=>({id:'w',version:4,projectId:'p',rootSessionId:'s',sourceKind:'campaign-result',sourceId:'result',sourceDigest:'digest',ownerId:'c',state:'failed',attempts:1,maxAttempts:3,queueGeneration:2,automatic:true,requested:true,error:'previous failure',...extra});
const response=row=>({ok:true,json:async()=>row});
const dialog=view=>elements(view.render()).find(node=>node.type?.name==='Modal');
const open=(view,trigger)=>elements(view.render()).find(node=>node.type==='button'&&text(node)==='显式重试').props.onClick({currentTarget:trigger});
const submit=view=>dialog(view).props.onSubmit(new FormData());
const update=(view,props)=>{const previous=view.props;view.props=props;view.componentDidUpdate(previous);};
function fixture(t){
 const previous={fetch:globalThis.fetch,confirm:globalThis.confirm,document:globalThis.document};globalThis.document={body:{nodeType:1}};globalThis.confirm=()=>{throw Error('native confirm must not open');};t.after(()=>Object.assign(globalThis,previous));
 const view=synchronousState(new WakeupPanel({data:{project:{id:'p',archived:false},wakeups:[wakeup()],budgets:[{campaignId:'c',used:1,reserved:0,unknown:1,available:2}]},busy:false,sessionId:'s',onSession(){},perform:fn=>fn()}));t.after(()=>view.componentWillUnmount());return view;
}

test('retry shows a frozen record and original warning, posts once and waits for refresh before closing',async t=>{
 const view=fixture(t),requests=[];let finish,release;globalThis.fetch=(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return new Promise(resolve=>finish=resolve);};
 view.props={...view.props,perform:async fn=>{update(view,{...view.props,busy:true});const row=await fn();update(view,{...view.props,data:{...view.props.data,wakeups:[row]}});await new Promise(resolve=>release=resolve);return row;}};
 open(view);assert.match(text(dialog(view)),/w/);assert.match(text(dialog(view)),/1\s*\/\s*3/);assert.match(dialog(view).props.description,/将增加一次模型尝试；之前未知的用量不会自动释放/);
 const pending=submit(view),duplicate=submit(view);assert.deepEqual(requests,[{url:'/api/wakeups/w/retry',body:{}}]);assert.equal(dialog(view).props.closeDisabled,true);dialog(view).props.onClose();assert.ok(dialog(view));
 finish(response(wakeup({version:5,state:'pending'})));await new Promise(resolve=>setImmediate(resolve));assert.ok(dialog(view));release();await Promise.all([pending,duplicate]);assert.ok(dialog(view),'busy=false has not committed');update(view,{...view.props,busy:false});assert.equal(dialog(view),undefined);
});

test('cancel, X, Escape and backdrop do not write, restore focus and cannot revive cancelled callbacks',async t=>{
 const view=fixture(t);let writes=0,returned=0;globalThis.fetch=async()=>{writes++;return response(wakeup());};
 for(const kind of ['cancel','close','escape','backdrop']){
  open(view);const stale=dialog(view),modal=new stale.type(stale.props);document.activeElement={focus(){returned++;}};modal.componentDidMount();const tree=modal.render();
  if(kind==='cancel')elements(tree).find(node=>node.type==='button'&&node.props.className==='secondary').props.onClick();
  if(kind==='close')elements(tree).find(node=>node.props?.['aria-label']==='关闭对话框').props.onClick();
  if(kind==='escape')elements(tree).find(node=>node.type==='section').props.onKeyDown({key:'Escape',target:{closest(){return null;}}});
  if(kind==='backdrop'){const target={};tree.props.onMouseDown({target,currentTarget:target});}
  assert.equal(dialog(view),undefined,kind);modal.componentWillUnmount();open(view);await stale.props.onSubmit(new FormData());stale.props.onClose();assert.ok(dialog(view),'stale close must not cancel a reopened window');assert.equal(writes,0,kind);dialog(view).props.onClose();
 }assert.equal(returned,4);
});

test('failed retry preserves its frozen attempt and permits explicit retry without releasing unknown usage',async t=>{
 const view=fixture(t);let count=0;globalThis.fetch=async()=>{if(++count===1)throw Error('network failed');return response(wakeup({version:5,state:'pending'}));};open(view);await submit(view);
 assert.match(text(dialog(view)),/network failed/);assert.match(text(dialog(view)),/可再次确认重试/);assert.match(text(dialog(view)),/1\s*\/\s*3/);assert.equal(dialog(view).props.busy,false);assert.equal(view.props.data.budgets[0].unknown,1);await submit(view);assert.equal(count,2);assert.equal(dialog(view),undefined);
});

test('a skipped perform reports no submission and allows explicit retry or cancel without changing history or unknown usage',async t=>{
 for(const outcome of ['retry','cancel']){
  const view=fixture(t),original=view.props.data;let writes=0;globalThis.fetch=async()=>{writes++;return response(wakeup({version:5,state:'pending'}));};
  view.props={...view.props,perform:async()=>{}};open(view);await submit(view);
  assert.match(text(dialog(view)),/未提交，请稍后重试/);assert.equal(writes,0);assert.equal(dialog(view).props.busy,false);assert.equal(dialog(view).props.closeDisabled,false);assert.equal(dialog(view).props.submitDisabled,false);assert.equal(view.pending,false);assert.equal(view.request,undefined);assert.equal(view.props.data,original);assert.equal(original.budgets[0].unknown,1);assert.equal(original.wakeups[0].attempts,1);assert.equal(original.wakeups[0].error,'previous failure');
  if(outcome==='cancel'){const stale=dialog(view);stale.props.onClose();await stale.props.onSubmit(new FormData());assert.equal(writes,0);}
  else{view.props={...view.props,perform:fn=>fn()};await submit(view);assert.equal(writes,1);}
  assert.equal(dialog(view),undefined,outcome);
 }
});

test('a skipped perform cannot replace an invalidation error after record changes, selection ABA or unmount',async t=>{
 for(const scope of ['version','roundtrip','unmount']){
  const view=fixture(t);let release,writes=0;globalThis.fetch=async()=>{writes++;return response(wakeup());};view.props={...view.props,perform:()=>new Promise(resolve=>release=resolve)};open(view);const pending=submit(view),original=view.props;
  if(scope==='unmount')view.componentWillUnmount();else if(scope==='version')update(view,{...original,data:{...original.data,wakeups:[wakeup({version:5})]}});else{update(view,{...original,sessionId:'other'});update(view,original);}
  const invalidation=view.state.error;release();await pending;assert.equal(writes,0,scope);assert.equal(view.state.error,invalidation,scope);assert.doesNotMatch(view.state.error,/未提交/);
  if(scope!=='unmount'){assert.match(text(dialog(view)),/已变化/);assert.equal(dialog(view).props.closeDisabled,false);assert.equal(dialog(view).props.submitDisabled,true);dialog(view).props.onClose();assert.equal(dialog(view),undefined);}
 }
});

test('server source and never-started or attempt limits stay authoritative and visible in the dialog',async t=>{
 for(const [code,message] of [['WAKEUP_STALE','来源已失效'],['WAKEUP_NOT_RETRYABLE','只有确认未启动且用量结算为 0 时才能恢复'],['BUDGET_EXHAUSTED','尝试额度不足']]){
  const view=fixture(t),original=view.props.data;globalThis.fetch=async()=>({ok:false,status:409,json:async()=>({error:{code,message}})});open(view);await submit(view);assert.match(text(dialog(view)),new RegExp(message));assert.equal(dialog(view).props.busy,false);assert.equal(view.props.data,original);assert.equal(original.budgets[0].unknown,1);assert.equal(original.wakeups[0].attempts,1);
 }
});

test('page-known record, permission and selection changes invalidate a frozen retry including ABA',async t=>{
 for(const kind of ['version','projectId','rootSessionId','attempts','sourceDigest','maxAttempts','state','project','archive','selection','roundtrip','missing']){
  const view=fixture(t);let writes=0;globalThis.fetch=async()=>{writes++;return response(wakeup());};open(view);const stale=dialog(view),original=view.props;
  const changed=kind==='project'?{...original,data:{...original.data,project:{id:'other'}}}:kind==='archive'?{...original,data:{...original.data,project:{id:'p',archived:true}}}:['selection','roundtrip'].includes(kind)?{...original,sessionId:'other'}:{...original,data:{...original.data,wakeups:kind==='missing'?[]:[wakeup({[kind]:kind==='version'?5:kind==='attempts'?2:kind==='maxAttempts'?4:kind==='state'?'cancelled':'other'})]}};
  update(view,changed);if(kind==='roundtrip')update(view,original);await stale.props.onSubmit(new FormData());assert.equal(writes,0,kind);assert.ok(dialog(view).props.submitDisabled,kind);assert.match(text(dialog(view)),/已变化/);
 }
});

test('queued perform rechecks the page-known target immediately before POST and unmount blocks stale confirmation',async t=>{
 for(const scope of ['version','roundtrip','unmount']){
  const view=fixture(t);let callback,writes=0;globalThis.fetch=async()=>{writes++;return response(wakeup());};view.props={...view.props,perform:fn=>new Promise(resolve=>callback=()=>resolve(fn()))};open(view);const pending=submit(view),original=view.props;
  if(scope==='unmount')view.componentWillUnmount();else{update(view,scope==='version'?{...original,data:{...original.data,wakeups:[wakeup({version:5})]}}:{...original,sessionId:'other'});if(scope==='roundtrip')update(view,original);}
  callback();await pending;assert.equal(writes,0,scope);
 }
});

test('late retry success and failure cannot close or replace an invalidated, reopened or unmounted dialog',async t=>{
 for(const outcome of ['success','failure'])for(const scope of ['selection','roundtrip','unmount']){
  const view=fixture(t);let finish,fail;globalThis.fetch=()=>new Promise((resolve,reject)=>{finish=resolve;fail=reject;});open(view);const pending=submit(view),original=view.props;
  if(scope==='unmount')view.componentWillUnmount();else{update(view,{...original,sessionId:'other'});if(scope==='roundtrip')update(view,original);}
  if(outcome==='success')finish(response(wakeup({version:5,state:'pending'})));else fail(Error('late failure'));await pending;
  if(scope!=='unmount'){assert.ok(dialog(view));assert.match(text(dialog(view)),/已变化/);assert.doesNotMatch(text(dialog(view)),/late failure/);dialog(view).props.onClose();update(view,original);open(view);assert.doesNotMatch(text(dialog(view)),/late failure|已变化/);}
 }
});

test('portal isolates Chat form and drawer events while existing filter, history and session action remain',t=>{
 const view=fixture(t);let selected;view.props={...view.props,sessionId:undefined,onSession:id=>selected=id,data:{...view.props.data,wakeups:[wakeup(),wakeup({id:'done',state:'completed',error:undefined}),wakeup({id:'foreign',rootSessionId:'other'})]}};
 elements(view.render()).find(node=>node.type==='button'&&text(node)==='查看主会话').props.onClick();assert.equal(selected,'s');assert.match(text(view.render()),/已结束的结果通知（/);open(view);
 const portal=elements(view.render()).find(node=>node.$$typeof===Symbol.for('react.portal'));assert.equal(portal.containerInfo,document.body);let stopped=0;portal.children.props.onSubmit({stopPropagation(){stopped++;}});portal.children.props.onKeyDown({stopPropagation(){stopped++;}});assert.equal(stopped,2);
 update(view,{...view.props,sessionId:'s'});assert.doesNotMatch(text(view.render()),/foreign/);
});

test('eligibility stays limited to failed/cancelled records with attempts remaining and active project',t=>{
 const view=fixture(t);for(const extra of [{state:'pending'},{state:'running'},{state:'superseded'},{attempts:3}]){update(view,{...view.props,data:{...view.props.data,wakeups:[wakeup(extra)]}});assert.ok(!elements(view.render()).some(node=>node.type==='button'&&text(node)==='显式重试'));}
 update(view,{...view.props,data:{...view.props.data,project:{id:'p',archived:true},wakeups:[wakeup()]}});const button=elements(view.render()).find(node=>node.type==='button'&&text(node)==='显式重试');assert.equal(button.props.disabled,true);button.props.onClick({});assert.equal(dialog(view),undefined);
});

test('successful retry focuses its panel if refresh removes its opener',async t=>{
 const view=fixture(t);let focused=0;const trigger={isConnected:true};view.panel.current={focus(){focused++;}};globalThis.document.activeElement=document.body;
 view.props={...view.props,perform:async fn=>{update(view,{...view.props,busy:true});const row=await fn();trigger.isConnected=false;update(view,{...view.props,data:{...view.props.data,wakeups:[row]}});return row;}};globalThis.fetch=async()=>response(wakeup({version:5,state:'pending'}));open(view,trigger);await submit(view);assert.ok(dialog(view));update(view,{...view.props,busy:false});assert.equal(dialog(view),undefined);assert.equal(focused,1);
});

test('a verified retry receipt accepts only that dispatch attempt during later refreshes',async t=>{
 for(const kind of ['pending','queued','running','completed','failed','foreign-source','second-attempt','wrong-generation','selection-ABA','pre-receipt']){
  const view=fixture(t);let release,writes=0;globalThis.fetch=async()=>{writes++;return response(wakeup({version:5,state:'pending'}));};
  view.props={...view.props,perform:async fn=>{
   update(view,{...view.props,busy:true});const original=view.props;
   if(kind==='pre-receipt')update(view,{...original,data:{...original.data,wakeups:[wakeup({version:6,state:'queued',attempts:2,queueGeneration:3})]}});
   const row=await fn();let next=kind==='pending'?{...row,version:6,blockReason:'Pi 未就绪'}:wakeup({version:7,state:['queued','running','completed','failed'].includes(kind)?kind:'running',attempts:kind==='second-attempt'?3:2,queueGeneration:kind==='wrong-generation'?4:kind==='second-attempt'?4:3,...(kind==='foreign-source'?{sourceDigest:'other'}:{})});
   if(kind==='selection-ABA'){update(view,{...original,sessionId:'other'});update(view,original);}
   update(view,{...view.props,data:{...view.props.data,wakeups:[next]}});await new Promise(resolve=>release=resolve);return row;
  }};
  open(view);const pending=submit(view);await new Promise(resolve=>setImmediate(resolve));release();await pending;update(view,{...view.props,busy:false});
  if(['pending','queued','running','completed','failed'].includes(kind)){assert.equal(dialog(view),undefined,kind);assert.equal(writes,1,kind);}else{assert.ok(dialog(view),kind);assert.match(text(dialog(view)),/已变化/,kind);assert.equal(writes,kind==='pre-receipt'?0:1,kind);}
 }
});

test('foreign or malformed retry receipts do not complete a frozen confirmation',async t=>{
 for(const extra of [{id:'other'},{projectId:'other'},{rootSessionId:'other'},{sourceDigest:'other'},{attempts:2},{queueGeneration:3},{version:4},{state:'failed'},{requested:false}]){
  const view=fixture(t);globalThis.fetch=async()=>response(wakeup({version:5,state:'pending',...extra}));open(view);await submit(view);assert.ok(dialog(view));assert.match(text(dialog(view)),/回执与固定唤醒记录不一致/);assert.equal(dialog(view).props.busy,false);
 }
});

test('an SSE refresh ahead of the HTTP receipt stays pending until the same attempt receipt is verified',async t=>{
 for(const kind of ['pending','queued','running','second-attempt','foreign-source','wrong-generation','roundtrip','failure','newer-receipt']){
  const view=fixture(t);let finish,fail,writes=0;globalThis.fetch=()=>{writes++;return new Promise((resolve,reject)=>{finish=resolve;fail=reject;});};
  open(view);const pending=submit(view),original=view.props;
  const row=kind==='pending'?wakeup({version:5,state:'pending'}):wakeup({version:6,state:kind==='running'?'running':'queued',attempts:kind==='second-attempt'?3:2,queueGeneration:kind==='wrong-generation'?4:kind==='second-attempt'?4:3,...(kind==='foreign-source'?{sourceDigest:'other'}:{})});
  update(view,{...original,data:{...original.data,wakeups:[row]}});
  if(kind==='roundtrip'){update(view,{...view.props,sessionId:'other'});update(view,{...view.props,sessionId:'s'});}
  assert.equal(dialog(view).props.closeDisabled,true);assert.equal(writes,1);
  if(['pending','queued','running','failure','newer-receipt'].includes(kind))assert.doesNotMatch(text(dialog(view)),/已变化/,'a provisional same attempt waits for its receipt');
  if(kind==='failure')fail(Error('HTTP receipt lost'));else finish(response(wakeup({version:kind==='newer-receipt'?7:5,state:'pending'})));await pending;
  if(['pending','queued','running'].includes(kind))assert.equal(dialog(view),undefined,kind);
  else{assert.ok(dialog(view),kind);assert.match(text(dialog(view)),/已变化/);assert.equal(dialog(view).props.closeDisabled,false);assert.equal(dialog(view).props.submitDisabled,true);}
 }
});

for(const scope of ['sourceDigest','archive','selection'])test(`completed retry releases its dialog lock when ${scope} changes before busy=false`,async t=>{
 const view=fixture(t),original=view.props;let writes=0;globalThis.fetch=async()=>{writes++;return response(wakeup({version:5,state:'pending'}));};
 view.props={...original,perform:async fn=>{update(view,{...view.props,busy:true});return fn();}};open(view);await submit(view);assert.ok(dialog(view),'parent busy=false has not committed');
 const current=view.props;update(view,scope==='archive'?{...current,data:{...current.data,project:{id:'p',archived:true}}}:scope==='selection'?{...current,sessionId:'other'}:{...current,data:{...current.data,wakeups:[wakeup({version:6,sourceDigest:'other'})]}});
 update(view,{...view.props,busy:false});assert.match(text(dialog(view)),/已变化/);assert.equal(dialog(view).props.submitDisabled,true);assert.equal(dialog(view).props.closeDisabled,false);assert.equal(dialog(view).props.busy,false);assert.equal(view.pending,false);assert.equal(view.request,undefined);assert.equal(writes,1);
 const stale=dialog(view);stale.props.onClose();assert.equal(dialog(view),undefined);update(view,{...original,perform:fn=>fn()});open(view);let finish;globalThis.fetch=()=>{writes++;return new Promise(resolve=>finish=resolve);};const pending=submit(view);
 stale.props.onClose();await stale.props.onSubmit(new FormData());update(view,{...view.props});assert.equal(dialog(view).props.closeDisabled,true,'old handlers and updates must not unlock the new request');assert.equal(dialog(view).props.busy,true);assert.equal(writes,2);
 finish(response(wakeup({version:5,state:'pending'})));await pending;assert.equal(dialog(view),undefined);
});

test('an attempt rollback with its queue generation retained conservatively invalidates a completed retry and stays closable',async t=>{
 const view=fixture(t);globalThis.fetch=async()=>response(wakeup({version:5,state:'pending'}));view.props={...view.props,perform:async fn=>{update(view,{...view.props,busy:true});return fn();}};
 open(view);await submit(view);update(view,{...view.props,data:{...view.props.data,wakeups:[wakeup({version:7,state:'pending',attempts:1,queueGeneration:3})]}});update(view,{...view.props,busy:false});assert.match(text(dialog(view)),/已变化/);assert.equal(dialog(view).props.closeDisabled,false);assert.equal(dialog(view).props.busy,false);dialog(view).props.onClose();assert.equal(dialog(view),undefined);
});
