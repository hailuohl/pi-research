import {digest} from '../../dist/packages/storage/store.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,mkdtempSync,rmSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createDataBackup,restoreDataBackup} from '../../dist/packages/storage/backup.js';
import {setup,USER,approve,fixtureFinish} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {writeRoute,readRoute} from '../../dist/apps/server/routes.js';
const row=s=>s.app.store.get('session',s.session.id);
const snap=s=>JSON.stringify(s.app.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all());
test('archive retires pending input and permission; unarchive keeps history without reviving authority',()=>{const s=setup();try{
 const m=s.app.sessions.send(USER,s.session.id,{content:'retain queued history'}),ref=s.app.sessionPermissions.capture(s.session.id);
 const archived=s.app.sessions.archive(USER,s.session.id,row(s).version);assert.equal(archived.state,'archived');assert.equal(s.app.sessions.messages(USER,s.session.id)[0].status,'cancelled');
 assert.throws(()=>s.app.sessionPermissions.assert(ref,false),{code:'SESSION_PERMISSION_STALE'});
 const opened=s.app.sessions.unarchive(USER,s.session.id,archived.version);assert.equal(opened.state,'idle');assert.equal(s.app.sessions.messages(USER,s.session.id)[0].id,m.id);assert.equal(s.app.sessions.messages(USER,s.session.id)[0].status,'cancelled');assert.throws(()=>s.app.sessionPermissions.assert(ref,false),{code:'SESSION_PERMISSION_STALE'});
}finally{s.close();}});
test('delete hides every directory and reopen but preserves raw session, branch, workspace and research bytes',()=>{const s=setup();try{
 const m=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'assistant',mode:'prompt',status:'completed',content:'retained'}),branch=s.app.sessions.branch(USER,s.session.id,m.id),file=join(s.app.store.paths.physical(row(s).workspace),'retained.txt');writeFileSync(file,'unchanged');
 const research=JSON.stringify(s.app.store.get('experiment',s.baseline.id)),messages=JSON.stringify(s.app.sessions.messages(USER,s.session.id)),beforeBranch=JSON.stringify(s.app.store.get('session',branch.id));
 const deleted=s.app.sessions.delete(USER,s.session.id,row(s).version,s.session.title);assert.ok(deleted.deletedAt);assert.equal(deleted.state,'archived');
 for(const stateFilter of ['active','archived','all'])assert.ok(!s.app.sessions.list(USER,s.project.id,{role:'all',stateFilter}).items.some(v=>v.id===s.session.id));assert.ok(!s.app.sessions.recent(USER,s.project.id).some(v=>v.id===s.session.id));
 assert.throws(()=>s.app.sessions.get(USER,s.session.id),{code:'SESSION_DELETED',status:410});assert.throws(()=>s.app.sessions.unarchive(USER,s.session.id,deleted.version),{code:'SESSION_DELETED'});assert.equal(readFileSync(file,'utf8'),'unchanged');assert.equal(JSON.stringify(s.app.store.get('experiment',s.baseline.id)),research);assert.equal(JSON.stringify(s.app.store.get('session',branch.id)),beforeBranch);assert.equal(JSON.stringify(s.app.store.list('message',s.project.id).filter(v=>v.sessionId===s.session.id)),messages);
 const other=new ResearchApp(s.dir,process.cwd());try{assert.ok(!other.sessions.recent(USER,s.project.id).some(v=>v.id===s.session.id));assert.throws(()=>other.sessions.get(USER,s.session.id),{code:'SESSION_DELETED'});}finally{other.close();}
}finally{s.close();}});
test('stale title/version, wrong identity and busy resources refuse cleanup without side effects',()=>{const s=setup();try{
 const before=snap(s);assert.throws(()=>s.app.sessions.archive(USER,s.session.id,0),{code:'VERSION_CONFLICT'});assert.equal(snap(s),before);assert.throws(()=>s.app.sessions.delete(USER,s.session.id,1,'wrong'),{code:'SESSION_TITLE_MISMATCH'});assert.equal(snap(s),before);assert.throws(()=>s.app.sessions.archive({type:'agent'},s.session.id,1),{code:'PERMISSION_DENIED'});
 for(const [kind,data] of [['session-action',{sessionId:s.session.id,state:'unknown'}],['model-http-request',{sessionId:s.session.id,state:'interrupted',ownerKind:'owner-native',transportEnded:false}],['operation-pending',{operation:'legacy'}],['agent-admission',{sessionId:s.session.id,state:'reserved'}]]){const r=s.app.store.create(kind,s.project.id,data),snapshot=snap(s);assert.throws(()=>s.app.sessions.archive(USER,s.session.id,row(s).version),{code:'SESSION_BUSY'},kind);assert.equal(snap(s),snapshot);s.app.store.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind,r.id);}
 const r=s.app.store.update('session',s.session.id,row(s).version,{leaseUntil:Date.now()+60000});assert.throws(()=>s.app.sessions.delete(USER,r.id,r.version,r.title),{code:'SESSION_BUSY'});
}finally{s.close();}});
test('HTTP lifecycle routes validate project and tombstone entry returns 410',()=>{const s=setup();try{
 const route=(action,body)=>writeRoute(s.app,{},'/sessions/'+s.session.id+'/'+action,body,'POST');
 const archived=route('archive',{expectedVersion:1}),active=route('unarchive',{expectedVersion:archived.version});assert.equal(active.state,'idle');const deleted=route('delete',{expectedVersion:active.version,confirmTitle:active.title});assert.ok(deleted.deletedAt);assert.throws(()=>readRoute(s.app,{},'/sessions/'+active.id,new URL('http://local')),{code:'SESSION_DELETED',status:410});
}finally{s.close();}});

