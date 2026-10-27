import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {SkillService} from '../../dist/packages/skills/service.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {setup,USER} from '../support/research.mjs';

const root=resolve('.'),previous='cf8638daffd84643b72fd4bfaa298c8daf5eb0d2d36640985916cc57cae463da';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const retired=new Set(['PROVENANCE.md','LICENSE']);
const functional=skill=>({id:skill.id,name:skill.name,description:skill.description,roles:skill.roles,prerequisites:skill.prerequisites,resources:skill.resources.filter(r=>!retired.has(r.path)).map(({digest,...resource})=>resource)});

test('current adaptation cleanup preserves functional resources and the previous fixed release',()=>{
 const service=new SkillService(root),current=JSON.parse(readFileSync(join(root,'skills/piresearch/manifest.json'),'utf8'));
 const archive=JSON.parse(readFileSync(join(root,'skills/releases',previous,'manifest.json'),'utf8'));
 const legacy=archive.skills[0].source,[owner,project]=legacy.repository.split('/');
 const retiredMarkers=new RegExp(project+'|Copyright[^\n]*'+owner+'|'+legacy.commit.slice(0,8)+'|PROVENANCE\\.md','i');
 assert.equal(sha(JSON.stringify(archive.skills)),previous);
 assert.equal(current.skills.length,14);
 assert.notEqual(current.bundleId,previous,'cleanup must publish a new release');
 assert.deepEqual(current.skills.map(functional),archive.skills.map(functional));
 for(const entry of current.skills){
  const catalog=service.list('coordinator').find(skill=>skill.id===entry.id);
  for(const resource of [undefined,...entry.resources.map(r=>r.path)]){
   const result=service.read('coordinator',entry.id,resource);
   assert.equal(result.bundleId,current.bundleId);
   assert.equal(sha(Buffer.from(result.content)),result.digest);
   assert.equal(result.content,readFileSync(join(root,resource?join(dirname(entry.path),resource):entry.path),'utf8'));
   assert.doesNotMatch(result.content,retiredMarkers);
   if(entry.id==='pi-research-code-debugging')assert.equal(result.source.repository,'hailuohl/pi-research');
   else {assert.equal(Object.hasOwn(entry,'source'),false);assert.equal(Object.hasOwn(catalog,'source'),false);assert.equal(Object.hasOwn(result,'source'),false);}
  }
 }
 for(const entry of archive.skills)for(const resource of [undefined,...entry.resources.map(r=>r.path)]){
  const result=service.read('coordinator',entry.id,resource,previous),expected=resource?entry.resources.find(r=>r.path===resource).digest:entry.digest;
  assert.equal(result.bundleId,previous);assert.equal(result.digest,expected);assert.equal(sha(Buffer.from(result.content)),expected);assert.deepEqual(result.source,entry.source);
 }
 for(const resource of retired)assert.throws(()=>service.read('coordinator','pi-research-figures',resource),{code:'SKILL_RESOURCE_NOT_FOUND'});
 assert.throws(()=>service.read('reviewer','pi-research-agent-delegation'),{code:'SKILL_SCOPE_DENIED'});
 assert.throws(()=>service.read('coordinator','pi-research-figures','../../.env'),{code:'SKILL_RESOURCE_NOT_FOUND'});
});


test('Registry delivers current and historical skills while optional source metadata stays closed',()=>{
 const s=setup(),scope={projectId:s.project.id},op=(name,input={})=>s.app.operations.execute(USER,name,input,scope);
 try{
  const read=op('research_skill_read',{skillId:'pi-research-evidence',resource:'references/statistical-analysis.md'});
  const catalog=op('research_skill_list'),packages=op('skill_package_list');
  assert.equal(Object.hasOwn(read,'source'),false);assert.ok(read.prerequisites.length>0);
  for(const parent of read.prerequisites)assert.equal(Object.hasOwn(parent,'source'),false);
  assert.equal(Object.hasOwn(catalog.skills.find(x=>x.id===read.id),'source'),false);
  assert.equal(Object.hasOwn(packages.builtinSkills.find(x=>x.id===read.id),'source'),false);
  const validSource=catalog.skills.find(x=>x.id==='pi-research-code-debugging').source;
  const invalidSources=[null,{...validSource,extra:'unexpected'}];
  for(const key of ['repository','commit','path','blob']){const missing={...validSource};delete missing[key];invalidSources.push(missing,{...validSource,[key]:42});}
  for(const [name,result,setSource] of [
   ['research_skill_read',read,(value,source)=>{value.source=source;}],
   ['research_skill_read',read,(value,source)=>{value.prerequisites[0].source=source;}],
   ['research_skill_list',catalog,(value,source)=>{value.skills[0].source=source;}],
   ['skill_package_list',packages,(value,source)=>{value.builtinSkills[0].source=source;}],
  ]){
   const valid=structuredClone(result);setSource(valid,validSource);assert.doesNotThrow(()=>validateSchema(OUTPUT_SCHEMAS[name],valid,'output'));
   for(const source of invalidSources){const invalid=structuredClone(result);setSource(invalid,source);assert.throws(()=>validateSchema(OUTPUT_SCHEMAS[name],invalid,'output'),{code:'INVALID_OUTPUT'});}
  }
  const {digest,...missingDigest}=read;assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.research_skill_read,missingDigest,'output'),{code:'INVALID_OUTPUT'});
  assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.research_skill_read,{...read,unexpected:true},'output'),{code:'INVALID_OUTPUT'});
  s.app.skills.configure(USER,s.project.id,{expectedVersion:0,builtinBundleId:previous,revisionIds:[]});
  const historical=op('research_skill_read',{skillId:read.id,resource:read.resource});assert.equal(historical.bundleId,previous);assert.equal(sha(Buffer.from(historical.content)),historical.digest);
  const archived=JSON.parse(readFileSync(join(root,'skills/releases',previous,'manifest.json'),'utf8')).skills.find(x=>x.id===read.id);
  assert.deepEqual(historical.source,archived.source);assert.deepEqual(op('research_skill_list').skills.find(x=>x.id===read.id).source,archived.source);
  assert.deepEqual(op('skill_package_list').builtinSkills.find(x=>x.id===read.id).source,archived.source);
 }finally{s.close();}
});
