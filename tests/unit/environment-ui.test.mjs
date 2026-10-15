import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {synchronousState} from '../support/ui.mjs';
import {EnvironmentView} from '../../dist/web/assets/environment-view.js';
import {App} from '../../dist/web/assets/app.js';

const data=(version=1)=>({version,scope:'local',variables:[{name:'HF_TOKEN',hasValue:true}]});
const response=value=>({ok:true,json:async()=>value});
const view=()=>{const v=synchronousState(new EnvironmentView({}));v.state.data=data();return v;};
const nodes=node=>Array.isArray(node)?node.flatMap(nodes):!node||typeof node!=='object'?[]:[node,...nodes(node.props?.children)];

test('environment can open before a project exists and a saved scheduler route reopens it',t=>{
 const oldStorage=globalThis.localStorage;t.after(()=>{globalThis.localStorage=oldStorage;});
 globalThis.localStorage={getItem:()=>JSON.stringify({tab:'scheduler'}),setItem(){}};
 const app=synchronousState(new App({}));app.state.boot={projects:[]};
 assert.equal(app.state.tab,'environment');assert.ok(nodes(app.render()).some(n=>n.type===EnvironmentView));
 assert.doesNotMatch(renderToStaticMarkup(app.render()),/资源与调度/);app.componentWillUnmount();
});
test('list stores public metadata only and escapes names while masking saved values',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);
 globalThis.fetch=async()=>response({version:2,scope:'local',variables:[{name:'CUSTOM_API_KEY',hasValue:true,value:'synthetic-secret'}]});
 const v=view();await v.load();assert.equal(JSON.stringify(v.state).includes('synthetic-secret'),false);
 const html=renderToStaticMarkup(v.render());assert.match(html,/CUSTOM_API_KEY/);assert.match(html,/已保存并隐藏/);assert.doesNotMatch(html,/synthetic-secret/);
 v.state.data.variables[0].name='<script>';assert.match(renderToStaticMarkup(v.render()),/&lt;script&gt;/);
});
test('save clears password, retries a lost reply with the same idempotency key and never overwrites from Add',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);const calls=[];
 globalThis.fetch=async(_url,options)=>{calls.push(options);if(calls.length===1)throw Error('lost reply');return response({version:2,scope:'local',variables:[...data().variables,{name:'MY_API_KEY',hasValue:true}]});};
 const v=view();v.edit();v.state.name='HF_TOKEN';v.state.value='do-not-overwrite';await v.save('set');assert.equal(calls.length,0);assert.match(v.state.error,/已存在/);
 v.state.name='MY_API_KEY';v.state.value='synthetic-secret';await v.save('set');assert.equal(v.state.value,'synthetic-secret');assert.equal(v.state.editing,true);
 await v.save('set');assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);assert.equal(v.state.value,'');assert.equal(v.state.editing,false);assert.equal(v.state.data.version,2);
});
test('version conflict retains the draft, explicit refresh enables retry, delete leaves other rows',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);let request;
 globalThis.fetch=async(_url,options)=>options.body?{ok:false,status:409,json:async()=>({error:{code:'VERSION_CONFLICT',message:'配置已变化'}})}:response(data(3));
 const v=view();v.edit('HF_TOKEN');v.state.value='replacement';await v.save('set');assert.equal(v.state.value,'replacement');assert.equal(v.state.data.version,1);
 const modal=nodes(v.render()).find(n=>n.type?.name==='Modal');assert.ok(nodes(modal.props.children).some(n=>n.type==='button'&&n.props.type==='button'));
 await v.load();assert.equal(v.state.value,'replacement');assert.equal(v.state.data.version,3);
 globalThis.fetch=async(_url,options)=>{request=JSON.parse(options.body);return response({version:4,scope:'local',variables:[]});};
 v.close();v.state.deleting='HF_TOKEN';await v.save('delete');assert.deepEqual(request,{action:'delete',expectedVersion:3,name:'HF_TOKEN'});assert.equal(v.state.deleting,'');assert.equal(v.state.data.variables.length,0);
});
test('stale load and post-unmount responses cannot replace current list or restore input',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);const replies=[];
 globalThis.fetch=()=>new Promise(resolve=>replies.push(resolve));
 const v=view(),first=v.load(),second=v.load();replies[1](response(data(3)));await second;replies[0](response(data(2)));await first;assert.equal(v.state.data.version,3);
 v.edit();v.state.name='MY_API_KEY';v.state.value='synthetic-secret';const saving=v.save('set');v.componentWillUnmount();replies[2](response(data(4)));await saving;assert.equal(v.state.value,'');assert.equal(v.state.data.version,3);
});
