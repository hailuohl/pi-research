import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Worker} from 'node:worker_threads';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {Store} from '../../dist/packages/storage/store.js';

test('Store installs its busy handler before the first data-location query under an independent lock',async()=>{
 const dir=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-store-startup-')),path=join(dir,'state.db'),initial=new Store(path);
 initial.create('fixture',null,{retained:'business row'},'retained');initial.close();
 const signal=new Int32Array(new SharedArrayBuffer(8));
 const holder=new Worker(`const {parentPort,workerData}=require('node:worker_threads');const {DatabaseSync}=require('node:sqlite');const signal=new Int32Array(workerData.signal),db=new DatabaseSync(workerData.path);try{db.exec('PRAGMA journal_mode=DELETE; BEGIN EXCLUSIVE');parentPort.postMessage('locked');if(Atomics.wait(signal,0,0,5000)==='timed-out')throw Error('first query was never attempted');Atomics.wait(signal,1,0,150);db.exec('COMMIT');Atomics.store(signal,1,1);}finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}`,{eval:true,workerData:{path,signal:signal.buffer}});
 const exit=once(holder,'exit');let opened,error;const original=DatabaseSync.prototype.prepare;
 try{
  assert.deepEqual(await once(holder,'message'),['locked']);
  // Test-only handshake: hold the lock until the exact first query, not an assumed startup delay.
  DatabaseSync.prototype.prepare=function(sql,...args){if(String(sql).includes("name='data_location'")){Atomics.store(signal,0,1);Atomics.notify(signal,0);}return original.call(this,sql,...args);};
  try{opened=new Store(path);}catch(e){error=e;}finally{DatabaseSync.prototype.prepare=original;}
  assert.deepEqual(await exit,[0]);assert.ifError(error);
  assert.equal(opened.get('fixture','retained').retained,'business row');assert.equal(opened.paths.dataDir,dir);
  assert.equal(opened.db.prepare('PRAGMA busy_timeout').get().timeout,5000);
 }finally{DatabaseSync.prototype.prepare=original;Atomics.store(signal,0,1);Atomics.notify(signal,0);await holder.terminate();opened?.close();rmSync(dir,{recursive:true,force:true});}
});
