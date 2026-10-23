import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {once} from 'node:events';
import {setup,USER,approve} from '../support/research.mjs';

function receive(child,type){return new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>{cleanup();reject(Error('Synthetic '+type+' message timeout'));},12000);
 const message=value=>{if(value.type===type){cleanup();resolve(value);}};
 const exited=(code,signal)=>{cleanup();reject(Error('Synthetic child exited before '+type+': '+code+'/'+signal));};
 const cleanup=()=>{clearTimeout(timer);child.off('message',message);child.off('exit',exited);};
 child.on('message',message);child.on('exit',exited);
});}

for(const first of ['withdraw','submit'])test('SQLite writer lock serializes '+first+' first against the competing operation',async()=>{
 const s=setup(),children=[];try{
  const intent=s.app.runs.prepare(USER,s.baseline.id,s.session.id),approval=approve(s.app,intent.approvalId),input={intentId:intent.id,expectedVersion:intent.version,approvalId:approval.id,expectedApprovalVersion:approval.version,manifestDigest:intent.manifestDigest},before=s.app.store.get('run-intent',intent.id),gate=join(s.dir,'release-race'),start=action=>{
   const child=fork(new URL('../fixtures/run-intent-withdrawal-race.mjs',import.meta.url),[s.dir,s.project.id,s.session.id,JSON.stringify(input),action,gate],{stdio:['ignore','ignore','pipe','ipc'],env:{...process.env,NODE_NO_WARNINGS:'1'}});children.push(child);return child;
  };
  const winner=start(first);await receive(winner,'ready');const loser=start(first==='withdraw'?'submit':'withdraw');await receive(loser,'ready');
  const holding=receive(winner,'holding'),winning=receive(winner,'result'),losing=receive(loser,'result'),winnerExit=once(winner,'exit'),loserExit=once(loser,'exit');winner.send({hold:true});await holding;
  const attempting=receive(loser,'attempting');loser.send({hold:false});await attempting;await new Promise(resolve=>setTimeout(resolve,80));writeFileSync(gate,'release');
  const [won,lost]=await Promise.all([winning,losing]);await Promise.all([winnerExit,loserExit]);assert.equal(won.ok,true,JSON.stringify(won));assert.equal(lost.ok,false,JSON.stringify(lost));
  const runs=s.app.store.list('run',s.project.id),queues=s.app.store.db.prepare('SELECT * FROM compute_queue').all(),current=s.app.store.get('run-intent',intent.id),currentApproval=s.app.store.get('approval',approval.id);
  if(first==='withdraw'){
   assert.equal(lost.code,'APPROVAL_STALE');assert.deepEqual(runs,[]);assert.deepEqual(queues,[]);assert.deepEqual(current,before);assert.equal(currentApproval.status,'stale');assert.equal(currentApproval.decidedAt,approval.decidedAt);
  }else{
   assert.equal(lost.code,'VERSION_CONFLICT');assert.equal(runs.length,1);assert.equal(runs[0].id,won.result.id);assert.equal(current.runId,won.result.id);assert.equal(current.status,'submitted');assert.equal(queues.length,1);assert.equal(queues[0].id,won.result.id);assert.equal(queues[0].held,0);assert.deepEqual(currentApproval,approval);
  }
 }finally{for(const child of children){if(child.exitCode===null&&!child.signalCode)await once(child,'exit');}s.close();}
});
