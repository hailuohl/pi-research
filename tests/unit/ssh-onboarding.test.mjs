import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,renameSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {setup,USER,approve} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {digest} from '../../dist/packages/storage/store.js';
import {DomainError} from '../../dist/packages/domain/errors.js';
import {parseHostKeys,sshOnboardingRequest} from '../../dist/packages/runners/ssh-onboarding.js';
import {sshArgs} from '../../dist/packages/runners/ssh.js';
import {ComputeConnectionService} from '../../dist/packages/runners/compute-connections.js';
import {createDataBackup,verifyDataBackup} from '../../dist/packages/storage/backup.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

const wire=n=>Buffer.concat([Buffer.from([0,0,0,11]),Buffer.from('ssh-ed25519'),Buffer.from([0,0,0,32]),Buffer.alloc(32,n)]).toString('base64');
const key=n=>parseHostKeys('untrusted.example ssh-ed25519 '+wire(n))[0];
const healthy=()=>({supervisor:'ready',workspace:'ready',docker:'ready',engineId:'onboarding-fixture',protocolDigest:digest(readFileSync('scripts/ssh-runner-gpu.py'))});
function fixture(){const s=setup(),identityFile=join(s.dir,'fixture-key');writeFileSync(identityFile,'fake identity for offline test');s.config={id:'fixture',host:'fixture.invalid',user:'research',identityFile,remoteRoot:'/srv/pi/jobs',expectedVersion:0};s.calls=[];s.app.sshTargets.scan=async()=>[key(7)];s.app.sshTargets.onboarding=async(t,action)=>{s.calls.push(action);return healthy();};return s;}
const owner=(s,name,input,key=name)=>s.app.operations.execute(USER,name,input,{projectId:s.project.id,idempotencyKey:key});
const challenge=s=>owner(s,'ssh_target_challenge',s.config,'challenge-'+Math.random());
const confirm=(s,c,k='confirm')=>owner(s,'ssh_target_confirm',{challengeId:c.challengeId,fingerprint:c.fingerprint},k);
const view=s=>s.app.operations.execute(USER,'execution_environment_list',{}, {projectId:s.project.id}).connections.ssh[0];
function editChallenge(s,c,edit){const path=join(s.dir,'ssh-private','challenge-'+c.challengeId+'.json'),v=JSON.parse(readFileSync(path));edit(v);writeFileSync(path,JSON.stringify(v));}

test('fingerprint challenge sends no authentication, rejects conflicts and validates key wire format',async()=>{
 const s=fixture();try{const saved=childProcess.spawn;childProcess.spawn=(exe,args)=>{assert.equal(exe,'ssh-keyscan');assert.ok(!args.includes(s.config.identityFile)&&!args.includes(s.config.user));const p=new EventEmitter();p.stdout=new PassThrough();p.stderr=new PassThrough();p.stdin=new PassThrough();p.kill=()=>{};queueMicrotask(()=>{p.stdout.end('malicious-host ssh-ed25519 '+wire(7)+'\n');p.emit('close',0);});return p;};syncBuiltinESMExports();
 try{const {scanHostKeys}=await import('../../dist/packages/runners/ssh-onboarding.js');s.app.sshTargets.scan=scanHostKeys;const c=await challenge(s);assert.equal(c.fingerprint,key(7).fingerprint);assert.deepEqual(s.calls,[]);assert.equal(existsSync(join(s.dir,'ssh-targets.json')),false);validateSchema(OUTPUT_SCHEMAS.ssh_target_challenge,c,'output');assert.ok(!JSON.stringify(c).includes(s.config.identityFile));}finally{childProcess.spawn=saved;syncBuiltinESMExports();}
 assert.throws(()=>parseHostKeys('a ssh-ed25519 '+wire(7)+'\na ssh-ed25519 '+wire(8)),{code:'SSH_HOST_KEY_CONFLICT'});for(const line of ['a ssh-rsa AAAA','a ssh-ed25519-cert-v01@openssh.com '+wire(7),'a ssh-ed25519 '+wire(7)+' injected','a ssh-ed25519 '+Buffer.from('not a wire key').toString('base64')])assert.throws(()=>parseHostKeys(line));
 }finally{s.close();}
});

