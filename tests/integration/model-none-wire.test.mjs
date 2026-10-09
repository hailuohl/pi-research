import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync,readFileSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {configureModelManagement,inspectModelManagement} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition} from '../../dist/packages/pi-adapter/model-definition.js';
import {USER} from '../../dist/packages/domain/types.js';

test('Pi off sends Responses effort none while storage and custom labels stay unchanged',async()=>{
 const dir=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-none-wire-')),requests=[],key='!FAKE_none_wire_key';
 const provider=createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);requests.push({method:req.method,path:req.url,headers:req.headers,body});
  const send=event=>res.write('event: '+event.type+'\ndata: '+JSON.stringify(event)+'\n\n'),item={type:'message',id:'msg_fixture',role:'assistant',status:'completed',content:[{type:'output_text',text:'OK',annotations:[]}]};
  res.writeHead(200,{'content-type':'text/event-stream'});send({type:'response.created',response:{id:'response_fixture'}});send({type:'response.output_item.added',output_index:0,item:{...item,status:'in_progress',content:[]}});send({type:'response.output_text.delta',output_index:0,content_index:0,delta:'OK'});send({type:'response.output_item.done',output_index:0,item});send({type:'response.completed',response:{id:'response_fixture',status:'completed',output:[item],usage:{input_tokens:5,output_tokens:1,total_tokens:6}}});res.end();
 });
 await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
 const dataDir=join(dir,'data'),endpoint=`http://127.0.0.1:${provider.address().port}/v1`,service=createHttpServer({dataDir,repoRoot:process.cwd(),port:0}),nativeFetch=globalThis.fetch;
 try{
  const edit=(action,fields)=>configureModelManagement(service.app.context,USER,{expectedVersion:readModelState(dataDir).version,action,...fields},crypto.randomUUID());
  await edit('provider.upsert',{provider:'openai',value:{name:'Local OpenAI fixture',baseUrl:endpoint,api:'openai-responses',apiKey:key}});
  const definition={...defaultModelDefinition('gpt-5.1'),nativeProfile:'openai',reasoning:{defaultLevel:'off',levels:[{id:'off',label:'none',piLevel:'off',parameters:{}},{id:'low',label:'low',piLevel:'low',parameters:{}}]}};
  await edit('model.upsert',{provider:'openai',model:'gpt-5.1',value:definition});service.app.sessions.configure(USER,{provider:'openai',model:'gpt-5.1',thinking:'off'});
  const project=service.app.projects.create(USER,{name:'None wire fixture'}),session=service.app.sessions.create(USER,project.id,{title:'Pi off wire'});await service.listen();
  globalThis.fetch=(input,init)=>{const target=new URL(input instanceof Request?input.url:String(input));assert.equal(target.origin,new URL(endpoint).origin,'Pi provider requests must stay on the local fixture');return nativeFetch(input,init);};
  const message=service.app.sessions.send(USER,session.id,{content:'Reply with only OK.'}),end=Date.now()+30000;
  while(Date.now()<end){const row=service.app.store.get('message',message.id);if(['completed','failed'].includes(row.status)&&!service.host.active.has(session.id))break;await delay(25);}
  const settled=service.app.store.get('message',message.id);assert.equal(settled.status,'completed',settled.error);assert.equal(service.host.active.has(session.id),false);
  assert.equal(requests.length,1);assert.deepEqual([requests[0].method,requests[0].path],['POST','/v1/responses']);assert.equal(requests[0].body.model,'gpt-5.1');assert.equal(requests[0].body.reasoning.effort,'none');
  assert.equal(service.app.sessions.get(USER,session.id).model.thinking,'off');
  const view=await inspectModelManagement(service.app.context,USER),model=view.providers.find(p=>p.provider==='openai').models.find(m=>m.model==='gpt-5.1');assert.deepEqual(model.reasoning,definition.reasoning);
  const transcript=readFileSync(service.app.store.paths.physical(service.app.sessions.get(USER,session.id).piSessionPath),'utf8');assert.ok(!transcript.includes(key));
 }finally{
  globalThis.fetch=nativeFetch;
  try{await service.close();}finally{provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));rmSync(dir,{recursive:true,force:true});}
 }
});
