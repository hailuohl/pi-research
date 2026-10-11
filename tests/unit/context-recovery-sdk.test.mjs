import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {fork} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import * as sdk from '@earendil-works/pi-coding-agent';
import {publicationImageCatalog} from '../../dist/packages/pi-adapter/publication-image.js';
import {emptyLengthAssistant,assistantFailure} from '../../dist/packages/pi-adapter/options.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
import {digest} from '../../dist/packages/storage/store.js';

const usage=(input=0,output=0)=>({input,output,cacheRead:0,cacheWrite:0,totalTokens:input+output,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}});
const assistant=(content=[],stopReason='stop',u=usage())=>({role:'assistant',content,stopReason,usage:u,provider:'offline-context',model:'fixture',api:'openai-completions',timestamp:Date.now()});
const content=m=>typeof m.content==='string'?m.content:(m.content??[]).filter(block=>block.type==='text').map(block=>block.text).join('');

test('empty-length classification preserves real tool calls, partial text and ordinary empty stops',()=>{
 for(const content of [[],[{type:'thinking',thinking:'hidden'}], ' \n ']){assert.equal(emptyLengthAssistant({stopReason:'length',content}),true);assert.match(assistantFailure({stopReason:'length',content}),/^CONTEXT_LENGTH_INCOMPLETE:/);}
 for(const m of [{stopReason:'stop',content:[]},{stopReason:'length',content:'partial'},{stopReason:'length',content:[{type:'toolCall',name:'read'}]},{stopReason:'length',content:'',toolCalls:['read']}])assert.equal(emptyLengthAssistant(m),false);
});

