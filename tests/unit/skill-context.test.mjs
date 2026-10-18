import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cpSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {SkillService} from '../../dist/packages/skills/service.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {setup,USER} from '../support/research.mjs';

const root=resolve('.'),previous='65b19e243a1b0571def4f1c664a47d1e723626e8242944c89c057d01f899b620';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const verify=text=>assert.equal(sha(Buffer.from(text.content)),text.digest);

test('method requirements belong to the fixed resource release, not its name or prose',()=>{
 const service=new SkillService(root),old='eaedaaa0df1a48559bdc26b5020a94b4c98877db6973c29dc6c4e6000b8c0d95';
 const literature=service.read('coordinator','pi-research-lit-review','references/systematic-review.md');
 assert.deepEqual(literature.methodRequirements,['literature-identity']);verify(literature);
 for(const [id,path] of [['pi-research-experiment-tree','references/experimental-design.md'],['pi-research-evidence','references/statistical-analysis.md']])assert.deepEqual(service.read('coordinator',id,path).methodRequirements,['quantitative-decision']);
 assert.equal(service.read('coordinator','pi-research-lit-review','references/systematic-review.md',old).methodRequirements,undefined);
 assert.equal(service.read('coordinator','pi-research-experiment-tree','references/experimental-design.md',old).methodRequirements,undefined);
 assert.equal(service.read('coordinator','pi-research-evidence','references/uncertainty-and-units.md').methodRequirements,undefined);
 assert.deepEqual(service.read('coordinator','pi-research-evidence','references/paired-polynomial-comparison.md').methodRequirements,['structured-paired-protocol','closed-paired-evidence']);
 assert.deepEqual(service.read('coordinator','pi-research-evidence','references/paired-polynomial-comparison.md','cc80014242e5cd4e3489d0cf9e6dbf2a5361b18c8fd347e20ca3f889ba7e9214').methodRequirements,['structured-paired-protocol']);
 assert.throws(()=>service.read('coordinator','pi-research-evidence','references/paired-polynomial-comparison.md','bd2c000f20c49ee33caccb0d83dac71e212634d8fd42809bf53ed11b2e724441'),{code:'SKILL_RESOURCE_NOT_FOUND'});
});

test('bundle method capabilities do not upgrade a selected historical release',()=>{
 const f=setup();try{
  const current=f.app.skills.configuration(f.project.id).bundleId;
  assert.deepEqual(f.app.skills.bundleMethodRequirements(f.project.id,'coordinator',current),['closed-paired-evidence','literature-identity','quantitative-decision','structured-paired-protocol']);
  assert.deepEqual(f.app.skills.bundleMethodRequirements(f.project.id,'coordinator','cc80014242e5cd4e3489d0cf9e6dbf2a5361b18c8fd347e20ca3f889ba7e9214'),['literature-identity','quantitative-decision','structured-paired-protocol']);
  assert.deepEqual(f.app.skills.bundleMethodRequirements(f.project.id,'coordinator','bd2c000f20c49ee33caccb0d83dac71e212634d8fd42809bf53ed11b2e724441'),['literature-identity','quantitative-decision']);
  assert.deepEqual(f.app.skills.bundleMethodRequirements(f.project.id,'coordinator','eaedaaa0df1a48559bdc26b5020a94b4c98877db6973c29dc6c4e6000b8c0d95'),[]);
  const historical=f.app.skills.configure(USER,f.project.id,{expectedVersion:0,revisionIds:[],builtinBundleId:'eaedaaa0df1a48559bdc26b5020a94b4c98877db6973c29dc6c4e6000b8c0d95'});
  assert.deepEqual(f.app.skills.bundleMethodRequirements(f.project.id,'coordinator',historical.bundleId),[]);
 }finally{f.close();}
});

test('resource reads carry the verified parent without changing resource content identity',()=>{
 const service=new SkillService(root),value=service.read('analyst','pi-research-evidence','references/statistical-analysis.md');
 const parent=value.prerequisites?.find(x=>x.id===value.id&&x.resource==='SKILL.md');
 assert.ok(parent,'The caller must receive parent instructions even when it requests a resource directly');
 assert.equal(value.content,readFileSync(join(root,'skills/piresearch',value.id,value.resource),'utf8'));
 assert.equal(parent.content,readFileSync(join(root,'skills/piresearch',value.id,'SKILL.md'),'utf8'));
 for(const item of [value,...value.prerequisites]){verify(item);assert.equal(item.bundleId,value.bundleId);assert.ok(!('prerequisites' in item)||item===value);}
 assert.equal(value.prerequisites.length,1,'Unrelated methods are not eagerly loaded');
});

