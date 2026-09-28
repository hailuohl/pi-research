import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,chmodSync,statSync,existsSync,readdirSync,rmSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {snapshotDirectory,verifySnapshot,readSourceMode,setSourceMode,setSourceModes,copySourceModes,writeText,safePath} from '../../dist/packages/workspace/files.js';
import {Store,digest} from '../../dist/packages/storage/store.js';
import {SOURCE_OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/source-schemas.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

function setup(){const dir=mkdtempSync(join(tmpdir(),'source-modes-')),root=join(dir,'workspace'),snapshots=join(dir,'snapshots');mkdirSync(root);writeFileSync(join(root,'main.sh'),'#!/bin/sh\nprintf hello\n',{mode:0o600});return {dir,root,snapshots,close(){rmSync(dir,{recursive:true,force:true});}};}

test('mode-only changes alter new CAS identity and preserve verified immutable execution modes',()=>{
 const s=setup();try{
  const plain=snapshotDirectory(s.root,s.snapshots);assert.equal(plain.files[0].mode,'100644');assert.equal(plain.digest,digest(plain.files));
  setSourceMode(s.root,'main.sh','100755');const executable=snapshotDirectory(s.root,s.snapshots);
  assert.notEqual(executable.digest,plain.digest);assert.equal(executable.files[0].digest,plain.files[0].digest);assert.equal(executable.files[0].mode,'100755');
  assert.equal(readSourceMode(executable.path,'main.sh'),'100755');assert.doesNotThrow(()=>verifySnapshot(executable.path,executable.files));assert.doesNotThrow(()=>verifySnapshot(plain.path,plain.files));
  assert.equal(snapshotDirectory(s.root,s.snapshots).digest,executable.digest);
  if(process.platform!=='win32')assert.equal(statSync(join(executable.path,'main.sh')).mode&0o222,0);
  setSourceMode(executable.path,'main.sh','100644');assert.throws(()=>verifySnapshot(executable.path,executable.files),{code:'SNAPSHOT_CORRUPTED'});
  assert.throws(()=>snapshotDirectory(s.root,s.snapshots),{code:'SNAPSHOT_CORRUPTED'});
 }finally{s.close();}
});

test('legacy snapshots retain exactly their historical digest and ignore historically uncaptured mode',()=>{
 const s=setup();try{
  const bytes=readFileSync(join(s.root,'main.sh')),files=[{path:'main.sh',size:bytes.length,digest:digest(bytes)}],old=digest(files);
  const legacy=snapshotDirectory(s.root,s.snapshots,{legacy:true});assert.deepEqual(legacy.files,files);assert.equal(legacy.digest,old);
  setSourceMode(s.root,'main.sh','100755');assert.equal(snapshotDirectory(s.root,s.snapshots,{legacy:true}).digest,old);
  setSourceMode(legacy.path,'main.sh','100755');assert.doesNotThrow(()=>verifySnapshot(legacy.path,files));assert.deepEqual(legacy.files,files);assert.equal(digest(legacy.files),old);
  const modern=snapshotDirectory(s.root,s.snapshots);assert.notEqual(modern.digest,old);assert.equal(modern.files[0].mode,'100755');
 }finally{s.close();}
});

test('text writes keep logical executability, and transaction rollback restores content, permissions and new-file absence',()=>{
 const s=setup(),store=new Store(join(s.dir,'state.db'));try{
  setSourceMode(s.root,'main.sh','100755');const initial=readFileSync(join(s.root,'main.sh')),permission=statSync(join(s.root,'main.sh')).mode&0o777;
  const updated=writeText(s.root,'main.sh','echo updated\n',digest(initial),store);assert.equal(readSourceMode(s.root,'main.sh'),'100755');assert.ok(statSync(join(s.root,'main.sh')).mode&0o200);
  if(process.platform!=='win32')assert.equal(statSync(join(s.root,'main.sh')).mode&0o777,permission);
  assert.throws(()=>store.transaction(()=>{writeText(s.root,'main.sh','echo rollback\n',updated.digest,store);writeText(s.root,'new.sh','new\n',null,store);throw new Error('rollback');}),/rollback/);
  assert.equal(readFileSync(join(s.root,'main.sh'),'utf8'),'echo updated\n');assert.equal(readSourceMode(s.root,'main.sh'),'100755');assert.equal(existsSync(join(s.root,'new.sh')),false);
  writeText(s.root,'new.sh','new\n',null,store);assert.equal(readSourceMode(s.root,'new.sh'),'100644');
 }finally{store.close();s.close();}
});

test('copy helpers preserve logical modes without changing source data or creating source sidecars',()=>{
 const s=setup();try{
  const target=join(s.dir,'target');mkdirSync(target);writeFileSync(join(target,'main.sh'),readFileSync(join(s.root,'main.sh')),{mode:0o600});
  const before=readdirSync(s.dir);copySourceModes(s.root,target,[{path:'main.sh'}]);assert.equal(readSourceMode(target,'main.sh'),'100644');assert.equal(existsSync(s.root+'.source-modes.json'),false);
  assert.ok(before.every(name=>readdirSync(s.dir).includes(name)));
  setSourceMode(s.root,'main.sh','100755');copySourceModes(s.root,target,[{path:'main.sh'}]);assert.equal(readSourceMode(target,'main.sh'),'100755');assert.ok(statSync(join(target,'main.sh')).mode&0o200);
  setSourceModes(target,[{path:'main.sh'}]);assert.equal(readSourceMode(target,'main.sh'),'100644');
 }finally{s.close();}
});

test('Windows logical modes persist outside the exposed workspace and stay outside its snapshot', {skip:process.platform!=='win32'},()=>{
 const s=setup();try{
  setSourceMode(s.root,'main.sh','100755');assert.equal(JSON.parse(readFileSync(s.root+'.source-modes.json','utf8'))['main.sh'],'100755');assert.equal(readSourceMode(s.root,'main.sh'),'100755');
  assert.equal(readSourceMode(s.root,'MAIN.SH'),'100755');
  assert.throws(()=>safePath(s.root,'../workspace.source-modes.json'),{code:'PATH_DENIED'});
  assert.deepEqual(snapshotDirectory(s.root,s.snapshots).files.map(f=>f.path),['main.sh']);
  setSourceMode(s.root,'main.sh','100644');assert.equal(readSourceMode(s.root,'main.sh'),'100644');assert.equal(JSON.parse(readFileSync(s.root+'.source-modes.json','utf8'))['main.sh'],undefined);
 }finally{s.close();}
});

test('POSIX source modes reflect actual exec bits and writes retain exact normal permission bits',{skip:process.platform==='win32'},()=>{
 const s=setup();try{
  chmodSync(join(s.root,'main.sh'),0o640);assert.equal(readSourceMode(s.root,'main.sh'),'100644');
  writeText(s.root,'main.sh','echo next\n',digest(readFileSync(join(s.root,'main.sh'))));assert.equal(statSync(join(s.root,'main.sh')).mode&0o777,0o640);
  chmodSync(join(s.root,'main.sh'),0o750);assert.equal(readSourceMode(s.root,'main.sh'),'100755');writeText(s.root,'main.sh','echo executable\n',digest(readFileSync(join(s.root,'main.sh'))));assert.equal(statSync(join(s.root,'main.sh')).mode&0o777,0o750);assert.equal(snapshotDirectory(s.root,s.snapshots).files[0].mode,'100755');
  assert.equal(existsSync(s.root+'.source-modes.json'),false);
 }finally{s.close();}
});

test('mode helpers reject escaping paths, invalid modes, linked roots and Windows metadata junctions',()=>{
 const s=setup();try{
  assert.throws(()=>setSourceMode(s.root,'../outside','100755'),{code:'PATH_DENIED'});assert.throws(()=>setSourceMode(s.root,'main.sh','120000'),{code:'SOURCE_MODES_INVALID'});
  assert.throws(()=>setSourceMode(s.root,'./main.sh','100755'),{code:'PATH_DENIED'});
  const linked=join(s.dir,'linked');symlinkSync(s.root,linked,'junction');assert.throws(()=>readSourceMode(linked,'main.sh'),{code:'PATH_DENIED'});
  if(process.platform==='win32'){symlinkSync(s.root,s.root+'.source-modes.json','junction');assert.throws(()=>readSourceMode(s.root,'main.sh'),{code:'PATH_DENIED'});}
 }finally{s.close();}
});

test('source public contracts accept both legacy and mode-aware manifests but reject unsupported modes',()=>{
 const s=setup();try{const current=snapshotDirectory(s.root,s.snapshots),metadata={snapshotId:'s',experimentId:'e',revision:1,sourceDigest:current.digest};
  validateSchema(SOURCE_OUTPUT_SCHEMAS.experiment_source_list,{...metadata,files:current.files},'output');
  const legacy=current.files.map(({mode,...file})=>file);validateSchema(SOURCE_OUTPUT_SCHEMAS.experiment_source_list,{...metadata,sourceDigest:digest(legacy),files:legacy},'output');
  assert.throws(()=>validateSchema(SOURCE_OUTPUT_SCHEMAS.experiment_source_list,{...metadata,files:current.files.map(f=>({...f,mode:'120000'}))},'output'),{code:'INVALID_OUTPUT'});
 }finally{s.close();}
});
