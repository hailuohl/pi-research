import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';

test('branch writer observes cancellation committed after the request but before its writer lock',()=>{
 const s=setup(),other=new ResearchApp(s.dir,process.cwd());
 const transaction=s.app.store.transaction.bind(s.app.store);
 try{
  const model={provider:'pinned-fixture',model:'fixed-fixture',thinking:'off'};
  s.app.store.update('session',s.session.id,s.session.version,{model});
  const prior=s.app.sessions.send(USER,s.session.id,{content:'completed context'});
  s.app.store.update('message',prior.id,prior.version,{status:'completed'});
  const queued=s.app.sessions.send(USER,s.session.id,{content:'removed input must remain audit only'});
  let interposed=false;
  s.app.store.transaction=callback=>{
   if(!interposed){
    interposed=true;
    other.sessions.queueAction(USER,s.session.id,{messageId:queued.id,expectedVersion:queued.version,action:'cancel'});
   }
   return transaction(callback);
  };
  const branch=s.app.sessions.branch(USER,s.session.id,queued.id);
  const original=s.app.store.get('message',queued.id),history=s.app.sessions.messages(USER,branch.id);
  assert.equal(interposed,true);
  assert.equal(original.status,'cancelled');assert.equal(original.queueRemoved,true);assert.equal(original.content,queued.content);
  assert.equal(history[1].status,'cancelled');assert.equal(history[1].queueRemoved,true);assert.equal(history[1].content,queued.content);
  assert.deepEqual(history.filter(m=>m.status==='completed').map(m=>m.content),['completed context'],'removed input cannot enter the branch model context');
  assert.deepEqual(branch.model,model);assert.equal(branch.parentSessionId,s.session.id);
 }finally{s.app.store.transaction=transaction;other.close();s.close();}
});
