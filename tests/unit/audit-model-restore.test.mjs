import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {setup,USER,approve,campaign,enroll,submit,fixtureFinish} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {configureModelManagement,availableSelections} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState,configureModelConnection} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition} from '../../dist/packages/pi-adapter/model-definition.js';
import {publicationImageCatalog} from '../../dist/packages/pi-adapter/publication-image.js';
import {createModelManagementSnapshot,validateModelManagementSnapshot} from '../../dist/packages/storage/model-management-backup.js';
import {synchronousState} from '../support/ui.mjs';
import {ModelManagementPanel} from '../../dist/web/assets/model-management-view.js';
import {ComposerModelMenu} from '../../dist/web/assets/composer-model-menu.js';
const provider='restore-fixture',model='same-id',selection={provider,model,thinking:'off'};
const connection={name:'Restore fixture',baseUrl:'https://fixture.invalid/v1',api:'openai-completions',apiKey:'!FAKE_restore_key'};
const change=(s,action,fields={},key=crypto.randomUUID())=>configureModelManagement(s.app.context,USER,{expectedVersion:readModelState(s.dir).version,action,...fields},key);
const edit=(s,action,fields={})=>change(s,action,{provider,model,...fields});
async function fixture(){const s=setup();await change(s,'provider.upsert',{provider,value:connection});await edit(s,'model.upsert',{value:defaultModelDefinition(model)});s.app.sessions.configure(USER,selection);s.session=s.app.sessions.create(USER,s.project.id,{title:'Pre-restore'});s.app.sessions.configure(USER,{clear:true,expectedVersion:s.app.store.get('app-settings','global').version});return s;}
async function restore(s){await edit(s,'model.delete');await edit(s,'model.restore');await edit(s,'model.enabled',{value:{enabled:true}});}
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];

test('explicit restore preserves configuration and history, stays disabled, is CAS/idempotent and survives reopen/backup',async()=>{
 const s=await fixture();try{
  const old=JSON.stringify(s.app.sessions.get(USER,s.session.id)),before=readModelState(s.dir).connections[0].models[0],fingerprint=publicationImageCatalog(join(s.dir,'models.json'));
  await edit(s,'model.delete');
  await assert.rejects(()=>edit(s,'model.upsert',{value:defaultModelDefinition(model)}),{code:'MODEL_DELETED'});
  await assert.rejects(()=>edit(s,'model.enabled',{value:{enabled:true}}),{code:'MODEL_DELETED'});
  const command={expectedVersion:readModelState(s.dir).version,action:'model.restore',provider,model};
  await assert.rejects(()=>configureModelManagement(s.app.context,{type:'system'},command,'not-user'),{code:'PERMISSION_DENIED'});
  const result=await configureModelManagement(s.app.context,USER,command,'restore-once');
  await configureModelManagement(s.app.context,USER,command,'restore-once');
  let stored=readModelState(s.dir).connections[0].models[0];assert.equal(stored.restoreEpoch,1);assert.equal(stored.enabled,false);assert.equal(stored.deletedAt,null);assert.equal(stored.revision,before.revision+2);assert.equal(stored.order,before.order);assert.deepEqual(stored.reasoning,before.reasoning);assert.equal(result.version,command.expectedVersion+1);
  assert.equal(availableSelections(s.app.context).some(m=>m.model===model),false);assert.equal(JSON.stringify(s.app.sessions.get(USER,s.session.id)),old);
  await assert.rejects(()=>configureModelManagement(s.app.context,USER,command,'old-version'),{code:'VERSION_CONFLICT'});
  await edit(s,'model.upsert',{value:{...defaultModelDefinition(model),name:'Restored name'}});await change(s,'provider.upsert',{provider,value:{...connection,name:'Renamed connection'}});
  configureModelConnection(s.app.context,USER,{...connection,provider,expectedVersion:readModelState(s.dir).version},'legacy-provider-edit');
  assert.equal(readModelState(s.dir).connections[0].models[0].restoreEpoch,1);
  await edit(s,'model.enabled',{value:{enabled:true}});assert.notEqual(publicationImageCatalog(join(s.dir,'models.json')),fingerprint);
  assert.equal(validateModelManagementSnapshot(createModelManagementSnapshot(s.dir)).connections[0].models[0].restoreEpoch,1);
  s.app.sessions.configure(USER,selection);const fresh=s.app.sessions.create(USER,s.project.id,{title:'Restored'});assert.equal(fresh.model.restoreEpoch,1);
  assert.equal(s.app.operations.execute(USER,'session_view',{sessionId:fresh.id},{projectId:s.project.id}).session.model.restoreEpoch,1);
  assert.throws(()=>s.app.sessions.configure(USER,{...selection,restoreEpoch:100}),{code:'INVALID_INPUT'});
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.equal(s.app.sessions.get(USER,fresh.id).model.restoreEpoch,1);assert.equal(JSON.stringify(s.app.sessions.get(USER,s.session.id)),old);
 }finally{s.close();}
});