test('run ownership follows its prepared intent and excludes unrelated runs',()=>{const s=setup();try{
 const other=s.app.sessions.create(USER,s.project.id,{title:'other'}),intent=s.app.store.create('run-intent',s.project.id,{rootSessionId:s.session.id,status:'submitted',manifest:{}}),foreign=s.app.store.create('run-intent',s.project.id,{rootSessionId:other.id,status:'submitted',manifest:{}});
 s.app.store.create('run',s.project.id,{intentId:foreign.id,state:'running',manifest:{}});
 const run=s.app.store.create('run',s.project.id,{intentId:intent.id,state:'queued',manifest:{}});assert.throws(()=>s.app.sessions.archive(USER,s.session.id,row(s).version),{code:'SESSION_BUSY'});
 s.app.store.update('run',run.id,run.version,{state:'succeeded'});s.app.store.create('run',s.project.id,{state:'succeeded'});assert.equal(s.app.sessions.archive(USER,s.session.id,row(s).version).state,'archived');
}finally{s.close();}});

test('relocated backup keeps tombstones hidden and branch, research and workspace intact',async()=>{const s=setup(),parent=mkdtempSync(join(realpathSync.native(tmpdir()),'session-retain-'));let restored;try{
 const m=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'assistant',mode:'prompt',status:'completed',content:'historical branch'}),branch=s.app.sessions.branch(USER,s.session.id,m.id);writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'research.txt'),'retained workspace');
 const grant=s.app.discoveryGrants.prepare(USER,s.project.id,{sessionId:s.session.id,searches:[{query:'backup retirement',sources:['crossref'],limit:1}],targets:[],allowSearchResults:false,formats:['provider-text'],maxRequests:1,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString()}),grantRow=s.app.store.get('discovery-grant',grant.id),approval=s.app.store.get('approval',grant.approvalId);
 s.app.sessions.delete(USER,s.session.id,row(s).version,s.session.title);const research=s.app.store.get('experiment',s.baseline.id),branchMessages=s.app.sessions.messages(USER,branch.id);s.app.close();
 await createDataBackup(s.dir,join(parent,'backup'),{offline:true});await restoreDataBackup(join(parent,'backup'),join(parent,'restored'),{offline:true,relocate:true});restored=new ResearchApp(join(parent,'restored'),process.cwd());
 assert.throws(()=>restored.sessions.get(USER,s.session.id),{code:'SESSION_DELETED',status:410});for(const stateFilter of ['active','archived','all'])assert.ok(!restored.sessions.list(USER,s.project.id,{stateFilter,role:'all'}).items.some(v=>v.id===s.session.id));assert.deepEqual(restored.sessions.messages(USER,branch.id),branchMessages);assert.deepEqual(restored.store.get('experiment',s.baseline.id),research);assert.deepEqual(restored.store.get('discovery-grant',grant.id),grantRow);assert.deepEqual(restored.store.get('approval',grant.approvalId),approval);assert.equal(restored.store.get('grant-retirement',digest({grantKind:'discovery-grant',grantId:grant.id})).rootSessionId,s.session.id);assert.equal(readFileSync(join(restored.store.paths.physical(restored.store.get('session',s.session.id).workspace),'research.txt'),'utf8'),'retained workspace');
}finally{restored?.close();s.close();rmSync(parent,{recursive:true,force:true});}});

