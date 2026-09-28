import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup, USER, approve} from '../support/research.mjs';
import {actor, result} from '../support/collaboration.mjs';
import {readSourceMode, setSourceMode} from '../../dist/packages/workspace/files.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

// These are service-record fixtures, not real Docker executions or model reviews.
function testedCandidate(s) {
 s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});
 const workspace=s.app.store.get('session',s.session.id).workspace;
 unlinkSync(join(workspace,'config.json'));mkdirSync(join(workspace,'tools'));
 writeFileSync(join(workspace,'tools','run.sh'),'#!/bin/sh\necho reviewed\n');setSourceMode(workspace,'tools/run.sh','100755');
 setSourceMode(workspace,'experiment.mjs','100755');
 writeFileSync(join(workspace,'analysis.py'),'assert 2 + 2 == 4\n');
 const task=s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','analysis.py'],environmentImageDigest:'python@sha256:'+'a'.repeat(64),expectedArtifacts:['unit-result.txt']});
 assert.throws(()=>s.app.development.submit(USER,s.project.id,task.id),{code:'APPROVAL_REQUIRED'});approve(s.app,task.grantId);
 const submitted=s.app.development.submit(USER,s.project.id,task.id),job=s.app.store.get('sandbox-job',submitted.jobId);
 writeFileSync(join(job.controlDir,'stdout.log'),'UNIT FIXTURE: assertions passed, no Docker execution\n');writeFileSync(join(job.controlDir,'stderr.log'),'');writeFileSync(join(job.outputDir,'unit-result.txt'),'UNIT FIXTURE output');
 const completed=s.app.development.finalize(job.id,{state:'succeeded',exitCode:0});assert.equal(completed.integrity,'complete');
 const p=s.app.projects.get(USER,s.project.id);if(!p.settings.enabled)s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});
 const review=s.app.developmentReviews.prepare(USER,s.project.id,{jobId:job.id});
 return {workspace,task,job:completed,review};
}
function claimReview(s,fixture) {
 approve(s.app,fixture.review.approvalId);s.app.teams.activate(USER,fixture.review.teamId);
 const claimed=s.app.teams.claim(fixture.review.teamId);assert.ok(claimed);assert.equal(claimed.task.role,'reviewer');assert.notEqual(claimed.attempt.sessionId,s.session.id);return claimed;
}
function submitReview(s,fixture,claimed,verdict='accept') {
 return s.app.teams.submit(actor(claimed),result({verdict,evidenceIds:fixture.review.requiredEvidenceIds,summary:'UNIT FIXTURE: independently scoped review record, no model call'}));
}
const proposal=(s,f)=>s.app.changes.prepareReviewed(USER,s.project.id,{reviewId:f.review.reviewId??f.review.id,title:'Reviewed fixed candidate',hypothesis:'Use only the immutable tested and reviewed source'});

test('reviewed preparation freezes full tested candidate, deletion and executable mode; approvals stay separate',()=>{
 const s=setup();try {
  const f=testedCandidate(s);assert.throws(()=>proposal(s,f));assert.equal(s.app.teams.claim(f.review.teamId),null);
  const reviewer=claimReview(s,f);submitReview(s,f,reviewer);
  const accepted=s.app.developmentReviews.assertPassed(USER,s.project.id,f.review.id,f.job.sourceDigest);
  assert.throws(()=>s.app.developmentReviews.assertPassed(USER,s.project.id,f.review.id,'b'.repeat(64)));
  writeFileSync(join(f.workspace,'tools','run.sh'),'#!/bin/sh\necho unreviewed later edit\n');writeFileSync(join(f.workspace,'unreviewed.py'),'raise RuntimeError("not reviewed")\n');
  const p=proposal(s,f);assert.equal(p.flow,'reviewed-development');assert.equal(p.reviewId,f.review.id);assert.equal(p.reviewAcceptanceId,accepted.reviewAcceptanceId);assert.equal(p.testJobId,f.job.id);assert.equal(p.candidateSnapshot.digest,f.job.sourceDigest);
  assert.ok(p.changes.some(c=>c.path==='config.json'&&c.artifactId===null));assert.ok(p.changes.some(c=>c.path==='tools/run.sh'));assert.ok(!p.changes.some(c=>c.path==='unreviewed.py'));
  assert.ok(p.changes.some(c=>c.path==='experiment.mjs'),'mode-only change must be part of the fixed candidate');
  assert.equal(readFileSync(join(p.candidateSnapshot.path,'tools','run.sh'),'utf8'),'#!/bin/sh\necho reviewed\n');assert.equal(p.candidateSnapshot.files.find(f=>f.path==='tools/run.sh').mode,'100755');
  assert.equal(s.app.store.get('approval',f.task.grantId).scope,'development.test');
  assert.notEqual(p.approvalId,f.task.grantId);assert.notEqual(p.approvalId,f.review.approvalId);assert.equal(s.app.store.get('approval',p.approvalId).scope,'change.integrate');
  assert.throws(()=>s.app.changes.apply(USER,p.id),{code:'APPROVAL_REQUIRED'});approve(s.app,p.approvalId);const child=s.app.changes.apply(USER,p.id);
  assert.equal(existsSync(join(child.workspace,'config.json')),false);assert.equal(existsSync(join(s.baseline.workspace,'config.json')),true);assert.equal(readSourceMode(child.workspace,'tools/run.sh'),'100755');assert.equal(readSourceMode(child.workspace,'experiment.mjs'),'100755');assert.equal(existsSync(join(child.workspace,'unreviewed.py')),false);assert.equal(s.app.store.list('run').length,0);
 }finally{s.close();}
});

