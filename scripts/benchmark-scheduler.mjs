import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {Store,digest} from '../dist/packages/storage/store.js';
import {ComputeQueue} from '../dist/packages/scheduler/compute-queue.js';

// Manual, synthetic storage benchmark. These rows are NOT executed scientific Runs.
const args=process.argv.slice(2),index=args.indexOf('--iterations'),iterations=index<0?200:Number(args[index+1]);assert.ok(Number.isInteger(iterations)&&iterations>=10&&iterations<=5000,'--iterations must be 10–5000');
const root=resolve('.validation');mkdirSync(root,{recursive:true});const dir=mkdtempSync(join(root,'scheduler-benchmark-')),store=new Store(join(dir,'state.db')),queue=new ComputeQueue({store,dataDir:dir,repoRoot:process.cwd()});
const fixtureManifest={fixture:'PERFORMANCE_FIXTURE_NOT_EXECUTED',contract:{runner:'docker',dockerContext:'fixture-A',cpus:1,memoryMb:256}},oldDigest=digest(fixtureManifest),historyCount=20000,queuedCount=64;
const evidence={fixture:true,scientificConclusion:false,scope:'compute queue inspect/candidates only; not a whole-application benchmark',node:process.version,platform:process.platform,dataDir:dir,historyCount,queuedCount,iterations,passed:false};
const percentile=(samples,p)=>samples.slice().sort((a,b)=>a-b)[Math.max(0,Math.ceil(samples.length*p)-1)];
function measure(fn){for(let i=0;i<20;i++)fn();const samples=[];for(let i=0;i<iterations;i++){const before=performance.now();fn();samples.push(performance.now()-before);}return {samples:iterations,p50Ms:percentile(samples,0.5),p95Ms:percentile(samples,0.95),minMs:Math.min(...samples),maxMs:Math.max(...samples)};}
const unchanged=()=>{const value=store.db.prepare("SELECT count(*) count,sum(json_extract(data,'$.manifest')<>? OR json_extract(data,'$.manifestDigest')<>?) changed FROM records WHERE kind='run' AND id LIKE 'history-%'").get(JSON.stringify(fixtureManifest),oldDigest);assert.equal(Number(value.count),historyCount);assert.equal(Number(value.changed),0);return {count:Number(value.count),changed:Number(value.changed),originalManifestDigest:oldDigest};};
try{
 const start=performance.now();store.transaction(()=>{
  store.create('project','fixture-project',{name:'PERFORMANCE FIXTURE — not executed science'},'fixture-project');
  for(let i=0;i<historyCount;i++)store.create('run','fixture-project',{fixture:true,state:'failed',manifest:fixtureManifest,manifestDigest:oldDigest,artifactIds:[],evidenceIds:[]},`history-${String(i).padStart(5,'0')}`);
  for(let i=0;i<queuedCount+2;i++){const development=i%2===1,context=i%4<2?'fixture-A':'fixture-B',resources={cpus:1,memoryMb:256},manifest=development?{fixture:true,dockerContext:context,resources}:{fixture:true,contract:{runner:'docker',dockerContext:context,...resources}};store.create(development?'sandbox-job':'run','fixture-project',{fixture:true,state:i<2?'unknown':'queued',manifest,manifestDigest:digest(manifest),...(development?{generation:1,leaseUntil:0}:{execution:{generation:1,leaseUntil:0,dockerContext:context}})},`pending-${String(i).padStart(3,'0')}`);}
  for(const context of ['fixture-A','fixture-B']){const target='docker-'+digest(context);store.db.prepare("UPDATE compute_contexts SET target_id=?,engine_id=?,endpoint=?,status='ready',next_probe_at=? WHERE context=?").run(target,context,`unix:///performance-fixture/${context}.sock`,Date.now()+86400000,context);store.db.prepare('UPDATE compute_queue SET target_id=?,engine_id=?,endpoint=?,bound=1 WHERE context_name=?').run(target,context,`unix:///performance-fixture/${context}.sock`,context);}
 });evidence.seedMs=performance.now()-start;
 queue.configure({type:'user'},{expectedVersion:1,limits:{maxRuns:4,maxDevelopment:4,maxJobs:6,cpus:4,memoryMb:4096,maxQueued:100}});evidence.before=unchanged();evidence.projectionRows=Number(store.db.prepare('SELECT count(*) n FROM compute_queue').get().n);assert.equal(evidence.projectionRows,queuedCount+2);
 // Capture actual public-method SQL and its bound arguments once; time unwrapped native statements.
 const prepare=store.db.prepare.bind(store.db),queries=new Map();store.db.prepare=sql=>{const statement=prepare(sql),record=(method,parameters)=>{if(/^\s*(SELECT|WITH)\b/i.test(sql)&&!queries.has(sql))queries.set(sql,parameters);return statement[method](...parameters);};return {all:(...p)=>record('all',p),get:(...p)=>record('get',p),run:(...p)=>record('run',p)};};
 try{queue.inspect({type:'user'});queue.candidates('run');queue.candidates('development');}finally{store.db.prepare=prepare;}
 assert.ok([...queries.keys()].every(sql=>!(/\bFROM\s+records\b/i.test(sql))),'Hot queue paths must not scan historical records');
 evidence.queryPlans=[...queries].map(([sql,parameters])=>({sql,parameters,plan:prepare('EXPLAIN QUERY PLAN '+sql).all(...parameters)}));
 store.list=()=>{throw new Error('Benchmark detected full-record history decoding');};evidence.memoryBefore=process.memoryUsage();
 evidence.timings={inspect:measure(()=>queue.inspect({type:'user'})),runCandidates:measure(()=>queue.candidates('run')),developmentCandidates:measure(()=>queue.candidates('development'))};evidence.memoryAfter=process.memoryUsage();
 if(args.includes('--lock-wait')){
  const script="import {DatabaseSync} from 'node:sqlite';const db=new DatabaseSync(process.argv[1]);db.exec('BEGIN IMMEDIATE');process.stdout.write('locked');setTimeout(()=>{db.exec('ROLLBACK');db.close();},200);";
  const child=spawn(process.execPath,['--input-type=module','-e',script,store.path],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',b=>stderr+=b.toString());const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error(stderr)));});
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>{if(code!==0)reject(new Error(stderr));});});const before=performance.now();store.db.exec('BEGIN IMMEDIATE');store.db.exec('ROLLBACK');evidence.writerLockWaitMs=performance.now()-before;await done;
 }
 evidence.after=unchanged();evidence.passed=true;
}catch(error){evidence.error=error.message;process.exitCode=1;}
finally{await queue.stop();store.close();writeFileSync(join(dir,'evidence.json'),JSON.stringify(evidence,null,2));}
console.log(JSON.stringify({passed:evidence.passed,fixture:true,evidencePath:join(dir,'evidence.json'),timings:evidence.timings,memoryAfter:evidence.memoryAfter,writerLockWaitMs:evidence.writerLockWaitMs},null,2));
