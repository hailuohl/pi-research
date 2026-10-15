import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';

test('HTTP selected dialogue cards require USER clicks, preserve chat and report export, and reopen',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'research-actions-http-')),service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0}),app=service.app;let reopened;
 try{
  const p=app.projects.create(USER,{name:'Action cards',template:'empty'}),session=app.sessions.create(USER,p.id,{}),other=app.sessions.create(USER,p.id,{}),oldChat=app.store.create('message',p.id,{sessionId:session.id,role:'assistant',content:'Old saved chat',mode:'prompt',status:'completed'});
  const source=app.evidence.put(p.id,'original.txt',Buffer.from('Saved source statement'),'text/plain','user'),e=app.evidence.register(USER,p.id,source.id,0,5,'Fixed source'),c=app.evidence.proposeClaim(USER,p.id,'Saved claim',[e.id],['Synthetic fixture']);
  const s=app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+120000}),m=app.store.create('message',p.id,{sessionId:s.id,role:'user',content:'Confirm existing claim',mode:'prompt',status:'running',generation:1}),who={type:'agent',projectId:p.id,sessionId:s.id,role:'coordinator',generation:1,messageId:m.id,researchModelDigest:app.researchAutomation.modelIdentity(s)};
  const card=app.operations.execute(who,'research_action_prepare',{kind:'claim_decision',claim:{claimId:c.id,expectedVersion:1}},{projectId:p.id,sessionId:s.id,idempotencyKey:'agent-claim'});
  const port=await service.listen();await service.host.stop();
  const req=async(path,body,key=randomUUID())=>{const response=await fetch(`http://127.0.0.1:${port}/api${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,data:await response.json()};};
  const decideBody={projectId:p.id,sessionId:s.id,input:{requestId:card.id,expectedVersion:1,decision:'accepted'}};
  const state=await req(`/projects/${p.id}/state?sessionId=${s.id}`);assert.equal(state.status,200);assert.equal(state.data.researchActions.length,1);assert.equal(state.data.researchActions[0].input.claim.claimId,c.id);assert.equal(app.store.get('claim',c.id).status,'proposal');
  const another=await req(`/projects/${p.id}/state?sessionId=${other.id}`);assert.deepEqual(another.data.researchActions,[]);
  const branch=app.sessions.branch(USER,s.id,m.id),branchState=await req(`/projects/${p.id}/state?sessionId=${branch.id}`);assert.equal(branchState.status,200);assert.deepEqual(branchState.data.researchActions,[]);
  assert.equal((await req('/operations/research_action_prepare',{projectId:p.id,sessionId:s.id,input:{kind:'history',history:{kind:'reports'}}})).status,403);
  assert.equal((await req('/operations/research_action_decide',{...decideBody,sessionId:other.id})).status,403);
  assert.equal((await req('/operations/research_action_decide',{projectId:p.id,input:decideBody.input})).data.error.code,'SESSION_REQUIRED');
  const accepted=await req('/operations/research_action_decide',decideBody,'click-claim');assert.equal(accepted.status,200);assert.equal(accepted.data.state,'completed');assert.equal(app.store.get('claim',c.id).status,'accepted');assert.deepEqual((await req('/operations/research_action_decide',decideBody,'click-claim')).data,accepted.data);
  const current=app.store.get('session',s.id),reportSession=app.store.update('session',current.id,current.version,{state:'running',generation:current.generation+1,leaseUntil:Date.now()+120000}),reportMessage=app.store.create('message',p.id,{sessionId:s.id,role:'user',content:'Compose existing results',mode:'prompt',status:'running',generation:reportSession.generation}),reportActor={...who,generation:reportSession.generation,messageId:reportMessage.id,researchModelDigest:app.researchAutomation.modelIdentity(reportSession)};
  const report=app.operations.execute(reportActor,'research_action_prepare',{kind:'report_compose',report:{title:'HTTP fixed report',runIds:[],claimIds:[c.id],publicationResultIds:[]}},{projectId:p.id,sessionId:s.id,idempotencyKey:'agent-report'});
  assert.equal(app.store.list('report',p.id).length,0);const reportBody={projectId:p.id,sessionId:s.id,input:{requestId:report.id,expectedVersion:1,decision:'confirm'}},composed=await req('/operations/research_action_decide',reportBody,'click-report');assert.equal(composed.status,200);assert.deepEqual(Object.keys(composed.data.resultRef),['reportId']);assert.equal(JSON.stringify(composed.data).includes('artifactId'),false);
  const exported=await req('/operations/report_export',{projectId:p.id,input:{reportId:composed.data.resultRef.reportId}},'export-report');assert.equal(exported.status,200);assert.equal(exported.data.mediaType,'application/gzip');
  assert.equal(app.store.get('message',oldChat.id).content,'Old saved chat');assert.equal((await req(`/evidence/${e.id}`)).data.quote,'Saved');
  await service.close();reopened=new ResearchApp(dir,process.cwd());const retained=reopened.researchActions.list(USER,p.id,s.id);assert.equal(retained.length,2);assert.equal(retained.find(r=>r.id===report.id).resultRef.reportId,composed.data.resultRef.reportId);assert.equal(reopened.store.get('message',oldChat.id).content,'Old saved chat');assert.equal(reopened.store.list('report-export',p.id).length,1);
 }finally{reopened?.close();await service.close();rmSync(dir,{recursive:true,force:true});}
});
