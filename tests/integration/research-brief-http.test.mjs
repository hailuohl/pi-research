import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';

test('research question and plan stay in their dialogue across HTTP retries and reopening',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-research-brief-http-'));let server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const project=server.app.projects.create(USER,{name:'研究问题 transport',template:'curve-fit'}),session=server.app.sessions.create(USER,project.id,{title:'研究主会话'}),other=server.app.sessions.create(USER,project.id,{title:'另一研究'});
  let port=await server.listen();
  const call=async(name,input,sid=session.id,key=randomUUID())=>{const res=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{'content-type':'application/json','idempotency-key':key},body:JSON.stringify({projectId:project.id,sessionId:sid,input})});return {status:res.status,value:await res.json()};};
  const input={expectedRevisionId:null,question:'多项式阶数影响泛化误差吗？',scope:'使用项目固定训练与评估协议',constraints:['固定数据划分'],successCriteria:['比较真实测试误差'],clarificationQuestions:[],literatureSummary:'本次测试无文献，假设待验证',hypotheses:[{statement:'增加阶数可能改变误差，尚未验证',evidenceIds:[]}],evidenceIds:[],steps:[{title:'运行基线',description:'保持固定协议比较指标'}],status:'ready'},key=randomUUID();
  const saved=await call('research_brief_save',input,session.id,key);assert.equal(saved.status,200,JSON.stringify(saved.value));
  assert.deepEqual(await call('research_brief_save',input,session.id,key),saved);
  const second=await call('research_brief_save',input,other.id,key);assert.equal(second.status,200);assert.notEqual(second.value.id,saved.value.id);assert.equal(second.value.rootSessionId,other.id);
  assert.notEqual((await call('research_brief_inspect',{briefId:saved.value.id},other.id)).status,200);
  assert.equal((await call('research_brief_save',{...input,rootSessionId:other.id})).value.error.code,'INVALID_INPUT');
  const confirmed=await call('research_brief_confirm',{briefId:saved.value.id,expectedVersion:saved.value.version});assert.equal(confirmed.status,200,JSON.stringify(confirmed.value));assert.equal(confirmed.value.status,'confirmed');
  assert.equal(server.app.store.list('approval',project.id).length,0);assert.equal(server.app.store.list('run',project.id).length,0);
  const state=await fetch(`http://127.0.0.1:${port}/api/projects/${project.id}/state?sessionId=${session.id}`).then(r=>r.json());assert.equal(state.researchBrief.brief.id,saved.value.id);assert.equal(state.researchBrief.brief.status,'confirmed');
  const current=server.app.sessions.get(USER,session.id);assert.equal(current.researchBriefId,saved.value.id);
  await server.close();server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});port=await server.listen();
  const reopened=await call('research_brief_inspect',{});assert.equal(reopened.status,200);assert.equal(reopened.value.brief.status,'confirmed');
  const revision=await call('research_brief_save',{...input,expectedRevisionId:saved.value.id,question:'仅比较两个明确阶数',status:'clarifying',clarificationQuestions:['具体比较哪两个阶数？']});assert.equal(revision.status,200);
  const history=await call('research_brief_inspect',{briefId:saved.value.id});assert.equal(history.value.brief.question,input.question);assert.equal(history.value.latestId,revision.value.id);assert.equal(history.value.history.length,2);
  const conflict=await call('research_brief_save',{...input,expectedRevisionId:saved.value.id});assert.notEqual(conflict.status,200);assert.equal(server.app.store.list('research-brief',project.id).length,3);
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
