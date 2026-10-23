import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve} from '../support/research.mjs';
import {spec} from '../support/collaboration.mjs';
import {validateGraph} from '../../dist/packages/collaboration/graph.js';
import {configured} from '../support/thinking.mjs';
import {prepareTaskModels,assertTaskModelCurrentSync,assertSessionTaskModelCurrent} from '../../dist/packages/pi-adapter/thinking-policy.js';
import {resolveTaskModel} from '../../dist/packages/collaboration/task-model.js';
import {buildDiscoveryTaskBinding,assertTaskDiscoveryBinding,discoveryTeamPlanDigest} from '../../dist/packages/policy/discovery-grant-validation.js';
import {buildRunGrantTaskBinding,assertRunGrantTaskBinding} from '../../dist/packages/policy/run-grant-validation.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {digest} from '../../dist/packages/storage/store.js';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';

function enabled(s){const p=s.app.projects.get(USER,s.project.id);if(!p.settings.enabled)s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});}
async function team(s,tasks,key=crypto.randomUUID()) {enabled(s);return await s.app.operations.execute(USER,'collaboration_plan_submit',{goal:'Frozen thinking fixture',tasks,budget:12},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:key});}

test('graph retains explicit arbitrary thinking IDs and reasons instead of silently inheriting',()=>{
 const task=validateGraph([spec('lookup',{thinking:'custom-precision',thinkingReason:'Bounded lookup'})])[0];
 assert.equal(task.thinking,'custom-precision');assert.equal(task.thinkingReason,'Bounded lookup');
 assert.throws(()=>validateGraph([spec('lookup',{thinking:'',thinkingReason:'invalid'})]),{code:'INVALID_INPUT'});
});

test('sync team creation refuses an explicit selection without host preparation',()=>{
 const s=setup();try{const p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});
  assert.throws(()=>s.app.teams.create(USER,s.session.id,{goal:'host must prepare',tasks:[spec('lookup',{thinking:'custom'})]}),{code:'TASK_MODEL_PREPARATION_REQUIRED'});
 }finally{s.close();}
});

test('host freezes arbitrary choices for claim and both TaskGrants, preserves root and reopen history',async()=>{
 const s=setup();try{const f=await configured(s);await f.save();const root=s.app.store.get('session',s.session.id),tasks=[spec('lookup',{role:'literature',thinking:'quick',thinkingReason:'Bounded metadata query'}),spec('analysis',{thinking:'careful'}),spec('review',{role:'reviewer'})];
  const t=await team(s,tasks,'chosen-team');assert.equal((await team(s,tasks,'chosen-team')).id,t.id);assert.equal(s.app.store.list('team').length,1);
  const plan=s.app.store.list('team-plan',s.project.id)[0],rows=s.app.teams.tasks(USER,t.id),before=digest(plan);
  assert.equal(plan.taskModels.lookup.model.thinking,'quick');assert.equal(plan.taskModels.analysis.model.thinking,'careful');assert.equal(plan.taskModels.review.model.thinking,'careful');assert.deepEqual(s.app.store.get('session',s.session.id).model,root.model);
  const literature=rows.find(t=>t.role==='literature'),analyst=rows.find(t=>t.role==='analyst');
  assert.deepEqual(buildDiscoveryTaskBinding(s.app.store,s.project.id,literature).model,{...f.model,thinking:'quick'});
  assert.deepEqual(buildRunGrantTaskBinding(s.app.store,s.project.id,analyst).model,f.model);
  const grant=s.app.discoveryGrants.prepare(USER,s.project.id,{taskId:literature.id,searches:[],targets:[{source:'crossref',id:'10.1000/thinking',format:'provider-text'}],allowSearchResults:false,formats:['provider-text'],maxRequests:1,maxResponseBytes:16384,expiresAt:new Date(Date.now()+600000).toISOString()});
  assert.doesNotThrow(()=>assertTaskDiscoveryBinding(s.app.store,s.project.id,grant));approve(s.app,grant.approvalId);s.app.discoveryGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});
  const intent=s.app.runs.prepare(USER,s.baseline.id),runGrant=s.app.runGrants.prepare(USER,s.project.id,{taskId:analyst.id,intentIds:[intent.id],maxRuns:1,expiresAt:new Date(Date.now()+600000).toISOString()});assert.doesNotThrow(()=>assertRunGrantTaskBinding(s.app.store,s.project.id,runGrant));
  approve(s.app,t.approvalId);s.app.teams.activate(USER,t.id);const claim=s.app.teams.claim(t.id);assert.equal(claim.task.id,literature.id);assert.equal(s.app.store.get('session',claim.attempt.sessionId).model.thinking,'quick');
  await assertSessionTaskModelCurrent(s.app.context,s.app.store.get('session',claim.attempt.sessionId));
  s.app.teams.fail(claim.attempt.id,'Retry fixture with frozen choice',false);const firstAttempt=s.app.store.get('task-attempt',claim.attempt.id);s.app.teams.retry(USER,claim.task.id);const retried=s.app.teams.claim(t.id);assert.notEqual(retried.attempt.sessionId,claim.attempt.sessionId);assert.equal(s.app.store.get('session',retried.attempt.sessionId).model.thinking,'quick');assert.deepEqual(s.app.store.get('task-attempt',claim.attempt.id),firstAttempt);
  assert.equal(digest(s.app.store.list('team-plan',s.project.id)[0]),before);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.deepEqual(s.app.store.list('team-plan',s.project.id)[0].taskModels,plan.taskModels);assert.deepEqual(s.app.store.get('session',s.session.id).model,root.model);
 }finally{s.close();}
});

