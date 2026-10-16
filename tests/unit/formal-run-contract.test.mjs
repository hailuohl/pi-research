import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
import {validateContract} from '../../dist/packages/runners/contracts.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {digest} from '../../dist/packages/storage/store.js';
import {publicRecord} from '../../dist/packages/domain/public-record.js';
const physical=(app,reference)=>app.store.paths.physical(reference);

const contract={runner:'docker',image:`python@sha256:${'a'.repeat(64)}`,command:['python','main.py',''],environment:{},datasetVersion:'unit-dataset-v1',evaluationProtocolVersion:'unit-protocol-v1',metrics:{score:{unit:'ratio',direction:'max'}},expectedArtifacts:['metrics.json'],timeoutSeconds:30,cpus:1,memoryMb:128};
function intent(s){const e=s.app.experiments.create(USER,s.project.id,{title:'Formal Docker contract only',contract});return {e,i:s.app.runs.prepare(USER,e.id)};}
function submit(s,i){approve(s.app,i.approvalId);return s.app.runs.submit(USER,i.id);}
function operation(s,name,input,projectId=s.project.id){const value=s.app.operations.execute(USER,name,input,{projectId});validateSchema(OUTPUT_SCHEMAS[name],value,'output');return value;}

test('formal Docker preparation and submission persist bounded immutable contracts without starting Docker',()=>{
 const s=setup();try{const {e,i}=intent(s);validateSchema(OUTPUT_SCHEMAS.run_prepare,JSON.parse(JSON.stringify(i)),'output');
  assert.equal(i.manifest.contract.networkPolicy,'none');assert.equal(i.manifest.contract.dockerContext,'default');assert.equal(i.manifest.contract.pids,128);assert.deepEqual(i.manifest.contract.command,['python','main.py','']);assert.ok(i.manifest.sourceRevisionId);
  assert.throws(()=>s.app.runs.submit(USER,i.id),{code:'APPROVAL_REQUIRED'});const run=submit(s,i),wire=JSON.parse(JSON.stringify(publicRecord(run)));validateSchema(OUTPUT_SCHEMAS.run_submit,wire,'output');
  assert.equal(run.permissionOrigin,'owner');assert.equal(s.app.store.get('run',run.id).permissionOrigin,'owner');assert.equal('permissionOrigin' in wire,false);assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.run_submit,{...wire,unexpected:true},'output'));
  assert.equal(run.state,'queued');assert.equal(run.execution.backend,'docker');assert.equal(run.execution.startRequested,false);assert.equal(run.execution.containerId,undefined);assert.equal(run.execution.generation,0);assert.equal(run.childPid,undefined);assert.equal(run.experimentId,e.id);
  assert.equal(s.app.runs.submit(USER,i.id).id,run.id);assert.equal(s.app.store.list('run').length,1);
 }finally{s.close();}
});

