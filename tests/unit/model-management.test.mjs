import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {configureModelManagement,inspectModelManagement,availableSelections,recommendedDefinition} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState,configureModelConnection,applyModelConnection,EMPTY_MODEL_CREDENTIALS,mutateModelState} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition,validateModelDefinition,modelPayload} from '../../dist/packages/pi-adapter/model-definition.js';
import {publicationImageCatalog} from '../../dist/packages/pi-adapter/publication-image.js';
const secret='!FAKE_managed_literal_key',provider='managed-fixture';
const version=s=>readModelState(s.dir).version;
const edit=(s,action,fields={},key=crypto.randomUUID())=>configureModelManagement(s.app.context,USER,{expectedVersion:version(s),action,...fields},key);
const connection={name:'Connection',baseUrl:'https://fixture.invalid/v1',api:'openai-completions',apiKey:secret};
const definition=(model='one')=>({...defaultModelDefinition(model),reasoning:{defaultLevel:'boost',levels:[{id:'off',label:'Off',piLevel:'off',parameters:{}},{id:'boost',label:'Boost',piLevel:'high',parameters:{reasoning_effort:'ultra'}}]}});

test('every mutation rejects the 21st legacy control provider and invalid whole-state writes before changing disk',async()=>{
 const s=setup();try{
  for(let i=0;i<20;i++)s.app.sessions.configure(USER,{provider:'legacy-'+i,model:'legacy-model',thinking:'off'});
  for(let i=0;i<20;i++)configureModelConnection(s.app.context,USER,{...connection,provider:'managed-'+i,expectedVersion:version(s)},'managed-'+i);
  const file=join(s.dir,'model-connections.json'),before=readFileSync(file),v=version(s),history=s.app.store.get('app-settings','global');
  const commands=[{action:'provider.enabled',provider:'legacy-0',value:{enabled:false}},{action:'provider.delete',provider:'legacy-0'},{action:'providers.reorder',value:{providers:[...Array.from({length:20},(_,i)=>'managed-'+i),...Array.from({length:20},(_,i)=>'legacy-'+i)]}}];
  for(const cmd of commands){await assert.rejects(()=>configureModelManagement(s.app.context,USER,{expectedVersion:v,...cmd},crypto.randomUUID()),{code:'MODEL_CONNECTION_LIMIT',status:413});assert.deepEqual(readFileSync(file),before);assert.equal(version(s),v);assert.deepEqual(s.app.store.get('app-settings','global'),history);}
  assert.throws(()=>mutateModelState(s.app.context,v,'invalid-shape',{},state=>{state.connections[0].enabled='yes';}),{code:'MODEL_CONNECTION_INVALID'});
  assert.throws(()=>mutateModelState(s.app.context,v,'global-model-count',{},state=>{for(let i=0;i<2;i++)state.connections[i].models=Array.from({length:i?50:51},(_,n)=>({...definition('m-'+i+'-'+n),enabled:true,deletedAt:null,order:n,revision:1}));}),{code:'MODEL_CONNECTION_LIMIT',status:413});
  assert.deepEqual(readFileSync(file),before);assert.equal(readModelState(s.dir).connections.length,20);assert.deepEqual(s.app.store.get('app-settings','global'),history);
 }finally{s.close();}
});

