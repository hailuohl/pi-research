import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
const physical=(app,reference)=>app.store.paths.physical(reference);
import {actor,result,acceptedSource} from '../support/collaboration.mjs';
import {DevelopmentReviewService} from '../../dist/packages/development/reviews.js';
import {assertAcceptanceCurrent} from '../../dist/packages/evidence/acceptance.js';
import {invalidationClosure,expireDerivations} from '../../dist/packages/evidence/invalidation.js';

function service(s){const reviews=s.app.developmentReviews??new DevelopmentReviewService(s.app);s.app.teams.reviewValidator=task=>reviews.assertTaskCurrent(task);return reviews;}
function enable(s){const p=s.app.projects.get(USER,s.project.id);if(!p.settings.enabled)s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});}
function tested(s,extra={},stdout='UNIT FIXTURE: passing test log\n') {
 s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});writeFileSync(join(physical(s.app,s.session.workspace),'review-candidate.py'),'assert 1 + 1 == 2\n');
 const t=s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','review-candidate.py'],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`,...extra});approve(s.app,t.grantId);
 const dto=s.app.development.submit(USER,s.project.id,t.id),j=s.app.store.get('sandbox-job',dto.id),controlDir=physical(s.app,j.controlDir);writeFileSync(join(controlDir,'stdout.log'),stdout);writeFileSync(join(controlDir,'stderr.log'),'');
 const job=s.app.development.finalize(j.id,{state:'succeeded',exitCode:0});return {t,job};
}
function claim(s,review){approve(s.app,review.approvalId);s.app.teams.activate(USER,review.teamId);const claimed=s.app.teams.claim(review.teamId);assert.ok(claimed);return claimed;}
function submitReview(s,c,r,verdict='accept'){return s.app.teams.submit(actor(c),result({verdict,evidenceIds:r.requiredEvidenceIds}));}

test('fixed artifact preparation/pages retain exact reviewer log scope and cannot produce legacy review coverage',async()=>{
 const s=setup();try{enable(s);const reviews=service(s),content='L'.repeat(2*1024*1024+1),{job,t}=tested(s,{resources:{logBytes:4*1024*1024}},content),r=reviews.prepare(USER,s.project.id,{jobId:job.id}),c=claim(s,r),who=actor(c),a=s.app.store.get('artifact',job.stdoutArtifactId),scope={projectId:s.project.id,sessionId:who.sessionId};
 const prep={artifactId:a.id,sourceDigest:a.digest},p=await s.app.operations.execute(who,'artifact_text_prepare',prep,{...scope,idempotencyKey:'prepare-log'}),input={...prep,textSourceId:p.textSourceId,readProtocol:'fixed-text-v1',cursor:0,limit:16000};
 const original=reviews.recordReading;reviews.recordReading=()=>{throw Error('byte page must not enter legacy UTF16 review coverage');};let page;try{page=s.app.operations.execute(who,'artifact_read',input,{...scope,idempotencyKey:'log-page'});}finally{reviews.recordReading=original;}assert.equal(page.content,'L'.repeat(16000));assert.ok(page.artifactReadId);assert.equal(page.reviewReadId,undefined);
 const unrelated=s.app.evidence.put(s.project.id,'other',Buffer.from(content));await assert.rejects(async()=>s.app.operations.execute(who,'artifact_text_prepare',{artifactId:unrelated.id,sourceDigest:unrelated.digest},{...scope,idempotencyKey:'outside'}),{code:'TASK_SCOPE_DENIED'});
 s.app.approvals.stale(t.id);await assert.rejects(async()=>s.app.operations.execute(who,'artifact_text_prepare',prep,{...scope,idempotencyKey:'prepare-log'}),{code:'APPROVAL_STALE'});assert.throws(()=>s.app.operations.execute(who,'artifact_read',input,{...scope,idempotencyKey:'log-page'}),{code:'APPROVAL_STALE'});
 }finally{s.close();}
});

