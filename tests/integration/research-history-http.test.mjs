import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';

test('HTTP exposes history contracts and rejects actor spoofing or mismatched project/session envelopes',async()=>{
 const dir=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-history-http-')),service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const project=service.app.projects.create(USER,{name:'History transport'}),session=service.app.sessions.create(USER,project.id,{title:'Main dialogue'}),other=service.app.projects.create(USER,{name:'Other project'}),foreign=service.app.sessions.create(USER,other.id,{title:'Foreign dialogue'});
  const document=service.app.documents.import(USER,project.id,{title:'Saved local source',mediaType:'text/plain',contentBase64:Buffer.from('HTTP_BODY_SECRET').toString('base64')},'http-source');
  const port=await service.listen(),url=`http://127.0.0.1:${port}/api`,body={projectId:project.id,sessionId:session.id,input:{kind:'documents',limit:1}};
  const call=async(value)=>{const response=await fetch(url+'/operations/research_history_list',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)});return {status:response.status,data:await response.json()};};
  const contracts=await (await fetch(url+'/operations')).json(),contract=contracts.find(item=>item.id==='research_history_list');assert.ok(contract);assert.equal(contract.idempotencyPolicy,'read-only');assert.equal(contract.inputSchema.additionalProperties,false);
  const result=await call(body);assert.equal(result.status,200,JSON.stringify(result.data));assert.equal(result.data.items[0].id,document.id);assert.equal(result.data.hasMore,false);assert.ok(!JSON.stringify(result.data).includes('HTTP_BODY_SECRET'));assert.ok(!JSON.stringify(result.data).includes(document.original.artifactId));
  for(const value of [{...body,actor:{type:'agent',role:'coordinator'}},{...body,generation:1},{...body,input:{...body.input,projectId:other.id}},{...body,input:{kind:'documents',limit:101}}])assert.equal((await call(value)).status,400);
  assert.equal((await call({...body,sessionId:foreign.id})).status,403);
  assert.equal(service.app.store.list('model-usage',project.id).length,0);assert.equal(service.app.store.list('run',project.id).length,0);
 }finally{await service.close();rmSync(dir,{recursive:true,force:true});}
});
