import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../../scripts/document-build/',import.meta.url);
test('compiler dependency lock is complete, content pinned and same-suite',()=>{
 const lock=JSON.parse(readFileSync(new URL('debian-packages.lock.json',root),'utf8'));
 assert.equal(lock.platform,'linux/amd64');assert.equal(lock.suite,'trixie');
 assert.match(lock.baseImage,/@sha256:[a-f0-9]{64}$/);
 assert.ok(lock.packages.length>0);assert.equal(lock.downloadBytes,lock.packages.reduce((sum,p)=>sum+p.bytes,0));
 assert.equal(new Set(lock.packages.map(p=>p.file)).size,lock.packages.length);
 for(const p of lock.packages){assert.match(p.sha256,/^[a-f0-9]{64}$/);assert.ok(p.version);assert.ok(['amd64','all'].includes(p.architecture));assert.ok(p.url.startsWith('https://snapshot.debian.org/archive/'));assert.ok(p.url.includes('/'+lock.snapshot+'/'));}
 for(const name of lock.roots)assert.ok(lock.packages.some(p=>p.name===name),name);
});