async function fixture(mode,{eligible=true,omitEligibility=false,permissionMode='confirm',role='coordinator',historical=false,resolvedHistory=false,oversized=false,short=false,tools=false}={}){
 const dir=mkdtempSync(join(tmpdir(),'pi-context-sdk-')),agentDir=join(dir,'agent'),sessionDir=join(dir,'pi'),workspace=join(dir,'workspace');
 for(const path of [agentDir,sessionDir,workspace])mkdirSync(path,{recursive:true});
 const app=new ResearchApp(dir,process.cwd());
 const requests=[],events=[],rpcPhases=[];let ordinary=0,summaries=0,toolEffects=0,child,exactActor,exactAction,exactEffects=0;
 const fixedBody='Fixed approved bytes: 中文 🔬 "quoted" \\ exact\n'.repeat(300);
 const server=createServer(async(req,res)=>{
  let body='';for await(const part of req)body+=part;const input=JSON.parse(body),last=input.messages.at(-1);requests.push(input);
  const summary=last?.role==='user'&&(/<conversation>\n|^# Conversation\n/.test(content(last)));if(summary)summaries++;else ordinary++;
  res.writeHead(200,{'content-type':'text/event-stream'});
  const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:'context-fixture-'+requests.length,object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  const tool=(name,id)=>{chunk({role:'assistant',tool_calls:[{index:0,id,type:'function',function:{name,arguments:JSON.stringify({input:name==='session_action_execute'?{actionId:exactAction.id}:{}})}}]});chunk({},'tool_calls');};
  if(summary){
   if(mode==='summary-abort'){child.send({type:'abort'});res.end();return;}
   if(mode==='summary-error'){res.end(`data: ${JSON.stringify({error:{message:'OFFLINE deliberate stream error',type:'fixture_error'}})}\n\n`);return;}
   else if(mode==='summary-tool')tool('contract_read','summary-forbidden');
   else if(mode!=='summary-empty')chunk({role:'assistant',content:'OFFLINE checkpoint: original request and completed receipt; action-fixture remains authoritative in host.'});
   if(mode!=='summary-tool'&&mode!=='summary-error')chunk({},mode==='summary-length'?'length':'stop');
  }else if(tools&&(ordinary===1||mode==='exact-replay'&&ordinary===3))tool(mode==='exact-replay'?'session_action_execute':'contract_read',ordinary===1?'original-tool':'new-replay-call');
  else if((!historical&&ordinary===(tools?2:1))||mode==='second-length'){chunk({role:'assistant'});chunk({},'length');}
  else {chunk({role:'assistant',content:'OFFLINE recovered reply'});chunk({},'stop');}
  res.end('data: [DONE]\n\n');
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const modelsPath=join(dir,'models.json');writeFileSync(modelsPath,JSON.stringify({providers:{'offline-context':{api:'openai-completions',baseUrl:`http://127.0.0.1:${server.address().port}/v1`,models:[{id:'fixture',contextWindow:1000000,maxTokens:131072,reasoning:true,input:['text']}]}}}));
 if(mode==='exact-replay'){
  const project=app.projects.create(USER,{name:'Offline fixed action',template:'curve-fit'}),root=app.sessions.create(USER,project.id,{});app.sessionPermissions.initialize(root.id,'confirm');
  const running=app.store.update('session',root.id,root.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});exactActor={type:'agent',projectId:project.id,sessionId:root.id,role:'coordinator',generation:running.generation,permission:app.sessionPermissions.capture(root.id)};
  assert.throws(()=>app.operations.execute(exactActor,'workspace_write',{path:'fixed.txt',content:fixedBody,expectedDigest:null},{projectId:project.id,sessionId:root.id,idempotencyKey:'prepare-fixed'}),{code:'APPROVAL_REQUIRED'});
  exactAction=app.sessionPermissions.status(USER,root.id).actions.at(-1);app.sessionPermissions.decide(USER,root.id,exactAction.id,{expectedVersion:exactAction.version,expectedApprovalVersion:exactAction.approval.version,approved:true});
  const write=app.store.textWrites.write.bind(app.store.textWrites);app.store.textWrites.write=(...args)=>{if(JSON.stringify(args).includes('fixed.txt'))exactEffects++;return write(...args);};
 }
 const manager=sdk.SessionManager.create(workspace,sessionDir);
 const turns=short?1:20;
 for(let i=0;i<turns;i++){
  manager.appendMessage({role:'user',content:[{type:'text',text:short?'short fixture':'HISTORY '+ 'x'.repeat(oversized&&i===0?4100000:190000)}],timestamp:Date.now()-1000});
  manager.appendMessage(assistant([{type:'text',text:'Earlier receipt retained'}],'stop',i===turns-1?usage(999226,1):usage()));
 }
 let failedEntry;
 if(historical){failedEntry=manager.appendMessage(assistant([],'length',usage(999226,1)));if(resolvedHistory)manager.appendContextEdit(failedEntry,null);}
 const sessionFile=manager.getSessionFile(),sessionId=manager.getSessionId(),prefix=readFileSync(sessionFile);
 try{
  const finished=new Promise((resolveResult,reject)=>{
   child=fork(resolve('dist/apps/agent-worker/index.js'),[],{cwd:workspace,env:{PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,HOME:dir,USERPROFILE:dir,PI_API_KEY:'offline-test-only',NO_COLOR:'1'},execArgv:[],stdio:['ignore','ignore','pipe','ipc']});
   let terminal,stderr='';const timer=setTimeout(()=>{child.kill();reject(Error('Offline worker timed out: '+stderr));},30000);
   child.stderr.on('data',b=>{stderr+=b;});child.on('error',reject);
   child.on('message',m=>{
    events.push(m);
    if(m.type==='model_http_acquire'){rpcPhases.push(m.contextRecovery??'ordinary');child.send({type:'model_http_response',requestId:m.requestId,result:{allowed:true}});}
    if(m.type==='model_http_finish')child.send({type:'model_http_response',requestId:m.requestId,result:null});
    if(m.type==='tool'){
     toolEffects++;
     if(mode==='exact-replay'){
      try{const result=app.operations.execute(exactActor,m.tool,m.input,{projectId:exactActor.projectId,sessionId:exactActor.sessionId,idempotencyKey:m.toolCallId});child.send({type:'tool_response',requestId:m.requestId,result});}
      catch(error){child.send({type:'tool_response',requestId:m.requestId,error:{code:error.code,message:error.message}});}
     }else child.send({type:'tool_response',requestId:m.requestId,result:{state:'completed',receipt:'original-tool-receipt',data:'R'.repeat(100000)}});
    }
    if(m.type==='done'||m.type==='failure')terminal=m;
   });child.once('close',()=>{clearTimeout(timer);terminal?resolveResult(terminal):reject(Error('Worker exited without terminal: '+stderr));});
   child.send({type:'start',dataDir:dir,repoRoot:process.cwd(),workspace,agentDir,sessionDir,modelsPath,piSessionPath:sessionFile,model:{provider:'offline-context',model:'fixture',thinking:'high'},role,permissionMode,...(omitEligibility?{}:{contextRecoveryEligible:eligible}),managedHttp:true,catalogFingerprint:publicationImageCatalog(modelsPath),prompt:'ONE_CURRENT_HUMAN_PROMPT',history:null,tools:tools?[mode==='exact-replay'?{name:'session_action_execute',description:'Execute fixed approved body',example:{actionId:'fixed'},inputSchema:{type:'object',properties:{actionId:{type:'string'}},required:['actionId'],additionalProperties:false}}:{name:'contract_read',description:'Offline receipt',example:{},inputSchema:{type:'object',properties:{},additionalProperties:false}}]:[]});
  });
  const terminal=await finished,bytes=readFileSync(sessionFile),entries=bytes.toString('utf8').trim().split(/\r?\n/).map(JSON.parse);
  assert.ok(events.some(e=>e.type==='ready'),JSON.stringify(terminal));
  assert.deepEqual(bytes.subarray(0,prefix.length),prefix,'existing native bytes remain an exact prefix');
  assert.equal(events.find(e=>e.type==='ready')?.sessionFile,sessionFile);assert.equal(events.find(e=>e.type==='ready')?.sessionId,sessionId);
  assert.deepEqual(events.find(e=>e.type==='ready')?.model,{provider:'offline-context',id:'fixture'});
  const users=entries.filter(e=>e.type==='message'&&e.message.role==='user'&&content(e.message).includes('ONE_CURRENT_HUMAN_PROMPT'));
  assert.equal(users.length,1,'current human prompt is never replayed');
  assert.ok(entries.some(e=>e.type==='thinking_level_change'&&e.thinkingLevel==='high'));
  assert.ok(entries.filter(e=>e.type==='message'&&e.message.role==='assistant').every(e=>e.message.model==='fixture'&&e.message.provider==='offline-context'));
  assert.ok(summaries<=2,'SDK split summaries stay bounded');
  if(mode==='exact-replay'){
   assert.equal(exactEffects,1);assert.equal(app.store.get('session-action',exactAction.id).state,'completed');
   const root=app.store.get('session',exactActor.sessionId),saved=readFileSync(join(app.store.paths.physical(root.workspace),'fixed.txt'));assert.equal(digest(saved),digest(Buffer.from(fixedBody)));
  }
  return {terminal,requests,events,entries,rpcPhases,summaries,ordinary,toolEffects,failedEntry,exactEffects};
 }finally{if(child?.connected)child.disconnect();child?.kill();await new Promise(r=>server.close(r));app.close();rmSync(dir,{recursive:true,force:true});}
}

test('pinned worker recovers fresh empty length once with SDK reserve and preserves earlier successful tool receipts',async()=>{
 const r=await fixture('success',{tools:true});assert.equal(r.terminal.type,'done',JSON.stringify({terminal:r.terminal,rpcPhases:r.rpcPhases,types:r.entries.slice(-10).map(e=>e.type),events:r.events.filter(e=>e.type==='assistant_message')}));assert.equal(r.toolEffects,1);assert.equal(r.summaries,2,'SDK split turn uses exactly its two summary calls');assert.equal(r.entries.filter(e=>e.type==='compaction').length,1);
 const edits=r.entries.filter(e=>e.type==='context_edit');assert.equal(edits.length,1);const target=r.entries.find(e=>e.id===edits[0].targetId);assert.equal(emptyLengthAssistant(target.message),true);
 assert.equal(r.entries.filter(e=>e.type==='message'&&e.message.role==='toolResult').length,1);assert.ok(JSON.stringify(r.entries).includes('original-tool-receipt'));
 assert.ok(r.rpcPhases.includes('summary'));assert.ok(r.rpcPhases.includes('resume'));
 const empty=r.events.find(e=>e.type==='assistant_message'&&e.stopReason==='length');assert.match(empty.error,/^CONTEXT_LENGTH_INCOMPLETE:/);
 const ordinary=r.requests.filter(p=>!p.messages.some(m=>m.role==='user'&&/<conversation>\n|^# Conversation\n/.test(content(m))));assert.equal(ordinary[0].max_tokens??ordinary[0].max_completion_tokens,1,'fixture reproduces the original SDK cap');
 const summaryRequests=r.requests.filter(p=>p.messages.some(m=>m.role==='user'&&/<conversation>\n|^# Conversation\n/.test(content(m))));assert.ok(summaryRequests.every(p=>(p.max_tokens??p.max_completion_tokens)>1),'summary serialization reserves output without increasing the model context');
 assert.equal(r.events.at(-1).type,'done');
});

test('previous empty length compacts before one new human input; an already omitted failure never rearms',async()=>{
 const previous=await fixture('success',{historical:true});assert.equal(previous.terminal.type,'done');assert.equal(previous.rpcPhases[0],'summary');assert.equal(previous.entries.filter(e=>e.type==='compaction').length,1);assert.equal(previous.entries.filter(e=>e.type==='context_edit').at(-1).targetId,previous.failedEntry);
 const resolved=await fixture('success',{historical:true,resolvedHistory:true});assert.equal(resolved.terminal.type,'done');assert.equal(resolved.summaries,0);assert.equal(resolved.rpcPhases[0],'ordinary');
});

test('an exact approved body executes before empty length; a new call after recovery cannot replay it',async()=>{
 const r=await fixture('exact-replay',{tools:true});assert.equal(r.terminal.type,'done');assert.equal(r.toolEffects,2);assert.equal(r.exactEffects,1);assert.equal(r.entries.filter(e=>e.type==='compaction').length,1);assert.ok(JSON.stringify(r.entries).includes('SESSION_ACTION_NOT_APPROVED'));
});

for(const mode of ['summary-empty','summary-length','summary-error','summary-abort','summary-tool','second-length'])test(`pinned worker stops explicitly after ${mode}`,async()=>{
 const r=await fixture(mode);assert.equal(r.terminal.type,'failure');assert.match(r.terminal.error,/CONTEXT_COMPACTION_FAILED|CONTEXT_LENGTH_INCOMPLETE/);assert.ok(r.summaries<=2);assert.ok(r.entries.filter(e=>e.type==='compaction').length<=1);assert.equal(r.events.some(e=>e.type==='done'),false);
 if(mode!=='second-length')assert.equal(r.entries.filter(e=>e.type==='compaction').length,0,'bad summary must not persist as a checkpoint');
});

test('missing eligibility, no preparation and insufficient summary reserve fail without extra HTTP',async()=>{
 for(const opts of [{omitEligibility:true},{eligible:false},{permissionMode:'readOnly'},{role:'writer'},{short:true},{oversized:true}]){const r=await fixture('success',opts);assert.equal(r.terminal.type,'failure');assert.equal(r.summaries,0);assert.equal(r.ordinary,1);assert.equal(r.events.some(e=>e.type==='done'),false);}
});
