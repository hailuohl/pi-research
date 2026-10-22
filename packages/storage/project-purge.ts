import {inferOperationOwner,storedOperationOwner} from './operation-ownership.js';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,readdirSync,openSync,closeSync,readSync,fstatSync,constants,unlinkSync,rmdirSync,chmodSync} from 'node:fs';
import {join,resolve,isAbsolute,sep} from 'node:path';
import {ensure,asError,DomainError} from '../domain/errors.js';
import type {ProjectPurgeView} from '../domain/types.js';
import {digest} from './store.js';
import {DataPaths,loadDataPaths,assertPhysicalDataRoot} from './data-paths.js';
import {stateCheck} from './backup.js';
import {acquireMaintenance,assertMaintenance,releaseMaintenance,type MaintenancePermit} from './process-coordination.js';
type Entry={key:string;type:'file'|'directory';dev:number;ino:number;size?:number;hash?:string};
type RecordRow={kind:string;id:string;projectId:string|null;value:Record<string,unknown>};
interface Plan {format:1;projectId:string;purgeId:string;root:{dev:number;ino:number};records:Array<{kind:string;id:string;hash:string}>;paths:Entry[];retained:Entry[];roots:string[];hash:string;}
const TABLES=new Set(['schema_migrations','records','operations','events','inbox','compute_limits','compute_contexts','compute_queue','compute_gpu_claims','text_write_receipts','text_write_key','data_location','project_record_epochs','normal_process_claims','maintenance_gate','project_purges']);
const CAS=['artifacts','snapshots','skill-blobs'];
const FILE_FIELDS=new Set(['path','blobPath','workspace','outputDir','controlDir','piSessionPath','analysisSessionPath','snapshotPath','previousWorkspace']);
const id=(value:unknown)=>{ensure(typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value),'PURGE_OWNER_INVALID','记录标识不能用于受管路径');return value;};
const owned=(r:RecordRow,pid:string)=>r.projectId===pid||r.kind==='project'&&r.id===pid;
function rows(db:DatabaseSync):RecordRow[]{return db.prepare('SELECT kind,id,project_id,data FROM records ORDER BY kind,id').all().map(raw=>{const value=JSON.parse(String(raw.data));ensure(value.kind===raw.kind&&value.id===raw.id&&value.projectId===raw.project_id,'PURGE_OWNER_INVALID','记录列与JSON归属不一致');return {kind:String(raw.kind),id:String(raw.id),projectId:raw.project_id===null?null:String(raw.project_id),value};});}
function description(paths:DataPaths,key:string):Entry {
 ensure(!/\.text-write-(pending|stage-|backup-)|\.source-prepare-pending/.test(key),'PURGE_BUSY','存在未完成工作区文件恢复标记');
 const path=paths.physical('pi-data:/'+key.split('/').map(encodeURIComponent).join('/')),stat=lstatSync(path);ensure(!stat.isSymbolicLink()&&(stat.isFile()||stat.isDirectory()),'PURGE_PATH_INVALID','清理计划仅支持真实目录和普通文件');
 if(stat.isDirectory())return {key,type:'directory',dev:stat.dev,ino:stat.ino};
 ensure(stat.nlink===1,'PURGE_HARDLINK','普通文件存在额外硬链接，删除前需核对外部原件');
 const fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0)),hash=createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024);let size=0;
 try{ensure(fstatSync(fd).ino===stat.ino&&fstatSync(fd).dev===stat.dev,'PURGE_PATH_CHANGED','计划资源读取期间已替换');for(;;){const n=readSync(fd,buffer,0,buffer.length,null);if(!n)break;hash.update(buffer.subarray(0,n));size+=n;}const after=fstatSync(fd);ensure(after.size===size&&after.mtimeMs===stat.mtimeMs&&lstatSync(path).ino===stat.ino,'PURGE_PATH_CHANGED','计划资源读取期间已变化');}finally{closeSync(fd);}
 return {key,type:'file',dev:stat.dev,ino:stat.ino,size,hash:hash.digest('hex')};
}
function walk(paths:DataPaths,key:string):Entry[]{const entry=description(paths,key);return entry.type==='file'?[entry]:[...readdirSync(paths.physical('pi-data:/'+key.split('/').map(encodeURIComponent).join('/'))).sort().flatMap(name=>walk(paths,key+'/'+name)),entry];}
function references(paths:DataPaths,records:RecordRow[]){
 const result=new Set<string>();const visit=(value:unknown,key='',recordKind='')=>{
  if(Array.isArray(value)){value.forEach(v=>visit(v,key));return;}if(value&&typeof value==='object'){for(const [k,v]of Object.entries(value)){
   // A past command's arguments and cwd describe execution; they do not own resources.
   if(recordKind==='host-command'&&(k==='cwd'&&typeof v==='string'||k==='argv'&&Array.isArray(v)&&v.every(a=>typeof a==='string')))continue;
   visit(v,k);
  }return;}
  if(typeof value!=='string'||!value.startsWith('pi-data:/')&&!isAbsolute(value))return;
  if(FILE_FIELDS.has(key)){result.add(paths.key(value));return;}
  if(value.startsWith('pi-data:/'))ensure(false,'PURGE_UNKNOWN_REFERENCE','存在未识别字段的受管资源引用');
  const normalized=(path:string)=>process.platform==='win32'?path.toLowerCase():path,candidate=normalized(resolve(value));
  const managed=[paths.dataDir,...paths.legacyRoots].some(root=>{const base=normalized(root);return candidate===base||candidate.startsWith(base.endsWith(sep)?base:base+sep);});
  ensure(!managed,'PURGE_UNKNOWN_REFERENCE','存在未识别字段的旧受管路径引用');
 };for(const row of records){visit(row.value,'',row.kind);if(row.kind==='skill-package-revision'&&Array.isArray(row.value.files))for(const raw of row.value.files){const file=raw as {digest?:unknown};ensure(typeof file.digest==='string'&&/^[a-f0-9]{64}$/.test(file.digest),'PURGE_OWNER_INVALID','技能资源摘要无效');result.add('skill-blobs/'+file.digest);}}return result;
}
function receiptOwnership(db:DatabaseSync){
 for(const op of db.prepare('SELECT scope,response,owner_kind,project_id FROM operations').all()){
  const owner=storedOperationOwner(op);ensure(owner.kind!=='unknown','PURGE_UNKNOWN_RECEIPT','存在无法证明归属的旧回执，删除前需核对');
  ensure(owner.kind==='global'?op.project_id===null:!!db.prepare("SELECT 1 FROM records WHERE kind='project' AND id=?").get(owner.projectId),'PURGE_RECEIPT_INVALID','回执归属元数据无效');
  const inferred=inferOperationOwner(db,String(op.scope),undefined,JSON.parse(String(op.response)));
  ensure(inferred.kind==='unknown'||owner.kind===inferred.kind&&(owner.kind!=='project'||inferred.kind==='project'&&owner.projectId===inferred.projectId),'PURGE_RECEIPT_INVALID','回执归属与固定响应矛盾');
 }
}
function retainedRecords(db:DatabaseSync,all:RecordRow[],pid:string):RecordRow[]{
 const result=all.filter(r=>!owned(r,pid));for(const op of db.prepare("SELECT scope,key,response,project_id FROM operations WHERE owner_kind='global' OR owner_kind='project' AND project_id<>?").all(pid))result.push({kind:'operation-receipt',id:String(op.scope)+':'+String(op.key),projectId:op.project_id===null?null:String(op.project_id),value:JSON.parse(String(op.response))});
 return result;
}
const overlaps=(a:string,b:string)=>a===b||a.startsWith(b+'/')||b.startsWith(a+'/');
function protection(db:DatabaseSync,paths:DataPaths,pid:string,plan?:Plan){
 databaseShape(db);receiptOwnership(db);ensure(!db.prepare("SELECT 1 FROM project_purges WHERE project_id<>? AND state<>'completed' AND plan IS NOT NULL").get(pid),'PURGE_OTHER_PLAN_PENDING','另一个固定清理计划尚未完成，请先续清该计划');const all=rows(db),target=all.filter(r=>owned(r,pid)),other=retainedRecords(db,all,pid);
 const ids=new Set((plan?.records??target).map(r=>r.id));const cross=(v:unknown):boolean=>typeof v==='string'?ids.has(v):Array.isArray(v)?v.some(cross):!!v&&typeof v==='object'&&Object.values(v).some(cross);
 ensure(!other.some(r=>cross(r.value)),'PURGE_REFERENCED','其他项目或全局记录仍引用待清理项目');
 const targetRefs=references(paths,target),otherRefs=references(paths,other);
 if(plan){
  ensure(target.length===0||digest(target.map(r=>({kind:r.kind,id:r.id,hash:digest(r.value)})))===digest(plan.records),'PURGE_RECORDS_CHANGED','目标记录已改变，拒绝扩展原计划');
  ensure(![...otherRefs].some(ref=>plan.roots.some(root=>overlaps(ref,root))||plan.paths.some(entry=>overlaps(ref,entry.key))),'PURGE_REFERENCES_CHANGED','其他项目或维护计划新增了对删除资源的引用');
 }
 return {all,target,other,targetRefs,otherRefs};
}
function managedRoots(records:RecordRow[]){const roots=new Set<string>();const kinds:Record<string,string>={project:'projects',experiment:'experiments',session:'sessions',team:'workspaces',run:'jobs','sandbox-job':'sandbox-jobs','document-parse-job':'document-jobs','publication-build-job':'publication-jobs','git-operation':'git-operations','github-upload-job':'git-operations'};for(const row of records){if(kinds[row.kind])roots.add(kinds[row.kind]+'/'+id(row.id));if(row.kind==='project')roots.add('git-worktrees/'+id(row.id));}return roots;}
function unknownResources(paths:DataPaths,known:Set<string>,records:RecordRow[]){
 const recovery=join(paths.dataDir,'state.db.text-writes');if(existsSync(recovery)){assertPhysicalDataRoot(recovery);ensure(lstatSync(recovery).isDirectory()&&readdirSync(recovery).length===0,'PURGE_BUSY','文本文件恢复日志尚未清理；维护不会执行恢复');}
 const roots=managedRoots(records);for(const namespace of ['projects','experiments','sessions','workspaces','jobs','sandbox-jobs','document-jobs','publication-jobs','git-worktrees','git-operations']){const folder=join(paths.dataDir,namespace);if(!existsSync(folder))continue;assertPhysicalDataRoot(folder);ensure(lstatSync(folder).isDirectory(),'PURGE_PATH_INVALID','受管命名空间不是目录');let unknown=0;for(const name of readdirSync(folder)){const metadata=name.endsWith('.source-modes.json'),owner=namespace+'/'+(metadata?name.slice(0,-18):name);if(!roots.has(owner)){unknown++;continue;}const path=join(folder,name);assertPhysicalDataRoot(path);ensure(metadata?lstatSync(path).isFile():lstatSync(path).isDirectory(),'PURGE_PATH_INVALID','受管ID目录或模式元数据类型不符');}ensure(unknown===0,'PURGE_UNOWNED_DIRECTORY',`${namespace}: ${unknown} 未登记ID目录归属待核对`);}

 for(const folder of ['integration-staging','exports/tmp']){const path=join(paths.dataDir,folder);if(existsSync(path)){assertPhysicalDataRoot(path);ensure(readdirSync(path).length===0,'PURGE_UNOWNED_STAGING','存在未登记归属的临时准备文件，删除前需核对');}}
 for(const namespace of CAS){const root=join(paths.dataDir,namespace);if(!existsSync(root))continue;assertPhysicalDataRoot(root);let unknown=0;for(const name of readdirSync(root)){const match=name.match(/^([a-f0-9]{64})(\.source-modes\.json)?$/),key=namespace+'/'+(match?.[1]??name);if(!match||namespace!=='snapshots'&&match[2]||!known.has(key))unknown++;}ensure(unknown===0,'PURGE_UNOWNED_CAS',`${namespace}: ${unknown} 未登记CAS归属待核对`);}
}
function databaseShape(db:DatabaseSync){for(const row of db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all())ensure(TABLES.has(String(row.name))&&!String(row.sql).toUpperCase().includes('VIRTUAL TABLE'),'PURGE_UNKNOWN_STORAGE','存在未受支持的表或全文索引，删除前需核对');for(const row of db.prepare("SELECT name FROM sqlite_master WHERE type='trigger'").all())ensure(/^(compute|document|publication)_queue_(insert|update)(_gate)?$/.test(String(row.name))||['gpu_claim_release','project_record_epoch_insert'].includes(String(row.name)),'PURGE_UNKNOWN_STORAGE','存在未受支持的数据库触发器');}
function buildPlan(db:DatabaseSync,paths:DataPaths,pid:string,purgeId:string):Plan {
 const {all,target,targetRefs,otherRefs}=protection(db,paths,pid);ensure(target.some(r=>r.kind==='project'&&r.value.status==='purging'),'PURGE_STATE_INVALID','项目不是待永久清理状态');
 const allRefs=new Set([...targetRefs,...otherRefs]),roots=managedRoots(target);
 const inRoot=(key:string)=>[...roots].some(root=>key===root||key.startsWith(root+'/'));
 for(const key of otherRefs)ensure(!inRoot(key),'PURGE_REFERENCED','其他项目或全局记录仍引用待清理目录');
 const cas=(key:string)=>CAS.some(namespace=>key.startsWith(namespace+'/'));
 for(const key of targetRefs)ensure(inRoot(key)||cas(key),'PURGE_OWNER_INVALID','存在未受支持的项目资源位置，不能推断删除归属');
 const pathsToDelete:Entry[]=[],retained:Entry[]=[];
 unknownResources(paths,allRefs,all);
 for(const key of targetRefs){if(!cas(key))continue;ensure(existsSync(paths.physical('pi-data:/'+key)),'PURGE_SOURCE_MISSING','计划建立前资源已缺失，不能自动视为清理完成');const entries=walk(paths,key),modes=key+'.source-modes.json';if(key.startsWith('snapshots/'))ensure(entries.at(-1)?.type==='directory','PURGE_SOURCE_INVALID','快照引用不是目录');else ensure(entries.length===1&&entries[0].type==='file'&&entries[0].hash===key.split('/')[1],'PURGE_SOURCE_INVALID','CAS字节与摘要名称不符');if(key.startsWith('snapshots/')&&existsSync(join(paths.dataDir,modes)))entries.push(description(paths,modes));if([...otherRefs].some(ref=>overlaps(ref,key)))retained.push(...entries);else pathsToDelete.push(...entries);}
 for(const root of roots){if(existsSync(join(paths.dataDir,root)))pathsToDelete.push(...walk(paths,root));const modes=root+'.source-modes.json';if(existsSync(join(paths.dataDir,modes)))pathsToDelete.push(description(paths,modes));}
 const unique=[...new Map(pathsToDelete.map(entry=>[entry.key,entry])).values()].sort((a,b)=>b.key.split('/').length-a.key.split('/').length||Number(a.type==='directory')-Number(b.type==='directory')||a.key.localeCompare(b.key));
 const root=lstatSync(paths.dataDir),body={format:1 as const,projectId:pid,purgeId,root:{dev:root.dev,ino:root.ino},records:target.map(r=>({kind:r.kind,id:r.id,hash:digest(r.value)})),paths:unique,retained:[...new Map(retained.map(e=>[e.key,e])).values()],roots:[...roots].sort()};return {...body,hash:digest(body)};
}
function validatePlan(plan:Plan,paths:DataPaths,pid:string,purgeId:string){const {hash,...body}=plan;ensure(plan.format===1&&plan.projectId===pid&&plan.purgeId===purgeId&&digest(body)===hash,'PURGE_PLAN_INVALID','固定清理计划校验失败');const root=lstatSync(paths.dataDir);ensure(root.dev===plan.root.dev&&root.ino===plan.root.ino,'PURGE_PATH_CHANGED','数据目录身份改变');for(const entry of [...plan.paths,...plan.retained]){const key=paths.key('pi-data:/'+entry.key.split('/').map(encodeURIComponent).join('/'));ensure(plan.roots.some(r=>key===r||key.startsWith(r+'/')||key===r+'.source-modes.json')||/^(artifacts|skill-blobs)\/[a-f0-9]{64}$/.test(key)||/^snapshots\/[a-f0-9]{64}(?:\.source-modes\.json|\/.*)?$/.test(key),'PURGE_PLAN_INVALID','固定计划路径越界');}}
function verifyEntry(paths:DataPaths,entry:Entry,missing=false){const physical=paths.physical('pi-data:/'+entry.key.split('/').map(encodeURIComponent).join('/'));if(!existsSync(physical)){ensure(missing,'PURGE_SOURCE_MISSING','保留资源已缺失');return false;}const actual=description(paths,entry.key);ensure(actual.type===entry.type&&actual.dev===entry.dev&&actual.ino===entry.ino&&(entry.type==='directory'||actual.hash===entry.hash&&actual.size===entry.size),'PURGE_PATH_CHANGED','计划资源已替换或内容已改变');return true;}
export function projectPurgeView(db:DatabaseSync,dataDir:string,projectId:string):ProjectPurgeView {ensure(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='project_purges'").get(),'NOT_FOUND','没有永久清理请求',404);const row=db.prepare('SELECT * FROM project_purges WHERE project_id=?').get(projectId);ensure(row,'NOT_FOUND','没有此项目的永久清理请求',404);return {projectId,purgeId:String(row.id),state:row.state as ProjectPurgeView['state'],phase:row.phase as ProjectPurgeView['phase'],completedPaths:Number(row.completed_paths),totalPaths:Number(row.total_paths),updatedAt:String(row.updated_at),...(row.error?{error:String(row.error)}:{}),dataDir:resolve(dataDir),offlineRequired:true};}
export function readPurgeStatus(dataDir:string,projectId:string){const root=resolve(dataDir);assertPhysicalDataRoot(join(root,'state.db'));ensure(existsSync(join(root,'state.db'))&&lstatSync(join(root,'state.db')).isFile(),'NOT_FOUND','数据目录数据库不存在',404);const db=new DatabaseSync(join(root,'state.db'),{readOnly:true});try{loadDataPaths(db,root);return projectPurgeView(db,root,projectId);}finally{db.close();}}
function checkpoint(db:DatabaseSync){ensure(Number(db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get()!.busy)===0,'PURGE_DATABASE_BUSY','数据库仍有读事务，无法完成清理检查点');}
export function runOfflinePurge(dataDir:string,projectId:string,options:{offline:boolean;confirmName:string;resume?:boolean},hooks:{afterPath?:(completed:number)=>void}={}):ProjectPurgeView {
 ensure(options.offline,'PURGE_OFFLINE_REQUIRED','必须停止全部普通进程并显式使用 --offline');id(projectId);const root=resolve(dataDir);assertPhysicalDataRoot(join(root,'state.db'));ensure(existsSync(join(root,'state.db'))&&lstatSync(join(root,'state.db')).isFile(),'NOT_FOUND','数据目录数据库不存在',404);const db=new DatabaseSync(join(root,'state.db'));let permit:MaintenancePermit|undefined;
 try{db.exec('PRAGMA busy_timeout=5000');const paths=loadDataPaths(db,root);let request=db.prepare('SELECT * FROM project_purges WHERE project_id=?').get(projectId);ensure(request,'NOT_FOUND','没有永久清理请求',404);const operationId=String(request.id);
  permit=acquireMaintenance(db,root,operationId,options.resume===true,()=>{const current=db.prepare('SELECT * FROM project_purges WHERE project_id=?').get(projectId);ensure(current&&current.id===operationId,'PURGE_STATE_INVALID','清理请求身份已变化');ensure(current.state==='pending'||options.resume===true||current.state==='completed','PURGE_RESUME_REQUIRED','已开始或失败的计划必须显式 --resume');if(current.state!=='completed')ensure(current.name_hash===digest(options.confirmName),'PURGE_NAME_MISMATCH','确认名称不匹配');request=current;databaseShape(db);try{stateCheck(db,true);}catch(error){const e=asError(error);if(['BACKUP_BUSY','BACKUP_RECOVERY_PENDING'].includes(e.code))throw new DomainError('PURGE_BUSY','仍有执行、未知结果或未完成恢复，不能维护');throw error;}});const check=()=>assertMaintenance(db,root,permit!);
  if(request.state==='completed'){checkpoint(db);releaseMaintenance(db,root,permit);permit=undefined;return projectPurgeView(db,root,projectId);}
  const patch=(state:string,phase:string,fields:{completed?:number;plan?:Plan;error?:string}={})=>{check();const changed=db.prepare("UPDATE project_purges SET state=?,phase=?,completed_paths=COALESCE(?,completed_paths),total_paths=COALESCE(?,total_paths),plan=COALESCE(?,plan),error=?,updated_at=? WHERE id=? AND state<>'completed'").run(state,phase,fields.completed??null,fields.plan?.paths.length??null,fields.plan?JSON.stringify(fields.plan):null,fields.error??null,new Date().toISOString(),operationId);ensure(changed.changes===1,'PURGE_STATE_INVALID','终态清理请求不可倒退');};
  const existing:Plan|undefined=request.plan?JSON.parse(String(request.plan)):undefined;if(existing){validatePlan(existing,paths,projectId,operationId);protection(db,paths,projectId,existing);}
  patch('running','planning');const plan:Plan=existing??buildPlan(db,paths,projectId,operationId);validatePlan(plan,paths,projectId,operationId);if(!existing)patch('running','files',{plan});
  const protectedState=protection(db,paths,projectId,plan),known=new Set([...protectedState.targetRefs,...protectedState.otherRefs]);for(const entry of [...plan.paths,...plan.retained])if(CAS.includes(entry.key.split('/')[0]))known.add(entry.key.split('/').slice(0,2).join('/').replace(/\.source-modes\.json$/,''));unknownResources(paths,known,protectedState.all);

  for(let index=0;index<plan.paths.length;index++){check();validatePlan(plan,paths,projectId,String(request.id));const entry=plan.paths[index];patch('running','files',{completed:index});if(verifyEntry(paths,entry,true)){const physical=paths.physical('pi-data:/'+entry.key.split('/').map(encodeURIComponent).join('/'));if(entry.type==='directory')rmdirSync(physical);else{chmodSync(physical,0o600);unlinkSync(physical);}}patch('running','files',{completed:index+1});hooks.afterPath?.(index+1);}
  patch('running','records');check();db.exec('PRAGMA secure_delete=ON; BEGIN IMMEDIATE');try{
   db.prepare('DELETE FROM inbox WHERE event_id IN (SELECT id FROM events WHERE project_id=?)').run(projectId);db.prepare('DELETE FROM events WHERE project_id=?').run(projectId);
   db.prepare('DELETE FROM compute_gpu_claims WHERE id IN (SELECT id FROM compute_queue WHERE project_id=?)').run(projectId);db.prepare('DELETE FROM compute_queue WHERE project_id=?').run(projectId);db.prepare('DELETE FROM project_record_epochs WHERE project_id=?').run(projectId);db.prepare('DELETE FROM operations WHERE project_id=?').run(projectId);db.prepare("DELETE FROM records WHERE project_id=? OR kind='project' AND id=?").run(projectId,projectId);db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  patch('running','verify');ensure(!rows(db).some(r=>owned(r,projectId))&&!db.prepare('SELECT 1 FROM operations WHERE project_id=?').get(projectId),'PURGE_VERIFY_FAILED','仍有项目记录残留');for(const entry of plan.paths)ensure(!existsSync(paths.physical('pi-data:/'+entry.key.split('/').map(encodeURIComponent).join('/'))),'PURGE_VERIFY_FAILED','仍有计划资源残留');for(const entry of plan.retained)verifyEntry(paths,entry);
  check();checkpoint(db);db.exec('VACUUM');checkpoint(db);check();const completed=db.prepare("UPDATE project_purges SET state='completed',phase='completed',plan=NULL,name_hash=NULL,error=NULL,updated_at=? WHERE id=? AND state='running' AND phase='verify'").run(new Date().toISOString(),operationId);ensure(completed.changes===1,'PURGE_STATE_INVALID','清理终态提交条件已变化');checkpoint(db);releaseMaintenance(db,root,permit);permit=undefined;return projectPurgeView(db,root,projectId);
 }catch(error){if(permit){try{assertMaintenance(db,root,permit);const failure=asError(error);db.prepare("UPDATE project_purges SET state='failed',error=?,updated_at=? WHERE project_id=? AND state<>'completed'").run(failure.code,new Date().toISOString(),projectId);releaseMaintenance(db,root,permit);permit=undefined;}catch{}}throw error;}finally{db.close();}
}
