import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {readSkill,selectSessionSkills} from '../../dist/packages/skills/runtime.js';
import {setup,USER} from '../support/research.mjs';

const root=resolve('.');
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

test('eight methods obey existing roles and retain exact session versions across reopen',()=>{
 const s=setup(),pid=s.project.id;
 try{
  const current=s.app.skills.bundleId;
  const newCatalog=s.app.skills.bundleCatalog(pid,'coordinator',current);
  const currentIds=newCatalog.skills.map(e=>e.id);
  assert.equal(currentIds.filter(id=>id==='pi-research-code-debugging').length,1);
  const nextRelease=JSON.parse(readFileSync(join(root,'skills/piresearch/manifest.json'),'utf8'));
  for(const {skillId,resource} of methods){
   const after=nextRelease.skills.find(e=>e.id===skillId);
   for(const role of ['coordinator','literature','designer','implementer','analyst','reviewer','writer']){
    if(after.roles.includes(role)){
     const result=s.app.skills.bundleRead(pid,role,current,skillId,resource);
     assert.equal(result.content,readFileSync(join(root,'skills/piresearch',skillId,resource),'utf8'));
     assert.equal(result.digest,after.resources.find(r=>r.path===resource).digest);
    }else assert.throws(()=>s.app.skills.bundleRead(pid,role,current,skillId,resource),{code:'SKILL_SCOPE_DENIED'});
   }
  }
  const session=s.app.sessions.create(USER,pid,{title:'Research methods'});
  selectSessionSkills(s.app,USER,pid,{sessionId:session.id,expectedVersion:session.version,skillIds:[]});
  const row=s.app.store.get('session',session.id,pid);
  const preserved=s.app.store.update('session',session.id,row.version,{generation:1,piSessionPath:'preserved-methods.jsonl'});
  const expected=methods.map(({skillId,resource})=>readSkill(s.app,actor(session),pid,skillId,resource));
  s.app.close();s.app=new ResearchApp(s.dir,root);
  assert.deepEqual(s.app.store.get('session',session.id,pid),preserved);
  for(const [index,{skillId,resource}] of methods.entries())assert.deepEqual(readSkill(s.app,actor(session),pid,skillId,resource),expected[index]);
  assert.throws(()=>readSkill(s.app,actor(session),pid,'pi-research-evidence','../../.env'),{code:'SKILL_RESOURCE_NOT_FOUND'});
 }finally{s.close();}
});

