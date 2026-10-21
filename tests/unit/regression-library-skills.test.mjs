import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {readSkill,selectSessionSkills} from '../../dist/packages/skills/runtime.js';
import {setup,USER} from '../support/research.mjs';

const root=resolve('.'),previous='45d125ff07c7f1b2b856a624aa140edf887432cc0e84cf181375676df8b65bf2';
const introduced='6a24cca1c370257471bff9896d31f5e78d5ef313c29d7172e32d1055189b9be9';
const skillId='pi-research-evidence',resource='references/regression-libraries.md';
const actor=session=>({type:'agent',role:session.role,projectId:session.projectId,sessionId:session.id});

test('regression library resource is readable only from the upgraded bundle and survives session reopen',()=>{
 const s=setup(),pid=s.project.id;
 try{
  const current=s.app.skills.bundleId;
  const readCurrent=()=>s.app.skills.bundleRead(pid,'coordinator',current,skillId,resource);
  assert.doesNotThrow(readCurrent);
  assert.notEqual(current,previous);

  const oldManifest=JSON.parse(readFileSync(join(root,'skills/releases',previous,'manifest.json'),'utf8'));
  const newManifest=JSON.parse(readFileSync(join(root,'skills/releases',introduced,'manifest.json'),'utf8'));
  const currentManifest=JSON.parse(readFileSync(join(root,'skills/piresearch/manifest.json'),'utf8'));
  assert.equal(newManifest.skills.length,13);
  assert.deepEqual(newManifest.skills.map(e=>e.id),oldManifest.skills.map(e=>e.id));
  const before=oldManifest.skills.find(e=>e.id===skillId),after=newManifest.skills.find(e=>e.id===skillId);
  assert.deepEqual(after.roles,before.roles);
  for(const oldSkill of oldManifest.skills.filter(e=>e.id!==skillId)){
   const newSkill=newManifest.skills.find(e=>e.id===oldSkill.id);
   assert.equal(newSkill.digest,oldSkill.digest);
   assert.deepEqual(newSkill.resources,oldSkill.resources);
  }
  assert.deepEqual(after.resources.filter(e=>e.path!==resource).map(e=>e.path),before.resources.map(e=>e.path));
  for(const oldResource of before.resources){
   const newResource=after.resources.find(e=>e.path===oldResource.path);
   if(oldResource.path==='references/statistical-analysis.md'){
    const {digest:oldDigest,...oldMetadata}=oldResource,{digest:newDigest,...newMetadata}=newResource;
    assert.deepEqual(newMetadata,oldMetadata);
    assert.notEqual(newDigest,oldDigest);
   }else assert.deepEqual(newResource,oldResource);
  }
  assert.equal(after.resources.filter(e=>e.path===resource).length,1);
  const source=readFileSync(join(root,'skills/piresearch',skillId,resource),'utf8');
  const declaration=currentManifest.skills.find(e=>e.id===skillId).resources.find(e=>e.path===resource);
  assert.ok(declaration);
  assert.equal(readCurrent().content,source);
  assert.equal(readCurrent().digest,declaration.digest);
  assert.throws(()=>s.app.skills.bundleRead(pid,'coordinator',previous,skillId,resource),{code:'SKILL_RESOURCE_NOT_FOUND'});

  let configuration=s.app.skills.configure(USER,pid,{expectedVersion:0,builtinBundleId:previous,revisionIds:[]});
  const old=s.app.sessions.create(USER,pid,{title:'Old regression methods'});
  selectSessionSkills(s.app,USER,pid,{sessionId:old.id,expectedVersion:old.version,skillIds:[]});
  const oldRow=s.app.store.get('session',old.id,pid);
  const preserved=s.app.store.update('session',old.id,oldRow.version,{generation:1,piSessionPath:'preserved-regression-methods.jsonl'});

  configuration=s.app.skills.configure(USER,pid,{expectedVersion:configuration.version,builtinBundleId:current,revisionIds:[]});
  const next=s.app.sessions.create(USER,pid,{title:'Regression methods upgrade'});
  selectSessionSkills(s.app,USER,pid,{sessionId:next.id,expectedVersion:next.version,skillIds:[]});
  const expected=readSkill(s.app,actor(next),pid,skillId,resource);
  assert.equal(expected.content,source);
  assert.equal(expected.digest,declaration.digest);

  s.app.close();s.app=new ResearchApp(s.dir,root);
  assert.deepEqual(s.app.store.get('session',old.id,pid),preserved);
  assert.throws(()=>readSkill(s.app,actor(old),pid,skillId,resource),{code:'SKILL_RESOURCE_NOT_FOUND'});
  s.app.skills.configure(USER,pid,{expectedVersion:configuration.version,builtinBundleId:previous,revisionIds:[]});
  const future=s.app.sessions.create(USER,pid,{title:'After regression methods rollback'});
  assert.deepEqual(readSkill(s.app,actor(next),pid,skillId,resource),expected);
  assert.throws(()=>readSkill(s.app,actor(future),pid,skillId,resource),{code:'SKILL_RESOURCE_NOT_FOUND'});
 }finally{s.close();}
});
