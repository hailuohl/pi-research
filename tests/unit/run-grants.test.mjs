import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {Worker} from 'node:worker_threads';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {setup,USER,approve,campaign,enroll,submit,fixtureFinish} from '../support/research.mjs';
import {assertRunGrantRun} from '../../dist/packages/policy/run-grant-validation.js';
import {digest} from '../../dist/packages/storage/store.js';
import {RUN_GRANT_SCHEMA} from '../../dist/packages/contracts/operations/run-grant-schemas.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

function intent(s,degree=2){const e=s.app.experiments.create(USER,s.project.id,{title:`fixed ${degree}`,parentId:s.baseline.id,config:{polynomialDegree:degree,ridge:0.000001}});return s.app.runs.prepare(USER,e.id);}
function prepare(s,intents=[intent(s),intent(s,3)],extra={}){return s.app.runGrants.prepare(USER,s.project.id,{sessionId:s.session.id,intentIds:intents.map(i=>i.id),maxRuns:1,expiresAt:new Date(Date.now()+60000).toISOString(),...extra});}
function activate(s,g){approve(s.app,g.approvalId);return s.app.runGrants.activate(USER,s.project.id,{grantId:g.id,expectedVersion:g.version});}
function active(s,extra={}){const intents=[intent(s),intent(s,3)],grant=activate(s,prepare(s,intents,extra));return {intents,grant};}
function agent(s,sessionId=s.session.id){let session=s.app.sessions.get(USER,sessionId);session=s.app.store.update('session',session.id,session.version,{state:'running',generation:session.generation+1,leaseUntil:Date.now()+60000});return {type:'agent',projectId:s.project.id,sessionId,role:'coordinator',generation:session.generation};}

test('RunGrant inspection shows newly frozen threads while grants containing old intents never add them',()=>{
 const s=setup();try{
  const contract={runner:'docker',image:'python@sha256:'+'a'.repeat(64),command:['python','main.py'],environment:{},datasetVersion:'fixture',evaluationProtocolVersion:'fixture',metrics:{mse:{unit:'fixture',direction:'min'}},expectedArtifacts:['metrics.json'],cpus:2,memoryMb:256};
  const fresh=s.app.experiments.create(USER,s.project.id,{title:'Fresh thread contract',contract}),freshIntent=s.app.runs.prepare(USER,fresh.id);
  let legacy=s.app.experiments.create(USER,s.project.id,{title:'Old thread contract',contract});const oldContract={...legacy.contract};delete oldContract.threadLimit;legacy=s.app.store.update('experiment',legacy.id,legacy.version,{contract:oldContract,contractDigest:digest(oldContract)});
  const prepared=s.app.runs.prepare(USER,legacy.id),oldManifest={...prepared.manifest};delete oldManifest.threadLimit;const oldDigest=digest(oldManifest),old=s.app.store.get('run-intent',prepared.id),approval=s.app.store.get('approval',prepared.approvalId);
  const legacyIntent=s.app.store.update('run-intent',old.id,old.version,{manifest:oldManifest,manifestDigest:oldDigest});s.app.store.update('approval',approval.id,approval.version,{digest:oldDigest});
  const grant=prepare(s,[freshIntent,legacyIntent],{maxRuns:2});validateSchema(RUN_GRANT_SCHEMA,grant);assert.equal(grant.manifests.find(m=>m.intentId===freshIntent.id).threadLimit,2);assert.equal(Object.hasOwn(grant.manifests.find(m=>m.intentId===legacyIntent.id),'threadLimit'),false);
  activate(s,grant);const run=s.app.runs.submit(USER,legacyIntent.id);assert.equal(run.manifestDigest,oldDigest);assert.equal(Object.hasOwn(run.manifest,'threadLimit'),false);assert.equal(Object.hasOwn(run.manifest.contract,'threadLimit'),false);assert.equal(run.manifest.contractDigest,legacy.contractDigest);
 }finally{s.close();}
});

