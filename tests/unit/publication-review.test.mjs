import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve,fixtureFinish} from '../support/research.mjs';
import {actor,result as taskResult} from '../support/collaboration.mjs';
import {publicationFixture,publicationPng} from '../support/publication.mjs';
import {parserProfile} from '../../dist/packages/documents/parse-service.js';
import {digest} from '../../dist/packages/storage/store.js';

function fixture(){const s=setup(),p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});const build=publicationFixture(s.app,p.id);return {...s,...build};}
function prepare(s,extra={}){return s.app.publicationReviews.prepare(USER,s.project.id,{resultId:s.result.id,rootSessionId:s.session.id,...extra});}
function claim(s,r){approve(s.app,r.approvalId);s.app.teams.activate(USER,r.teamId);const c=s.app.teams.claim(r.teamId);assert.ok(c);return c;}
function submit(s,r,c,extra={}){return s.app.teams.submit(actor(c),taskResult({verdict:'accept',evidenceIds:r.requiredEvidenceIds,...extra}));}
function change(s,kind,id,patch){const row=s.app.store.get(kind,id);s.app.store.update(kind,id,row.version,patch);}

test('fixed manuscript review preparation is explicit, scoped, idempotent and requires its own approval',()=>{
 const s=fixture();try{
  const agent={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator'};
  assert.throws(()=>s.app.publicationReviews.prepare(agent,s.project.id,{resultId:s.result.id,rootSessionId:s.session.id}),{code:'PERMISSION_DENIED'});
  const r=prepare(s);assert.equal(r.status,'awaiting_approval');assert.equal(r.validity,'current');assert.equal(r.publicationResultId,s.result.id);assert.equal(r.pdfDigest,s.result.pdf.digest);assert.deepEqual(prepare(s),r);assert.equal(s.app.teams.claim(r.teamId),null);
  assert.equal(s.app.store.list('task-attempt',s.project.id).length,0);assert.notEqual(r.approvalId,s.job.approvalId);
  const snap=s.app.publicationReviews.snapshot(USER,s.project.id,r.id);assert.equal(snap.approvals.review.status,'pending');assert.equal(snap.taskResult,undefined);assert.equal(JSON.stringify(snap).includes(s.dir.replaceAll('\\','\\\\')),false);
  const secondRoot=s.app.sessions.create(USER,s.project.id,{title:'Separate explicit review'}),second=prepare(s,{rootSessionId:secondRoot.id});assert.notEqual(second.id,r.id);assert.equal(s.app.publicationReviews.list(USER,s.project.id,{resultId:s.result.id}).length,2);
  const foreign=s.app.projects.create(USER,{name:'Foreign'});assert.throws(()=>s.app.publicationReviews.inspect(USER,foreign.id,r.id),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});

test('reviewer receives exact readonly sources and evidence, with independent identity and no claim escape',()=>{
 const s=fixture();try{
  const r=prepare(s),c=claim(s,r),who=actor(c);assert.equal(c.context.publicationReview.publicationResultId,s.result.id);assert.equal(c.context.publicationReview.digest,r.digest);assert.notEqual(who.sessionId,s.session.id);
  for(const aid of [...s.revision.files.map(f=>f.artifactId),...s.job.artifactIds])assert.doesNotThrow(()=>s.app.teams.assertResource(who,'artifact',aid));
  const unrelated=s.app.evidence.put(s.project.id,'not-approved.txt',Buffer.from('unapproved data'),'text/plain','fixture',{taskId:c.task.id});assert.throws(()=>s.app.teams.assertResource(who,'artifact',unrelated.id),{code:'TASK_SCOPE_DENIED'});
  const newEvidence=s.app.evidence.register(USER,s.project.id,s.revision.files[0].artifactId,0,4,'Not selected at preparation');assert.throws(()=>s.app.teams.assertResource(who,'evidence',newEvidence.id),{code:'TASK_SCOPE_DENIED'});
  assert.throws(()=>submit(s,r,c,{verdict:undefined}),{code:'REVIEW_VERDICT_REQUIRED'});assert.throws(()=>submit(s,r,c,{evidenceIds:r.requiredEvidenceIds.slice(0,1)}),{code:'EVIDENCE_REQUIRED'});
  assert.throws(()=>submit(s,r,c,{claims:[{statement:'Not a directly accepted scientific claim',evidenceIds:r.requiredEvidenceIds,limitations:[]}]}),{code:'PUBLICATION_REVIEW_CLAIMS_DENIED'});
  const archived=submit(s,r,c,{summary:'Fixed review opinion',artifactIds:[s.result.logs[0].artifactId]});
  const snap=s.app.publicationReviews.snapshot(USER,s.project.id,r.id);assert.equal(snap.review.status,'passed');assert.equal(snap.review.summary,'Fixed review opinion');assert.equal(snap.taskResult.id,archived.id);assert.equal(snap.taskResult.digest,digest(archived.result));assert.equal(snap.taskResult.inputDigest,c.attempt.inputDigest);
  assert.equal('workspace' in snap.attempt,false);assert.equal('leaseUntil' in snap.attempt,false);
 }finally{s.close();}
});

test('accept, reject and disputed remain distinct current review records; manual acceptance cannot rewrite verdict',()=>{
 for(const verdict of ['accept','reject','disputed']){const s=fixture();try{
  const r=prepare(s),c=claim(s,r);submit(s,r,c,{verdict});const snap=s.app.publicationReviews.snapshot(USER,s.project.id,r.id);
  assert.equal(snap.review.status,{accept:'passed',reject:'rejected',disputed:'disputed'}[verdict]);assert.equal(snap.review.validity,'current');assert.equal(snap.taskResult.result.verdict,verdict);
  if(verdict!=='accept'){change(s,'task',r.taskId,{acceptance:'accepted'});assert.equal(s.app.publicationReviews.inspect(USER,s.project.id,r.id).validity,'stale');assert.throws(()=>s.app.publicationReviews.snapshot(USER,s.project.id,r.id));}
 }finally{s.close();}}
});

test('review validity binds build, artifacts, required evidence, approval, exact context, attempt and archived result',()=>{
 const mutations={
  build:(s,r,c)=>change(s,'publication-build-result',s.result.id,{passes:999}),
  source:(s,r,c)=>{const path=s.app.store.paths.physical(s.app.store.get('artifact',s.revision.files[0].artifactId).path);chmodSync(path,0o600);writeFileSync(path,'altered source');},
  evidence:(s,r,c)=>change(s,'evidence',r.requiredEvidenceIds[0],{description:'altered meaning'}),
  buildApproval:(s,r,c)=>s.app.approvals.stale(s.job.id),
  reviewApproval:(s,r,c)=>s.app.approvals.stale(r.teamId),
  context:(s,r,c)=>{const ctx=s.app.store.list('context-snapshot',s.project.id).find(x=>x.attemptId===c.attempt.id);change(s,'context-snapshot',ctx.id,{content:{...ctx.content,goal:'altered'}});},
  attempt:(s,r,c)=>change(s,'task-attempt',c.attempt.id,{inputDigest:'changed'}),
  archive:(s,r,c)=>{const row=s.app.store.list('task-result',s.project.id).find(x=>x.taskId===r.taskId);change(s,'task-result',row.id,{result:{...row.result,summary:'tampered'}});},
  task:(s,r,c)=>{const row=s.app.store.get('task',r.taskId);change(s,'task',row.id,{result:{...row.result,summary:'tampered'}});},
  independence:(s,r,c)=>change(s,'session',c.attempt.sessionId,{taskId:'different-task'})
 };
 for(const [name,mutate] of Object.entries(mutations)){const s=fixture();try{const r=prepare(s),c=claim(s,r);submit(s,r,c);mutate(s,r,c);assert.equal(s.app.publicationReviews.inspect(USER,s.project.id,r.id).validity,'stale',name);assert.throws(()=>s.app.publicationReviews.snapshot(USER,s.project.id,r.id),undefined,name);}finally{s.close();}}
});

test('failed, partial and cancelled reviews retry with a fresh attempt without resurrecting historical output',()=>{
 for(const phase of ['failed','partial','cancelled']){const s=fixture();try{
  const r=prepare(s),first=claim(s,r);
  if(phase==='failed')s.app.teams.fail(first.attempt.id,'fixture transport failure');
  if(phase==='partial')submit(s,r,first,{outcome:'partial',evidenceIds:[]});
  if(phase==='cancelled')s.app.teams.cancel(USER,r.taskId);
  assert.equal(s.app.publicationReviews.inspect(USER,s.project.id,r.id).validity,'current',phase);
  s.app.teams.retry(USER,r.taskId);const pending=s.app.publicationReviews.snapshot(USER,s.project.id,r.id);assert.equal(pending.review.status,'pending');assert.equal(pending.taskResult,undefined);
  const second=s.app.teams.claim(r.teamId);assert.ok(second,phase);assert.notEqual(second.attempt.id,first.attempt.id);assert.notEqual(second.attempt.sessionId,first.attempt.sessionId);submit(s,r,second);
  const final=s.app.publicationReviews.snapshot(USER,s.project.id,r.id);assert.equal(final.review.status,'passed');assert.equal(final.taskResult.attemptId,second.attempt.id);
  assert.throws(()=>submit(s,r,first),{code:phase==='partial'?'IDEMPOTENCY_CONFLICT':'LEASE_EXPIRED'});
 }finally{s.close();}}
});

test('revoked evidence run approval invalidates a review even when the run is not a manuscript asset',()=>{
 const s=fixture();try{
  const intent=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);fixtureFinish(s,run);
  const eid=s.app.store.get('run',run.id).evidenceIds[0],r=prepare(s,{inputEvidenceIds:[eid]});assert.equal(r.validity,'current');s.app.approvals.stale(intent.id);assert.equal(s.app.publicationReviews.inspect(USER,s.project.id,r.id).validity,'stale');
  const replacement=s.app.approvals.request(s.project.id,'run-intent',intent.id,intent.manifestDigest,'run.submit','UNIT replacement approval');approve(s.app,replacement.id);change(s,'run-intent',intent.id,{approvalId:replacement.id});
  assert.equal(s.app.publicationReviews.inspect(USER,s.project.id,r.id).validity,'stale');assert.throws(()=>s.app.publicationReviews.snapshot(USER,s.project.id,r.id),{code:'EVIDENCE_INVALID'});
 }finally{s.close();}
});

test('review team does not inherit an unrelated root source or expand fixed run evidence into run-source access',()=>{
 const s=fixture();try{
  s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});assert.ok(s.app.store.get('session',s.session.id).sourceRevisionId);
  const intent=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);fixtureFinish(s,run);
  const eid=s.app.store.get('run',run.id).evidenceIds[0],r=prepare(s,{inputEvidenceIds:[eid]}),c=claim(s,r),who=actor(c);
  assert.equal(s.app.store.get('team',r.teamId).sourceRevisionId,undefined);assert.equal(s.app.store.get('session',c.attempt.sessionId).sourceRevisionId,undefined);assert.equal(c.context.source,undefined);assert.deepEqual(readdirSync(s.app.store.paths.physical(c.attempt.workspace)),['task-context.json']);
  assert.doesNotThrow(()=>s.app.teams.assertResource(who,'evidence',eid));assert.doesNotThrow(()=>s.app.teams.assertResource(who,'artifact',s.app.store.get('evidence',eid).artifactId));assert.throws(()=>s.app.teams.assertResource(who,'run',run.id),{code:'TASK_SCOPE_DENIED'});
  assert.throws(()=>s.app.operations.execute(who,'run_source_list',{runId:run.id},{projectId:s.project.id,idempotencyKey:'read-run-list'}),{code:'TASK_SCOPE_DENIED'});
  assert.throws(()=>s.app.operations.execute(who,'run_source_read',{runId:run.id,path:run.manifest.sourceFiles[0].path},{projectId:s.project.id,idempotencyKey:'read-run-source'}),{code:'TASK_SCOPE_DENIED'});
  s.app.approvals.stale(intent.id);assert.equal(s.app.publicationReviews.inspect(USER,s.project.id,r.id).validity,'stale');
 }finally{s.close();}
});

