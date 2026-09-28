import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setup,USER,approve} from '../support/research.mjs';
import {publicationFixture} from '../support/publication.mjs';
import {actor,result} from '../support/collaboration.mjs';
import {digest} from '../../dist/packages/storage/store.js';
import {REPORT_OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/report-schemas.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

const report=(s,resultId)=>{const a=s.app.reports.create(USER,s.project.id,{publicationResultIds:[resultId]});return s.app.store.list('report',s.project.id).find(r=>r.artifactId===a.id);};
const prepare=(s,resultId)=>{const p=s.app.projects.get(USER,s.project.id);if(!p.settings.enabled)s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});return s.app.publicationReviews.prepare(USER,s.project.id,{resultId,rootSessionId:s.session.id});};
function finish(s,r,verdict){approve(s.app,r.approvalId);s.app.teams.activate(USER,r.teamId);const c=s.app.teams.claim(r.teamId);assert.ok(c);s.app.teams.submit(actor(c),result({verdict,summary:`UNIT read-only review opinion: ${verdict}`,artifactIds:[r.artifactIds[0]],evidenceIds:r.requiredEvidenceIds}));return c;}

test('new reports freeze empty paper review sets and a newly linked review stales only new delivery',()=>{const s=setup();try{
 const f=publicationFixture(s.app,s.project.id),r=report(s,f.result.id),body=readFileSync(s.app.store.get('artifact',r.artifactId).path);
 const info=s.app.reports.inspect(USER,s.project.id,r.id);assert.deepEqual(info.publicationReviews,[{resultId:f.result.id,reviewIds:[],reviews:[]}]);validateSchema(REPORT_OUTPUT_SCHEMAS.report_inspect,info,'output');assert.match(body.toString(),/not-reviewed/);s.app.reports.collectExport(USER,s.project.id,r.id);
 const review=prepare(s,f.result.id);assert.equal(s.app.reports.inspect(USER,s.project.id,r.id).validity,'stale');assert.throws(()=>s.app.reports.collectExport(USER,s.project.id,r.id),{code:'REPORT_STALE'});assert.deepEqual(readFileSync(s.app.store.get('artifact',r.artifactId).path),body);
 const next=report(s,f.result.id),updated=s.app.reports.inspect(USER,s.project.id,next.id);assert.deepEqual(updated.publicationReviews[0].reviewIds,[review.id]);assert.equal(updated.publicationReviews[0].reviews[0].status,'awaiting_approval');s.app.reports.collectExport(USER,s.project.id,next.id);
 }finally{s.close();}});

