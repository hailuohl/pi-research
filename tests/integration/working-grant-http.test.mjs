import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {approve} from '../support/research.mjs';

test('owner WorkingGrant HTTP/CLI preserves bounded derived approvals, replay and revocation',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-working-grant-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const port=await server.listen();await server.host.stop(); // Transport fixture: no Docker or model execution.
  const app=server.app,project=app.projects.create(USER,{name:'WorkingGrant transport fixture',template:'curve-fit'}),session=app.sessions.create(USER,project.id,{title:'Private implementation'}),baseline=app.experiments.create(USER,project.id,{title:'Fixed baseline'});
  app.sources.prepare(USER,project.id,session.id,{experimentId:baseline.id,revision:1});writeFileSync(join(app.store.paths.physical(session.workspace),'test.py'),'# UNIT transport fixture; never executed\n');
  const headers={'Content-Type':'application/json'},call=async(name,input,key=randomUUID(),pid=project.id,sid)=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({projectId:pid,...(sid?{sessionId:sid}:{}),input})});return {status:r.status,value:await r.json()};};
  const templateInput={command:['python','test.py'],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`},template=app.development.prepare(USER,project.id,session.id,templateInput),input={developmentTaskId:template.id,editablePaths:['config.json'],maxTests:2,maxChangedBytes:4096,expiresAt:new Date(Date.now()+60*60*1000).toISOString()},key=randomUUID();
  const draft=await call('working_grant_prepare',input,key);assert.equal(draft.status,200,JSON.stringify(draft.value));assert.equal(draft.value.state,'draft');assert.equal(draft.value.usage.used,0);assert.ok(!JSON.stringify(draft.value).includes(dir));assert.deepEqual(await call('working_grant_prepare',input,key),draft);
  assert.notEqual((await call('working_grant_activate',{grantId:draft.value.id,expectedVersion:draft.value.version})).status,200);approve(app,draft.value.approvalId);
  const active=await call('working_grant_activate',{grantId:draft.value.id,expectedVersion:draft.value.version});assert.equal(active.status,200,JSON.stringify(active.value));assert.equal(active.value.effectiveState,'active');assert.equal(app.sessions.get(USER,session.id).workingGrantId,draft.value.id);
  approve(app,template.grantId);assert.notEqual((await call('development_submit',{developmentTaskId:template.id})).status,200,'Old single approval cannot bypass the bound policy');
  const forbidden=await call('workspace_write',{source:'session',path:'outside.txt',content:'denied',expectedDigest:null},randomUUID(),project.id,session.id);assert.notEqual(forbidden.status,200);
  const tasks=[];for(let i=0;i<3;i++){const prepared=await call('development_prepare',templateInput,randomUUID(),project.id,session.id);assert.equal(prepared.status,200,JSON.stringify(prepared.value));assert.equal(prepared.value.manifest.workingGrant.id,draft.value.id);assert.equal(app.store.get('approval',prepared.value.grantId).workingGrant.approvalId,draft.value.approvalId);tasks.push(prepared.value);}
  const submitted=await call('development_submit',{developmentTaskId:tasks[0].id});assert.equal(submitted.status,200,JSON.stringify(submitted.value));assert.equal((await call('development_submit',{developmentTaskId:tasks[0].id})).value.id,submitted.value.id);await call('development_cancel',{jobId:submitted.value.id});
  const second=await call('development_submit',{developmentTaskId:tasks[1].id});assert.equal(second.status,200,JSON.stringify(second.value));await call('development_cancel',{jobId:second.value.id});const denied=await call('development_submit',{developmentTaskId:tasks[2].id});assert.notEqual(denied.status,200);assert.match(denied.value.error.code,/GRANT|BUDGET|LIMIT/);assert.equal(app.store.list('sandbox-job',project.id).length,2);
  const inspected=await call('working_grant_inspect',{grantId:draft.value.id});assert.equal(inspected.status,200);assert.deepEqual(inspected.value.usage,{limit:2,used:2,remaining:0,unit:'test-submission'});
  const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','working_grant_inspect','--project',project.id,'--input',JSON.stringify({grantId:draft.value.id}),'--data',dir],{encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),inspected.value);
  const revoked=await call('working_grant_revoke',{grantId:draft.value.id,expectedVersion:inspected.value.version});assert.equal(revoked.status,200,JSON.stringify(revoked.value));assert.equal(revoked.value.state,'revoked');assert.equal((await call('development_submit',{developmentTaskId:tasks[0].id})).value.id,submitted.value.id,'Historical receipt replays without creating another job');
  const other=app.projects.create(USER,{name:'Other'});assert.notEqual((await call('working_grant_inspect',{grantId:draft.value.id},randomUUID(),other.id)).status,200);assert.equal((await call('working_grant_prepare',{...input,automatic:true})).value.error.code,'INVALID_INPUT');
  await assert.rejects(new ToolDispatcher(app).execute({type:'agent',projectId:project.id,sessionId:session.id,role:'coordinator',generation:0},'working_grant_activate',{grantId:draft.value.id,expectedVersion:1},'cannot-authorize'),{code:'TOOL_DENIED'});
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
