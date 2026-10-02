import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {messageInput} from '../../dist/packages/pi-adapter/attachments.js';
const first={provider:'fixture-a',model:'a',thinking:'off'},second={provider:'fixture-b',model:'b',thinking:'high'};
const current=s=>s.app.sessions.get(USER,s.session.id);

test('saved model choices survive reopening and select only the idle root without changing defaults or history',()=>{
 const s=setup();try{
  s.app.sessions.configure(USER,first);s.app.sessions.configure(USER,second);
  const session=current(s),past=s.app.store.create('message',s.project.id,{sessionId:session.id,role:'user',content:'retained',mode:'prompt',status:'completed'});
  const selected=s.app.sessions.selectModel(USER,session.id,{expectedVersion:session.version,model:first});
  assert.deepEqual(selected.model,first);assert.deepEqual(s.app.sessions.model(),second);assert.equal(s.app.store.get('message',past.id).content,'retained');
  assert.throws(()=>s.app.sessions.selectModel({...USER,type:'agent'},session.id,{expectedVersion:selected.version,model:second}),{code:'PERMISSION_DENIED'});
  assert.throws(()=>s.app.sessions.selectModel(USER,session.id,{expectedVersion:selected.version,model:{...first,model:'not-saved'}}),{code:'MODEL_NOT_CONFIGURED'});
  assert.throws(()=>s.app.sessions.configure(USER,{...first,apiKey:'must-not-enter-settings'}),{code:'INVALID_INPUT'});
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  assert.deepEqual(s.app.sessions.model(),second);assert.deepEqual(s.app.sessions.models(),[second,first]);assert.deepEqual(current(s).model,first);
  s.app.sessions.configure(USER,{...first,thinking:'low'});assert.equal(s.app.sessions.models().length,2);assert.equal(s.app.sessions.models()[0].thinking,'low');
 }finally{s.close();}
});

test('model selection rejects pending input, a stopping worker, and fixed authorization within the transaction',()=>{
 const s=setup();try{
  s.app.sessions.configure(USER,first);s.app.sessions.configure(USER,second);
  const select=()=>s.app.sessions.selectModel(USER,s.session.id,{expectedVersion:current(s).version,model:first});
  const pending=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'system',content:'automation',origin:'automation',mode:'prompt',status:'queued'});
  assert.throws(select,{code:'SESSION_BUSY'});s.app.store.update('message',pending.id,pending.version,{status:'cancelled'});
  const admission=s.app.store.create('agent-admission',s.project.id,{sessionId:s.session.id,state:'stopping'});
  assert.throws(select,{code:'SESSION_BUSY'});s.app.store.update('agent-admission',admission.id,admission.version,{state:'released'});
  const grant=s.app.store.create('working-grant',s.project.id,{sessionId:s.session.id,state:'draft',model:second});
  assert.throws(select,{code:'MODEL_BOUND'});assert.deepEqual(s.app.store.get('working-grant',grant.id).model,second);
  assert.deepEqual(current(s).model,s.session.model);
 }finally{s.close();}
});

