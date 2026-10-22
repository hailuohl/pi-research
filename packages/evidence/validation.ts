import {lstatSync} from 'node:fs';
import type {ResearchApp} from '../research-app.js';
import {USER,type Run,type RunIntent} from '../domain/types.js';
import type {SandboxJob,DevelopmentTask} from '../execution/contracts.js';
import {ensure,DomainError} from '../domain/errors.js';
import {digest} from '../storage/store.js';
import {safePath,sourceManifest,verifySnapshot} from '../workspace/files.js';
import {assertExperimentSourceCurrent} from '../policy/lifecycle.js';
import {assertRunGrantRun} from '../policy/run-grant-validation.js';
import {verifyRunRecord} from './run-verifier.js';

export interface ValidationBinding {projectId:string;sessionId:string;kind:'run'|'development-job';id:string;manifestDigest:string;sourceDigest:string}
export interface ValidationResult extends ValidationBinding {
 checkedAt:string;receiptCheck:'pass'|'fail'|'unknown'|'not_run';applicability:'current'|'stale'|'unknown';
 observedSourceDigest?:string;
 receipt:{state:string;integrity:string;exitCode:number|null;startedAt?:string;endedAt?:string};
 receiptReason?:string;applicabilityReason?:string;
}
const staleCodes=new Set(['DEVELOPMENT_SOURCE_STALE','CHANGE_SOURCE_STALE','TASK_INPUT_STALE','SESSION_PERMISSION_STALE','SESSION_READ_ONLY','WORKING_GRANT_STALE','WORKING_GRANT_REVOKED','WORKING_GRANT_TEMPLATE_STALE','WORKING_GRANT_SCOPE_CHANGED','RUN_GRANT_STALE','RUN_GRANT_REVOKED','APPROVAL_STALE','APPROVAL_REQUIRED','ACCEPTANCE_STALE']);
const unreadableCodes=new Set(['NOT_FOUND','PATH_DENIED','ARTIFACT_CHANGED','ARTIFACT_TOO_LARGE','TOO_MANY_FILES','SNAPSHOT_TOO_LARGE','SOURCE_UNREADABLE']);
const runIdentityCodes=new Set(['RUN_GRANT_USE_MISMATCH','RUN_GRANT_INTENT_CHANGED','RUN_GRANT_CORRUPTED','RUN_GRANT_STALE']);
const code=(error:unknown)=>error instanceof DomainError?error.code:(error as NodeJS.ErrnoException)?.code==='ENOENT'?'READ_MISSING':['EACCES','EPERM'].includes((error as NodeJS.ErrnoException)?.code??'')?'READ_DENIED':'READ_FAILED';
function readableSnapshot(root:string,files:Run['manifest']['sourceFiles']){
 const stat=lstatSync(root);ensure(stat.isDirectory()&&!stat.isSymbolicLink(),'SOURCE_UNREADABLE','固定快照目录不可读取');
 for(const file of files)ensure(lstatSync(safePath(root,file.path)).isFile(),'SOURCE_UNREADABLE','固定快照文件不可读取');
}