test('a completed auto-summary first observed at archive stays cancelled after reopening and repeated reconcile',()=>{const s=setup();try{
 const team=s.app.store.create('team',s.project.id,{rootSessionId:s.session.id,state:'completed',goal:'retained old result',autoSummarize:true,planVersion:1,directiveVersion:1});assert.equal(s.app.store.list('wakeup').length,0);
 const archived=s.app.sessions.archive(USER,s.session.id,row(s).version),wakeups=s.app.store.list('wakeup');assert.equal(wakeups.length,1);assert.equal(wakeups[0].sourceId,team.id);assert.equal(wakeups[0].state,'cancelled');
 s.app.sessions.unarchive(USER,s.session.id,archived.version);s.app.wakeups.reconcile();s.app.wakeups.reconcile();assert.equal(s.app.store.list('wakeup').length,1);assert.equal(s.app.store.get('wakeup',wakeups[0].id).state,'cancelled');assert.equal(s.app.sessions.get(USER,s.session.id).state,'idle');assert.equal(s.app.store.list('message').length,0);
}finally{s.close();}});

test('cleanup rejects archived projects and unfinished root helpers, but independent running branches remain independent',()=>{const s=setup();try{
 const m=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'assistant',mode:'prompt',status:'completed',content:'history'}),branch=s.app.sessions.branch(USER,s.session.id,m.id);s.app.store.update('session',branch.id,branch.version,{state:'running',leaseUntil:Date.now()+60000});
 const team=s.app.store.create('team',s.project.id,{rootSessionId:s.session.id,state:'paused',goal:'pending helper'}),task=s.app.store.create('task',s.project.id,{teamId:team.id,execution:'waiting_user'});assert.throws(()=>s.app.sessions.archive(USER,s.session.id,row(s).version),{code:'SESSION_BUSY'});s.app.store.update('task',task.id,task.version,{execution:'cancelled'});
 const a=s.app.sessions.archive(USER,s.session.id,row(s).version);assert.equal(s.app.store.get('session',branch.id).state,'running');assert.equal(s.app.sessions.unarchive(USER,s.session.id,a.version).state,'idle');
 const project=s.app.store.get('project',s.project.id);s.app.store.update('project',project.id,project.version,{status:'archived',archived:true});const before=snap(s);assert.throws(()=>s.app.sessions.delete(USER,s.session.id,row(s).version,s.session.title),{code:'PROJECT_ARCHIVED'});assert.equal(snap(s),before);
}finally{s.close();}});
test('retirement failure rolls back messages and all authority changes; queued wakeup releases unused credit',()=>{const s=setup();try{
 const message=s.app.sessions.send(USER,s.session.id,{content:'queued'});s.app.budget.configure(s.project.id,'owner',1);const reservation=s.app.budget.reserve(s.project.id,'owner','queued-wakeup',1),w=s.app.store.create('wakeup',s.project.id,{rootSessionId:s.session.id,state:'queued',sourceKind:'team',sourceId:'old',ownerId:'owner',reservationId:reservation.id,messageId:message.id});
 const retire=s.app.sessions.onRetire;s.app.sessions.onRetire=id=>{retire(id);throw Error('simulated retirement failure');};const before=snap(s);assert.throws(()=>s.app.sessions.archive(USER,s.session.id,row(s).version),/simulated retirement failure/);assert.equal(snap(s),before);assert.equal(s.app.budget.summary('owner').reserved,1);
 s.app.sessions.onRetire=retire;const archived=s.app.sessions.archive(USER,s.session.id,row(s).version);assert.equal(archived.state,'archived');assert.equal(s.app.store.get('wakeup',w.id).state,'cancelled');assert.equal(s.app.budget.summary('owner').reserved,0);assert.equal(s.app.budget.summary('owner').used,0);
}finally{s.close();}});