test('no policy or unresolvable capabilities inherit, while explicit unknown choices fail closed',async()=>{
 const s=setup();try{const tasks=validateGraph([spec('plain')]);assert.equal(await prepareTaskModels(s.app.context,s.session,tasks),undefined);const old=await team(s,tasks);const plan=s.app.store.list('team-plan')[0];assert.equal(plan.taskModels,undefined);assert.deepEqual(resolveTaskModel(plan,tasks[0]),s.session.model);
  const oldDigest=digest({id:plan.id,...(plan.sourceRevisionId?{sourceRevisionId:plan.sourceRevisionId}:{}),teamId:plan.teamId,planVersion:plan.planVersion,directiveVersion:plan.directiveVersion,tasks:plan.tasks,goal:plan.goal,digest:plan.digest,model:plan.model});assert.equal(discoveryTeamPlanDigest(plan),oldDigest);
  const f=await configured(s);await assert.rejects(()=>team(s,[spec('unallowed',{thinking:'quick'})]),{code:'TASK_THINKING_NOT_ALLOWED'});await f.save();await assert.rejects(()=>team(s,[spec('unknown',{thinking:'off'})]),{code:'TASK_THINKING_NOT_ALLOWED'});
  assert.throws(()=>s.app.teams.create(USER,s.session.id,{goal:'reject client snapshot',tasks,taskModels:{}}),{code:'INVALID_INPUT'});
 }finally{s.close();}
});

test('semantic changes invalidate preparation and new HTTP; labels, other tiers and purpose edits do not change approved execution',async()=>{
 const s=setup();try{const f=await configured(s);await f.save();const t=await team(s,[spec('chosen',{thinking:'quick'})]),plan=s.app.store.list('team-plan')[0],frozen=plan.taskModels.chosen;
  await f.edit('model.upsert',{provider:f.model.provider,model:f.model.model,value:{...f.definition,name:'Display only',reasoning:{...f.definition.reasoning,levels:f.definition.reasoning.levels.map(l=>({...l,label:'New label',...(l.id==='careful'?{parameters:{reasoning_effort:'other-tier'}}:{})}))}}});assert.doesNotThrow(()=>assertTaskModelCurrentSync(s.app.context,frozen));
  await f.save({...f.policy,candidates:f.policy.candidates.map(v=>({...v,purpose:'Reworded purpose'}))},1);assert.doesNotThrow(()=>assertTaskModelCurrentSync(s.app.context,frozen));
  approve(s.app,t.approvalId);s.app.teams.activate(USER,t.id);const claim=s.app.teams.claim(t.id),row=s.app.store.get('session',claim.attempt.sessionId),current=s.app.store.update('session',row.id,row.version,{state:'running',leaseUntil:Date.now()+600000}),slot=s.app.agentAdmission.tryAcquire(current,current.generation,'thinking-host');assert.ok(slot);s.app.agentAdmission.markRunning(slot.id,'thinking-host',current.generation,process.pid);const admission=s.app.store.get('agent-admission',slot.id);s.app.store.update('agent-admission',admission.id,admission.version,{httpManagedVersion:1});
  const identity={admissionId:slot.id,sessionId:row.id,generation:current.generation,ownerHost:'thinking-host'};assert.equal(s.app.modelHttp.acquire(identity,'first').allowed,true);s.app.modelHttp.finish(identity,'first',{state:'succeeded',httpStatus:200});
  await f.edit('model.upsert',{provider:f.model.provider,model:f.model.model,value:{...f.definition,reasoning:{...f.definition.reasoning,levels:f.definition.reasoning.levels.map(l=>l.id==='quick'?{...l,parameters:{reasoning_effort:'changed'}}:l)}}});
  assert.throws(()=>s.app.modelHttp.acquire(identity,'second'),{code:'TASK_MODEL_STALE'});assert.equal(s.app.store.list('model-http-request').length,1);await assert.rejects(()=>assertSessionTaskModelCurrent(s.app.context,s.app.store.get('session',row.id)),{code:'TASK_MODEL_STALE'});
 }finally{s.close();}
});

