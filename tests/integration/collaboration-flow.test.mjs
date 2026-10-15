import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
// Run this same regression suite against the read-only pre-change build when collecting failure evidence.
const root=resolve(process.env.CFLOW_BASELINE_ROOT??process.cwd());
const load=path=>import(pathToFileURL(join(root,path)).href);
const {ResearchApp}=await load('dist/packages/research-app.js');
const {USER}=await load('dist/packages/domain/types.js');
const {readRoute}=await load('dist/apps/server/routes.js');
const task=(key='a',extra={})=>({key,role:'analyst',objective:'Offline collaboration flow fixture',dependencies:[],...extra});
const plan=(extra={})=>({goal:'Fixed collaboration flow',tasks:[task()],budget:5,...extra});
const result=extra=>({summary:'Offline fixture result, no research measurements',outcome:'partial',artifactIds:[],evidenceIds:[],claims:[],unresolvedQuestions:['Fixture partial result'],...extra});
function setup(){const dir=mkdtempSync(join(tmpdir(),'pi-cflow-')),app=new ResearchApp(dir,root);let p=app.projects.create(USER,{name:'Collaboration flow regression'});p=app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});const session=app.sessions.create(USER,p.id,{});return {dir,app,p,session,close(){this.app.close();rmSync(dir,{recursive:true,force:true});}};}
function mode(s,value){const p=s.app.sessionPermissions.status(USER,s.session.id);return s.app.sessionPermissions.set(USER,s.session.id,{mode:value,expectedVersion:p.version,expectedHostVersion:p.hostAccess.version});}
function coordinator(s){const row=s.app.store.get('session',s.session.id),next=s.app.store.update('session',row.id,row.version,{state:'running',generation:row.generation+1,leaseUntil:Date.now()+120000});return {type:'agent',projectId:s.p.id,sessionId:row.id,role:'coordinator',generation:next.generation,permission:s.app.sessionPermissions.capture(row.id)};}
const assistant=c=>({type:'agent',projectId:c.task.projectId,sessionId:c.attempt.sessionId,role:c.task.role,taskId:c.task.id,attemptId:c.attempt.id,generation:c.attempt.generation});
const call=(s,a,name,input,key)=>s.app.operations.execute(a,name,input,{projectId:s.p.id,sessionId:a.sessionId,idempotencyKey:key});
function approve(s,id){const a=s.app.store.get('approval',id);return s.app.approvals.decide(USER,id,a.version,true);}
function start(s,input=plan()){const t=s.app.teams.create(USER,s.session.id,input);approve(s,t.approvalId);s.app.teams.activate(USER,t.id);return t;}
const snapshot=s=>({records:s.app.store.db.prepare('SELECT kind,id,version,data FROM records ORDER BY rowid').all(),events:s.app.store.db.prepare('SELECT * FROM events ORDER BY seq').all()});
const state=s=>s.app.store.readSnapshot(()=>readRoute(s.app,{},`/projects/${s.p.id}/state`,new URL('http://localhost/state')));

test('CFLOW-01 invalid semantic plans reject before session approval and leave zero new effects',()=>{
 for(const name of ['collaboration_plan_submit','agent_delegate'])for(const [input,code] of [
  [plan({tasks:[task('a'),task('a')]}),'TASK_KEY_DUPLICATE'],
  [plan({tasks:[task('a',{dependencies:['missing']})]}),'TASK_DEPENDENCY_UNKNOWN'],
  [plan({tasks:[task('a',{dependencies:['b']}),task('b',{dependencies:['a']})]}),'TASK_GRAPH_CYCLE'],
  [plan({tasks:[task('a',{critical:true})]}),'REVIEW_REQUIRED'],
  [plan({budget:1,tasks:[task('a'),task('b')]}),'BUDGET_EXCEEDED'],
  [plan({budget:1,autoSummarize:true}),'BUDGET_EXCEEDED'],
  [plan({tasks:[task('a',{inputEvidenceIds:['missing-evidence']})]}),'NOT_FOUND'],
 ]){const s=setup();try{mode(s,'confirm');const a=coordinator(s),before=snapshot(s);assert.throws(()=>call(s,a,name,input,'invalid-plan'),{code});assert.deepEqual(snapshot(s),before);for(const kind of ['session-action','approval','team','team-plan','task','budget','reservation'])assert.equal(s.app.store.list(kind).length,0,kind);}finally{s.close();}}
});

test('CFLOW-01 fixed approval executes once across turns and approved awaiting team survives reopen',()=>{
 const s=setup();try{mode(s,'confirm');let a=coordinator(s);const input=plan();assert.throws(()=>call(s,a,'collaboration_plan_submit',input,'prepare-plan'),{code:'APPROVAL_REQUIRED'});const pending=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);s.app.sessionPermissions.decide(USER,s.session.id,pending.id,{expectedVersion:pending.version,expectedApprovalVersion:pending.approval.version,approved:true});
  a=coordinator(s);const t=call(s,a,'collaboration_plan_submit',input,'execute-plan');const after=snapshot(s);assert.equal(call(s,a,'collaboration_plan_submit',input,'execute-plan').id,t.id);const replay=snapshot(s);assert.deepEqual(replay.records.filter(r=>r.kind!=='session-action'),after.records.filter(r=>r.kind!=='session-action'));assert.deepEqual(replay.events,after.events);assert.equal(replay.records.length,after.records.length);assert.equal(s.app.store.get('session-action',pending.id).source,pending.source);assert.deepEqual(s.app.store.get('session-action',pending.id).input,input);a=coordinator(s);assert.equal(call(s,a,'collaboration_plan_submit',input,'later-turn').id,t.id);assert.equal(s.app.store.list('team').length,1);assert.equal(s.app.store.get('session-action',pending.id).state,'completed');
  approve(s,t.approvalId);s.app.close();s.app=new ResearchApp(s.dir,root);const view=state(s);assert.equal(view.teams[0].state,'awaiting_approval');assert.equal(view.approvals.find(v=>v.id===t.approvalId).status,'approved');s.app.teams.activate(USER,t.id);const active=snapshot(s);assert.throws(()=>s.app.teams.activate(USER,t.id),{code:'TEAM_STATE_INVALID'});assert.deepEqual(snapshot(s),active);assert.ok(s.app.teams.claim(t.id));assert.equal(s.app.teams.claim(t.id),null);assert.equal(s.app.store.list('task-attempt').length,1);
 }finally{s.close();}
});