// Reproduce the persisted shape produced by the pre-lifecycle archive implementation.
const legacyArchive=s=>s.app.store.transaction(()=>{const current=row(s);s.app.sessions.onStop?.(current.id,'会话已归档');return s.app.store.update('session',current.id,current.version,{state:'archived'});});
test('legacy archived queued messages are retired before the session becomes idle',()=>{const s=setup();try{
 const message=s.app.sessions.send(USER,s.session.id,{content:'old queued input'}),archived=legacyArchive(s);assert.equal(s.app.store.get('message',message.id).status,'queued');
 const reopened=s.app.sessions.unarchive(USER,s.session.id,archived.version);assert.equal(reopened.state,'idle');assert.equal(s.app.store.get('message',message.id).status,'cancelled');assert.ok(reopened.generation>archived.generation);assert.equal(reopened.leaseUntil,0);
}finally{s.close();}});
test('legacy archived host grants and permission references cannot regain authority on unarchive',()=>{const s=setup();try{
 const enabled=s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:0,acknowledgedSameUserAccess:true});assert.equal(enabled.enabled,true);const ref=s.app.sessionPermissions.capture(s.session.id),archived=legacyArchive(s);
 assert.equal(s.app.store.get('host-access',s.session.id).state,'enabled');s.app.sessions.unarchive(USER,s.session.id,archived.version);assert.throws(()=>s.app.sessionPermissions.assert(ref,false),{code:'SESSION_PERMISSION_STALE'});assert.equal(s.app.store.get('host-access',s.session.id).state,'revoked');assert.ok(s.app.store.get('host-access',s.session.id).epoch>enabled.epoch);assert.equal(s.app.hostAccess.status(USER,s.session.id).enabled,false);
}finally{s.close();}});
test('legacy archived completed team without a wakeup gets a cancelled receipt before reopen',()=>{const s=setup();try{
 const team=s.app.store.create('team',s.project.id,{rootSessionId:s.session.id,state:'completed',goal:'legacy unscheduled result',autoSummarize:true,planVersion:1,directiveVersion:1}),archived=legacyArchive(s);assert.equal(s.app.store.list('wakeup').length,0);
 s.app.sessions.unarchive(USER,s.session.id,archived.version);s.app.wakeups.reconcile();s.app.wakeups.reconcile();const notices=s.app.store.list('wakeup');assert.equal(notices.length,1);assert.equal(notices[0].sourceId,team.id);assert.equal(notices[0].state,'cancelled');assert.equal(s.app.sessions.get(USER,s.session.id).state,'idle');assert.equal(s.app.store.list('message').length,0);
}finally{s.close();}});
test('legacy archived completed opted-in run without a wakeup cannot first queue after reopening',()=>{const s=setup();try{
 const current=row(s);s.app.store.update('session',current.id,current.version,{model:{provider:'test',model:'fixture',thinking:'off'}});const intent=s.app.runs.prepare(USER,s.baseline.id,s.session.id,true);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);fixtureFinish(s,run,{mse:0.2});
 const archived=legacyArchive(s);assert.equal(s.app.store.list('wakeup').length,0);s.app.sessions.unarchive(USER,s.session.id,archived.version);s.app.wakeups.reconcile();s.app.wakeups.reconcile();const notices=s.app.store.list('wakeup');assert.equal(notices.length,1);assert.equal(notices[0].sourceId,run.id);assert.equal(notices[0].sourceKind,'run-result');assert.equal(notices[0].state,'cancelled');assert.equal(s.app.budget.summary(intent.id).reserved,0);assert.equal(s.app.store.list('message').length,0);
}finally{s.close();}});

test('session-scoped literature queued/running work blocks cleanup but project and other-session work does not',()=>{for(const state of ['queued','running']){const s=setup();try{
 const task=s.app.store.create('literature-task',s.project.id,{scopeSessionId:s.session.id,state});const before=snap(s);assert.throws(()=>s.app.sessions.delete(USER,s.session.id,row(s).version,s.session.title),{code:'SESSION_BUSY'});assert.equal(snap(s),before);
 s.app.store.update('literature-task',task.id,task.version,{state:'succeeded'});s.app.store.create('literature-task',s.project.id,{state:'running'});s.app.store.create('literature-task',s.project.id,{scopeSessionId:'another-session',state:'queued'});assert.ok(s.app.sessions.delete(USER,s.session.id,row(s).version,s.session.title).deletedAt);
}finally{s.close();}}});
