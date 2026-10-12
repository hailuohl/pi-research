import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {Inspector} from '../../dist/web/assets/workbench.js';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children??node.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children??node.children):typeof node==='string'?node:'';
const response=data=>({ok:true,json:async()=>data});
const task={id:'task/one',projectId:'p',teamId:'team',version:7,key:'research',objective:'Check the original evidence',role:'researcher',execution:'output_submitted',acceptance:'pending',dependencies:[],result:{outcome:'completed',summary:'Completed',evidenceIds:['e']}};
function view(perform=async fn=>fn()){
 return synchronousState(new Inspector({data:{project:{id:'p',archived:false,settings:{enabled:true}},sessions:[{id:'s',state:'idle'}],teams:[{id:'team',projectId:'p',version:2,rootSessionId:'s',state:'completed',goal:'Goal'}],tasks:[{...task}],runs:[],budgets:[],approvals:[]},boot:{runtime:{ready:true}},tab:'chat',sessionId:'s',embedded:true,perform,onConfig(){},onDirective(){}}));
}
const dialog=view=>elements(view.render()).find(node=>node.type?.name==='Modal'&&node.props.title==='人工确认验收');
const open=view=>{elements(view.render()).find(node=>node.type==='button'&&text(node)==='人工确认验收').props.onClick();return dialog(view);};
const input=(view,value)=>elements(dialog(view)).find(node=>node.type==='textarea').props.onChange({target:{value}});
const update=(view,change)=>{const previous=view.props;view.props=change(previous);view.componentDidUpdate(previous);};
function restore(t){const previous={fetch:globalThis.fetch,prompt:globalThis.prompt,document:globalThis.document};globalThis.document={body:{nodeType:1}};globalThis.prompt=()=>{throw Error('native prompt must not open');};t.after(()=>Object.assign(globalThis,previous));}

test('Inspector manual acceptance opens a body portal with the frozen task and cancellation has no write',t=>{
 restore(t);let requests=0;globalThis.fetch=()=>{requests++;throw Error('unexpected write');};const inspector=view();
 const first=open(inspector);assert.ok(first);assert.match(text(first),/research/);assert.match(text(first),/Check the original evidence/);
 const textarea=elements(first).find(node=>node.type==='textarea');assert.equal(textarea.props.maxLength,4000);assert.equal(textarea.props.required,true);assert.equal(textarea.props.onKeyDown,undefined);
 assert.ok(elements(inspector.render()).some(node=>node.containerInfo===document.body));
 let stopped=0;const wrapper=elements(inspector.render()).find(node=>node.props?.onSubmit&&node.type==='div');wrapper.props.onSubmit({stopPropagation(){stopped++;}});wrapper.props.onKeyDown({stopPropagation(){stopped++;}});assert.equal(stopped,2);
 input(inspector,'Draft evidence');first.props.onClose();assert.equal(dialog(inspector),undefined);assert.equal(requests,0);
 const second=open(inspector);assert.ok(second);assert.notEqual(second,first);assert.equal(elements(second).find(node=>node.type==='textarea').props.value,'');
 return first.props.onSubmit(new FormData()).then(()=>assert.equal(requests,0));
});

test('manual acceptance validates reason and posts accepted once with the frozen expectedVersion',async t=>{
 restore(t);const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,options});return response({...task,acceptance:'accepted',version:8});};const inspector=view();open(inspector);
 for(const invalid of ['  ','x'.repeat(4001)]){input(inspector,invalid);await dialog(inspector).props.onSubmit(new FormData());assert.equal(requests.length,0);assert.match(text(dialog(inspector)),/4000/);}
 input(inspector,'  Evidence checked\nLimits checked  ');const submit=dialog(inspector).props.onSubmit;await Promise.all([submit(new FormData()),submit(new FormData())]);
 assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/tasks/task%2Fone/manual-review');assert.equal(requests[0].options.method,'POST');assert.deepEqual(JSON.parse(requests[0].options.body),{verdict:'accepted',reason:'Evidence checked\nLimits checked',expectedVersion:7});assert.equal(dialog(inspector),undefined);
});

