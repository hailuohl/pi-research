import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
const stream=async function*(bytes){yield bytes;};
async function attached(s,bytes,purpose='dataset-reference'){
 const d=await s.app.documents.importStream(USER,s.project.id,{title:'data.csv',mediaType:'text/csv'},stream(bytes),'source');
 const m=s.app.sessions.send(USER,s.session.id,{content:'Read fixed input',attachmentDocumentIds:[d.id]});
 const session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});
 const message=s.app.store.get('message',m.id);s.app.store.update('message',m.id,message.version,{status:'running'});
 const actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator',generation:1};
 const input={messageId:m.id,documentVersionId:d.id,sourceDigest:d.original.digest,readProtocol:'fixed-text-v1',purpose,cursor:0,limit:64};
 const read=(extra={},key='read')=>s.app.operations.execute(actor,'session_attachment_read',{...input,...extra},{projectId:s.project.id,idempotencyKey:key});return {d,m,actor,input,read};
}
test('streamed data larger than legacy attachment cap binds and produces bounded pending pages',async()=>{
 const s=setup();try{const bytes=Buffer.alloc(33*1024*1024,97),f=await attached(s,bytes),p=f.read();assert.equal(p.content,'a'.repeat(64));assert.equal(p.end,64);assert.equal(p.total,bytes.length);assert.equal(p.readProtocol,'fixed-text-v1');assert.equal(p.cursorUnit,'utf8-byte');assert.ok(p.attachmentReadId);assert.equal(s.app.store.get('attachment-input-read',p.attachmentReadId).delivery,'pending');}finally{s.close();}
});
test('explicit fixed pages preserve BOM and Unicode byte positions',async()=>{
 const s=setup();try{const bytes=Buffer.from('\ufeff研究🧪\r\nabc'),f=await attached(s,bytes,'whole-text');let content='',cursor=0;while(cursor<bytes.length){const p=f.read({cursor,limit:7},'page-'+cursor);content+=p.content;assert.equal(Buffer.byteLength(p.content),p.end-p.cursor);cursor=p.end;}assert.equal(content,bytes.toString('utf8'));assert.throws(()=>f.read({sourceDigest:'a'.repeat(64)},'wrong'),{code:'DOCUMENT_SOURCE_CHANGED'});}finally{s.close();}
});
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {digest} from '../../dist/packages/storage/store.js';
import {assertSourceInputs} from '../../dist/packages/research-workflows/source-inputs.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {chmodSync,writeFileSync} from 'node:fs';
import {attachmentTypes} from '../../dist/packages/pi-adapter/attachments.js';
function delivery(s,f,page,callId){
 const host=new AgentHost(s.app),active={actor:f.actor,sessionId:f.actor.sessionId,generation:f.actor.generation,ended:false};
 const permission=s.app.sessionPermissions.capture(f.actor.sessionId),epoch=s.app.store.get('project',s.project.id).lifecycleEpoch;
 const token=host.readResponse(active,f.actor,'session_attachment_read',callId,page,permission,epoch);
 const resultDigest=digest(JSON.stringify({content:[{type:'text',text:JSON.stringify(page)}],details:{}}));
 return {host,active,token,ack:(extra={})=>host.completeReadDelivery(active,'session_attachment_read',callId,{readDelivery:token,resultDigest,...extra})};
}
const inputs=s=>s.app.sourceInputs.freeze(s.app.store.get('session',s.session.id),null,[]);
const briefInput={question:'Fixed input question',scope:'Offline verification',constraints:[],successCriteria:['Fixed source integrity'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Inspect explicitly fixed input'}],status:'ready',expectedRevisionId:null};
test('only exact SDK result ACK counts; pending, transformed, failed and replayed results do not freeze',async()=>{
 const s=setup();try{
  const f=await attached(s,Buffer.from('header\nvalue\n')),p=f.read(),d=delivery(s,f,p,'read');assert.throws(()=>inputs(s),{code:'BRIEF_SOURCE_READ_REQUIRED'});
  assert.equal(d.ack({resultDigest:digest('truncated')}),false);assert.equal(d.ack(),false,'failed first end consumes pending delivery token');assert.throws(()=>inputs(s),{code:'BRIEF_SOURCE_READ_REQUIRED'});
  const replay=f.read();assert.deepEqual(replay,p);assert.equal(delivery(s,f,replay,'read').token,undefined);assert.equal(s.app.store.list('attachment-input-read').length,1);
  const error=f.read({},'error'),failed=delivery(s,f,error,'error');assert.equal(failed.ack({isError:true}),false);
  const page=f.read({},'success'),ok=delivery(s,f,page,'success');assert.equal(ok.ack(),true);assert.equal(ok.ack(),false);
  const frozen=inputs(s);assert.equal(frozen[0].purpose,'dataset-reference');assert.equal(frozen[0].path,page.sourceInputPath);assert.equal(frozen[0].artifactId,f.d.original.artifactId);assert.equal(frozen[0].readProtocol,'fixed-text-v1');assert.equal(s.app.store.list('artifact').filter(a=>a.origin?.startsWith('research-input:')).length,0);
  assert.throws(()=>f.read({attachmentBindingId:page.attachmentBindingId,purpose:'whole-text'},'change-mode'),{code:'BRIEF_SOURCE_BINDING_CHANGED'});
 }finally{s.close();}
});
test('whole-text EOF and missing middle fail; delivered coverage freezes exact reference and survives reopen',async()=>{
 const s=setup();try{
  const f=await attached(s,Buffer.from('abcdefghijklmnopqrst'),'whole-text');for(const cursor of [0,16,20]){const key='range-'+cursor,p=f.read({cursor,limit:4},key);assert.equal(delivery(s,f,p,key).ack(),true);}
  assert.throws(()=>inputs(s),{code:'BRIEF_SOURCE_READ_REQUIRED'});
  for(const cursor of [4,8,12]){const key='range-'+cursor,p=f.read({cursor,limit:4},key);assert.equal(delivery(s,f,p,key).ack(),true);}
  const frozen=inputs(s),brief=s.app.researchBriefs.save(USER,s.project.id,s.session.id,briefInput);assert.deepEqual(brief.sourceInputs,frozen);
  const firstDigest=brief.digest;assertSourceInputs(s.app.store,s.project.id,s.session.id,frozen);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assertSourceInputs(s.app.store,s.project.id,s.session.id,frozen);assert.equal(s.app.store.get('research-brief',brief.id).digest,firstDigest);
  assert.throws(()=>assertSourceInputs(s.app.store,s.project.id,s.session.id,[{...frozen[0],purpose:'dataset-reference'}]),{code:'BRIEF_SOURCE_CORRUPTED'});
  assert.throws(()=>f.read({attachmentBindingId:frozen[0].readId,purpose:'dataset-reference'},'downgrade'),{code:'BRIEF_SOURCE_BINDING_CHANGED'});
 }finally{s.close();}
});
test('page and ACK recheck removal, stale generation, foreign project and source corruption',async()=>{
 for(const mutation of ['queue','generation','source']){const s=setup();try{
  const f=await attached(s,Buffer.from('abcdefghijklmnopqrst')),p=f.read({limit:4}),d=delivery(s,f,p,'read');
  if(mutation==='queue'){const m=s.app.store.get('message',f.m.id);s.app.store.update('message',m.id,m.version,{queueRemoved:true});}
  if(mutation==='generation'){const root=s.app.store.get('session',s.session.id);s.app.store.update('session',root.id,root.version,{generation:2});}
  if(mutation==='source'){const a=s.app.store.get('artifact',f.d.original.artifactId),path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);writeFileSync(path,'XXXXXXXXXXXXXXXXXXXX');}
  assert.equal(d.ack(),false,mutation);assert.equal(s.app.store.get('attachment-input-read',p.attachmentReadId).delivery,'pending');assert.throws(()=>f.read({},'new-read'),undefined,mutation);assert.throws(()=>f.read(),undefined,'cached '+mutation);
 }finally{s.close();}}
 const s=setup();try{const f=await attached(s,Buffer.from('same')),foreign=s.app.projects.create(USER,{name:'Foreign'});assert.throws(()=>s.app.operations.execute({...f.actor,projectId:foreign.id},'session_attachment_read',f.input,{projectId:foreign.id,idempotencyKey:'foreign'}));}finally{s.close();}
});
test('partial dataset can freeze only after delivered inspection; full host hash detects damage outside inspected block',async()=>{
 const s=setup();try{
  const f=await attached(s,Buffer.alloc(2*1024*1024,97)),p=f.read({limit:4});assert.equal(delivery(s,f,p,'read').ack(),true);const frozen=inputs(s);assert.equal(frozen[0].size,2*1024*1024);assert.equal(frozen[0].purpose,'dataset-reference');
  const a=s.app.store.get('artifact',f.d.original.artifactId),path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);const changed=Buffer.alloc(2*1024*1024,97);changed[changed.length-1]=98;writeFileSync(path,changed);assert.throws(()=>assertSourceInputs(s.app.store,s.project.id,s.session.id,frozen),{code:'ARTIFACT_CORRUPTED'});
 }finally{s.close();}
});
test('attachment capability reports stream originals separately from legacy JSON and native budgets',()=>{
 const s=setup();try{const cap=attachmentTypes(s.dir,s.session);assert.equal(cap.types.find(t=>t.mediaType==='text/plain').maxBytes,32*1024*1024);assert.equal(cap.fixedTextOriginals.maxBytes,512*1024*1024);assert.equal(cap.fixedTextOriginals.transport,'document-stream');assert.ok(cap.fixedTextOriginals.mediaTypes.includes('application/json'));assert.equal(cap.nativeBytes,20*1024*1024);}finally{s.close();}
});
import {createDataBackup,restoreDataBackup} from '../../dist/packages/storage/backup.js';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {compileMethodContract,assertFrozenMethod} from '../../dist/packages/research-workflows/method-contracts.js';
test('methods leave unreferenced large datasets as descriptors; bounded JSON literature still requires exact bytes',async()=>{
 const s=setup();try{
  const f=await attached(s,Buffer.alloc(3*1024*1024,97)),p=f.read();assert.equal(delivery(s,f,p,'read').ack(),true);
  const frozen=inputs(s),specification={version:1,literatureSources:[],quantitative:{type:'descriptive'}},compiled=s.app.methodContracts.preview(s.app.store.get('session',s.session.id),specification,[]);
  assert.equal(compiled.specification.quantitative.type,'descriptive');const {protocol,...contract}=compiled;assert.doesNotThrow(()=>assertFrozenMethod(s.app.store,s.project.id,{...contract,protocolPath:'protocol.md'},frozen,s.session.id));
  assert.throws(()=>s.app.methodContracts.preview(s.app.store.get('session',s.session.id),{...specification,literatureSources:[{path:frozen[0].path,digest:frozen[0].digest,recordsPointer:'',recordIdField:'id',doiField:'doi'}]},[]));
  assert.throws(()=>compileMethodContract({...specification,literatureSources:[{path:'fake.json',digest:'a'.repeat(64),recordsPointer:'',recordIdField:'id',doiField:'doi'}]},[{path:'fake.json',digest:'a'.repeat(64),size:1}]),{code:'METHOD_SOURCE_NOT_READ'});
 }finally{s.close();}
});
test('backup restore retains fixed source, delivered facts and pending facts without promoting or copying them',async()=>{
 const s=setup(),parent=mkdtempSync(join(tmpdir(),'pi-fixed-backup-'));let restored;try{
  const f=await attached(s,Buffer.from('header\nvalue\n')),p=f.read();assert.equal(delivery(s,f,p,'read').ack(),true);const pending=f.read({},'pending'),brief=s.app.researchBriefs.save(USER,s.project.id,s.session.id,briefInput);
  let row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'idle',leaseUntil:0});row=s.app.store.get('message',f.m.id);s.app.store.update('message',row.id,row.version,{status:'completed'});
  s.app.close();await createDataBackup(s.dir,join(parent,'backup'),{offline:true});await restoreDataBackup(join(parent,'backup'),join(parent,'restored'),{offline:true,relocate:true});restored=new ResearchApp(join(parent,'restored'),process.cwd());
  const saved=restored.store.get('research-brief',brief.id);assert.equal(saved.digest,brief.digest);assertSourceInputs(restored.store,s.project.id,s.session.id,saved.sourceInputs);assert.equal(restored.store.get('attachment-input-read',p.attachmentReadId).delivery,'delivered');assert.equal(restored.store.get('attachment-input-read',pending.attachmentReadId).delivery,'pending');
 }finally{restored?.close();s.close();rmSync(parent,{recursive:true,force:true});}
});
test('permission revocation after source delivery offering fences the SDK ACK',async()=>{
 const s=setup();try{const f=await attached(s,Buffer.from('value\n')),p=f.read(),d=delivery(s,f,p,'read');s.app.sessionPermissions.initialize(s.session.id,'readOnly');assert.equal(d.ack(),false);assert.equal(s.app.store.get('attachment-input-read',p.attachmentReadId).delivery,'pending');}finally{s.close();}
});
test('new revisions recheck inherited attachment authority and reject legacy workspace alias replacement',async()=>{
 const s=setup();try{
  const f=await attached(s,Buffer.from('fixed value')),p=f.read();assert.equal(delivery(s,f,p,'read').ack(),true);const brief=s.app.researchBriefs.save(USER,s.project.id,s.session.id,briefInput),input=brief.sourceInputs[0];
  let message=s.app.store.get('message',f.m.id);s.app.store.update('message',message.id,message.version,{queueRemoved:true});
  assert.throws(()=>s.app.researchBriefs.sourceInputFingerprint(s.session.id,brief.id),{code:'ATTACHMENT_NOT_DELIVERED'});assertSourceInputs(s.app.store,s.project.id,s.session.id,brief.sourceInputs);
  message=s.app.store.get('message',f.m.id);s.app.store.update('message',message.id,message.version,{queueRemoved:false});
  s.app.projects.writeFile(USER,s.project.id,input.path,'replacement',null);s.app.operations.execute(f.actor,'workspace_read',{source:'project',path:input.path},{projectId:s.project.id,idempotencyKey:'legacy-alias'});
  assert.throws(()=>s.app.researchBriefs.sourceInputFingerprint(s.session.id,brief.id),{code:'BRIEF_SOURCE_BINDING_CHANGED'});
 }finally{s.close();}
});
function nextAttachedMessage(s,f,retry=false){
 let m=s.app.store.get('message',f.m.id);s.app.store.update('message',m.id,m.version,{status:retry?'failed':'completed'});
 let root=s.app.store.get('session',s.session.id);s.app.store.update('session',root.id,root.version,{state:'idle',leaseUntil:0});
 const next=retry?s.app.sessions.retry(USER,s.session.id,m.id):s.app.sessions.send(USER,s.session.id,{content:'Read the same original again',attachmentDocumentIds:[f.d.id]});
 root=s.app.store.get('session',s.session.id);s.app.store.update('session',root.id,root.version,{state:'running',generation:root.generation+1,leaseUntil:Date.now()+120000});m=s.app.store.get('message',next.id);s.app.store.update('message',m.id,m.version,{status:'running'});f.actor.generation=root.generation+1;return next;
}
test('fresh message and real session retry reuse the original with independent immutable bindings',async()=>{
 for(const retry of [false,true]){const s=setup();try{
  const f=await attached(s,Buffer.from('header\nvalue\n')),first=f.read({},'first'),old=s.app.store.get('attachment-input-binding',first.attachmentBindingId),next=nextAttachedMessage(s,f,retry);
  const page=f.read({messageId:next.id},'next');assert.notEqual(page.attachmentBindingId,first.attachmentBindingId);assert.equal(page.sourceInputPath,first.sourceInputPath);assert.equal(delivery(s,f,page,'next').ack(),true);
  assert.equal(inputs(s)[0].readId,page.attachmentBindingId);assert.deepEqual(s.app.store.get('attachment-input-binding',old.id),old);assert.equal(s.app.store.list('document-version').length,1);
 }finally{s.close();}}
});
test('pending dataset and partially delivered whole-text allow clarifying but ready still requires selected coverage',async()=>{
 for(const purpose of ['dataset-reference','whole-text']){const s=setup();try{
  const f=await attached(s,Buffer.from('abcdefghijklmnopqrst'),purpose),p=f.read({limit:4},'partial');if(purpose==='whole-text')assert.equal(delivery(s,f,p,'partial').ack(),true);
  const clarifying={...briefInput,status:'clarifying',clarificationQuestions:['Which scope?']};const brief=s.app.researchBriefs.save(USER,s.project.id,s.session.id,clarifying);assert.deepEqual(brief.sourceInputs,[]);
  assert.throws(()=>s.app.researchBriefs.save(USER,s.project.id,s.session.id,{...briefInput,expectedRevisionId:brief.id}),{code:'BRIEF_SOURCE_READ_REQUIRED'});
  const selected=f.read({purpose:'dataset-reference'},'dataset');assert.equal(delivery(s,f,selected,'dataset').ack(),true);const ready=s.app.researchBriefs.save(USER,s.project.id,s.session.id,{...briefInput,expectedRevisionId:brief.id});assert.equal(ready.sourceInputs[0].purpose,'dataset-reference');assert.equal(ready.sourceInputs[0].readId,selected.attachmentBindingId);
 }finally{s.close();}}
});
test('new revisions explicitly switch purpose while old frozen briefs and receipt bindings remain unchanged',async()=>{
 const s=setup();try{
  const f=await attached(s,Buffer.from('abcdefghijklmnopqrst')),first=f.read({limit:4},'dataset-first');assert.equal(delivery(s,f,first,'dataset-first').ack(),true);
  const initial=s.app.researchBriefs.save(USER,s.project.id,s.session.id,briefInput),oldBinding=s.app.store.get('attachment-input-binding',first.attachmentBindingId);
  const whole=f.read({purpose:'whole-text',limit:4},'whole-start');assert.notEqual(whole.attachmentBindingId,first.attachmentBindingId);assert.equal(whole.sourceInputPath,first.sourceInputPath);assert.equal(delivery(s,f,whole,'whole-start').ack(),true);
  const clarifying=s.app.researchBriefs.save(USER,s.project.id,s.session.id,{...briefInput,status:'clarifying',expectedRevisionId:initial.id});assert.equal(clarifying.sourceInputs[0].readId,first.attachmentBindingId,'unfinished replacement does not erase the inherited fixed reference');
  assert.throws(()=>s.app.researchBriefs.save(USER,s.project.id,s.session.id,{...briefInput,expectedRevisionId:clarifying.id}),{code:'BRIEF_SOURCE_READ_REQUIRED'});
  for(const cursor of [4,8,12,16]){const key='whole-'+cursor,p=f.read({attachmentBindingId:whole.attachmentBindingId,purpose:'whole-text',cursor,limit:4},key);assert.equal(delivery(s,f,p,key).ack(),true);}
  const ready=s.app.researchBriefs.save(USER,s.project.id,s.session.id,{...briefInput,expectedRevisionId:clarifying.id});assert.equal(ready.sourceInputs[0].purpose,'whole-text');assert.equal(ready.sourceInputs[0].readId,whole.attachmentBindingId);assert.notEqual(ready.digest,initial.digest);
  const next=f.read({purpose:'dataset-reference'},'dataset-again');assert.notEqual(next.attachmentBindingId,whole.attachmentBindingId);assert.equal(delivery(s,f,next,'dataset-again').ack(),true);
  const last=s.app.researchBriefs.save(USER,s.project.id,s.session.id,{...briefInput,expectedRevisionId:ready.id});assert.equal(last.sourceInputs[0].readId,next.attachmentBindingId);
  assert.deepEqual(s.app.store.get('research-brief',initial.id),initial);assert.deepEqual(s.app.store.get('attachment-input-binding',oldBinding.id),oldBinding);assertSourceInputs(s.app.store,s.project.id,s.session.id,initial.sourceInputs);
 }finally{s.close();}
});
test('late ACKs and cached calls never replace a newer explicit selection, and same-binding pages keep its version',async()=>{
 const s=setup();try{
  const f=await attached(s,Buffer.from('abcdefghijklmnopqrst'),'whole-text'),old=f.read({limit:4},'old'),late=delivery(s,f,old,'old'),next=f.read({purpose:'dataset-reference',limit:4},'new'),selection=()=>s.app.store.list('attachment-input-selection',s.project.id)[0];
  assert.equal(selection().bindingId,next.attachmentBindingId);assert.equal(delivery(s,f,next,'new').ack(),true);const version=selection().version;
  assert.equal(late.ack(),true);assert.equal(selection().bindingId,next.attachmentBindingId);assert.equal(selection().version,version);
  assert.deepEqual(f.read({limit:4},'old'),old);assert.equal(selection().bindingId,next.attachmentBindingId);
  f.read({attachmentBindingId:next.attachmentBindingId,purpose:'dataset-reference',cursor:4,limit:4},'next-page');assert.equal(selection().version,version);
  assert.equal(inputs(s)[0].readId,next.attachmentBindingId);
  f.read({attachmentBindingId:old.attachmentBindingId,purpose:'whole-text',cursor:4,limit:4},'explicit-old');assert.equal(selection().bindingId,old.attachmentBindingId);assert.ok(selection().version>version);assert.throws(()=>inputs(s),{code:'BRIEF_SOURCE_READ_REQUIRED'});
 }finally{s.close();}
});
test('explicit binding IDs reject changed message, purpose and foreign session without moving selection',async()=>{
 const s=setup();try{
  const f=await attached(s,Buffer.from('fixed input')),p=f.read(),next=nextAttachedMessage(s,f),before=s.app.store.list('attachment-input-selection',s.project.id)[0];
  assert.throws(()=>f.read({attachmentBindingId:p.attachmentBindingId,messageId:next.id},'changed-message'),{code:'BRIEF_SOURCE_BINDING_CHANGED'});
  assert.throws(()=>s.app.operations.execute(USER,'session_attachment_read',{...f.input,attachmentBindingId:p.attachmentBindingId,purpose:'whole-text'},{projectId:s.project.id,sessionId:s.session.id}),{code:'BRIEF_SOURCE_BINDING_CHANGED'});
  const foreign=s.app.sessions.create(USER,s.project.id,{title:'Other root'}),message=s.app.sessions.send(USER,foreign.id,{content:'Inspect',attachmentDocumentIds:[f.d.id]});let row=s.app.store.get('session',foreign.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});row=s.app.store.get('message',message.id);s.app.store.update('message',row.id,row.version,{status:'running'});
  assert.throws(()=>s.app.operations.execute({...f.actor,sessionId:foreign.id,generation:1},'session_attachment_read',{...f.input,messageId:message.id,attachmentBindingId:p.attachmentBindingId},{projectId:s.project.id,idempotencyKey:'foreign-binding'}),{code:'BRIEF_SOURCE_BINDING_CHANGED'});assert.deepEqual(s.app.store.get('attachment-input-selection',before.id),before);
 }finally{s.close();}
});
function saveOperation(s,f,input,key){return s.app.operations.execute(f.actor,'research_brief_save',input,{projectId:s.project.id,idempotencyKey:key});}
function approveAction(s,a){return s.app.sessionPermissions.decide(USER,s.session.id,a.id,{expectedVersion:a.version,expectedApprovalVersion:a.approval.version,approved:true});}
test('clarifying approval fingerprints pending selections and uses the same inclusion rules at execution',async()=>{
 const s=setup();try{
  const f=await attached(s,Buffer.from('abcdefghijklmnopqrst'));s.app.sessionPermissions.initialize(s.session.id,'confirm');const input={...briefInput,status:'clarifying'},first=f.read({limit:4},'pending-dataset');
  const source=()=>s.app.sessionPermissions.source(s.session.id,'research_brief_save',input).fingerprint,before=source();assert.throws(()=>saveOperation(s,f,input,'prepare-a'),{code:'APPROVAL_REQUIRED'});const oldAction=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);
  const second=f.read({purpose:'whole-text',limit:4},'pending-whole');assert.notEqual(second.attachmentBindingId,first.attachmentBindingId);assert.notEqual(source(),before);assert.throws(()=>approveAction(s,oldAction),{code:'APPROVAL_STALE'});
  assert.throws(()=>saveOperation(s,f,input,'prepare-b'),{code:'APPROVAL_REQUIRED'});const action=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);approveAction(s,action);const approved=source();
  const page=f.read({attachmentBindingId:second.attachmentBindingId,purpose:'whole-text',cursor:4,limit:4},'pending-next');assert.equal(delivery(s,f,page,'pending-next').ack(),true);assert.equal(source(),approved,'partial pages on same selection do not change a source omitted from clarifying');
  const saved=saveOperation(s,f,input,'prepare-b');assert.deepEqual(saved.sourceInputs,[]);assert.equal(s.app.store.get('attachment-input-binding',second.attachmentBindingId).purpose,'whole-text');
  assert.throws(()=>saveOperation(s,f,{...briefInput,expectedRevisionId:saved.id},'ready-pending'),{code:'BRIEF_SOURCE_READ_REQUIRED'});
 }finally{s.close();}
});
test('ACK which makes a pending source includable invalidates a prepared clarifying approval',async()=>{
 const s=setup();try{const f=await attached(s,Buffer.from('value')),input={...briefInput,status:'clarifying'};s.app.sessionPermissions.initialize(s.session.id,'confirm');const p=f.read();assert.throws(()=>saveOperation(s,f,input,'prepare'),{code:'APPROVAL_REQUIRED'});const action=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);assert.equal(delivery(s,f,p,'read').ack(),true);assert.throws(()=>approveAction(s,action),{code:'APPROVAL_STALE'});assert.equal(s.app.store.list('research-brief',s.project.id).length,0);}finally{s.close();}
});
test('fixed-read facts remain permitted in readOnly but brief persistence retains its write guard',async()=>{
 const s=setup();try{const f=await attached(s,Buffer.from('value'));s.app.sessionPermissions.initialize(s.session.id,'readOnly');const p=f.read();assert.equal(delivery(s,f,p,'read').ack(),true);assert.throws(()=>saveOperation(s,f,{...briefInput,status:'clarifying'},'read-only-save'),{code:'SESSION_READ_ONLY'});}finally{s.close();}
});
test('a saved brief survives provider failure followed by real retry and a fully acknowledged replacement binding',async()=>{
 for(const status of ['ready','clarifying']){const s=setup();try{
  const f=await attached(s,Buffer.from('abcdefghijklmnopqrst')),first=f.read({limit:4},'first');assert.equal(delivery(s,f,first,'first').ack(),true);
  const initial=s.app.researchBriefs.save(USER,s.project.id,s.session.id,briefInput),oldBinding=s.app.store.get('attachment-input-binding',first.attachmentBindingId),oldReceipt=s.app.store.get('attachment-input-read',first.attachmentReadId);
  const next=nextAttachedMessage(s,f,true),page=f.read({messageId:next.id,limit:4},'retry-read');assert.equal(delivery(s,f,page,'retry-read').ack(),true);
  const saved=s.app.researchBriefs.save(USER,s.project.id,s.session.id,{...briefInput,status,expectedRevisionId:initial.id});assert.equal(saved.sourceInputs[0].readId,page.attachmentBindingId);assert.equal(saved.sourceInputs[0].artifactId,initial.sourceInputs[0].artifactId);assert.equal(saved.sourceInputs[0].digest,initial.sourceInputs[0].digest);
  assert.deepEqual(s.app.store.get('research-brief',initial.id),initial);assert.deepEqual(s.app.store.get('attachment-input-binding',oldBinding.id),oldBinding);assert.deepEqual(s.app.store.get('attachment-input-read',oldReceipt.id),oldReceipt);assertSourceInputs(s.app.store,s.project.id,s.session.id,initial.sourceInputs);
 }finally{s.close();}}
});
test('pending, partial or unauthorized retry selections cannot bypass the failed inherited message',async()=>{
 for(const failure of ['pending','partial','removed','scope']){const s=setup();try{
  const f=await attached(s,Buffer.from('abcdefghijklmnopqrst')),first=f.read({limit:4},'first');assert.equal(delivery(s,f,first,'first').ack(),true);const initial=s.app.researchBriefs.save(USER,s.project.id,s.session.id,briefInput);
  const next=nextAttachedMessage(s,f,true),page=f.read({messageId:next.id,purpose:failure==='partial'?'whole-text':'dataset-reference',limit:4},'retry-read');if(failure!=='pending')assert.equal(delivery(s,f,page,'retry-read').ack(),true);
  if(failure==='removed'||failure==='scope'){const message=s.app.store.get('message',next.id),other=failure==='scope'?s.app.sessions.create(USER,s.project.id,{title:'Foreign root'}):null;s.app.store.update('message',message.id,message.version,failure==='removed'?{queueRemoved:true}:{sessionId:other.id});}
  for(const status of ['ready','clarifying'])assert.throws(()=>s.app.researchBriefs.save(USER,s.project.id,s.session.id,{...briefInput,status,expectedRevisionId:initial.id}),error=>['BRIEF_SOURCE_READ_REQUIRED','ATTACHMENT_NOT_DELIVERED','ATTACHMENT_SCOPE_DENIED'].includes(error.code),failure+'/'+status);
  assert.deepEqual(s.app.store.get('research-brief',initial.id),initial);assert.equal(s.app.store.list('research-brief',s.project.id).length,1);
 }finally{s.close();}}
});
