import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {basename,dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';

test('queue HTTP manages exact versioned user inputs without a configured Pi and never starts a task',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'pi-queue-http-')),server=createHttpServer({dataDir:dir,repoRoot:dir,port:0});
  try{
    const app=server.app,p=app.projects.create(USER,{name:'Queue HTTP',template:'empty'}),s=app.sessions.create(USER,p.id,{}),other=app.sessions.create(USER,p.id,{});
    const first=app.sessions.send(USER,s.id,{content:'First ordinary input'}),second=app.sessions.send(USER,s.id,{content:'Queued input'}),foreign=app.sessions.send(USER,other.id,{content:'Other dialogue'});
    assert.equal(first.mode,'prompt');assert.equal(second.mode,'follow_up');
    const port=await server.listen(),url=`http://127.0.0.1:${port}/api/sessions/${s.id}`;
    const request=async(path,body)=>{const response=await fetch(url+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','Idempotency-Key':randomUUID()},...(body?{body:JSON.stringify(body)}:{})});return{status:response.status,value:await response.json()};};
    const queue=await request('/queue');assert.equal(queue.status,200);assert.equal(queue.value.total,2);assert.deepEqual(queue.value.items.map(m=>m.id),[first.id,second.id]);assert.equal(queue.value.canSteer,false);
    const edited=await request('/queue',{messageId:second.id,expectedVersion:second.version,action:'edit',content:'汉'.repeat(30000)});assert.equal(edited.status,200);
    const stale=await request('/queue',{messageId:second.id,expectedVersion:second.version,action:'cancel'});assert.equal(stale.status,409);assert.equal(stale.value.error.code,'VERSION_CONFLICT');
    const alien=await request('/queue',{messageId:foreign.id,expectedVersion:foreign.version,action:'cancel'});assert.equal(alien.status,403);
    const steer=await request('/queue',{messageId:second.id,expectedVersion:edited.value.version,action:'steer'});assert.equal(steer.status,409);assert.equal(steer.value.error.code,'SESSION_BUSY');
    const removed=await request('/queue',{messageId:second.id,expectedVersion:edited.value.version,action:'cancel'});assert.equal(removed.status,200);assert.equal(removed.value.queueRemoved,true);
    const view=await request('/view');assert.equal(view.status,200);assert.equal(view.value.pendingTotal,1);assert.deepEqual(view.value.pendingMessages.map(m=>m.id),[first.id]);assert.equal(view.value.progress.canSteer,false);
    const record=app.store.get('message',second.id);assert.equal(record.status,'cancelled');assert.equal(record.content,'汉'.repeat(30000));
    const bad=await request('/queue',{messageId:first.id,expectedVersion:first.version,action:'cancel',actor:'system'});assert.equal(bad.status,409);assert.equal(bad.value.error.code,'INVALID_INPUT');assert.equal(app.store.get('message',first.id).status,'queued');
    assert.equal(app.store.list('run').length,0);assert.equal(app.store.list('model-usage').length,0);assert.equal(server.host.active.size,0);
  }finally{await server.close();assert.equal(dirname(dir),resolve(tmpdir()));assert.ok(basename(dir).startsWith('pi-queue-http-'));rmSync(dir,{recursive:true,force:true});}
});
