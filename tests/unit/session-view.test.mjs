import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
const start=(s,generation)=>{const row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation});s.app.store.event(s.project.id,'agent.started',{sessionId:row.id,generation});};
const delta=(s,generation,text,truncated=false)=>s.app.store.event(s.project.id,'session.delta',{sessionId:s.session.id,generation,text,truncated});
const finishMessage=(s,generation,content)=>s.app.store.transaction(()=>{const m=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'assistant',content,mode:'prompt',status:'completed'});s.app.store.event(s.project.id,'session.message_completed',{sessionId:s.session.id,generation,messageId:m.id});return m;});

test('tool activity is scoped to the current unfinished response and never replays a stale or foreign generation',()=>{
 const s=setup();try{
  start(s,2);
  const event=(sessionId,generation,tool,status)=>s.app.store.event(s.project.id,'session.activity',{sessionId,generation,tool,status});
  event(s.session.id,2,'project_inspect','running');
  event('other-session',2,'workspace_read','running');event(s.session.id,1,'run_submit','running');
  assert.deepEqual(s.app.sessions.view(USER,s.session.id).progress.activity,{tool:'project_inspect',status:'running'});
  event(s.session.id,2,'project_inspect','failed');
  assert.deepEqual(s.app.sessions.view(USER,s.session.id).progress.activity,{tool:'project_inspect',status:'failed'});
  finishMessage(s,2,'Failure explained');assert.equal(s.app.sessions.view(USER,s.session.id).progress.activity,undefined);
  start(s,3);assert.equal(s.app.sessions.view(USER,s.session.id).progress.activity,undefined);
 }finally{s.close();}
});