test('wrong fingerprint, expiry, changed identity and stale configuration never authenticate',async()=>{
 for(const scenario of ['fingerprint','expiry','identity','version']){const s=fixture();try{const c=await challenge(s);if(scenario==='fingerprint')c.fingerprint='SHA256:wrong';if(scenario==='expiry')editChallenge(s,c,v=>v.expiresAt=new Date(0).toISOString());if(scenario==='identity')writeFileSync(s.config.identityFile,'changed');if(scenario==='version'){const knownHostsFile=join(s.dir,'manual-hosts');writeFileSync(knownHostsFile,'fixture.invalid ssh-ed25519 '+wire(7));s.app.sshTargets.configure(USER,{...s.config,knownHostsFile,gpuProtocol:true});}
 await assert.rejects(confirm(s,c),{code:{fingerprint:'SSH_FINGERPRINT_MISMATCH',expiry:'SSH_CHALLENGE_EXPIRED',identity:'SSH_TARGET_CHANGED',version:'VERSION_CONFLICT'}[scenario]});assert.deepEqual(s.calls,[]);
 }finally{s.close();}}
});

test('confirmed known_hosts is immutable, replay is side-effect free, changed endpoint key cannot use a new alias',async()=>{
 const s=fixture();try{const c=await challenge(s),r=await confirm(s,c);assert.equal(r.verified,true);const saved=s.app.sshTargets.privateTarget('fixture'),original=readFileSync(saved.knownHostsFile,'utf8');assert.equal(original,'fixture.invalid ssh-ed25519 '+wire(7)+'\n');assert.ok(sshArgs(saved).includes('StrictHostKeyChecking=yes'));assert.ok(sshArgs(saved).includes('IdentityAgent=none'));const calls=s.calls.length;await confirm(s,c);assert.equal(s.calls.length,calls);
 s.app.sshTargets.scan=async()=>[key(8)];await assert.rejects(owner(s,'ssh_target_challenge',{...s.config,id:'alias'},'different-key'),{code:'SSH_HOST_KEY_CHANGED'});assert.equal(readFileSync(saved.knownHostsFile,'utf8'),original);
 s.app.sshTargets.scan=async()=>[key(7)];const next=await owner(s,'ssh_target_challenge',{...s.config,expectedVersion:1},'new-version');await confirm(s,next,'confirm-new');assert.notEqual(s.app.sshTargets.privateTarget('fixture').knownHostsFile,saved.knownHostsFile);assert.equal(readFileSync(saved.knownHostsFile,'utf8'),original);await assert.rejects(confirm(s,c),{code:'SSH_TARGET_CHANGED'});
 }finally{s.close();}
});

test('setup installs only missing resources; periodic verification and ready replay never install',async()=>{
 const s=fixture();try{let installed=false;s.app.sshTargets.onboarding=async(t,action)=>{s.calls.push(action);if(action==='install')installed=true;return installed?healthy():{supervisor:'missing',workspace:'missing',docker:'missing',errorCode:'SSH_SUPERVISOR_MISSING'};};const c=await challenge(s);assert.equal((await confirm(s,c)).verified,true);assert.equal(s.calls.filter(x=>x==='install').length,1);
 await s.app.sshTargets.probe(USER,'fixture');await s.app.sshTargets.verify('fixture');await owner(s,'ssh_target_setup',{id:'fixture',expectedVersion:1},'setup');const count=s.calls.length;await owner(s,'ssh_target_setup',{id:'fixture',expectedVersion:1},'setup');assert.equal(s.calls.length,count);assert.equal(s.calls.filter(x=>x==='install').length,1);assert.equal(view(s).supervisor,'ready');assert.equal(view(s).docker,'ready');
 for(const [docker,errorCode] of [['missing','SSH_DOCKER_MISSING'],['unavailable','SSH_DOCKER_UNAVAILABLE'],['unsupported','SSH_DOCKER_UNSUPPORTED']]){s.app.sshTargets.onboarding=async(t,action)=>{assert.equal(action,'inspect');return {...healthy(),docker,errorCode};};await assert.rejects(s.app.sshTargets.verify('fixture'),{code:errorCode});assert.equal(view(s).status,'unavailable');assert.equal(view(s).errorCode,errorCode);assert.equal(view(s).capabilities.cpu,false);}
 }finally{s.close();}
});

test('mismatched or unsafe existing supervisor and invalid existing workspace are never installed over',async()=>{
 for(const health of [{supervisor:'mismatch',errorCode:'SSH_PROTOCOL_MISMATCH'},{supervisor:'unsafe',errorCode:'SSH_SUPERVISOR_UNSAFE'},{workspace:'invalid',errorCode:'SSH_WORKSPACE_INVALID'}]){const s=fixture();try{s.app.sshTargets.onboarding=async(t,action)=>{assert.equal(action,'inspect');return {...healthy(),...health};};const result=await confirm(s,await challenge(s));assert.equal(result.verified,false);assert.equal(result.errorCode,health.errorCode);assert.equal(s.app.sshTargets.inspect(USER,'fixture').version,1);assert.equal(view(s).capabilities.cpu,false);}finally{s.close();}}
});

