import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {prepareSessionSkills} from '../../dist/packages/skills/runtime.js';
const legacy='2a5141eda3efbe5934669fbc86fe95ad72e311c97303615d0d92dcfa78aa60cd';
test('HTTP switches, uploaded deletion and baseline text preserve frozen sessions through restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-skill-manager-http-'));let server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Skill manager lifecycle'}),other=app.projects.create(USER,{name:'Other'}),port=await server.listen();
  const call=async(name,input={},key=randomUUID(),pid=p.id,sessionId)=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({projectId:pid,input,...(sessionId?{sessionId}:{})})});return {status:r.status,value:await r.json()};};
  const initial=await call('skill_package_list');assert.equal(initial.status,200);assert.equal(initial.value.builtinSkills.length,14);assert.deepEqual(initial.value.configuration.disabledBuiltinIds,[]);
  const baseline=await call('skill_bundle_configure',{expectedVersion:0,builtinBundleId:legacy,revisionIds:[]}),before=app.sessions.create(USER,p.id,{});assert.equal(baseline.status,200);await call('skill_session_select',{sessionId:before.id,expectedVersion:before.version,skillIds:[]});
  const original=(await call('research_skill_read',{skillId:'pi-research-overview'},randomUUID(),p.id,before.id)).value;
  const switched=await call('skill_bundle_configure',{expectedVersion:1,revisionIds:[],disabledBuiltinIds:['pi-research-overview']}),after=app.sessions.create(USER,p.id,{});assert.equal(switched.status,200);await call('skill_session_select',{sessionId:after.id,expectedVersion:after.version,skillIds:[]});
  assert.equal((await call('research_skill_read',{skillId:'pi-research-overview'},randomUUID(),p.id,after.id)).value.error.code,'SKILL_DISABLED');assert.deepEqual((await call('research_skill_read',{skillId:'pi-research-overview'},randomUUID(),p.id,before.id)).value,original);
  const read=await fetch(`http://127.0.0.1:${port}/api/skills/pi-research-overview?bundleId=${legacy}`);assert.equal(read.status,200);assert.equal((await read.json()).digest,original.digest);assert.equal((await fetch(`http://127.0.0.1:${port}/api/skills/pi-research-overview?bundleId=${'f'.repeat(64)}`)).status,404);
  const revision=(await call('skill_package_import',{packageId:'http-method',revisionTag:'v1',description:'Frozen HTTP method',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from('Frozen HTTP body').toString('base64')}]})).value;
  assert.equal((await call('skill_bundle_configure',{expectedVersion:2,revisionIds:[revision.id]})).value.error.code,'SKILL_NOT_APPROVED');await call('skill_package_review',{revisionId:revision.id,decision:'approved',note:'Reviewed original'});
  const configured=await call('skill_bundle_configure',{expectedVersion:2,revisionIds:[revision.id]}),pinned=app.sessions.create(USER,p.id,{});assert.deepEqual(configured.value.disabledBuiltinIds,['pi-research-overview']);await call('skill_session_select',{sessionId:pinned.id,expectedVersion:pinned.version,skillIds:[revision.packageId]});
  assert.equal((await call('skill_package_delete',{revisionId:revision.id,expectedVersion:0},randomUUID(),other.id)).value.error.code,'SCOPE_DENIED');assert.equal((await call('skill_package_delete',{revisionId:revision.id,expectedVersion:2})).value.error.code,'VERSION_CONFLICT');assert.equal((await call('skill_package_list')).value.revisions.length,1);
  const input={revisionId:revision.id,expectedVersion:3},key=randomUUID(),deleted=await call('skill_package_delete',input,key);assert.equal(deleted.status,200,JSON.stringify(deleted.value));assert.deepEqual(await call('skill_package_delete',input,key),deleted);assert.deepEqual(deleted.value.revisionIds,[]);assert.equal((await call('skill_package_list')).value.revisions.length,0);
  assert.equal((await call('skill_bundle_configure',{expectedVersion:4,bundleId:configured.value.bundleId})).value.error.code,'SKILL_DELETED');assert.equal((await call('research_skill_read',{skillId:revision.packageId},randomUUID(),p.id,pinned.id)).value.content,'Frozen HTTP body');
  const reenabled=await call('skill_bundle_configure',{expectedVersion:4,revisionIds:[],disabledBuiltinIds:[]});assert.equal(reenabled.value.bundleId,legacy);assert.equal((await call('research_skill_read',{skillId:'pi-research-overview'},randomUUID(),p.id,after.id)).value.error.code,'SKILL_DISABLED');
  await server.close();server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});const restored=server.app;assert.equal(restored.skills.catalog(USER,p.id).revisions.length,0);assert.deepEqual(restored.skills.configuration(p.id).disabledBuiltinIds,[]);const history=restored.sessions.get(USER,pinned.id);assert.equal(prepareSessionSkills(restored,history),configured.value.bundleId);assert.equal(restored.skills.bundleRead(p.id,'coordinator',history.skillBundleId,revision.packageId).content,'Frozen HTTP body');
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});