test('restore input cannot bypass deleted state, parent deletion or server-owned identity',async()=>{
 const s=await fixture();try{
  await assert.rejects(()=>edit(s,'model.restore'),{code:'MODEL_NOT_DELETED'});await assert.rejects(()=>change(s,'model.restore',{provider,model:'absent'}),{code:'MODEL_NOT_DELETED'});
  await assert.rejects(()=>edit(s,'model.upsert',{value:{...defaultModelDefinition(model),restoreEpoch:2}}),{code:'INVALID_INPUT'});
  const current=s.app.sessions.get(USER,s.session.id);assert.throws(()=>s.app.sessions.selectModel(USER,current.id,{expectedVersion:current.version,model:{...selection,restoreEpoch:2}}),{code:'INVALID_INPUT'});
  await edit(s,'model.delete');const before=readModelState(s.dir).version;
  await assert.rejects(()=>edit(s,'model.restore',{value:{enabled:true}}),{code:'INVALID_INPUT'});assert.equal(readModelState(s.dir).version,before);
  await change(s,'provider.delete',{provider});await assert.rejects(()=>edit(s,'model.restore'),{code:'MODEL_DELETED'});
 }finally{s.close();}
});

test('queued old input, HTTP admissions and old worker stay fenced after restore without erasing history',async()=>{
 const s=await fixture();try{
  const message=s.app.sessions.send(USER,s.session.id,{content:'Old queued work'}),host=new AgentHost(s.app);
  await restore(s);
  assert.throws(()=>host.claimSession(s.app.sessions.get(USER,s.session.id),message.id),{code:'MODEL_RESTORE_STALE'});
  assert.equal(s.app.store.get('message',message.id).content,'Old queued work');assert.equal(s.app.store.get('message',message.id).status,'queued');
  let row=s.app.sessions.get(USER,s.session.id);row=s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});
  const slot=s.app.agentAdmission.tryAcquire(row,1,'fixture-host');s.app.agentAdmission.markRunning(slot.id,'fixture-host',1,process.pid);const admission=s.app.store.get('agent-admission',slot.id);s.app.store.update('agent-admission',slot.id,admission.version,{httpManagedVersion:1});
  assert.throws(()=>s.app.modelHttp.acquire({admissionId:slot.id,sessionId:row.id,generation:1,ownerHost:'fixture-host'},'old-http'),{code:'MODEL_RESTORE_STALE'});
  assert.equal(host.valid({sessionId:row.id,generation:1,actor:{type:'agent',projectId:s.project.id,sessionId:row.id}}),false);
 }finally{s.close();}
});

test('old ordinary action and job permissions cannot revive even after explicit same-ID reselection',async()=>{
 const s=await fixture();try{
  s.app.sessionPermissions.initialize(s.session.id,'confirm');const prior=s.app.sessionPermissions.capture(s.session.id),input={path:'allowed.txt',content:'fixed'},source=s.app.sessionPermissions.source(s.session.id,'workspace_write',input).fingerprint;
  await restore(s);assert.throws(()=>s.app.sessionPermissions.assert(prior,false),{code:'MODEL_RESTORE_STALE'});
  assert.throws(()=>s.app.sessionPermissions.source(s.session.id,'workspace_write',input),{code:'MODEL_RESTORE_STALE'});
  let row=s.app.sessions.get(USER,s.session.id);row=s.app.sessions.selectModel(USER,row.id,{expectedVersion:row.version,model:selection});assert.equal(row.model.restoreEpoch,1);
  assert.notEqual(s.app.sessionPermissions.source(s.session.id,'workspace_write',input).fingerprint,source);
  assert.throws(()=>s.app.sessionPermissions.assert(prior,false),{code:'SESSION_PERMISSION_STALE'});assert.equal(s.app.sessionPermissions.capture(row.id).modelRestoreEpoch,1);
  assert.throws(()=>s.app.sessionPermissions.assertJob({policy:prior},{kind:'development',subjectId:'old-job',approvalId:'old-approval',manifestDigest:'old-manifest'},row.id),{code:'SESSION_PERMISSION_STALE'});
  assert.doesNotThrow(()=>s.app.sessionPermissions.assert(s.app.sessionPermissions.capture(row.id),false));
 }finally{s.close();}
});

