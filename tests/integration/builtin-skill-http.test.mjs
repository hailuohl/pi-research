import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {BUNDLE_ID} from '../../dist/packages/skills/manifest.js';
const legacy='6683733f868b846a6bed3434bba1ff2bdceed99aece0538ac75fe1c70bbd89f2';
test('HTTP and CLI expose explicit builtin upgrades and exact composite rollback while session reads remain pinned',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-builtin-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Builtin upgrade transport'}),oldSession=app.sessions.create(USER,p.id,{}),port=await server.listen(),headers={'Content-Type':'application/json'};
  const call=async(name,input={},sessionId)=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':randomUUID()},body:JSON.stringify({projectId:p.id,input,...(sessionId?{sessionId}:{})})});return {status:r.status,value:await r.json()};};
  const r=app.skills.import(USER,p.id,{packageId:'kept-method',revisionTag:'v1',description:'Keep this reviewed text through builtin upgrade',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from('UNIT reviewed method').toString('base64')}]},'import');app.skills.review(USER,p.id,{revisionId:r.id,decision:'approved',note:'Reviewed test text'});
  const first=await call('skill_bundle_configure',{expectedVersion:0,revisionIds:[r.id],builtinBundleId:legacy});assert.equal(first.status,200,JSON.stringify(first.value));assert.equal(first.value.builtinBundleId,legacy);
  await call('skill_session_select',{sessionId:oldSession.id,expectedVersion:oldSession.version,skillIds:['pi-research-paper',r.packageId]});
  const oldRead=await call('research_skill_read',{skillId:'pi-research-paper'},oldSession.id);assert.equal(oldRead.status,200);assert.match(oldRead.value.content,/未实现 LaTeX/);
  const unchanged=await call('skill_bundle_configure',{expectedVersion:first.value.version,revisionIds:[r.id]});assert.equal(unchanged.status,200);assert.equal(unchanged.value.bundleId,first.value.bundleId);assert.equal(unchanged.value.builtinBundleId,legacy);
  const upgraded=await call('skill_bundle_configure',{expectedVersion:unchanged.value.version,revisionIds:[r.id],builtinBundleId:BUNDLE_ID});assert.equal(upgraded.status,200,JSON.stringify(upgraded.value));assert.notEqual(upgraded.value.bundleId,first.value.bundleId);assert.deepEqual(upgraded.value.revisionIds,[r.id]);
  const newSession=app.sessions.create(USER,p.id,{});await call('skill_session_select',{sessionId:newSession.id,expectedVersion:newSession.version,skillIds:['pi-research-paper',r.packageId]});
  const currentRead=await call('research_skill_read',{skillId:'pi-research-paper'},newSession.id);assert.equal(currentRead.status,200);assert.notEqual(currentRead.value.digest,oldRead.value.digest);assert.deepEqual(await call('research_skill_read',{skillId:'pi-research-paper'},oldSession.id),oldRead);
  const rolled=await call('skill_bundle_configure',{expectedVersion:upgraded.value.version,bundleId:first.value.bundleId});assert.equal(rolled.status,200);assert.equal(rolled.value.bundleId,first.value.bundleId);assert.equal(rolled.value.builtinBundleId,legacy);
  assert.deepEqual(await call('research_skill_read',{skillId:'pi-research-paper'},newSession.id),currentRead);
  const bad=await call('skill_bundle_configure',{expectedVersion:rolled.value.version,bundleId:first.value.bundleId,builtinBundleId:BUNDLE_ID});assert.equal(bad.value.error.code,'INVALID_INPUT');
  const listed=await call('skill_package_list');assert.equal(listed.status,200);assert.ok(listed.value.builtinReleases.some(x=>x.bundleId===BUNDLE_ID&&x.current));assert.ok(listed.value.builtinReleases.some(x=>x.bundleId===legacy&&!x.current));assert.equal(listed.value.configuration.builtinBundleId,legacy);
  const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','skill_package_list','--project',p.id,'--input','{}','--data',dir],{encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),listed.value);
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});

test('pre-upgrade Registry and service-only configuration receipts replay their unchanged legacy wire shape',async()=>{
 for(const layer of ['registry','service']){
  const dir=mkdtempSync(join(tmpdir(),'pi-builtin-receipt-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
  try{
   const app=server.app,p=app.projects.create(USER,{name:'Legacy receipt fixture'}),configured=app.skills.configure(USER,p.id,{expectedVersion:0,revisionIds:[],builtinBundleId:legacy});
   const input={expectedVersion:0,revisionIds:[]},old={version:1,bundleId:legacy,revisionIds:[]},key='legacy-'+layer,scope=layer==='registry'?`operation:user:${p.id}:project`:`skill-configure:${p.id}`,request=layer==='registry'?{name:'skill_bundle_configure',input}:input;
   // Exact former wire schema, seeded only into this isolated legacy-receipt fixture.
   app.store.operation(scope,key,request,()=>old);const before=app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(scope,key),configurationBefore=app.store.get('skill-configuration',p.id);
   const port=await server.listen(),headers={'Content-Type':'application/json','Idempotency-Key':key};
   const call=async value=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/skill_bundle_configure`,{method:'POST',headers,body:JSON.stringify({projectId:p.id,input:value})});return {status:r.status,value:await r.json()};};
   assert.equal(configured.builtinBundleId,legacy);assert.deepEqual(await call(input),{status:200,value:old});assert.deepEqual(await call(input),{status:200,value:old});
   assert.deepEqual(app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(scope,key),before);assert.deepEqual(app.store.get('skill-configuration',p.id),configurationBefore);
   assert.equal((await call({...input,expectedVersion:2})).value.error.code,'IDEMPOTENCY_CONFLICT');assert.equal(app.skills.configuration(p.id).builtinBundleId,legacy);
  }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
 }
});
