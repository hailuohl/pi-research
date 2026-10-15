import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {spawn} from 'node:child_process';
import {Store} from '../../dist/packages/storage/store.js';
import {SkillService} from '../../dist/packages/skills/service.js';
const owner={type:'user'},root=resolve('.');
const file=(path,body)=>({path,contentBase64:Buffer.from(body).toString('base64')});
const input=(packageId='auto-method',body='original')=>({packageId,revisionTag:body,description:'Automatic text loading',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[file('SKILL.md',body),file('scripts/example.py','raise RuntimeError("text only")')]});
function setup(){const dir=mkdtempSync(join(tmpdir(),'pi-auto-skill-')),f={dir,store:new Store(join(dir,'state.db'))};f.pid=f.store.create('project',null,{archived:false}).id;f.service=new SkillService(root,{store:f.store,dataDir:dir,repoRoot:root});f.close=()=>{f.store.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});};return f;}
function snapshot(f){return {records:f.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all(),events:f.store.db.prepare('SELECT * FROM events ORDER BY seq').all(),operations:f.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all()};}

test('upload atomically authorizes text, replaces only its package, preserves fixed history and replays after reopen',()=>{const f=setup();try{
 const key='k'.repeat(200),payload=input(),first=f.service.upload(owner,f.pid,payload,key),review=f.service.inspect(owner,f.pid,first.revision.id).reviews[0];
 assert.deepEqual(first.configuration.revisionIds,[first.revision.id]);assert.deepEqual(first.configuration.disabledBuiltinIds,[]);assert.equal(first.revision.authorization,'text-only');assert.equal(review.decision,'approved');assert.equal(review.contentDigest,first.revision.contentDigest);assert.match(review.note,/未进行内容审查/);assert.match(review.note,/不授予/);
 assert.equal(f.service.bundleRead(f.pid,'coordinator',first.configuration.bundleId,payload.packageId).content,'original');assert.equal(f.service.bundleRead(f.pid,'coordinator',first.configuration.bundleId,payload.packageId,'scripts/example.py').content,'raise RuntimeError("text only")');assert.throws(()=>f.service.bundleRead(f.pid,'reviewer',first.configuration.bundleId,payload.packageId),{code:'SKILL_SCOPE_DENIED'});
 const bytes=JSON.stringify(f.store.get('skill-bundle',first.configuration.bundleId)),other=f.service.upload(owner,f.pid,input('other-method'),'other'),next=f.service.upload(owner,f.pid,input('auto-method','updated'),'next');
 assert.deepEqual(new Set(next.configuration.revisionIds),new Set([other.revision.id,next.revision.id]));assert.equal(JSON.stringify(f.store.get('skill-bundle',first.configuration.bundleId)),bytes);assert.equal(f.service.bundleRead(f.pid,'coordinator',first.configuration.bundleId,payload.packageId).content,'original');assert.equal(f.service.catalog(owner,f.pid).revisions.length,3);
 const before=snapshot(f);assert.deepEqual(f.service.upload(owner,f.pid,payload,key),first);assert.deepEqual(snapshot(f),before);assert.throws(()=>f.service.upload(owner,f.pid,input('auto-method','changed'),key),{code:'IDEMPOTENCY_CONFLICT'});
 f.store.close();f.store=new Store(join(f.dir,'state.db'));f.service=new SkillService(root,{store:f.store,dataDir:f.dir,repoRoot:root});assert.deepEqual(f.service.upload(owner,f.pid,payload,key),first);assert.deepEqual(f.service.configuration(f.pid),next.configuration);assert.deepEqual(snapshot(f),before);
}finally{f.close();}});

