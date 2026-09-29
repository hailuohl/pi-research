import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setup,campaign,enroll,submit,fixtureFinish,approve,USER} from '../support/research.mjs';
import {REPORT_OUTPUT_SCHEMAS,REPORT_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/report-schemas.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {digest} from '../../dist/packages/storage/store.js';
function planned(s){
 const c=campaign(s),run=submit(s,enroll(s,c));fixtureFinish(s,run);s.app.campaigns.observe();const observation=s.app.campaigns.observations(USER,c.id)[0];
 const d=s.app.decisions.propose(USER,c.id,{expectedVersion:s.app.campaigns.get(USER,c.id).version,action:'refill',reason:'UNIT fixed bounded plan',observationIds:[observation.id],candidates:[{title:'one candidate',hypothesis:'controlled comparison',implementation:'config',config:{polynomialDegree:2}}],experimentPlan:{hypothesis:'UNIT hypothesis remains unproven',controlRunIds:[run.id],changedFactors:['polynomialDegree'],dataSplit:'UNIT fixed template split',dataArtifactIds:[],primaryMetric:'mse',guardrailMetrics:['r2'],repetitions:{count:1,rationale:'unit fixture only'},successCriteria:'declared improvement',inconclusiveCriteria:'insufficient evidence',stoppingCriteria:'bounded attempts'}});
 approve(s.app,d.approvalId);const decision=s.app.decisions.apply(USER,d.id,d.version);return {c,run,decision};
}
function create(s,c){const artifact=s.app.reports.create(USER,s.project.id,{campaignIds:[c.id]});return s.app.store.list('report',s.project.id).find(r=>r.artifactId===artifact.id);}
test('research reports freeze plans, decisions, real units and exact export reference bytes without inferring success',()=>{const s=setup();try{
 const {c,run,decision}=planned(s),r=create(s,c),info=s.app.reports.inspect(USER,s.project.id,r.id);validateSchema(REPORT_OUTPUT_SCHEMAS.report_inspect,info,'output');assert.equal(info.validity,'current');assert.deepEqual(r.runIds,[run.id]);assert.equal(info.researchCampaigns[0].conclusion,'requires_review');assert.equal(info.researchCampaigns[0].unit,s.baseline.contract.metrics.mse.unit);
 const group=r.bindings.researchCampaigns[0],comparison=s.app.reports.readReference(USER,s.project.id,r.id,group.referenceId,0,64000),frozen=JSON.parse(comparison.content);assert.equal(frozen.decisions[0].id,decision.id);assert.equal(frozen.plans[0].plan.id,decision.planRevisionId);assert.equal(frozen.plans[0].candidates.length,1);assert.equal(group.snapshotDigest,digest(frozen));
 const collection=s.app.reports.collectExport(USER,s.project.id,r.id);assert.deepEqual(collection.files.find(f=>f.path===`research/${c.id}.json`).bytes,Buffer.from(comparison.content));const plan=group.planReferences[0],content=s.app.reports.readReference(USER,s.project.id,r.id,plan.referenceId,0,64000).content;assert.deepEqual(collection.files.find(f=>f.path===`plans/${plan.planRevisionId}.json`).bytes,Buffer.from(content));
 const body=readFileSync(s.app.store.paths.physical(s.app.store.get('artifact',r.artifactId).path));assert.match(body.toString(),/requires_review/);assert.match(body.toString(),/不自动判定科学成功/);
 const current=s.app.campaigns.get(USER,c.id);s.app.campaigns.stop(USER,c.id,{expectedVersion:current.version,reason:'user stops bounded study'});
 assert.equal(s.app.reports.inspect(USER,s.project.id,r.id).validity,'stale');assert.throws(()=>s.app.reports.collectExport(USER,s.project.id,r.id),{code:'REPORT_STALE'});assert.throws(()=>s.app.reports.assertExportCurrent(USER,s.project.id,r.id,collection.manifest.bindingsDigest,collection.manifest.stateDigest),{code:'REPORT_EXPORT_STALE'});assert.deepEqual(readFileSync(s.app.store.paths.physical(s.app.store.get('artifact',r.artifactId).path)),body);assert.equal(s.app.reports.readReference(USER,s.project.id,r.id,group.referenceId,0,64000).content,comparison.content);
 }finally{s.close();}});
test('revoked plan approval prevents new research reports and exports; campaign count rejects instead of truncating',()=>{const s=setup();try{
 const {c,decision}=planned(s),r=create(s,c),a=s.app.store.get('approval',decision.approvalId);s.app.store.update('approval',a.id,a.version,{status:'rejected'});assert.equal(s.app.reports.inspect(USER,s.project.id,r.id).validity,'stale');assert.throws(()=>create(s,c));assert.throws(()=>s.app.reports.collectExport(USER,s.project.id,r.id),{code:'REPORT_STALE'});
 assert.throws(()=>s.app.reports.create(USER,s.project.id,{campaignIds:Array.from({length:6},(_,i)=>`c${i}`)}));assert.throws(()=>validateSchema(REPORT_INPUT_SCHEMAS.report_create,{campaignIds:Array.from({length:6},(_,i)=>`c${i}`)},'input'));
 }finally{s.close();}});
test('research report automatically includes failed candidate without fabricating metrics',()=>{const s=setup();try{
 const {c,decision}=planned(s),intent=s.app.store.get('run-intent',decision.effects.intentIds[0]),failed=submit(s,intent);fixtureFinish(s,failed,null,'failed');s.app.campaigns.observe();const r=create(s,c),info=s.app.reports.inspect(USER,s.project.id,r.id),row=info.runs.find(run=>run.runId===failed.id);assert.ok(row);assert.equal(row.state,'failed');assert.deepEqual(row.metrics,[]);assert.equal(info.researchCampaigns[0].conclusion,'requires_review');const snapshot=r.bindings.researchCampaigns[0].snapshot;assert.equal(snapshot.results.find(result=>result.runId===failed.id).validation,'incomplete');s.app.reports.collectExport(USER,s.project.id,r.id);
 }finally{s.close();}});
