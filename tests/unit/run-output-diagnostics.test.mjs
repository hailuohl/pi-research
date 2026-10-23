import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
import {collectRunArtifacts} from '../../dist/packages/runners/artifacts.js';

const contract={runner:'docker',image:`python@sha256:${'a'.repeat(64)}`,command:['python','main.py'],environment:{},datasetVersion:'unit-output-diagnostics',evaluationProtocolVersion:'unit-output-diagnostics',metrics:{score:{unit:'ratio',direction:'max'}},expectedArtifacts:['metrics.json','summary.json'],timeoutSeconds:30,cpus:1,memoryMb:128};

test('persisted output guidance survives the bounded error of a long missing-artifact list',()=>{
 const testContext=setup();
 try{
  const expectedArtifacts=['metrics.json',...Array.from({length:29},(_,index)=>`${index}-${'segment/'.repeat(43)}result.json`)];
  const experiment=testContext.app.experiments.create(USER,testContext.project.id,{title:'Long missing outputs',contract:{...contract,expectedArtifacts}}),intent=testContext.app.runs.prepare(USER,experiment.id);
  approve(testContext.app,intent.approvalId);
  const run=testContext.app.runs.submit(USER,intent.id),finished=testContext.app.runs.finalize(run.id,0,'succeeded');
  assert.equal(finished.integrity,'incomplete');assert.equal(finished.error.length,8000);
  assert.ok(finished.error.includes('expectedArtifacts'));assert.ok(finished.error.includes('PI_OUTPUT_DIR=/output'));
  assert.equal(testContext.app.runs.finalize(run.id,0,'succeeded').error,finished.error);
 }finally{testContext.close();}
});

test('missing Run outputs explain the runner output root once and preserve complete archives',()=>{
 const testContext=setup();
 try{
  const experiment=testContext.app.experiments.create(USER,testContext.project.id,{title:'Unit output diagnostics',contract}),intent=testContext.app.runs.prepare(USER,experiment.id);
  approve(testContext.app,intent.approvalId);
  const run=testContext.app.runs.submit(USER,intent.id),controlDirectory=testContext.app.store.paths.physical(run.execution.controlDir),outputDirectory=testContext.app.store.paths.physical(run.outputDir),workDirectory=join(testContext.dir,'workdir');
  mkdirSync(controlDirectory,{recursive:true});mkdirSync(workDirectory,{recursive:true});
  writeFileSync(join(controlDirectory,'stdout.log'),'metrics: {"score":0.75}');writeFileSync(join(controlDirectory,'stderr.log'),'');
  writeFileSync(join(workDirectory,'metrics.json'),'{"score":0.75}');
  const expectedArtifacts=['metrics.json','summary.json'];
  const runnerScenarios=['local','trusted-example','docker','ssh'];
  for(const runner of runnerScenarios){
   const routedRun={...run,manifest:{...run.manifest,contract:{...run.manifest.contract,runner,expectedArtifacts}},execution:runner==='trusted-example'?undefined:{...run.execution,backend:runner}};
   const collected=collectRunArtifacts(routedRun,testContext.app.evidence,testContext.app.store.paths);
   const guidanceErrors=collected.errors.filter(error=>error.includes('expectedArtifacts'));
   const archivedTitles=collected.artifactIds.map(artifactId=>testContext.app.store.get('artifact',artifactId).title);
   assert.equal(collected.integrity,'incomplete',runner);
   assert.equal(collected.metrics,undefined,runner);
   assert.deepEqual(expectedArtifacts.filter(path=>collected.errors.some(error=>error===`${path}: 必需产物未归档为普通文件`)),expectedArtifacts,runner);
   assert.equal(guidanceErrors.length,1,runner);
   if(runner==='ssh'){
    assert.ok(guidanceErrors[0].includes('OUTPUT_DIR=/output'),runner);
    assert.equal(guidanceErrors[0].includes('PI_OUTPUT_DIR'),false,runner);
   }else if(runner==='docker')assert.ok(guidanceErrors[0].includes('PI_OUTPUT_DIR=/output'),runner);
   else{
    assert.ok(guidanceErrors[0].includes('PI_OUTPUT_DIR'),runner);
    assert.equal(guidanceErrors[0].includes('='),false,runner);
   }
   assert.ok(guidanceErrors[0].includes('stdout'),runner);
   assert.equal(archivedTitles.includes('metrics.json'),false,runner);
  }
  writeFileSync(join(outputDirectory,'metrics.json'),'{"score":0.75}');writeFileSync(join(outputDirectory,'summary.json'),'{}');
  const complete=collectRunArtifacts(run,testContext.app.evidence,testContext.app.store.paths);
  assert.equal(complete.integrity,'complete');
  assert.deepEqual(complete.metrics,{score:0.75});
  assert.equal(complete.evidenceIds.length,1);
  assert.equal(complete.errors.some(error=>error.includes('expectedArtifacts')),false);
 }finally{testContext.close();}
});