test('declared scientific prerequisite is delivered with its parent in the same fixed release',()=>{
 const service=new SkillService(root),value=service.read('coordinator','pi-research-experiment-tree','references/experimental-design.md');
 assert.deepEqual(value.prerequisites.map(x=>`${x.id}/${x.resource}`),[
  'pi-research-evidence/SKILL.md','pi-research-evidence/references/scientific-critical-thinking.md','pi-research-experiment-tree/SKILL.md'
 ]);
 for(const item of [value,...value.prerequisites]){verify(item);assert.equal(item.bundleId,service.bundleId);}
 assert.equal(service.read('coordinator','pi-research-overview').prerequisites,undefined,'Ordinary bootstrap does not preload all methods');
 assert.throws(()=>service.read('literature','pi-research-experiment-tree','references/experimental-design.md'),{code:'SKILL_SCOPE_DENIED'});
 const old=service.read('coordinator','pi-research-experiment-tree','references/experimental-design.md',previous);
 assert.equal(old.prerequisites.length,1);assert.equal(old.prerequisites[0].id,'pi-research-experiment-tree');
 for(const item of [old,...old.prerequisites]){verify(item);assert.equal(item.bundleId,previous);assert.equal(item.content,readFileSync(join(root,'skills/releases',previous,'blobs',item.digest),'utf8'));}
});

test('resource delivery fails closed when its parent bytes are corrupted',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-parent-integrity-'));
 try{cpSync(join(root,'skills'),join(dir,'skills'),{recursive:true});writeFileSync(join(dir,'skills/piresearch/pi-research-evidence/SKILL.md'),'corrupted parent');
  assert.throws(()=>new SkillService(dir).read('reviewer','pi-research-evidence','references/statistical-analysis.md'),{code:'SKILL_INTEGRITY_FAILED'});
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('report reads deliver fixed EDA and critical-thinking bodies without upgrading historical reports',()=>{
 const service=new SkillService(root),value=service.read('reviewer','pi-research-reports');
 assert.deepEqual(value.prerequisites.map(x=>`${x.id}/${x.resource}`),[
  'pi-research-evidence/SKILL.md','pi-research-evidence/references/exploratory-data-analysis.md','pi-research-evidence/references/scientific-critical-thinking.md'
 ]);
 for(const item of [value,...value.prerequisites]){verify(item);assert.equal(item.bundleId,value.bundleId);}
 const old=service.read('reviewer','pi-research-reports',undefined,'bd3c61039758b0b9e6707605fd8a7753de4e8e8b6c4bd6fc469597c48d29aa9f');
 assert.equal(old.prerequisites,undefined);verify(old);
 assert.equal(old.content,readFileSync(join(root,'skills/releases',old.bundleId,'blobs',old.digest),'utf8'));
});

test('custom and builtin parent contexts retain the mixed project bundle identity across reopen',()=>{
 const f=setup();try{
  const encode=content=>Buffer.from(content).toString('base64'),id='custom-context-example';
  const imported=f.app.skills.import(USER,f.project.id,{packageId:id,revisionTag:'1',description:'Custom text example',roles:['coordinator'],license:'MIT',requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:encode('---\nname: custom-context-example\ndescription: Custom text example\n---\nRead the listed reference with its entry rules.\n')},{path:'references/detail.md',contentBase64:encode('A fixed custom reference.\n')}]},'context-import');
  f.app.skills.review(USER,f.project.id,{revisionId:imported.id,decision:'approved',note:'Test fixture'});
  const config=f.app.skills.configure(USER,f.project.id,{expectedVersion:0,revisionIds:[imported.id]});
  const custom=f.app.skills.bundleRead(f.project.id,'coordinator',config.bundleId,id,'references/detail.md');
  const builtin=f.app.skills.bundleRead(f.project.id,'coordinator',config.bundleId,'pi-research-experiment-tree');
  assert.equal(custom.prerequisites[0].id,id);
  for(const result of [custom,builtin])for(const item of [result,...result.prerequisites]){verify(item);assert.equal(item.bundleId,config.bundleId);}
  assert.throws(()=>f.app.skills.bundleRead(f.project.id,'reviewer',config.bundleId,id,'references/detail.md'),{code:'SKILL_SCOPE_DENIED'});
  f.app.close();f.app=new ResearchApp(f.dir,root);
  assert.deepEqual(f.app.skills.bundleRead(f.project.id,'coordinator',config.bundleId,id,'references/detail.md'),custom);
  assert.deepEqual(f.app.skills.bundleRead(f.project.id,'coordinator',config.bundleId,'pi-research-experiment-tree'),builtin);
 }finally{f.close();}
});