test('independent model CRUD, aliases, default clear, permanent tombstones and reopening preserve old history',async()=>{
 const s=setup();try{
  s.app.sessions.configure(USER,{provider,model:'legacy',thinking:'high'});const oldSession=s.app.sessions.create(USER,s.project.id,{title:'Frozen legacy'}),old=JSON.stringify(s.app.sessions.get(USER,oldSession.id));
  await edit(s,'provider.upsert',{provider,value:connection});const priorDefault=s.app.sessions.model();
  const one=definition();await edit(s,'model.upsert',{provider,model:one.model,value:one});assert.deepEqual(s.app.sessions.model(),priorDefault);
  assert.ok(availableSelections(s.app.context).some(m=>m.model==='one'&&m.thinking==='boost'));assert.ok(availableSelections(s.app.context).some(m=>m.model==='legacy'&&m.thinking==='max'));
  const settings=s.app.store.get('app-settings','global');s.app.sessions.configure(USER,{provider,model:'one',thinking:'boost',expectedVersion:settings.version});assert.ok(!s.app.store.get('app-settings','global').models.some(m=>m.model==='one'));
  await assert.rejects(()=>edit(s,'model.delete',{provider,model:'one'}),{code:'DEFAULT_MODEL_IN_USE'});
  await assert.rejects(()=>edit(s,'provider.enabled',{provider,value:{enabled:false}}),{code:'DEFAULT_MODEL_IN_USE'});
  await assert.rejects(()=>edit(s,'model.upsert',{provider,model:'one',value:{...one,reasoning:{defaultLevel:'off',levels:one.reasoning.levels.slice(0,1)}}}),{code:'DEFAULT_MODEL_IN_USE'});
  const frozen=s.app.sessions.create(USER,s.project.id,{title:'Alias history'});s.app.sessions.configure(USER,{clear:true,expectedVersion:s.app.store.get('app-settings','global').version});assert.deepEqual(s.app.sessions.model(),{provider:'',model:'',thinking:'off'});
  await edit(s,'model.enabled',{provider,model:'one',value:{enabled:false}});assert.ok(!availableSelections(s.app.context).some(m=>m.model==='one'));assert.deepEqual(s.app.sessions.get(USER,frozen.id).model,{provider,model:'one',thinking:'boost'});
  await edit(s,'model.delete',{provider,model:'one'});await assert.rejects(()=>edit(s,'model.upsert',{provider,model:'one',value:one}),{code:'MODEL_DELETED'});
  await edit(s,'model.delete',{provider,model:'legacy'});assert.ok(!availableSelections(s.app.context).some(m=>m.provider===provider));assert.throws(()=>s.app.sessions.configure(USER,{provider,model:'legacy',thinking:'high'}),{code:'MODEL_DISABLED'});
  assert.equal(JSON.stringify(s.app.sessions.get(USER,oldSession.id)),old);const publicView=await inspectModelManagement(s.app.context,USER);assert.ok(!JSON.stringify(publicView).includes(secret));assert.ok(publicView.providers[0].models.every(m=>m.deletedAt));
  await edit(s,'provider.delete',{provider});await assert.rejects(()=>edit(s,'provider.upsert',{provider,value:connection}),{code:'MODEL_DELETED'});assert.ok(!readFileSync(join(s.dir,'model-connections.json'),'utf8').includes(secret));
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.deepEqual(s.app.sessions.model(),{provider:'',model:'',thinking:'off'});assert.ok(!availableSelections(s.app.context).some(m=>m.provider===provider));assert.equal(JSON.stringify(s.app.sessions.get(USER,oldSession.id)),old);
 }finally{s.close();}
});

