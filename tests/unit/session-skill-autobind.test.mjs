import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {startTeam,spec,actor} from '../support/collaboration.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {SYSTEM} from '../../dist/packages/domain/types.js';
import {prepareModelSelection} from '../../dist/packages/pi-adapter/model-management.js';
import {inspectSessionSkills,prepareSessionSkills,prepareTaskSkills,readSkill,selectSessionSkills} from '../../dist/packages/skills/runtime.js';

function configure(s,tag='one',requirements={tools:[],backends:[],artifactIds:[]}) {
 const revision=s.app.skills.import(USER,s.project.id,{packageId:'autobind-fixture',revisionTag:tag,description:'Automatic binding fixture',roles:['coordinator','analyst'],license:null,requirements,files:[{path:'SKILL.md',contentBase64:Buffer.from(`Frozen ${tag}`).toString('base64')}]},`autobind-${tag}`);
 s.app.skills.review(USER,s.project.id,{revisionId:revision.id,decision:'approved',note:'Reviewed fixture'});
 return s.app.skills.configure(USER,s.project.id,{expectedVersion:s.app.skills.configuration(s.project.id).version,revisionIds:[revision.id]});
}
async function preparedTask(s) {
 s.app.git.enable(USER,s.project.id);
 s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});
 await s.app.git.drain();
 const team=startTeam(s,[spec('a',{skillIds:['autobind-fixture']})]);
 assert.equal(s.app.teams.claim(team.id,true),null);
 const prepared=s.app.store.list('task-workspace',s.project.id)[0];
 assert.ok(prepared);
 return {team,prepared,session:s.app.store.get('session',prepared.sessionId)};
}

test('all new roots, branches and scheduler sessions return with the current durable bundle',()=>{
 const s=setup();try{
  const original=s.app.skills.configuration(s.project.id).bundleId;
  assert.equal(s.session.skillBundleId,original);
  const message=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'assistant',content:'Preserved branch point',mode:'prompt',status:'completed'});
  const current=configure(s),root=s.app.sessions.create(USER,s.project.id,{}),system=s.app.sessions.create(SYSTEM,s.project.id,{}, {role:'analyst'}),branch=s.app.sessions.branch(USER,s.session.id,message.id);
  for(const session of [root,system,branch])assert.equal(session.skillBundleId,current.bundleId);
  assert.equal(s.app.sessions.get(USER,s.session.id).skillBundleId,original);
  assert.equal(branch.parentSessionId,s.session.id);
  assert.equal(s.app.sessions.messages(USER,branch.id)[0].content,message.content);
  assert.throws(()=>s.app.sessions.create({type:'agent',projectId:s.project.id},s.project.id,{}),{code:'PERMISSION_DENIED'});
 }finally{s.close();}
});

test('binding fixes a version without eagerly reading skills or checking selected capabilities',()=>{
 const s=setup();try{
  const current=configure(s,'requires-backend',{tools:[],backends:['ssh'],artifactIds:[]}),read=s.app.skills.bundleRead;
  s.app.skills.bundleRead=()=>assert.fail('creation must not read skill bodies');
  const session=s.app.sessions.create(USER,s.project.id,{});
  s.app.skills.bundleRead=read;
  assert.equal(session.skillBundleId,current.bundleId);
  assert.equal(inspectSessionSkills(s.app,USER,s.project.id,session.id).ready,true);
  const selected=selectSessionSkills(s.app,USER,s.project.id,{sessionId:session.id,expectedVersion:session.version,skillIds:['autobind-fixture']});
  assert.equal(selected.ready,false);assert.equal(selected.missing[0].kind,'backend');
 }finally{s.close();}
});

