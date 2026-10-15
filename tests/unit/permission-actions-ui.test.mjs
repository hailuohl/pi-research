import test from 'node:test';
import assert from 'node:assert/strict';
import {PermissionActions} from '../../dist/web/assets/permission-actions.js';
import {Chat} from '../../dist/web/assets/workbench.js';
import {synchronousState} from '../support/ui.mjs';
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const action={id:'fixed-action',version:3,operation:'workspace_write',input:{path:'draft.py',content:'after',expectedDigest:'before-digest'},state:'pending',createdAt:'2026-10-06T00:00:00Z',before:{path:'draft.py',content:'before',digest:'before-digest'},approval:{id:'approval',version:2,status:'pending'}};
function view(){const component=synchronousState(new PermissionActions({sessionId:'session-fixture',archived:false,busy:false,perform:fn=>fn()}));component.state.actions=[action];return component;}

test('known pending notifications follow accepted reads and ignore a disposed session response',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});const pending=[];
 const component=view();component.props={...component.props,onPendingChange:ids=>pending.push(ids)};
 globalThis.fetch=async()=>({ok:true,json:async()=>({actions:[action,{...action,id:'approved',approval:{...action.approval,id:'approved-approval',status:'approved'}}],hasMoreActions:true})});
 await component.load();assert.deepEqual(pending,[['approval']]);assert.equal(component.state.hasMore,true);
 let resolve;globalThis.fetch=()=>new Promise(done=>{resolve=done;});const late=component.load();component.componentWillUnmount();
 resolve({ok:true,json:async()=>({actions:[]})});await late;assert.deepEqual(pending,[['approval']]);
});

test('fixed page approval discloses destination model and history resend in the existing card',()=>{
 const component=view();component.state.actions=[{...action,operation:'publication_page_image_read',input:{publicationResultId:'fixed-result',pageNumber:2},before:undefined,approval:{...action.approval,reason:'允许固定页加入当前会话并发送给 provider/vision-model；后续请求及重开可能再次发送，权限失效时停止。'}}];const rendered=text(component.render());assert.match(rendered,/发送固定文稿页给模型/);assert.match(rendered,/provider\/vision-model/);assert.match(rendered,/后续请求及重开可能再次发送/);assert.match(rendered,/fixed-result/);assert.equal(elements(component.render()).filter(e=>e.type==='button').length,2);
});
test('a file approval displays its fixed before and after and rejected history has no allow button',()=>{
 const component=view();assert.match(text(component.render()),/before.*before-digest.*after/);assert.equal(elements(component.render()).filter(e=>e.type==='button').length,2);component.state.actions=[{...action,state:'rejected',approval:{...action.approval,status:'rejected'}}];assert.equal(elements(component.render()).filter(e=>e.type==='button').length,0);assert.match(text(component.render()),/审批历史.*已拒绝/);
});
test('allow sends exact action and approval versions and retains pending until a fresh read',async()=>{
 const component=view(),saved=globalThis.fetch,requests=[];globalThis.fetch=async(url,opts)=>{requests.push({url,opts});assert.equal(component.state.actions[0].state,'pending');return {ok:true,json:async()=>({actions:[{...action,state:'approved',approval:{...action.approval,status:'approved'}}]})};};try{await component.decide(action,true);assert.equal(requests[0].url,'/api/sessions/session-fixture/permission-actions/fixed-action/decide');assert.deepEqual(JSON.parse(requests[0].opts.body),{expectedVersion:3,expectedApprovalVersion:2,approved:true});assert.equal(requests.filter(r=>r.opts.method==='POST').length,1);assert.equal(component.state.actions[0].state,'approved');assert.match(text(component.render()),/已批准，等待执行/);}finally{globalThis.fetch=saved;}
});

const ownerSession={id:'session-fixture',projectId:'project-fixture',role:'coordinator',state:'idle'};
const failedSource={...action,sessionId:ownerSession.id,operation:'workspace_prepare_from_revision',input:{experimentId:'00000000-0000-4000-8000-000000000001',revision:1},state:'failed',before:undefined,error:'Original initialization failure',approval:{...action.approval,status:'approved'}};
function ownerView(props={}){const component=synchronousState(new PermissionActions({sessionId:ownerSession.id,projectId:ownerSession.projectId,session:ownerSession,archived:false,busy:false,perform:fn=>fn(),...props}));component.state.actions=[failedSource];return component;}
const prepareButton=component=>elements(component.render()).find(e=>e.type==='button'&&text(e)==='准备这一固定版本的工作区');