test('host key or authentication failure never installs and raw SSH stderr does not escape',async()=>{
 const s=fixture();try{const c=await challenge(s),transport=s.app.sshTargets.onboarding;s.app.sshTargets.onboarding=async(t,action)=>{assert.equal(action,'inspect');throw new DomainError('SSH_HOST_KEY_CHANGED','private stderr');};const r=await confirm(s,c);assert.equal(r.errorCode,'SSH_HOST_KEY_CHANGED');assert.ok(!JSON.stringify(view(s)).includes('private stderr'));
 const saved=childProcess.spawn;childProcess.spawn=(exe,args)=>{assert.equal(exe,'ssh');assert.ok(args.includes('StrictHostKeyChecking=yes'));assert.ok(!args.some(a=>String(a).includes('accept-new')));const p=new EventEmitter();p.stdout=new PassThrough();p.stderr=new PassThrough();p.stdin=new PassThrough();p.kill=()=>{};queueMicrotask(()=>{p.stderr.end('WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED! private-secret');p.emit('close',255);});return p;};syncBuiltinESMExports();try{await assert.rejects(sshOnboardingRequest(s.app.context,s.app.sshTargets.privateTarget('fixture'),'inspect'),e=>e.code==='SSH_HOST_KEY_CHANGED'&&!e.message.includes('private-secret'));}finally{childProcess.spawn=saved;syncBuiltinESMExports();s.app.sshTargets.onboarding=transport;}
 }finally{s.close();}
});

test('two app instances reserve setup, block reconfiguration and recover unknown install through a read on reopen',async()=>{
 const s=fixture();let other;try{const c=await challenge(s);let release;s.app.sshTargets.onboarding=async(t,action)=>{s.calls.push(action);if(action==='inspect')return {supervisor:'missing',workspace:'missing',docker:'unknown',errorCode:'SSH_SUPERVISOR_MISSING'};return new Promise((resolve,reject)=>release=()=>reject(new Error('lost transport')));};const pending=confirm(s,c);while(!release)await new Promise(r=>setImmediate(r));other=new ResearchApp(s.dir,process.cwd());
 await assert.rejects(other.sshTargets.setup(USER,{id:'fixture',expectedVersion:1}),{code:'SSH_TARGET_BUSY'});const saved=other.sshTargets.inspect(USER,'fixture');assert.throws(()=>other.sshTargets.configure(USER,{...s.config,expectedVersion:1,knownHostsFile:saved.knownHostsFile,gpuProtocol:true}),{code:'SSH_TARGET_BUSY'});release();const result=await pending;assert.equal(result.errorCode,'SSH_SETUP_UNKNOWN');assert.equal(view(s).setup,'unknown');
 other.close();s.app.close();s.app=new ResearchApp(s.dir,process.cwd());s.app.sshTargets.onboarding=async(t,action)=>{assert.equal(action,'inspect');throw new DomainError('SSH_TARGET_UNAVAILABLE','still offline');};assert.equal((await s.app.sshTargets.setup(USER,{id:'fixture',expectedVersion:1})).errorCode,'SSH_SETUP_UNKNOWN');assert.equal(view(s).setup,'unknown');
 s.app.sshTargets.onboarding=async(t,action)=>{assert.equal(action,'inspect');return healthy();};await s.app.sshTargets.verify('fixture');assert.equal(view(s).setup,'idle');assert.equal(view(s).status,'verified');assert.equal(s.app.store.maybe('ssh-setup','fixture'),undefined);
 }finally{other?.close();s.close();}
});

test('CPU/GPU preferences, frozen approval and run history survive managed checks; busy target cannot setup',async()=>{
 const s=fixture();try{await confirm(s,await challenge(s));const before=JSON.stringify(s.app.sshTargets.frozen('fixture',true));const experiment=s.app.experiments.create(USER,s.project.id,{title:'managed ssh fixture',contract:{runner:'ssh',sshTargetId:'fixture',image:'python@sha256:'+'a'.repeat(64),command:['python','main.py'],environment:{},datasetVersion:'v1',evaluationProtocolVersion:'v1',metrics:{score:{unit:'ratio',direction:'max'}},expectedArtifacts:['metrics.json'],cpus:1,memoryMb:128,timeoutSeconds:10},files:{'main.py':'print(1)'}}),intent=s.app.runs.prepare(USER,experiment.id);assert.throws(()=>s.app.runs.submit(USER,intent.id),{code:'APPROVAL_REQUIRED'});approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);await assert.rejects(s.app.sshTargets.setup(USER,{id:'fixture',expectedVersion:1}),{code:'SSH_TARGET_BUSY'});await s.app.sshTargets.verify('fixture');assert.equal(JSON.stringify(s.app.store.get('run',run.id).manifest.sshTarget),before);assert.equal(JSON.stringify(s.app.sshTargets.frozen('fixture',true)),before);
 }finally{s.close();}
});