test('ordinary tasks reject changed specs and self-consistent frozen maps without a TaskGrant',async()=>{
 const s=setup();try{const f=await configured(s);await f.save();const t=await team(s,[spec('plain',{thinking:'quick'})]),plan=s.app.store.list('team-plan')[0],task=s.app.teams.tasks(USER,t.id)[0];
  assert.throws(()=>resolveTaskModel(plan,{...task,objective:'Changed after approval'}),{code:'TASK_MODEL_STALE'});
  assert.throws(()=>resolveTaskModel({...plan,taskModels:undefined},task),{code:'TASK_MODEL_STALE'});
  const alternate={...plan.taskModels.plain,model:{...f.model,thinking:'careful'}};alternate.execution={...alternate.execution,selection:alternate.model};alternate.digest=digest(alternate.execution);
  const modified={...plan,tasks:plan.tasks.map(v=>({...v,thinking:'careful'})),taskModels:{plain:alternate}};
  assert.throws(()=>resolveTaskModel(modified,{...task,thinking:'careful'}),{code:'TASK_MODEL_STALE'});
 }finally{s.close();}
});

test('an unrelated catalog provider does not invalidate a managed frozen task',async()=>{
 const s=setup();try{const f=await configured(s);await f.save();await team(s,[spec('plain',{thinking:'quick'})]);const frozen=s.app.store.list('team-plan')[0].taskModels.plain;
  writeFileSync(join(s.dir,'models.json'),JSON.stringify({providers:{unrelated:{name:'Unrelated display entry'}}}));assert.doesNotThrow(()=>assertTaskModelCurrentSync(s.app.context,frozen));
 }finally{s.close();}
});

test('a malformed catalog fails with a safe fixed model diagnostic',async()=>{
 const s=setup();try{const f=await configured(s);await f.save();await team(s,[spec('plain',{thinking:'quick'})]);const frozen=s.app.store.list('team-plan')[0].taskModels.plain;
  writeFileSync(join(s.dir,'models.json'),'{"providers": !PRIVATE_fixture');assert.throws(()=>assertTaskModelCurrentSync(s.app.context,frozen),error=>error.code==='TASK_MODEL_STALE'&&!String(error).includes('PRIVATE_fixture'));
 }finally{s.close();}
});

test('host freezes requested and actual SDK adaptations while keeping explicit wire overrides',async()=>{
 const s=setup();try{const f=await configured(s);await f.edit('model.upsert',{provider:f.model.provider,model:f.model.model,value:{...f.definition,reasoning:{...f.definition.reasoning,levels:f.definition.reasoning.levels.map(l=>l.id==='quick'?{...l,piLevel:'max'}:l)}}});await f.save();
  const catalog={providers:{[f.model.provider]:{api:'openai-completions',baseUrl:'https://fixture.invalid/v1',models:[{id:f.model.model,reasoning:true,thinkingLevelMap:{max:null,xhigh:null}}]}}};writeFileSync(join(s.dir,'models.json'),JSON.stringify(catalog));
  const t=await team(s,[spec('adapted',{thinking:'quick'})]),frozen=s.app.store.list('team-plan')[0].taskModels.adapted;assert.equal(frozen.model.thinking,'quick');assert.equal(frozen.execution.requestedPiThinking,'max');assert.equal(frozen.execution.piThinking,'high');assert.equal(frozen.execution.parameters.reasoning_effort,'none');assert.doesNotThrow(()=>assertTaskModelCurrentSync(s.app.context,frozen));
  approve(s.app,t.approvalId);s.app.teams.activate(USER,t.id);const claim=s.app.teams.claim(t.id);catalog.providers[f.model.provider].models[0].thinkingLevelMap.xhigh='new-sdk-adaptation';writeFileSync(join(s.dir,'models.json'),JSON.stringify(catalog));await assert.rejects(()=>assertSessionTaskModelCurrent(s.app.context,s.app.store.get('session',claim.attempt.sessionId)),{code:'TASK_MODEL_STALE'});
 }finally{s.close();}
});

