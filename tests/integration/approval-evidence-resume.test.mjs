import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {safeToolDiagnostic,toolFailureMessage} from '../../dist/packages/pi-adapter/tool-diagnostic.js';
import {buildCustomTools} from '../../dist/packages/pi-adapter/options.js';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';
import {imageContextReferences} from '../../dist/packages/pi-adapter/publication-image.js';
import {publicationFixture} from '../support/publication.mjs';
import {documentImageFixture} from '../support/document-image.mjs';

const call=(s,a,name,input={},key=crypto.randomUUID())=>s.app.operations.execute(a,name,input,{projectId:s.project.id,sessionId:a.sessionId??s.session.id,idempotencyKey:key});
function agent(s){const mode=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'confirm',expectedVersion:mode.version,expectedHostVersion:mode.hostAccess.version});const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',skillBundleId:s.app.skills.configuration(s.project.id).bundleId,generation:row.generation+1,leaseUntil:Date.now()+60000});return {type:'agent',role:'coordinator',projectId:s.project.id,sessionId:row.id,generation:row.generation+1,permission:s.app.sessionPermissions.capture(row.id)};}
function approve(s,a){const action=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);s.app.sessionPermissions.decide(USER,s.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true});const notice=s.app.sessions.messages(USER,s.session.id).find(m=>m.approvalNoticeId===action.id);s.app.store.update('message',notice.id,notice.version,{status:'running',generation:a.generation});return {action,actor:{...a,approvalNoticeMessageId:notice.id},notice};}
function confirmedBrief(s){const brief=s.app.researchBriefs.save(USER,s.project.id,s.session.id,{expectedRevisionId:null,question:'Offline scope check',scope:'Fixed fixture only',constraints:[],successCriteria:['Preserve approved inputs'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Check fixed scope'}],status:'ready'});s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:brief.id,expectedVersion:brief.version});}

test('approval resumes the exact stored operation without copying action ID or parameters',async()=>{
 const s=setup();try{
  const a=agent(s),input={title:'Exact approved bytes',content:'Do not copy me'};
  assert.throws(()=>call(s,a,'artifact_create',input),{code:'APPROVAL_REQUIRED'});
  const fixed=approve(s,a),tools=new ToolDispatcher(s.app);
  assert.equal(tools.definitions('coordinator',false,s.session.id).some(t=>t.name==='session_action_resume'),false);
  assert.equal(tools.definitions('coordinator',false,s.session.id,false,false,fixed.action.id).some(t=>t.name==='session_action_resume'),true);
  assert.throws(()=>call(s,a,'session_action_inspect',{actionId:fixed.action.id.slice(1)}),{code:'NOT_FOUND'});
  const result=await call(s,fixed.actor,'session_action_resume');
  assert.equal(result.actionId,fixed.action.id);assert.equal(result.operation,'artifact_create');
  assert.equal(s.app.evidence.read(USER,result.result.id).bytes.toString(),input.content);
  await assert.rejects(async()=>call(s,fixed.actor,'session_action_resume'),{code:'SESSION_ACTION_NOT_APPROVED'});
 }finally{s.close();}
});

test('exact quotes reject missing, changed, repeated and mismatched text without inventing a locator',()=>{
 const s=setup();try{
  const content='😀 Same text.\nUnique 32% result. Same text.',artifact=s.app.evidence.put(s.project.id,'source',Buffer.from(content));
  for(const [exactQuote,code] of [['Same text.','EVIDENCE_QUOTE_AMBIGUOUS'],['Unique 33% result.','EVIDENCE_QUOTE_NOT_FOUND'],['text. Unique','EVIDENCE_QUOTE_NOT_FOUND'],['Unique ... result.','EVIDENCE_QUOTE_NOT_FOUND']])assert.throws(()=>call(s,USER,'evidence_register',{artifactId:artifact.id,exactQuote}),{code});
  assert.throws(()=>call(s,USER,'evidence_register',{artifactId:artifact.id,exactQuote:'Same text.',start:0,end:10}),{code:'EVIDENCE_QUOTE_MISMATCH'});
  const start=content.lastIndexOf('Same text.'),e=call(s,USER,'evidence_register',{artifactId:artifact.id,exactQuote:'Same text.',start,end:start+10});
  assert.deepEqual(e.locator,{start,end:start+10});assert.equal(s.app.store.list('evidence').length,1);
  const old=call(s,USER,'evidence_register',{artifactId:artifact.id,start:0,end:2,description:'An unproven broad conclusion'});
  assert.equal(old.description,'An unproven broad conclusion');assert.equal(old.verification.interpretation,'unverified');
 }finally{s.close();}
});

test('model-facing schema and safe diagnostics teach exact correction without exposing private text',()=>{
 const s=setup();try{
  const tool=new ToolDispatcher(s.app).definitions('coordinator',false,s.session.id).find(t=>t.name==='evidence_register');
  assert.equal(tool.inputSchema.type,'object');assert.ok(tool.inputSchema.required.includes('exactQuote'));assert.equal(tool.inputSchema.properties.description,undefined);
  for(const code of ['EVIDENCE_EXACT_QUOTE_REQUIRED','EVIDENCE_QUOTE_NOT_FOUND','EVIDENCE_QUOTE_AMBIGUOUS','EVIDENCE_QUOTE_MISMATCH','SESSION_ACTION_NOTICE_REQUIRED','SESSION_ACTION_NOT_APPROVED','SESSION_ACTION_STALE']){
   const diagnostic=safeToolDiagnostic(tool.inputSchema,code,'private-source-canary');assert.equal(diagnostic.code,code);assert.doesNotMatch(toolFailureMessage('evidence_register',diagnostic),/private-source-canary/);
  }
 }finally{s.close();}
});

test('paginated full text retains BOM and UTF-16 offsets and quotes round-trip beyond the first page',()=>{
 const s=setup();try{
  const exactQuote='Distinct second-page result: 32%.',content='\ufeff😀'+('background '.repeat(1800))+exactQuote+'\nEnd.',artifact=s.app.evidence.put(s.project.id,'long full text',Buffer.from(content));let cursor=0,read='',pages=0;
  for(;;){const page=call(s,USER,'artifact_read',{artifactId:artifact.id,cursor});assert.ok(page.cursor>cursor);read+=page.content;pages++;cursor=page.cursor;if(page.complete)break;}
  assert.ok(pages>1);assert.equal(read,content);assert.equal(cursor,content.length);
  const evidence=call(s,USER,'evidence_register',{artifactId:artifact.id,exactQuote});assert.equal(evidence.locator.start,content.indexOf(exactQuote));assert.equal(call(s,USER,'evidence_read',{evidenceId:evidence.id}).quote,exactQuote);
 }finally{s.close();}
});

test('changed source blocks fixed resume without creating replacement approvals',async()=>{
 const s=setup();try{
  const a=agent(s),input={path:'frozen.txt',content:'approved bytes',expectedDigest:null};assert.throws(()=>call(s,a,'workspace_write',input),{code:'APPROVAL_REQUIRED'});const fixed=approve(s,a);
  writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'frozen.txt'),'owner changed the source');
  await assert.rejects(async()=>call(s,fixed.actor,'session_action_resume'),{code:'SESSION_ACTION_STALE'});assert.equal(s.app.store.list('session-action').length,1);
 }finally{s.close();}
});

test('historical range approvals reopen and resume exact stored parameters, with interpretation unverified',async()=>{
 const s=setup();try{
  const a=agent(s),artifact=s.app.evidence.put(s.project.id,'source',Buffer.from('Old fragment. Unrelated 32% result.'));
  const input={artifactId:artifact.id,start:0,end:12,description:'Legacy description exceeds the selected fragment'};
  // Seed the same pending action that the pre-quote contract persisted, without changing its bytes.
  assert.throws(()=>s.app.sessionPermissions.guard(a,'evidence_register',input,'historical-call'),{code:'APPROVAL_REQUIRED'});
  const fixed=approve(s,a),before=JSON.stringify(s.app.store.get('session-action',fixed.action.id).input);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  const result=(await call(s,fixed.actor,'session_action_resume')).result;
  assert.equal(result.description,input.description);assert.equal(result.quote,'Old fragment');assert.equal(result.verification.interpretation,'unverified');
  assert.equal(JSON.stringify(s.app.store.get('session-action',fixed.action.id).input),before);
  assert.equal(call(s,a,'evidence_read',{evidenceId:result.id}).verification.interpretation,'unverified');
 }finally{s.close();}
});

test('resume rejects unbound, queued, cross-session and stale notices without executing',async()=>{
 for(const boundary of ['missing','queued','cross-session','generation','permission','rejected','failed','unknown']){
  const s=setup();try{
   const a=agent(s);assert.throws(()=>call(s,a,'artifact_create',{title:'fixed',content:'Only these bytes'}),{code:'APPROVAL_REQUIRED'});
   const fixed=approve(s,a);let who=fixed.actor;
   if(boundary==='missing')who=a;
   else if(boundary==='permission'){const mode=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:mode.version,expectedHostVersion:mode.hostAccess.version});}
   else if(['rejected','failed','unknown'].includes(boundary)){const action=s.app.store.get('session-action',fixed.action.id);s.app.store.update('session-action',action.id,action.version,{state:boundary});}
   else {const notice=s.app.store.get('message',fixed.notice.id);s.app.store.update('message',notice.id,notice.version,boundary==='queued'?{status:'queued'}:boundary==='generation'?{generation:a.generation-1}:{sessionId:s.app.sessions.create(USER,s.project.id,{}).id});}
   await assert.rejects(async()=>call(s,who,'session_action_resume'),error=>['SESSION_ACTION_NOTICE_REQUIRED','SESSION_PERMISSION_STALE','SESSION_ACTION_NOT_APPROVED'].includes(error.code),boundary);
   assert.equal(s.app.store.list('artifact').length,0,boundary);
   assert.throws(()=>call(s,fixed.actor,'session_action_resume',{actionId:fixed.action.id}),{code:'INVALID_INPUT'});
  }finally{s.close();}
 }
});