test('independent reviewers page beyond 2 MiB only in their frozen archived development logs',()=>{
 const s=setup();try{
  enable(s);const reviews=service(s),text='L'.repeat(2*1024*1024+16001)+'fixed-log-tail', {job,t}=tested(s,{resources:{logBytes:4*1024*1024}},text),r=reviews.prepare(USER,s.project.id,{jobId:job.id}),c=claim(s,r),who=actor(c);
  const read=(artifactId,cursor)=>s.app.operations.execute(who,'artifact_read',{artifactId,cursor},{projectId:s.project.id,sessionId:who.sessionId,idempotencyKey:crypto.randomUUID()});
  const first=read(job.stdoutArtifactId,2*1024*1024);assert.equal(first.content,text.slice(2*1024*1024,first.cursor));assert.equal(first.complete,false);
  const tail=read(job.stdoutArtifactId,first.cursor);assert.equal(tail.content,'Lfixed-log-tail');assert.equal(tail.complete,true);assert.equal(tail.digest,s.app.store.get('artifact',job.stdoutArtifactId).digest);
  assert.throws(()=>s.app.operations.execute(USER,'artifact_read',{artifactId:job.stdoutArtifactId},{projectId:s.project.id}),{code:'ARTIFACT_TEXT_REQUIRED'});
  assert.throws(()=>s.app.development.logs(who,s.project.id,job.id,'stdout',0),{code:'TASK_SCOPE_DENIED'});
  const unrelated=s.app.evidence.put(s.project.id,'other log',Buffer.from(text),'text/plain','user');assert.throws(()=>read(unrelated.id,0),{code:'TASK_SCOPE_DENIED'});
  s.app.approvals.stale(t.id);assert.throws(()=>read(job.stdoutArtifactId,first.cursor),{code:'APPROVAL_STALE'});
 }finally{s.close();}
});

test('large review log exceptions remain tied to the original archived wrapper identity',()=>{
 const s=setup();try{
  enable(s);const reviews=service(s),text='L'.repeat(2*1024*1024+1),{job}=tested(s,{resources:{logBytes:4*1024*1024}},text),r=reviews.prepare(USER,s.project.id,{jobId:job.id}),c=claim(s,r),who=actor(c);
  const replacement=s.app.evidence.put(s.project.id,'replacement log',Buffer.from(text+'changed'),'text/plain',`development:${job.id}`),stored=s.app.store.get('sandbox-job',job.id);
  s.app.store.update('sandbox-job',stored.id,stored.version,{stdoutArtifactId:replacement.id,artifactIds:[...stored.artifactIds,replacement.id]});
  assert.throws(()=>s.app.operations.execute(who,'artifact_read',{artifactId:replacement.id,cursor:0},{projectId:s.project.id,sessionId:who.sessionId,idempotencyKey:crypto.randomUUID()}),{code:'DEVELOPMENT_REVIEW_STALE'});
  assert.throws(()=>s.app.operations.execute(who,'artifact_text_prepare',{artifactId:replacement.id,sourceDigest:replacement.digest},{projectId:s.project.id,sessionId:who.sessionId,idempotencyKey:crypto.randomUUID()}),{code:'DEVELOPMENT_REVIEW_STALE'});
 }finally{s.close();}
});

test('review preparation needs explicit collaboration, creates one stable approval target and preserves input provenance',()=>{
 const s=setup();try{s.app.projects.settings(USER,s.project.id,{expectedVersion:s.project.version,enabled:false});const reviews=service(s),{job}=tested(s);assert.throws(()=>reviews.prepare(USER,s.project.id,{jobId:job.id}),{code:'MULTI_AGENT_DISABLED'});assert.equal(s.app.store.list('development-review').length,0);
  enable(s);const r=reviews.prepare(USER,s.project.id,{jobId:job.id});assert.equal(r.status,'awaiting_approval');assert.equal(r.requiredEvidenceIds.length,4);assert.equal(r.sourceDigest,job.sourceDigest);assert.equal(r.producerSessionId,s.session.id);
  assert.deepEqual(reviews.prepare(USER,s.project.id,{jobId:job.id}),r);assert.equal(s.app.store.list('team').length,1);assert.equal(s.app.teams.claim(r.teamId),null);
  const manifest=s.app.evidence.verify(s.project.id,r.manifestEvidenceId);const parsed=JSON.parse(manifest.quote);assert.equal(parsed.sourceDigest,job.sourceDigest);assert.equal(parsed.threadLimit,1);assert.ok(parsed.files.some(f=>f.path==='review-candidate.py'));assert.equal(JSON.stringify(r).includes(s.dir.replaceAll('\\','\\\\')),false);
  const emptyLog=JSON.parse(s.app.evidence.verify(s.project.id,r.testEvidenceIds[2]).quote);assert.equal(emptyLog.artifactId,job.stderrArtifactId);assert.equal(emptyLog.size,0);assert.equal(emptyLog.excerpt,'');
 }finally{s.close();}
});