test('RunGrant activation preserves exact manifest and original approval IDs without starting anything',()=>{const s=setup();try{
 const intents=[intent(s),intent(s,3)],grant=prepare(s,intents);assert.equal(grant.effectiveState,'draft');assert.equal(JSON.stringify(grant).includes('snapshotPath'),false);assert.equal(s.app.store.list('run').length,0);assert.throws(()=>s.app.runGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version}),{code:'APPROVAL_REQUIRED'});
 activate(s,grant);assert.equal(s.app.store.list('run').length,0);assert.equal(s.app.store.list('model-usage').length,0);assert.equal(s.app.sessions.get(USER,s.session.id).runGrantId,grant.id);
 for(const before of intents){const after=s.app.store.get('run-intent',before.id),approval=s.app.store.get('approval',before.approvalId);assert.deepEqual(after.manifest,before.manifest);assert.equal(after.manifestDigest,before.manifestDigest);assert.equal(after.approvalId,before.approvalId);assert.equal(approval.status,'approved');assert.deepEqual(after.runGrant,approval.runGrant);assert.equal(after.runGrant.id,grant.id);}
}finally{s.close();}});

test('only unique pending unbound fixed intents are eligible and stale activation cannot overwrite authority',()=>{const s=setup();try{
 const first=intent(s);assert.throws(()=>prepare(s,[first,first]),{code:'INVALID_INPUT'});assert.throws(()=>prepare(s,[first],{maxRuns:2}),{code:'INVALID_INPUT'});
 const grant=prepare(s,[first]);approve(s.app,first.approvalId);approve(s.app,grant.approvalId);assert.throws(()=>s.app.runGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version}),{code:'RUN_GRANT_INTENT_UNAVAILABLE'});assert.equal(s.app.sessions.get(USER,s.session.id).runGrantId,undefined);assert.throws(()=>prepare(s,[first]),{code:'RUN_GRANT_INTENT_UNAVAILABLE'});
}finally{s.close();}});

test('bound Agent cannot use unlisted or foreign grants while owner independent one-time approval remains compatible',()=>{const s=setup();try{
 const {intents,grant}=active(s),who=agent(s),other=s.app.sessions.create(USER,s.project.id,{title:'other coordinator'}),foreign=agent(s,other.id),unlisted=intent(s,4);approve(s.app,unlisted.approvalId);
 assert.throws(()=>s.app.runs.submit(who,unlisted.id),{code:'RUN_GRANT_SCOPE_DENIED'});assert.throws(()=>s.app.runs.submit(foreign,intents[0].id),{code:'RUN_GRANT_SCOPE_DENIED'});
 const run=s.app.runs.submit(who,intents[0].id);assert.deepEqual(run.runGrant,{id:grant.id,digest:grant.digest,approvalId:grant.approvalId});assert.equal(s.app.runs.submit(who,intents[0].id).id,run.id);assert.throws(()=>s.app.runs.submit(who,intents[1].id),{code:'RUN_GRANT_EXHAUSTED'});assert.equal(s.app.runGrants.inspect(USER,s.project.id,grant.id).usage.used,1);
 assert.equal(s.app.runs.submit(USER,unlisted.id).state,'queued');assert.equal(s.app.store.list('run-grant-use').length,1);
}finally{s.close();}});

