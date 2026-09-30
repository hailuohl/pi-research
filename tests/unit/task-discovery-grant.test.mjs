import test from 'node:test';
import assert from 'node:assert/strict';
import {ResearchApp} from '../../dist/packages/research-app.js';
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
function installFetch(respond=()=>Response.json({message:{items:[item]}})){
 const original=globalThis.fetch;let count=0;const urls=[];
 globalThis.fetch=async(url,...args)=>{count++;urls.push(String(url));return respond(url,...args);};
 return {count:()=>count,urls,hit:()=>{count++;},restore:()=>{globalThis.fetch=original;}};
}
function prepareDoiTask(s,{team,task,target={source:'crossref',id:'https://doi.org/10.1000/TASK-BOUND',format:'provider-text'}}={}){
 team??=startTeam(s,[spec('doi-read',{role:'literature'})]);task??=s.app.teams.tasks(USER,team.id)[0];
 const grant=s.app.operations.execute(USER,'discovery_grant_prepare',{taskId:task.id,searches:[],targets:[target],allowSearchResults:false,formats:['provider-text'],maxRequests:1,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString()},{projectId:s.project.id,idempotencyKey:`prepare-doi-${task.id}`});
 return {team,task,grant};
}
function activateTaskGrant(s,grant){approve(s.app,grant.approvalId);return s.app.discoveryGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});}
function taskCall(s,who,name,input,key){return s.app.operations.execute(who,name,input,{projectId:s.project.id,idempotencyKey:key});}
function doiRead(s,who,key,id='10.1000/task-bound',source='crossref'){return taskCall(s,who,'paper_read',{id,source},key);}
function metadataResponse(DOI='10.1000/task-bound'){
 return new Response(JSON.stringify({message:{DOI,title:['Task-bound DOI paper'],published:{'date-parts':[[2025,1,1]]}}}),{headers:{'content-type':'application/json'}});
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

test('task search-only Grant rejects a mixed DOI target at preparation',()=>{
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

test('formal prepare accepts one normalized Crossref DOI and rejects mixed or multiple Task targets',()=>{
 const s=setup();try{
  const team=startTeam(s,[spec('valid',{role:'literature'}),spec('mixed',{role:'literature'}),spec('multiple',{role:'literature'})]),[valid,mixed,multiple]=s.app.teams.tasks(USER,team.id),base={searches:[],targets:[{source:'crossref',id:'https://doi.org/10.1000/TASK-BOUND',format:'provider-text'}],allowSearchResults:false,formats:['provider-text'],maxRequests:1,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString()};
  const grant=s.app.operations.execute(USER,'discovery_grant_prepare',{...base,taskId:valid.id},{projectId:s.project.id,idempotencyKey:'prepare-valid-doi'});
  assert.equal(grant.searches.length,0);assert.deepEqual(grant.targets,[{source:'crossref',id:'10.1000/task-bound',format:'provider-text'}]);
  assert.throws(()=>s.app.operations.execute(USER,'discovery_grant_prepare',{...base,taskId:mixed.id,searches:[query]},{projectId:s.project.id,idempotencyKey:'prepare-mixed-doi'}),{code:'DISCOVERY_TASK_SCOPE_INVALID'});
  assert.throws(()=>s.app.operations.execute(USER,'discovery_grant_prepare',{...base,taskId:multiple.id,targets:[...base.targets,{source:'crossref',id:'10.1000/other',format:'provider-text'}]},{projectId:s.project.id,idempotencyKey:'prepare-multiple-doi'}),{code:'DISCOVERY_TASK_SCOPE_INVALID'});
  assert.equal(s.app.store.get('task',mixed.id).discoveryGrantId,undefined);assert.equal(s.app.store.get('task',multiple.id).discoveryGrantId,undefined);assert.equal(s.app.store.list('discovery-grant',s.project.id).length,1);
 }finally{s.close();}
});

test('approved Task paper_read sends one exact Crossref request and preserves artifacts, result, and provenance across replay and reopen',async()=>{
 const s=setup(),fetch=installFetch(()=>metadataResponse());try{
  const {team,task,grant}=prepareDoiTask(s);assert.equal(s.app.teams.claim(team.id),null);assert.equal(s.app.store.list('model-usage',s.project.id).length,0);
  activateTaskGrant(s,grant);const claim=s.app.teams.claim(team.id);assert.ok(claim);const who=runIdentity(s,claim),paper=await doiRead(s,who,'task-doi-read');
  assert.equal(paper.idInSource,'10.1000/task-bound');assert.equal(paper.requestedId,'10.1000/task-bound');assert.equal(paper.contentKind,'metadata');assert.equal(paper.fullTextRead,false);
  assert.equal(fetch.count(),1);assert.equal(new URL(fetch.urls[0]).origin,'https://api.crossref.org');assert.equal(new URL(fetch.urls[0]).pathname,'/works/10.1000%2Ftask-bound');
  const call=s.app.store.list('connector-call',s.project.id)[0];assert.equal(call.discoveryGrant.id,grant.id);assert.equal(call.scopeTaskId,task.id);assert.equal(call.scopeAttemptId,claim.attempt.id);assert.equal(call.scopeSessionId,claim.attempt.sessionId);
  assert.equal(paper.discoveryGrant.id,grant.id);assert.deepEqual(paper.discoveryCallIds,[call.id]);assert.equal(paper.scopeTaskId,task.id);assert.equal(paper.scopeAttemptId,claim.attempt.id);
  const metadata=s.app.evidence.read(USER,paper.artifactId).bytes,raw=s.app.evidence.read(USER,paper.rawArtifactIds[0]).bytes;assert.match(metadata.toString(),/Task-bound DOI paper/);assert.equal(JSON.parse(raw.toString()).message.DOI,'10.1000/task-bound');
  assert.equal((await doiRead(s,who,'task-doi-read')).id,paper.id);assert.equal(fetch.count(),1);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  const replay=await doiRead(s,who,'task-doi-read');assert.equal(replay.id,paper.id);assert.equal(fetch.count(),1);assert.deepEqual(s.app.evidence.read(USER,paper.artifactId).bytes,metadata);assert.deepEqual(s.app.evidence.read(USER,paper.rawArtifactIds[0]).bytes,raw);
  const submission=s.app.operations.execute(who,'task_result_submit',{summary:'Crossref metadata was retrieved; no full text or scientific claim was verified.',outcome:'completed',evidenceIds:[],artifactIds:[paper.artifactId],claims:[],unresolvedQuestions:['No full text or scientific evidence was read.']},{projectId:s.project.id,idempotencyKey:'task-doi-result'});
  assert.equal(submission.taskId,task.id);assert.equal(submission.attemptId,claim.attempt.id);assert.deepEqual(submission.result.artifactIds,[paper.artifactId]);assert.equal(s.app.store.get('task-attempt',claim.attempt.id).discoveryGrant.id,grant.id);
  const inspected=s.app.operations.execute(USER,'discovery_grant_inspect',{grantId:grant.id},{projectId:s.project.id}),history=inspected.papers.find(p=>p.id===paper.id);
  assert.equal(history.scopeSessionId,claim.attempt.sessionId);assert.equal(history.scopeTaskId,task.id);assert.equal(history.scopeAttemptId,claim.attempt.id);assert.deepEqual(history.discoveryCallIds,[call.id]);assert.equal(history.discoveryRequestDigest,paper.discoveryRequestDigest);
  assert.equal(s.app.store.get('session',claim.attempt.sessionId).id,claim.attempt.sessionId);
 }finally{fetch.restore();s.close();}
});

test('Task DOI reads reject a different DOI, source, search entry, and Task identity before HTTP',async()=>{
 const s=setup(),fetch=installFetch();try{
  const team=startTeam(s,[spec('doi-read',{role:'literature'}),spec('other-task',{role:'literature'})]),task=s.app.teams.tasks(USER,team.id)[0],{grant}=prepareDoiTask(s,{team,task});activateTaskGrant(s,grant);const claim=s.app.teams.claim(team.id);assert.ok(claim);const who=runIdentity(s,claim);
  assert.throws(()=>doiRead(s,who,'wrong-doi','10.1000/other'),{code:'DISCOVERY_TARGET_DENIED'});
  assert.throws(()=>doiRead(s,who,'wrong-source','10.1000/task-bound','openalex'),{code:'DISCOVERY_TARGET_DENIED'});
  assert.throws(()=>taskCall(s,who,'literature_discover',query,'search-in-doi-grant'),{code:'DISCOVERY_REQUEST_DENIED'});
  const other=s.app.teams.claim(team.id);assert.ok(other);await assert.rejects(doiRead(s,runIdentity(s,other),'other-task-read'),{code:'TASK_SCOPE_DENIED'});
  assert.equal(fetch.count(),0);assert.equal(s.app.store.list('connector-call',s.project.id).length,0);
 }finally{fetch.restore();s.close();}
});

test('stale Team or Grant approval rejects the DOI request before HTTP',async()=>{
 for(const stale of ['team','grant']){const s=setup(),fetch=installFetch();try{
  const {team,grant}=prepareDoiTask(s);activateTaskGrant(s,grant);const claim=s.app.teams.claim(team.id);assert.ok(claim);const who=runIdentity(s,claim);s.app.approvals.stale(stale==='team'?team.id:grant.id);
  assert.throws(()=>doiRead(s,who,`stale-${stale}`));assert.equal(fetch.count(),0);assert.equal(s.app.store.list('connector-call',s.project.id).length,0);
 }finally{fetch.restore();s.close();}}
});

test('failed HTTP and mismatched Crossref DOI responses spend the one request and same-key replay never resends',async()=>{
 for(const mode of ['http-failure','doi-mismatch']){const s=setup(),fetch=installFetch(()=>mode==='http-failure'?new Response('unavailable',{status:503}):metadataResponse('10.1000/different'));try{
  const {team,grant}=prepareDoiTask(s);activateTaskGrant(s,grant);const claim=s.app.teams.claim(team.id);assert.ok(claim);const who=runIdentity(s,claim);
  await assert.rejects(doiRead(s,who,`failed-${mode}`),{code:mode==='http-failure'?'CONNECTOR_HTTP_ERROR':'PAPER_ID_MISMATCH'});
  assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,grant.id).usage.used,1);assert.equal(s.app.store.list('paper-read',s.project.id).length,0);
  await assert.rejects(doiRead(s,who,`failed-${mode}`),{code:'DISCOVERY_REQUEST_ALREADY_SENT'});assert.equal(fetch.count(),1);assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,grant.id).usage.used,1);
  assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,grant.id).calls[0].status,mode==='http-failure'?'failed-or-unknown':'succeeded');
 }finally{fetch.restore();s.close();}}
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
