import test from 'node:test';
import assert from 'node:assert/strict';
import {Chat} from '../../dist/web/assets/workbench.js';
import {synchronousState} from '../support/ui.mjs';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children??node.children)];
const session=(extra={})=>({id:'s',version:1,projectId:'p',title:'Original title',role:'coordinator',state:'idle',model:{provider:'test',model:'test',thinking:'high'},...extra});
const response=row=>({ok:true,json:async()=>row});
const button=(view,label)=>elements(view.render()).find(node=>node.type==='button'&&node.props['aria-label']===label);
const dialog=view=>elements(view.render()).find(node=>node.type?.name==='Modal');
const input=view=>elements(dialog(view)).find(node=>node.type==='input');
const fill=(view,title)=>input(view).props.onChange({target:{value:title}});
const submit=view=>dialog(view).props.onSubmit(new FormData());
function fixture(t){
 const previous={fetch:globalThis.fetch,prompt:globalThis.prompt,document:globalThis.document};
 globalThis.document={body:{nodeType:1}};globalThis.prompt=()=>{throw Error('native prompt must not open');};t.after(()=>Object.assign(globalThis,previous));
 const confirmed=[],view=synchronousState(new Chat({data:{project:{id:'p',settings:{enabled:false},archived:false},sessions:[],teams:[],approvals:[]},boot:{runtime:{ready:true}},session:session(),messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,stream:'',busy:false,perform:async fn=>fn(),onModelConfirmed:row=>confirmed.push(row)}));
 view.state.draft='Keep chat draft';view.state.attachments=[{documentVersionId:'doc'}];t.after(()=>view.componentWillUnmount());
 return {view,confirmed};
}
const open=view=>button(view,'重命名会话').props.onClick();
const update=(view,props)=>{const previous=view.props;view.props=props;view.componentDidUpdate(previous);};

test('rename opens a page Modal with the original title and posts the trimmed frozen title once',async t=>{
 const {view,confirmed}=fixture(t),requests=[];let finish;
 globalThis.fetch=(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return new Promise(resolve=>finish=resolve);};
 open(view);assert.ok(dialog(view));assert.equal(input(view).props.value,'Original title');assert.equal(input(view).props.maxLength,160);
 fill(view,'  Renamed  ');const pending=submit(view),duplicate=submit(view);assert.equal(requests.length,1);assert.deepEqual(requests[0],{url:'/api/sessions/s',body:{title:'Renamed',expectedVersion:1}});
 const closeDisabled=dialog(view).props.closeDisabled;dialog(view).props.onClose();assert.ok(dialog(view),'a submitted write cannot pretend to be cancelled');
 finish(response(session({title:'Renamed',version:2})));await Promise.all([pending,duplicate]);assert.equal(confirmed.length,1);assert.equal(dialog(view),undefined);assert.equal(view.state.draft,'Keep chat draft');assert.deepEqual(view.state.attachments,[{documentVersionId:'doc'}]);assert.equal(closeDisabled,true);
});

test('cancel and invalid input never write or alter chat drafts; stale cancelled callbacks cannot submit a reopened dialog',async t=>{
 const {view}=fixture(t);let writes=0;globalThis.fetch=async()=>{writes++;return response(session({title:'New',version:2}));};
 open(view);const cancelled=dialog(view);cancelled.props.onClose();assert.equal(dialog(view),undefined);open(view);fill(view,'New');await cancelled.props.onSubmit(new FormData());assert.equal(writes,0);assert.equal(input(view).props.value,'New');
 for(const title of ['   ','x'.repeat(161)]){fill(view,title);await submit(view);assert.equal(writes,0);assert.equal(input(view).props.value,title);assert.ok(elements(dialog(view)).some(node=>node.props?.role==='alert'));}
 assert.equal(view.state.draft,'Keep chat draft');assert.deepEqual(view.state.attachments,[{documentVersionId:'doc'}]);
});

