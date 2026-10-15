import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve} from '../support/research.mjs';
import {validateGraph} from '../../dist/packages/collaboration/graph.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
const spec=(key,extra={})=>({key,role:'analyst',objective:'Analyze an explicit fixture',dependencies:[],...extra});
const output=(extra={})=>({summary:'Text-only fixture; not a scientific result.',outcome:'completed',evidenceIds:[],artifactIds:[],claims:[],unresolvedQuestions:[],...extra});
const actor=c=>({type:'agent',projectId:c.task.projectId,sessionId:c.attempt.sessionId,role:c.task.role,taskId:c.task.id,attemptId:c.attempt.id,generation:c.attempt.generation});
function start(s,tasks){const p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});const t=s.app.teams.create(USER,s.session.id,{goal:'Audit regression',tasks,budget:20});approve(s.app,t.approvalId);return s.app.teams.activate(USER,t.id);}
const review=(key,target,extra={})=>spec(key,{role:'reviewer',reviewOf:target,...extra});
test('A01 explicit reviewer keeps ordinary producer pending and can run',()=>{const s=setup();try{const t=start(s,[spec('a'),review('r','a')]);const a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),output());assert.equal(s.app.store.get('task',a.task.id).acceptance,'pending');const r=s.app.teams.claim(t.id);assert.equal(r.task.key,'r');s.app.teams.submit(actor(r),output({verdict:'accept'}));assert.equal(s.app.teams.get(USER,t.id).state,'completed');}finally{s.close();}});
test('A02 reject acceptance-stage cycle even when task-only DAG is acyclic',()=>{assert.throws(()=>validateGraph([spec('a',{critical:true}),spec('b',{dependencies:['a']}),review('r','a',{dependencies:['b']})]),{code:'REVIEW_DEADLOCK'});});
test('A03 all declared reviews gate acceptance; opposite votes become disputed',()=>{const s=setup();try{const t=start(s,[spec('a',{critical:true}),review('r1','a'),review('r2','a'),spec('w',{role:'writer',dependencies:['a']})]);const a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),output());const r1=s.app.teams.claim(t.id),r2=s.app.teams.claim(t.id);s.app.teams.submit(actor(r1),output({verdict:'reject'}));assert.notEqual(s.app.store.get('task',a.task.id).acceptance,'accepted');s.app.teams.submit(actor(r2),output({verdict:'accept'}));assert.equal(s.app.store.get('task',a.task.id).acceptance,'disputed');assert.equal(s.app.teams.claim(t.id),null);}finally{s.close();}});
test('A03 one accept does not release downstream before another reviewer answers',()=>{const s=setup();try{const t=start(s,[spec('a'),review('r1','a'),review('r2','a'),spec('w',{dependencies:['a']})]);const a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),output());const r1=s.app.teams.claim(t.id),r2=s.app.teams.claim(t.id);s.app.teams.submit(actor(r1),output({verdict:'accept'}));assert.equal(s.app.store.get('task',a.task.id).acceptance,'pending');assert.equal(s.app.teams.claim(t.id),null);s.app.teams.submit(actor(r2),output({verdict:'accept'}));assert.equal(s.app.teams.claim(t.id).task.key,'w');}finally{s.close();}});
test('A04 persist and enforce required report and dataset output contracts',()=>{const s=setup();try{const expectedOutputs=[{kind:'report',schemaId:'report',required:true,title:'report.md'},{kind:'dataset',schemaId:'csv',required:true,title:'metrics.csv'}];const t=start(s,[spec('w',{role:'writer',expectedOutputs,acceptanceRuleIds:['artifact-required']})]);const a=s.app.teams.claim(t.id);assert.equal(a.task.expectedOutputs.length,2);assert.throws(()=>s.app.teams.submit(actor(a),output()),{code:'TASK_OUTPUT_MISSING'});const report=s.app.evidence.put(s.project.id,'report.md',Buffer.from('# Fixture'),'text/markdown','test',{taskId:a.task.id});assert.throws(()=>s.app.teams.submit(actor(a),output({artifactIds:[report.id]})),{code:'TASK_OUTPUT_MISSING'});const csv=s.app.evidence.put(s.project.id,'metrics.csv',Buffer.from('x,y\n1,2\n'),'text/csv','test',{taskId:a.task.id});s.app.teams.submit(actor(a),output({artifactIds:[report.id,csv.id]}));assert.equal(s.app.teams.get(USER,t.id).state,'completed');}finally{s.close();}});
test('unsupported acceptance rules fail closed rather than disappear',()=>assert.throws(()=>validateGraph([spec('a',{acceptanceRuleIds:['model-says-perfect']})]),{code:'ACCEPTANCE_RULE_UNSUPPORTED'}));
test('empty required artifact is not a valid deliverable',()=>{const s=setup();try{const t=start(s,[spec('w',{expectedOutputs:[{kind:'report',schemaId:'report',title:'report.md',required:true}]})]);const a=s.app.teams.claim(t.id);const art=s.app.evidence.put(s.project.id,'report.md',Buffer.alloc(0),'text/markdown','test',{taskId:a.task.id});assert.throws(()=>s.app.teams.submit(actor(a),output({artifactIds:[art.id]})),{code:'TASK_OUTPUT_INVALID'});}finally{s.close();}});
test('partial output cannot be manually accepted as a complete task',()=>{const s=setup();try{const t=start(s,[spec('a')]);const a=s.app.teams.claim(t.id);s.app.teams.submit(actor(a),output({outcome:'partial'}));assert.throws(()=>s.app.teams.manualReview(USER,a.task.id,{verdict:'accepted',reason:'partial is not done'}),{code:'TASK_OUTPUT_INCOMPLETE'});}finally{s.close();}});

