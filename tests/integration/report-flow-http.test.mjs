import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {approve,fixtureFinish} from '../support/research.mjs';

test('report UI/Registry/CLI bind original results, export once and preserve historical replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-report-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Report transport',template:'curve-fit'}),e=app.experiments.create(USER,p.id,{title:'Measured fixture'});
  const intent=app.runs.prepare(USER,e.id);approve(app,intent.approvalId);const run=app.runs.submit(USER,intent.id);fixtureFinish({app},run,{mse:0.125});
  const port=await server.listen(),base=`http://127.0.0.1:${port}/api`,headers={'Content-Type':'application/json'};
  const request=async(path,body,key=randomUUID())=>{const r=await fetch(base+path,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify(body)});return {status:r.status,value:await r.json()};};
  const call=(name,input,key)=>request(`/operations/${name}`,{projectId:p.id,input},key);
  const body={projectId:p.id,title:'Exact observed run',runIds:[run.id]},key=randomUUID(),created=await request('/reports',body,key);
  assert.equal(created.status,200,JSON.stringify(created.value));
  const replay=await call('report_create',{title:body.title,runIds:[run.id]},key);assert.deepEqual(replay,created);assert.equal(app.store.list('report').length,1);
  const report=app.store.list('report')[0],inspection=await call('report_inspect',{reportId:report.id});assert.equal(inspection.status,200,JSON.stringify(inspection.value));
  assert.equal(inspection.value.integrity,'verified');assert.equal(inspection.value.validity,'current');assert.equal(JSON.stringify(inspection.value).includes(dir),false);
  const metric=inspection.value.runs[0].metrics.find(m=>m.name==='mse');assert.equal(metric.value,0.125);
  const ref=await call('report_reference_read',{reportId:report.id,referenceId:metric.referenceId,limit:12});assert.equal(ref.status,200,JSON.stringify(ref.value));assert.equal(ref.value.content.length,12);assert.equal(ref.value.complete,false);
  const sourceRef=inspection.value.references.find(r=>r.type==='run-source'&&r.path==='config.json');assert.ok(sourceRef);
  const fixed=await call('report_reference_read',{reportId:report.id,referenceId:sourceRef.id});assert.equal(fixed.status,200,JSON.stringify(fixed.value));
  assert.equal(createHash('sha256').update(fixed.value.content).digest('hex'),sourceRef.digest);
  const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','report_inspect','--project',p.id,'--input',JSON.stringify({reportId:report.id}),'--data',dir],{encoding:'utf8',timeout:15000});
  assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),inspection.value);
  const other=app.projects.create(USER,{name:'Other'}),cross=await request('/operations/report_inspect',{projectId:other.id,input:{reportId:report.id}});assert.equal(cross.value.error.code,'SCOPE_DENIED');
  const forged=await call('report_reference_read',{reportId:report.id,referenceId:'javascript:alert(1)'});assert.notEqual(forged.status,200);
  const extra=await request('/reports',{...body,referenceUrl:'https://example.invalid/'});assert.equal(extra.value.error.code,'INVALID_INPUT');
  const s=app.sessions.create(USER,p.id,{}),actor={type:'agent',projectId:p.id,sessionId:s.id,role:'coordinator',generation:0};
  await assert.rejects(()=>new ToolDispatcher(app).execute(actor,'report_export',{reportId:report.id},'forbidden'),{code:'TOOL_DENIED'});
  const exportKey=randomUUID(),exported=await call('report_export',{reportId:report.id},exportKey);assert.equal(exported.status,200,JSON.stringify(exported.value));assert.match(exported.value.title,/\.tar\.gz$/);
  const download=await fetch(base+`/artifacts/${exported.value.id}/content`,{headers});assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/^attachment/);
  const bytes=Buffer.from(await download.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),exported.value.digest);assert.equal(Buffer.compare(bytes,readFileSync(app.store.paths.physical(exported.value.path))),0);
  assert.deepEqual(await call('report_export',{reportId:report.id},exportKey),exported);assert.equal(app.store.list('report-export').length,1);
  app.projects.archive(USER,p.id,app.store.get('project',p.id).version);
  assert.deepEqual(await call('report_export',{reportId:report.id},exportKey),exported);
  const blocked=await call('report_export',{reportId:report.id});assert.equal(blocked.value.error.code,'PROJECT_ARCHIVED');
  assert.equal((await call('report_inspect',{reportId:report.id})).status,200);
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
