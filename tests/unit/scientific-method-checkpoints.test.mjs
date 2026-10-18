import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,rmSync,mkdirSync,renameSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
import {actor as taskActor} from '../support/collaboration.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {digest} from '../../dist/packages/storage/store.js';
import {assertWorkingGrantManifest,workingGrantPayload} from '../../dist/packages/policy/working-grant-validation.js';

const plan=(extra={})=>({expectedRevisionId:null,question:'Compare measurements',scope:'Fixed measured comparison',constraints:[],successCriteria:['Report a finite measured score'],clarificationQuestions:[],literatureSummary:'Sources are separate inputs',hypotheses:[],evidenceIds:[],steps:[{title:'Evaluate',description:'Run the fixed protocol after approval'}],status:'ready',...extra});
const image=`python@sha256:${'a'.repeat(64)}`;
function rootActor(s,session=s.session){const current=s.app.store.get('session',session.id);s.app.store.update('session',current.id,current.version,{state:'running',generation:1,leaseUntil:Date.now()+600000});return {type:'agent',projectId:s.project.id,sessionId:session.id,role:'coordinator',generation:1};}
function op(s,who,name,input,key=crypto.randomUUID(),sessionId=who.sessionId??s.session.id){return s.app.operations.execute(who,name,input,{projectId:s.project.id,sessionId,idempotencyKey:key});}
function write(s,path,content='draft text',expectedDigest=null,key=crypto.randomUUID(),who=USER){return op(s,who,'workspace_write',{source:'session',path,content,expectedDigest},key);}
function read(s,who,path,key=crypto.randomUUID()){return op(s,who,'workspace_read',{source:'session',path},key);}
function draft(path,read){return {path,readId:read.draftReadId};}
function fixture(s,input,contents={}){
 writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'check.py'),'assert True\n');
 const prepared=s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','check.py'],environmentImageDigest:image,...input});approve(s.app,prepared.grantId);
 const dto=s.app.development.submit(USER,s.project.id,prepared.id),job=s.app.store.get('sandbox-job',dto.id);
 for(const [path,content]of Object.entries(contents))writeFileSync(join(s.app.store.paths.physical(job.outputDir),path),content);
 writeFileSync(join(s.app.store.paths.physical(job.controlDir),'stdout.log'),'UNIT fixture: exit 0\n');writeFileSync(join(s.app.store.paths.physical(job.controlDir),'stderr.log'),'');
 return {prepared,job:s.app.development.finalize(job.id,{state:'succeeded',exitCode:0})};
}

test('ready save refuses files never read before creating an approval card',()=>{const s=setup();try{
 const who=rootActor(s);write(s,'research.md');s.app.sessionPermissions.initialize(s.session.id,'confirm');
 assert.throws(()=>op(s,who,'research_brief_save',plan()),{code:'BRIEF_DRAFT_READ_REQUIRED'});
 assert.equal(s.app.store.list('session-action').length,0);assert.equal(s.app.store.list('research-brief').length,0);
}finally{s.close();}});

test('new reads bind all written draft files; user/project/foreign reads cannot mint credentials',()=>{const s=setup();try{
 const who=rootActor(s);write(s,'research.md');write(s,'protocol.py','print("measure")');
 assert.equal(read(s,USER,'research.md').draftReadId,undefined);
 assert.equal(op(s,who,'workspace_read',{source:'project',path:'README.md'}).draftReadId,undefined);
 const first=read(s,who,'research.md');assert.ok(first.draftReadId);
 const receipts=s.app.store.list('workspace-draft-read').length;writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'research.md'),Buffer.from([255]));
 const invalid=read(s,who,'research.md');assert.equal(invalid.draftReadBlockedReason,'BRIEF_DRAFT_ENCODING_INVALID');assert.equal(invalid.draftReadId,undefined);assert.equal(invalid.digest,digest(Buffer.from([255])));assert.equal(s.app.store.list('workspace-draft-read').length,receipts);writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'research.md'),'draft text');
 assert.throws(()=>op(s,who,'research_brief_save',plan({draftFiles:[draft('research.md',first)]})),{code:'BRIEF_DRAFT_READ_REQUIRED'});
 const second=read(s,who,'protocol.py'),saved=op(s,who,'research_brief_save',plan({draftFiles:[draft('research.md',first),draft('protocol.py',second)]}));
 assert.equal(saved.draftFiles.length,2);assert.equal(saved.draftFiles.find(f=>f.path==='research.md').digest,first.digest);
 const other=s.app.sessions.create(USER,s.project.id,{title:'Other coordinator'}),foreign=rootActor(s,other);write(s,'research.md','foreign',null,crypto.randomUUID(),foreign);const foreignRead=read(s,foreign,'research.md');
 assert.throws(()=>op(s,who,'research_brief_save',plan({expectedRevisionId:saved.id,draftFiles:[draft('research.md',foreignRead),draft('protocol.py',second)]})),{code:'BRIEF_DRAFT_READ_STALE'});
 assert.equal(s.app.store.list('research-brief').length,1);
}finally{s.close();}});

