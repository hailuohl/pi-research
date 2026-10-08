import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,readdirSync,existsSync,mkdtempSync,rmSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {configureModelConnection,inspectModelConnections,selectedModelConnection,applyModelConnection,connectionFetch,safeConnectionStream,readModelState} from '../../dist/packages/pi-adapter/model-connections.js';
import {publicationImageCatalog} from '../../dist/packages/pi-adapter/publication-image.js';
import {safePath,listFiles} from '../../dist/packages/workspace/files.js';
import {excluded} from '../../dist/packages/publications/reports.js';
import {createDataBackup,restoreDataBackup} from '../../dist/packages/storage/backup.js';
const key='!FAKE_literal_key_for_local_test',input={expectedVersion:0,provider:'fixture-provider',name:'Fixture connection',baseUrl:'https://fixture.invalid/v1',api:'openai-completions',apiKey:key};

test('connection CAS/replay survives reopening without publishing secrets, changing model history, or weakening endpoint provenance',()=>{
 const s=setup();try{
  const original=JSON.stringify(s.app.sessions.get(USER,s.session.id)),catalog=join(s.dir,'models.json');writeFileSync(catalog,'{"providers":{}}');const manual=readFileSync(catalog),before=publicationImageCatalog(catalog);
  assert.throws(()=>configureModelConnection(s.app.context,{type:'agent'},input,'denied'),{code:'PERMISSION_DENIED'});
  const result=configureModelConnection(s.app.context,USER,input,'save');assert.equal(result.version,1);assert.equal(result.connections[0].hasApiKey,true);assert.equal(result.liveVerified,false);assert.ok(!JSON.stringify(result).includes(key));assert.notEqual(publicationImageCatalog(catalog),before);
  assert.deepEqual(configureModelConnection(s.app.context,USER,input,'save'),result);assert.throws(()=>configureModelConnection(s.app.context,USER,{...input,name:'other'},'save'),{code:'IDEMPOTENCY_CONFLICT'});
  const saved=readFileSync(join(s.dir,'model-connections.json'));assert.throws(()=>configureModelConnection(s.app.context,USER,{...input,name:'stale'},'stale'),{code:'VERSION_CONFLICT'});assert.deepEqual(readFileSync(join(s.dir,'model-connections.json')),saved);
  for(const change of [{baseUrl:'http://public.invalid'},{baseUrl:'https://user:pass@fixture.invalid'},{baseUrl:'https://fixture.invalid?secret=x'},{baseUrl:'https://fixture.invalid#secret'},{api:'google-generative-ai'},{apiKey:''},{headers:{Authorization:key}}])assert.throws(()=>configureModelConnection(s.app.context,USER,{...input,expectedVersion:1,...change},'bad'),{code:'INVALID_INPUT'});
  const fingerprint=publicationImageCatalog(catalog),{apiKey,...withoutKey}=input;
  configureModelConnection(s.app.context,USER,{...withoutKey,expectedVersion:1,name:'renamed'},'rename');assert.equal(selectedModelConnection(s.dir,input.provider).apiKey,key);assert.equal(publicationImageCatalog(catalog),fingerprint);
  configureModelConnection(s.app.context,USER,{...input,expectedVersion:2,baseUrl:'http://127.0.0.1:4319/v1'},'move');assert.notEqual(publicationImageCatalog(catalog),fingerprint);
  const db=s.app.store.db;assert.ok(!JSON.stringify(db.prepare('SELECT data FROM records').all()).includes(key));assert.ok(!JSON.stringify(db.prepare('SELECT * FROM operations').all()).includes(key));assert.ok(!JSON.stringify(db.prepare('SELECT * FROM events').all()).includes(key));
  assert.deepEqual(readFileSync(catalog),manual);assert.equal(JSON.stringify(s.app.sessions.get(USER,s.session.id)),original);assert.deepEqual(readdirSync(s.dir).filter(n=>n.endsWith('.tmp')),[]);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.equal(inspectModelConnections(s.app.context,USER).version,3);assert.equal(selectedModelConnection(s.dir,input.provider).apiKey,key);
  const previous=s.app.sessions.model(),first=s.app.sessions.configure(USER,{provider:input.provider,model:'custom',thinking:'high',expectedVersion:0});assert.equal(first.version,1);assert.throws(()=>s.app.sessions.configure(USER,{...previous,provider:'other',model:'other',expectedVersion:0}),{code:'VERSION_CONFLICT'});assert.equal(s.app.sessions.model().model,'custom');
 }finally{s.close();}
});

