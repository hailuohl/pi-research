import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {readSkill,selectSessionSkills} from '../../dist/packages/skills/runtime.js';
import {setup,USER} from '../support/research.mjs';

const root=resolve('.');
const skillId='pi-research-evidence',resource='references/regression-libraries.md';
const actor=session=>({type:'agent',role:session.role,projectId:session.projectId,sessionId:session.id});

test('regression library resource is declared, readable and survives session reopen',()=>{
 const s=setup(),pid=s.project.id;
 try{
  const current=s.app.skills.bundleId;
  const source=readFileSync(join(root,'skills/piresearch',skillId,resource),'utf8');
  const declaration=JSON.parse(readFileSync(join(root,'skills/piresearch/manifest.json'),'utf8')).skills.find(e=>e.id===skillId).resources.find(e=>e.path===resource);
  assert.ok(declaration);
  const readCurrent=()=>s.app.skills.bundleRead(pid,'coordinator',current,skillId,resource);
  assert.equal(readCurrent().content,source);
  assert.equal(readCurrent().digest,declaration.digest);

  const session=s.app.sessions.create(USER,pid,{title:'Regression methods'});
  selectSessionSkills(s.app,USER,pid,{sessionId:session.id,expectedVersion:session.version,skillIds:[]});
  const row=s.app.store.get('session',session.id,pid);
  const preserved=s.app.store.update('session',session.id,row.version,{generation:1,piSessionPath:'preserved-regression-methods.jsonl'});
  const expected=readSkill(s.app,actor(session),pid,skillId,resource);
  assert.equal(expected.content,source);
  assert.equal(expected.digest,declaration.digest);

  s.app.close();s.app=new ResearchApp(s.dir,root);
  assert.deepEqual(s.app.store.get('session',session.id,pid),preserved);
  assert.deepEqual(readSkill(s.app,actor(session),pid,skillId,resource),expected);
 }finally{s.close();}
});
