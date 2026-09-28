import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
import {validateContract} from '../../dist/packages/runners/contracts.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {digest} from '../../dist/packages/storage/store.js';

const contract={runner:'docker',image:`python@sha256:${'a'.repeat(64)}`,command:['python','main.py',''],environment:{},datasetVersion:'unit-dataset-v1',evaluationProtocolVersion:'unit-protocol-v1',metrics:{score:{unit:'ratio',direction:'max'}},expectedArtifacts:['metrics.json'],timeoutSeconds:30,cpus:1,memoryMb:128};
function intent(s){const e=s.app.experiments.create(USER,s.project.id,{title:'Formal Docker contract only',contract});return {e,i:s.app.runs.prepare(USER,e.id)};}
function submit(s,i){approve(s.app,i.approvalId);return s.app.runs.submit(USER,i.id);}
function operation(s,name,input,projectId=s.project.id){const value=s.app.operations.execute(USER,name,input,{projectId});validateSchema(OUTPUT_SCHEMAS[name],value,'output');return value;}

test('formal Docker preparation and submission persist bounded immutable contracts without starting Docker',()=>{
 const s=setup();try{const {e,i}=intent(s);validateSchema(OUTPUT_SCHEMAS.run_prepare,JSON.parse(JSON.stringify(i)),'output');
  assert.equal(i.manifest.contract.networkPolicy,'none');assert.equal(i.manifest.contract.dockerContext,'default');assert.equal(i.manifest.contract.pids,128);assert.deepEqual(i.manifest.contract.command,['python','main.py','']);assert.ok(i.manifest.sourceRevisionId);
  assert.throws(()=>s.app.runs.submit(USER,i.id),{code:'APPROVAL_REQUIRED'});const run=submit(s,i);validateSchema(OUTPUT_SCHEMAS.run_submit,JSON.parse(JSON.stringify(run)),'output');
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
  writeFileSync(join(e.workspace,'config.json'),'mutable experiment now differs');
  assert.equal(operation(s,'run_source_read',{runId:run.id,path:'config.json'}).content,before.content);assert.equal(operation(s,'run_source_list',{runId:run.id}).sourceDigest,list.sourceDigest);
  const page=operation(s,'run_source_read',{runId:run.id,path:'config.json',cursor:2,limit:5});assert.equal(page.content,before.content.slice(2,7));assert.equal(page.cursor,2);assert.equal(page.end,7);
  assert.throws(()=>operation(s,'run_source_read',{runId:run.id,path:'config.json',cursor:before.content.length+1}),{code:'INVALID_INPUT'});
  assert.throws(()=>operation(s,'run_source_read',{runId:run.id,path:'../outside'}),{code:'NOT_FOUND'});
  const other=s.app.projects.create(USER,{name:'Other',template:'empty'});for(const name of ['run_source_list','run_source_read'])assert.throws(()=>operation(s,name,{runId:run.id,...(name==='run_source_read'?{path:'config.json'}:{})},other.id),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});

test('formal Run logs separate streams, bound pages and reject invalid stream or cursor inputs',()=>{
 const s=setup();try{const {i}=intent(s),run=submit(s,i);mkdirSync(run.execution.controlDir,{recursive:true});writeFileSync(join(run.execution.controlDir,'stdout.log'),'x'.repeat(70000));writeFileSync(join(run.execution.controlDir,'stderr.log'),'separate diagnostic');
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
