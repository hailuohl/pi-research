import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {DatabaseSync} from 'node:sqlite';
import {Store,digest} from '../../dist/packages/storage/store.js';
import {ComputeQueue} from '../../dist/packages/scheduler/compute-queue.js';
const USER={type:'user'},exec=promisify(execFile);
const identity=engine=>({engineId:engine,targetId:'docker-'+digest(engine),endpoint:`unix:///fixture/${engine}.sock`});
const pause=()=>new Promise(resolve=>setTimeout(resolve,5));
function setup(dependencies={}){const dir=mkdtempSync(join(tmpdir(),'compute-queue-')),store=new Store(join(dir,'state.db')),c={store,dataDir:dir,repoRoot:process.cwd()},queue=new ComputeQueue(c,{probe:async context=>identity(context==='alias-A'?'A':context),...dependencies});store.create('project','p',{name:'Queue unit fixture'},'p');return {dir,store,c,queue,async close(){await queue.stop();store.close();rmSync(dir,{recursive:true,force:true});}};}
let serial=0;
function add(s,kind='run',{context='A',cpus=1,memoryMb=256,state='queued',trusted=false}={}){const id='fixture-'+(++serial),manifest=kind==='run'?{contract:{runner:trusted?'trusted-example':'docker',dockerContext:context,cpus,memoryMb}}:{dockerContext:context,resources:{cpus,memoryMb}};return s.store.create(kind==='run'?'run':kind==='document'?'document-parse-job':kind==='publication'?'publication-build-job':'sandbox-job','p',{state,manifest,manifestDigest:digest(manifest),...(kind==='run'?trusted?{}:{execution:{dockerContext:context,generation:0,leaseUntil:0,startRequested:false}}:{generation:0,leaseUntil:0,startRequested:false,containerName:`pi-development-${id}`})},id);}
function configure(s,limits,targetId){const view=s.queue.inspect(USER),current=targetId?view.targets.find(t=>t.targetId===targetId)?.configuration:view.configuration;return s.queue.configure(USER,{expectedVersion:current?.version??0,...(targetId?{targetId}:{}),limits});}
function claim(s,kind,id){return s.queue.withAdmission(kind,id,()=>{const r=s.store.get(kind==='run'?'run':kind==='document'?'document-parse-job':kind==='publication'?'publication-build-job':'sandbox-job',id);return s.store.update(r.kind,id,r.version,{state:'running',...(kind==='run'?r.execution?{execution:{...r.execution,generation:r.execution.generation+1,leaseUntil:Date.now()+60000}}:{heartbeat:Date.now()}:{generation:r.generation+1,leaseUntil:Date.now()+60000})});});}
function terminal(s,id,kind='run'){const r=s.store.get(kind==='run'?'run':kind==='document'?'document-parse-job':kind==='publication'?'publication-build-job':'sandbox-job',id);s.store.update(r.kind,id,r.version,{state:'failed'});}
function schedulingReason(s,r,expected){const snapshot=s.store.db.prepare('SELECT * FROM compute_queue').all(),view=s.queue.inspectRun(USER,'p',r.id);assert.equal(view.queue.reason,expected);assert.equal(view.queue.reason,s.queue.inspect(USER,'p').items.find(i=>i.id===r.id).reason);assert.deepEqual(s.store.db.prepare('SELECT * FROM compute_queue').all(),snapshot);return view;}

test('Docker observations serialize through complete commit while an independent context progresses',async()=>{
 let active=0,maxActive=0,calls=0;const releases=[],pending=[];
 const s=setup({probe:async context=>{if(context==='B')return identity('B');calls++;active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>releases.push(resolve));active--;return identity('A');}}),other=new ComputeQueue(s.c,{probe:s.queue.probe});
 try{
  const first=s.queue.probeContext(USER,'A');pending.push(first);const second=other.probeContext(USER,'A');pending.push(second);await pause();
  await other.probeContext(USER,'B');assert.equal(s.store.db.prepare("SELECT status FROM compute_contexts WHERE context='B'").get().status,'ready');assert.equal(calls,1);assert.equal(maxActive,1);
  releases.shift()();await first;await pause();assert.equal(calls,2);assert.equal(s.store.db.prepare("SELECT status FROM compute_contexts WHERE context='A'").get().status,'ready');releases.shift()();await second;assert.equal(maxActive,1);
 }finally{releases.splice(0).forEach(resolve=>resolve());await Promise.allSettled(pending);await other.stop();await s.close();}
});

