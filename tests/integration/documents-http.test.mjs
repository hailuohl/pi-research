import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {parserProfile} from '../../dist/packages/documents/parse-service.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {DocumentService} from '../../dist/packages/documents/service.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';

test('owner document/task HTTP operations retain strict contracts, large-import bounds, approvals and idempotent recovery',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-document-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Document HTTP fixture',template:'empty'}),other=app.projects.create(USER,{name:'Other project',template:'empty'}),port=await server.listen();await server.host.stop(); // This offline contract test does not launch real network/container workers.
  const headers={Authorization:`Bearer ${server.token}`,'Content-Type':'application/json'},call=async(name,input={},key=randomUUID(),pid=p.id)=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({projectId:pid,input})});return {status:r.status,value:await r.json()};};
  const input={title:'Raw UTF8.txt',mediaType:'text/plain',contentBase64:Buffer.from('页定位文本🙂\n').toString('base64'),license:'CC0 fixture'},key='import-one';const imported=await call('document_import',input,key);assert.equal(imported.status,200,JSON.stringify(imported));assert.equal(imported.value.contentKind,'user-text');assert.equal(imported.value.license.assurance,'user-declared');assert.deepEqual(await call('document_import',input,key),imported);
  assert.equal((await call('document_inspect',{documentVersionId:imported.value.id})).value.original.digest,imported.value.original.digest);assert.equal((await call('document_list',{limit:1})).value.items.length,1);assert.equal((await call('document_inspect',{documentVersionId:imported.value.id},randomUUID(),other.id)).status,403);assert.equal((await call('document_import',{...input,extra:true})).status,400);
  const large=await call('document_import',{title:'large.txt',mediaType:'text/plain',contentBase64:Buffer.alloc(3*1024*1024,97).toString('base64')});assert.equal(large.status,200,JSON.stringify(large));assert.equal(large.value.original.size,3*1024*1024);
  const inputFile=join(dir,'cli-import.json');writeFileSync(inputFile,JSON.stringify({...input,title:'CLI input file',contentBase64:Buffer.alloc(100000,97).toString('base64')}));const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','document_import','--project',p.id,'--input-file',inputFile,'--data',dir],{encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).original.size,100000);
  assert.equal((await call('artifact_create',{title:'too-big.txt',content:'a'.repeat(3*1024*1024)})).status,413,'large JSON exception is document import only');
  assert.equal((await call('document_parser_status')).value.configured,false);assert.equal((await call('document_parse_prepare',{documentVersionId:imported.value.id})).value.error.code,'DOCUMENT_NOT_PDF');
  const pdf=await call('document_import',{title:'Header-only PDF fixture',mediaType:'application/pdf',contentBase64:Buffer.from('%PDF-1.4\nnot a parser success fixture').toString('base64')});assert.equal(pdf.status,200);assert.equal((await call('document_parse_prepare',{documentVersionId:pdf.value.id})).value.error.code,'DOCUMENT_PARSER_UNCONFIGURED');
  const profile=parserProfile(process.cwd());app.store.create('document-parser-settings',null,{...profile,dockerContext:'fixture-local',imageDigest:'sha256:'+'a'.repeat(64),imageId:'sha256:'+'a'.repeat(64)},'global');assert.equal((await call('document_parser_status')).value.configured,true);
  const prepared=await call('document_parse_prepare',{documentVersionId:pdf.value.id},'prepare-pdf');assert.equal(prepared.status,200,JSON.stringify(prepared));assert.equal(prepared.value.state,'prepared');assert.equal((await call('document_parse_submit',{jobId:prepared.value.id})).value.error.code,'APPROVAL_REQUIRED');
  const approval=app.store.get('approval',prepared.value.approvalId);app.approvals.decide(USER,approval.id,approval.version,true);const submitted=await call('document_parse_submit',{jobId:prepared.value.id});assert.equal(submitted.status,200,JSON.stringify(submitted));assert.equal(submitted.value.state,'queued');assert.equal((await call('document_parse_inspect',{jobId:prepared.value.id})).value.rawDigest,pdf.value.original.digest);assert.equal((await call('document_parse_cancel',{jobId:prepared.value.id})).value.state,'cancelled');
  let requests=0;app.connectors=new ConnectorService(app.context,app.evidence,{transport:new ConnectorTransport({fetcher:async()=>{requests++;return new Response(JSON.stringify({message:{items:[{DOI:'10.1000/http-fixture',title:['HTTP fixture']}]}}));}}),credentials:()=>({})});app.documents=new DocumentService(app.context,app.evidence,app.connectors);
  const queued=await call('literature_task_create',{kind:'search',search:{query:'fixture',sources:['crossref']}},'search-job');assert.equal(queued.status,200,JSON.stringify(queued));assert.equal(requests,0);assert.equal((await call('literature_task_cancel',{taskId:queued.value.id})).value.state,'cancelled');const cancelled=(await call('literature_task_inspect',{taskId:queued.value.id})).value;const retried=await call('literature_task_retry',{taskId:queued.value.id,expectedVersion:cancelled.version});assert.equal(retried.status,200,JSON.stringify(retried));assert.notEqual(retried.value.id,queued.value.id);
  const running=app.store.get('literature-task',retried.value.id);app.store.update('literature-task',running.id,running.version,{state:'running',phase:'requesting',generation:1,leaseUntil:Date.now()+30000,deadline:Date.now()+30000});await app.literatureTasks.execute(running.id,1);const done=await call('literature_task_inspect',{taskId:running.id});assert.equal(done.value.state,'succeeded',JSON.stringify(done));assert.equal(done.value.searchResult.items[0].id,'10.1000/http-fixture');assert.equal(requests,1);
  const session=app.sessions.create(USER,p.id,{}),actor={type:'agent',projectId:p.id,sessionId:session.id,role:'coordinator',generation:0};await assert.rejects(()=>new ToolDispatcher(app).execute(actor,'document_import',input,'agent-import'),{code:'TOOL_DENIED'});
 }finally{await server.close();assert.equal(dirname(dir),resolve(tmpdir()));rmSync(dir,{recursive:true,force:true});}
});
