import test from 'node:test';
import assert from 'node:assert/strict';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {setup,USER,approve} from '../support/research.mjs';
import {actor,spec,result} from '../support/collaboration.mjs';

function taskGrant(s){
 const project=s.app.projects.get(USER,s.project.id);if(!project.settings.enabled)s.app.projects.settings(USER,project.id,{expectedVersion:project.version,enabled:true});
 const team=s.app.teams.create(USER,s.session.id,{goal:'Fixed analyst Run submission',tasks:[spec('analyst')],budget:4}),task=s.app.teams.tasks(USER,team.id)[0],intents=[];
 for(let degree of [2,3]){const e=s.app.experiments.create(USER,s.project.id,{title:`Fixed ${degree}`,parentId:s.baseline.id,config:{polynomialDegree:degree,ridge:0.000001}});intents.push(s.app.runs.prepare(USER,e.id));}
 const grant=s.app.operations.execute(USER,'run_grant_prepare',{taskId:task.id,intentIds:intents.map(i=>i.id),maxRuns:1,expiresAt:new Date(Date.now()+60000).toISOString()},{projectId:s.project.id,idempotencyKey:`task-grant-${task.id}`});return {team,task,intents,grant};
}
function activate(s,grant){approve(s.app,grant.approvalId);return s.app.runGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});}
function worker(s,claim){const session=s.app.store.get('session',claim.attempt.sessionId);s.app.store.update('session',session.id,session.version,{state:'running',generation:session.generation+1,leaseUntil:Date.now()+60000});const attempt=s.app.store.get('task-attempt',claim.attempt.id);s.app.store.update('task-attempt',attempt.id,attempt.version,{leaseUntil:Date.now()+60000});return actor(claim);}
function call(s,who,name,input,key){return s.app.operations.execute(who,name,input,{projectId:s.project.id,idempotencyKey:key});}

test('Task RunGrant waits for both approvals, binds one analyst attempt, and permits only its frozen submissions',()=>{
 const s=setup();try{
  const {team,task,intents,grant}=taskGrant(s);assert.equal(grant.sessionId,s.session.id);assert.equal(grant.taskBinding.taskId,task.id);assert.equal(s.app.store.get('task',task.id).runGrantId,grant.id);
  assert.equal(s.app.teams.claim(team.id),null);assert.equal(s.app.store.list('task-attempt',s.project.id).length,0);assert.equal(s.app.store.list('run',s.project.id).length,0);
  activate(s,grant);assert.equal(s.app.store.list('model-usage',s.project.id).length,0);assert.equal(s.app.teams.claim(team.id),null);
  approve(s.app,team.approvalId);s.app.teams.activate(USER,team.id);const claim=s.app.teams.claim(team.id);assert.ok(claim);
  const who=worker(s,claim),ref={id:grant.id,digest:grant.digest,approvalId:grant.approvalId},context=call(s,who,'task_context_read',{},'task-context');
  assert.deepEqual(context.runGrant,ref);assert.deepEqual(context.runIntentIds,intents.map(i=>i.id));assert.deepEqual(claim.attempt.runGrant,ref);assert.deepEqual(s.app.store.get('session',claim.attempt.sessionId).runGrantId,grant.id);
  const unlisted=s.app.runs.prepare(USER,s.baseline.id);assert.throws(()=>s.app.runs.submit(who,unlisted.id),{code:'RUN_GRANT_SCOPE_DENIED'});assert.throws(()=>s.app.runs.submit(USER,intents[0].id),{code:'RUN_GRANT_SCOPE_DENIED'});
  assert.throws(()=>call(s,who,'run_prepare',{experimentId:s.baseline.id},'forbidden-prepare'),{code:'TOOL_DENIED'});
  const run=call(s,who,'run_submit',{intentId:intents[0].id},'fixed-submit');assert.equal(run.runGrant.id,grant.id);assert.equal(s.app.runs.submit(who,intents[0].id).id,run.id);
  const use=s.app.store.list('run-grant-use',s.project.id)[0];assert.deepEqual({taskId:use.taskId,teamId:use.teamId,sessionId:use.sessionId,attemptId:use.attemptId,generation:use.generation},{taskId:task.id,teamId:team.id,sessionId:claim.attempt.sessionId,attemptId:claim.attempt.id,generation:claim.attempt.generation});
  assert.equal(s.app.teams.resources(who).runIds.has(run.id),true);assert.equal(call(s,who,'run_inspect',{runId:run.id},'task-run-inspect').id,run.id);assert.equal(call(s,who,'run_logs',{runId:run.id},'task-run-logs').content,'');
  assert.throws(()=>s.app.runs.submit({...who,generation:who.generation+1},intents[1].id),{code:'LEASE_EXPIRED'});
  const attempt=s.app.store.get('task-attempt',claim.attempt.id);s.app.store.update('task-attempt',attempt.id,attempt.version,{runGrant:undefined});assert.throws(()=>s.app.runs.submit(who,intents[1].id),{code:'RUN_GRANT_SCOPE_CHANGED'});
  const restored=s.app.store.get('task-attempt',claim.attempt.id);s.app.store.update('task-attempt',restored.id,restored.version,{runGrant:ref});
  assert.throws(()=>s.app.runs.submit(who,intents[1].id),{code:'RUN_GRANT_EXHAUSTED'});assert.equal(s.app.store.list('run').length,1);assert.equal(s.app.store.list('run-grant-use',s.project.id).length,1);
  s.app.teams.submit(who,result());assert.throws(()=>call(s,who,'run_submit',{intentId:intents[0].id},'fixed-submit'),{code:'LEASE_EXPIRED'});
  assert.doesNotThrow(()=>s.app.runs.assertLaunchable(s.app.runs.get(USER,run.id)),'queued Run must not inherit the ended Task lease or Team state');
  assert.equal(call(s,USER,'run_submit',{intentId:intents[0].id},'owner-replay').id,run.id);assert.equal(s.app.runs.cancel(USER,run.id).state,'cancelled');assert.equal(s.app.runGrants.inspect(USER,s.project.id,grant.id).usage.used,1);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.equal(s.app.store.get('task',task.id).runGrantId,grant.id);assert.deepEqual(s.app.store.get('task-attempt',claim.attempt.id).runGrant,ref);assert.equal(s.app.store.get('run-grant-use',use.id).generation,claim.attempt.generation);assert.equal(s.app.runs.submit(USER,intents[0].id).id,run.id);assert.equal(s.app.runGrants.inspect(USER,s.project.id,grant.id).usage.used,1);
 }finally{s.close();}
});

