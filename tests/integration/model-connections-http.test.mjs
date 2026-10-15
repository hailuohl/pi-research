import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,existsSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fork} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {configureModelConnection} from '../../dist/packages/pi-adapter/model-connections.js';
import {setup,USER} from '../support/research.mjs';
import {publicationImageCatalog} from '../../dist/packages/pi-adapter/publication-image.js';
import {locatePi} from '../../dist/packages/pi-adapter/runtime.js';

test('owner HTTP configuration reaches the real Pi Worker, survives restart and keeps secrets out of history and HTTP output',async()=>{
 const dir=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-connection-http-')),requests=[],fakeKey='!FAKE_literal_key_not_a_command';
 const fixture=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body);requests.push({path:req.url,authorization:req.headers.authorization,headers:req.headers,input});
  if(JSON.stringify(input.messages.at(-1)).includes('fixture-failure')){res.writeHead(401,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:fakeKey}}));return;}
  if(JSON.stringify(input.messages.at(-1)).includes('fixture-sse-error')){res.writeHead(200,{'content-type':'text/event-stream'});res.end(`data: ${JSON.stringify({error:{message:fakeKey,type:'fixture_error'}})}\n\n`);return;}
  res.writeHead(200,{'content-type':'text/event-stream'});
  for(const [delta,finish_reason] of [[{role:'assistant',content:'Local configured connection completed.'},null],[{},'stop']])res.write(`data: ${JSON.stringify({id:'configured-fixture',object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  res.end('data: [DONE]\n\n');
 });await new Promise(r=>fixture.listen(0,'127.0.0.1',r));
 let service=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0}),port;
 const call=async(path,body,key=crypto.randomUUID(),extra={})=>{
  const response=await fetch(`http://127.0.0.1:${port}/api${path}`,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','idempotency-key':key,...extra.headers},...(body===undefined?{}:{body:JSON.stringify(body)}),...Object.fromEntries(Object.entries(extra).filter(([k])=>k!=='headers'))});
  const value=await response.json();assert.ok(!JSON.stringify(value).includes(fakeKey));return {status:response.status,value};
 };
 const ok=async(...args)=>{const r=await call(...args);assert.equal(r.status,200,JSON.stringify(r.value));return r.value;};
 const settle=async id=>{const end=Date.now()+30000;while(Date.now()<end){const message=service.app.store.get('message',id);if(['completed','failed'].includes(message.status)&&!service.host.active.has(message.sessionId))return message;await delay(25);}throw new Error('Configured real Pi Worker did not settle');};
 try{
  const oldHeaders={Authorization:'Bearer FAKE_OLD_PROVIDER_HEADER','X-Api-Key':'FAKE_OLD_MODEL_HEADER','X-Override-Key':'FAKE_OLD_OVERRIDE_HEADER'};
  const manual=JSON.stringify({
   providers:{
    'manual-preserved':{
     api:'openai-completions',baseUrl:'https://manual.invalid/v1',apiKey:'manual-fake-key',
     headers:{Authorization:oldHeaders.Authorization},
     models:[{id:'known',input:['text','image'],reasoning:true,contextWindow:65536,maxTokens:2048,headers:{'X-Api-Key':oldHeaders['X-Api-Key']}}],
     modelOverrides:{known:{headers:{'X-Override-Key':oldHeaders['X-Override-Key']}}}
    }
   }
  });
  writeFileSync(join(dir,'data','models.json'),manual);
  port=await service.listen();assert.equal((await ok('/settings/model-connections')).version,0);
  const project=await ok('/projects',{name:'Provider configuration fixture'}),oldSession=await ok('/sessions',{projectId:project.id,title:'Existing untouched session'}),oldModel=oldSession.model;
  const config={expectedVersion:0,provider:'new-configured-provider',name:'Local fixture',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,api:'openai-completions',apiKey:fakeKey};
  assert.equal((await call('/settings/model-connections',config,'origin-denied',{headers:{origin:'https://other.invalid'}})).status,403);
  assert.equal((await call('/settings/model-connections',config,'method-denied',{method:'PUT'})).status,405);
  assert.equal((await call('/settings/model-connections?x=1',config,'query-denied')).status,405);
  const saved=await ok('/settings/model-connections',config,'save-connection');assert.equal(saved.connections[0].hasApiKey,true);assert.equal(saved.liveVerified,false);assert.equal(requests.length,0);assert.deepEqual(await ok('/settings/model-connections',config,'save-connection'),saved);
  assert.equal((await call('/settings/model-connections',{...config,name:'stale'},'stale')).value.error.code,'VERSION_CONFLICT');
  const bootstrap=await ok('/bootstrap'),model=await ok('/settings/model',{provider:config.provider,model:'unknown-text-model',thinking:'off',expectedVersion:bootstrap.modelVersion});assert.equal(model.version,1);
  assert.equal((await call('/settings/model',{provider:config.provider,model:'wrong',thinking:'off',expectedVersion:0})).value.error.code,'VERSION_CONFLICT');
  const session=await ok('/sessions',{projectId:project.id,title:'New configured Worker'}),message=await ok(`/sessions/${session.id}/messages`,{content:'fixture-success'});assert.equal((await settle(message.id)).status,'completed');
  assert.equal(requests.length,1);assert.equal(requests[0].path,'/v1/chat/completions');assert.equal(requests[0].authorization,'Bearer '+fakeKey);assert.ok(!JSON.stringify(requests[0].input).includes(fakeKey));assert.equal(requests[0].input.model,'unknown-text-model');
  assert.ok(service.app.sessions.messages({type:'user'},session.id).some(m=>m.role==='assistant'&&m.content.includes('Local configured connection completed.')));
  const native=service.app.store.paths.physical(service.app.sessions.get({type:'user'},session.id).piSessionPath);assert.ok(!readFileSync(native,'utf8').includes(fakeKey));
  assert.deepEqual(service.app.sessions.get({type:'user'},oldSession.id).model,oldModel);assert.equal(readFileSync(join(dir,'data','models.json'),'utf8'),manual);
  const auth=join(dir,'data','sessions',session.id,'agent','auth.json');if(existsSync(auth))assert.ok(!readFileSync(auth,'utf8').includes(fakeKey));
  await service.close();service=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0});port=await service.listen();assert.equal((await ok('/settings/model-connections')).version,1);assert.equal((await ok('/bootstrap')).model.provider,config.provider);
  const resumed=await ok(`/sessions/${session.id}/messages`,{content:'fixture-success-after-reopen'});assert.equal((await settle(resumed.id)).status,'completed');assert.equal(requests.length,2);assert.equal(requests[1].authorization,'Bearer '+fakeKey);assert.ok(requests[1].input.messages.some(m=>JSON.stringify(m).includes('Local configured connection completed.')));
  const failedSession=await ok('/sessions',{projectId:project.id,title:'Safe error fixture'}),failed=await ok(`/sessions/${failedSession.id}/messages`,{content:'fixture-failure'});assert.equal((await settle(failed.id)).status,'failed');
  const current=service.app.sessions.get({type:'user'},failedSession.id);assert.ok(!JSON.stringify(current).includes(fakeKey));if(current.piSessionPath)assert.ok(!readFileSync(service.app.store.paths.physical(current.piSessionPath),'utf8').includes(fakeKey));
  const streamSession=await ok('/sessions',{projectId:project.id,title:'HTTP 200 stream error fixture'}),streamInput=await ok(`/sessions/${streamSession.id}/messages`,{content:'fixture-sse-error'});assert.equal((await settle(streamInput.id)).status,'failed');
  const streamResult=service.app.sessions.get({type:'user'},streamSession.id),streamFile=service.app.store.paths.physical(streamResult.piSessionPath),streamTranscript=readFileSync(streamFile,'utf8');
  assert.ok(streamTranscript.includes('PROVIDER_STREAM_FAILED'));assert.ok(!streamTranscript.includes(fakeKey));assert.ok(!JSON.stringify(await ok(`/sessions/${streamSession.id}/view`)).includes(fakeKey));
  await ok('/settings/model-connections',{...config,provider:'manual-preserved',expectedVersion:1});
  await ok('/settings/model',{provider:'manual-preserved',model:'known',thinking:'off',expectedVersion:model.version});
  const knownSession=await ok('/sessions',{projectId:project.id,title:'Existing model with new endpoint'}),knownAgentDir=join(dir,'data','sessions',knownSession.id,'agent'),knownAuth=join(knownAgentDir,'auth.json'),oldAuth=JSON.stringify({'manual-preserved':{type:'api_key',key:'FAKE_OLD_AUTH_FILE_KEY'}});
  mkdirSync(knownAgentDir,{recursive:true});writeFileSync(knownAuth,oldAuth);
  const knownInput=await ok(`/sessions/${knownSession.id}/messages`,{content:'known-metadata-new-endpoint'});assert.equal((await settle(knownInput.id)).status,'completed');
  const knownRequest=requests.at(-1);assert.equal(knownRequest.input.model,'known');assert.equal(knownRequest.authorization,'Bearer '+fakeKey);assert.equal(knownRequest.path,'/v1/chat/completions');
  for(const secret of [...Object.values(oldHeaders),'FAKE_OLD_AUTH_FILE_KEY'])assert.ok(!JSON.stringify(knownRequest.headers).includes(secret));assert.equal(readFileSync(knownAuth,'utf8'),oldAuth);
  for(const table of ['records','events','operations'])assert.ok(!JSON.stringify(service.app.store.db.prepare(`SELECT * FROM ${table}`).all()).includes(fakeKey));
  assert.equal(readFileSync(join(dir,'data','models.json'),'utf8'),manual);
 }finally{await service.close();await new Promise(r=>fixture.close(r));rmSync(dir,{recursive:true,force:true});}
});

