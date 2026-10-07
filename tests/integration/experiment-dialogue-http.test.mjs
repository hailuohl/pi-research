import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
async function until(predicate){const end=Date.now()+25000;while(Date.now()<end){if(predicate())return;await delay(20);}assert.fail('experiment dialogue fixture timed out');}

test('actual pinned Pi creates a parameter experiment and submits only the confirmed fixed dialogue intent',async()=>{
 const dir=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-experiment-dialogue-')),requests=[],toolNames=[];let service,project,baseline,config,phase=0;
 const candidate=()=>service.app.store.list('experiment',project.id).find(e=>e.title==='Pi parameter candidate');
 const intent=()=>service.app.store.list('run-intent',project.id)[0];
 const run=()=>service.app.store.list('run',project.id)[0];
 const steps=[()=>['project_inspect',{}],()=>['experiment_source_read',{experimentId:baseline.id,revision:1,path:'config.json'}],()=>['experiment_plan_submit',{title:'Pi parameter candidate',hypothesis:'Fixed local numerical comparison',parentId:baseline.id,expectedParentRevision:1,config:{...config,polynomialDegree:2}}],()=>['run_prepare',{experimentId:candidate().id}],null,()=>['project_inspect',{runIntentId:intent().id}],()=>['run_submit',{intentId:intent().id}],()=>['run_inspect',{runId:run().id}],null,()=>['run_inspect',{runId:run().id}],()=>['run_logs',{runId:run().id}],null];
 const fixture=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;const request=JSON.parse(body);requests.push(request);
  res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:'experiment-'+phase,object:'chat.completion.chunk',created:1,model:request.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  const action=steps[phase++];if(action){const [name,input]=action();toolNames.push(name);chunk({role:'assistant',tool_calls:[{index:0,id:'experiment-tool-'+phase,type:'function',function:{name,arguments:JSON.stringify({input})}}]});chunk({},'tool_calls');}
  else{chunk({role:'assistant',content:phase===5?'本机验收夹具：固定实验已准备，等待原对话确认。':phase===9?'本机验收夹具：已提交固定运行，未完成时不报告指标。':'本机验收夹具：读取实际运行结果和日志，mse='+run().metrics.mse});chunk({},'stop');}res.end('data: [DONE]\n\n');
 });await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 writeFileSync(join(dir,'models.json'),JSON.stringify({providers:{'offline-experiment':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:65536,maxTokens:1024}]}}}));
 service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});const savedKey=process.env.PI_API_KEY;delete process.env.PI_API_KEY;
 try{
  service.app.sessions.configure(USER,{provider:'offline-experiment',model:'fixture',thinking:'off'});project=service.app.projects.create(USER,{name:'Dialogue numerical fixture',template:'curve-fit'});baseline=service.app.experiments.create(USER,project.id,{title:'Fixed baseline'});config=JSON.parse(service.app.experiments.readFile(USER,baseline.id,'config.json').content);
  const session=service.app.sessions.create(USER,project.id,{title:'Pi experiment dialogue'}),port=await service.listen(),url=`http://127.0.0.1:${port}/api`;
  const call=async(path,body,key=crypto.randomUUID())=>{const response=await fetch(url+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'content-type':'application/json','idempotency-key':key},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;};
  const initial=await call(`/sessions/${session.id}/messages`,{content:'本机验收：根据固定基线创建二阶参数候选，并准备运行。'});
  await until(()=>service.app.store.get('message',initial.id).status==='completed'&&service.host.active.size===0);
  assert.equal(candidate().parentId,baseline.id);assert.equal(intent().rootSessionId,session.id);assert.equal(service.app.store.list('run',project.id).length,0);
  const approval=service.app.store.get('approval',intent().approvalId);await call(`/approvals/${approval.id}/decide`,{expectedVersion:approval.version,approved:true});
  const body={content:`本机验收：确认固定意向 ${intent().id}，manifestDigest ${intent().manifestDigest}；仅提交此意向，不新建补跑。`},resume=await call(`/sessions/${session.id}/messages`,body,'fixed-human-resume');
  assert.equal((await call(`/sessions/${session.id}/messages`,body,'fixed-human-resume')).id,resume.id);
  await until(()=>service.app.store.get('message',resume.id).status==='completed'&&service.host.active.size===0);
  await until(()=>run()&&['succeeded','failed','cancelled'].includes(run().state));assert.equal(run().state,'succeeded');assert.equal(run().integrity,'complete');assert.equal(typeof run().metrics.mse,'number');assert.equal(service.app.store.list('run',project.id).length,1);
  const analysis=await call(`/sessions/${session.id}/messages`,{content:'本机验收：回查这个已完成Run的真实指标和日志。'});await until(()=>service.app.store.get('message',analysis.id).status==='completed'&&service.host.active.size===0);
  assert.deepEqual(toolNames,['project_inspect','experiment_source_read','experiment_plan_submit','run_prepare','project_inspect','run_submit','run_inspect','run_inspect','run_logs']);
  assert.ok(JSON.stringify(requests.at(-1).messages).includes(String(run().metrics.mse)));const view=await call(`/sessions/${session.id}/view`);assert.ok(view.messages.some(m=>m.role==='assistant'&&m.content.includes('mse='+run().metrics.mse)));
 }finally{if(savedKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=savedKey;await service.close();fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));rmSync(dir,{recursive:true,force:true});}
});