test('same-hash new writes invalidate old reads while cached reads/writes preserve their original version',()=>{const s=setup();try{
 const who=rootActor(s),written=write(s,'research.md','unchanged',null,'original-write'),original=read(s,who,'research.md','original-read');
 write(s,'research.md','unchanged',written.digest,'new-write');
 assert.deepEqual(read(s,who,'research.md','original-read'),original);
 assert.throws(()=>op(s,who,'research_brief_save',plan({draftFiles:[draft('research.md',original)]})),{code:'BRIEF_DRAFT_READ_STALE'});
 write(s,'research.md','unchanged',null,'original-write');
 const fresh=read(s,who,'research.md'),saved=op(s,who,'research_brief_save',plan({draftFiles:[draft('research.md',fresh)]}));
 assert.equal(saved.draftFiles[0].writeVersion,2);assert.notEqual(fresh.draftReadId,original.draftReadId);
}finally{s.close();}});

test('external draft mutation stays readable and recovers through managed rewrite plus a fresh read',()=>{const s=setup();try{
 const who=rootActor(s);write(s,'research.md');const original=read(s,who,'research.md','before-external-change'),saved=op(s,who,'research_brief_save',plan({draftFiles:[draft('research.md',original)]}));
 const changed='externally revised draft';writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'research.md'),changed);const reads=s.app.store.list('workspace-draft-read').length;
 const current=read(s,who,'research.md','changed-draft-read');assert.equal(current.content,changed);assert.equal(current.digest,digest(changed));assert.equal(current.size,Buffer.byteLength(changed));assert.equal(current.draftReadId,undefined);assert.equal(current.draftReadBlockedReason,'BRIEF_DRAFT_CHANGED');assert.equal(s.app.store.list('workspace-draft-read').length,reads);
 assert.throws(()=>op(s,who,'research_brief_save',plan({expectedRevisionId:saved.id,draftFiles:[draft('research.md',original)]})),{code:'BRIEF_DRAFT_CHANGED'});
 assert.throws(()=>s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:saved.id,expectedVersion:saved.version}),{code:'BRIEF_DRAFT_CHANGED'});
 write(s,'research.md',current.content,current.digest,'managed-recovery',who);
 assert.deepEqual(read(s,who,'research.md','before-external-change'),original);assert.deepEqual(read(s,who,'research.md','changed-draft-read'),current);
 assert.throws(()=>op(s,who,'research_brief_save',plan({expectedRevisionId:saved.id,draftFiles:[draft('research.md',original)]})),{code:'BRIEF_DRAFT_READ_STALE'});
 const fresh=read(s,who,'research.md','fresh-managed-read');assert.ok(fresh.draftReadId);assert.notEqual(fresh.draftReadId,original.draftReadId);assert.equal(fresh.draftReadBlockedReason,undefined);
 const ready=op(s,who,'research_brief_save',plan({expectedRevisionId:saved.id,draftFiles:[draft('research.md',fresh)]}));assert.equal(ready.draftFiles[0].writeVersion,2);assert.equal(ready.draftFiles[0].digest,current.digest);assert.doesNotThrow(()=>s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:ready.id,expectedVersion:ready.version}));
}finally{s.close();}});