test('IPC keeps response phases and safe tool names after reopening, without storing tool arguments in activity',async()=>{
 const s=setup(),worker=join(s.dir,'message-parts-fixture.mjs');
 writeFileSync(worker,`// UNIT IPC fixture; no SDK/model call.\nprocess.on('message',m=>{if(m.type==='start'){process.send({type:'assistant_message',content:'',toolCalls:['project_inspect','unknown-private-name'],phase:'commentary',stopReason:'toolUse',usage:{fixture:true}});process.send({type:'tool_execution_start',tool:'project_inspect',toolCallId:'call',input:{secret:'must-not-be-recorded'}});}if(m.type==='finish_fixture'){process.send({type:'tool_execution_end',tool:'project_inspect',toolCallId:'call',isError:true});process.send({type:'tool_execution_end',tool:'project_inspect',toolCallId:'call',isError:true});process.send({type:'assistant_message',content:'## Final answer',phase:'final_answer',stopReason:'stop',usage:{fixture:true}});process.send({type:'done'});}});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'FIXTURE',message:'No model'}),workerEntry:worker});
 try{
  s.app.sessions.send(USER,s.session.id,{content:'fixture grouping'});host.tick();
  const until=Date.now()+5000;while(Date.now()<until&&!s.app.sessions.view(USER,s.session.id).progress.activity)await new Promise(r=>setTimeout(r,20));
  let view=s.app.sessions.view(USER,s.session.id);assert.deepEqual(view.progress.activity,{tool:'project_inspect',status:'running'});
  const interim=view.messages.find(m=>m.role==='assistant');assert.equal(interim.generation,1);assert.equal(interim.phase,'commentary');assert.deepEqual(interim.toolCalls,['project_inspect']);
  host.active.get(s.session.id).child.send({type:'finish_fixture'});
  const end=Date.now()+5000;while(Date.now()<end&&s.app.sessions.get(USER,s.session.id).state==='running')await new Promise(r=>setTimeout(r,20));
  view=s.app.sessions.view(USER,s.session.id);assert.equal(view.progress.active,false);assert.equal(view.progress.activity,undefined);assert.equal(view.messages.at(-1).phase,'final_answer');assert.equal(view.messages.at(-1).content,'## Final answer');
  const activity=s.app.store.events(0,s.project.id).filter(e=>e.type==='session.activity');assert.equal(activity.length,3);assert.equal(view.messages.filter(m=>m.role==='system'&&m.status==='failed').length,1);assert.match(view.messages.find(m=>m.role==='system').content,/project_inspect.*调用失败/);assert.doesNotMatch(JSON.stringify(activity),/must-not-be-recorded|unknown-private-name|toolCallId/);
  const reopened=new ResearchApp(s.dir,process.cwd());try{assert.deepEqual(reopened.sessions.view(USER,s.session.id).messages,view.messages);}finally{reopened.close();}
 }finally{await host.stop();s.close();}
});

test('session view restores only the current generation and latest unfinished answer, without replaying historical deltas',()=>{
 const s=setup();try{
  start(s,1);delta(s,1,'old preview');finishMessage(s,1,'old final');start(s,2);delta(s,2,'当前');
  s.app.sessions.system(s.session.id,'independent durable notice');delta(s,2,'输出🙂');delta(s,1,'late stale preview');
  const other=s.app.projects.create(USER,{name:'Other events',template:'empty'});for(let i=0;i<700;i++)s.app.store.event(other.id,'session.delta',{sessionId:'unrelated',generation:2,text:'not this session'});
  const view=s.app.sessions.view(USER,s.session.id);assert.equal(view.progress.content,'当前输出🙂');assert.equal(view.progress.generation,2);assert.equal(view.progress.active,true);assert.equal(view.messages[0].content,'old final');
  assert.deepEqual(s.app.sessions.view(USER,s.session.id),view,'rereading cannot duplicate preview text');
  finishMessage(s,2,'当前完整输出🙂');assert.equal(s.app.sessions.view(USER,s.session.id).progress.content,'');assert.equal(s.app.sessions.view(USER,s.session.id).messages.at(-1).content,'当前完整输出🙂');
  delta(s,2,'next answer');assert.equal(s.app.sessions.view(USER,s.session.id).progress.content,'next answer');
  const row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{state:'interrupted',generation:3});assert.deepEqual(s.app.sessions.view(USER,row.id).progress,{generation:3,active:false,canSteer:false,content:'',truncated:false,cursor:s.app.store.eventCursor(s.project.id)});
  assert.throws(()=>s.app.sessions.view({type:'agent',projectId:s.project.id},row.id),{code:'PERMISSION_DENIED'});
 }finally{s.close();}
});

test('tool notices trust Host approval classification and whitelist validation paths, retaining safe history',async()=>{
 const s=setup(),worker=join(s.dir,'tool-diagnostic-fixture.mjs');
 writeFileSync(worker,`// UNIT IPC fixture; no SDK/model call.\nprocess.on('message',m=>{if(m.type==='start'){process.send({type:'tool_execution_end',tool:'project_inspect',toolCallId:'forged-approval',isError:true,diagnostic:{code:'APPROVAL_REQUIRED'}});process.send({type:'tool_execution_end',tool:'project_inspect',toolCallId:'missing-input',isError:true,diagnostic:{code:'INVALID_INPUT',path:'$.input',reason:'缺少必需字段'}});process.send({type:'tool_execution_end',tool:'project_inspect',toolCallId:'private-key',isError:true,diagnostic:{code:'INVALID_INPUT',path:'$.input.private-secret-key',reason:'未知字段'},result:{secret:'private-result'}});process.send({type:'tool',requestId:1,tool:'research_brief_save',input:${JSON.stringify({expectedRevisionId:null,question:'Fixed question',scope:'Fixed scope',constraints:[],successCriteria:[],clarificationQuestions:['Clarify'],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[],status:'clarifying'})},toolCallId:'actual-approval'});}if(m.type==='tool_response'){process.send({type:'tool_execution_end',tool:'research_brief_save',toolCallId:'actual-approval',isError:true,diagnostic:{code:'INVALID_INPUT',path:'$.input.secret',reason:'must-not-be-recorded'}});process.send({type:'tool_execution_end',tool:'research_brief_save',toolCallId:'actual-approval',isError:true});process.send({type:'assistant_message',content:'Finished fixture'});process.send({type:'done'});}});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'FIXTURE',message:'No model'}),workerEntry:worker});
 try{
  const p=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'confirm',expectedVersion:p.version,expectedHostVersion:p.hostAccess.version});
  const message=s.app.sessions.send(USER,s.session.id,{content:'diagnostic fixture'});host.tick();
  const end=Date.now()+5000;while(Date.now()<end&&s.app.store.get('message',message.id).status==='running')await new Promise(r=>setTimeout(r,20));
  const view=s.app.sessions.view(USER,s.session.id),notices=view.messages.filter(m=>m.role==='system');
  assert.equal(notices.length,4);assert.equal(notices[3].status,'completed');assert.match(notices[3].content,/需要用户确认本次操作，请处理当前审批卡/);
  assert.equal(notices[0].status,'failed');assert.doesNotMatch(notices[0].content,/当前审批卡/);
  assert.match(notices[1].content,/INVALID_INPUT.*\$\.input.*缺少必需字段/);
  assert.equal(notices[2].status,'failed');
  assert.equal(s.app.store.list('research-brief',s.project.id).length,0);
  assert.equal(s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1).state,'pending');
  const activity=s.app.store.events(0,s.project.id).filter(e=>e.type==='session.activity');assert.equal(activity.at(-1).payload.status,'completed');
  assert.doesNotMatch(JSON.stringify({notices,activity}),/private-secret-key|private-result|must-not-be-recorded|\$\.input\.secret/);
  const reopened=new ResearchApp(s.dir,process.cwd());try{assert.deepEqual(reopened.sessions.view(USER,s.session.id).messages,view.messages);}finally{reopened.close();}
 }finally{await host.stop();s.close();}
});

