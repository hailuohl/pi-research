import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,campaign,enroll,submit,fixtureFinish,approve,USER} from '../support/research.mjs';
const candidate=(degree=2)=>({title:`degree ${degree}`,hypothesis:'比较固定协议下的拟合误差',config:{polynomialDegree:degree,ridge:0.000001}});
function observed(s,options={}){const c=campaign(s,options),i=enroll(s,c),r=submit(s,i);fixtureFinish(s,r);s.app.campaigns.observe();return {c:s.app.campaigns.get(USER,c.id),r,o:s.app.campaigns.observations(USER,c.id)[0]};}
function propose(s,c,o,action,extra={}){assert.ok(s.app.decisions,'missing Decision service');return s.app.decisions.propose(USER,c.id,{expectedVersion:s.app.campaigns.get(USER,c.id).version,action,observationIds:[o.id],reason:'基于已核验的运行证据提出下一步，不将测试解释成科研结论',...extra});}
function apply(s,d){approve(s.app,d.approvalId);return s.app.decisions.apply(USER,d.id,d.version);}

test('Decision service exists and never substitutes for formal Run approval',()=>{const s=setup();try{
 const {c,o}=observed(s);const d=propose(s,c,o,'refill',{candidates:[candidate()]});
 assert.throws(()=>s.app.decisions.apply(USER,d.id,d.version),{code:'APPROVAL_REQUIRED'});
 const done=apply(s,d);assert.equal(done.status,'applied');assert.equal(done.effects.intentIds.length,1);
 assert.throws(()=>s.app.runs.submit(USER,done.effects.intentIds[0]),{code:'APPROVAL_REQUIRED'});
}finally{s.close();}});
test('Refill creates siblings under current focus and applying twice is idempotent',()=>{const s=setup();try{
 const {c,o}=observed(s);const d=propose(s,c,o,'refill',{candidates:[candidate(2),candidate(3)]});const done=apply(s,d);
 assert.deepEqual(s.app.decisions.apply(USER,d.id,d.version).effects,done.effects);
 const children=done.effects.experimentIds.map(id=>s.app.experiments.get(USER,id));assert.ok(children.every(e=>e.parentId===s.baseline.id));
 assert.equal(s.app.campaigns.members(USER,c.id).length,3);assert.equal(s.app.store.list('campaign-decision').length,1);
}finally{s.close();}});
test('Changed membership makes an already approved decision stale',()=>{const s=setup();try{
 const {c,o}=observed(s);const d=propose(s,c,o,'refill',{candidates:[candidate()]});approve(s.app,d.approvalId);
 const e=s.app.experiments.create(USER,s.project.id,{title:'another',parentId:s.baseline.id});enroll(s,c,e);
 assert.throws(()=>s.app.decisions.apply(USER,d.id,d.version),{code:'APPROVAL_STALE'});
 assert.equal(s.app.store.list('experiment').length,2);
}finally{s.close();}});
test('Pausing after decision approval prevents effects',()=>{const s=setup();try{
 const {c,o}=observed(s);const d=propose(s,c,o,'refill',{candidates:[candidate()]});approve(s.app,d.approvalId);s.app.campaigns.pause(USER,c.id,c.version);
 assert.throws(()=>s.app.decisions.apply(USER,d.id,d.version),{code:'CAMPAIGN_NOT_ACTIVE'});
}finally{s.close();}});
test('Promote cannot pass required prepared/running candidates',()=>{const s=setup();try{
 const {c,o,r}=observed(s);const e=s.app.experiments.create(USER,s.project.id,{title:'unfinished',parentId:s.baseline.id});enroll(s,c,e);
 assert.throws(()=>propose(s,c,o,'promote',{selectedRunId:r.id}),{code:'ROUND_INCOMPLETE'});
}finally{s.close();}});
test('Promotion uses selected measured experiment as next round parent',()=>{const s=setup();try{
 const {c,o}=observed(s);const d=apply(s,propose(s,c,o,'refill',{candidates:[candidate()]}));const i=s.app.store.get('run-intent',d.effects.intentIds[0]);const r=submit(s,i);fixtureFinish(s,r,{mse:0.01});s.app.campaigns.observe();
 const observation=s.app.campaigns.observations(USER,c.id).find(x=>x.runId===r.id);
 const promoted=apply(s,propose(s,c,observation,'promote',{selectedRunId:r.id,candidates:[candidate(3)]}));
 const next=s.app.campaigns.get(USER,c.id);assert.equal(next.roundNumber,2);assert.equal(next.focusExperimentId,r.experimentId);
 assert.equal(s.app.campaigns.rounds(USER,c.id)[0].state,'closed');assert.equal(s.app.experiments.get(USER,promoted.effects.experimentIds[0]).parentId,r.experimentId);
}finally{s.close();}});
test('Repair is refused for a measured result even if model asks for it',()=>{const s=setup();try{
 const {c,o}=observed(s);assert.throws(()=>propose(s,c,o,'repair'),{code:'RESULT_ALREADY_ANSWERED'});
}finally{s.close();}});
test('Approved Repair grants one bounded same-node attempt, not permission to overwrite results',()=>{const s=setup();try{
 const c=campaign(s),r=submit(s,enroll(s,c));fixtureFinish(s,r,null,'failed');const failed=s.app.runs.get(USER,r.id);s.app.runs.reviewOutcome(USER,r.id,{expectedVersion:failed.version,disposition:'unanswered',reason:'Explicit test fixture failed before measurement; not a model judgment'});s.app.campaigns.observe();const o=s.app.campaigns.observations(USER,c.id)[0];
 const d=apply(s,propose(s,c,o,'repair'));const intent=s.app.runs.prepare(USER,s.baseline.id);let current=s.app.campaigns.get(USER,c.id);
 s.app.campaigns.enroll(USER,c.id,{intentId:intent.id,repairDecisionId:d.id,expectedVersion:current.version});
 const another=s.app.runs.prepare(USER,s.baseline.id);current=s.app.campaigns.get(USER,c.id);
 assert.throws(()=>s.app.campaigns.enroll(USER,c.id,{intentId:another.id,repairDecisionId:d.id,expectedVersion:current.version}),{code:'REPAIR_APPROVAL_REQUIRED'});
 assert.throws(()=>s.app.runs.submit(USER,intent.id),{code:'APPROVAL_REQUIRED'});
}finally{s.close();}});
test('Repair ceiling stops endless attempts',()=>{const s=setup();try{
 const c=campaign(s,{limits:{maxUnansweredRunsPerNode:1}}),r=submit(s,enroll(s,c));fixtureFinish(s,r,null,'failed');const failed=s.app.runs.get(USER,r.id);s.app.runs.reviewOutcome(USER,r.id,{expectedVersion:failed.version,disposition:'unanswered',reason:'Explicit test fixture failed before measurement; not a model judgment'});s.app.campaigns.observe();
 assert.throws(()=>propose(s,c,s.app.campaigns.observations(USER,c.id)[0],'repair'),{code:'REPAIR_LIMIT'});
}finally{s.close();}});
test('Round and candidate limits are checked before creating drafts',()=>{const s=setup();try{
 const {c,o,r}=observed(s,{limits:{maxRounds:1,maxCandidatesPerRound:1}});
 assert.throws(()=>propose(s,c,o,'promote',{selectedRunId:r.id}),{code:'ROUND_LIMIT'});
 assert.throws(()=>propose(s,c,o,'refill',{candidates:[candidate()]}),{code:'CANDIDATE_LIMIT'});
 assert.equal(s.app.store.list('experiment').length,1);
}finally{s.close();}});
test('Stop decision retains active Run and makes no fabricated summary',()=>{const s=setup();try{
 const {c,o}=observed(s),e=s.app.experiments.create(USER,s.project.id,{title:'running',parentId:s.baseline.id});const r=submit(s,enroll(s,c,e));
 const d=apply(s,propose(s,c,o,'stop'));assert.equal(d.effects.stopped,true);assert.equal(s.app.runs.get(USER,r.id).state,'queued');
 assert.equal(s.app.sessions.messages(USER,s.session.id).filter(m=>m.role==='assistant').length,0);
}finally{s.close();}});
test('Agent can propose but cannot approve/apply or use another campaign root',()=>{const s=setup();try{
 const {c,o}=observed(s);const actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator'};
 assert.ok(s.app.decisions);const d=s.app.decisions.propose(actor,c.id,{expectedVersion:c.version,action:'stop',observationIds:[o.id],reason:'达到停止条件'});
 assert.throws(()=>s.app.decisions.apply(actor,d.id,d.version),{code:'PERMISSION_DENIED'});
 assert.throws(()=>s.app.decisions.propose({...actor,sessionId:'other'},c.id,{expectedVersion:c.version,action:'stop',observationIds:[o.id],reason:'x'}),{code:'PERMISSION_DENIED'});
}finally{s.close();}});
test('Tampered result or evidence after proposal invalidates application',()=>{const s=setup();try{
 const {c,o,r}=observed(s);const d=propose(s,c,o,'promote',{selectedRunId:r.id});approve(s.app,d.approvalId);
 const current=s.app.runs.get(USER,r.id);s.app.store.update('run',r.id,current.version,{metrics:{...current.metrics,mse:99}});
 assert.throws(()=>s.app.decisions.apply(USER,d.id,d.version),{code:'APPROVAL_STALE'});
}finally{s.close();}});
