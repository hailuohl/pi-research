import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve} from '../support/research.mjs';
import {actor,spec,startTeam} from '../support/collaboration.mjs';

const query={query:'task-bound phrase',sources:['crossref'],limit:1,strategy:'keyword',prioritize:'default'};
const item={DOI:'10.1000/task-bound',title:['Task-bound paper'],published:{'date-parts':[[2025,1,1]]}};
function prepareTask(s){
 const team=startTeam(s,[spec('literature',{role:'literature'})]);
 const task=s.app.teams.tasks(USER,team.id)[0];
 const grant=s.app.discoveryGrants.prepare(USER,s.project.id,{taskId:task.id,searches:[query],targets:[],allowSearchResults:false,formats:['provider-text'],maxRequests:1,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString()});
 return {team,task,grant};
}
function runIdentity(s,claim){
 const row=s.app.store.get('session',claim.attempt.sessionId);
 s.app.store.update('session',row.id,row.version,{state:'running',leaseUntil:Date.now()+600000});
 const attempt=s.app.store.get('task-attempt',claim.attempt.id);
 s.app.store.update('task-attempt',attempt.id,attempt.version,{leaseUntil:Date.now()+600000});
 return actor(claim);
}
function installFetch(){
 const original=globalThis.fetch;let count=0;
 globalThis.fetch=async()=>{count++;return Response.json({message:{items:[item]}});};
 return {count:()=>count,hit:()=>{count++;},restore:()=>{globalThis.fetch=original;}};
}

test('prepare operation accepts exactly one Task or coordinator identity',()=>{
 const s=setup();try{
  const team=startTeam(s,[spec('literature',{role:'literature'})]),task=s.app.teams.tasks(USER,team.id)[0];
  const base={searches:[query],targets:[],allowSearchResults:false,formats:['provider-text'],maxRequests:1,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString()};
  const taskGrant=s.app.operations.execute(USER,'discovery_grant_prepare',{...base,taskId:task.id},{projectId:s.project.id,idempotencyKey:'task-grant-prepare'});
  assert.equal(taskGrant.taskBinding.taskId,task.id);
  const coordinatorGrant=s.app.operations.execute(USER,'discovery_grant_prepare',{...base,sessionId:s.session.id},{projectId:s.project.id,idempotencyKey:'coordinator-grant-prepare'});
  assert.equal(coordinatorGrant.sessionId,s.session.id);
  assert.equal(coordinatorGrant.taskBinding,undefined);
  assert.throws(()=>s.app.operations.execute(USER,'discovery_grant_prepare',{...base,taskId:task.id,sessionId:s.session.id},{projectId:s.project.id,idempotencyKey:'invalid-grant-prepare'}),{code:'INVALID_INPUT'});
 }finally{s.close();}
});

test('task discovery grant waits for approval, then its one Crossref result and call keep task attempt identity',async()=>{
 const s=setup(),fetch=installFetch();try{
  const {team,task,grant}=prepareTask(s);
  assert.equal(s.app.store.get('task',task.id).discoveryGrantId,grant.id);
  assert.throws(()=>s.app.discoveryGrants.owner(USER,s.project.id,grant.id),{code:'DISCOVERY_TASK_GRANT_OWNER_DENIED'});
  assert.equal(s.app.teams.claim(team.id),null);
  assert.equal(s.app.store.list('task-attempt',s.project.id).length,0);
  approve(s.app,grant.approvalId);
  s.app.discoveryGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});
  assert.equal(s.app.store.list('task-attempt',s.project.id).length,0);assert.equal(s.app.store.list('model-usage',s.project.id).length,0);
  const claimed=s.app.teams.claim(team.id);assert.ok(claimed);
  assert.equal(s.app.store.get('session',claimed.attempt.sessionId).discoveryGrantId,grant.id);
  assert.deepEqual(claimed.attempt.discoveryGrant,{id:grant.id,digest:grant.digest,approvalId:grant.approvalId});
  assert.deepEqual(claimed.context.discoveryGrant,claimed.attempt.discoveryGrant);
  const who=runIdentity(s,claimed);
  await assert.rejects(s.app.connectors.discover(who,s.project.id,{...query,query:'outside task scope'},'outside'),{code:'DISCOVERY_REQUEST_DENIED'});
  await assert.rejects(s.app.connectors.paper(who,s.project.id,{source:'crossref',id:item.DOI},'paper'),{code:'DISCOVERY_TARGET_DENIED'});
  assert.throws(()=>s.app.operations.execute(who,'literature_search',{query:query.query,limit:1},{projectId:s.project.id,idempotencyKey:'legacy-search'}),{code:'DISCOVERY_TASK_OPERATION_DENIED'});
  await assert.rejects(s.app.literature.search(s.project.id,query.query,1,'legacy-direct',()=>{},who),{code:'DISCOVERY_TASK_OPERATION_DENIED'});
  assert.equal(fetch.count(),0);
  const result=await s.app.operations.execute(who,'literature_discover',query,{projectId:s.project.id,idempotencyKey:'task-search'});
  assert.equal(result.discoveryGrant.id,grant.id);
  assert.equal(result.scopeTaskId,task.id);assert.equal(result.scopeAttemptId,claimed.attempt.id);
  assert.equal(s.app.store.list('paper-read',s.project.id).length,0);
  const call=s.app.store.list('connector-call',s.project.id)[0];
  assert.equal(call.discoveryGrant.id,grant.id);assert.equal(call.scopeTaskId,task.id);assert.equal(call.scopeAttemptId,claimed.attempt.id);
  assert.equal(call.scopeSessionId,claimed.attempt.sessionId);assert.equal(call.scopeGeneration,claimed.attempt.generation);
  assert.equal(fetch.count(),1);
  const realNow=Date.now;try{Date.now=()=>Date.parse(grant.expiresAt)+1;assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,grant.id).effectiveState,'expired');assert.equal((await s.app.operations.execute(who,'literature_discover',query,{projectId:s.project.id,idempotencyKey:'task-search'})).id,result.id);await assert.rejects(s.app.operations.execute(who,'literature_discover',query,{projectId:s.project.id,idempotencyKey:'after-expiry'}),{code:'DISCOVERY_GRANT_EXPIRED'});assert.equal(fetch.count(),1);}finally{Date.now=realNow;}
 }finally{fetch.restore();s.close();}
});