test('domain approvals without a pending session action stay failed even when Worker reports success',async t=>{
 for(const rejected of [false,true])for(const isError of [true,false])await t.test(`rejected=${rejected}, Worker isError=${isError}`,async()=>{
  const s=setup(),worker=join(s.dir,'domain-approval-fixture.mjs');
  const intent=s.app.runs.prepare(USER,s.baseline.id,s.session.id),approval=s.app.store.get('approval',intent.approvalId);
  if(rejected)s.app.approvals.decide(USER,approval.id,approval.version,false);
  writeFileSync(worker,`// UNIT IPC fixture with actual Host dispatch; no SDK/model or compute.\nprocess.on('message',m=>{if(m.type==='start')process.send({type:'tool',requestId:1,tool:'run_submit',input:{intentId:${JSON.stringify(intent.id)}},toolCallId:'domain-approval'});if(m.type==='tool_response'){process.send({type:'tool_execution_end',tool:'run_submit',toolCallId:'domain-approval',isError:${isError},diagnostic:{code:'APPROVAL_REQUIRED'}});process.send({type:'assistant_message',content:m.error?.code??'unexpected dispatch success'});process.send({type:'done'});}});`);
  const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'FIXTURE',message:'No model'}),workerEntry:worker});
  try{
   const message=s.app.sessions.send(USER,s.session.id,{content:'domain approval fixture'});host.tick();
   const end=Date.now()+5000;while(Date.now()<end&&s.app.store.get('message',message.id).status==='running')await new Promise(r=>setTimeout(r,20));
   const view=s.app.sessions.view(USER,s.session.id),notice=view.messages.find(m=>m.role==='system');
   assert.equal(view.messages.find(m=>m.role==='assistant').content,'APPROVAL_REQUIRED','actual domain approval rejection reached Host dispatch');
   assert.equal(s.app.store.list('session-action',s.project.id).length,0);assert.equal(s.app.store.list('run',s.project.id).length,0);
   assert.equal(s.app.store.get('approval',approval.id).status,rejected?'rejected':'pending');
   assert.equal(notice.status,'failed',`domain approval rejected=${rejected}, Worker isError=${isError}`);assert.match(notice.content,/调用失败/);assert.doesNotMatch(notice.content,/当前审批卡/);
   assert.equal(s.app.store.events(0,s.project.id).filter(e=>e.type==='session.activity').at(-1).payload.status,'failed');
   const reopened=new ResearchApp(s.dir,process.cwd());try{assert.deepEqual(reopened.sessions.view(USER,s.session.id).messages,view.messages);}finally{reopened.close();}
  }finally{await host.stop();s.close();}
 });
});

