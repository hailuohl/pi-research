import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {approve,fixtureFinish} from '../support/research.mjs';
const allowed=['id','name','version','status','lifecycleEpoch','archived','createdAt','updatedAt','deletedAt','restoreStatus'];

test('trash HTTP hides project history and old receipts, preserves management retries and restores exact state',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-trash-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0,computeMonitoring:false});
 try{const port=await server.listen(),base=`http://127.0.0.1:${port}/api`,app=server.app;
 const call=async(path,body,key=randomUUID())=>{const response=await fetch(base+path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});return {status:response.status,value:await response.json()};};
 const create={name:'Recycle project',description:'private research description',template:'curve-fit'},p=(await call('/projects',create,'created')).value,session=app.sessions.create(USER,p.id,{title:'private dialogue'}),artifact=app.evidence.put(p.id,'private result',Buffer.from('private research payload')),experiment=app.experiments.create(USER,p.id,{title:'private source'}),intent=app.runs.prepare(USER,experiment.id);approve(app,intent.approvalId);const run=app.runs.submit(USER,intent.id);fixtureFinish({app},run);
 const sessionBody={projectId:p.id};app.store.operation('POST:/sessions','session-created',{body:sessionBody,query:''},()=>session);
 const before=app.store.get('project',p.id),trashBody={expectedVersion:before.version},deleted=await call(`/projects/${p.id}/trash`,trashBody,'trash');assert.equal(deleted.status,200);assert.equal(deleted.value.status,'trashed');assert.ok(Object.keys(deleted.value).every(k=>allowed.includes(k)));assert.equal(deleted.value.restoreStatus,'active');assert.deepEqual(await call(`/projects/${p.id}/trash`,trashBody,'trash'),deleted);
 assert.deepEqual((await call(`/projects/${p.id}/lifecycle`)).value,deleted.value);assert.deepEqual((await call('/projects')).value,[]);assert.deepEqual((await call('/projects?status=trashed')).value,[deleted.value]);
 for(const path of [`/projects/${p.id}`,`/projects/${p.id}/state`,`/projects/${p.id}/files?path=README.md`,`/sessions/${session.id}`,`/sessions/${session.id}/view`,`/runs/${run.id}`,`/artifacts/${artifact.id}/content`,`/events?projectId=${p.id}`]){const denied=await call(path);assert.equal(denied.status,410,path);assert.equal(denied.value.error.code,'PROJECT_DELETED',path);assert.ok(!JSON.stringify(denied.value).includes('private research'));}
 for(const [path,body,key]of [['/projects',create,'created'],['/sessions',sessionBody,'session-created'],[`/run-intents/${intent.id}/submit`,{},'historical'],['/operations/run_inspect',{projectId:p.id,input:{runId:run.id}},'read']])assert.equal((await call(path,body,key)).value.error.code,'PROJECT_DELETED',path);
 assert.ok((await call('/events')).value.items.every(e=>e.projectId!==p.id));assert.equal((await call(`/projects/${p.id}/restore`,{expectedVersion:before.version})).value.error.code,'VERSION_CONFLICT');
 const restoreBody={expectedVersion:deleted.value.version},restored=await call(`/projects/${p.id}/restore`,restoreBody,'restore');assert.equal(restored.status,200);assert.equal(restored.value.id,p.id);assert.equal(restored.value.status,'active');assert.deepEqual(await call(`/projects/${p.id}/restore`,restoreBody,'restore'),restored);assert.equal((await call(`/runs/${run.id}`)).value.state,'succeeded');assert.equal((await call('/projects')).value[0].id,p.id);assert.deepEqual((await call('/projects?status=trashed')).value,[]);
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});
