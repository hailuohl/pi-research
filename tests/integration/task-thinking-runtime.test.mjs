import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {configured} from '../support/thinking.mjs';
import {approve} from '../support/research.mjs';

for(const {changed,clamped} of [{changed:false,clamped:false},{changed:true,clamped:false},{changed:false,clamped:true}])test(`real Worker uses the selected custom wire parameters and ${changed?'blocks a new HTTP after semantic edits':clamped?'records a frozen SDK adaptation':'continues through display-only edits'}`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-task-thinking-')),requests=[];let fixture,server,f,handlerError;
 fixture=createServer(async(req,res)=>{try{
  let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);requests.push(body);
  if(requests.length===1)await f.edit('model.upsert',{provider:f.model.provider,model:f.model.model,value:{...f.definition,name:'Renamed while running',reasoning:{...f.definition.reasoning,levels:f.definition.reasoning.levels.map(l=>({...l,label:'Only a display label',...(changed&&l.id==='quick'?{parameters:{reasoning_effort:'changed'}}:{})}))}}});
  const name=requests.length===1?'task_context_read':'task_result_submit',input=requests.length===1?{}:{summary:'Offline wire fixture; no research conclusion',outcome:'completed',artifactIds:[],evidenceIds:[],claims:[],unresolvedQuestions:[]};
  res.writeHead(200,{'content-type':'text/event-stream'});
  for(const [delta,finish_reason] of [[{role:'assistant',tool_calls:[{index:0,id:'call-'+requests.length,type:'function',function:{name,arguments:JSON.stringify({input})}}]},null],[{},'tool_calls']])res.write(`data: ${JSON.stringify({id:'thinking-fixture',object:'chat.completion.chunk',created:1,model:body.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  res.end('data: [DONE]\n\n');
 }catch(error){handlerError=error;res.writeHead(500);res.end('fixture failed');}});
 await new Promise(r=>fixture.listen(0,'127.0.0.1',r));server=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0});
 try{
  const port=await server.listen(),app=server.app,project=app.projects.create(USER,{name:'Thinking wire fixture'}),p=app.projects.get(USER,project.id);app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});
  const session=app.sessions.create(USER,p.id,{title:'Main stays careful'});f=await configured({app,dir:join(dir,'data'),session});if(clamped){f.definition={...f.definition,reasoning:{...f.definition.reasoning,levels:f.definition.reasoning.levels.map(l=>l.id==='quick'?{...l,piLevel:'max'}:l)}};await f.edit('model.upsert',{provider:f.model.provider,model:f.model.model,value:f.definition});}await f.edit('provider.upsert',{provider:f.model.provider,value:{name:'Local offline provider',api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'!FAKE_wire_thinking'}});await f.save();
  const url=`http://127.0.0.1:${port}/api/sessions/${session.id}/teams`,payload={goal:'Actual frozen thinking request',tasks:[{key:'selected',role:'analyst',objective:'Return the task context, then submit the fixture result',dependencies:[],thinking:'quick',thinkingReason:'Bounded direct read'}],budget:3};
  const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','idempotency-key':'runtime-chosen-team'},body:JSON.stringify(payload)}),team=await response.json();assert.equal(response.status,200,JSON.stringify(team));
  approve(app,team.approvalId);app.teams.activate(USER,team.id);
  const end=Date.now()+30000;while(Date.now()<end){const task=app.teams.tasks(USER,team.id)[0];if(['output_submitted','failed','blocked'].includes(task.execution)&&!server.host.active.size)break;await delay(25);}
  assert.equal(handlerError,undefined);const task=app.teams.tasks(USER,team.id)[0],worker=app.sessions.get(USER,task.sessionId);assert.ok(requests.length);assert.equal(requests[0].model,f.model.model);assert.equal(requests[0].reasoning_effort,'none');assert.equal(requests[0].temperature,0.25);assert.equal(app.sessions.get(USER,session.id).model.thinking,'careful');assert.equal(worker.model.thinking,'quick');
  const receipts=app.store.events(0,p.id,500).filter(e=>e.type==='task.model_resolved');assert.equal(receipts.length,1);assert.equal(receipts[0].payload.requested,'quick');assert.equal(receipts[0].payload.requestedPiThinking,clamped?'max':'off');assert.equal(receipts[0].payload.piThinking,clamped?'high':'off');assert.match(receipts[0].payload.parametersDigest,/^[a-f0-9]{64}$/);
  if(changed){assert.equal(requests.length,1);assert.equal(task.execution,'failed');assert.match(worker.lastError,/TASK_MODEL_STALE/);assert.equal(app.store.list('model-http-request',p.id).length,1);}
  else {assert.equal(requests.length,2);assert.equal(task.execution,'output_submitted',worker.lastError);assert.equal(task.result.outcome,'completed');}
 }finally{await server.close();await new Promise(r=>fixture.close(r));rmSync(dir,{recursive:true,force:true});}
});
