import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {ResearchApp} from '../../dist/packages/research-app.js';

const options={inspect:()=>({ready:true}),workerEntry:resolve('tests/fixtures/workflow-continuation-worker.mjs')};
async function until(predicate){const deadline=Date.now()+15000;while(Date.now()<deadline){if(predicate())return;await delay(15);}assert.fail('Synthetic workflow IPC timed out');}
function prepare(state){
 state.app.sessionPermissions.initialize(state.session.id,'confirm');
 const brief=state.app.researchBriefs.save(USER,state.project.id,state.session.id,{question:'UNIT workflow host',scope:'Synthetic only',constraints:[],successCriteria:['Preserve fixed source'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Inspect fixed source'}],status:'ready',expectedRevisionId:null});
 const request={sourceKind:'brief',sourceId:brief.id,sourceDigest:brief.digest,expectedVersion:brief.version};
 return state.app.operations.execute(USER,'workflow_confirm',request,{projectId:state.project.id,sessionId:state.session.id,idempotencyKey:'confirm'});
}
function approve(state,action){const approval=state.app.store.get('approval',action.approvalId);state.app.sessionPermissions.decide(USER,state.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:approval.version,approved:true});return state.app.sessions.messages(USER,state.session.id).find(message=>message.approvalNoticeId===action.id);}

test('real Host IPC preserves a workflow through two precise approvals without human identity or initial replay',async()=>{
 const state=setup(),host=new AgentHost(state.app,options);try{
  const receipt=prepare(state);host.tick();const initial=host.active.get(state.session.id);assert.ok(initial);assert.equal(initial.actor.messageId,undefined);assert.equal(initial.actor.workflowContinuationId,receipt.id);assert.equal(initial.currentMessageId,null);assert.equal(initial.actor.wakeupId,undefined);
  await until(()=>host.active.size===0);const first=state.app.store.list('session-action')[0];assert.ok(first,'first ordinary tool requests approval');assert.equal(first.workflowContinuationId,receipt.id);assert.equal(state.app.store.get('approval',first.approvalId).status,'pending');assert.equal(state.app.store.list('artifact').length,0);
  const firstNotice=approve(state,first);assert.equal(state.app.store.get('session-action',first.id).workflowApprovalNoticeMessageId,firstNotice.id);host.tick();const resumed=host.active.get(state.session.id);assert.ok(resumed);assert.equal(resumed.actor.messageId,undefined);assert.equal(resumed.actor.workflowContinuationId,receipt.id);
  await until(()=>host.active.size===0);assert.equal(state.app.store.get('session-action',first.id).state,'completed');const second=state.app.store.list('session-action').find(action=>action.id!==first.id);assert.ok(second,'the same lineage can request a second permission');assert.equal(second.workflowContinuationId,receipt.id);assert.equal(state.app.store.list('artifact').length,1);
  const secondNotice=approve(state,second);host.tick();await until(()=>host.active.size===0);assert.equal(state.app.store.get('session-action',second.id).state,'completed');assert.equal(state.app.store.list('artifact').length,2);
  const messages=state.app.sessions.messages(USER,state.session.id);assert.equal(messages.filter(message=>message.workflowContinuationId===receipt.id).length,1);assert.equal(messages.filter(message=>message.role==='user'&&!message.approvalNoticeId).length,0);assert.equal(state.app.store.get('session',state.session.id).lastConsumedHumanMessageId,undefined);
  assert.throws(()=>state.app.sessions.retry(USER,state.session.id,secondNotice.id),{code:'MESSAGE_NOT_RETRYABLE'});
  const original=messages.find(message=>message.workflowContinuationId===receipt.id);assert.equal(original.status,'completed');assert.throws(()=>state.app.workflowContinuations.assertClaim(original),{code:'WORKFLOW_NOTICE_INVALID'});
  host.tick();await delay(60);assert.equal(host.active.size,0);assert.equal(state.app.store.list('artifact').length,2);
 }finally{await host.stop();state.close();}
});

test('an unavailable model fails an unclaimed notice visibly without undoing confirmation or recapturing authority',async()=>{
 const state=setup(),host=new AgentHost(state.app,{...options,inspect:()=>({ready:false,code:'UNIT_UNAVAILABLE',message:'private path must not escape'})});try{
  const receipt=prepare(state);host.tick();assert.equal(host.active.size,0);const fixed=state.app.store.get('workflow-continuation',receipt.id),message=state.app.store.get('message',fixed.initialMessageId);
  assert.equal(message.status,'cancelled');assert.equal(message.generation,undefined);assert.equal(fixed.invalidatedReasonCode,'WORKFLOW_MODEL_UNAVAILABLE');assert.equal(state.app.store.get('research-brief',receipt.sourceId).status,'confirmed');assert.doesNotMatch(JSON.stringify(state.app.workflowContinuations.list(USER,state.project.id,state.session.id)),/private path/);
  host.tick();assert.equal(state.app.store.list('message').length,1);
 }finally{await host.stop();state.close();}
});

test('two hosts cannot claim the initial notice twice and new human input outranks an older approval notice',async()=>{
 const state=setup(),other=new ResearchApp(state.dir,process.cwd()),firstHost=new AgentHost(state.app,options),secondHost=new AgentHost(other,options);try{
  const receipt=prepare(state);firstHost.tick();secondHost.tick();assert.equal(firstHost.active.size,1);assert.equal(secondHost.active.size,0);await until(()=>firstHost.active.size===0);
  const action=state.app.store.list('session-action')[0],notice=approve(state,action),human=state.app.sessions.send(USER,state.session.id,{content:'UNIT superseding question'});
  firstHost.tick();const active=firstHost.active.get(state.session.id);assert.equal(active.actor.messageId,human.id);assert.equal(active.actor.workflowContinuationId,undefined);await until(()=>firstHost.active.size===0);
  assert.equal(state.app.store.get('message',notice.id).status,'cancelled');assert.equal(state.app.store.get('workflow-continuation',receipt.id).invalidatedReasonCode,'WORKFLOW_REQUEST_CHANGED');assert.equal(state.app.store.list('artifact').length,0);assert.equal(state.app.store.get('research-brief',receipt.sourceId).status,'confirmed');
  assert.equal(state.app.sessionPermissions.status(USER,state.session.id).actions.find(row=>row.id===action.id).state,'stale');secondHost.tick();assert.equal(secondHost.active.size,0);
 }finally{await firstHost.stop();await secondHost.stop();other.close();state.close();}
});

test('a human steer waits outside an active workflow and does not become its tool origin',async()=>{
 const state=setup(),host=new AgentHost(state.app,options);try{
  const receipt=prepare(state);host.tick();const active=host.active.get(state.session.id),human=state.app.sessions.send(USER,state.session.id,{content:'UNIT superseding question',mode:'steer'});host.tick();
  assert.equal(active.messageIds.includes(human.id),false);assert.equal(active.currentMessageId,null);assert.equal(state.app.store.get('message',human.id).status,'queued');await until(()=>host.active.size===0);
  const action=state.app.store.list('session-action')[0];assert.equal(action.workflowContinuationId,receipt.id);assert.equal(action.requestRef,undefined);host.tick();await until(()=>host.active.size===0);assert.equal(state.app.store.get('session',state.session.id).lastConsumedHumanMessageId,human.id);assert.equal(state.app.store.list('artifact').length,0);
 }finally{await host.stop();state.close();}
});