test('legacy ownership suspension cannot commit old ready after a newer failed Docker observation',async()=>{
 let releaseInspect,row;const s=setup({inspect:async()=>{await new Promise(resolve=>{releaseInspect=resolve;});return {Id:'old-container',Config:{Labels:{'pi-research.sandbox-job':row.id,'pi-research.manifest':row.manifestDigest}}};}}),other=new ComputeQueue(s.c,{probe:async()=>{throw new Error('new failed engine observation');}});
 try{
  row=add(s,'run',{state:'unknown'});const old=s.queue.verifyTarget('run',row.id);await pause();assert.equal(typeof releaseInspect,'function');const later=other.probeContext(USER,'A').catch(error=>error);await pause();releaseInspect();await old;assert.equal((await later).code,'COMPUTE_TARGET_UNAVAILABLE');assert.equal(s.store.db.prepare("SELECT status FROM compute_contexts WHERE context='A'").get().status,'unavailable');assert.equal(s.queue.inspect(USER).usage.jobs,1);
 }finally{releaseInspect?.();await other.stop();await s.close();}
});

test('queue refresh rechecks due claim after waiting for Docker commit, then verifies legacy outside the gate',async()=>{
 let releaseOwner,queueCalls=0,legacy;const s=setup(),other=new ComputeQueue(s.c,{probe:async()=>{queueCalls++;return identity('A');},inspect:async()=>({Id:'legacy',Config:{Labels:{'pi-research.sandbox-job':legacy.id,'pi-research.manifest':legacy.manifestDigest}}})});
 try{
  await s.queue.probeContext(USER,'A');add(s);s.store.db.prepare("UPDATE compute_contexts SET next_probe_at=0 WHERE context='A'").run();s.queue.probe=()=>new Promise(resolve=>{releaseOwner=()=>resolve(identity('A'));});const owner=s.queue.probeContext(USER,'A');other.tick();await pause();releaseOwner();await owner;await other.pending;assert.equal(queueCalls,0);
  legacy=add(s,'run',{state:'unknown'});s.store.db.prepare("UPDATE compute_contexts SET next_probe_at=0,probe_until=0 WHERE context='A'").run();other.tick();await other.pending;assert.equal(s.store.db.prepare('SELECT bound FROM compute_queue WHERE id=?').get(legacy.id).bound,1);assert.equal(queueCalls,3);
 }finally{releaseOwner?.();await other.stop();await s.close();}
});