test('Task RunGrant rejects changed role, model, markers and Team approval before creating a Run',()=>{
 for(const mutation of ['role','model','task-marker','session-marker','team-approval']){const s=setup();try{
  const {team,task,intents,grant}=taskGrant(s);activate(s,grant);approve(s.app,team.approvalId);s.app.teams.activate(USER,team.id);const claim=s.app.teams.claim(team.id),who=worker(s,claim),unused=intents[1];
  if(mutation==='role')assert.throws(()=>s.app.runs.submit({...who,role:'writer'},unused.id),{code:'TOOL_DENIED'});
  if(mutation==='model'){const session=s.app.store.get('session',who.sessionId);s.app.store.update('session',session.id,session.version,{model:{...session.model,model:'changed'}});assert.throws(()=>s.app.runs.submit(who,unused.id),{code:'RUN_GRANT_SCOPE_CHANGED'});}
  if(mutation==='task-marker'){const current=s.app.store.get('task',task.id);s.app.store.update('task',current.id,current.version,{runGrantId:undefined});assert.throws(()=>s.app.runs.submit(who,unused.id),{code:'RUN_GRANT_TASK_BINDING_REQUIRED'});}
  if(mutation==='session-marker'){const session=s.app.store.get('session',who.sessionId);s.app.store.update('session',session.id,session.version,{runGrantId:undefined});assert.throws(()=>s.app.runs.submit(who,unused.id),{code:'RUN_GRANT_SCOPE_CHANGED'});}
  if(mutation==='team-approval'){const approval=s.app.store.get('approval',team.approvalId);s.app.store.update('approval',approval.id,approval.version,{status:'stale'});assert.throws(()=>s.app.runs.submit(who,unused.id),{code:'RUN_GRANT_TEAM_APPROVAL_STALE'});}
  assert.equal(s.app.store.list('run',s.project.id).length,0);assert.equal(s.app.store.list('run-grant-use',s.project.id).length,0);
 }finally{s.close();}}
});

test('analyst cannot bypass Task identity through the RunService direct entry',()=>{
 const s=setup();try{
  const ordinary=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,ordinary.approvalId);
  assert.throws(()=>s.app.runs.submit({type:'agent',role:'analyst',projectId:s.project.id},ordinary.id),{code:'RUN_GRANT_SCOPE_DENIED'});
  const {team,grant}=taskGrant(s);activate(s,grant);approve(s.app,team.approvalId);s.app.teams.activate(USER,team.id);
  const claim=s.app.teams.claim(team.id),who=worker(s,claim);
  assert.throws(()=>s.app.runs.submit({...who,taskId:undefined},ordinary.id),{code:'RUN_GRANT_SCOPE_DENIED'});
  assert.equal(s.app.store.list('run',s.project.id).length,0);
  assert.equal(s.app.store.list('run-grant-use',s.project.id).length,0);
 }finally{s.close();}
});