test('metadata/parameter changes bind image provenance, display ordering does not, unsafe nested JSON fails before save',async()=>{
 const s=setup();try{
  await edit(s,'provider.upsert',{provider,value:connection});const one=definition(),two=definition('two');await edit(s,'model.upsert',{provider,model:'one',value:one});await edit(s,'model.upsert',{provider,model:'two',value:two});const catalog=join(s.dir,'models.json'),before=publicationImageCatalog(catalog);
  await edit(s,'models.reorder',{provider,value:{models:['two','one']}});assert.equal(publicationImageCatalog(catalog),before);await edit(s,'model.upsert',{provider,model:'one',value:{...one,name:'Renamed'}});assert.equal(publicationImageCatalog(catalog),before);
  await edit(s,'model.upsert',{provider,model:'one',value:{...one,contextWindow:65536,capabilities:{...one.capabilities,image:true}}});assert.notEqual(publicationImageCatalog(catalog),before);
  const file=join(s.dir,'model-connections.json'),saved=readFileSync(file),v=version(s);
  for(const parameters of [{messages:[]},{model:'forbidden'},{tools:[]},{headers:{}},{thinking:'enabled'},{thinking:[]},{thinking:null},{thinking:{budget_tokens:-1}},{reasoning:{enabled:'yes'}},{output_config:{effort:[]}},JSON.parse('{"chat_template_kwargs":{"__proto__":true}}')])await assert.rejects(()=>edit(s,'model.upsert',{provider,model:'one',value:{...one,parameters}}),{code:'INVALID_INPUT'});
  assert.equal(version(s),v);assert.deepEqual(readFileSync(file),saved);
  await assert.rejects(()=>configureModelManagement(s.app.context,USER,{expectedVersion:v-1,action:'model.delete',provider,model:'one'},'stale'),{code:'VERSION_CONFLICT'});assert.deepEqual(readFileSync(file),saved);
  const strictOnly=recommendedDefinition('fixture',{id:'fixture',name:'fixture',provider,baseUrl:'https://fixture.invalid',api:'openai-completions',input:['text'],reasoning:false,contextWindow:8192,maxTokens:1024,compat:{supportsStrictMode:true},cost:{input:0,output:0,cacheRead:0,cacheWrite:0}});assert.equal(strictOnly.capabilities.structuredOutput,false);
  const sdk=await import('@earendil-works/pi-coding-agent'),source=await sdk.ModelRuntime.create({modelsPath:null,credentials:EMPTY_MODEL_CREDENTIALS,refreshOnCreate:false}),p=readModelState(s.dir).connections[0],runtime=await applyModelConnection(sdk,source,{provider,model:'one',thinking:'boost'},p,secret,null),model=runtime.getModel(provider,'one');assert.equal(model.contextWindow,65536);assert.equal(model.maxTokens,4096);assert.deepEqual(model.input,['text','image']);
  const payload={model:'one',messages:[{role:'user',content:'fixed'}],tools:[{type:'function',function:{name:'fixed'}}],max_tokens:4096,stream:true};const wire=modelPayload(payload,one,'boost','openai-completions');assert.equal(wire.reasoning_effort,'ultra');assert.deepEqual(wire.messages,payload.messages);assert.deepEqual(wire.tools,payload.tools);assert.equal(wire.model,'one');
  source.registerProvider('strict-fixture',{baseUrl:'https://fixture.invalid',api:'openai-completions',models:[{id:'strict-model',name:'Strict model',reasoning:true,input:['text'],cost:{input:0,output:0,cacheRead:0,cacheWrite:0},contextWindow:8192,maxTokens:1024,compat:{supportsStrictMode:true},thinkingLevelMap:{high:'ultra',max:'maximum',minimal:null}}]});
  const strictDefinition={...defaultModelDefinition('strict-model'),enabled:true,deletedAt:null,order:0,revision:1},strictRuntime=await applyModelConnection(sdk,source,{provider:'strict-fixture',model:'strict-model',thinking:'high'},{...p,provider:'strict-fixture',models:[strictDefinition]},secret,null),strictModel=strictRuntime.getModel('strict-fixture','strict-model');
  assert.equal(strictModel.compat.supportsStrictMode,true);assert.deepEqual(strictModel.thinkingLevelMap,{high:'ultra',max:'maximum',minimal:null});assert.equal(modelPayload(payload,strictDefinition,'high','openai-completions').response_format,undefined);
 }finally{s.close();}
});

test('the three pinned SDK adapters send only approved reasoning/schema parameters on their actual wire bodies',async()=>{
 const sdk=await import('@earendil-works/pi-coding-agent');
 for(const api of ['openai-completions','openai-responses','anthropic-messages']){
  const parameters=api==='openai-completions'?{reasoning_effort:'ultra'}:api==='openai-responses'?{reasoning:{effort:'high'}}:{thinking:{type:'enabled',budget_tokens:1024},output_config:{effort:'high'}};
  const d={...defaultModelDefinition('wire-model'),capabilities:{...defaultModelDefinition('wire-model').capabilities,structuredOutput:true},reasoning:{defaultLevel:'custom',levels:[{id:'custom',label:'Custom',piLevel:'off',parameters}]},structuredOutput:{name:'fixture',schema:{type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false},strict:true},enabled:true,deletedAt:null,order:0,revision:1};
  const {enabled,deletedAt,order,revision,...input}=d;validateModelDefinition(input,api);const source=await sdk.ModelRuntime.create({modelsPath:null,credentials:EMPTY_MODEL_CREDENTIALS,refreshOnCreate:false}),runtime=await applyModelConnection(sdk,source,{provider:'wire-fixture',model:'wire-model',thinking:'custom'},{provider:'wire-fixture',name:'wire',baseUrl:'https://fixture.invalid',api,models:[d]},secret,null),model=runtime.getModel('wire-fixture','wire-model');let body,calls=0;
  const stream=runtime.streamSimple(model,{messages:[{role:'user',content:'fixed input',timestamp:1}]},{maxRetries:0,maxTokens:2048,fetch:async(request,init)=>{calls++;body=JSON.parse(init?.body??await request.text());return new Response('offline fixture',{status:401});},onPayload:payload=>modelPayload(payload,d,'custom',api)});await stream.result();assert.equal(calls,1);assert.equal(body.model,'wire-model');
  if(api==='openai-completions'){assert.equal(body.reasoning_effort,'ultra');assert.equal(body.response_format.json_schema.name,'fixture');assert.equal(body.messages.at(-1).content,'fixed input');}
  if(api==='openai-responses'){assert.equal(body.reasoning.effort,'high');assert.equal(body.text.format.name,'fixture');assert.ok(JSON.stringify(body.input).includes('fixed input'));}
  if(api==='anthropic-messages'){assert.deepEqual(body.thinking,{type:'enabled',budget_tokens:1024});assert.equal(body.output_config.effort,'high');assert.equal(body.output_config.format.type,'json_schema');assert.ok(JSON.stringify(body.messages).includes('fixed input'));}
 }
});