test('branch inherits the old epoch and restored legacy control model changes catalog identity',async()=>{
 const s=await fixture();try{
  const m=s.app.sessions.send(USER,s.session.id,{content:'History'});s.app.store.update('message',m.id,m.version,{status:'completed'});let row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{state:'idle'});
  await restore(s);s.app.sessions.configure(USER,selection);const branch=s.app.sessions.branch(USER,s.session.id,m.id);assert.equal(branch.model.restoreEpoch??0,0);assert.throws(()=>new AgentHost(s.app).ensureReady(branch),{code:'MODEL_RESTORE_STALE'});
  s.app.sessions.configure(USER,{provider:'legacy-restore',model:'legacy-model',thinking:'off'});s.app.sessions.configure(USER,{clear:true,expectedVersion:s.app.store.get('app-settings','global').version});
  await change(s,'model.enabled',{provider:'legacy-restore',model:'legacy-model',value:{enabled:false}});await change(s,'model.enabled',{provider:'legacy-restore',model:'legacy-model',value:{enabled:true}});const before=publicationImageCatalog(join(s.dir,'models.json'));
  await change(s,'model.delete',{provider:'legacy-restore',model:'legacy-model'});await change(s,'model.restore',{provider:'legacy-restore',model:'legacy-model'});await change(s,'model.enabled',{provider:'legacy-restore',model:'legacy-model',value:{enabled:true}});
  assert.notEqual(publicationImageCatalog(join(s.dir,'models.json')),before);assert.equal(readModelState(s.dir).connections.find(p=>p.provider==='legacy-restore').models[0].controlOnly,true);
 }finally{s.close();}
});

test('deleted history exposes explicit disabled restore and sends no implicit upsert',async t=>{
 const s=await fixture();try{
  await edit(s,'model.delete');const view=synchronousState(new ModelManagementPanel({boot:{model:selection,models:[selection],modelVersion:1,runtime:{ready:true}},perform:async fn=>fn()}));
  const {inspectModelManagement}=await import('../../dist/packages/pi-adapter/model-management.js');view.observe(await inspectModelManagement(s.app.context,USER));
  const posts=[],previous=globalThis.fetch;globalThis.fetch=async(_url,init)=>{const body=JSON.parse(init.body);posts.push(body);return {ok:true,json:async()=>configureModelManagement(s.app.context,USER,body,'ui-restore')};};t.after(()=>globalThis.fetch=previous);
  const button=elements(view.render()).find(n=>n.type==='button'&&n.props.children==='恢复为停用');assert.ok(button);await button.props.onClick();
  assert.equal(posts.length,1);assert.equal(posts[0].action,'model.restore');assert.equal(readModelState(s.dir).connections[0].models[0].enabled,false);assert.match(view.state.message,/恢复.*停用/);
 }finally{s.close();}
});

