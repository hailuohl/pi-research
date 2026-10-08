import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {HostAccessControl} from '../../dist/web/assets/host-access-control.js';
import {Modal} from '../../dist/web/assets/ui.js';
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const status=(patch={})=>({version:2,epoch:2,available:true,enabled:false,pending:false,reason:'trusted host',revokedOnRestart:false,activeCommands:0,unknownCommands:0,jobs:[],...patch});
function control(patch={}){const view=synchronousState(new HostAccessControl({sessionId:'session-fixture',archived:false,busy:false,perform:fn=>fn()}));view.state.status=status(patch);view.state.permission={mode:patch.enabled?'fullAccess':'confirm',version:4,epoch:4,available:true,reason:'Session tools',hostAccess:view.state.status};return view;}
const modal=view=>elements(view.render()).find(node=>node.type===Modal);

test('all four menu rows use server state and only the current mode is selected',()=>{
 const view=control();let rows=elements(view.render()).filter(node=>node.props?.role==='menuitemradio');assert.equal(rows.length,4);assert.ok(rows.every(n=>n.props.disabled===false));assert.ok(rows.every(n=>!text(n).includes('待接入')));assert.deepEqual(rows.map(n=>n.props['aria-checked']),[false,true,false,false]);assert.match(text(rows[3]),/完全访问/);view.state.status=status({enabled:true});view.state.permission.mode='fullAccess';rows=elements(view.render()).filter(node=>node.props?.role==='menuitemradio');assert.equal(rows.filter(n=>n.props['aria-checked']===true).length,1);assert.equal(rows[3].props['aria-checked'],true);
 view.state.status=status({available:false,reason:'Fixed grant needs a fresh session'});assert.equal(elements(view.render()).find(n=>n.props?.role==='menuitemradio'&&text(n).includes('完全访问')).props.disabled,true);assert.match(text(view.render()),/Fixed grant/);
});

test('a menu click restores the surviving trigger before opening the required confirmation and cancel does not write',()=>{
 const view=control({unknownCommands:1}),sequence=[];view.menu.current={matches:()=>true,hidePopover:()=>sequence.push('close-menu')};view.trigger.current={focus:()=>sequence.push('focus-trigger')};view.showDetails();assert.deepEqual(sequence,['close-menu','focus-trigger']);assert.equal(view.state.open,true);assert.equal(modal(view).props.title,'启用本机完全访问');const inputs=elements(modal(view).props.children).filter(n=>n.type==='input');assert.equal(inputs.length,2);assert.ok(inputs.every(n=>n.props.required&&!n.props.checked));modal(view).props.onClose();assert.equal(view.state.open,false);
});

test('polling cannot turn an open enable confirmation into revocation or silently write a new action',async()=>{
 const view=control();view.showDetails();view.state.status=status({version:3,enabled:true});assert.equal(modal(view).props.title,'启用本机完全访问');assert.equal(modal(view).props.submitLabel,'启用完全访问');const fetchBefore=globalThis.fetch;let writes=0;globalThis.fetch=async()=>{writes++;throw Error('unexpected request');};try{await view.save(true);assert.equal(writes,0);assert.equal(view.state.open,false);assert.match(view.state.error,/状态已变化/);}finally{globalThis.fetch=fetchBefore;}
});

test('confirmed enable retains the exact host API acknowledgements and selection follows the returned state',async()=>{
 const view=control({unknownCommands:1}),saved=globalThis.fetch,requests=[];globalThis.fetch=async(url,opts)=>{requests.push({url,opts});return {ok:true,json:async()=>url.endsWith('/permissions')?{...view.state.permission,mode:'fullAccess',hostAccess:status({version:3,enabled:true})}:status({version:3,enabled:true})};};try{await view.save(true);const post=requests.find(r=>r.opts.method==='POST');assert.deepEqual(JSON.parse(post.opts.body),{enabled:true,expectedVersion:2,acknowledgedSameUserAccess:true,acknowledgedUnknownEffects:true});assert.equal(requests.filter(r=>r.opts.method==='POST').length,1);assert.equal(view.state.status.enabled,true);assert.equal(view.state.permission.mode,'fullAccess');}finally{globalThis.fetch=saved;}
});

