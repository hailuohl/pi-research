import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync}from'node:child_process';import {mkdtempSync,rmSync}from'node:fs';import {tmpdir}from'node:os';import {join}from'node:path';
test('explicit demo creates a source-backed text experiment without calling models or launching runs',()=>{
 const dir=mkdtempSync(join(tmpdir(),'text-demo-'));
 try {const r=spawnSync(process.execPath,['scripts/demo-evidence.mjs','--data',dir],{encoding:'utf8',timeout:10000});assert.equal(r.status,0,r.stderr);const x=JSON.parse(r.stdout);assert.equal(x.aiUsed,false);assert.equal(x.documents,8);assert.equal(x.runsCreated,0);assert.equal(x.results[0].groups.length,3);assert.equal(x.results[0].quotesVerified,true);}
 finally{rmSync(dir,{recursive:true,force:true});}
});
