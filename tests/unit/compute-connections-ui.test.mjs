import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {ComputeConnections} from '../../dist/web/assets/compute-connections.js';
import {IntegrationsView} from '../../dist/web/assets/integrations.js';
const text=n=>n==null||typeof n==='boolean'?'':Array.isArray(n)?n.map(text).join(' '):typeof n!=='object'?String(n):typeof n.type==='function'&&!n.type.prototype?.render?text(n.type(n.props)):text(n.props?.children);
function nodes(n,out=[]){if(!n||typeof n!=='object')return out;if(Array.isArray(n)){n.forEach(x=>nodes(x,out));return out;}out.push(n);nodes(n.props?.children,out);return out;}
const ssh=(id,status='unverified')=>({id,configurationVersion:2,host:'fixture.invalid',user:'research',port:22,status,validUntil:new Date(Date.now()+30000).toISOString(),preferences:{version:3,cpu:true,gpu:false},capabilities:{cpu:status==='verified',gpu:false},gpuDevices:[]});
const catalog={local:{platform:'fixture',hardware:{cpuModel:'Fixture CPU',logicalCpus:8,totalMemoryMb:16384,freeMemoryMb:8192,arch:'x64'},runtimes:[]},gpuTargets:[],connections:{docker:[],ssh:[ssh('cpu-server','verified'),ssh('gpu-server','unavailable')]}};
const view=(props={})=>{const v=synchronousState(new ComputeConnections({projectId:'project',active:true,...props}));v.mounted=true;v.state.catalog=catalog;return v;};

test('connector pane contains only local, Docker and SSH; protocol and preferences do not invent GPU availability',()=>{
 const v=view(),tree=nodes(v.render()),sections=tree.filter(n=>n.type==='section');assert.equal(sections.length,3);assert.deepEqual(sections.map(n=>n.props['aria-labelledby']),['local-compute-title','docker-compute-title','ssh-compute-title']);
 const rendered=text(v.render());assert.match(rendered,/Fixture CPU/);assert.match(rendered,/CPU\s+已核验/);assert.match(rendered,/GPU\s+尚未确认/);assert.match(rendered,/连接失败/);assert.doesNotMatch(rendered,/文献来源授权|其他连接能力边界|检索与阅读记录/);
 const parent=synchronousState(new IntegrationsView({projectId:'p'}));assert.ok(!nodes(parent.render()).some(n=>n.type===ComputeConnections));parent.setPanel('connectors');const component=nodes(parent.render()).find(n=>n.type===ComputeConnections);parent.setPanel('skills');const hidden=nodes(parent.render()).find(n=>n.type===ComputeConnections);assert.equal(hidden.key,component.key);assert.equal(hidden.props.active,false);
});

test('SSH resource preferences preserve the independent version and reject an empty selection without requests',async t=>{
 const original=global.fetch;t.after(()=>global.fetch=original);const requests=[],v=view();global.fetch=async(url,options)=>{const body=JSON.parse(options.body);requests.push({url,...body});return new Response(JSON.stringify(body.input.id?{id:body.input.id,version:4,cpu:true,gpu:true}:catalog));};
 await v.preferences(catalog.connections.ssh[0],'cpu',false);assert.equal(requests.length,0);assert.match(v.state.error,/至少保留/);
 await v.preferences(catalog.connections.ssh[0],'gpu',true);assert.equal(requests[0].url,'/api/operations/ssh_target_preferences_configure');assert.deepEqual(requests[0].input,{id:'cpu-server',expectedVersion:3,cpu:true,gpu:true});assert.equal(requests[0].projectId,'project');assert.equal(requests[1].url,'/api/operations/execution_environment_list');
});

test('a failed SSH probe refreshes persisted unavailable status rather than retaining a green snapshot',async t=>{
 const original=global.fetch;t.after(()=>global.fetch=original);const v=view();global.fetch=async url=>url.endsWith('ssh_target_probe')?new Response(JSON.stringify({error:{message:'SSH connection unavailable'}}),{status:409}):new Response(JSON.stringify({...catalog,connections:{docker:[],ssh:[ssh('cpu-server','unavailable')]}}));
 assert.equal(await v.mutate('ssh_target_probe',{id:'cpu-server'},'ssh:cpu-server'),false);assert.equal(v.state.catalog.connections.ssh[0].status,'unavailable');assert.match(text(v.render()),/连接失败/);assert.match(v.state.error,/SSH connection unavailable/);assert.equal(v.state.busy,'');
});

test('late catalog replies cannot cross a project switch or replace a later authoritative read',async t=>{
 const original=global.fetch;t.after(()=>global.fetch=original);const pending=[],v=view();global.fetch=async()=>new Promise(resolve=>pending.push(resolve));
 const earlier=v.load();v.refresh=async()=>{};const before=v.props;v.props={...v.props,projectId:'other'};v.componentDidUpdate(before);const latest=v.load();pending[1](new Response(JSON.stringify({...catalog,local:{...catalog.local,platform:'new'}})));await latest;pending[0](new Response(JSON.stringify(catalog)));await earlier;assert.equal(v.state.catalog.local.platform,'new');
});

