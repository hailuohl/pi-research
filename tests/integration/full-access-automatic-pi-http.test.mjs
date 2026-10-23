import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
const policy={version:2,limits:{development:null,run:null,continuations:null,durationMs:null},recoverAfterRestart:true};
test('real Pi HTTP new full access scope auto-confirms once and preserves old pending history on reopen',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-automatic-approval-')),requests=[];
 const fixed={expectedRevisionId:null,question:'Offline fixed software brief',scope:'Software acceptance only',constraints:[],successCriteria:['Save an inspectable result'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Inspect the fixed result'}],status:'ready',draftFiles:[]};
 let auto=false,duplicate=false;
 const fixture=createServer(async(req,res)=>{let body='';for await(const part of req)body+=part;const input=JSON.parse(body);requests.push(input);res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:'automatic-fixture-'+requests.length,object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  const last=input.messages.at(-1);let tool;
  if(last?.role!=='tool')tool={name:'research_brief_save',input:fixed,id:auto?'automatic-save':'old-pending'};
  else if(auto&&last.tool_call_id==='automatic-save'&&!duplicate){duplicate=true;tool={name:'research_brief_save',input:fixed,id:'automatic-save'};}
  else if(auto&&last.tool_call_id==='automatic-save')tool={name:'research_brief_inspect',input:{},id:'automatic-inspect'};
  if(tool){chunk({role:'assistant',tool_calls:[{index:0,id:tool.id,type:'function',function:{name:tool.name,arguments:JSON.stringify({input:tool.input})}}]});chunk({},'tool_calls');}else{chunk({role:'assistant',content:'Fixed automatic approval task completed.'});chunk({},'stop');}res.end('data: [DONE]\n\n');
 });await new Promise(r=>fixture.listen(0,'127.0.0.1',r));
 const service=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0});writeFileSync(join(dir,'data','models.json'),JSON.stringify({providers:{'offline-automatic':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:1024}]}}}));const savedKey=process.env.PI_API_KEY;delete process.env.PI_API_KEY;
 try{const port=await service.listen(),base=`http://127.0.0.1:${port}/api`,call=async(path,body)=>{const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'content-type':'application/json','idempotency-key':crypto.randomUUID()},...(body===undefined?{}:{body:JSON.stringify(body)})});const value=await res.json();assert.equal(res.status,200,JSON.stringify(value));return value;};
  const complete=async id=>{const until=Date.now()+25000;while(Date.now()<until){const m=service.app.store.get('message',id);if(['completed','failed'].includes(m.status)&&!service.host.active.has(m.sessionId)){assert.equal(m.status,'completed',m.error);return;}await delay(25);}throw new Error('real Pi automatic approval turn timed out');};
  await call('/settings/model',{provider:'offline-automatic',model:'fixture',thinking:'off'});const p=await call('/projects',{name:'Real Pi automatic approvals'}),s=await call('/sessions',{projectId:p.id});let m=await call(`/sessions/${s.id}/messages`,{content:'Prepare the old pending software brief'});await complete(m.id);const old=(await call(`/sessions/${s.id}/permissions`)).actions.at(-1);assert.equal(old.state,'pending');assert.equal(service.app.store.list('research-brief').length,0);
  const g=await call(`/sessions/${s.id}/host-access`,{enabled:true,expectedVersion:0,acknowledgedSameUserAccess:true,acknowledgedResearchAutomation:true,researchAutomationPolicy:policy,acknowledgedAutomaticApprovals:true});assert.equal(g.automaticApprovalScope,1);auto=true;m=await call(`/sessions/${s.id}/messages`,{content:'Create and confirm this new fixed software brief now'});await complete(m.id);const briefs=service.app.store.list('research-brief',p.id);assert.equal(briefs.length,1);assert.equal(briefs[0].status,'confirmed');assert.equal(briefs[0].automaticApproval.originMessageId,m.id);assert.equal(briefs[0].automaticExecution.state,'completed');assert.equal(service.app.store.events(0,p.id).filter(e=>e.type==='session.research_brief_confirmed').length,1);assert.equal(service.app.store.get('approval',old.approvalId).status,'stale');assert.ok(requests.some(r=>r.messages.some(m=>m.role==='tool'&&typeof m.content==='string'&&/"status"\s*:\s*"confirmed"/.test(m.content))));assert.ok(duplicate);
  const reopened=new ResearchApp(join(dir,'data'),process.cwd());try{assert.equal(reopened.researchBriefs.inspect({type:'user'},p.id,s.id).brief.status,'confirmed');assert.equal(reopened.store.list('research-brief',p.id).length,1);assert.equal(reopened.store.events(0,p.id).filter(e=>e.type==='session.research_brief_confirmed').length,1);assert.equal(reopened.store.get('approval',old.approvalId).status,'stale');}finally{reopened.close();}
 }finally{if(savedKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=savedKey;await service.close();await new Promise(r=>fixture.close(r));rmSync(dir,{recursive:true,force:true});}
});
