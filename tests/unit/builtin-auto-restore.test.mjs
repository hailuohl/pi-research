import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {Store,digest} from '../../dist/packages/storage/store.js';
import {SkillService} from '../../dist/packages/skills/service.js';
const owner={type:'user'},root=resolve('.'),overview='pi-research-overview';
function setup(){const dir=mkdtempSync(join(tmpdir(),'pi-builtin-restore-')),store=new Store(join(dir,'state.db')),pid=store.create('project',null,{archived:false}).id,service=new SkillService(root,{store,dataDir:dir,repoRoot:root});return {dir,store,pid,service,close(){store.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}};}
function revision(f,id='retained-method'){return f.service.import(owner,f.pid,{packageId:id,revisionTag:'v1',description:'Frozen custom text',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from('Original custom text').toString('base64')}]},id);}
function disabled(f,revisionIds=[]){const builtinBundleId=f.service.bundleId,disabledBuiltinIds=[overview],body={projectId:f.pid,builtinBundleId,revisionIds,disabledBuiltinIds},bundleId=digest(body);f.store.create('skill-bundle',f.pid,{builtinBundleId,revisionIds,disabledBuiltinIds,contentDigest:bundleId},bundleId);f.store.create('skill-configuration',f.pid,{bundleId,revisionIds},f.pid);return f.service.configuration(f.pid);}
const snapshot=f=>({records:f.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all(),events:f.store.db.prepare('SELECT * FROM events ORDER BY seq').all(),operations:f.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all()});

for(const state of ['revoked','rejected'])test(`restoring builtins preserves retained ${state} custom revisions without authorizing them or changing history`,()=>{const f=setup();try{
 const r=revision(f),sibling=revision(f,'approved-sibling');for(const item of [r,sibling])f.service.review(owner,f.pid,{revisionId:item.id,decision:'approved',note:'Initial review'});if(state==='revoked')f.service.revoke(owner,f.pid,{revisionId:r.id,note:'Withdraw'});else f.service.review(owner,f.pid,{revisionId:r.id,decision:'rejected',note:'Withdraw'});
 const old=disabled(f,[r.id,sibling.id]),session=f.store.create('session',f.pid,{skillBundleId:old.bundleId}),bundleBytes=JSON.stringify(f.store.get('skill-bundle',old.bundleId)),sessionBytes=JSON.stringify(session),reviews=f.store.list('skill-review',f.pid),revocations=f.store.list('skill-revocation',f.pid),before=snapshot(f);
 const catalog=f.service.catalog(owner,f.pid);assert.deepEqual(catalog.configuration,old);assert.ok(catalog.builtinSkills.some(s=>s.id===overview));assert.deepEqual(snapshot(f),before,'readonly catalog must not restore or authorize anything');
 const value={expectedVersion:old.version,revisionIds:[sibling.id,r.id],disabledBuiltinIds:[]},restored=f.service.configure(owner,f.pid,value,'restore');assert.deepEqual(restored.disabledBuiltinIds,[]);assert.deepEqual(new Set(restored.revisionIds),new Set(old.revisionIds));assert.equal(restored.builtinBundleId,old.builtinBundleId);assert.equal(restored.version,old.version+1);assert.notEqual(restored.bundleId,old.bundleId);
 assert.ok(f.service.bundleCatalog(f.pid,'coordinator',restored.bundleId).skills.some(s=>s.id===overview));assert.deepEqual(f.store.list('skill-review',f.pid),reviews);assert.deepEqual(f.store.list('skill-revocation',f.pid),revocations);assert.throws(()=>f.service.ensureBundleStartAllowed(f.pid,restored.bundleId),{code:state==='revoked'?'SKILL_REVOKED':'SKILL_NOT_APPROVED'});
 assert.equal(JSON.stringify(f.store.get('skill-bundle',old.bundleId)),bundleBytes);assert.equal(JSON.stringify(f.store.get('session',session.id)),sessionBytes);assert.throws(()=>f.service.bundleRead(f.pid,'coordinator',old.bundleId,overview),{code:'SKILL_DISABLED'});assert.equal(f.service.bundleRead(f.pid,'coordinator',old.bundleId,r.packageId).content,'Original custom text');assert.throws(()=>f.service.bundleRead(f.pid,'reviewer',restored.bundleId,r.packageId),{code:'SKILL_SCOPE_DENIED'});
 const after=snapshot(f);assert.deepEqual(f.service.configure(owner,f.pid,value,'restore'),restored);assert.deepEqual(snapshot(f),after);
}finally{f.close();}});

