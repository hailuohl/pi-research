import {retireSessionGrants} from '../policy/grant-retirement.js';
import type {Row,Session} from '../domain/types.js';
import type {Store} from '../storage/store.js';
import {ensure} from '../domain/errors.js';

/** Root-owned helpers share execution authority; independent branches do not. */
export function assertSessionIdle(store:Store,session:Row<Session>){
 const rows=store.list<Record<string,any>>('session',session.projectId!),teams=store.list<Record<string,any>>('team',session.projectId!).filter(t=>t.rootSessionId===session.id),teamIds=new Set(teams.map(t=>t.id)),sessions=new Set([session.id,...rows.filter(s=>s.teamId&&teamIds.has(s.teamId)).map(s=>s.id)]);
 const records=store.db.prepare('SELECT kind,data FROM records WHERE project_id=?').all(session.projectId!).map(r=>({kind:String(r.kind),r:JSON.parse(String(r.data))}));
 const taskIds=new Set(records.filter(({kind,r})=>kind==='task'&&teamIds.has(r.teamId)).map(({r})=>r.id)),gitIds=new Set(records.filter(({kind,r})=>kind==='git-operation'&&sessions.has(r.sessionId)).map(({r})=>r.id));
 ensure(!session.taskId&&session.state!=='running'&&session.leaseUntil<=Date.now(),'SESSION_BUSY','运行中、任务会话或有效租约不能清理');
 for(const {kind,r} of records){
  const revision=kind==='publication-build-job'?records.find(x=>x.kind==='manuscript-revision'&&x.r.id===r.revisionId)?.r:undefined;
  const intent=kind==='run'?records.find(x=>x.kind==='run-intent'&&x.r.id===r.intentId)?.r:undefined;
  const owned=kind==='session'&&sessions.has(r.id)||sessions.has(r.sessionId)||kind==='literature-task'&&sessions.has(r.scopeSessionId)||sessions.has(r.rootSessionId)||sessions.has(r.manifest?.analysis?.rootSessionId)||taskIds.has(r.taskId)||sessions.has(revision?.rootSessionId)||sessions.has(intent?.rootSessionId)||sessions.has(r.manifest?.researchRequest?.rootSessionId)||sessions.has(r.manifest?.researchBrief?.rootSessionId)||sessions.has(r.permission?.policy?.rootSessionId);
  let busy=false;
  if(owned){
   if(kind==='session')busy=r.state==='running'||Number(r.leaseUntil)>Date.now();
   if(kind==='message')busy=r.status==='running';
   if(kind==='agent-admission')busy=r.state!=='released';
   if(['run','sandbox-job'].includes(kind))busy=!['succeeded','failed','cancelled','timed_out'].includes(r.state);
   if(kind==='publication-build-job')busy=['queued','starting','running','unknown'].includes(r.state);
   if(kind==='native-request'||kind==='task-attempt')busy=['running','unknown'].includes(r.state);
   if(kind==='model-http-request')busy=['queued','active','unknown'].includes(r.state)||r.ownerKind==='owner-native'&&r.state==='interrupted'&&r.transportEnded!==true;
   if(kind==='host-command')busy=['starting','running','unknown'].includes(r.state);
   if(kind==='session-action')busy=['executing','unknown'].includes(r.state);
   if(kind==='git-operation')busy=['queued','running','unknown','recovering','cancelling'].includes(r.state);
   if(kind==='campaign')busy=r.state==='active';
   if(kind==='literature-task')busy=['queued','running','unknown','recovering','cancelling'].includes(r.state);
  }
  if(kind==='task'&&teamIds.has(r.teamId))busy=['pending','running','blocked','waiting_user'].includes(r.execution);
  if(kind==='operation-pending')busy=!r.sessionId||sessions.has(r.sessionId);
  if(kind==='workspace-lease')busy=Number(r.until)>Date.now()&&([...sessions].some(id=>r.owner===`session:${id}`)||[...gitIds].some(id=>r.owner===`operation:${id}`));
  ensure(!busy,'SESSION_BUSY',`会话仍有未结束执行：${kind}/${r.id}`);
 }
}

/** Database-only retirement is rolled back together with the session CAS. */
export function retireSessionAuthority(store:Store,s:Row<Session>){
 retireSessionGrants(store,s.projectId!,s.id);
 const host=store.maybe('host-access',s.id);if(host)store.update('host-access',host.id,host.version,{state:'revoked',epoch:Number(host.epoch)+1});
 const permission=store.maybe('session-permission',s.id);if(permission)store.update('session-permission',permission.id,permission.version,{epoch:Number(permission.epoch)+1});else store.create('session-permission',s.projectId,{sessionId:s.id,mode:'confirm',epoch:1},s.id);
 for(const action of store.list('session-action',s.projectId!).filter(a=>a.sessionId===s.id&&['pending','approved'].includes(String(a.state)))){
  store.update('session-action',action.id,action.version,{state:'stale'});
  const approval=store.maybe('approval',String(action.approvalId));if(approval&&['pending','approved'].includes(String(approval.status)))store.update('approval',approval.id,approval.version,{status:'stale'});
 }
 for(const request of store.list('native-request',s.projectId!).filter(r=>r.sessionId===s.id&&['pending','approved'].includes(String(r.state))))store.update('native-request',request.id,request.version,{state:'stale',error:'会话已清理，请重新准备'});
 for(const message of store.list('message',s.projectId!).filter(m=>m.sessionId===s.id&&m.status==='queued'))store.update('message',message.id,message.version,{status:'cancelled',error:'会话已清理，未开始的请求已取消'});
}
