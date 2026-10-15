import {existsSync,mkdirSync,readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {ensure} from '../domain/errors.js';
import {digest,type Store} from './store.js';
export interface ArtifactBlob {blobPath:string;digest:string;size:number;}
/** Host-only CAS staging; publishing records is the caller's transaction. */
export function prepareArtifactBlob(store:Store,bytes:Buffer):ArtifactBlob {
 const hash=digest(bytes),physical=store.paths.physical(join(store.paths.dataDir,'artifacts',hash));
 mkdirSync(join(store.paths.dataDir,'artifacts'),{recursive:true,mode:0o700});
 if(!existsSync(physical))writeFileSync(physical,bytes,{mode:0o444,flag:'wx'});
 else ensure(lstatSync(physical).isFile()&&digest(readFileSync(physical))===hash,'ARTIFACT_CORRUPTED','产物库校验失败',500);
 return {blobPath:store.paths.reference(physical),digest:hash,size:bytes.length};
}
export function readArtifactBlob(store:Store,file:ArtifactBlob,maxBytes:number):Buffer {
 ensure(/^[a-f0-9]{64}$/.test(file.digest)&&Number.isSafeInteger(file.size)&&file.size>=0&&file.size<=maxBytes&&store.paths.key(file.blobPath)==='artifacts/'+file.digest,'ARTIFACT_CORRUPTED','模板资源引用无效',409);
 const path=store.paths.physical(file.blobPath),info=lstatSync(path);
 ensure(info.isFile()&&!info.isSymbolicLink()&&info.size===file.size,'ARTIFACT_CORRUPTED','模板资源大小改变',409);
 const bytes=readFileSync(path);ensure(bytes.length===file.size&&digest(bytes)===file.digest,'ARTIFACT_CORRUPTED','模板资源内容改变',409);return bytes;
}
