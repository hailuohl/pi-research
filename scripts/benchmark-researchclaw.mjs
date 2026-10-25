#!/usr/bin/env node
/** Real ResearchApp benchmark driver. Private state stays in each immutable attempt directory. */
import {appendFileSync,copyFileSync,createReadStream,existsSync,lstatSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,writeFileSync,renameSync,unlinkSync} from 'node:fs';
import {basename,dirname,isAbsolute,join,relative,resolve,sep} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {hostname} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

const MiB=1024*1024,MODEL='deepseek-flash',USER={type:'user'};
const TERMINAL=new Set(['succeeded','failed','cancelled','timed_out']);
const OUTPUT_ROOTS=new Set(['code','outputs','report']);
const GPU_UUID=/^GPU-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const IMAGE_DIGEST=/^[a-zA-Z0-9][a-zA-Z0-9._/:\-]*@sha256:[a-f0-9]{64}$/;
const RESOURCE_MAX={cpus:2,memoryMb:4096,pids:256,timeoutSeconds:600,workMb:512,outputBytes:32*MiB,logBytes:2*MiB};
const RESOURCE_DEFAULT={cpus:1,memoryMb:256,pids:64,timeoutSeconds:60,workMb:128,outputBytes:32*MiB,logBytes:2*MiB};
const deniedName=path=>/(^|[\/_.-])(target[_-]?study|checklist|rubric)([\/_.-]|$)/i.test(path);
const fail=(code)=>{throw Object.assign(new Error(code),{code});};
const requireThat=(condition,code)=>{if(!condition)fail(code);};
export const sha256=value=>createHash('sha256').update(value).digest('hex');
const errorCode=error=>/^[A-Z][A-Z0-9_]{1,99}$/.test(error?.code??'')?error.code:'HARNESS_ERROR';
const json=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n',{mode:0o600});
const under=(root,path)=>{const rel=relative(resolve(root),resolve(path));return rel===''||rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel);};

