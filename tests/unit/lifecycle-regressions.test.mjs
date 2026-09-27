import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve,fixtureFinish,submit} from '../support/research.mjs';
import {startTeam,spec,actor,result,acceptedSource,change} from '../support/collaboration.mjs';
import {writeRoute} from '../../dist/apps/server/routes.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
const rejected = fn => assert.throws(fn, e => ['APPROVAL_STALE','REPLAN_REQUIRED','PROJECT_ARCHIVED','CLAIM_STALE','TASK_NOT_ACCEPTED','ACCEPTANCE_STALE','CHANGE_SOURCE_STALE','CLAIM_REAPPROVAL_REQUIRED'].includes(e.code));

test('F21 paused retry does not resume unrelated queued work',()=>{const s=setup();try{
 const t=startTeam(s,[spec('a'),spec('b')]),a=s.app.teams.claim(t.id);s.app.teams.fail(a.attempt.id,'fixture');s.app.teams.pause(USER,t.id);
 s.app.teams.retry(USER,a.task.id);assert.equal(s.app.teams.get(USER,t.id).state,'paused');assert.equal(s.app.teams.claim(t.id),null);
 s.app.teams.resume(USER,t.id);assert.equal(s.app.teams.claim(t.id).task.key,'a');
}finally{s.close();}});
test('F21 stale plan cannot be resurrected by retry of unrelated failed task',()=>{const s=setup();try{
 const t=startTeam(s,[spec('a'),spec('b')]),a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),result());const b=s.app.teams.claim(t.id);s.app.teams.fail(b.attempt.id,'fixture');
 s.app.teams.directive(USER,t.id,{kind:'revise',content:'Change A premises',taskIds:[a.task.id]});rejected(()=>s.app.teams.retry(USER,b.task.id));assert.equal(s.app.teams.claim(t.id),null);
}finally{s.close();}});
test('F21 claim rechecks revoked approval even for an already active team',()=>{const s=setup();try{
 const t=startTeam(s,[spec('a')]);s.app.approvals.stale(t.id);assert.equal(s.app.teams.claim(t.id),null);assert.equal(s.app.store.list('task-attempt').length,0);assert.equal(s.app.teams.get(USER,t.id).state,'paused');
}finally{s.close();}});
test('F21 resume refuses stale approval without superseded tasks',()=>{const s=setup();try{
 const t=startTeam(s,[spec('a')]);s.app.teams.pause(USER,t.id);s.app.approvals.stale(t.id);rejected(()=>s.app.teams.resume(USER,t.id));
}finally{s.close();}});
test('F22 archived project refuses old intent submission through HTTP routing',()=>{const s=setup();try{
 const i=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,i.approvalId);const p=s.app.projects.get(USER,s.project.id);s.app.projects.archive(USER,p.id,p.version);
 rejected(()=>writeRoute(s.app,{},`/run-intents/${i.id}/submit`,{}));assert.equal(s.app.store.list('run').length,0);
}finally{s.close();}});
test('F22 archive revokes unconsumed approvals and rejects fresh preparation',()=>{const s=setup();try{
 const i=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,i.approvalId);const p=s.app.projects.get(USER,s.project.id);s.app.projects.archive(USER,p.id,p.version);
 assert.equal(s.app.store.get('approval',i.approvalId).status,'stale');rejected(()=>s.app.runs.prepare(USER,s.baseline.id));
}finally{s.close();}});
test('F22 historical submitted Run replay remains readable after archive',()=>{const s=setup();try{
 const i=s.app.runs.prepare(USER,s.baseline.id),r=submit(s,i);fixtureFinish(s,r);const p=s.app.projects.get(USER,s.project.id);s.app.projects.archive(USER,p.id,p.version);
 assert.equal(s.app.runs.submit(USER,i.id).id,r.id);assert.equal(s.app.runs.get(USER,r.id).state,'succeeded');
}finally{s.close();}});
test('F22 archive is atomic with busy checks and blocks live Run',()=>{const s=setup();try{
 const i=s.app.runs.prepare(USER,s.baseline.id);submit(s,i);const p=s.app.projects.get(USER,s.project.id);assert.throws(()=>s.app.projects.archive(USER,p.id,p.version),{code:'PROJECT_BUSY'});assert.equal(s.app.projects.get(USER,p.id).archived,false);
}finally{s.close();}});
test('F22 archived project cannot queue new interactive model work',()=>{const s=setup();try{
 const p=s.app.projects.get(USER,s.project.id);s.app.projects.archive(USER,p.id,p.version);rejected(()=>s.app.sessions.send(USER,s.session.id,{content:'Do new work'}));rejected(()=>s.app.sessions.create(USER,p.id,{title:'New'}));
}finally{s.close();}});
test('F23 old accepted claim cannot enter new report after premises change; history preserved',()=>{const s=setup();try{
 const x=acceptedSource(s),old=s.app.reports.create(USER,s.project.id,{claimIds:[x.claim.id]}),bytes=s.app.evidence.read(USER,old.id).bytes;
 s.app.teams.directive(USER,x.team.id,{kind:'revise',content:'Withdraw old premise',taskIds:[x.producer.task.id]});
 rejected(()=>s.app.reports.create(USER,s.project.id,{claimIds:[x.claim.id]}));assert.deepEqual(s.app.evidence.read(USER,old.id).bytes,bytes);assert.equal(s.app.store.get('claim',x.claim.id).status,'accepted');
}finally{s.close();}});
test('F23 stale claim cannot be reaccepted without new task result',()=>{const s=setup();try{
 const x=acceptedSource(s);s.app.teams.directive(USER,x.team.id,{kind:'revise',content:'New premise',taskIds:[x.producer.task.id]});const c=s.app.store.get('claim',x.claim.id);rejected(()=>s.app.evidence.decideClaim(USER,c.id,c.version,'accepted'));
}finally{s.close();}});
test('F23 task-backed accepted claim has an immutable acceptance reference',()=>{const s=setup();try{
 const x=acceptedSource(s,true),c=s.app.store.get('claim',x.claim.id);assert.ok(c.sourceAcceptanceId);const record=s.app.store.get('acceptance-record',c.sourceAcceptanceId);assert.equal(record.taskId,x.producer.task.id);assert.ok(record.taskIds.includes(x.review.task.id));
}finally{s.close();}});
test('F23 changing an unrelated task does not invalidate an independent accepted claim',()=>{const s=setup();try{
 const x=acceptedSource(s),t=startTeam(s,[spec('unrelated')]),id=s.app.teams.tasks(USER,t.id)[0].id;s.app.teams.directive(USER,t.id,{kind:'revise',content:'Change only this task',taskIds:[id]});assert.ok(s.app.reports.create(USER,s.project.id,{claimIds:[x.claim.id]}));
}finally{s.close();}});
test('F24 reviewer invalidation prevents applying an already approved proposal',()=>{const s=setup();try{
 const x=acceptedSource(s,true),p=change(s,x);s.app.teams.directive(USER,x.team.id,{kind:'revise',content:'Prior review no longer valid',taskIds:[x.review.task.id]});rejected(()=>s.app.changes.apply(USER,p.id));assert.equal(s.app.store.list('experiment').length,1);
}finally{s.close();}});
test('F24 reviewer invalidation propagates into its producer claim',()=>{const s=setup();try{
 const x=acceptedSource(s,true);s.app.teams.directive(USER,x.team.id,{kind:'revise',content:'Recheck the reasoning',taskIds:[x.review.task.id]});rejected(()=>s.app.reports.create(USER,s.project.id,{claimIds:[x.claim.id]}));
}finally{s.close();}});
test('F24 evidence consumer in a different team becomes stale with its producer',()=>{const s=setup();try{
 const x=acceptedSource(s,true),t=startTeam(s,[spec('consumer',{inputEvidenceIds:[x.evidence.id]})]),a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),result({evidenceIds:[x.evidence.id],claims:[{statement:'Derived from old source',evidenceIds:[x.evidence.id],limitations:[]}]}));let c=s.app.store.list('claim').find(c=>c.taskId===a.task.id);c=s.app.evidence.decideClaim(USER,c.id,c.version,'accepted');
 s.app.teams.directive(USER,x.team.id,{kind:'revise',content:'Withdraw source review',taskIds:[x.review.task.id]});rejected(()=>s.app.reports.create(USER,s.project.id,{claimIds:[c.id]}));assert.equal(s.app.store.get('task',a.task.id).execution,'superseded');
}finally{s.close();}});
test('F24 accepted review provenance survives restart and is still checked',()=>{const s=setup();try{
 const x=acceptedSource(s,true),p=change(s,x);s.app.close();s.app=new ResearchApp(s.dir,process.cwd());s.app.teams.directive(USER,x.team.id,{kind:'revise',content:'After restart withdraw review',taskIds:[x.review.task.id]});rejected(()=>s.app.changes.apply(USER,p.id));
}finally{s.close();}});
test('F25 failed reviewer pauses with durable reason and no premature acceptance',()=>{const s=setup();try{
 const t=startTeam(s,[spec('a',{critical:true}),spec('r',{role:'reviewer',reviewOf:'a'})]),a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),result());const r=s.app.teams.claim(t.id);s.app.teams.fail(r.attempt.id,'review failure');
 const team=s.app.teams.get(USER,t.id);assert.equal(team.state,'paused');assert.match(team.blockReason,/审查/);assert.notEqual(s.app.store.get('task',a.task.id).acceptance,'accepted');
 const n=s.app.sessions.messages(USER,s.session.id).length;assert.ok(n>0);s.app.teams.refresh(t.id);assert.equal(s.app.sessions.messages(USER,s.session.id).length,n);s.app.teams.retry(USER,r.task.id);assert.equal(s.app.teams.claim(t.id),null);s.app.teams.resume(USER,t.id);assert.equal(s.app.teams.claim(t.id).task.key,'r');
}finally{s.close();}});
test('F23 a new team cannot launder superseded evidence into a fresh plan',()=>{const s=setup();try{
 const x=acceptedSource(s);s.app.teams.directive(USER,x.team.id,{kind:'revise',content:'Withdraw premise',taskIds:[x.producer.task.id]});
 rejected(()=>startTeam(s,[spec('new',{inputEvidenceIds:[x.evidence.id]})]));
}finally{s.close();}});
test('F24 revoked applied child cannot prepare a new Run, historical child retained',()=>{const s=setup();try{
 const x=acceptedSource(s,true),p=change(s,x),child=s.app.changes.apply(USER,p.id);s.app.teams.directive(USER,x.team.id,{kind:'revise',content:'Recheck review',taskIds:[x.review.task.id]});
 rejected(()=>s.app.runs.prepare(USER,child.id));assert.equal(s.app.experiments.get(USER,child.id).parentId,s.baseline.id);
}finally{s.close();}});
test('F23 claiming a previously approved plan revalidates input acceptance',()=>{const s=setup();try{
 const x=acceptedSource(s),t=startTeam(s,[spec('new',{inputEvidenceIds:[x.evidence.id]})]);
 // Legacy/incomplete invalidation record: simulate persisted input state change without event.
 const old=s.app.store.get('task',x.producer.task.id);s.app.store.update('task',old.id,old.version,{execution:'superseded'});
 const count=s.app.store.list('task-attempt').length;assert.equal(s.app.teams.claim(t.id),null);assert.equal(s.app.store.list('task-attempt').length,count);
}finally{s.close();}});
