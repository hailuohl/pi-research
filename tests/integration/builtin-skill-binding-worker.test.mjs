import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {selectSessionSkills} from '../../dist/packages/skills/runtime.js';
import {BUNDLE_ID} from '../../dist/packages/skills/manifest.js';
const legacy='6683733f868b846a6bed3434bba1ff2bdceed99aece0538ac75fe1c70bbd89f2';
async function until(host,predicate){const deadline=Date.now()+10000;do{host.tick();if(predicate())return;await delay(10);}while(Date.now()<deadline);assert.fail('Builtin IPC condition not reached within 10 seconds');}
test('real IPC keeps historical builtin reads through an upgrade and host restart, while new bindings use the selected release',async()=>{
 const s=setup();let forks=0;
 const options={inspect:()=>({ready:true,code:'IPC_FIXTURE',message:'No SDK or model'}),workerEntry:resolve('tests/fixtures/skill-binding-worker.mjs'),fork:(entry,args,opts)=>{forks++;return fork(entry,args,{...opts,env:{...opts.env,SKILL_BINDING_FIXTURE_SKILL:'pi-research-paper'}});}};
 let host=new AgentHost(s.app,options);
 const replies=id=>s.app.sessions.messages(USER,id).filter(m=>m.role==='assistant').map(m=>JSON.parse(m.content));
 const select=session=>selectSessionSkills(s.app,USER,s.project.id,{sessionId:session.id,expectedVersion:session.version,skillIds:['pi-research-paper']});
 const finish=async(id,expected)=>{s.app.sessions.send(USER,id,{content:'READ_AFTER_RECONFIGURE',mode:'steer'});await until(host,()=>replies(id).filter(r=>r.phase==='second').length===expected&&host.active.size===0);};
 try{
  assert.notEqual(BUNDLE_ID,legacy);
  const old=s.app.skills.configure(USER,s.project.id,{expectedVersion:0,bundleId:legacy});select(s.session);
  s.app.sessions.send(USER,s.session.id,{content:'Read historical builtin paper'});await until(host,()=>replies(s.session.id).some(r=>r.phase==='first'));
  const first=replies(s.session.id)[0];assert.equal(first.bundleId,legacy);assert.match(first.reads[0].content,/未实现 LaTeX/);
  const configured=s.app.skills.configure(USER,s.project.id,{expectedVersion:old.version,revisionIds:[],builtinBundleId:BUNDLE_ID});assert.equal(configured.bundleId,BUNDLE_ID);
  await finish(s.session.id,1);const second=replies(s.session.id).find(r=>r.phase==='second');assert.deepEqual(second.reads[0],second.reads[1]);
  const fresh=s.app.sessions.create(USER,s.project.id,{});select(fresh);s.app.sessions.send(USER,fresh.id,{content:'Read selected new builtin paper'});await until(host,()=>replies(fresh.id).some(r=>r.phase==='first'));
  const current=replies(fresh.id)[0],expected=s.app.skills.read('coordinator','pi-research-paper');assert.equal(current.bundleId,BUNDLE_ID);assert.notEqual(current.reads[0].digest,first.reads[0].digest);assert.deepEqual(current.reads[0],{bundleId:BUNDLE_ID,digest:expected.digest,content:expected.content});await finish(fresh.id,1);
  await host.stop();host=new AgentHost(s.app,options);
  s.app.sessions.send(USER,s.session.id,{content:'Resume original fixed builtin after host restart'});await until(host,()=>replies(s.session.id).filter(r=>r.phase==='first').length===2);await finish(s.session.id,2);
  const resumed=replies(s.session.id).filter(r=>r.phase==='second').at(-1);assert.equal(resumed.bundleId,legacy);assert.deepEqual(resumed.reads[0],first.reads[0]);
  const unknown=s.app.sessions.create(USER,s.project.id,{});s.app.store.update('session',unknown.id,unknown.version,{skillBundleId:'f'.repeat(64),skillIds:['pi-research-paper']});const forkCount=forks;
  s.app.sessions.send(USER,unknown.id,{content:'Unknown builtin must not start'});await until(host,()=>s.app.sessions.get(USER,unknown.id).state==='failed');const refused=s.app.sessions.get(USER,unknown.id);
  assert.match(refused.lastError,/SKILL_BUNDLE_UNKNOWN/);assert.equal(refused.generation,0);assert.equal(forks,forkCount);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);assert.equal(forks,3);
  if(process.env.BUILTIN_SKILL_BINDING_EVIDENCE){const path=resolve(process.env.BUILTIN_SKILL_BINDING_EVIDENCE);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify({fixture:'real-child-ipc-no-sdk-no-model',legacyBundleId:legacy,newBundleId:BUNDLE_ID,legacyReads:second.reads.map(({bundleId,digest})=>({bundleId,digest})),newRead:{bundleId:current.bundleId,digest:current.reads[0].digest},resumed:{bundleId:resumed.bundleId,digest:resumed.reads[0].digest},unknown:{state:refused.state,generation:refused.generation,error:refused.lastError},forks,workersHeld:0,modelRequests:0},null,2)+'\n');}
 }finally{await host.stop();s.close();}
});
