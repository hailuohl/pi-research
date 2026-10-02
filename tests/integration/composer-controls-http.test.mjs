import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';

test('HTTP composer configuration and actual pinned Pi read a bound text attachment without external provider calls',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-composer-')),requests=[];
 const fixture=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body);requests.push(input);
  res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:'fixture-'+requests.length,object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  const user=input.messages.filter(m=>m.role==='user').at(-1),prompt=typeof user?.content==='string'?user.content:(user?.content??[]).filter(p=>p.type==='text').map(p=>p.text).join('\n');
  if(input.messages.at(-1)?.role!=='tool'&&prompt?.includes('attachments')){
   const refs=JSON.parse(prompt.slice(prompt.lastIndexOf('\n')+1));
   chunk({role:'assistant',tool_calls:[{index:0,id:'read-attached-'+requests.length,type:'function',function:{name:'session_attachment_read',arguments:JSON.stringify({input:{messageId:refs.messageId,documentVersionId:refs.attachments[0].documentVersionId,cursor:0,limit:64000}})}}]});chunk({},'tool_calls');
  }else{chunk({role:'assistant',content:'本机验收夹具回执'});chunk({},'stop');}
  res.end('data: [DONE]\n\n');
 });await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 writeFileSync(join(dir,'models.json'),JSON.stringify({providers:{'offline-composer':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:1024},{id:'alternate',contextWindow:32768,maxTokens:1024}]}}}));
 const service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 const savedKey=process.env.PI_API_KEY;delete process.env.PI_API_KEY;
 try{
  const port=await service.listen(),url=`http://127.0.0.1:${port}`;
  const call=async(path,body)=>{const response=await fetch(url+'/api'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'content-type':'application/json','idempotency-key':crypto.randomUUID()},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;};
  const first={provider:'offline-composer',model:'fixture',thinking:'off'},second={...first,model:'alternate'};
  await call('/settings/model',first);await call('/settings/model',second);
  const boot=await call('/bootstrap');assert.deepEqual(boot.models,[second,first]);assert.equal(boot.runtime.ready,true);
  const project=await call('/projects',{name:'Composer HTTP fixture'}),session=await call('/sessions',{projectId:project.id,title:'Actual Pi local fixture'});
  const selected=await call(`/sessions/${session.id}/model`,{expectedVersion:session.version,model:first});assert.deepEqual(selected.model,first);assert.deepEqual((await call('/bootstrap')).model,second);
  const settings=await call(`/projects/${project.id}/connectors`),enabled=await call(`/projects/${project.id}/connectors`,{expectedVersion:settings.version,enabled:{openalex:true}});assert.equal(enabled.enabled.openalex,true);
  const text='Explicit attached UTF-8 research fixture. 🧪',doc=await call('/operations/document_import',{projectId:project.id,input:{title:'fixture.md',mediaType:'text/markdown',contentBase64:Buffer.from(text).toString('base64')}});
  const message=await call(`/sessions/${session.id}/messages`,{content:'读取这个附件',attachmentDocumentIds:[doc.id]});assert.equal(message.attachments[0].documentVersionId,doc.id);
  const end=Date.now()+20000;while(Date.now()<end){if(service.app.store.get('message',message.id).status==='completed'&&service.host.active.size===0)break;await delay(20);}
  assert.equal(service.app.store.get('message',message.id).status,'completed');assert.equal(requests.length,2);assert.equal(requests[0].model,'fixture');assert.ok(JSON.stringify(requests[1].messages).includes(text));
  const history=await call(`/sessions/${session.id}/view`);assert.equal(history.messages.find(m=>m.id===message.id).attachments[0].artifactId,doc.original.artifactId);
  const idle=service.app.sessions.get({type:'user'},session.id);await call(`/sessions/${session.id}/model`,{expectedVersion:idle.version,model:second});
  const next=await call(`/sessions/${session.id}/messages`,{content:'切换模型后的普通消息'});
  const secondEnd=Date.now()+20000;while(Date.now()<secondEnd){if(service.app.store.get('message',next.id).status==='completed'&&service.host.active.size===0)break;await delay(20);}
  assert.equal(service.app.store.get('message',next.id).status,'completed');assert.equal(requests.at(-1).model,'alternate');
  assert.equal(service.app.store.get('message',message.id).attachments[0].digest,doc.original.digest);
 }finally{
  if(savedKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=savedKey;
  await service.close();fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));rmSync(dir,{recursive:true,force:true});
 }
});
