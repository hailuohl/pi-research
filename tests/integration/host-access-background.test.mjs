import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
const USER={type:'user'};
function fixture(){const dir=mkdtempSync(join(tmpdir(),'pi-host-background-')),app=new ResearchApp(join(dir,'data'),process.cwd()),project=app.projects.create(USER,{name:'Background host fixture',template:'empty'}),session=app.sessions.create(USER,project.id,{});app.sessionPermissions.initialize(session.id);return {dir,app,project,session,close(){this.app.close();rmSync(dir,{recursive:true,force:true});}};}
const status=s=>s.app.hostAccess.status(USER,s.session.id);
const enable=(s,extra={})=>s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:status(s).version,acknowledgedSameUserAccess:true,...extra});
function running(s){const row=s.app.store.get('session',s.session.id),next=s.app.store.update('session',row.id,row.version,{state:'running',generation:row.generation+1,leaseUntil:Date.now()+60000});return {type:'agent',projectId:s.project.id,sessionId:row.id,role:'coordinator',generation:next.generation,permission:s.app.sessionPermissions.capture(row.id)};}
function idle(s){const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'idle',leaseUntil:0});}
const hostTool=s=>new ToolDispatcher(s.app).definitions('coordinator',false,s.session.id).some(t=>t.name==='host_execute');

test('pending enable preserves the actor and only current ordinary queued inputs cross the activation boundary',()=>{
 const s=fixture();try{
  const actor=running(s),before=actor.permission,first=s.app.sessions.send(USER,s.session.id,{content:'existing follow-up'});
  const stale=s.app.sessions.send(USER,s.session.id,{content:'must remain stale'});s.app.store.update('message',stale.id,stale.version,{permission:{...before,epoch:before.epoch+10}});
  const automatic=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'system',origin:'automation',wakeupId:'fixture-wakeup',content:'fixed automation',mode:'prompt',status:'queued',permission:before});
  const cancelled=s.app.sessions.send(USER,s.session.id,{content:'removed queue item'});s.app.sessions.queueAction(USER,s.session.id,{messageId:cancelled.id,expectedVersion:cancelled.version,action:'cancel'});
  const pending=enable(s),next=s.app.sessions.send(USER,s.session.id,{content:'sent after request',mode:'steer'});
  assert.equal(pending.pending,true);assert.equal(pending.enabled,false);assert.equal(pending.epoch,before.hostEpoch);assert.equal(hostTool(s),false);
  assert.deepEqual(s.app.sessionPermissions.capture(s.session.id),before);assert.deepEqual(s.app.store.get('message',first.id).permission,before);
  assert.doesNotThrow(()=>s.app.sessionPermissions.guard(actor,'workspace_read',{},'current-read'));assert.equal(s.app.hostAccess.activatePending(s.session.id),false);
  idle(s);assert.equal(s.app.hostAccess.activatePending(s.session.id),true);const current=s.app.sessionPermissions.capture(s.session.id);
  assert.equal(current.mode,'fullAccess');assert.equal(current.hostEpoch,before.hostEpoch+1);assert.equal(status(s).pending,false);assert.equal(hostTool(s),true);
  for(const m of [first,next]){const actual=s.app.store.get('message',m.id);assert.equal(actual.status,'queued');assert.equal(actual.content,m.content);assert.deepEqual(actual.permission,current);}
  assert.equal(s.app.store.get('message',stale.id).permission.epoch,before.epoch+10);assert.deepEqual(s.app.store.get('message',automatic.id).permission,before);assert.deepEqual(s.app.store.get('message',cancelled.id).permission,before);
  assert.throws(()=>s.app.sessionPermissions.guard(actor,'workspace_read',{},'old-read'),{code:'SESSION_PERMISSION_STALE'});
  assert.equal(new ToolDispatcher(s.app).definitions('coordinator',true,s.session.id).some(t=>t.name==='host_execute'),false);
 }finally{s.close();}
});

