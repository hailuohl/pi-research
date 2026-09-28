import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve,sep} from 'node:path';import {randomUUID} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';import {USER} from '../../dist/packages/domain/types.js';import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
test('owner skill operations have closed HTTP/CLI contracts, frozen session reads and no automatic grant to agents',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-skill-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Skill transport'}),s=app.sessions.create(USER,p.id,{}),port=await server.listen(),headers={'Content-Type':'application/json',Authorization:`Bearer ${server.token}`};
  const call=async(name,input={},key=randomUUID(),sessionId)=>{const response=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({projectId:p.id,input,...(sessionId?{sessionId}:{})})});return {status:response.status,value:await response.json()};};
  const input={packageId:'transport-method',revisionTag:'v1',description:'Transport fixture',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from('# Original 中文 skill\n').toString('base64')}]};
  const key=randomUUID(),created=await call('skill_package_import',input,key);assert.equal(created.status,200,JSON.stringify(created.value));assert.deepEqual(await call('skill_package_import',input,key),created);
  const revisionId=created.value.id;assert.equal((await call('skill_package_inspect',{revisionId})).value.revision.contentDigest,created.value.contentDigest);
  const read=await call('skill_package_read',{revisionId});assert.equal(read.status,200);assert.equal(read.value.content,'# Original 中文 skill\n');
  const unreviewed=await call('skill_bundle_configure',{expectedVersion:0,revisionIds:[revisionId]});assert.equal(unreviewed.value.error.code,'SKILL_NOT_APPROVED');
  assert.equal((await call('skill_package_review',{revisionId,decision:'approved',note:'Reviewed exact text'})).status,200);
  const configured=await call('skill_bundle_configure',{expectedVersion:0,revisionIds:[revisionId]});assert.equal(configured.status,200,JSON.stringify(configured.value));
  const selected=await call('skill_session_select',{sessionId:s.id,expectedVersion:s.version,skillIds:[input.packageId]});assert.equal(selected.status,200,JSON.stringify(selected.value));assert.equal(selected.value.ready,true);
  assert.equal((await call('skill_preflight',{sessionId:s.id})).value.skillBundleId,configured.value.bundleId);
  const listed=await call('skill_package_list');assert.equal(listed.value.revisions.length,1);assert.equal(listed.value.configuration.bundleId,configured.value.bundleId);
  const activeRead=await call('research_skill_read',{skillId:input.packageId},randomUUID(),s.id);assert.equal(activeRead.value.content,read.value.content);
  const second=await call('skill_package_import',{...input,revisionTag:'v2',files:[{path:'SKILL.md',contentBase64:Buffer.from('# New version').toString('base64')}]});assert.equal(second.status,200);
  await call('skill_package_review',{revisionId:second.value.id,decision:'approved',note:'Reviewed v2'});await call('skill_bundle_configure',{expectedVersion:1,revisionIds:[second.value.id]});
  assert.equal((await call('research_skill_read',{skillId:input.packageId},randomUUID(),s.id)).value.content,read.value.content);
  const cliInput=join(dir,'input.json');writeFileSync(cliInput,JSON.stringify({revisionId}));const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','skill_package_inspect','--project',p.id,'--input-file',cliInput,'--data',dir],{encoding:'utf8',timeout:15000});assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).revision.id,revisionId);
  assert.equal((await call('skill_package_revoke',{revisionId,note:'Withdraw v1'})).status,200);assert.equal((await call('skill_preflight',{sessionId:s.id})).value.ready,false);
  assert.equal((await call('research_skill_read',{skillId:input.packageId},randomUUID(),s.id)).value.content,read.value.content,'historical fixed text remains explainable');
  const invalid=await call('skill_package_read',{revisionId,resource:'../../.env'});assert.notEqual(invalid.status,200);
  const other=app.projects.create(USER,{name:'Other'});assert.throws(()=>app.operations.execute(USER,'skill_package_inspect',{revisionId},{projectId:other.id}),{code:'SCOPE_DENIED'});
  const session=app.store.get('session',s.id);app.store.update('session',s.id,session.version,{generation:1,state:'running',leaseUntil:Date.now()+10000});
  await assert.rejects(()=>new ToolDispatcher(app).execute({type:'agent',projectId:p.id,sessionId:s.id,role:'coordinator',generation:1},'skill_package_review',{revisionId,decision:'approved',note:'self grant'},'forbidden'),{code:'TOOL_DENIED'});
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