test('confirm and new capture reject altered drafts while fixed confirmed references preserve history',()=>{const s=setup();try{
 const who=rootActor(s);write(s,'research.md');const first=read(s,who,'research.md');
 const request=plan({draftFiles:[draft('research.md',first)]}),saved=op(s,who,'research_brief_save',request,'fixed-ready-save');
 writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'research.md'),'outside mutation');
 assert.throws(()=>s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:saved.id,expectedVersion:saved.version}),{code:'BRIEF_DRAFT_CHANGED'});
 writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'research.md'),'draft text');
 s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:saved.id,expectedVersion:saved.version});const ref=s.app.researchBriefs.capture(who,s.project.id,s.session.id);
 write(s,'research.md','changed later',first.digest);
 assert.equal(op(s,who,'research_brief_save',request,'fixed-ready-save').id,saved.id);
 assert.throws(()=>s.app.researchBriefs.capture(who,s.project.id,s.session.id),{code:'BRIEF_DRAFT_READ_STALE'});
 assert.doesNotThrow(()=>s.app.researchBriefs.assertReference(who,s.project.id,s.session.id,ref));
 assert.equal(s.app.researchBriefs.inspect(USER,s.project.id,s.session.id,saved.id).brief.id,saved.id);
}finally{s.close();}});

test('draft receipts survive reopen, reject missing files and accept same-byte workspace restoration',()=>{const s=setup();try{
 const who=rootActor(s);write(s,'research.md');const first=read(s,who,'research.md'),workspace=s.app.store.paths.physical(s.session.workspace),repoRoot=s.app.context.repoRoot;
 s.app.close();s.app=new ResearchApp(s.dir,repoRoot);
 const moved=workspace+'-original';renameSync(workspace,moved);mkdirSync(workspace);writeFileSync(join(workspace,'research.md'),'draft text');
 const saved=op(s,who,'research_brief_save',plan({draftFiles:[draft('research.md',first)]}));assert.equal(saved.draftFiles[0].readId,first.draftReadId);
 rmSync(join(workspace,'research.md'));
 assert.throws(()=>s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:saved.id,expectedVersion:saved.version}),{code:'BRIEF_DRAFT_CHANGED'});
 assert.equal(s.app.researchBriefs.inspect(USER,s.project.id,s.session.id,saved.id).brief.id,saved.id);
}finally{s.close();}});

test('draft paths reject aliases/duplicates and credentials do not survive a workspace reference change',()=>{const s=setup();try{
 const who=rootActor(s);write(s,'research.md');const first=read(s,who,'research.md');
 assert.throws(()=>read(s,who,'./research.md'),{code:'PATH_DENIED'});
 assert.throws(()=>op(s,who,'research_brief_save',plan({draftFiles:[draft('research.md',first),draft(process.platform==='win32'?'RESEARCH.md':'research.md',first)]})),{code:'INVALID_INPUT'});
 const session=s.app.store.get('session',s.session.id),replacement=join(s.dir,'replacement-workspace');mkdirSync(replacement);writeFileSync(join(replacement,'research.md'),'draft text');s.app.store.update('session',session.id,session.version,{workspace:s.app.store.paths.reference(replacement)});
 assert.throws(()=>op(s,who,'research_brief_save',plan({draftFiles:[draft('research.md',first)]})),{code:'BRIEF_DRAFT_WORKSPACE_CHANGED'});
}finally{s.close();}});

test('a rejected ready operation stays rejected and an approved save rechecks same-byte new writes',()=>{for(const approved of [false,true]){const s=setup();try{
 const who=rootActor(s),written=write(s,'research.md');s.app.sessionPermissions.initialize(s.session.id,'confirm');const first=read(s,who,'research.md'),request=plan({draftFiles:[draft('research.md',first)]});
 assert.throws(()=>op(s,who,'research_brief_save',request),{code:'APPROVAL_REQUIRED'});const pending=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);
 s.app.sessionPermissions.decide(USER,s.session.id,pending.id,{expectedVersion:pending.version,expectedApprovalVersion:pending.approval.version,approved});
 if(approved){write(s,'research.md','draft text',written.digest);assert.throws(()=>s.app.sessionPermissions.executeAction(who,s.session.id,pending.id),{code:'SESSION_ACTION_STALE'});}
 else assert.throws(()=>op(s,who,'research_brief_save',request),{code:'APPROVAL_REJECTED'});
 assert.equal(s.app.store.list('research-brief').length,0);assert.equal(s.app.store.list('session-action').length,1);
}finally{s.close();}}});