test('revoked document parse approval invalidates selected page evidence before dispatch and submission',()=>{
 const s=fixture();try{
  const pid=s.project.id,document=s.app.documents.import(USER,pid,{title:'UNIT evidence.pdf',mediaType:'application/pdf',contentBase64:Buffer.from('%PDF-1.7\nUNIT test input').toString('base64')},'review-document');
  const profile=parserProfile(process.cwd()),imageId='sha256:'+'a'.repeat(64);s.app.store.create('document-parser-settings',null,{...profile,dockerContext:'default',imageDigest:imageId,imageId},'global');
  const prepared=s.app.documentParsing.prepare(USER,pid,{documentVersionId:document.id});approve(s.app,prepared.approvalId);change(s,'document-parse-job',prepared.id,{imageId});const job=s.app.store.get('document-parse-job',prepared.id),text='UNIT quoted scientific evidence';
  const page={pageNumber:1,pageLabel:'1',width:400,height:200,imageWidth:1,imageHeight:1,textFile:'page-0001.txt',textDigest:digest(Buffer.from(text)),textBytes:Buffer.byteLength(text),imageFile:'page-0001.png',imageDigest:digest(publicationPng),imageBytes:publicationPng.length,paragraphs:[{index:1,start:0,end:text.length}],textStatus:'text-extracted',imageCandidates:[]};
  const outputDir=s.app.store.paths.physical(job.outputDir);writeFileSync(join(outputDir,page.textFile),text);writeFileSync(join(outputDir,page.imageFile),publicationPng);writeFileSync(join(outputDir,'manifest.json'),JSON.stringify({formatVersion:2,profileId:profile.profileId,rawDigest:document.original.digest,pageCount:1,quality:{readingOrder:'unverified',paragraphs:'heuristic',tables:'unknown',figures:'unknown',ocr:false,score:null},pages:[page]}));
  const done=s.app.documentParsing.finalize(job.id,{state:'succeeded',exitCode:0});assert.equal(done.integrity,'complete');const evidence=s.app.evidence.registerDocument(USER,pid,{documentVersionId:document.id,parseResultId:done.resultId,pageNumber:1,start:0,end:4,description:'UNIT page quote'});
  const r=prepare(s,{inputEvidenceIds:[evidence.id]}),c=claim(s,r);assert.equal(s.app.publicationReviews.inspect(USER,pid,r.id).validity,'current');s.app.approvals.stale(job.id);
  assert.equal(s.app.publicationReviews.inspect(USER,pid,r.id).validity,'stale');assert.throws(()=>submit(s,r,c),{code:'APPROVAL_STALE'});assert.throws(()=>s.app.publicationReviews.snapshot(USER,pid,r.id),{code:'APPROVAL_STALE'});
  const replacement=s.app.approvals.request(pid,'document-parse-job',job.id,job.manifestDigest,'document.parse','UNIT replacement parse approval');approve(s.app,replacement.id);change(s,'document-parse-job',job.id,{approvalId:replacement.id});
  assert.equal(s.app.publicationReviews.inspect(USER,pid,r.id).validity,'stale');assert.throws(()=>submit(s,r,c),{code:'EVIDENCE_INVALID'});assert.throws(()=>s.app.publicationReviews.snapshot(USER,pid,r.id),{code:'EVIDENCE_INVALID'});
 }finally{s.close();}
});