test('new HTTP admissions observe disable/delete without cancelling already admitted requests',async()=>{
 const s=setup();try{
  await edit(s,'provider.upsert',{provider,value:connection});await edit(s,'model.upsert',{provider,model:'one',value:definition()});s.app.sessions.configure(USER,{provider,model:'one',thinking:'boost'});const session=s.app.sessions.create(USER,s.project.id,{title:'Active model'});s.app.sessions.configure(USER,{clear:true,expectedVersion:s.app.store.get('app-settings','global').version});
  const current=s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+60000}),slot=s.app.agentAdmission.tryAcquire(current,1,'fixture-host');s.app.agentAdmission.markRunning(slot.id,'fixture-host',1,process.pid);const a=s.app.store.get('agent-admission',slot.id);s.app.store.update('agent-admission',slot.id,a.version,{httpManagedVersion:1});const identity={admissionId:slot.id,sessionId:session.id,generation:1,ownerHost:'fixture-host'};
  assert.equal(s.app.modelHttp.acquire(identity,'old-request').allowed,true);await edit(s,'model.enabled',{provider,model:'one',value:{enabled:false}});assert.equal(s.app.modelHttp.acquire(identity,'old-request').allowed,true);assert.throws(()=>s.app.modelHttp.acquire(identity,'new-request'),{code:'MODEL_DISABLED'});s.app.modelHttp.finish(identity,'old-request',{state:'succeeded',httpStatus:200});assert.equal(s.app.modelHttp.inspect(USER,s.project.id).counts.active,0);assert.equal(s.app.sessions.get(USER,session.id).state,'running');
 }finally{s.close();}
});

test('independent processes serialize file CAS and same-key replay without persisting a key in SQL',async()=>{
 const s=setup();try{
  const appUrl=pathToFileURL(resolve('dist/packages/research-app.js')).href,fnUrl=pathToFileURL(resolve('dist/packages/pi-adapter/model-connections.js')).href;
  const run=name=>promisify(execFile)(process.execPath,['--input-type=module','-e',`import {ResearchApp} from ${JSON.stringify(appUrl)};import {configureModelConnection} from ${JSON.stringify(fnUrl)};const app=new ResearchApp(${JSON.stringify(s.dir)},${JSON.stringify(process.cwd())});try{configureModelConnection(app.context,{type:'user'},{expectedVersion:0,provider:'race',name:${JSON.stringify(name)},baseUrl:'https://fixture.invalid',api:'openai-completions',apiKey:'!FAKE_race_key'},${JSON.stringify(name)});process.stdout.write('saved');}catch(e){process.stdout.write(e.code);}finally{app.close();}`],{timeout:30000});
  const rows=await Promise.all([run('a'),run('b')]);assert.deepEqual(rows.map(r=>r.stdout).sort(),['VERSION_CONFLICT','saved']);assert.equal(version(s),1);
  const command={expectedVersion:1,provider:'race',name:'stable',baseUrl:'https://fixture.invalid',api:'openai-completions',apiKey:'!FAKE_race_key'};const saved=configureModelConnection(s.app.context,USER,command,'replay');assert.deepEqual(configureModelConnection(s.app.context,USER,command,'replay'),saved);assert.equal(version(s),2);
  for(const table of ['records','operations','events'])assert.ok(!JSON.stringify(s.app.store.db.prepare(`SELECT * FROM ${table}`).all()).includes('!FAKE_race_key'));
 }finally{s.close();}
});