test('single Run scheduling reuses target, capacity, GPU and recovery reasons without binding or probing',async()=>{
 const s=setup();try{
  const r=add(s);schedulingReason(s,r,'target_unresolved');await s.queue.verifyTarget('run',r.id);schedulingReason(s,r,'ready');
  s.store.db.prepare("UPDATE compute_contexts SET status='unavailable' WHERE context='A'").run();schedulingReason(s,r,'target_unavailable');
  s.store.db.prepare("UPDATE compute_contexts SET status='ready',engine_id='changed' WHERE context='A'").run();schedulingReason(s,r,'target_changed');
  await s.queue.verifyTarget('run',r.id);configure(s,{maxRuns:4,maxJobs:4,cpus:1});const blocker=add(s,'run',{trusted:true,state:'running'});schedulingReason(s,r,'host_capacity');terminal(s,blocker.id);
  configure(s,{cpus:4});configure(s,{maxJobs:1},identity('A').targetId);const sameTarget=add(s);await s.queue.verifyTarget('run',sameTarget.id);s.store.update('run',sameTarget.id,sameTarget.version,{state:'running'});schedulingReason(s,r,'target_capacity');terminal(s,sameTarget.id);
  const later=add(s);await s.queue.verifyTarget('run',later.id);schedulingReason(s,later,'earlier_job');configure(s,{cpus:0});schedulingReason(s,r,'request_too_large');configure(s,{cpus:4});
  const gpu={vendor:'nvidia',deviceIds:['GPU-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']},current=s.store.get('run',r.id);s.store.update('run',r.id,current.version,{manifest:{...current.manifest,contract:{...current.manifest.contract,gpu}}});
  s.store.db.prepare('INSERT INTO compute_gpu_claims(uuid,kind,id) VALUES(?,?,?)').run(gpu.deviceIds[0],'run',blocker.id);assert.deepEqual(schedulingReason(s,r,'gpu_busy').queue.requested.gpu,gpu);s.store.db.prepare('DELETE FROM compute_gpu_claims').run();
  const q=s.store.get('run',r.id);s.store.update('run',r.id,q.version,{state:'unknown',execution:{...q.execution,leaseUntil:Date.now()+60000}});schedulingReason(s,r,'worker_active');
  s.store.db.prepare('UPDATE compute_queue SET lease_until=0,next_attempt_at=? WHERE id=?').run(Date.now()+60000,r.id);schedulingReason(s,r,'recovery_backoff');
  s.store.db.prepare('UPDATE compute_queue SET next_attempt_at=0 WHERE id=?').run(r.id);schedulingReason(s,r,'recovery_due');
  s.store.db.prepare('UPDATE compute_queue SET bound=0 WHERE id=?').run(r.id);schedulingReason(s,r,'legacy_target_unknown');
  const local=add(s,'run',{trusted:true,state:'unknown'});schedulingReason(s,local,'manual_recovery_required');
  s.store.create('project','other',{name:'Other'},'other');assert.throws(()=>s.queue.inspectRun(USER,'other',r.id),{code:'SCOPE_DENIED'});assert.throws(()=>s.queue.inspectRun({type:'agent',projectId:'other'},'p',r.id),{code:'SCOPE_DENIED'});
  const untouched=s.store.db.prepare('SELECT * FROM compute_queue WHERE id=?').get(r.id);s.queue.candidates=s.queue.verifyTarget=s.queue.probeContext=()=>assert.fail('inspection must not bind or probe');schedulingReason(s,r,'legacy_target_unknown');assert.deepEqual(s.store.db.prepare('SELECT * FROM compute_queue WHERE id=?').get(r.id),untouched);
 }finally{await s.close();}
});
test('an unbound unheld publication reports an unavailable context without changing its reservation',()=>{
 const s=setup();try{
  const job=add(s,'publication'),before=s.store.db.prepare('SELECT * FROM compute_queue WHERE kind=\'publication\' AND id=?').get(job.id);
  s.store.db.prepare("UPDATE compute_contexts SET status='unavailable' WHERE context='A'").run();
  const contextBefore=s.store.db.prepare("SELECT * FROM compute_contexts WHERE context='A'").get();
  s.queue.probe=s.queue.verifyTarget=s.queue.probeContext=()=>assert.fail('inspection must not probe or bind');
  const item=s.queue.inspect(USER).items.find(candidate=>candidate.kind==='publication'&&candidate.id===job.id);
  assert.equal(item.reason,'target_unavailable');assert.equal(item.targetId,null);assert.equal(item.held,false);
  assert.deepEqual(s.store.db.prepare('SELECT * FROM compute_queue WHERE kind=\'publication\' AND id=?').get(job.id),before);
  assert.deepEqual(s.store.db.prepare("SELECT * FROM compute_contexts WHERE context='A'").get(),contextBefore);
 }finally{s.close();}
});
test('publication jobs reserve one slot, compete with all compute kinds and keep unknown occupancy',async()=>{
 const s=setup();try{
  configure(s,{maxJobs:3,maxRuns:3,maxDevelopment:3,cpus:2,memoryMb:2048});
  const draft=add(s,'publication',{state:'prepared',memoryMb:768});assert.equal(s.store.db.prepare('SELECT 1 FROM compute_queue WHERE id=?').get(draft.id),undefined);
  s.store.update('publication-build-job',draft.id,draft.version,{state:'queued'});await s.queue.verifyTarget('publication',draft.id);assert.ok(claim(s,'publication',draft.id));
  const second=add(s,'publication',{context:'B',memoryMb:768}),other=add(s,'document',{context:'C',memoryMb:512});await s.queue.verifyTarget('publication',second.id);await s.queue.verifyTarget('document',other.id);
  assert.equal(claim(s,'publication',second.id),null);assert.ok(claim(s,'document',other.id));assert.equal(s.queue.inspect(USER).usage.publications,1);assert.equal(s.queue.inspect(USER).available.publications,0);
  const current=s.store.get('publication-build-job',draft.id);s.store.update('publication-build-job',draft.id,current.version,{state:'unknown',leaseUntil:0});assert.equal(claim(s,'publication',second.id),null);assert.equal(s.queue.inspect(USER).usage.jobs,2);
  terminal(s,draft.id,'publication');assert.ok(claim(s,'publication',second.id));assert.equal(s.queue.inspect(USER).usage.publications,1);
 }finally{s.close();}
});
function unknown(s,id){const r=s.store.get('run',id);s.store.update('run',id,r.version,{state:'unknown',execution:{...r.execution,leaseUntil:0}});s.store.db.prepare('UPDATE compute_queue SET next_attempt_at=0 WHERE id=?').run(id);}

