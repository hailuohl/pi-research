import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';

test('HTTP roots and branches persist their creation bundle before any model or skill selection',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-session-autobind-http-'));let server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const project=server.app.projects.create(USER,{name:'Automatic session binding'});let port=await server.listen();
  const request=async(path,body,key=crypto.randomUUID())=>{const res=await fetch(`http://127.0.0.1:${port}/api${path}`,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});const value=await res.json();assert.equal(res.status,200,JSON.stringify(value));return value;};
  const initial=server.app.skills.configuration(project.id).bundleId,body={projectId:project.id,title:'Automatically bound root'},key=crypto.randomUUID(),first=await request('/sessions',body,key);
  assert.equal(first.skillBundleId,initial);assert.equal(first.generation,0);assert.equal(first.piSessionPath,null);
  const imported=server.app.skills.import(USER,project.id,{packageId:'autobind-custom',revisionTag:'v1',description:'Second fixed bundle for binding',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from('UNIT autobind').toString('base64')}]},'autobind');
  server.app.skills.review(USER,project.id,{revisionId:imported.id,decision:'approved',note:'fixture'});
  server.app.skills.configure(USER,project.id,{expectedVersion:0,revisionIds:[imported.id]});
  const second=await request('/sessions',{projectId:project.id,title:'Next fixed version'});assert.notEqual(second.skillBundleId,initial);assert.deepEqual(await request('/sessions',body,key),first);
  const reused=await request('/sessions',{projectId:project.id,reuseSessionId:first.id,expectedVersion:first.version});assert.deepEqual(reused,first);
  const message=server.app.store.create('message',project.id,{sessionId:first.id,role:'assistant',content:'Branch point',mode:'prompt',status:'completed'}),branch=await request(`/sessions/${first.id}/branch`,{messageId:message.id});
  assert.notEqual(branch.skillBundleId,initial);assert.equal(branch.skillBundleId,second.skillBundleId);assert.equal(branch.parentSessionId,first.id);assert.equal(server.app.sessions.get(USER,first.id).skillBundleId,initial);
  assert.equal(server.app.store.list('agent-admission').length,0);assert.equal(server.app.store.list('task-attempt').length,0);
  await server.close();server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});port=await server.listen();
  for(const session of [first,second,branch])assert.equal((await request(`/sessions/${session.id}`)).skillBundleId,session.skillBundleId);
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});