test('queued-only enable binds existing input immediately and idle pending activates on the scheduler without a new message',()=>{
 const s=fixture();try{
  const queued=s.app.sessions.send(USER,s.session.id,{content:'queued before enable'}),enabled=enable(s);assert.equal(enabled.enabled,true);assert.equal(enabled.pending,false);assert.equal(s.app.store.get('message',queued.id).permission.mode,'fullAccess');
  s.app.sessions.queueAction(USER,s.session.id,{messageId:queued.id,expectedVersion:s.app.store.get('message',queued.id).version,action:'cancel'});s.app.hostAccess.revoke(USER,s.session.id,{expectedVersion:enabled.version});
  running(s);assert.equal(enable(s).pending,true);idle(s);
  const host=new AgentHost(s.app,{inspect:()=>({ready:false,code:'NO_MODEL',message:'no launch in policy test'})});host.tick();assert.equal(status(s).enabled,true);assert.equal(host.active.size,0);
 }finally{s.close();}
});

test('admission remains a boundary after a session is idle and outstanding host commands also hold activation',()=>{
 const s=fixture();try{
  const row=s.app.store.get('session',s.session.id),slot=s.app.agentAdmission.tryAcquire(row,row.generation+1,'fixture-owner');assert.ok(slot);
  const pending=enable(s);assert.equal(pending.pending,true);assert.equal(s.app.hostAccess.activatePending(s.session.id),false);
  s.app.agentAdmission.release(slot.id,'fixture-owner',slot.generation,'not-forked');
  s.app.hostAccess.active.set('fixture-live-command',{sessionId:s.session.id});assert.equal(s.app.hostAccess.activatePending(s.session.id),false);s.app.hostAccess.active.delete('fixture-live-command');
  assert.equal(s.app.hostAccess.activatePending(s.session.id),true);
 }finally{s.app.hostAccess.active.delete('fixture-live-command');s.close();}
});

test('pending cancellation keeps the current actor valid; a restricted mode change still invalidates it',()=>{
 const s=fixture();try{
  const actor=running(s);assert.throws(()=>s.app.sessionPermissions.guard(actor,'artifact_create',{title:'Original approval',content:'fixed'},'original-action'),{code:'APPROVAL_REQUIRED'});const action=s.app.store.list('session-action')[0];
  const pending=enable(s);assert.equal(s.app.store.get('session-action',action.id).state,'pending');assert.throws(()=>s.app.hostAccess.revoke(USER,s.session.id,{expectedVersion:pending.version-1}),{code:'VERSION_CONFLICT'});
  const cancelled=s.app.hostAccess.revoke(USER,s.session.id,{expectedVersion:pending.version});assert.equal(cancelled.pending,false);assert.equal(cancelled.epoch,actor.permission.hostEpoch);assert.doesNotThrow(()=>s.app.sessionPermissions.guard(actor,'workspace_read',{},'after-cancel'));
  assert.equal(s.app.store.get('session-action',action.id).state,'pending');
  assert.equal(s.app.hostAccess.activatePending(s.session.id),false);enable(s);const permission=s.app.sessionPermissions.status(USER,s.session.id);
  assert.throws(()=>s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:permission.version}),{code:'VERSION_CONFLICT'});
  s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:permission.version,expectedHostVersion:permission.hostAccess.version});assert.equal(status(s).pending,false);assert.equal(status(s).enabled,false);
  assert.throws(()=>s.app.sessionPermissions.guard(actor,'workspace_read',{},'after-mode-change'),{code:'SESSION_PERMISSION_STALE'});idle(s);assert.equal(s.app.hostAccess.activatePending(s.session.id),false);
 }finally{s.close();}
});

test('pending enable leaves unconsumed steer inputs queued for the next worker',()=>{
 const s=fixture();try{
  const actor=running(s),input=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'user',content:'current input',mode:'prompt',status:'running',permission:actor.permission});
  const steer=s.app.sessions.send(USER,s.session.id,{content:'steer before pending',mode:'steer'}),sent=[];
  const host=new AgentHost(s.app,{inspect:()=>({ready:false,code:'NO_MODEL',message:'no launch in policy test'})});host.valid=()=>true;
  host.active.set(s.session.id,{sessionId:s.session.id,generation:actor.generation,actor,lastHeartbeat:Date.now(),messageIds:[input.id],sent:new Set(),child:{send:value=>sent.push(value)}});
  enable(s);host.tick();assert.equal(s.app.store.get('message',steer.id).status,'queued');assert.equal(sent.length,0);assert.equal(status(s).pending,true);
  host.active.clear();idle(s);host.tick();assert.equal(status(s).enabled,true);assert.equal(s.app.store.get('message',steer.id).status,'queued');assert.equal(s.app.store.get('message',steer.id).permission.mode,'fullAccess');
 }finally{s.close();}
});