test('cancelled, failed and unknown runs permanently consume submission slots, with transactional rollback',()=>{for(const state of ['cancelled','failed','unknown']){const s=setup();try{
 const {intents,grant}=active(s),event=s.app.store.event.bind(s.app.store);s.app.store.event=(pid,type,payload)=>{if(type==='run.queued')throw Error('fixture rollback');return event(pid,type,payload);};assert.throws(()=>s.app.runs.submit(USER,intents[0].id),/fixture rollback/);s.app.store.event=event;assert.equal(s.app.store.list('run-grant-use').length,0);assert.equal(s.app.store.list('run').length,0);
 const run=s.app.runs.submit(USER,intents[0].id);if(state==='cancelled')s.app.runs.cancel(USER,run.id);else if(state==='failed')fixtureFinish(s,run,null,'failed');else s.app.store.update('run',run.id,run.version,{state:'unknown'});
 assert.equal(s.app.runs.submit(USER,intents[0].id).id,run.id);assert.throws(()=>s.app.runs.submit(USER,intents[1].id),{code:'RUN_GRANT_EXHAUSTED'});assert.equal(s.app.runGrants.inspect(USER,s.project.id,grant.id).usage.remaining,0);
}finally{s.close();}}});

test('manifest changes, original approval replacement and model changes are rechecked before new effects',()=>{for(const mutation of ['manifest','approval','model','grant-approval']){const s=setup();try{
 const {intents,grant}=active(s),i=s.app.store.get('run-intent',intents[0].id);
 if(mutation==='manifest')s.app.store.update('run-intent',i.id,i.version,{manifest:{...i.manifest,contract:{...i.manifest.contract,memoryMb:i.manifest.contract.memoryMb+1}}});
 if(mutation==='approval'){const a=s.app.approvals.request(s.project.id,'run-intent',i.id,i.manifestDigest,'run.submit','replacement fixture');approve(s.app,a.id);s.app.store.update('run-intent',i.id,i.version,{approvalId:a.id});}
 if(mutation==='model'){const session=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',session.id,session.version,{model:{...session.model,model:'changed'}});}
 if(mutation==='grant-approval'){const a=s.app.approvals.request(s.project.id,'run-grant',grant.id,grant.digest,'run-grant.activate','replacement fixture');approve(s.app,a.id);s.app.store.update('run-grant',grant.id,grant.version,{approvalId:a.id});}
 assert.throws(()=>s.app.runs.submit(USER,i.id),{code:mutation==='model'?'RUN_GRANT_SCOPE_CHANGED':mutation==='grant-approval'?'RUN_GRANT_CORRUPTED':'RUN_GRANT_INTENT_CHANGED'});assert.equal(s.app.store.list('run-grant-use').length,0);
}finally{s.close();}}});

test('expiry blocks new submit and pre-start launch but preserves authorized completed results',()=>{const s=setup(),clock=Date.now;try{
 const {intents,grant}=active(s,{maxRuns:2}),complete=s.app.runs.submit(USER,intents[0].id);fixtureFinish(s,complete);const queued=s.app.runs.submit(USER,intents[1].id);Date.now=()=>Date.parse(grant.expiresAt)+1;
 assert.throws(()=>s.app.runs.assertLaunchable(s.app.runs.get(USER,queued.id)),{code:'RUN_GRANT_EXPIRED'});assert.doesNotThrow(()=>assertRunGrantRun(s.app.store,s.app.runs.get(USER,complete.id),false));assert.equal(s.app.runGrants.inspect(USER,s.project.id,grant.id).effectiveState,'expired');
}finally{Date.now=clock;s.close();}});

test('Docker pre-start expiry uses its persisted execution marker even after startedAt was recorded',()=>{const s=setup(),clock=Date.now;try{
 const {intents,grant}=active(s),run=s.app.runs.submit(USER,intents[0].id),before={...run,startedAt:new Date().toISOString(),execution:{startRequested:false}};Date.now=()=>Date.parse(grant.expiresAt)+1;
 assert.throws(()=>s.app.runs.assertExecutionGrant(before),{code:'RUN_GRANT_EXPIRED'});
}finally{Date.now=clock;s.close();}});

test('revocation denies queued launch and archived authority use, but keeps replay and cancellation',()=>{const s=setup();try{
 const {intents,grant}=active(s),run=s.app.runs.submit(USER,intents[0].id);s.app.runGrants.revoke(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});assert.throws(()=>s.app.runs.assertLaunchable(run),{code:'RUN_GRANT_REVOKED'});assert.throws(()=>s.app.runs.submit(USER,intents[1].id),{code:'RUN_GRANT_REVOKED'});assert.equal(s.app.runs.submit(USER,intents[0].id).id,run.id);assert.equal(s.app.runs.cancel(USER,run.id).state,'cancelled');assert.equal(s.app.runGrants.inspect(USER,s.project.id,grant.id).usage.used,1);
}finally{s.close();}});

