import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {readCatalog,readSkill,selectSessionSkills} from '../../dist/packages/skills/runtime.js';
import {digest} from '../../dist/packages/storage/store.js';
import {setup,USER} from '../support/research.mjs';

const root=resolve('.');
const id='pi-research-code-debugging';
const source={repository:'hailuohl/pi-research',commit:'c087e1b64ad0c8e205d5178602fadfe46b06aab4',path:'skills/piresearch/pi-research-git/SKILL.md',blob:'88551aa3d83bb3a828599b4fd6bf43e7ccfb366c'};
const actor=session=>({type:'agent',role:session.role,projectId:session.projectId,sessionId:session.id});

test('research code debugging is discovered and read only by its registered roles with exact local provenance',()=>{
 const s=setup(),pid=s.project.id;
 try{
  const current=s.app.skills.bundleId,manifest=JSON.parse(readFileSync(join(root,'skills/piresearch/manifest.json'),'utf8'));
  const entry=manifest.skills.find(skill=>skill.id===id);
  assert.ok(entry,'register the research code debugging skill');
  assert.deepEqual(entry.roles,['coordinator','implementer','reviewer']);
  assert.deepEqual(entry.resources,[]);
  assert.deepEqual(entry.source,source);
  assert.equal(entry.requirements,undefined,'instructions must not request new capabilities');
  for(const role of ['coordinator','implementer','reviewer']){
   assert.ok(s.app.skills.bundleCatalog(pid,role,current).skills.some(skill=>skill.id===id));
   const result=s.app.skills.bundleRead(pid,role,current,id);
   assert.equal(result.content,readFileSync(join(root,entry.path),'utf8'));
   assert.equal(result.digest,digest(Buffer.from(result.content)));
   assert.equal(result.digest,entry.digest);
   assert.deepEqual(result.source,source);
   assert.throws(()=>s.app.skills.bundleRead(pid,role,current,id,'../pi-research-git/SKILL.md'),{code:'SKILL_RESOURCE_NOT_FOUND'});
  }
  for(const role of ['literature','designer','analyst','writer']){
   assert.ok(!s.app.skills.bundleCatalog(pid,role,current).skills.some(skill=>skill.id===id));
   assert.throws(()=>s.app.skills.bundleRead(pid,role,current,id),{code:'SKILL_SCOPE_DENIED'});
  }
  assert.ok(readCatalog(s.app,actor(s.session),pid).skills.some(skill=>skill.id===id));
 }finally{s.close();}
});

test('sessions read debugging guidance and the fixed binding survives reopen',()=>{
 const s=setup(),pid=s.project.id;
 try{
  const current=s.app.skills.bundleId;
  const session=s.app.sessions.create(USER,pid,{title:'With debugging guidance'});
  selectSessionSkills(s.app,USER,pid,{sessionId:session.id,expectedVersion:session.version,skillIds:[id]});
  const row=s.app.store.get('session',session.id,pid);
  const preserved=s.app.store.update('session',session.id,row.version,{generation:1,piSessionPath:'preserved-debugging.jsonl'});
  const expected=readSkill(s.app,actor(session),pid,id);
  assert.equal(expected.bundleId,current);
  s.app.close();s.app=new ResearchApp(s.dir,root);
  assert.deepEqual(s.app.store.get('session',session.id,pid),preserved);
  assert.deepEqual(readSkill(s.app,actor(session),pid,id),expected);
 }finally{s.close();}
});