test('rename network failure and conflict retain input, show an error and retry only the original version',async t=>{
 for(const conflict of [false,true]){
  const {view,confirmed}=fixture(t),requests=[];globalThis.fetch=async(_url,init)=>{requests.push(JSON.parse(init.body));if(requests.length===1){if(!conflict)throw Error('network failed');return {ok:false,status:409,json:async()=>({error:{message:'version conflict',code:'VERSION_CONFLICT'}})};}return response(session({title:'Renamed',version:2}));};
  open(view);fill(view,' Renamed ');await assert.doesNotReject(submit(view));assert.equal(input(view).props.value,' Renamed ');assert.equal(confirmed.length,0);assert.ok(elements(dialog(view)).some(node=>node.props?.role==='alert'));assert.equal(view.state.draft,'Keep chat draft');
  await submit(view);assert.deepEqual(requests,[{title:'Renamed',expectedVersion:1},{title:'Renamed',expectedVersion:1}]);assert.equal(confirmed.length,1);
 }
});

test('changed project, session, version, title or archive state invalidates frozen rename and reopening uses the new target',async t=>{
 for(const kind of ['project','session','version','title','archive','roundtrip']){
  const {view}=fixture(t);let writes=0;globalThis.fetch=async()=>{writes++;throw Error('must not write');};open(view);fill(view,'New');const stale=dialog(view),original=view.props;
  const next=kind==='project'?{...original,session:{...original.session,projectId:'other'},data:{...original.data,project:{...original.data.project,id:'other'}}}:kind==='archive'?{...original,data:{...original.data,project:{...original.data.project,archived:true}}}:{...original,session:{...original.session,...(kind==='version'?{version:2}:kind==='title'?{title:'Updated'}:{id:'other'})}};
  update(view,next);if(kind==='roundtrip')update(view,original);await stale.props.onSubmit(new FormData());assert.equal(writes,0,kind);assert.equal(input(view).props.value,'New',kind);assert.ok(elements(dialog(view)).some(node=>node.props?.role==='alert'),kind);
  dialog(view).props.onClose();open(view);if(kind==='archive'){assert.equal(dialog(view),undefined);}else assert.equal(input(view).props.value,view.props.session.title);
 }
});

test('late rename success or failure cannot update a switched, reopened or unmounted context or replace new dialog input',async t=>{
 for(const outcome of ['success','failure'])for(const scope of ['switch','roundtrip','unmount']){
  const {view,confirmed}=fixture(t);let finish,fail;globalThis.fetch=()=>new Promise((resolve,reject)=>{finish=resolve;fail=reject;});open(view);fill(view,'Old request');const pending=submit(view),original=view.props;
  if(scope==='unmount')view.componentWillUnmount();else{update(view,{...original,session:session({id:'other'})});if(scope==='roundtrip')update(view,original);dialog(view).props.onClose();open(view);fill(view,'New input');}
  if(outcome==='success')finish(response(session({title:'Old request',version:2})));else fail(Error('old failure'));await pending;assert.deepEqual(confirmed,[],outcome+' '+scope);if(scope!=='unmount'){assert.equal(input(view).props.value,'New input');assert.ok(!elements(dialog(view)).some(node=>node.props?.role==='alert'));}
 }
});

test('rename uses a portal outside the chat form and isolates keyboard and submit bubbling',t=>{
 const {view}=fixture(t);open(view);const portal=elements(view.render()).find(node=>node.$$typeof===Symbol.for('react.portal'));assert.ok(portal);assert.equal(portal.containerInfo,document.body);
 const boundary=portal.children;let stopped=0;boundary.props.onSubmit({stopPropagation(){stopped++;}});boundary.props.onKeyDown({stopPropagation(){stopped++;}});assert.equal(stopped,2);
 assert.ok(!elements(boundary).some(node=>node.type==='form'),'Modal owns the independent form');assert.equal(input(view).props.disabled,false);
});


