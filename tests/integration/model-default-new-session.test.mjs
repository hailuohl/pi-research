import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {inspectModelManagement,configureModelManagement,prepareModelSelection} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition} from '../../dist/packages/pi-adapter/model-definition.js';
import {USER} from '../../dist/packages/domain/types.js';

const selected={provider:'zai-coding-cn',model:'glm-5.3',thinking:'off'};
async function setup(){
 const dir=mkdtempSync(join(tmpdir(),'pi-default-session-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 server.app.sessions.configure(USER,selected);await configureModelManagement(server.app.context,USER,{expectedVersion:0,action:'provider.enabled',provider:selected.provider,value:{enabled:true}},'legacy-enabled');const project=server.app.projects.create(USER,{name:'Default reasoning'}),blank=server.app.sessions.create(USER,project.id,{title:'Keep this blank'}),port=await server.listen();
 const request=async(path,body,key=crypto.randomUUID())=>{const res=await fetch(`http://127.0.0.1:${port}/api${path}`,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});return {status:res.status,value:await res.json()};};
 return {dir,server,app:server.app,project,blank,request,async close(){await server.close();rmSync(dir,{recursive:true,force:true});}};
}

test('known SDK null off default is unusable and new-session atomically corrects and reuses the blank',async()=>{
 const s=await setup();try{
  const before=s.app.store.get('app-settings','global'),view=await inspectModelManagement(s.app.context,USER),model=view.providers.find(p=>p.provider===selected.provider).models[0];
  assert.deepEqual(model.reasoning.levels.map(l=>l.id),['low','high','max']);assert.equal(model.reasoning.defaultLevel,'low');assert.equal(view.defaultUsable,false);
  const boot=await s.request('/bootstrap');assert.deepEqual(boot.value.models.filter(m=>m.provider===selected.provider).map(m=>m.thinking),['low','high','max']);
  const body={projectId:s.project.id,reuseSessionId:s.blank.id,expectedVersion:s.blank.version},result=await s.request('/sessions',body,'reuse-once');
  assert.equal(result.status,200,JSON.stringify(result.value));assert.equal(result.value.id,s.blank.id);assert.deepEqual(result.value.model,{...selected,thinking:'low'});assert.equal(result.value.title,s.blank.title);assert.equal(s.app.store.list('session',s.project.id).length,1);
  const corrected=s.app.store.get('app-settings','global');assert.equal(corrected.version,before.version+1);assert.deepEqual(corrected.model,result.value.model);
  const replay=await s.request('/sessions',body,'reuse-once');assert.deepEqual(replay,result);assert.deepEqual(s.app.store.get('app-settings','global'),corrected);
  const again=await s.request('/sessions',{...body,expectedVersion:result.value.version});assert.equal(again.value.id,s.blank.id);assert.equal(again.value.version,result.value.version);
  for(const path of ['/settings/model',`/sessions/${s.blank.id}/model`]){const bad=await s.request(path,path==='/settings/model'?{...selected,expectedVersion:corrected.version}:{model:selected,expectedVersion:again.value.version});assert.equal(bad.status,409);assert.equal(bad.value.error.code,'MODEL_REASONING_UNAVAILABLE');}
 }finally{await s.close();}
});

test('valid configured strength and a bound blank are preserved; new roots inherit the global strength',async()=>{
 const s=await setup();try{
  s.app.sessions.configure(USER,{...selected,thinking:'high'});const history=s.app.sessions.create(USER,s.project.id,{title:'Historical off'});s.app.store.update('session',history.id,history.version,{model:selected});s.app.store.create('message',s.project.id,{sessionId:history.id,role:'assistant',content:'Keep history',mode:'prompt',status:'completed'});
  const blank=s.app.store.update('session',s.blank.id,s.blank.version,{model:{...selected,thinking:'high'},workingGrantId:'fixed-grant',skillIds:['chosen-skill']});const beforeGlobal=s.app.store.get('app-settings','global'),beforeHistory=s.app.sessions.get(USER,history.id);
  const reused=await s.request('/sessions',{projectId:s.project.id,reuseSessionId:blank.id,expectedVersion:blank.version});assert.equal(reused.status,200);assert.deepEqual(reused.value,blank);assert.deepEqual(s.app.sessions.get(USER,blank.id),blank);assert.deepEqual(s.app.store.get('app-settings','global'),beforeGlobal);
  const created=await s.request('/sessions',{projectId:s.project.id,title:'New high root'});assert.equal(created.status,200);assert.deepEqual(created.value.model,{...selected,thinking:'high'});assert.notEqual(created.value.id,blank.id);assert.deepEqual(s.app.sessions.get(USER,history.id),beforeHistory);
 }finally{await s.close();}
});

test('a frozen invalid blank rejects repair and rolls back the global correction',async()=>{
 const s=await setup();try{
  const global=s.app.store.get('app-settings','global');
  for(const fields of [{workingGrantId:'fixed'},{sourceRevisionId:'fixed'},{sourceDigest:'fixed'},{executionPermission:{rootSessionId:s.blank.id}}]){
   const old=s.app.sessions.get(USER,s.blank.id);s.app.store.update('session',old.id,old.version,{workingGrantId:undefined,sourceRevisionId:undefined,sourceDigest:undefined,executionPermission:undefined,...fields});const blank=s.app.sessions.get(USER,old.id),result=await s.request('/sessions',{projectId:s.project.id,reuseSessionId:blank.id,expectedVersion:blank.version});assert.equal(result.value.error.code,'MODEL_BOUND');assert.deepEqual(s.app.store.get('app-settings','global'),global);assert.deepEqual(s.app.sessions.get(USER,blank.id),blank);
  }
  for(const kind of ['text-corpus-grant','discovery-grant','run-grant','working-grant','session-action','native-request','team']){
   const old=s.app.sessions.get(USER,s.blank.id);s.app.store.update('session',old.id,old.version,{workingGrantId:undefined,sourceRevisionId:undefined,sourceDigest:undefined,executionPermission:undefined});const blank=s.app.sessions.get(USER,old.id),binding=s.app.store.create(kind,s.project.id,kind==='team'?{rootSessionId:blank.id,state:'stopped'}:{sessionId:blank.id,state:'revoked'});
   const result=await s.request('/sessions',{projectId:s.project.id,reuseSessionId:blank.id,expectedVersion:blank.version});assert.equal(result.value.error.code,'MODEL_BOUND',kind);assert.deepEqual(s.app.store.get('app-settings','global'),global);assert.deepEqual(s.app.sessions.get(USER,blank.id),blank);s.app.store.db.prepare('DELETE FROM records WHERE id=?').run(binding.id);
  }
  assert.equal(s.app.store.list('session',s.project.id).length,1);
 }finally{await s.close();}
});

test('model preparation detects configuration, default and catalog races before any write',async()=>{
 const s=await setup();try{
  const body={projectId:s.project.id,reuseSessionId:s.blank.id,expectedVersion:s.blank.version},apply=prepared=>s.app.store.operation('prepared-new-session',crypto.randomUUID(),body,()=>s.app.sessions.createRoot(USER,s.project.id,body,prepared));
  let prepared=await prepareModelSelection(s.app.context);s.app.sessions.configure(USER,{...selected,thinking:'high'});assert.throws(()=>apply(prepared),{code:'VERSION_CONFLICT'});assert.deepEqual(s.app.sessions.get(USER,s.blank.id),s.blank);
  prepared=await prepareModelSelection(s.app.context);await configureModelManagement(s.app.context,USER,{expectedVersion:readModelState(s.dir).version,action:'provider.enabled',provider:selected.provider,value:{enabled:true}},'configuration-race');assert.throws(()=>apply(prepared),{code:'VERSION_CONFLICT'});
  prepared=await prepareModelSelection(s.app.context);writeFileSync(join(s.dir,'models.json'),'{}');assert.throws(()=>apply(prepared),{code:'VERSION_CONFLICT'});assert.equal(s.app.store.list('session',s.project.id).length,1);
 }finally{await s.close();}
});

test('messages, changed versions and admitted workers fail reuse without creating a fallback root',async()=>{
 const s=await setup();try{
  const before=s.app.store.get('app-settings','global'),body={projectId:s.project.id,reuseSessionId:s.blank.id,expectedVersion:s.blank.version};
  const worker=s.app.store.create('agent-admission',s.project.id,{sessionId:s.blank.id,state:'stopping'});let result=await s.request('/sessions',body);assert.equal(result.value.error.code,'SESSION_BUSY');s.app.store.update('agent-admission',worker.id,worker.version,{state:'released'});
  const message=s.app.store.create('message',s.project.id,{sessionId:s.blank.id,role:'system',content:'Retain cancelled input',mode:'prompt',status:'cancelled'});result=await s.request('/sessions',body);assert.equal(result.value.error.code,'SESSION_BUSY');assert.equal(s.app.store.get('message',message.id).content,'Retain cancelled input');
  s.app.sessions.rename(USER,s.blank.id,'Changed meanwhile',s.blank.version);result=await s.request('/sessions',body);assert.equal(result.value.error.code,'VERSION_CONFLICT');assert.deepEqual(s.app.store.get('app-settings','global'),before);assert.equal(s.app.store.list('session',s.project.id).length,1);
 }finally{await s.close();}
});

test('disabled or deleted models and missing restored credentials reject new-session repair',async()=>{
 const s=await setup();try{
  const initial=readModelState(s.dir),global=s.app.store.get('app-settings','global'),provider=initial.connections[0],disabledModel={...defaultModelDefinition(selected.model),enabled:false,deletedAt:null,order:0,revision:1,controlOnly:true};
  for(const [patch,code] of [[{enabled:false},'MODEL_DISABLED'],[{enabled:false,deletedAt:new Date().toISOString()},'MODEL_DISABLED'],[{models:[disabledModel]},'MODEL_DISABLED'],[{models:[{...disabledModel,deletedAt:new Date().toISOString()}]},'MODEL_DISABLED'],[{controlOnly:false,requiresCredential:true},'MODEL_CREDENTIAL_REQUIRED']]){
   writeFileSync(join(s.dir,'model-connections.json'),JSON.stringify({...initial,version:initial.version+1,connections:[{...provider,...patch}]}));const result=await s.request('/sessions',{projectId:s.project.id,reuseSessionId:s.blank.id,expectedVersion:s.blank.version});assert.equal(result.status,409);assert.equal(result.value.error.code,code);assert.deepEqual(s.app.store.get('app-settings','global'),global);assert.deepEqual(s.app.sessions.get(USER,s.blank.id),s.blank);assert.equal(s.app.store.list('session',s.project.id).length,1);
  }
 }finally{await s.close();}
});

test('empty defaults stay unconfigured and a blank can adopt an explicitly configured global model',async()=>{
 const s=await setup();try{
  s.app.sessions.configure(USER,{clear:true,expectedVersion:s.app.store.get('app-settings','global').version});const result=await s.request('/sessions',{projectId:s.project.id,title:'Configure later'});assert.equal(result.status,200);assert.deepEqual(result.value.model,{provider:'',model:'',thinking:'off'});assert.equal((await s.request('/settings/model-management')).value.defaultUsable,false);assert.equal((await s.request('/bootstrap')).value.runtime.ready,false);
  s.app.sessions.configure(USER,{...selected,thinking:'high'});const adopted=await s.request('/sessions',{projectId:s.project.id,reuseSessionId:result.value.id,expectedVersion:result.value.version});assert.equal(adopted.status,200);assert.equal(adopted.value.id,result.value.id);assert.deepEqual(adopted.value.model,{...selected,thinking:'high'});
 }finally{await s.close();}
});

test('managed custom IDs and labels survive SDK absence while unknown legacy tiers are never guessed',async()=>{
 const s=await setup();try{
  const definition={...defaultModelDefinition('custom'),reasoning:{defaultLevel:'none',levels:[{id:'none',label:'自定义不思考',piLevel:'off',parameters:{}},{id:'investigate',label:'深入研究',piLevel:'high',parameters:{}}]}};
  const edit=(action,fields)=>configureModelManagement(s.app.context,USER,{expectedVersion:readModelState(s.dir).version,action,...fields},crypto.randomUUID());await edit('provider.upsert',{provider:'managed',value:{name:'Configured',baseUrl:'https://fixture.invalid',api:'openai-responses',apiKey:'!FAKE_default_session_key'}});await edit('model.upsert',{provider:'managed',model:'custom',value:definition});s.app.sessions.configure(USER,{provider:'managed',model:'custom',thinking:'investigate'});
  const prepared=await prepareModelSelection({...s.app.context,repoRoot:join(s.dir,'no-sdk')});assert.deepEqual(prepared.resolve(s.app.sessions.model(),true),s.app.sessions.model());assert.deepEqual(prepared.resolve({provider:'managed',model:'custom',thinking:'old'},true),{provider:'managed',model:'custom',thinking:'none'});
  assert.deepEqual(prepared.resolve({provider:'unknown-fixture',model:'unknown',thinking:'off'},true),{provider:'unknown-fixture',model:'unknown',thinking:'off'});assert.throws(()=>prepared.resolve({provider:'unknown-fixture',model:'unknown',thinking:'invalid'},true),{code:'MODEL_REASONING_UNAVAILABLE'});
  const view=await inspectModelManagement(s.app.context,USER);assert.deepEqual(view.providers.find(p=>p.provider==='managed').models[0].reasoning,definition.reasoning);assert.equal(view.defaultUsable,true);
 }finally{await s.close();}
});
