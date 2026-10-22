import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,rmSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,submit,fixtureFinish,approve,campaign,enroll} from '../support/research.mjs';
import {readRoute} from '../../dist/apps/server/routes.js';
import {digest} from '../../dist/packages/storage/store.js';
import {assertRunGrantRun} from '../../dist/packages/policy/run-grant-validation.js';

function fixed(s){
 const prepared=s.app.runs.prepare(USER,s.baseline.id),intent=s.app.store.update('run-intent',prepared.id,prepared.version,{rootSessionId:s.session.id});
 const queued=submit(s,intent);return fixtureFinish(s,queued);
}
function read(s,r,extra={}){const query=new URLSearchParams({kind:'run',id:r.id,sessionId:s.session.id,manifestDigest:r.manifestDigest,sourceDigest:r.manifest.snapshotDigest,...extra});return readRoute(s.app,{},`/projects/${s.project.id}/validation`,new URL('http://local/?'+query));}

test('current applicability respects the original campaign decision approval without rewriting the successful receipt',()=>{
 const s=setup();try{
  const c=campaign(s),control=fixtureFinish(s,submit(s,enroll(s,c)));s.app.campaigns.observe();const observation=s.app.campaigns.observations(USER,c.id)[0];
  const d=s.app.decisions.propose(USER,c.id,{expectedVersion:s.app.campaigns.get(USER,c.id).version,action:'refill',reason:'UNIT fixed software comparison',observationIds:[observation.id],candidates:[{title:'candidate',hypothesis:'controlled factor change',implementation:'config',config:{polynomialDegree:3}}],experimentPlan:{hypothesis:'Controlled software regression',controlRunIds:[control.id],changedFactors:['polynomialDegree'],dataSplit:'Same fixed example dataset and holdout split',dataArtifactIds:[],primaryMetric:'mse',guardrailMetrics:['r2'],repetitions:{count:1,rationale:'Deterministic software acceptance only'},successCriteria:'Review actual held-out error',inconclusiveCriteria:'Missing output or unverified evidence',stoppingCriteria:'Stop after the approved comparison'}});approve(s.app,d.approvalId);const applied=s.app.decisions.apply(USER,d.id,d.version),r=fixtureFinish(s,submit(s,s.app.store.get('run-intent',applied.effects.intentIds[0]))),before=JSON.stringify(r);
  assert.equal(read(s,r).applicability,'current');s.app.approvals.stale(d.id);assert.throws(()=>s.app.researchPlans.assertRunSource(r.experimentId,'execute',r.intentId),{code:'APPROVAL_STALE'});const result=read(s,r);assert.equal(result.receiptCheck,'pass');assert.equal(result.applicability,'stale');assert.equal(result.applicabilityReason,'APPROVAL_STALE');assert.equal(JSON.stringify(s.app.store.get('run',r.id)),before);
 }finally{s.close();}
});
test('permanent RunGrant identity corruption fails while revoked authority only withdraws current applicability',()=>{
 const s=setup();try{
  const intent=s.app.runs.prepare(USER,s.baseline.id,s.session.id),g=s.app.runGrants.prepare(USER,s.project.id,{sessionId:s.session.id,intentIds:[intent.id],maxRuns:1,expiresAt:new Date(Date.now()+60000).toISOString()});approve(s.app,g.approvalId);s.app.runGrants.activate(USER,s.project.id,{grantId:g.id,expectedVersion:g.version});const r=fixtureFinish(s,s.app.runs.submit(USER,intent.id)),before=JSON.stringify(r),use=s.app.store.list('run-grant-use',s.project.id)[0];assert.doesNotThrow(()=>assertRunGrantRun(s.app.store,r,false));assert.equal(read(s,r).applicability,'current');
  const bad=s.app.store.update('run-grant-use',use.id,use.version,{runId:'different-permanent-run'});const corrupted=read(s,r);assert.equal(corrupted.receiptCheck,'fail');assert.equal(corrupted.receiptReason,'RUN_GRANT_USE_MISMATCH');assert.equal(corrupted.applicability,'unknown');
  s.app.store.update('run-grant-use',use.id,bad.version,{runId:r.id});const active=s.app.store.get('run-grant',g.id);s.app.runGrants.revoke(USER,s.project.id,{grantId:g.id,expectedVersion:active.version});const revoked=read(s,r);assert.equal(revoked.receiptCheck,'pass');assert.equal(revoked.applicability,'stale');assert.equal(revoked.applicabilityReason,'RUN_GRANT_REVOKED');assert.equal(s.app.store.list('run-grant-use',s.project.id).length,1);assert.equal(JSON.stringify(s.app.store.get('run',r.id)),before);
 }finally{s.close();}
});

