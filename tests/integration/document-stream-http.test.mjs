import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import http from 'node:http';
import {once} from 'node:events';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';

test('binary owner routes retain exact text and fixed cursor without weakening Host, Origin, lifecycle or JSON/media contracts',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-stream-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const port=await server.listen();await server.host.stop();const app=server.app,p=app.projects.create(USER,{name:'HTTP stream',template:'empty'}),base=`http://127.0.0.1:${port}`,route=`/api/projects/${p.id}/documents/upload?title=data.csv&mediaType=text%2Fcsv`;
  const upload=async(body,headers={},path=route,method='POST')=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/octet-stream','Idempotency-Key':'http-stream',...headers},body});return {status:r.status,value:await r.json()};};
  const bytes=Buffer.from('\uFEFF列,emoji\n一,🙂\n');const accepted=await upload(bytes);assert.equal(accepted.status,200,JSON.stringify(accepted));assert.equal(accepted.value.original.size,bytes.length);
  const d=accepted.value,pages=`/api/projects/${p.id}/documents/${d.id}/text?sourceDigest=${d.original.digest}`;
  const r=await fetch(base+pages+'&limit=11'),page=await r.json();assert.equal(r.status,200);assert.equal(page.sourceDigest,d.original.digest);assert.equal(page.cursorUnit,'utf8-byte');assert.equal(Buffer.byteLength(page.content),page.end);assert.deepEqual(Buffer.from(page.content),bytes.subarray(0,page.end));
  const next=await (await fetch(base+pages+'&cursor='+page.end)).json();assert.equal(next.complete,true);assert.deepEqual(Buffer.from(page.content+next.content),bytes);
  assert.equal((await upload(bytes)).value.id,d.id);
  assert.equal((await upload(bytes,{'Origin':'https://external.invalid'})).status,403);
  const wrongHost=await new Promise((resolve,reject)=>{const req=http.request(base+route,{method:'POST',headers:{Host:'external.invalid','Content-Type':'application/octet-stream','Idempotency-Key':'bad-host'}},res=>{res.resume();res.once('end',()=>resolve(res.statusCode));});req.once('error',reject);req.end(bytes);});assert.equal(wrongHost,403);
  assert.equal((await upload(bytes,{'Content-Type':'text/plain'})).status,415);
  assert.equal((await upload(bytes,{},route+'&title=duplicate')).status,400);
  assert.equal((await upload(bytes,{},route,'PUT')).status,405);
  assert.equal((await fetch(base+pages+'&cursor=1')).status,400);
  assert.equal((await fetch(base+pages+'&unknown=1')).status,400);
  const policy=await (await fetch(base+`/api/projects/${p.id}/document-file-policy`)).json();assert.equal(policy.maxFileBytes,536870912);assert.equal(policy.legacyJsonFileBytes,33554432);
  const json=await fetch(base+'/api/operations/document_import',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':'old-json'},body:JSON.stringify({projectId:p.id,input:{title:'old.txt',mediaType:'text/plain',contentBase64:Buffer.from('legacy').toString('base64')}})});assert.equal(json.status,200);assert.equal((await json.json()).original.size,6);
  assert.equal((await upload(Buffer.from('%PDF-1.4'),{},route.replace('text%2Fcsv','application%2Fpdf'))).status,400);
  const project=app.store.get('project',p.id);app.store.update('project',p.id,project.version,{status:'trashed'});assert.equal((await fetch(base+pages)).status,410);assert.equal((await upload(bytes)).status,410);
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});

test('HTTP abort after received chunks publishes no document or incomplete CAS source',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-stream-abort-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const port=await server.listen();await server.host.stop();const app=server.app,p=app.projects.create(USER,{name:'Abort stream',template:'empty'});
  const accepted=new Promise(resolve=>server.server.once('request',req=>req.once('data',()=>resolve())));
  const req=http.request(`http://127.0.0.1:${port}/api/projects/${p.id}/documents/upload?title=partial.txt&mediaType=text/plain`,{method:'POST',headers:{'Content-Type':'application/octet-stream','Idempotency-Key':'aborted','Content-Length':String(4*1024*1024)}});req.on('error',()=>{});req.write(Buffer.alloc(65536,97));await accepted;const closed=new Promise(resolve=>req.once('close',resolve));req.destroy();await closed;
  for(let i=0;i<100;i++){await new Promise(resolve=>setTimeout(resolve,10));if(readdirSync(join(dir,'artifacts')).length===0)break;}
  assert.equal(app.store.list('document-version',p.id).length,0);assert.equal(app.store.list('artifact',p.id).length,0);assert.deepEqual(readdirSync(join(dir,'artifacts')),[]);
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});