test('upload keeps file, encoding, PNG, size, role, owner and archived-project boundaries without partial records',()=>{const f=setup();try{
 const payload=input(),before=snapshot(f),invalid=[{files:[file('../SKILL.md','bad')]},{files:[file('SKILL.md','ok'),file('assets/bad.png','not a PNG')]},{files:[file('SKILL.md','x'.repeat(128*1024+1))]},{files:[{path:'SKILL.md',contentBase64:'/w=='}]},{files:[file('SKILL.md','ok'),file('SKILL.MD','collision')]},{roles:['coordinator','coordinator']},{roles:['invented']},{files:[],zipBase64:'UEs='},{files:undefined,zipBase64:'UEs='},{packageId:'pi-research-overview'}];
 for(const [i,value] of invalid.entries()){assert.throws(()=>f.service.upload(owner,f.pid,{...payload,...value},`invalid-${i}`));assert.deepEqual(snapshot(f),before);}
 assert.throws(()=>f.service.upload({type:'agent',projectId:f.pid},f.pid,payload,'agent'),{code:'PERMISSION_DENIED'});assert.deepEqual(snapshot(f),before);
 const project=f.store.get('project',f.pid);f.store.update('project',f.pid,project.version,{archived:true});const archived=snapshot(f);assert.throws(()=>f.service.upload(owner,f.pid,payload,'archived'),{code:'PROJECT_ARCHIVED'});assert.deepEqual(snapshot(f),archived);
}finally{f.close();}});

test('late configuration failure rolls back revision, approval, bundle, events and every nested receipt',()=>{const f=setup();try{
 const before=snapshot(f),event=f.store.event;f.store.event=function(pid,type,payload){const result=event.call(this,pid,type,payload);if(type==='skill.configured')throw new Error('final event failed');return result;};
 assert.throws(()=>f.service.upload(owner,f.pid,input(),'retryable'),/final event failed/);assert.deepEqual(snapshot(f),before);f.store.event=event;
 const recovered=f.service.upload(owner,f.pid,input(),'retryable');assert.deepEqual(recovered.configuration.revisionIds,[recovered.revision.id]);assert.equal(f.store.list('skill-review',f.pid).length,1);
}finally{f.close();}});

test('explicit enable accepts pending/rejected revisions with CAS and rejects deleted, revoked, foreign and archived writes',()=>{const f=setup();try{
 const pending=f.service.import(owner,f.pid,input(),'manual'),other=f.store.create('project',null,{archived:false}).id;
 assert.throws(()=>f.service.enable(owner,other,{revisionId:pending.id,expectedVersion:0},'foreign'),{code:'SCOPE_DENIED'});assert.throws(()=>f.service.enable({type:'agent',projectId:f.pid},f.pid,{revisionId:pending.id,expectedVersion:0},'agent'),{code:'PERMISSION_DENIED'});
 const first=f.service.enable(owner,f.pid,{revisionId:pending.id,expectedVersion:0},'enable');assert.deepEqual(first.configuration.revisionIds,[pending.id]);assert.deepEqual(f.service.enable(owner,f.pid,{revisionId:pending.id,expectedVersion:0},'enable'),first);
 const before=snapshot(f);assert.throws(()=>f.service.enable(owner,f.pid,{revisionId:pending.id,expectedVersion:0},'stale'),{code:'VERSION_CONFLICT'});assert.deepEqual(snapshot(f),before);
 const off=f.service.configure(owner,f.pid,{expectedVersion:1,revisionIds:[]},'off');f.service.review(owner,f.pid,{revisionId:pending.id,decision:'rejected',note:'old rejection'},'reject');const again=f.service.enable(owner,f.pid,{revisionId:pending.id,expectedVersion:off.version},'enable-rejected');assert.deepEqual(again.configuration.revisionIds,[pending.id]);assert.equal(f.service.inspect(owner,f.pid,pending.id).reviews.at(-1).decision,'approved');
 f.service.revoke(owner,f.pid,{revisionId:pending.id,note:'withdraw'},'revoke');const revoked=snapshot(f);assert.throws(()=>f.service.enable(owner,f.pid,{revisionId:pending.id,expectedVersion:again.configuration.version},'revoked'),{code:'SKILL_REVOKED'});assert.deepEqual(snapshot(f),revoked);
 const deleted=f.service.delete(owner,f.pid,{revisionId:pending.id,expectedVersion:again.configuration.version},'delete');assert.throws(()=>f.service.enable(owner,f.pid,{revisionId:pending.id,expectedVersion:deleted.version},'deleted'),{code:'SKILL_DELETED'});
 const project=f.store.get('project',f.pid);f.store.update('project',f.pid,project.version,{archived:true});assert.deepEqual(f.service.enable(owner,f.pid,{revisionId:pending.id,expectedVersion:0},'enable'),first);assert.throws(()=>f.service.enable(owner,f.pid,{revisionId:pending.id,expectedVersion:deleted.version},'archived'),{code:'PROJECT_ARCHIVED'});
}finally{f.close();}});