test('setup reservation atomically fences a previously approved Run while its inspection is suspended',async()=>{
 const s=fixture();let other,pending,release;
 try{
  await confirm(s,await challenge(s));const frozen=s.app.sshTargets.frozen('fixture',true);
  const experiment=s.app.experiments.create(USER,s.project.id,{title:'setup admission race',contract:{runner:'ssh',sshTargetId:'fixture',image:'python@sha256:'+'a'.repeat(64),command:['python','main.py'],environment:{},datasetVersion:'v1',evaluationProtocolVersion:'v1',metrics:{score:{unit:'ratio',direction:'max'}},expectedArtifacts:['metrics.json'],cpus:1,memoryMb:128,timeoutSeconds:10},files:{'main.py':'print(1)'}}),intent=s.app.runs.prepare(USER,experiment.id);approve(s.app,intent.approvalId);
  s.app.sshTargets.onboarding=async(t,action)=>{s.calls.push(action);if(!release)return new Promise(resolve=>release=resolve);return healthy();};
  pending=s.app.sshTargets.setup(USER,{id:'fixture',expectedVersion:1});while(!release)await new Promise(r=>setImmediate(r));other=new ResearchApp(s.dir,process.cwd());
  assert.throws(()=>other.runs.submit(USER,intent.id),{code:'SSH_TARGET_BUSY'});
  assert.throws(()=>other.runs.prepare(USER,experiment.id),{code:'SSH_TARGET_BUSY'});
  assert.equal(other.store.list('run').length,0);
  // Historical handle checks do not take the new-admission branch.
  assert.doesNotThrow(()=>other.sshTargets.assertFrozen(frozen,false));
  release({supervisor:'missing',workspace:'missing',docker:'unknown',errorCode:'SSH_SUPERVISOR_MISSING'});await pending;pending=undefined;
  assert.equal(s.calls.filter(x=>x==='install').length,1);
  assert.equal(other.runs.submit(USER,intent.id).state,'queued');
  await assert.rejects(s.app.sshTargets.setup(USER,{id:'fixture',expectedVersion:1}),{code:'SSH_TARGET_BUSY'});
 }finally{release?.(healthy());if(pending)await pending;other?.close();s.close();}
});

test('setup rechecks a restored queue record after inspection before any installer call',async()=>{
 const s=fixture();let pending,release;try{
  await confirm(s,await challenge(s));s.calls.length=0;
  s.app.sshTargets.onboarding=async(t,action)=>{s.calls.push(action);assert.equal(action,'inspect');return new Promise(resolve=>release=resolve);};pending=s.app.sshTargets.setup(USER,{id:'fixture',expectedVersion:1});while(!release)await new Promise(r=>setImmediate(r));
  // Simulate a queue record restored by another already-running process, bypassing the new admission guard.
  s.app.store.db.prepare("INSERT INTO compute_queue(kind,id,project_id,backend,context_name,phase,held,cpu_millis,memory_mb,source_version) VALUES('run','restored',?,'ssh','ssh:fixture','unknown',1,1000,128,1)").run(s.project.id);
  release({supervisor:'missing',workspace:'missing',docker:'unknown',errorCode:'SSH_SUPERVISOR_MISSING'});const result=await pending;pending=undefined;
  assert.equal(result.errorCode,'SSH_TARGET_BUSY');assert.equal(result.verified,false);assert.deepEqual(s.calls,['inspect']);
  assert.equal(s.app.store.db.prepare("SELECT phase FROM compute_queue WHERE id='restored'").get().phase,'unknown');
 }finally{release?.(healthy());if(pending)await pending;s.close();}
});

