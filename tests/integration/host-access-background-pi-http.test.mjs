import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';

test('busy HTTP enable preserves the current real Pi turn and automatically upgrades its queued follow-up',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-background-host-')),out=join(dir,'host-result.txt'),requests=[];
 let release;const gate=new Promise(resolve=>{release=resolve;});
 const fixture=createServer(async(req,res)=>{
  let body='';for await(const part of req)body+=part;const input=JSON.parse(body);requests.push(input);
  if(requests.length===1)await gate;
  res.writeHead(200,{'content-type':'text/event-stream'});
  const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:'background-host-'+requests.length,object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  const last=input.messages.at(-1),full=input.tools.some(t=>t.function.name==='host_execute');
  if(last?.role!=='tool'){
   const name=full?'host_execute':'workspace_read',args=full?{argv:[process.execPath,'-e',"require('node:fs').appendFileSync(process.argv[1],'host once\\n');console.log('background host succeeded')",out]}:{path:'current.txt'};
   chunk({role:'assistant',tool_calls:[{index:0,id:full?'next-host':'current-read',type:'function',function:{name,arguments:JSON.stringify({input:args})}}]});chunk({},'tool_calls');
  }else{chunk({role:'assistant',content:'当前轮次已正常完成。'});chunk({},'stop');}
  res.end('data: [DONE]\n\n');
 });
 await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 const service=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0});
 writeFileSync(join(dir,'data','models.json'),JSON.stringify({providers:{'offline-background':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:1024}]}}}));
 const savedKey=process.env.PI_API_KEY;delete process.env.PI_API_KEY;
 try{
  const port=await service.listen(),call=async(path,body,key=crypto.randomUUID())=>{
   const response=await fetch(`http://127.0.0.1:${port}/api${path}`,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'content-type':'application/json','idempotency-key':key},...(body===undefined?{}:{body:JSON.stringify(body)})});
   const value=await response.json();assert.equal(response.status,200,JSON.stringify(value));return value;
  };
  await call('/settings/model',{provider:'offline-background',model:'fixture',thinking:'off'});
  const project=await call('/projects',{name:'Background host acceptance'}),session=await call('/sessions',{projectId:project.id,title:'Busy host enable'});
  writeFileSync(join(service.app.store.paths.physical(session.workspace),'current.txt'),'current read survives permission request');
  const first=await call(`/sessions/${session.id}/messages`,{content:'busy-enable-current'});
  const startDeadline=Date.now()+20000;while(!requests.length&&Date.now()<startDeadline)await delay(20);
  assert.equal(requests.length,1);assert.equal(service.app.store.get('session',session.id).state,'running');
  const next=await call(`/sessions/${session.id}/messages`,{content:'background-next'}),before=service.app.store.get('message',next.id).permission;
  const initial=await call(`/sessions/${session.id}/host-access`),body={enabled:true,expectedVersion:initial.version,acknowledgedSameUserAccess:true};
  const accepted=await call(`/sessions/${session.id}/host-access`,body,'busy-enable-once');
  assert.equal(accepted.pending,true);assert.equal(accepted.enabled,false);assert.equal(accepted.epoch,initial.epoch);
  assert.deepEqual(service.app.store.get('message',next.id).permission,before);
  assert.equal(service.app.store.get('message',first.id).status,'running');assert.equal(requests.length,1);
  release();
  const deadline=Date.now()+25000;while(Date.now()<deadline){if(service.app.store.get('message',next.id).status==='completed'&&!service.host.active.has(session.id))break;await delay(20);}
  assert.equal(service.app.store.get('message',first.id).status,'completed');assert.equal(service.app.store.get('message',next.id).status,'completed');
  assert.equal(readFileSync(out,'utf8'),'host once\n');assert.equal(service.app.store.list('host-command',project.id).length,1);
  assert.equal(requests.length,4);assert.ok(requests.slice(0,2).every(r=>!r.tools.some(t=>t.function.name==='host_execute')));
  assert.ok(requests.slice(2).every(r=>r.tools.some(t=>t.function.name==='host_execute')));
  assert.match(JSON.stringify(requests[1].messages),/current read survives permission request/);assert.doesNotMatch(JSON.stringify(requests),/SESSION_PERMISSION_STALE/);
  const enabled=await call(`/sessions/${session.id}/host-access`);assert.equal(enabled.pending,false);assert.equal(enabled.enabled,true);
  assert.equal(service.app.store.get('message',next.id).permission.mode,'fullAccess');
  assert.equal(service.app.store.get('message',first.id).permission.mode,before.mode);
  await call(`/sessions/${session.id}/host-access`,{enabled:false,expectedVersion:enabled.version});
  const replay=await call(`/sessions/${session.id}/host-access`,body,'busy-enable-once');assert.equal(replay.enabled,false);assert.equal(replay.pending,false);
 }finally{
  release();if(savedKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=savedKey;
  await service.close();fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));rmSync(dir,{recursive:true,force:true});
 }
});
