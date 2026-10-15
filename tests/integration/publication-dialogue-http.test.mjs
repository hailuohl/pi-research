import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {compilerProfile} from '../../dist/packages/publications/build-service.js';
import {publicationFixture} from '../support/publication.mjs';

function readyBrief(app,pid,session){const brief=app.researchBriefs.save(USER,pid,session.id,{expectedRevisionId:null,question:'Prepare a fixed paper',scope:'Only project evidence',constraints:[],successCriteria:['Keep outputs traceable'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Draft',description:'Freeze source before compiling'}],status:'ready'});return app.researchBriefs.confirm(USER,pid,session.id,{briefId:brief.id,expectedVersion:brief.version});}
function agent(app,pid,session){let row=app.store.get('session',session.id,pid);row=app.store.update('session',row.id,row.version,{state:'running',generation:row.generation+1,leaseUntil:Date.now()+120000});return {type:'agent',projectId:pid,sessionId:row.id,role:'coordinator',generation:row.generation};}
const body=(title='UNIT dialogue HTTP')=>({title,engine:'pdflatex',mainFile:'main.tex',bibliography:'none',files:[{path:'main.tex',contentBase64:Buffer.from('UNIT HTTP manuscript').toString('base64')}]});

test('HTTP session binding stays compatible while coordinator tools prepare only their own fixed builds',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-publication-dialogue-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,project=app.projects.create(USER,{name:'UNIT publication dialogue'}),root=app.sessions.create(USER,project.id,{title:'Main research'}),other=app.sessions.create(USER,project.id,{title:'Other research'});readyBrief(app,project.id,root);readyBrief(app,project.id,other);const rootActor=agent(app,project.id,root),otherActor=agent(app,project.id,other),tools=new ToolDispatcher(app),port=await server.listen(),headers={'Content-Type':'application/json'},call=async(name,input={},key=randomUUID(),sessionId)=>{const response=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({projectId:project.id,...(sessionId?{sessionId}:{}),input})});return {status:response.status,value:await response.json()};};
  const userRoot=await call('manuscript_create',body('USER contextual'),randomUUID(),root.id);assert.equal(userRoot.status,200,JSON.stringify(userRoot.value));assert.equal(userRoot.value.rootSessionId,root.id);
  const legacy=await call('manuscript_create',body('USER legacy'));assert.equal(legacy.status,200);assert.equal(legacy.value.rootSessionId,undefined);
  const input=body('Agent fixed source'),key='same-root-key',a=await tools.execute(rootActor,'manuscript_create',input,key),b=await tools.execute(otherActor,'manuscript_create',input,key);assert.notEqual(a.id,b.id);assert.equal(a.rootSessionId,root.id);assert.equal(b.rootSessionId,other.id);assert.equal((await tools.execute(rootActor,'manuscript_create',input,key)).id,a.id);assert.equal((await tools.execute(otherActor,'manuscript_create',input,key)).id,b.id);
  await assert.rejects(tools.execute(otherActor,'manuscript_inspect',{revisionId:a.id},'foreign-inspect'),{code:'SCOPE_DENIED'});
  await assert.rejects(tools.execute(otherActor,'manuscript_create',{...input,previousRevisionId:a.id},'foreign-previous'),{code:'SCOPE_DENIED'});
  const imageId='sha256:'+'b'.repeat(64);app.store.create('publication-compiler-settings',null,{...compilerProfile(process.cwd()),dockerContext:'default',imageDigest:imageId,imageId},'global');
  const prepared=await tools.execute(rootActor,'publication_prepare',{revisionId:a.id},'prepare-fixed');assert.equal(prepared.state,'prepared');assert.equal(prepared.revisionId,a.id);assert.equal((await tools.execute(rootActor,'publication_inspect',{jobId:prepared.id},'inspect-fixed')).state,'prepared');
  await assert.rejects(tools.execute(rootActor,'publication_submit',{jobId:prepared.id},'agent-submit'),{code:'TOOL_DENIED'});await assert.rejects(tools.execute(rootActor,'publication_cancel',{jobId:prepared.id},'agent-cancel'),{code:'TOOL_DENIED'});await assert.rejects(tools.execute(rootActor,'publication_configure',{expectedVersion:1,dockerContext:'default',imageDigest:imageId},'agent-configure'),{code:'TOOL_DENIED'});
  const inspected=await call('publication_inspect',{jobId:prepared.id});assert.equal(inspected.status,200,JSON.stringify(inspected.value));assert.equal(inspected.value.state,'prepared');
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});

test('reopened dialogue recovers export receipts from the report fixed publication bindings',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-paper-export-history-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'UNIT archived paper package'}),root=app.sessions.create(USER,p.id,{}),other=app.sessions.create(USER,p.id,{});readyBrief(app,p.id,root);
  const fixture=publicationFixture(app,p.id,{rootSessionId:root.id}),artifact=app.reports.create(USER,p.id,{title:'UNIT exported paper',publicationResultIds:[fixture.result.id]}),report=app.store.list('report',p.id).find(r=>r.artifactId===artifact.id);
  assert.equal(report.publicationResultIds,undefined,'publication association is in fixed bindings, not an optional request field');
  const archive=await app.exports.create(USER,p.id,{reportId:report.id},'fixed-package'),port=await server.listen(),state=id=>fetch(`http://127.0.0.1:${port}/api/projects/${p.id}/state?sessionId=${id}`).then(r=>r.json());
  for(let i=0;i<2;i++){const reopened=await state(root.id);assert.deepEqual(reopened.publicationExports,[{reportId:report.id,artifactId:archive.id}]);assert.deepEqual(reopened.reports.find(r=>r.id===report.id).publicationResultIds,[fixture.result.id]);}
  assert.deepEqual((await state(other.id)).publicationExports,[]);
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