test('reviewer required artifact contracts reject plans before creating collaboration records',()=>{
 const s=setup();try{
  const p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});
  const counts=()=>Object.fromEntries(['team','team-plan','task','task-attempt','approval','session'].map(kind=>[kind,s.app.store.list(kind).length]));
  const before=counts(),declared={kind:'review',schemaId:'review',mediaType:'text/markdown',minBytes:800};
  for(const extra of [{expectedOutputs:[declared]},{expectedOutputs:[{...declared,required:true}]},{acceptanceRuleIds:['artifact-required']},{expectedOutputs:[{...declared,required:false}],acceptanceRuleIds:['artifact-required']}]){
   assert.throws(()=>s.app.teams.create(USER,s.session.id,{goal:'Unsupported reviewer contract',tasks:[spec('r',{role:'reviewer',...extra})]}),error=>{
    assert.equal(error.code,'REVIEW_OUTPUT_UNSUPPORTED');assert.match(error.message,/expectedOutputs=\[\]/);assert.match(error.message,/summary/);assert.match(error.message,/verdict/);return true;
   });
   assert.deepEqual(counts(),before);
  }
 }finally{s.close();}
});

test('analyst artifact is independently reviewed through summary and verdict without reviewer write authority',async()=>{
 const s=setup();try{
  const tools=new ToolDispatcher(s.app),t=start(s,[spec('a',{expectedOutputs:[{kind:'report',schemaId:'report',mediaType:'text/markdown',minBytes:10}]}),review('r','a',{expectedOutputs:[{kind:'review',schemaId:'review',required:false}]})]);
  const a=s.app.teams.claim(t.id),report=await tools.execute(actor(a),'artifact_create',{title:'fixture-report.md',content:'# Deterministic analysis fixture; no scientific measurement.',mediaType:'text/markdown'},'fixture-report');
  await tools.execute(actor(a),'task_result_submit',output({artifactIds:[report.id]}),'fixture-analysis-result');
  const r=s.app.teams.claim(t.id),names=tools.definitions('reviewer').map(tool=>tool.name);
  for(const name of ['artifact_create','workspace_write','evidence_register'])assert.equal(names.includes(name),false,name);
  await assert.rejects(tools.execute(actor(r),'artifact_create',{title:'forbidden.md',content:'not allowed'},'forbidden-review-artifact'),{code:'TOOL_DENIED'});
  const read=await tools.execute(actor(r),'artifact_read',{artifactId:report.id},'fixture-review-read');assert.equal(read.digest,report.digest);
  const summary='Independent fixture review: the fixed report explicitly disclaims scientific measurement.';
  const submitted=await tools.execute(actor(r),'task_result_submit',output({summary,verdict:'accept'}),'fixture-review-result');
  assert.equal(submitted.result.summary,summary);assert.equal(submitted.result.verdict,'accept');assert.deepEqual(submitted.result.artifactIds,[]);
  assert.equal(s.app.store.get('task',a.task.id).acceptance,'accepted');assert.equal(s.app.teams.get(USER,t.id).state,'completed');assert.equal(s.app.store.list('artifact').length,1);
 }finally{s.close();}
});

test('new supported reviewer plan preserves a prior blocked review and its archived result',()=>{
 const s=setup();try{
  const old=start(s,[spec('r',{role:'reviewer'})]),r=s.app.teams.claim(old.id),blocked=s.app.teams.submit(actor(r),output({outcome:'blocked',summary:'Fixture input unavailable; no scientific review performed.',verdict:'disputed'}));
  const oldTask=s.app.store.get('task',r.task.id),oldTeam=s.app.teams.get(USER,old.id),next=start(s,[spec('r',{role:'reviewer',expectedOutputs:[]})]),fresh=s.app.teams.claim(next.id);
  s.app.teams.submit(actor(fresh),output({summary:'New independent fixture review.',verdict:'accept'}));
  assert.equal(s.app.teams.get(USER,next.id).state,'completed');assert.deepEqual(s.app.store.get('task',r.task.id),oldTask);assert.deepEqual(s.app.teams.get(USER,old.id),oldTeam);assert.deepEqual(s.app.store.get('task-result',blocked.id),blocked);
 }finally{s.close();}
});
