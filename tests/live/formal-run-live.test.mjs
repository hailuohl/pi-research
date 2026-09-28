import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, chmodSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
import {docker, preflight, inspect} from '../../dist/packages/execution/docker.js';
import {formalDockerJob} from '../../dist/packages/runners/docker.js';

const image = process.env.PI_DEVELOPMENT_IMAGE, context = process.env.PI_DEVELOPMENT_CONTEXT || 'desktop-linux';
const skip = process.env.PI_FORMAL_RUN_LIVE !== '1' ? 'NOT EXECUTED: set PI_FORMAL_RUN_LIVE=1' : !image ? 'NOT EXECUTED: set PI_DEVELOPMENT_IMAGE to a locally available immutable image digest' : false;
const terminal = run => ['succeeded', 'failed', 'cancelled'].includes(run.state);
const measured = `from pathlib import Path
import csv, json, time
out=Path('/output')
xs=[-2,-1,0,1,2]
ys=[3*x+2 for x in xs]
xbar=sum(xs)/len(xs); ybar=sum(ys)/len(ys)
slope=sum((x-xbar)*(y-ybar) for x,y in zip(xs,ys))/sum((x-xbar)**2 for x in xs)
intercept=ybar-slope*xbar
pred=[slope*x+intercept for x in xs]
mse=sum((a-b)**2 for a,b in zip(ys,pred))/len(xs)
(out/'metrics.json').write_text(json.dumps({'mse':mse,'slope':slope,'intercept':intercept}))
with (out/'predictions.csv').open('w',newline='') as f:
    w=csv.writer(f);w.writerow(['x','observed','predicted']);w.writerows(zip(xs,ys,pred))
print('measured-ols',mse,flush=True)
`;

