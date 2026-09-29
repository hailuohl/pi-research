import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';

test('HTTP/CLI history is bounded, project-scoped, stable on refresh, and cannot launch a model',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-history-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});try{
  const app=server.app,p=app.projects.create(USER,{name:'UNIT historical reads',template:'empty'}),old=app.sessions.create(USER,p.id,{title:'old anchor'});
  // The existing Host persists diagnostics up to 32,000 characters; failed history must remain readable.
  app.store.update('session',old.id,old.version,{lastError:'e'.repeat(32000)});
  for(let i=0;i<40;i++)app.sessions.create(USER,p.id,{title:`new ${i}`});const messages=Array.from({length:23},(_,i)=>app.store.create('message',p.id,{sessionId:old.id,role:'assistant',content:`message ${i}\n`+'内容🙂'.repeat(2500),mode:'prompt',status:'completed'}));
  const port=await server.listen(),base=`http://127.0.0.1:${port}/api`,headers={Authorization:`Bearer ${server.token}`,'Content-Type':'application/json'};
  const read=async path=>{const r=await fetch(base+path,{headers});return {status:r.status,body:await r.json()};},call=async(name,input,projectId=p.id)=>{const r=await fetch(base+'/operations/'+name,{method:'POST',headers,body:JSON.stringify({projectId,input})});return {status:r.status,body:await r.json()};};
  const catalog=await call('session_list',{query:'old anchor'});assert.equal(catalog.status,200);assert.equal(catalog.body.items.length,1);assert.equal(catalog.body.items[0].id,old.id);assert.ok(!JSON.stringify(catalog.body).includes(dir));
  const snapshot=await read(`/projects/${p.id}/state?sessionId=${old.id}`);assert.equal(snapshot.status,200);assert.equal(snapshot.body.sessions.length,31);assert.ok(snapshot.body.sessions.some(s=>s.id===old.id));
  const first=await read(`/sessions/${old.id}/view`);assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.messages.length,10);assert.equal(first.body.history.atLatest,true);assert.equal(first.body.messages.at(-1).id,messages.at(-1).id);assert.equal(first.body.messages[0].previewTruncated,true);
  const older=await call('session_view',{sessionId:old.id,beforeMessageId:first.body.history.beforeMessageId});assert.equal(older.status,200);assert.equal(older.body.history.atLatest,false);assert.deepEqual((await call('session_view',{sessionId:old.id,beforeMessageId:first.body.history.beforeMessageId})).body,older.body);
  const full=await call('session_message_read',{sessionId:old.id,messageId:messages[0].id,limit:64000});assert.equal(full.status,200);assert.equal(full.body.content,messages[0].content);assert.equal(full.body.complete,true);
  const foreign=app.projects.create(USER,{name:'foreign',template:'empty'}),other=app.sessions.create(USER,foreign.id,{});assert.equal((await call('session_view',{sessionId:other.id})).body.error.code,'SCOPE_DENIED');assert.equal((await read(`/projects/${p.id}/state?sessionId=${other.id}`)).body.error.code,'SCOPE_DENIED');assert.equal((await read(`/sessions/${old.id}/view?limit=10&limit=20`)).body.error.code,'INVALID_INPUT');
  const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','session_list','--data',dir,'--project',p.id,'--input','{"query":"old anchor"}'],{encoding:'utf8',windowsHide:true});assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).items[0].id,old.id);
  const actor={type:'agent',projectId:p.id,sessionId:old.id,role:'coordinator',generation:0};await assert.rejects(new ToolDispatcher(app).execute(actor,'session_view',{sessionId:old.id},'denied'),{code:'TOOL_DENIED'});
  assert.equal(app.store.list('model-usage').length,0);assert.equal(app.store.list('model-http-request').length,0);assert.equal(app.store.list('message',p.id).length,messages.length);
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});