test('pending draft approval becomes stale before owner decision when bytes or write version change',()=>{for(const mutation of ['bytes','write-version']){const s=setup();try{
 const who=rootActor(s),written=write(s,'research.md');s.app.sessionPermissions.initialize(s.session.id,'confirm');const first=read(s,who,'research.md'),request=plan({draftFiles:[draft('research.md',first)]});
 assert.throws(()=>op(s,who,'research_brief_save',request),{code:'APPROVAL_REQUIRED'});const pending=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1),reads=s.app.store.list('workspace-draft-read').length;
 if(mutation==='bytes')writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'research.md'),'changed externally');else write(s,'research.md','draft text',written.digest);
 assert.throws(()=>s.app.sessionPermissions.decide(USER,s.session.id,pending.id,{expectedVersion:pending.version,expectedApprovalVersion:pending.approval.version,approved:true}),{code:'APPROVAL_STALE'});
 assert.equal(s.app.store.get('session-action',pending.id).state,'stale');assert.equal(s.app.store.list('session-action').length,1);assert.equal(s.app.store.list('workspace-draft-read').length,reads);assert.equal(s.app.store.list('research-brief').length,0);
}finally{s.close();}}});

test('conceptual plans and legacy brief digests retain their existing semantics',()=>{const s=setup();try{
 const who=rootActor(s),saved=op(s,who,'research_brief_save',plan());assert.deepEqual(saved.draftFiles,[]);
 const {id,kind,projectId,version,createdAt,updatedAt,status,digest:hash,draftFiles,...payload}=saved;
 const legacy=s.app.store.update('research-brief',id,version,{draftFiles:undefined,digest:digest(payload)});
 const confirmed=s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:id,expectedVersion:legacy.version});assert.equal(Object.hasOwn(confirmed,'draftFiles'),false);
 const ref=s.app.researchBriefs.capture(who,s.project.id,s.session.id);write(s,'later.md');assert.doesNotThrow(()=>s.app.researchBriefs.assertReference(who,s.project.id,s.session.id,ref));
 assert.equal(s.app.researchBriefs.inspect(USER,s.project.id,s.session.id).brief.digest,legacy.digest);
}finally{s.close();}});

test('owner manual ready saves remain unbound unless draftFiles are explicitly supplied',()=>{const s=setup();try{
 write(s,'manual-research.md','Human-authored plan');
 const saved=op(s,USER,'research_brief_save',plan());assert.equal(Object.hasOwn(saved,'draftFiles'),false);
 write(s,'manual-research.md','Owner updated text',digest('Human-authored plan'));
 assert.doesNotThrow(()=>s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:saved.id,expectedVersion:saved.version}));
 assert.throws(()=>op(s,USER,'research_brief_save',plan({expectedRevisionId:saved.id,draftFiles:[]})),{code:'BRIEF_DRAFT_READ_REQUIRED'});
}finally{s.close();}});

test('metric contract rejects exit-zero nested/string/nonfinite/invalid UTF8 metrics and keeps original bytes',()=>{
 for(const bytes of ['{"scores":{"r2":0.9}}','{"mse":"0.2"}','{"mse":1e999}','{"mse":NaN}','[]',Buffer.from([255])]){const s=setup();try{
  const {job}=fixture(s,{metricArtifact:'metrics.json',expectedArtifacts:['metrics.json']},{'metrics.json':bytes});
  assert.equal(job.exitCode,0);assert.equal(job.state,'failed');assert.equal(job.integrity,'invalid');assert.match(job.error,/INVALID_METRICS|METRIC_ARTIFACT_INVALID/);
  const a=job.artifactIds.map(id=>s.app.store.get('artifact',id)).find(a=>a.title==='output/metrics.json');assert.ok(a);assert.deepEqual(s.app.evidence.read(USER,a.id).bytes,Buffer.from(bytes));
  assert.equal(s.app.development.inspect(USER,s.project.id,job.id).error,job.error.split(':')[0]);
 }finally{s.close();}}
});

test('finite metrics pass and legacy same-named files receive no inferred metric contract',()=>{for(const checked of [true,false]){const s=setup();try{
 const contents=checked?'{"mse":0.2,"r2":0.91}':'{"nested":{"score":"unvalidated legacy"}}';const {job}=fixture(s,{expectedArtifacts:['metrics.json'],...(checked?{metricArtifact:'metrics.json'}:{})},{'metrics.json':contents});
 assert.equal(job.state,'succeeded');assert.equal(job.integrity,'complete');assert.equal(Object.hasOwn(job.manifest,'metricArtifact'),checked);
}finally{s.close();}}});