test('project updates and reopen preserve native and unstarted pins while explicit selection remains available',()=>{
 const s=setup();try{
  const old=configure(s),idle=s.app.sessions.create(USER,s.project.id,{}),native=s.app.sessions.create(USER,s.project.id,{});
  s.app.store.update('session',native.id,native.version,{generation:1,piSessionPath:'preserved.jsonl'});
  const current=configure(s,'two');
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  for(const id of [idle.id,native.id])assert.equal(s.app.sessions.get(USER,id).skillBundleId,old.bundleId);
  const restored=s.app.sessions.get(USER,native.id);assert.equal(restored.piSessionPath,'preserved.jsonl');assert.equal(prepareSessionSkills(s.app,restored),old.bundleId);
  const who={type:'agent',projectId:s.project.id,sessionId:idle.id,role:'coordinator'};
  assert.equal(readSkill(s.app,who,s.project.id,'autobind-fixture').content,'Frozen one');
  const selected=selectSessionSkills(s.app,USER,s.project.id,{sessionId:idle.id,expectedVersion:idle.version,skillIds:['autobind-fixture']});
  assert.equal(selected.skillBundleId,current.bundleId);assert.deepEqual(selected.skillIds,['autobind-fixture']);
  assert.equal(readSkill(s.app,who,s.project.id,'autobind-fixture').content,'Frozen two');
  assert.throws(()=>readSkill(s.app,{...who,sessionId:s.app.sessions.create(SYSTEM,s.project.id,{}, {role:'reviewer'}).id,role:'reviewer'},s.project.id,'autobind-fixture'),{code:'SKILL_SCOPE_DENIED'});
  assert.throws(()=>selectSessionSkills(s.app,USER,s.project.id,{sessionId:native.id,expectedVersion:restored.version,skillIds:[]}),{code:'SKILL_SESSION_ALREADY_STARTED'});
 }finally{s.close();}
});

test('reusing an untouched legacy blank fills its missing pin even with an unchanged model',async()=>{
 const s=setup();try{
  const legacy=s.app.store.update('session',s.session.id,s.session.version,{skillBundleId:undefined}),current=configure(s),prepared=await prepareModelSelection(s.app.context);
  const result=s.app.sessions.createRoot(USER,s.project.id,{reuseSessionId:legacy.id,expectedVersion:legacy.version},prepared);
  assert.equal(result.id,legacy.id);assert.equal(result.skillBundleId,current.bundleId);assert.equal(result.version,legacy.version+1);
  configure(s,'two');
  const unchanged=s.app.sessions.createRoot(USER,s.project.id,{reuseSessionId:result.id,expectedVersion:result.version},prepared);
  assert.deepEqual(unchanged,result);
  const blank=s.app.sessions.create(USER,s.project.id,{}),unbound=s.app.store.update('session',blank.id,blank.version,{skillBundleId:undefined});
  s.app.sessions.configure(USER,{provider:'fixture',model:'autobind',thinking:'off'});
  const modelPrepared=await prepareModelSelection(s.app.context),combined=s.app.sessions.createRoot(USER,s.project.id,{reuseSessionId:unbound.id,expectedVersion:unbound.version},modelPrepared);
  assert.equal(combined.version,unbound.version+1);assert.equal(combined.skillBundleId,s.app.skills.configuration(s.project.id).bundleId);assert.deepEqual(combined.model,{provider:'fixture',model:'autobind',thinking:'off'});
 }finally{s.close();}
});

test('legacy blanks with frozen authorizations cannot guess a missing bundle',async()=>{
 const s=setup();try{
  s.app.store.update('session',s.session.id,s.session.version,{skillBundleId:undefined,workingGrantId:'fixed-authorization'});
  const bound=s.app.sessions.get(USER,s.session.id),prepared=await prepareModelSelection(s.app.context);
  assert.throws(()=>s.app.sessions.createRoot(USER,s.project.id,{reuseSessionId:bound.id,expectedVersion:bound.version},prepared),{code:'MODEL_BOUND'});
  assert.deepEqual(s.app.sessions.get(USER,bound.id),bound);
 }finally{s.close();}
});

test('prepared task skill binding validates session ownership and known bundle before admission',()=>{
 const s=setup();try{
  const current=configure(s),team=startTeam(s,[spec('a')]),task=s.app.teams.tasks(USER,team.id)[0],session=s.app.sessions.create(SYSTEM,s.project.id,{}, {role:task.role,teamId:team.id,taskId:task.id});
  assert.equal(prepareTaskSkills(s.app,task,session),current.bundleId);
  for(const patch of [{projectId:'foreign'},{taskId:'foreign'},{teamId:'foreign'},{role:'reviewer'}])assert.throws(()=>prepareTaskSkills(s.app,task,{...session,...patch}),{code:'SKILL_BINDING_MISMATCH'});
  assert.throws(()=>prepareTaskSkills(s.app,task,{...session,skillBundleId:'f'.repeat(64)}),{code:'SKILL_BUNDLE_UNKNOWN'});
  assert.equal(s.app.store.list('task-attempt').length,0);assert.equal(s.app.budget.summary(team.id).reserved,0);
 }finally{s.close();}
});