function noLinks(path){
 for(let current=resolve(path);;current=dirname(current)){
  try{requireThat(!lstatSync(current).isSymbolicLink(),'LINK_DENIED');}catch(error){if(error.code!=='ENOENT')throw error;}
  if(dirname(current)===current)break;
 }
}
function canonicalPath(path){
 requireThat(typeof path==='string'&&path.length>0&&!isAbsolute(path)&&!path.includes('\\')&&path.split('/').every(p=>p&&p!=='.'&&p!=='..'&&!/[\x00-\x1f:]/.test(p)&&!/[. ]$/.test(p)&&!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)),'OUTPUT_PATH_DENIED');
 return path;
}
async function fileHash(path){const hash=createHash('sha256');for await(const bytes of createReadStream(path))hash.update(bytes);return hash.digest('hex');}
function walk(root,prefix=''){
 noLinks(root);const result=[];
 for(const item of readdirSync(root,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  const path=prefix?prefix+'/'+item.name:item.name,physical=join(root,item.name);requireThat(!item.isSymbolicLink(),'LINK_DENIED');
  if(item.isDirectory())result.push(...walk(physical,path));else {requireThat(item.isFile(),'INPUT_NOT_FILE');result.push({path,physical,size:lstatSync(physical).size});}
 }
 return result;
}
export async function inventoryWorkspace(root){
 noLinks(root);requireThat(lstatSync(root).isDirectory(),'WORKSPACE_REQUIRED');
 for(const item of readdirSync(root,{withFileTypes:true})){
  requireThat(!item.isSymbolicLink(),'LINK_DENIED');requireThat(!deniedName(item.name),'GRADER_INPUT_DENIED');
  requireThat(['INSTRUCTIONS.md','task_info.json','_meta.json','data','related_work','code','outputs','report'].includes(item.name),'WORKSPACE_INPUT_DENIED');
  if(OUTPUT_ROOTS.has(item.name))requireThat(item.isDirectory()&&walk(join(root,item.name)).length===0,'WORKSPACE_NOT_FRESH');
 }
 const files=walk(root);for(const file of files){requireThat(!deniedName(file.path),'GRADER_INPUT_DENIED');canonicalPath(file.path);file.sha256=await fileHash(file.physical);}
 requireThat(files.some(f=>f.path==='INSTRUCTIONS.md'),'INSTRUCTIONS_MISSING');return files;
}
export function inputLimitations(files){
 const inputs=files.filter(f=>/^(data|related_work)\//.test(f.path)),result=inputs.filter(f=>f.size>32*MiB).map(f=>({code:'INPUT_OVER_32_MIB',path:f.path,size:f.size}));
 if(inputs.length>10||inputs.reduce((n,f)=>n+f.size,0)>128*MiB)result.push({code:'INPUT_BATCH_REQUIRED',files:inputs.length,maxFilesPerJob:10,maxTotalBytesPerJob:128*MiB});
 return result;
}
export function writeVerifiedOutput(root,path,bytes,expectedDigest){
 canonicalPath(path);requireThat(OUTPUT_ROOTS.has(path.split('/')[0])&&!deniedName(path),'OUTPUT_PATH_DENIED');requireThat(sha256(bytes)===expectedDigest,'DIGEST_MISMATCH');
 const destination=join(root,path);requireThat(under(root,destination),'OUTPUT_PATH_DENIED');noLinks(destination);
 if(existsSync(destination)){requireThat(lstatSync(destination).isFile()&&sha256(readFileSync(destination))===expectedDigest,'OUTPUT_EXISTS');return {path,sha256:expectedDigest,size:bytes.length};}
 mkdirSync(dirname(destination),{recursive:true,mode:0o700});noLinks(dirname(destination));writeFileSync(destination,bytes,{flag:'wx',mode:0o600});requireThat(sha256(readFileSync(destination))===expectedDigest,'DIGEST_MISMATCH');return {path,sha256:expectedDigest,size:bytes.length};
}
const stableSnapshot=value=>Array.isArray(value)?'['+value.map(stableSnapshot).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stableSnapshot(value[key])).join(',')+'}':JSON.stringify(value)??'null';
/** Trusted persisted producer row + frozen descriptor only; never point this at a mutable session. */
export function exportSnapshotSources({workspace,snapshot,producer,sourceDigest,originalInputs=[]}){
 requireThat(['development','run'].includes(producer?.kind)&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(producer.id)&&producer.state==='succeeded'&&producer.integrity==='complete'&&producer.exitCode===0,'SNAPSHOT_PRODUCER_NOT_SUCCESSFUL');
 requireThat(/^[a-f0-9]{64}$/.test(sourceDigest)&&producer.sourceDigest===sourceDigest&&Array.isArray(snapshot?.files)&&snapshot.files.length<=5000&&sha256(stableSnapshot(snapshot.files))===sourceDigest,'SNAPSHOT_MANIFEST_MISMATCH');
 requireThat(isAbsolute(snapshot.root)&&typeof snapshot.path==='string','SNAPSHOT_PATH_DENIED');const root=resolve(snapshot.root),sourcePath=isAbsolute(snapshot.path)?resolve(snapshot.path):join(root,canonicalPath(snapshot.path));
 requireThat(under(root,sourcePath)&&!under(sourcePath,workspace)&&!under(workspace,sourcePath),'SNAPSHOT_PATH_DENIED');noLinks(sourcePath);
 const originalPaths=new Set(originalInputs.map(f=>typeof f==='string'?f:f.path)),originalDigests=new Set(originalInputs.map(f=>typeof f==='object'?f.sha256??f.digest:undefined).filter(Boolean)),seen=new Set(),plan=[];let total=0;
 for(const file of snapshot.files){
  canonicalPath(file.path);requireThat(!deniedName(file.path)&&!file.path.split('/').some(p=>/^\.env(?:\.|$)|^(?:model-connections|environment-variables)\.json$/i.test(p)),'SNAPSHOT_PATH_DENIED');
  requireThat(!seen.has(file.path)&&Number.isSafeInteger(file.size)&&file.size>=0&&/^[a-f0-9]{64}$/.test(file.digest)&&[undefined,'100644','100755'].includes(file.mode),'SNAPSHOT_MANIFEST_MISMATCH');seen.add(file.path);total+=file.size;requireThat(total<=64*MiB,'SNAPSHOT_MANIFEST_MISMATCH');
  const source=join(sourcePath,file.path);noLinks(source);requireThat(existsSync(source)&&lstatSync(source).isFile()&&lstatSync(source).size===file.size,'SNAPSHOT_FILE_MISMATCH');const bytes=readFileSync(source);requireThat(sha256(bytes)===file.digest,'SNAPSHOT_FILE_MISMATCH');
  if(originalPaths.has(file.path)||originalDigests.has(file.digest)||/^(data|related_work|outputs|report)\//.test(file.path)||['INSTRUCTIONS.md','task_info.json','_meta.json'].includes(file.path))continue;
  const path=`code/${producer.kind}-${producer.id}/${file.path}`,target=join(workspace,path);noLinks(target);if(existsSync(target))requireThat(lstatSync(target).isFile()&&sha256(readFileSync(target))===file.digest,'OUTPUT_EXISTS');
  plan.push({file,path,bytes});
 }
 return plan.map(({file,path,bytes})=>({producer:{kind:producer.kind,id:producer.id,...(producer.sessionId?{sessionId:producer.sessionId}:{}),...(producer.projectId?{projectId:producer.projectId}:{})},sourceDigest,sourcePath:file.path,sourceFileDigest:file.digest,sourceFileMode:file.mode??'100644',...writeVerifiedOutput(workspace,path,bytes,file.digest)}));
}
/** Validate the external source receipt without pretending a Git-less build snapshot is a checkout. */
export async function validateProjectProvenance(repoRoot,provenanceFile){
 requireThat(provenanceFile,'PROJECT_PROVENANCE_REQUIRED');noLinks(repoRoot);noLinks(provenanceFile);requireThat(existsSync(provenanceFile)&&lstatSync(provenanceFile).isFile(),'PROJECT_PROVENANCE_REQUIRED');
 const bytes=readFileSync(provenanceFile);let manifest;try{manifest=JSON.parse(bytes.toString('utf8'));}catch{fail('PROJECT_PROVENANCE_INVALID');}
 requireThat(typeof manifest.snapshot==='string'&&isAbsolute(manifest.snapshot)&&resolve(manifest.snapshot)===resolve(repoRoot),'PROJECT_PROVENANCE_SNAPSHOT_MISMATCH');
 requireThat(/^[a-f0-9]{40}$/.test(manifest.sha??'')&&/^[a-f0-9]{64}$/.test(manifest.diffSha256??'')&&typeof manifest.branch==='string'&&manifest.branch.length>0&&Array.isArray(manifest.files)&&manifest.files.length>0&&manifest.files.length<=50000,'PROJECT_PROVENANCE_INVALID');
 const declared=new Map();for(const file of manifest.files){try{canonicalPath(file.path);}catch{fail('PROJECT_PROVENANCE_PATH_DENIED');}requireThat(!declared.has(file.path)&&/^[a-f0-9]{64}$/.test(file.sha256??'')&&Number.isSafeInteger(file.bytes??file.size)&&(file.bytes??file.size)>=0,'PROJECT_PROVENANCE_INVALID');declared.set(file.path,file);}
 const required=[];for(const prefix of ['apps','packages','skills']){const path=join(repoRoot,prefix);noLinks(path);requireThat(existsSync(path)&&lstatSync(path).isDirectory(),'PROJECT_PROVENANCE_COVERAGE_MISSING');required.push(...walk(path).map(f=>prefix+'/'+f.path));}
 required.push('package.json','package-lock.json');requireThat(required.every(path=>declared.has(path)),'PROJECT_PROVENANCE_COVERAGE_MISSING');
 for(const file of declared.values()){const path=join(repoRoot,file.path);requireThat(under(repoRoot,path),'PROJECT_PROVENANCE_PATH_DENIED');noLinks(path);requireThat(existsSync(path)&&lstatSync(path).isFile()&&lstatSync(path).size===(file.bytes??file.size),'PROJECT_PROVENANCE_FILE_MISMATCH');requireThat(await fileHash(path)===file.sha256,'PROJECT_PROVENANCE_FILE_MISMATCH');}
 return {sourceHead:manifest.sha,branch:manifest.branch,workingDiffSha256:manifest.diffSha256,provenanceSha256:sha256(bytes),verifiedFileCount:declared.size,verificationScope:'Every recorded file; complete apps/packages/skills and package/lock coverage',snapshotGitClaim:false};
}
export function evaluationStatus({report,sessionState,stopReason,gpuRequired=false,gpuCompleted=false}){
 if(stopReason==='timeout')return 'timeout';
 if(gpuRequired&&!gpuCompleted)return 'failed';
 if(!['completed','idle'].includes(stopReason)||sessionState!=='idle'||!report?.toString('utf8').trim())return 'failed';
 return 'completed';
}
export function validateInitialMessage(instructions,environment){const content=instructions+'\n\n'+environment;requireThat(content.length<=32000,'INPUT_MESSAGE_LIMIT');return content;}
export function prepareInitialMessage({instructions,environment,inputMap,putManifest}){
 requireThat(instructions.length<=32000,'INPUT_MESSAGE_LIMIT');if((instructions+'\n\n'+environment).length<=32000)return {message:validateInitialMessage(instructions,environment),environment,manifest:null};
 const mapping=JSON.stringify(inputMap),marker='Input artifact mapping:\n'+mapping,bytes=Buffer.from(mapping);requireThat(environment.includes(marker),'ADAPTER_MAPPING_MISSING');requireThat(bytes.length<=2*MiB,'ADAPTER_MANIFEST_TEXT_LIMIT');
 const preview=environment.replace(marker,'Input artifact mapping:\nAdapter manifest artifact; use artifact_read with cursor pagination.');validateInitialMessage(instructions,preview);
 const hash=sha256(bytes),artifact=putManifest(bytes,'benchmark-input-map-'+hash.slice(0,16)+'.json');requireThat(artifact?.id&&artifact.digest===hash&&artifact.size===bytes.length,'ADAPTER_MANIFEST_MISMATCH');
 const manifest={artifactId:artifact.id,sha256:hash,byteSize:bytes.length,entryCount:inputMap.length,purpose:'adapter-only original-path to immutable artifact/container-path mapping; not scientific evidence'};
 const replacement='Input artifact mapping:\n'+JSON.stringify(manifest)+'\nAll original input files remain retained without sampling. Read this UTF-8 JSON mapping with artifact_read, advancing cursor until complete, to find original path -> artifactId/containerPath. If needed for CPU computation include this adapter manifest ID in dataArtifactIds; it counts toward the unchanged 10-file and byte limits.';
 const revised=environment.replace(marker,replacement);return {message:validateInitialMessage(instructions,revised),environment:revised,manifest};
}
export function acquireAttemptLock(attempt){
 noLinks(attempt);const path=join(attempt,'harness-owner.lock'),body=JSON.stringify({pid:process.pid,hostIdentity:process.platform+':'+hostname(),token:randomUUID()});try{writeFileSync(path,body,{flag:'wx',mode:0o600});}catch(error){if(error.code==='EEXIST')fail('ATTEMPT_LOCKED');throw error;}
 return ()=>{noLinks(path);requireThat(existsSync(path)&&readFileSync(path,'utf8')===body,'ATTEMPT_LOCK_OWNER_CHANGED');unlinkSync(path);};
}
export function assertInactiveProcessClaims(claims,{hostIdentity=process.platform+':'+hostname(),isAlive=pid=>{try{process.kill(pid,0);return true;}catch(error){if(error.code==='ESRCH')return false;fail('ATTEMPT_PROCESS_UNKNOWN');}}}={}){
 for(const claim of claims){requireThat(claim.host_identity===hostIdentity&&Number.isSafeInteger(claim.pid)&&claim.pid>0,'ATTEMPT_PROCESS_UNKNOWN');requireThat(!isAlive(claim.pid),'ATTEMPT_PROCESS_ACTIVE');}
}
export function validateRetryMessage({session,message,sessionId,messageId,action}){
 requireThat(session?.id===sessionId&&session.role==='coordinator'&&!session.taskId&&!session.teamId&&['failed','idle'].includes(session.state)&&session.piSessionPath,'RESUME_SESSION_NOT_INACTIVE');
 requireThat(session.model?.provider==='deepseek'&&session.model.model===MODEL&&session.model.thinking==='max','RESUME_MODEL_MISMATCH');
 requireThat(message?.id===messageId&&message.sessionId===sessionId&&message.role==='user'&&['failed','cancelled'].includes(message.status)&&!message.workflowContinuationId&&!action?.workflowContinuationId,'RESUME_MESSAGE_NOT_RETRYABLE');
}
export function validateDeadHostRecovery({session,sessions=[],messages=[],claims=[],admissions=[],httpRequests=[],records={},options={},evaluation={},now=Date.now()},processOptions){
 requireThat(session?.role==='coordinator'&&!session.taskId&&!session.teamId&&session.state==='running'&&session.piSessionPath,'RESUME_SESSION_NOT_ORPHANED');
 requireThat(session.model?.provider==='deepseek'&&session.model.model===MODEL&&session.model.thinking==='max','RESUME_MODEL_MISMATCH');
 requireThat(!options.gpuImage&&!(options.gpuDevices??[]).length&&!evaluation.gpu&&!evaluation.executionConfiguration?.gpuImage&&!(evaluation.executionConfiguration?.gpuDevices??[]).length&&!(evaluation.formalRuns??[]).length,'RESUME_GPU_UNSUPPORTED');
 requireThat(Number.isFinite(session.leaseUntil)&&session.leaseUntil<now,'RESUME_LEASE_ACTIVE');assertInactiveProcessClaims(claims,processOptions);
 const held=admissions.filter(a=>a.state!=='released');requireThat(claims.length>0&&held.length>0,'RESUME_OWNER_UNCERTAIN');
 for(const slot of held){
  requireThat(['reserved','running','stopping'].includes(slot.state)&&slot.sessionId===session.id&&slot.generation===session.generation&&slot.role==='coordinator'&&!slot.teamId,'RESUME_OWNER_UNCERTAIN');
  requireThat(Number.isFinite(slot.leaseUntil)&&slot.leaseUntil<now,'RESUME_LEASE_ACTIVE');
  if(slot.workerPid){const claim=claims.find(c=>c.pid===slot.workerPid);requireThat(claim,'ATTEMPT_PROCESS_UNKNOWN');assertInactiveProcessClaims([claim],processOptions);}else requireThat(!slot.spawnRequested,'ATTEMPT_PROCESS_UNKNOWN');
 }
 for(const request of httpRequests.filter(r=>['active','queued','unknown'].includes(r.state))){const slot=held.find(a=>a.id===request.admissionId);requireThat(request.state!=='unknown'&&!request.ownerKind&&slot&&request.sessionId===session.id&&request.ownerHost===slot.ownerHost&&request.generation===slot.generation,'RESUME_OWNER_UNCERTAIN');}
 const otherWork='RESUME_OTHER_WORK_ACTIVE';requireThat(sessions.length===1&&sessions[0].id===session.id&&!messages.some(m=>['queued','running'].includes(m.status)&&(m.sessionId!==session.id||m.origin==='automation'||m.wakeupId||m.workflowContinuationId||m.handoffId)),otherWork);
 // Completed or stateless sources can create fresh work inside tick; this recovery supports only the original CPU coordinator.
 for(const kind of ['team','campaign','run','run-intent','change-proposal','research-continuation','workflow-continuation','research-handoff','research-brief','development-review','formal-report-review'])requireThat(!(records[kind]??[]).length,otherWork);
 for(const kind of ['development-task','sandbox-job'])requireThat((records[kind]??[]).every(r=>r.manifest?.researchRequest===undefined),otherWork);
 for(const kind of ['sandbox-job','run','git-operation','github-upload-job','document-parse-job','publication-build-job','literature-task'])requireThat((records[kind]??[]).every(r=>TERMINAL.has(r.state)||kind==='github-upload-job'&&r.state==='synced'||kind==='git-operation'&&['complete','conflict'].includes(r.state)),otherWork);
 requireThat(!(records['task-attempt']??[]).some(r=>r.state==='running'),otherWork);
 for(const wakeup of (records.wakeup??[]).filter(w=>['pending','queued','running'].includes(w.state)))requireThat(wakeup.state==='pending'&&wakeup.rootSessionId===session.id&&wakeup.sourceKind==='approval-result'&&messages.some(m=>m.sessionId===session.id&&m.status==='queued'&&m.role==='user'),otherWork);
}
export function validateNativeResume(path,workspace){
 noLinks(path);requireThat(existsSync(path)&&lstatSync(path).isFile(),'RESUME_NATIVE_SESSION_MISSING');
 try{const entries=readFileSync(path,'utf8').split(/\r?\n/).filter(line=>line.trim()).map(line=>JSON.parse(line)),header=entries[0];requireThat(header?.type==='session'&&header.version===3&&typeof header.id==='string'&&header.id.length>0&&basename(path).endsWith('_'+header.id+'.jsonl')&&typeof header.cwd==='string'&&resolve(header.cwd)===resolve(workspace)&&Number.isFinite(Date.parse(header.timestamp))&&entries.slice(1).every(e=>e&&typeof e.type==='string'&&e.type!=='session'&&typeof e.id==='string'),'RESUME_NATIVE_SESSION_INVALID');return {id:header.id,sha256:sha256(readFileSync(path))};}catch{fail('RESUME_NATIVE_SESSION_INVALID');}
}
export async function validateSavedExecutions({jobs=[],runs=[],tasks=[],intents=[],artifacts=[],paths},{inspect,formalDockerJob,verifySnapshot}){
 requireThat([...jobs,...runs].every(j=>TERMINAL.has(j.state)),'RESUME_EXECUTION_UNSETTLED');
 const read=(id,owner,origin)=>{const a=artifacts.find(a=>a.id===id);requireThat(a&&a.projectId===owner.projectId&&(origin?a.origin===origin:a.runId===owner.id),'RESUME_ARCHIVE_INVALID');const path=paths.physical(a.path);noLinks(path);requireThat(existsSync(path)&&lstatSync(path).isFile()&&lstatSync(path).size===a.size,'RESUME_ARCHIVE_INVALID');const bytes=readFileSync(path);requireThat(sha256(bytes)===a.digest,'RESUME_ARCHIVE_INVALID');return {artifact:a,bytes};};
 for(const [kind,rows]of [['development',jobs],['run',runs]])for(const item of rows){
  const dockerJob=kind==='development'?item:item.execution?.backend==='docker'?formalDockerJob(item):null;
  const container=dockerJob&&(dockerJob.startRequested||dockerJob.containerId)?await inspect(dockerJob):null;
  requireThat(!container||!container.State.Running&&!['running','restarting','paused','removing'].includes(container.State.Status),'RESUME_EXECUTION_UNSETTLED');
  if(item.state!=='succeeded')continue;
  requireThat(item.integrity==='complete'&&item.exitCode===0&&container&&container.State.Status==='exited'&&container.State.ExitCode===0&&container.Id===dockerJob.containerId&&container.Config.Labels?.['pi-research.sandbox-job']===item.id&&container.Config.Labels?.['pi-research.manifest']===item.manifestDigest,'RESUME_ARCHIVE_INVALID');
  requireThat(sha256(stableSnapshot(item.manifest))===item.manifestDigest,'RESUME_ARCHIVE_INVALID');
  const snapshot=kind==='development'?item.manifest.inputSnapshot:{path:item.manifest.snapshotPath,files:item.manifest.sourceFiles,digest:item.manifest.snapshotDigest};requireThat(snapshot.digest===sha256(stableSnapshot(snapshot.files))&&(kind!=='development'||item.sourceDigest===snapshot.digest),'RESUME_ARCHIVE_INVALID');verifySnapshot(paths.physical(snapshot.path),snapshot.files);
  requireThat(Array.isArray(item.artifactIds)&&new Set(item.artifactIds).size===item.artifactIds.length,'RESUME_ARCHIVE_INVALID');const archive=new Map(item.artifactIds.map(id=>[id,read(id,item,kind==='development'?'development:'+item.id:null)]));
  if(kind==='development'){
   const task=tasks.find(t=>t.id===item.developmentTaskId);requireThat(task&&task.sessionId===item.sessionId&&task.jobId===item.id&&task.state==='submitted'&&task.manifestDigest===item.manifestDigest&&task.sourceDigest===item.sourceDigest,'RESUME_RECEIPT_CONFLICT');
   requireThat(archive.get(item.stdoutArtifactId)?.artifact.title==='stdout.log'&&archive.get(item.stderrArtifactId)?.artifact.title==='stderr.log'&&archive.get(item.reportArtifactId)?.artifact.title==='test-report.json','RESUME_ARCHIVE_INVALID');
   let report;try{report=JSON.parse(archive.get(item.reportArtifactId).bytes);}catch{fail('RESUME_ARCHIVE_INVALID');}requireThat(report.purpose==='development-test'&&report.jobId===item.id&&report.sourceDigest===item.sourceDigest&&report.manifestDigest===item.manifestDigest&&report.exitCode===0&&report.status==='succeeded'&&report.integrity==='complete'&&report.scientificConclusion===false&&stableSnapshot(report.artifactIds)===stableSnapshot(item.artifactIds.filter(id=>id!==item.reportArtifactId))&&item.manifest.expectedArtifacts.every(path=>[...archive.values()].some(a=>a.artifact.title==='output/'+path)),'RESUME_ARCHIVE_INVALID');
  }else{
   const intent=intents.find(i=>i.id===item.intentId);requireThat(intent?.runId===item.id&&intent.manifestDigest===item.manifestDigest&&intent.manifest.snapshotDigest===snapshot.digest,'RESUME_RECEIPT_CONFLICT');const values=[...archive.values()],titles=values.map(a=>a.artifact.title);requireThat(['stdout.log','stderr.log','execution.json',...item.manifest.contract.expectedArtifacts].every(title=>titles.includes(title)),'RESUME_ARCHIVE_INVALID');
   const reports=values.filter(a=>a.artifact.title==='execution.json');requireThat(reports.length===1,'RESUME_ARCHIVE_INVALID');let report;try{report=JSON.parse(reports[0].bytes);}catch{fail('RESUME_ARCHIVE_INVALID');}requireThat(report.runId===item.id&&report.manifestDigest===item.manifestDigest&&report.sourceDigest===snapshot.digest&&report.containerId===container.Id&&report.exitCode===0&&report.state==='succeeded'&&report.integrity==='complete'&&report.scientificConclusion===false&&stableSnapshot(report.artifactIds)===stableSnapshot(item.artifactIds.filter(id=>id!==reports[0].artifact.id)),'RESUME_ARCHIVE_INVALID');
  }
 }
}
export function reconcileDeadHostFollowup({app,host},original){
 const queued=app.sessions.messages(USER,original.id).filter(m=>m.status==='queued').map(m=>m.id),running=app.sessions.messages(USER,original.id).filter(m=>m.status==='running').map(m=>m.id);
 const pendingWakeups=app.store.list('wakeup').filter(w=>w.rootSessionId===original.id&&w.state==='pending');
 app.agentAdmission.recover();app.modelHttp.recover();requireThat(app.store.list('agent-admission').every(a=>a.state==='released')&&!app.store.list('model-http-request').some(r=>['active','queued','unknown'].includes(r.state)),'RESUME_OWNER_UNCERTAIN');
 host.tick();const current=app.sessions.get(USER,original.id);requireThat(host.active.size===0&&current.state==='failed'&&current.generation===original.generation+1&&current.leaseUntil===0&&current.piSessionPath===original.piSessionPath,'RESUME_RECONCILIATION_FAILED');
 requireThat(queued.every(id=>app.store.get('message',id).status==='queued')&&running.every(id=>app.store.get('message',id).status==='failed')&&pendingWakeups.every(w=>{const current=app.store.get('wakeup',w.id);return current.state==='pending'&&current.attempts===w.attempts;}),'RESUME_QUEUE_CHANGED');
 const requests=app.store.list('model-http-request').filter(r=>r.sessionId===original.id).map(({id,state,outcome})=>({id,state,outcome}));
 const message=app.sessions.send(USER,original.id,{mode:'follow_up',content:'The original host and worker have been confirmed exited, and their expired leases were reconciled through the existing services. Inspect the saved task, actual jobs, logs and retained results. Reuse existing submitted or completed job IDs; do not rerun completed computations. Preserve all failed or rejected history and continue the original task from its retained native context.'});return {message,requests};
}
export function noticeRecoveryPlan({message,action,receipt={found:false},tasks=[],jobs=[],sourceDigest,approvals=[]}){
 if(!message.approvalNoticeId)return {kind:'retry'};
 requireThat(action?.id===message.approvalNoticeId&&action.sessionId===message.sessionId&&['development_prepare','development_submit'].includes(action.operation)&&!action.workflowContinuationId&&['approved','completed','stale'].includes(action.state),'RESUME_ACTION_UNCERTAIN');
 if(action.operation==='development_submit'){
  const conflict='RESUME_RECEIPT_CONFLICT',id=action.input?.developmentTaskId;requireThat(typeof id==='string'&&id.length>0&&Object.keys(action.input).length===1&&typeof action.projectId==='string'&&action.projectId===message.projectId,conflict);
  const matches=tasks.filter(t=>t.id===id),task=matches[0];requireThat(matches.length===1&&task.sessionId===message.sessionId&&task.projectId===action.projectId&&task.manifest?.sessionId===task.sessionId&&sha256(stableSnapshot(task.manifest))===task.manifestDigest&&Array.isArray(task.manifest.inputSnapshot?.files)&&task.manifest.inputSnapshot.digest===task.sourceDigest&&sha256(stableSnapshot(task.manifest.inputSnapshot.files))===task.sourceDigest,conflict);
  const approval=approvals.find(a=>a.id===action.approvalId),grant=approvals.find(a=>a.id===task.grantId);requireThat(approval?.status==='approved'&&approval.projectId===action.projectId&&approval.subjectKind==='session-action'&&approval.subjectId===action.id&&approval.scope==='session.action'&&approval.digest===sha256(stableSnapshot({operation:action.operation,input:action.input,policy:action.policy,source:action.source}))&&grant?.status==='approved'&&grant.projectId===action.projectId&&grant.subjectKind==='development-task'&&grant.subjectId===task.id&&grant.scope==='development.test'&&grant.digest===task.manifestDigest,conflict);
  const effects=jobs.filter(j=>j.developmentTaskId===task.id);
  if(!receipt.found){requireThat(action.state==='approved'&&task.state==='prepared'&&!task.jobId&&effects.length===0&&sourceDigest===task.sourceDigest&&Number.isFinite(Date.parse(task.manifest.deadline)),conflict);return Date.parse(task.manifest.deadline)<=Date.now()?{kind:'expired_followup',developmentTaskId:task.id,sourceDigest:task.sourceDigest}:{kind:'retry'};}
  const value=receipt.value,job=effects[0];requireThat(effects.length===1&&task.state==='submitted'&&value?.developmentTaskId===task.id&&value.id===value.jobId&&value.id===task.jobId&&value.id===job.id&&value.sessionId===task.sessionId&&job.sessionId===task.sessionId&&job.projectId===action.projectId&&[value,job].every(v=>v.manifestDigest===task.manifestDigest&&v.sourceDigest===task.sourceDigest&&v.grantId===task.grantId)&&sha256(stableSnapshot(job.manifest))===task.manifestDigest&&TERMINAL.has(job.state),conflict);return {kind:'reuse',developmentTaskId:task.id,jobId:job.id};
 }
 if(!receipt.found){
  const samePreparation=manifest=>manifest&&manifest.environmentImageDigest===action.input.environmentImageDigest&&(action.input.commandSource?manifest.commandSource===action.input.commandSource:stableSnapshot(manifest.command)===stableSnapshot(action.input.command))&&Object.entries(action.input.resources??{}).every(([k,v])=>manifest.resources?.[k]===v)&&['deadline','metricArtifact','expectedArtifacts'].every(k=>action.input[k]===undefined||stableSnapshot(manifest[k])===stableSnapshot(action.input[k]));
  requireThat(action.state!=='completed'&&!tasks.some(t=>t.originMessageId===message.id||sourceDigest&&t.sourceDigest===sourceDigest&&samePreparation(t.manifest))&&!jobs.some(j=>j.manifest?.inputSnapshot?.digest===sourceDigest&&samePreparation(j.manifest)),'RESUME_RECEIPT_CONFLICT');return {kind:action.state==='stale'||action.input.deadline&&Date.parse(action.input.deadline)<=Date.now()?'expired_followup':'retry'};
 }
 const value=receipt.value,id=value?.developmentTaskId??value?.id,task=tasks.find(t=>t.id===id);requireThat(task&&task.sessionId===message.sessionId&&task.manifestDigest===value.manifestDigest&&task.sourceDigest===value.sourceDigest,'RESUME_RECEIPT_CONFLICT');
 const matches=jobs.filter(j=>j.developmentTaskId===task.id);requireThat(matches.length<=1&&!matches.some(j=>j.sessionId!==message.sessionId||j.state==='unknown')&&(task.state!=='submitted'||matches.length===1&&task.jobId===matches[0].id),'RESUME_RECEIPT_CONFLICT');
 return {kind:'reuse',developmentTaskId:task.id,...(matches[0]?{jobId:matches[0].id}:{})};
}
const rejectionFollowup=action=>`The requested operation ${action.operation}/${action.id} remains rejected by this benchmark boundary. Continue the original task with its documented allowed operations and retained successful results, or save a final report stating actual limits. Do not repeat the rejected operation, expand permissions, or rerun completed computations.`;
export function rejectedActionRecoveryPlan({actionId,evaluation,session,action,approval,receipt,origin,project,messages=[]}){
 const code='RESUME_REJECTION_UNBOUND',last=evaluation.limitations?.at(-1),decision=evaluation.approvals?.filter(a=>a.kind==='session-action').at(-1);
 requireThat(evaluation.stopReason==='policy_blocked'&&evaluation.status==='failed'&&!evaluation.error&&!evaluation.cleanupError&&!evaluation.closeError&&last?.code==='ACTION_NOT_AUTHORIZED'&&last.actionId===actionId&&last.operation===action?.operation&&decision?.id===actionId&&decision.operation===action.operation&&decision.decision==='rejected'&&decision.inputSha256===sha256(JSON.stringify(action.input)),code);
 requireThat(session?.id===evaluation.sessionId&&session.projectId===evaluation.projectId&&session.role==='coordinator'&&!session.taskId&&!session.teamId&&['failed','idle','interrupted'].includes(session.state)&&Number.isFinite(session.leaseUntil)&&session.leaseUntil<=Date.now()&&session.piSessionPath&&action?.id===actionId&&action.sessionId===session.id&&action.projectId===session.projectId&&action.state==='rejected'&&!action.workflowContinuationId&&!action.handoffId&&action.policy?.rootSessionId===session.id&&!messages.some(m=>m.approvalNoticeId===actionId||m.role==='user'&&['queued','running'].includes(m.status)),code);
 requireThat(approval?.id===action.approvalId&&approval.projectId===action.projectId&&approval.subjectKind==='session-action'&&approval.subjectId===action.id&&approval.scope==='session.action'&&approval.status==='rejected'&&approval.digest===sha256(stableSnapshot({operation:action.operation,input:action.input,policy:action.policy,source:action.source})),code);requireThat(receipt?.found===false,'RESUME_RECEIPT_CONFLICT');
 const ref=action.requestRef;if(ref)requireThat(ref.rootSessionId===session.id&&origin?.id===ref.originMessageId&&origin.sessionId===session.id&&origin.projectId===action.projectId&&origin.role==='user'&&origin.origin!=='automation'&&!origin.wakeupId&&!origin.approvalNoticeId&&!origin.queueRemoved&&['failed','cancelled','completed'].includes(origin.status)&&ref.originDigest===sha256(stableSnapshot({content:origin.content,attachments:origin.attachments??[]}))&&stableSnapshot(ref.permission)===stableSnapshot(action.policy)&&project?.id===action.projectId&&ref.lifecycleEpoch===project.lifecycleEpoch,code);
 return {kind:'adapter_rejection_followup',actionId:action.id,operation:action.operation};
}
export function decideBenchmarkAction({app,session,action,evaluation,validateAction,progress}){
 const approval=app.store.get('approval',action.approvalId,session.projectId);let allowed=true,code;try{validateAction(action);}catch(error){allowed=false;code=errorCode(error);evaluation.limitations.push({code,actionId:action.id,operation:action.operation});}
 app.sessionPermissions.decide(USER,session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:approval.version,approved:allowed});evaluation.approvals.push({kind:'session-action',id:action.id,operation:action.operation,inputSha256:sha256(JSON.stringify(action.input)),decision:allowed?'approved':'rejected'});progress('session_action_decided',{actionId:action.id,operation:action.operation,approved:allowed});
 if(!allowed&&code==='ACTION_NOT_AUTHORIZED'){const message=app.sessions.send(USER,session.id,{mode:'follow_up',content:rejectionFollowup(action)});progress('adapter_rejection_followup_queued',{actionId:action.id,operation:action.operation,messageId:message.id});return {allowed:false,stop:false};}return {allowed,stop:!allowed};
}
export function restoreNotificationLedger(messages,ledger=[],queuedRetryMessageId){
 const sets={tasks:new Set(),jobs:new Set(),reviews:new Set(),proposals:new Set(),intents:new Set(),runs:new Set()},valid=messages.filter(m=>m.role==='user'&&(m.status==='completed'||['queued','running'].includes(m.status)&&!m.queueRemoved&&(m.mode==='follow_up'||m.id===queuedRetryMessageId)));
 const patterns={tasks:/^The existing frozen development task (\S+) is approved\./,jobs:/^Actual development job finished:\s*\{.*?"jobId":"([^"]+)"/s,reviews:/^Actual independent development review result:\s*\{.*?"reviewId":"([^"]+)"/s,proposals:/^The exact tested and independently accepted proposal (\S+) was approved and applied/,intents:/^The existing frozen formal GPU intent (\S+) is approved\./,runs:/^Actual formal GPU Run finished:\s*\{.*?"runId":"([^"]+)"/s};
 for(const row of ledger)if(sets[row.kind]&&valid.some(m=>m.id===row.messageId&&(m.status==='completed'||String(m.content??'').match(patterns[row.kind])?.[1]===row.id)))sets[row.kind].add(row.id);
 for(const message of valid)for(const [kind,pattern]of Object.entries(patterns)){const match=String(message.content??'').match(pattern);if(match)sets[kind].add(match[1]);}return sets;
}
export function recoveryWorkPlan(records,notified=restoreNotificationLedger([])){
 requireThat((records.proposals??[]).every(p=>p.state!=='applied'||p.appliedExperimentId)&&(records.intents??[]).every(i=>i.status!=='submitted'||i.runId),'RESUME_RECEIPT_CONFLICT');
 return {jobs:(records.jobs??[]).filter(j=>TERMINAL.has(j.state)&&!notified.jobs.has(j.id)),reviews:(records.reviews??[]).filter(r=>['passed','rejected','disputed','failed','stale'].includes(r.status)&&!notified.reviews.has(r.id)),proposals:(records.proposals??[]).filter(p=>['prepared','applied'].includes(p.state)).map(p=>({...p,...(p.state==='applied'?{reuseChildId:p.appliedExperimentId}:{})})),intents:(records.intents??[]).filter(i=>['prepared','submitted'].includes(i.status)).map(i=>({...i,...(i.status==='submitted'?{reuseRunId:i.runId}:{})})),actions:(records.actions??[]).filter(a=>a.state==='pending')};
}
export const reviewNeedsCancellation=task=>task.acceptance!=='accepted'&&['pending','running'].includes(task.execution);
export function updateCanonicalReport({workspace,bytes,expectedDigest,recoveryId}){
 requireThat(/^[A-Za-z0-9_-]+$/.test(recoveryId),'REPORT_VERSION_CONFLICT');const target=join(workspace,'report','report.md');noLinks(target);const old=existsSync(target)?readFileSync(target):null;requireThat((old?sha256(old):null)===expectedDigest,'REPORT_VERSION_CONFLICT');const hash=sha256(bytes);if(hash===expectedDigest)return {path:'report/report.md',sha256:hash,size:bytes.length};
 const backup=old?writeVerifiedOutput(workspace,'report/history/'+recoveryId+'/report.md',old,expectedDigest):null;requireThat((existsSync(target)?sha256(readFileSync(target)):null)===expectedDigest,'REPORT_VERSION_CONFLICT');mkdirSync(dirname(target),{recursive:true,mode:0o700});const temporary=join(dirname(target),'.report-'+randomUUID()+'.tmp');try{writeFileSync(temporary,bytes,{flag:'wx',mode:0o600});noLinks(target);requireThat((existsSync(target)?sha256(readFileSync(target)):null)===expectedDigest,'REPORT_VERSION_CONFLICT');renameSync(temporary,target);}finally{if(existsSync(temporary))unlinkSync(temporary);}return {path:'report/report.md',sha256:hash,size:bytes.length,backup};
}
export function validateResumeConfiguration({evaluation,options,versions,session,cpuImages=[]}){
 requireThat(evaluation.task_id===options.tasks[0]&&evaluation.sessionId===session.id&&evaluation.projectId===session.projectId&&evaluation.run_id,'RESUME_IDENTITY_MISMATCH');
 const old=evaluation.versions?.project,current=versions.project;requireThat(old?.runtimeManifestSha256&&old.runtimeManifestSha256===current.runtimeManifestSha256&&old.sourceProvenance&&current.sourceProvenance&&['sourceHead','branch','workingDiffSha256','provenanceSha256'].every(k=>old.sourceProvenance[k]===current.sourceProvenance[k])&&evaluation.versions.benchmark.head===versions.benchmark.head&&evaluation.versions.benchmark.runtimeManifestSha256===versions.benchmark.runtimeManifestSha256&&evaluation.versions.node===versions.node&&evaluation.versions.platform===versions.platform,'RESUME_RUNTIME_MISMATCH');
 requireThat(session.model?.provider==='deepseek'&&session.model.model===MODEL&&session.model.thinking==='max','RESUME_MODEL_MISMATCH');
 const config=evaluation.executionConfiguration,expectedCpu=config?.cpuImage??cpuImages[0];requireThat(expectedCpu&&expectedCpu===options.image&&cpuImages.every(image=>image===options.image),'RESUME_IMAGE_MISMATCH');
 const expectedGpu=config?.gpuDevices??evaluation.gpu?.requestedDevices??(evaluation.gpu?.requestedDevice?[evaluation.gpu.requestedDevice]:[]),requested=options.gpuDevices??[];
 requireThat(JSON.stringify([...expectedGpu].sort())===JSON.stringify([...requested].sort())&&(config?.gpuImage??evaluation.gpu?.image??null)===(options.gpuImage??null),'RESUME_GPU_MISMATCH');
}
export function legacyResumeCpuImage({evaluation,messages,instructions}){
 requireThat(!evaluation.gpu&&!evaluation.executionConfiguration?.gpuImage&&!(evaluation.executionConfiguration?.gpuDevices??[]).length&&!(evaluation.formalRuns??[]).length,'RESUME_IMAGE_UNBOUND');
 const prefix=instructions+'\n\n',environments=messages.filter(m=>m.role==='user'&&m.mode==='prompt'&&String(m.content).startsWith(prefix)).map(m=>m.content.slice(prefix.length)).filter(environment=>sha256(environment)===evaluation.environmentMessageSha256);requireThat(environments.length===1,'RESUME_IMAGE_UNBOUND');
 requireThat(!environments[0].includes('\nGPU formal execution is explicitly requested for this task.'),'RESUME_IMAGE_UNBOUND');const lines=environments[0].split('\n').filter(line=>line.startsWith('For actual CPU computation '));requireThat(lines.length===1,'RESUME_IMAGE_UNBOUND');
 const match=lines[0].match(/^For actual CPU computation use development_prepare, then wait for the precise existing approval and call development_submit on that same task ID\. image=([^;]+); dockerContext=desktop-linux; resources within (\{[^\r\n]*\})\. No package installation\. Commands run in \/work, copied from your private source\. Data artifact paths below are read-only; choose up to10 per job and <=128MiB total\. Do not copy or decode large inputs through chat; pass selected dataArtifactIds\.$/);requireThat(match&&IMAGE_DIGEST.test(match[1])&&match[2]===JSON.stringify(RESOURCE_MAX),'RESUME_IMAGE_UNBOUND');return match[1];
}
export function deadHostObservation(evaluation,progress,now=Date.now()){
 requireThat(evaluation.status==='running'&&evaluation.totalElapsedMs===undefined&&evaluation.endedAt===undefined,'RESUME_TIME_UNPROVEN');const lines=progress.toString('utf8').split('\n');lines.pop();let event,index;
 for(let i=0;i<lines.length;i++)try{const value=JSON.parse(lines[i]);if(typeof value.type==='string'&&Number.isFinite(Date.parse(value.at))){event=value;index=i;}}catch{}
 const at=Date.parse(event?.at),started=Date.parse(evaluation.startedAt);requireThat(Number.isFinite(started)&&Number.isFinite(at)&&started<=at&&at<=now,'RESUME_TIME_UNPROVEN');return {lastObservedAt:new Date(at).toISOString(),priorObservedElapsedMs:at-started,progressEvidence:{sha256:sha256(progress),bytes:progress.length,completeEventIndex:index,type:event.type}};
}
export function startRecoveryWindow(evaluation,{id,now=Date.now(),timeoutSeconds,observation,reason}){
 const previous=observation?.priorObservedElapsedMs??evaluation.totalElapsedMs??Math.max(0,Date.parse(evaluation.endedAt)-Date.parse(evaluation.startedAt));requireThat(Number.isFinite(previous),'RESUME_TIME_UNPROVEN');return {id,reason:reason??(observation?'dead_host_recovery':'credit_recovery'),windowStartedAt:new Date(now).toISOString(),windowSeconds:timeoutSeconds,priorElapsedMs:previous,originalStartedAt:evaluation.startedAt,...(observation?{...observation,gapObservedMs:now-Date.parse(observation.lastObservedAt),measurement:'observed wall-clock spans excluding known unobserved gaps; not active runtime or compute time'}:evaluation.elapsedMeasurement?{measurement:evaluation.elapsedMeasurement}:{})};
}
export function requireMaxThinking(model){requireThat(model?.reasoning?.levels?.some(l=>l.id==='max'&&l.parameters?.reasoning_effort==='max'),'MAX_REASONING_NOT_CONFIGURED');return 'max';}
const exactGpuSet=(actual,expected)=>Array.isArray(actual)&&Array.isArray(expected)&&expected.length>=1&&expected.length<=16&&actual.length===expected.length&&new Set(actual).size===actual.length&&new Set(expected).size===expected.length&&actual.every(id=>GPU_UUID.test(id))&&JSON.stringify([...actual].sort())===JSON.stringify([...expected].sort());
export function validateGpuInventory(target,gpuDevices){requireThat(exactGpuSet(target?.devices?.map(d=>d.uuid),gpuDevices),'GPU_INVENTORY_SCOPE_DENIED');}
export function validateGpuContract(contract,{gpuDevices,gpuImage}){
 const code='GPU_CONTRACT_SCOPE_DENIED';requireThat(contract?.runner==='docker'&&contract.dockerContext==='desktop-linux'&&contract.image===gpuImage&&contract.networkPolicy==='none'&&contract.gpu?.vendor==='nvidia'&&exactGpuSet(contract.gpu.deviceIds,gpuDevices),code);
 requireThat(contract.environment&&Object.keys(contract.environment).length===0&&Array.isArray(contract.command)&&contract.command.length>0&&contract.command.length<=30&&contract.command.every(arg=>typeof arg==='string'&&!arg.includes('\0')&&!deniedName(arg)),code);
 requireThat(Object.entries(RESOURCE_MAX).every(([key,max])=>Number.isSafeInteger(contract[key])&&contract[key]>0&&contract[key]<=max)&&(contract.threadLimit===undefined||Number.isSafeInteger(contract.threadLimit)&&contract.threadLimit>=1&&contract.threadLimit<=2),code);
 requireThat(contract.metrics&&Object.keys(contract.metrics).length>0&&Object.keys(contract.metrics).length<=32&&Object.values(contract.metrics).every(m=>typeof m.unit==='string'&&m.unit.trim()&&['min','max'].includes(m.direction)),code);
 requireThat(Array.isArray(contract.expectedArtifacts)&&contract.expectedArtifacts.includes('metrics.json')&&contract.expectedArtifacts.length<=30&&new Set(contract.expectedArtifacts).size===contract.expectedArtifacts.length,code);
 for(const path of contract.expectedArtifacts){try{canonicalPath(path);}catch{fail(code);}requireThat(!deniedName(path)&&!['stdout.log','stderr.log','execution.json'].includes(path),code);}
 requireThat(typeof contract.datasetVersion==='string'&&contract.datasetVersion.trim()&&typeof contract.evaluationProtocolVersion==='string'&&contract.evaluationProtocolVersion.trim(),code);
}
export function validateGpuSources(files,inputs){
 const code='GPU_SOURCE_SCOPE_DENIED';requireThat(Array.isArray(files)&&files.reduce((n,f)=>n+f.size,0)<=64*MiB,code);
 for(const file of files){try{canonicalPath(file.path);}catch{fail(code);}requireThat(!deniedName(file.path)&&file.size<=16*MiB,code);}
 for(const input of inputs)requireThat(files.some(f=>f.path===input.path&&f.digest===input.sha256&&f.size===input.size),code);
 const paths=new Set(inputs.map(f=>f.path));requireThat(files.every(f=>!/^(data|related_work)\//.test(f.path)||paths.has(f.path)),code);
}
export function validateReviewedProposal(proposal,{sessionId,review,proof,job,base,source}){
 const code='GPU_REVIEW_BINDING_DENIED';requireThat(proposal.flow==='reviewed-development'&&!proposal.composition&&proposal.rootSessionId===sessionId&&review.producerSessionId===sessionId&&review.status==='passed'&&review.reviewerSessionId&&review.reviewerSessionId!==sessionId,code);
 requireThat(proposal.reviewId===review.id&&proposal.reviewAcceptanceId===proof.reviewAcceptanceId&&proposal.testJobId===job.id&&job.sessionId===sessionId&&job.state==='succeeded'&&job.integrity==='complete'&&review.sourceDigest===job.sourceDigest&&proposal.candidateSnapshot.digest===job.sourceDigest&&job.manifest.inputSnapshot.digest===job.sourceDigest,code);
 requireThat(job.manifest.sourceRevisionId===source.id&&review.baseSourceRevisionId===source.id&&source.experimentId===base.id&&source.revision===base.revision&&proposal.baseExperimentId===base.id&&proposal.baseRevision===base.revision&&proposal.baseSnapshot.digest===source.sourceDigest&&proposal.contractDigest===base.contractDigest,code);
 requireThat(proposal.changes.length>0&&proposal.changes.every(c=>c.artifactId!==null&&!deniedName(c.path)&&!/^(data|related_work)\//.test(c.path)),code);
}
export function validateDevelopment(manifest,{sessionId,image,inputIds}){
 requireThat(manifest?.sessionId===sessionId&&manifest.environmentImageDigest===image&&manifest.dockerContext==='desktop-linux'&&manifest.networkPolicy==='none','DEVELOPMENT_SCOPE_DENIED');
 requireThat(Array.isArray(manifest.command)&&manifest.command.length>0&&manifest.command.every(arg=>typeof arg==='string'&&!arg.includes('\0')&&!deniedName(arg)),'DEVELOPMENT_SCOPE_DENIED');
 requireThat(Object.entries(RESOURCE_MAX).every(([key,max])=>Number.isSafeInteger(manifest.resources?.[key])&&manifest.resources[key]>0&&manifest.resources[key]<=max)&&!manifest.resources.gpu,'DEVELOPMENT_SCOPE_DENIED');
 requireThat(Array.isArray(manifest.dataArtifacts)&&manifest.dataArtifacts.length<=10&&manifest.dataArtifacts.every(a=>inputIds.has(a.id))&&manifest.dataArtifacts.reduce((n,a)=>n+(a.size??0),0)<=128*MiB,'DEVELOPMENT_SCOPE_DENIED');
 for(const file of manifest.inputSnapshot?.files??[]){requireThat(!deniedName(file.path),'DEVELOPMENT_SCOPE_DENIED');try{canonicalPath(file.path);}catch{fail('DEVELOPMENT_SCOPE_DENIED');}}
 for(const path of manifest.expectedArtifacts??[]){try{canonicalPath(path);}catch{fail('DEVELOPMENT_SCOPE_DENIED');}requireThat(!deniedName(path),'DEVELOPMENT_SCOPE_DENIED');}
}

export function parseArgs(args){
 const out={tasks:[],gpuDevices:[],timeoutSeconds:1800};
 const names={'--repo-root':'repoRoot','--benchmark-root':'benchmarkRoot','--project-provenance':'projectProvenance','--output-dir':'outputDir','--model-config':'modelConfig','--workspace':'workspace','--image':'image','--gpu-device':'gpuDevices','--gpu-image':'gpuImage','--timeout-seconds':'timeoutSeconds','--resume-attempt':'resumeAttempt','--retry-message-id':'retryMessageId','--rejected-action-id':'rejectedActionId'};
 for(let i=0;i<args.length;i++){
  const name=args[i];if(name==='--help'){out.help=true;continue;}if(name==='--dead-host-followup'){requireThat(!out.deadHostFollowup,'CLI_ARGUMENT_INVALID');out.deadHostFollowup=true;continue;}
  requireThat((name==='--task'||name in names)&&typeof args[i+1]==='string'&&!args[i+1].startsWith('--'),'CLI_ARGUMENT_INVALID');const value=args[++i];
  if(name==='--task')out.tasks.push(value);else if(name==='--gpu-device')out.gpuDevices.push(value);else {const field=names[name];requireThat(field==='timeoutSeconds'||out[field]===undefined,'CLI_ARGUMENT_INVALID');out[field]=field==='timeoutSeconds'?Number(value):value;}
 }
 if(out.help)return out;
 const resumeModes=[out.retryMessageId,out.deadHostFollowup,out.rejectedActionId].filter(Boolean).length;requireThat(out.resumeAttempt?resumeModes===1&&out.tasks.length===1:resumeModes===0,'RESUME_ARGUMENT_INVALID');
 if(out.resumeAttempt){out.resumeAttempt=resolve(out.resumeAttempt);out.outputDir??=dirname(dirname(out.resumeAttempt));out.workspace??=join(out.resumeAttempt,'workspace');}
 requireThat(['repoRoot','benchmarkRoot','outputDir','modelConfig','workspace','image'].every(k=>out[k])&&out.tasks.length>0,'CLI_ARGUMENT_REQUIRED');
 requireThat(out.tasks.every(t=>/^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(t))&&new Set(out.tasks).size===out.tasks.length,'TASK_ID_INVALID');
 requireThat(Number.isSafeInteger(out.timeoutSeconds)&&out.timeoutSeconds>=1&&out.timeoutSeconds<=86400,'TIMEOUT_INVALID');
 out.gpuDevices=[...new Set(out.gpuDevices)].sort();requireThat(IMAGE_DIGEST.test(out.image),'IMAGE_NOT_PINNED');requireThat(out.gpuDevices.length===0&&out.gpuImage===undefined||out.gpuDevices.length>=1&&out.gpuDevices.length<=16&&out.gpuDevices.every(id=>GPU_UUID.test(id))&&IMAGE_DIGEST.test(out.gpuImage??''),'GPU_OPTIONS_INVALID');
 for(const key of ['repoRoot','benchmarkRoot','outputDir','modelConfig','workspace',...(out.projectProvenance?['projectProvenance']:[])])out[key]=resolve(out[key]);
 if(out.resumeAttempt)requireThat(resolve(out.outputDir)===dirname(dirname(out.resumeAttempt))&&resolve(out.workspace)===join(out.resumeAttempt,'workspace'),'RESUME_ARGUMENT_INVALID');else requireThat(!under(out.workspace,out.outputDir)&&!under(out.outputDir,out.workspace),'OUTPUT_INPUT_OVERLAP');
 requireThat(!under(out.outputDir,out.repoRoot)&&!under(out.outputDir,out.benchmarkRoot)&&!under(out.outputDir,out.modelConfig),'OUTPUT_INPUT_OVERLAP');return out;
}
function git(root,args){const run=spawnSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,maxBuffer:64*MiB,timeout:30000});return run.status===0?run.stdout:null;}
async function provenance(root,runtime=false){
 const gitRoot=git(root,['rev-parse','--show-toplevel'])?.trim(),checkout=gitRoot&&resolve(gitRoot)===resolve(root),head=checkout?git(root,['rev-parse','HEAD'])?.trim()??null:null,status=checkout?git(root,['status','--porcelain=v1','--untracked-files=no']):null,diff=checkout?git(root,['diff','--binary','HEAD','--','apps','packages','scripts','tests','skills','examples','package.json','package-lock.json']):null;
 const files=[];if(runtime)for(const name of ['dist','skills','examples'])if(existsSync(join(root,name)))for(const file of walk(join(root,name)))files.push({path:name+'/'+file.path,size:file.size,sha256:await fileHash(file.physical)});
 for(const name of runtime?['package.json','package-lock.json']:['evaluation/run_task.py','evaluation/instructions_tmpl.py','evaluation/score.py'])if(existsSync(join(root,name)))files.push({path:name,sha256:await fileHash(join(root,name))});
 return {head,trackedDirty:status===null?null:!!status.trim(),trackedStatusSha256:status===null?null:sha256(status),trackedDiffSha256:diff===null?null:sha256(diff),runtimeManifestSha256:sha256(JSON.stringify(files)),runtimeFileCount:files.length};
}
function readVerifiedInput(file){noLinks(file.physical);const bytes=readFileSync(file.physical);requireThat(bytes.length===file.size&&sha256(bytes)===file.sha256,'INPUT_CHANGED');return bytes;}
function textBytes(bytes){try{if(bytes.includes(0))return null;return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return null;}}
function mediaType(path){const extension=path.split('.').at(-1).toLowerCase();return ({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',csv:'text/csv',json:'application/json',md:'text/markdown',txt:'text/plain'})[extension]??'application/octet-stream';}
function summarizeJob(job){return {jobId:job.id,developmentTaskId:job.developmentTaskId,state:job.state,integrity:job.integrity,exitCode:job.exitCode??null,sourceDigest:job.sourceDigest,manifestDigest:job.manifestDigest,grantId:job.grantId,containerId:job.containerId??null,generation:job.generation,recoveryCount:job.recoveryCount??0,artifactIds:job.artifactIds??[],stdoutArtifactId:job.stdoutArtifactId??null,stderrArtifactId:job.stderrArtifactId??null,reportArtifactId:job.reportArtifactId??null};}
function summarizeRun(run){return {runId:run.id,intentId:run.intentId,experimentId:run.experimentId,state:run.state,integrity:run.integrity,exitCode:run.exitCode??null,manifestDigest:run.manifestDigest,sourceDigest:run.manifest.snapshotDigest,contractDigest:run.manifest.contractDigest,containerId:run.execution?.containerId??null,generation:run.execution?.generation,gpu:run.manifest.contract.gpu,gpuTarget:run.manifest.gpuTarget,metrics:run.metrics??null,artifactIds:run.artifactIds};}
export async function inspectResumeAttempt(options,versions){
 const attempt=options.resumeAttempt;noLinks(attempt);requireThat(!existsSync(join(attempt,'stop-requested')),'STOP_REQUESTED');const raw=readFileSync(join(attempt,'evaluation.json')),evaluation=JSON.parse(raw.toString('utf8')),dataDir=join(attempt,'private','data'),workspace=join(attempt,'workspace');requireThat(evaluation.status!=='completed'&&evaluation.stopReason!=='completed','RESUME_ALREADY_COMPLETED');
 const load=path=>import(pathToFileURL(join(options.repoRoot,'dist',path)).href),[{loadDataPaths},{Store},{validateModelState},{sourceManifest}]=await Promise.all([load('packages/storage/data-paths.js'),load('packages/storage/store.js'),load('packages/pi-adapter/model-connections.js'),load('packages/workspace/files.js')]);
 noLinks(join(dataDir,'state.db'));const db=new DatabaseSync(join(dataDir,'state.db'),{readOnly:true});
 try{
  const paths=loadDataPaths(db,dataDir),table=name=>!!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name),rows=kind=>db.prepare('SELECT data FROM records WHERE kind=?').all(kind).map(r=>JSON.parse(r.data));
  requireThat(table('normal_process_claims')&&table('maintenance_gate'),'ATTEMPT_PROCESS_UNKNOWN');requireThat(!db.prepare('SELECT 1 FROM maintenance_gate').get(),'ATTEMPT_MAINTENANCE_ACTIVE');assertInactiveProcessClaims(db.prepare('SELECT pid,host_identity FROM normal_process_claims').all());
  for(const slot of rows('agent-admission').filter(a=>a.state!=='released')){if(options.rejectedActionId)requireThat(Number.isFinite(slot.leaseUntil)&&slot.leaseUntil<=Date.now(),'RESUME_LEASE_ACTIVE');if(slot.workerPid)assertInactiveProcessClaims([{pid:slot.workerPid,host_identity:process.platform+':'+hostname()}]);else requireThat(!slot.spawnRequested,'ATTEMPT_PROCESS_UNKNOWN');}
  const sessions=rows('session'),session=sessions.find(s=>s.id===evaluation.sessionId),messages=rows('message').filter(m=>m.sessionId===evaluation.sessionId),message=messages.find(m=>m.id===options.retryMessageId),action=options.rejectedActionId?rows('session-action').find(a=>a.id===options.rejectedActionId):message?.approvalNoticeId?rows('session-action').find(a=>a.id===message.approvalNoticeId):undefined;
  const recoveryRecords=()=>Object.fromEntries(['development-task','sandbox-job','run','run-intent','change-proposal','git-operation','github-upload-job','document-parse-job','publication-build-job','literature-task','team','campaign','research-continuation','workflow-continuation','research-handoff','research-brief','development-review','formal-report-review','task-attempt','wakeup'].map(kind=>[kind,rows(kind)]));
  if(options.deadHostFollowup)validateDeadHostRecovery({session,sessions,messages:rows('message'),claims:db.prepare('SELECT pid,host_identity FROM normal_process_claims').all(),admissions:rows('agent-admission'),httpRequests:rows('model-http-request'),records:recoveryRecords(),options,evaluation});
  else {requireThat(!sessions.some(s=>['queued','running'].includes(s.state))&&!messages.some(m=>m.role==='user'&&['queued','running'].includes(m.status)),'RESUME_SESSION_NOT_INACTIVE');if(options.rejectedActionId){requireThat(session?.role==='coordinator'&&!session.taskId&&!session.teamId&&['failed','idle','interrupted'].includes(session.state)&&session.piSessionPath,'RESUME_SESSION_NOT_INACTIVE');requireThat(Number.isFinite(session.leaseUntil)&&session.leaseUntil<=Date.now(),'RESUME_LEASE_ACTIVE');}else validateRetryMessage({session,message,sessionId:evaluation.sessionId,messageId:options.retryMessageId,action});}
  requireThat(!rows('host-access').some(g=>['enabled','pending'].includes(g.state)),'RESUME_HOST_ACCESS_DENIED');const jobs=rows('sandbox-job'),runs=rows('run');requireThat(jobs.every(j=>TERMINAL.has(j.state))&&runs.every(r=>TERMINAL.has(r.state)),'RESUME_EXECUTION_UNSETTLED');
  const nativeFile=paths.physical(session.piSessionPath);requireThat(under(join(dataDir,'sessions',session.id,'pi'),nativeFile),'RESUME_NATIVE_SESSION_INVALID');const native=validateNativeResume(nativeFile,paths.physical(session.workspace));
  const instructions=readFileSync(join(workspace,'INSTRUCTIONS.md'),'utf8');requireThat(sha256(Buffer.from(instructions))===evaluation.instructions.stagedSha256,'RESUME_INPUT_CHANGED');
  const tasks=rows('development-task'),cpuImages=tasks.map(t=>t.manifest.environmentImageDigest);if(!evaluation.executionConfiguration?.cpuImage&&!cpuImages.length)cpuImages.push(legacyResumeCpuImage({evaluation,messages,instructions}));validateResumeConfiguration({evaluation,options,versions,session,cpuImages});
  const select=state=>{const connection=state.connections.find(c=>c.provider==='deepseek'&&c.enabled!==false&&!c.deletedAt&&!c.controlOnly&&!c.requiresCredential),model=connection?.models?.find(m=>m.model===MODEL&&m.enabled&&!m.deletedAt&&!m.controlOnly);requireThat(connection&&model,'DEEPSEEK_FLASH_NOT_CONFIGURED');requireMaxThinking(model);return {connection,model};};
  noLinks(options.modelConfig);const current=select(validateModelState(JSON.parse(readFileSync(join(dataDir,'model-connections.json'),'utf8')))),requested=select(validateModelState(JSON.parse(readFileSync(options.modelConfig,'utf8')))),publicDigest=entry=>sha256(stableSnapshot({api:entry.connection.api,endpoint:entry.connection.baseUrl,model:entry.model}));requireThat(publicDigest(current)===publicDigest(requested)&&current.connection.apiKey===requested.connection.apiKey,'RESUME_MODEL_MISMATCH');
  if(options.deadHostFollowup||options.rejectedActionId){
   for(const file of evaluation.inputs??[])if(file.path!=='INSTRUCTIONS.md'){canonicalPath(file.path);readVerifiedInput({...file,physical:join(workspace,file.path)});}
   const artifacts=rows('artifact');for(const input of evaluation.artifactInputs??[]){if(!input.artifactId)continue;const artifact=artifacts.find(a=>a.id===input.artifactId);requireThat(artifact?.projectId===session.projectId&&artifact.digest===input.sha256&&artifact.size===input.size,'RESUME_INPUT_CHANGED');readVerifiedInput({size:input.size,sha256:input.sha256,physical:paths.physical(artifact.path)});}
  }
  const canonical=join(workspace,'report','report.md');noLinks(canonical);const reportDigest=existsSync(canonical)?sha256(readFileSync(canonical)):null;requireThat(reportDigest===null||reportDigest===evaluation.report?.sha256,'RESUME_REPORT_UNBOUND');
  if(options.deadHostFollowup){const scope={sessionId:session.id,image:options.image,inputIds:new Set([...(evaluation.artifactInputs??[]).map(i=>i.artifactId),evaluation.adapterInputManifest?.artifactId].filter(Boolean))};for(const task of tasks)validateDevelopment(task.manifest,scope);for(const job of jobs)validateDevelopment(job.manifest,scope);const [{inspect},{formalDockerJob},{verifySnapshot}]=await Promise.all([load('packages/execution/docker.js'),load('packages/runners/docker.js'),load('packages/workspace/files.js')]);await validateSavedExecutions({jobs,runs,tasks,intents:rows('run-intent'),artifacts:rows('artifact'),paths},{inspect,formalDockerJob,verifySnapshot});}
  const receipt=action?Store.prototype.agentOperationResult.call({db},session.id,'permission-action:'+action.id,{name:action.operation,input:action.input}):{found:false},plan=options.deadHostFollowup?{kind:'dead_host_followup'}:options.rejectedActionId?rejectedActionRecoveryPlan({actionId:options.rejectedActionId,evaluation,session,action,approval:rows('approval').find(a=>a.id===action?.approvalId),receipt,origin:messages.find(m=>m.id===action?.requestRef?.originMessageId),project:rows('project').find(p=>p.id===session.projectId),messages}):noticeRecoveryPlan({message,action,receipt,tasks,jobs,sourceDigest:action?sourceManifest(paths.physical(session.workspace)).digest:undefined,approvals:action?.operation==='development_submit'?rows('approval'):[]});
  let observation;if(options.deadHostFollowup){const path=join(attempt,'progress.jsonl');noLinks(path);requireThat(existsSync(path)&&lstatSync(path).isFile(),'RESUME_TIME_UNPROVEN');observation=deadHostObservation(evaluation,readFileSync(path));}
  return {evaluation,raw,session,message,action,plan,instructions,reportDigest,native,observation,modelDigest:publicDigest(current)};
 }finally{db.close();}
}

export async function runTask(options,taskId,versions){
 const resuming=!!options.resumeAttempt,taskRoot=join(options.outputDir,taskId);noLinks(taskRoot);if(!resuming)mkdirSync(taskRoot,{recursive:true,mode:0o700});
 const attempt=resuming?resolve(options.resumeAttempt):mkdtempSync(join(taskRoot,'attempt-'+new Date().toISOString().replace(/[:.]/g,'-')+'-')),workspace=join(attempt,'workspace'),privateDir=join(attempt,'private'),dataDir=join(privateDir,'data');
 if(!resuming)for(const path of [workspace,dataDir])mkdirSync(path,{recursive:true,mode:0o700});const releaseLock=acquireAttemptLock(attempt);let resumed;
 if(resuming)try{resumed=await inspectResumeAttempt(options,versions);}catch(error){releaseLock();throw error;}const runId=resuming?resumed.evaluation.run_id:taskId+'_'+basename(attempt),windowStart=Date.now();
 const gpuRequired=(options.gpuDevices?.length??0)>0;
 const evaluation=resuming?structuredClone(resumed.evaluation):{task_id:taskId,run_id:runId,status:'running',agent_name:'pi-research',model:MODEL,startedAt:new Date().toISOString(),versions,executionRoute:gpuRequired?'ResearchApp + AgentHost + CPU smoke + independent reviewer + reviewed integration + formal GPU Run':'ResearchApp + AgentHost + approved development Docker jobs; formal Run not exercised',officialScoring:{status:'not_run',reason:'Run the independent official scorer separately'},hostAccessEnabled:false,inputs:[],limitations:[],approvals:[],jobs:[],reviews:[],formalRuns:[],exports:[],sourceExports:[],continuations:0,privateState:{retained:true,relativePath:'private/data',containsCredentialsAndNativeSessions:true},runtimeConfiguration:{model:'deepseek/'+MODEL,requestedThinking:'max',configuredReasoningEffort:'max',runtimeThinkingVerified:false,providerEffortResponseVerified:false}};
 for(const key of ['reviews','formalRuns','exports','sourceExports','approvals','limitations','notifications'])evaluation[key]??=[];let recovery=null;
 if(resuming){recovery=startRecoveryWindow(evaluation,{id:(options.rejectedActionId?'rejection-':'credit-')+randomUUID(),now:windowStart,timeoutSeconds:options.timeoutSeconds,observation:resumed.observation,reason:options.rejectedActionId?'adapter_rejection_followup':undefined});const dir=join(attempt,'recovery-history',recovery.id);mkdirSync(dir,{recursive:true,mode:0o700});writeFileSync(join(dir,'evaluation.before.json'),resumed.raw,{flag:'wx',mode:0o600});Object.assign(recovery,{previousEvaluationSha256:sha256(resumed.raw),previousStatus:evaluation.status,previousStopReason:evaluation.stopReason,retryMessageId:options.retryMessageId,rejectedActionId:options.rejectedActionId,originalNativeSessionPath:resumed.session.piSessionPath,originalNativeSession:resumed.native,modelConfigurationDigest:resumed.modelDigest,adapterVersions:versions,plan:resumed.plan});(evaluation.recoveries??=[]).push(recovery);evaluation.status='running';delete evaluation.endedAt;delete evaluation.error;delete evaluation.cleanupError;delete evaluation.closeError;}
 evaluation.executionConfiguration??={cpuImage:options.image,dockerContext:'desktop-linux',gpuImage:options.gpuImage??null,gpuDevices:options.gpuDevices??[]};
 const progress=(type,fields={})=>appendFileSync(join(attempt,'progress.jsonl'),JSON.stringify({at:new Date().toISOString(),type,...fields})+'\n',{mode:0o600});
 const save=()=>{json(join(attempt,'evaluation.json'),evaluation);json(join(workspace,'_meta.json'),{task_id:taskId,run_id:runId,status:evaluation.status,agent_name:evaluation.agent_name,model:MODEL,started_at:evaluation.startedAt,finished_at:evaluation.endedAt??null,evaluation_file:'../evaluation.json',scoring_status:'not_run'});};
 let server,app,session,project,instructions,report=null,stopReason='harness_error',interrupted=false,listening=false;const signal=()=>{interrupted=true;};process.once('SIGINT',signal);process.once('SIGTERM',signal);save();progress(resuming?(options.rejectedActionId?'adapter_rejection_followup_started':'credit_recovery_started'):'attempt_started',resuming?{recoveryId:recovery.id,priorElapsedMs:recovery.priorElapsedMs,windowSeconds:recovery.windowSeconds}:{});
 try{
  const load=path=>import(pathToFileURL(join(options.repoRoot,'dist',path)).href);
  if(resuming){
   const {createHttpServer}=await load('apps/server/http.js');
   server=createHttpServer({dataDir,repoRoot:options.repoRoot,port:0});app=server.app;session=app.sessions.get(USER,evaluation.sessionId);project=app.projects.get(USER,evaluation.projectId);instructions=resumed.instructions;
   assertInactiveProcessClaims(app.store.db.prepare('SELECT pid,host_identity FROM normal_process_claims').all().filter(c=>c.pid!==process.pid||c.host_identity!==process.platform+':'+hostname()));
   requireThat(validateNativeResume(app.store.paths.physical(session.piSessionPath),app.store.paths.physical(session.workspace)).sha256===resumed.native.sha256,'RESUME_NATIVE_SESSION_CHANGED');server.host.ensureReady(session);
   if(options.deadHostFollowup){
    const kinds=['development-task','sandbox-job','run','run-intent','change-proposal','git-operation','github-upload-job','document-parse-job','publication-build-job','literature-task','team','campaign','research-continuation','workflow-continuation','research-handoff','research-brief','development-review','formal-report-review','task-attempt','wakeup'];validateDeadHostRecovery({session,sessions:app.store.list('session'),messages:app.store.list('message'),claims:app.store.db.prepare('SELECT pid,host_identity FROM normal_process_claims').all().filter(c=>c.pid!==process.pid),admissions:app.store.list('agent-admission'),httpRequests:app.store.list('model-http-request'),records:Object.fromEntries(kinds.map(k=>[k,app.store.list(k)])),options,evaluation});
    const result=reconcileDeadHostFollowup(server,session);recovery.resumeStrategy='dead_host_followup';recovery.httpReconciliation=result.requests;recovery.newMessageId=result.message.id;
   }else if(options.rejectedActionId){
    const action=app.store.get('session-action',options.rejectedActionId,project.id),receipt=app.store.agentOperationResult(session.id,'permission-action:'+action.id,{name:action.operation,input:action.input}),messages=app.sessions.messages(USER,session.id);rejectedActionRecoveryPlan({actionId:options.rejectedActionId,evaluation:resumed.evaluation,session,action,approval:app.store.get('approval',action.approvalId,project.id),receipt,origin:messages.find(m=>m.id===action.requestRef?.originMessageId),project,messages});
    const message=app.sessions.send(USER,session.id,{mode:'follow_up',content:rejectionFollowup(action)});recovery.resumeStrategy='adapter_rejection_followup';recovery.originalActionState=action.state;recovery.newMessageId=message.id;
   }else{
   validateRetryMessage({session,message:app.store.get('message',options.retryMessageId,project.id),sessionId:session.id,messageId:options.retryMessageId,action:resumed.action});
   if(resumed.action){const receipt=app.store.agentOperationResult(session.id,'permission-action:'+resumed.action.id,{name:resumed.action.operation,input:resumed.action.input});requireThat(receipt.found===(resumed.plan.kind==='reuse'),'RESUME_RECEIPT_CONFLICT');}
   recovery.resumeStrategy=resumed.plan.kind==='retry'?'exact_retry':resumed.plan.kind==='reuse'?'existing_receipt':'expired_notice_followup';recovery.originalActionState=resumed.action?.state??null;
   const message=resumed.plan.kind==='retry'?app.sessions.retry(USER,session.id,options.retryMessageId):app.sessions.send(USER,session.id,{mode:'follow_up',content:resumed.plan.kind==='reuse'?'Credit service has recovered. Reuse the already persisted exact development object '+JSON.stringify(resumed.plan)+'. Read development_inspect and its actual job state; do not prepare or rerun a submitted/successful job. Continue the original task using retained results.':'The user restored credit and authorized continuation of the original task. The old exact action '+resumed.action.id+(resumed.plan.developmentTaskId?' for retained task/source '+JSON.stringify({developmentTaskId:resumed.plan.developmentTaskId,sourceDigest:resumed.plan.sourceDigest}):'')+' is stale or its frozen deadline expired and has no receipt or matching effect. Preserve its old status/deadline. Inspect the retained source and current state, then use a new exact development_prepare and normal approval if needed. Do not repeat completed computations or treat old approval as current.'});
   recovery.newMessageId=message.id;
   }
   requireThat(app.sessions.get(USER,session.id).piSessionPath===resumed.session.piSessionPath,'RESUME_NATIVE_SESSION_CHANGED');save();progress(options.rejectedActionId?'adapter_rejection_followup_queued':'credit_retry_queued',{oldMessageId:options.retryMessageId,newMessageId:recovery.newMessageId,kind:resumed.plan.kind});
  }else{
  const sourceWorkspace=options.tasks.length===1?options.workspace:join(options.workspace,taskId),files=await inventoryWorkspace(sourceWorkspace);
  for(const file of files){const target=join(workspace,file.path);mkdirSync(dirname(target),{recursive:true,mode:0o700});copyFileSync(file.physical,target);requireThat(await fileHash(target)===file.sha256,'INPUT_CHANGED');}
  const instructionFile=files.find(f=>f.path==='INSTRUCTIONS.md'),original=readVerifiedInput(instructionFile),officialInstructions=textBytes(original);requireThat(officialInstructions!==null,'INSTRUCTIONS_ENCODING_INVALID');
  instructions=officialInstructions.replaceAll(sourceWorkspace,workspace);writeFileSync(join(workspace,'INSTRUCTIONS.md'),instructions,{mode:0o600});evaluation.instructions={originalSha256:instructionFile.sha256,stagedSha256:sha256(Buffer.from(instructions)),change:'only original workspace absolute path replaced with this attempt workspace'};
  if(!files.some(f=>f.path==='task_info.json')){const path=join(options.benchmarkRoot,'tasks',taskId,'task_info.json');noLinks(path);const bytes=readFileSync(path);requireThat(bytes.length<=2*MiB,'TASK_INFO_TOO_LARGE');writeFileSync(join(workspace,'task_info.json'),bytes,{flag:'wx',mode:0o600});files.push({path:'task_info.json',physical:path,size:bytes.length,sha256:sha256(bytes)});}
  const taskInfo=JSON.parse(readFileSync(join(workspace,'task_info.json'),'utf8'));requireThat(!Object.keys(taskInfo).some(deniedName),'GRADER_INPUT_DENIED');
  for(const name of OUTPUT_ROOTS)mkdirSync(join(workspace,name),{recursive:true,mode:0o700});
  evaluation.inputs=files.filter(f=>f.path!=='_meta.json').map(({path,size,sha256})=>({path,size,sha256}));evaluation.limitations.push(...inputLimitations(files));save();
  const importBytes=files.reduce((n,f)=>n+f.size,0);requireThat(importBytes<=64*MiB,'INPUT_DIRECTORY_LIMIT');requireThat(!evaluation.limitations.some(l=>l.code==='INPUT_OVER_32_MIB'),'INPUT_ARTIFACT_LIMIT');if(gpuRequired)requireThat(files.every(f=>f.size<=16*MiB),'GPU_INPUT_FILE_LIMIT');
  const [{createHttpServer},{validateModelState}]=await Promise.all([load('apps/server/http.js'),load('packages/pi-adapter/model-connections.js')]);
  noLinks(options.modelConfig);const modelState=validateModelState(JSON.parse(readFileSync(options.modelConfig,'utf8'))),connection=modelState.connections.find(c=>c.provider==='deepseek'&&c.enabled!==false&&!c.deletedAt&&!c.controlOnly&&!c.requiresCredential),selected=connection?.models?.find(m=>m.model===MODEL&&m.enabled&&!m.deletedAt&&!m.controlOnly);requireThat(connection&&selected,'DEEPSEEK_FLASH_NOT_CONFIGURED');
  const thinking=requireMaxThinking(selected),privateConnection={...connection,models:[selected]};json(join(dataDir,'model-connections.json'),validateModelState({schemaVersion:2,version:1,connections:[privateConnection]}));
  server=createHttpServer({dataDir,repoRoot:options.repoRoot,port:0});app=server.app;
  app.sessions.configure(USER,{provider:'deepseek',model:MODEL,thinking,expectedVersion:0});
  const input={name:'ResearchClawBench '+taskId,description:'Official task inputs; independent benchmark evaluation',sourcePath:workspace},prepared=await app.projects.prepareImport(USER,input);project=app.projects.importDirectory(USER,input,prepared);evaluation.projectImport={mode:'directory'};
  session=app.sessions.create(USER,project.id,{title:taskId+' official benchmark'});app.sessionPermissions.initialize(session.id);const permission=app.sessionPermissions.status(USER,session.id);app.sessionPermissions.set(USER,session.id,{mode:'autoEdit',expectedVersion:permission.version,expectedHostVersion:permission.hostAccess.version});
  evaluation.projectId=project.id;evaluation.sessionId=session.id;
  requireThat(walk(app.store.paths.physical(session.workspace)).length===0&&!session.sourceRevisionId,'INITIAL_WORKSPACE_NOT_EMPTY');evaluation.initialSessionWorkspaceEmpty=true;
  requireThat(!interrupted&&!existsSync(join(attempt,'stop-requested')),'STOP_REQUESTED');
  if(gpuRequired){
   const target=await app.gpus.probe(USER,{backend:'docker',context:'desktop-linux',image:options.gpuImage});validateGpuInventory(target,options.gpuDevices);
   const query=spawnSync('nvidia-smi',['--id='+options.gpuDevices.join(','),'--query-gpu=uuid,memory.used,memory.free,utilization.gpu','--format=csv,noheader,nounits'],{encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:65536}),rows=query.status===0?query.stdout.trim().split(/\r?\n/).map(line=>line.split(',').map(v=>v.trim())):[];
   evaluation.gpu={requestedDevices:options.gpuDevices,image:options.gpuImage,probe:{backend:target.backend,context:target.context,observedAt:target.observedAt,devices:target.devices},occupancy:rows.length===options.gpuDevices.length&&exactGpuSet(rows.map(p=>p[0]),options.gpuDevices)&&rows.every(p=>p.length===4&&p.slice(1).every(v=>Number.isFinite(Number(v))))?rows.map(p=>({uuid:p[0],observedAt:new Date().toISOString(),memoryUsedMiB:Number(p[1]),memoryFreeMiB:Number(p[2]),utilizationPercent:Number(p[3])})):null,actualComputation:'requires_independent_source_and_log_review',systemMemoryIsNotVramQuota:true};
  }
  const inputMap=[];
  for(const file of files.filter(f=>/^(data|related_work)\//.test(f.path))){if(file.size>32*MiB){inputMap.push({path:file.path,size:file.size,sha256:file.sha256,artifactId:null,limitation:'INPUT_OVER_32_MIB'});continue;}const artifact=app.evidence.put(project.id,file.path,readVerifiedInput(file),mediaType(file.path),'user');inputMap.push({path:file.path,size:file.size,sha256:file.sha256,artifactId:artifact.id,containerPath:'/data/'+artifact.id});}
  evaluation.artifactInputs=inputMap;
  const environment=`Harness execution environment (task instructions above remain authoritative):\nThis is the real pi-research project, with autoEdit for your private session workspace. hostAccess and network are unavailable. Read original task files with workspace_list/workspace_read source=project. Write your own code and final report/report.md with workspace_write source=session.\nFor actual CPU computation use development_prepare, then wait for the precise existing approval and call development_submit on that same task ID. image=${options.image}; dockerContext=desktop-linux; resources within ${JSON.stringify(RESOURCE_MAX)}. No package installation. Commands run in /work, copied from your private source. Data artifact paths below are read-only; choose up to10 per job and <=128MiB total. Do not copy or decode large inputs through chat; pass selected dataArtifactIds.\nDeclare expectedArtifacts relative to /output; write all desired results there (PI_OUTPUT_DIR=/output). Do not prefix expectedArtifacts with output/. A metricArtifact, if you choose one, requires the product's existing confirmed research-plan and method-contract gates. This harness never bypasses those gates.\nThe harness will notify you only of actual approvals and actual job outcomes. Read actual logs/results yourself. Successful frozen source files are exported under code/<producer-kind>-<producer-id>/ preserving their relative paths; mutable final-session edits are not presented as executed sources. Successful images are exported at the exact paths in result notices, relative to the official workspace; reference those paths from your report with correct report-relative links. You must save final report/report.md in your session workspace; a chat answer or deterministic report_create is insufficient. Keep claims proportional to the actual results. No downloads, publishing, permissions changes, source replacement, deletion or host commands are authorized.\nInput artifact mapping:\n${JSON.stringify(inputMap)}\nRecorded interface limitations:\n${JSON.stringify(evaluation.limitations)}`+(gpuRequired?`\nGPU formal execution is explicitly requested for this task. Before writing any code/files into your empty private workspace, first call experiment_plan_submit with your own scientific hypothesis and complete fixed contract: runner=docker, image=${options.gpuImage}, dockerContext=desktop-linux, gpu={vendor:nvidia,deviceIds:${JSON.stringify(options.gpuDevices)}}, networkPolicy=none, environment={}, your own argv, datasetVersion/evaluationProtocolVersion, 1-32 meaningful numeric metrics with unit and min/max direction, expectedArtifacts including metrics.json, and all resource limits within ${JSON.stringify(RESOURCE_MAX)}. Explicitly set pids/workMb/logBytes/outputBytes/timeoutSeconds/cpus/memoryMb within those bounds. Metrics must be real measured finite values; do not present an untested hypothesis as a measured result or invent a hardware witness. Then call workspace_prepare_from_revision with that exact experimentId and revision before editing; it initializes /work/data and /work/related_work from the unchanged official inputs. Do not overwrite or delete original input files.\nWrite and smoke-test your own code through CPU development_prepare using the CPU image above; do not add gpu to development resources. When the CPU smoke job succeeds completely, call development_review_prepare with its jobId. The harness approves only the exact independent reviewer team; read development_review_inspect and proceed only on status=passed. Then call reviewed_change_prepare with that reviewId/title/your scientific hypothesis, omitting baseExperimentId/expectedRevision because the private workspace is already bound to its base revision. After the harness approves and applies that exact reviewed proposal, it supplies its real child experimentId. Call run_prepare for that child and run_submit on its exact approved intentId. Do not run the untouched base experiment. Formal Run has no dataArtifactIds input: its own frozen source supplies /work/data and /work/related_work. Write outputs to /output, including genuine numeric metrics.json.\nThe exact user-authorized visible GPU UUID set is ${JSON.stringify(options.gpuDevices)}. Choose one device with sufficient free memory for computation and avoid occupied devices; visibility authorization does not require using every device. Its current observed occupancy is ${JSON.stringify(evaluation.gpu.occupancy)}; other users/processes may already occupy VRAM. memoryMb limits system RAM, not GPU memory. Use conservative GPU allocation and never terminate or alter other processes. Log the actual selected device identity and actual GPU computation your code performs; a declared GPU contract or cuda.is_available alone is not evidence of a GPU scientific computation. Read real code/logs/results and make limitations explicit. GPU-mode completion requires a successful complete reviewed formal Run as well as your report.`:'');
  app.sessions.system(session.id,'Benchmark execution uses actual project services and per-action approvals. Official scoring is independent and has not run.');
  const initial=prepareInitialMessage({instructions,environment,inputMap,putManifest:(bytes,title)=>app.evidence.put(project.id,title,bytes,'application/json','user')});evaluation.adapterInputManifest=initial.manifest;requireThat(!interrupted&&!existsSync(join(attempt,'stop-requested')),'STOP_REQUESTED');server.host.ensureReady(session);await server.listen();listening=true;app.sessions.send(USER,session.id,{content:initial.message,mode:'prompt'});evaluation.environmentMessageSha256=sha256(initial.environment);save();progress('model_task_sent',{sessionId:session.id,inputArtifacts:inputMap.filter(f=>f.artifactId).length});
  }
  const inputMap=evaluation.artifactInputs??[],inputIds=new Set(inputMap.filter(f=>f.artifactId).map(f=>f.artifactId)),authorizedDataIds=new Set(inputIds);
  if(evaluation.adapterInputManifest){const manifest=evaluation.adapterInputManifest,{artifact,bytes}=app.evidence.read(USER,manifest.artifactId);requireThat(artifact.projectId===project.id&&artifact.digest===manifest.sha256&&bytes.length===manifest.byteSize&&sha256(bytes)===sha256(Buffer.from(JSON.stringify(inputMap))),'ADAPTER_MANIFEST_MISMATCH');authorizedDataIds.add(artifact.id);}
  const scope={sessionId:session.id,image:options.image,inputIds:authorizedDataIds};
  const fixedSourceInputs=evaluation.inputs.map(f=>f.path==='INSTRUCTIONS.md'?{...f,sha256:evaluation.instructions.stagedSha256,size:Buffer.byteLength(instructions)}:f);
  const deadline=windowStart+options.timeoutSeconds*1000,notified=restoreNotificationLedger(app.sessions.messages(USER,session.id),evaluation.notifications,resuming&&resumed.plan.kind==='retry'?recovery.newMessageId:undefined),notifiedTasks=notified.tasks,notifiedJobs=notified.jobs,notifiedReviews=notified.reviews,notifiedIntents=notified.intents,notifiedRuns=notified.runs,appliedProposals=notified.proposals,confirmedBriefs=new Set(),states=new Map(),retiredNoticeAction=resumed?.plan.kind==='expired_followup'?resumed.action.id:null;let idleSince=0,lastHeartbeat=0;
  const continuationsAtStart=evaluation.continuations??0;const send=content=>app.sessions.send(USER,session.id,{content,mode:'follow_up'});
  const notify=(kind,id,content)=>{if(notified[kind].has(id))return;const message=send(content);notified[kind].add(id);evaluation.notifications.push({kind,id,messageId:message.id,createdAt:new Date().toISOString()});save();};
  const gpuBase=id=>{requireThat(gpuRequired,'GPU_NOT_REQUESTED');const experiment=app.store.get('experiment',id,project.id);validateGpuContract(experiment.contract,options);return experiment;};
  const validateTestJob=id=>{
   const job=app.store.get('sandbox-job',id,project.id);requireThat(job.sessionId===session.id,'DEVELOPMENT_SCOPE_DENIED');validateDevelopment(job.manifest,scope);
   if(gpuRequired){validateGpuSources(job.manifest.inputSnapshot.files,fixedSourceInputs);requireThat(job.manifest.sourceRevisionId,'GPU_BASE_SOURCE_REQUIRED');const source=app.store.get('source-revision',job.manifest.sourceRevisionId,project.id);gpuBase(source.experimentId);}
   return job;
  };
  const passedReview=id=>{
   requireThat(gpuRequired,'GPU_NOT_REQUESTED');const review=app.developmentReviews.inspect(USER,project.id,id);requireThat(review.producerSessionId===session.id&&review.status==='passed'&&review.reviewerSessionId&&review.reviewerSessionId!==session.id,'GPU_REVIEW_BINDING_DENIED');
   const reviewer=app.sessions.get(USER,review.reviewerSessionId);requireThat(reviewer.model.provider==='deepseek'&&reviewer.model.model===MODEL&&reviewer.model.thinking==='max','REVIEWER_MODEL_SCOPE_DENIED');
   const job=validateTestJob(review.jobId),proof=app.developmentReviews.assertPassed(USER,project.id,id,job.sourceDigest),source=app.store.get('source-revision',job.manifest.sourceRevisionId,project.id),base=gpuBase(source.experimentId);return {sessionId:session.id,review,proof,job,source,base};
  };
  const reviewedProposal=id=>{
   const proposal=app.store.get('change-proposal',id,project.id),proof=passedReview(proposal.reviewId);validateReviewedProposal(proposal,proof);validateGpuSources(proposal.candidateSnapshot.files,fixedSourceInputs);return proposal;
  };
  const formalExperiment=id=>{
   const experiment=gpuBase(id);requireThat(experiment.changeProposalId,'GPU_REVIEW_REQUIRED');const proposal=reviewedProposal(experiment.changeProposalId);
   requireThat(proposal.state==='applied'&&proposal.appliedExperimentId===experiment.id&&proposal.baseExperimentId===experiment.parentId&&proposal.contractDigest===experiment.contractDigest,'GPU_REVIEW_BINDING_DENIED');return {experiment,proposal};
  };
  const validateIntent=id=>{
   const intent=app.store.get('run-intent',id,project.id);requireThat(intent.rootSessionId===session.id,'GPU_RUN_SCOPE_DENIED');const {experiment,proposal}=formalExperiment(intent.experimentId),manifest=intent.manifest;
   validateGpuContract(manifest.contract,options);validateGpuSources(manifest.sourceFiles,fixedSourceInputs);validateGpuInventory(manifest.gpuTarget,options.gpuDevices);requireThat(manifest.experimentId===experiment.id&&manifest.contractDigest===experiment.contractDigest&&manifest.snapshotDigest===proposal.candidateSnapshot.digest,'GPU_RUN_SCOPE_DENIED');return intent;
  };
  const ownedRuns=()=>app.store.list('run',project.id).filter(r=>app.store.get('run-intent',r.intentId,project.id).rootSessionId===session.id);
  const validateTask=id=>{const task=app.store.get('development-task',id,project.id);requireThat(task.sessionId===session.id,'DEVELOPMENT_SCOPE_DENIED');validateDevelopment(task.manifest,scope);if(gpuRequired){validateGpuSources(task.manifest.inputSnapshot.files,fixedSourceInputs);requireThat(task.manifest.sourceRevisionId,'GPU_BASE_SOURCE_REQUIRED');gpuBase(app.store.get('source-revision',task.manifest.sourceRevisionId,project.id).experimentId);}return task;};
  const validateAction=action=>{
   requireThat(action.sessionId===session.id&&action.projectId===project.id,'ACTION_SCOPE_DENIED');const input=action.input;
   if(action.operation==='workspace_write'){requireThat(input.source!=='project'&&!deniedName(input.path),'ACTION_SCOPE_DENIED');canonicalPath(input.path);return;}
   if(['research_brief_save','artifact_create'].includes(action.operation))return;
   if(action.operation==='development_prepare'){
    const resolved=app.development.resolvePreparationInput(USER,project.id,session.id,input).input;
    validateDevelopment({...resolved,sessionId:session.id,networkPolicy:'none',resources:{...RESOURCE_DEFAULT,...resolved.resources},dataArtifacts:(resolved.dataArtifactIds??[]).map(id=>({id,size:app.store.get('artifact',id,project.id).size})),inputSnapshot:{files:walk(app.store.paths.physical(app.sessions.get(USER,session.id).workspace)).map(({path})=>({path}))}},scope);return;
   }
   if(action.operation==='development_submit'){const task=validateTask(input.developmentTaskId);requireThat(app.store.get('approval',task.grantId,project.id).status==='approved','DEVELOPMENT_SCOPE_DENIED');return;}
   if(gpuRequired&&action.operation==='experiment_plan_submit'){
    requireThat(!input.parentId&&!input.repair&&walk(app.store.paths.physical(app.sessions.get(USER,session.id).workspace)).length===0&&!app.sessions.get(USER,session.id).sourceRevisionId,'GPU_INITIAL_BASE_REQUIRED');
    requireThat(app.store.list('experiment',project.id).length===0,'GPU_INITIAL_BASE_REQUIRED');const resolved=app.experiments.resolvePreparationInput(USER,project.id,session.id,input).input;validateGpuContract(app.experiments.preflightContract(USER,project.id,resolved),options);return;
   }
   if((gpuRequired||resuming)&&action.operation==='development_review_prepare'){const job=validateTestJob(input.jobId);requireThat(job.state==='succeeded'&&job.integrity==='complete','GPU_REVIEW_BINDING_DENIED');return;}
   if(gpuRequired&&action.operation==='reviewed_change_prepare'){requireThat(input.baseExperimentId===undefined&&input.expectedRevision===undefined,'GPU_REVIEW_BINDING_DENIED');passedReview(input.reviewId);return;}
   if(gpuRequired&&action.operation==='run_prepare'){requireThat(input.autoAnalyze!==true,'GPU_RUN_SCOPE_DENIED');formalExperiment(input.experimentId);return;}
   if(gpuRequired&&action.operation==='run_submit'){const intent=validateIntent(input.intentId);requireThat(app.store.get('approval',intent.approvalId,project.id).status==='approved','GPU_RUN_SCOPE_DENIED');return;}
   if(['document_page_image_read','session_attachment_read'].includes(action.operation))return;
   fail('ACTION_NOT_AUTHORIZED');
  };
  while(true){
   if(interrupted||existsSync(join(attempt,'stop-requested'))){stopReason='interrupted';break;}if(Date.now()>=deadline){stopReason='timeout';break;}
   const actualNotices=restoreNotificationLedger(app.sessions.messages(USER,session.id),evaluation.notifications,resuming&&resumed.plan.kind==='retry'?recovery.newMessageId:undefined);for(const kind of Object.keys(notified)){notified[kind].clear();for(const id of actualNotices[kind])notified[kind].add(id);}
   const current=app.sessions.get(USER,session.id);if(current.state==='failed'){stopReason='model_failed';progress('model_failed',{sessionId:session.id});break;}
   requireThat(!app.hostAccess.status(USER,session.id).enabled,'HOST_ACCESS_NOT_AUTHORIZED');
   if(current.researchBriefId){const brief=app.store.get('research-brief',current.researchBriefId,project.id);if(brief.status==='ready'&&!confirmedBriefs.has(brief.id)){requireThat(brief.rootSessionId===session.id,'BRIEF_SCOPE_DENIED');app.researchBriefs.confirm(USER,project.id,session.id,{briefId:brief.id,expectedVersion:brief.version});confirmedBriefs.add(brief.id);evaluation.approvals.push({kind:'research-brief',id:brief.id,digest:brief.digest,decision:'confirmed'});progress('brief_confirmed',{briefId:brief.id});}}
   for(const task of app.store.list('development-task',project.id).filter(t=>t.sessionId===session.id&&t.state==='prepared'&&Date.parse(t.manifest.deadline)>Date.now())){
    validateTask(task.id);const approval=app.store.get('approval',task.grantId,project.id);
    if(approval.status==='pending'){requireThat(approval.subjectKind==='development-task'&&approval.subjectId===task.id&&approval.digest===task.manifestDigest&&approval.scope==='development.test','DEVELOPMENT_SCOPE_DENIED');app.approvals.decide(USER,approval.id,approval.version,true);evaluation.approvals.push({kind:'development-grant',id:approval.id,developmentTaskId:task.id,manifestDigest:task.manifestDigest,decision:'approved'});progress('development_approved',{developmentTaskId:task.id,approvalId:approval.id});}
    if(app.store.get('approval',task.grantId,project.id).status==='approved'&&!notifiedTasks.has(task.id)){notify('tasks',task.id,`The existing frozen development task ${task.id} is approved. Read development_inspect with this developmentTaskId; if canSubmit=true, call development_submit with exactly {developmentTaskId:${JSON.stringify(task.id)}}. If already submitted reuse its jobId; do not prepare another task for this approval.`);}
   }
   if(gpuRequired||resuming){
    for(const raw of app.store.list('development-review',project.id).filter(r=>r.producerSessionId===session.id)){
     validateTestJob(raw.jobId);const team=app.teams.get(USER,raw.teamId),approval=app.store.get('approval',raw.approvalId,project.id),tasks=app.teams.tasks(USER,raw.teamId),plan=app.store.list('team-plan',project.id).find(p=>p.teamId===raw.teamId);
     requireThat(team.rootSessionId===session.id&&team.approvalId===approval.id&&approval.subjectKind==='team'&&approval.subjectId===team.id&&approval.scope==='collaboration'&&approval.digest===team.planDigest&&tasks.length===1&&tasks[0].id===raw.taskId&&tasks[0].role==='reviewer'&&tasks[0].reviewId===raw.id&&plan?.model?.provider==='deepseek'&&plan.model.model===MODEL&&plan.model.thinking==='max','GPU_REVIEW_BINDING_DENIED');
     if(approval.status==='pending'){app.approvals.decide(USER,approval.id,approval.version,true);evaluation.approvals.push({kind:'independent-review',id:approval.id,reviewId:raw.id,teamId:team.id,planDigest:team.planDigest,decision:'approved'});progress('review_approved',{reviewId:raw.id,teamId:team.id});}
     if(team.state==='awaiting_approval'&&app.store.get('approval',approval.id,project.id).status==='approved')app.teams.activate(USER,team.id);
     const review=app.developmentReviews.inspect(USER,project.id,raw.id);if(review.reviewerSessionId){const reviewer=app.sessions.get(USER,review.reviewerSessionId);requireThat(reviewer.id!==session.id&&reviewer.model.provider==='deepseek'&&reviewer.model.model===MODEL&&reviewer.model.thinking==='max','REVIEWER_MODEL_SCOPE_DENIED');}
     if(['passed','rejected','disputed','failed','stale'].includes(review.status)&&!notifiedReviews.has(raw.id)){notify('reviews',raw.id,`Actual independent development review result: ${JSON.stringify({reviewId:raw.id,status:review.status,sourceDigest:review.sourceDigest,jobId:review.jobId,reviewerSessionId:review.reviewerSessionId,verdict:review.verdict})}. Read development_review_inspect yourself. Only status=passed permits reviewed_change_prepare on this exact review. Rejected/disputed/failed results are not acceptance and must remain in the history.`);progress('review_finished',{reviewId:raw.id,status:review.status});}
    }
    evaluation.reviews=app.store.list('development-review',project.id).filter(r=>r.producerSessionId===session.id).map(r=>{const view=app.developmentReviews.inspect(USER,project.id,r.id);return {reviewId:r.id,jobId:r.jobId,sourceDigest:r.sourceDigest,teamId:r.teamId,taskId:r.taskId,status:view.status,reviewerSessionId:view.reviewerSessionId??null,reviewerThinking:view.reviewerSessionId?app.sessions.get(USER,view.reviewerSessionId).model.thinking:null};});
   }
   if(gpuRequired){
    for(const raw of recoveryWorkPlan({proposals:app.store.list('change-proposal',project.id).filter(p=>p.rootSessionId===session.id)},notified).proposals){
     const proposal=reviewedProposal(raw.id),approval=app.store.get('approval',proposal.approvalId,project.id);requireThat(approval.subjectKind==='change-proposal'&&approval.subjectId===proposal.id&&approval.scope==='change.integrate'&&approval.digest===proposal.digest,'GPU_REVIEW_BINDING_DENIED');
     if(approval.status==='pending')app.approvals.decide(USER,approval.id,approval.version,true);requireThat(app.store.get('approval',approval.id,project.id).status==='approved','GPU_REVIEW_BINDING_DENIED');
     const child=raw.reuseChildId?app.experiments.get(USER,raw.reuseChildId):app.changes.apply(USER,proposal.id);requireThat(child.contractDigest===proposal.contractDigest,'GPU_REVIEW_BINDING_DENIED');if(!appliedProposals.has(proposal.id)){if(!raw.reuseChildId)evaluation.approvals.push({kind:'reviewed-integration',id:approval.id,proposalId:proposal.id,reviewId:proposal.reviewId,sourceDigest:proposal.candidateSnapshot.digest,childExperimentId:child.id,decision:'applied'});notify('proposals',proposal.id,`The exact tested and independently accepted proposal ${proposal.id} was approved and applied through the existing ChangeProposal service. Its actual child experimentId is ${child.id}; sourceDigest=${proposal.candidateSnapshot.digest}. Read project_inspect/experiment_source_list, then run_prepare for this child. Formal execution still requires its separate exact intent approval.`);progress('reviewed_change_applied',{proposalId:proposal.id,experimentId:child.id});}
    }
    for(const raw of recoveryWorkPlan({intents:app.store.list('run-intent',project.id).filter(i=>i.rootSessionId===session.id)},notified).intents){
     const intent=validateIntent(raw.id),approval=app.store.get('approval',intent.approvalId,project.id);requireThat(approval.subjectKind==='run-intent'&&approval.subjectId===intent.id&&approval.scope==='run.submit'&&approval.digest===intent.manifestDigest,'GPU_RUN_SCOPE_DENIED');
     if(approval.status==='pending'){app.approvals.decide(USER,approval.id,approval.version,true);evaluation.approvals.push({kind:'formal-run-intent',id:approval.id,intentId:intent.id,manifestDigest:intent.manifestDigest,gpuDevices:options.gpuDevices,decision:'approved'});progress('formal_run_approved',{intentId:intent.id});}
     if(app.store.get('approval',approval.id,project.id).status==='approved'&&!notifiedIntents.has(intent.id)){notify('intents',intent.id,`The existing frozen formal GPU intent ${intent.id} is approved. Read project_inspect/run intent status; submit exactly this intentId with run_submit. If already submitted, reuse its runId. Do not run_prepare again for this approval.`);}
    }
   }
   app.sessionPermissions.status(USER,session.id);
   for(const action of app.store.list('session-action',project.id).filter(a=>a.sessionId===session.id&&a.state==='pending')){
    if(decideBenchmarkAction({app,session,action,evaluation,validateAction,progress}).stop){stopReason='policy_blocked';break;}
   }
   if(stopReason==='policy_blocked')break;
   const jobs=app.store.list('sandbox-job',project.id).filter(j=>j.sessionId===session.id);
   for(const job of jobs){
    validateDevelopment(job.manifest,scope);if(states.get(job.id)!==job.state){states.set(job.id,job.state);progress('sandbox_state',{jobId:job.id,state:job.state,integrity:job.integrity});}
    if(job.state==='unknown'){stopReason='execution_unknown';break;}
    if(TERMINAL.has(job.state)&&(!notifiedJobs.has(job.id)||resuming&&!listening)){
     const exports=[];
     if(job.state==='succeeded'&&job.integrity==='complete')evaluation.sourceExports.push(...exportSnapshotSources({workspace,snapshot:{root:dataDir,path:app.store.paths.physical(job.manifest.inputSnapshot.path),files:job.manifest.inputSnapshot.files},producer:{kind:'development',id:job.id,projectId:project.id,sessionId:session.id,state:job.state,integrity:job.integrity,exitCode:job.exitCode,sourceDigest:job.sourceDigest},sourceDigest:job.sourceDigest,originalInputs:evaluation.inputs}).filter(record=>!evaluation.sourceExports.some(old=>old.path===record.path)));
     if(job.state==='succeeded'&&job.integrity==='complete')for(const id of job.artifactIds??[]){const {artifact,bytes}=app.evidence.read(USER,id);if(!artifact.title.startsWith('output/'))continue;const originalPath=artifact.title.slice(7);canonicalPath(originalPath);const path=/\.png$/i.test(originalPath)?`report/images/${job.id}/${originalPath.replace(/^report\/images\//,'')}`:`${originalPath.startsWith('code/')?'code':'outputs'}/${job.id}/${originalPath}`;const record={jobId:job.id,artifactId:id,originalPath,...writeVerifiedOutput(workspace,path,bytes,artifact.digest)};exports.push(record);if(!evaluation.exports.some(old=>old.path===record.path))evaluation.exports.push(record);}
     notify('jobs',job.id,`Actual development job finished: ${JSON.stringify(summarizeJob(job))}. Read its real development_inspect/development_logs and artifact_read results yourself. Exported artifact paths relative to the official workspace: ${JSON.stringify(exports.map(({artifactId,path,sha256})=>({artifactId,path,sha256})))}. The report must describe actual outcomes and limitations; failed jobs are retained. Save your own final report/report.md in your session workspace.`);
    }
   }
   if(stopReason==='execution_unknown')break;
   evaluation.jobs=jobs.map(summarizeJob);
   const runs=gpuRequired?ownedRuns():[];
   for(const run of runs){
    const intent=validateIntent(run.intentId);requireThat(run.manifestDigest===intent.manifestDigest&&run.manifest.snapshotDigest===intent.manifest.snapshotDigest,'GPU_RUN_SCOPE_DENIED');
    if(states.get(run.id)!==run.state){states.set(run.id,run.state);progress('formal_run_state',{runId:run.id,state:run.state,integrity:run.integrity});}
    if(run.state==='unknown'){stopReason='execution_unknown';break;}
    if(TERMINAL.has(run.state)&&(!notifiedRuns.has(run.id)||resuming&&!listening)){
     const exports=[],logEvidence=[];
     if(run.state==='succeeded'&&run.integrity==='complete')evaluation.sourceExports.push(...exportSnapshotSources({workspace,snapshot:{root:dataDir,path:app.store.paths.physical(run.manifest.snapshotPath),files:run.manifest.sourceFiles},producer:{kind:'run',id:run.id,projectId:project.id,sessionId:session.id,state:run.state,integrity:run.integrity,exitCode:run.exitCode,sourceDigest:run.manifest.snapshotDigest},sourceDigest:run.manifest.snapshotDigest,originalInputs:evaluation.inputs}).filter(record=>!evaluation.sourceExports.some(old=>old.path===record.path)));
     for(const id of run.artifactIds??[]){const {artifact,bytes}=app.evidence.read(USER,id);requireThat(artifact.runId===run.id,'GPU_RUN_SCOPE_DENIED');
      if(['stdout.log','stderr.log','execution.json'].includes(artifact.title)){const text=textBytes(bytes);logEvidence.push({artifactId:id,title:artifact.title,sha256:artifact.digest,size:artifact.size,mentionsCuda:/cuda|GPU-|nvidia|GPU:/i.test(text??''),mentionedRequestedUuids:options.gpuDevices.filter(uuid=>(text??'').includes(uuid))});}
      if(run.state!=='succeeded'||run.integrity!=='complete'||!run.manifest.contract.expectedArtifacts.includes(artifact.title))continue;
      const originalPath=canonicalPath(artifact.title),path=/\.png$/i.test(originalPath)?`report/images/${run.id}/${originalPath.replace(/^report\/images\//,'')}`:`${originalPath.startsWith('code/')?'code':'outputs'}/${run.id}/${originalPath}`;
      const record={runId:run.id,artifactId:id,originalPath,...writeVerifiedOutput(workspace,path,bytes,artifact.digest)};exports.push(record);if(!evaluation.exports.some(old=>old.path===record.path))evaluation.exports.push(record);
     }
     const sourceEvidence=[];for(const file of run.manifest.sourceFiles.filter(f=>/\.(py|ipynb|sh)$/i.test(f.path)&&f.size<=2*MiB)){const path=join(app.store.paths.physical(run.manifest.snapshotPath),file.path);noLinks(path);const bytes=readFileSync(path);requireThat(sha256(bytes)===file.digest,'DIGEST_MISMATCH');sourceEvidence.push({path:file.path,sha256:file.digest,size:file.size,mentionsCuda:/cuda|GPU:|cupy|\.gpu\(/i.test(textBytes(bytes)??'')});}
     (evaluation.gpu.sourceLogEvidence??=[]).push({runId:run.id,sourceSnapshotDigest:run.manifest.snapshotDigest,sourceFiles:sourceEvidence,logs:logEvidence,assessment:'not_automatically_verified; independent review of actual computation required'});
     notify('runs',run.id,`Actual formal GPU Run finished: ${JSON.stringify(summarizeRun(run))}. Read run_inspect/run_logs and the exact archived artifacts yourself. Its GPU declaration alone does not prove GPU computation or scientific success. Exported paths relative to the official workspace: ${JSON.stringify(exports.map(({artifactId,path,sha256})=>({artifactId,path,sha256})))}. Read the actual sources and device/computation logs, state limits honestly, and save your final report/report.md in your session workspace.`);
    }
   }
   if(stopReason==='execution_unknown')break;evaluation.formalRuns=runs.map(summarizeRun);evaluation.gpuCompleted=gpuRequired&&runs.some(r=>r.state==='succeeded'&&r.integrity==='complete');
   if(!listening){save();await server.listen();listening=true;progress(options.rejectedActionId?'adapter_rejection_followup_listening':'credit_recovery_listening',{recoveryId:recovery.id});}
   const latest=app.sessions.get(USER,session.id),queued=app.sessions.messages(USER,session.id).some(m=>m.role==='user'&&['queued','running'].includes(m.status)),pendingAction=app.store.list('session-action',project.id).some(a=>a.sessionId===session.id&&a.id!==retiredNoticeAction&&['pending','approved','executing'].includes(a.state)),pendingJob=jobs.some(j=>!TERMINAL.has(j.state))||runs.some(r=>!TERMINAL.has(r.state))||evaluation.reviews.some(r=>['awaiting_approval','pending','running'].includes(r.status));
   if(latest.state==='idle'&&!server.host.active.has(session.id)&&!queued&&!pendingAction&&!pendingJob){
    idleSince ||= Date.now();if(Date.now()-idleSince>=1500){
     try{const value=await app.operations.execute(USER,'workspace_read',{source:'session',path:'report/report.md'},{projectId:project.id,sessionId:session.id});const bytes=Buffer.from(value.content);requireThat(sha256(bytes)===value.digest,'DIGEST_MISMATCH');if(bytes.toString('utf8').trim()){report=bytes;evaluation.report={sha256:value.digest,size:bytes.length,source:'session workspace_read',path:'report/report.md'};stopReason='completed';break;}}catch(error){if(error.code!=='NOT_FOUND')throw error;}
     if(evaluation.continuations-continuationsAtStart>=2){stopReason='idle';break;}evaluation.continuations++;send('Continue the original official task and save your own final report/report.md in your session workspace. If the task cannot be completed, report the actual limits and failures honestly.');progress('generic_continuation',{count:evaluation.continuations});idleSince=0;
    }
   }else idleSince=0;
   if(Date.now()-lastHeartbeat>=10000){lastHeartbeat=Date.now();progress('heartbeat',{sessionState:latest.state,jobCount:jobs.length,continuations:evaluation.continuations});save();}
   await delay(400);
  }
 }catch(error){evaluation.error={code:errorCode(error)};stopReason=evaluation.error.code==='STOP_REQUESTED'?'interrupted':['INPUT_DIRECTORY_LIMIT','INPUT_ARTIFACT_LIMIT','INPUT_MESSAGE_LIMIT','GPU_INPUT_FILE_LIMIT'].includes(evaluation.error.code)?'input_limit':'harness_error';progress('harness_error',evaluation.error);}
 finally{
  if(app&&session){
   try{
    const current=app.sessions.get(USER,session.id);evaluation.sessionState=current.state;evaluation.sessionGeneration=current.generation;evaluation.jobs=app.store.list('sandbox-job',session.projectId).filter(j=>j.sessionId===session.id).map(summarizeJob);
    const reviewerIds=new Set(evaluation.reviews.map(r=>r.reviewerSessionId).filter(Boolean)),sessionIds=new Set([session.id,...reviewerIds]);
    evaluation.runtimeConfiguration.actualSessionThinking=current.model.thinking;evaluation.runtimeConfiguration.runtimeThinkingVerified=current.model.thinking==='max';evaluation.runtimeConfiguration.evidenceScope='Project session selection; provider response does not echo reasoning_effort';
    evaluation.modelUsage=app.store.list('model-usage',session.projectId).filter(u=>sessionIds.has(u.sessionId)).map(u=>({sessionId:u.sessionId,role:reviewerIds.has(u.sessionId)?'reviewer':'coordinator',thinking:app.sessions.get(USER,u.sessionId).model.thinking,provider:u.provider,model:u.model,status:u.status,stopReason:u.stopReason,usage:u.usage?{input:u.usage.input,output:u.usage.output,cacheRead:u.usage.cacheRead,cacheWrite:u.usage.cacheWrite,totalTokens:u.usage.totalTokens}:null}));
    if(!report)try{const value=await app.operations.execute(USER,'workspace_read',{source:'session',path:'report/report.md'},{projectId:session.projectId,sessionId:session.id}),bytes=Buffer.from(value.content);if(sha256(bytes)===value.digest){report=bytes;evaluation.report={sha256:value.digest,size:bytes.length,source:'session workspace_read',path:'report/report.md',partial:stopReason!=='completed'};}}catch{}
    try{if(report){const exported=resuming?updateCanonicalReport({workspace,bytes:report,expectedDigest:resumed.reportDigest,recoveryId:recovery.id}):writeVerifiedOutput(workspace,'report/report.md',report,sha256(report));if(exported.backup)evaluation.report.previousVersion=exported.backup;}}catch(error){evaluation.reportExportError={code:errorCode(error)};stopReason='harness_error';}
    if(stopReason!=='completed'&&(!options.deadHostFollowup||listening)){
     if(['running','queued'].includes(current.state))app.sessions.interrupt(USER,session.id);
     for(const job of app.store.list('sandbox-job',session.projectId).filter(j=>j.sessionId===session.id&&!TERMINAL.has(j.state)))app.development.cancel(USER,session.projectId,job.id);
     if(gpuRequired||resuming){for(const review of app.store.list('development-review',session.projectId).filter(r=>r.producerSessionId===session.id)){const task=app.store.get('task',review.taskId,session.projectId);if(reviewNeedsCancellation(task))app.teams.cancel(USER,task.id);}for(const run of app.store.list('run',session.projectId).filter(r=>app.store.get('run-intent',r.intentId,session.projectId).rootSessionId===session.id&&!TERMINAL.has(r.state)))app.runs.cancel(USER,run.id);}
     const active=()=>app.store.list('sandbox-job',session.projectId).some(j=>j.sessionId===session.id&&!TERMINAL.has(j.state))||gpuRequired&&app.store.list('run',session.projectId).some(r=>app.store.get('run-intent',r.intentId,session.projectId).rootSessionId===session.id&&!TERMINAL.has(r.state));
     const cleanupDeadline=Date.now()+10000;while(Date.now()<cleanupDeadline&&active()){app.execution.launchPending();app.runs.reconcile();app.runs.launchPending();await delay(200);}
    }
    evaluation.jobs=app.store.list('sandbox-job',session.projectId).filter(j=>j.sessionId===session.id).map(summarizeJob);evaluation.cleanupPendingJobIds=evaluation.jobs.filter(j=>!TERMINAL.has(j.state)).map(j=>j.jobId);
    if(gpuRequired){evaluation.formalRuns=app.store.list('run',session.projectId).filter(r=>app.store.get('run-intent',r.intentId,session.projectId).rootSessionId===session.id).map(summarizeRun);evaluation.cleanupPendingRunIds=evaluation.formalRuns.filter(r=>!TERMINAL.has(r.state)).map(r=>r.runId);evaluation.gpuCompleted=evaluation.formalRuns.some(r=>r.state==='succeeded'&&r.integrity==='complete');}
  }catch(error){evaluation.cleanupError={code:errorCode(error)};if(stopReason==='completed')stopReason='harness_error';}
  }
  if(server)try{await server.close();}catch(error){evaluation.closeError={code:errorCode(error)};if(stopReason==='completed')stopReason='harness_error';}
  if(gpuRequired&&!evaluation.gpuCompleted&&stopReason==='completed'){stopReason='gpu_run_missing';evaluation.error={code:'GPU_FORMAL_RUN_MISSING'};}
  if(recovery?.measurement)evaluation.elapsedMeasurement=recovery.measurement;
  if(recovery){recovery.windowEndedAt=new Date().toISOString();recovery.windowElapsedMs=Date.now()-windowStart;}evaluation.totalElapsedMs=(recovery?.priorElapsedMs??0)+(Date.now()-windowStart);evaluation.stopReason=stopReason;evaluation.status=evaluationStatus({report,sessionState:evaluation.sessionState,stopReason,gpuRequired,gpuCompleted:evaluation.gpuCompleted});evaluation.endedAt=new Date().toISOString();save();progress('attempt_finished',{status:evaluation.status,stopReason,reportSha256:evaluation.report?.sha256??null});process.removeListener('SIGINT',signal);process.removeListener('SIGTERM',signal);try{releaseLock();}catch(error){evaluation.lockError={code:errorCode(error)};save();}
 }
 return {task_id:taskId,run_id:runId,status:evaluation.status,stopReason,attempt,evaluationPath:join(attempt,'evaluation.json'),workspace};
}

async function main(){
 const options=parseArgs(process.argv.slice(2));if(options.help){console.log('node scripts/benchmark-researchclaw.mjs --repo-root BUILT_SNAPSHOT [--project-provenance SOURCE_RECEIPT.json] --benchmark-root OFFICIAL_RCB --output-dir RESULTS --model-config PRIVATE_FILE --task Earth_001 [--task ID ...] --workspace PREPARED_TASK_WORKSPACE --image CPU_NAME@sha256:DIGEST [--gpu-device GPU-UUID ... --gpu-image CUDA_NAME@sha256:DIGEST] [--timeout-seconds 1800] [--resume-attempt EXISTING_ATTEMPT (--retry-message-id FAILED_USER_MESSAGE | --dead-host-followup | --rejected-action-id REJECTED_ACTION)]\nEach invocation creates a new retained attempt. A Git-less repo-root requires --project-provenance. Resume uses the existing attempt/workspace/data/run_id, so --workspace and --output-dir may be omitted; it adds an audited new time window and does not import or reset the model. Dead-host follow-up requires a retained valid native history, every original process proven gone, expired leases, settled compute and no other schedulable work. Rejected-action follow-up binds the final unsupported-operation rejection and sends a new ordinary message; the old operation stays rejected. Repeat --gpu-device for the authorized visible UUID set (1-16 distinct). Multiple --task values use --workspace/<task_id>. DeepSeek Flash must have a saved max level mapping reasoning_effort=max. Create attempt/stop-requested for a graceful stop of that attempt. Scoring is separate; private/ contains credentials, databases and native histories and must not be committed.');return;}
 for(const path of [options.repoRoot,options.benchmarkRoot,options.workspace]){noLinks(path);requireThat(lstatSync(path).isDirectory(),'DIRECTORY_REQUIRED');}
 noLinks(options.outputDir);mkdirSync(options.outputDir,{recursive:true,mode:0o700});process.chdir(options.repoRoot);
 const versions={project:await provenance(options.repoRoot,true),benchmark:await provenance(options.benchmarkRoot),harnessSha256:await fileHash(fileURLToPath(import.meta.url)),node:process.versions.node,platform:process.platform};
 if(options.projectProvenance)versions.project.sourceProvenance=await validateProjectProvenance(options.repoRoot,options.projectProvenance);else requireThat(versions.project.head,'PROJECT_PROVENANCE_REQUIRED');
 for(const task of options.tasks){const result=await runTask(options,task,versions);console.log(JSON.stringify(result));if(result.status!=='completed')process.exitCode=1;if(result.stopReason==='interrupted')break;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(JSON.stringify({error:{code:errorCode(error)}}));process.exitCode=1;});
