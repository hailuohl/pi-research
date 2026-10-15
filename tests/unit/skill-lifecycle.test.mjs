import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,chmodSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {crc32,deflateSync} from 'node:zlib';
import {Store} from '../../dist/packages/storage/store.js';
import {SkillService} from '../../dist/packages/skills/service.js';
import {BUNDLE_ID} from '../../dist/packages/skills/manifest.js';
const owner={type:'user'},root=resolve('.');
function setup(){const dir=mkdtempSync(join(tmpdir(),'pi-skill-lifecycle-')),store=new Store(join(dir,'state.db'));const pid=store.create('project',null,{archived:false}).id;const service=new SkillService(root,{store,dataDir:dir,repoRoot:root});return {dir,store,pid,service,close(){store.close();rmSync(dir,{recursive:true,force:true});}};}
const file=(path,body)=>({path,contentBase64:Buffer.from(body).toString('base64')});
const chunk=(type,data)=>{const head=Buffer.alloc(8);head.writeUInt32BE(data.length);head.write(type,4,'ascii');const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4),data])));return Buffer.concat([head,data,crc]);};
function png(width=1,height=1){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.from([0,0,0,0,0]))),chunk('IEND',Buffer.alloc(0))]);}
const input=(body='version one')=>({packageId:'custom-diagram',revisionTag:body,description:'A text-only diagram guide',roles:['coordinator'],license:null,requirements:{tools:['artifact_create'],backends:[],artifactIds:[]},files:[file('SKILL.md',`---\nname: untrusted-other-name\n---\n${body}`),file('scripts/render.py','raise RuntimeError("must never execute")')]});
function approve(f,r){return f.service.review(owner,f.pid,{revisionId:r.id,decision:'approved',note:'Reviewed exact text and requirements'});}

test('reviewed immutable revisions, fixed bundles, rollback and revocation retain original bytes',()=>{const f=setup();try{
 const r1=f.service.import(owner,f.pid,input(),'first');assert.deepEqual(f.service.import(owner,f.pid,input(),'first'),r1);assert.throws(()=>f.service.import(owner,f.pid,input('other'),'first'),{code:'IDEMPOTENCY_CONFLICT'});
 assert.equal(r1.license,null);assert.equal(r1.authorization,'text-only');assert.equal(Object.hasOwn(r1.files[0],'mediaType'),false);assert.equal(f.service.configuration(f.pid).version,0);
 assert.throws(()=>f.service.configure(owner,f.pid,{expectedVersion:0,revisionIds:[r1.id]}),{code:'SKILL_NOT_APPROVED'});
 const review=approve(f,r1);assert.equal(review.contentDigest,r1.contentDigest);
 const a=f.service.configure(owner,f.pid,{expectedVersion:0,revisionIds:[r1.id]},'configure-one');const first=f.service.bundleRead(f.pid,'coordinator',a.bundleId,'custom-diagram');
 const r2=f.service.import(owner,f.pid,input('version two'),'second');approve(f,r2);const b=f.service.configure(owner,f.pid,{expectedVersion:1,revisionIds:[r2.id]});assert.notEqual(a.bundleId,b.bundleId);assert.equal(f.service.bundleRead(f.pid,'coordinator',a.bundleId,'custom-diagram').content,first.content);
 assert.equal(f.service.bundleCatalog(f.pid,'coordinator',a.bundleId).skills.find(s=>s.id==='custom-diagram').revisionId,r1.id);assert.match(f.service.bundleBootstrap(f.pid,'coordinator',a.bundleId).prompt,new RegExp(a.bundleId));
 assert.throws(()=>f.service.bundleRead(f.pid,'reviewer',a.bundleId,'custom-diagram'),{code:'SKILL_SCOPE_DENIED'});
 assert.throws(()=>f.service.configure(owner,f.pid,{expectedVersion:1,revisionIds:[]}),{code:'VERSION_CONFLICT'});
 assert.equal(f.service.configure(owner,f.pid,{expectedVersion:2,bundleId:a.bundleId}).bundleId,a.bundleId);
 f.service.revoke(owner,f.pid,{revisionId:r1.id,note:'Withdraw exact version'});assert.throws(()=>f.service.ensureBundleStartAllowed(f.pid,a.bundleId),{code:'SKILL_REVOKED'});assert.throws(()=>f.service.configure(owner,f.pid,{expectedVersion:3,bundleId:a.bundleId}),{code:'SKILL_REVOKED'});
 assert.equal(f.service.bundleRead(f.pid,'coordinator',a.bundleId,'custom-diagram').content,first.content);assert.equal(f.service.inspect(owner,f.pid,r1.id).reviews[0].id,review.id);assert.equal(f.service.inspect(owner,f.pid,r1.id).revocations.length,1);
 assert.equal(f.service.configure(owner,f.pid,{expectedVersion:3,revisionIds:[]}).bundleId,BUNDLE_ID);
 assert.throws(()=>f.service.review(owner,f.pid,{revisionId:r1.id,decision:'approved',note:'cannot undo revoke'}),{code:'SKILL_REVOKED'});
 assert.match(f.service.readRevision(owner,f.pid,r1.id,'scripts/render.py').content,/never execute/);
 assert.ok(!JSON.stringify(f.service.catalog(owner,f.pid)).includes(f.dir));
}finally{f.close();}});

