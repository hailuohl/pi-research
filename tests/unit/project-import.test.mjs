import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,renameSync,readdirSync,rmSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {readSourceMode,snapshotDirectory} from '../../dist/packages/workspace/files.js';

const hasGit=spawnSync('git',['--version'],{windowsHide:true}).status===0;
function setup(){const dir=mkdtempSync(join(tmpdir(),'project-import-')),data=join(dir,'data'),source=join(dir,'source');mkdirSync(source);const app=new ResearchApp(data,process.cwd());return {dir,data,source,app,close(){app.close();rmSync(dir,{recursive:true,force:true});}};}
function git(source,...args){const r=spawnSync('git',['-c','core.autocrlf=false','-c','commit.gpgSign=false','-c','user.name=Import Test','-c','user.email=import@example.invalid','-C',source,...args],{encoding:'utf8',windowsHide:true,timeout:15000});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
function repository(s){git(s.source,'init','--template=');writeFileSync(join(s.source,'main.py'),'print("source")\n');writeFileSync(join(s.source,'.gitattributes'),'*.py filter=untrusted\n');git(s.source,'add','.');git(s.source,'update-index','--chmod=+x','main.py');const commit=git(s.source,'commit','-m','Original source');return git(s.source,'rev-parse','HEAD');}

test('Git project import records original provenance and executable modes without executing hooks or filters',{skip:!hasGit},async()=>{
 const s=setup();try{const commit=repository(s),marker=join(s.dir,'unsafe-executed'),payload=join(s.dir,'unsafe.cjs'),hooks=join(s.dir,'hooks');mkdirSync(hooks);writeFileSync(payload,`require('node:fs').writeFileSync(${JSON.stringify(marker)},'unsafe')`);writeFileSync(join(hooks,'post-checkout'),`#!/bin/sh\nnode '${payload.replaceAll('\\','/')}'\n`);
  git(s.source,'config','core.hooksPath',hooks);git(s.source,'config','core.fsmonitor',`node "${payload}"`);git(s.source,'config','filter.untrusted.clean',`node "${payload}"`);git(s.source,'config','filter.untrusted.smudge',`node "${payload}"`);git(s.source,'config','filter.untrusted.required','true');git(s.source,'config','remote.origin.url','https://username:secret@example.invalid/research.git?token=secret');
  const before=readFileSync(join(s.source,'.git','config')),input={name:'Imported Git',sourcePath:s.source},plan=await s.app.projects.prepareImport(USER,input),p=s.app.projects.importDirectory(USER,input,plan),record=s.app.store.list('project-import',p.id)[0];
  assert.equal(record.commit,commit);assert.equal(record.remote,'https://example.invalid/research.git');assert.equal(record.dirty,process.platform==='win32'?false:readSourceMode(s.source,'main.py')!=='100755');assert.equal(readSourceMode(p.workspace,'main.py'),process.platform==='win32'?'100755':readSourceMode(s.source,'main.py'));
  assert.equal(snapshotDirectory(p.workspace,join(s.dir,'check')).digest,record.sourceDigest);assert.ok(record.excluded.includes('.git'));assert.equal(existsSync(join(p.workspace,'.git')),false);assert.equal(existsSync(marker),false);
  assert.deepEqual(readFileSync(join(s.source,'.git','config')),before);assert.equal(existsSync(s.source+'.source-modes.json'),false);assert.equal(s.app.store.list('experiment').length,0);
 }finally{s.close();}
});

test('preflight imports the exact frozen dirty bytes including untracked files even if the source later disappears',{skip:!hasGit},async()=>{
 const s=setup();try{const commit=repository(s);writeFileSync(join(s.source,'main.py'),'print("dirty snapshot")\n');writeFileSync(join(s.source,'extra.txt'),'untracked');writeFileSync(join(s.source,'.env'),'NEVER IMPORT');
  const input={name:'Dirty snapshot',sourcePath:s.source},prepared=await s.app.projects.prepareImport(USER,input);renameSync(s.source,join(s.dir,'moved-source'));
  const p=s.app.projects.importDirectory(USER,input,prepared),record=s.app.store.list('project-import',p.id)[0];assert.equal(record.commit,commit);assert.equal(record.dirty,true);assert.equal(record.sourceDigest,prepared.sourceDigest);
  assert.equal(readFileSync(join(p.workspace,'main.py'),'utf8'),'print("dirty snapshot")\n');assert.equal(readFileSync(join(p.workspace,'extra.txt'),'utf8'),'untracked');assert.equal(existsSync(join(p.workspace,'.env')),false);
 }finally{s.close();}
});

test('Git imports require a host preflight while plain directories retain synchronous support; forged plans are rejected',{skip:!hasGit},async()=>{
 const s=setup();try{repository(s);const input={name:'Scoped import',sourcePath:s.source};
  assert.throws(()=>s.app.projects.importDirectory(USER,input),{code:'IMPORT_PREFLIGHT_REQUIRED'});assert.throws(()=>s.app.projects.importDirectory(USER,input,{sourceDigest:'forged'}),{code:'IMPORT_PLAN_INVALID'});
  const prepared=await s.app.projects.prepareImport(USER,input);assert.throws(()=>s.app.projects.importDirectory(USER,{...input,name:'Changed request'},prepared),{code:'IMPORT_PLAN_INVALID'});await assert.rejects(()=>s.app.projects.prepareImport(USER,{...input,prepared}),{code:'INVALID_INPUT'});
  const plain=join(s.dir,'plain');mkdirSync(plain);writeFileSync(join(plain,'plain.py'),'pass');assert.ok(s.app.projects.importDirectory(USER,{name:'Plain',sourcePath:plain}).id);
  assert.throws(()=>s.app.projects.importDirectory(USER,{name:'App data',sourcePath:join(s.data,'projects')}),{code:'PATH_DENIED'});
 }finally{s.close();}
});

test('imports reject unresolved LFS, submodules and symbolic directory trees without partial projects',async()=>{
 for(const kind of ['lfs','submodule','link']){const s=setup();try{writeFileSync(join(s.source,'main.py'),'pass');
  if(kind==='lfs')writeFileSync(join(s.source,'data.bin'),'version https://git-lfs.github.com/spec/v1\noid sha256:123\nsize 100\n');
  if(kind==='submodule')writeFileSync(join(s.source,'.gitmodules'),'[submodule "lib"]');
  if(kind==='link')symlinkSync(s.data,join(s.source,'escape'),'junction');
  await assert.rejects(()=>s.app.projects.prepareImport(USER,{name:'Reject',sourcePath:s.source}),{code:kind==='lfs'?'UNSUPPORTED_LFS':kind==='submodule'?'UNSUPPORTED_SUBMODULE':'PATH_DENIED'});
  assert.equal(s.app.store.list('project').length,0);
 }finally{s.close();}}
});

test('outer transaction failure removes imported files and mode metadata',async()=>{
 const s=setup();try{writeFileSync(join(s.source,'main.py'),'pass');const input={name:'Rollback',sourcePath:s.source},prepared=await s.app.projects.prepareImport(USER,input);
  assert.throws(()=>s.app.store.transaction(()=>{s.app.projects.importDirectory(USER,input,prepared);throw new Error('outer rollback');}),/outer rollback/);
  assert.equal(s.app.store.list('project').length,0);assert.equal(s.app.store.list('project-import').length,0);assert.deepEqual(readdirSync(join(s.data,'projects')),[]);
 }finally{s.close();}
});

test('HTTP import preflights Git outside SQLite and replays its receipt after the original source disappears',{skip:!hasGit},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'project-import-http-')),source=join(dir,'source');mkdirSync(source);repository({source});
 const server=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0}),port=await server.listen(),input={name:'HTTP Git',sourcePath:source};
 const request=async body=>{const response=await fetch(`http://127.0.0.1:${port}/api/projects/import`,{method:'POST',headers:{Authorization:`Bearer ${server.token}`,'Content-Type':'application/json','Idempotency-Key':'import-once'},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};};
 try{const first=await request(input);assert.equal(first.status,200,JSON.stringify(first.body));renameSync(source,join(dir,'moved'));const replay=await request(input);assert.equal(replay.status,200);assert.deepEqual(replay.body,first.body);assert.equal(server.app.store.list('project').length,1);
  const conflict=await request({...input,name:'Different request'});assert.equal(conflict.body.error.code,'IDEMPOTENCY_CONFLICT');
 }finally{await server.close();rmSync(dir,{recursive:true,force:true});}
});

test('CLI import uses the same Git preflight and persists provenance',{skip:!hasGit},()=>{
 const s=setup();try{const commit=repository(s),r=spawnSync(process.execPath,['dist/apps/cli/index.js','import',s.source,'--name','CLI Git','--data',s.data,'--json'],{encoding:'utf8',windowsHide:true,timeout:20000});assert.equal(r.status,0,r.stderr);const result=JSON.parse(r.stdout),record=s.app.store.list('project-import',result.id)[0];assert.equal(record.commit,commit);assert.equal(s.app.store.list('session',result.id).length,1);assert.equal(s.app.store.list('experiment',result.id).length,0);
 }finally{s.close();}
});
