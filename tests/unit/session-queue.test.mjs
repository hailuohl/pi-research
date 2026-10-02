import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';

test('queue selection, versioned edits, bounded pagination and removal survive reopen and branch',()=>{
 const s=setup();let reopened;
 try{
  const first=s.app.sessions.send(USER,s.session.id,{content:'first'});
  assert.equal(first.mode,'prompt');
  const inputs=[first,...Array.from({length:24},(_,i)=>s.app.sessions.send(USER,s.session.id,{content:`queued ${i}`}))];
  assert.ok(inputs.slice(1).every(m=>m.mode==='follow_up'));
  const view=s.app.sessions.view(USER,s.session.id);assert.equal(view.messages.length,10);assert.equal(view.pendingMessages.length,20);assert.equal(view.pendingTotal,25);assert.equal(view.pendingMessages[0].id,first.id);
  assert.deepEqual(s.app.sessions.queue(USER,s.session.id,{afterMessageId:view.pendingNextCursor}).items.map(m=>m.id),inputs.slice(20).map(m=>m.id));
  const edited=s.app.sessions.queueAction(USER,s.session.id,{messageId:first.id,expectedVersion:first.version,action:'edit',content:'new full body '.repeat(1000)});
  assert.throws(()=>s.app.sessions.queueAction(USER,s.session.id,{messageId:first.id,expectedVersion:first.version,action:'cancel'}),{code:'VERSION_CONFLICT'});
  assert.equal(s.app.sessions.queue(USER,s.session.id).items[0].previewTruncated,true);
  const removed=s.app.sessions.queueAction(USER,s.session.id,{messageId:first.id,expectedVersion:edited.version,action:'cancel'});
  assert.equal(removed.content,edited.content);assert.equal(removed.status,'cancelled');assert.equal(removed.queueRemoved,true);
  const branch=s.app.sessions.branch(USER,s.session.id,first.id);assert.equal(s.app.sessions.messages(USER,branch.id)[0].status,'cancelled');
  reopened=new ResearchApp(s.dir,process.cwd());assert.equal(reopened.sessions.queue(USER,s.session.id).total,24);assert.equal(reopened.store.get('message',first.id).queueRemoved,true);
  const other=s.app.sessions.create(USER,s.project.id,{title:'other'});
  assert.throws(()=>s.app.sessions.queueAction(USER,other.id,{messageId:inputs[1].id,expectedVersion:1,action:'cancel'}),{code:'SCOPE_DENIED'});
  const foreignProject=s.app.projects.create(USER,{name:'foreign',template:'empty'}),foreign=s.app.sessions.create(USER,foreignProject.id,{title:'foreign'});
  assert.throws(()=>s.app.sessions.queueAction(USER,foreign.id,{messageId:inputs[1].id,expectedVersion:1,action:'cancel'}),{code:'SCOPE_DENIED'});
  assert.throws(()=>s.app.sessions.queue(USER,other.id,{afterMessageId:inputs[1].id}),{code:'SCOPE_DENIED'});
  assert.throws(()=>s.app.sessions.queueAction({type:'system'},s.session.id,{messageId:inputs[1].id,expectedVersion:1,action:'cancel'}),{code:'PERMISSION_DENIED'});
  assert.throws(()=>s.app.sessions.queueAction(USER,s.session.id,{messageId:inputs[1].id,expectedVersion:1,action:'edit',content:'ok',role:'system'}),{code:'INVALID_INPUT'});
  const automated=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'system',origin:'automation',content:'protected',mode:'prompt',status:'queued'});
  assert.throws(()=>s.app.sessions.queueAction(USER,s.session.id,{messageId:automated.id,expectedVersion:1,action:'cancel'}),{code:'SCOPE_DENIED'});
  const row=s.app.sessions.get(USER,s.session.id);s.app.sessions.archive(USER,row.id,row.version);
  assert.throws(()=>s.app.sessions.queueAction(USER,row.id,{messageId:inputs[1].id,expectedVersion:1,action:'cancel'}),{code:'SESSION_ARCHIVED'});
  const taskSession=s.app.store.update('session',other.id,other.version,{taskId:'protected-task'});
  assert.throws(()=>s.app.sessions.queueAction(USER,taskSession.id,{messageId:inputs[1].id,expectedVersion:1,action:'cancel'}),{code:'TASK_MESSAGE_REQUIRED'});
  const foreignMessage=s.app.sessions.send(USER,foreign.id,{content:'cannot edit archived project'});
  s.app.store.update('project',foreignProject.id,foreignProject.version,{archived:true});
  assert.throws(()=>s.app.sessions.queueAction(USER,foreign.id,{messageId:foreignMessage.id,expectedVersion:foreignMessage.version,action:'cancel'}),{code:'PROJECT_ARCHIVED'});
 }finally{reopened?.close();s.close();}
});

test('steer is tied to live ordinary generation; running claim and automation forbid queue actions',()=>{
 const s=setup();try{
  const active=s.app.sessions.send(USER,s.session.id,{content:'active'}),pending=s.app.sessions.send(USER,s.session.id,{content:'pending'});
  let session=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',session.id,session.version,{state:'running',generation:4,leaseUntil:Date.now()+30000});
  s.app.store.update('message',active.id,active.version,{status:'running'});
  assert.equal(s.app.sessions.view(USER,session.id).progress.canSteer,true);
  const promoted=s.app.sessions.queueAction(USER,session.id,{messageId:pending.id,expectedVersion:pending.version,action:'steer'});assert.equal(promoted.steerGeneration,4);
  const claimed=s.app.store.update('message',promoted.id,promoted.version,{status:'running'});
  for(const action of ['edit','cancel','steer'])assert.throws(()=>s.app.sessions.queueAction(USER,session.id,{messageId:claimed.id,expectedVersion:claimed.version,action,...(action==='edit'?{content:'changed'}:{})}),{code:'MESSAGE_STALE'});
  s.app.store.create('message',s.project.id,{sessionId:session.id,role:'system',origin:'automation',content:'restricted',mode:'prompt',status:'running'});
  assert.equal(s.app.sessions.view(USER,session.id).progress.canSteer,false);
  const later=s.app.sessions.send(USER,session.id,{content:'later'});assert.equal(later.mode,'follow_up');
  assert.throws(()=>s.app.sessions.queueAction(USER,session.id,{messageId:later.id,expectedVersion:later.version,action:'steer'}),{code:'SESSION_BUSY'});
 }finally{s.close();}
});