test('asynchronous approved operations use the original authorized input and never text execution',async()=>{
 const s=setup();try{
  const a=agent(s),input={query:'precise approved network query',limit:2};let calls=0,release;
  s.app.literature.search=async(_pid,query,limit)=>{calls++;assert.equal(query,input.query);assert.equal(limit,2);await new Promise(resolve=>{release=resolve;});return s.app.store.create('literature-search',s.project.id,{query,source:'crossref',retrievedAt:new Date().toISOString(),coverage:'metadata-only',items:[]});};
  assert.throws(()=>call(s,a,'literature_search',input),{code:'APPROVAL_REQUIRED'});
  const fixed=approve(s,a),tools=new ToolDispatcher(s.app);
  assert.equal(tools.definitions('coordinator',false,s.session.id,false,false,fixed.action.id).some(t=>t.name==='session_action_execute'),false);
  assert.throws(()=>call(s,fixed.actor,'session_action_execute',{actionId:fixed.action.id}),{code:'SESSION_ACTION_EXECUTION_DENIED'});
  const running=call(s,fixed.actor,'session_action_resume');await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls,1);await assert.rejects(async()=>call(s,fixed.actor,'session_action_resume'),{code:'SESSION_ACTION_NOT_APPROVED'});
  release();const result=await running;assert.equal(result.operation,'literature_search');assert.equal(calls,1);
 }finally{s.close();}
});