for(const state of ['revoked','rejected'])test(`upload refuses retained ${state} siblings atomically and explains how to recover`,()=>{const f=setup();try{
 const first=f.service.upload(owner,f.pid,input('unavailable-method'),'first');if(state==='revoked')f.service.revoke(owner,f.pid,{revisionId:first.revision.id,note:'withdraw'});else f.service.review(owner,f.pid,{revisionId:first.revision.id,decision:'rejected',note:'withdraw'});
 const before=snapshot(f);assert.throws(()=>f.service.upload(owner,f.pid,input(),'new'),error=>error.code===(state==='revoked'?'SKILL_REVOKED':'SKILL_NOT_APPROVED')&&/先关闭/.test(error.message));assert.deepEqual(snapshot(f),before);
 const empty=f.service.configure(owner,f.pid,{expectedVersion:first.configuration.version,revisionIds:[]},'remove');const uploaded=f.service.upload(owner,f.pid,input(),'new');assert.equal(uploaded.configuration.version,empty.version+1);assert.deepEqual(uploaded.configuration.revisionIds,[uploaded.revision.id]);
}finally{f.close();}});

test('independent writer processes merge concurrent different-package uploads without losing either update',async()=>{const f=setup(),children=[];try{
 const script=`import {Store} from './dist/packages/storage/store.js';import {SkillService} from './dist/packages/skills/service.js';import {join} from 'node:path';const [dir,pid,raw]=process.argv.slice(1),payload=JSON.parse(raw),store=new Store(join(dir,'state.db')),service=new SkillService(process.cwd(),{store,dataDir:dir,repoRoot:process.cwd()});process.stdout.write('ready\\n');process.stdin.once('data',()=>{try{service.upload({type:'user'},pid,payload,payload.packageId);store.close();process.exitCode=0;}catch(e){console.error(e);process.exitCode=1;}process.stdin.destroy();});`;
 children.push(...['concurrent-a','concurrent-b'].map(id=>spawn(process.execPath,['--input-type=module','-e',script,f.dir,f.pid,JSON.stringify(input(id))],{cwd:root,stdio:['pipe','pipe','pipe'],timeout:15000})));
 const exits=children.map(child=>new Promise((resolve,reject)=>{let errors='';child.stderr.on('data',s=>errors+=s);child.on('error',reject);child.on('exit',code=>{try{assert.equal(code,0,errors);resolve();}catch(e){reject(e);}});}));
 const completed=Promise.all(exits);void completed.catch(()=>{});
 await Promise.all(children.map(child=>new Promise((resolve,reject)=>{let ready=false;child.stdout.once('data',data=>{try{assert.equal(String(data),'ready\n');ready=true;resolve();}catch(e){reject(e);}});child.on('error',reject);child.on('exit',code=>{if(!ready)reject(new Error(`worker exited before readiness: ${code}`));});})));for(const child of children)child.stdin.end('go\n');await completed;
 const current=f.service.configuration(f.pid);assert.equal(current.version,2);assert.equal(current.revisionIds.length,2);assert.deepEqual(new Set(f.service.bundleCatalog(f.pid,'coordinator',current.bundleId).skills.filter(s=>s.revisionId).map(s=>s.id)),new Set(['concurrent-a','concurrent-b']));
}finally{for(const child of children)if(child.exitCode===null&&!child.killed)child.kill();await Promise.all(children.map(child=>child.exitCode!==null||child.signalCode!==null?Promise.resolve():new Promise(resolve=>child.once('exit',resolve))));f.close();}});
