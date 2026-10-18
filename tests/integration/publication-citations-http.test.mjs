import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,chmodSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {digest} from '../../dist/packages/storage/store.js';

test('HTTP citation check saves one bounded original report; paginated history and revisions remain distinct',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-citations-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});try{
  const app=server.app,project=app.projects.create(USER,{name:'Citation HTTP fixture'}),port=await server.listen();let requests=0;
  app.connectors=new ConnectorService(app.context,app.evidence,{transport:new ConnectorTransport({minIntervalMs:0,fetcher:async()=>{requests++;return Response.json({message:{DOI:'10.1000/one',title:['Fixed title'],author:[{family:'Doe',given:'Jane'}],published:{'date-parts':[[2024]]}}});}}),credentials:()=>({})});
  const call=async(name,input,key=randomUUID(),pid=project.id)=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({projectId:pid,input})});return {status:r.status,value:await r.json()};};
  const p=await call('paper_read',{source:'crossref',id:'10.1000/one'});assert.equal(p.status,200,JSON.stringify(p.value));
  const bib=Array.from({length:80},(_,i)=>`@article{k${i},title={Fixed title},author={Doe, Jane},year=2024,doi={10.1000/one}}`).join('\n'),body={title:'Frozen citations',engine:'pdflatex',mainFile:'main.tex',bibliography:'bibtex',files:[{path:'main.tex',contentBase64:Buffer.from('\\cite{k0}\\bibliography{refs}').toString('base64')},{path:'refs.bib',contentBase64:Buffer.from(bib).toString('base64')}]};
  const r=await call('manuscript_create',body);assert.equal(r.status,200);const input={revisionId:r.value.id,metadataArtifactIds:[p.value.artifactId]},key=randomUUID(),out=await call('publication_citation_check',input,key);assert.equal(out.status,200,JSON.stringify(out.value));assert.equal(out.value.literalStructure,'passed');assert.equal(out.value.identityComparison,'matched');const count=app.store.list('artifact',project.id).length;assert.deepEqual(await call('publication_citation_check',input,key),out);assert.equal(app.store.list('artifact',project.id).length,count);
  let content='',cursor=0,pages=0;while(true){const read=await call('artifact_read',{artifactId:out.value.reportArtifact.artifactId,cursor});assert.equal(read.status,200);content+=read.value.content;pages++;cursor=read.value.cursor;if(read.value.complete)break;}assert.ok(pages>1);assert.equal(digest(content),out.value.reportArtifact.digest);const decoded=JSON.parse(content);assert.equal(decoded.binding.revisionId,r.value.id);assert.equal(decoded.binding.metadata[0].paperReadId,p.value.id);assert.equal(decoded.scientificClaimSupport,'not_assessed');
  const other=app.projects.create(USER,{name:'other'});assert.equal((await call('publication_citation_check',input,randomUUID(),other.id)).value.error.code,'SCOPE_DENIED');assert.equal((await call('artifact_read',{artifactId:out.value.reportArtifact.artifactId},randomUUID(),other.id)).value.error.code,'SCOPE_DENIED');
  const next=await call('manuscript_create',{...body,title:'New frozen revision',previousRevisionId:r.value.id,files:[{...body.files[0],contentBase64:Buffer.from('\\cite{missing}\\bibliography{refs}').toString('base64')},body.files[1]]});assert.equal(next.status,200);const nextCheck=await call('publication_citation_check',{revisionId:next.value.id});assert.equal(nextCheck.status,200);assert.equal(nextCheck.value.literalStructure,'failed');assert.notEqual(nextCheck.value.reportArtifact.artifactId,out.value.reportArtifact.artifactId);assert.equal(JSON.parse(app.evidence.read(USER,out.value.reportArtifact.artifactId).bytes).binding.revisionId,r.value.id);
  const path=app.store.paths.physical(app.store.get('artifact',out.value.reportArtifact.artifactId).path);chmodSync(path,0o600);writeFileSync(path,'corrupted');assert.equal((await call('artifact_read',{artifactId:out.value.reportArtifact.artifactId})).value.error.code,'ARTIFACT_CORRUPTED');assert.equal((await call('publication_citation_check',input,key)).value.error.code,'ARTIFACT_CORRUPTED');assert.equal(requests,1);
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