test('formal and development jobs share host CPU/RAM reservation and retain it after lease expiry',async()=>{
 const s=setup();try{configure(s,{maxRuns:4,maxDevelopment:4,maxJobs:4,cpus:2,memoryMb:512});const run=add(s,'run',{cpus:2,memoryMb:512}),dev=add(s,'development');await s.queue.verifyTarget('run',run.id);await s.queue.verifyTarget('development',dev.id);
  assert.ok(claim(s,'run',run.id));assert.equal(claim(s,'development',dev.id),null);unknown(s,run.id);const held=s.queue.inspect(USER);assert.equal(held.usage.cpus,2);assert.equal(held.usage.memoryMb,512);assert.equal(held.usage.unknown,1);assert.equal(claim(s,'development',dev.id),null);
  await assert.rejects(()=>s.queue.verifyTarget('run',run.id),{code:'COMPUTE_LEASE_EXPIRED'});assert.ok(claim(s,'run',run.id),'recovery reuses its old reservation');await s.queue.verifyTarget('run',run.id);assert.equal(s.queue.inspect(USER).usage.jobs,1);terminal(s,run.id);assert.ok(claim(s,'development',dev.id));assert.equal(s.queue.inspect(USER).usage.jobs,1);
 }finally{await s.close();}
});

test('two control processes cannot concurrently admit more than the shared budget',async()=>{
 const s=setup();try{configure(s,{maxRuns:2,maxJobs:2,cpus:1});const a=add(s,'run',{trusted:true}),b=add(s,'run',{trusted:true}),module=new URL('../../dist/packages/storage/store.js',import.meta.url).href,compute=new URL('../../dist/packages/scheduler/compute-queue.js',import.meta.url).href;
  const script=`import {Store} from ${JSON.stringify(module)};import {ComputeQueue} from ${JSON.stringify(compute)};const [path,id]=process.argv.slice(1),store=new Store(path),queue=new ComputeQueue({store,dataDir:'.',repoRoot:'.'});const result=queue.withAdmission('run',id,()=>{const r=store.get('run',id);return store.update('run',id,r.version,{state:'running',heartbeat:Date.now()});});process.stdout.write(result?'claimed':'blocked');store.close();`;
  const results=await Promise.all([a,b].map(r=>exec(process.execPath,['--input-type=module','-e',script,s.store.path,r.id],{windowsHide:true,timeout:15000})));assert.equal(results.filter(r=>r.stdout==='claimed').length,1);assert.equal(s.queue.inspect(USER).usage.jobs,1);
  const second=new Store(s.store.path);try{const other=new ComputeQueue({...s.c,store:second});assert.equal(other.inspect(USER).usage.cpus,1);assert.equal(other.withAdmission('run',b.id,()=>true),null);}finally{second.close();}
 }finally{await s.close();}
});

