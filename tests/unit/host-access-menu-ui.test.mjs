import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {HostAccessControl} from '../../dist/web/assets/host-access-control.js';
import {Modal} from '../../dist/web/assets/ui.js';
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const status=(patch={})=>({version:2,epoch:2,available:true,enabled:false,reason:'trusted host',revokedOnRestart:false,activeCommands:0,unknownCommands:0,jobs:[],...patch});
function control(patch={}){const view=synchronousState(new HostAccessControl({sessionId:'session-fixture',archived:false,busy:false,perform:fn=>fn()}));view.state.status=status(patch);return view;}
const modal=view=>elements(view.render()).find(node=>node.type===Modal);

test('four menu rows disclose unavailable modes and use server state for the only enabled selection',()=>{
 const view=control();let rows=elements(view.render()).filter(node=>node.props?.role==='menuitemradio');assert.equal(rows.length,4);assert.deepEqual(rows.slice(0,3).map(n=>[text(n).includes('待接入'),n.props.disabled,n.props['aria-checked']]),[[true,true,'false'],[true,true,'false'],[true,true,'false']]);assert.match(text(rows[3]),/完全访问/);assert.equal(rows[3].props['aria-checked'],false);assert.equal(rows[3].props.disabled,false);view.state.status=status({enabled:true});rows=elements(view.render()).filter(node=>node.props?.role==='menuitemradio');assert.equal(rows.filter(n=>n.props['aria-checked']===true).length,1);assert.equal(rows[3].props['aria-checked'],true);
 view.state.status=status({available:false,reason:'Fixed grant needs a fresh session'});assert.equal(elements(view.render()).find(n=>n.props?.role==='menuitemradio'&&text(n).includes('完全访问')).props.disabled,true);assert.match(text(view.render()),/Fixed grant/);
});

test('a menu click restores the surviving trigger before opening the required confirmation and cancel does not write',()=>{
 const view=control({unknownCommands:1}),sequence=[];view.menu.current={matches:()=>true,hidePopover:()=>sequence.push('close-menu')};view.trigger.current={focus:()=>sequence.push('focus-trigger')};view.showDetails();assert.deepEqual(sequence,['close-menu','focus-trigger']);assert.equal(view.state.open,true);assert.equal(modal(view).props.title,'启用本机完全访问');const inputs=elements(modal(view).props.children).filter(n=>n.type==='input');assert.equal(inputs.length,2);assert.ok(inputs.every(n=>n.props.required&&!n.props.checked));modal(view).props.onClose();assert.equal(view.state.open,false);
});

test('polling cannot turn an open enable confirmation into revocation or silently write a new action',async()=>{
 const view=control();view.showDetails();view.state.status=status({version:3,enabled:true});assert.equal(modal(view).props.title,'启用本机完全访问');assert.equal(modal(view).props.submitLabel,'启用完全访问');const fetchBefore=globalThis.fetch;let writes=0;globalThis.fetch=async()=>{writes++;throw Error('unexpected request');};try{await view.save(true);assert.equal(writes,0);assert.equal(view.state.open,false);assert.match(view.state.error,/状态已变化/);}finally{globalThis.fetch=fetchBefore;}
});

test('confirmed enable retains the exact host API acknowledgements and selection follows the returned state',async()=>{
 const view=control({unknownCommands:1}),saved=globalThis.fetch,requests=[];globalThis.fetch=async(url,opts)=>{requests.push({url,opts});return {ok:true,json:async()=>status({version:3,enabled:true})};};try{await view.save(true);const post=requests.find(r=>r.opts.method==='POST');assert.deepEqual(JSON.parse(post.opts.body),{enabled:true,expectedVersion:2,acknowledgedSameUserAccess:true,acknowledgedUnknownEffects:true});assert.equal(requests.filter(r=>r.opts.method==='POST').length,1);assert.equal(view.state.status.enabled,true);}finally{globalThis.fetch=saved;}
});
