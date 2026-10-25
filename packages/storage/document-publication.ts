import {existsSync,lstatSync,unlinkSync} from 'node:fs';
import type {DatabaseSync} from 'node:sqlite';
import {ensure} from '../domain/errors.js';
import type {DataPaths} from './data-paths.js';
import type {ArtifactBlob} from './artifact-blob.js';
import {verifyStreamedBlob} from './streamed-blob.js';
import {assertMaintenance,type MaintenancePermit} from './process-coordination.js';

export interface DocumentBlobPublication {
 format:'document-blob-publication-v1';stagingId:string;
 blobs:Array<ArtifactBlob&{stage:{path:string;dev:number;ino:number}}>;
}
/** Missing destinations mean not yet linked; existing destinations still require ordinary CAS verification. */
export function documentPublication(paths:DataPaths,projectId:unknown,value:Record<string,unknown>):DocumentBlobPublication {
 ensure(typeof projectId==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(projectId)&&value.projectId===projectId&&value.kind==='document-blob-publication'&&value.format==='document-blob-publication-v1'&&typeof value.stagingId==='string'&&/^[0-9a-f-]{36}$/.test(value.stagingId)&&value.id===value.stagingId,'DOCUMENT_PUBLICATION_INVALID','原件发布归属记录无效',409);
 ensure(Object.keys(value).every(k=>['id','kind','projectId','version','createdAt','updatedAt','format','stagingId','blobs'].includes(k))&&Array.isArray(value.blobs)&&value.blobs.length===2,'DOCUMENT_PUBLICATION_INVALID','原件发布归属字段无效',409);
 for(let i=0;i<value.blobs.length;i++){
  const b=value.blobs[i] as DocumentBlobPublication['blobs'][number];
  ensure(b&&Object.keys(b).sort().join(',')==='blobPath,digest,size,stage'&&typeof b.digest==='string'&&/^[a-f0-9]{64}$/.test(b.digest)&&Number.isSafeInteger(b.size)&&(b.size>0||i===0&&b.size===0&&b.digest==='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')&&typeof b.blobPath==='string'&&paths.key(b.blobPath)==='artifacts/'+b.digest,'DOCUMENT_PUBLICATION_INVALID','原件发布CAS引用无效',409);
  ensure(b.stage&&Object.keys(b.stage).sort().join(',')==='dev,ino,path'&&Number.isInteger(b.stage.dev)&&b.stage.dev>=0&&Number.isInteger(b.stage.ino)&&b.stage.ino>=0&&typeof b.stage.path==='string'&&paths.key(b.stage.path)===`projects/${projectId}/document-upload-staging/${value.stagingId}/${i===0?'source':'index'}`,'DOCUMENT_PUBLICATION_INVALID','原件发布暂存范围无效',409);
 }
 return value as unknown as DocumentBlobPublication;
}
export function existingPublicationBlobs(paths:DataPaths,projectId:unknown,value:Record<string,unknown>) {
 return documentPublication(paths,projectId,value).blobs.filter(blob=>{const file=paths.physical(blob.blobPath);if(!existsSync(file))return false;verifyStreamedBlob({paths},blob);return true;});
}
/** Offline recovery removes only an intent-bound redundant internal link, never a CAS destination. */
export function settleDocumentPublicationLinks(db:DatabaseSync,paths:DataPaths,permit:MaintenancePermit) {
 assertMaintenance(db,paths.dataDir,permit);
 for(const row of db.prepare("SELECT id,project_id,data FROM records WHERE kind='document-blob-publication'").all()){
  const value=JSON.parse(String(row.data));ensure(value.id===row.id,'DOCUMENT_PUBLICATION_INVALID','原件发布记录标识与数据库不一致',409);
  for(const blob of existingPublicationBlobs(paths,row.project_id,value)){
   const stage=paths.physical(blob.stage.path),target=paths.physical(blob.blobPath);if(!existsSync(stage))continue;
   const s=lstatSync(stage),cas=lstatSync(target);ensure(s.isFile()&&!s.isSymbolicLink(),'DOCUMENT_PUBLICATION_INVALID','原件发布暂存文件类型改变',409);
   // Backup relocation creates independent copies; these are not links to recover.
   if(s.dev!==cas.dev||s.ino!==cas.ino)continue;
   ensure(s.dev===blob.stage.dev&&s.ino===blob.stage.ino&&s.size===blob.size,'DOCUMENT_PUBLICATION_INVALID','原件发布暂存身份改变',409);
   assertMaintenance(db,paths.dataDir,permit);const before=lstatSync(stage),named=lstatSync(target);
   ensure(before.dev===s.dev&&before.ino===s.ino&&before.size===s.size&&before.mtimeMs===s.mtimeMs&&before.ctimeMs===s.ctimeMs&&named.dev===s.dev&&named.ino===s.ino,'DOCUMENT_PUBLICATION_INVALID','原件发布恢复期间文件已改变',409);
   unlinkSync(stage);
  }
 }
}