test('independent supervisor retains research-source validation rather than constructing a bare RunService',()=>{const s=setup();try{
 const c=campaign(s),control=submit(s,enroll(s,c));fixtureFinish(s,control);s.app.campaigns.observe();const observation=s.app.campaigns.observations(USER,c.id)[0],d=s.app.decisions.propose(USER,c.id,{expectedVersion:s.app.campaigns.get(USER,c.id).version,action:'refill',reason:'unit source boundary',observationIds:[observation.id],candidates:[{title:'planned',hypothesis:'fixture only',config:{polynomialDegree:3}}],experimentPlan:{hypothesis:'fixture',controlRunIds:[control.id],changedFactors:['degree'],dataSplit:'fixed fixture',dataArtifactIds:[],primaryMetric:'mse',guardrailMetrics:[],repetitions:{count:1,rationale:'fixture'},successCriteria:'review',inconclusiveCriteria:'missing',stoppingCriteria:'bounded'}});approve(s.app,d.approvalId);const applied=s.app.decisions.apply(USER,d.id,d.version),i=s.app.store.get('run-intent',applied.effects.intentIds[0]);activate(s,prepare(s,[i]));const run=s.app.runs.submit(USER,i.id);s.app.approvals.stale(d.id);
 execFileSync(process.execPath,['dist/apps/runner-supervisor/index.js',s.dir,process.cwd(),run.id],{windowsHide:true,stdio:'pipe',timeout:20000});const stopped=s.app.runs.get(USER,run.id);assert.equal(stopped.state,'cancelled');assert.equal(stopped.startRequested,undefined);assert.equal(stopped.childPid,undefined);
}finally{s.close();}});

test('independent controllers racing for the last RunGrant slot create exactly one Run and use',async()=>{const s=setup();try{
 const {intents}=active(s),module=pathToFileURL(resolve('dist/packages/research-app.js')).href,buffer=new SharedArrayBuffer(4);let ready=0;
 const workers=intents.map(i=>new Worker(`const {parentPort,workerData}=require('node:worker_threads');(async()=>{const {ResearchApp}=await import(workerData.module);const app=new ResearchApp(workerData.dir,workerData.repo);parentPort.postMessage({ready:true});Atomics.wait(new Int32Array(workerData.buffer),0,0);try{const r=app.runs.submit({type:'user'},workerData.id);parentPort.postMessage({runId:r.id});}catch(e){parentPort.postMessage({code:e.code});}finally{app.close();}})().catch(e=>parentPort.postMessage({code:e.code??String(e)}));`,{eval:true,workerData:{module,dir:s.dir,repo:process.cwd(),id:i.id,buffer}}));
 const exits=workers.map(w=>new Promise(resolve=>w.on('exit',resolve))),results=workers.map(w=>new Promise((resolve,reject)=>{w.on('message',m=>{if(m.ready){if(++ready===2){Atomics.store(new Int32Array(buffer),0,1);Atomics.notify(new Int32Array(buffer),0);}}else resolve(m);});w.on('error',reject);}));const completed=await Promise.all(results);await Promise.all(exits);assert.equal(completed.filter(r=>r.runId).length,1);assert.deepEqual(completed.filter(r=>r.code).map(r=>r.code),['RUN_GRANT_EXHAUSTED']);assert.equal(s.app.store.list('run').length,1);assert.equal(s.app.store.list('run-grant-use').length,1);
}finally{s.close();}});