test('old team and campaign wakeups stay blocked after explicit same-ID reselection',async()=>{
 const s=await fixture();try{
  let p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});
  const team=s.app.teams.create(USER,s.session.id,{goal:'Original model analysis',budget:4,autoSummarize:true,tasks:[{key:'a',role:'analyst',objective:'Read original material',dependencies:[]}]});approve(s.app,team.approvalId);s.app.teams.activate(USER,team.id);const claim=s.app.teams.claim(team.id);
  assert.deepEqual(s.app.sessions.get(USER,claim.attempt.sessionId).model,selection);
  s.app.teams.submit({type:'agent',projectId:s.project.id,role:'analyst',taskId:claim.task.id,attemptId:claim.attempt.id,sessionId:claim.attempt.sessionId,generation:claim.attempt.generation},{summary:'No scientific measurements',outcome:'completed',evidenceIds:[],artifactIds:[],claims:[],unresolvedQuestions:[]});
  const c=campaign(s,{autoAnalyze:true}),run=submit(s,enroll(s,c));fixtureFinish(s,run);s.app.campaigns.observe();s.app.wakeups.reconcile();const notices=s.app.wakeups.list(USER,s.project.id);assert.ok(notices.some(w=>w.sourceKind==='team'));assert.ok(notices.some(w=>w.sourceKind==='campaign-result'));
  await restore(s);for(const w of notices)assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);
  const old=s.app.sessions.get(USER,s.session.id);s.app.sessions.selectModel(USER,old.id,{expectedVersion:old.version,model:selection});
  for(const w of notices){assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);assert.equal(s.app.wakeups.get(USER,w.id).attempts,0);assert.match(s.app.wakeups.get(USER,w.id).blockReason,/模型/);}
 }finally{s.close();}
});

test('restore does not erase an admitted HTTP receipt or permit another dispatch on that identity',async()=>{
 const s=await fixture();try{
  const session=s.app.sessions.get(USER,s.session.id),row=s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+60000}),slot=s.app.agentAdmission.tryAcquire(row,1,'fixture-host');s.app.agentAdmission.markRunning(slot.id,'fixture-host',1,process.pid);const admission=s.app.store.get('agent-admission',slot.id);s.app.store.update('agent-admission',slot.id,admission.version,{httpManagedVersion:1});const identity={admissionId:slot.id,sessionId:row.id,generation:1,ownerHost:'fixture-host'};
  assert.equal(s.app.modelHttp.acquire(identity,'admitted').allowed,true);await restore(s);assert.throws(()=>s.app.modelHttp.acquire(identity,'admitted'),{code:'MODEL_RESTORE_STALE'});assert.throws(()=>s.app.modelHttp.acquire(identity,'next'),{code:'MODEL_RESTORE_STALE'});
  s.app.modelHttp.finish(identity,'admitted',{state:'succeeded',httpStatus:200});assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items[0].state,'succeeded');
 }finally{s.close();}
});

test('composer treats restored same-ID model as an explicit new selection',async()=>{
 const requests=[],row={...defaultModelDefinition(model),restoreEpoch:1,enabled:true,deletedAt:null},management={version:4,providers:[{provider,enabled:true,deletedAt:null,models:[row]}]};
 const menu=synchronousState(new ComposerModelMenu({sessionId:'session',current:selection,management,disabled:false,busy:false,locked:false,onSelect:async value=>{requests.push(value);return {id:'session',model:value};}}));
 assert.equal(menu.selected(),undefined);await menu.chooseModel(provider,model);assert.deepEqual(requests,[{...selection,restoreEpoch:1}]);assert.equal(menu.state.error,'');
});

