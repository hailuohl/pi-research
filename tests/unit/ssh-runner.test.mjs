import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
import {digest} from '../../dist/packages/storage/store.js';
import {validateContract} from '../../dist/packages/runners/contracts.js';
import {sshArgs,sshEnvironment,SSH_COMMAND} from '../../dist/packages/runners/ssh.js';
import {superviseSshRun} from '../../dist/packages/runners/ssh-supervisor.js';
import {SshTargetService} from '../../dist/packages/runners/ssh-targets.js';
const contract={runner:'ssh',sshTargetId:'fixture',image:`python@sha256:${'a'.repeat(64)}`,command:['python','main.py'],environment:{},datasetVersion:'v1',evaluationProtocolVersion:'v1',metrics:{score:{unit:'ratio',direction:'max'}},expectedArtifacts:['metrics.json'],cpus:1,memoryMb:128,timeoutSeconds:10};
function setup(){
 const dir=mkdtempSync(join(tmpdir(),'pi-ssh-unit-')),app=new ResearchApp(dir,process.cwd()),identityFile=join(dir,'identity'),knownHostsFile=join(dir,'known_hosts');writeFileSync(identityFile,'private-key-fixture');writeFileSync(knownHostsFile,'fixed-host-key');
 const config={id:'fixture',host:'localhost',port:2222,user:'runner',identityFile,knownHostsFile,remoteRoot:'/srv/pi-research'};app.sshTargets.configure(USER,config);
 // No SSH or Docker in unit tests. Seed exactly the private result of a successful probe.
 const all=JSON.parse(readFileSync(join(dir,'ssh-targets.json'),'utf8')),t=all.fixture;
 const target={id:t.id,version:t.version,hostKeyDigest:t.hostKeyDigest,configDigest:digest(t),engineId:'fixture-engine',protocolDigest:digest(readFileSync('scripts/ssh-runner.py')),targetId:'ssh-'+digest('fixture-engine')};t.verified=target;writeFileSync(join(dir,'ssh-targets.json'),JSON.stringify(all));
 app.store.db.prepare("INSERT INTO compute_contexts(context,target_id,engine_id,endpoint,status,next_probe_at) VALUES(?,?,?,?,'ready',?)").run('ssh:fixture',target.targetId,target.engineId,target.configDigest+':'+target.protocolDigest,Date.now()+60000);
 const p=app.projects.create(USER,{name:'SSH fixtures',template:'curve-fit'}),e=app.experiments.create(USER,p.id,{title:'SSH frozen run',contract});
 return {dir,app,p,e,target,config,close(){this.app.close();rmSync(dir,{recursive:true,force:true});}};
}
function approved(s){const i=s.app.runs.prepare(USER,s.e.id),a=s.app.store.get('approval',i.approvalId);s.app.approvals.decide(USER,a.id,a.version,true);return s.app.runs.submit(USER,i.id);}
function claim(s,id){return s.app.compute.withAdmission('run',id,()=>{const r=s.app.store.get('run',id);return s.app.store.update('run',id,r.version,{state:'submitting',execution:{...r.execution,generation:r.execution.generation+1,leaseUntil:Date.now()+60000}});});}
function callbacks(s,id){let result;return {read:()=>s.app.store.get('run',id),fence(){const r=this.read();assert.ok(r.execution.leaseUntil>Date.now());},assertGrant:r=>s.app.runs.assertExecutionGrant(r),patch:v=>{const r=s.app.store.get('run',id);return s.app.store.update('run',id,r.version,v);},finalize:f=>{result=f;s.app.runs.finalize(id,f.exitCode,f.state,f.error,f);},get result(){return result;}};}
const bytes=Buffer.from('{"score":1}'),file={path:'metrics.json',size:bytes.length,digest:digest(bytes),data:bytes.toString('base64')};
const response=(q,extra={})=>({handle:q.handle,manifestDigest:q.manifestDigest,state:'succeeded',containerId:'b'.repeat(64),imageId:'sha256:'+'c'.repeat(64),exitCode:0,logs:{stdout:Buffer.from('remote log\n').toString('base64'),stderr:''},files:[file],missing:[],...extra});

test('Windows OpenSSH can parse options with the restricted runner environment without connecting',{skip:process.platform!=='win32'},()=>{
 const r=spawnSync('ssh',['-F','none','-G','example.invalid'],{env:sshEnvironment(),encoding:'utf8',windowsHide:true,timeout:10000});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/hostname example.invalid/);
});

