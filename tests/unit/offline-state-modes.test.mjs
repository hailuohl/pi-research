import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from '../../dist/packages/storage/store.js';
import {stateCheck} from '../../dist/packages/storage/backup.js';
function fixture(run){const dir=mkdtempSync(join(tmpdir(),'pi-state-modes-')),store=new Store(join(dir,'state.db'));try{const p=store.create('project',null,{name:'State mode fixture'});run(store,p.id);}finally{store.close();rmSync(dir,{recursive:true,force:true});}}
for(const [kind,value]of [['native-request',{state:'unknown'}],['native-request',{state:'running'}],['task',{execution:'running'}],['host-command',{state:'unknown'}],['session-action',{state:'executing'}],['operation-pending',{}],['literature-task',{state:'unknown'}],['git-operation',{state:'cancelling'}],['git-operation',{state:'recovering'}]])test(`backup retains historical ${kind}/${value.state??value.execution??'pending'} while purge strictly refuses it`,()=>fixture((store,pid)=>{store.create(kind,pid,value);assert.doesNotThrow(()=>stateCheck(store.db));assert.throws(()=>stateCheck(store.db,true),{code:'BACKUP_BUSY'});}));
for(const [kind,value]of [['literature-task',{state:'queued'}],['git-operation',{state:'running'}],['model-http-request',{state:'unknown'}]])test(`existing ${kind}/${value.state} barrier still applies to backup and purge`,()=>fixture((store,pid)=>{store.create(kind,pid,value);assert.throws(()=>stateCheck(store.db),{code:'BACKUP_BUSY'});assert.throws(()=>stateCheck(store.db,true),{code:'BACKUP_BUSY'});}));
test('backup refuses incomplete purging data while the purge checker admits its own lifecycle state',()=>fixture((store,pid)=>{const p=store.get('project',pid);store.update('project',pid,p.version,{status:'purging'});assert.throws(()=>stateCheck(store.db),{code:'BACKUP_PURGE_INCOMPLETE'});assert.doesNotThrow(()=>stateCheck(store.db,true));}));