test('runtime registration preserves known metadata, keeps unknown models text-only, and never interprets literal keys',async()=>{
 const sdk=await import('@earendil-works/pi-coding-agent'),s=setup();try{
  const oldHeaders={Authorization:'Bearer FAKE_OLD_PROVIDER_HEADER','X-Api-Key':'FAKE_OLD_MODEL_HEADER','X-Override-Key':'FAKE_OLD_OVERRIDE_HEADER'};
  const models=join(s.dir,'models.json'),auth=join(s.dir,'auth.json');writeFileSync(auth,'{}');
  writeFileSync(models,JSON.stringify({
   providers:{
    'manual-fixture':{
     baseUrl:'https://manual.invalid/v1',api:'openai-completions',apiKey:'manual-fake-key',
     headers:{Authorization:oldHeaders.Authorization},
     models:[{id:'known',headers:{'X-Api-Key':oldHeaders['X-Api-Key']},input:['text','image'],reasoning:true,contextWindow:65536,maxTokens:2048}],
     modelOverrides:{known:{headers:{'X-Override-Key':oldHeaders['X-Override-Key']}}}
    }
   }
  }));
  const priorModels=readFileSync(models),priorAuth=readFileSync(auth),source=await sdk.ModelRuntime.create({modelsPath:models,authPath:auth,modelsStorePath:join(s.dir,'models-store.json'),allowModelNetwork:false,refreshOnCreate:false});
  const originalAuth=await source.getAuth(source.getModel('manual-fixture','known'));for(const secret of Object.values(oldHeaders))assert.ok(JSON.stringify(originalAuth).includes(secret));
  const config={provider:'manual-fixture',name:'manual',baseUrl:'https://changed.invalid/v1',api:'openai-responses'},runtime=await applyModelConnection(sdk,source,{provider:config.provider,model:'known',thinking:'high'},config,key,auth),known=runtime.getModel(config.provider,'known');
  assert.deepEqual(known.input,['text','image']);assert.equal(known.contextWindow,65536);assert.equal(known.maxTokens,2048);assert.equal(known.api,'openai-responses');assert.equal(known.baseUrl,config.baseUrl);assert.equal((await runtime.getAuth(config.provider)).auth.apiKey,key);
  const authResult=await runtime.getAuth(known);assert.equal(authResult.auth.apiKey,key);for(const secret of Object.values(oldHeaders))assert.ok(!JSON.stringify(authResult).includes(secret));assert.equal(known.headers,undefined);
  const custom={...config,provider:'new-provider'},unknownRuntime=await applyModelConnection(sdk,source,{provider:custom.provider,model:'unknown',thinking:'high'},custom,key,auth),unknown=unknownRuntime.getModel(custom.provider,'unknown');assert.deepEqual(unknown.input,['text']);assert.equal(unknown.contextWindow,32768);assert.equal(unknown.maxTokens,4096);assert.equal(unknown.reasoning,true);assert.deepEqual(readFileSync(models),priorModels);assert.deepEqual(readFileSync(auth),priorAuth);
  let calls=0;const transport=connectionFetch(async(_input,init)=>{calls++;assert.equal(init.redirect,'error');return new Response(key,{status:401});},config.baseUrl);
  assert.equal(await (await transport(config.baseUrl+'/responses')).text(),'Model provider request failed');await assert.rejects(()=>transport('https://elsewhere.invalid'),{code:'MODEL_CONNECTION_ORIGIN_DENIED'});assert.equal(calls,1);
  await assert.rejects(()=>connectionFetch(async()=>{throw new Error(key);},config.baseUrl)(config.baseUrl),e=>!e.message.includes(key)&&e.message.startsWith('PROVIDER_REQUEST_FAILED'));
  const {AssistantMessageEventStream}=await import('@earendil-works/pi-ai'),usage={input:7,output:3,cacheRead:0,cacheWrite:0,totalTokens:10,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}};
  for(const stopReason of ['stop','error','aborted']){
   const message={role:'assistant',content:[{type:'text',text:'partial answer'}],api:'openai-completions',provider:'fixture',model:'fixture',usage,stopReason,timestamp:1,...(stopReason==='stop'?{}:{errorMessage:key})},source=new AssistantMessageEventStream();
   source.push(stopReason==='stop'?{type:'done',reason:'stop',message}:{type:'error',reason:stopReason,error:message});source.end();const stream=safeConnectionStream(source),events=[];for await(const event of stream)events.push(event);const result=await stream.result();
   assert.equal(result.stopReason,stopReason);assert.deepEqual(result.usage,usage);assert.deepEqual(result.content,message.content);assert.ok(!JSON.stringify(events).includes(key));assert.ok(!JSON.stringify(result).includes(key));if(stopReason==='stop')assert.equal(result,message);
  }
 }finally{s.close();}
});