test('JSON confirmation survives a later SQLite rollback; reopen and explicit setup reconcile without replaying installation',async()=>{
 const s=fixture(),invalidate=ComputeConnectionService.prototype.invalidateSsh;try{
  const c=await challenge(s),approvalBefore=JSON.stringify(s.app.store.list('approval'));
  ComputeConnectionService.prototype.invalidateSsh=()=>{throw new Error('fixture: after trust, target and challenge files, before reservation');};
  await assert.rejects(confirm(s,c),/fixture: after trust/);ComputeConnectionService.prototype.invalidateSsh=invalidate;
  assert.deepEqual(s.calls,[]);assert.equal(s.app.store.maybe('ssh-setup','fixture'),undefined);assert.equal(s.app.sshTargets.inspect(USER,'fixture').version,1);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());s.app.sshTargets.onboarding=async(t,action)=>{assert.equal(action,'inspect');s.calls.push(action);return healthy();};
  const replay=await confirm(s,c);assert.equal(replay.verified,false);assert.deepEqual(s.calls,[]);assert.equal(view(s).managed,true);
  assert.equal((await owner(s,'ssh_target_setup',{id:'fixture',expectedVersion:1},'recover-json-commit')).verified,true);assert.equal(s.calls.filter(x=>x==='install').length,0);assert.equal(JSON.stringify(s.app.store.list('approval')),approvalBefore);
 }finally{ComputeConnectionService.prototype.invalidateSsh=invalidate;s.close();}
});

test('new operations are unavailable to Agent and managed state contains no private connection fields',async()=>{
 const s=fixture();try{await confirm(s,await challenge(s));const session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+120000,skillBundleId:s.app.skills.configuration(s.project.id).bundleId});const actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,generation:1,role:'coordinator'},tools=new ToolDispatcher(s.app);for(const op of ['ssh_target_challenge','ssh_target_confirm','ssh_target_setup'])await assert.rejects(tools.execute(actor,op,{},'deny-'+op),{code:'TOOL_DENIED'});const directory=await tools.execute(actor,'execution_environment_list',{},'directory'),json=JSON.stringify(directory);for(const secret of [s.config.identityFile,s.config.host,s.config.user,s.config.remoteRoot,'knownHostsFile','identityDigest'])assert.ok(!json.includes(secret),secret);assert.equal(directory.connections.ssh[0].managed,true);validateSchema(OUTPUT_SCHEMAS.execution_environment_list,directory,'output');
 }finally{s.close();}
});

test('backup excludes managed trust and challenges, retaining supported state without credential paths',async()=>{
 const s=fixture(),out=mkdtempSync(join(tmpdir(),'pi-ssh-backup-'));try{await confirm(s,await challenge(s));s.app.close();rmSync(s.config.identityFile);const backup=await createDataBackup(s.dir,join(out,'backup'),{offline:true});assert.ok(backup.excluded.includes('ssh-private'));assert.ok(backup.excluded.includes('ssh-targets.json'));assert.equal(existsSync(join(out,'backup','data','ssh-private')),false);assert.equal((await verifyDataBackup(join(out,'backup'))).manifestDigest,backup.manifestDigest);
 }finally{s.close();assert.ok(resolve(out).startsWith(resolve(tmpdir())+sep));rmSync(out,{recursive:true,force:true});}
});

test('backup refuses unknown SSH installation until read-only reconciliation clears its reservation',async()=>{
 const s=fixture(),out=mkdtempSync(join(tmpdir(),'pi-ssh-busy-backup-'));try{
  s.app.sshTargets.onboarding=async(t,action)=>{if(action==='install')throw new DomainError('SSH_TARGET_UNAVAILABLE','lost install receipt');return {supervisor:'missing',workspace:'missing',docker:'unknown',errorCode:'SSH_SUPERVISOR_MISSING'};};
  assert.equal((await confirm(s,await challenge(s))).errorCode,'SSH_SETUP_UNKNOWN');assert.equal(view(s).setup,'unknown');
  const before=JSON.stringify(s.app.store.get('ssh-setup','fixture')),identity=readFileSync(s.config.identityFile);s.app.close();rmSync(s.config.identityFile);
  await assert.rejects(createDataBackup(s.dir,join(out,'backup'),{offline:true}),{code:'BACKUP_BUSY'});assert.equal(existsSync(join(out,'backup')),false);
  writeFileSync(s.config.identityFile,identity);s.app=new ResearchApp(s.dir,process.cwd());assert.equal(JSON.stringify(s.app.store.get('ssh-setup','fixture')),before);
  s.app.sshTargets.onboarding=async(t,action)=>{assert.equal(action,'inspect');return healthy();};await s.app.sshTargets.verify('fixture');assert.equal(s.app.store.maybe('ssh-setup','fixture'),undefined);
  s.app.close();rmSync(s.config.identityFile);const backup=await createDataBackup(s.dir,join(out,'backup'),{offline:true});assert.ok(backup.excluded.includes('ssh-private'));assert.equal((await verifyDataBackup(join(out,'backup'))).manifestDigest,backup.manifestDigest);
 }finally{s.close();assert.ok(resolve(out).startsWith(resolve(tmpdir())+sep));rmSync(out,{recursive:true,force:true});}
});