test('SSH contract and argv keep credentials/host paths out of public frozen intent and retain strict host checks',()=>{
 const s=setup();try{
  const i=s.app.runs.prepare(USER,s.e.id),serialized=JSON.stringify(i);for(const secret of [s.dir,'identityFile','knownHostsFile','remoteRoot','localhost','"user":"runner"'])assert.ok(!serialized.includes(secret),secret);
  assert.deepEqual(i.manifest.sshTarget,s.target);assert.throws(()=>s.app.runs.submit(USER,i.id),{code:'APPROVAL_REQUIRED'});
  assert.throws(()=>validateContract({...contract,dockerContext:'default'}));assert.throws(()=>validateContract({...contract,sshTargetId:'--proxy-command'}));
  const args=sshArgs({...s.config,knownHostsFile:'C:\\private keys\\hosts'});assert.equal(args.at(-1),SSH_COMMAND);assert.deepEqual(args.slice(0,3),['-F','none','-T']);assert.ok(args.includes('StrictHostKeyChecking=yes'));assert.ok(args.includes('IdentityAgent=none'));assert.ok(args.includes('UserKnownHostsFile="C:/private keys/hosts"'));
  const configured=s.app.sshTargets.list(USER);assert.ok(!JSON.stringify(configured).includes('localhost'));
  writeFileSync(s.config.knownHostsFile,'changed-key');assert.throws(()=>s.app.runs.prepare(USER,s.e.id),{code:'SSH_TARGET_CHANGED'});
 }finally{s.close();}
});

test('SSH success uses one frozen start, archives declared bytes and history survives reopen',async()=>{
 const s=setup();try{const run=approved(s),r=claim(s,run.id),cb=callbacks(s,run.id),ops=[];
  assert.equal(s.app.compute.inspect(USER).items[0].backend,'ssh');assert.equal(s.app.compute.inspect(USER).usage.jobs,1);
  await superviseSshRun(r,s.app.context,cb,async(t,q)=>{ops.push(q.op);assert.equal(t.remoteRoot,s.config.remoteRoot);if(q.op==='start'){assert.equal(q.sourceDigest,r.manifest.snapshotDigest);assert.equal(q.files.length,r.manifest.sourceFiles.length);assert.ok(!JSON.stringify(q).includes('snapshotPath'));assert.equal(cb.read().execution.startRequested,true);}return response(q);});
  assert.deepEqual(ops,['start','status','result']);assert.equal(cb.result.state,'succeeded');const done=s.app.store.get('run',run.id);assert.equal(done.integrity,'complete');assert.deepEqual(done.metrics,{score:1});assert.equal(s.app.compute.inspect(USER).usage.jobs,0);assert.equal(s.app.runs.logs(USER,run.id).content,'remote log\n');
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.deepEqual(s.app.runs.get(USER,run.id).artifactIds,done.artifactIds);assert.equal(s.app.runs.logs(USER,run.id).content,'remote log\n');
 }finally{s.close();}
});

test('lost SSH acknowledgement holds capacity and recovery inspects original handle without resubmitting',async()=>{
 const s=setup();try{const run=approved(s),r=claim(s,run.id),cb=callbacks(s,run.id),ops=[];
  await superviseSshRun(r,s.app.context,cb,async(_t,q)=>{ops.push(q.op);throw new Error('connection lost after remote acceptance');});
  assert.deepEqual(ops,['start']);assert.equal(cb.read().state,'unknown');assert.equal(s.app.compute.inspect(USER).usage.jobs,1);assert.equal(cb.result,undefined);
  assert.throws(()=>s.app.sshTargets.configure(USER,{...s.config,expectedVersion:1}),{code:'SSH_TARGET_BUSY'});
  s.app.store.db.prepare('UPDATE compute_queue SET next_attempt_at=0 WHERE id=?').run(run.id);const recovery=claim(s,run.id);assert.ok(recovery);const next=callbacks(s,run.id);
  await superviseSshRun(recovery,s.app.context,next,async(_t,q)=>{ops.push(q.op);assert.equal(q.handle,r.execution.sshHandle);return response(q);});
  assert.deepEqual(ops,['start','status','result']);assert.equal(next.result.state,'succeeded');
 }finally{s.close();}
});

test('SSH cancellation uses stable handle and rejects forged or undeclared result bytes',async()=>{
 for(const bad of ['undeclared','digest','container']){const s=setup();try{const run=approved(s),r=claim(s,run.id),cb=callbacks(s,run.id);
   await superviseSshRun(r,s.app.context,cb,async(_t,q)=>response(q,q.op==='result'?(bad==='undeclared'?{files:[{...file,path:'../private'}]}:bad==='digest'?{files:[{...file,digest:'0'.repeat(64)}]}:{containerId:'d'.repeat(64)}):{}));
   assert.equal(cb.read().state,bad==='container'?'unknown':'failed');if(bad==='container'){assert.equal(cb.result,undefined);assert.equal(cb.read().artifactIds.length,0);}else assert.match(cb.read().error,/SSH_OUTPUT_INVALID/);
  }finally{s.close();}}
 const s=setup();try{const run=approved(s),r=claim(s,run.id),cb=callbacks(s,run.id);let starts=0;
  await superviseSshRun(r,s.app.context,cb,async(_t,q)=>{if(q.op==='start'){starts++;s.app.runs.cancel(USER,run.id);}if(q.op!=='start')assert.ok(['cancel','result'].includes(q.op));assert.equal(q.handle,r.execution.sshHandle);return response(q,{state:'cancelled',exitCode:137});});assert.equal(starts,1);assert.equal(cb.result.state,'cancelled');
 }finally{s.close();}
});