test('pending does not survive a controller restart and original input and command history remain',()=>{
 const s=fixture();try{
  running(s);const message=s.app.sessions.send(USER,s.session.id,{content:'keep original pending input'}),pending=enable(s);
  const receipt=s.app.store.create('host-command',s.project.id,{sessionId:s.session.id,epoch:0,runtimeId:'old-runtime',state:'succeeded',stdout:'historical receipt'});
  s.app.close();s.app=new ResearchApp(join(s.dir,'data'),process.cwd());idle(s);
  const restored=status(s);assert.equal(restored.enabled,false);assert.equal(restored.pending,false);assert.equal(restored.revokedOnRestart,true);assert.equal(restored.epoch,pending.epoch);assert.equal(s.app.hostAccess.activatePending(s.session.id),false);
  assert.equal(s.app.store.get('message',message.id).content,message.content);assert.equal(s.app.store.get('host-command',receipt.id).stdout,'historical receipt');
  assert.equal(enable(s).enabled,true);assert.equal(s.app.store.get('message',message.id).permission.mode,'fullAccess');
 }finally{s.close();}
});

test('new unknown effects and lost eligibility block deferred activation until explicitly resolved',()=>{
 const s=fixture();try{
  running(s);enable(s);idle(s);const job=s.app.store.create('host-command',s.project.id,{sessionId:s.session.id,epoch:0,runtimeId:'unconfirmed-runtime',state:'unknown',stdout:'do not replay'});
  assert.equal(s.app.hostAccess.activatePending(s.session.id),false);assert.equal(hostTool(s),false);assert.throws(()=>enable(s),{code:'HOST_EFFECTS_REVIEW_REQUIRED'});
  assert.equal(enable(s,{acknowledgedUnknownEffects:true}).enabled,true);assert.equal(s.app.store.get('host-command',job.id).state,'unknown');
  s.app.hostAccess.revoke(USER,s.session.id,{expectedVersion:status(s).version});running(s);enable(s,{acknowledgedUnknownEffects:true});idle(s);
  const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{workingGrantId:'fixed-scope'});assert.equal(s.app.hostAccess.activatePending(s.session.id),false);assert.equal(hostTool(s),false);assert.throws(()=>enable(s,{acknowledgedUnknownEffects:true}),{code:'HOST_ACCESS_UNAVAILABLE'});
 }finally{s.close();}
});

test('activation and queue permissions roll back together if a message update cannot commit',()=>{
 const s=fixture();try{
  running(s);const input=s.app.sessions.send(USER,s.session.id,{content:'atomic permission transition'}),pending=enable(s);idle(s);const update=s.app.store.update.bind(s.app.store);
  s.app.store.update=(kind,...args)=>{if(kind==='message')throw Error('injected queue write failure');return update(kind,...args);};
  assert.throws(()=>s.app.hostAccess.activatePending(s.session.id),/injected queue write failure/);s.app.store.update=update;
  assert.equal(status(s).pending,true);assert.equal(status(s).epoch,pending.epoch);assert.deepEqual(s.app.store.get('message',input.id).permission,input.permission);assert.equal(s.app.hostAccess.activatePending(s.session.id),true);
 }finally{s.close();}
});

function pendingAfterWorker(s){const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{skillBundleId:s.app.skills.configuration(s.project.id).bundleId});running(s);enable(s);idle(s);}

