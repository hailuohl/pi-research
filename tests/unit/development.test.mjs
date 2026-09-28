import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,mkdirSync,chmodSync,readdirSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
import {DevelopmentService} from '../../dist/packages/development/service.js';

const input={command:['python','main.py'],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`,expectedArtifacts:['result.txt']};
function ready(s){const d=new DevelopmentService(s.app);writeFileSync(join(s.session.workspace,'main.py'),'assert 2 + 2 == 4\n');return d;}
function approved(s,d,value=input){const t=d.prepare(USER,s.project.id,s.session.id,value);approve(s.app,t.grantId);return t;}
function fixture(s,d,t,{state='succeeded',exitCode=0,missing=false,...rest}={}){
 const j=d.submit(USER,s.project.id,t.id),stored=s.app.store.get('sandbox-job',j.jobId);
 writeFileSync(join(stored.controlDir,'stdout.log'),'UNIT FIXTURE: assertion passed\n');writeFileSync(join(stored.controlDir,'stderr.log'),exitCode?'UNIT FIXTURE: assertion failed\n':'');
 if(!missing)writeFileSync(join(stored.outputDir,'result.txt'),'unit fixture result');
 return d.finalize(j.jobId,{state,exitCode,...rest});
}

test('development freezes actual edited private source and requires exact user approval',()=>{
 const s=setup();try{const d=ready(s),t=d.prepare(USER,s.project.id,s.session.id,input),r=s.app.store.get('development-task',t.id);
  assert.equal(readFileSync(join(r.manifest.inputSnapshot.path,'main.py'),'utf8'),'assert 2 + 2 == 4\n');
  assert.equal(t.manifest.purpose,'development-test');assert.equal(t.manifest.networkPolicy,'none');assert.equal(t.manifest.resources.memoryMb,256);
  assert.equal(JSON.stringify(t).includes(s.dir.replaceAll('\\','\\\\')),false);assert.equal(t.manifest.inputSnapshot.path,undefined);
  assert.throws(()=>d.submit(USER,s.project.id,t.id),{code:'APPROVAL_REQUIRED'});
  approve(s.app,t.grantId);writeFileSync(join(s.session.workspace,'main.py'),'assert False\n');
  assert.throws(()=>d.submit(USER,s.project.id,t.id),{code:'DEVELOPMENT_SOURCE_STALE'});
  const t2=approved(s,d);assert.notEqual(t.sourceDigest,t2.sourceDigest);
  const j=d.submit(USER,s.project.id,t2.id);assert.equal(d.submit(USER,s.project.id,t2.id).jobId,j.jobId);
  assert.equal(s.app.store.list('sandbox-job').length,1);assert.equal(s.app.store.list('run').length,0);assert.equal(s.app.store.list('experiment').length,1);
 }finally{s.close();}
});

test('strict inputs reject host paths, non-pinned images, excessive resources and arbitrary fields',()=>{
 const s=setup();try{const d=ready(s);for(const bad of [
  {...input,mounts:['/secret']},{...input,grantId:'forged'},{...input,environmentImageDigest:'python:latest'},
  {...input,resources:{cpus:9}},{...input,resources:{network:true}},{...input,expectedArtifacts:['../secret']},
  {...input,dataArtifactIds:Array(11).fill('x')},{...input,deadline:new Date(0).toISOString()},{...input,command:[]},
 ])assert.throws(()=>d.prepare(USER,s.project.id,s.session.id,bad));assert.equal(s.app.store.list('development-task').length,0);
 }finally{s.close();}
});

test('successful fixture archive binds fixed candidate; later private edits do not invalidate matching historical candidate',()=>{
 const s=setup();try{const d=ready(s),t=approved(s,d),j=fixture(s,d,t);
  assert.equal(j.state,'succeeded');assert.equal(j.integrity,'complete');assert.equal(j.artifactIds.length,4);
  writeFileSync(join(s.session.workspace,'main.py'),'assert False\n');
  assert.equal(d.assertResultMatches(USER,s.project.id,j.id,t.sourceDigest).jobId,j.id);
  assert.throws(()=>d.assertResultMatches(USER,s.project.id,j.id,'b'.repeat(64)),{code:'DEVELOPMENT_SOURCE_STALE'});
  const report=JSON.parse(s.app.evidence.read(USER,j.reportArtifactId).bytes);assert.equal(report.scientificConclusion,false);assert.equal(report.sourceDigest,t.sourceDigest);assert.deepEqual(report.command,input.command);
  assert.equal(d.inspect(USER,s.project.id,j.id).outputDir,undefined);assert.equal(d.inspect(USER,s.project.id,j.id).controlDir,undefined);
 }finally{s.close();}
});

test('failed, missing, oversized, directory, recovered and truncated fixture outputs cannot become complete successes',()=>{
 for(const scenario of ['failed','missing','oversized','directory','recovered','truncated']){
  const s=setup();try{const d=ready(s),t=approved(s,d,{...input,...(scenario==='oversized'?{resources:{outputBytes:4}}:{})});
   let j;if(['oversized','directory'].includes(scenario)){const dto=d.submit(USER,s.project.id,t.id),r=s.app.store.get('sandbox-job',dto.id);writeFileSync(join(r.controlDir,'stdout.log'),'');writeFileSync(join(r.controlDir,'stderr.log'),'');if(scenario==='directory')mkdirSync(join(r.outputDir,'result.txt'));else writeFileSync(join(r.outputDir,'result.txt'),'12345');j=d.finalize(r.id,{state:'succeeded',exitCode:0});}
   else j=fixture(s,d,t,{state:scenario==='failed'?'failed':'succeeded',exitCode:scenario==='failed'?1:0,missing:scenario==='missing',recovered:scenario==='recovered',logTruncated:scenario==='truncated'});
   assert.equal(j.state,'failed',scenario);assert.ok(j.reportArtifactId);assert.ok(j.stdoutArtifactId);assert.ok(j.stderrArtifactId);
   assert.throws(()=>d.assertResultMatches(USER,s.project.id,j.id,t.sourceDigest),{code:'DEVELOPMENT_TEST_FAILED'});
  }finally{s.close();}
 }
});

test('logs use bounded byte offsets and remain readable in unknown/cancelled state',()=>{
 const s=setup();try{const d=ready(s),t=approved(s,d),j=d.submit(USER,s.project.id,t.id),r=s.app.store.get('sandbox-job',j.id);assert.equal(d.logs(USER,s.project.id,j.id,'stdout').complete,false);writeFileSync(join(r.controlDir,'stdout.log'),'x'.repeat(70000));
  s.app.store.update('sandbox-job',r.id,r.version,{state:'unknown'});
  const first=d.logs(USER,s.project.id,j.id,'stdout');assert.equal(first.content.length,65536);assert.equal(first.cursor,65536);assert.equal(first.complete,false);
  const second=d.logs(USER,s.project.id,j.id,'stdout',first.cursor);assert.equal(second.content.length,4464);assert.equal(second.complete,false);
  assert.equal(d.cancel(USER,s.project.id,j.id).cancelRequested,true);assert.throws(()=>d.logs(USER,s.project.id,j.id,'../secret'),{code:'INVALID_INPUT'});
 }finally{s.close();}
});

test('root approval can cross normal prompt generations but stale actor cannot start a new test',()=>{
 const s=setup();try{const d=ready(s),a={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator',generation:1};
  let session=s.app.store.get('session',s.session.id);session=s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});
  const t=d.prepare(a,s.project.id,s.session.id,input);approve(s.app,t.grantId);
  s.app.store.update('session',session.id,session.version,{generation:2});assert.throws(()=>d.submit(a,s.project.id,t.id),{code:'LEASE_EXPIRED'});
  const j=d.submit({...a,generation:2},s.project.id,t.id);assert.equal(j.state,'queued');assert.doesNotThrow(()=>d.assertCurrent(s.app.store.get('sandbox-job',j.id)));
 }finally{s.close();}
});

test('task agents cannot read sibling jobs or inject ungranted data; source cancellation blocks new side effects but keeps history',()=>{
 const s=setup();try{const d=ready(s),p=s.app.store.get('project',s.project.id);s.app.store.update('project',p.id,p.version,{settings:{...p.settings,enabled:true}});
  const team=s.app.teams.create(USER,s.session.id,{goal:'test scope',tasks:[{key:'code',role:'implementer',objective:'test source',dependencies:[]}]});approve(s.app,team.approvalId);s.app.teams.activate(USER,team.id);
  const c=s.app.teams.claim(team.id),a={type:'agent',projectId:s.project.id,sessionId:c.attempt.sessionId,role:'implementer',taskId:c.task.id,attemptId:c.attempt.id,generation:c.attempt.generation};
  writeFileSync(join(c.attempt.workspace,'main.py'),'assert True\n');const hidden=s.app.evidence.put(s.project.id,'hidden',Buffer.from('secret'),'text/plain','user');
  assert.throws(()=>d.prepare(a,s.project.id,a.sessionId,{...input,dataArtifactIds:[hidden.id]}),{code:'TASK_SCOPE_DENIED'});
  const root=approved(s,d),rootJob=d.submit(USER,s.project.id,root.id);assert.throws(()=>d.inspect(a,s.project.id,rootJob.id),{code:'TASK_SCOPE_DENIED'});
  const own=d.prepare(a,s.project.id,a.sessionId,input);approve(s.app,own.grantId);
  const attempt=s.app.store.get('task-attempt',a.attemptId);s.app.store.update('task-attempt',attempt.id,attempt.version,{leaseUntil:0});
  const j=d.submit(USER,s.project.id,own.id);assert.doesNotThrow(()=>d.assertCurrent(s.app.store.get('sandbox-job',j.id)));
  s.app.teams.cancel(USER,c.task.id);assert.throws(()=>d.assertCurrent(s.app.store.get('sandbox-job',j.id)),{code:'TASK_INPUT_STALE'});assert.equal(d.inspect(a,s.project.id,j.id).jobId,j.id);
 }finally{s.close();}
});

test('data bytes and approval status are rechecked before launch',()=>{
 const s=setup();try{const d=ready(s),a=s.app.evidence.put(s.project.id,'dataset',Buffer.from('1,2\n')),t=approved(s,d,{...input,dataArtifactIds:[a.id]}),j=d.submit(USER,s.project.id,t.id);
  assert.equal(j.manifest.dataArtifacts[0].path,undefined);chmodSync(a.path,0o600);writeFileSync(a.path,'8,9\n');assert.throws(()=>d.assertCurrent(s.app.store.get('sandbox-job',j.id)),{code:'ARTIFACT_CORRUPTED'});
  writeFileSync(a.path,'1,2\n');s.app.approvals.stale(t.id);assert.throws(()=>d.assertCurrent(s.app.store.get('sandbox-job',j.id)),{code:'APPROVAL_STALE'});
 }finally{s.close();}
});

test('rollback removes new job directories and generation fences reject late worker finalization',()=>{
 const s=setup();try{const d=ready(s),t=approved(s,d),event=s.app.store.event.bind(s.app.store);s.app.store.event=(pid,type,payload)=>{if(type==='development.submitted')throw new Error('injected');return event(pid,type,payload);};
  assert.throws(()=>d.submit(USER,s.project.id,t.id),/injected/);assert.equal(s.app.store.list('sandbox-job').length,0);assert.deepEqual(readdirSync(join(s.dir,'sandbox-jobs')),[]);
  s.app.store.event=event;const j=d.submit(USER,s.project.id,t.id);assert.throws(()=>d.finalize(j.id,{state:'failed',exitCode:1,generation:99}),{code:'LEASE_EXPIRED'});
 }finally{s.close();}
});

test('fixed source origin is retained while actual edited bytes are tested; stale origins and expired deadlines block launch',()=>{
 const s=setup();const clock=Date.now;try{
  s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});const d=ready(s);
  const t=approved(s,d,{...input,deadline:new Date(clock()+60000).toISOString()}),j=d.submit(USER,s.project.id,t.id),stored=s.app.store.get('sandbox-job',j.id);
  assert.equal(stored.manifest.sourceRevisionId,s.app.store.get('session',s.session.id).sourceRevisionId);
  assert.notEqual(stored.sourceDigest,s.app.store.get('source-revision',stored.manifest.sourceRevisionId).sourceDigest);
  Date.now=()=>clock()+61000;assert.throws(()=>d.assertCurrent(stored),{code:'DEVELOPMENT_EXPIRED'});Date.now=clock;
  const proposal=s.app.store.create('change-proposal',s.project.id,{sourceValidity:'stale'}),base=s.app.store.get('experiment',s.baseline.id);s.app.store.update('experiment',base.id,base.version,{changeProposalId:proposal.id});
  assert.throws(()=>d.assertCurrent(stored),{code:'CHANGE_SOURCE_STALE'});assert.equal(d.inspect(USER,s.project.id,j.id).jobId,j.id);
 }finally{Date.now=clock;s.close();}
});

test('preflight failure archives empty logs and a failure report without exposing host error paths',()=>{
 const s=setup();try{const d=ready(s),t=approved(s,d),j=d.submit(USER,s.project.id,t.id),r=d.finalize(j.id,{state:'failed',exitCode:null,error:`failed at ${s.dir}`});
  assert.ok(r.stdoutArtifactId);assert.ok(r.stderrArtifactId);assert.ok(r.reportArtifactId);
  assert.equal(s.app.evidence.read(USER,r.stdoutArtifactId).bytes.length,0);
  assert.equal(d.logs(USER,s.project.id,j.id,'stdout').complete,true);
  assert.equal(s.app.evidence.read(USER,r.reportArtifactId).bytes.toString().includes(s.dir.replaceAll('\\','\\\\')),false);
  assert.equal(d.inspect(USER,s.project.id,j.id).error.includes(s.dir),false);
 }finally{s.close();}
});

test('empty argv values are preserved after a nonempty executable',()=>{
 const s=setup();try{const d=ready(s),t=d.prepare(USER,s.project.id,s.session.id,{...input,command:['python','main.py','']});
  assert.deepEqual(t.manifest.command,['python','main.py','']);
  assert.throws(()=>d.prepare(USER,s.project.id,s.session.id,{...input,command:['','main.py']}),{code:'INVALID_INPUT'});
  assert.throws(()=>d.prepare(USER,s.project.id,s.session.id,{...input,command:['python','\0']}),{code:'INVALID_INPUT'});
 }finally{s.close();}
});

test('coordinator may inspect sibling tests but only the user can cancel them; archival does not prevent user cancellation',()=>{
 const s=setup();try{const d=ready(s),t=approved(s,d),j=d.submit(USER,s.project.id,t.id),other=s.app.sessions.create(USER,s.project.id,{title:'other coordinator'}),actor={type:'agent',projectId:s.project.id,sessionId:other.id,role:'coordinator'};
  assert.equal(d.inspect(actor,s.project.id,j.id).jobId,j.id);assert.throws(()=>d.cancel(actor,s.project.id,j.id),{code:'TASK_SCOPE_DENIED'});
  const p=s.app.projects.get(USER,s.project.id);s.app.projects.archive(USER,p.id,p.version);assert.equal(d.cancel(USER,s.project.id,j.id).cancelRequested,true);
 }finally{s.close();}
});

test('all ordinary outputs and worker diagnostic logs are archived with actual image identity; incomplete execution cannot pass',()=>{
 const s=setup();try{const d=ready(s),t=approved(s,d),j=d.submit(USER,s.project.id,t.id);let row=s.app.store.get('sandbox-job',j.id);
  const imageId=`sha256:${'b'.repeat(64)}`;row=s.app.store.update('sandbox-job',row.id,row.version,{imageId});
  writeFileSync(join(row.controlDir,'diagnostic.log'),'UNIT FIXTURE: private host diagnostic');
  writeFileSync(join(row.outputDir,'result.txt'),'expected');writeFileSync(join(row.outputDir,'test-report.json'),'untrusted report');mkdirSync(join(row.outputDir,'debug'));writeFileSync(join(row.outputDir,'debug','trace.txt'),'undeclared diagnostic');
  const r=d.finalize(j.id,{state:'succeeded',exitCode:0,incomplete:true});assert.equal(r.integrity,'incomplete');assert.equal(r.state,'failed');
  const artifacts=r.artifactIds.map(id=>s.app.store.get('artifact',id));assert.ok(artifacts.some(a=>a.title==='output/debug/trace.txt'));assert.ok(artifacts.some(a=>a.title==='output/test-report.json'));assert.ok(artifacts.some(a=>a.title==='diagnostic.log'));
  assert.equal(d.inspect(USER,s.project.id,j.id).imageId,imageId);assert.equal(JSON.parse(s.app.evidence.read(USER,r.reportArtifactId).bytes).imageId,imageId);
 }finally{s.close();}
});

test('undeclared oversized output and directory junctions prevent a complete result',()=>{
 for(const kind of ['oversized','junction']){const s=setup();try{const d=ready(s),t=approved(s,d,{...input,expectedArtifacts:[],resources:{outputBytes:4}}),j=d.submit(USER,s.project.id,t.id),row=s.app.store.get('sandbox-job',j.id);
  if(kind==='oversized')writeFileSync(join(row.outputDir,'unexpected.bin'),'12345');else symlinkSync(row.controlDir,join(row.outputDir,'outside'),'junction');
  const r=d.finalize(j.id,{state:'succeeded',exitCode:0});assert.equal(r.state,'failed');assert.equal(r.integrity,'incomplete');
 }finally{s.close();}}
});

function testedCandidate(s,outcome={}) {
 s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});
 const d=new DevelopmentService(s.app),path='development_candidate.py',content='assert sum([1, 2]) == 3\n';writeFileSync(join(s.session.workspace,path),content);
 const t=approved(s,d,{...input,command:['python',path]}),job=fixture(s,d,t,outcome),artifact=s.app.evidence.put(s.project.id,path,Buffer.from(content));
 const proposal={baseExperimentId:s.baseline.id,expectedRevision:1,title:'Tested candidate',hypothesis:'A code change requiring separate scientific evaluation',changes:[{path,expectedDigest:null,artifactId:artifact.id}],testJobId:job.id};
 return {d,t,job,artifact,proposal,path};
}

test('change proposal binds the exact successful job and applies its tested candidate without creating a scientific run',()=>{
 const s=setup();try{const {job,proposal,path}=testedCandidate(s);
  const p=s.app.changes.prepare(USER,s.project.id,proposal);assert.equal(p.testsStatus,'passed');assert.equal(p.testJobId,job.id);assert.equal(p.candidateSnapshot.digest,job.sourceDigest);
  assert.equal(s.app.changes.inspect(USER,p.id).proposal.testJobId,job.id);
  // Later editing the session does not mutate the candidate already tested and approved.
  writeFileSync(join(s.session.workspace,path),'assert False\n');approve(s.app,p.approvalId);
  const child=s.app.changes.apply(USER,p.id);assert.equal(s.app.experiments.readFile(USER,child.id,path).content,'assert sum([1, 2]) == 3\n');
  assert.equal(s.app.store.list('run').length,0);assert.equal(s.app.store.get('change-proposal',p.id).testsStatus,'passed');
 }finally{s.close();}
});

test('change proposals reject a different candidate, failed job and incomplete execution; absence of a job remains not_run',()=>{
 for(const scenario of ['different-source','failed','incomplete','no-job']){const s=setup();try{
  const outcome=scenario==='failed'?{state:'failed',exitCode:1}:scenario==='incomplete'?{incomplete:true}:{};
  const {proposal,path}=testedCandidate(s,outcome);
  if(scenario==='different-source'){const changed=s.app.evidence.put(s.project.id,path,Buffer.from('assert False\n'));proposal.changes[0].artifactId=changed.id;assert.throws(()=>s.app.changes.prepare(USER,s.project.id,proposal),{code:'DEVELOPMENT_SOURCE_STALE'});}
  else if(scenario==='no-job'){delete proposal.testJobId;const p=s.app.changes.prepare(USER,s.project.id,proposal);assert.equal(p.testsStatus,'not_run');assert.equal(p.testJobId,undefined);approve(s.app,p.approvalId);assert.ok(s.app.changes.apply(USER,p.id).id);}
  else assert.throws(()=>s.app.changes.prepare(USER,s.project.id,proposal),{code:'DEVELOPMENT_TEST_FAILED'});
  if(scenario!=='no-job')assert.equal(s.app.store.list('change-proposal').length,0);
 }finally{s.close();}}
});

test('revoked test source provenance blocks both proposal binding and an already approved application',()=>{
 for(const phase of ['prepare','apply']){const s=setup();try{const {proposal,job}=testedCandidate(s);
  const p=phase==='apply'?s.app.changes.prepare(USER,s.project.id,proposal):undefined;if(p)approve(s.app,p.approvalId);
  const revoked=s.app.store.create('change-proposal',s.project.id,{sourceValidity:'stale'}),base=s.app.store.get('experiment',s.baseline.id);s.app.store.update('experiment',base.id,base.version,{changeProposalId:revoked.id});
  assert.throws(()=>p?s.app.changes.apply(USER,p.id):s.app.changes.prepare(USER,s.project.id,proposal),{code:'CHANGE_SOURCE_STALE'});
  assert.equal(s.app.store.list('experiment').length,1);assert.equal(s.app.development.inspect(USER,s.project.id,job.id).state,'succeeded');
  if(p)assert.equal(s.app.store.get('change-proposal',p.id).state,'prepared');
 }finally{s.close();}}
});

test('proposal approval cannot bypass revoked test authorization or corrupted test archives',()=>{
 for(const scenario of ['approval','archive']){const s=setup();try{const {proposal,job,t}=testedCandidate(s),p=s.app.changes.prepare(USER,s.project.id,proposal);approve(s.app,p.approvalId);
  if(scenario==='approval')s.app.approvals.stale(t.id);
  else {const artifact=s.app.store.get('artifact',job.reportArtifactId);chmodSync(artifact.path,0o600);writeFileSync(artifact.path,'tampered');}
  assert.throws(()=>s.app.changes.apply(USER,p.id),{code:scenario==='approval'?'APPROVAL_STALE':'ARTIFACT_CORRUPTED'});
  assert.equal(s.app.store.list('experiment').length,1);assert.equal(s.app.store.get('change-proposal',p.id).state,'prepared');
 }finally{s.close();}}
});
