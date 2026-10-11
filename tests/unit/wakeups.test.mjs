import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,campaign,enroll,submit,fixtureFinish,approve,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
function prepared(s,options={}){const c=campaign(s,{autoAnalyze:true,...options});const r=submit(s,enroll(s,c));fixtureFinish(s,r);s.app.campaigns.observe();assert.ok(s.app.wakeups,'missing durable wake-up service');s.app.wakeups.reconcile();return {c,r,w:s.app.wakeups.list(USER,s.project.id)[0]};}
function start(s,w){const dispatched=s.app.wakeups.dispatch(w.id,{ready:true});assert.ok(dispatched);const m=dispatched.message,root=s.app.sessions.get(USER,s.session.id);s.app.store.transaction(()=>{const next=s.app.store.update('session',root.id,root.version,{state:'running',generation:root.generation+1,leaseUntil:Date.now()+30000});s.app.store.update('message',m.id,m.version,{status:'running'});s.app.wakeups.markStarted(w.id,next.id,next.generation,m.id);});return s.app.wakeups.get(USER,w.id);}

test('Result wake-up is durable, idempotent and is not a fake assistant answer',()=>{const s=setup();try{
 const {w}=prepared(s);s.app.wakeups.reconcile();assert.equal(s.app.wakeups.list(USER,s.project.id).length,1);assert.equal(w.state,'pending');assert.equal(s.app.sessions.messages(USER,s.session.id).length,0);
 s.app.close();s.app=new ResearchApp(s.dir,process.cwd());s.app.wakeups.reconcile();assert.equal(s.app.wakeups.list(USER,s.project.id)[0].id,w.id);
}finally{s.close();}});
test('User messages have priority and active root is never interrupted by automation',()=>{const s=setup();try{
 const {w}=prepared(s);s.app.sessions.send(USER,s.session.id,{content:'先处理我的问题'});assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);
 let root=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',root.id,root.version,{state:'running',generation:1,leaseUntil:Date.now()+30000});assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);
 assert.equal(s.app.budget.summary(w.ownerId).reserved,0);
}finally{s.close();}});
test('Dispatch persists explicit system-origin message and reserves only once',()=>{const s=setup();try{
 const {w}=prepared(s);const first=s.app.wakeups.dispatch(w.id,{ready:true});assert.equal(first.message.role,'system');assert.equal(first.message.origin,'automation');assert.equal(first.message.wakeupId,w.id);
 assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);assert.equal(s.app.sessions.messages(USER,s.session.id).length,1);assert.equal(s.app.budget.summary(w.ownerId).reserved,1);
}finally{s.close();}});
test('Unavailable Pi records an actionable block without consuming attempts',()=>{const s=setup();try{
 const {w}=prepared(s);assert.equal(s.app.wakeups.dispatch(w.id,{ready:false,message:'Pi 未安装'}),null);
 const next=s.app.wakeups.get(USER,w.id);assert.equal(next.attempts,0);assert.match(next.blockReason,/Pi/);assert.equal(s.app.budget.summary(w.ownerId).reserved,0);
}finally{s.close();}});
test('Automatic analysis opt-out requires an explicit manual request',()=>{const s=setup();try{
 const {w}=prepared(s,{autoAnalyze:false});assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);
 s.app.wakeups.request(USER,w.id);assert.ok(s.app.wakeups.dispatch(w.id,{ready:true}));
}finally{s.close();}});
test('Campaign pause defers pending wake-up until resume',()=>{const s=setup();try{
 const {c,w}=prepared(s);let current=s.app.campaigns.get(USER,c.id);current=s.app.campaigns.pause(USER,c.id,current.version);s.app.wakeups.reconcile();assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);
 s.app.campaigns.resume(USER,c.id,current.version);s.app.wakeups.reconcile();assert.ok(s.app.wakeups.dispatch(w.id,{ready:true}));
}finally{s.close();}});
test('Stopping cancels queued automation and releases unused reservation, not user messages',()=>{const s=setup();try{
 const {c,w}=prepared(s);s.app.wakeups.dispatch(w.id,{ready:true});const user=s.app.sessions.send(USER,s.session.id,{content:'保留此消息'});
 const current=s.app.campaigns.get(USER,c.id);s.app.campaigns.stop(USER,c.id,{expectedVersion:current.version,reason:'stop'});s.app.wakeups.reconcile();
 assert.equal(s.app.wakeups.get(USER,w.id).state,'superseded');assert.equal(s.app.store.get('message',user.id).status,'queued');assert.equal(s.app.budget.summary(w.ownerId).available,12);
}finally{s.close();}});
test('Finished analysis does not repeat; ambiguous failure keeps unknown credit and needs manual retry',()=>{const s=setup();try{
 const {w}=prepared(s);start(s,w);s.app.wakeups.finish(w.id,'网络中断',true);s.app.wakeups.reconcile();
 assert.equal(s.app.wakeups.get(USER,w.id).state,'failed');assert.equal(s.app.budget.summary(w.ownerId).unknown,1);assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);
 s.app.wakeups.retry(USER,w.id);assert.equal(s.app.wakeups.get(USER,w.id).state,'pending');assert.equal(s.app.wakeups.get(USER,w.id).attempts,1);
}finally{s.close();}});
test('Successful wake-up is settled exactly once',()=>{const s=setup();try{
 const {w}=prepared(s);start(s,w);s.app.wakeups.finish(w.id);s.app.wakeups.finish(w.id);s.app.wakeups.reconcile();
 assert.equal(s.app.wakeups.get(USER,w.id).state,'completed');assert.equal(s.app.budget.summary(w.ownerId).used,1);assert.equal(s.app.wakeups.list(USER,s.project.id).length,1);
}finally{s.close();}});
test('Two results arriving while a root is busy both remain observable',()=>{const s=setup();try{
 const {c,w}=prepared(s);start(s,w);const child=s.app.experiments.create(USER,s.project.id,{title:'two',parentId:s.baseline.id});const r=submit(s,enroll(s,c,child));fixtureFinish(s,r);s.app.campaigns.observe();s.app.wakeups.reconcile();
 const notices=s.app.wakeups.list(USER,s.project.id);assert.equal(notices.length,2);assert.equal(notices.filter(n=>n.state==='pending').length,1);
 assert.equal(s.app.wakeups.dispatch(notices.find(n=>n.state==='pending').id,{ready:true}),null);
}finally{s.close();}});
test('Stopped source revokes running automation tools immediately',()=>{const s=setup();try{
 const {c,w}=prepared(s);const running=start(s,w);const root=s.app.sessions.get(USER,s.session.id);const actor={type:'agent',role:'coordinator',projectId:s.project.id,sessionId:root.id,generation:root.generation,wakeupId:w.id};
 assert.ok(s.app.wakeups.assertActive(actor));const current=s.app.campaigns.get(USER,c.id);s.app.campaigns.stop(USER,c.id,{expectedVersion:current.version,reason:'stop'});
 assert.throws(()=>s.app.wakeups.assertActive(actor),{code:'WAKEUP_STALE'});
}finally{s.close();}});
test('Model changed since consent does not launch on a new provider',()=>{const s=setup();try{
 const {w}=prepared(s);const root=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',root.id,root.version,{model:{provider:'other',model:'expensive',thinking:'off'}});
 assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);assert.match(s.app.wakeups.get(USER,w.id).blockReason,/模型/);
}finally{s.close();}});
test('A completed opted-in team queues synthesis, legacy teams do not auto-spend',()=>{const s=setup();try{
 assert.ok(s.app.wakeups);const p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});
 function finishTeam(autoSummarize){const t=s.app.teams.create(USER,s.session.id,{goal:'核查输入',budget:4,autoSummarize,tasks:[{key:'a',role:'analyst',objective:'检查资料',dependencies:[]}]});approve(s.app,t.approvalId);s.app.teams.activate(USER,t.id);const claim=s.app.teams.claim(t.id);s.app.teams.submit({type:'agent',projectId:p.id,role:'analyst',taskId:claim.task.id,attemptId:claim.attempt.id,sessionId:claim.attempt.sessionId,generation:claim.attempt.generation},{summary:'明确无科研测量',outcome:'completed',evidenceIds:[],artifactIds:[],claims:[],unresolvedQuestions:[]});return t;}
 const modern=finishTeam(true),legacy=finishTeam(false);s.app.wakeups.reconcile();const notices=s.app.wakeups.list(USER,p.id);
 assert.equal(notices.find(w=>w.ownerId===modern.id).automatic,true);assert.equal(notices.find(w=>w.ownerId===legacy.id).automatic,false);
}finally{s.close();}});
test('Budget exhaustion blocks new model work without claiming a result',()=>{const s=setup();try{
 const {w}=prepared(s,{limits:{maxAnalysisAttempts:1}});s.app.budget.reserve(s.project.id,w.ownerId,'other',1);
 assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);assert.match(s.app.wakeups.get(USER,w.id).blockReason,/额度/);assert.equal(s.app.wakeups.get(USER,w.id).attempts,0);
}finally{s.close();}});

