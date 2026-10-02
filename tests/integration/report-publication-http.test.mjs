import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {digest} from '../../dist/packages/storage/store.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {publicationFixture} from '../support/publication.mjs';

test('owner HTTP and CLI report contracts freeze manuscript results and preserve historical reads after revocation',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-report-publication-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'UNIT manuscript report transport'}),fixture=publicationFixture(app,p.id),port=await server.listen();
  const headers={'Content-Type':'application/json'};
  const call=async(name,input,key=randomUUID(),pid=p.id)=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({projectId:pid,input})});return {status:r.status,value:await r.json()};};
  const input={title:'UNIT fixed manuscript report',publicationResultIds:[fixture.result.id]},key=randomUUID(),created=await call('report_create',input,key);
  assert.equal(created.status,200,JSON.stringify(created.value));assert.deepEqual(await call('report_create',input,key),created);
  const record=app.store.list('report',p.id).find(r=>r.artifactId===created.value.id),inspected=await call('report_inspect',{reportId:record.id});
  assert.equal(inspected.status,200,JSON.stringify(inspected.value));assert.equal(inspected.value.validity,'current');assert.deepEqual(inspected.value.runs,[]);
  const publication=inspected.value.publications[0];assert.equal(publication.resultId,fixture.result.id);assert.equal(publication.jobId,fixture.job.id);assert.equal(publication.revisionId,fixture.revision.id);assert.equal(publication.pdfDigest,digest(fixture.pdf));
  const fixed=await call('report_reference_read',{reportId:record.id,referenceId:publication.referenceId,limit:64000});assert.equal(fixed.status,200,JSON.stringify(fixed.value));assert.equal(fixed.value.reference.type,'publication');assert.ok(!fixed.value.content.includes(dir));
  const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','report_inspect','--project',p.id,'--input',JSON.stringify({reportId:record.id}),'--data',dir],{encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),inspected.value);
  const exported=await call('report_export',{reportId:record.id});assert.equal(exported.status,200,JSON.stringify(exported.value));
  const download=await fetch(`http://127.0.0.1:${port}/api/artifacts/${exported.value.id}/content`,{headers});assert.equal(download.status,200);assert.equal(digest(Buffer.from(await download.arrayBuffer())),exported.value.digest);
  const other=app.projects.create(USER,{name:'Other'});assert.notEqual((await call('report_create',input,randomUUID(),other.id)).status,200);
  assert.equal((await call('report_create',{...input,publicationResultIds:Array(21).fill(fixture.result.id)})).value.error.code,'INVALID_INPUT');
  assert.equal((await call('report_create',{...input,publicationResultIds:[{resultId:fixture.result.id}]})).value.error.code,'INVALID_INPUT');
  assert.equal((await call('report_create',{...input,pdfArtifactId:fixture.result.pdf.artifactId})).value.error.code,'INVALID_INPUT');
  const session=app.sessions.create(USER,p.id,{});await assert.rejects(()=>new ToolDispatcher(app).execute({type:'agent',projectId:p.id,sessionId:session.id,role:'coordinator',generation:0},'report_create',input,'denied'),{code:'TOOL_DENIED'});
  const exportPath=app.store.paths.physical(created.value.path),original=readFileSync(exportPath);app.approvals.stale(fixture.job.id);
  const stale=await call('report_inspect',{reportId:record.id});assert.equal(stale.status,200);assert.equal(stale.value.validity,'stale');assert.deepEqual(stale.value.publications,inspected.value.publications);
  assert.deepEqual(await call('report_reference_read',{reportId:record.id,referenceId:publication.referenceId,limit:64000}),fixed);
  assert.deepEqual(readFileSync(exportPath),original);assert.notEqual((await call('report_create',input)).status,200);assert.equal((await call('report_export',{reportId:record.id})).value.error.code,'REPORT_STALE');
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
