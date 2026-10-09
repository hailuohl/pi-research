import {DatabaseSync,backup} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {chmodSync,closeSync,constants,fstatSync,fsyncSync,lstatSync,mkdirSync,mkdtempSync,openSync,readFileSync,readdirSync,readSync,renameSync,rmSync,writeFileSync,writeSync,type Stats} from 'node:fs';
import {dirname,isAbsolute,join,relative,resolve,sep} from 'node:path';
import {ensure} from '../domain/errors.js';
import {digest} from './store.js';
import {verifySnapshot} from '../workspace/files.js';
import type {SourceSnapshot,Row,Team,Task} from '../domain/types.js';
import {teamWakeupSource,wakeupId} from '../scheduler/wakeups.js';
import {GitCommand} from '../workspace/git-command.js';
import {DataPaths,readDataLocation,setDataLocation} from './data-paths.js';
import {hasEnvironmentSecrets,environmentSecrets,redactEnvironment} from '../runtime/environment.js';
import {createModelManagementSnapshot,validateModelManagementSnapshot,restoreModelManagementSnapshot,type ModelManagementSnapshot} from './model-management-backup.js';

type Entry={path:string;type:'directory';mode:number}|{path:string;type:'file';mode:number;size:number;digest:string};
interface Manifest {format:'pi-research-backup-v1'|'pi-research-backup-v2';sourceRoot:string;legacyRoots?:string[];platform:string;createdAt:string;schema:number[];entries:Entry[];excluded:string[];modelManagement?:ModelManagementSnapshot;manifestDigest:string;}
export interface BackupSummary {backupDir:string;sourceRoot:string;files:number;bytes:number;manifestDigest:string;schema:number[];excluded:string[];restoredTo?:string;relocated?:boolean;}
const ROOTS=new Set(['projects','experiments','workspaces','sessions','snapshots','artifacts','skill-blobs','jobs','sandbox-jobs','document-jobs','publication-jobs','git-worktrees','git-operations','exports','integration-staging','state.db.text-writes']);
const EXCLUDED=new Set(['access.token','models.json','models-store.json','ssh-targets.json','ssh-targets.json.tmp','ssh-private','local-runtimes.json','local-runtimes.json.tmp','state.db-wal','state.db-shm','state.db-journal']);
const TERMINAL=new Set(['succeeded','failed','cancelled','timed_out']);
const plain=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function present(path:string) {try{return lstatSync(path);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return;throw e;}}
function noLinks(path:string) {let next=resolve(path);for(;;){const info=present(next);ensure(!info?.isSymbolicLink(),'BACKUP_PATH_DENIED','备份路径不能经过链接',403);const parent=dirname(next);if(parent===next)break;next=parent;}return resolve(path);}
function relativeName(path:string,allowRoot=false) {
 ensure(typeof path==='string'&&(allowRoot&&path===''||path.length>0&&!isAbsolute(path)&&!path.includes('\\')&&path.split('/').every(p=>p!==''&&p!=='.'&&p!=='..'&&!/[\x00-\x1f:]/.test(p)&&!/[. ]$/.test(p)&&!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p))),'BACKUP_PATH_DENIED','备份条目路径无效',400);
 return path;
}
function inside(root:string,path:string) {const value=resolve(path),name=relative(root,value).split(sep).join('/');ensure(isAbsolute(path)&&name!==''&&name!=='..'&&!name.startsWith('../')&&!isAbsolute(name),'BACKUP_EXTERNAL_REFERENCE','必需文件引用不在原数据目录内；请先处理路径迁移',409);return relativeName(name);}
function disjoint(a:string,b:string) {ensure(a!==b&&!a.startsWith(b+sep)&&!b.startsWith(a+sep),'BACKUP_PATH_DENIED','源与目标目录不能重叠',400);}
const statId=(s:Stats)=>`${s.dev}:${s.ino}:${s.size}:${s.mode}:${s.mtimeMs}:${s.ctimeMs}`;
/** Stream large logs/artifacts; preserve bytes without loading the research corpus into memory. */
function fileBytes(path:string,destination?:string) {
 const before=lstatSync(path);ensure(before.isFile()&&!before.isSymbolicLink(),'BACKUP_PATH_DENIED','仅允许普通文件',403);
 const fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0)),hash=createHash('sha256');let output:number|undefined;
 try {
  ensure(statId(fstatSync(fd))===statId(before),'BACKUP_SOURCE_CHANGED','文件读取期间变化',409);
  if(destination)output=openSync(destination,'wx',0o600);
  const buffer=Buffer.allocUnsafe(1024*1024);let size=0;
  for(;;){const n=readSync(fd,buffer,0,buffer.length,null);if(!n)break;hash.update(buffer.subarray(0,n));if(output!==undefined){let written=0;while(written<n)written+=writeSync(output,buffer,written,n-written);}size+=n;}
  ensure(size===before.size&&statId(fstatSync(fd))===statId(before)&&statId(lstatSync(path))===statId(before),'BACKUP_SOURCE_CHANGED','文件读取期间变化',409);
  if(output!==undefined)fsyncSync(output);
  return {size,digest:hash.digest('hex')};
 }finally{closeSync(fd);if(output!==undefined)closeSync(output);}
}
function managedTree(root:string,destination?:string,privateLocalJobs:ReadonlySet<string>=new Set()) {
 const entries:Entry[]=[],excluded:string[]=[];
 const secrets=environmentSecrets(root);
 const sensitiveNarrative=(value:unknown,active=false):boolean=>typeof value==='string'?active&&secrets.some(secret=>value.includes(secret)):Array.isArray(value)?value.some(item=>sensitiveNarrative(item,active)):plain(value)?Object.entries(value).some(([key,item])=>sensitiveNarrative(item,active||['text','thinking','errorMessage','summary','arguments','error'].includes(key)||['message','content'].includes(key)&&typeof item==='string')):false;
 function walk(path:string) {
  const source=join(root,path),info=lstatSync(source);ensure(!info.isSymbolicLink(),'BACKUP_PATH_DENIED','管理树不能含链接',403);
  if(path&&(EXCLUDED.has(path)||/^(?:model-connections|environment-variables)\.json(?:\.[\w-]+\.tmp)?$/i.test(path)||/^jobs\/[^/]+\/control\/native-spec\.json$/.test(path))){excluded.push(path);return;}
  const parts=path.split('/');
  const privateJob=parts[0]==='jobs'&&privateLocalJobs.has(parts[1]);
  if(privateJob&&parts.length>3&&!(parts.length===4&&parts[2]==='control'&&/^(?:native-(?:start|result)|terminal(?:-\d+)?)\.json$/.test(parts[3]))){excluded.push(redactEnvironment(root,path));return;}
  if(parts[0]==='sessions'&&parts.length===3&&parts[2]==='agent'){excluded.push(path+'/');return;}
  ensure(!/\.text-write-(pending|stage-|backup-)/.test(path),'BACKUP_RECOVERY_PENDING','有未解决的文件恢复，请先对账',409);
  if(parts.length===1&&path){ensure(path==='state.db'||ROOTS.has(path),'BACKUP_UNKNOWN_CONTENT','发现未知顶层内容：'+path,409);if(path==='state.db')return;}
  relativeName(path,true);
  ensure(info.isFile()||info.isDirectory(),'BACKUP_PATH_DENIED','管理树包含特殊文件',403);
  if(info.isDirectory()) {
   if(path==='state.db.text-writes')ensure(readdirSync(source).length===0,'BACKUP_RECOVERY_PENDING','文本写入日志尚未清理',409);
   if(destination&&path)mkdirSync(join(destination,path),{mode:0o700});
   entries.push({path,type:'directory',mode:info.mode&0o777});
   if(privateJob&&parts.length===3&&parts[2]==='output')excluded.push(path+'/*');
   else for(const name of readdirSync(source).sort())walk(path?path+'/'+name:name);
  }else {
   if(secrets.length&&/^sessions\/[^/]+\/pi(?:-analysis)?\/.+\.jsonl$/i.test(path)){
    const raw=readFileSync(source,'utf8');let containsSecret:boolean;
    try{containsSecret=raw.split(/\r?\n/).filter(line=>line.trim()).some(line=>sensitiveNarrative(JSON.parse(line)));}catch{containsSecret=secrets.some(secret=>raw.includes(secret));}
    ensure(!containsSecret,'BACKUP_SECRET_TRACE','原生会话记录包含环境变量敏感值；备份未创建，原始会话保留',409);
   }
   entries.push({path,type:'file',mode:info.mode&0o777,...fileBytes(source,destination?join(destination,path):undefined)});if(destination)chmodSync(join(destination,path),info.mode&0o777);
  }
  // ponytail: one bounded manifest; introduce chunked manifests only for larger real data sets.
  ensure(entries.length<=100000,'BACKUP_TOO_LARGE','备份清单最多100000项',413);
 }
 walk('');return {entries,excluded};
}
function table(db:DatabaseSync,name:string) {return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name);}
function stateCheck(db:DatabaseSync) {
 ensure(table(db,'records')&&table(db,'schema_migrations'),'BACKUP_DATABASE_INVALID','缺少研究数据库结构',400);
 const schema=db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(x=>Number(x.version));ensure(schema.length>0&&schema.every(v=>Number.isInteger(v)&&v>=1&&v<=13),'BACKUP_SCHEMA_UNSUPPORTED','备份需要受支持的数据版本',409);
 ensure(db.prepare('PRAGMA integrity_check').get()?.integrity_check==='ok','BACKUP_DATABASE_INVALID','数据库完整性检查失败',409);
 if(table(db,'text_write_receipts'))ensure(!db.prepare('SELECT 1 FROM text_write_receipts LIMIT 1').get(),'BACKUP_RECOVERY_PENDING','文本写入回执尚未清理',409);
 if(table(db,'compute_queue'))ensure(!db.prepare("SELECT 1 FROM compute_queue WHERE held<>0 OR phase NOT IN ('succeeded','failed','cancelled','timed_out') LIMIT 1").get(),'BACKUP_BUSY','还有计算等待、运行或未知结果',409);
 if(table(db,'compute_gpu_claims'))ensure(!db.prepare('SELECT 1 FROM compute_gpu_claims LIMIT 1').get(),'BACKUP_BUSY','还有未确认释放的 GPU 占用',409);
 ensure(!db.prepare("SELECT 1 FROM records WHERE kind='ssh-setup' LIMIT 1").get(),'BACKUP_BUSY','SSH 环境准备仍在执行或结果未知；请先核对已固定目标',409);
 const rows=db.prepare('SELECT kind,id,project_id,data FROM records ORDER BY rowid').all().map(x=>({kind:String(x.kind),id:String(x.id),projectId:x.project_id===null?null:String(x.project_id),value:JSON.parse(String(x.data)) as Record<string,unknown>}));
 const sessions=new Map(rows.filter(x=>x.kind==='session').map(x=>[x.id,x.value]));
 for(const {kind,id,value:r} of rows) {
  const state=String(r.state??'');let busy=false;
  if(['run','sandbox-job'].includes(kind))busy=!TERMINAL.has(state);
  if(['document-parse-job','publication-build-job'].includes(kind))busy=state!=='prepared'&&!TERMINAL.has(state);
  if(kind==='agent-admission')busy=state!=='released';
  if(kind==='model-http-request')busy=['queued','active','unknown'].includes(state)||(r.ownerKind==='owner-native'&&state==='interrupted'&&r.transportEnded!==true);
  if(kind==='session')busy=['queued','running'].includes(state);
  // A failed/idle session's old queued message is retained history, not a startup dispatch.
  if(kind==='message')busy=r.status==='running'||r.status==='queued'&&(!sessions.has(String(r.sessionId))||['queued','running'].includes(String(sessions.get(String(r.sessionId))!.state)));
  if(kind==='task-attempt')busy=['running','unknown'].includes(state);
  if(kind==='literature-task'||kind==='git-operation')busy=['queued','running'].includes(state);
  if(kind==='github-upload-job')busy=['queued','creating','uploading','unknown'].includes(state);
  if(kind==='workspace-lease')busy=Number(r.until)>Date.now();
  if(kind==='team')busy=['active','draining'].includes(state);
  if(kind==='team'&&!rows.some(p=>p.kind==='project'&&p.id===r.projectId&&['archived','trashed','purging'].includes(String(p.value.status)))&&r.autoSummarize===true&&['completed','partial','failed','cancelled'].includes(state)) {
   const source=teamWakeupSource(r as unknown as Row<Team>,rows.filter(x=>x.kind==='task'&&x.value.teamId===id).map(x=>x.value as unknown as Row<Task>)),existing=rows.find(x=>x.kind==='wakeup'&&x.id===wakeupId(source));
   busy=!existing||['pending','queued','running'].includes(String(existing.value.state));
  }
  if(kind==='campaign')busy=state==='active';
  if(kind==='wakeup')busy=['queued','running'].includes(state)||state==='pending'&&(r.automatic===true||r.requested===true);
  ensure(!busy,'BACKUP_BUSY',`请先通过原流程暂停或完成待派发工作：${kind}/${id}`,409);
 }
 return {schema,rows};
}
async function references(db:DatabaseSync,sourceRoot:string,dataRoot:string,entries:Entry[],legacyRoots:string[]=[]) {
 const {rows,schema}=stateCheck(db),index=new Map(entries.map(e=>[e.path,e])),verified=new Set<string>(),git=new Map<string,string[]>();
 const artifacts=new Map(rows.filter(x=>x.kind==='artifact').map(x=>[x.id,x]));
 const location=readDataLocation(db);ensure(!location||location.activeRoot===sourceRoot&&digest(location.legacyRoots)===digest(legacyRoots),'BACKUP_LOCATION_MISMATCH','备份的数据位置与数据库不一致',409);
 const logical=new DataPaths(sourceRoot,legacyRoots);
 function ref(value:unknown,type:'file'|'directory',expectedPrefix?:string) {
  ensure(typeof value==='string','BACKUP_REFERENCE_INVALID','必需引用缺少路径',409);let name:string;try{name=logical.key(value);}catch(e){ensure((e as {code?:string}).code!=='STORAGE_REFERENCE_OUTSIDE','BACKUP_EXTERNAL_REFERENCE','必需文件引用不在数据集的已登记位置',409);throw e;}const entry=index.get(name);
  ensure(entry?.type===type&&(!expectedPrefix||name.startsWith(expectedPrefix)),'BACKUP_REFERENCE_MISSING','备份缺少必需引用：'+name,409);return {name,entry,path:join(dataRoot,name)};
 }
 function blob(value:Record<string,unknown>) {const found=ref(value.path,'file');if(value.digest!==undefined)ensure(found.entry.type==='file'&&found.entry.digest===value.digest&&found.entry.size===value.size,'BACKUP_CONTENT_MISMATCH','固定产物内容不符：'+found.name,409);}
 function reportFigureArtifact(value:Record<string,unknown>,report:typeof rows[number]) {
  const id=value.id;ensure(typeof id==='string'&&id.trim().length>0&&typeof value.digest==='string'&&/^[a-f0-9]{64}$/.test(value.digest)&&Number.isSafeInteger(value.size)&&Number(value.size)>=0,'BACKUP_REFERENCE_INVALID','报告图形数据绑定无效',409);
  const projectId=report.projectId;ensure(typeof projectId==='string'&&projectId.trim().length>0&&report.value.projectId===projectId,'BACKUP_REFERENCE_INVALID','报告项目归属不一致',409);
  const artifact=artifacts.get(id);ensure(artifact,'BACKUP_REFERENCE_MISSING','备份缺少报告图形数据产物：'+id,409);
  ensure(artifact.id===id&&artifact.value.id===id&&typeof artifact.projectId==='string'&&artifact.projectId.trim().length>0&&artifact.projectId===projectId&&artifact.value.projectId===artifact.projectId,'BACKUP_REFERENCE_INVALID','报告图形数据产物 ID 或项目归属不一致',409);
  ensure(artifact.value.digest===value.digest&&artifact.value.size===value.size,'BACKUP_CONTENT_MISMATCH','报告图形数据产物摘要或大小不符：'+id,409);blob(artifact.value);
 }
 function snapshot(value:Record<string,unknown>) {
  const found=ref(value.path,'directory','snapshots/'),files=value.files as SourceSnapshot['files'];ensure(Array.isArray(files)&&digest(files)===value.digest,'BACKUP_CONTENT_MISMATCH','源码快照清单摘要不符',409);
  const key=found.name+':'+value.digest;if(!verified.has(key)){verifySnapshot(found.path,files);verified.add(key);}
 }
 function frozen(value:unknown,fields:string[]=[],record?:typeof rows[number]) {
  const isPath=(...parts:string[])=>fields.length===parts.length&&parts.every((part,index)=>fields[index]===part),report=record?.kind==='report',figureSources=report&&isPath('bindings','figureSources'),figureDataArtifacts=report&&isPath('bindings','figureSources','[]','dataArtifacts');
  if(Array.isArray(value)){for(const item of value){if(fields.at(-1)==='dataArtifacts')ensure(!Array.isArray(item),'BACKUP_REFERENCE_INVALID','数据输入不能嵌套列表',409);if(figureSources||figureDataArtifacts)ensure(plain(item),'BACKUP_REFERENCE_INVALID','报告图形绑定条目无效',409);frozen(item,[...fields,'[]'],record);}return;}
  if(!plain(value))return;
  const key=fields.at(-1)??'',figureSource=report&&isPath('bindings','figureSources','[]'),figureDataArtifact=report&&isPath('bindings','figureSources','[]','dataArtifacts','[]');
  if(report&&isPath('bindings')&&Object.hasOwn(value,'figureSources'))ensure(Array.isArray(value.figureSources),'BACKUP_REFERENCE_INVALID','报告图形绑定列表无效',409);
  if(figureSource)ensure(Array.isArray(value.dataArtifacts),'BACKUP_REFERENCE_INVALID','报告图形数据绑定列表无效',409);
  if(['snapshot','inputSnapshot','baselineSnapshot','baseSnapshot','candidateSnapshot'].includes(key)&&typeof value.path==='string'&&Array.isArray(value.files)&&typeof value.digest==='string')snapshot(value);
  if(figureDataArtifact){if(Object.hasOwn(value,'path'))blob(value);else reportFigureArtifact(value,record!);}
  else if(key==='dataArtifacts'||fields.at(-2)==='dataArtifacts'&&key==='[]')blob(value);
  for(const [name,item] of Object.entries(value))if(plain(item)||Array.isArray(item))frozen(item,[...fields,name],record);
 }
 for(const {kind,id,projectId,value:r} of rows) {
  if(['project','session','experiment','task-attempt'].includes(kind))ref(r.workspace,'directory');
  if(kind==='session'&&r.piSessionPath)ref(r.piSessionPath,'file',`sessions/${r.id}/pi/`);
  if(kind==='artifact')blob(r);
  if(kind==='publication-template') {ensure(projectId===null&&Array.isArray(r.files),'BACKUP_REFERENCE_INVALID','个人模板归属或文件清单无效',409);for(const file of r.files){ensure(plain(file)&&typeof file.digest==='string'&&/^[a-f0-9]{64}$/.test(file.digest)&&typeof file.blobPath==='string'&&logical.key(file.blobPath)==='artifacts/'+file.digest,'BACKUP_REFERENCE_INVALID','模板资源引用无效',409);blob({path:file.blobPath,digest:file.digest,size:file.size});}}
  if(kind==='skill-package-revision') {ensure(Array.isArray(r.files),'BACKUP_REFERENCE_INVALID','技能修订缺少文件清单',409);for(const file of r.files){ensure(plain(file)&&typeof file.digest==='string'&&/^[a-f0-9]{64}$/.test(file.digest),'BACKUP_REFERENCE_INVALID','技能正文摘要无效',409);blob({path:join(sourceRoot,'skill-blobs',file.digest),digest:file.digest,size:file.size});}}
  if(['git-source-binding','git-workspace','git-operation','github-upload-job'].includes(kind)) {
   const pid=String(r.projectId);ensure(/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(pid),'BACKUP_REFERENCE_INVALID','Git 项目标识无效',409);
   const commits=git.get(pid)??[];for(const key of ['gitCommit','head','expectedHead','commit'])if(typeof r[key]==='string')commits.push(r[key]);if(commits.length||kind!=='github-upload-job')git.set(pid,commits);
  }
  if(kind==='git-workspace') {
   ref(r.path,'directory','git-worktrees/');const original=join(sourceRoot,logical.key(String(r.path))),repository=join(sourceRoot,'projects',String(r.projectId),'git','repository.git');
   const pointer=(originalFile:string)=>{const item=ref(originalFile,'file');ensure(item.entry.type==='file'&&item.entry.size<=16384,'BACKUP_GIT_INVALID','Git 指向文件无效',409);return readFileSync(item.path,'utf8').trim();};
   const line=pointer(join(original,'.git'));ensure(line.startsWith('gitdir: '),'BACKUP_GIT_INVALID','Git 工作副本缺少受管指向',409);
   const admin=resolve(original,line.slice(8));inside(sourceRoot,admin);ref(admin,'directory',inside(sourceRoot,repository)+'/worktrees/');
   ensure(resolve(admin,pointer(join(admin,'commondir')))===repository&&resolve(admin,pointer(join(admin,'gitdir')))===join(original,'.git'),'BACKUP_GIT_INVALID','Git 工作副本指向不属于固定项目',409);
  }
  if(kind==='git-operation')for(const name of ['workspace','previousWorkspace'])if(r[name])ref(r[name],'directory');
  if(['run','sandbox-job','document-parse-job','publication-build-job'].includes(kind)) {
   ref(r.outputDir,'directory');if(r.controlDir)ref(r.controlDir,'directory');if(plain(r.execution)&&r.execution.controlDir)ref(r.execution.controlDir,'directory');
  }
  if(['run','run-intent'].includes(kind)&&plain(r.manifest))snapshot({path:r.manifest.snapshotPath,files:r.manifest.sourceFiles,digest:r.manifest.snapshotDigest});
  frozen(r,[],{kind,id,projectId,value:r});
 }
 for(const [pid,commits] of git){ref(join(sourceRoot,'projects',pid,'git','repository.git'),'directory');try{await new GitCommand(dataRoot,pid).verifyHistory(commits);}catch{ensure(false,'BACKUP_GIT_INVALID','受管Git对象、提交或独立存储校验失败：'+pid,409);}}
 return schema;
}
function manifestAt(backupDir:string):Manifest {
 const file=join(backupDir,'manifest.json'),info=present(file);ensure(info?.isFile()&&!info.isSymbolicLink()&&info.size<=32*1024*1024,'BACKUP_INVALID','缺少或无效的备份清单',400);
 const m:unknown=JSON.parse(readFileSync(file,'utf8'));ensure(plain(m)&&['pi-research-backup-v1','pi-research-backup-v2'].includes(String(m.format))&&typeof m.sourceRoot==='string'&&isAbsolute(m.sourceRoot)&&resolve(m.sourceRoot)===m.sourceRoot&&typeof m.platform==='string'&&Array.isArray(m.schema)&&Array.isArray(m.entries)&&m.entries.length<=100000&&Array.isArray(m.excluded)&&m.excluded.every(x=>typeof x==='string')&&typeof m.manifestDigest==='string','BACKUP_INVALID','备份格式无效',400);
 ensure(m.format==='pi-research-backup-v1'?m.legacyRoots===undefined:Array.isArray(m.legacyRoots),'BACKUP_INVALID','备份位置清单无效',400);new DataPaths(m.sourceRoot,(m.legacyRoots??[]) as string[]);
 const {manifestDigest,...body}=m;ensure(digest(body)===manifestDigest,'BACKUP_CONTENT_MISMATCH','备份清单摘要不符',409);
 if(m.modelManagement!==undefined){ensure(m.format==='pi-research-backup-v2','BACKUP_MODEL_MANAGEMENT_INVALID','旧格式备份不支持模型目录快照',409);validateModelManagementSnapshot(m.modelManagement);}
 const names=new Set<string>();let roots=0;
 for(const raw of m.entries){ensure(plain(raw)&&typeof raw.path==='string'&&(raw.type==='file'||raw.type==='directory')&&Number.isInteger(raw.mode)&&Number(raw.mode)>=0&&Number(raw.mode)<=0o777,'BACKUP_INVALID','备份条目无效',400);const name=relativeName(raw.path,true),fold=name.toLowerCase(),parts=name.split('/');ensure(!names.has(fold),'BACKUP_INVALID','备份有重复或大小写冲突条目',400);names.add(fold);ensure(name===''||name==='state.db'||ROOTS.has(parts[0]),'BACKUP_INVALID','备份包含未知管理树',400);ensure(!EXCLUDED.has(name)&&!/^jobs\/[^/]+\/control\/native-spec\.json$/.test(name)&&!(parts[0]==='sessions'&&parts[2]==='agent')&&!/\.text-write-(pending|stage-|backup-)/.test(name)&&!name.startsWith('state.db.text-writes/'),'BACKUP_INVALID','备份包含认证文件或未解决恢复',400);if(name===''){ensure(raw.type==='directory','BACKUP_INVALID','数据根无效',400);roots++;}if(raw.type==='file')ensure(name!==''&&Number.isSafeInteger(raw.size)&&Number(raw.size)>=0&&typeof raw.digest==='string'&&/^[a-f0-9]{64}$/.test(raw.digest),'BACKUP_INVALID','文件摘要或大小无效',400);}
 ensure(roots===1&&names.has('state.db'),'BACKUP_INVALID','缺少数据根或数据库',400);
 return m as unknown as Manifest;
}
function summary(backupDir:string,m:Manifest):BackupSummary {return {backupDir,sourceRoot:m.sourceRoot,files:m.entries.filter(x=>x.type==='file').length,bytes:m.entries.reduce((n,x)=>n+(x.type==='file'?x.size:0),0),manifestDigest:m.manifestDigest,schema:m.schema,excluded:m.excluded};}
async function verifyTree(dataRoot:string,m:Manifest) {
 const expected=new Map(m.entries.map(x=>[x.path,x])),seen=new Set<string>();
 function walk(path:string){const entry=expected.get(path),actual=join(dataRoot,path),info=lstatSync(actual);ensure(entry&&!info.isSymbolicLink()&&(entry.type==='directory'?info.isDirectory():info.isFile()),'BACKUP_CONTENT_MISMATCH','备份条目缺失、额外或类型不符：'+path,409);seen.add(path);if(entry.type==='directory'){for(const child of readdirSync(actual))walk(path?path+'/'+child:child);}else {const bytes=fileBytes(actual);ensure(bytes.size===entry.size&&bytes.digest===entry.digest,'BACKUP_CONTENT_MISMATCH','备份内容摘要不符：'+path,409);}}
 walk('');ensure(seen.size===expected.size,'BACKUP_CONTENT_MISMATCH','备份有遗漏文件',409);
 const db=new DatabaseSync(join(dataRoot,'state.db'),{readOnly:true});try{const schema=await references(db,m.sourceRoot,dataRoot,m.entries,m.legacyRoots??[]);ensure(digest(schema)===digest(m.schema),'BACKUP_SCHEMA_UNSUPPORTED','数据库版本与清单不符',409);}finally{db.close();}
}
export async function verifyDataBackup(path:string):Promise<BackupSummary> {
 const root=noLinks(path);ensure(present(root)?.isDirectory(),'BACKUP_INVALID','备份目录不存在',404);
 ensure(readdirSync(root).sort().join('\n')==='data\nmanifest.json','BACKUP_INVALID','备份目录不完整或含额外内容',409);
 const m=manifestAt(root);ensure(m.platform===process.platform,'BACKUP_PLATFORM_UNSUPPORTED','本批仅支持相同平台的原址恢复',409);await verifyTree(join(root,'data'),m);return summary(root,m);
}
function destination(path:string) {const target=noLinks(path);ensure(!present(target),'BACKUP_TARGET_EXISTS','目标已存在，禁止覆盖',409);ensure(present(dirname(target))?.isDirectory(),'BACKUP_PATH_DENIED','目标父目录必须已存在',400);return target;}
function removeOwnStage(stage:string,owner:Stats) {const info=present(stage);if(info?.isDirectory()&&!info.isSymbolicLink()&&info.ino===owner.ino&&info.dev===owner.dev)rmSync(stage,{recursive:true,force:true});}
export async function createDataBackup(source:string,path:string,options:{offline:boolean}):Promise<BackupSummary> {
 ensure(options.offline,'BACKUP_OFFLINE_REQUIRED','请先停止控制器和其他CLI，再显式使用 --offline；不会自动停止作业',409);
 const root=noLinks(source),target=destination(path);disjoint(root,target);ensure(present(root)?.isDirectory()&&present(join(root,'state.db'))?.isFile(),'BACKUP_DATABASE_INVALID','数据目录或数据库不存在',404);
 const stage=mkdtempSync(join(dirname(target),'.pi-backup-')),owner=lstatSync(stage);chmodSync(stage,0o700);let db:DatabaseSync|undefined;
 try {
  // This lock blocks database writers; --offline remains necessary for filesystem-only preparation.
  db=new DatabaseSync(join(root,'state.db'));db.exec('PRAGMA busy_timeout=1000; BEGIN IMMEDIATE');stateCheck(db);
  const modelManagement=createModelManagementSnapshot(root);
  const privateLocalJobs=new Set(hasEnvironmentSecrets(root)?db.prepare("SELECT id FROM records WHERE kind='run' AND json_extract(data,'$.execution.backend')='local'").all().map(row=>String(row.id)):[]);
  mkdirSync(join(stage,'data'),{mode:0o700});const tree=managedTree(root,join(stage,'data'),privateLocalJobs);
  const reader=new DatabaseSync(join(root,'state.db'),{readOnly:true});try{await backup(reader,join(stage,'data','state.db'));}finally{reader.close();}
  const copy=new DatabaseSync(join(stage,'data','state.db'));try{copy.exec('PRAGMA journal_mode=DELETE');}finally{copy.close();}chmodSync(join(stage,'data','state.db'),0o600);
  const dbEntry:Entry={path:'state.db',type:'file',mode:lstatSync(join(root,'state.db')).mode&0o777,...fileBytes(join(stage,'data','state.db'))};
  const entries=[...tree.entries,dbEntry].sort((a,b)=>a.path.localeCompare(b.path));
  const location=readDataLocation(db),legacyRoots=location?.legacyRoots??[];ensure(!location||location.activeRoot===root,'BACKUP_LOCATION_MISMATCH','数据目录需要受控迁移，不能直接复制后备份',409);
  const schema=await references(db,root,join(stage,'data'),entries,legacyRoots);
  ensure(digest(managedTree(root,undefined,privateLocalJobs))===digest(tree),'BACKUP_SOURCE_CHANGED','复制期间管理文件发生变化，备份未发布',409);
  ensure(digest(createModelManagementSnapshot(root)??null)===digest(modelManagement??null),'BACKUP_SOURCE_CHANGED','复制期间模型管理目录发生变化，备份未发布',409);
  const body={format:'pi-research-backup-v2' as const,sourceRoot:root,legacyRoots,platform:process.platform,createdAt:new Date().toISOString(),schema,entries,excluded:tree.excluded,...(modelManagement?{modelManagement}:{})},m={...body,manifestDigest:digest(body)};
  writeFileSync(join(stage,'manifest.json'),JSON.stringify(m,null,2)+'\n',{mode:0o600,flag:'wx'});await verifyDataBackup(stage);
  destination(target);renameSync(stage,target);return summary(target,m);
 }finally{if(db){if(db.isTransaction)db.exec('ROLLBACK');db.close();}removeOwnStage(stage,owner);}
}
function relocateCopy(stage:string,target:string,m:Manifest) {
 const dbFile=join(stage,'state.db'),dbMode=lstatSync(dbFile).mode&0o777;chmodSync(dbFile,0o600);
 const db=new DatabaseSync(dbFile),changed=new Set<string>(['state.db']),sourcePaths=new DataPaths(m.sourceRoot,m.legacyRoots??[]);
 try {
  const rows=db.prepare("SELECT data FROM records WHERE kind='git-workspace'").all().map(r=>JSON.parse(String(r.data)) as {path:string;projectId:string});
  const replace=(name:string,value:string)=>{const file=join(stage,name),mode=lstatSync(file).mode&0o777;chmodSync(file,0o600);writeFileSync(file,value,{flag:'w'});chmodSync(file,mode);changed.add(name);};
  for(const row of rows) {
   const workspace=sourcePaths.key(row.path),gitFile=join(stage,workspace,'.git'),line=readFileSync(gitFile,'utf8').trim();ensure(line.startsWith('gitdir: '),'BACKUP_GIT_INVALID','工作副本指向无效',409);
   const admin=inside(m.sourceRoot,resolve(join(m.sourceRoot,workspace),line.slice(8))),repository=`projects/${row.projectId}/git/repository.git`;
   ensure(admin.startsWith(repository+'/worktrees/'),'BACKUP_GIT_INVALID','工作副本指向其他项目',409);
   const relativePointer=(from:string,to:string)=>relative(join(stage,from),join(stage,to)).split(sep).join('/');
   replace(workspace+'/.git','gitdir: '+relativePointer(workspace,admin)+'\n');
   replace(admin+'/gitdir',relativePointer(admin,workspace+'/.git')+'\n');
   replace(admin+'/commondir',relativePointer(admin,repository)+'\n');
  }
  const roots=[...(m.legacyRoots??[]),m.sourceRoot].filter(r=>r!==target);
  setDataLocation(db,target,roots);db.exec("INSERT OR IGNORE INTO schema_migrations VALUES(9,datetime('now'))");
  const schema=db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(r=>Number(r.version));
  return {roots,schema,changed};
 }finally{db.close();chmodSync(dbFile,dbMode);}
}
export async function restoreDataBackup(path:string,targetPath:string,options:{offline:boolean;relocate?:boolean}):Promise<BackupSummary> {
 ensure(options.offline,'BACKUP_OFFLINE_REQUIRED','恢复前必须停止控制器和其他CLI，并显式使用 --offline',409);
 const result=await verifyDataBackup(path),target=destination(targetPath),root=noLinks(path),m=manifestAt(root);disjoint(root,target);ensure(result.manifestDigest===m.manifestDigest,'BACKUP_CONTENT_MISMATCH','校验期间备份清单已改变',409);
 const relocating=target!==m.sourceRoot;
 ensure(!relocating||options.relocate,'BACKUP_RELOCATION_UNSUPPORTED','异址恢复需要显式 --relocate；原副本必须继续离线',409);
 const targetRoots=[...(m.legacyRoots??[]),m.sourceRoot].filter(r=>r!==target);new DataPaths(target,targetRoots);
 const stage=mkdtempSync(join(dirname(target),'.pi-restore-')),owner=lstatSync(stage);chmodSync(stage,0o700);
 try {
  for(const entry of m.entries.filter(x=>x.type==='directory').sort((a,b)=>a.path.length-b.path.length))if(entry.path)mkdirSync(join(stage,entry.path),{mode:0o700});
  for(const entry of m.entries)if(entry.type==='file'){const copied=fileBytes(join(root,'data',entry.path),join(stage,entry.path));ensure(copied.size===entry.size&&copied.digest===entry.digest,'BACKUP_CONTENT_MISMATCH','恢复期间备份发生变化',409);chmodSync(join(stage,entry.path),entry.mode);}
  await verifyTree(stage,m);
  if(relocating) {
   const {roots,schema,changed}=relocateCopy(stage,target,m);
   const entries=m.entries.map(entry=>entry.type==='file'&&changed.has(entry.path)?{...entry,...fileBytes(join(stage,entry.path))}:entry);
   const relocated:Manifest={...m,format:'pi-research-backup-v2',sourceRoot:target,legacyRoots:roots,schema,entries};
   await verifyTree(stage,relocated);
  }
  if(m.modelManagement)restoreModelManagementSnapshot(stage,m.modelManagement);
  for(const entry of m.entries.filter(x=>x.type==='directory').sort((a,b)=>b.path.length-a.path.length))chmodSync(join(stage,entry.path),entry.mode);
  destination(target);renameSync(stage,target);return {...result,restoredTo:target,...(relocating?{relocated:true}:{})};
 }finally{removeOwnStage(stage,owner);}
}
