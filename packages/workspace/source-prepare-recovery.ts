import {createHmac,randomUUID} from 'node:crypto';
import {closeSync,fsyncSync,lstatSync,mkdirSync,openSync,readdirSync,renameSync,rmdirSync,unlinkSync,writeFileSync} from 'node:fs';
import {basename,dirname,join} from 'node:path';
import {ensure} from '../domain/errors.js';
import type {Row,Session,SourceRevision} from '../domain/types.js';
import {digest,type Store} from '../storage/store.js';
import {assertPhysicalDataRoot} from '../storage/data-paths.js';
import {readStableFile} from './stable-file.js';
import {setSourceModes,sourceManifest} from './files.js';

const conflict=(ok:unknown)=>ensure(ok,'SOURCE_PREPARE_RECOVERY_CONFLICT','源码准备恢复身份或内容已改变；保留工作区与恢复记录，不能覆盖本地修改',409);
const identity=(path:string)=>{const stat=lstatSync(path);conflict(stat.isDirectory()&&!stat.isSymbolicLink());return `${stat.dev}:${stat.ino}:${stat.birthtimeMs}`;};
function exists(path:string):boolean {try{lstatSync(path);return true;}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return false;throw error;}}
function bytes(path:string):string|null {
 if(!exists(path))return null;
 const stat=lstatSync(path);conflict(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1);
 // The signed envelope can contain two base64 mode maps, each bounded at 8 MiB.
 return readStableFile(dirname(path),basename(path),32*1024*1024).toString('base64');
}
// Include every entry, even excluded/hidden files, so recovery never overlooks user additions.
function tree(root:string):string {
 const entries:unknown[]=[];
 const walk=(dir:string,relative:string)=>{entries.push([relative,identity(dir)]);for(const name of readdirSync(dir).sort()){
  const path=join(dir,name),key=relative+'/'+name,stat=lstatSync(path);conflict(!stat.isSymbolicLink());
  if(stat.isDirectory())walk(path,key);else {conflict(stat.isFile()&&stat.nlink===1);const data=readStableFile(dir,name,64*1024*1024);entries.push([key,stat.dev,stat.ino,stat.birthtimeMs,stat.mtimeMs,stat.mode,data.length,digest(data)]);}
 }};walk(root,'');return digest(entries);
}
type Journal={format:1;projectId:string;sessionId:string;sourceId:string;sourceDigest:string;parent:string;empty:string;staged:string;backup:string;tree:string;beforeModes:string|null;afterModes:string|null};
function durable(path:string,data:string|Buffer,exclusive=false) {
 const temporary=exclusive?path:path+'.tmp-'+randomUUID(),fd=openSync(temporary,'wx',0o600);
 try{writeFileSync(fd,data);fsyncSync(fd);}finally{closeSync(fd);}
 if(!exclusive)renameSync(temporary,path);
}
/** Receipt replay settles housekeeping only; a changed binding keeps its recovery data. */
export function settleSourcePreparationReceipt(store:Store,projectId:string,sessionId:string,receipt:{sessionId:string;snapshotId:string;sourceDigest:string}) {
 store.transaction(()=>{
  conflict(receipt.sessionId===sessionId);
  const session=store.get<Session>('session',sessionId,projectId);
  if(session.sourceRevisionId!==receipt.snapshotId||session.sourceDigest!==receipt.sourceDigest||!exists(store.paths.physical(session.workspace)+'.source-prepare-pending'))return;
  const source=store.get<SourceRevision>('source-revision',receipt.snapshotId,projectId);conflict(source.sourceDigest===receipt.sourceDigest);
  prepareSourceWorkspace(store,session,source,()=>conflict(false));
 });
}
/** SQLite's writer lock serializes this authenticated, fixed-identity directory swap. */
export function prepareSourceWorkspace(store:Store,s:Row<Session>,r:Row<SourceRevision>,copy:(staged:string)=>void) {
 const workspace=store.paths.physical(s.workspace),parent=dirname(workspace),marker=workspace+'.source-prepare-pending',modes=workspace+'.source-modes.json';
 assertPhysicalDataRoot(parent);
 const key=String(store.db.prepare('SELECT key FROM text_write_key').get()!.key);
 const sign=(data:string)=>createHmac('sha256',key).update('source-prepare:'+data).digest('hex');
 let journal:Journal;
 if(exists(marker)) {
  try {
   const stat=lstatSync(marker);conflict(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&(process.platform==='win32'||(stat.mode&0o077)===0));
   const envelope=JSON.parse(Buffer.from(bytes(marker)!,'base64').toString('utf8'));conflict(typeof envelope.data==='string'&&envelope.mac===sign(envelope.data));journal=JSON.parse(envelope.data);
   conflict(journal.format===1&&journal.projectId===s.projectId&&journal.sessionId===s.id&&journal.sourceId===r.id&&journal.sourceDigest===r.sourceDigest&&journal.parent===identity(parent));
   conflict(/^source-[a-f0-9-]{36}$/.test(journal.staged)&&journal.backup.startsWith(basename(workspace)+'-empty-')&&basename(journal.backup)===journal.backup);
  }catch {conflict(false);throw new Error('unreachable');}
 }else {
  if(s.sourceRevisionId===r.id)return;
  ensure(!s.sourceRevisionId&&readdirSync(workspace).length===0,'WORKSPACE_NOT_EMPTY','工作区非空或已经绑定来源，不能覆盖本地修改');
  sourceManifest(workspace);
  const empty=identity(workspace),staged='source-'+randomUUID(),backup=basename(workspace)+'-empty-'+randomUUID();
  mkdirSync(join(parent,staged),{mode:0o700});copy(join(parent,staged));setSourceModes(join(parent,staged),r.snapshot.files);
  journal={format:1,projectId:s.projectId!,sessionId:s.id,sourceId:r.id,sourceDigest:r.sourceDigest,parent:identity(parent),empty,staged,backup,tree:tree(join(parent,staged)),beforeModes:bytes(modes),afterModes:bytes(join(parent,staged)+'.source-modes.json')};
  const data=JSON.stringify(journal);durable(marker,JSON.stringify({data,mac:sign(data)}),true);
 }
 const staged=join(parent,journal.staged),backup=join(parent,journal.backup),markerBytes=bytes(marker);
 const empty=(path:string)=>conflict(identity(path)===journal.empty&&readdirSync(path).length===0);
 const cleanup=()=>{
  if(!exists(marker))return;
  const current=store.get<Session>('session',s.id,s.projectId!);
  conflict(current.sourceRevisionId===r.id&&current.sourceDigest===r.sourceDigest&&current.workspace===s.workspace);
  conflict(bytes(marker)===markerBytes);
  conflict(identity(parent)===journal.parent);
  if(exists(backup)){empty(backup);rmdirSync(backup);}
  conflict(!exists(staged));
  const stageModes=staged+'.source-modes.json';if(exists(stageModes)){conflict(bytes(stageModes)===journal.afterModes);unlinkSync(stageModes);}
  unlinkSync(marker);
 };
 const afterCommit=()=>store.afterCommit(()=>store.transaction(cleanup));
 if(s.sourceRevisionId===r.id){afterCommit();return;}
 conflict(!s.sourceRevisionId);
 try {
  conflict(bytes(modes)===journal.beforeModes||bytes(modes)===journal.afterModes);
  if(exists(staged)){
   conflict(tree(staged)===journal.tree);
   if(exists(workspace)){empty(workspace);conflict(!exists(backup));}else empty(backup);
  }else {empty(backup);conflict(tree(workspace)===journal.tree);}
 }catch {conflict(false);}
 store.onRollback(()=>{
  conflict(identity(parent)===journal.parent);
  conflict(bytes(modes)===journal.beforeModes||bytes(modes)===journal.afterModes);
  if(!exists(staged)){conflict(tree(workspace)===journal.tree);renameSync(workspace,staged);}
  if(exists(backup)){empty(backup);conflict(!exists(workspace));renameSync(backup,workspace);}
  if(journal.beforeModes===null){if(exists(modes))unlinkSync(modes);}else durable(modes,Buffer.from(journal.beforeModes,'base64'));
 });
 if(exists(staged)) {
  if(exists(workspace))renameSync(workspace,backup);
  renameSync(staged,workspace);
 }
 conflict(tree(workspace)===journal.tree);
 if(journal.afterModes!==null)durable(modes,Buffer.from(journal.afterModes,'base64'));
 afterCommit();
}