test('unknown target A does not block independent B when shared host capacity remains',async()=>{
 const s=setup();try{configure(s,{maxRuns:3,maxJobs:3,cpus:3,memoryMb:1024});const a=add(s,'run',{context:'A'}),b=add(s,'run',{context:'B'});await s.queue.verifyTarget('run',a.id);await s.queue.verifyTarget('run',b.id);configure(s,{maxJobs:1},identity('A').targetId);assert.ok(claim(s,'run',a.id));unknown(s,a.id);
  assert.ok(s.queue.candidates('run').includes(b.id));assert.ok(claim(s,'run',b.id));const view=s.queue.inspect(USER);assert.equal(view.usage.jobs,2);assert.equal(view.targets.find(t=>t.targetId===identity('A').targetId).usage.unknown,1);assert.equal(view.targets.find(t=>t.targetId===identity('B').targetId).usage.jobs,1);
 }finally{await s.close();}
});

test('aliases share target limits and a changed engine or endpoint cannot release old occupancy',async()=>{
 let engine='A',endpoint;
 const s=setup({probe:async()=>({...identity(engine),...(endpoint?{endpoint}:{})})});try{configure(s,{maxRuns:4,maxJobs:4});const a=add(s,'run',{context:'A'}),alias=add(s,'run',{context:'alias-A'});await s.queue.verifyTarget('run',a.id);await s.queue.verifyTarget('run',alias.id);configure(s,{maxJobs:1},identity('A').targetId);assert.ok(claim(s,'run',a.id));assert.equal(claim(s,'run',alias.id),null);
  engine='B';await assert.rejects(()=>s.queue.verifyTarget('run',a.id),{code:'COMPUTE_TARGET_CHANGED'});assert.equal(s.queue.inspect(USER).usage.jobs,1);assert.equal(s.store.db.prepare('SELECT target_id FROM compute_queue WHERE id=?').get(a.id).target_id,identity('A').targetId);
  engine='A';endpoint='unix:///fixture/changed.sock';await assert.rejects(()=>s.queue.verifyTarget('run',a.id),{code:'COMPUTE_TARGET_CHANGED'});
 }finally{await s.close();}
});

test('legacy active jobs bind only after matching owned-container proof and fence changes during probe are rejected',async()=>{
 let owned=false,row;const s=setup({inspect:async()=>owned?{Id:'old-container',Config:{Labels:{'pi-research.sandbox-job':row.id,'pi-research.manifest':row.manifestDigest}}}:null});try{row=add(s,'run',{state:'unknown'});await assert.rejects(()=>s.queue.verifyTarget('run',row.id),{code:'COMPUTE_LEGACY_TARGET_UNKNOWN'});assert.equal(s.queue.inspect(USER).usage.jobs,1);assert.equal(s.store.db.prepare('SELECT bound FROM compute_queue WHERE id=?').get(row.id).bound,0);
  owned=true;await s.queue.verifyTarget('run',row.id);assert.equal(s.store.db.prepare('SELECT bound FROM compute_queue WHERE id=?').get(row.id).bound,1);
  const q=add(s),race=new ComputeQueue(s.c,{probe:async()=>{const r=s.store.get('run',q.id);s.store.update('run',r.id,r.version,{execution:{...r.execution,generation:1}});return identity('A');}});await assert.rejects(()=>race.verifyTarget('run',q.id),{code:'COMPUTE_LEASE_EXPIRED'});
 }finally{await s.close();}
});

