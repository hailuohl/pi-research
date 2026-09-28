import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,chmodSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
import {TrustedExampleAdapter} from '../../dist/packages/runners/trusted-example.js';
import {digest} from '../../dist/packages/storage/store.js';

function queued(s,config){const e=config?s.app.experiments.create(USER,s.project.id,{title:'Trusted adapter',parentId:s.baseline.id,config}):s.baseline,i=s.app.runs.prepare(USER,e.id);approve(s.app,i.approvalId);return s.app.runs.submit(USER,i.id);}

test('trusted adapter executes the actual immutable bundled program and produces measured artifacts',async()=>{
 const s=setup();try{const run=queued(s),adapter=new TrustedExampleAdapter(run,process.cwd()),logs=[];
  assert.deepEqual(adapter.capabilities,{backend:'trusted-example',isolated:false,recoverable:false});await adapter.preflight();await adapter.stage();
  const handle=await adapter.start((stream,chunk)=>logs.push({stream,text:chunk.toString()})),result=await handle.completion;assert.ok(handle.pid);assert.equal(result.exitCode,0,result.error);
  assert.ok(logs.some(l=>l.stream==='stdout'&&l.text.includes('Measured metrics:')));const metrics=JSON.parse(readFileSync(join(run.outputDir,'metrics.json'),'utf8'));assert.ok(Number.isFinite(metrics.mse)&&metrics.mse>0);assert.ok(existsSync(join(run.outputDir,'predictions.csv')));assert.ok(existsSync(join(run.outputDir,'model.json')));
  const final=s.app.runs.finalize(run.id,result.exitCode,'succeeded');assert.equal(final.integrity,'complete');assert.equal(final.judgment,'pending');assert.deepEqual(final.metrics,metrics);
  // Receipt ownership remains with the independent supervisor, not this process adapter.
  assert.equal(existsSync(join(s.dir,'jobs',run.id,'control','terminal.json')),false);
 }finally{s.close();}
});

test('trusted adapter rejects arbitrary command contracts, wrong backend and replaced source before spawning',async()=>{
 const s=setup();try{const run=queued(s);
  for(const runner of ['trusted-example','docker']){const bad=structuredClone(run);bad.manifest.contract.runner=runner;bad.manifest.contract.command=['node','-e','throw new Error("must never execute")'];bad.manifest.contractDigest=digest(bad.manifest.contract);bad.manifestDigest=digest(bad.manifest);await assert.rejects(()=>new TrustedExampleAdapter(bad,process.cwd()).start(()=>{}),{code:'UNTRUSTED_HOST_EXECUTION'});}
  const program=join(run.manifest.snapshotPath,'experiment.mjs');chmodSync(program,0o600);writeFileSync(program,'throw new Error("untrusted source must never execute")');
  await assert.rejects(()=>new TrustedExampleAdapter(run,process.cwd()).start(()=>{}),{code:'SNAPSHOT_CORRUPTED'});assert.equal(existsSync(join(run.outputDir,'metrics.json')),false);
 }finally{s.close();}
});

test('trusted adapter rejects a mutated manifest receipt without relaxing host-code checks',async()=>{
 const s=setup();try{const run=queued(s),bad=structuredClone(run);bad.manifestDigest='0'.repeat(64);
  await assert.rejects(()=>new TrustedExampleAdapter(bad,process.cwd()).preflight(),{code:'MANIFEST_CORRUPTED'});assert.equal(existsSync(join(run.outputDir,'metrics.json')),false);
 }finally{s.close();}
});

test('trusted cancellation waits for observed child termination and is safe to repeat',async()=>{
 const s=setup();try{const run=queued(s,{polynomialDegree:1,ridge:0.000001,sleepMs:5000}),adapter=new TrustedExampleAdapter(run,process.cwd()),handle=await adapter.start(()=>{});
  await handle.cancel();const result=await handle.completion;assert.notEqual(result.exitCode,0);await handle.cancel();assert.equal(existsSync(join(run.outputDir,'metrics.json')),false);
  const final=s.app.runs.finalize(run.id,result.exitCode,'cancelled');assert.equal(final.state,'cancelled');assert.equal(final.integrity,'incomplete');
 }finally{s.close();}
});

test('a trusted adapter cannot start duplicate processes and reports log-sink failure',async()=>{
 const s=setup();try{const run=queued(s),adapter=new TrustedExampleAdapter(run,process.cwd());
  const starts=await Promise.allSettled([adapter.start(()=>{throw new Error('fixture log sink unavailable');}),adapter.start(()=>{})]);
  assert.equal(starts.filter(r=>r.status==='fulfilled').length,1);assert.equal(starts.find(r=>r.status==='rejected').reason.code,'RUN_ALREADY_STARTED');
  const result=await starts.find(r=>r.status==='fulfilled').value.completion;assert.equal(result.error,'fixture log sink unavailable');
 }finally{s.close();}
});
