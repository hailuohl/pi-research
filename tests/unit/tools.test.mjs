import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {ResearchApp} from '../../dist/packages/research-app.js';import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';import {USER} from '../../dist/packages/domain/types.js';
import {setup as collaborationSetup} from '../support/research.mjs';
import {startTeam,spec,actor as taskActor} from '../support/collaboration.mjs';
const setup=()=>{const dir=mkdtempSync(join(tmpdir(),'pi-tools-')),app=new ResearchApp(dir,process.cwd()),p=app.projects.create(USER,{name:'工具验证'}),s=app.sessions.create(USER,p.id,{title:'主会话'});const active=app.store.update('session',s.id,s.version,{state:'running',generation:1,leaseUntil:Date.now()+30000});return {dir,app,p,s:active,actor:{type:'agent',projectId:p.id,sessionId:s.id,role:'coordinator',generation:1},tools:new ToolDispatcher(app),close(){app.close();rmSync(dir,{recursive:true,force:true});}};};
test('tool dispatcher rejects invented tools and shell commands',async()=>{const s=setup();try{await assert.rejects(()=>s.tools.execute(s.actor,'bash',{command:'rm -rf /'},'1'),{code:'TOOL_DENIED'});assert.equal(s.app.store.list('run').length,0);}finally{s.close();}});

test('actual main session catalogs omit task context without changing other role or automation tools',()=>{
 const s=setup();try{
  for(const [automation,continuation,approvalResume] of [[false,false,false],[true,false,false],[true,true,false],[true,false,true]]){
   const roleTools=s.tools.definitions('coordinator',automation,undefined,continuation,approvalResume).map(t=>t.name);
   for(const sessionId of [s.s.id,'']){
    const names=s.tools.definitions('coordinator',automation,sessionId,continuation,approvalResume).map(t=>t.name);
    assert.equal(names.includes('task_context_read'),false);
    assert.deepEqual(names,roleTools.filter(name=>name!=='task_context_read'));
   }
  }
  assert.equal(s.tools.definitions('analyst',false,'missing-session').some(t=>t.name==='task_context_read'),false);
  assert.throws(()=>s.tools.definitions('coordinator',false,'missing-session'),{code:'NOT_FOUND'});
  assert.ok(s.tools.definitions('analyst').some(t=>t.name==='task_context_read'),'static role capability preflight keeps task tools');
 }finally{s.close();}
});

test('dispatched tasks keep context capabilities while direct, forged and expired calls remain denied',async()=>{
 const s=collaborationSetup();try{
  const tools=new ToolDispatcher(s.app),pid=s.project.id;
  const revision=s.app.skills.import(USER,pid,{packageId:'context-capability',revisionTag:'fixture',description:'Task context fixture',roles:['analyst'],license:null,requirements:{tools:['task_context_read'],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from('Read the assigned context.').toString('base64')}]},'context-capability');
  s.app.skills.review(USER,pid,{revisionId:revision.id,decision:'approved',note:'Fixture reviewed'});
  s.app.skills.configure(USER,pid,{expectedVersion:s.app.skills.configuration(pid).version,revisionIds:[revision.id]});
  const team=startTeam(s,[spec('context',{skillIds:['context-capability']})]),claimed=s.app.teams.claim(team.id);
  assert.ok(claimed,'static capability preflight must allow task context requirements before session creation');
  const actor=taskActor(claimed);
  assert.ok(tools.definitions(actor.role,false,actor.sessionId).some(t=>t.name==='task_context_read'));
  assert.deepEqual(await tools.execute(actor,'task_context_read',{},'context'),claimed.context);
  await assert.rejects(()=>tools.execute({...actor,attemptId:undefined},'task_context_read',{},'missing-attempt'),{code:'PERMISSION_DENIED'});
  await assert.rejects(()=>tools.execute({...actor,sessionId:s.session.id,role:'coordinator'},'task_context_read',{},'forged'),{code:'SCOPE_DENIED'});
  const root=s.app.store.get('session',s.session.id);s.app.store.update('session',root.id,root.version,{state:'running',generation:1,leaseUntil:Date.now()+30000});
  await assert.rejects(()=>tools.execute({type:'agent',projectId:pid,sessionId:root.id,role:'coordinator',generation:1},'task_context_read',{},'root'),{code:'PERMISSION_DENIED'});
  const attempt=s.app.store.get('task-attempt',claimed.attempt.id);s.app.store.update('task-attempt',attempt.id,attempt.version,{leaseUntil:0});
  await assert.rejects(()=>tools.execute(actor,'task_context_read',{},'expired-context'),{code:'LEASE_EXPIRED'});
 }finally{s.close();}
});
test('tool request is idempotent across repeated Pi tool-call ids',async()=>{const s=setup();try{const a=await s.tools.execute(s.actor,'artifact_create',{title:'测试.md',content:'原始证据'},'a');const b=await s.tools.execute(s.actor,'artifact_create',{title:'测试.md',content:'原始证据'},'a');assert.equal(a.id,b.id);assert.equal(s.app.store.list('artifact').length,1);}finally{s.close();}});
test('agent interrupted by user loses tool authority and cannot create artifacts',async()=>{const s=setup();try{s.app.sessions.interrupt(USER,s.s.id);await assert.rejects(()=>s.tools.execute(s.actor,'artifact_create',{title:'late',content:'late'},'a'),{code:'LEASE_EXPIRED'});assert.equal(s.app.store.list('artifact').length,0);}finally{s.close();}});
test('tool evidence read rejects evidence from another project',async()=>{const s=setup();try{const p=s.app.projects.create(USER,{name:'other'}),a=s.app.evidence.put(p.id,'private',Buffer.from('secret')),e=s.app.evidence.register(USER,p.id,a.id,0,6,'private');await assert.rejects(()=>s.tools.execute(s.actor,'evidence_read',{evidenceId:e.id},'b'),{code:'SCOPE_DENIED'});}finally{s.close();}});
test('reports with nonexistent or incomparable runs are refused',()=>{const s=setup();try{assert.throws(()=>s.app.reports.create(USER,s.p.id,{title:'bad',runIds:['made-up']}),{code:'NOT_FOUND'});}finally{s.close();}});
test('report distinguishes accepted claims from proposals',()=>{const s=setup();try{const a=s.app.evidence.put(s.p.id,'input',Buffer.from('observed')),e=s.app.evidence.register(USER,s.p.id,a.id,0,8,'observation');const c=s.app.evidence.proposeClaim(USER,s.p.id,'未审核的结论',[e.id]);assert.throws(()=>s.app.reports.create(USER,s.p.id,{title:'bad',claimIds:[c.id]}),{code:'CLAIM_NOT_ACCEPTED'});s.app.evidence.decideClaim(USER,c.id,c.version,'accepted');const report=s.app.reports.create(USER,s.p.id,{title:'合规报告',claimIds:[c.id]});assert.match(s.app.evidence.read(USER,report.id).bytes.toString(),/未审核的结论/);}finally{s.close();}});