test('same-target smaller jobs cannot overtake a temporary capacity wait, but oversized jobs do not block',async()=>{
 const s=setup();try{configure(s,{maxRuns:4,maxDevelopment:4,maxJobs:4,cpus:4});const active=add(s,'run',{cpus:3}),large=add(s,'development',{cpus:2}),small=add(s,'run',{cpus:1});for(const [kind,r] of [['run',active],['development',large],['run',small]])await s.queue.verifyTarget(kind,r.id);
  assert.ok(claim(s,'run',active.id));assert.equal(claim(s,'run',small.id),null);assert.equal(s.queue.inspect(USER).items.find(i=>i.id===small.id).reason,'earlier_job');terminal(s,active.id);assert.equal(claim(s,'run',small.id),null);assert.ok(claim(s,'development',large.id));assert.ok(claim(s,'run',small.id));terminal(s,large.id,'development');terminal(s,small.id);
  const impossible=add(s,'run',{cpus:5}),fits=add(s,'run',{cpus:1});await s.queue.verifyTarget('run',impossible.id);await s.queue.verifyTarget('run',fits.id);assert.ok(claim(s,'run',fits.id));assert.equal(s.queue.inspect(USER).items.find(i=>i.id===impossible.id).reason,'request_too_large');
 }finally{await s.close();}
});

test('explicit queue caps keep prior backlog, apply to aliases and deny unprivileged configuration',async()=>{
 const s=setup();try{const first=add(s),second=add(s);await s.queue.verifyTarget('run',first.id);await s.queue.verifyTarget('run',second.id);configure(s,{maxQueued:1});assert.equal(s.queue.inspect(USER).queued,2);assert.throws(()=>add(s),{code:'COMPUTE_QUEUE_FULL'});assert.throws(()=>s.queue.configure({type:'agent'},{expectedVersion:1,limits:{maxJobs:9}}),{code:'PERMISSION_DENIED'});
  configure(s,{maxQueued:null});configure(s,{maxQueued:2},identity('A').targetId);assert.throws(()=>add(s,'development',{context:'alias-A'}),{code:'COMPUTE_QUEUE_FULL'});assert.equal(s.queue.inspect(USER).queued,2);
  assert.throws(()=>s.queue.configure(USER,{expectedVersion:0,limits:{maxJobs:9}}),{code:'VERSION_CONFLICT'});assert.throws(()=>s.queue.configure(USER,{expectedVersion:s.queue.inspect(USER).configuration.version,limits:JSON.parse('{"constructor":4}')}),{code:'INVALID_INPUT'});
 }finally{await s.close();}
});

test('queue projection releases terminal rows atomically and uses bounded indexed queries instead of history lists',async()=>{
 const s=setup();try{const r=add(s,'run',{trusted:true});assert.throws(()=>s.queue.withAdmission('run',r.id,()=>{claim(s,'run',r.id);throw new Error('rollback');}),/rollback/);assert.equal(s.queue.inspect(USER).usage.jobs,0);assert.ok(claim(s,'run',r.id));
  s.store.db.prepare("UPDATE records SET data=json_set(data,'$.state','succeeded'),version=version+1 WHERE kind='run' AND id=?").run(r.id);assert.equal(s.queue.inspect(USER).usage.jobs,0);
  for(let i=0;i<80;i++)add(s,'run',{state:'succeeded',trusted:true});const a=add(s,'run',{trusted:true}),b=add(s,'run',{trusted:true});s.store.list=()=>{throw new Error('full history scan');};assert.deepEqual(s.queue.queued('run',1),[a.id]);assert.deepEqual(s.queue.queued('run',1),[b.id]);assert.deepEqual(s.queue.queued('run',1),[a.id]);assert.equal(s.queue.inspect(USER,undefined,{limit:1}).items.length,1);
  const plan=s.store.db.prepare("EXPLAIN QUERY PLAN SELECT id FROM compute_queue WHERE kind='run' AND phase='queued' ORDER BY sequence LIMIT 8").all();assert.ok(plan.some(r=>String(r.detail).includes('compute_queue_kind_phase_sequence')));
 }finally{await s.close();}
});