test('metric contracts are explicit expected outputs and changing them invalidates approval',()=>{const s=setup();try{
 writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'check.py'),'assert True\n');
 assert.throws(()=>s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','check.py'],environmentImageDigest:image,metricArtifact:'metrics.json'}),{code:'INVALID_INPUT'});
 const t=s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','check.py'],environmentImageDigest:image,expectedArtifacts:['metrics.json','other.json'],metricArtifact:'metrics.json'});approve(s.app,t.grantId);
 const stored=s.app.store.get('development-task',t.id),manifest={...stored.manifest,metricArtifact:'other.json'};s.app.store.update('development-task',t.id,stored.version,{manifest,manifestDigest:digest(manifest)});
 assert.throws(()=>s.app.development.submit(USER,s.project.id,t.id),{code:'APPROVAL_STALE'});
}finally{s.close();}});

test('WorkingGrant retains the exact metric contract across derived approvals and rejects removal/replacement',()=>{const s=setup();try{
 s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'check.py'),'assert True\n');
 const input={command:['python','check.py'],environmentImageDigest:image,expectedArtifacts:['metrics.json','other.json'],metricArtifact:'metrics.json'},template=s.app.development.prepare(USER,s.project.id,s.session.id,input);
 const grant=s.app.workingGrants.prepare(USER,s.project.id,{developmentTaskId:template.id,editablePaths:['check.py'],maxTests:2,maxChangedBytes:100,expiresAt:new Date(Date.now()+60000).toISOString()});assert.equal(grant.metricArtifact,'metrics.json');assert.equal(workingGrantPayload(grant).metricArtifact,'metrics.json');
 approve(s.app,grant.approvalId);s.app.workingGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});
 const {metricArtifact,...withoutMetric}=input,derived=s.app.development.prepare(USER,s.project.id,s.session.id,withoutMetric);assert.equal(derived.manifest.metricArtifact,metricArtifact);
 const raw=s.app.store.get('development-task',derived.id).manifest;
 for(const metricArtifact of [undefined,'other.json'])assert.throws(()=>assertWorkingGrantManifest(grant,{...raw,metricArtifact}),{code:'WORKING_GRANT_TEST_DENIED'});
 assert.throws(()=>s.app.development.prepare(USER,s.project.id,s.session.id,{...input,metricArtifact:'other.json'}),{code:'WORKING_GRANT_TEST_DENIED'});
}finally{s.close();}});

test('reviewers can read the original fixed data inputs and no related sibling evidence or artifacts',()=>{const s=setup();try{
 const project=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,project.id,{expectedVersion:project.version,enabled:true});
 const source=s.app.evidence.put(s.project.id,'candidate-literature.csv',Buffer.from('name,source\nCandidate A,doi:10.1234/test\n'),'text/csv','user'),sibling=s.app.evidence.put(s.project.id,'unrelated.csv',Buffer.from('private sibling'));
 const siblingEvidence=s.app.evidence.register(USER,s.project.id,source.id,0,4,'Related but not approved evidence');
 const {prepared,job}=fixture(s,{dataArtifactIds:[source.id],expectedArtifacts:['metrics.json'],metricArtifact:'metrics.json'},{'metrics.json':'{"score":0.5}'}),review=s.app.developmentReviews.prepare(USER,s.project.id,{jobId:job.id});
 assert.deepEqual(review.dataArtifacts,[{id:source.id,digest:source.digest,size:source.size}]);
 const approvedPlan=s.app.store.list('team-plan').find(p=>p.teamId===review.teamId);assert.deepEqual(approvedPlan.developmentReviewInputs,{reviewId:review.id,jobId:job.id,dataArtifacts:review.dataArtifacts});assert.match(approvedPlan.tasks[0].objective,/protocol\/code/);assert.match(approvedPlan.tasks[0].objective,/record\/report\/study/);assert.match(approvedPlan.tasks[0].objective,/真正改变训练/);
 approve(s.app,review.approvalId);s.app.teams.activate(USER,review.teamId);const claimed=s.app.teams.claim(review.teamId),who=taskActor(claimed);
 const actual=op(s,who,'artifact_read',{artifactId:source.id});assert.equal(actual.content,'name,source\nCandidate A,doi:10.1234/test\n');assert.equal(actual.digest,source.digest);
 assert.throws(()=>op(s,who,'artifact_read',{artifactId:sibling.id}),{code:'TASK_SCOPE_DENIED'});
 assert.throws(()=>op(s,who,'evidence_read',{evidenceId:siblingEvidence.id}),{code:'TASK_SCOPE_DENIED'});
 s.app.approvals.stale(prepared.id);assert.throws(()=>op(s,who,'artifact_read',{artifactId:source.id}),{code:'APPROVAL_STALE'});
 assert.equal(s.app.developmentReviews.inspect(USER,s.project.id,review.id).status,'stale');
}finally{s.close();}});