test('preview is bounded by both event count and text length and marks omitted live text',()=>{
 const s=setup();try{
  start(s,1);for(let i=0;i<300;i++)delta(s,1,String(i)+';');let v=s.app.sessions.view(USER,s.session.id);assert.equal(v.progress.truncated,true);assert.equal(v.progress.content,Array.from({length:256},(_,i)=>String(i+44)+';').join(''));
  finishMessage(s,1,'checkpoint');for(let i=0;i<10;i++)delta(s,1,'🙂'.repeat(2000));v=s.app.sessions.view(USER,s.session.id);assert.equal(v.progress.content.length,32000);assert.equal(v.progress.truncated,true);assert.equal(v.progress.content,'🙂'.repeat(16000));
  finishMessage(s,1,'checkpoint two');delta(s,1,'bounded original chunk',true);assert.equal(s.app.sessions.view(USER,s.session.id).progress.truncated,true);
  start(s,2);assert.equal(s.app.sessions.view(USER,s.session.id).progress.truncated,false);
  const row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{generation:3});s.app.store.event(s.project.id,'agent.started',{sessionId:row.id});delta(s,2,'legacy unknown turn');assert.equal(s.app.sessions.view(USER,row.id).progress.content,'');
 }finally{s.close();}
});

test('message and preview reads use one WAL snapshot without blocking another writer',()=>{
 const s=setup(),other=new ResearchApp(s.dir,process.cwd());try{
  start(s,1);delta(s,1,'before');const original=s.app.sessions.get.bind(s.app.sessions);let once=false;
  s.app.sessions.get=(...args)=>{const snapshot=original(...args);if(!once){once=true;other.store.transaction(()=>{const row=other.sessions.get(USER,s.session.id);other.store.update('session',row.id,row.version,{generation:2});other.store.create('message',s.project.id,{sessionId:row.id,role:'assistant',content:'after',mode:'prompt',status:'completed'});other.store.event(s.project.id,'agent.started',{sessionId:row.id,generation:2});other.store.event(s.project.id,'session.delta',{sessionId:row.id,generation:2,text:'after preview'});});}return snapshot;};
  const before=s.app.sessions.view(USER,s.session.id);assert.equal(before.session.generation,1);assert.equal(before.messages.length,0);assert.equal(before.progress.content,'before');
  const after=s.app.sessions.view(USER,s.session.id);assert.equal(after.session.generation,2);assert.equal(after.messages[0].content,'after');assert.equal(after.progress.content,'after preview');
 }finally{other.close();s.close();}
});

test('real IPC fixture persists generation boundaries and explicitly labels clipped model text',async()=>{
 const s=setup(),worker=join(s.dir,'long-output-fixture.mjs');
 writeFileSync(worker,`// UNIT IPC fixture, no SDK/model call.\nprocess.on('message',m=>{if(m.type==='start'){process.send({type:'delta',text:'x'.repeat(5000)});process.send({type:'assistant_message',content:'y'.repeat(33000),usage:{fixture:true}});process.send({type:'done'});}});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'FIXTURE',message:'No model'}),workerEntry:worker});
 try{const msg=s.app.sessions.send(USER,s.session.id,{content:'fixture output'});host.tick();const end=Date.now()+5000;while(Date.now()<end&&s.app.store.get('message',msg.id).status==='running')await new Promise(r=>setTimeout(r,20));
  const view=s.app.sessions.view(USER,s.session.id);assert.equal(view.progress.active,false);assert.equal(view.progress.content,'');const final=view.messages.find(m=>m.role==='assistant');assert.equal(final.content.length,4000);assert.equal(final.previewTruncated,true);assert.equal(final.contentTruncated,true);const first=s.app.sessions.messageRead(USER,s.session.id,{messageId:final.id,limit:16000}),second=s.app.sessions.messageRead(USER,s.session.id,{messageId:final.id,cursor:first.end,limit:16000,expectedVersion:first.version});assert.equal(first.content+second.content,'y'.repeat(32000));assert.equal(second.sourceTruncated,true);assert.equal(second.complete,true);
  const events=s.app.store.events(0,s.project.id);const d=events.find(e=>e.type==='session.delta');assert.equal(d.payload.generation,1);assert.equal(d.payload.text.length,4000);assert.equal(d.payload.truncated,true);assert.equal(events.find(e=>e.type==='session.message_completed').payload.generation,1);
 }finally{await host.stop();s.close();}
});