test('Paused queued analysis re-reserves a new credit when resumed',()=>{const s=setup();try{
 const {c,w}=prepared(s);const first=s.app.wakeups.dispatch(w.id,{ready:true});let current=s.app.campaigns.get(USER,c.id);current=s.app.campaigns.pause(USER,c.id,current.version);s.app.wakeups.reconcile();assert.equal(s.app.budget.summary(w.ownerId).reserved,0);
 s.app.campaigns.resume(USER,c.id,current.version);const second=s.app.wakeups.dispatch(w.id,{ready:true});assert.ok(second);assert.notEqual(second.notice.reservationId,first.notice.reservationId);assert.equal(s.app.budget.summary(w.ownerId).reserved,1);
}finally{s.close();}});

test('Cancelling the only queued system input restores an idle root',()=>{const s=setup();try{
 const {w}=prepared(s);s.app.wakeups.dispatch(w.id,{ready:true});s.app.wakeups.cancel(USER,w.id);assert.equal(s.app.sessions.get(USER,s.session.id).state,'idle');
}finally{s.close();}});
test('Archived projects cannot dispatch previously persisted notifications',()=>{const s=setup();try{
 const {w}=prepared(s);const p=s.app.projects.get(USER,s.project.id);s.app.projects.archive(USER,p.id,p.version);assert.equal(s.app.wakeups.dispatch(w.id,{ready:true}),null);assert.equal(s.app.wakeups.get(USER,w.id).state,'superseded');assert.equal(s.app.budget.summary(w.ownerId).reserved,0);
}finally{s.close();}});
test('Assistant retry cannot spend the credit reserved for opted-in final synthesis',()=>{const s=setup();try{
 let p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});const t=s.app.teams.create(USER,s.session.id,{goal:'finish reserve',budget:2,autoSummarize:true,tasks:[{key:'a',role:'analyst',objective:'check',dependencies:[]}]});approve(s.app,t.approvalId);s.app.teams.activate(USER,t.id);const first=s.app.teams.claim(t.id);s.app.teams.fail(first.attempt.id,'fixture failure',false);const before=s.app.store.db.prepare('SELECT kind,id,version,data FROM records ORDER BY rowid').all(),events=s.app.store.db.prepare('SELECT * FROM events ORDER BY seq').all();assert.throws(()=>s.app.teams.retry(USER,first.task.id),{code:'BUDGET_EXCEEDED'});assert.deepEqual(s.app.store.db.prepare('SELECT kind,id,version,data FROM records ORDER BY rowid').all(),before);assert.deepEqual(s.app.store.db.prepare('SELECT * FROM events ORDER BY seq').all(),events);assert.equal(s.app.budget.summary(t.id).available,1);assert.equal(s.app.teams.tasks(USER,t.id)[0].execution,'failed');assert.equal(s.app.teams.get(USER,t.id).state,'partial');s.app.wakeups.reconcile();const notice=s.app.wakeups.list(USER,p.id)[0];assert.ok(s.app.wakeups.dispatch(notice.id,{ready:true}));
}finally{s.close();}});
