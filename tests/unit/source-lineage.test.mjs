import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve} from '../support/research.mjs';
import {acceptedSource,change,startTeam,spec,actor,result} from '../support/collaboration.mjs';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {captureAcceptance,assertAcceptanceCurrent,taskAcceptanceBasis} from '../../dist/packages/evidence/acceptance.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';

test('revoked source approval blocks fresh assistant effects and accepted derivatives across teams while retaining raw history',async()=>{
 const s=setup();try {
  const original=acceptedSource(s),proposal=change(s,original),child=s.app.changes.apply(USER,proposal.id);
  const bound=s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:child.id,revision:1});
  const tools=new ToolDispatcher(s.app);
  const acceptedTeam=startTeam(s,[spec('derive',{role:'implementer'})]),done=s.app.teams.claim(acceptedTeam.id);
  const sourceRead=await tools.execute(actor(done),'experiment_source_read',{experimentId:child.id,revision:1,path:'analysis.py'},'read-source');
  assert.equal(sourceRead.content,'print("fixture evidence")\n');assert.equal(sourceRead.sourceDigest,bound.sourceDigest);
  const artifact=await tools.execute(actor(done),'artifact_create',{title:'derived.py',content:'print("derived from selected source")\n'},'derived');
  await tools.execute(actor(done),'task_result_submit',result({artifactIds:[artifact.id]}),'done');
  const acceptance=captureAcceptance(s.app.store,s.project.id,done.task.id);
  assert.deepEqual(acceptance.basis.find(n=>n.id===done.task.id).source,{snapshotId:bound.snapshotId,sourceDigest:bound.sourceDigest,experimentId:child.id,revision:1});
  const integration={baseExperimentId:s.baseline.id,expectedRevision:1,title:'Derived source',hypothesis:'Actual immutable artifact',changes:[{path:'derived.py',artifactId:artifact.id,expectedDigest:null}]};
  assert.ok(s.app.changes.prepare(USER,s.project.id,integration));

  const runningTeam=startTeam(s,[spec('active',{role:'implementer'})]),running=s.app.teams.claim(runningTeam.id);
  const session=s.app.store.get('session',running.attempt.sessionId);s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+30000});
  const host=new AgentHost(s.app),active={sessionId:session.id,generation:1,actor:actor(running)};
  assert.equal(host.valid(active),true);
  await tools.execute(actor(running),'experiment_source_read',{experimentId:child.id,revision:1,path:'analysis.py'},'read-before-revocation');
  const historical=await tools.execute(actor(running),'artifact_create',{title:'before.txt',content:'created before source revocation'},'before');
  s.app.teams.directive(USER,original.team.id,{kind:'revise',content:'Source assumptions withdrawn',taskIds:[original.producer.task.id]});
  assert.equal(s.app.store.get('change-proposal',proposal.id).sourceValidity,'stale');
  assert.equal(host.valid(active),false,'host control also rejects a worker whose source was revoked');
  await assert.rejects(tools.execute(actor(running),'artifact_create',{title:'after.txt',content:'must not be created'},'after'),{code:'TASK_INPUT_STALE'});
  await assert.rejects(tools.execute(actor(running),'task_result_submit',result({artifactIds:[historical.id]}),'submit-after'),{code:'TASK_INPUT_STALE'});
  assert.throws(()=>captureAcceptance(s.app.store,s.project.id,done.task.id),{code:'TASK_NOT_ACCEPTED'});
  assert.throws(()=>assertAcceptanceCurrent(s.app.store,s.project.id,acceptance.id),{code:'ACCEPTANCE_STALE'});
  assert.throws(()=>s.app.changes.prepare(USER,s.project.id,integration),{code:'TASK_NOT_ACCEPTED'});
  assert.equal(s.app.evidence.read(USER,artifact.id).bytes.toString(),'print("derived from selected source")\n');
  assert.equal(s.app.evidence.read(USER,historical.id).bytes.toString(),'created before source revocation');
 }finally{s.close();}
});

test('unbound legacy task acceptance keeps its previous basis shape and digest',()=>{
 const s=setup();try {
  const source=acceptedSource(s),first=taskAcceptanceBasis(s.app.store,s.project.id,source.producer.task.id);
  assert.ok(first.basis.every(n=>!Object.hasOwn(n,'source')));
  const existing=captureAcceptance(s.app.store,s.project.id,source.producer.task.id);
  assert.equal(existing.basisDigest,first.basisDigest);
  assert.equal(captureAcceptance(s.app.store,s.project.id,source.producer.task.id).id,existing.id);
 }finally{s.close();}
});

test('source revocation reaches already applied proposals through multiple clean-base teams',async()=>{
 const s=setup();try {
  const original=acceptedSource(s),p1=change(s,original),e1=s.app.changes.apply(USER,p1.id),tools=new ToolDispatcher(s.app);
  async function derive(source,name) {
   const session=s.app.sessions.create(USER,s.project.id,{title:name});
   s.app.sources.prepare(USER,s.project.id,session.id,{experimentId:source.id,revision:source.revision});
   const team=startTeam({...s,session},[spec(name,{role:'implementer'})]),claimed=s.app.teams.claim(team.id);
   const artifact=await tools.execute(actor(claimed),'artifact_create',{title:name+'.py',content:`print('${name}')\n`},name+'-artifact');
   await tools.execute(actor(claimed),'task_result_submit',result({artifactIds:[artifact.id]}),name+'-submit');
   const proposal=s.app.changes.prepare(USER,s.project.id,{baseExperimentId:s.baseline.id,expectedRevision:1,title:name,hypothesis:'A derivative on an independent clean base',changes:[{path:name+'.py',artifactId:artifact.id,expectedDigest:null}]});
   approve(s.app,proposal.approvalId);
   return {proposal,experiment:s.app.changes.apply(USER,proposal.id),task:claimed.task,artifact};
  }
  const b=await derive(e1,'second'),c=await derive(b.experiment,'third');
  assert.equal(b.experiment.parentId,s.baseline.id);assert.equal(c.experiment.parentId,s.baseline.id);
  const intent=s.app.runs.prepare(USER,c.experiment.id);approve(s.app,intent.approvalId);
  const run=s.app.runs.submit(USER,intent.id),history=s.app.runs.get(USER,run.id);
  s.app.teams.directive(USER,original.team.id,{kind:'revise',content:'Revoke original source',taskIds:[original.producer.task.id]});
  for(const derived of [b,c]) {
   assert.equal(s.app.store.get('task',derived.task.id).execution,'superseded');
   assert.equal(s.app.store.get('change-proposal',derived.proposal.id).sourceValidity,'stale');
   const selector={experimentId:derived.experiment.id,revision:1};
   assert.throws(()=>s.app.sources.list(USER,s.project.id,selector),{code:'CHANGE_SOURCE_STALE'});
   assert.throws(()=>s.app.sources.read(USER,s.project.id,{...selector,path:'config.json'}),{code:'CHANGE_SOURCE_STALE'});
   assert.throws(()=>s.app.runs.prepare(USER,derived.experiment.id),{code:'CHANGE_SOURCE_STALE'});
   const session=s.app.sessions.create(USER,s.project.id,{title:'fresh preparation'});
   assert.throws(()=>s.app.sources.prepare(USER,s.project.id,session.id,selector),{code:'CHANGE_SOURCE_STALE'});
   assert.match(s.app.evidence.read(USER,derived.artifact.id).bytes.toString(),/print/);
  }
  assert.deepEqual(s.app.runs.get(USER,run.id),history,'existing Run remains immutable history');
 }finally{s.close();}
});
