import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {configureModelManagement,inspectModelManagement} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition} from '../../dist/packages/pi-adapter/model-definition.js';
import {probeModel} from '../../dist/packages/pi-adapter/model-probe.js';
import {USER} from '../../dist/packages/domain/types.js';

test('real Worker applies managed alias/schema and owner probes are bounded, classified, stale and free of history/keys',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-model-management-')),requests=[],secret='!FAKE_management_key';let responseStatus=200;
 const fixture=createServer(async(req,res)=>{let text='';for await(const chunk of req)text+=chunk;const body=text?JSON.parse(text):null;requests.push({path:req.url,method:req.method,headers:req.headers,body});
  if(responseStatus===0){req.socket.destroy();return;}
  if(responseStatus===-1){res.writeHead(200,{'content-type':'text/event-stream'});res.write(`data: ${JSON.stringify({id:'broken-stream',object:'chat.completion.chunk',created:1,model:body.model,choices:[{index:0,delta:{role:'assistant',content:'Partial'},finish_reason:null}]})}\n\n`);setTimeout(()=>req.socket.destroy(),10);return;}
  if(responseStatus!==200){res.writeHead(responseStatus,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:secret}}));return;}
  if(req.method==='GET'){res.writeHead(200,{'content-type':'application/json'});res.end('{"data":[]}');return;}
  res.writeHead(200,{'content-type':'text/event-stream'});for(const [delta,finish_reason] of [[{role:'assistant',content:'{"answer":"OK"}'},null],[{},'stop']])res.write(`data: ${JSON.stringify({id:'management-fixture',object:'chat.completion.chunk',created:1,model:body.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);res.end('data: [DONE]\n\n');
 });await new Promise(r=>fixture.listen(0,'127.0.0.1',r));let server=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0});
 const state=()=>readModelState(join(dir,'data')),modify=(action,fields)=>configureModelManagement(server.app.context,USER,{expectedVersion:state().version,action,...fields},crypto.randomUUID());
 const probe=(kind,model,key=crypto.randomUUID())=>probeModel(server.app.context,USER,{expectedVersion:state().version,provider:'managed',...(model?{model}:{}),kind,acknowledgedCost:true},key);
 try{
  const port=await server.listen();await modify('provider.upsert',{provider:'managed',value:{name:'Local fixture',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,api:'openai-completions',apiKey:secret}});
  const d={...defaultModelDefinition('one'),contextWindow:65536,maxTokens:2048,capabilities:{...defaultModelDefinition('one').capabilities,image:true,structuredOutput:true,midConversationSystem:true},reasoning:{defaultLevel:'boost',levels:[{id:'off',label:'off',piLevel:'off',parameters:{}},{id:'boost',label:'Boost',piLevel:'high',parameters:{reasoning_effort:'ultra'}}]},structuredOutput:{name:'answer',strict:true,schema:{type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false}}};
  await modify('model.upsert',{provider:'managed',model:'one',value:d});assert.equal(requests.length,0,'saving never tests a provider');
  server.app.sessions.configure(USER,{provider:'managed',model:'one',thinking:'boost',expectedVersion:0});const project=server.app.projects.create(USER,{name:'Managed runtime'}),session=server.app.sessions.create(USER,project.id,{title:'Actual alias'}),message=server.app.sessions.send(USER,session.id,{content:'reply with structured answer'});
  const end=Date.now()+30000;while(Date.now()<end){const r=server.app.store.get('message',message.id);if(['completed','failed'].includes(r.status)&&!server.host.active.has(session.id))break;await delay(25);}assert.equal(server.app.store.get('message',message.id).status,'completed');
  assert.equal(requests[0].headers.authorization,'Bearer '+secret);assert.equal(requests[0].body.model,'one');assert.equal(requests[0].body.reasoning_effort,'ultra');assert.equal(requests[0].body.response_format.type,'json_schema');assert.equal(requests[0].body.response_format.json_schema.strict,true);assert.equal(requests[0].body.max_tokens??requests[0].body.max_completion_tokens,2048);
  const transcript=readFileSync(server.app.store.paths.physical(server.app.sessions.get(USER,session.id).piSessionPath),'utf8');assert.ok(!transcript.includes(secret));
  const boot=await (await fetch(`http://127.0.0.1:${port}/api/bootstrap`)).json();assert.ok(boot.models.some(m=>m.model==='one'&&m.thinking==='boost'));assert.ok(boot.models.some(m=>m.model==='one'&&m.thinking==='off'));
  const configVersion=state().version,sessionCount=server.app.store.list('session').length;let before=requests.length;
  const checked=await probe('model','one','probe-once');assert.equal(checked.state,'passed');assert.equal(checked.coverage,'minimal-availability');assert.equal(checked.requests,1);assert.equal(state().version,configVersion);assert.equal(server.app.store.list('session').length,sessionCount);assert.equal(requests.length,before+1);assert.notEqual(requests.at(-1).body.reasoning_effort,'ultra');assert.equal(requests.at(-1).body.response_format,undefined);await probe('model','one','probe-once');assert.equal(requests.length,before+1);
  assert.equal((await probe('connection')).state,'passed');
  for(const [status,category] of [[401,'authentication'],[404,'model_not_found'],[429,'rate_limit'],[503,'server'],[400,'invalid_request'],[0,'network'],[-1,'network']]){responseStatus=status;before=requests.length;const r=await probe('model','one');assert.equal(r.category,category);assert.equal(r.state,'failed');assert.equal(requests.length,before+1,'there are no retries');}
  responseStatus=200;server.app.sessions.configure(USER,{clear:true,expectedVersion:server.app.store.get('app-settings','global').version});
  before=requests.length;const racing=probe('model','one');await modify('model.enabled',{provider:'managed',model:'one',value:{enabled:false}});const blocked=await racing;assert.equal(blocked.state,'stale');assert.equal(blocked.requests,0);assert.equal(requests.length,before,'disable during SDK preparation prevents actual fetch');
  await modify('model.enabled',{provider:'managed',model:'one',value:{enabled:true}});const last=await probe('model','one');assert.equal(last.state,'passed');await modify('provider.upsert',{provider:'managed',value:{name:'Local fixture',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,api:'openai-completions',apiKey:'!FAKE_rotated_management_key'}});assert.equal((await inspectModelManagement(server.app.context,USER)).providers.find(p=>p.provider==='managed').models.find(m=>m.model==='one').test.state,'stale');
  for(const table of ['records','events','operations'])assert.ok(!JSON.stringify(server.app.store.db.prepare(`SELECT * FROM ${table}`).all()).includes(secret));
  await server.close();server=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0});await server.listen();const reopened=await inspectModelManagement(server.app.context,USER);assert.equal(reopened.providers.find(p=>p.provider==='managed').models.find(m=>m.model==='one').reasoning.levels[1].id,'boost');assert.deepEqual(reopened.defaultModel,{provider:'',model:'',thinking:'off'});
 }finally{await server.close();await new Promise(r=>fixture.close(r));rmSync(dir,{recursive:true,force:true});}
});