test('review data binding tampering or corrupt original bytes fails before resource access',()=>{for(const kind of ['binding','bytes']){const s=setup();try{
 const project=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,project.id,{expectedVersion:project.version,enabled:true});
 const source=s.app.evidence.put(s.project.id,'names.csv',Buffer.from('name\nCandidate A\n'),'text/csv','user'),{job}=fixture(s,{dataArtifactIds:[source.id],expectedArtifacts:['metrics.json'],metricArtifact:'metrics.json'},{'metrics.json':'{"score":0.5}'}),review=s.app.developmentReviews.prepare(USER,s.project.id,{jobId:job.id});
 approve(s.app,review.approvalId);s.app.teams.activate(USER,review.teamId);const claimed=s.app.teams.claim(review.teamId),who=taskActor(claimed);
 if(kind==='binding'){const r=s.app.store.get('development-review',review.id);s.app.store.update('development-review',r.id,r.version,{dataArtifacts:[]});}
 else {const file=s.app.store.paths.physical(source.path);chmodSync(file,0o600);writeFileSync(file,'altered bytes');}
 assert.throws(()=>op(s,who,'artifact_read',{artifactId:source.id}),{code:kind==='binding'?'DEVELOPMENT_REVIEW_CORRUPTED':'ARTIFACT_CORRUPTED'});
}finally{s.close();}}});

test('new review plans reject non-text or excessive inputs without expanding artifact read limits',()=>{for(const content of [Buffer.alloc(2*1024*1024+1,65),Buffer.from([255]),Buffer.from([65,0,66])]){const s=setup();try{
 const project=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,project.id,{expectedVersion:project.version,enabled:true});const source=s.app.evidence.put(s.project.id,'unreadable-input',content),{job}=fixture(s,{dataArtifactIds:[source.id],expectedArtifacts:['metrics.json'],metricArtifact:'metrics.json'},{'metrics.json':'{"score":0.5}'});
 assert.throws(()=>s.app.developmentReviews.prepare(USER,s.project.id,{jobId:job.id}),{code:'DEVELOPMENT_REVIEW_DATA_TEXT_REQUIRED'});assert.equal(s.app.store.list('development-review').length,0);assert.equal(s.app.store.list('team').length,0);
}finally{s.close();}}});

test('ordinary development review objectives and legacy read rights are preserved',()=>{const s=setup();try{
 const project=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,project.id,{expectedVersion:project.version,enabled:true});const source=s.app.evidence.put(s.project.id,'ordinary-binary-input',Buffer.from([65,0,66])),{job}=fixture(s,{dataArtifactIds:[source.id]}),review=s.app.developmentReviews.prepare(USER,s.project.id,{jobId:job.id});
 const task=s.app.store.get('task',review.taskId);assert.doesNotMatch(task.objective,/protocol\/code|record\/report\/study|真正改变训练/);
 const record=s.app.store.get('development-review',review.id),{id,kind,projectId,version,createdAt,updatedAt,digest:hash,dataArtifacts,...legacy}=record;s.app.store.update('development-review',id,version,{dataArtifacts:undefined,digest:digest(legacy)});
 approve(s.app,review.approvalId);s.app.teams.activate(USER,review.teamId);const who=taskActor(s.app.teams.claim(review.teamId));
 assert.throws(()=>op(s,who,'artifact_read',{artifactId:source.id}),{code:'TASK_SCOPE_DENIED'});assert.equal(Object.hasOwn(s.app.developmentReviews.inspect(USER,s.project.id,id),'dataArtifacts'),false);
}finally{s.close();}});
