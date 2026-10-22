import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import fs from 'node:fs';
import {join} from 'node:path';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {setup,USER,approve} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';

for(const blocker of ['control','log-open'])test(`queued Run retries after ${blocker} blocks supervisor preparation`,()=>{
 const s=setup(),savedSpawn=childProcess.spawn,savedOpen=fs.openSync;let starts=0;
 try{
  const intent=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);
  const control=join(s.dir,'jobs',run.id,'control');
  fs.mkdirSync(join(s.dir,'jobs',run.id),{recursive:true});
  if(blocker==='control')fs.writeFileSync(control,'path obstruction');
  else fs.openSync=(path,...args)=>{if(path===join(control,'supervisor.log'))throw Object.assign(new Error('log access denied'),{code:'EACCES'});return savedOpen(path,...args);};
  childProcess.spawn=()=>{starts++;const child=new EventEmitter();child.unref=()=>{};return child;};syncBuiltinESMExports();
  assert.throws(()=>s.app.runs.launchPending(),{code:blocker==='control'?'EEXIST':'EACCES'});
  assert.equal(starts,0);
  if(blocker==='control')fs.unlinkSync(control);else{fs.openSync=savedOpen;syncBuiltinESMExports();}
  s.app.runs.launchPending();
  assert.equal(starts,1,'the original Run must be eligible again without restarting the service');
  s.app.runs.launchPending();assert.equal(starts,1,'a successful launch must retain its duplicate-start guard');
  assert.deepEqual(s.app.store.get('run',run.id),run);
  const failure=s.app.store.events().find(e=>e.type==='run.launch_failed'&&e.payload.runId===run.id);
  assert.ok(failure);assert.equal(failure.payload.retryable,true);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  assert.deepEqual(s.app.store.get('run',run.id),run);
  assert.ok(s.app.store.events().some(e=>e.id===failure.id));
 }finally{childProcess.spawn=savedSpawn;fs.openSync=savedOpen;syncBuiltinESMExports();s.close();}
});

test('a synchronous supervisor spawn failure releases the original Run for retry',()=>{
 const s=setup(),savedSpawn=childProcess.spawn;let attempts=0;
 try{
  const intent=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);
  childProcess.spawn=()=>{if(++attempts===1)throw Object.assign(new Error('temporary spawn failure'),{code:'EAGAIN'});const child=new EventEmitter();child.unref=()=>{};return child;};syncBuiltinESMExports();
  assert.throws(()=>s.app.runs.launchPending(),{code:'EAGAIN'});
  s.app.runs.launchPending();assert.equal(attempts,2);
  assert.deepEqual(s.app.store.get('run',run.id),run);
 }finally{childProcess.spawn=savedSpawn;syncBuiltinESMExports();s.close();}
});
