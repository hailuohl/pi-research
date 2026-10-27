import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,chmodSync,writeFileSync,realpathSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';
import {Store,digest} from '../../dist/packages/storage/store.js';import {SkillService} from '../../dist/packages/skills/service.js';import {BUNDLE_ID} from '../../dist/packages/skills/manifest.js';
const root=resolve('.'),owner={type:'user'};
function setup(){const dir=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-builtin-')),store=new Store(join(dir,'state.db')),pid=store.create('project',null,{archived:false}).id;const service=new SkillService(root,{store,dataDir:dir,repoRoot:root});return {dir,store,pid,service,close(){store.close();rmSync(dir,{recursive:true,force:true});}};}
function custom(f,tag='v1'){const r=f.service.import(owner,f.pid,{packageId:'builtin-test',revisionTag:tag,description:'test custom text',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from(tag).toString('base64')}]},tag);f.service.review(owner,f.pid,{revisionId:r.id,decision:'approved',note:'fixture'});return r;}

test('unknown archived configuration fails closed but an explicit valid selection repairs future configuration',()=>{const f=setup();try{
 f.store.create('skill-configuration',f.pid,{bundleId:'f'.repeat(64),revisionIds:[]},f.pid);
 assert.throws(()=>f.service.configuration(f.pid),{code:'SKILL_BUNDLE_UNKNOWN'});
 assert.throws(()=>f.service.configure(owner,f.pid,{expectedVersion:1,revisionIds:[]}),{code:'SKILL_BUNDLE_UNKNOWN'});
 assert.equal(f.service.configure(owner,f.pid,{expectedVersion:1,builtinBundleId:BUNDLE_ID,revisionIds:[]}).builtinBundleId,BUNDLE_ID);
 assert.equal(f.service.configuration(f.pid).builtinBundleId,BUNDLE_ID);
}finally{f.close();}});

test('approved custom bytes are reverified before starting their fixed bundle',()=>{const f=setup();try{
 const revision=custom(f),configuration=f.service.configure(owner,f.pid,{expectedVersion:0,revisionIds:[revision.id]}),path=join(f.dir,'skill-blobs',revision.files[0].digest);
 f.service.ensureBundleStartAllowed(f.pid,configuration.bundleId);
 chmodSync(path,0o600);writeFileSync(path,'corrupt reviewed text');
 assert.throws(()=>f.service.ensureBundleStartAllowed(f.pid,configuration.bundleId),{code:'SKILL_INTEGRITY_FAILED'});
}finally{f.close();}});
