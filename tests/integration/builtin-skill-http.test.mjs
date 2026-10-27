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
test('HTTP and CLI expose pinned builtin reads and retired-skill boundaries while custom revisions persist',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-builtin-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Builtin transport'}),session=app.sessions.create(USER,p.id,{}),port=await server.listen(),headers={'Content-Type':'application/json'};
  const call=async(name,input={},sessionId)=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':randomUUID()},body:JSON.stringify({projectId:p.id,input,...(sessionId?{sessionId}:{})})});return {status:r.status,value:await r.json()};};
  const r=app.skills.import(USER,p.id,{packageId:'kept-method',revisionTag:'v1',description:'Keep this reviewed text through reconfiguration',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from('UNIT reviewed method').toString('base64')}]},'import');app.skills.review(USER,p.id,{revisionId:r.id,decision:'approved',note:'Reviewed test text'});
  const configured=await call('skill_bundle_configure',{expectedVersion:0,revisionIds:[r.id]});assert.equal(configured.status,200,JSON.stringify(configured.value));assert.equal(configured.value.builtinBundleId,BUNDLE_ID);assert.deepEqual(configured.value.revisionIds,[r.id]);
  await call('skill_session_select',{sessionId:session.id,expectedVersion:session.version,skillIds:['pi-research-paper','pi-research-reports','pi-research-lit-review',r.packageId]});
  const paper=await call('research_skill_read',{skillId:'pi-research-paper'},session.id);const expected=app.skills.read('coordinator','pi-research-paper');assert.equal(paper.status,200);assert.equal(paper.value.digest,expected.digest);assert.equal(paper.value.content,expected.content);
  const custom=await call('research_skill_read',{skillId:r.packageId},session.id);assert.equal(custom.status,200);assert.equal(custom.value.content,'UNIT reviewed method');
  const retired=await call('research_skill_read',{skillId:'pi-research-instances'},session.id);assert.equal(retired.status,404);assert.equal(retired.value.error.code,'SKILL_NOT_FOUND');
  for(const [skillId,resource] of [['pi-research-reports','references/fixed-report.md'],['pi-research-lit-review','references/document-reading.md'],['pi-research-lit-review','references/discovery-permissions.md'],['pi-research-paper','references/build-and-review.md']]){
   const input={skillId,resource},current=await call('research_skill_read',input,session.id),serviceExpected=app.skills.read('coordinator',skillId,resource);
   assert.equal(current.status,200);assert.equal(current.value.digest,serviceExpected.digest);assert.equal(current.value.content,serviceExpected.content);
  }
  const kept=await call('skill_bundle_configure',{expectedVersion:configured.value.version,revisionIds:[r.id]});assert.equal(kept.status,200);assert.equal(kept.value.bundleId,configured.value.bundleId);assert.deepEqual(kept.value.revisionIds,[r.id]);
  assert.deepEqual(await call('research_skill_read',{skillId:r.packageId},session.id),custom);
  const listed=await call('skill_package_list');assert.equal(listed.status,200);assert.ok(listed.value.builtinReleases.some(x=>x.bundleId===BUNDLE_ID&&x.current));assert.equal(listed.value.builtinReleases.filter(x=>!x.current).length,0);assert.equal(listed.value.configuration.builtinBundleId,BUNDLE_ID);assert.ok(!listed.value.builtinSkills.some(e=>e.id==='pi-research-instances'));
  const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','skill_package_list','--project',p.id,'--input','{}','--data',dir],{encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),listed.value);
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});

test('Registry and service configuration receipts replay their unchanged stored wire shape',async()=>{
 for(const layer of ['registry','service']){
  const dir=mkdtempSync(join(tmpdir(),'pi-builtin-receipt-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
  try{
   const app=server.app,p=app.projects.create(USER,{name:'Receipt fixture'}),configured=app.skills.configure(USER,p.id,{expectedVersion:0,revisionIds:[]});
   const input={expectedVersion:0,revisionIds:[]},old={version:1,bundleId:BUNDLE_ID,revisionIds:[]},key='receipt-'+layer,scope=layer==='registry'?`operation:user:${p.id}:project`:`skill-configure:${p.id}`,request=layer==='registry'?{name:'skill_bundle_configure',input}:input;
   // Exact former wire schema, seeded only into this isolated receipt fixture.
   app.store.operation(scope,key,request,()=>old);const before=app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(scope,key),configurationBefore=app.store.get('skill-configuration',p.id);
   const port=await server.listen(),headers={'Content-Type':'application/json','Idempotency-Key':key};
   const call=async value=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/skill_bundle_configure`,{method:'POST',headers,body:JSON.stringify({projectId:p.id,input:value})});return {status:r.status,value:await r.json()};};
   assert.equal(configured.builtinBundleId,BUNDLE_ID);assert.deepEqual(await call(input),{status:200,value:old});assert.deepEqual(await call(input),{status:200,value:old});
   assert.deepEqual(app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(scope,key),before);assert.deepEqual(app.store.get('skill-configuration',p.id),configurationBefore);
   assert.equal((await call({...input,expectedVersion:2})).value.error.code,'IDEMPOTENCY_CONFLICT');assert.equal(app.skills.configuration(p.id).builtinBundleId,BUNDLE_ID);
  }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
 }
});