test('version two migration reserves old unknown jobs without rewriting historical JSON',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'compute-migration-')),path=join(dir,'state.db'),db=new DatabaseSync(path);
 const old={id:'old-active',kind:'run',projectId:'p',version:1,createdAt:'2020-01-01',updatedAt:'2020-01-01',state:'unknown',manifest:{contract:{runner:'docker',dockerContext:'legacy',cpus:3,memoryMb:2048}},manifestDigest:'old'},history={...old,id:'old-finished',state:'succeeded'};
 db.exec('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);INSERT INTO schema_migrations VALUES(1,\'old\');CREATE TABLE records(kind TEXT NOT NULL,id TEXT NOT NULL,project_id TEXT,version INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(kind,id));');for(const r of [old,history])db.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run('run',r.id,'p',1,JSON.stringify(r));db.close();
 const store=new Store(path),queue=new ComputeQueue({store,dataDir:dir,repoRoot:resolve('.')});try{assert.equal(digest(store.get('run',old.id)),digest(old));assert.equal(digest(store.get('run',history.id)),digest(history));const view=queue.inspect(USER);assert.equal(view.usage.jobs,1);assert.equal(view.usage.cpus,3);assert.equal(view.usage.memoryMb,2048);assert.equal(view.items[0].targetId,null);assert.equal(view.items[0].reason,'legacy_target_unknown');assert.ok(store.db.prepare('SELECT 1 FROM schema_migrations WHERE version=2').get());assert.equal(Number(store.db.prepare('SELECT count(*) n FROM compute_queue').get().n),1);
 }finally{await queue.stop();store.close();rmSync(dir,{recursive:true,force:true});}
});

test('available capacity is server computed, includes unknown once and retains nullable budgets',async()=>{
 const s=setup();try{assert.equal(s.queue.inspect(USER).available.cpus,null);configure(s,{cpus:1.001,memoryMb:300,maxJobs:3,maxRuns:3});const r=add(s);await s.queue.verifyTarget('run',r.id);assert.ok(claim(s,'run',r.id));unknown(s,r.id);const view=s.queue.inspect(USER);assert.deepEqual(view.available,{jobs:2,runs:2,development:1,documents:1,publications:1,cpus:0.001,memoryMb:44});assert.equal(view.targets.find(t=>t.targetId===identity('A').targetId).available.cpus,0.001);
  const other=add(s,'development',{context:'B'});await s.queue.verifyTarget('development',other.id);configure(s,{cpus:null,memoryMb:null,maxJobs:10},identity('B').targetId);const independent=s.queue.inspect(USER).targets.find(t=>t.targetId===identity('B').targetId);assert.equal(independent.usage.jobs,0);assert.equal(independent.available.cpus,0.001);assert.equal(independent.available.jobs,2);
  configure(s,{cpus:0.5,memoryMb:128});assert.equal(s.queue.inspect(USER).available.cpus,0);assert.equal(s.queue.inspect(USER).available.memoryMb,0);assert.throws(()=>configure(s,{cpus:1.0001}),{code:'INVALID_INPUT'});
 }finally{await s.close();}
});

