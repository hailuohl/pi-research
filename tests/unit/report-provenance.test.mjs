import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve,fixtureFinish} from '../support/research.mjs';
import {acceptedSource,actor,result} from '../support/collaboration.mjs';
import {digest} from '../../dist/packages/storage/store.js';
const physical=(s,reference)=>s.app.store.paths.physical(reference);

function finished(s,experiment=s.baseline){const i=s.app.runs.prepare(USER,experiment.id);approve(s.app,i.approvalId);return fixtureFinish(s,s.app.runs.submit(USER,i.id));}
function report(s,input){const artifact=s.app.reports.create(USER,s.project.id,input),record=s.app.store.list('report',s.project.id).find(r=>r.artifactId===artifact.id);return {artifact,record};}
function reviewedChild(s){
 s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});writeFileSync(join(physical(s,s.session.workspace),'config.json'),JSON.stringify({polynomialDegree:2,ridge:0.000001}));
 const task=s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','-c','assert True'],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`});approve(s.app,task.grantId);const dto=s.app.development.submit(USER,s.project.id,task.id),j=s.app.store.get('sandbox-job',dto.id),controlDir=physical(s,j.controlDir);writeFileSync(join(controlDir,'stdout.log'),'UNIT FIXTURE: successful test');writeFileSync(join(controlDir,'stderr.log'),'');const job=s.app.development.finalize(j.id,{state:'succeeded',exitCode:0});
 const p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});const review=s.app.developmentReviews.prepare(USER,s.project.id,{jobId:job.id});approve(s.app,review.approvalId);s.app.teams.activate(USER,review.teamId);const c=s.app.teams.claim(review.teamId);assert.ok(c);s.app.teams.submit(actor(c),result({verdict:'accept',evidenceIds:review.requiredEvidenceIds}));
 const proposal=s.app.changes.prepareReviewed(USER,s.project.id,{reviewId:review.id,title:'Reviewed fixture',hypothesis:'Unit fixture evidence'});approve(s.app,proposal.approvalId);const child=s.app.changes.apply(USER,proposal.id);return {child,job,review,proposal,reviewer:c};
}

test('reports freeze typed Run, source and metric references and export only immutable bytes',()=>{
 const s=setup();try{const run=finished(s),{artifact,record}=report(s,{runIds:[run.id]}),info=s.app.reports.inspect(USER,s.project.id,record.id);assert.equal(info.formatVersion,1);assert.equal(info.integrity,'verified');assert.equal(info.validity,'current');
  const metric=info.runs[0].metrics.find(m=>m.name==='mse'),evidence=s.app.reports.readReference(USER,s.project.id,record.id,metric.referenceId);assert.equal(evidence.reference.type,'evidence');assert.equal(JSON.parse(evidence.content).runId,run.id);
  const source=info.references.find(r=>r.type==='run-source'&&r.path==='config.json'),before=s.app.reports.readReference(USER,s.project.id,record.id,source.id);writeFileSync(join(physical(s,s.baseline.workspace),'config.json'),'new mutable version');writeFileSync(join(physical(s,s.session.workspace),'private.txt'),'not approved');
  assert.equal(s.app.reports.readReference(USER,s.project.id,record.id,source.id).content,before.content);const a=s.app.reports.collectExport(USER,s.project.id,record.id),b=s.app.reports.collectExport(USER,s.project.id,record.id);assert.equal(digest(a.manifest),digest(b.manifest));
  assert.ok(a.files.some(f=>f.path===`sources/${run.manifest.snapshotDigest}/config.json`&&f.bytes.toString()===before.content));assert.ok(!a.files.some(f=>f.path.includes('private.txt')));assert.ok(!JSON.stringify(a.manifest).includes(s.dir.replaceAll('\\','\\\\')));
  assert.match(a.files.find(f=>f.path==='report.md').bytes.toString(),/生成时间：\d{4}-/);assert.equal(digest(a.files.find(f=>f.path==='report.md').bytes),artifact.digest);
  s.app.reports.assertExportCurrent(USER,s.project.id,record.id,a.manifest.bindingsDigest,a.manifest.stateDigest);
  const project=s.app.store.get('project',s.project.id);s.app.store.update('project',project.id,project.version,{description:'changed while packing'});assert.throws(()=>s.app.reports.assertExportCurrent(USER,s.project.id,record.id,a.manifest.bindingsDigest,a.manifest.stateDigest),{code:'REPORT_EXPORT_STALE'});
 }finally{s.close();}
});

