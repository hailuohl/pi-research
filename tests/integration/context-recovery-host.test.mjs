import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {resolve} from 'node:path';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {setup,USER} from '../support/research.mjs';
import {startTeam,spec} from '../support/collaboration.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<500;i++){if(fn())return;await pause(20);}throw Error('Recovery IPC fixture did not settle');}
const dependencies={inspect:()=>({ready:true,code:'OFFLINE_IPC',message:'No model'}),workerEntry:resolve('tests/fixtures/context-recovery-worker.mjs')};

for(const mode of ['old','unknown-tool','tool','summary','resume','sticky'])test(`host projects ${mode} correctly without clearing unrelated provider errors`,async()=>{
 const s=setup(),h=new AgentHost(s.app,dependencies);try{
  const input=s.app.sessions.send(USER,s.session.id,{content:'RECOVERY '+mode});h.tick();await until(()=>h.active.size===0);
  const session=s.app.store.get('session',s.session.id),messages=s.app.sessions.messages(USER,s.session.id),empty=messages.find(m=>m.role==='assistant'&&!m.content&&m.phase==='final_answer');
  if(mode==='tool'){assert.equal(session.state,'idle');assert.equal(messages.filter(m=>m.role==='assistant')[0].status,'completed');}
  else if(mode==='old'||mode==='unknown-tool'){assert.equal(session.state,'failed');assert.equal(empty.status,'failed');assert.match(session.lastError,/CONTEXT_LENGTH_INCOMPLETE/);assert.equal(s.app.store.get('message',input.id).status,'failed');}
  else if(mode==='sticky'){assert.equal(session.state,'failed');assert.match(session.lastError,/earlier failure/);assert.equal(messages.find(m=>m.content==='Recovery fixture output').status,'completed');}
  else{assert.equal(session.state,'idle',session.lastError);assert.equal(empty.status,'failed');assert.equal(s.app.store.get('message',input.id).status,'completed');assert.equal(messages.find(m=>m.content==='Recovery fixture output').status,'completed');}
 }finally{await h.stop();s.close();}
});

for(const phase of ['summary','resume'])for(const change of ['lease','generation','permission','source'])test(`${phase} dispatch rejects changed ${change} before HTTP admission`,async()=>{
 const s=setup();let changed=false,eligible;const h=new AgentHost(s.app,{...dependencies,fork:(...args)=>{const child=fork(...args);child.prependListener('message',m=>{
  if(m.type==='fixture_start')eligible=m.eligible;
  if(m.type!=='model_http_acquire'||changed)return;changed=true;const active=h.active.get(s.session.id),session=s.app.store.get('session',s.session.id);
  if(change==='lease')s.app.store.update('session',session.id,session.version,{leaseUntil:0});
  if(change==='generation')s.app.store.update('session',session.id,session.version,{generation:session.generation+1});
  if(change==='permission'){const p=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:p.version,expectedHostVersion:p.hostAccess.version});}
  if(change==='source'){const input=s.app.store.get('message',active.currentMessageId);s.app.store.update('message',input.id,input.version,{origin:'automation'});}
 });return child;}});
 try{s.app.sessions.send(USER,s.session.id,{content:'RECOVERY '+phase});h.tick();await until(()=>h.active.size===0);assert.equal(eligible,true);assert.equal(changed,true);assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items.length,0);assert.ok(s.app.store.events().some(e=>e.type==='agent.finished'&&/CONTEXT_COMPACTION_FAILED/.test(e.payload.error)));}
 finally{await h.stop();s.close();}
});

for(const scope of ['readOnly','approval-notice','automation','task','wakeup','continuation'])test(['wakeup','continuation'].includes(scope)?`${scope} actor is ineligible and tagged dispatch is denied`:`${scope} never receives recovery authority`,async()=>{
 const s=setup();let eligible,workerSession=s.session.id;const h=new AgentHost(s.app,{...dependencies,fork:(...args)=>{const child=fork(...args);child.on('message',m=>{if(m.type==='fixture_start')eligible=m.eligible;});return child;}});
 try{
  if(scope==='task'){const team=startTeam(s,[spec('recovery',{objective:'RECOVERY summary'})]);h.tick();workerSession=s.app.teams.tasks(USER,team.id)[0].sessionId;}
  else{
   if(scope==='readOnly'){const p=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:p.version,expectedHostVersion:p.hostAccess.version});}
   if(scope==='approval-notice'){
    s.app.sessionPermissions.initialize(s.session.id,'confirm');const root=s.app.store.get('session',s.session.id),running=s.app.store.update('session',root.id,root.version,{state:'running',generation:root.generation+1,leaseUntil:Date.now()+60000,skillBundleId:s.app.skills.configuration(s.project.id).bundleId});
    const actor={type:'agent',role:'coordinator',projectId:s.project.id,sessionId:running.id,generation:running.generation,permission:s.app.sessionPermissions.capture(running.id)};
    assert.throws(()=>s.app.sessionPermissions.guard(actor,'artifact_create',{title:'Recovery permission fixture',content:'Fixed synthetic approval'},'recovery-approval-notice'),{code:'APPROVAL_REQUIRED'});
    const action=s.app.sessionPermissions.status(USER,running.id).actions.at(-1);s.app.sessionPermissions.decide(USER,running.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true});
    const notice=s.app.sessions.messages(USER,running.id).find(message=>message.approvalNoticeId===action.id);s.app.store.update('message',notice.id,notice.version,{content:'RECOVERY summary'});const current=s.app.store.get('session',running.id);s.app.store.update('session',current.id,current.version,{state:'queued',leaseUntil:0});
   }else{
    const input=s.app.sessions.send(USER,s.session.id,{content:'RECOVERY summary'});
    if(scope==='automation')s.app.store.update('message',input.id,input.version,{origin:'automation'});
   }
   h.tick();const active=h.active.get(s.session.id);
   // Check restricted actors without inventing persisted wakeups or jobs that the lifecycle would need to finish.
   if(scope==='wakeup'||scope==='continuation'){assert.equal(h.contextRecoveryEligible({...active,actor:{...active.actor,[scope==='wakeup'?'wakeupId':'continuationId']:'fixture-restricted-actor'}}),false);active.contextRecoveryEligible=false;}
  }
  await until(()=>h.active.size===0);assert.equal(eligible,scope==='wakeup'||scope==='continuation'?true:false);
  assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items.length,0);assert.equal(s.app.store.get('session',workerSession).state,'failed');
 }finally{await h.stop();s.close();}
});
