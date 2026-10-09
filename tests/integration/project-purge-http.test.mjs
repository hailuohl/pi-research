import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';

test('purge HTTP only queues owner-confirmed offline work and keeps canonical idempotent minimal progress',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-purge-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0,computeMonitoring:false});
 try{const port=await server.listen(),base=`http://127.0.0.1:${port}/api`,app=server.app,p=app.projects.create(USER,{name:'Exact permanent name',description:'private research'}),deleted=app.projects.trash(USER,p.id,p.version),path=`/projects/${p.id}/purge`,body={expectedVersion:deleted.version,confirmName:p.name};
 const call=async(route,value,key=randomUUID())=>{const response=await fetch(base+route,value===undefined?{}:{method:'POST',headers:{'content-type':'application/json','idempotency-key':key},body:JSON.stringify(value)});return {status:response.status,value:await response.json()};};
 assert.equal((await call(path,{...body,confirmName:'wrong'})).value.error.code,'PURGE_NAME_MISMATCH');assert.equal((await call(path+'/',body)).value.error.code,'INVALID_INPUT');assert.equal((await call(`/projects//${p.id}/purge`,body)).value.error.code,'INVALID_INPUT');
 const pending=await call(path,body,'same-purge');assert.equal(pending.status,200);assert.equal(pending.value.state,'pending');assert.equal(pending.value.phase,'waiting_offline');assert.equal(pending.value.offlineRequired,true);assert.equal(pending.value.projectId,p.id);assert.equal(pending.value.name,undefined);assert.equal(pending.value.workspace,undefined);assert.equal(pending.value.description,undefined);assert.ok(existsSync(app.store.paths.physical(p.workspace)));assert.equal(app.store.db.prepare('SELECT count(*) n FROM maintenance_gate').get().n,0);
 assert.deepEqual(await call(path,body,'same-purge'),pending);assert.deepEqual((await call(path)).value,pending.value);assert.equal((await call(path,{...body,expectedVersion:deleted.version+1},'same-purge')).value.error.code,'IDEMPOTENCY_CONFLICT');assert.equal((await call(`/projects/${p.id}/state`)).status,410);assert.equal((await call(`/projects/${p.id}/restore`,{expectedVersion:deleted.version+1})).value.error.code,'PROJECT_NOT_TRASHED');const list=(await call('/projects?status=purging')).value;assert.equal(list[0].id,p.id);assert.equal(list[0].workspace,undefined);
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});
