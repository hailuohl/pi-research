import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

test('frozen baseline replacements reject tampering before creating or changing test workspaces',()=>{
 const root=resolve('.'),dir=mkdtempSync(join(tmpdir(),'pi-frozen-overlay-'));
 try{
  mkdirSync(join(dir,'scripts'));mkdirSync(join(dir,'docs/history'),{recursive:true});
  cpSync(join(root,'scripts/verify-baselines.mjs'),join(dir,'scripts/verify-baselines.mjs'));
  writeFileSync(join(dir,'docs/history/skill-test-overlays.json'),'[]\n');
  const sources=['0.2.3','0.3.1-experimental'].map((version,i)=>{
   const source=join(dir,'baseline-'+i);mkdirSync(join(source,'apps'),{recursive:true});mkdirSync(join(source,'packages'));
   writeFileSync(join(source,'package.json'),JSON.stringify({version}));writeFileSync(join(source,'apps/marker.txt'),'frozen input');return source;
  });
  const guard=join(dir,'npm-guard.mjs');writeFileSync(guard,"import {writeFileSync} from 'node:fs';writeFileSync("+JSON.stringify(join(dir,'unexpected-npm'))+",'unexpected execution');process.exit(99);");
  const result=spawnSync(process.execPath,[join(dir,'scripts/verify-baselines.mjs'),...sources],{encoding:'utf8',env:{...process.env,npm_execpath:guard},timeout:10000});
  assert.notEqual(result.status,0);assert.match(result.stderr,/FROZEN_BASELINE_OVERLAY_MISMATCH/);
  assert.equal(existsSync(join(dir,'.validation')),false);assert.equal(existsSync(join(dir,'unexpected-npm')),false);
  for(const source of sources)assert.equal(readFileSync(join(source,'apps/marker.txt'),'utf8'),'frozen input');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