test('legacy disabled builtin-only configuration restores explicitly; catalog stays readonly and guards remain atomic',()=>{const f=setup();try{
 const old=disabled(f),before=snapshot(f),value={expectedVersion:old.version,revisionIds:[],disabledBuiltinIds:[]};f.service.catalog(owner,f.pid);assert.deepEqual(snapshot(f),before);
 assert.throws(()=>f.service.configure({type:'agent',projectId:f.pid},f.pid,value,'agent'),{code:'PERMISSION_DENIED'});assert.throws(()=>f.service.configure(owner,f.pid,{...value,expectedVersion:0},'stale'),{code:'VERSION_CONFLICT'});assert.deepEqual(snapshot(f),before);
 const p=f.store.get('project',f.pid);f.store.update('project',p.id,p.version,{archived:true});const archived=snapshot(f);assert.throws(()=>f.service.configure(owner,f.pid,value,'archived'),{code:'PROJECT_ARCHIVED'});assert.deepEqual(snapshot(f),archived);assert.deepEqual(f.service.catalog(owner,f.pid).configuration,old);assert.deepEqual(snapshot(f),archived);
 f.store.update('project',p.id,p.version+1,{archived:false});const restored=f.service.configure(owner,f.pid,value,'restore');assert.equal(restored.bundleId,f.service.bundleId);assert.deepEqual(restored.disabledBuiltinIds,[]);assert.doesNotThrow(()=>f.service.ensureBundleStartAllowed(f.pid,restored.bundleId));assert.throws(()=>f.service.bundleRead(f.pid,'coordinator',old.bundleId,overview),{code:'SKILL_DISABLED'});
}finally{f.close();}});

test('builtin restoration cannot add, re-enable, delete, change baseline or roll back into disabled skills',()=>{const f=setup();try{
 const retained=revision(f),added=revision(f,'new-pending-method');f.service.review(owner,f.pid,{revisionId:retained.id,decision:'rejected',note:'Not approved'});const old=disabled(f,[retained.id]),value={expectedVersion:old.version,revisionIds:[retained.id],disabledBuiltinIds:[]},before=snapshot(f);
 for(const [change,code] of [[{revisionIds:[retained.id,added.id]},'SKILL_NOT_APPROVED'],[{revisionIds:[added.id]},'SKILL_NOT_APPROVED'],[{builtinBundleId:'6683733f868b846a6bed3434bba1ff2bdceed99aece0538ac75fe1c70bbd89f2'},'SKILL_NOT_APPROVED'],[{disabledBuiltinIds:[overview]},'BUILTIN_SKILL_REQUIRED']]){assert.throws(()=>f.service.configure(owner,f.pid,{...value,...change},JSON.stringify(change)),{code});assert.deepEqual(snapshot(f),before);}
 assert.throws(()=>f.service.configure(owner,f.pid,{expectedVersion:old.version,bundleId:old.bundleId},'exact'),{code:'BUILTIN_SKILL_REQUIRED'});assert.deepEqual(snapshot(f),before);
 const other=f.store.create('project',null,{archived:false}).id,cross=snapshot(f);assert.throws(()=>f.service.configure(owner,other,{expectedVersion:0,revisionIds:[retained.id],disabledBuiltinIds:[]},'foreign'),{code:'SCOPE_DENIED'});assert.deepEqual(snapshot(f),cross);
 const restored=f.service.configure(owner,f.pid,value,'restore'),off=f.service.configure(owner,f.pid,{expectedVersion:restored.version,revisionIds:[]},'off'),removed=snapshot(f);assert.throws(()=>f.service.configure(owner,f.pid,{expectedVersion:off.version,revisionIds:[retained.id],disabledBuiltinIds:[]},'reenable'),{code:'SKILL_NOT_APPROVED'});assert.deepEqual(snapshot(f),removed);
}finally{f.close();}});

test('deleted-revision guard still rejects a legacy disabled bundle restoration',()=>{const f=setup();try{
 const r=revision(f),old=disabled(f,[r.id]);f.store.create('skill-deletion',f.pid,{revisionId:r.id,contentDigest:r.contentDigest},r.id);const before=snapshot(f);assert.throws(()=>f.service.configure(owner,f.pid,{expectedVersion:old.version,revisionIds:[r.id],disabledBuiltinIds:[]},'deleted'),{code:'SKILL_DELETED'});assert.deepEqual(snapshot(f),before);
}finally{f.close();}});