test('another root cannot prepare or inspect private review targets and reviewers see only their assigned target',()=>{
 const s=setup();try{enable(s);const reviews=service(s),{job}=tested(s),other=s.app.sessions.create(USER,s.project.id,{title:'Other root'}),foreign={type:'agent',projectId:s.project.id,sessionId:other.id,role:'coordinator'};
  assert.throws(()=>reviews.prepare(foreign,s.project.id,{jobId:job.id}),{code:'TASK_SCOPE_DENIED'});assert.equal(s.app.store.list('development-review').length,0);
  const r=reviews.prepare(USER,s.project.id,{jobId:job.id});assert.throws(()=>reviews.inspect(foreign,s.project.id,r.id),{code:'TASK_SCOPE_DENIED'});assert.throws(()=>reviews.sourceList(foreign,s.project.id,r.id),{code:'TASK_SCOPE_DENIED'});
  const c=claim(s,r),who=actor(c);assert.equal(c.context.developmentReview.reviewId,r.id);assert.notEqual(who.sessionId,s.session.id);assert.equal(who.role,'reviewer');
  writeFileSync(join(physical(s.app,s.session.workspace),'review-candidate.py'),'assert False\n');assert.equal(reviews.sourceRead(who,s.project.id,r.id,'review-candidate.py').content,'assert 1 + 1 == 2\n');
  assert.doesNotThrow(()=>s.app.teams.assertResource(who,'artifact',job.stdoutArtifactId));assert.doesNotThrow(()=>s.app.teams.assertResource(who,'artifact',job.reportArtifactId));
  const unrelated=s.app.evidence.put(s.project.id,'private',Buffer.from('other input'));assert.throws(()=>s.app.teams.assertResource(who,'artifact',unrelated.id),{code:'TASK_SCOPE_DENIED'});
  const p=s.app.projects.create(USER,{name:'Other project'});assert.throws(()=>reviews.inspect(USER,p.id,r.id),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});

test('a passed independent reviewer must cite all fixed inputs and yields a current acceptance binding',()=>{
 const s=setup();try{enable(s);const reviews=service(s),{job}=tested(s),r=reviews.prepare(USER,s.project.id,{jobId:job.id}),c=claim(s,r),who=actor(c);
  assert.throws(()=>s.app.teams.submit(who,result({evidenceIds:r.requiredEvidenceIds})),{code:'REVIEW_VERDICT_REQUIRED'});
  assert.throws(()=>s.app.teams.submit(who,result({verdict:'accept',evidenceIds:[r.manifestEvidenceId]})),{code:'EVIDENCE_REQUIRED'});assert.equal(s.app.store.get('task',r.taskId).execution,'running');
  submitReview(s,c,r);const passed=reviews.assertPassed(USER,s.project.id,r.id,r.sourceDigest);assert.equal(passed.jobId,job.id);assert.equal(reviews.inspect(USER,s.project.id,r.id).status,'passed');const accepted=assertAcceptanceCurrent(s.app.store,s.project.id,passed.reviewAcceptanceId);
  assert.deepEqual(accepted.taskIds,[r.taskId]);assert.equal(accepted.basis[0].developmentReview.sourceDigest,job.sourceDigest);assert.equal(accepted.basis[0].developmentReview.digest,r.digest);
  assert.throws(()=>reviews.assertPassed(USER,s.project.id,r.id,'b'.repeat(64)),{code:'DEVELOPMENT_SOURCE_STALE'});
 }finally{s.close();}
});

test('rejected or disputed review cannot be replaced by repeating prepare or manually accepting its task',()=>{
 for(const verdict of ['reject','disputed']){const s=setup();try{enable(s);const reviews=service(s),{job}=tested(s),r=reviews.prepare(USER,s.project.id,{jobId:job.id}),c=claim(s,r);submitReview(s,c,r,verdict);
  assert.equal(reviews.inspect(USER,s.project.id,r.id).status,verdict==='reject'?'rejected':'disputed');assert.equal(reviews.prepare(USER,s.project.id,{jobId:job.id}).id,r.id);assert.equal(s.app.store.list('team').length,1);
  assert.throws(()=>reviews.assertPassed(USER,s.project.id,r.id,r.sourceDigest),{code:'DEVELOPMENT_REVIEW_NOT_PASSED'});assert.throws(()=>s.app.teams.retry(USER,r.taskId),{code:'TASK_NOT_RETRYABLE'});
  const t=s.app.store.get('task',r.taskId);s.app.store.update('task',t.id,t.version,{acceptance:'accepted'});assert.throws(()=>reviews.assertPassed(USER,s.project.id,r.id,r.sourceDigest),{code:'DEVELOPMENT_REVIEW_NOT_PASSED'});
 }finally{s.close();}}
});

test('failed review retries keep their target and invalidate the earlier attempt identity',()=>{
 const s=setup();try{enable(s);const reviews=service(s),{job}=tested(s),r=reviews.prepare(USER,s.project.id,{jobId:job.id}),first=claim(s,r);s.app.teams.fail(first.attempt.id,'fixture transport failure');
  s.app.teams.retry(USER,r.taskId);const second=s.app.teams.claim(r.teamId);assert.ok(second);assert.notEqual(second.attempt.sessionId,first.attempt.sessionId);assert.equal(second.task.reviewId,r.id);assert.equal(reviews.prepare(USER,s.project.id,{jobId:job.id}).id,r.id);
  assert.throws(()=>reviews.sourceRead(actor(first),s.project.id,r.id,'review-candidate.py'),{code:'LEASE_EXPIRED'});submitReview(s,second,r);assert.ok(reviews.assertPassed(USER,s.project.id,r.id,r.sourceDigest).reviewAcceptanceId);
 }finally{s.close();}
});

test('test approval revocation blocks new claim, active source reads and submission while preserving owner history',()=>{
 for(const phase of ['claim','active']){const s=setup();try{enable(s);const reviews=service(s),{job,t}=tested(s),r=reviews.prepare(USER,s.project.id,{jobId:job.id});approve(s.app,r.approvalId);s.app.teams.activate(USER,r.teamId);const c=phase==='active'?s.app.teams.claim(r.teamId):undefined;
  s.app.approvals.stale(t.id);if(c){assert.throws(()=>reviews.sourceRead(actor(c),s.project.id,r.id,'review-candidate.py'),{code:'APPROVAL_STALE'});assert.throws(()=>submitReview(s,c,r),{code:'APPROVAL_STALE'});}else assert.equal(s.app.teams.claim(r.teamId),null);
  assert.equal(reviews.inspect(USER,s.project.id,r.id).status,'stale');assert.equal(reviews.sourceRead(USER,s.project.id,r.id,'review-candidate.py').content,'assert 1 + 1 == 2\n');assert.equal(s.app.store.list('task-result').length,0);
 }finally{s.close();}}
});

test('review acceptance tracks tested data-task provenance and invalidates linked integration and descendant teams',()=>{
 const s=setup();try{enable(s);const data=acceptedSource(s),reviews=service(s),{job}=tested(s,{dataArtifactIds:[data.artifact.id]}),r=reviews.prepare(USER,s.project.id,{jobId:job.id}),c=claim(s,r);submitReview(s,c,r);
  const passed=reviews.assertPassed(USER,s.project.id,r.id,r.sourceDigest),acceptance=s.app.store.get('acceptance-record',passed.reviewAcceptanceId);assert.ok(acceptance.taskIds.includes(data.producer.task.id));assert.ok(acceptance.taskIds.includes(r.taskId));
  const proposal=s.app.store.create('change-proposal',s.project.id,{changes:[],reviewAcceptanceId:passed.reviewAcceptanceId,state:'prepared',sourceValidity:'current'}),approval=s.app.approvals.request(s.project.id,'change-proposal',proposal.id,'fixture','change.integrate','Unit fixture derivative');
  const child=s.app.experiments.create(USER,s.project.id,{title:'Derived fixture'});s.app.store.update('experiment',child.id,child.version,{changeProposalId:proposal.id});const root=s.app.sessions.create(USER,s.project.id,{title:'Descendant root'});s.app.sources.prepare(USER,s.project.id,root.id,{experimentId:child.id,revision:1});
  const downstream=s.app.teams.create(USER,root.id,{goal:'Use reviewed child',tasks:[{key:'next',role:'analyst',objective:'Read inherited source',dependencies:[]}]});const affected=invalidationClosure(s.app.store,s.project.id,[r.taskId]);assert.ok(affected.has(s.app.teams.tasks(USER,downstream.id)[0].id));
  expireDerivations(s.app.store,s.project.id,affected,'fixture-revocation');assert.equal(s.app.store.get('change-proposal',proposal.id).sourceValidity,'stale');assert.equal(s.app.store.get('approval',approval.id).status,'stale');assert.throws(()=>assertAcceptanceCurrent(s.app.store,s.project.id,passed.reviewAcceptanceId),{code:'ACCEPTANCE_STALE'});
 }finally{s.close();}
});