test('fixed Run source APIs retain original bytes when mutable experiment files later change',()=>{
 const s=setup();try{const {e,i}=intent(s),run=submit(s,i),before=operation(s,'run_source_read',{runId:run.id,path:'config.json'}),list=operation(s,'run_source_list',{runId:run.id});
  assert.equal(list.sourceDigest,i.manifest.snapshotDigest);assert.equal(list.revision,i.manifest.experimentRevision);assert.ok(list.files.every(f=>f.mode==='100644'||f.mode==='100755'));assert.equal('snapshotPath' in list,false);
  const manifestBefore=structuredClone(run.manifest),binding=s.app.store.create('git-source-binding',s.project.id,{sourceDigest:i.manifest.snapshotDigest,gitCommit:'a'.repeat(40)},i.manifest.sourceRevisionId);
  assert.equal(operation(s,'run_source_list',{runId:run.id}).gitCommit,'a'.repeat(40));assert.deepEqual(s.app.store.get('run',run.id).manifest,manifestBefore);
  s.app.store.update('git-source-binding',binding.id,binding.version,{sourceDigest:'b'.repeat(64)});assert.equal(operation(s,'run_source_list',{runId:run.id}).gitCommit,undefined);
  // Simulate a later external edit: historical Run reads must still use its immutable CAS.
  writeFileSync(join(physical(s.app,e.workspace),'config.json'),'mutable experiment now differs');
  assert.equal(operation(s,'run_source_read',{runId:run.id,path:'config.json'}).content,before.content);assert.equal(operation(s,'run_source_list',{runId:run.id}).sourceDigest,list.sourceDigest);
  const page=operation(s,'run_source_read',{runId:run.id,path:'config.json',cursor:2,limit:5});assert.equal(page.content,before.content.slice(2,7));assert.equal(page.cursor,2);assert.equal(page.end,7);
  assert.throws(()=>operation(s,'run_source_read',{runId:run.id,path:'config.json',cursor:before.content.length+1}),{code:'INVALID_INPUT'});
  assert.throws(()=>operation(s,'run_source_read',{runId:run.id,path:'../outside'}),{code:'NOT_FOUND'});
  const other=s.app.projects.create(USER,{name:'Other',template:'empty'});for(const name of ['run_source_list','run_source_read'])assert.throws(()=>operation(s,name,{runId:run.id,...(name==='run_source_read'?{path:'config.json'}:{})},other.id),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});

test('formal Run logs separate streams, bound pages and reject invalid stream or cursor inputs',()=>{
 const s=setup();try{const {i}=intent(s),run=submit(s,i),controlDir=physical(s.app,run.execution.controlDir);mkdirSync(controlDir,{recursive:true});writeFileSync(join(controlDir,'stdout.log'),'x'.repeat(70000));writeFileSync(join(controlDir,'stderr.log'),'separate diagnostic');
  const first=operation(s,'run_logs',{runId:run.id,stream:'stdout'});assert.equal(first.content.length,65536);assert.equal(first.cursor,65536);assert.equal(first.complete,false);
  const second=operation(s,'run_logs',{runId:run.id,stream:'stdout',cursor:first.cursor});assert.equal(second.content.length,4464);assert.equal(second.complete,false);assert.equal(operation(s,'run_logs',{runId:run.id,stream:'stderr'}).content,'separate diagnostic');
  for(const invalid of [{stream:'../secret'},{cursor:-1},{cursor:1.5},{cursor:Number.MAX_SAFE_INTEGER+1}])assert.throws(()=>operation(s,'run_logs',{runId:run.id,...invalid}),{code:'INVALID_INPUT'});
  assert.throws(()=>s.app.runs.logs(USER,run.id,Number.MAX_SAFE_INTEGER+1),{code:'INVALID_INPUT'});assert.throws(()=>s.app.runs.logs(USER,run.id,0,'other'),{code:'INVALID_INPUT'});
  const other=s.app.projects.create(USER,{name:'Other',template:'empty'});assert.throws(()=>operation(s,'run_logs',{runId:run.id},other.id),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});

test('Docker contracts reject unapproved environment, networking, host paths and mutable images',()=>{
 const s=setup();try{for(const patch of [
  {environment:{TOKEN:'not-permitted'}},{networkPolicy:'host'},{mounts:['/host']},{sourcePath:'C:/secret'},{cwd:'/host'},
  {image:'python:latest'},{expectedArtifacts:['metrics.json','../outside']},{expectedArtifacts:['metrics.json','/outside']},
  {expectedArtifacts:['metrics.json','stdout.log']},{expectedArtifacts:['metrics.json','metrics.json']},{expectedArtifacts:['other.json']},
  {command:['']},{command:['python','bad\0arg']},{dockerContext:'--host=tcp://remote'},{metrics:{score:{unit:'ratio',direction:'max',secret:'forged'}}},
 ]){assert.throws(()=>validateContract({...contract,...patch}));assert.throws(()=>s.app.experiments.create(USER,s.project.id,{title:'Invalid',contract:{...contract,...patch}}));}
  assert.equal(s.app.store.list('experiment').length,1);assert.equal(s.app.store.list('run-intent').length,0);
 }finally{s.close();}
});

test('changed approval or contract digests cannot authorize submission or launch',()=>{
 const s=setup();try{const {e,i}=intent(s);approve(s.app,i.approvalId);
  const approval=s.app.store.get('approval',i.approvalId);s.app.store.update('approval',approval.id,approval.version,{digest:'0'.repeat(64)});assert.throws(()=>s.app.runs.submit(USER,i.id),{code:'APPROVAL_STALE'});
  const current=s.app.store.get('approval',approval.id);s.app.store.update('approval',current.id,current.version,{digest:i.manifestDigest});
  const changed={...e.contract,datasetVersion:'different-data'},experiment=s.app.store.get('experiment',e.id);s.app.store.update('experiment',e.id,experiment.version,{contract:changed,contractDigest:digest(changed)});assert.throws(()=>s.app.runs.submit(USER,i.id),{code:'APPROVAL_STALE'});assert.equal(s.app.store.list('run').length,0);
  const next=s.app.runs.prepare(USER,e.id),run=submit(s,next),row=s.app.store.get('run',run.id);s.app.store.update('run',row.id,row.version,{manifest:{...row.manifest,sourceRevisionId:'forged-source'}});
  assert.throws(()=>s.app.runs.assertLaunchable(s.app.store.get('run',run.id)),{code:'APPROVAL_STALE'});assert.equal(s.app.store.get('run',run.id).execution.startRequested,false);
 }finally{s.close();}
});

test('new Docker roots freeze threads and all child paths preserve that contract',()=>{
 const s=setup();try{
  const parent=s.app.experiments.create(USER,s.project.id,{title:'Two CPU root',contract:{...contract,cpus:2}});
  assert.equal(parent.contract.threadLimit,2);assert.equal(parent.contractDigest,digest(parent.contract));
  const revision=s.app.store.list('source-revision',s.project.id).find(r=>r.experimentId===parent.id);
  const child=s.app.experiments.create(USER,s.project.id,{parentId:parent.id,title:'Direct child'});
  const fromRevision=s.app.experiments.createFromRevision(USER,s.project.id,revision.id,{title:'Fixed revision child',hypothesis:'same contract'});
  const proposal=s.app.store.create('change-proposal',s.project.id,{baseExperimentId:parent.id,title:'Approved child',hypothesis:'same contract',candidateSnapshot:revision.snapshot,digest:'thread-fixture'});
  const approval=s.app.approvals.request(s.project.id,'change-proposal',proposal.id,proposal.digest,'change.integrate','Unit fixture');approve(s.app,approval.id);
  const approved=s.app.store.update('change-proposal',proposal.id,proposal.version,{approvalId:approval.id});
  const integrated=s.app.experiments.createApprovedChild(USER,approved);
  for(const e of [parent,child,fromRevision,integrated]){assert.equal(digest(e.contract),digest(parent.contract));assert.equal(e.contractDigest,parent.contractDigest);const i=s.app.runs.prepare(USER,e.id);assert.equal(i.manifest.contract.threadLimit,2);assert.equal(i.manifest.threadLimit,2);assert.equal(i.manifest.contractDigest,parent.contractDigest);}
  const run=submit(s,s.app.runs.prepare(USER,parent.id)),row=s.app.store.get('run',run.id),manifest=structuredClone(row.manifest);manifest.contract.threadLimit=3;
  s.app.store.update('run',run.id,row.version,{manifest,manifestDigest:digest(manifest)});
  assert.throws(()=>s.app.runs.assertLaunchable(s.app.store.get('run',run.id)),{code:'APPROVAL_STALE'});
 }finally{s.close();}
});

test('legacy Docker roots and approvals retain absent threads and original digests',()=>{
 const s=setup();try{
  const legacyContract=validateContract({...contract,cpus:2});assert.equal(Object.hasOwn(legacyContract,'threadLimit'),false);
  const created=s.app.experiments.create(USER,s.project.id,{title:'Legacy root fixture',contract});
  const parent=s.app.store.update('experiment',created.id,created.version,{contract:legacyContract,contractDigest:digest(legacyContract)}),before=JSON.stringify(parent.contract);
  const revision=s.app.store.list('source-revision',s.project.id).find(r=>r.experimentId===parent.id);
  const child=s.app.experiments.create(USER,s.project.id,{parentId:parent.id,title:'Legacy child'});
  const fromRevision=s.app.experiments.createFromRevision(USER,s.project.id,revision.id,{title:'Legacy fixed revision child',hypothesis:'legacy'});
  const proposal=s.app.store.create('change-proposal',s.project.id,{baseExperimentId:parent.id,title:'Legacy approved child',hypothesis:'legacy',candidateSnapshot:revision.snapshot,digest:'legacy-thread-fixture'});
  const approval=s.app.approvals.request(s.project.id,'change-proposal',proposal.id,proposal.digest,'change.integrate','Unit legacy fixture');approve(s.app,approval.id);
  const approved=s.app.store.update('change-proposal',proposal.id,proposal.version,{approvalId:approval.id}),integrated=s.app.experiments.createApprovedChild(USER,approved);
  for(const e of [parent,child,fromRevision,integrated]){assert.equal(JSON.stringify(e.contract),before);assert.equal(e.contractDigest,parent.contractDigest);const i=s.app.runs.prepare(USER,e.id);assert.equal(Object.hasOwn(i.manifest.contract,'threadLimit'),false);assert.equal(i.manifest.threadLimit,2);assert.equal(i.manifest.contractDigest,parent.contractDigest);}
  assert.equal(Object.hasOwn(s.baseline.contract,'threadLimit'),false);
 }finally{s.close();}
});

test('explicit Docker thread limits are bounded and other backends reject them',()=>{
 for(const threadLimit of [1,2,64])assert.equal(validateContract({...contract,threadLimit}).threadLimit,threadLimit);
 for(const threadLimit of [0,65,1.5,'2',null])assert.throws(()=>validateContract({...contract,threadLimit}));
 assert.throws(()=>validateContract({...contract,runner:'ssh',sshTargetId:'fixture',threadLimit:2}));
 const local={...contract,runner:'local',localRuntimeId:'python',command:['python','main.py'],networkPolicy:'host',threadLimit:2};delete local.image;
 assert.throws(()=>validateContract(local));
});

test('execution receipts include frozen manifest threads and retain old intent omissions',()=>{
 const s=setup();try{for(const legacy of [false,'new',true]){
  let e=s.app.experiments.create(USER,s.project.id,{title:'Receipt fixture',contract:{...contract,cpus:2}});
  if(legacy){const old={...e.contract};delete old.threadLimit;e=s.app.store.update('experiment',e.id,e.version,{contract:old,contractDigest:digest(old)});}
  let i=s.app.runs.prepare(USER,e.id);
  if(legacy===true){const manifest={...i.manifest};delete manifest.threadLimit;const manifestDigest=digest(manifest);i=s.app.store.update('run-intent',i.id,i.version,{manifest,manifestDigest});const a=s.app.store.get('approval',i.approvalId);s.app.store.update('approval',a.id,a.version,{digest:manifestDigest});}
  const r=submit(s,i),controlDir=physical(s.app,r.execution.controlDir),outputDir=physical(s.app,r.outputDir);
  mkdirSync(controlDir,{recursive:true});writeFileSync(join(controlDir,'stdout.log'),'fixture');writeFileSync(join(controlDir,'stderr.log'),'');writeFileSync(join(outputDir,'metrics.json'),'{"score":1}');
  const done=s.app.runs.finalize(r.id,0,'succeeded'),id=done.artifactIds.find(id=>s.app.store.get('artifact',id).title==='execution.json'),report=JSON.parse(s.app.evidence.read(USER,id).bytes);
  assert.equal(done.integrity,'complete');assert.equal(Object.hasOwn(report,'threadLimit'),legacy!==true);if(legacy!==true)assert.equal(report.threadLimit,2);
 }}finally{s.close();}
});

test('new formal intents freeze legacy experiment threads without changing the contract',()=>{
 const s=setup();try{
  const raw=validateContract({...contract,cpus:2}),created=s.app.experiments.create(USER,s.project.id,{title:'Legacy parent',contract});
  const e=s.app.store.update('experiment',created.id,created.version,{contract:raw,contractDigest:digest(raw)}),before=JSON.stringify(e.contract),i=s.app.runs.prepare(USER,e.id);
  assert.equal(i.manifest.threadLimit,2);assert.equal(JSON.stringify(i.manifest.contract),before);assert.equal(i.manifest.contractDigest,e.contractDigest);
  assert.equal(i.manifestDigest,digest(i.manifest));assert.equal(s.app.store.get('approval',i.approvalId).digest,i.manifestDigest);
  const r=submit(s,i);assert.equal(r.manifest.threadLimit,2);assert.equal(Object.hasOwn(r.manifest.contract,'threadLimit'),false);
 }finally{s.close();}
});

test('old approved formal intents submit and reopen without adding manifest or contract threads',async()=>{
 const s=setup();try{
  const raw=validateContract({...contract,cpus:2}),created=s.app.experiments.create(USER,s.project.id,{title:'Old approved parent',contract});
  const e=s.app.store.update('experiment',created.id,created.version,{contract:raw,contractDigest:digest(raw)}),prepared=s.app.runs.prepare(USER,e.id),manifest={...prepared.manifest};delete manifest.threadLimit;
  const manifestDigest=digest(manifest),old=s.app.store.update('run-intent',prepared.id,prepared.version,{manifest,manifestDigest}),a=s.app.store.get('approval',old.approvalId);
  s.app.store.update('approval',a.id,a.version,{digest:manifestDigest});approve(s.app,a.id);
  const before=JSON.stringify(old.manifest),r=s.app.runs.submit(USER,old.id);assert.equal(JSON.stringify(r.manifest),before);assert.equal(r.manifestDigest,manifestDigest);
  const {ResearchApp}=await import('../../dist/packages/research-app.js');s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  const recovered=s.app.store.get('run',r.id);assert.equal(JSON.stringify(recovered.manifest),before);assert.equal(recovered.manifestDigest,manifestDigest);assert.equal(Object.hasOwn(recovered.manifest,'threadLimit'),false);assert.equal(Object.hasOwn(recovered.manifest.contract,'threadLimit'),false);
 }finally{s.close();}
});