test('selected original Run is fully checked on demand, source edits become stale without changing history',()=>{
 const s=setup();try{const r=fixed(s),before=JSON.stringify(s.app.store.get('run',r.id)),count=s.app.store.list('run').length;
  const result=read(s,r);assert.equal(result.receiptCheck,'pass');assert.equal(result.applicability,'current');assert.equal(result.observedSourceDigest,r.manifest.snapshotDigest);assert.equal(result.id,r.id);assert.equal(result.receipt.state,'succeeded');assert.equal(result.receipt.exitCode,0);
  writeFileSync(join(s.app.store.paths.physical(s.baseline.workspace),'changed.txt'),'changed');const stale=read(s,r);assert.equal(stale.receiptCheck,'pass');assert.equal(stale.applicability,'stale');assert.notEqual(stale.observedSourceDigest,r.manifest.snapshotDigest);assert.equal(stale.applicabilityReason,'SOURCE_CHANGED');assert.equal(JSON.stringify(s.app.store.get('run',r.id)),before);assert.equal(s.app.store.list('run').length,count);
  rmSync(s.app.store.paths.physical(s.baseline.workspace),{recursive:true,force:true});const missing=read(s,r);assert.equal(missing.receiptCheck,'pass');assert.equal(missing.applicability,'unknown');
 }finally{s.close();}
});
test('validation enforces exact route, expected identity and session before touching archive bytes',()=>{
 const s=setup();try{const r=fixed(s);assert.throws(()=>read(s,r,{sessionId:'other'}));assert.throws(()=>read(s,r,{manifestDigest:'a'.repeat(64)}));assert.throws(()=>read(s,r,{path:'secret'}),{code:'INVALID_INPUT'});
 const query=new URLSearchParams({kind:'run',id:r.id,sessionId:s.session.id,manifestDigest:r.manifestDigest,sourceDigest:r.manifest.snapshotDigest});query.append('id',r.id);assert.throws(()=>readRoute(s.app,{},`/projects/${s.project.id}/validation`,new URL('http://local/?'+query)),{code:'INVALID_INPUT'});assert.throws(()=>readRoute(s.app,{},`/projects/${s.project.id}/validation/extra`,new URL('http://local/?'+query)),{code:'INVALID_INPUT'});
 }finally{s.close();}
});
test('corrupt immutable archive fails the receipt and cannot be reused even when current source matches',()=>{
 const s=setup();try{const r=fixed(s),a=s.app.store.get('artifact',r.artifactIds[0]);s.app.store.update('artifact',a.id,a.version,{digest:'f'.repeat(64)});const result=read(s,r);assert.equal(result.receiptCheck,'fail');assert.equal(result.applicability,'unknown');assert.equal(result.receipt.state,r.state);writeFileSync(join(s.app.store.paths.physical(s.baseline.workspace),'changed.txt'),'changed');const both=read(s,r);assert.equal(both.receiptCheck,'fail');assert.equal(both.applicability,'unknown');
 }finally{s.close();}
});
test('an absent fixed CAS file is unknown while present byte corruption fails',()=>{
 for(const scenario of ['missing','changed']){const s=setup();try{const r=fixed(s),file=r.manifest.sourceFiles[0],path=join(s.app.store.paths.physical(r.manifest.snapshotPath),file.path);chmodSync(path,0o600);if(scenario==='missing')rmSync(path);else writeFileSync(path,'corrupt snapshot');const result=read(s,r);assert.equal(result.receiptCheck,scenario==='missing'?'unknown':'fail');assert.equal(result.applicability,'unknown');}finally{s.close();}}
});
test('original failed execution is preserved without claiming its archive was checked by the success validator',()=>{
 const s=setup();try{const r=fixed(s),failed=s.app.store.update('run',r.id,r.version,{state:'failed',exitCode:1});let reads=0;s.app.evidence.read=()=>{reads++;throw Error('must not validate failed archive as success');};const result=read(s,failed);assert.equal(result.receiptCheck,'not_run');assert.equal(result.receipt.state,'failed');assert.equal(result.receipt.exitCode,1);assert.equal(reads,0);assert.equal(result.applicability,'unknown');}finally{s.close();}
});
test('an intact owner binding with a corrupt original intent manifest returns a failed receipt check',()=>{
 const s=setup();try{const r=fixed(s),intent=s.app.store.get('run-intent',r.intentId);s.app.store.update('run-intent',intent.id,intent.version,{manifest:{...intent.manifest,createdAt:'tampered'}});const result=read(s,r);assert.equal(result.receiptCheck,'fail');assert.equal(result.receiptReason,'MANIFEST_CORRUPTED');assert.equal(result.applicability,'unknown');assert.equal(result.id,r.id);}finally{s.close();}
});
test('method identity is verified and cannot be promoted from a successful execution record alone',()=>{
 const s=setup();try{const original=fixed(s),manifest={...original.manifest,methodContractDigest:'f'.repeat(64)},manifestDigest=digest(manifest),intent=s.app.store.get('run-intent',original.intentId);s.app.store.update('run-intent',intent.id,intent.version,{manifest,manifestDigest});const r=s.app.store.update('run',original.id,original.version,{manifest,manifestDigest}),result=read(s,r);assert.equal(result.receiptCheck,'fail');assert.equal(result.receiptReason,'METHOD_CONTRACT_CORRUPTED');assert.equal(result.applicability,'unknown');}finally{s.close();}
});
test('legacy snapshots compare original bytes without modes while mixed snapshots keep mode differences',()=>{
 for(const legacy of [true,false]){const s=setup();try{const original=fixed(s);assert.ok(original.manifest.sourceFiles.length>1);const sourceFiles=original.manifest.sourceFiles.map(({mode,...file},i)=>legacy||i===0?file:{...file,mode}),manifest={...original.manifest,sourceFiles,snapshotDigest:digest(sourceFiles)},manifestDigest=digest(manifest),intent=s.app.store.get('run-intent',original.intentId),approval=s.app.store.get('approval',intent.approvalId);s.app.store.update('run-intent',intent.id,intent.version,{manifest,manifestDigest});s.app.store.update('approval',approval.id,approval.version,{digest:manifestDigest});const r=s.app.store.update('run',original.id,original.version,{manifest,manifestDigest}),result=read(s,r);assert.equal(result.receiptCheck,'pass');assert.equal(result.applicability,legacy?'current':'stale');}finally{s.close();}}
});
test('development fixture checks the old archive once and keeps its successful receipt after current workspace edits',()=>{
 const s=setup();try{
  // Controlled host archive fixture; no Docker container or candidate process runs.
  const root=s.app.store.paths.physical(s.session.workspace);writeFileSync(join(root,'check.py'),'# unit fixture\n');
  const t=s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','check.py'],environmentImageDigest:'python@sha256:'+'a'.repeat(64),expectedArtifacts:['result.txt']});approve(s.app,t.grantId);const j=s.app.development.submit(USER,s.project.id,t.id),row=s.app.store.get('sandbox-job',j.id);writeFileSync(join(s.app.store.paths.physical(row.outputDir),'result.txt'),'unit output');const done=s.app.development.finalize(j.id,{state:'succeeded',exitCode:0});assert.equal(done.state,'succeeded');
  const query={kind:'development-job',id:j.id,sessionId:s.session.id,manifestDigest:done.manifestDigest,sourceDigest:done.sourceDigest},check=()=>readRoute(s.app,{},`/projects/${s.project.id}/validation`,new URL('http://local/?'+new URLSearchParams(query))),before=JSON.stringify(done);let completeChecks=0;const original=s.app.development.assertResultMatches.bind(s.app.development);s.app.development.assertResultMatches=(...args)=>{completeChecks++;return original(...args);};
  assert.equal(check().receiptCheck,'pass');assert.equal(completeChecks,1);writeFileSync(join(root,'check.py'),'# edited source\n');const stale=check();assert.equal(stale.receiptCheck,'pass');assert.equal(stale.applicability,'stale');assert.equal(completeChecks,2);assert.equal(JSON.stringify(s.app.store.get('sandbox-job',j.id)),before);
  const a=s.app.store.get('artifact',done.reportArtifactId),bad=s.app.store.update('artifact',a.id,a.version,{digest:'f'.repeat(64)});assert.equal(check().receiptCheck,'fail');s.app.store.update('artifact',a.id,bad.version,{digest:a.digest});const snapshotFile=join(s.app.store.paths.physical(done.manifest.inputSnapshot.path),done.manifest.inputSnapshot.files[0].path);chmodSync(snapshotFile,0o600);rmSync(snapshotFile);assert.equal(check().receiptCheck,'unknown');
 }finally{s.close();}
});
