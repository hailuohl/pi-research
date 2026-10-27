import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
async function until(host,predicate){const deadline=Date.now()+10000;do{host.tick();if(predicate())return;await delay(10);}while(Date.now()<deadline);assert.fail('Builtin IPC condition not reached within 10 seconds');}
test('real IPC refuses unknown builtin sessions without forking or holding workers',async()=>{
 const s=setup();let forks=0;
 const options={inspect:()=>({ready:true,code:'IPC_FIXTURE',message:'No SDK or model'}),workerEntry:resolve('tests/fixtures/skill-binding-worker.mjs'),fork:(entry,args,opts)=>{forks++;return fork(entry,args,opts);}};
 const host=new AgentHost(s.app,options);
 try{
  const unknown=s.app.sessions.create(USER,s.project.id,{});s.app.store.update('session',unknown.id,unknown.version,{skillBundleId:'f'.repeat(64),skillIds:['pi-research-paper']});const forkCount=forks;
  s.app.sessions.send(USER,unknown.id,{content:'Unknown builtin must not start'});await until(host,()=>s.app.sessions.get(USER,unknown.id).state==='failed');const refused=s.app.sessions.get(USER,unknown.id);
  assert.match(refused.lastError,/SKILL_BUNDLE_UNKNOWN/);assert.equal(refused.generation,0);assert.equal(forks,forkCount);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
 }finally{await host.stop();s.close();}
});