test('explicit target probes unblock an independent new engine without letting aliases bypass a zero queue cap',async()=>{
 let redirected=false;const s=setup({probe:async name=>identity(name==='alias-A'?'A':name==='A'&&redirected?'B':name)});try{
  configure(s,{maxJobs:4,maxRuns:4,cpus:4});const first=add(s,'run',{context:'A'});await s.queue.verifyTarget('run',first.id);assert.ok(claim(s,'run',first.id));configure(s,{maxQueued:0},identity('A').targetId);
  assert.throws(()=>s.queue.assertEnqueue('run','p','B'),{code:'COMPUTE_TARGET_PROBE_REQUIRED'});assert.equal(s.store.db.prepare("SELECT 1 FROM compute_contexts WHERE context='B'").get(),undefined);
  const discovered=await s.queue.probeContext(USER,'B');assert.equal(discovered.targetId,identity('B').targetId);assert.equal(discovered.backend,'docker');assert.ok(Number.isFinite(Date.parse(discovered.observedAt)));assert.equal('endpoint' in discovered,false);
  s.queue.assertEnqueue('run','p','B');const second=add(s,'run',{context:'B'});assert.ok(claim(s,'run',second.id));
  await s.queue.probeContext(USER,'alias-A');assert.throws(()=>s.queue.assertEnqueue('development','p','alias-A'),{code:'COMPUTE_TARGET_QUEUE_FULL'});assert.throws(()=>add(s,'development',{context:'alias-A'}),{code:'COMPUTE_QUEUE_FULL'});
  s.store.db.prepare("UPDATE compute_contexts SET next_probe_at=0 WHERE context='B'").run();assert.throws(()=>s.queue.assertEnqueue('run','p','B'),{code:'COMPUTE_TARGET_PROBE_REQUIRED'});await s.queue.probeContext(USER,'B');assert.doesNotThrow(()=>s.queue.assertEnqueue('run','p','B'));
  redirected=true;await s.queue.probeContext(USER,'A');const held=s.store.db.prepare('SELECT held,target_id,engine_id FROM compute_queue WHERE id=?').get(first.id);assert.equal(held.held,1);assert.equal(held.target_id,identity('A').targetId);assert.equal(held.engine_id,'A');assert.equal(s.queue.inspect(USER).usage.jobs,2);assert.doesNotThrow(()=>s.queue.assertEnqueue('run','p','A'));await assert.rejects(()=>s.queue.verifyTarget('run',first.id),{code:'COMPUTE_TARGET_CHANGED'});
 }finally{await s.close();}
});

test('target probe revalidates owner authority after I/O and Store update queue-gate errors remain domain errors',async()=>{
 let probes=0,valid=true;const s=setup({probe:async name=>{probes++;valid=false;return identity(name);}});try{
  await assert.rejects(()=>s.queue.probeContext({type:'agent'},'A'),{code:'PERMISSION_DENIED'});assert.equal(probes,0);
  await assert.rejects(()=>s.queue.probeContext(USER,'A',()=>{if(!valid)throw Object.assign(new Error('aborted fixture'),{code:'ABORTED'});}),{code:'ABORTED'});assert.equal(s.store.db.prepare("SELECT 1 FROM compute_contexts WHERE context='A'").get(),undefined);
  const row=add(s,'run',{state:'failed',trusted:true});configure(s,{maxQueued:0});assert.throws(()=>s.store.update('run',row.id,row.version,{state:'queued'}),{code:'COMPUTE_QUEUE_FULL',status:409});assert.equal(s.store.get('run',row.id).state,'failed');
 }finally{await s.close();}
});


test('document parsing shares CPU and total slots, has one durable document slot, and approval preparation is not queued',async()=>{
 const s=setup();try{configure(s,{maxRuns:3,maxDevelopment:3,maxJobs:3,cpus:2,memoryMb:1024});const prepared=add(s,'document',{state:'prepared',memoryMb:512});assert.equal(s.store.db.prepare("SELECT 1 FROM compute_queue WHERE id=?").get(prepared.id),undefined);const current=s.store.get('document-parse-job',prepared.id);s.store.update('document-parse-job',current.id,current.version,{state:'queued'});await s.queue.verifyTarget('document',current.id);assert.ok(claim(s,'document',current.id));assert.equal(s.queue.inspect(USER).usage.documents,1);
  const second=add(s,'document',{context:'B',memoryMb:512}),run=add(s,'run',{context:'C'});await s.queue.verifyTarget('document',second.id);await s.queue.verifyTarget('run',run.id);assert.equal(claim(s,'document',second.id),null);assert.ok(claim(s,'run',run.id));assert.equal(s.queue.inspect(USER).usage.jobs,2);assert.equal(s.queue.inspect(USER).available.documents,0);
  const active=s.store.get('document-parse-job',current.id);s.store.update('document-parse-job',active.id,active.version,{state:'unknown',leaseUntil:0});assert.equal(s.queue.inspect(USER).usage.documents,1);assert.equal(claim(s,'document',second.id),null);terminal(s,current.id,'document');assert.ok(claim(s,'document',second.id));assert.equal(s.queue.inspect(USER).usage.documents,1);
 }finally{await s.close();}
});
