import test from 'node:test';import assert from 'node:assert/strict';import {fork} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';import {dirname,resolve} from 'node:path';import {setTimeout as delay} from 'node:timers/promises';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {selectSessionSkills} from '../../dist/packages/skills/runtime.js';
async function until(host,predicate){const deadline=Date.now()+5000;do{host.tick();if(predicate())return;await delay(10);}while(Date.now()<deadline);assert.fail('IPC condition not reached within 5 seconds');}
function enable(s,tag){const revision=s.app.skills.import(USER,s.project.id,{packageId:'ipc-binding-fixture',revisionTag:tag,description:'Real IPC binding fixture; no model',roles:['coordinator'],license:null,requirements:{tools:['research_skill_read'],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from(`Fixed fixture body ${tag}`).toString('base64')}]},`import-${tag}`);s.app.skills.review(USER,s.project.id,{revisionId:revision.id,decision:'approved',note:'Fixture text reviewed'});const configuration=s.app.skills.configure(USER,s.project.id,{expectedVersion:s.app.skills.configuration(s.project.id).version,revisionIds:[revision.id]});return {revision,configuration};}
test('real IPC in-flight skill reads stay on v1 after enabling v2 and revoking v1; later launch is blocked',async()=>{
 const s=setup();let forks=0;const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'IPC_FIXTURE',message:'No SDK or model'}),workerEntry:resolve('tests/fixtures/skill-binding-worker.mjs'),fork:(...args)=>{forks++;return fork(...args);}});
 const replies=()=>s.app.sessions.messages(USER,s.session.id).filter(m=>m.role==='assistant').map(m=>JSON.parse(m.content));
 try{
  const v1=enable(s,'v1');selectSessionSkills(s.app,USER,s.project.id,{sessionId:s.session.id,expectedVersion:s.session.version,skillIds:['ipc-binding-fixture']});
  const prompt=s.app.sessions.send(USER,s.session.id,{content:'Read selected fixture skill'});
  await until(host,()=>replies().some(r=>r.phase==='first'));
  const first=replies().find(r=>r.phase==='first');assert.equal(first.reads[0].content,'Fixed fixture body v1');assert.equal(host.active.size,1);
  const v2=enable(s,'v2');assert.notEqual(v1.configuration.bundleId,v2.configuration.bundleId);
  s.app.skills.revoke(USER,s.project.id,{revisionId:v1.revision.id,note:'Fixture revocation while child is running'});
  const steer=s.app.sessions.send(USER,s.session.id,{content:'READ_AFTER_RECONFIGURE',mode:'steer'});
  await until(host,()=>replies().some(r=>r.phase==='second')&&host.active.size===0);
  const result=replies().find(r=>r.phase==='second');assert.equal(result.bundleId,v1.configuration.bundleId);assert.equal(result.reads.length,2);assert.deepEqual(result.reads[0],result.reads[1]);assert.equal(result.reads[1].digest,v1.revision.files.find(f=>f.path==='SKILL.md').digest);assert.notEqual(result.reads[1].digest,v2.revision.files.find(f=>f.path==='SKILL.md').digest);
  assert.equal(s.app.store.get('message',prompt.id).status,'completed');assert.equal(s.app.store.get('message',steer.id).status,'completed');
  const before=s.app.sessions.get(USER,s.session.id),newMessage=s.app.sessions.send(USER,s.session.id,{content:'A new launch must be refused'});
  await until(host,()=>s.app.sessions.get(USER,s.session.id).state==='failed');
  const after=s.app.sessions.get(USER,s.session.id);assert.match(after.lastError,/SKILL_REVOKED/);assert.equal(after.generation,before.generation);assert.equal(host.active.size,0);assert.equal(forks,1);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);assert.notEqual(s.app.store.get('message',newMessage.id).status,'running');
  if(process.env.SKILL_BINDING_EVIDENCE){const path=resolve(process.env.SKILL_BINDING_EVIDENCE);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify({fixture:'real-child-ipc-no-sdk-no-model',modelRequests:0,forks,projectId:s.project.id,sessionId:s.session.id,initialBundleId:v1.configuration.bundleId,currentBundleId:v2.configuration.bundleId,revokedRevisionId:v1.revision.id,reads:result.reads.map(({bundleId,digest})=>({bundleId,digest})),newStart:{state:after.state,generation:after.generation,error:after.lastError,workersHeld:0}},null,2));}
 }finally{await host.stop();s.close();}
});