test('import rejects unsafe names, path collisions, malformed text and size violations',()=>{const f=setup();let seq=0;try{
 const rejected=files=>assert.throws(()=>f.service.import(owner,f.pid,{...input(),files},String(seq++)));
 for(const path of ['../secret','/etc/passwd','C:/secret','x\\y','a/../b','.pi/config.json','AGENTS.md','a/agents.MD','hooks/run.py','extensions/plugin.ts','NUL.md','a/COM1.txt','a./b','a:/x'])rejected([file('SKILL.md','body'),file(path,'bad')]);
 rejected([file('SKILL.md','body'),file('one.md','a'),file('ONE.md','b')]);rejected([file('SKILL.md','body'),file('a','x'),file('a/b','x')]);
 rejected([file('other.md','missing entry')]);rejected([{path:'SKILL.md',contentBase64:'!!!!'}]);rejected([{path:'SKILL.md',contentBase64:Buffer.from([0xff,0xfe]).toString('base64')}]);rejected([file('SKILL.md','zero\0byte')]);rejected([file('SKILL.md','a'.repeat(128*1024+1))]);
 rejected([file('SKILL.md','body'),...Array.from({length:64},(_,i)=>file(`${i}.md`,'a'))]);rejected([file('SKILL.md','body'),...Array.from({length:17},(_,i)=>file(`${i}.md`,'a'.repeat(128*1024)))]);
 assert.throws(()=>f.service.import(owner,f.pid,{...input(),packageId:'pi-research-overview'},'builtin'),{code:'SKILL_PACKAGE_ID_INVALID'});
 assert.equal(f.store.list('skill-package-revision',f.pid).length,0);
}finally{f.close();}});

test('canonical PNG assets stay byte-exact for owners and unavailable as Agent text',()=>{const f=setup();try{
 const bytes=png(),payload={...input(),packageId:'static-figure',files:[file('SKILL.md','Read the original figure.'),{path:'assets/figure.png',contentBase64:bytes.toString('base64')}]};
 const r=f.service.import(owner,f.pid,payload,'png');assert.equal(r.authorization,'text-with-static-assets');assert.equal(r.files.find(x=>x.path==='assets/figure.png').mediaType,'image/png');assert.equal(Object.hasOwn(r.files.find(x=>x.path==='SKILL.md'),'mediaType'),false);
 const blob=join(f.dir,'skill-blobs',r.files.find(x=>x.path==='assets/figure.png').digest),original=readFileSync(blob);chmodSync(blob,0o600);writeFileSync(blob,'tampered');assert.throws(()=>approve(f,r),{code:'SKILL_INTEGRITY_FAILED'});writeFileSync(blob,original);
 const approval=approve(f,r),configured=f.service.configure(owner,f.pid,{expectedVersion:0,revisionIds:[r.id]});assert.equal(approval.contentDigest,r.contentDigest);assert.equal(f.service.ensureBundleStartAllowed(f.pid,configured.bundleId).bundleId,configured.bundleId);
 const reply=f.service.readRevision(owner,f.pid,r.id,'assets/figure.png');assert.deepEqual(reply,{revisionId:r.id,resource:'assets/figure.png',digest:r.files.find(x=>x.path==='assets/figure.png').digest,mediaType:'image/png',contentBase64:bytes.toString('base64')});
 assert.equal(f.service.readRevision(owner,f.pid,r.id).content,'Read the original figure.');assert.throws(()=>f.service.bundleRead(f.pid,'coordinator',configured.bundleId,'static-figure','assets/figure.png'),{code:'SKILL_RESOURCE_BINARY'});
 chmodSync(blob,0o600);writeFileSync(blob,'tampered');assert.throws(()=>f.service.ensureBundleStartAllowed(f.pid,configured.bundleId),{code:'SKILL_INTEGRITY_FAILED'});writeFileSync(blob,original);
 f.service.revoke(owner,f.pid,{revisionId:r.id,note:'Withdraw figure'});assert.throws(()=>f.service.ensureBundleStartAllowed(f.pid,configured.bundleId),{code:'SKILL_REVOKED'});assert.equal(f.service.readRevision(owner,f.pid,r.id,'assets/figure.png').contentBase64,bytes.toString('base64'));
}finally{f.close();}});