test('oversized serialized state or normalized URL is rejected without changing the saved version or bytes',()=>{
 const s=setup();try{
  const large={...input,baseUrl:'https://fixture.invalid/'+('a'.repeat(1970)),apiKey:'密'.repeat(8192)};
  for(let i=0;i<19;i++)configureModelConnection(s.app.context,USER,{...large,expectedVersion:i,provider:'large-'+i},'large-'+i);
  const file=join(s.dir,'model-connections.json'),prior=readFileSync(file);
  assert.throws(()=>configureModelConnection(s.app.context,USER,{...large,expectedVersion:19,provider:'large-19'},'large-19'),{code:'MODEL_CONNECTION_LIMIT',status:413});
  assert.throws(()=>configureModelConnection(s.app.context,USER,{...input,expectedVersion:19,baseUrl:'https://fixture.invalid/'+('中'.repeat(500))},'expanded-url'),{code:'INVALID_INPUT',status:400});
  assert.deepEqual(readFileSync(file),prior);assert.equal(inspectModelConnections(s.app.context,USER).version,19);
 }finally{s.close();}
});

test('private connection files and abandoned temp writes stay out of snapshots, exports, backup and restore',async()=>{
 const parent=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-connection-backup-')),dir=join(parent,'data'),app=new ResearchApp(dir,process.cwd());let closed=false;
 try{
  configureModelConnection(app.context,USER,input,'save');writeFileSync(join(dir,'model-connections.json.fixture.tmp'),key);writeFileSync(join(dir,'MODEL-CONNECTIONS.JSON.UPPER.TMP'),key);writeFileSync(join(dir,'models.json'),'{}');
  for(const name of ['model-connections.json','model-connections.json.fixture.tmp','MODEL-CONNECTIONS.JSON','MODEL-CONNECTIONS.JSON.UPPER.TMP']){assert.throws(()=>safePath(dir,name),{code:'PATH_DENIED'});assert.equal(excluded('nested/'+name),true);}
  assert.ok(!listFiles(dir).some(f=>f.path.toLowerCase().includes('model-connections')));
  app.close();closed=true;const backup=join(parent,'backup'),result=await createDataBackup(dir,backup,{offline:true});assert.ok(result.excluded.includes('model-connections.json'));assert.ok(result.excluded.includes('model-connections.json.fixture.tmp'));assert.ok(result.excluded.includes('MODEL-CONNECTIONS.JSON.UPPER.TMP'));assert.equal(existsSync(join(backup,'data','model-connections.json')),false);
  const restored=join(parent,'restored');await restoreDataBackup(backup,restored,{offline:true,relocate:true});assert.equal(existsSync(join(restored,'model-connections.json')),true);const state=readModelState(restored);assert.equal(state.connections[0].apiKey,'');assert.equal(state.connections[0].requiresCredential,true);assert.ok(!readFileSync(join(restored,'model-connections.json'),'utf8').includes(key));
 }finally{if(!closed)app.close();rmSync(parent,{recursive:true,force:true});}
});
