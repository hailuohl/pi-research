import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';import {join,resolve,sep} from 'node:path';import {tmpdir} from 'node:os';import {randomUUID} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';import {USER} from '../../dist/packages/domain/types.js';import {compilerProfile} from '../../dist/packages/publications/build-service.js';import {digest} from '../../dist/packages/storage/store.js';import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
test('publication owner HTTP/CLI contracts preserve immutable revisions, diagnostics, paging and approvals',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-publication-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Publication transport'}),port=await server.listen(),headers={Authorization:`Bearer ${server.token}`,'Content-Type':'application/json'};
  const call=async(name,input={},key=randomUUID(),pid=p.id)=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({projectId:pid,input})});return {status:r.status,value:await r.json()};};
  const templates=await call('publication_templates');assert.equal(templates.status,200);assert.equal(templates.value.length,3);assert.equal((await call('publication_status')).value.configured,false);
  const profile=compilerProfile(process.cwd());app.store.create('publication-compiler-settings',null,{...profile,dockerContext:'default',imageDigest:'sha256:'+'a'.repeat(64),imageId:'sha256:'+'a'.repeat(64)},'global');
  const input={title:'固定稿',engine:'xelatex',mainFile:'main.tex',bibliography:'none',templateId:'article-xelatex',files:[{path:'main.tex',contentBase64:Buffer.from('% 中文😀\ninvalid command fixture').toString('base64')}]},key=randomUUID();
  const created=await call('manuscript_create',input,key);assert.equal(created.status,200,JSON.stringify(created.value));const rev=created.value;assert.deepEqual(await call('manuscript_create',input,key),created);
  assert.equal((await call('manuscript_list',{cursor:0,limit:1})).value.items[0].id,rev.id);assert.deepEqual((await call('manuscript_inspect',{revisionId:rev.id})).value,rev);
  const source=await call('manuscript_source_read',{revisionId:rev.id,path:'main.tex',cursor:0,limit:3});assert.equal(source.status,200);assert.equal(source.value.complete,false);assert.equal(source.value.digest,rev.files[0].digest);
  const other=app.projects.create(USER,{name:'Other'});assert.equal((await call('manuscript_inspect',{revisionId:rev.id},randomUUID(),other.id)).value.error.code,'SCOPE_DENIED');
  const prepared=await call('publication_prepare',{revisionId:rev.id});assert.equal(prepared.status,200,JSON.stringify(prepared.value));const job=prepared.value;
  assert.equal((await call('publication_submit',{jobId:job.id})).value.error.code,'APPROVAL_REQUIRED');
  assert.equal((await call('publication_build_list',{revisionId:rev.id})).value.items[0].id,job.id);
  const grant=app.store.get('approval',job.approvalId);app.approvals.decide(USER,grant.id,grant.version,true);
  // Diagnostic fixture only: no container or model execution is claimed by this transport test.
  const saved=app.store.get('publication-build-job',job.id),outputDir=app.store.paths.physical(saved.outputDir),log=Buffer.from('./main.tex:2: Undefined control sequence.\n');writeFileSync(join(outputDir,'build.log'),log);
  writeFileSync(join(outputDir,'build.json'),JSON.stringify({formatVersion:1,profileId:profile.profileId,sourceDigest:rev.sourceDigest,engine:'xelatex',bibliography:'none',engineVersion:'UNIT fixture',status:'failed',hadErrors:true,converged:false,passes:1,diagnostics:[{severity:'error',code:'TEX_ERROR',message:'Undefined control sequence.',file:'main.tex',line:2,pass:1}],pdf:null,previews:[],logs:[{file:'build.log',digest:digest(log),bytes:log.length}]}));
  app.publicationBuilds.finalize(job.id,{state:'failed',exitCode:1});
  const inspected=await call('publication_inspect',{jobId:job.id});assert.equal(inspected.status,200);assert.equal(inspected.value.state,'failed');
  const result=await call('publication_result',{resultId:inspected.value.resultId});assert.equal(result.status,200,JSON.stringify(result.value));assert.equal(result.value.pdf,null);assert.equal(result.value.diagnostics[0].line,2);
  const another=await call('publication_prepare',{revisionId:rev.id});assert.equal((await call('publication_cancel',{jobId:another.value.id})).value.state,'cancelled');
  const file=join(dir,'request.json');writeFileSync(file,JSON.stringify({revisionId:rev.id}));const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','manuscript_inspect','--project',p.id,'--input-file',file,'--data',dir],{encoding:'utf8',timeout:15000});assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),rev);
  const session=app.sessions.create(USER,p.id,{});app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+10000});await assert.rejects(()=>new ToolDispatcher(app).execute({type:'agent',projectId:p.id,sessionId:session.id,role:'coordinator',generation:1},'publication_templates',{},'denied'),{code:'TOOL_DENIED'});
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