test('actual pinned Pi reads the compute skill and current scheduling before and after an owner releases a fixed CPU run',async()=>{
 const dir=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-scheduling-dialogue-')),requests=[],toolNames=[];let service,project,run,phase=0;
 const steps=[['research_skill_read',{skillId:'pi-research-compute'}],['research_skill_read',{skillId:'pi-research-compute',resource:'references/local.md'}],['execution_environment_list',{}],['run_inspect',()=>({runId:run.id,includeScheduling:true})],null,['run_inspect',()=>({runId:run.id,includeScheduling:true})],null];
 const fixture=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;const request=JSON.parse(body);requests.push(request);
  res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:'scheduling-'+phase,object:'chat.completion.chunk',created:1,model:request.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  const action=steps[phase++];if(action){const [name,value]=action,input=typeof value==='function'?value():value;toolNames.push(name);chunk({role:'assistant',tool_calls:[{index:0,id:'scheduling-call-'+phase,type:'function',function:{name,arguments:JSON.stringify({input})}}]});chunk({},'tool_calls');}
  else {chunk({role:'assistant',content:phase===5?'离线供应商夹具：读取了等待原因；不提交新运行，等待用户恢复额度。':'离线供应商夹具：重新读取了实际终态和调度不可用原因。'});chunk({},'stop');}res.end('data: [DONE]\n\n');
 });await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 writeFileSync(join(dir,'models.json'),JSON.stringify({providers:{'offline-scheduling':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:65536,maxTokens:1024}]}}}));
 const savedKey=process.env.PI_API_KEY;delete process.env.PI_API_KEY;
 try {
  service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});service.app.sessions.configure(USER,{provider:'offline-scheduling',model:'fixture',thinking:'off'});
  project=service.app.projects.create(USER,{name:'Agent scheduling CPU fixture',template:'curve-fit'});const experiment=service.app.experiments.create(USER,project.id,{title:'Fixed CPU baseline'}),intent=service.app.runs.prepare(USER,experiment.id),approval=service.app.store.get('approval',intent.approvalId);
  service.app.approvals.decide(USER,approval.id,approval.version,true);service.app.compute.configure(USER,{expectedVersion:service.app.compute.inspect(USER).configuration.version,limits:{maxRuns:0}});run=service.app.runs.submit(USER,intent.id);
  const initialManifest=run.manifestDigest,session=service.app.sessions.create(USER,project.id,{title:'Scheduling reader'}),port=await service.listen(),url=`http://127.0.0.1:${port}/api`;
  const message=async content=>{const response=await fetch(url+`/sessions/${session.id}/messages`,{method:'POST',headers:{'content-type':'application/json','idempotency-key':crypto.randomUUID()},body:JSON.stringify({content})});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));await until(()=>service.app.store.get('message',data.id).status==='completed'&&service.host.active.size===0);return data;};
  await message('只读已保存环境和计算技能，解释这个已提交 Run 的当前调度原因，不提交或探测：'+run.id);
  const waiting=JSON.stringify(requests.at(-1).messages);assert.ok(waiting.includes('includeScheduling'));assert.ok(waiting.includes('references/local.md'));assert.ok(waiting.includes('request_too_large'));assert.equal(service.app.store.get('run',run.id).state,'queued');assert.equal(service.app.store.list('run',project.id).length,1);
  service.app.compute.configure(USER,{expectedVersion:service.app.compute.inspect(USER).configuration.version,limits:{maxRuns:1}});await until(()=>service.app.store.get('run',run.id).state==='succeeded');
  await message('重新只读这个 Run 的终态及调度观察：'+run.id);
  const finished=service.app.store.get('run',run.id),latest=JSON.stringify(requests.at(-1).messages);assert.ok(latest.includes('unavailableReason'));assert.ok(latest.includes('terminal'));assert.ok(latest.includes(String(finished.metrics.mse)));assert.equal(finished.integrity,'complete');assert.equal(finished.manifestDigest,initialManifest);
  assert.deepEqual(toolNames,['research_skill_read','research_skill_read','execution_environment_list','run_inspect','run_inspect']);assert.equal(service.app.store.list('run',project.id).length,1);
 } finally {if(savedKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=savedKey;if(service)await service.close();fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));rmSync(dir,{recursive:true,force:true});}
});