test('owner source preparation is reachable only on a matching failed root action and never starts on render',async()=>{
 const saved=globalThis.fetch,calls=[];globalThis.fetch=async(...args)=>{calls.push(args);throw Error('unexpected automatic call');};
 try{
  const component=ownerView();assert.ok(prepareButton(component));assert.match(text(component.render()),new RegExp(failedSource.input.experimentId));assert.match(text(component.render()),/session-fixture/);assert.equal(calls.length,0);
  for(const patch of [{state:'unknown'},{state:'rejected'},{state:'stale'},{state:'pending'},{operation:'workspace_write'},{sessionId:'other-session'},{approval:{...failedSource.approval,status:'rejected'}},{approval:{...failedSource.approval,status:'stale'}},{input:{snapshotId:'fixed-snapshot'}},{input:{...failedSource.input,extra:true}},{input:{experimentId:'',revision:1}},{input:{...failedSource.input,revision:0}},{input:{...failedSource.input,revision:1.5}},{input:{...failedSource.input,revision:'1'}}]){
   component.state.actions=[{...failedSource,...patch}];assert.equal(prepareButton(component),undefined,JSON.stringify(patch));await component.prepareWorkspace(component.state.actions[0]);
  }
  for(const patch of [{id:'other-session'},{projectId:'other-project'},{role:'reviewer'},{taskId:'task'},{teamId:'team'},{parentSessionId:'parent'}]){const other=ownerView({session:{...ownerSession,...patch}});assert.equal(prepareButton(other),undefined);await other.prepareWorkspace(failedSource);}
  assert.equal(calls.length,0);
 }finally{globalThis.fetch=saved;}
});

test('owner preparation disables running, bound, archived and busy workspaces without disabling live model approval',async()=>{
 const saved=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('unexpected disabled call');};
 try{
  for(const props of [{busy:true},{archived:true},{session:{...ownerSession,state:'running'}},{session:{...ownerSession,state:'queued'}},{session:{...ownerSession,state:'archived'}},{session:{...ownerSession,sourceRevisionId:'already-bound'}}]){const component=ownerView(props);assert.equal(prepareButton(component).props.disabled,true);await component.prepareWorkspace(failedSource);}
  const component=ownerView({session:{...ownerSession,state:'running'}});component.state.actions.push(action);const allow=elements(component.render()).find(e=>e.type==='button'&&text(e)==='允许本次');assert.equal(allow.props.disabled,false);assert.equal(calls,0);
 }finally{globalThis.fetch=saved;}
});

test('an explicit owner click pins original IDs and key, suppresses double clicks, and preserves failed action on response loss',async()=>{
 const component=ownerView(),saved=globalThis.fetch,requests=[];let finish;
 globalThis.fetch=async(url,opts)=>{requests.push({url,opts});if(opts.method==='POST')return new Promise(resolve=>{finish=resolve;});return {ok:true,json:async()=>({actions:[failedSource]})};};
 try{
  const first=component.prepareWorkspace(failedSource);await component.prepareWorkspace(failedSource);assert.equal(requests.length,1);
  assert.equal(requests[0].url,'/api/operations/workspace_prepare_from_revision');assert.deepEqual(JSON.parse(requests[0].opts.body),{projectId:ownerSession.projectId,sessionId:ownerSession.id,input:failedSource.input});assert.equal(requests[0].opts.headers['Idempotency-Key'],'owner-workspace-prepare:fixed-action');
  finish({ok:false,status:500,json:async()=>({error:{code:'HTTP_ERROR',message:'response lost'}})});await assert.rejects(first,/response lost/);assert.equal(component.state.actions[0].state,'failed');assert.match(text(component.render()),/Original initialization failure/);assert.match(component.state.error,/response lost/);
  const second=component.prepareWorkspace(failedSource);finish({ok:true,json:async()=>({prepared:true})});await second;
  const posts=requests.filter(r=>r.opts.method==='POST');assert.equal(posts.length,2);assert.equal(posts[1].opts.headers['Idempotency-Key'],posts[0].opts.headers['Idempotency-Key']);assert.deepEqual(JSON.parse(posts[1].opts.body),JSON.parse(posts[0].opts.body));assert.ok(requests.some(r=>r.url==='/api/sessions/session-fixture/permissions'&&r.opts.method==='GET'));assert.equal(component.state.actions[0].state,'failed');assert.equal(component.state.error,'');assert.equal(component.state.saving,'');
 }finally{globalThis.fetch=saved;}
});

test('chat passes selected project and session to owner preparation without treating model running as UI busy',()=>{
 const session={...ownerSession,state:'running',title:'Fixture',model:{provider:'fixture',model:'fixture'}},data={project:{id:ownerSession.projectId,archived:false,settings:{enabled:false}},experiments:[],sessions:[session]},component=new Chat({data,session,boot:{runtime:{ready:true}},messages:[],history:null,historyAnchor:null,stream:'',busy:false,perform:fn=>fn()});
 const card=elements(component.render()).find(e=>e.type===PermissionActions);assert.equal(card.props.projectId,ownerSession.projectId);assert.equal(card.props.session,session);assert.equal(card.props.sessionId,session.id);assert.equal(card.props.busy,false);
});