test('rejected review, a different source digest and legacy marker injection cannot gain reviewed authority',()=>{
 const s=setup();try {
  const f=testedCandidate(s),reviewer=claimReview(s,f);submitReview(s,f,reviewer,'reject');assert.throws(()=>proposal(s,f));
  assert.throws(()=>s.app.developmentReviews.assertPassed(USER,s.project.id,f.review.id,'b'.repeat(64)));
  const artifact=s.app.evidence.put(s.project.id,'legacy.py',Buffer.from('print("legacy")\n'),'text/x-python','user');
  const input={baseExperimentId:s.baseline.id,expectedRevision:1,title:'legacy',hypothesis:'No passed independent review',changes:[{path:'legacy.py',expectedDigest:null,artifactId:artifact.id}],flow:'reviewed-development',reviewId:f.review.id,reviewAcceptanceId:'forged'};
  let legacy;try {legacy=s.app.changes.prepare(USER,s.project.id,input);}catch(error){assert.ok(error instanceof Error);}
  if(legacy)assert.notEqual(legacy.flow,'reviewed-development');
  assert.equal(s.app.store.list('experiment').length,1);
 }finally{s.close();}
});

test('withdrawn reviewer acceptance and changed fixed source binding prevent approved proposal apply',()=>{
 for(const mutation of ['withdraw','source-binding']) {
  const s=setup();try {
   const f=testedCandidate(s),reviewer=claimReview(s,f);submitReview(s,f,reviewer);const p=proposal(s,f);approve(s.app,p.approvalId);
   if(mutation==='withdraw')s.app.teams.directive(USER,f.review.teamId,{kind:'revise',content:'Withdraw the unit-fixture review premise',taskIds:[reviewer.task.id]});
   else {const r=s.app.store.get('sandbox-job',f.job.id);s.app.store.update('sandbox-job',r.id,r.version,{sourceDigest:'b'.repeat(64)});}
   assert.throws(()=>s.app.changes.apply(USER,p.id),undefined,mutation);assert.equal(s.app.store.list('experiment').length,1);
  }finally{s.close();}
 }
});

test('review retry uses a new attempt and stale reviewer identity cannot complete the integration gate',()=>{
 const s=setup();try {
  const f=testedCandidate(s),first=claimReview(s,f);
  s.app.teams.submit(actor(first),result({outcome:'blocked',verdict:'disputed',evidenceIds:f.review.requiredEvidenceIds,summary:'UNIT FIXTURE: reviewer needs another attempt',unresolvedQuestions:['Review incomplete']}));
  assert.throws(()=>proposal(s,f));s.app.teams.retry(USER,first.task.id);const second=s.app.teams.claim(f.review.teamId);assert.ok(second);assert.notEqual(second.attempt.id,first.attempt.id);assert.ok(second.attempt.generation>first.attempt.generation);
  assert.throws(()=>submitReview(s,f,first));assert.throws(()=>proposal(s,f));submitReview(s,f,second);
  const p=proposal(s,f);assert.equal(p.flow,'reviewed-development');assert.throws(()=>s.app.changes.apply(USER,p.id),{code:'APPROVAL_REQUIRED'});
 }finally{s.close();}
});

test('review Registry operations and reviewer task context satisfy their advertised output schemas',()=>{
 const s=setup();try {
  const f=testedCandidate(s),schemas=new Map(s.app.operations.specs().map(spec=>[spec.id,spec.outputSchema]));
  const call=(name,input,who=USER)=>{
   const value=s.app.operations.execute(who,name,input,{projectId:s.project.id,sessionId:who.sessionId??s.session.id,idempotencyKey:'schema-'+name});
   assert.ok(schemas.has(name),name);validateSchema(schemas.get(name),value,'output');return value;
  };
  const prepared=call('development_review_prepare',{jobId:f.job.id});assert.equal(prepared.reviewId,f.review.id);assert.equal(prepared.status,'awaiting_approval');
  const pending=call('development_review_inspect',{reviewId:f.review.id});assert.deepEqual(pending,prepared);
  const reviewer=claimReview(s,f),who=actor(reviewer);
  const listing=call('development_review_source_list',{reviewId:f.review.id},who);assert.equal(listing.sourceDigest,f.job.sourceDigest);assert.equal(listing.files.find(file=>file.path==='tools/run.sh').mode,'100755');
  const page=call('development_review_source_read',{reviewId:f.review.id,path:'tools/run.sh',limit:8},who);assert.equal(page.content,'#!/bin/s');assert.equal(page.end,8);assert.equal(page.complete,false);
  const context=call('task_context_read',{},who);assert.deepEqual(context.developmentReview,{reviewId:f.review.id,jobId:f.job.id,sourceDigest:f.job.sourceDigest,manifestEvidenceId:f.review.manifestEvidenceId,testEvidenceIds:f.review.testEvidenceIds});
  const tasks=call('task_inspect',{teamId:f.review.teamId},who);assert.equal(tasks.find(task=>task.id===reviewer.task.id).reviewId,f.review.id);
  submitReview(s,f,reviewer);
  const passed=call('development_review_inspect',{reviewId:f.review.id});assert.equal(passed.status,'passed');assert.equal(passed.verdict,'accept');assert.equal(passed.reviewerSessionId,reviewer.attempt.sessionId);
  const reviewed=call('reviewed_change_prepare',{reviewId:f.review.id,title:'Schema-bound reviewed change',hypothesis:'Fixed candidate with real service records'});assert.equal(reviewed.flow,'reviewed-development');assert.equal(reviewed.testJobId,f.job.id);assert.ok(reviewed.reviewAcceptanceId);
 }finally{s.close();}
});