test('real Worker sanitizes a 200 response reader exception before native persistence, DB records and IPC',async()=>{
 const s=setup(),fakeKey='!FAKE_reader_error_key',worker=join(s.dir,'reader-worker.mjs'),out=[];
 writeFileSync(worker,`await import(${JSON.stringify(new URL('./core/http-dispatcher.js',pathToFileURL(locatePi(process.cwd()).sdkPath)).href)});globalThis.fetch=async()=>new Response(new ReadableStream({pull(controller){controller.error(new Error(process.env.PI_API_KEY));}}),{headers:{'content-type':'text/event-stream'}});await import(${JSON.stringify(pathToFileURL(resolve('dist/apps/agent-worker/index.js')).href)});`);
 const host=new AgentHost(s.app,{workerEntry:worker});
 try{
  configureModelConnection(s.app.context,USER,{expectedVersion:0,provider:'reader-fixture',name:'reader',baseUrl:'http://127.0.0.1:1/v1',api:'openai-completions',apiKey:fakeKey},'reader-config');
  s.app.sessions.configure(USER,{provider:'reader-fixture',model:'reader-fixture',thinking:'off'});const session=s.app.sessions.create(USER,s.project.id,{title:'Reader error'}),input=s.app.sessions.send(USER,session.id,{content:'reader error fixture'});
  host.tick();assert.ok(host.active.has(session.id));host.active.get(session.id).child.on('message',m=>out.push(JSON.stringify(m)));
  const end=Date.now()+30000;while(host.active.has(session.id)&&Date.now()<end)await delay(25);assert.equal(host.active.has(session.id),false);assert.equal(s.app.store.get('message',input.id).status,'failed');
  const current=s.app.sessions.get(USER,session.id),native=readFileSync(s.app.store.paths.physical(current.piSessionPath),'utf8');assert.ok(native.includes('PROVIDER_STREAM_FAILED'));assert.ok(!native.includes(fakeKey));assert.ok(!out.join('\n').includes(fakeKey));
  for(const table of ['records','events','operations'])assert.ok(!JSON.stringify(s.app.store.db.prepare(`SELECT * FROM ${table}`).all()).includes(fakeKey));
  const http=s.app.modelHttp.inspect(USER,s.project.id);assert.equal(http.counts.active,0);assert.equal(http.counts.unknown,0);assert.ok(http.items.some(i=>i.state==='failed'&&i.httpStatus===200));
 }finally{await host.stop();s.close();}
});