test('all Modal close controls cancel without writes and return focus; name opening focuses its input',t=>{
 const {view}=fixture(t);let writes=0,focused=0,returned=0;globalThis.fetch=async()=>{writes++;throw Error('must not write');};
 for(const kind of ['cancel','close','escape','backdrop']){
  view.renameInput.current={focus(){focused++;}};open(view);assert.equal(focused,['cancel','close','escape','backdrop'].indexOf(kind)+1);
  const element=dialog(view),modal=new element.type(element.props),trigger={focus(){returned++;}};document.activeElement=trigger;modal.componentDidMount();const tree=modal.render(),section=elements(tree).find(node=>node.type==='section');
  if(kind==='cancel')elements(tree).find(node=>node.type==='button'&&node.props.className==='secondary').props.onClick();
  if(kind==='close')elements(tree).find(node=>node.props?.['aria-label']==='关闭对话框').props.onClick();
  if(kind==='escape')section.props.onKeyDown({key:'Escape',target:{closest(){return null;}}});
  if(kind==='backdrop'){const backdrop={};tree.props.onMouseDown({target:backdrop,currentTarget:backdrop});}
  assert.equal(dialog(view),undefined,kind);modal.componentWillUnmount();assert.equal(returned,['cancel','close','escape','backdrop'].indexOf(kind)+1);assert.equal(view.state.draft,'Keep chat draft');assert.deepEqual(view.state.attachments,[{documentVersionId:'doc'}]);
 }
 assert.equal(writes,0);
});

test('the shared Modal traps Tab and Shift-Tab without altering chat input',t=>{
 const {view}=fixture(t);open(view);const element=dialog(view),modal=new element.type(element.props),tree=modal.render(),section=elements(tree).find(node=>node.type==='section');
 const first={closest(){return null;},focus(){document.activeElement=first;}},last={closest(){return null;},focus(){document.activeElement=last;}};section.props.ref({querySelectorAll:()=>[first,last]});let prevented=0;
 document.activeElement=last;section.props.onKeyDown({key:'Tab',target:last,preventDefault(){prevented++;}});assert.equal(document.activeElement,first);
 document.activeElement=first;section.props.onKeyDown({key:'Tab',shiftKey:true,target:first,preventDefault(){prevented++;}});assert.equal(document.activeElement,last);assert.equal(prevented,2);assert.equal(view.state.draft,'Keep chat draft');
});

test('queued perform callbacks and late receipts cannot use an updated version, title or project archive state',async t=>{
 for(const phase of ['queued','sent'])for(const kind of ['version','title','archive']){
  const {view,confirmed}=fixture(t);let callback,finish,writes=0;
  if(phase==='queued')view.props={...view.props,perform:fn=>new Promise(resolve=>{callback=()=>resolve(fn());})};
  globalThis.fetch=()=>{writes++;return new Promise(resolve=>finish=resolve);};open(view);fill(view,'Renamed');const pending=submit(view),original=view.props;
  update(view,kind==='archive'?{...original,data:{...original.data,project:{...original.data.project,archived:true}}}:{...original,session:{...original.session,...(kind==='version'?{version:2}:{title:'Updated elsewhere'})}});
  if(phase==='queued'){callback();assert.equal(writes,0);}else finish(response(session({title:'Renamed',version:3})));await pending;assert.deepEqual(confirmed,[],phase+' '+kind);assert.equal(input(view).props.value,'Renamed');assert.ok(dialog(view).props.submitDisabled);assert.ok(elements(dialog(view)).some(node=>node.props?.role==='alert'));
 }
});