test('readonly connections expose information but cannot configure, probe or save preferences',async t=>{
 const original=global.fetch;t.after(()=>global.fetch=original);global.fetch=()=>assert.fail('readonly controls must not perform mutations');const v=view({readOnly:true});assert.equal(await v.mutate('ssh_target_probe',{id:'cpu-server'},'probe'),false);await v.probeDocker();await v.edit();assert.equal(v.state.editor,null);const tree=nodes(v.render());assert.ok(tree.filter(n=>n.type==='button'&&n.props.className==='primary'&&n.props.onClick).every(n=>n.props.disabled));assert.ok(tree.filter(n=>n.type==='fieldset').every(n=>n.props.disabled));
});

test('unknown current Docker context stays empty after failure, so a retry rediscovers the real context',async t=>{
 const original=global.fetch;t.after(()=>global.fetch=original);const inputs=[],v=view();global.fetch=async(url,options)=>{const input=JSON.parse(options.body).input;if(url.endsWith('docker_connection_probe')){inputs.push(input);return new Response(JSON.stringify({context:'current',status:'unavailable',errorCode:'COMPUTE_TARGET_UNAVAILABLE'}));}return new Response(JSON.stringify({...catalog,connections:{...catalog.connections,docker:[{context:'current',status:'unavailable'}]}}));};
 await v.probeDocker();await v.probeDocker();assert.equal(v.state.context,'');assert.deepEqual(inputs,[{},{}]);assert.match(text(v.render()),/连接失败/);
});

test('local expiry updates while a probe is locked and pending probes withdraw earlier availability',async t=>{
 const beforeWindow=global.window,beforeInterval=global.setInterval,beforeClear=global.clearInterval,beforeNow=Date.now;t.after(()=>{global.window=beforeWindow;global.setInterval=beforeInterval;global.clearInterval=beforeClear;Date.now=beforeNow;});
 const callbacks=[];global.window={addEventListener(){},removeEventListener(){}};global.setInterval=(fn,ms)=>{callbacks.push({fn,ms});return callbacks.length;};global.clearInterval=()=>{};
 const v=view(),start=Date.now();Date.now=()=>start;v.refresh=async()=>{};const fresh={...ssh('fresh','verified'),validUntil:new Date(start+30000).toISOString(),gpuValidUntil:new Date(start+15000).toISOString(),capabilities:{cpu:true,gpu:true},gpuDevices:[{uuid:'fixture',name:'Device',memoryMb:1024}]};v.state.catalog={...catalog,connections:{docker:[],ssh:[fresh]}};v.componentDidMount();
 assert.match(text(v.render()),/1 块已核验/);v.state.busy='ssh:fresh';assert.doesNotMatch(text(v.render()),/连接正常|CPU\s+已核验|1 块已核验/);v.state.busy='';
 let updates=0;const set=v.setState;v.setState=(...args)=>{updates++;set(...args);};v.locked=true;Date.now=()=>start+16000;callbacks.find(c=>c.ms===1000).fn();assert.equal(updates,1);assert.match(text(v.render()),/连接正常/);assert.doesNotMatch(text(v.render()),/1 块已核验|Device/);
 Date.now=()=>start+31000;callbacks.find(c=>c.ms===1000).fn();assert.equal(updates,2);assert.doesNotMatch(text(v.render()),/连接正常|CPU\s+已核验/);assert.match(text(v.render()),/待重新核验/);v.componentWillUnmount();
});

test('failed rechecks and failed catalog refreshes cannot revive cached SSH, Docker or GPU availability',async t=>{
 const original=global.fetch;t.after(()=>global.fetch=original);global.fetch=async()=>new Response(JSON.stringify({error:{message:'unavailable'}}),{status:503});
 for(const operation of ['ssh_target_probe','ssh_target_configure','gpu_target_probe','docker_connection_probe']){
  const v=view(),deadline=new Date(Date.now()+30000).toISOString();v.state.context='fixture';v.state.catalog={...catalog,connections:{docker:[{context:'fixture',status:'verified',validUntil:deadline}],ssh:[{...ssh('fresh','verified'),gpuValidUntil:deadline,capabilities:{cpu:true,gpu:true},gpuDevices:[{uuid:'fixture',name:'Device',memoryMb:1024}]}]}};
  if(operation==='docker_connection_probe')await v.probeDocker();else await v.mutate(operation,operation==='gpu_target_probe'?{backend:'ssh',sshTargetId:'fresh'}:{id:'fresh'},'probe');
  assert.equal(v.state.busy,'');assert.match(v.state.error,/unavailable/);
  if(operation==='docker_connection_probe')assert.equal(v.state.catalog.connections.docker[0].status,'unverified');
  else{assert.equal(v.state.catalog.connections.ssh[0].capabilities.gpu,false);assert.deepEqual(v.state.catalog.connections.ssh[0].gpuDevices,[]);if(operation!=='gpu_target_probe')assert.equal(v.state.catalog.connections.ssh[0].status,'unverified');}
 }
});