test('host binds the selected endpoint and key to one catalog snapshot across an A-B-A edit before launch',async()=>{
 const s=setup(),worker=join(s.dir,'snapshot-worker.mjs'),a={provider:'snapshot-fixture',name:'A',baseUrl:'https://a.invalid/v1',api:'openai-completions',apiKey:'!FAKE_snapshot_A'},b={...a,name:'B',baseUrl:'https://b.invalid/v1',apiKey:'!FAKE_snapshot_B'};let environment;
 writeFileSync(worker,`process.on('message',m=>{if(m.type!=='start')return;process.send({type:'ready',model:{provider:m.model.provider,id:m.model.model}});process.send({type:'assistant_message',content:JSON.stringify({connection:m.connection,catalogFingerprint:m.catalogFingerprint}),stopReason:'stop'});process.send({type:'done'});setTimeout(()=>process.exit(0),30);});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'SNAPSHOT_FIXTURE',message:'No model request'}),workerEntry:worker,fork:(entry,args,options)=>{environment=options.env.PI_API_KEY;configureModelConnection(s.app.context,USER,{...a,expectedVersion:2},'back-to-a');return fork(entry,args,options);}});
 try{
  configureModelConnection(s.app.context,USER,{...a,expectedVersion:0},'initial-a');s.app.sessions.configure(USER,{provider:a.provider,model:'snapshot-model',thinking:'off'});
  const session=s.app.sessions.create(USER,s.project.id,{title:'A-B-A snapshot'}),definitions=host.tools.definitions.bind(host.tools);let changed=false;
  host.tools.definitions=(...args)=>{if(!changed){changed=true;configureModelConnection(s.app.context,USER,{...b,expectedVersion:1},'interleaved-b');}return definitions(...args);};
  const input=s.app.sessions.send(USER,session.id,{content:'snapshot fixture'});host.tick();const end=Date.now()+15000;while(host.active.has(session.id)&&Date.now()<end)await delay(25);
  assert.equal(host.active.has(session.id),false);assert.equal(s.app.store.get('message',input.id).status,'completed');assert.equal(changed,true);
  const result=JSON.parse(s.app.sessions.messages(USER,session.id).find(m=>m.role==='assistant').content);
  assert.equal(result.connection.baseUrl,a.baseUrl);assert.equal(environment,a.apiKey);assert.equal(result.catalogFingerprint,publicationImageCatalog(join(s.dir,'models.json')));assert.equal(Object.hasOwn(result.connection,'apiKey'),false);
 }finally{await host.stop();s.close();}
});
