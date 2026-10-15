import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {prepareSessionSkills} from '../../dist/packages/skills/runtime.js';
const input=(body='Original uploaded text')=>({packageId:'auto-http-method',revisionTag:body,description:'HTTP auto-enable fixture',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from(body).toString('base64')}]});
const snapshot=app=>({records:app.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all(),events:app.store.db.prepare('SELECT * FROM events ORDER BY seq').all(),operations:app.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all()});

test('HTTP upload enables new sessions, retains pinned sessions and durably replays upload/enable without granting execution',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-auto-http-'));let server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0}),port;
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Auto skill transport'}),other=app.projects.create(USER,{name:'Other project'});port=await server.listen();
  const authorityRecords=()=>snapshot(app).records.filter(r=>!['skill-package-revision','skill-review','skill-configuration','skill-bundle','project','session'].includes(r.kind)),authorityBefore=authorityRecords();assert.deepEqual(authorityBefore.map(r=>r.kind),['agent-capacity','model-http-capacity']);
  const call=async(name,value={},key=randomUUID(),projectId=p.id,sessionId)=>{const response=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({projectId,input:value,...(sessionId?{sessionId}:{})})});return {status:response.status,value:await response.json()};};
  const payload={...input(),requirements:{tools:['unavailable-tool'],backends:['unconfigured-backend'],artifactIds:['ungranted-data']}},key='u'.repeat(200),first=await call('skill_package_upload',payload,key);assert.equal(first.status,200,JSON.stringify(first.value));const {revision,configuration}=first.value;
  assert.deepEqual(configuration.revisionIds,[revision.id]);assert.deepEqual(configuration.disabledBuiltinIds,[]);assert.deepEqual((await call('skill_package_list')).value.configuration,configuration);
  const oldSession=app.sessions.create(USER,p.id,{});assert.equal(prepareSessionSkills(app,oldSession),configuration.bundleId);const selected=await call('skill_session_select',{sessionId:oldSession.id,expectedVersion:oldSession.version,skillIds:[payload.packageId]});assert.equal(selected.status,200);assert.equal(selected.value.ready,false);assert.deepEqual(new Set(selected.value.missing.map(x=>x.kind)),new Set(['tool','backend','artifact']));
  assert.equal((await call('research_skill_read',{skillId:payload.packageId},randomUUID(),p.id,oldSession.id)).value.content,'Original uploaded text');
  const second=await call('skill_package_upload',input('Replacement text'));assert.equal(second.status,200,JSON.stringify(second.value));const newSession=app.sessions.create(USER,p.id,{});assert.equal(prepareSessionSkills(app,newSession),second.value.configuration.bundleId);
  assert.equal((await call('research_skill_read',{skillId:payload.packageId},randomUUID(),p.id,newSession.id)).value.content,'Replacement text');assert.equal((await call('research_skill_read',{skillId:payload.packageId},randomUUID(),p.id,oldSession.id)).value.content,'Original uploaded text');
  assert.deepEqual(await call('skill_package_upload',payload,key),first);assert.equal((await call('skill_package_upload',input('Conflict'),key)).value.error.code,'IDEMPOTENCY_CONFLICT');assert.equal(app.store.list('skill-package-revision',p.id).length,2);
  const off=await call('skill_bundle_configure',{expectedVersion:second.value.configuration.version,revisionIds:[]});assert.equal(off.status,200);const enableInput={revisionId:revision.id,expectedVersion:off.value.version},enableKey=randomUUID(),enabled=await call('skill_package_enable',enableInput,enableKey);assert.equal(enabled.status,200,JSON.stringify(enabled.value));assert.deepEqual(enabled.value.configuration.revisionIds,[revision.id]);assert.deepEqual(await call('skill_package_enable',enableInput,enableKey),enabled);
  assert.equal((await call('skill_package_enable',{revisionId:revision.id,expectedVersion:0},randomUUID(),other.id)).value.error.code,'SCOPE_DENIED');const beforeStale=snapshot(app);assert.equal((await call('skill_package_enable',enableInput)).value.error.code,'VERSION_CONFLICT');assert.deepEqual(snapshot(app),beforeStale);
  assert.deepEqual(authorityRecords(),authorityBefore,'upload and enable must not add or change any authority, grant, model or execution records');
  const active=app.store.get('session',newSession.id);app.store.update('session',active.id,active.version,{generation:1,state:'running',leaseUntil:Date.now()+10000});const agent={type:'agent',projectId:p.id,sessionId:active.id,role:'coordinator',generation:1};
  for(const [name,value] of [['skill_package_upload',input('Agent upload')],['skill_package_enable',{revisionId:revision.id,expectedVersion:enabled.value.configuration.version}]])await assert.rejects(()=>new ToolDispatcher(app).execute(agent,name,value,randomUUID()),{code:'TOOL_DENIED'});
  assert.equal(app.store.list('operation-pending',p.id).length,0);for(const row of app.store.db.prepare('SELECT response FROM operations').all())assert.ok(!row.response.includes(payload.files[0].contentBase64),'raw input must not enter receipts');
  const archived=app.store.get('project',p.id);app.store.update('project',p.id,archived.version,{archived:true});const archivedState=snapshot(app);assert.equal((await call('skill_package_upload',input('Archived upload'))).value.error.code,'PROJECT_ARCHIVED');assert.equal((await call('skill_package_enable',{revisionId:revision.id,expectedVersion:enabled.value.configuration.version})).value.error.code,'PROJECT_ARCHIVED');assert.deepEqual(snapshot(app),archivedState);
  await server.close();server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});port=await server.listen();assert.deepEqual(await call('skill_package_upload',payload,key),first);assert.deepEqual(await call('skill_package_enable',enableInput,enableKey),enabled);assert.equal(server.app.store.list('skill-package-revision',p.id).length,2);assert.deepEqual(server.app.skills.configuration(p.id),enabled.value.configuration);assert.equal(server.app.skills.bundleRead(p.id,'coordinator',configuration.bundleId,payload.packageId).content,'Original uploaded text');
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});

test('final HTTP operation event failure rolls back all upload effects and permits retry with the same key',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-auto-http-rollback-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Atomic upload'}),port=await server.listen(),key=randomUUID();
  const call=async()=>{const response=await fetch(`http://127.0.0.1:${port}/api/operations/skill_package_upload`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({projectId:p.id,input:input()})});return {status:response.status,value:await response.json()};};
  const before=snapshot(app),event=app.store.event;app.store.event=function(pid,type,payload){const result=event.call(this,pid,type,payload);if(type==='operation.executed'&&payload.tool==='skill_package_upload')throw new Error('injected final operation event');return result;};
  const failed=await call();assert.equal(failed.status,500);assert.equal(failed.value.error.code,'INTERNAL_ERROR');assert.deepEqual(snapshot(app),before);app.store.event=event;
  const retried=await call();assert.equal(retried.status,200,JSON.stringify(retried.value));assert.deepEqual(retried.value.configuration.revisionIds,[retried.value.revision.id]);assert.equal(app.store.list('skill-review',p.id).length,1);assert.equal(app.store.list('operation-pending',p.id).length,0);
  const after=snapshot(app);assert.deepEqual(await call(),retried);assert.deepEqual(snapshot(app),after);
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