test('coordinator registers an exact source quote, never treats a guessed range description as verified',async()=>{
 const s=setup();try{
  const a=agent(s),content='😀 Background. The measured reduction is 32%.\nOther section.',artifact=s.app.evidence.put(s.project.id,'full text',Buffer.from(content));
  assert.throws(()=>call(s,a,'evidence_register',{artifactId:artifact.id,start:0,end:14,description:'Reduction is 32%'}),{code:'EVIDENCE_EXACT_QUOTE_REQUIRED'});
  const input={artifactId:artifact.id,exactQuote:'The measured reduction is 32%.'};
  assert.throws(()=>call(s,a,'evidence_register',input),{code:'APPROVAL_REQUIRED'});
  const fixed=approve(s,a),result=(await call(s,fixed.actor,'session_action_resume')).result;
  assert.equal(result.quote,input.exactQuote);assert.equal(result.locator.start,content.indexOf(input.exactQuote));
  assert.deepEqual(result.verification,{quote:'source-bytes-verified',interpretation:'unverified'});
  assert.equal(result.description,'原文片段；解释与研究断言未核验');
  assert.deepEqual(call(s,a,'evidence_read',{evidenceId:result.id}).verification,result.verification);
 }finally{s.close();}
});

test('Host IPC captures notice at tool start; a newer notice or human steer cannot rebind it',async()=>{
 const s=setup(),entry=join(s.dir,'resume-worker.mjs'),responses=[];
 writeFileSync(entry,`const begin=id=>process.send({type:'tool_execution_start',tool:'session_action_resume',toolCallId:id});const call=(id,n)=>process.send({type:'tool',tool:'session_action_resume',toolCallId:id,requestId:n,input:{}});process.on('message',m=>{if(m.type==='start')begin('old-notice');if(m.type==='steer'){process.send({type:'message_ack',messageId:m.messageId});process.send({type:'input_consumed',messageId:m.messageId});if(m.content.includes('固定操作 ')){call('old-notice',1);begin('new-notice');call('new-notice',2);}else{begin('human');call('human',3);}}if(m.type==='tool_response')process.send({type:'assistant_message',content:JSON.stringify({requestId:m.requestId,result:m.result,error:m.error})});if(m.type==='fixture_finish'||m.type==='abort')process.send({type:'done'});});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true}),workerEntry:entry});
 const until=async predicate=>{for(let i=0;i<1000;i++){if(predicate())return;await delay(10);}assert.fail('resume IPC fixture timed out');};
 try{
  const a=agent(s);assert.throws(()=>call(s,a,'artifact_create',{title:'first',content:'first bytes'}),{code:'APPROVAL_REQUIRED'});const first=approve(s,a);
  const row=s.app.store.get('session',s.session.id),notice=s.app.store.get('message',first.notice.id);s.app.store.update('session',row.id,row.version,{state:'queued',leaseUntil:0});s.app.store.update('message',notice.id,notice.version,{status:'queued'});
  host.tick();const active=host.active.get(s.session.id);assert.ok(active,JSON.stringify(s.app.store.get('session',s.session.id)));active.child.on('message',m=>{if(m.type==='assistant_message')responses.push(JSON.parse(m.content));});
  await until(()=>active.callIdActors.has('old-notice'));assert.equal(active.callIdActors.get('old-notice').actor.approvalNoticeMessageId,first.notice.id);
  assert.throws(()=>call(s,active.actor,'artifact_create',{title:'second',content:'second bytes'}),{code:'APPROVAL_REQUIRED'});const action=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);s.app.sessionPermissions.decide(USER,s.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true});
  const next=s.app.sessions.messages(USER,s.session.id).find(m=>m.approvalNoticeId===action.id);assert.equal(active.currentApprovalNoticeMessageId,first.notice.id,'queued notice does not bind');s.app.sessions.queueAction(USER,s.session.id,{messageId:next.id,expectedVersion:next.version,action:'steer'});host.tick();
  await until(()=>responses.length===2);assert.equal(responses.find(r=>r.requestId===1).result.actionId,first.action.id);assert.equal(responses.find(r=>r.requestId===2).result.actionId,action.id);
  const human=s.app.sessions.send(USER,s.session.id,{content:'ordinary human input'});s.app.sessions.queueAction(USER,s.session.id,{messageId:human.id,expectedVersion:human.version,action:'steer'});host.tick();
  await until(()=>responses.length===3);assert.equal(responses[2].error.code,'SESSION_ACTION_NOTICE_REQUIRED');assert.equal(active.currentApprovalNoticeMessageId,undefined);assert.equal(active.callIdActors.get('old-notice').actor.approvalNoticeMessageId,first.notice.id);
  active.child.send({type:'fixture_finish'});await until(()=>host.active.size===0);
 }finally{await host.stop();s.close();}
});

test('image approvals cannot use resume; original tools retain image blocks and revocation checks',async()=>{
 for(const operation of ['document_page_image_read','publication_page_image_read']){
  const s=setup();try{
   const a=agent(s);confirmedBrief(s);
   const document=operation==='document_page_image_read'?documentImageFixture(s.app,s.project.id):undefined;
   const publication=operation==='publication_page_image_read'?publicationFixture(s.app,s.project.id,{actor:a}):undefined;
   const input=document?{documentVersionId:document.document.id,parseResultId:document.result.id,pageNumber:1,firstPage:1,lastPage:2}:{publicationResultId:publication.result.id,pageNumber:1};
   assert.throws(()=>call(s,a,operation,input),{code:'APPROVAL_REQUIRED'});const fixed=approve(s,a),tools=new ToolDispatcher(s.app);
   assert.equal(tools.definitions('coordinator',false,s.session.id,false,false,fixed.action.id).some(t=>t.name==='session_action_resume'),false);
   assert.match(fixed.notice.content,/session_action_inspect/);assert.doesNotMatch(fixed.notice.content,/session_action_resume/);
   await assert.rejects(s.app.sessionPermissions.resumeAction(fixed.actor,s.session.id),{code:'SESSION_ACTION_RESUME_DENIED'});
   await assert.rejects(async()=>call(s,fixed.actor,'session_action_resume'),{code:'SESSION_ACTION_RESUME_DENIED'});
   assert.throws(()=>s.app.operations.execute(fixed.actor,operation,input,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'unsupported-fixed-entry',approvedActionId:fixed.action.id}),{code:'SESSION_ACTION_EXECUTION_DENIED'});
   assert.equal(s.app.store.get('session-action',fixed.action.id).state,'approved');
   const inspected=call(s,a,'session_action_inspect',{actionId:fixed.action.id});assert.deepEqual(inspected.input,input);
   const sdkTool=buildCustomTools([{name:operation,...TOOL_DEFINITIONS[operation]}],(name,x,id)=>Promise.resolve(call(s,a,name,x,id)))[0];
   const image=await sdkTool.execute('original-image-tool',{input:inspected.input});assert.equal(image.content.filter(c=>c.type==='image').length,1);
   const references=imageContextReferences({messages:[{role:'toolResult',toolName:operation,isError:false,...image}]},true,true);assert.equal(references.length,1);assert.equal(references[0].actionId,fixed.action.id);
   const verify=()=>document?s.app.sessionPermissions.assertDocumentImageAction(a,references[0]):s.app.sessionPermissions.assertImageAction(a,references[0]);verify();s.app.approvals.stale(fixed.action.id);assert.throws(verify);
   await assert.rejects(sdkTool.execute('original-image-tool',{input:inspected.input}));
  }finally{s.close();}
 }
});

test('non-image computation preparation remains outside fixed resume and is not consumed',async()=>{
 const s=setup();try{
  const a=agent(s);confirmedBrief(s);const input={experimentId:s.baseline.id};assert.throws(()=>call(s,a,'run_prepare',input),{code:'APPROVAL_REQUIRED'});const fixed=approve(s,a);
  await assert.rejects(async()=>call(s,fixed.actor,'session_action_resume'),{code:'SESSION_ACTION_RESUME_DENIED'});
  assert.equal(s.app.store.get('session-action',fixed.action.id).state,'approved');assert.equal(s.app.store.list('run-intent').length,0);
  const inspected=call(s,a,'session_action_inspect',{actionId:fixed.action.id});assert.deepEqual(inspected.input,input);assert.ok(call(s,a,inspected.operation,inspected.input).id);
 }finally{s.close();}
});

for(const initialSupported of [true,false])test(`resume capability ${initialSupported?'supported to unsupported':'unsupported to supported'} steer waits for a fresh catalog`,async()=>{
 const s=setup(),entry=join(s.dir,'resume-catalog-worker.mjs');writeFileSync(entry,`process.on('message',m=>{if(m.type==='steer'){process.send({type:'message_ack',messageId:m.messageId});process.send({type:'input_consumed',messageId:m.messageId});}if(m.type==='fixture_finish'||m.type==='abort')process.send({type:'done'});});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true}),workerEntry:entry}),until=async predicate=>{for(let i=0;i<1000;i++){if(predicate())return;await delay(10);}assert.fail('catalog fixture timed out');};
 const prepare=(a,supported,key)=>{assert.throws(()=>call(s,a,supported?'literature_search':'run_prepare',supported?{query:key}:{experimentId:s.baseline.id},key),{code:'APPROVAL_REQUIRED'});const action=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);s.app.sessionPermissions.decide(USER,s.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true});return s.app.sessions.messages(USER,s.session.id).find(m=>m.approvalNoticeId===action.id);};
 try{
  const a=agent(s);confirmedBrief(s);const first=prepare(a,initialSupported,'first'),row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'queued',leaseUntil:0});host.tick();const active=host.active.get(s.session.id);assert.ok(active);assert.equal(active.advertisedTools.has('session_action_resume'),initialSupported);assert.equal(active.advertisedTools.has('session_action_execute'),false);
  const next=prepare(active.actor,!initialSupported,'next');s.app.sessions.queueAction(USER,s.session.id,{messageId:next.id,expectedVersion:next.version,action:'steer'});host.tick();assert.equal(s.app.store.get('message',next.id).status,'queued');assert.equal(active.messageIds.includes(next.id),false);assert.equal(active.currentApprovalNoticeMessageId,first.id);
  active.child.send({type:'fixture_finish'});await until(()=>host.active.size===0);host.tick();const replacement=host.active.get(s.session.id);assert.ok(replacement);assert.notEqual(replacement.child.pid,active.child.pid);assert.equal(replacement.advertisedTools.has('session_action_resume'),!initialSupported);assert.equal(replacement.currentApprovalNoticeMessageId,next.id);replacement.child.send({type:'fixture_finish'});await until(()=>host.active.size===0);
 }finally{await host.stop();s.close();}
});