test('pending host-command boundary keeps a normal queue unclaimed until automatic activation',()=>{
 const s=fixture();try{
  pendingAfterWorker(s);s.app.hostAccess.active.set('finishing-host-command',{sessionId:s.session.id});
  const message=s.app.sessions.send(USER,s.session.id,{content:'wait for host-command cleanup'}),launches=[];
  const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'POLICY_FIXTURE',message:'no worker process'})});
  host.launch=(session,_prompt,messageId)=>{const reservation=host.claimSession(session,messageId);if(reservation)launches.push(reservation);};
  assert.equal(host.active.size,0);assert.equal(s.app.agentAdmission.sessionHeld(s.session.id),false);host.tick();
  assert.equal(launches.length,0,'pending host-command cleanup must hold the normal queue');assert.equal(s.app.store.get('message',message.id).status,'queued');assert.equal(status(s).pending,true);
  assert.equal(host.claimSession(s.app.store.get('session',s.session.id),message.id),null,'the transactional claim must also enforce the boundary');
  s.app.hostAccess.active.delete('finishing-host-command');host.tick();assert.equal(status(s).enabled,true);assert.equal(launches.length,1);assert.equal(launches[0].session.executionPermission.mode,'fullAccess');assert.equal(s.app.store.get('message',message.id).status,'running');
 }finally{s.app.hostAccess.active.delete('finishing-host-command');s.close();}
});

test('pending host-command boundary leaves automatic wakeup attempts and budget untouched',()=>{
 const s=fixture();try{
  const project=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,project.id,{expectedVersion:project.version,enabled:true});
  const team=s.app.teams.create(USER,s.session.id,{goal:'Completed source for scheduler regression',budget:4,autoSummarize:true,tasks:[{key:'a',role:'analyst',objective:'Inspect fixed fixture',dependencies:[]}]});
  const approval=s.app.store.get('approval',team.approvalId);s.app.approvals.decide(USER,approval.id,approval.version,true);s.app.teams.activate(USER,team.id);const task=s.app.teams.claim(team.id);
  s.app.teams.submit({type:'agent',projectId:s.project.id,role:'analyst',taskId:task.task.id,attemptId:task.attempt.id,sessionId:task.attempt.sessionId,generation:task.attempt.generation},{summary:'No scientific measurements',outcome:'completed',evidenceIds:[],artifactIds:[],claims:[],unresolvedQuestions:[]});s.app.wakeups.reconcile();
  const wakeup=s.app.wakeups.list(USER,s.project.id)[0],budget=s.app.budget.summary(team.id);assert.equal(wakeup.state,'pending');
  pendingAfterWorker(s);s.app.hostAccess.active.set('finishing-host-command',{sessionId:s.session.id});const launches=[];
  const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'POLICY_FIXTURE',message:'no worker process'})});host.launch=(...args)=>launches.push(args);
  assert.equal(host.active.size,0);assert.equal(s.app.agentAdmission.sessionHeld(s.session.id),false);host.tick();
  assert.equal(launches.length,0,'pending host-command cleanup must hold automatic dispatch');assert.equal(s.app.wakeups.get(USER,wakeup.id).state,'pending');assert.equal(s.app.wakeups.get(USER,wakeup.id).attempts,0);assert.deepEqual(s.app.budget.summary(team.id),budget);assert.equal(s.app.sessions.messages(USER,s.session.id).some(m=>m.wakeupId===wakeup.id),false);
  s.app.hostAccess.active.delete('finishing-host-command');host.tick();assert.equal(status(s).enabled,true);assert.equal(launches.length,1);const started=s.app.wakeups.get(USER,wakeup.id);assert.equal(started.state,'running');assert.equal(started.attempts,1);assert.equal(s.app.store.get('message',started.messageId).permission.mode,'confirm');assert.equal(s.app.store.get('session',s.session.id).executionPermission.mode,'confirm');
 }finally{s.app.hostAccess.active.delete('finishing-host-command');s.close();}
});

test('pending host-command boundary ignores a previous runtime request when reopening a controlled queue',()=>{
 const s=fixture();try{
  pendingAfterWorker(s);s.app.close();s.app=new ResearchApp(join(s.dir,'data'),process.cwd());
  const message=s.app.sessions.send(USER,s.session.id,{content:'reopened controlled request'}),launches=[];
  assert.equal(s.app.store.get('host-access',s.session.id).state,'pending');assert.equal(status(s).pending,false);
  const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'POLICY_FIXTURE',message:'no worker process'})});host.launch=(session,_prompt,messageId)=>{const reservation=host.claimSession(session,messageId);if(reservation)launches.push(reservation);};host.tick();
  assert.equal(launches.length,1);assert.equal(launches[0].session.executionPermission.mode,'confirm');assert.equal(s.app.store.get('message',message.id).status,'running');assert.equal(status(s).enabled,false);
 }finally{s.close();}
});