test('existing legal prototype-like task keys retain their frozen selection',async()=>{
 const s=setup();try{const f=await configured(s);await f.save();const t=await team(s,[spec('__proto__',{thinking:'quick'})]),plan=s.app.store.list('team-plan')[0];assert.equal(Object.hasOwn(plan.taskModels,'__proto__'),true);approve(s.app,t.approvalId);s.app.teams.activate(USER,t.id);assert.equal(s.app.teams.claim(t.id).task.thinking,'quick');
 }finally{s.close();}
});

for(const operation of ['collaboration_plan_submit','agent_delegate'])test(`${operation} commits one thinking team and receipt across independent same-key callers`,async()=>{
 const s=setup();let second;try{const f=await configured(s);await f.save();enabled(s);second=new ResearchApp(s.dir,process.cwd());
  const input={goal:'Same operation concurrency check',tasks:[{key:'one',role:'analyst',objective:'Bounded task',thinking:'quick'}],budget:2},options={projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'same-thinking-team'};
  const calls=await Promise.allSettled([s.app.operations.execute(USER,operation,input,options),second.operations.execute(USER,operation,input,options)]);assert.ok(calls.every(c=>c.status==='fulfilled'),JSON.stringify(calls));assert.equal(calls[0].value.id,calls[1].value.id);
  for(const kind of ['team','team-plan','task','budget'])assert.equal(s.app.store.list(kind,s.project.id).length,1,kind);assert.equal(s.app.store.list('approval',s.project.id).filter(a=>a.subjectKind==='team').length,1,'team approval');assert.equal(s.app.store.list('operation-pending',s.project.id).length,0);
 }finally{second?.close();s.close();}
});

test('a failed thinking-team receipt rolls back the team and approval before same-key retry',async()=>{
 const s=setup();try{const f=await configured(s);await f.save();enabled(s);s.app.store.db.exec("CREATE TEMP TRIGGER thinking_receipt_failure BEFORE INSERT ON operations WHEN NEW.scope LIKE 'operation:user:%' BEGIN SELECT RAISE(ABORT,'thinking receipt fixture failure'); END");
  const input={goal:'Atomic creation and receipt',tasks:[spec('one',{thinking:'quick'})],budget:2},options={projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'retry-thinking-receipt'};
  await assert.rejects(()=>s.app.operations.execute(USER,'collaboration_plan_submit',input,options),/thinking receipt fixture failure/);
  for(const kind of ['team','team-plan','task','budget'])assert.equal(s.app.store.list(kind,s.project.id).length,0,kind);assert.equal(s.app.store.list('approval',s.project.id).filter(a=>a.subjectKind==='team').length,0,'team approval');
  s.app.store.db.exec('DROP TRIGGER thinking_receipt_failure');const team=await s.app.operations.execute(USER,'collaboration_plan_submit',input,options);assert.ok(team.id);for(const kind of ['team','team-plan','task','budget'])assert.equal(s.app.store.list(kind,s.project.id).length,1,kind);
 }finally{s.close();}
});

for(const sameRequest of [false,true])test(`thinking preparation preserves a ${sameRequest?'matching unknown':'different in-flight'} durable key reservation`,async()=>{
 const s=setup();try{const f=await configured(s);await f.save();enabled(s);const input={goal:'Reserved durable key',tasks:[spec('one',{thinking:'quick'})],budget:2},key='reserved-thinking-team',scope=`operation:user:${s.project.id}:${s.session.id}`,request={name:'collaboration_plan_submit',input},pendingId=digest({scope,key});
  s.app.store.create('operation-pending',s.project.id,{hash:digest(sameRequest?request:{name:'paper_read',input:{id:'prior-external-read'}}),operation:sameRequest?'collaboration_plan_submit':'paper_read'},pendingId);
  await assert.rejects(()=>s.app.operations.execute(USER,'collaboration_plan_submit',input,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:key}),{code:sameRequest?'OPERATION_IN_PROGRESS':'IDEMPOTENCY_CONFLICT'});assert.equal(s.app.store.list('team',s.project.id).length,0);assert.equal(s.app.store.list('operation-pending',s.project.id).length,1);
 }finally{s.close();}
});
