import test from 'node:test';
import assert from 'node:assert/strict';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {BUILTIN_RELEASES} from '../../dist/packages/skills/releases.js';

const root=resolve('.');
test('generated release index retains the full archived catalog without embedding its historical prose',()=>{
 const first=BUILTIN_RELEASES[0],formerName=first.skills[0].source.repository.split('/').at(-1);
 assert.ok(!readFileSync(join(root,'packages/skills/releases.ts'),'utf8').toLowerCase().includes(formerName.toLowerCase()));
 for(const release of BUILTIN_RELEASES)assert.deepEqual(release,JSON.parse(readFileSync(join(root,'skills/releases',release.bundleId,'manifest.json'),'utf8')));
});

test('release metadata is verified before it becomes executable catalog input',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-release-index-'));
 try{
  for(const name of ['skills','domain'])mkdirSync(join(dir,'dist/packages',name),{recursive:true});
  cpSync(join(root,'dist/packages/skills/releases.js'),join(dir,'dist/packages/skills/releases.mjs'));
  cpSync(join(root,'dist/packages/domain/errors.js'),join(dir,'dist/packages/domain/errors.js'));
  writeFileSync(join(dir,'package.json'),'{"type":"module"}');
  for(const release of BUILTIN_RELEASES){const out=join(dir,'skills/releases',release.bundleId);mkdirSync(out,{recursive:true});cpSync(join(root,'skills/releases',release.bundleId,'manifest.json'),join(out,'manifest.json'));}
  const url=pathToFileURL(join(dir,'dist/packages/skills/releases.mjs')).href;
  const script=`try { const m=await import(${JSON.stringify(url)}); for(const r of m.BUILTIN_RELEASES) r.skills; console.log(m.BUILTIN_RELEASES.length); } catch(e) { console.error(e.code); process.exit(1); }`;
  const run=()=>spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8'});
  let result=run();assert.equal(result.status,0,result.stderr);assert.equal(Number(result.stdout.trim()),BUILTIN_RELEASES.length);
  const manifest=join(dir,'skills/releases',BUILTIN_RELEASES[0].bundleId,'manifest.json');
  for(const content of ['{broken JSON',JSON.stringify({...BUILTIN_RELEASES[0],skills:[]})]){
   writeFileSync(manifest,content);result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/SKILL_INTEGRITY_FAILED/);
  }
  const outside=join(dir,'outside-archive');mkdirSync(outside);
  cpSync(join(root,'skills/releases',BUILTIN_RELEASES[0].bundleId,'manifest.json'),join(outside,'manifest.json'));
  const linked=join(dir,'skills/releases',BUILTIN_RELEASES[0].bundleId);rmSync(linked,{recursive:true});symlinkSync(outside,linked,process.platform==='win32'?'junction':'dir');
  result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/SKILL_PATH_DENIED/);
  const importOnly=spawnSync(process.execPath,['--input-type=module','-e',`const m=await import(${JSON.stringify(url)}); console.log(m.BUILTIN_RELEASES.length);`],{encoding:'utf8'});
  assert.equal(importOnly.status,0,importOnly.stderr);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
