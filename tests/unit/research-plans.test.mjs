import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve,campaign,enroll,submit,fixtureFinish} from '../support/research.mjs';
import {actor,result,acceptedSource} from '../support/collaboration.mjs';

function observed(s,overrides={}){const c=campaign(s,overrides),r=submit(s,enroll(s,c));fixtureFinish(s,r);s.app.campaigns.observe();return {c,r,o:s.app.campaigns.observations(USER,c.id)[0]};}
function plan(r,extra={}){return {hypothesis:'A controlled software regression experiment',controlRunIds:[r.id],changedFactors:['polynomialDegree'],dataSplit:'Same fixed example dataset and holdout split; no external scientific claim',dataArtifactIds:[],primaryMetric:'mse',guardrailMetrics:['r2'],repetitions:{count:1,rationale:'Deterministic software acceptance only'},successCriteria:'Review actual held-out error and guardrails',inconclusiveCriteria:'Missing output or unverified evidence',stoppingCriteria:'Stop after the approved bounded comparison',...extra};}
function propose(s,c,o,r,action='refill',extra={}){return s.app.decisions.propose(USER,c.id,{expectedVersion:s.app.campaigns.get(USER,c.id).version,action,reason:'Fixed software acceptance plan',observationIds:[o.id],candidates:[{title:'candidate',hypothesis:'controlled factor change',implementation:'config',config:{polynomialDegree:3}}],experimentPlan:plan(r),...extra});}
function apply(s,d){approve(s.app,d.approvalId);return s.app.decisions.apply(USER,d.id,d.version);}
function failedCandidate(s,c){const e=s.app.experiments.create(USER,s.project.id,{parentId:s.baseline.id,title:'unanswered software failure'}),r=submit(s,enroll(s,c,e));fixtureFinish(s,r,null,'failed');const failed=s.app.runs.get(USER,r.id);s.app.runs.reviewOutcome(USER,r.id,{expectedVersion:failed.version,disposition:'unanswered',reason:'Fixture explicitly failed before measurement'});s.app.campaigns.observe();return {e,r,o:s.app.campaigns.observations(USER,c.id).find(o=>o.runId===r.id)};}
function reviewed(s,candidate){
 const session=s.app.sessions.create(USER,s.project.id,{title:'Isolated candidate implementation'});s.app.researchPlans.prepareCandidate(USER,s.project.id,{candidateId:candidate.id,sessionId:session.id});
 writeFileSync(join(session.workspace,'repair-check.py'),'assert 1 + 1 == 2\n');
 const t=s.app.development.prepare(USER,s.project.id,session.id,{command:['python','repair-check.py'],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`});approve(s.app,t.grantId);
 const j=s.app.store.get('sandbox-job',s.app.development.submit(USER,s.project.id,t.id).id);writeFileSync(join(j.controlDir,'stdout.log'),'UNIT FIXTURE: actual execution covered by integration acceptance\n');writeFileSync(join(j.controlDir,'stderr.log'),'');const job=s.app.development.finalize(j.id,{state:'succeeded',exitCode:0});
 const project=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,project.id,{expectedVersion:project.version,enabled:true});
 const review=s.app.developmentReviews.prepare(USER,s.project.id,{jobId:job.id});approve(s.app,review.approvalId);s.app.teams.activate(USER,review.teamId);const claim=s.app.teams.claim(review.teamId);assert.ok(claim);s.app.teams.submit(actor(claim),result({verdict:'accept',evidenceIds:review.requiredEvidenceIds}));
 const p=s.app.changes.prepareReviewed(USER,s.project.id,{reviewId:review.id,title:candidate.spec.title,hypothesis:candidate.spec.hypothesis});approve(s.app,p.approvalId);const e=s.app.changes.apply(USER,p.id);return {p,e,t,job,review,session};
}

test('new plan fixes parent snapshot, merges parameter fields, and leaves formal Run unapproved',()=>{const s=setup();try{
 const {c,r,o}=observed(s),d=propose(s,c,o,r);writeFileSync(join(s.project.workspace,'project-only.txt'),'must not enter child');writeFileSync(join(s.baseline.workspace,'mutable-only.txt'),'must not replace captured parent');
 const done=apply(s,d),inspection=s.app.researchPlans.inspect(USER,s.project.id,d.planRevisionId);assert.equal(inspection.validity,'current');assert.equal(inspection.candidates.length,1);assert.equal(done.effects.candidateIds[0],inspection.candidates[0].id);
 const e=s.app.experiments.get(USER,done.effects.experimentIds[0]),config=JSON.parse(readFileSync(join(e.workspace,'config.json'))),source=s.app.sources.list(USER,s.project.id,{experimentId:e.id,revision:1});assert.equal(config.polynomialDegree,3);assert.ok(Object.hasOwn(config,'ridge'));assert.equal(source.files.some(f=>f.path.endsWith('only.txt')),false);
 assert.throws(()=>s.app.runs.submit(USER,done.effects.intentIds[0]),{code:'APPROVAL_REQUIRED'});assert.equal(JSON.stringify(inspection).includes('snapshotPath'),false);
}finally{s.close();}});

test('late completion invalidates a pending plan without consuming the observation',()=>{const s=setup();try{
 const {c,r,o}=observed(s),other=s.app.experiments.create(USER,s.project.id,{title:'late',parentId:s.baseline.id}),run=submit(s,enroll(s,c,other)),d=propose(s,c,o,r);approve(s.app,d.approvalId);fixtureFinish(s,run);s.app.campaigns.observe();
 assert.equal(s.app.researchPlans.inspect(USER,s.project.id,d.planRevisionId).validity,'stale');assert.throws(()=>s.app.decisions.apply(USER,d.id,d.version),{code:'APPROVAL_STALE'});assert.equal(s.app.campaigns.observations(USER,c.id).length,2);assert.equal(s.app.store.list('research-candidate').length,0);
}finally{s.close();}});

test('plan rejects unknown metrics, foreign controls and automatic access to unrelated data',()=>{const s=setup();try{
 const {c,r,o}=observed(s);assert.throws(()=>propose(s,c,o,r,'refill',{experimentPlan:plan(r,{guardrailMetrics:['invented']})}),{code:'INVALID_METRIC'});
 const data=s.app.evidence.put(s.project.id,'unrelated.txt',Buffer.from('private unrelated input'));const who={type:'agent',role:'coordinator',projectId:s.project.id,sessionId:s.session.id,wakeupId:'fixture'};
 assert.throws(()=>s.app.decisions.propose(who,c.id,{expectedVersion:s.app.campaigns.get(USER,c.id).version,action:'stop',reason:'stop',observationIds:[o.id],experimentPlan:plan(r,{dataArtifactIds:[data.id]})}),{code:'PLAN_DATA_SCOPE_DENIED'});
 assert.equal(s.app.store.list('experiment-plan-revision').length,0);
}finally{s.close();}});

test('planned repair uses reviewed child, retains failed run and shares repair-chain limit',()=>{const s=setup();try{
 const {c,r}=observed(s,{limits:{maxUnansweredRunsPerNode:2}}),failed=failedCandidate(s,c),d=apply(s,propose(s,c,failed.o,r,'repair',{candidates:[{title:'repair',hypothesis:'fix software failure',implementation:'reviewed-code'}]}));
 assert.deepEqual(d.effects.intentIds,[]);const candidate=s.app.store.get('research-candidate',d.effects.candidateIds[0]);assert.equal(candidate.state,'awaiting_implementation');
 assert.throws(()=>propose(s,c,failed.o,r,'repair',{candidates:[{title:'again',hypothesis:'again',implementation:'reviewed-code'}]}),{code:'RESULT_ALREADY_DECIDED'});
 const fixed=reviewed(s,candidate),attached=s.app.researchPlans.attachCandidate(USER,s.project.id,{candidateId:candidate.id,proposalId:fixed.p.id});assert.equal(attached.experimentId,fixed.e.id);assert.equal(fixed.e.parentId,failed.e.id);assert.equal(s.app.runs.get(USER,failed.r.id).state,'failed');
 assert.throws(()=>s.app.runs.submit(USER,attached.intentId),{code:'APPROVAL_REQUIRED'});assert.equal(s.app.researchPlans.attachCandidate(USER,s.project.id,{candidateId:candidate.id,proposalId:fixed.p.id}).intentId,attached.intentId);
 const again=submit(s,s.app.store.get('run-intent',attached.intentId));fixtureFinish(s,again,null,'failed');const current=s.app.runs.get(USER,again.id);s.app.runs.reviewOutcome(USER,again.id,{expectedVersion:current.version,disposition:'unanswered',reason:'second fixture failure'});s.app.campaigns.observe();const next=s.app.campaigns.observations(USER,c.id).find(o=>o.runId===again.id);
 assert.throws(()=>propose(s,c,next,r,'repair',{candidates:[{title:'third',hypothesis:'must stop',implementation:'reviewed-code'}]}),{code:'REPAIR_LIMIT'});
 s.app.approvals.stale(fixed.t.id);assert.equal(s.app.researchPlans.inspect(USER,s.project.id,d.planRevisionId).validity,'stale');assert.throws(()=>s.app.researchPlans.reportSnapshot(USER,s.project.id,c.id),{code:'PLAN_INPUT_STALE'});
}finally{s.close();}});

test('planned repair rejects measured failed outcomes and foreign producer sessions',()=>{const s=setup();try{
 const {c,r,o}=observed(s);assert.throws(()=>propose(s,c,o,r,'repair',{candidates:[{title:'bad repair',hypothesis:'not unanswered',implementation:'reviewed-code'}]}),{code:'RESULT_ALREADY_ANSWERED'});
 const failed=failedCandidate(s,c),d=apply(s,propose(s,c,failed.o,r,'repair',{candidates:[{title:'repair',hypothesis:'fix',implementation:'reviewed-code'}]})),candidate=s.app.store.get('research-candidate',d.effects.candidateIds[0]);
 s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});assert.throws(()=>s.app.researchPlans.prepareCandidate(USER,s.project.id,{candidateId:candidate.id,sessionId:s.session.id}),{code:'WORKSPACE_NOT_EMPTY'});
 const other=s.app.projects.create(USER,{name:'foreign'});assert.throws(()=>s.app.researchPlans.inspect(USER,other.id,d.planRevisionId),{code:'SCOPE_DENIED'});
}finally{s.close();}});

test('pending reviewed candidates reserve round slots and block promotion',()=>{const s=setup();try{
 const {c,r,o}=observed(s,{limits:{maxCandidatesPerRound:2}}),d=apply(s,propose(s,c,o,r,'refill',{candidates:[{title:'implementation',hypothesis:'needs code',implementation:'reviewed-code'}]}));
 const observation=s.app.store.get('run-observation',o.id);s.app.store.update('run-observation',o.id,observation.version,{status:'pending'});
 assert.throws(()=>propose(s,c,o,r),{code:'CANDIDATE_LIMIT'});assert.throws(()=>propose(s,c,o,r,'promote',{selectedRunId:r.id,candidates:[]}),{code:'ROUND_INCOMPLETE'});
 assert.equal(s.app.store.get('research-candidate',d.effects.candidateIds[0]).state,'awaiting_implementation');
}finally{s.close();}});

test('revoked original control grant cannot be replaced and blocks formal candidate submission',()=>{const s=setup();try{
 const {c,r,o}=observed(s),d=apply(s,propose(s,c,o,r)),intent=s.app.store.get('run-intent',d.effects.intentIds[0]),control=s.app.store.get('run-intent',r.intentId);approve(s.app,intent.approvalId);s.app.approvals.stale(control.id);
 const replacement=s.app.approvals.request(s.project.id,'run-intent',control.id,control.manifestDigest,'run.submit','replacement fixture');approve(s.app,replacement.id);s.app.store.update('run-intent',control.id,control.version,{approvalId:replacement.id});
 assert.equal(s.app.researchPlans.inspect(USER,s.project.id,d.planRevisionId).validity,'stale');assert.throws(()=>s.app.runs.submit(USER,intent.id),{code:'PLAN_RUN_STALE'});assert.equal(s.app.store.get('run-intent',intent.id).status,'prepared');const comparison=s.app.researchPlans.comparison(USER,s.project.id,{campaignId:c.id});assert.deepEqual(comparison.controls[0].metrics,{});assert.ok(comparison.blockers.some(reason=>reason.startsWith(r.id+':')));
}finally{s.close();}});

test('decision revocation prevents queued launch and unbound additional intents',()=>{const s=setup();try{
 const {c,r,o}=observed(s),d=apply(s,propose(s,c,o,r)),intent=s.app.store.get('run-intent',d.effects.intentIds[0]);
 assert.throws(()=>s.app.runs.prepare(USER,intent.experimentId),{code:'PLAN_RUN_BOUND'});const run=submit(s,intent);s.app.approvals.stale(d.id);assert.throws(()=>s.app.runs.assertLaunchable(run),{code:'APPROVAL_STALE'});
}finally{s.close();}});

test('comparison rejects separately tampered observation metrics and inspection never writes records',()=>{const s=setup();try{
 const {c,r,o}=observed(s),d=apply(s,propose(s,c,o,r)),before=s.app.store.db.prepare('SELECT COUNT(*) n FROM records').get().n;
 s.app.researchPlans.inspect(USER,s.project.id,d.planRevisionId);s.app.researchPlans.reportSnapshot(USER,s.project.id,c.id);assert.equal(s.app.store.db.prepare('SELECT COUNT(*) n FROM records').get().n,before);
 const observation=s.app.store.get('run-observation',o.id);s.app.store.update('run-observation',o.id,observation.version,{metrics:{mse:-999}});
 const comparison=s.app.researchPlans.comparison(USER,s.project.id,{campaignId:c.id});assert.equal(comparison.results[0].validation,'invalid');assert.deepEqual(comparison.results[0].metrics,{});assert.throws(()=>s.app.researchPlans.reportSnapshot(USER,s.project.id,c.id),{code:'PLAN_INPUT_STALE'});
}finally{s.close();}});

test('applied plan retains pending-run snapshot while ordinary completion permits remaining candidate implementation',()=>{const s=setup();try{
 const {c,r,o}=observed(s),e=s.app.experiments.create(USER,s.project.id,{title:'in flight',parentId:s.baseline.id}),running=submit(s,enroll(s,c,e));
 const d=apply(s,propose(s,c,o,r,'refill',{candidates:[{title:'next',hypothesis:'next',implementation:'reviewed-code'}]}));fixtureFinish(s,running);s.app.campaigns.observe();
 assert.equal(s.app.researchPlans.inspect(USER,s.project.id,d.planRevisionId).validity,'current');const session=s.app.sessions.create(USER,s.project.id,{title:'next implementation'});assert.equal(s.app.researchPlans.prepareCandidate(USER,s.project.id,{candidateId:d.effects.candidateIds[0],sessionId:session.id}).sessionId,session.id);
}finally{s.close();}});

test('legacy same-node retries and reviewed repair descendants share the oldest chain root',()=>{const s=setup();try{
 const {c,r}=observed(s,{limits:{maxUnansweredRunsPerNode:3}}),failed=failedCandidate(s,c);
 const old=apply(s,s.app.decisions.propose(USER,c.id,{expectedVersion:s.app.campaigns.get(USER,c.id).version,action:'repair',reason:'legacy repair fixture',observationIds:[failed.o.id]}));
 const intent=s.app.runs.prepare(USER,failed.e.id);s.app.campaigns.enroll(USER,c.id,{expectedVersion:s.app.campaigns.get(USER,c.id).version,intentId:intent.id,repairDecisionId:old.id});const second=submit(s,intent);fixtureFinish(s,second,null,'failed');let current=s.app.runs.get(USER,second.id);s.app.runs.reviewOutcome(USER,second.id,{expectedVersion:current.version,disposition:'unanswered',reason:'legacy retry failed before measurement'});s.app.campaigns.observe();
 const secondObservation=s.app.campaigns.observations(USER,c.id).find(o=>o.runId===second.id),d=apply(s,propose(s,c,secondObservation,r,'repair',{candidates:[{title:'reviewed repair',hypothesis:'software fix',implementation:'reviewed-code'}]})),candidate=s.app.store.get('research-candidate',d.effects.candidateIds[0]);assert.equal(candidate.repairRootMemberId,failed.o.memberId);
 const fixed=reviewed(s,candidate),attached=s.app.researchPlans.attachCandidate(USER,s.project.id,{candidateId:candidate.id,proposalId:fixed.p.id}),third=submit(s,s.app.store.get('run-intent',attached.intentId));fixtureFinish(s,third,null,'failed');current=s.app.runs.get(USER,third.id);s.app.runs.reviewOutcome(USER,third.id,{expectedVersion:current.version,disposition:'unanswered',reason:'third unanswered attempt'});s.app.campaigns.observe();const o=s.app.campaigns.observations(USER,c.id).find(o=>o.runId===third.id);
 assert.throws(()=>propose(s,c,o,r,'repair',{candidates:[{title:'fourth',hypothesis:'must not reset',implementation:'reviewed-code'}]}),{code:'REPAIR_LIMIT'});
}finally{s.close();}});

test('promotion fixes measured Run source for the next round and preserves unselected mutable bytes',()=>{const s=setup();try{
 const {c,r,o}=observed(s),first=apply(s,propose(s,c,o,r)),run=submit(s,s.app.store.get('run-intent',first.effects.intentIds[0]));fixtureFinish(s,run,{mse:0.05});s.app.campaigns.observe();const selected=s.app.runs.get(USER,run.id),source=s.app.experiments.get(USER,run.experimentId),observation=s.app.campaigns.observations(USER,c.id).find(o=>o.runId===run.id);
 writeFileSync(join(source.workspace,'later-unmeasured.txt'),'not part of selected run');const promoted=apply(s,propose(s,c,observation,r,'promote',{selectedRunId:run.id,candidates:[{title:'degree four',hypothesis:'next controlled factor',implementation:'config',config:{polynomialDegree:4}}]}));
 const next=s.app.experiments.get(USER,promoted.effects.experimentIds[0]),planRevision=s.app.researchPlans.inspect(USER,s.project.id,promoted.planRevisionId).plan;assert.equal(next.parentId,run.experimentId);assert.equal(planRevision.parentSource.sourceDigest,selected.manifest.snapshotDigest);assert.equal(s.app.sources.list(USER,s.project.id,{experimentId:next.id,revision:1}).files.some(f=>f.path==='later-unmeasured.txt'),false);assert.equal(s.app.campaigns.rounds(USER,c.id).at(-1).parentSource.sourceDigest,selected.manifest.snapshotDigest);
}finally{s.close();}});

test('obsolete unapplied plans remain labeled history without blocking valid applied research reports',()=>{const s=setup();try{
 const {c,r,o}=observed(s),other=s.app.experiments.create(USER,s.project.id,{title:'late',parentId:s.baseline.id}),running=submit(s,enroll(s,c,other)),obsolete=propose(s,c,o,r);fixtureFinish(s,running);s.app.campaigns.observe();
 const current=apply(s,propose(s,c,o,r)),snapshot=s.app.researchPlans.reportSnapshot(USER,s.project.id,c.id);assert.deepEqual(snapshot.plans.map(p=>p.plan.id),[current.planRevisionId]);assert.equal(snapshot.unappliedPlans[0].plan.id,obsolete.planRevisionId);assert.equal(snapshot.unappliedPlans[0].validity,'stale');assert.match(snapshot.unappliedPlans[0].notice,/不属于执行依据/);
 const broken=s.app.store.get('experiment-plan-revision',obsolete.planRevisionId);s.app.store.update('experiment-plan-revision',broken.id,broken.version,{hypothesis:'tampered immutable history'});assert.throws(()=>s.app.researchPlans.reportSnapshot(USER,s.project.id,c.id),{code:'PLAN_CORRUPTED'});
}finally{s.close();}});

test('data task acceptance also binds its original collaboration approval identity',()=>{const s=setup();try{
 const {c,r,o}=observed(s),source=acceptedSource(s),d=apply(s,propose(s,c,o,r,'refill',{experimentPlan:plan(r,{dataArtifactIds:[source.artifact.id]})})),stored=s.app.store.get('team',source.team.id);
 s.app.approvals.stale(stored.id);const replacement=s.app.approvals.request(s.project.id,'team',stored.id,stored.planDigest,'collaboration','replacement fixture');approve(s.app,replacement.id);s.app.store.update('team',stored.id,stored.version,{approvalId:replacement.id});
 assert.equal(s.app.researchPlans.inspect(USER,s.project.id,d.planRevisionId).validity,'stale');assert.throws(()=>s.app.researchPlans.reportSnapshot(USER,s.project.id,c.id),{code:'PLAN_INPUT_STALE'});
}finally{s.close();}});

test('cross-campaign run data preserves the producer research plan authorization',()=>{const s=setup();try{
 const a=observed(s),producer=apply(s,propose(s,a.c,a.o,a.r)),run=submit(s,s.app.store.get('run-intent',producer.effects.intentIds[0]));fixtureFinish(s,run);s.app.campaigns.observe();const measured=s.app.runs.get(USER,run.id),artifact=measured.artifactIds.map(id=>s.app.store.get('artifact',id)).find(a=>a.title==='metrics.json');
 const b=observed(s),consumer=apply(s,propose(s,b.c,b.o,b.r,'refill',{experimentPlan:plan(b.r,{dataArtifactIds:[artifact.id]})}));assert.equal(s.app.researchPlans.inspect(USER,s.project.id,consumer.planRevisionId).validity,'current');
 s.app.approvals.stale(producer.id);assert.equal(s.app.researchPlans.inspect(USER,s.project.id,consumer.planRevisionId).validity,'stale');assert.throws(()=>s.app.researchPlans.reportSnapshot(USER,s.project.id,b.c.id),{code:'PLAN_INPUT_STALE'});
}finally{s.close();}});