test('message attachments retain fixed references through queues, retry, branch and history with fenced text reads',async()=>{
 const s=setup();try{
  const content='研究🧪\n'.repeat(5000),importDoc=(pid,title,body,mediaType='text/plain')=>s.app.operations.execute(USER,'document_import',{title,mediaType,contentBase64:Buffer.from(body).toString('base64')},{projectId:pid,idempotencyKey:title});
  const doc=await importDoc(s.project.id,'notes.txt',content),pdf=await importDoc(s.project.id,'reference.pdf','%PDF-1.7\nfixture','application/pdf');
  const message=s.app.sessions.send(USER,s.session.id,{content:'查看附件',attachmentDocumentIds:[doc.id,pdf.id]});
  assert.equal(message.attachments.length,2);assert.ok(messageInput(message).includes(message.id));assert.ok(!messageInput(message).includes(content));
  const page=s.app.operations.execute(USER,'session_view',{sessionId:s.session.id},{projectId:s.project.id});assert.deepEqual(page.messages[0].attachments,message.attachments);assert.deepEqual(page.pendingMessages[0].attachments,message.attachments);
  const edited=s.app.sessions.queueAction(USER,s.session.id,{messageId:message.id,expectedVersion:message.version,action:'edit',content:'修改正文'});assert.deepEqual(edited.attachments,message.attachments);
  const root=s.app.store.update('session',s.session.id,current(s).version,{state:'running',generation:1,leaseUntil:Date.now()+30000});
  const actor={type:'agent',projectId:s.project.id,sessionId:root.id,role:'coordinator',generation:1};
  const read=(input,key)=>s.app.operations.execute(actor,'session_attachment_read',input,{projectId:s.project.id,idempotencyKey:key});
  const input={messageId:message.id,documentVersionId:doc.id,cursor:0,limit:100};
  assert.throws(()=>read(input,'before-delivery'),{code:'ATTACHMENT_NOT_DELIVERED'});
  const running=s.app.store.update('message',message.id,edited.version,{status:'running'});
  let cursor=0,assembled='';do{const chunk=read({...input,cursor},'chunk-'+cursor);assert.equal(chunk.status,'text');assembled+=chunk.content;assert.ok(chunk.end>cursor);cursor=chunk.end;if(chunk.complete)break;}while(true);assert.equal(assembled,content);
  const unparsed=read({messageId:message.id,documentVersionId:pdf.id},'pdf');assert.equal(unparsed.status,'requires_parse');assert.equal(unparsed.content,'');
  const another=s.app.sessions.create(USER,s.project.id,{title:'Another'}),anotherRoot=s.app.store.update('session',another.id,another.version,{state:'running',generation:1,leaseUntil:Date.now()+30000});
  assert.throws(()=>s.app.operations.execute({...actor,sessionId:anotherRoot.id},'session_attachment_read',input,{projectId:s.project.id,idempotencyKey:'foreign-session'}),{code:'ATTACHMENT_SCOPE_DENIED'});
  assert.throws(()=>read({...input,documentVersionId:'missing'},'not-attached'),{code:'ATTACHMENT_SCOPE_DENIED'});
  const stopped=s.app.store.update('session',root.id,root.version,{state:'interrupted',generation:2,leaseUntil:0});
  assert.throws(()=>read(input,'chunk-0'),{code:'LEASE_EXPIRED'});
  s.app.store.update('message',message.id,running.version,{status:'failed'});
  const retried=s.app.sessions.retry(USER,root.id,message.id);assert.deepEqual(retried.attachments,message.attachments);
  const cancelled=s.app.sessions.queueAction(USER,root.id,{messageId:retried.id,expectedVersion:retried.version,action:'cancel'});assert.deepEqual(cancelled.attachments,message.attachments);
  const branch=s.app.sessions.branch(USER,root.id,message.id);assert.deepEqual(s.app.sessions.messages(USER,branch.id)[0].attachments,message.attachments);
  assert.equal(s.app.store.get('document-version',doc.id).original.digest,doc.original.digest);
  const foreign=s.app.projects.create(USER,{name:'Foreign'}),foreignDoc=await importDoc(foreign.id,'foreign.txt','outside');
  assert.throws(()=>s.app.sessions.send(USER,branch.id,{content:'no',attachmentDocumentIds:[foreignDoc.id]}),{code:'SCOPE_DENIED'});
  assert.throws(()=>s.app.sessions.send(USER,branch.id,{content:'no',attachmentDocumentIds:[doc.id,doc.id]}),{code:'INVALID_INPUT'});
  const imported=s.app.store.get('document-version',doc.id);s.app.store.update('document-version',doc.id,imported.version,{source:{kind:'connector'}});
  assert.throws(()=>s.app.sessions.send(USER,branch.id,{content:'no',attachmentDocumentIds:[doc.id]}),{code:'ATTACHMENT_SOURCE_DENIED'});
 }finally{s.close();}
});
