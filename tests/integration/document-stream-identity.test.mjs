import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';

test('a real same-content path replacement during a page is rejected even though block hashes still match',async()=>{
 const dir=fs.mkdtempSync(join(tmpdir(),'pi-stream-identity-')),app=new ResearchApp(dir,process.cwd());const read=fs.readSync;
 try{
  const p=app.projects.create(USER,{name:'Identity race',template:'empty'}),bytes=Buffer.from('unchanged text,中文🙂');async function* source(){yield bytes;}
  const d=await app.documents.importStream(USER,p.id,{title:'same.txt',mediaType:'text/plain'},source(),'identity');
  const a=app.store.get('artifact',d.original.artifactId),path=app.store.paths.physical(a.path),before=fs.statSync(path);let replaced=false;
  // Interpose only a real concurrent filesystem mutation after an actual read; no bytes or filesystem results are mocked.
  fs.readSync=(fd,...args)=>{const result=read(fd,...args);if(!replaced&&fs.fstatSync(fd).ino===before.ino){replaced=true;fs.renameSync(path,path+'.previous');fs.writeFileSync(path,bytes);}return result;};syncBuiltinESMExports();
  assert.throws(()=>app.documents.readText(USER,p.id,d.id,{sourceDigest:d.original.digest}),{code:'ARTIFACT_CHANGED'});assert.equal(replaced,true);
 }finally{fs.readSync=read;syncBuiltinESMExports();app.close();fs.rmSync(dir,{recursive:true,force:true});}
});
