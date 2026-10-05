import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';

test('actual pinned Pi worker invokes host_execute only after explicit HTTP enable; revoke and old HTTP replay do not revive access',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-full-sdk-')),out=join(dir,'real-command.txt'),requests=[];
 const fixture=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body);requests.push(input);res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:'host-fixture-'+requests.length,object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  if(input.messages.at(-1)?.role!=='tool'&&input.tools?.some(tool=>tool.function.name==='host_execute')){chunk({role:'assistant',tool_calls:[{index:0,id:'host-call',type:'function',function:{name:'host_execute',arguments:JSON.stringify({input:{argv:[process.execPath,'-e',JSON.stringify(input.messages).includes('host-stop-fixture')?"require('node:fs').writeFileSync(process.argv[1],'started');setInterval(()=>{},1000)":"require('node:fs').writeFileSync(process.argv[1],'pinned Pi host marker');console.log('real host command')",out]}})}}]});chunk({},'tool_calls');}
  else{chunk({role:'assistant',content:'本机固定回执：测试真实 Pi 工具与宿主执行，没有外部模型调用。'});chunk({},'stop');}res.end('data: [DONE]\n\n');});
 await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 writeFileSync(join(dir,'models.json'),JSON.stringify({providers:{'offline-full':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:1024}]}}}));
 const service=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0});
 // The configured provider file belongs to the server data root.
 writeFileSync(join(dir,'data','models.json'),readFileSync(join(dir,'models.json')));
 const savedKey=process.env.PI_API_KEY;delete process.env.PI_API_KEY;
 try{const port=await service.listen(),url=`http://127.0.0.1:${port}`;
  const call=async(path,body,key=crypto.randomUUID())=>{const response=await fetch(url+'/api'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'content-type':'application/json','idempotency-key':key},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;};
  await call('/settings/model',{provider:'offline-full',model:'fixture',thinking:'off'});const project=await call('/projects',{name:'Full access HTTP fixture'}),session=await call('/sessions',{projectId:project.id,title:'Full access pinned Pi fixture'});
  const initial=await call(`/sessions/${session.id}/host-access`);assert.equal(initial.enabled,false);const enableBody={enabled:true,expectedVersion:initial.version,acknowledgedSameUserAccess:true};const enabled=await call(`/sessions/${session.id}/host-access`,enableBody,'enable-once');assert.equal(enabled.enabled,true);
  const message=await call(`/sessions/${session.id}/messages`,{content:'执行本机验收夹具的固定宿主命令'});
  const deadline=Date.now()+20000;while(Date.now()<deadline){if(service.app.store.get('message',message.id).status==='completed'&&service.host.active.size===0)break;await delay(20);}
  assert.equal(service.app.store.get('message',message.id).status,'completed');assert.equal(readFileSync(out,'utf8'),'pinned Pi host marker');assert.equal(requests.length,2);assert.ok(requests[0].tools.some(t=>t.function.name==='host_execute'));assert.match(JSON.stringify(requests[1].messages),/real host command/);
  const jobs=service.app.store.list('host-command',project.id);assert.equal(jobs.length,1);assert.equal(jobs[0].state,'succeeded');
  const revoked=await call(`/sessions/${session.id}/host-access`,{enabled:false,expectedVersion:enabled.version});assert.equal(revoked.enabled,false);const replay=await call(`/sessions/${session.id}/host-access`,enableBody,'enable-once');assert.equal(replay.enabled,false);assert.equal(replay.epoch,revoked.epoch);
  const next=await call(`/sessions/${session.id}/messages`,{content:'关闭后的固定回执'});const nextEnd=Date.now()+20000;while(Date.now()<nextEnd){if(service.app.store.get('message',next.id).status==='completed'&&service.host.active.size===0)break;await delay(20);}assert.equal(service.app.store.get('message',next.id).status,'completed');assert.equal(requests.at(-1).tools.some(t=>t.function.name==='host_execute'),false);assert.equal(service.app.store.list('host-command').length,1);
  const another=await call('/sessions',{projectId:project.id,title:'Revoke during actual Pi execution'});await call(`/sessions/${another.id}/host-access`,{enabled:true,expectedVersion:0,acknowledgedSameUserAccess:true});const hold=await call(`/sessions/${another.id}/messages`,{content:'host-stop-fixture'});let runningJob;const waitStart=Date.now()+20000;while(Date.now()<waitStart){runningJob=service.app.store.list('host-command',project.id).find(j=>j.sessionId===another.id&&j.state==='running');if(runningJob&&readFileSync(out,'utf8')==='started')break;await delay(20);}assert.ok(runningJob);const activeGrant=await call(`/sessions/${another.id}/host-access`);await call(`/sessions/${another.id}/host-access`,{enabled:false,expectedVersion:activeGrant.version});const waitEnd=Date.now()+20000;while(Date.now()<waitEnd){if(service.app.store.get('message',hold.id).status==='completed'&&!service.host.active.has(another.id))break;await delay(20);}assert.equal(service.app.store.get('message',hold.id).status,'completed');assert.equal(service.app.store.get('host-command',runningJob.id).state,'cancelled');const activities=service.app.store.db.prepare("SELECT payload FROM events WHERE type='session.activity' AND project_id=? ORDER BY seq").all(project.id).map(r=>JSON.parse(r.payload)).filter(e=>e.sessionId===another.id&&e.tool==='host_execute');assert.deepEqual(activities.map(e=>e.status),['running','failed']);assert.ok(service.app.store.list('message',project.id).some(m=>m.sessionId===another.id&&m.role==='system'&&m.status==='failed'));

 }finally{if(savedKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=savedKey;await service.close();fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));rmSync(dir,{recursive:true,force:true});}
});