/** USER-only read boundary: no operations registration, execution or caller-supplied paths. */
export function readValidation(app:ResearchApp,b:ValidationBinding):ValidationResult {
 app.projects.read(USER,b.projectId);const session=app.sessions.get(USER,b.sessionId);
 ensure(session.projectId===b.projectId,'VALIDATION_SCOPE_DENIED','核验会话不属于此项目',403);
 let row;let files:Run['manifest']['sourceFiles'];let workspace:string;let snapshotPath:string;let identityMatches:boolean;let verify:()=>unknown;let current=()=>{};let experiment:ReturnType<typeof app.experiments.get>|undefined;
 if(b.kind==='run'){
  const run=app.runs.get(USER,b.id),intent=app.store.get<RunIntent>('run-intent',run.intentId,b.projectId);
  ensure(run.projectId===b.projectId&&intent.runId===run.id&&intent.rootSessionId===session.id&&intent.experimentId===run.experimentId&&run.manifest.experimentId===run.experimentId,'VALIDATION_SCOPE_DENIED','原运行与项目、会话或意向绑定不符',403);
  identityMatches=intent.manifestDigest===run.manifestDigest&&digest(intent.manifest)===run.manifestDigest;
  experiment=app.experiments.get(USER,run.experimentId);ensure(experiment.projectId===b.projectId,'VALIDATION_SCOPE_DENIED','实验归属不符',403);
  row=run;files=run.manifest.sourceFiles;workspace=experiment.workspace;snapshotPath=run.manifest.snapshotPath;
  verify=()=>{ensure(digest(files)===run.manifest.snapshotDigest,'SNAPSHOT_CORRUPTED','固定源码清单摘要不符');verifySnapshot(app.store.paths.physical(run.manifest.snapshotPath),files);return verifyRunRecord(run,app.evidence);};
  current=()=>{assertRunGrantRun(app.store,run,false);app.researchPlans.assertRunSource(run.experimentId,'execute',run.intentId);app.approvals.assert(intent.approvalId,b.projectId,intent.id,run.manifestDigest,'run.submit');if(run.permission)app.sessionPermissions.assertJob(run.permission,{kind:'run',subjectId:intent.id,approvalId:intent.approvalId,manifestDigest:run.manifestDigest},session.id);};
 }else{
  const job=app.store.get<SandboxJob>('sandbox-job',b.id,b.projectId),task=app.store.get<DevelopmentTask>('development-task',job.developmentTaskId,b.projectId);
  ensure(job.sessionId===session.id&&task.sessionId===session.id&&task.jobId===job.id&&task.id===job.developmentTaskId,'VALIDATION_SCOPE_DENIED','原作业与会话或开发任务绑定不符',403);
  identityMatches=task.manifestDigest===job.manifestDigest&&task.sourceDigest===job.sourceDigest&&digest(task.manifest)===job.manifestDigest;
  app.development.inspect(USER,b.projectId,job.id);row=job;files=job.manifest.inputSnapshot.files;workspace=session.workspace;snapshotPath=job.manifest.inputSnapshot.path;
  verify=()=>app.development.assertResultMatches(USER,b.projectId,job.id,job.sourceDigest);
 }
 const sourceDigest='sourceDigest'in row?row.sourceDigest:row.manifest.snapshotDigest;
 ensure(row.manifestDigest===b.manifestDigest&&sourceDigest===b.sourceDigest,'VALIDATION_BINDING_CHANGED','所选原回执摘要已改变，请重新读取');
 const result:ValidationResult={...b,checkedAt:new Date().toISOString(),receiptCheck:'not_run',applicability:'unknown',receipt:{state:row.state,integrity:row.integrity,exitCode:row.exitCode??null,startedAt:row.startedAt,endedAt:row.endedAt}};
 let confirmedStale=false;
 try{
  ensure(identityMatches&&digest(row.manifest)===row.manifestDigest&&digest(files)===sourceDigest,'MANIFEST_CORRUPTED','原固定清单摘要不符');
  if(row.state==='succeeded'&&row.integrity==='complete'&&row.exitCode===0){readableSnapshot(app.store.paths.physical(snapshotPath),files);verify();result.receiptCheck='pass';}
  else result.receiptCheck=['unknown','running','cancelling','starting'].includes(row.state)||row.state==='succeeded'?'unknown':'not_run';
 }catch(error){
  let failure=error;if(code(error)==='SNAPSHOT_CORRUPTED')try{readableSnapshot(app.store.paths.physical(snapshotPath),files);}catch(unreadable){failure=unreadable;}
  const reason=code(failure);result.receiptReason=reason;confirmedStale=staleCodes.has(reason);if(confirmedStale)result.applicabilityReason=reason;result.receiptCheck=!confirmedStale&&!unreadableCodes.has(reason)&&(failure instanceof DomainError||failure instanceof SyntaxError)?'fail':'unknown';
 }
 try{
  const root=app.store.paths.physical(workspace),stat=lstatSync(root);ensure(stat.isDirectory()&&!stat.isSymbolicLink(),'SOURCE_UNREADABLE','当前源码目录不可读取');
  const observedSource=sourceManifest(root),legacy=files.every(f=>f.mode===undefined),observed=legacy?digest(observedSource.files.map(({mode,...file})=>file)):observedSource.digest;
  result.observedSourceDigest=observed;
  const changed=observed!==sourceDigest?'SOURCE_CHANGED':experiment&&experiment.revision!==(row as Run).manifest.experimentRevision?'EXPERIMENT_REVISION_CHANGED':experiment&&experiment.contractDigest!==(row as Run).manifest.contractDigest?'EXPERIMENT_CONTRACT_CHANGED':undefined;
  if(changed){confirmedStale=true;result.applicabilityReason=changed;}
  if(experiment)assertExperimentSourceCurrent(app.store,experiment);
  current();
  result.applicability=confirmedStale?'stale':result.receiptCheck==='pass'?'current':'unknown';
 }catch(error){const reason=code(error);if(runIdentityCodes.has(reason)){result.receiptCheck='fail';result.receiptReason=reason;}result.applicabilityReason=reason;result.applicability=staleCodes.has(reason)?'stale':'unknown';}
 if(result.receiptCheck==='fail'){result.applicability='unknown';result.applicabilityReason='RECEIPT_INVALID';}
 else if(result.applicability==='unknown'&&!result.applicabilityReason)result.applicabilityReason='RECEIPT_NOT_VERIFIED';
 result.checkedAt=new Date().toISOString();return result;
}