test('typed report references deny other projects, agents, injected URLs and invalid ranges',()=>{
 const s=setup();try{const run=finished(s),{record}=report(s,{runIds:[run.id]}),info=s.app.reports.inspect(USER,s.project.id,record.id),ref=info.references.find(r=>r.type==='run-source');
  const other=s.app.projects.create(USER,{name:'Other'});assert.throws(()=>s.app.reports.inspect(USER,other.id,record.id),{code:'SCOPE_DENIED'});assert.throws(()=>s.app.reports.collectExport({type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator'},s.project.id,record.id),{code:'PERMISSION_DENIED'});
  for(const id of ['javascript:alert(1)','../../private','https://example.invalid'])assert.throws(()=>s.app.reports.readReference(USER,s.project.id,record.id,id),{code:'NOT_FOUND'});
  assert.throws(()=>s.app.reports.readReference(USER,s.project.id,record.id,ref.id,-1),{code:'INVALID_INPUT'});assert.throws(()=>s.app.reports.readReference(USER,s.project.id,record.id,ref.id,0,64001),{code:'INVALID_INPUT'});
  const tampered=s.app.store.get('report',record.id);s.app.store.update('report',record.id,tampered.version,{references:[{...ref,targetId:'forged'}]});const invalid=s.app.reports.inspect(USER,s.project.id,record.id);assert.equal(invalid.integrity,'invalid');assert.deepEqual(invalid.references,[]);assert.throws(()=>s.app.reports.readReference(USER,s.project.id,record.id,ref.id),{code:'REPORT_BINDING_INVALID'});
 }finally{s.close();}
});

test('source review withdrawal keeps report and historical references readable while marking provenance stale',()=>{
 const s=setup();try{const f=reviewedChild(s),run=finished(s,f.child),{record,artifact}=report(s,{runIds:[run.id]}),artifactPath=physical(s,artifact.path),before=readFileSync(artifactPath),info=s.app.reports.inspect(USER,s.project.id,record.id);
  const reviewRef=info.references.find(r=>r.type==='development-review');assert.equal(reviewRef.relation,'exact');assert.equal(info.references.find(r=>r.type==='development-job').relation,'exact');assert.equal(JSON.parse(s.app.reports.readReference(USER,s.project.id,record.id,reviewRef.id).content).sourceDigest,run.manifest.snapshotDigest);
  s.app.teams.directive(USER,f.review.teamId,{kind:'revise',content:'Withdraw review',taskIds:[f.review.taskId]});const stale=s.app.reports.inspect(USER,s.project.id,record.id);assert.equal(stale.integrity,'verified');assert.equal(stale.validity,'stale');assert.deepEqual(readFileSync(artifactPath),before);assert.equal(s.app.reports.readReference(USER,s.project.id,record.id,reviewRef.id).reference.id,reviewRef.id);
  assert.throws(()=>s.app.reports.create(USER,s.project.id,{runIds:[run.id]}));assert.throws(()=>s.app.reports.collectExport(USER,s.project.id,record.id),{code:'REPORT_STALE'});
 }finally{s.close();}
});

test('valid changed descendants cite ancestor tests without claiming those tests cover the new source',()=>{
 const s=setup();try{const f=reviewedChild(s),descendant=s.app.experiments.create(USER,s.project.id,{title:'Changed descendant',parentId:f.child.id,config:{polynomialDegree:3,ridge:0.000001}}),run=finished(s,descendant),{record}=report(s,{runIds:[run.id]}),info=s.app.reports.inspect(USER,s.project.id,record.id);
  assert.notEqual(run.manifest.snapshotDigest,f.job.sourceDigest);assert.equal(info.validity,'current');for(const type of ['development-job','development-review'])assert.equal(info.references.find(r=>r.type===type).relation,'ancestry');
  const p=s.app.store.get('change-proposal',f.proposal.id);s.app.store.update('change-proposal',p.id,p.version,{testJobId:'different-job'});assert.equal(s.app.reports.inspect(USER,s.project.id,record.id).validity,'stale');assert.throws(()=>report(s,{runIds:[run.id]}),{code:'CHANGE_SOURCE_STALE'});
 }finally{s.close();}
});

test('actual test source drift cannot be represented as an exact valid report binding',()=>{
 const s=setup();try{const f=reviewedChild(s),run=finished(s,f.child),j=s.app.store.get('sandbox-job',f.job.id);s.app.store.update('sandbox-job',j.id,j.version,{sourceDigest:'b'.repeat(64)});assert.throws(()=>report(s,{runIds:[run.id]}),error=>['REPORT_TEST_BINDING_INVALID','DEVELOPMENT_REVIEW_STALE'].includes(error.code));
 }finally{s.close();}
});

test('accepted claim reports become stale after premise withdrawal without rewriting their original text',()=>{
 const s=setup();try{const source=acceptedSource(s),{record,artifact}=report(s,{claimIds:[source.claim.id]}),artifactPath=physical(s,artifact.path),before=readFileSync(artifactPath);assert.equal(s.app.reports.inspect(USER,s.project.id,record.id).validity,'current');
  s.app.teams.directive(USER,source.team.id,{kind:'revise',content:'Recheck premise',taskIds:[source.producer.task.id]});assert.equal(s.app.reports.inspect(USER,s.project.id,record.id).validity,'stale');assert.deepEqual(readFileSync(artifactPath),before);assert.throws(()=>s.app.reports.collectExport(USER,s.project.id,record.id),{code:'REPORT_STALE'});
 }finally{s.close();}
});

test('legacy reports retain their original artifact but never invent historical source bindings',()=>{
 const s=setup();try{const a=s.app.evidence.put(s.project.id,'old.md',Buffer.from('# Historical report'),'text/markdown','report'),record=s.app.store.create('report',s.project.id,{artifactId:a.id,runIds:[s.baseline.id],claimIds:[],evidenceIds:[]}),info=s.app.reports.inspect(USER,s.project.id,record.id);
  assert.equal(info.formatVersion,0);assert.equal(info.validity,'legacy');assert.deepEqual(info.references,[]);assert.deepEqual(readFileSync(physical(s,a.path)),Buffer.from('# Historical report'));assert.throws(()=>s.app.reports.collectExport(USER,s.project.id,record.id),{code:'REPORT_LEGACY'});
 }finally{s.close();}
});

test('export rejects credentials, corrupted archives and oversized payloads without modifying originals',()=>{
 for(const scenario of ['credential','corrupted','oversized']){const s=setup();try{const run=finished(s),a=s.app.evidence.put(s.project.id,scenario+'.txt',scenario==='oversized'?Buffer.alloc(31*1024*1024,120):Buffer.from(scenario==='credential'?'api_key = "sk-123456789012345678901234567890"':'intact'),'text/plain','run',{runId:run.id}),row=s.app.store.get('run',run.id);s.app.store.update('run',row.id,row.version,{artifactIds:[...row.artifactIds,a.id]});
  const {record}=report(s,{runIds:[run.id]}),artifactPath=physical(s,a.path);if(scenario==='corrupted'){chmodSync(artifactPath,0o600);writeFileSync(artifactPath,'corrupted');}
  assert.throws(()=>s.app.reports.collectExport(USER,s.project.id,record.id),{code:scenario==='credential'?'EXPORT_SENSITIVE_CONTENT':scenario==='corrupted'?'REPORT_STALE':'EXPORT_TOO_LARGE'});if(scenario==='credential')assert.match(readFileSync(artifactPath,'utf8'),/sk-123/);
 }finally{s.close();}}
});

test('binary artifacts cannot be read as report text and failure reports do not invent metrics',()=>{
 const s=setup();try{const run=finished(s),a=s.app.evidence.put(s.project.id,'plot.png',Buffer.from([137,80,78,71,0]),'image/png','run',{runId:run.id}),row=s.app.store.get('run',run.id);s.app.store.update('run',row.id,row.version,{artifactIds:[...row.artifactIds,a.id]});const {record}=report(s,{runIds:[run.id]}),info=s.app.reports.inspect(USER,s.project.id,record.id),ref=info.references.find(r=>r.targetId===a.id);assert.throws(()=>s.app.reports.readReference(USER,s.project.id,record.id,ref.id),{code:'BINARY_FILE'});
  const e=s.app.experiments.create(USER,s.project.id,{title:'Failed fixture'}),i=s.app.runs.prepare(USER,e.id);approve(s.app,i.approvalId);const failed=s.app.runs.submit(USER,i.id);s.app.runs.finalize(failed.id,1,'failed','unit fixture failure');const failure=report(s,{runIds:[failed.id]});assert.deepEqual(s.app.reports.inspect(USER,s.project.id,failure.record.id).runs[0].metrics,[]);assert.match(readFileSync(physical(s,failure.artifact.path),'utf8'),/未获得完整实测指标/);
 }finally{s.close();}
});

test('real failure archival retains execution.json but refuses host paths in both collection and export',async()=>{
 const s=setup();try{
  const e=s.app.experiments.create(USER,s.project.id,{title:'Failed Docker service fixture',contract:{runner:'docker',image:`python@sha256:${'a'.repeat(64)}`,command:['python','main.py'],environment:{},datasetVersion:'fixture-v1',evaluationProtocolVersion:'fixture-v1',metrics:{score:{unit:'ratio',direction:'max'}},expectedArtifacts:['metrics.json'],timeoutSeconds:30,cpus:1,memoryMb:128}}),intent=s.app.runs.prepare(USER,e.id);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);
  const hostPath=join(s.dir,'jobs',run.id,'source'),failure=s.app.runs.finalize(run.id,null,'failed',`invalid mount config for type bind: bind source path does not exist: ${hostPath}`),execution=s.app.store.get('artifact',failure.artifactIds.find(id=>s.app.store.get('artifact',id).title==='execution.json')),executionPath=physical(s,execution.path),original=readFileSync(executionPath),{record}=report(s,{runIds:[run.id]});
  assert.ok(JSON.parse(original).error.includes(hostPath));assert.equal(s.app.reports.inspect(USER,s.project.id,record.id).validity,'current');
  const rejected=error=>error.code==='EXPORT_HOST_PATH_DETECTED'&&!error.message.includes(hostPath)&&!error.message.includes(s.dir);
  assert.throws(()=>s.app.reports.collectExport(USER,s.project.id,record.id),rejected);await assert.rejects(()=>s.app.exports.create(USER,s.project.id,{reportId:record.id},'host-path-denied'),rejected);
  assert.deepEqual(readFileSync(executionPath),original);assert.equal(s.app.store.list('report-export',s.project.id).length,0);
 }finally{s.close();}
});

test('export catches escaped host paths and explicit host markers while retaining ordinary container paths',()=>{
 for(const scenario of ['repository','windows','escaped-windows','unc','host-marker','container']){const s=setup();try{
  const run=finished(s),text=scenario==='repository'?s.app.context.repoRoot.replaceAll('\\','/'):scenario==='windows'?'Z:\\Users\\someone\\private.txt':scenario==='escaped-windows'?'Z\\u003a\\u005cUsers\\u005csomeone\\u005cprivate.txt':scenario==='unc'?'\\\\server\\private\\file.txt':scenario==='host-marker'?'bind source path does not exist: /private/host-only/source':'File /work/main.py reads /tmp/cache and writes /output/metrics.json';
  const a=s.app.evidence.put(s.project.id,'execution.json',Buffer.from(JSON.stringify({error:JSON.stringify({message:text})})),'application/json','run',{runId:run.id}),row=s.app.store.get('run',run.id);s.app.store.update('run',row.id,row.version,{artifactIds:[...row.artifactIds,a.id]});const {record}=report(s,{runIds:[run.id]});
  if(scenario==='container')assert.ok(s.app.reports.collectExport(USER,s.project.id,record.id).files.some(f=>f.path===`artifacts/${a.digest}`));
  else assert.throws(()=>s.app.reports.collectExport(USER,s.project.id,record.id),{code:'EXPORT_HOST_PATH_DETECTED'});
  assert.equal(digest(readFileSync(physical(s,a.path))),a.digest);
 }finally{s.close();}}
});

test('fixed octet-stream CSV and TSV preview as bounded UTF-8 text without changing archived metadata',()=>{const s=setup();try{const run=finished(s),csv='x,y\n'+Array.from({length:21},(_,i)=>`${i},${i*i}`).join('\n')+'\n';const cases=[['output/points.csv',Buffer.from(csv),true],['output/points.tsv',Buffer.from('x\ty\n1\t2\n'),true],['output/invalid.csv',Buffer.from([0xff,0xfe]),false],['output/nul.tsv',Buffer.from('x\ty\n1\t\0'),false],['output/figure.png',Buffer.from([137,80,78,71,0]),false],['output/document.pdf',Buffer.from('%PDF-1.7'),false],['output/unknown.bin',Buffer.from('ordinary UTF-8'),false]];const artifacts=cases.map(([title,bytes])=>s.app.evidence.put(s.project.id,title,bytes,'application/octet-stream','run',{runId:run.id})),row=s.app.store.get('run',run.id);s.app.store.update('run',run.id,row.version,{artifactIds:[...row.artifactIds,...artifacts.map(a=>a.id)]});const {record}=report(s,{runIds:[run.id]});for(const [i,[,bytes,readable]] of cases.entries()){const a=artifacts[i],ref=record.references.find(x=>x.type==='artifact'&&x.targetId===a.id);if(readable){const preview=s.app.reports.readReference(USER,s.project.id,record.id,ref.id,0,5);assert.equal(preview.mediaType,'text/plain');assert.equal(preview.content,bytes.toString('utf8').slice(0,5));assert.equal(preview.complete,false);assert.equal(preview.end,5);const rest=s.app.reports.readReference(USER,s.project.id,record.id,ref.id,preview.end);assert.equal(preview.content+rest.content,bytes.toString('utf8'));assert.equal(rest.complete,true);}else assert.throws(()=>s.app.reports.readReference(USER,s.project.id,record.id,ref.id),{code:'BINARY_FILE'});const archived=s.app.store.get('artifact',a.id);assert.equal(archived.mediaType,'application/octet-stream');assert.equal(archived.digest,a.digest);assert.ok(readFileSync(physical(s,archived.path)).equals(bytes));}}finally{s.close();}});
