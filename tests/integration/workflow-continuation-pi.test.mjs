import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';

test('installed Pi SDK consumes the nonhuman workflow and resumes a fixed approval with a local synthetic provider',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'pi-workflow-sdk-')),requests=[];
 const provider=createServer(async(request,response)=>{
  let raw='';for await(const chunk of request)raw+=chunk;const input=JSON.parse(raw);requests.push(input);response.writeHead(200,{'content-type':'text/event-stream'});
  const send=(delta,finish_reason=null)=>response.write(`data: ${JSON.stringify({id:'workflow-'+requests.length,object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  if(input.messages.at(-1)?.role==='tool'){send({role:'assistant',content:'Synthetic workflow check finished.'});send({},'stop');}
  else{const resume=input.tools.some(tool=>tool.function.name==='session_action_resume');send({role:'assistant',tool_calls:[{index:0,id:'workflow-call-'+requests.length,type:'function',function:{name:resume?'session_action_resume':'artifact_create',arguments:JSON.stringify({input:resume?{}:{title:'UNIT SDK result',content:'Synthetic provider; no research finding'}})}}]});send({},'tool_calls');}response.end('data: [DONE]\n\n');
 });await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
 const server=createHttpServer({dataDir:join(directory,'data'),repoRoot:process.cwd(),port:0});writeFileSync(join(directory,'data','models.json'),JSON.stringify({providers:{'workflow-local':{api:'openai-completions',baseUrl:`http://127.0.0.1:${provider.address().port}/v1`,apiKey:'synthetic-only',models:[{id:'fixture',contextWindow:32768,maxTokens:1024}]}}}));
 try{
  const port=await server.listen(),base=`http://127.0.0.1:${port}/api`,call=async(path,body)=>{const response=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json','idempotency-key':crypto.randomUUID()},body:JSON.stringify(body)}),value=await response.json();assert.equal(response.status,200,JSON.stringify(value));return value;};
  await call('/settings/model',{provider:'workflow-local',model:'fixture',thinking:'off'});const project=await call('/projects',{name:'UNIT local Pi workflow'}),session=await call('/sessions',{projectId:project.id});assert.equal(server.app.sessionPermissions.status({type:'user'},session.id).mode,'confirm');
  const brief=server.app.researchBriefs.save({type:'user'},project.id,session.id,{question:'UNIT SDK workflow',scope:'Software acceptance only',constraints:[],successCriteria:['Exact permission retained'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Save',description:'Save after precise approval'}],status:'ready',expectedRevisionId:null});
  const receipt=await call('/operations/workflow_confirm',{projectId:project.id,sessionId:session.id,input:{sourceKind:'brief',sourceId:brief.id,sourceDigest:brief.digest,expectedVersion:brief.version}});
  const until=async predicate=>{const deadline=Date.now()+25000;while(Date.now()<deadline){if(predicate())return;await delay(25);}assert.fail('Installed SDK synthetic workflow timed out');};
  await until(()=>server.app.store.list('session-action',project.id).some(action=>action.state==='pending')&&!server.host.active.has(session.id));
  const action=server.app.store.list('session-action',project.id)[0],approval=server.app.store.get('approval',action.approvalId);assert.equal(action.workflowContinuationId,receipt.id);assert.equal(server.app.store.list('artifact',project.id).length,0);
  await call(`/sessions/${session.id}/permission-actions/${action.id}/decide`,{expectedVersion:action.version,expectedApprovalVersion:approval.version,approved:true});
  await until(()=>server.app.store.get('session-action',action.id).state==='completed'&&!server.host.active.has(session.id));
  assert.equal(server.app.store.list('artifact',project.id).length,1);assert.equal(server.app.store.list('workflow-continuation',project.id).length,1);assert.equal(server.app.sessions.messages({type:'user'},session.id).filter(message=>message.role==='user'&&!message.approvalNoticeId).length,0);assert.equal(server.app.store.get('session',session.id).lastConsumedHumanMessageId,undefined);assert.ok(requests.length>=4);
 }finally{await server.close();await new Promise(resolve=>provider.close(resolve));rmSync(directory,{recursive:true,force:true});}
});