test('task discovery grant cannot be omitted from the real Task, Session, or TaskAttempt binding',async()=>{
 const s=setup(),fetch=installFetch();try{
  const {team,task,grant}=prepareTask(s);approve(s.app,grant.approvalId);s.app.discoveryGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});
  const claimed=s.app.teams.claim(team.id);assert.ok(claimed);const who=runIdentity(s,claimed);
  const row=s.app.store.get('task',task.id);s.app.store.update('task',row.id,row.version,{discoveryGrantId:undefined});
  assert.throws(()=>s.app.operations.execute(who,'literature_discover',query,{projectId:s.project.id,idempotencyKey:'omitted'}),{code:'DISCOVERY_TASK_BINDING_REQUIRED'});
  const session=s.app.store.get('session',claimed.attempt.sessionId);s.app.store.update('session',session.id,session.version,{discoveryGrantId:undefined});
  const attempt=s.app.store.get('task-attempt',claimed.attempt.id);s.app.store.update('task-attempt',attempt.id,attempt.version,{discoveryGrant:undefined});
  await assert.rejects(Promise.resolve().then(()=>s.app.operations.execute(who,'literature_discover',query,{projectId:s.project.id,idempotencyKey:'all-markers-omitted'})),{code:'DISCOVERY_TASK_BINDING_REQUIRED'});
  assert.equal(fetch.count(),0);assert.equal(s.app.store.list('connector-call',s.project.id).length,0);
 }finally{fetch.restore();s.close();}
});

test('task discovery grant cannot widen its Crossref-only scope at preparation',()=>{
 const s=setup();try{
  const team=startTeam(s,[spec('literature',{role:'literature'})]),task=s.app.teams.tasks(USER,team.id)[0],base={taskId:task.id,searches:[query],targets:[],allowSearchResults:false,formats:['provider-text'],maxRequests:1,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString()};
  for(const change of [
   {searches:[{...query,strategy:'embedding'}]},
   {searches:[{...query,sources:['crossref','pubmed']}]},
   {targets:[{source:'crossref',id:item.DOI,format:'provider-text'}]},
   {allowSearchResults:true},
   {formats:['original-pdf']},
   {maxRequests:2},
  ])assert.throws(()=>s.app.discoveryGrants.prepare(USER,s.project.id,{...base,...change}));
  assert.equal(s.app.store.get('task',task.id).discoveryGrantId,undefined);
  assert.equal(s.app.store.list('discovery-grant',s.project.id).length,0);
 }finally{s.close();}
});

test('failed HTTP attempt remains charged when the same task is explicitly retried',async()=>{
 const s=setup(),fetch=installFetch();let fail=true;try{
  globalThis.fetch=async()=>{fetch.hit();return fail?new Response('unavailable',{status:503}):Response.json({message:{items:[item]}});};
  const {team,grant}=prepareTask(s);approve(s.app,grant.approvalId);s.app.discoveryGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});
  const first=s.app.teams.claim(team.id);assert.ok(first);const who=runIdentity(s,first);
  await assert.rejects(s.app.operations.execute(who,'literature_discover',query,{projectId:s.project.id,idempotencyKey:'first-attempt'}),{code:'CONNECTOR_ALL_FAILED'});
  assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,grant.id).usage.used,1);
  s.app.teams.fail(first.attempt.id,'fixture failure');
  const task=s.app.teams.tasks(USER,team.id)[0];s.app.teams.retry(USER,task.id);const second=s.app.teams.claim(team.id);assert.ok(second);assert.equal(second.task.discoveryGrantId,grant.id);assert.deepEqual(second.attempt.discoveryGrant,first.attempt.discoveryGrant);
  const retryActor=runIdentity(s,second);fail=false;
  await assert.rejects(s.app.operations.execute(retryActor,'literature_discover',query,{projectId:s.project.id,idempotencyKey:'second-attempt'}),{code:'CONNECTOR_ALL_FAILED'});
  assert.equal(fetch.count(),1);const inspected=s.app.discoveryGrants.inspect(USER,s.project.id,grant.id);assert.equal(inspected.usage.used,1);assert.equal(inspected.calls[0].status,'failed-or-unknown');
 }finally{fetch.restore();s.close();}
});

test('original Team approval and TaskSpec changes stop a bound task before HTTP',async()=>{
 for(const change of ['approval','task-spec']){const s=setup(),fetch=installFetch();try{
  const {team,task,grant}=prepareTask(s);approve(s.app,grant.approvalId);s.app.discoveryGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});const claim=s.app.teams.claim(team.id);assert.ok(claim);const who=runIdentity(s,claim);
  if(change==='approval')s.app.approvals.stale(team.id);else{const row=s.app.store.get('task',task.id);s.app.store.update('task',row.id,row.version,{objective:'changed after grant'});}
  assert.throws(()=>s.app.operations.execute(who,'literature_discover',query,{projectId:s.project.id,idempotencyKey:'stale'}));
  assert.equal(fetch.count(),0);assert.equal(s.app.store.list('connector-call',s.project.id).length,0);
 }finally{fetch.restore();s.close();}}
});