test('an old manual review close callback cannot close a reopened dialog or discard its reason',t=>{
 restore(t);let writes=0;globalThis.fetch=()=>{writes++;throw Error('unexpected');};
 const inspector=view(),first=open(inspector);first.props.onClose();const second=open(inspector),target=inspector.state.reviewTarget;input(inspector,'New review basis');first.props.onClose();
 assert.equal(inspector.state.reviewTarget,target);assert.equal(inspector.state.reviewReason,'New review basis');assert.ok(dialog(inspector));assert.equal(writes,0);second.props.onClose();assert.equal(dialog(inspector),undefined);
});

test('manual review close identity remains safe while React state updates are queued',t=>{
 restore(t);const inspector=view(),first=open(inspector),firstTarget=inspector.state.reviewTarget,queued=[];
 inspector.setState=(update,callback)=>queued.push({update,callback});
 const flush=()=>{while(queued.length){const {update,callback}=queued.shift(),value=typeof update==='function'?update(inspector.state,inspector.props):update;if(value)Object.assign(inspector.state,value);callback?.();}};
 first.props.onClose();elements(inspector.render()).find(node=>node.type==='button'&&text(node)==='人工确认验收').props.onClick();first.props.onClose();flush();
 assert.ok(dialog(inspector));const second=dialog(inspector),target=inspector.state.reviewTarget;assert.notEqual(target,firstTarget);input(inspector,'Queued new basis');flush();first.props.onClose();flush();
 assert.equal(inspector.state.reviewTarget,target);assert.equal(inspector.state.reviewReason,'Queued new basis');assert.ok(dialog(inspector));
 update(inspector,p=>({...p,sessionId:'other'}));flush();assert.equal(dialog(inspector).props.submitDisabled,true);second.props.onClose();flush();assert.equal(dialog(inspector),undefined);
});

test('manual review cancel, close, Escape and backdrop all close without writing',t=>{
 restore(t);let writes=0;globalThis.fetch=()=>{writes++;throw Error('unexpected');};
 for(const how of ['cancel','close','escape','backdrop']){
  const inspector=view(),modalElement=open(inspector),modal=new modalElement.type(modalElement.props),tree=modal.render();input(inspector,'Basis');
  if(how==='cancel')elements(tree).find(node=>node.type==='button'&&text(node)==='取消').props.onClick();
  else if(how==='close')elements(tree).find(node=>node.type==='button'&&node.props['aria-label']==='关闭对话框').props.onClick();
  else if(how==='escape')elements(tree).find(node=>node.type==='section').props.onKeyDown({key:'Escape',target:{}});
  else {const target={};tree.props.onMouseDown({target,currentTarget:target});}
  assert.equal(dialog(inspector),undefined,how);assert.equal(writes,0,how);
 }
});

test('409 and network failure retain the reason and expose the error even when perform swallows errors',async t=>{
 restore(t);let attempts=0;globalThis.fetch=async()=>{attempts++;if(attempts===1)return {ok:false,status:409,json:async()=>({error:{code:'VERSION_CONFLICT',message:'任务已更新'}})};throw Error('network unavailable');};
 const inspector=view(async fn=>{try{return await fn();}catch{return undefined;}});open(inspector);input(inspector,'Keep this evidence');await dialog(inspector).props.onSubmit(new FormData());assert.match(text(dialog(inspector)),/任务已更新/);assert.equal(inspector.state.reviewReason,'Keep this evidence');assert.equal(dialog(inspector).props.busy,false);
 await dialog(inspector).props.onSubmit(new FormData());assert.match(text(dialog(inspector)),/network unavailable/);assert.equal(inspector.state.reviewReason,'Keep this evidence');assert.equal(attempts,2);
});