test('SSH approval/target version and queue limits are checked before start; migration preserves frozen history',()=>{
 const s=setup();try{const i=s.app.runs.prepare(USER,s.e.id),a=s.app.store.get('approval',i.approvalId);s.app.approvals.decide(USER,a.id,a.version,true);
  s.app.compute.configure(USER,{expectedVersion:1,limits:{maxQueued:0}});assert.throws(()=>s.app.runs.submit(USER,i.id),{code:'COMPUTE_QUEUE_FULL'});assert.equal(s.app.store.list('run').length,0);
  s.app.sshTargets.configure(USER,{...s.config,expectedVersion:1});assert.throws(()=>s.app.runs.submit(USER,i.id),{code:'SSH_TARGET_PROBE_REQUIRED'});
  const original=JSON.stringify(s.app.store.get('run-intent',i.id));s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.equal(JSON.stringify(s.app.store.get('run-intent',i.id)),original);assert.ok(s.app.store.db.prepare('SELECT 1 FROM schema_migrations WHERE version=10').get());
 }finally{s.close();}
});

test('revoked SSH approval and cross-project access fail before any transport operation',async()=>{
 const s=setup();try{const run=approved(s),r=claim(s,run.id),cb=callbacks(s,run.id),intent=s.app.store.get('run-intent',run.intentId),approval=s.app.store.get('approval',intent.approvalId);s.app.approvals.stale(intent.id);
  let calls=0;await superviseSshRun(r,s.app.context,cb,async()=>{calls++;throw new Error('unexpected transfer');});assert.equal(calls,0);assert.equal(cb.result.state,'failed');assert.equal(cb.read().integrity,'invalid');
  assert.throws(()=>s.app.runs.get({type:'agent',projectId:'other',role:'coordinator'},run.id),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});

test('accepted SSH handle can reconcile its frozen old protocol after an upgrade, while new starts require current protocol',async()=>{
 const s=setup();try{const run=approved(s),r=claim(s,run.id);s.app.store.update('run',r.id,r.version,{execution:{...r.execution,startRequested:true}});
  const oldDigest=s.target.protocolDigest,newRepo=join(s.dir,'new-repo');mkdirSync(join(newRepo,'scripts'),{recursive:true});writeFileSync(join(newRepo,'scripts','ssh-runner.py'),'upgraded trusted endpoint');s.app.context.repoRoot=newRepo;
  const targets=new SshTargetService(s.app.context,async()=>({protocol:1,ok:true,protocolDigest:oldDigest,engineId:s.target.engineId}));assert.equal((await targets.verify('fixture')).protocolDigest,oldDigest);assert.equal(targets.frozen('fixture').protocolDigest,oldDigest);
  assert.throws(()=>s.app.runs.prepare(USER,s.e.id),{code:'SSH_PROTOCOL_MISMATCH'});const current=s.app.store.get('run',r.id);s.app.runs.assertExecutionGrant(current,false);
  const cb=callbacks(s,r.id),ops=[];await superviseSshRun(current,s.app.context,cb,async(_t,q)=>{ops.push(q.op);assert.equal(q.protocolDigest,oldDigest);return response(q,{state:'failed',exitCode:128,error:'REMOTE_START_FAILED',files:[],missing:['metrics.json']});});
  assert.deepEqual(ops,['status','result']);assert.equal(cb.result.state,'failed');assert.equal(cb.read().exitCode,128);assert.match(cb.read().error,/REMOTE_START_FAILED/);assert.equal(s.app.compute.inspect(USER).usage.jobs,0);assert.equal(cb.read().manifest.sshTarget.protocolDigest,oldDigest);
  await assert.rejects(targets.verify('fixture'),{code:'SSH_PROTOCOL_MISMATCH'});
 }finally{s.close();}
});

test('null remote exit preserves the supervisor failure in Run and archived execution receipt before missing artifact diagnostics',async()=>{
 const s=setup();try{const run=approved(s),r=claim(s,run.id),started=s.app.store.update('run',r.id,r.version,{execution:{...r.execution,startRequested:true}}),cb=callbacks(s,r.id),ops=[];
  await superviseSshRun(started,s.app.context,cb,async(_t,q)=>{ops.push(q.op);return response(q,{state:'failed',exitCode:null,error:'REMOTE_SUPERVISOR_FAILED',files:[],missing:['metrics.json']});});
  assert.deepEqual(ops,['status','result']);assert.equal(cb.read().state,'failed');assert.equal(cb.read().exitCode,null);assert.equal(cb.read().integrity,'incomplete');assert.match(cb.read().error,/^REMOTE_SUPERVISOR_FAILED; SSH_DECLARED_OUTPUT_INCOMPLETE;/);
  const receipt=cb.read().artifactIds.map(id=>s.app.store.get('artifact',id)).find(a=>a.title==='execution.json');assert.ok(receipt);const data=JSON.parse(s.app.evidence.read(USER,receipt.id).bytes);assert.equal(data.error,cb.read().error);assert.equal(data.exitCode,null);assert.equal(data.state,'failed');
 }finally{s.close();}
});
