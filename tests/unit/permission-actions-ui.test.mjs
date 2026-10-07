import test from 'node:test';
import assert from 'node:assert/strict';
import {PermissionActions} from '../../dist/web/assets/permission-actions.js';
import {synchronousState} from '../support/ui.mjs';
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const action={id:'fixed-action',version:3,operation:'workspace_write',input:{path:'draft.py',content:'after',expectedDigest:'before-digest'},state:'pending',createdAt:'2026-10-06T00:00:00Z',before:{path:'draft.py',content:'before',digest:'before-digest'},approval:{id:'approval',version:2,status:'pending'}};
function view(){const component=synchronousState(new PermissionActions({sessionId:'session-fixture',archived:false,busy:false,perform:fn=>fn()}));component.state.actions=[action];return component;}

test('fixed page approval discloses destination model and history resend in the existing card',()=>{
 const component=view();component.state.actions=[{...action,operation:'publication_page_image_read',input:{publicationResultId:'fixed-result',pageNumber:2},before:undefined,approval:{...action.approval,reason:'允许固定页加入当前会话并发送给 provider/vision-model；后续请求及重开可能再次发送，权限失效时停止。'}}];const rendered=text(component.render());assert.match(rendered,/发送固定文稿页给模型/);assert.match(rendered,/provider\/vision-model/);assert.match(rendered,/后续请求及重开可能再次发送/);assert.match(rendered,/fixed-result/);assert.equal(elements(component.render()).filter(e=>e.type==='button').length,2);
});
test('a file approval displays its fixed before and after and rejected history has no allow button',()=>{
 const component=view();assert.match(text(component.render()),/before.*before-digest.*after/);assert.equal(elements(component.render()).filter(e=>e.type==='button').length,2);component.state.actions=[{...action,state:'rejected',approval:{...action.approval,status:'rejected'}}];assert.equal(elements(component.render()).filter(e=>e.type==='button').length,0);assert.match(text(component.render()),/审批历史.*已拒绝/);
});
test('allow sends exact action and approval versions and retains pending until a fresh read',async()=>{
 const component=view(),saved=globalThis.fetch,requests=[];globalThis.fetch=async(url,opts)=>{requests.push({url,opts});assert.equal(component.state.actions[0].state,'pending');return {ok:true,json:async()=>({actions:[{...action,state:'approved',approval:{...action.approval,status:'approved'}}]})};};try{await component.decide(action,true);assert.equal(requests[0].url,'/api/sessions/session-fixture/permission-actions/fixed-action/decide');assert.deepEqual(JSON.parse(requests[0].opts.body),{expectedVersion:3,expectedApprovalVersion:2,approved:true});assert.equal(requests.filter(r=>r.opts.method==='POST').length,1);assert.equal(component.state.actions[0].state,'approved');assert.match(text(component.render()),/已批准，等待执行/);}finally{globalThis.fetch=saved;}
});