test('real formal Run: approved Python measurement, independent supervisor, archives and safe recovery', {skip, timeout:240000}, async t => {
 const validation = resolve('.validation'); mkdirSync(validation, {recursive:true}); const dir = mkdtempSync(join(validation, 'formal-run-live-'));
 let app = new ResearchApp(dir, process.cwd());
 const evidence = {dataDir:dir,image,context,checks:[],passed:false};
 const save = () => writeFileSync(join(dir,'evidence.json'), JSON.stringify(evidence,null,2));
 const project = app.projects.create(USER,{name:'Formal Docker real flow acceptance',template:'curve-fit'});
 const record = (name,run,extra={}) => {evidence.checks.push({name,runId:run.id,state:run.state,integrity:run.integrity,exitCode:run.exitCode,supervisorPid:run.supervisorPid,containerId:run.execution?.containerId,generation:run.execution?.generation,logsIncomplete:run.execution?.logsIncomplete,manifestDigest:run.manifestDigest,artifactIds:run.artifactIds,evidenceIds:run.evidenceIds,...extra});save();};
 const approve = id => {const a=app.store.get('approval',id);app.approvals.decide(USER,id,a.version,true);};
 function prepare(name,source,overrides={}) {
  const experiment=app.experiments.create(USER,project.id,{title:name,hypothesis:'Small fixed-data Python measurement through the actual approved formal runner',contract:{runner:'docker',image,dockerContext:context,command:['python','-u','formal.py'],environment:{},datasetVersion:'fixed-five-points-v1',evaluationProtocolVersion:'ols-in-sample-v1',metrics:{mse:{unit:'squared-target',direction:'min'}},expectedArtifacts:['metrics.json','predictions.csv'],timeoutSeconds:30,cpus:1,memoryMb:256,...overrides}});
  app.experiments.writeFile(USER,experiment.id,'formal.py',source,null,experiment.version);
  return app.runs.prepare(USER,experiment.id);
 }
 const submit = intent => {approve(intent.approvalId); return app.runs.submit(USER,intent.id);};
 async function wait(id,predicate=terminal,timeout=45000) {
  const end=Date.now()+timeout;
  while(Date.now()<end) {app.runs.reconcile();app.runs.launchPending();const run=app.runs.get(USER,id);if(predicate(run))return run;await pause(150);}
  const run=app.runs.get(USER,id);throw new Error(`Formal Run did not reach expected state: ${JSON.stringify({id,state:run.state,error:run.error,execution:run.execution,supervisorPid:run.supervisorPid})}`);
 }
 const artifacts = run => run.artifactIds.map(id => ({row:app.store.get('artifact',id),bytes:app.evidence.read(USER,id).bytes}));
 let failures=0;
 const check=(name,fn)=>t.test(name,async()=>{try {await fn();}catch(error){failures++;save();throw error;}});
 try {
  await preflight(context,image);evidence.engine=JSON.parse(await docker(context,['version','--format','{{json .Server}}']));save();
  await check('unapproved intent cannot submit or launch',async()=>{
   const intent=prepare('unapproved',measured+'\n# unapproved\n');const before=app.store.list('run').length;
   assert.throws(()=>app.runs.submit(USER,intent.id));app.runs.launchPending();assert.equal(app.store.list('run').length,before);
   evidence.checks.push({name:'unapproved-blocked',intentId:intent.id,createdRun:false});save();
  });
  await check('approved non-whitelisted Python measures and archives after app close/reopen',async()=>{
   const run=submit(prepare('measured OLS after app disconnect',"from pathlib import Path\nimport time\nPath('/output/started.txt').write_text('started')\ntime.sleep(4)\n"+measured));
   app.runs.launchPending();const running=await wait(run.id,r=>r.state==='running'&&existsSync(join(r.outputDir,'started.txt'))||terminal(r));
   assert.equal(running.state,'running');assert.ok(running.supervisorPid&&running.supervisorPid!==process.pid);
   const containerId=running.execution.containerId;app.close();await pause(700);app=new ResearchApp(dir,process.cwd());
   const done=await wait(run.id);record('approved-python-disconnect',done);
   assert.equal(done.state,'succeeded',done.error);assert.equal(done.integrity,'complete',done.error);assert.equal(done.exitCode,0);assert.equal(done.execution.containerId,containerId);assert.equal(done.metrics.mse,0);assert.ok(done.evidenceIds.length);
   const archive=artifacts(done);for(const name of ['metrics.json','predictions.csv','stdout.log','stderr.log','execution.json'])assert.ok(archive.some(a=>a.row.title===name),name);
   const metric=JSON.parse(archive.find(a=>a.row.title==='metrics.json').bytes.toString());assert.deepEqual(metric,{mse:0,slope:3,intercept:2});
   assert.match(archive.find(a=>a.row.title==='predictions.csv').bytes.toString(),/2,8,8/);assert.match(app.runs.logs(USER,done.id).content,/measured-ols/);
   assert.equal(existsSync(join(done.outputDir,'stdout.log')),false);assert.equal(app.experiments.get(USER,done.experimentId).lifecycle,'frozen');
  });
  await check('exit zero with missing expected artifact stays incomplete and real stderr is retained',async()=>{
   const run=submit(prepare('missing predictions',"import pathlib,sys\npathlib.Path('/output/metrics.json').write_text('{\"mse\":0}')\nprint('missing-predictions-marker',file=sys.stderr)\n"));
   const done=await wait(run.id);record('zero-exit-missing-artifact',done);assert.equal(done.exitCode,0);assert.notEqual(done.integrity,'complete');assert.equal(done.state,'failed');assert.match(app.runs.logs(USER,done.id,0,'stderr').content,/missing-predictions-marker/);
   const failed=submit(prepare('Python assertion failure',"import sys\nprint('formal-failure-marker',file=sys.stderr,flush=True)\nraise RuntimeError('deliberate formal failure')\n"));
   const failure=await wait(failed.id);record('python-failure-stderr',failure);assert.equal(failure.state,'failed');assert.notEqual(failure.exitCode,0);assert.match(app.runs.logs(USER,failure.id,0,'stderr').content,/formal-failure-marker[\s\S]*RuntimeError/);assert.ok(artifacts(failure).some(a=>a.row.title==='stderr.log'));
  });
  const sleeping="from pathlib import Path\nimport time\nPath('/output/started.txt').write_text('started')\nprint('started',flush=True)\ntime.sleep(60)\n";
  for(const mode of ['cancel','timeout']) await check(mode+' terminates only the owned formal container',async()=>{
   const run=submit(prepare(mode,sleeping+`\n# ${mode}\n`,{timeoutSeconds:mode==='timeout'?2:30}));
   if(mode==='cancel'){const running=await wait(run.id,r=>r.state==='running'||terminal(r));assert.equal(running.state,'running');app.runs.cancel(USER,run.id);}
   const done=await wait(run.id);record(mode,done);assert.equal(done.state,mode==='cancel'?'cancelled':'failed');if(mode==='timeout')assert.match(done.error,/timeout/);
   const container=await inspect(formalDockerJob(done));assert.equal(container.State.Running,false);assert.equal(container.State.Status,'exited');
  });
  await check('killed supervisor recovers the same container without restarting measured code',async()=>{
   const source="from pathlib import Path\nimport time\nwith Path('/output/once.txt').open('a') as f: f.write('once\\n')\nprint('before-supervisor-crash',flush=True)\ntime.sleep(9)\n"+measured;
   const run=submit(prepare('supervisor crash recovery',source));
   const running=await wait(run.id,r=>r.state==='running'&&existsSync(join(r.outputDir,'once.txt'))||terminal(r));assert.equal(running.state,'running');
   const before=await inspect(formalDockerJob(running));assert.equal(before.State.Running,true);assert.ok(Number.isInteger(running.supervisorPid)&&running.supervisorPid>0&&running.supervisorPid!==process.pid);
   process.kill(running.supervisorPid,'SIGKILL');await pause(300);
   app.store.transaction(()=>{const r=app.store.get('run',run.id);app.store.update('run',r.id,r.version,{heartbeat:Date.now()-61000,execution:{...r.execution,leaseUntil:0}});});
   app.close();app=new ResearchApp(dir,process.cwd());app.runs.reconcile();app.runs.launchPending();
   const done=await wait(run.id);record('same-container-recovery',done,{previousSupervisorPid:running.supervisorPid,previousContainerId:running.execution.containerId});
   assert.equal(done.execution.containerId,running.execution.containerId);assert.ok(done.execution.generation>running.execution.generation);assert.ok(done.execution.recoveryCount>0);assert.equal(done.execution.logsIncomplete,true);assert.notEqual(done.integrity,'complete');assert.equal(done.state,'failed');
   assert.equal(readFileSync(join(done.outputDir,'once.txt'),'utf8'),'once\n');assert.equal(done.metrics.mse,0);assert.ok(artifacts(done).some(a=>a.row.title==='execution.json'));
  });
  await check('tampered approved source cannot create or start a container',async()=>{
   const run=submit(prepare('tampered before launch',measured+'\n# unique tampered snapshot\n'));
   const path=join(run.manifest.snapshotPath,'formal.py');chmodSync(path,0o600);writeFileSync(path,'raise RuntimeError("tampered source must never execute")\n');
   const done=await wait(run.id);record('tampered-source-blocked',done);assert.notEqual(done.state,'succeeded');assert.notEqual(done.integrity,'complete');assert.equal(done.execution.startRequested,false);assert.equal(done.execution.containerId,undefined);assert.equal(await inspect(formalDockerJob(done)),null);
  });
  evidence.passed=failures===0;save();t.diagnostic(`Retained formal Run evidence: ${dir}`);
 } finally {
  for(const run of app.store.list('run').filter(r=>r.execution)) {
   try {const container=await inspect(formalDockerJob(run));if(container?.State.Running)await docker(context,['kill',container.Id]);}catch(error){evidence.cleanupError=String(error);}
  }
  save();app.close();
 }
});