test('a matching refresh before the rename receipt finishes normally without accepting a newer or foreign update',async t=>{
 for(const kind of ['matching','newer','different-title','roundtrip']){
  const {view,confirmed}=fixture(t);let finish;globalThis.fetch=()=>new Promise(resolve=>finish=resolve);open(view);fill(view,'Renamed');const pending=submit(view),original=view.props;
  update(view,{...original,session:session({title:kind==='different-title'?'Another title':'Renamed',version:kind==='newer'?3:2})});
  if(kind==='roundtrip'){const refreshed=view.props;update(view,{...refreshed,session:session({id:'other'})});update(view,refreshed);}
  finish(response(session({title:'Renamed',version:2})));await pending;
  if(kind==='matching'){assert.equal(confirmed.length,1);assert.equal(dialog(view),undefined);}else{assert.deepEqual(confirmed,[],kind);assert.equal(input(view).props.value,'Renamed');assert.ok(elements(dialog(view)).some(node=>node.props?.role==='alert'),kind);assert.ok(dialog(view).props.submitDisabled);}
 }
});

test('Modal closeDisabled visibly and behaviorally gates every close control while default callers stay unchanged',t=>{
 const {view}=fixture(t);open(view);const element=dialog(view);
 for(const closeDisabled of [undefined,false,true]){
  let closed=0;const modal=new element.type({...element.props,busy:true,closeDisabled,onClose:()=>closed++}),tree=modal.render();
  const cancel=elements(tree).find(node=>node.type==='button'&&node.props.className==='secondary'),close=elements(tree).find(node=>node.props?.['aria-label']==='关闭对话框'),section=elements(tree).find(node=>node.type==='section');
  assert.equal(!!cancel.props.disabled,!!closeDisabled);assert.equal(!!close.props.disabled,!!closeDisabled);
  cancel.props.onClick();close.props.onClick();const backdrop={};tree.props.onMouseDown({target:backdrop,currentTarget:backdrop});section.props.onKeyDown({key:'Escape',target:{closest(){return null;}}});
  assert.equal(closed,closeDisabled?0:4);
 }
});

test('a busy Modal keeps focus and traps Tab when every interactive control is disabled',t=>{
 const {view}=fixture(t);open(view);const element=dialog(view),modal=new element.type(element.props);let focused=0,prevented=0;
 const section=elements(modal.render()).find(node=>node.type==='section');section.props.ref({focus(){focused++;},querySelectorAll(){return [];}});
 const previous=modal.props;modal.props={...previous,busy:true,closeDisabled:true};modal.componentDidUpdate(previous);assert.equal(focused,1);
 const busySection=elements(modal.render()).find(node=>node.type==='section');assert.equal(busySection.props.tabIndex,-1);busySection.props.onKeyDown({key:'Tab',target:{closest(){return null;}},preventDefault(){prevented++;}});
 assert.equal(prevented,1);assert.equal(focused,2);
});

test('successful rename waits for busy refresh to finish before closing onto its enabled opener',async t=>{
 const {view,confirmed}=fixture(t);let release,returned=0;const opener={disabled:false,focus(){if(!this.disabled){document.activeElement=this;returned++;}}};
 const control=button(view,'重命名会话');control.props.ref?.(opener);
 document.activeElement=opener;open(view);const element=dialog(view),modal=new element.type(element.props),section={contains:node=>node===section,focus(){document.activeElement=section;},querySelector(){return section;}};
 elements(modal.render()).find(node=>node.type==='section').props.ref(section);modal.componentDidMount();
 view.props={...view.props,onModelConfirmed:row=>{confirmed.push(row);update(view,{...view.props,session:row});},perform:async fn=>{opener.disabled=true;update(view,{...view.props,busy:true});const result=await fn();await new Promise(resolve=>release=resolve);opener.disabled=false;update(view,{...view.props,busy:false});return result;}};
 globalThis.fetch=async()=>response(session({title:'Renamed',version:2}));fill(view,'Renamed');const pending=submit(view);await new Promise(resolve=>setImmediate(resolve));
 assert.ok(dialog(view),'keep the dialog open while its return target is disabled');assert.equal(confirmed.length,1);assert.equal(returned,0);release();await pending;assert.equal(dialog(view),undefined);modal.componentWillUnmount();assert.equal(document.activeElement,opener);assert.equal(returned,1);
});