test('a busy perform which does not call the action leaves the manual review open without claiming success',async t=>{
 restore(t);let writes=0;globalThis.fetch=()=>{writes++;throw Error('unexpected');};const inspector=view(async()=>undefined);open(inspector);input(inspector,'Keep this evidence');await dialog(inspector).props.onSubmit(new FormData());assert.ok(dialog(inspector));assert.match(text(dialog(inspector)),/未提交/);assert.equal(inspector.state.reviewReason,'Keep this evidence');assert.equal(dialog(inspector).props.busy,false);assert.equal(writes,0);
});

test('known context or authorization changes invalidate the frozen manual review, including ABA',async t=>{
 restore(t);let writes=0;globalThis.fetch=()=>{writes++;throw Error('unexpected');};
 const changes=[p=>({...p,sessionId:'other'}),p=>({...p,data:{...p.data,project:{...p.data.project,id:'other'}}}),p=>({...p,tab:'experiments'}),p=>({...p,selectedRun:'other'}),p=>({...p,data:{...p.data,project:{...p.data.project,archived:true}}}),p=>({...p,data:{...p.data,teams:[{...p.data.teams[0],version:3}]}}),p=>({...p,data:{...p.data,tasks:[{...task,version:8}]}}),p=>({...p,data:{...p.data,tasks:[{...task,acceptance:'accepted'}]}}),p=>({...p,data:{...p.data,tasks:[{...task},{...task,id:'reviewer',key:'review',reviewOf:'research',execution:'pending'}]}})];
 for(const change of changes){const inspector=view(),original=inspector.props,frozen=open(inspector);input(inspector,'Basis');update(inspector,change);update(inspector,()=>original);assert.equal(dialog(inspector).props.submitDisabled,true);await frozen.props.onSubmit(new FormData());assert.equal(writes,0);assert.equal(inspector.state.reviewReason,'Basis');frozen.props.onClose();open(inspector);input(inspector,'Fresh basis');assert.equal(dialog(inspector).props.submitDisabled,false);}
});

test('manual review checks context again inside a deferred perform callback and on unmount',async t=>{
 restore(t);let writes=0;globalThis.fetch=()=>{writes++;throw Error('unexpected');};
 for(const unmount of [false,true]){let action,release;const inspector=view(fn=>{action=fn;return new Promise(resolve=>{release=resolve;});});open(inspector);input(inspector,'Basis');const saving=dialog(inspector).props.onSubmit(new FormData());if(unmount)inspector.componentWillUnmount();else update(inspector,p=>({...p,sessionId:'other'}));await assert.rejects(action(),/变化|失效/);release();await saving;assert.equal(writes,0);}
});

test('a sent manual review blocks close and duplicate submission until the response completes',async t=>{
 restore(t);let finish,writes=0;globalThis.fetch=()=>{writes++;return new Promise(resolve=>{finish=resolve;});};const inspector=view();open(inspector);input(inspector,'Basis');const frozen=dialog(inspector),saving=frozen.props.onSubmit(new FormData());assert.equal(dialog(inspector).props.busy,true);assert.equal(dialog(inspector).props.closeDisabled,true);frozen.props.onClose();await frozen.props.onSubmit(new FormData());assert.ok(dialog(inspector));assert.equal(writes,1);finish(response({...task,version:8,acceptance:'accepted'}));await saving;assert.equal(dialog(inspector),undefined);
});

test('late successful manual review cannot replace a changed context or revive its old dialog',async t=>{
 restore(t);let finish;globalThis.fetch=()=>new Promise(resolve=>{finish=resolve;});const inspector=view();open(inspector);input(inspector,'Original basis');const frozen=dialog(inspector),saving=frozen.props.onSubmit(new FormData());update(inspector,p=>({...p,sessionId:'other'}));finish(response({...task,version:8,acceptance:'accepted'}));await saving;assert.ok(dialog(inspector));assert.match(text(dialog(inspector)),/变化/);assert.equal(inspector.state.reviewReason,'Original basis');assert.equal(dialog(inspector).props.busy,false);frozen.props.onClose();assert.equal(dialog(inspector),undefined);
});
