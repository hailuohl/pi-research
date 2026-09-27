import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,campaign,enroll,submit,fixtureFinish,approve,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';

test('Campaign domain is installed in the same ResearchApp',()=>{const s=setup();try{assert.ok(s.app.campaigns,'missing Campaign service');}finally{s.close();}});
test('Campaign needs its own user approval and does not grant Run approval',()=>{const s=setup();try{
 assert.ok(s.app.campaigns);const c=s.app.campaigns.create(USER,s.project.id,{goal:'test',rootSessionId:s.session.id,baselineExperimentId:s.baseline.id});
 assert.equal(c.state,'draft');assert.throws(()=>s.app.campaigns.activate(USER,c.id,c.version),{code:'APPROVAL_REQUIRED'});
 approve(s.app,c.approvalId);s.app.campaigns.activate(USER,c.id,c.version);const i=enroll(s,c);assert.throws(()=>s.app.runs.submit(USER,i.id),{code:'APPROVAL_REQUIRED'});
}finally{s.close();}});
test('Campaign rejects another project and non-coordinator root',()=>{const s=setup();try{
 assert.ok(s.app.campaigns);const other=s.app.projects.create(USER,{name:'other'}),root=s.app.sessions.create(USER,other.id,{});
 assert.throws(()=>s.app.campaigns.create(USER,s.project.id,{goal:'test',rootSessionId:root.id,baselineExperimentId:s.baseline.id}),{code:'SCOPE_DENIED'});
 assert.throws(()=>s.app.campaigns.create({type:'agent',projectId:s.project.id,role:'analyst'},s.project.id,{goal:'test',rootSessionId:s.session.id,baselineExperimentId:s.baseline.id}),{code:'PERMISSION_DENIED'});
}finally{s.close();}});
test('Campaign observes each terminal Run once and persists across reopen',()=>{const s=setup();try{
 const c=campaign(s),i=enroll(s,c),r=submit(s,i);fixtureFinish(s,r);s.app.campaigns.observe();s.app.campaigns.observe();
 const first=s.app.campaigns.observations(USER,c.id);assert.equal(first.length,1);assert.equal(first[0].validation,'verified');
 s.app.close();s.app=new ResearchApp(s.dir,process.cwd());s.app.campaigns.observe();assert.equal(s.app.campaigns.observations(USER,c.id)[0].id,first[0].id);
}finally{s.close();}});
test('Run exit zero without metrics remains incomplete observation',()=>{const s=setup();try{
 const c=campaign(s),r=submit(s,enroll(s,c));fixtureFinish(s,r,null);s.app.campaigns.observe();const o=s.app.campaigns.observations(USER,c.id)[0];
 assert.equal(o.validation,'incomplete');assert.deepEqual(o.metrics,{});
}finally{s.close();}});
test('Campaign reconciles all completions even when event notifications are lost',()=>{const s=setup();try{
 const c=campaign(s),a=submit(s,enroll(s,c));const child=s.app.experiments.create(USER,s.project.id,{title:'candidate',parentId:s.baseline.id,config:{polynomialDegree:2,ridge:0.000001}});
 const b=submit(s,enroll(s,c,child));fixtureFinish(s,a,{mse:1});fixtureFinish(s,b,{mse:0.1});s.app.store.db.exec('DELETE FROM events');
 s.app.campaigns.observe();assert.equal(s.app.campaigns.observations(USER,c.id).length,2);
}finally{s.close();}});
test('Pausing/stopping Campaign does not cancel Run and still collects evidence',()=>{const s=setup();try{
 let c=campaign(s);const r=submit(s,enroll(s,c));c=s.app.campaigns.get(USER,c.id);c=s.app.campaigns.pause(USER,c.id,c.version);
 assert.equal(s.app.runs.get(USER,r.id).state,'queued');c=s.app.campaigns.stop(USER,c.id,{expectedVersion:c.version,reason:'用户停止探索'});
 fixtureFinish(s,r);s.app.campaigns.observe();assert.equal(c.state,'stopped');assert.equal(s.app.campaigns.observations(USER,c.id).length,1);
 assert.throws(()=>enroll(s,c),{code:'CAMPAIGN_NOT_ACTIVE'});
}finally{s.close();}});
test('Membership is idempotent but enforces scope, lineage and per-round cap',()=>{const s=setup();try{
 const c=campaign(s,{limits:{maxCandidatesPerRound:1}}),i=enroll(s,c);let current=s.app.campaigns.get(USER,c.id);
 const member=s.app.campaigns.enroll(USER,c.id,{intentId:i.id,expectedVersion:current.version});assert.equal(s.app.campaigns.members(USER,c.id).length,1);
 const child=s.app.experiments.create(USER,s.project.id,{title:'child',parentId:s.baseline.id});const ci=s.app.runs.prepare(USER,child.id);
 assert.throws(()=>s.app.campaigns.enroll(USER,c.id,{intentId:ci.id,expectedVersion:current.version}),{code:'CANDIDATE_LIMIT'});
 assert.ok(member.id);
}finally{s.close();}});
test('Changed metrics without matching original artifact are not accepted',()=>{const s=setup();try{
 const c=campaign(s),r=submit(s,enroll(s,c));const final=fixtureFinish(s,r);s.app.store.update('run',r.id,final.version,{metrics:{mse:-999}});
 s.app.campaigns.observe();assert.equal(s.app.campaigns.observations(USER,c.id)[0].validation,'invalid');
}finally{s.close();}});
test('Deadline limits are validated and stop new actions while preserving history',()=>{const s=setup();try{
 assert.ok(s.app.campaigns);assert.throws(()=>campaign(s,{limits:{deadline:'not-a-date'}}),{code:'INVALID_INPUT'});
 let c=campaign(s,{limits:{deadline:new Date(Date.now()+60000).toISOString()}});s.app.store.update('campaign',c.id,c.version,{limits:{...c.limits,deadline:'2000-01-01T00:00:00.000Z'}});s.app.campaigns.observe();
 assert.equal(s.app.campaigns.get(USER,c.id).state,'stopped');assert.match(s.app.campaigns.get(USER,c.id).stopReason,/截止/);
}finally{s.close();}});

test('Stopped campaign closes its decision round without marking its Run complete',()=>{const s=setup();try{
 const c=campaign(s),r=submit(s,enroll(s,c));const current=s.app.campaigns.get(USER,c.id);s.app.campaigns.stop(USER,c.id,{expectedVersion:current.version,reason:'stop'});assert.equal(s.app.campaigns.rounds(USER,c.id)[0].state,'closed');assert.equal(s.app.runs.get(USER,r.id).state,'queued');
}finally{s.close();}});
