import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
import {docker,probeDockerTarget,JOB_LABEL,MANIFEST_LABEL} from '../../dist/packages/execution/docker.js';

const image=process.env.PI_DEVELOPMENT_IMAGE,context=process.env.PI_DEVELOPMENT_CONTEXT||'desktop-linux';
const skip=process.env.PI_SCHEDULER_LIVE!=='1'?'NOT EXECUTED: set PI_SCHEDULER_LIVE=1':!image?'NOT EXECUTED: PI_DEVELOPMENT_IMAGE must be a locally available image@sha256:digest':false;
const terminal=row=>['succeeded','failed','cancelled','timed_out'].includes(row.state);

test('real Docker formal and development jobs share one CPU reservation across controllers and reconnect',{skip,timeout:180000},async()=>{
 const base=resolve('.validation');mkdirSync(base,{recursive:true});const dir=mkdtempSync(join(base,'scheduler-live-')),repoRoot=process.cwd();let app=new ResearchApp(dir,repoRoot),controller;
 const evidence={fixture:true,scientificConclusion:false,image,context,dataDir:dir,passed:false,controllers:[],samples:[],checks:[]};let runId,jobId,projectId,controllerCount=0;
 const save=()=>writeFileSync(join(dir,'evidence.json'),JSON.stringify(evidence,null,2));
 const approve=id=>{const a=app.store.get('approval',id);app.approvals.decide(USER,id,a.version,true);};
 const drive=()=>{app.runs.reconcile();app.runs.launchPending();app.execution.launchPending();};
 const sample=()=>{const usage=app.compute.inspect(USER).usage;assert.ok(usage.jobs<=1&&usage.cpus<=1&&usage.memoryMb<=512,`Shared reservation exceeded: ${JSON.stringify(usage)}`);evidence.samples.push({at:new Date().toISOString(),...usage});return usage;};
 async function wait(label,predicate,timeout=90000){const end=Date.now()+timeout;while(Date.now()<end){drive();sample();if(controller?.error)throw new Error(controller.error);const value=predicate();if(value)return value;await pause(200);}throw new Error(`${label}: ${JSON.stringify({run:runId&&app.store.get('run',runId).state,development:jobId&&app.store.get('sandbox-job',jobId).state,queue:app.compute.inspect(USER).items})}`);}
 function startController(){
  const index=++controllerCount,stop=join(dir,`controller-${index}.stop`),result=join(dir,`controller-${index}.json`),module=new URL('../../dist/packages/research-app.js',import.meta.url).href;
  const script=`import {ResearchApp} from ${JSON.stringify(module)};import {existsSync,writeFileSync} from 'node:fs';import {setTimeout as pause} from 'node:timers/promises';const [dir,repo,stop,result]=process.argv.slice(1),app=new ResearchApp(dir,repo);let count=0,maxCpu=0,maxJobs=0,error;try{while(!existsSync(stop)){app.runs.reconcile();app.runs.launchPending();app.execution.launchPending();const u=app.compute.inspect({type:'user'}).usage;count++;maxCpu=Math.max(maxCpu,u.cpus);maxJobs=Math.max(maxJobs,u.jobs);if(u.cpus>1||u.jobs>1||u.memoryMb>512)throw new Error('Shared admission exceeded budget');await pause(200);}}catch(e){error=e.message;process.exitCode=1;}finally{await app.compute.stop();await app.git.stop();app.close();writeFileSync(result,JSON.stringify({pid:process.pid,count,maxCpu,maxJobs,error,fixture:true}));}`;
  const child=spawn(process.execPath,['--input-type=module','-e',script,dir,repoRoot,stop,result],{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});const handle={child,stop,result,error:null,done:null};let stderr='';child.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-4000);});
  handle.done=new Promise((resolveDone,reject)=>{child.on('error',reject);child.on('exit',code=>{if(code!==0)handle.error=`Controller exited ${code}: ${stderr}`;resolveDone(code);});});return handle;
 }
 async function stopController(){if(!controller)return;writeFileSync(controller.stop,'stop');const code=await controller.done;if(code!==0){evidence.passed=false;evidence.error=controller.error;}assert.equal(code,0,controller.error);const result=JSON.parse(readFileSync(controller.result,'utf8'));assert.ok(result.count>0);assert.ok(result.maxCpu<=1&&result.maxJobs<=1);evidence.controllers.push(result);controller=undefined;}
 try{
  evidence.target=await probeDockerTarget(context);await docker(context,['image','inspect','--format','{{.Id}}',image]); // Inspect only; never pull an image.
  const config=app.compute.inspect(USER).configuration;app.compute.configure(USER,{expectedVersion:config.version,limits:{maxRuns:2,maxDevelopment:2,maxJobs:2,cpus:1,memoryMb:512,maxQueued:8}});
  const project=app.projects.create(USER,{name:'Real scheduler acceptance — computation fixture only',template:'empty'});projectId=project.id;
  const source=`import json,time,pathlib,os\nchecksum=sum(i*i for i in range(2000))\nprint('SCHEDULER FIXTURE: real computation; no scientific conclusion',flush=True)\ntime.sleep(20)\nout=pathlib.Path(os.environ['PI_OUTPUT_DIR'])\n(out/'metrics.json').write_text(json.dumps({'checksum':checksum}))\n(out/'fixture.json').write_text(json.dumps({'fixture':True,'scientificConclusion':False}))\n`;
  app.projects.writeFile(USER,project.id,'compute.py',source,null);
  const experiment=app.experiments.create(USER,project.id,{title:'CPU admission computation fixture',hypothesis:'Only verifies scheduling; not a scientific hypothesis',contract:{runner:'docker',image,dockerContext:context,command:['python','-u','compute.py'],environment:{},datasetVersion:'scheduler-fixture-v1',evaluationProtocolVersion:'scheduler-admission-v1',metrics:{checksum:{unit:'fixture integer',direction:'max'}},expectedArtifacts:['metrics.json','fixture.json'],timeoutSeconds:60,cpus:1,memoryMb:256,pids:64,workMb:32,logBytes:1024*1024,outputBytes:1024*1024,networkPolicy:'none'}});
  const intent=app.runs.prepare(USER,experiment.id);approve(intent.approvalId);const run=app.runs.submit(USER,intent.id);runId=run.id;
  const session=app.sessions.create(USER,project.id,{title:'Real development unittest fixture'});app.sources.prepare(USER,project.id,session.id,{experimentId:experiment.id,revision:1});
  writeFileSync(join(session.workspace,'test_scheduler.py'),`import unittest,pathlib,json\nclass Check(unittest.TestCase):\n def test_sum(self): self.assertEqual(sum([1,2,3]),6)\nr=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Check))\npathlib.Path('/output/fixture-test.json').write_text(json.dumps({'fixture':True,'scientificConclusion':False,'passed':r.wasSuccessful()}))\nraise SystemExit(0 if r.wasSuccessful() else 1)\n`);
  const task=app.development.prepare(USER,project.id,session.id,{command:['python','-u','test_scheduler.py'],environmentImageDigest:image,dockerContext:context,resources:{cpus:1,memoryMb:256,timeoutSeconds:60,workMb:32,outputBytes:1024*1024,logBytes:1024*1024},expectedArtifacts:['fixture-test.json']});approve(task.grantId);jobId=app.development.submit(USER,project.id,task.id).id;
  controller=startController();const running=await wait('formal run starts first',()=>{const r=app.store.get('run',runId);return r.state==='running'||terminal(r)?r:null;});assert.equal(running.state,'running',running.error);
  const pending=app.store.get('sandbox-job',jobId);assert.equal(pending.state,'queued');assert.equal(pending.startRequested,false);const held=sample();assert.equal(held.jobs,1);assert.equal(held.cpus,1);
  const containerId=running.execution.containerId,before=JSON.parse(await docker(context,['inspect',containerId]))[0];assert.equal(before.State.Running,true);assert.equal(before.HostConfig.NanoCpus,1000000000);
  evidence.checks.push({name:'shared-budget-keeps-second-job-queued',runId,jobId,usage:held,containerId});save();
  await stopController();await app.compute.stop();await app.git.stop();app.close();app=undefined;await pause(1000);
  app=new ResearchApp(dir,repoRoot);assert.equal(app.compute.inspect(USER).usage.jobs,1);assert.equal(app.compute.inspect(USER).usage.cpus,1);assert.equal(app.store.get('run',runId).execution.containerId,containerId);assert.equal(app.store.get('sandbox-job',jobId).state,'queued');controller=startController();
  const finished=await wait('formal and development jobs finish',()=>app.store.transaction(()=>{const r=app.store.get('run',runId),j=app.store.get('sandbox-job',jobId);if(!terminal(r))assert.equal(j.state,'queued','Second workload must remain queued while the formal reservation is held');return terminal(r)&&terminal(j)?{r,j}:null;}));
  assert.equal(finished.r.state,'succeeded',finished.r.error);assert.equal(finished.r.integrity,'complete');assert.equal(finished.j.state,'succeeded',finished.j.error);assert.equal(finished.j.integrity,'complete');assert.equal(finished.r.metrics.checksum,Array.from({length:2000},(_,i)=>i*i).reduce((a,b)=>a+b,0));
  assert.equal(finished.r.execution.containerId,containerId);assert.equal(finished.r.execution.generation,running.execution.generation);const after=JSON.parse(await docker(context,['inspect',containerId]))[0];assert.equal(after.State.StartedAt,before.State.StartedAt);assert.equal(after.RestartCount,0);
  for(const id of [runId,jobId]){const containers=(await docker(context,['ps','-a','--filter',`label=${JOB_LABEL}=${id}`,'--format','{{.ID}}'])).split(/\r?\n/).filter(Boolean);assert.equal(containers.length,1,`Only one real container may exist for ${id}`);}
  assert.equal(app.compute.inspect(USER).usage.jobs,0);assert.equal(app.store.list('model-usage',project.id).length,0);
  evidence.checks.push({name:'restart-retains-one-container-and-drives-next-job',run:{id:runId,state:finished.r.state,integrity:finished.r.integrity,containerId,metrics:finished.r.metrics},development:{id:jobId,state:finished.j.state,integrity:finished.j.integrity,containerId:finished.j.containerId},originalStartedAt:before.State.StartedAt,finalStartedAt:after.State.StartedAt});evidence.passed=true;
 }catch(error){evidence.error=error.message;throw error;}
 finally{
  try{await stopController();}finally{
   if(app){for(const [kind,id] of [['run',runId],['sandbox-job',jobId]])if(id){const row=app.store.get(kind,id);if(!terminal(row)){try{if(kind==='run')app.runs.cancel(USER,id);else app.development.cancel(USER,projectId,id);const container=JSON.parse(await docker(context,['inspect',kind==='run'?`pi-research-${id}`:`pi-development-${id}`]))[0];if(container.Config.Labels?.[JOB_LABEL]===id&&container.Config.Labels?.[MANIFEST_LABEL]===row.manifestDigest&&container.State.Running)await docker(context,['kill',container.Id]);}catch{/* Preserve unknown outcomes and the retained evidence directory. */}}}await app.compute.stop();await app.git.stop();app.close();}
   save();
  }
 }
});