test('Tab and Shift-Tab from the Modal section or a disabled control stay inside enabled controls',t=>{
 const {view}=fixture(t);open(view);const element=dialog(view),modal=new element.type(element.props),tree=modal.render(),handler=elements(tree).find(node=>node.type==='section');
 const first={closest(){return null;},focus(){document.activeElement=first;}},last={closest(){return null;},focus(){document.activeElement=last;}};const section={querySelectorAll:()=>[first,last]},disabled={closest(){return null;}};handler.props.ref(section);
 for(const active of [section,disabled])for(const shiftKey of [false,true]){document.activeElement=active;let prevented=0;handler.props.onKeyDown({key:'Tab',shiftKey,target:{closest(){return null;}},preventDefault(){prevented++;}});assert.equal(prevented,1);assert.equal(document.activeElement,shiftKey?last:first);}
});

test('closing a Modal never steals focus already moved to another control or dialog',t=>{
 const {view}=fixture(t);open(view);const element=dialog(view),modal=new element.type(element.props);let returned=0;document.activeElement={focus(){returned++;}};
 const section={contains:node=>node===section,querySelector(){return section;},focus(){document.activeElement=section;}};elements(modal.render()).find(node=>node.type==='section').props.ref(section);modal.componentDidMount();
 const elsewhere={};document.activeElement=elsewhere;modal.componentWillUnmount();assert.equal(returned,0);assert.equal(document.activeElement,elsewhere);
});

test('completed rename closes after the parent commits busy=false, while late completions cannot close a new context',async t=>{
 for(const scope of ['same','session','project','roundtrip','unmount','version','archive']){
  const {view}=fixture(t);let release;const original=view.props;globalThis.fetch=async()=>response(session({title:'Renamed',version:2}));
  view.props={...original,perform:async fn=>{update(view,{...view.props,busy:true});const result=await fn();await new Promise(resolve=>release=resolve);return result;}};open(view);fill(view,'Renamed');const pending=submit(view);await new Promise(resolve=>setImmediate(resolve));
  const savedDialog=dialog(view);
  if(scope==='unmount')view.componentWillUnmount();
  else if(scope!=='same'){
   const current=view.props,next=scope==='project'?{...current,data:{...current.data,project:{...current.data.project,id:'other'}}}:scope==='archive'?{...current,data:{...current.data,project:{...current.data.project,archived:true}}}:{...current,session:session(scope==='version'?{title:'Changed again',version:3}:{id:'other'})};
   update(view,next);if(scope==='roundtrip')update(view,current);
  }
  release();await pending;
  if(scope==='same'){assert.ok(dialog(view),'parent has not committed busy=false yet');update(view,{...view.props,busy:false});assert.equal(dialog(view),undefined);}
  else if(scope!=='unmount'){assert.ok(dialog(view),'stale successful request must not close the invalidated dialog');assert.ok(elements(dialog(view)).some(node=>node.props?.role==='alert'));update(view,{...view.props,busy:false});assert.ok(dialog(view));}
  else assert.equal(dialog(view)?.props.title,savedDialog.props.title);
 }
});

test('failed save re-enables controls and Shift-Tab from the retained section stays in the dialog',t=>{
 const {view}=fixture(t);open(view);const element=dialog(view),modal=new element.type({...element.props,busy:true,closeDisabled:true});
 const first={closest(){return null;},focus(){document.activeElement=first;}},last={closest(){return null;},focus(){document.activeElement=last;}};const section={querySelectorAll:()=>[first,last]};elements(modal.render()).find(node=>node.type==='section').props.ref(section);document.activeElement=section;
 const previous=modal.props;modal.props={...previous,busy:false,closeDisabled:false};modal.componentDidUpdate(previous);let prevented=0;
 elements(modal.render()).find(node=>node.type==='section').props.onKeyDown({key:'Tab',shiftKey:true,target:{closest(){return null;}},preventDefault(){prevented++;}});assert.equal(prevented,1);assert.equal(document.activeElement,last);
});