test('CFLOW-01 retry guard and user view agree while no-credit retry preserves all records',()=>{
 const s=setup();try{const t=start(s,plan({budget:2,autoSummarize:true})),first=s.app.teams.claim(t.id);s.app.teams.fail(first.attempt.id,'Fixture failure retained',false);const before=snapshot(s);assert.throws(()=>s.app.teams.retry(USER,first.task.id),{code:'BUDGET_EXCEEDED'});assert.deepEqual(snapshot(s),before);const view=state(s).tasks[0];assert.deepEqual(view.retry,{eligible:false,code:'BUDGET_EXCEEDED',reason:'可用任务额度不足；保留主会话综合额度'});assert.equal(view.attempts[0].error,'Fixture failure retained');assert.equal(s.app.budget.summary(t.id).available,1);assert.deepEqual(snapshot(s),before);s.app.wakeups.reconcile();const notice=s.app.wakeups.list(USER,s.p.id).find(w=>w.ownerId===t.id);assert.ok(s.app.wakeups.dispatch(notice.id,{ready:true}));
 }finally{s.close();}
});

test('CFLOW-01 unknown usage remains reserved while retry creates a separate bounded attempt and retains history',()=>{
 const s=setup();try{const t=start(s),first=s.app.teams.claim(t.id);s.app.teams.fail(first.attempt.id,'Fixture lease expired',true);const oldAttempt=s.app.store.get('task-attempt',first.attempt.id),oldReservation=s.app.store.get('reservation',first.attempt.budgetReservationId);assert.equal(state(s).tasks[0].retry.eligible,true);s.app.teams.retry(USER,first.task.id);let before=snapshot(s);assert.throws(()=>s.app.teams.retry(USER,first.task.id),{code:'TASK_NOT_RETRYABLE'});assert.deepEqual(snapshot(s),before);const next=s.app.teams.claim(t.id);assert.notEqual(next.attempt.id,first.attempt.id);assert.notEqual(next.attempt.sessionId,first.attempt.sessionId);assert.notEqual(next.attempt.workspace,first.attempt.workspace);assert.ok(next.attempt.generation>first.attempt.generation);assert.deepEqual(s.app.store.get('task-attempt',first.attempt.id),oldAttempt);assert.deepEqual(s.app.store.get('reservation',first.attempt.budgetReservationId),oldReservation);assert.equal(s.app.budget.summary(t.id).unknown,1);before=snapshot(s);assert.throws(()=>s.app.teams.submit(assistant(first),result()),{code:'LEASE_EXPIRED'});assert.deepEqual(snapshot(s),before);
  s.app.teams.submit(assistant(next),result({summary:'Retained partial result '+ 'x'.repeat(2100)}));before=snapshot(s);assert.throws(()=>s.app.teams.retry(USER,first.task.id),{code:'ATTEMPT_LIMIT'});assert.deepEqual(snapshot(s),before);assert.equal(state(s).tasks[0].retry.code,'ATTEMPT_LIMIT');s.app.close();s.app=new ResearchApp(s.dir,root);const v=state(s).tasks[0];assert.equal(v.attempts.length,2);assert.equal(v.attempts[1].error,'Fixture lease expired');assert.equal(v.attempts[0].result.outcome,'partial');assert.equal(v.attempts[0].result.summary.length,2000);assert.equal(v.attempts[0].result.summaryTruncated,true);assert.equal(Object.hasOwn(v.attempts[0],'workspace'),false);assert.equal(Object.hasOwn(v.attempts[0],'piSessionPath'),false);assert.equal(s.app.store.list('task-result').length,1);assert.ok(s.app.store.list('task-result')[0].result.summary.length>2000);
  const tool=call(s,USER,'task_inspect',{teamId:t.id},'inspect');assert.equal(Object.hasOwn(tool[0],'retry'),false);assert.equal(Object.hasOwn(tool[0],'attempts'),false);
 }finally{s.close();}
});

test('CFLOW-01 stale permissions, disabled mode and completed work block retry without releasing unknown usage',()=>{
 for(const changed of ['permission','disabled','completed']){const s=setup();try{const t=start(s),first=s.app.teams.claim(t.id);if(changed==='completed')s.app.teams.submit(assistant(first),result({outcome:'completed'}));else s.app.teams.fail(first.attempt.id,'Unknown fixture failure',true);
  if(changed==='permission')mode(s,'readOnly');if(changed==='disabled'){const p=s.app.projects.get(USER,s.p.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:false});}
  const code=changed==='permission'?'SESSION_PERMISSION_STALE':changed==='disabled'?'MULTI_AGENT_DISABLED':'TEAM_STATE_INVALID',before=snapshot(s);assert.throws(()=>s.app.teams.retry(USER,first.task.id),{code});assert.deepEqual(snapshot(s),before);assert.equal(state(s).tasks[0].retry.code,code);assert.deepEqual(snapshot(s),before);
 }finally{s.close();}}
});
