import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Worker} from 'node:worker_threads';
import {setup,USER,approve} from '../support/research.mjs';
import {actor,result} from '../support/collaboration.mjs';
import {digest} from '../../dist/packages/storage/store.js';
import {readSourceMode,snapshotDirectory} from '../../dist/packages/workspace/files.js';

const input={command:['python','check.py'],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`,resources:{cpus:2,memoryMb:512}};
function prepared(s,extra={}){
 s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});writeFileSync(join(s.session.workspace,'check.py'),'assert 2 + 2 == 4\n');writeFileSync(join(s.session.workspace,'editable.txt'),'1234');writeFileSync(join(s.session.workspace,'second.txt'),'1234');
 const template=s.app.development.prepare(USER,s.project.id,s.session.id,input),grant=s.app.workingGrants.prepare(USER,s.project.id,{developmentTaskId:template.id,editablePaths:['editable.txt','second.txt'],maxTests:2,maxChangedBytes:16,expiresAt:new Date(Date.now()+60000).toISOString(),...extra});return {template,grant};
}
function active(s,extra={}){const {template,grant}=prepared(s,extra);approve(s.app,grant.approvalId);return {template,grant:s.app.workingGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version})};}
function prepareTest(s,extra={}){return s.app.development.prepare(USER,s.project.id,s.session.id,{...input,...extra});}
function write(s,path,content){const file=join(s.session.workspace,path),expected=(()=>{try{return digest(readFileSync(file));}catch{return null;}})();return s.app.operations.execute(USER,'workspace_write',{source:'session',path,content,expectedDigest:expected},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:crypto.randomUUID()});}
function finished(s,task,success=true){const dto=s.app.development.submit(USER,s.project.id,task.id),job=s.app.store.get('sandbox-job',dto.id);writeFileSync(join(job.controlDir,'stdout.log'),'UNIT FIXTURE, not Docker execution\n');writeFileSync(join(job.controlDir,'stderr.log'),success?'':'UNIT FIXTURE failure\n');return s.app.development.finalize(job.id,{state:success?'succeeded':'failed',exitCode:success?0:1});}
function reviewed(s,job){const project=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,s.project.id,{expectedVersion:project.version,enabled:true});const review=s.app.developmentReviews.prepare(USER,s.project.id,{jobId:job.id});approve(s.app,review.approvalId);s.app.teams.activate(USER,review.teamId);const claimed=s.app.teams.claim(review.teamId);assert.ok(claimed);s.app.teams.submit(actor(claimed),result({verdict:'accept',evidenceIds:review.requiredEvidenceIds}));return review;}

test('WorkingGrant draft and activation freeze the template without authorizing model or formal Run',()=>{const s=setup();try{
 const {template,grant}=prepared(s);assert.equal(grant.effectiveState,'draft');assert.equal(grant.usage.used,0);assert.equal(grant.baselineSnapshot.path,undefined);assert.equal(JSON.stringify(grant).includes(s.dir.replaceAll('\\','\\\\')),false);assert.equal(s.app.store.list('sandbox-job').length,0);assert.equal(s.app.store.list('model-usage').length,0);
 assert.throws(()=>s.app.workingGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version}),{code:'APPROVAL_REQUIRED'});approve(s.app,grant.approvalId);s.app.workingGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});assert.equal(s.app.sessions.get(USER,s.session.id).workingGrantId,grant.id);
 approve(s.app,template.grantId);assert.throws(()=>s.app.development.submit(USER,s.project.id,template.id),{code:'WORKING_GRANT_REQUIRED'});const intent=s.app.runs.prepare(USER,s.baseline.id);assert.throws(()=>s.app.runs.submit(USER,intent.id),{code:'APPROVAL_REQUIRED'});
 assert.throws(()=>s.app.workingGrants.prepare(USER,s.project.id,{developmentTaskId:template.id,editablePaths:['editable.txt'],maxTests:2,maxChangedBytes:16,expiresAt:new Date(Date.now()+60000).toISOString()}),{code:'WORKING_GRANT_ALREADY_BOUND'});
}finally{s.close();}});

test('activation rejects private source drift, model drift and unsupported unbound sessions',()=>{for(const mutation of ['source','model']){const s=setup();try{const {grant}=prepared(s);approve(s.app,grant.approvalId);if(mutation==='source')writeFileSync(join(s.session.workspace,'editable.txt'),'abcd');else{const session=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',session.id,session.version,{model:{...session.model,model:'changed'}});}assert.throws(()=>s.app.workingGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version}),{code:mutation==='source'?'WORKING_GRANT_TEMPLATE_STALE':'WORKING_GRANT_SCOPE_CHANGED'});assert.equal(s.app.sessions.get(USER,s.session.id).workingGrantId,undefined);}finally{s.close();}}
 const s=setup();try{writeFileSync(join(s.session.workspace,'check.py'),'assert True');const template=prepareTest(s);assert.throws(()=>s.app.workingGrants.prepare(USER,s.project.id,{developmentTaskId:template.id,editablePaths:['check.py'],maxTests:1,maxChangedBytes:16,expiresAt:new Date(Date.now()+60000).toISOString()}),{code:'WORKING_GRANT_SESSION_REQUIRED'});}finally{s.close();}});

test('private writes use exact canonical paths and cumulative changed-file bytes, not length differences',()=>{const s=setup();try{
 active(s,{maxChangedBytes:7});write(s,'editable.txt','abcd');assert.equal(readFileSync(join(s.session.workspace,'editable.txt'),'utf8'),'abcd');assert.throws(()=>write(s,'second.txt','efgh'),{code:'WORKING_GRANT_BYTES_EXCEEDED'});assert.equal(readFileSync(join(s.session.workspace,'second.txt'),'utf8'),'1234');
 assert.throws(()=>write(s,'check.py','pass'),{code:'WORKING_GRANT_PATH_DENIED'});assert.throws(()=>write(s,'./editable.txt','pass'));assert.throws(()=>write(s,'editable.txt:stream','pass'));assert.throws(()=>write(s,'Editable.txt','pass'),{code:'WORKING_GRANT_PATH_DENIED'});
 write(s,'editable.txt','1234');assert.doesNotThrow(()=>write(s,'second.txt','efgh'));assert.throws(()=>s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1}),{code:'WORKING_GRANT_SOURCE_LOCKED'});
}finally{s.close();}});

test('mode changes and externally altered unapproved source are checked against the same original snapshot',()=>{const s=setup();try{
 active(s);let snap=snapshotDirectory(s.session.workspace,join(s.dir,'snapshots'));assert.throws(()=>s.app.git.setMode(USER,s.project.id,s.session.id,{path:'check.py',mode:'100755',expectedSourceDigest:snap.digest}),{code:'WORKING_GRANT_PATH_DENIED'});
 s.app.git.setMode(USER,s.project.id,s.session.id,{path:'editable.txt',mode:'100755',expectedSourceDigest:snap.digest});assert.equal(readSourceMode(s.session.workspace,'editable.txt'),'100755');
 writeFileSync(join(s.session.workspace,'check.py'),'assert False\n');assert.throws(()=>prepareTest(s),{code:'WORKING_GRANT_PATH_DENIED'});
}finally{s.close();}});

test('each prepared test gets a distinct frozen derived receipt and only submit consumes permanent quota',()=>{const s=setup();try{
 const {grant}=active(s),first=prepareTest(s);assert.deepEqual(first.manifest.workingGrant,{id:grant.id,digest:grant.digest,approvalId:grant.approvalId});const receipt=s.app.store.get('approval',first.grantId);assert.equal(receipt.status,'approved');assert.deepEqual(receipt.workingGrant,first.manifest.workingGrant);assert.equal(s.app.workingGrants.inspect(USER,s.project.id,grant.id).usage.used,0);
 const failed=finished(s,first,false);write(s,'editable.txt','abcd');const second=prepareTest(s);assert.notEqual(second.sourceDigest,first.sourceDigest);const passed=finished(s,second);assert.equal(failed.state,'failed');assert.equal(passed.state,'succeeded');assert.equal(s.app.development.submit(USER,s.project.id,first.id).id,failed.id);assert.equal(s.app.store.list('working-grant-use').length,2);
 const third=prepareTest(s);assert.throws(()=>s.app.development.submit(USER,s.project.id,third.id),{code:'WORKING_GRANT_EXHAUSTED'});const state=s.app.workingGrants.inspect(USER,s.project.id,grant.id);assert.equal(state.effectiveState,'exhausted');assert.deepEqual(state.usage,{limit:2,used:2,remaining:0,unit:'test-submission'});assert.equal(s.app.store.list('sandbox-job').length,2);
}finally{s.close();}});

test('cancellation and unknown jobs retain submitted slots; failed enqueue rolls the use back atomically',()=>{const s=setup();try{
 const {grant}=active(s),first=prepareTest(s),job=s.app.development.submit(USER,s.project.id,first.id);s.app.development.cancel(USER,s.project.id,job.id);assert.equal(s.app.workingGrants.inspect(USER,s.project.id,grant.id).usage.used,1);
 const second=prepareTest(s),original=s.app.store.event.bind(s.app.store);s.app.store.event=(pid,type,value)=>{if(type==='development.submitted')throw Error('fixture rollback');return original(pid,type,value);};assert.throws(()=>s.app.development.submit(USER,s.project.id,second.id),/fixture rollback/);s.app.store.event=original;assert.equal(s.app.workingGrants.inspect(USER,s.project.id,grant.id).usage.used,1);
 const next=s.app.development.submit(USER,s.project.id,second.id),stored=s.app.store.get('sandbox-job',next.id);s.app.store.update('sandbox-job',stored.id,stored.version,{state:'unknown'});assert.equal(s.app.workingGrants.inspect(USER,s.project.id,grant.id).usage.remaining,0);
}finally{s.close();}});

test('fixed test scope rejects command/image/data changes and resource increases while allowing lower resources',()=>{const s=setup();try{
 active(s);for(const bad of [{command:['python','other.py']},{environmentImageDigest:`python@sha256:${'b'.repeat(64)}`},{dockerContext:'other'},{expectedArtifacts:['new.txt']},{resources:{cpus:3}},{resources:{memoryMb:1024}}])assert.throws(()=>prepareTest(s,bad),{code:'WORKING_GRANT_TEST_DENIED'});
 const lower=prepareTest(s,{resources:{cpus:1,memoryMb:256}});assert.equal(lower.manifest.resources.cpus,1);assert.equal(lower.manifest.resources.memoryMb,256);assert.equal(s.app.development.submit(USER,s.project.id,lower.id).state,'queued');
}finally{s.close();}});

test('expiration blocks new effects and queued launch but does not invalidate completed immutable results',()=>{const s=setup(),clock=Date.now;try{
 const {grant}=active(s),complete=finished(s,prepareTest(s)),pending=prepareTest(s),queued=s.app.development.submit(USER,s.project.id,pending.id);Date.now=()=>Date.parse(grant.expiresAt)+1;
 assert.throws(()=>write(s,'editable.txt','abcd'),{code:'WORKING_GRANT_EXPIRED'});assert.throws(()=>prepareTest(s),{code:'WORKING_GRANT_EXPIRED'});assert.throws(()=>s.app.development.assertCurrent(s.app.store.get('sandbox-job',queued.id)),{code:'WORKING_GRANT_EXPIRED'});assert.equal(s.app.development.assertResultMatches(USER,s.project.id,complete.id,complete.sourceDigest).state,'succeeded');assert.equal(s.app.workingGrants.inspect(USER,s.project.id,grant.id).effectiveState,'expired');
}finally{Date.now=clock;s.close();}});

test('revocation blocks source writes and background recovery while preserving read/cancel and completed bytes',()=>{const s=setup();try{
 const {grant}=active(s),complete=finished(s,prepareTest(s)),pending=prepareTest(s),queued=s.app.development.submit(USER,s.project.id,pending.id),before=readFileSync(s.app.store.get('artifact',complete.reportArtifactId).path);
 s.app.workingGrants.revoke(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});assert.throws(()=>write(s,'editable.txt','abcd'),{code:'WORKING_GRANT_REVOKED'});assert.throws(()=>prepareTest(s),{code:'WORKING_GRANT_REVOKED'});assert.throws(()=>s.app.development.assertCurrent(s.app.store.get('sandbox-job',queued.id)),{code:'WORKING_GRANT_REVOKED'});assert.throws(()=>s.app.development.assertResultMatches(USER,s.project.id,complete.id,complete.sourceDigest),{code:'WORKING_GRANT_REVOKED'});
 assert.equal(s.app.development.logs(USER,s.project.id,complete.id,'stdout').complete,true);s.app.development.cancel(USER,s.project.id,queued.id);assert.deepEqual(readFileSync(s.app.store.get('artifact',complete.reportArtifactId).path),before);assert.equal(s.app.workingGrants.inspect(USER,s.project.id,grant.id).usage.used,2);
}finally{s.close();}});

test('original authority identity and policy digest cannot be substituted after preparation',()=>{for(const mutation of ['approval','scope']){const s=setup();try{
 const {grant}=active(s),task=prepareTest(s),g=s.app.store.get('working-grant',grant.id);if(mutation==='scope')s.app.store.update('working-grant',g.id,g.version,{maxTests:20});else{const replacement=s.app.approvals.request(s.project.id,'working-grant',g.id,g.digest,'working-grant.activate','replacement fixture');approve(s.app,replacement.id);s.app.store.update('working-grant',g.id,g.version,{approvalId:replacement.id});}
 assert.throws(()=>write(s,'editable.txt','abcd'),{code:'WORKING_GRANT_CORRUPTED'});assert.throws(()=>s.app.development.submit(USER,s.project.id,task.id),{code:'WORKING_GRANT_CORRUPTED'});
}finally{s.close();}}});

test('revoking a completed granted test propagates through accepted review and integrated child Run',()=>{const s=setup();try{
 const {grant}=active(s);write(s,'editable.txt','abcd');const job=finished(s,prepareTest(s)),review=reviewed(s,job),proposal=s.app.changes.prepareReviewed(USER,s.project.id,{reviewId:review.id,title:'Granted implementation',hypothesis:'Unit fixture only'});approve(s.app,proposal.approvalId);const child=s.app.changes.apply(USER,proposal.id),intent=s.app.runs.prepare(USER,child.id);approve(s.app,intent.approvalId);
 s.app.workingGrants.revoke(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});assert.equal(s.app.developmentReviews.inspect(USER,s.project.id,review.id).status,'stale');assert.throws(()=>s.app.runs.submit(USER,intent.id),{code:'WORKING_GRANT_REVOKED'});assert.equal(s.app.store.list('run').length,0);
}finally{s.close();}});

test('legacy unbound sessions retain per-test approval and no grant usage',()=>{const s=setup();try{
 writeFileSync(join(s.session.workspace,'check.py'),'assert True');const t=prepareTest(s);assert.equal(t.manifest.workingGrant,undefined);assert.throws(()=>s.app.development.submit(USER,s.project.id,t.id),{code:'APPROVAL_REQUIRED'});approve(s.app,t.grantId);assert.equal(s.app.development.submit(USER,s.project.id,t.id).state,'queued');assert.equal(s.app.store.list('working-grant-use').length,0);
}finally{s.close();}});

test('two independent controllers racing for the last slot submit exactly one job',async()=>{const s=setup();try{
 active(s,{maxTests:1});const tasks=[prepareTest(s),prepareTest(s)],module=pathToFileURL(resolve('dist/packages/research-app.js')).href,buffer=new SharedArrayBuffer(4),ready=[];
 const workers=tasks.map(task=>new Worker(`const {parentPort,workerData}=require('node:worker_threads');(async()=>{const {ResearchApp}=await import(workerData.module);const app=new ResearchApp(workerData.dir,workerData.repo);parentPort.postMessage({ready:true});Atomics.wait(new Int32Array(workerData.buffer),0,0);try{const job=app.development.submit({type:'user'},workerData.pid,workerData.id);parentPort.postMessage({jobId:job.id});}catch(error){parentPort.postMessage({code:error.code});}finally{app.close();}})().catch(error=>{parentPort.postMessage({code:error.code??String(error)});});`,{eval:true,workerData:{module,dir:s.dir,repo:process.cwd(),pid:s.project.id,id:task.id,buffer}}));
 const exits=workers.map(worker=>new Promise(resolve=>worker.on('exit',resolve))),results=workers.map(worker=>new Promise((resolve,reject)=>{worker.on('message',value=>{if(value.ready){ready.push(true);if(ready.length===2){Atomics.store(new Int32Array(buffer),0,1);Atomics.notify(new Int32Array(buffer),0);}}else resolve(value);});worker.on('error',reject);}));
 const done=await Promise.all(results);await Promise.all(exits);assert.equal(done.filter(r=>r.jobId).length,1);assert.deepEqual(done.filter(r=>r.code).map(r=>r.code),['WORKING_GRANT_EXHAUSTED']);assert.equal(s.app.store.list('sandbox-job').length,1);assert.equal(s.app.store.list('working-grant-use').length,1);
}finally{s.close();}});
