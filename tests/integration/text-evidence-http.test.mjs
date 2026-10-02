import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {mkdtempSync,rmSync}from'node:fs';import {tmpdir}from'node:os';import {join}from'node:path';
import {createHttpServer} from '../../dist/apps/server/http.js';
test('HTTP opt-in corpus -> exact evidence -> disable retains files but blocks new search',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'text-evidence-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0}),port=await server.listen();
 try {
  const req=async(path,body)=>{const r=await fetch(`http://127.0.0.1:${port}/api${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','Idempotency-Key':randomUUID()},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};};
  const p=(await req('/projects',{name:'Evidence API'})).data,a=(await req('/artifacts',{projectId:p.id,title:'paper.txt',content:'Header\n\nThe measured coefficient was 12 in this synthetic fixture.',mediaType:'text/plain'})).data;
  const config=await req(`/projects/${p.id}/text-evidence`,{enabled:true,artifactIds:[a.id],expectedVersion:0});assert.equal(config.status,200);
  const r=await req('/text-evidence-search',{projectId:p.id,artifactIds:[a.id],query:'coefficient'});assert.equal(r.status,200);assert.equal(r.data.hits[0].lineStart,3);
  const e=await req(`/evidence/${r.data.hits[0].evidenceId}`);assert.equal(e.data.quote,r.data.hits[0].quote);
  const state=(await req(`/projects/${p.id}/state`)).data;assert.equal(state.textEvidence.enabled,true);assert.equal(state.claims.length,0);assert.equal(state.runs.length,0);
  await req(`/projects/${p.id}/text-evidence`,{enabled:false,expectedVersion:config.data.version});assert.equal((await req('/text-evidence-search',{projectId:p.id,artifactIds:[a.id],query:'coefficient'})).data.error.code,'TEXT_EVIDENCE_DISABLED');
  assert.equal((await req(`/evidence/${e.data.id}`)).status,200);
  const history=(await req(`/projects/${p.id}/state`)).data.textEvidenceSearches;assert.deepEqual(history.map(item=>item.id),[r.data.id]);
 } finally {await server.close();rmSync(dir,{recursive:true,force:true});}
});