test('restricted mode changes send both versions and selection changes only after the server accepts',async()=>{
 const view=control(),saved=globalThis.fetch,requests=[];globalThis.fetch=async(url,opts)=>{requests.push({url,opts});assert.equal(view.state.permission.mode,'confirm');return {ok:true,json:async()=>({...view.state.permission,mode:'autoEdit',version:5,hostAccess:status({version:3})})};};try{await view.saveMode('autoEdit');assert.deepEqual(JSON.parse(requests[0].opts.body),{mode:'autoEdit',expectedVersion:4,expectedHostVersion:2});assert.equal(requests[0].url,'/api/sessions/session-fixture/permissions');assert.equal(view.state.permission.mode,'autoEdit');assert.equal(requests.filter(r=>r.opts.method==='POST').length,1);}finally{globalThis.fetch=saved;}
});

test('the permission modal prevents its form submit from bubbling into the message composer',()=>{
 const view=control();view.showDetails();const boundary=elements(view.render()).find(node=>node.type==='div'&&node.props.onSubmit);assert.ok(boundary);assert.ok(elements(boundary).some(node=>node.type===Modal));let stopped=false;boundary.props.onSubmit({stopPropagation(){stopped=true;}});assert.equal(stopped,true);
});

test('accepted pending enable stays visible, blocks duplicate enable and allows versioned cancellation',async()=>{
 const view=control(),saved=globalThis.fetch,requests=[],notices=[];let current=status({version:3,pending:true});view.props.perform=async(fn,notice)=>{await fn();notices.push(notice);};
 globalThis.fetch=async(url,opts)=>{requests.push({url,opts});if(opts?.method==='POST'&&!JSON.parse(opts.body).enabled)current=status({version:4});return {ok:true,json:async()=>url.endsWith('/permissions')?{...view.state.permission,hostAccess:current}:current};};
 try{
  view.showDetails();await view.save(true);assert.equal(view.state.open,true);assert.equal(view.state.status.pending,true);assert.equal(view.state.permission.mode,'confirm');assert.match(text(view.render()),/完全访问待启用/);assert.match(text(modal(view).props.children),/无需再次操作/);assert.equal(modal(view).props.submitLabel,'取消启用');assert.equal(elements(modal(view).props.children).filter(n=>n.type==='input').length,0);assert.doesNotMatch(notices[0],/已启用/);
  await view.save(true);assert.equal(requests.filter(r=>r.opts?.method==='POST').length,1);view.showDetails();await view.save(false);assert.deepEqual(JSON.parse(requests.filter(r=>r.opts?.method==='POST')[1].opts.body),{enabled:false,expectedVersion:3});assert.equal(view.state.status.pending,false);assert.match(notices.at(-1),/已取消/);
 }finally{globalThis.fetch=saved;}
});

test('pending cancellation remains available when eligibility is lost and selecting the current restricted mode cancels pending',async()=>{
 const view=control({pending:true,available:false}),saved=globalThis.fetch,requests=[];view.showDetails();assert.equal(modal(view).props.busy,false);assert.equal(modal(view).props.submitLabel,'取消启用');
 globalThis.fetch=async(url,opts)=>{requests.push({url,opts});return {ok:true,json:async()=>url.endsWith('/permissions')?{...view.state.permission,hostAccess:status({version:3})}:status({version:3})};};
 try{await view.saveMode('confirm');assert.equal(requests.filter(r=>r.opts?.method==='POST').length,1);assert.equal(requests[0].url,'/api/sessions/session-fixture/host-access');assert.deepEqual(JSON.parse(requests[0].opts.body),{enabled:false,expectedVersion:2});assert.equal(view.state.status.pending,false);assert.equal(view.state.permission.mode,'confirm');assert.equal(view.state.permission.epoch,4);}finally{globalThis.fetch=saved;}
});
