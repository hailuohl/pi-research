import assert from 'node:assert/strict';
import {chmodSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const spec=(key,extra={})=>({key,role:'analyst',objective:'Machine-learning engineering fixture; no measured scientific result',dependencies:[],...extra});
const review=(key,target)=>spec(key,{role:'reviewer',reviewOf:target});
const output=(extra={})=>({summary:'Deterministic ML workflow engineering fixture; no LLM or scientific measurement.',outcome:'completed',evidenceIds:[],artifactIds:[],claims:[],unresolvedQuestions:[],...extra});
const actor=c=>({type:'agent',projectId:c.task.projectId,sessionId:c.attempt.sessionId,role:c.task.role,taskId:c.task.id,attemptId:c.attempt.id,generation:c.attempt.generation});
const errorCode=(fn,expected)=>{let caught;try{fn();}catch(e){caught=e;}assert.ok(caught,'operation must reject');assert.equal(caught.code,expected);return {code:caught.code,message:caught.message};};

export function serviceExperiments({setup,USER,approve,ResearchApp}){
 const rows=[];
 function run(id,experiment,fn){
  const s=setup(),trace=[];
  try{fn(s,trace);assert.equal(s.app.store.list('model-usage').length,0);assert.equal(s.app.store.list('run').length,0);rows.push({id,experiment,status:'passed',trace,modelUsageRecords:0,runRecords:0});}
  catch(e){rows.push({id,experiment,status:'failed',trace,error:{code:e.code??null,message:e.message,stack:e.stack}});}
  finally{try{s.app.close();}finally{s.close();}}
 }
 function start(s,tasks){const p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});const t=s.app.teams.create(USER,s.session.id,{goal:'E2 deterministic ML engineering fixture',tasks,budget:20});approve(s.app,t.approvalId);return s.app.teams.activate(USER,t.id);}
 function state(s,t,step){return {step,team:s.app.teams.get(USER,t.id),tasks:s.app.store.list('task',s.project.id).filter(x=>x.teamId===t.id)};}
 run('E2-pending-review','E2',(s,trace)=>{
  const t=start(s,[spec('train'),review('review_train','train'),spec('report',{role:'writer',dependencies:['train']})]),a=s.app.teams.claim(t.id);assert.equal(a.task.key,'train');
  s.app.teams.submit(actor(a),output());trace.push(state(s,t,'producer-submitted'));
  assert.equal(s.app.store.get('task',a.task.id).acceptance,'pending');const r=s.app.teams.claim(t.id);assert.equal(r.task.key,'review_train');assert.equal(s.app.teams.claim(t.id),null);
  s.app.teams.submit(actor(r),output({verdict:'accept'}));const w=s.app.teams.claim(t.id);assert.equal(w.task.key,'report');s.app.teams.submit(actor(w),output());trace.push(state(s,t,'review-accepted-and-report-completed'));assert.equal(s.app.teams.get(USER,t.id).state,'completed');
 });
 run('E2-all-reviews-required','E2',(s,trace)=>{
  const t=start(s,[spec('train'),review('r1','train'),review('r2','train'),spec('report',{dependencies:['train']})]),a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),output());
  const r1=s.app.teams.claim(t.id),r2=s.app.teams.claim(t.id);assert.deepEqual(new Set([r1.task.key,r2.task.key]),new Set(['r1','r2']));s.app.teams.submit(actor(r1),output({verdict:'accept'}));trace.push(state(s,t,'one-review-accepted'));assert.equal(s.app.store.get('task',a.task.id).acceptance,'pending');assert.equal(s.app.teams.claim(t.id),null);
  s.app.teams.submit(actor(r2),output({verdict:'accept'}));const w=s.app.teams.claim(t.id);assert.equal(w.task.key,'report');s.app.teams.submit(actor(w),output());trace.push(state(s,t,'all-reviews-accepted'));assert.equal(s.app.teams.get(USER,t.id).state,'completed');
 });
 run('E2-conflicting-reviews','E2',(s,trace)=>{
  const t=start(s,[spec('train'),review('r1','train'),review('r2','train'),spec('report',{dependencies:['train']})]),a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),output());const r1=s.app.teams.claim(t.id),r2=s.app.teams.claim(t.id);s.app.teams.submit(actor(r1),output({verdict:'reject'}));s.app.teams.submit(actor(r2),output({verdict:'accept'}));trace.push(state(s,t,'conflicting-verdicts'));assert.equal(s.app.store.get('task',a.task.id).acceptance,'disputed');assert.equal(s.app.teams.claim(t.id),null);
 });
 run('E2-partial-output','E2',(s,trace)=>{
  const t=start(s,[spec('train'),review('review_train','train'),spec('report',{dependencies:['train']})]),a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),output({outcome:'partial'}));trace.push(state(s,t,'partial-producer'));
  assert.equal(s.app.store.get('task',a.task.id).acceptance,'pending');assert.equal(s.app.teams.claim(t.id),null);trace.push({manualAccept:errorCode(()=>s.app.teams.manualReview(USER,a.task.id,{verdict:'accepted',reason:'Must reject partial fixture'}),'TASK_OUTPUT_INCOMPLETE')});
 });
 run('E2-failed-review-attempt','E2',(s,trace)=>{
  const t=start(s,[spec('train'),review('review_train','train'),spec('report',{dependencies:['train']})]),a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),output());const r=s.app.teams.claim(t.id);assert.equal(r.task.key,'review_train');s.app.teams.fail(r.attempt.id,'Deterministic fixture: review executor failed');trace.push(state(s,t,'review-attempt-failed'));assert.equal(s.app.store.get('task',r.task.id).execution,'failed');assert.notEqual(s.app.store.get('task',a.task.id).acceptance,'accepted');assert.equal(s.app.teams.claim(t.id),null);
 });

 run('E4-original-citation-version-and-reopen','E4',(s,trace)=>{
  const original='ML protocol engineering fixture 😀\r\n\r\nValidation uses a held-out partition; no model accuracy is measured here.\r\nThe seed is fixed for this software test.',replacement='ML protocol engineering fixture version two. Validation uses a changed partition; this is not an empirical ML result.';
  const a=s.app.evidence.put(s.project.id,'ml-protocol.txt',Buffer.from(original),'text/plain','user');let config=s.app.textEvidence.configure(USER,s.project.id,{enabled:true,artifactIds:[a.id],expectedVersion:0});
  const input={query:'validation',artifactIds:[a.id]},first=s.app.textEvidence.search(USER,s.project.id,input),hit=first.hits[0];assert.ok(hit);assert.equal(hit.quote,original.slice(hit.locator.start,hit.locator.end));assert.equal(hit.artifactId,a.id);assert.equal(first.usage.modelCalls,0);assert.equal(first.usage.networkCalls,0);
  const repeat=s.app.textEvidence.search(USER,s.project.id,input);assert.equal(repeat.id,first.id);assert.deepEqual(repeat.hits.map(h=>h.evidenceId),first.hits.map(h=>h.evidenceId));
  const proposed=s.app.evidence.proposeClaim(USER,s.project.id,'Engineering fixture text describes a held-out validation partition; no scientific result asserted.',[hit.evidenceId],['Self-authored engineering fixture']);const claim=s.app.evidence.decideClaim(USER,proposed.id,proposed.version,'accepted');
  const reportArtifact=s.app.reports.create(USER,s.project.id,{title:'E4 fixed-source engineering fixture',claimIds:[claim.id]}),report=s.app.store.list('report',s.project.id).find(x=>x.artifactId===reportArtifact.id),info=s.app.reports.inspect(USER,s.project.id,report.id),reference=info.references.find(r=>r.type==='evidence'&&r.targetId===hit.evidenceId);assert.ok(reference);
  const referenceBefore=s.app.reports.readReference(USER,s.project.id,report.id,reference.id),reportBytes=s.app.evidence.read(USER,reportArtifact.id).bytes;
  assert.equal(JSON.parse(referenceBefore.content).quote,hit.quote);
  const b=s.app.evidence.put(s.project.id,'ml-protocol.txt',Buffer.from(replacement),'text/plain','user');assert.equal(a.title,b.title);assert.notEqual(a.id,b.id);assert.notEqual(a.digest,b.digest);
  config=s.app.textEvidence.configure(USER,s.project.id,{enabled:true,artifactIds:[a.id,b.id],expectedVersion:config.version});const fresh=s.app.textEvidence.search(USER,s.project.id,{query:'validation',artifactIds:[b.id]});assert.ok(fresh.hits.length);assert.ok(fresh.hits.every(h=>h.artifactId===b.id));assert.equal(s.app.evidence.verify(s.project.id,hit.evidenceId).artifactId,a.id);assert.equal(s.app.evidence.verify(s.project.id,hit.evidenceId).quote,hit.quote);
  trace.push({step:'same-title-new-version',original:{id:a.id,digest:a.digest,bytesBase64:Buffer.from(original).toString('base64')},replacement:{id:b.id,digest:b.digest,bytesBase64:Buffer.from(replacement).toString('base64')},firstSearch:first,newSearch:fresh,evidenceId:hit.evidenceId,reportId:report.id,reportArtifactId:reportArtifact.id,referenceId:reference.id,referenceContent:referenceBefore.content,reportDigest:sha(reportBytes)});
  config=s.app.textEvidence.configure(USER,s.project.id,{enabled:true,artifactIds:[b.id],expectedVersion:config.version});trace.push({step:'old-source-removed-from-corpus',newSearch:errorCode(()=>s.app.textEvidence.search(USER,s.project.id,input),'TEXT_SOURCE_NOT_APPROVED')});
  config=s.app.textEvidence.configure(USER,s.project.id,{enabled:false,expectedVersion:config.version});trace.push({step:'corpus-disabled',newSearch:errorCode(()=>s.app.textEvidence.search(USER,s.project.id,{query:'validation',artifactIds:[b.id]}),'TEXT_EVIDENCE_DISABLED')});
  assert.equal(s.app.evidence.verify(s.project.id,hit.evidenceId,false).quote,hit.quote);assert.equal(s.app.reports.inspect(USER,s.project.id,report.id).validity,'current');
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  assert.deepEqual(s.app.evidence.read(USER,a.id).bytes,Buffer.from(original));assert.deepEqual(s.app.evidence.read(USER,b.id).bytes,Buffer.from(replacement));assert.equal(s.app.store.get('text-evidence-search',first.id,s.project.id).id,first.id);assert.equal(s.app.evidence.verify(s.project.id,hit.evidenceId,false).id,hit.evidenceId);assert.equal(s.app.evidence.verify(s.project.id,hit.evidenceId,false).quote,hit.quote);assert.equal(s.app.store.get('report',report.id,s.project.id).artifactId,reportArtifact.id);assert.deepEqual(s.app.evidence.read(USER,reportArtifact.id).bytes,reportBytes);assert.deepEqual(s.app.reports.readReference(USER,s.project.id,report.id,reference.id),referenceBefore);
  trace.push({step:'database-reopened',originalArtifactId:a.id,originalDigest:sha(s.app.evidence.read(USER,a.id).bytes),historicalSearchId:first.id,evidenceId:hit.evidenceId,quote:s.app.evidence.verify(s.project.id,hit.evidenceId,false).quote,reportId:report.id,reportDigest:sha(s.app.evidence.read(USER,reportArtifact.id).bytes),referenceId:reference.id,reportValidity:s.app.reports.inspect(USER,s.project.id,report.id).validity});
 });
 run('E4-tampered-bytes-reject-new-use','E4',(s,trace)=>{
  const a=s.app.evidence.put(s.project.id,'ml-integrity.txt',Buffer.from('Validation engineering fixture: source bytes must remain unchanged.'),'text/plain','user');s.app.textEvidence.configure(USER,s.project.id,{enabled:true,artifactIds:[a.id],expectedVersion:0});const input={query:'validation',artifactIds:[a.id]},first=s.app.textEvidence.search(USER,s.project.id,input),hit=first.hits[0];assert.ok(hit);
  const path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);writeFileSync(path,'Tampered engineering fixture bytes');
  trace.push({step:'CAS-tampering',artifactId:a.id,expectedDigest:a.digest,tamperedDigest:sha(Buffer.from('Tampered engineering fixture bytes')),search:errorCode(()=>s.app.textEvidence.search(USER,s.project.id,input),'ARTIFACT_CORRUPTED'),newClaim:errorCode(()=>s.app.evidence.proposeClaim(USER,s.project.id,'Must reject corrupted fixture',[hit.evidenceId]),'ARTIFACT_CORRUPTED'),historicalStoredQuote:s.app.store.get('evidence',hit.evidenceId,s.project.id).quote});
  assert.equal(s.app.store.list('claim',s.project.id).length,0);
 });
 return {experiments:['E2','E4'],execution:'Real ResearchApp services and isolated temporary SQLite databases; deterministic service fixtures; zero LLM/model/network/run execution',scope:'Corpus removal/disable only revokes new retrieval eligibility; historical evidence and report remain current. CAS tampering independently tests integrity rejection. No task-source revocation propagation, browser, PDF parser, Docker or model path is claimed.',rows,passed:rows.every(r=>r.status==='passed')};
}
