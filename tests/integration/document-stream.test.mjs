import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readdirSync,chmodSync,openSync,writeSync,closeSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
const hash=b=>createHash('sha256').update(b).digest('hex');
const fixture=()=>{const dir=mkdtempSync(join(tmpdir(),'pi-stream-doc-')),app=new ResearchApp(dir,process.cwd());return {dir,app,p:app.projects.create(USER,{name:'Stream fixture',template:'empty'})};};
async function* parts(bytes,size=7){for(let i=0;i<bytes.length;i+=size)yield bytes.subarray(i,i+size);}
const metadata={title:'Original data.csv',mediaType:'text/csv'};
function supported(app){assert.equal(typeof app.documents.importStream,'function','owner streamed import must be available');assert.equal(typeof app.documents.readText,'function','fixed-source bounded reader must be available');}

test('streamed owner import preserves BOM, Chinese, emoji and an unbroken line across byte pages and reopen',async()=>{
 const f=fixture();let app=f.app;
 try{
  supported(app);const bytes=Buffer.from('\uFEFF中文🙂\r\n'+ '超长🙂'.repeat(170000)+'尾');
  const d=await app.documents.importStream(USER,f.p.id,metadata,parts(bytes,65537),'unicode');
  assert.equal(d.original.digest,hash(bytes));assert.equal(d.original.size,bytes.length);
  const fixed=app.store.get('document-text-source',d.id),indexArtifact=app.store.get('artifact',fixed.indexArtifact.artifactId),indexBytes=readFileSync(app.store.paths.physical(indexArtifact.path));assert.equal(fixed.index.utf16Length,bytes.toString('utf8').length);
  const entriesOffset=(fixed.index.leafCount*2-1)*32;
  for(let block=0;block<fixed.index.blockCount;block++){const end=Math.min(bytes.length,(block+1)*1048576),decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}),completed=decoder.decode(bytes.subarray(0,end),{stream:true}).length;assert.equal(Number(indexBytes.readBigUInt64BE(entriesOffset+block*48+40)),completed);}
  const first=app.documents.readText(USER,f.p.id,d.id,{sourceDigest:d.original.digest,limit:65536});
  assert.equal(first.cursorUnit,'utf8-byte');assert.equal(first.content.charCodeAt(0),0xfeff);assert.equal(first.end,Buffer.byteLength(first.content));assert.equal(first.complete,false);
  assert.throws(()=>app.documents.readText(USER,f.p.id,d.id,{sourceDigest:d.original.digest,cursor:1}),{code:'DOCUMENT_CURSOR_INVALID'});
  assert.throws(()=>app.documents.readText(USER,f.p.id,d.id,{sourceDigest:'0'.repeat(64)}),{code:'DOCUMENT_SOURCE_CHANGED'});
  app.close();app=new ResearchApp(f.dir,process.cwd());let cursor=first.end;const result=[Buffer.from(first.content)];
  while(cursor<bytes.length){const page=app.documents.readText(USER,f.p.id,d.id,{sourceDigest:d.original.digest,cursor,limit:4097});assert.equal(page.cursor,cursor);assert.ok(page.end>cursor&&page.end-cursor<=4097);assert.equal(page.complete,page.end===bytes.length);assert.equal(page.totalBytes,bytes.length);result.push(Buffer.from(page.content));cursor=page.end;}
  assert.deepEqual(Buffer.concat(result),bytes);
  const eof=app.documents.readText(USER,f.p.id,d.id,{sourceDigest:d.original.digest,cursor:bytes.length});assert.equal(eof.content,'');assert.equal(eof.complete,true);
 }finally{app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('stream failures and invalid UTF8 never publish originals, and retries consume and validate all supplied bytes',async()=>{
 const f=fixture();try{supported(f.app);const {app,p}=f,bytes=Buffer.from('valid data🙂');
  const d=await app.documents.importStream(USER,p.id,metadata,parts(bytes),'same');
  assert.equal((await app.documents.importStream(USER,p.id,metadata,parts(bytes),'same')).id,d.id);
  await assert.rejects(()=>app.documents.importStream(USER,p.id,metadata,parts(Buffer.from('different')),'same'),{code:'IDEMPOTENCY_CONFLICT'});
  for(const bad of [Buffer.from([0xc0,0xaf]),Buffer.from([0xf0,0x9f,0x99]),Buffer.from([0x61,0,0x62])])await assert.rejects(()=>app.documents.importStream(USER,p.id,metadata,parts(bad),'same'),{code:'DOCUMENT_FORMAT_INVALID'});
  async function* broken(){yield bytes;throw new Error('fixture disconnect');}
  await assert.rejects(()=>app.documents.importStream(USER,p.id,metadata,broken(),'interrupted'),/fixture disconnect/);
  const controller=new AbortController();async function* cancelled(){yield bytes;controller.abort();yield bytes;}
  await assert.rejects(()=>app.documents.importStream(USER,p.id,metadata,cancelled(),'cancel',controller.signal),{code:'DOCUMENT_UPLOAD_CANCELLED'});
  assert.equal(app.store.list('document-version',p.id).length,1);assert.equal(app.store.list('artifact',p.id).filter(a=>a.origin==='document:user-upload').length,1);
  assert.equal(readdirSync(join(f.dir,'artifacts')).some(name=>name.startsWith('.upload-')),false);
  assert.equal(app.documents.readText(USER,p.id,d.id,{sourceDigest:d.original.digest}).content,bytes.toString('utf8'));
 }finally{f.app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('each page checks owner, project, lifecycle, source block and authenticated index',async()=>{
 const f=fixture();try{supported(f.app);const {app,p}=f,bytes=Buffer.from('original,中文🙂\n');const d=await app.documents.importStream(USER,p.id,metadata,parts(bytes),'guards'),input={sourceDigest:d.original.digest};
  const other=app.projects.create(USER,{name:'Other',template:'empty'});
  assert.throws(()=>app.documents.readText(USER,other.id,d.id,input),{code:'SCOPE_DENIED'});
  assert.throws(()=>app.documents.readText({type:'agent',projectId:p.id},p.id,d.id,input),{code:'PERMISSION_DENIED'});
  let project=app.store.get('project',p.id);app.store.update('project',p.id,project.version,{status:'archived'});assert.equal(app.documents.readText(USER,p.id,d.id,input).content,bytes.toString());
  project=app.store.get('project',p.id);app.store.update('project',p.id,project.version,{status:'trashed'});assert.throws(()=>app.documents.readText(USER,p.id,d.id,input),{code:'PROJECT_DELETED'});
  project=app.store.get('project',p.id);app.store.update('project',p.id,project.version,{status:'active'});
  const a=app.store.get('artifact',d.original.artifactId),path=app.store.paths.physical(a.path);chmodSync(path,0o600);let fd=openSync(path,'r+');writeSync(fd,Buffer.from('X'),0,1,0);closeSync(fd);
  assert.throws(()=>app.documents.readText(USER,p.id,d.id,input),{code:'ARTIFACT_CORRUPTED'});
  await assert.rejects(()=>app.documents.importStream(USER,p.id,metadata,parts(bytes),'guards'),{code:'ARTIFACT_CORRUPTED'});
  fd=openSync(path,'r+');writeSync(fd,bytes,0,bytes.length,0);closeSync(fd);
  const index=app.store.list('artifact',p.id).find(a=>a.origin==='document:text-index');assert.ok(index);const indexPath=app.store.paths.physical(index.path);chmodSync(indexPath,0o600);fd=openSync(indexPath,'r+');writeSync(fd,Buffer.alloc(index.size,0));closeSync(fd);
  assert.throws(()=>app.documents.readText(USER,p.id,d.id,input),{code:'ARTIFACT_CORRUPTED'});
 }finally{f.app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('configured streamed cap rejects one byte over, and default accepts real text beyond the old 32 MiB cap',async()=>{
 const previous=process.env.PI_RESEARCH_MAX_FILE_BYTES;const f=fixture();try{supported(f.app);const {app,p}=f;
  process.env.PI_RESEARCH_MAX_FILE_BYTES='12';const d=await app.documents.importStream(USER,p.id,metadata,parts(Buffer.alloc(12,97)),'limit');assert.equal(d.original.size,12);
  await assert.rejects(()=>app.documents.importStream(USER,p.id,metadata,parts(Buffer.alloc(13,97)),'over'),{code:'ARTIFACT_TOO_LARGE'});
  process.env.PI_RESEARCH_MAX_FILE_BYTES='garbage';await assert.rejects(()=>app.documents.importStream(USER,p.id,metadata,parts(Buffer.from('a')),'bad-policy'),{code:'FILE_POLICY_INVALID'});
  delete process.env.PI_RESEARCH_MAX_FILE_BYTES;const block=Buffer.alloc(1024*1024,97),size=33*1024*1024+1;async function* large(){for(let i=0;i<33;i++)yield block;yield Buffer.from('z');}
  const big=await app.documents.importStream(USER,p.id,metadata,large(),'large');assert.equal(big.original.size,size);assert.equal(app.documents.readText(USER,p.id,big.id,{sourceDigest:big.original.digest,cursor:size-1}).content,'z');
  assert.equal(app.documents.inspect(USER,p.id,big.id).id,big.id);
  app.store.db.prepare("DELETE FROM records WHERE kind='document-text-source' AND id=?").run(big.id);
  assert.throws(()=>app.documents.inspect(USER,p.id,big.id),{code:'DOCUMENT_TEXT_INDEX_REQUIRED'},'a missing large-file index must not fall back to full-buffer evidence.read');
 }finally{if(previous===undefined)delete process.env.PI_RESEARCH_MAX_FILE_BYTES;else process.env.PI_RESEARCH_MAX_FILE_BYTES=previous;f.app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('an archive and reopen during upload invalidates publication without losing existing documents',async()=>{
 const f=fixture();try{const {app,p}=f;const before=app.documents.import(USER,p.id,{title:'existing.txt',mediaType:'text/plain',contentBase64:Buffer.from('retained').toString('base64')},'existing');
  async function* changed(){yield Buffer.from('first');let project=app.store.get('project',p.id);app.store.update('project',p.id,project.version,{status:'archived'});project=app.store.get('project',p.id);app.store.update('project',p.id,project.version,{status:'active'});yield Buffer.from('last');}
  await assert.rejects(()=>app.documents.importStream(USER,p.id,metadata,changed(),'lifecycle'),{code:'PROJECT_LIFECYCLE_STALE'});assert.deepEqual(app.store.list('document-version',p.id).map(d=>d.id),[before.id]);
 }finally{f.app.close();rmSync(f.dir,{recursive:true,force:true});}
});