test('legacy task attempts without a recorded bundle remain blocked after project changes',()=>{
 const s=setup();try{
  configure(s);const team=startTeam(s,[spec('a')]),first=s.app.teams.claim(team.id);s.app.teams.fail(first.attempt.id,'Fixture transient failure');
  const historical=s.app.store.get('task-attempt',first.attempt.id);s.app.store.update('task-attempt',historical.id,historical.version,{skillBundleId:undefined});configure(s,'two');s.app.teams.retry(USER,first.task.id);
  assert.equal(s.app.teams.claim(team.id),null);const task=s.app.teams.tasks(USER,team.id)[0];assert.match(task.blockReason,/SKILL_BINDING_UNKNOWN/);assert.equal(task.attemptCount,1);assert.equal(s.app.store.list('task-attempt').length,1);assert.equal(s.app.budget.summary(team.id).reserved,0);
 }finally{s.close();}
});

test('prepared Git task retains its bundle across project edits and a later Git toggle',async()=>{
 const s=setup();try{
  const old=configure(s),{team,prepared,session}=await preparedTask(s);
  assert.equal(session.skillBundleId,old.bundleId);assert.equal(s.app.store.list('task-attempt').length,0);
  configure(s,'two');const p=s.app.projects.get(USER,s.project.id);s.app.store.update('project',p.id,p.version,{gitHistoryEnabled:false});
  assert.equal(s.app.teams.claim(team.id),null);assert.equal(s.app.budget.summary(team.id).reserved,0);
  await s.app.git.drain();
  const claimed=s.app.teams.claim(team.id);assert.ok(claimed);assert.equal(claimed.attempt.sessionId,prepared.sessionId);assert.equal(claimed.attempt.id,prepared.attemptId);assert.equal(claimed.attempt.skillBundleId,old.bundleId);assert.equal(claimed.context.skillBundleId,old.bundleId);
  assert.equal(s.app.store.get('session',session.id).skillBundleId,old.bundleId);assert.equal(readSkill(s.app,actor(claimed),s.project.id,'autobind-fixture').content,'Frozen one');
 }finally{await s.app.git.stop();s.close();}
});

test('prepared sessions with unknown bindings block before attempts or budget are consumed',async()=>{
 const s=setup();try{
  configure(s);const {team,session}=await preparedTask(s);
  s.app.store.update('session',session.id,session.version,{skillBundleId:undefined});await s.app.git.drain();
  assert.equal(s.app.teams.claim(team.id),null);const task=s.app.teams.tasks(USER,team.id)[0];
  assert.equal(task.execution,'blocked');assert.match(task.blockReason,/SKILL_BINDING_UNKNOWN/);assert.equal(task.attemptCount,0);assert.equal(s.app.store.list('task-attempt').length,0);assert.equal(s.app.budget.summary(team.id).reserved,0);
 }finally{await s.app.git.stop();s.close();}
});

test('a prepared retry cannot replace the original attempt bundle',async()=>{
 const s=setup();try{
  const old=configure(s),{team}=await preparedTask(s);await s.app.git.drain();const first=s.app.teams.claim(team.id);assert.ok(first);
  s.app.teams.fail(first.attempt.id,'Fixture transient failure');const current=configure(s,'two');s.app.teams.retry(USER,first.task.id);assert.equal(s.app.teams.claim(team.id,true),null);
  const prepared=s.app.store.list('task-workspace').find(w=>w.sessionId!==first.attempt.sessionId),session=s.app.store.get('session',prepared.sessionId);assert.equal(session.skillBundleId,old.bundleId);
  s.app.store.update('session',session.id,session.version,{skillBundleId:current.bundleId});await s.app.git.drain();
  assert.equal(s.app.teams.claim(team.id),null);const task=s.app.teams.tasks(USER,team.id)[0];assert.equal(task.execution,'blocked');assert.match(task.blockReason,/SKILL_BINDING_MISMATCH/);assert.equal(task.attemptCount,1);assert.equal(s.app.store.list('task-attempt').length,1);assert.equal(s.app.budget.summary(team.id).reserved,0);
 }finally{await s.app.git.stop();s.close();}
});
