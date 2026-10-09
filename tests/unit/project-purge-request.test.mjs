import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {setup,USER} from '../support/research.mjs';
import {Store} from '../../dist/packages/storage/store.js';
const snapshot=s=>JSON.stringify(s.app.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all());

test('purge request requires trashed project, exact name and version and retains only management status',()=>{const s=setup();try{
 const p=s.app.store.get('project',s.project.id);assert.throws(()=>s.app.projects.purge(USER,p.id,{expectedVersion:p.version,confirmName:p.name},'first'),{code:'PURGE_NOT_TRASHED'});
 const deleted=s.app.projects.trash(USER,p.id,p.version),before=snapshot(s);assert.throws(()=>s.app.projects.purge(USER,p.id,{expectedVersion:deleted.version,confirmName:'wrong'},'wrong'),{code:'PURGE_NAME_MISMATCH'});assert.throws(()=>s.app.projects.purge(USER,p.id,{expectedVersion:p.version,confirmName:p.name},'stale'),{code:'VERSION_CONFLICT'});assert.equal(snapshot(s),before);
 const input={expectedVersion:deleted.version,confirmName:p.name},pending=s.app.projects.purge(USER,p.id,input,'permanent');assert.equal(pending.state,'pending');assert.equal(pending.phase,'waiting_offline');assert.equal(pending.projectId,p.id);assert.equal(pending.offlineRequired,true);assert.equal(pending.completedPaths,0);assert.equal(s.app.store.get('project',p.id).status,'purging');assert.equal(pending.name,undefined);assert.equal(pending.workspace,undefined);assert.deepEqual(s.app.projects.purge(USER,p.id,input,'permanent'),pending);assert.throws(()=>s.app.projects.purge(USER,p.id,{...input,confirmName:'changed'},'permanent'),{code:'IDEMPOTENCY_CONFLICT'});assert.throws(()=>s.app.projects.restore(USER,p.id,deleted.version+1),{code:'PROJECT_NOT_TRASHED'});
}finally{s.close();}});

test('ordinary Store checks persisted maintenance gate even when this process previously opened and closed it',()=>{const s=setup();try{
 const path=s.app.store.path;s.app.close();const db=new DatabaseSync(path);try{db.exec('CREATE TABLE IF NOT EXISTS maintenance_gate(id INTEGER PRIMARY KEY,owner_token TEXT,owner_pid INTEGER,host_identity TEXT,operation_id TEXT)');db.prepare('INSERT INTO maintenance_gate VALUES(1,?,?,?,?)').run('fixture-owner',process.pid,'fixture-host','fixture-operation');}finally{db.close();}
 assert.throws(()=>{const unexpected=new Store(path);unexpected.close();},{code:'MAINTENANCE_ACTIVE'});
}finally{s.close();}});
