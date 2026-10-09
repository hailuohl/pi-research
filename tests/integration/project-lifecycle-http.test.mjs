import {approve,fixtureFinish} from '../support/research.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';

test('owner archive HTTP preserves history, validates CAS and replays lifecycle idempotency',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-lifecycle-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0,computeMonitoring:false});
 try{const port=await server.listen(),base=`http://127.0.0.1:${port}/api`,app=server.app,p=app.projects.create(USER,{name:'Archive HTTP',template:'curve-fit'}),session=app.sessions.create(USER,p.id,{}),artifact=app.evidence.put(p.id,'history.txt',Buffer.from('fixed result'));
 const request=async(path,body,key=randomUUID())=>{const response=await fetch(base+path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});return {status:response.status,value:await response.json()};};
 const experiment=app.experiments.create(USER,p.id,{title:'historical run'}),intent=app.runs.prepare(USER,experiment.id),unsubmitted=app.runs.prepare(USER,experiment.id);approve(app,intent.approvalId);const run=app.runs.submit(USER,intent.id);fixtureFinish({app},run);
 const key=randomUUID(),first=await request(`/projects/${p.id}/archive`,{expectedVersion:p.version},key);assert.equal(first.status,200);assert.equal(first.value.status,'archived');
 const replay=await request(`/projects/${p.id}/archive`,{expectedVersion:p.version},key);assert.deepEqual(replay,first);
 assert.deepEqual((await request('/projects')).value,[]);assert.equal((await request('/projects?status=archived')).value[0].id,p.id);
 const snapshot=()=>JSON.stringify({rows:app.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all(),events:app.store.db.prepare('SELECT * FROM events ORDER BY seq').all(),operations:app.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all()}),rows=snapshot();
 for(const path of [`/projects/${p.id}`,`/projects/${p.id}/state`,`/sessions/${session.id}`,`/sessions/${session.id}/view`,`/projects/${p.id}/files?path=README.md`,`/events?projectId=${p.id}`])assert.equal((await request(path)).status,200,path);
 assert.equal((await fetch(base+`/artifacts/${artifact.id}/content`)).status,200);assert.equal(snapshot(),rows);
 for(const [path,body]of [[`/run-intents/${intent.id}/submit`,{}],['/operations/run_submit',{projectId:p.id,input:{intentId:intent.id}}]]){const history=await request(path,body);assert.equal(history.status,200,path);assert.equal(history.value.id,run.id);assert.equal(history.value.state,'succeeded');}
 for(const [path,body]of [[`/run-intents/${unsubmitted.id}/submit`,{}],['/operations/run_submit',{projectId:p.id,input:{intentId:unsubmitted.id}}],['/operations/run_prepare',{projectId:p.id,input:{experimentId:experiment.id}}]])assert.equal((await request(path,body)).value.error.code,'PROJECT_ARCHIVED',path);
 assert.equal(snapshot(),rows);
 const denied=await request(`/projects/${p.id}`,{expectedVersion:first.value.version,name:'forbidden'});assert.equal(denied.status,409);
 const stale=await request(`/projects/${p.id}/unarchive`,{expectedVersion:p.version});assert.equal(stale.status,409);assert.equal(stale.value.error.code,'VERSION_CONFLICT');
 const restored=await request(`/projects/${p.id}/unarchive`,{expectedVersion:first.value.version});assert.equal(restored.status,200);assert.equal(restored.value.lifecycleEpoch,2);assert.equal((await request('/projects')).value[0].id,p.id);
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});
