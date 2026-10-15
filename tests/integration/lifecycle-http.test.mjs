import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
test('HTTP archive blocks an already approved unsubmitted intent and preserves history access',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'lifecycle-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});const port=await server.listen();
 try {
  const req=async(path,body)=>{const r=await fetch(`http://127.0.0.1:${port}/api${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','Idempotency-Key':randomUUID()},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};};
  const p=(await req('/projects',{name:'Archive regression',template:'curve-fit'})).data;
  const e=(await req('/experiments',{projectId:p.id,title:'base'})).data;
  const i=(await req('/run-intents',{experimentId:e.id})).data;
  const state=(await req(`/projects/${p.id}/state`)).data,a=state.approvals.find(x=>x.id===i.approvalId);
  assert.equal((await req(`/approvals/${a.id}/decide`,{expectedVersion:a.version,approved:true})).status,200);
  assert.equal((await req(`/projects/${p.id}/archive`,{expectedVersion:state.project.version})).status,200);
  const refused=await req(`/run-intents/${i.id}/submit`,{});assert.equal(refused.status,409);assert.equal(refused.data.error.code,'PROJECT_ARCHIVED');
  assert.equal((await req(`/experiments/${e.id}`)).status,200);
 } finally {await server.close();rmSync(dir,{recursive:true,force:true});}
});