async function httpRestoredFixture(){
 const {mkdtempSync,rmSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{createHttpServer}=await import('../../dist/apps/server/http.js');
 const dir=mkdtempSync(join(tmpdir(),'pi-model-http-restore-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0}),app=server.app,s={dir,app};
 try{
  await change(s,'provider.upsert',{provider,value:connection});await edit(s,'model.upsert',{value:defaultModelDefinition(model)});app.sessions.configure(USER,selection);
  const project=app.projects.create(USER,{name:'HTTP restore boundaries'}),old=app.sessions.create(USER,project.id,{title:'Old selected model'}),blank=app.sessions.create(USER,project.id,{title:'Old empty model binding'});
  app.sessions.configure(USER,{clear:true,expectedVersion:app.store.get('app-settings','global').version});const port=await server.listen();
  const request=async(path,body,key=crypto.randomUUID())=>{const result=await fetch(`http://127.0.0.1:${port}/api${path}`,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});return {status:result.status,value:await result.json()};};
  const manage=async(action)=>{const result=await request('/settings/model-management',{expectedVersion:readModelState(dir).version,action,provider,model,...(action==='model.enabled'?{value:{enabled:true}}:{})});assert.equal(result.status,200,JSON.stringify(result.value));return result.value;};
  await manage('model.delete');await manage('model.restore');assert.equal(readModelState(dir).connections[0].models[0].enabled,false);
  return {...s,server,project,old,blank,request,manage,async close(){await server.close();rmSync(dir,{recursive:true,force:true});}};
 }catch(error){await server.close();rmSync(dir,{recursive:true,force:true});throw error;}
}

test('HTTP restored explicit default and idle-session selections bind the server epoch after separate enable',async()=>{
 const s=await httpRestoredFixture();try{
  const defaultBody={...selection,expectedVersion:s.app.store.get('app-settings','global').version},sessionBody={model:selection,expectedVersion:s.old.version};
  for(const [path,body] of [['/settings/model',defaultBody],[`/sessions/${s.old.id}/model`,sessionBody]])assert.equal((await s.request(path,body)).status,409,'disabled restoration cannot be selected');
  await s.manage('model.enabled');
  const savedDefault=await s.request('/settings/model',defaultBody,'http-restored-default'),savedSession=await s.request(`/sessions/${s.old.id}/model`,sessionBody,'http-restored-session');
  assert.deepEqual([savedDefault.status,savedSession.status],[200,200],JSON.stringify({savedDefault,savedSession}));
  assert.deepEqual(savedDefault.value.model,{...selection,restoreEpoch:1});assert.deepEqual(savedSession.value.model,{...selection,restoreEpoch:1});
  assert.deepEqual(await s.request('/settings/model',defaultBody,'http-restored-default'),savedDefault);assert.deepEqual(await s.request(`/sessions/${s.old.id}/model`,sessionBody,'http-restored-session'),savedSession);
  for(const [path,body] of [['/settings/model',defaultBody],[`/sessions/${s.old.id}/model`,sessionBody]])assert.equal((await s.request(path,body)).value.error.code,'VERSION_CONFLICT');
 }finally{await s.close();}
});

test('HTTP bootstrap preserves restored identity for a newly created session',async()=>{
 const s=await httpRestoredFixture();try{
  await s.manage('model.enabled');s.app.sessions.configure(USER,selection);
  const created=await s.request('/sessions',{projectId:s.project.id,title:'New restored HTTP session'});assert.equal(created.status,200,JSON.stringify(created.value));assert.equal(created.value.model.restoreEpoch,1);
  const boot=await s.request('/bootstrap');assert.equal(boot.status,200);assert.deepEqual(boot.value.model,created.value.model);
  const choices=boot.value.models.filter(m=>m.provider===provider&&m.model===model);assert.ok(choices.length);assert.ok(choices.every(m=>m.restoreEpoch===1),JSON.stringify(choices));assert.ok(choices.some(m=>JSON.stringify(m)===JSON.stringify(created.value.model)));
 }finally{await s.close();}
});

test('HTTP restored selection rejects forged identity and preserves the old blank reuse fence',async()=>{
 const s=await httpRestoredFixture();try{
  await s.manage('model.enabled');s.app.sessions.configure(USER,selection);const before=JSON.stringify(s.app.sessions.get(USER,s.blank.id)),defaultVersion=s.app.store.get('app-settings','global').version;
  const reused=await s.request('/sessions',{projectId:s.project.id,reuseSessionId:s.blank.id,expectedVersion:s.blank.version});assert.equal(reused.value.error.code,'MODEL_RESTORE_STALE');assert.equal(JSON.stringify(s.app.sessions.get(USER,s.blank.id)),before);
  for(const extra of [{restoreEpoch:1},{restoreEpoch:999},{unexpected:true}]){
   const global=await s.request('/settings/model',{...selection,...extra,expectedVersion:defaultVersion});assert.equal(global.value.error.code,'INVALID_INPUT',JSON.stringify(global));
   const local=await s.request(`/sessions/${s.old.id}/model`,{expectedVersion:s.old.version,model:{...selection,...extra}});assert.equal(local.value.error.code,'INVALID_INPUT',JSON.stringify(local));
  }
  assert.equal(s.app.store.get('app-settings','global').version,defaultVersion);assert.deepEqual(s.app.sessions.get(USER,s.old.id).model,selection);assert.equal(s.app.store.list('agent-admission').length,0);assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items.length,0);
 }finally{await s.close();}
});
