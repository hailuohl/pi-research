import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve,campaign,fixtureFinish} from '../support/research.mjs';
import {publicationFixture} from '../support/publication.mjs';

// Service fixtures only: no runner, Docker, Host, network, or model is started.
function completed(s){
 const c=campaign(s),intent=s.app.runs.prepare(USER,s.baseline.id);
 const g=s.app.runGrants.prepare(USER,s.project.id,{sessionId:s.session.id,intentIds:[intent.id],maxRuns:1,expiresAt:new Date(Date.now()+3600000).toISOString()});
 approve(s.app,g.approvalId);s.app.runGrants.activate(USER,s.project.id,{grantId:g.id,expectedVersion:g.version});
 s.app.campaigns.enroll(USER,c.id,{expectedVersion:s.app.campaigns.get(USER,c.id).version,intentId:intent.id});
 const run=s.app.runs.submit(USER,intent.id);fixtureFinish(s,run);s.app.campaigns.observe();
 const stored=s.app.runs.get(USER,run.id),artifact=stored.artifactIds.map(id=>s.app.store.get('artifact',id)).find(a=>a.title==='predictions.csv');
 assert.ok(artifact);return {c,g,run:stored,artifact,observation:s.app.campaigns.observations(USER,c.id)[0]};
}
function revoke(s,g){const current=s.app.runGrants.inspect(USER,s.project.id,g.id);return s.app.runGrants.revoke(USER,s.project.id,{grantId:g.id,expectedVersion:current.version});}
function report(s,run){const artifact=s.app.reports.create(USER,s.project.id,{runIds:[run.id]});return s.app.store.list('report').find(r=>r.artifactId===artifact.id);}

test('RunGrant revocation makes direct report stale without damaging historical bytes or references',async()=>{
 const s=setup();try{
  const {g,run}=completed(s),r=report(s,run),before=s.app.reports.inspect(USER,s.project.id,r.id);
  assert.equal(before.validity,'current');assert.equal(before.integrity,'verified');
  const reference=before.references.find(ref=>ref.type==='run'),content=s.app.reports.readReference(USER,s.project.id,r.id,reference.id,0,64000),body=s.app.evidence.read(USER,r.artifactId).bytes;
  revoke(s,g);const after=s.app.reports.inspect(USER,s.project.id,r.id);
  assert.equal(after.validity,'stale');assert.equal(after.integrity,'verified');
  assert.throws(()=>report(s,run),{code:'RUN_GRANT_REVOKED'});
  await assert.rejects(s.app.exports.create(USER,s.project.id,{reportId:r.id},'new-after-run-grant-revocation'),{code:'REPORT_STALE'});
  assert.deepEqual(s.app.reports.readReference(USER,s.project.id,r.id,reference.id,0,64000),content);
  assert.deepEqual(s.app.evidence.read(USER,r.artifactId).bytes,body);
  assert.equal(s.app.runs.get(USER,run.id).state,'succeeded');
 }finally{s.close();}
});

test('revoked RunGrant data cannot enter a new development test or submit an already prepared test',()=>{
 const s=setup();try{
  const {g,artifact}=completed(s),privateSession=s.app.sessions.create(USER,s.project.id,{title:'Run data consumer'});
  s.app.sources.prepare(USER,s.project.id,privateSession.id,{experimentId:s.baseline.id,revision:1});
  const input={command:['python','main.py'],environmentImageDigest:'python@sha256:'+'a'.repeat(64),dataArtifactIds:[artifact.id]};
  const prepared=s.app.development.prepare(USER,s.project.id,privateSession.id,input);approve(s.app,prepared.grantId);
  const workingInput={developmentTaskId:prepared.id,editablePaths:['config.json'],maxTests:1,maxChangedBytes:4096,expiresAt:new Date(Date.now()+3600000).toISOString()},working=s.app.workingGrants.prepare(USER,s.project.id,workingInput);approve(s.app,working.approvalId);
  revoke(s,g);
  assert.throws(()=>s.app.development.prepare(USER,s.project.id,privateSession.id,input),{code:'RUN_GRANT_REVOKED'});
  assert.throws(()=>s.app.development.submit(USER,s.project.id,prepared.id),{code:'RUN_GRANT_REVOKED'});
  assert.equal(s.app.workingGrants.inspect(USER,s.project.id,working.id).validity,'stale');
  assert.throws(()=>s.app.workingGrants.activate(USER,s.project.id,{grantId:working.id,expectedVersion:working.version}),{code:'RUN_GRANT_REVOKED'});
  assert.throws(()=>s.app.workingGrants.prepare(USER,s.project.id,workingInput),{code:'RUN_GRANT_REVOKED'});
  assert.equal(s.app.store.list('sandbox-job').length,0);
  assert.equal(s.app.evidence.read(USER,artifact.id).artifact.digest,artifact.digest,'historical artifact remains readable');
 }finally{s.close();}
});

test('natural RunGrant expiry and later model changes preserve completed report and data authority',()=>{
 const s=setup(),clock=Date.now;try{
  const {g,run,artifact}=completed(s),r=report(s,run),session=s.app.sessions.get(USER,s.session.id);
  s.app.store.update('session',session.id,session.version,{model:{...session.model,model:'later-model-not-used-by-this-run'}});
  Date.now=()=>Date.parse(g.expiresAt)+1000;
  const inspection=s.app.reports.inspect(USER,s.project.id,r.id);assert.equal(inspection.validity,'current');assert.equal(inspection.integrity,'verified');s.app.reports.collectExport(USER,s.project.id,r.id);report(s,run);
  const privateSession=s.app.sessions.create(USER,s.project.id,{title:'After-expiry data consumer'});s.app.sources.prepare(USER,s.project.id,privateSession.id,{experimentId:s.baseline.id,revision:1});
  assert.ok(s.app.development.prepare(USER,s.project.id,privateSession.id,{command:['python','main.py'],environmentImageDigest:'python@sha256:'+'a'.repeat(64),dataArtifactIds:[artifact.id]}).id);
 }finally{Date.now=clock;s.close();}
});

test('revoked RunGrant blocks observation decisions, comparison metrics and manuscript source reuse',()=>{
 const s=setup();try{
  const {c,g,artifact,observation}=completed(s),publication=publicationFixture(s.app,s.project.id,{files:[{path:'predictions.csv',artifactId:artifact.id}]});
  assert.equal(s.app.researchPlans.comparison(USER,s.project.id,{campaignId:c.id}).results[0].validation,'verified');
  revoke(s,g);
  assert.throws(()=>s.app.campaigns.verifyObservation(s.app.campaigns.get(USER,c.id),observation.id),{code:'RUN_GRANT_REVOKED'});
  const comparison=s.app.researchPlans.comparison(USER,s.project.id,{campaignId:c.id});assert.equal(comparison.results[0].validation,'invalid');assert.deepEqual(comparison.results[0].metrics,{});
  assert.throws(()=>s.app.publicationBuilds.prepare(USER,s.project.id,{revisionId:publication.revision.id}),{code:'RUN_GRANT_REVOKED'});
  assert.throws(()=>s.app.publicationBuilds.createRevision(USER,s.project.id,{title:'Must not reuse revoked input',engine:'pdflatex',mainFile:'main.tex',bibliography:'none',files:[{path:'main.tex',contentBase64:Buffer.from('UNIT text').toString('base64')},{path:'data.csv',artifactId:artifact.id}]}),{code:'RUN_GRANT_REVOKED'});
 }finally{s.close();}
});
