import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {publicationFixture} from '../support/publication.mjs';
import {approve} from '../support/research.mjs';
import {actor,result} from '../support/collaboration.mjs';

test('publication review owner HTTP/CLI contracts preserve exact targets, independent approval and frozen report references',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-publication-review-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'UNIT paper review transport'}),root=app.sessions.create(USER,p.id,{title:'Review owner'}),fixture=publicationFixture(app,p.id),port=await server.listen();
  app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});
  const headers={'Content-Type':'application/json'},call=async(name,input,key=randomUUID(),pid=p.id)=>{const response=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({projectId:pid,input})});return {status:response.status,value:await response.json()};};
  const input={resultId:fixture.result.id,rootSessionId:root.id,inputEvidenceIds:[]},key=randomUUID(),prepared=await call('publication_review_prepare',input,key);
  assert.equal(prepared.status,200,JSON.stringify(prepared.value));assert.equal(prepared.value.status,'awaiting_approval');assert.equal(prepared.value.publicationResultId,fixture.result.id);assert.equal(prepared.value.validity,'current');
  assert.deepEqual(await call('publication_review_prepare',input,key),prepared);assert.equal(app.store.list('publication-review',p.id).length,1);
  assert.equal(app.teams.claim(prepared.value.teamId),null);assert.equal(app.store.list('model-usage',p.id).length,0);
  const listed=await call('publication_review_list',{resultId:fixture.result.id});assert.deepEqual(listed.value,[prepared.value]);
  assert.equal((await call('publication_review_prepare',{...input,verdict:'accept'})).value.error.code,'INVALID_INPUT');
  assert.equal((await call('publication_review_prepare',{...input,inputEvidenceIds:Array(41).fill('evidence')})).value.error.code,'INVALID_INPUT');
  const other=app.projects.create(USER,{name:'Other project'});assert.notEqual((await call('publication_review_inspect',{reviewId:prepared.value.id},randomUUID(),other.id)).status,200);
  await assert.rejects(()=>new ToolDispatcher(app).execute({type:'agent',projectId:p.id,sessionId:root.id,role:'coordinator',generation:0},'publication_review_prepare',input,'agent-denied'),{code:'TOOL_DENIED'});
  approve(app,prepared.value.approvalId);app.teams.activate(USER,prepared.value.teamId);const claimed=app.teams.claim(prepared.value.teamId);assert.ok(claimed);
  assert.notEqual(claimed.attempt.sessionId,root.id);assert.equal(claimed.context.publicationReview.publicationResultId,fixture.result.id);
  const dispatcher=new ToolDispatcher(app),who=actor(claimed);
  assert.deepEqual((await dispatcher.execute(who,'task_context_read',{},'context')).publicationReview,claimed.context.publicationReview);
  await dispatcher.execute(who,'task_result_submit',result({verdict:'disputed',evidenceIds:prepared.value.requiredEvidenceIds}),'result');
  const inspected=await call('publication_review_inspect',{reviewId:prepared.value.id});assert.equal(inspected.status,200,JSON.stringify(inspected.value));assert.equal(inspected.value.status,'disputed');assert.equal(inspected.value.verdict,'disputed');assert.equal(inspected.value.validity,'current');
  const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','publication_review_inspect','--project',p.id,'--input',JSON.stringify({reviewId:prepared.value.id}),'--data',dir],{encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),inspected.value);
  const created=await call('report_create',{title:'UNIT disputed paper review report',publicationResultIds:[fixture.result.id]});assert.equal(created.status,200,JSON.stringify(created.value));
  const report=app.store.list('report',p.id).find(r=>r.artifactId===created.value.id),reportView=await call('report_inspect',{reportId:report.id});assert.equal(reportView.status,200,JSON.stringify(reportView.value));
  const frozen=reportView.value.publicationReviews[0].reviews[0];assert.equal(frozen.verdict,'disputed');
  const reference=await call('report_reference_read',{reportId:report.id,referenceId:frozen.referenceId,limit:64000});assert.equal(reference.status,200);assert.equal(reference.value.reference.type,'publication-review');assert.ok(reference.value.content.includes(inspected.value.taskResultId));assert.ok(!reference.value.content.includes(dir));
  app.approvals.stale(prepared.value.teamId);
  assert.equal((await call('report_inspect',{reportId:report.id})).value.validity,'stale');assert.deepEqual(await call('report_reference_read',{reportId:report.id,referenceId:frozen.referenceId,limit:64000}),reference);
  assert.equal((await call('report_export',{reportId:report.id})).value.error.code,'REPORT_STALE');
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
