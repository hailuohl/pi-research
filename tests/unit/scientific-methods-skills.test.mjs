import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {readSkill,selectSessionSkills} from '../../dist/packages/skills/runtime.js';
import {setup,USER} from '../support/research.mjs';

const root=resolve('.'),previous='5f147a56da6ba9ad7e665a7dfb5bcbe08ab9818a2c1645c6c5be325f0703df04';
const methods=[
 ['pi-research-experiment-tree','experimental-design'],
 ['pi-research-experiment-tree','statistical-power'],
 ['pi-research-experiment-tree','hypothesis-generation'],
 ['pi-research-evidence','exploratory-data-analysis'],
 ['pi-research-evidence','statistical-analysis'],
 ['pi-research-evidence','uncertainty-and-units'],
 ['pi-research-evidence','scientific-critical-thinking'],
 ['pi-research-lit-review','systematic-review']
].map(([skillId,name])=>({skillId,resource:`references/${name}.md` }));
const actor=session=>({type:'agent',role:session.role,projectId:session.projectId,sessionId:session.id});

test('eight methods obey existing roles and retain exact session versions across upgrade, reopen and rollback',()=>{
 const s=setup(),pid=s.project.id;
 try{
  const current=s.app.skills.bundleId;
  assert.notEqual(current,previous);
  const oldCatalog=s.app.skills.bundleCatalog(pid,'coordinator',previous);
  const newCatalog=s.app.skills.bundleCatalog(pid,'coordinator',current);
  const currentIds=newCatalog.skills.map(e=>e.id);
  assert.equal(currentIds.filter(id=>id==='pi-research-code-debugging').length,1);
  assert.deepEqual(currentIds.filter(id=>id!=='pi-research-code-debugging'),oldCatalog.skills.map(e=>e.id));
  const priorRelease=JSON.parse(readFileSync(join(root,'skills/releases',previous,'manifest.json'),'utf8'));
  const nextRelease=JSON.parse(readFileSync(join(root,'skills/piresearch/manifest.json'),'utf8'));
  for(const {skillId,resource} of methods){
   const before=priorRelease.skills.find(e=>e.id===skillId),after=nextRelease.skills.find(e=>e.id===skillId);
   assert.deepEqual(after.roles,before.roles);
   for(const role of ['coordinator','literature','designer','implementer','analyst','reviewer','writer']){
    if(before.roles.includes(role)){
     const result=s.app.skills.bundleRead(pid,role,current,skillId,resource);
     assert.equal(result.content,readFileSync(join(root,'skills/piresearch',skillId,resource),'utf8'));
     assert.equal(result.digest,after.resources.find(r=>r.path===resource).digest);
    }else assert.throws(()=>s.app.skills.bundleRead(pid,role,current,skillId,resource),{code:'SKILL_SCOPE_DENIED'});
   }
   assert.throws(()=>s.app.skills.bundleRead(pid,'coordinator',previous,skillId,resource),{code:'SKILL_RESOURCE_NOT_FOUND'});
  }

  let configuration=s.app.skills.configure(USER,pid,{expectedVersion:0,builtinBundleId:previous,revisionIds:[]});
  const old=s.app.sessions.create(USER,pid,{title:'Old research methods'});
  selectSessionSkills(s.app,USER,pid,{sessionId:old.id,expectedVersion:old.version,skillIds:[]});
  const oldRow=s.app.store.get('session',old.id,pid);
  const preserved=s.app.store.update('session',old.id,oldRow.version,{generation:1,piSessionPath:'preserved-methods.jsonl'});
  const oldBody=readSkill(s.app,actor(old),pid,'pi-research-experiment-tree');
  configuration=s.app.skills.configure(USER,pid,{expectedVersion:configuration.version,builtinBundleId:current,revisionIds:[]});
  const next=s.app.sessions.create(USER,pid,{title:'New research methods'});
  selectSessionSkills(s.app,USER,pid,{sessionId:next.id,expectedVersion:next.version,skillIds:[]});
  const expected=methods.map(({skillId,resource})=>readSkill(s.app,actor(next),pid,skillId,resource));

  s.app.close();s.app=new ResearchApp(s.dir,root);
  assert.deepEqual(s.app.store.get('session',old.id,pid),preserved);
  assert.deepEqual(readSkill(s.app,actor(old),pid,'pi-research-experiment-tree'),oldBody);
  s.app.skills.configure(USER,pid,{expectedVersion:configuration.version,builtinBundleId:previous,revisionIds:[]});
  const future=s.app.sessions.create(USER,pid,{title:'After explicit rollback'});
  for(const [index,{skillId,resource}] of methods.entries()){
   assert.deepEqual(readSkill(s.app,actor(next),pid,skillId,resource),expected[index]);
   assert.throws(()=>readSkill(s.app,actor(old),pid,skillId,resource),{code:'SKILL_RESOURCE_NOT_FOUND'});
   assert.throws(()=>readSkill(s.app,actor(future),pid,skillId,resource),{code:'SKILL_RESOURCE_NOT_FOUND'});
  }
  assert.throws(()=>readSkill(s.app,actor(next),pid,'pi-research-evidence','../../.env'),{code:'SKILL_RESOURCE_NOT_FOUND'});
 }finally{s.close();}
});