test('paper verdicts export frozen exact results and original inputs without converting reject or disputed to passed',()=>{for(const verdict of ['accept','reject','disputed']){const s=setup();try{
 const f=publicationFixture(s.app,s.project.id),review=prepare(s,f.result.id),c=finish(s,review,verdict),r=report(s,f.result.id),info=s.app.reports.inspect(USER,s.project.id,r.id);validateSchema(REPORT_OUTPUT_SCHEMAS.report_inspect,info,'output');
 assert.equal(info.validity,'current');assert.equal(info.publicationReviews[0].reviews[0].status,{accept:'passed',reject:'rejected',disputed:'disputed'}[verdict]);
 const ref=info.references.find(x=>x.type==='publication-review'),frozen=JSON.parse(s.app.reports.readReference(USER,s.project.id,r.id,ref.id,0,64000).content);assert.equal(frozen.taskResult.result.verdict,verdict);assert.equal(frozen.taskResult.result.summary,`UNIT read-only review opinion: ${verdict}`);assert.equal(frozen.taskResult.attemptId,c.attempt.id);assert.equal(frozen.review.publicationResultId,f.result.id);
 const collection=s.app.reports.collectExport(USER,s.project.id,r.id);assert.equal(collection.manifest.bindings.publicationReviews[0].reviews[0].snapshotDigest,digest(frozen));assert.equal(collection.manifest.bindings.objects.find(o=>o.referenceId===ref.id).content,s.app.reports.readReference(USER,s.project.id,r.id,ref.id,0,64000).content);
 assert.deepEqual(collection.files.find(x=>x.path===`reviews/${review.id}.json`).bytes,Buffer.from(s.app.reports.readReference(USER,s.project.id,r.id,ref.id,0,64000).content));
 for(const a of frozen.artifacts){const packaged=collection.files.find(x=>x.path===`artifacts/${a.digest}`);assert.ok(packaged);assert.deepEqual(packaged.bytes,readFileSync(s.app.store.get('artifact',a.id).path));}
 const context=s.app.store.list('context-snapshot',s.project.id).find(x=>x.attemptId===c.attempt.id);s.app.store.update('context-snapshot',context.id,context.version,{inputDigest:context.inputDigest});assert.throws(()=>s.app.reports.assertExportCurrent(USER,s.project.id,r.id,collection.manifest.bindingsDigest,collection.manifest.stateDigest),{code:'REPORT_EXPORT_STALE'});
 const refreshed=s.app.reports.collectExport(USER,s.project.id,r.id),row=s.app.store.get('task-result',frozen.taskResult.id);s.app.store.update('task-result',row.id,row.version,{digest:'changed'});assert.equal(s.app.reports.inspect(USER,s.project.id,r.id).validity,'stale');assert.throws(()=>s.app.reports.assertExportCurrent(USER,s.project.id,r.id,refreshed.manifest.bindingsDigest,refreshed.manifest.stateDigest),{code:'REPORT_EXPORT_STALE'});assert.equal(JSON.parse(s.app.reports.readReference(USER,s.project.id,r.id,ref.id,0,64000).content).taskResult.result.verdict,verdict);
 }finally{s.close();}}});

test('legacy fixed reports without review sets retain compatibility',()=>{const s=setup();try{const f=publicationFixture(s.app,s.project.id),r=report(s,f.result.id);delete r.bindings.publicationReviews;const {artifactId,artifactDigest,title,formatVersion,runIds,claimIds,evidenceIds,references,runs,bindings}=r;s.app.store.update('report',r.id,r.version,{bindings,bindingsDigest:digest({artifactId,artifactDigest,title,formatVersion,runIds,claimIds,evidenceIds,references,runs,bindings})});prepare(s,f.result.id);const info=s.app.reports.inspect(USER,s.project.id,r.id);assert.equal(info.validity,'current');assert.equal(info.publicationReviews,undefined);s.app.reports.collectExport(USER,s.project.id,r.id);}finally{s.close();}});


test('a second opinion cannot be omitted and replacing a review during packing fences export',()=>{const s=setup();try{
 const f=publicationFixture(s.app,s.project.id),first=prepare(s,f.result.id);finish(s,first,'accept');const earlier=report(s,f.result.id),other=s.app.sessions.create(USER,s.project.id,{title:'Second independent opinion'}),second=s.app.publicationReviews.prepare(USER,s.project.id,{resultId:f.result.id,rootSessionId:other.id});finish(s,second,'reject');
 assert.equal(s.app.reports.inspect(USER,s.project.id,earlier.id).validity,'stale');assert.throws(()=>s.app.reports.create(USER,s.project.id,{publicationResultIds:[f.result.id],publicationReviewIds:[first.id]}),{code:'INVALID_INPUT'});const r=report(s,f.result.id),info=s.app.reports.inspect(USER,s.project.id,r.id);assert.deepEqual(info.publicationReviews[0].reviewIds,[first.id,second.id].sort());assert.deepEqual(info.publicationReviews[0].reviews.map(r=>r.status).sort(),['passed','rejected']);
 const collection=s.app.reports.collectExport(USER,s.project.id,r.id),row=s.app.store.get('publication-review',second.id);s.app.store.update('publication-review',row.id,row.version,{pdfDigest:'changed'});assert.throws(()=>s.app.reports.assertExportCurrent(USER,s.project.id,r.id,collection.manifest.bindingsDigest,collection.manifest.stateDigest),{code:'REPORT_EXPORT_STALE'});assert.equal(s.app.reports.inspect(USER,s.project.id,r.id).validity,'stale');
 }finally{s.close();}});