test('binary bytes require a canonical assets PNG path and complete bounded PNG structure',()=>{const f=setup();let seq=0;try{
 const reject=(path,bytes)=>assert.throws(()=>f.service.import(owner,f.pid,{...input(),packageId:`bad-${seq}`,files:[file('SKILL.md','text'),{path,contentBase64:bytes.toString('base64')}]},String(seq++)));
 const valid=png(),badCrc=Buffer.from(valid);badCrc[badCrc.length-5]^=1;const badSignature=Buffer.from(valid);badSignature[0]=0;
 const header=valid.subarray(0,33),end=chunk('IEND',Buffer.alloc(0));
 const badZlib=Buffer.concat([header,chunk('IDAT',Buffer.from('not a zlib stream')),end]);
 const shortScan=Buffer.concat([header,chunk('IDAT',deflateSync(Buffer.from([0]))),end]);
 reject('assets/figure.png',Buffer.from('not PNG'));reject('assets/figure.png',badSignature);reject('assets/figure.png',badCrc);reject('assets/figure.png',Buffer.concat([valid,Buffer.from([0])]));reject('assets/figure.png',png(4097,1));reject('assets/figure.png',badZlib);reject('assets/figure.png',shortScan);
 for(const animation of ['acTL','fcTL','fdAT'])reject('assets/figure.png',Buffer.concat([header,chunk(animation,Buffer.alloc(8)),valid.subarray(33)]));
 reject('assets/FIGURE.PNG',valid);reject('images/figure.png',valid);
 assert.equal(f.store.list('skill-package-revision',f.pid).length,0);
}finally{f.close();}});

test('owner/project boundaries, receipt recovery and CAS tampering fail closed',()=>{const f=setup();try{
 assert.throws(()=>f.service.import({type:'agent',projectId:f.pid},f.pid,input(),'agent'),{code:'PERMISSION_DENIED'});
 const r=f.service.import(owner,f.pid,input(),'one'),other=f.store.create('project',null,{archived:false}).id;assert.throws(()=>f.service.inspect(owner,other,r.id),{code:'SCOPE_DENIED'});
 const s=new SkillService(root,{store:f.store,dataDir:f.dir,repoRoot:root});assert.equal(s.import(owner,f.pid,input(),'one').id,r.id);
 const p=join(f.dir,'skill-blobs',r.files.find(x=>x.path==='SKILL.md').digest);chmodSync(p,0o600);writeFileSync(p,'modified');assert.throws(()=>s.readRevision(owner,f.pid,r.id),{code:'SKILL_INTEGRITY_FAILED'});assert.throws(()=>approve(f,r),{code:'SKILL_INTEGRITY_FAILED'});
 const project=f.store.get('project',f.pid);f.store.update('project',f.pid,project.version,{archived:true});assert.equal(s.import(owner,f.pid,input(),'one').id,r.id);assert.throws(()=>s.import(owner,f.pid,input('new'),'new'),{code:'PROJECT_ARCHIVED'});
}finally{f.close();}});
