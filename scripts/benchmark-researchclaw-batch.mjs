import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';

const root=process.cwd();
function instanceFiles(name=''){
 assert(name===''||/^[a-z0-9-]{1,40}$/.test(name),'Invalid supervisor instance');
 const stem='supervisor'+(name?'-'+name:'');return {controlFile:path.join(root,stem+'-control.json'),stateFile:path.join(root,stem+'-state.json')};
}
const {controlFile,stateFile}=instanceFiles(process.env.RCB_SUPERVISOR_INSTANCE);
const records=JSON.parse(fs.readFileSync('prepared-tasks.json','utf8'));
const modelConfig=path.resolve('../../pi-research/.validation/experiment-dialogue/preview-data/model-connections.json');
const cpuImage='pi-research-rcb@sha256:3656195d887157a9135ba265a03dfeda4a0da1876215db56625cad39f79110db';
const gpuImage='pi-research-rcb-gpu@sha256:c7d8f2389cd9d3e58f6051d8593481b01b28359f0c8a976b7cdf3f9ac6e8663b';
const gpuDevices=['GPU-f07d86e9-eefa-0b63-a535-5df14fed0067','GPU-58dc30ef-abe7-0221-812a-eb2e6c49e2ae','GPU-17faea42-44e2-e404-ce4a-8d30b3e89fbc'];
const active=new Map(),state={pid:process.pid,startedAt:new Date().toISOString(),inference:'deepseek-flash/max',actions:[],active:[],cpuConcurrency:4,gpuConcurrency:1};
let providerFailures=0,providerPaused=false;
function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function save(){state.updatedAt=new Date().toISOString();state.active=[...active.values()].map(x=>({actionId:x.id,task:x.task,gpu:x.gpu,pid:x.pid,phase:x.phase}));const temp=stateFile+'.tmp';fs.writeFileSync(temp,JSON.stringify(state,null,2));fs.renameSync(temp,stateFile);}
function latest(task){const dir=path.join(root,'runs-max',task);if(!fs.existsSync(dir))return null;const name=fs.readdirSync(dir).filter(n=>n.startsWith('attempt-')).sort().at(-1);if(!name)return null;const attempt=path.join(dir,name);return {attempt,evaluation:readJson(path.join(attempt,'evaluation.json'))};}
function dead(pid){try{process.kill(pid,0);return false;}catch(e){return e.code==='ESRCH';}}
function settledController(controller,evaluation,startedAt){
 assert(!controller.error&&!controller.signal&&[0,1].includes(controller.code),'Controller did not close normally');
 assert(Date.parse(evaluation.endedAt)>=Date.parse(startedAt),'Controller did not persist this invocation outcome');
 assert(!evaluation.cleanupError&&!evaluation.closeError&&!evaluation.cleanupPendingJobIds?.length&&!evaluation.cleanupPendingRunIds?.length,'Compute cleanup is unsettled');
 assert(evaluation.status!=='running','Controller exited while saved state is running; reconciliation required');
}
function operatorControls(control,s,now=new Date().toISOString()){
 let changed=false,providerReset=false;
 const used=s.usedProviderResets??=[];
 if(typeof control.resumeProviderOnce==='string'&&control.resumeProviderOnce&&!used.includes(control.resumeProviderOnce)){used.push(control.resumeProviderOnce);s.lastProviderReset=control.resumeProviderOnce;delete s.providerPause;changed=providerReset=true;}
 const ack=control.acknowledgeAttention,a=s.actions.find(a=>a.status==='attention'&&a.id===ack?.actionId&&a.finishedAt===ack?.finishedAt);
 if(s.dispatchPaused&&a&&!a.acknowledgedAt&&typeof ack.resolution==='string'&&ack.resolution.trim()){
  a.acknowledgedAt=now;a.resolution=ack.resolution;changed=true;
  if(!s.actions.some(a=>a.status==='attention'&&!a.acknowledgedAt))delete s.dispatchPaused;
 }
 return {changed,providerReset};
}
function freshAllowed(previous){
 if(!previous)return;
 const e=previous.evaluation;
 assert(e.status!=='running'&&e.status!=='completed','Existing attempt needs explicit reconciliation');
 assert((e.externalInterruption||e.error?.code==='INPUT_MESSAGE_LIMIT')&&!e.jobs?.length&&!e.reviews?.length&&!e.formalRuns?.length&&!e.approvals?.length,'Existing scientific work must be resumed');
 const db=new DatabaseSync(path.join(previous.attempt,'private/data/state.db'),{readOnly:true});
 try{
  assert.equal(db.prepare("select count(*) n from events where type='tool.executed'").get().n,0);
  assert.equal(db.prepare("select count(*) n from records where kind='message' and json_extract(data,'$.role')='assistant' and json_extract(data,'$.status')='completed' and length(trim(coalesce(json_extract(data,'$.content'),'')))>0").get().n,0);
  for(const c of db.prepare('select pid,host_identity from normal_process_claims').all())assert(c.host_identity===process.platform+':'+(awaitHostname)&&Number.isSafeInteger(c.pid)&&dead(c.pid),'Old process liveness needs reconciliation');
 }finally{db.close();}
}
const awaitHostname=(await import('node:os')).hostname();
function childRun(executable,args,log,item,phase){return new Promise(resolve=>{
 const fd=fs.openSync(log,'a'),child=spawn(executable,args,{cwd:root,shell:false,windowsHide:true,stdio:['ignore',fd,fd]});
 item.pid=child.pid;item.phase=phase;save();let spawnError;
 child.once('error',e=>{spawnError=e.code;});
 child.once('close',(code,signal)=>{fs.closeSync(fd);item.pid=null;save();resolve({code,signal,error:spawnError});});
});}
async function score(record,item){
 const workspace=path.join(record.attempt,'workspace'),report=path.join(workspace,'report/report.md'),statusFile=path.join(workspace,'_score-status.json');
 if(!fs.existsSync(report)){if(!fs.existsSync(statusFile))fs.writeFileSync(statusFile,JSON.stringify({status:'not_run',reason:'No agent report',requested_reasoning_effort:'max'}));return;}
 const hash=(await import('node:crypto')).createHash('sha256').update(fs.readFileSync(report)).digest('hex');
 let old;try{old=readJson(statusFile);}catch{}
 if(old?.status==='completed'&&old.report_sha256===hash)return;
 if(old){const archive=path.join(record.attempt,'scoring-history');fs.mkdirSync(archive,{recursive:true});const stamp=new Date().toISOString().replaceAll(/[:.]/g,'-');for(const name of ['_score-status.json','_score.json']){const file=path.join(workspace,name);if(fs.existsSync(file))fs.copyFileSync(file,path.join(archive,stamp+'-'+name),fs.constants.COPYFILE_EXCL);}}
 item.judgeProcess=await childRun(path.join(root,'judge-venv/Scripts/python.exe'),['-X','utf8','score-workspace.py','--benchmark-root',path.join(root,'upstream'),'--model-config',modelConfig,'--workspace',workspace],path.join(record.attempt,'judge.log'),item,'judge');
 item.judge=readJson(statusFile);
}
async function execute(action,item){
 try{
  const task=records.find(t=>t.task_id===action.task);assert(task,'Unknown task');
  const previous=latest(action.task),core=path.join(root,'project-snapshot/scripts/benchmark-researchclaw.mjs');
  const args=[core,'--repo-root',path.join(root,'project-snapshot'),'--project-provenance',path.join(root,'project-snapshot.json'),'--benchmark-root',path.join(root,'upstream'),'--model-config',modelConfig,'--task',action.task,'--image',cpuImage,'--timeout-seconds','1800'];
  if(action.mode==='fresh'){freshAllowed(previous);args.push('--output-dir',path.join(root,'runs-max'),'--workspace',task.workspace);}
  else if(action.mode==='retry'){assert(previous&&path.resolve(action.attempt)===previous.attempt,'Attempt mismatch');assert(typeof action.messageId==='string');args.push('--resume-attempt',action.attempt,'--retry-message-id',action.messageId);}
  else if(action.mode==='dead_host'||action.mode==='resume'){assert(previous&&path.resolve(action.attempt)===previous.attempt,'Attempt mismatch');assert(Array.isArray(action.resumeArgs),'Reviewed recovery arguments required');args.push('--resume-attempt',action.attempt,...action.resumeArgs);}
  else throw Error('Unknown action mode');
  if(action.gpu)args.push('--gpu-image',gpuImage,...gpuDevices.flatMap(d=>['--gpu-device',d]));
  item.controller=await childRun(process.execPath,args,path.join(root,'supervisor-'+action.id+'.log'),item,'participant');
  const result=latest(action.task);assert(result,'Controller produced no attempt');
  settledController(item.controller,result.evaluation,item.startedAt);
  if(action.mode==='fresh')assert(!previous||result.attempt!==previous.attempt,'Controller did not create new attempt');
  else assert.equal(result.attempt,path.resolve(action.attempt),'Resumed attempt changed');
  item.attempt=result.attempt;item.status=result.evaluation.status;item.stopReason=result.evaluation.stopReason;
  assert(item.status!=='running','Controller exited while saved state is running; reconciliation required');
  if(result.evaluation.stopReason==='model_failed'&&!result.evaluation.modelUsage?.some(u=>u.stopReason!=='error'&&u.status==='reported'))providerFailures++;else if(item.status==='completed')providerFailures=0;
  if(providerFailures>=2){providerPaused=true;state.providerPause='Two consecutive provider errors; only new dispatch paused';}
  await score(result,item);item.finishedAt=new Date().toISOString();console.log(JSON.stringify({action:action.id,task:action.task,status:item.status,reason:item.stopReason,score:item.judge?.score}));
 }catch(e){item.status='attention';item.error=String(e.message).slice(0,300);item.finishedAt=new Date().toISOString();state.dispatchPaused='Action needs reconciliation: '+action.id;console.log(JSON.stringify({action:action.id,status:item.status,error:item.error}));}
 finally{active.delete(action.id);save();}
}
if(process.argv.includes('--self-check')){
 assert.equal(instanceFiles('next').stateFile,path.join(root,'supervisor-next-state.json'));assert.throws(()=>instanceFiles('../outside'));
 assert(dead(2147483647));assert.throws(()=>freshAllowed({attempt:'none',evaluation:{status:'completed'}}));assert.throws(()=>freshAllowed({attempt:'none',evaluation:{status:'running'}}));assert.throws(()=>freshAllowed({attempt:'none',evaluation:{status:'failed',externalInterruption:{},jobs:[{}]}}));
 const e={status:'failed',endedAt:'2026-10-25T10:00:01Z'};settledController({code:1},e,'2026-10-25T10:00:00Z');
 for(const c of [{code:1,error:'ENOENT'},{code:null,signal:'SIGTERM'},{code:2}])assert.throws(()=>settledController(c,e,'2026-10-25T10:00:00Z'));
 assert.throws(()=>settledController({code:1},e,'2026-10-25T10:00:02Z'));
 assert.throws(()=>settledController({code:1},{...e,cleanupPendingRunIds:['pending']},'2026-10-25T10:00:00Z'));
 const controls={actions:[{id:'a',status:'attention',finishedAt:'t1'},{id:'b',status:'attention',finishedAt:'t2'}],dispatchPaused:'b'};
 assert(operatorControls({resumeProviderOnce:'recharged-1'},controls).providerReset);
 assert(!operatorControls({resumeProviderOnce:'recharged-1'},controls).providerReset);
 assert(operatorControls({resumeProviderOnce:'recharged-2'},controls).providerReset);controls.providerPause='new failure';
 assert(!operatorControls({resumeProviderOnce:'recharged-1'},controls).providerReset);assert.equal(controls.providerPause,'new failure');
 assert(!operatorControls({acknowledgeAttention:{actionId:'a',finishedAt:'old',resolution:'checked'}},controls).changed);
 assert(operatorControls({acknowledgeAttention:{actionId:'a',finishedAt:'t1',resolution:'no effects verified'}},controls).changed);assert(controls.dispatchPaused);
 assert(operatorControls({acknowledgeAttention:{actionId:'b',finishedAt:'t2',resolution:'no live compute verified'}},controls).changed);assert(!controls.dispatchPaused);
 assert(!operatorControls({acknowledgeAttention:{actionId:'b',finishedAt:'t2',resolution:'checked'}},controls).changed);
 console.log('SUPERVISOR_SELF_CHECK_OK');process.exit(0);
}
assert(!fs.existsSync(stateFile),'Supervisor state exists; reconcile before restarting');save();
for(;;){
 let control;try{control=readJson(controlFile);assert(Array.isArray(control.actions));assert.equal(new Set(control.actions.map(a=>a.id)).size,control.actions.length);assert.equal(new Set(control.actions.filter(a=>a.ready).map(a=>a.task)).size,control.actions.filter(a=>a.ready).length);}catch(e){state.controlError=String(e.message).slice(0,200);save();await delay(3000);continue;}
 // Acknowledgement binds a reconciled failure; existing children keep their slots.
 const updates=operatorControls(control,state);if(updates.providerReset){providerPaused=false;providerFailures=0;}if(updates.changed)save();
 if(!control.pause&&!providerPaused&&!state.dispatchPaused){for(const action of control.actions){
  if(state.dispatchPaused||providerPaused)break;
  if(!action.ready||state.actions.some(a=>a.id===action.id)||[...active.values()].some(a=>a.task===action.task))continue;
  const count=[...active.values()].filter(a=>!!a.gpu===!!action.gpu).length;if(count>=(action.gpu?1:4))continue;
  const item={id:action.id,task:action.task,gpu:!!action.gpu,mode:action.mode,status:'launching',startedAt:new Date().toISOString()};state.actions.push(item);active.set(action.id,item);save();void execute(action,item);
 }}
 if(control.shutdownWhenIdle&&active.size===0&&control.actions.filter(a=>a.ready).every(a=>state.actions.some(s=>s.id===a.id))){state.endedAt=new Date().toISOString();save();console.log('SUPERVISOR_FINISHED');break;}
 await delay(3000);
}
