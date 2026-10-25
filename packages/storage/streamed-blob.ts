import {createHash,randomUUID} from 'node:crypto';
import {open,link,unlink,chmod,mkdir,rmdir} from 'node:fs/promises';
import {openSync,closeSync,readSync,fstatSync,lstatSync,constants,type Stats} from 'node:fs';
import type {FileHandle} from 'node:fs/promises';
import {join} from 'node:path';
import {ensure,DomainError} from '../domain/errors.js';
import {integer} from '../contracts/validation.js';
import type {Store} from './store.js';
import type {ArtifactBlob} from './artifact-blob.js';
import {TEXT_PAGE_BYTES} from './file-policy.js';
import type {DocumentBlobPublication} from './document-publication.js';
import type {TextIndexPublication} from './text-index-publication.js';

export const TEXT_BLOCK_BYTES=1024*1024;
const HASH_BYTES=32,ENTRY_BYTES=48,IO_BYTES=64*1024;
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest();
export interface FixedTextIndex {
 format:'utf8-block-tree-v1';sourceDigest:string;sourceSize:number;blockBytes:number;blockCount:number;leafCount:number;rootDigest:string;utf16Length:number;
}
function validBlob(store:Pick<Store,'paths'>,blob:ArtifactBlob) {
 ensure(/^[a-f0-9]{64}$/.test(blob.digest)&&Number.isSafeInteger(blob.size)&&blob.size>=0&&store.paths.key(blob.blobPath)==='artifacts/'+blob.digest,'ARTIFACT_CORRUPTED','固定原件引用无效',409);
 return store.paths.physical(blob.blobPath);
}
function readAt(fd:number,length:number,position:number) {
 const bytes=Buffer.allocUnsafe(length);let offset=0;
 while(offset<length){const count=readSync(fd,bytes,offset,length-offset,position+offset);ensure(count>0,'ARTIFACT_CORRUPTED','固定原件被截断',409);offset+=count;}
 return bytes;
}
function checkedOpen(store:Pick<Store,'paths'>,blob:ArtifactBlob) {
 const path=validBlob(store,blob),before=lstatSync(path);ensure(before.isFile()&&!before.isSymbolicLink()&&before.size===blob.size,'ARTIFACT_CORRUPTED','固定原件大小或类型改变',409);
 const fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));try{sameFile(before,fstatSync(fd));return {fd,before};}catch(error){closeSync(fd);throw error;}
}
function sameFile(before:Stats,after:Stats) {
 ensure(after.isFile()&&!after.isSymbolicLink()&&after.dev===before.dev&&after.ino===before.ino&&after.size===before.size&&after.mtimeMs===before.mtimeMs&&after.ctimeMs===before.ctimeMs,'ARTIFACT_CHANGED','固定原件在读取期间被替换或改变',409);
}
function unchanged(store:Pick<Store,'paths'>,blob:ArtifactBlob,file:{fd:number;before:Stats}) {
 sameFile(file.before,fstatSync(file.fd));sameFile(file.before,lstatSync(validBlob(store,blob)));
}
/** Full integrity boundary, bounded memory; never use metadata as a hash substitute. */
export function verifyStreamedBlob(store:Pick<Store,'paths'>,blob:ArtifactBlob,validate?:()=>void) {
 const file=checkedOpen(store,blob);try{const hash=createHash('sha256');for(let position=0;position<blob.size;position+=IO_BYTES){validate?.();hash.update(readAt(file.fd,Math.min(IO_BYTES,blob.size-position),position));}validate?.();ensure(hash.digest('hex')===blob.digest,'ARTIFACT_CORRUPTED','原件完整摘要校验失败',409);unchanged(store,blob,file);}finally{closeSync(file.fd);}
}
async function writeAt(file:FileHandle,bytes:Uint8Array,position:number) {
 let offset=0;while(offset<bytes.length){const result=await file.write(bytes,offset,bytes.length-offset,position+offset);ensure(result.bytesWritten>0,'STORAGE_WRITE_FAILED','写入原件失败',500);offset+=result.bytesWritten;}
}
async function readAsync(file:FileHandle,length:number,position:number) {
 const bytes=Buffer.allocUnsafe(length);let offset=0;while(offset<length){const result=await file.read(bytes,offset,length-offset,position+offset);ensure(result.bytesRead>0,'ARTIFACT_CORRUPTED','暂存原件被截断',409);offset+=result.bytesRead;}return bytes;
}
async function hashFile(file:FileHandle,size:number,validate:()=>void) {
 const hash=createHash('sha256');for(let offset=0;offset<size;offset+=IO_BYTES){validate();hash.update(await readAsync(file,Math.min(IO_BYTES,size-offset),offset));}
 ensure((await file.stat()).size===size,'ARTIFACT_CORRUPTED','暂存原件大小改变',409);return hash.digest('hex');
}
async function publishFile(store:Store,blob:DocumentBlobPublication['blobs'][number],validate:()=>void) {
 const path=store.paths.physical(blob.stage.path),stage=lstatSync(path),target=validBlob(store,blob);validate();ensure(stage.isFile()&&!stage.isSymbolicLink()&&stage.dev===blob.stage.dev&&stage.ino===blob.stage.ino&&stage.size===blob.size,'DOCUMENT_PUBLICATION_INVALID','待发布暂存原件身份改变',409);await chmod(path,0o444);validate();
 try{await link(path,target);}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
 validate();
 // Also hash the selected CAS file on deduplication; a retry must not repair or overwrite old bytes.
 const before=lstatSync(validBlob(store,blob));ensure(before.isFile()&&!before.isSymbolicLink()&&before.size===blob.size,'ARTIFACT_CORRUPTED','产物库类型或大小改变',409);
 const file=await open(validBlob(store,blob),constants.O_RDONLY|(constants.O_NOFOLLOW??0));try{sameFile(before,await file.stat());ensure(await hashFile(file,blob.size,validate)===blob.digest,'ARTIFACT_CORRUPTED','产物库完整摘要校验失败',409);sameFile(before,await file.stat());sameFile(before,lstatSync(validBlob(store,blob)));}finally{await file.close();}
}
/** Private project-owned staging only. The caller must persist ownership before publishing CAS files. */
async function prepareText(store:Store,projectId:string,input:AsyncIterable<Uint8Array>,maxBytes:number,validate:()=>void,fixedSource?:ArtifactBlob) {
 const stagingId=randomUUID(),directory=store.paths.physical(join(store.paths.dataDir,'projects',projectId,fixedSource?'text-index-staging':'document-upload-staging',stagingId));await mkdir(directory,{recursive:true,mode:0o700});
 const cas=store.paths.physical(join(store.paths.dataDir,'artifacts'));await mkdir(cas,{recursive:true,mode:0o700});
 const paths=['source','entries','index'].map(name=>join(directory,name));
 let source:FileHandle|undefined,entries:FileHandle|undefined,index:FileHandle|undefined,prepared=false;
 const dispose=async()=>{for(const path of paths){try{await unlink(store.paths.physical(path));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}try{await rmdir(store.paths.physical(directory));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}};
 try{
  if(!fixedSource)source=await open(paths[0],'wx+',0o600);entries=await open(paths[1],'wx+',0o600);
  const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}),fullHash=createHash('sha256');let blockHash=createHash('sha256'),size=0,blockSize=0,blockCount=0,utf16Length=0,blockUtf16Start=0;
  const finishBlock=async()=>{const entry=Buffer.alloc(ENTRY_BYTES);blockHash.digest().copy(entry);entry.writeBigUInt64BE(BigInt(blockUtf16Start),32);entry.writeBigUInt64BE(BigInt(utf16Length),40);await writeAt(entries!,entry,blockCount*ENTRY_BYTES);blockCount++;blockSize=0;blockHash=createHash('sha256');blockUtf16Start=utf16Length;};
  for await(const chunk of input){
   validate();ensure(chunk instanceof Uint8Array,'INVALID_INPUT','上传必须为二进制字节流',400);ensure(chunk.byteLength<=maxBytes-size,'ARTIFACT_TOO_LARGE',`原始文本或数据文件最多 ${maxBytes} bytes`,413);
   for(let offset=0;offset<chunk.byteLength;){
    validate();const length=Math.min(IO_BYTES,TEXT_BLOCK_BYTES-blockSize,chunk.byteLength-offset),bytes=chunk.subarray(offset,offset+length);
    ensure(!bytes.includes(0),'DOCUMENT_FORMAT_INVALID','文本含无效字符',400);
    try{utf16Length+=decoder.decode(bytes,{stream:true}).length;}catch{ensure(false,'DOCUMENT_FORMAT_INVALID','文本必须是有效 UTF-8',400);}
    fullHash.update(bytes);blockHash.update(bytes);if(source)await writeAt(source,bytes,size);size+=length;blockSize+=length;offset+=length;
    if(blockSize===TEXT_BLOCK_BYTES)await finishBlock();
   }
  }
  validate();try{utf16Length+=decoder.decode().length;}catch{ensure(false,'DOCUMENT_FORMAT_INVALID','文本必须是有效 UTF-8',400);}
  ensure(size>0||!!fixedSource,'DOCUMENT_FORMAT_INVALID','原件不能为空',400);if(blockSize)await finishBlock();
  const sourceDigest=fullHash.digest('hex');if(source){await source.sync();ensure(await hashFile(source,size,validate)===sourceDigest,'ARTIFACT_CORRUPTED','暂存原件摘要改变',409);}else ensure(fixedSource?.digest===sourceDigest&&fixedSource.size===size,'ARTIFACT_CORRUPTED','固定原件完整摘要改变',409);
  let leafCount=1;while(leafCount<blockCount)leafCount*=2;
  const nodesBytes=(2*leafCount-1)*HASH_BYTES,indexSize=nodesBytes+blockCount*ENTRY_BYTES;index=await open(paths[2],'wx+',0o600);
  const empty=sha(Buffer.alloc(0));
  for(let i=0;i<leafCount;i++){validate();if(i<blockCount){const entry=await readAsync(entries,ENTRY_BYTES,i*ENTRY_BYTES);await writeAt(index,entry,nodesBytes+i*ENTRY_BYTES);await writeAt(index,sha(entry),(leafCount-1+i)*HASH_BYTES);}else await writeAt(index,empty,(leafCount-1+i)*HASH_BYTES);}
  for(let i=leafCount-2;i>=0;i--){validate();await writeAt(index,sha(await readAsync(index,2*HASH_BYTES,(2*i+1)*HASH_BYTES)),i*HASH_BYTES);}
  const rootDigest=(await readAsync(index,HASH_BYTES,0)).toString('hex');await index.sync();const indexDigest=await hashFile(index,indexSize,validate);
  const blob={blobPath:store.paths.reference(join(cas,sourceDigest)),digest:sourceDigest,size},indexBlob={blobPath:store.paths.reference(join(cas,indexDigest)),digest:indexDigest,size:indexSize};
  const metadata:FixedTextIndex={format:'utf8-block-tree-v1',sourceDigest,sourceSize:size,blockBytes:TEXT_BLOCK_BYTES,blockCount,leafCount,rootDigest,utf16Length};
  const publication={stagingId,blobs:(fixedSource?[indexBlob]:[blob,indexBlob]).map((b,i)=>{const path=paths[fixedSource||i!==0?2:0],s=lstatSync(path);return {...b,stage:{path:store.paths.reference(path),dev:s.dev,ino:s.ino}};})};
  await source?.close();source=undefined;await index.close();index=undefined;
  validate();prepared=true;return {blob,indexBlob,index:metadata,publication,dispose};
 }finally{
  await source?.close();await entries?.close();await index?.close();
  if(!prepared)await dispose();
 }
}
export async function prepareStreamedText(store:Store,projectId:string,input:AsyncIterable<Uint8Array>,maxBytes:number,validate:()=>void) {
 const prepared=await prepareText(store,projectId,input,maxBytes,validate);
 return {...prepared,publication:{...prepared.publication,format:'document-blob-publication-v1' as const}};
}
/** Index an already-owned fixed source: only entries/index are staged, never the source bytes. */
export async function prepareFixedTextIndex(store:Store,projectId:string,artifactId:string,source:ArtifactBlob,maxBytes:number,validate:()=>void,checkpoint:()=>void=validate) {
 async function* input(){
  const path=validBlob(store,source),before=lstatSync(path);ensure(before.isFile()&&!before.isSymbolicLink()&&before.size===source.size,'ARTIFACT_CORRUPTED','固定原件大小或类型改变',409);
  const file=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));try{sameFile(before,await file.stat());for(let cursor=0;cursor<source.size;cursor+=IO_BYTES){if(cursor%TEXT_BLOCK_BYTES===0)checkpoint();validate();yield await readAsync(file,Math.min(IO_BYTES,source.size-cursor),cursor);}checkpoint();sameFile(before,await file.stat());sameFile(before,lstatSync(path));}finally{await file.close();}
 }
 const prepared=await prepareText(store,projectId,input(),maxBytes,validate,source);
 const publication:TextIndexPublication={...prepared.publication,format:'text-index-publication-v1',source:{artifactId,...source}};
 return {...prepared,publication};
}
export async function publishFixedTextIndex(store:Store,publication:TextIndexPublication,validate:()=>void){
 validate();try{await publishFile(store,publication.blobs[0],validate);}catch(error){
  if(!(error instanceof DomainError)||error.code!=='ARTIFACT_CHANGED')throw error;
  // Another publisher may remove its redundant stage link; re-prove the entire current CAS once.
  validate();verifyStreamedBlob(store,publication.blobs[0],validate);
 }validate();
}
export async function publishStreamedText(store:Store,publication:DocumentBlobPublication,validate:()=>void) {
 for(const blob of publication.blobs){validate();await publishFile(store,blob,validate);}validate();
}
function validateIndex(source:ArtifactBlob,indexBlob:ArtifactBlob,index:FixedTextIndex) {
 ensure(index.format==='utf8-block-tree-v1'&&index.sourceDigest===source.digest&&index.sourceSize===source.size&&index.blockBytes===TEXT_BLOCK_BYTES&&Number.isSafeInteger(index.blockCount)&&index.blockCount===Math.ceil(source.size/TEXT_BLOCK_BYTES)&&index.blockCount>=0,'ARTIFACT_CORRUPTED','文本索引来源绑定失效',409);
 let leafCount=1;while(leafCount<index.blockCount)leafCount*=2;
 ensure(index.leafCount===leafCount&&indexBlob.size===(2*leafCount-1)*HASH_BYTES+index.blockCount*ENTRY_BYTES&&/^[a-f0-9]{64}$/.test(index.rootDigest)&&Number.isSafeInteger(index.utf16Length)&&(source.size===0?index.utf16Length===0:index.utf16Length>0)&&index.utf16Length<=source.size,'ARTIFACT_CORRUPTED','文本索引结构失效',409);
}
/** Merkle proofs authenticate only touched block entries, keeping index I/O bounded even for large configured limits. */
export function readStreamedText(store:Store,source:ArtifactBlob,indexBlob:ArtifactBlob,index:FixedTextIndex,cursor:number,limit:number,utf16=false) {
 validateIndex(source,indexBlob,index);integer(cursor,'cursor',0,source.size);integer(limit,'limit',4,TEXT_PAGE_BYTES);
 const sourceFile=checkedOpen(store,source),sourceFd=sourceFile.fd;let indexFile:ReturnType<typeof checkedOpen>|undefined;
 try{
  indexFile=checkedOpen(store,indexBlob);const indexFd=indexFile.fd;ensure(readAt(indexFd,HASH_BYTES,0).toString('hex')===index.rootDigest,'ARTIFACT_CORRUPTED','文本索引根改变',409);
  if(cursor===source.size){unchanged(store,source,sourceFile);unchanged(store,indexBlob,indexFile);return {content:'',cursor,end:cursor,totalBytes:source.size,complete:true,...(utf16?{utf16Start:index.utf16Length,utf16End:index.utf16Length}:{})};}
  // One preceding authenticated block supplies any UTF-8 character pending at the checkpoint.
  const wantedEnd=Math.min(cursor+limit,source.size),first=Math.max(0,Math.floor(cursor/TEXT_BLOCK_BYTES)-(utf16?1:0)),last=Math.floor(Math.min(wantedEnd,source.size-1)/TEXT_BLOCK_BYTES),chunks:Buffer[]=[];let checkpoint=0;
  for(let block=first;block<=last;block++){
   const entry=readAt(indexFd,ENTRY_BYTES,(2*index.leafCount-1)*HASH_BYTES+block*ENTRY_BYTES);let position=index.leafCount-1+block,proof=sha(entry);
   while(position>0){const isLeft=position%2===1,sibling=readAt(indexFd,HASH_BYTES,(isLeft?position+1:position-1)*HASH_BYTES);proof=sha(isLeft?Buffer.concat([proof,sibling]):Buffer.concat([sibling,proof]));position=Math.floor((position-1)/2);}
   ensure(proof.toString('hex')===index.rootDigest,'ARTIFACT_CORRUPTED','文本索引块校验失败',409);
   if(block===Math.floor(cursor/TEXT_BLOCK_BYTES))checkpoint=Number(entry.readBigUInt64BE(32));
   const bytes=readAt(sourceFd,Math.min(TEXT_BLOCK_BYTES,source.size-block*TEXT_BLOCK_BYTES),block*TEXT_BLOCK_BYTES);ensure(sha(bytes).equals(entry.subarray(0,HASH_BYTES)),'ARTIFACT_CORRUPTED','原件块摘要改变',409);chunks.push(bytes);
  }
  const bytes=Buffer.concat(chunks),start=cursor-first*TEXT_BLOCK_BYTES;ensure((bytes[start]&0xc0)!==0x80,'DOCUMENT_CURSOR_INVALID','cursor 必须位于完整 UTF-8 字符边界',400);
  let end=wantedEnd-first*TEXT_BLOCK_BYTES;while(wantedEnd<source.size&&(bytes[end]&0xc0)===0x80)end--;
  let content:string;try{content=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes.subarray(start,end));}catch{ensure(false,'ARTIFACT_CORRUPTED','原件文本编码改变',409);}
  let utf16Start:number|undefined;
  if(utf16){let prefix=(Math.floor(cursor/TEXT_BLOCK_BYTES)-first)*TEXT_BLOCK_BYTES;while(prefix>0&&(bytes[prefix]&0xc0)===0x80)prefix--;
   // The checkpoint excludes a split character; decode it from its authenticated leading byte.
   try{utf16Start=checkpoint+new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes.subarray(prefix,start)).length;}catch{ensure(false,'ARTIFACT_CORRUPTED','文本位置编码改变',409);}
  }
  unchanged(store,source,sourceFile);unchanged(store,indexBlob,indexFile);
  return {content:content!,cursor,end:first*TEXT_BLOCK_BYTES+end,totalBytes:source.size,complete:first*TEXT_BLOCK_BYTES+end===source.size,...(utf16?{utf16Start:utf16Start!,utf16End:utf16Start!+content!.length}:{})};
 }finally{closeSync(sourceFd);if(indexFile!==undefined)closeSync(indexFile.fd);}
}
