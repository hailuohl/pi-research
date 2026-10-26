import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,copyFileSync,readdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=new URL('../../scripts/document-build/',import.meta.url);
test('compiler dependency lock is complete, content pinned and same-suite',()=>{
 const lock=JSON.parse(readFileSync(new URL('debian-packages.lock.json',root),'utf8'));
 assert.equal(lock.platform,'linux/amd64');assert.equal(lock.suite,'trixie');
 assert.match(lock.baseImage,/@sha256:[a-f0-9]{64}$/);
 assert.ok(lock.packages.length>0);assert.equal(lock.downloadBytes,lock.packages.reduce((sum,p)=>sum+p.bytes,0));
 assert.equal(new Set(lock.packages.map(p=>p.file)).size,lock.packages.length);
 for(const p of lock.packages){assert.match(p.sha256,/^[a-f0-9]{64}$/);assert.ok(p.version);assert.ok(['amd64','all'].includes(p.architecture));assert.ok(p.url.startsWith('https://snapshot.debian.org/archive/'));assert.ok(p.url.includes('/'+lock.snapshot+'/'));}
 for(const name of lock.roots)assert.ok(lock.packages.some(p=>p.name===name),name);
 for(const name of ['texlive-lang-chinese','texlive-fonts-recommended'])assert.ok(lock.roots.includes(name)&&lock.packages.some(p=>p.name===name),name+' must ship the supported Chinese/hyperref dependencies');
});

for(const corrupt of [true,false])test('compiler release '+(corrupt?'rejects damaged cache':'stages only locked packages and preserves the receipt on build failure'),()=>{
 const dir=mkdtempSync(join(tmpdir(),'compiler-release-')),source=join(dir,'scripts','document-build'),cache=join(dir,'.validation','document-build-cache'),debs=join(cache,'debs');
 try{mkdirSync(source,{recursive:true});mkdirSync(debs,{recursive:true});copyFileSync(new URL('../../scripts/setup-document-build.mjs',import.meta.url),join(dir,'scripts','setup-document-build.mjs'));for(const name of ['build.py','Dockerfile','smoke.tex'])copyFileSync(new URL(name,root),join(source,name));
 const lock=JSON.parse(readFileSync(new URL('debian-packages.lock.json',root),'utf8'));lock.packages=lock.roots.map(name=>{const bytes=Buffer.from('test package '+name),file=name+'_test_all.deb';writeFileSync(join(debs,file),bytes);return {name,version:'test',architecture:'all',file,url:`https://snapshot.debian.org/archive/debian/${lock.snapshot}/${file}`,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};});lock.downloadBytes=lock.packages.reduce((n,p)=>n+p.bytes,0);writeFileSync(join(source,'debian-packages.lock.json'),JSON.stringify(lock));
 writeFileSync(join(debs,'old-extra.deb'),'old cache remains');const previous='{"profileDigest":"'+'a'.repeat(64)+'","imageDigest":"historic"}\n';writeFileSync(join(cache,'latest.json'),previous);if(corrupt)writeFileSync(join(debs,lock.packages[0].file),'damaged');
 const run=spawnSync(process.execPath,[join(dir,'scripts','setup-document-build.mjs'),'pi-research-test-missing-context'],{encoding:'utf8',timeout:20000,windowsHide:true});assert.notEqual(run.status,0,run.stdout+run.stderr);assert.equal(readFileSync(join(cache,'latest.json'),'utf8'),previous);assert.equal(readFileSync(join(debs,'old-extra.deb'),'utf8'),'old cache remains');const staging=readdirSync(cache).filter(n=>n.startsWith('staging-'));
 if(corrupt){assert.match(run.stderr,/Corrupt cache/);assert.deepEqual(staging,[]);assert.equal(readFileSync(join(debs,lock.packages[0].file),'utf8'),'damaged');}else{assert.ok(!run.error,run.error?.message);assert.match(run.stderr,/Docker exited|ENOENT/);assert.equal(staging.length,1);assert.deepEqual(readdirSync(join(cache,staging[0],'debs')).sort(),lock.packages.map(p=>p.file).sort());assert.equal(readdirSync(cache).includes('receipts'),false);}
 }finally{rmSync(dir,{recursive:true,force:true});}
});
