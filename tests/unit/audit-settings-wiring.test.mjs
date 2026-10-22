import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {synchronousState} from '../support/ui.mjs';

const built=await build({stdin:{contents:"export {IntegrationsView} from './apps/web/src/integrations.tsx'; export {ExecutionEnvironments} from './apps/web/src/execution-environments.tsx'; export {ComputeConnections} from './apps/web/src/compute-connections.tsx'; export {SettingsView} from './apps/web/src/settings-view.tsx';",resolveDir:fileURLToPath(new URL('../../',import.meta.url)),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',logLevel:'silent'});
const module={exports:{}};
new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {IntegrationsView,ExecutionEnvironments,ComputeConnections,SettingsView}=module.exports;
const nodes=node=>Array.isArray(node)?node.flatMap(nodes):!node||typeof node!=='object'?[]:[node,...nodes(node.props?.children)];
const response=data=>({ok:true,status:200,json:async()=>data});
const catalog={local:{platform:'win32',hostId:'local',runtimes:[]},gpuTargets:[],sshTargets:[],connections:{currentDockerContext:'current',docker:[],ssh:[]}};
const settingsData={project:{id:'p',archived:false},approvals:[],discoveryGrants:[],literatureTasks:[],documentParseJobs:[]};

function withFetch(t,handler){
 const originalFetch=globalThis.fetch;
 globalThis.fetch=handler;
 t.after(()=>{globalThis.fetch=originalFetch;});
}

test('Integrations mounts the local environment editor only after connectors are visited and deactivates it when hidden',()=>{
 const parent=synchronousState(new IntegrationsView({projectId:'p',readOnly:true}));
 parent.setPanel('connectors');
 const active=nodes(parent.render()).find(node=>node.type===ExecutionEnvironments);
 assert.ok(active,'connectors panel exposes execution environment configuration');
 assert.deepEqual({projectId:active.props.projectId,active:active.props.active,readOnly:active.props.readOnly,localOnly:active.props.localOnly},{projectId:'p',active:true,readOnly:true,localOnly:true});
 parent.setPanel('skills');
 const hidden=nodes(parent.render()).find(node=>node.type===ExecutionEnvironments);
 assert.equal(hidden.props.active,false);
});

test('Settings renders connector budget before literature settings and passes project read-only state',()=>{
 const settings=synchronousState(new SettingsView({boot:{},data:settingsData,projectId:'p',readOnly:true,perform:async fn=>fn()}));
 settings.state.section='sources';
 const children=nodes(nodes(settings.render()).find(node=>node.props?.id==='settings-sources')?.props.children);
 const budget=children.find(node=>node.type?.name==='ConnectorBudget');
 const literature=children.find(node=>node.type?.name==='LiteratureView');
 assert.ok(budget,'source settings expose connector budget');
 assert.ok(literature,'source settings retain literature settings');
 assert.ok(children.indexOf(budget)<children.indexOf(literature));
 assert.equal(budget.key,'p');
 assert.equal(budget.props.projectId,'p');
 assert.equal(budget.props.readOnly,true);
});

test('ExecutionEnvironments hides SSH setup in local-only mode and rejects inactive, read-only, and SSH GPU mutations',async t=>{
 const calls=[];
 withFetch(t,async(url,init)=>{calls.push({url,method:init.method,body:init.body&&JSON.parse(init.body)});return response(catalog);});
 const originalFormData=globalThis.FormData;globalThis.FormData=class{constructor(values){this.values=values;}get(key){return this.values[key]??null;}};t.after(()=>{globalThis.FormData=originalFormData;});
 const view=synchronousState(new ExecutionEnvironments({projectId:'p',active:true,localOnly:true}));
 view.mounted=true;view.state.catalog=catalog;view.state.backend='ssh';
 const tree=nodes(view.render());
 assert.ok(!tree.some(node=>node.type==='summary'&&String(node.props.children).includes('SSH 目标')));
 const backend=tree.find(node=>node.type==='select'&&node.props['aria-label']==='核对 GPU 的执行位置');
 assert.deepEqual(nodes(backend.props.children).filter(node=>node.type==='option').map(node=>node.props.value),['local','docker']);
 assert.equal(await view.mutate('ssh_target_probe',{id:'old'},'bad'),false);
 assert.equal(await view.mutate('gpu_target_probe',{backend:'ssh',sshTargetId:'old'},'bad'),false);
 await view.probe({sshTargetId:'old',image:'python@sha256:fixed'});
 await view.configureSsh({id:'old',host:'host',user:'user',port:'22',identityFile:'C:\\key',knownHostsFile:'C:\\hosts',remoteRoot:'/jobs'});
 view.props={...view.props,readOnly:true};
 assert.equal(await view.mutate('local_runtime_configure',{id:'python'},'bad'),false);
 view.props={...view.props,readOnly:false,active:false};
 view.onFocus();
 assert.equal(await view.load(),undefined);
 assert.equal(calls.length,0);
 const previous=view.props;view.props={...view.props,active:true};view.componentDidUpdate(previous);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls.length,1,'becoming active reloads the runtime catalog');
});

test('ExecutionEnvironments serializes duplicate saves and ignores a prior project response',async t=>{
 let resolveOld;
 const calls=[];
 withFetch(t,(url,init)=>{
  calls.push({url,method:init.method,body:init.body&&JSON.parse(init.body)});
  if(url.endsWith('/operations/local_runtime_configure'))return new Promise(resolve=>{resolveOld=resolve;});
  return Promise.resolve(response({...catalog,local:{...catalog.local,hostId:'new'}}));
 });
 const view=synchronousState(new ExecutionEnvironments({projectId:'old',active:true}));
 view.mounted=true;view.state.catalog={...catalog,local:{...catalog.local,hostId:'old'}};
 const first=view.mutate('local_runtime_configure',{id:'python'},'saved');
 const duplicate=await view.mutate('local_runtime_configure',{id:'python'},'saved');
 assert.equal(duplicate,false);
 assert.equal(calls.filter(row=>row.url.endsWith('/operations/local_runtime_configure')).length,1);
 const previous=view.props;view.props={projectId:'new',active:true};view.componentDidUpdate(previous);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(view.state.catalog.local.hostId,'new');
 resolveOld(response({}));await first;
 assert.equal(view.props.projectId,'new');
 assert.equal(view.state.catalog.local.hostId,'new');
 assert.equal(view.state.error,'');
 assert.equal(calls.filter(row=>row.url.endsWith('/operations/local_runtime_configure')).length,1);
});

test('ConnectorBudget retains dirty input on refresh and saves only the versioned limit',async t=>{
 const calls=[];let reads=0,config={version:2,requestLimit:100,requestsUsed:94};
 withFetch(t,async(url,init)=>{
  calls.push({url,method:init.method,body:init.body&&JSON.parse(init.body)});
  if(init.method==='GET'){if(++reads===2)config={version:3,requestLimit:200,requestsUsed:95};return response(config);}
  config={version:4,requestLimit:250,requestsUsed:95};return response(config);
 });
 const settings=synchronousState(new SettingsView({boot:{},data:settingsData,projectId:'p',perform:async fn=>fn()}));settings.state.section='sources';
 const Budget=nodes(nodes(settings.render()).find(node=>node.props?.id==='settings-sources')?.props.children).find(node=>node.type?.name==='ConnectorBudget')?.type;
 assert.ok(Budget,'ConnectorBudget is wired into SettingsView');
 const view=synchronousState(new Budget({projectId:'p'}));view.mounted=true;
 await view.refresh();view.setLimit('250');await view.refresh();
 assert.equal(view.state.requestLimit,'250');assert.equal(view.state.version,3);assert.equal(view.state.currentLimit,200);assert.equal(view.state.requestsUsed,95);
 view.setLimit('10001');assert.equal(await view.save(),false);assert.match(view.state.error,/1 至 10000/);
 assert.equal(calls.filter(row=>row.method==='POST').length,0);
 view.setLimit('250');
 await view.save();
 assert.deepEqual(calls.at(-1).body,{expectedVersion:3,requestLimit:250});
 assert.equal(view.state.version,4);assert.equal(view.state.dirty,false);
 const text=nodes(view.render()).filter(node=>typeof node.type==='string').map(node=>node.props?.children).flat(Infinity).filter(x=>typeof x==='string').join(' ');
 assert.match(text,/HTTP 尝试/);assert.match(text,/不会每天自动重置/);
});

test('ConnectorBudget preserves a conflicting draft and asks for an explicit refresh',async t=>{
 let reads=0;const error={error:{code:'VERSION_CONFLICT',message:'配置版本已变化'}};
 withFetch(t,async(url,init)=>init.method==='GET'?(reads++,response({version:reads,requestLimit:100,requestsUsed:5})):({ok:false,status:409,json:async()=>error}));
 const settings=synchronousState(new SettingsView({boot:{},data:settingsData,perform:async fn=>fn()}));settings.state.section='sources';const tree=nodes(settings.render());
 assert.ok(tree.some(node=>node.type?.name==='ConnectorBudget'),'SettingsView exposes the budget editor');
 const Budget=tree.find(node=>node.type?.name==='ConnectorBudget').type,view=synchronousState(new Budget({projectId:'p'}));view.mounted=true;
 await view.refresh();view.setLimit('321');await view.save();
 assert.equal(view.state.requestLimit,'321');
 assert.match(view.state.error,/版本已变化.*刷新.*核对/);
 assert.equal(reads,1,'conflict does not trigger an implicit refresh or retry');
});

test('ConnectorBudget ignores late project and unmount reads and blocks archived writes',async t=>{
 const pending=[],calls=[];
 withFetch(t,(url,init)=>{calls.push({url,method:init.method});return new Promise(resolve=>pending.push(resolve));});
 const Budget=(()=>{const settings=synchronousState(new SettingsView({boot:{},data:settingsData,perform:async fn=>fn()}));settings.state.section='sources';return nodes(nodes(settings.render()).find(node=>node.props?.id==='settings-sources')?.props.children).find(node=>node.type?.name==='ConnectorBudget').type;})();
 const view=synchronousState(new Budget({projectId:'old',readOnly:true}));view.mounted=true;
 const old=view.refresh();const previous=view.props;view.props={projectId:'new',readOnly:true};view.componentDidUpdate(previous);
 pending[1](response({version:2,requestLimit:200,requestsUsed:20}));pending[0](response({version:1,requestLimit:100,requestsUsed:10}));await old;
 assert.equal(view.state.version,2);assert.equal(view.state.currentLimit,200);assert.equal(await view.save(),false);
 assert.ok(calls.every(call=>call.method==='GET'));
 const unmounted=synchronousState(new Budget({projectId:'p'}));unmounted.mounted=true;const late=unmounted.refresh();unmounted.componentWillUnmount();pending[2](response({version:3,requestLimit:300,requestsUsed:30}));await late;
 assert.equal(unmounted.state.loaded,false);
});

test('SSH setup timeout is treated as unconfirmed and reconciles without retrying the POST',async t=>{
 const calls=[],timeouts=[],originalTimeout=AbortSignal.timeout;
 AbortSignal.timeout=ms=>{timeouts.push(ms);return new AbortController().signal;};
 t.after(()=>{AbortSignal.timeout=originalTimeout;});
 withFetch(t,async(url,init)=>{
  calls.push({url,method:init.method,body:init.body&&JSON.parse(init.body)});
  if(url.endsWith('/operations/ssh_target_setup'))throw new TypeError('fetch failed');
  return response({...catalog,connections:{...catalog.connections,ssh:[{id:'gpu',configurationVersion:1,status:'unverified',setup:'unknown',managed:true,preferences:{version:1,cpu:true,gpu:false},capabilities:{cpu:false,gpu:false},gpuDevices:[]}]}});
 });
 const view=synchronousState(new ComputeConnections({projectId:'p',active:true}));view.mounted=true;
 await view.mutate('ssh_target_setup',{id:'gpu',expectedVersion:1},'prepared');
 assert.equal(calls.filter(row=>row.url.endsWith('/operations/ssh_target_setup')).length,1);
 assert.ok(timeouts.includes(300000));assert.equal(view.state.catalog.connections.ssh[0].setup,'unknown');
 assert.match(view.state.notice,/结果未确认.*查看原目标状态.*不要重复创建\/安装/);
 assert.equal(await view.mutate('ssh_target_setup',{id:'gpu',expectedVersion:1},'prepared'),false);
 assert.ok(!nodes(view.render()).some(node=>node.type==='button'&&node.props.children==='重试环境准备'));
 assert.equal(calls.filter(row=>row.url.endsWith('/operations/ssh_target_setup')).length,1);
});

test('failed setup status reads keep only that target blocked until an explicit status resolves it',async t=>{
 const calls=[];let reads=0;const setupPosts=new Map();
 const target=(id,setup)=>({id,configurationVersion:1,status:'unverified',setup,managed:true,preferences:{version:1,cpu:true,gpu:false},capabilities:{cpu:false,gpu:false},gpuDevices:[]});
 const catalogWith=(ssh)=>({...catalog,connections:{...catalog.connections,ssh}});
 withFetch(t,async(url,init)=>{
  const body=init.body&&JSON.parse(init.body);calls.push({url,body});
  if(url.endsWith('/operations/ssh_target_setup')){const id=body.input.id,count=(setupPosts.get(id)??0)+1;setupPosts.set(id,count);if((id==='gpu'&&count===1)||(id==='other'&&count===1))throw new DOMException('timed out','TimeoutError');return response({});}
  if(url.endsWith('/operations/execution_environment_list')){if(++reads<=2)return {ok:false,status:503,json:async()=>({error:{code:'STATUS_UNAVAILABLE',message:'状态读取失败'}})};return response(catalogWith([target('gpu','idle'),target('other','unknown')]));}
  throw Error('unexpected request '+url);
 });
 const view=synchronousState(new ComputeConnections({projectId:'p',active:true}));view.mounted=true;view.state.catalog=catalogWith([target('gpu','idle'),target('other','idle')]);
 await view.mutate('ssh_target_setup',{id:'gpu',expectedVersion:1},'prepared');
 assert.equal(setupPosts.get('gpu'),1);assert.equal(view.state.catalog.connections.ssh[0].setup,'idle');
 assert.match(view.state.notice,/结果未确认.*查看原目标状态.*不要重复创建\/安装/);assert.match(view.state.error,/状态读取失败/);
 const setupButtons=nodes(view.render()).filter(node=>node.type==='button'&&node.props.children==='重试环境准备');
 assert.equal(setupButtons[0].props.disabled,true);assert.equal(setupButtons[1].props.disabled,false);
 assert.equal(await view.mutate('ssh_target_setup',{id:'gpu',expectedVersion:1},'prepared'),false);
 assert.equal(setupPosts.get('gpu'),1);
 await view.mutate('ssh_target_setup',{id:'other',expectedVersion:1},'prepared');
 assert.equal(setupPosts.get('other'),1,'an unresolved setup for gpu does not lock a different target');
 await view.load();
 assert.deepEqual(view.state.catalog.connections.ssh.map(target=>target.setup),['idle','unknown']);
 assert.equal(await view.mutate('ssh_target_setup',{id:'gpu',expectedVersion:1},'prepared'),true,'an explicit idle status releases the local pending guard');
 assert.equal(setupPosts.get('gpu'),2);
 assert.equal(await view.mutate('ssh_target_setup',{id:'other',expectedVersion:1},'prepared'),false,'an explicit unknown status remains blocked');
 assert.equal(setupPosts.get('other'),1);
});

test('project changes clear old setup guards and stale work cannot release the new project lock',async t=>{
 const calls=[];let delayOldRead=false,resolveOldRead,resolveOtherPost,p2Reads=0;const setupPosts=new Map();
 const target=(setup)=>({id:'gpu',configurationVersion:1,status:'unverified',setup,managed:true,preferences:{version:1,cpu:true,gpu:false},capabilities:{cpu:false,gpu:false},gpuDevices:[]});
 const catalogFor=(projectId,setup)=>({...catalog,local:{...catalog.local,hostId:projectId},connections:{...catalog.connections,ssh:[target(setup)]}});
 withFetch(t,async(url,init)=>{
  const body=init.body&&JSON.parse(init.body),projectId=body?.projectId;calls.push({url,body});
  if(url.endsWith('/operations/ssh_target_setup')){const id=body.input.id;setupPosts.set(`${projectId}:${id}`,(setupPosts.get(`${projectId}:${id}`)??0)+1);if(projectId==='new'&&id==='other')return new Promise(resolve=>{resolveOtherPost=resolve;});throw new TypeError('fetch failed');}
  if(url.endsWith('/operations/execution_environment_list')){
   if(projectId==='old'&&delayOldRead)return new Promise(resolve=>{resolveOldRead=resolve;});
   if(projectId==='new'&&++p2Reads===1)return response(catalogFor('new','idle'));
   return {ok:false,status:503,json:async()=>({error:{code:'STATUS_UNAVAILABLE',message:'状态读取失败'}})};
  }
  throw Error('unexpected request '+url);
 });
 const view=synchronousState(new ComputeConnections({projectId:'old',active:true}));view.mounted=true;view.state.catalog=catalogFor('old','idle');
 delayOldRead=true;const oldMutation=view.mutate('ssh_target_setup',{id:'gpu',expectedVersion:1},'prepared');
 await new Promise(resolve=>setImmediate(resolve));assert.ok(resolveOldRead,'the old mutation is waiting on its status read');
 const previous=view.props;view.props={...view.props,projectId:'new'};view.componentDidUpdate(previous);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(view.state.catalog.local.hostId,'new');
 await view.mutate('ssh_target_setup',{id:'gpu',expectedVersion:1},'prepared');
 assert.equal(setupPosts.get('new:gpu'),1,'the old project pending guard is cleared on project change');
 const otherMutation=view.mutate('ssh_target_setup',{id:'other',expectedVersion:1},'prepared');
 await new Promise(resolve=>setImmediate(resolve));assert.ok(resolveOtherPost,'the new project owns the current lock');
 resolveOldRead(response(catalogFor('old','idle')));await oldMutation;
 assert.equal(view.state.catalog.local.hostId,'new');
 assert.equal(await view.mutate('ssh_target_setup',{id:'third',expectedVersion:1},'prepared'),false,'old work cannot release the new project lock');
 assert.equal(setupPosts.get('new:third')??0,0);
 resolveOtherPost(response({}));await otherMutation;
 assert.equal(setupPosts.get('new:other'),1);
});

test('SSH confirmation timeout keeps the confirmed challenge and uses the long timeout',async t=>{
 const calls=[],timeouts=[],originalTimeout=AbortSignal.timeout;
 AbortSignal.timeout=ms=>{timeouts.push(ms);return new AbortController().signal;};
 t.after(()=>{AbortSignal.timeout=originalTimeout;});
 withFetch(t,async(url,init)=>{calls.push({url,method:init.method});if(url.endsWith('/operations/ssh_target_confirm'))throw new DOMException('timed out','TimeoutError');return {ok:false,status:503,json:async()=>({error:{code:'STATUS_UNAVAILABLE',message:'状态读取失败'}})};});
 const view=synchronousState(new ComputeConnections({projectId:'p',active:true}));view.mounted=true;
 const challenge={challengeId:'challenge',id:'gpu',host:'host',port:22,user:'user',remoteRoot:'/jobs',keyType:'ed25519',fingerprint:'SHA256:verified',expiresAt:new Date(Date.now()+60000).toISOString()};
 view.state.challenge=challenge;view.state.fingerprintConfirmed=true;
 await view.confirmFingerprint();
 assert.equal(calls.filter(row=>row.url.endsWith('/operations/ssh_target_confirm')).length,1);
 assert.ok(timeouts.includes(300000));assert.equal(view.state.challenge,challenge);assert.equal(view.state.fingerprintConfirmed,true);
 assert.equal(view.state.confirmationUnknown,true);
 assert.match(view.state.notice,/结果未确认.*查看原目标状态.*不要重复创建\/安装/);
 assert.ok(calls.some(row=>row.url.endsWith('/operations/execution_environment_list')),'the existing status endpoint is queried after an ambiguous result');
 await view.confirmFingerprint();
 assert.equal(calls.filter(row=>row.url.endsWith('/operations/ssh_target_confirm')).length,1,'an ambiguous confirmation cannot be repeated');
});

test('SSH challenge and probe get the bounded single-stage timeout',async t=>{
 const timeouts=[],originalTimeout=AbortSignal.timeout;AbortSignal.timeout=ms=>{timeouts.push(ms);return new AbortController().signal;};t.after(()=>{AbortSignal.timeout=originalTimeout;});
 withFetch(t,async(url,init)=>response(url.endsWith('/operations/ssh_target_challenge')?{challengeId:'c',id:'gpu',host:'host',port:22,user:'user',remoteRoot:'/jobs',keyType:'ed25519',fingerprint:'SHA256:x',expiresAt:new Date(Date.now()+60000).toISOString()}:catalog));
 const view=synchronousState(new ComputeConnections({projectId:'p',active:true}));view.mounted=true;view.state.editor={id:'',version:0,host:'',port:22,user:'',remoteRoot:'/jobs',identityFile:'',knownHostsFile:''};
 const form={id:'gpu',host:'host',port:'22',user:'user',remoteRoot:'/jobs',identityFile:'C:\\key'};
 const originalFormData=globalThis.FormData;globalThis.FormData=class{constructor(){this.values=form;}get(key){return this.values[key]??null;}};t.after(()=>{globalThis.FormData=originalFormData;});
 await view.save({});await view.mutate('ssh_target_probe',{id:'gpu'},'checked');
 assert.equal(timeouts.filter(ms=>ms===75000).length,2);
});
