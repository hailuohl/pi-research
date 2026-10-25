import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync,openSync,writeSync,closeSync} from 'node:fs';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {digest} from '../../dist/packages/storage/store.js';

const call=(s,actor,name,input={},key=crypto.randomUUID())=>s.app.operations.execute(actor,name,input,{projectId:s.project.id,sessionId:actor.sessionId,idempotencyKey:key});
async function pending(s,mode='confirm',delivered=true){
 s.app.sessionPermissions.initialize(s.session.id,mode);let row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});
 const actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator',generation:1,permission:s.app.sessionPermissions.capture(s.session.id)},a=s.app.evidence.put(s.project.id,'approved source',Buffer.from('Unique quote. Other material.'));
 const prepared=await call(s,actor,'artifact_text_prepare',{artifactId:a.id,sourceDigest:a.digest},'prepare'),page=call(s,actor,'artifact_read',{artifactId:a.id,sourceDigest:a.digest,textSourceId:prepared.textSourceId,readProtocol:'fixed-text-v1',limit:16000},'page');
 if(delivered){const host=new AgentHost(s.app),active={actor,sessionId:actor.sessionId,generation:1,ended:false},token=host.readResponse(active,actor,'artifact_read','page',page,actor.permission,s.app.store.get('project',s.project.id).lifecycleEpoch);assert.equal(host.completeReadDelivery(active,'artifact_read','page',{readDelivery:token,resultDigest:digest(JSON.stringify({content:[{type:'text',text:JSON.stringify(page)}],details:{}}))}),true);}
 const input={artifactId:a.id,readProtocol:'fixed-text-v1',readId:page.artifactReadId,exactQuote:'Unique quote.'};assert.throws(()=>call(s,actor,'evidence_register',input,'register'),{code:'APPROVAL_REQUIRED'});const action=s.app.store.list('session-action',s.project.id).find(a=>a.operation==='evidence_register');return {actor,a,page,input,action};
}
function approveAndAdvance(s,f,generation=2){
 const approval=s.app.store.get('approval',f.action.approvalId);s.app.sessionPermissions.decide(USER,s.session.id,f.action.id,{expectedVersion:f.action.version,expectedApprovalVersion:approval.version,approved:true});
 const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation,leaseUntil:Date.now()+120000});const notice=s.app.sessions.messages(USER,s.session.id).find(m=>m.approvalNoticeId===f.action.id);s.app.store.update('message',notice.id,notice.version,{status:'running',generation});return {...f.actor,generation,approvalNoticeMessageId:notice.id};
}
for(const mode of ['confirm','autoEdit'])test(`${mode}: exact approved generation-2 resume consumes original delivered page without rewriting its identity`,async()=>{
 const s=setup();try{const f=await pending(s,mode),before=s.app.store.get('artifact-text-read',f.page.artifactReadId),actor=approveAndAdvance(s,f),response=await call(s,actor,'session_action_resume');assert.equal(response.operation,'evidence_register');assert.equal(response.result.quote,f.input.exactQuote);assert.equal(response.result.fixedText.readId,f.page.artifactReadId);assert.equal(s.app.store.get('session-action',f.action.id).state,'completed');assert.deepEqual(s.app.store.get('artifact-text-read',f.page.artifactReadId),before);assert.equal(s.app.evidence.verify(s.project.id,response.result.id).quote,f.input.exactQuote);const replay=call(s,actor,'evidence_register',f.input,'register');assert.equal(replay.id,response.result.id);assert.equal(s.app.store.list('evidence',s.project.id).length,1);assert.deepEqual(s.app.store.get('artifact-text-read',f.page.artifactReadId),before);await assert.rejects(async()=>call(s,actor,'session_action_resume'),{code:'SESSION_ACTION_NOT_APPROVED'});
 }finally{s.close();}
});
test('a new generation and forged action ID cannot directly borrow a delivered historical page',async()=>{
 const s=setup();try{const f=await pending(s),actor=approveAndAdvance(s,f);assert.throws(()=>s.app.artifactTexts.register({...actor,permissionActionId:f.action.id},s.project.id,f.input),{code:'ARTIFACT_READ_REQUIRED'});const action=s.app.store.get('session-action',f.action.id);s.app.store.update('session-action',action.id,action.version,{state:'executing'});assert.throws(()=>s.app.artifactTexts.register({...actor,permissionActionId:f.action.id},s.project.id,f.input),{code:'ARTIFACT_READ_REQUIRED'});assert.equal(s.app.store.list('evidence',s.project.id).length,0);
 }finally{s.close();}
});
test('a later generation cannot obtain a new approval for an earlier generation page and bridge again',async()=>{
 const s=setup();try{const f=await pending(s),approval=s.app.store.get('approval',f.action.approvalId);s.app.sessionPermissions.decide(USER,s.session.id,f.action.id,{expectedVersion:f.action.version,expectedApprovalVersion:approval.version,approved:false});const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:2,leaseUntil:Date.now()+120000});const later={...f.actor,generation:2};assert.throws(()=>call(s,later,'evidence_register',f.input,'later-proposal'),{code:'APPROVAL_REQUIRED'});const action=s.app.store.list('session-action',s.project.id).find(a=>a.generation===2);assert.ok(action);const actor=approveAndAdvance(s,{...f,actor:later,action},3);await assert.rejects(async()=>call(s,actor,'session_action_resume'),{code:'ARTIFACT_READ_REQUIRED'});assert.equal(s.app.store.list('evidence',s.project.id).length,0);
 }finally{s.close();}
});
test('completed-action capability can return only its saved evidence and cannot create another quote or be cloned',async()=>{
 const s=setup();try{const f=await pending(s),actor=approveAndAdvance(s,f),e=(await call(s,actor,'session_action_resume')).result;
 const creation=s.app.sessionPermissions.evidenceReplayActor(actor,f.input,f.action.id,e.id);assert.throws(()=>s.app.artifactTexts.register(creation,s.project.id,f.input),{code:'ARTIFACT_READ_REQUIRED'});
 const replay=s.app.sessionPermissions.evidenceReplayActor(actor,f.input,f.action.id,e.id);assert.throws(()=>s.app.artifactTexts.replayQuote({...replay},s.project.id,f.input,e.id),{code:'ARTIFACT_READ_REQUIRED'});assert.equal(s.app.artifactTexts.replayQuote(replay,s.project.id,f.input,e.id).id,e.id);assert.equal(s.app.store.list('evidence',s.project.id).length,1);
 }finally{s.close();}
});
test('an exact approval cannot turn an Owner-read record into agent-delivered history',async()=>{
 const s=setup();try{const f=await pending(s),read=s.app.store.get('artifact-text-read',f.page.artifactReadId),ownerPage=call(s,USER,'artifact_read',{artifactId:f.a.id,sourceDigest:f.a.digest,textSourceId:read.textSourceId,readProtocol:'fixed-text-v1'}),input={...f.input,readId:ownerPage.artifactReadId};assert.throws(()=>call(s,f.actor,'evidence_register',input,'owner-proposal'),{code:'APPROVAL_REQUIRED'});const action=s.app.store.list('session-action',s.project.id).find(a=>a.input.readId===ownerPage.artifactReadId),actor=approveAndAdvance(s,{...f,input,action});await assert.rejects(async()=>call(s,actor,'session_action_resume'),{code:'ARTIFACT_READ_REQUIRED'});assert.equal(s.app.store.get('artifact-text-read',ownerPage.artifactReadId).delivery,'owner-read');assert.equal(s.app.store.list('evidence',s.project.id).length,0);
 }finally{s.close();}
});
for(const boundary of ['pending-read','input','source','permission','read-permission','failed-action','attempt','foreign-session'])test(`approved historical page remains fenced by ${boundary}`,async()=>{
 const s=setup();try{const f=await pending(s,'confirm',boundary!=='pending-read');let actor=approveAndAdvance(s,f);
 if(boundary==='input'){const a=s.app.store.get('session-action',f.action.id);s.app.store.update('session-action',a.id,a.version,{input:{...f.input,exactQuote:'Other material.'}});}
 if(boundary==='source'){const path=s.app.store.paths.physical(f.a.path);chmodSync(path,0o600);const fd=openSync(path,'r+');writeSync(fd,Buffer.from('X'),0,1,0);closeSync(fd);}
 if(boundary==='permission'){const status=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:status.version,expectedHostVersion:status.hostAccess.version});}
 if(boundary==='read-permission'){const r=s.app.store.get('artifact-text-read',f.page.artifactReadId);s.app.store.update('artifact-text-read',r.id,r.version,{permission:{...r.permission,epoch:999}});}
 if(boundary==='failed-action'){const a=s.app.store.get('session-action',f.action.id);s.app.store.update('session-action',a.id,a.version,{state:'failed'});}
 if(boundary==='attempt')actor={...actor,taskId:'different-task',attemptId:'different-attempt'};
 if(boundary==='foreign-session'){const other=s.app.sessions.create(USER,s.project.id,{});s.app.store.update('session',other.id,other.version,{state:'running',generation:2,leaseUntil:Date.now()+120000});actor={...actor,sessionId:other.id};}
 await assert.rejects(async()=>call(s,actor,'session_action_resume'));assert.equal(s.app.store.list('evidence',s.project.id).length,0);assert.equal(s.app.store.get('artifact-text-read',f.page.artifactReadId).actor.generation,1);
 }finally{s.close();}
});
