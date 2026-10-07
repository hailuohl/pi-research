import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {ProjectCreationModal,GitHubSettings} from '../../dist/web/assets/github-controls.js';
const ready={ready:true,gitInstalled:true,cliInstalled:true,version:'2.101.0',account:{id:42,login:'example'},state:'ready',message:'已就绪',checkedAt:'2026-10-07T00:00:00Z'};
const local={version:0,enabled:false,state:'local',pendingCount:0,retryable:false};
const fields=()=>{const fd=new FormData();fd.set('name','材料筛选研究');fd.set('description','');fd.set('template','empty');return fd;};
function nodes(node,out=[]){if(Array.isArray(node)){for(const x of node)nodes(x,out);}else if(node&&typeof node==='object'){out.push(node);nodes(node.props?.children,out);}return out;}

test('new project stays local without gh, gates opt-in and keeps one request identity across retries',async()=>{
 const calls=[],v=synchronousState(new ProjectCreationModal({busy:false,onClose(){},onCreate:async(input,key)=>calls.push({input,key})}));
 const checkbox=()=>nodes(v.render()).find(n=>n.type==='input'&&n.props.type==='checkbox');
 assert.equal(checkbox().props.checked,false);assert.equal(checkbox().props.disabled,true);
 await v.submit(fields());await v.submit(fields());assert.equal(calls.length,2);assert.ok(!('github'in calls[0].input));assert.equal(calls[0].key,calls[1].key);
 v.state.upload=true;await v.submit(fields());assert.equal(calls.length,2);assert.match(v.state.error,/尚未就绪/);
 v.state.status=ready;v.changed();assert.equal(checkbox().props.disabled,false);await v.submit(fields());assert.deepEqual(calls[2].input.github,{enabled:true,expectedAccountId:42});assert.notEqual(calls[2].key,calls[1].key);
});

test('GitHub settings never replace a newly selected project with a late status response',async()=>{
 const original=global.fetch,pending=[];global.fetch=async(url)=>new Promise(resolve=>pending.push({url,resolve}));
 const v=synchronousState(new GitHubSettings({projectId:'first'}));v.mounted=true;
 try{const first=v.loadProject();v.props={projectId:'second'};const second=v.loadProject();assert.match(pending[0].url,/first\/github$/);assert.match(pending[1].url,/second\/github$/);
 pending[1].resolve(new Response(JSON.stringify({...local,version:2})));await second;
 pending[0].resolve(new Response(JSON.stringify({...local,version:1})));await first;assert.equal(v.state.project.version,2);
 }finally{v.mounted=false;clearTimeout(v.timer);global.fetch=original;}
});

test('CLI state cannot be replaced by an older account check or a response after unmount',async()=>{
 const original=global.fetch,pending=[];global.fetch=async()=>new Promise(resolve=>pending.push(resolve));
 const v=synchronousState(new ProjectCreationModal({busy:false,onClose(){},onCreate:async()=>{}}));v.mounted=true;
 try{const first=v.loadStatus(),second=v.loadStatus();pending[1](new Response(JSON.stringify(ready)));await second;pending[0](new Response(JSON.stringify({...ready,account:{id:7,login:'old'}})));await first;assert.equal(v.state.status.account.id,42);
 const third=v.loadStatus();v.mounted=false;pending[2](new Response(JSON.stringify({...ready,ready:false})));await third;assert.equal(v.state.status.ready,true);
 }finally{global.fetch=original;}
});
