import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {ExecutionEnvironments} from '../../dist/web/assets/execution-environments.js';
const catalog={local:{platform:'fixture',hostId:'host',runtimes:[{id:'python',version:3,runtimeVersion:'Python 3.14'}]},gpuTargets:[],sshTargets:[{id:'remote',version:2,gpuProtocol:true}]};

test('execution settings discard stale catalog responses on project changes',async()=>{
 const original=global.fetch,pending=[];global.fetch=async()=>new Promise(resolve=>pending.push(resolve));
 const v=synchronousState(new ExecutionEnvironments({projectId:'old'}));v.mounted=true;
 try{const old=v.load();v.props={projectId:'new'};const current=v.load();pending[1](new Response(JSON.stringify(catalog)));await current;pending[0](new Response(JSON.stringify({...catalog,local:{...catalog.local,hostId:'old'}})));await old;assert.equal(v.state.catalog.local.hostId,'host');}
 finally{global.fetch=original;}
});

test('GPU probes submit only selected backend fields and local setup uses the saved version',async()=>{
 const original=global.FormData;global.FormData=class {constructor(values){this.values=values;}get(key){return this.values[key]??null;}};
 const v=synchronousState(new ExecutionEnvironments({projectId:'project'})),calls=[];v.state.catalog=catalog;v.mutate=async(name,input)=>calls.push({name,input});
 try{await v.probe({localRuntimeId:'python',context:'stale',image:'stale',sshTargetId:'stale'});assert.deepEqual(calls.pop().input,{backend:'local',localRuntimeId:'python'});
 v.state.backend='docker';await v.probe({context:'',image:'python@sha256:fixed',sshTargetId:'stale'});assert.deepEqual(calls.pop().input,{backend:'docker',image:'python@sha256:fixed'});
 v.state.backend='ssh';await v.probe({context:'stale',sshTargetId:'remote',image:'python@sha256:fixed'});assert.deepEqual(calls.pop().input,{backend:'ssh',sshTargetId:'remote',image:'python@sha256:fixed'});
 await v.configureRuntime({id:'python',executable:'python'});assert.deepEqual(calls.pop().input,{id:'python',executable:'python',expectedVersion:3});
 }finally{global.FormData=original;}
});
