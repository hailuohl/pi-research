import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {join} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {digest} from '../../dist/packages/storage/store.js';
import {writeText} from '../../dist/packages/workspace/files.js';
import {acknowledgeWorkspaceRead} from '../support/workspace-delivery.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';

const plan=(extra={})=>({expectedRevisionId:null,question:'Read actual sources',scope:'Small fixed sources',constraints:[],successCriteria:['Delivered bytes'],clarificationQuestions:[],literatureSummary:'Read receipts',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Use the received source'}],status:'ready',...extra});
function actor(s){const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+600000});return {type:'agent',projectId:s.project.id,sessionId:row.id,role:'coordinator',generation:1};}
function op(s,who,name,input,key=crypto.randomUUID()){return s.app.operations.execute(who,name,input,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:key});}
function draft(s){return op(s,USER,'workspace_write',{path:'draft.md',content:'abc😀\r\n',expectedDigest:null});}

test('default managed read without SDK ACK cannot save a new ready brief',()=>{const s=setup();try{
 const who=actor(s);draft(s);const read=op(s,who,'workspace_read',{path:'draft.md'});
 assert.throws(()=>op(s,who,'research_brief_save',plan({draftFiles:[{path:read.path,readId:read.draftReadId}]})),{code:'BRIEF_DRAFT_READ_REQUIRED'});
 assert.equal(s.app.store.list('research-brief').length,0);
}finally{s.close();}});

test('project read without SDK ACK cannot freeze a new ready input',()=>{const s=setup();try{
 const who=actor(s);op(s,who,'workspace_read',{source:'project',path:'README.md'});
 assert.throws(()=>op(s,who,'research_brief_save',plan()),{code:'BRIEF_SOURCE_READ_REQUIRED'});
 assert.equal(s.app.store.list('research-brief').length,0);
}finally{s.close();}});

test('pending project selection survives repeated clarifying without acquiring historical acceptance',()=>{const s=setup();try{
 const who=actor(s);op(s,who,'workspace_read',{source:'project',path:'README.md'});
 const first=op(s,who,'research_brief_save',plan({status:'clarifying'}));
 assert.equal(first.sourceInputs.length,0);
 const second=op(s,who,'research_brief_save',plan({status:'clarifying',expectedRevisionId:first.id}));
 assert.equal(second.sourceInputs.length,0);
 assert.throws(()=>op(s,who,'research_brief_save',plan({expectedRevisionId:second.id})),{code:'BRIEF_SOURCE_READ_REQUIRED'});
}finally{s.close();}});

test('legacy unaccepted draft receipt cannot claim an accepted-brief exemption',()=>{const s=setup();try{
 const who=actor(s);draft(s);const read=op(s,who,'workspace_read',{path:'draft.md'}),row=s.app.store.get('workspace-draft-read',read.draftReadId);
 const legacy={...row};for(const k of ['bindingId','protocolVersion','actor','permission','cursor','end','complete','contentDigest','delivery','offered','replayed'])delete legacy[k];
 s.app.store.db.prepare("UPDATE records SET data=? WHERE kind='workspace-draft-read' AND id=?").run(JSON.stringify(legacy),row.id);
 assert.throws(()=>op(s,who,'research_brief_save',plan({draftFiles:[{path:read.path,readId:read.draftReadId}]})),{code:'BRIEF_DRAFT_READ_REQUIRED'});
}finally{s.close();}});

test('oversized old content is refused before readFileSync preimage allocation',()=>{const s=setup(),original=fs.readFileSync;try{
 const root=s.app.store.paths.physical(s.session.workspace),path=join(root,'large.txt'),bytes=Buffer.alloc(2*1024*1024+1,97);fs.writeFileSync(path,bytes);let wholeReads=0;
 fs.readFileSync=function(file,...args){if(String(file)===path)wholeReads++;return original.call(this,file,...args);};syncBuiltinESMExports();
 assert.throws(()=>writeText(root,'large.txt','small',digest(bytes),s.app.store),e=>['FILE_TOO_LARGE','ARTIFACT_TOO_LARGE'].includes(e.code));
 assert.equal(wholeReads,0);assert.equal(fs.statSync(path).size,bytes.length);
}finally{fs.readFileSync=original;syncBuiltinESMExports();s.close();}});

test('byte pages require one complete binding and preserve Unicode bytes across reopen',()=>{const s=setup();try{
 const who=actor(s),text='\ufeffabc😀\r\n中文',written=op(s,USER,'workspace_write',{path:'draft.md',content:text,expectedDigest:null});
 const input={path:'draft.md',readProtocol:'workspace-text-v1',limit:4},first=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',input));
 assert.equal(first.cursorUnit,'utf8-byte');assert.equal(first.totalBytes,Buffer.byteLength(text));assert.equal(first.digest,written.digest);assert.equal(first.writeVersion,1);
 const eof=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{...input,readBindingId:first.readBindingId,cursor:first.size}));
 assert.equal(eof.content,'');assert.equal(eof.complete,true);
 assert.throws(()=>op(s,who,'research_brief_save',plan({draftFiles:[{path:'draft.md',readId:eof.draftReadId}]})),{code:'BRIEF_DRAFT_READ_REQUIRED'});
 const separate=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{path:'draft.md'}));assert.notEqual(separate.draftReadId,first.readBindingId);assert.throws(()=>s.app.draftReads.validate(s.app.store.get('session',s.session.id),[{path:'draft.md',readId:first.draftReadId}]),{code:'BRIEF_DRAFT_READ_REQUIRED'});
 assert.throws(()=>op(s,who,'workspace_read',{...input,readBindingId:first.readBindingId,cursor:7}),{code:'INVALID_INPUT'});
 let end=first.end,content=first.content,last=first;while(end<first.size){last=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{...input,readBindingId:first.readBindingId,cursor:end}));content+=last.content;end=last.end;}assert.equal(content,text);
 const saved=op(s,who,'research_brief_save',plan({draftFiles:[{path:'draft.md',readId:last.draftReadId}]}));s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:saved.id,expectedVersion:saved.version});
 const old=s.app.store.get('research-brief',saved.id);s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.deepEqual(s.app.store.get('research-brief',saved.id),old);assert.ok(s.app.researchBriefs.capture(USER,s.project.id,s.session.id));
}finally{s.close();}});

test('new same-byte source selection retains its delivered binding while inherited fixed bytes outlive edits',()=>{const s=setup();try{
 const who=actor(s),first=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{source:'project',path:'README.md'})),saved=op(s,who,'research_brief_save',plan());
 const next=op(s,who,'workspace_read',{source:'project',path:'README.md'});assert.notEqual(next.sourceInputReadId,first.sourceInputReadId);
 assert.throws(()=>op(s,who,'research_brief_save',plan({expectedRevisionId:saved.id})),{code:'BRIEF_SOURCE_READ_REQUIRED'});acknowledgeWorkspaceRead(s.app,who,next);
 const updated=op(s,who,'research_brief_save',plan({expectedRevisionId:saved.id}));assert.equal(updated.sourceInputs[0].artifactId,saved.sourceInputs[0].artifactId);assert.equal(updated.sourceInputs[0].readId,next.sourceInputReadId);
 fs.writeFileSync(join(s.app.store.paths.physical(s.project.workspace),'README.md'),'later project edit');
 const inherited=op(s,who,'research_brief_save',plan({expectedRevisionId:updated.id}));assert.deepEqual(inherited.sourceInputs,updated.sourceInputs);
}finally{s.close();}});

test('replaying an undelivered read poisons late ACK without creating another receipt',()=>{const s=setup();try{
 const who=actor(s);draft(s);const first=op(s,who,'workspace_read',{path:'draft.md'},'cached');assert.equal(s.app.draftReads.offer(who,first.draftReadId,'cached'),true);
 assert.deepEqual(op(s,who,'workspace_read',{path:'draft.md'},'cached'),first);
 assert.throws(()=>s.app.draftReads.deliver(who,first.draftReadId,'cached'),{code:'WORKSPACE_DELIVERY_STALE'});assert.equal(s.app.store.list('workspace-draft-read').length,1);
 const fresh=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{path:'draft.md'}));assert.ok(op(s,who,'research_brief_save',plan({draftFiles:[{path:'draft.md',readId:fresh.draftReadId}]})));
}finally{s.close();}});

function legacyReceipt(app,kind,id){const row=app.store.get(kind,id),missing=Object.fromEntries(['bindingId','protocolVersion','actor','permission','cursor','end','complete','contentDigest','delivery','offered','replayed'].map(k=>[k,undefined]));app.store.update(kind,id,row.version,missing);}
test('original legacy accepted brief confirms and replays without granting a new ready exemption',()=>{const s=setup();try{
 const who=actor(s);draft(s);const read=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{path:'draft.md'})),source=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{source:'project',path:'README.md'})),input=plan({draftFiles:[{path:'draft.md',readId:read.draftReadId}]}),saved=op(s,who,'research_brief_save',input,'original-save'),data=s.app.store.db.prepare('SELECT data FROM records WHERE id=?').get(saved.id).data;
 legacyReceipt(s.app,'workspace-draft-read',read.draftReadId);legacyReceipt(s.app,'research-input-read',source.sourceInputReadId);s.app.store.db.prepare("DELETE FROM records WHERE kind='research-input-selection'").run();
 assert.deepEqual(op(s,who,'research_brief_save',input,'original-save'),saved);
 assert.throws(()=>op(s,who,'research_brief_save',{...input,expectedRevisionId:saved.id}),{code:'BRIEF_DRAFT_READ_REQUIRED'});
 s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:saved.id,expectedVersion:saved.version});assert.equal(s.app.researchBriefs.capture(USER,s.project.id,s.session.id).id,saved.id);
 const historicalPayload=raw=>{const value=JSON.parse(raw);for(const k of ['status','version','updatedAt'])delete value[k];return JSON.stringify(value);};assert.equal(historicalPayload(s.app.store.db.prepare('SELECT data FROM records WHERE id=?').get(saved.id).data),historicalPayload(data));assert.equal(s.app.store.get('research-brief',saved.id).digest,saved.digest);
 const fresh=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{path:'draft.md'})),next=op(s,who,'research_brief_save',{...input,expectedRevisionId:saved.id,draftFiles:[{path:'draft.md',readId:fresh.draftReadId}]});assert.deepEqual(next.sourceInputs,saved.sourceInputs);
 assert.equal(s.app.store.get('workspace-draft-read',read.draftReadId).delivery,undefined);assert.equal(s.app.store.get('research-input-read',source.sourceInputReadId).delivery,undefined);
 op(s,USER,'workspace_write',{path:'draft.md',content:'later repair',expectedDigest:read.digest});assert.doesNotThrow(()=>s.app.researchBriefs.assertReference(USER,s.project.id,s.session.id,{id:saved.id,digest:saved.digest,revision:saved.revision,rootSessionId:s.session.id}));
}finally{s.close();}});

test('unaccepted legacy source cannot freeze and a legacy pending approval becomes stale',()=>{const s=setup();try{
 const who=actor(s),source=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{source:'project',path:'README.md'}));legacyReceipt(s.app,'research-input-read',source.sourceInputReadId);s.app.store.db.prepare("DELETE FROM records WHERE kind='research-input-selection'").run();
 assert.throws(()=>op(s,who,'research_brief_save',plan()),{code:'BRIEF_SOURCE_READ_REQUIRED'});
 const freshSource=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{source:'project',path:'README.md'}));draft(s);const read=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{path:'draft.md'})),input=plan({draftFiles:[{path:'draft.md',readId:read.draftReadId}]});s.app.sessionPermissions.initialize(s.session.id,'confirm');
 assert.throws(()=>op(s,who,'research_brief_save',input),{code:'APPROVAL_REQUIRED'});const action=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);legacyReceipt(s.app,'workspace-draft-read',read.draftReadId);
 assert.throws(()=>s.app.sessionPermissions.decide(USER,s.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true}),{code:'APPROVAL_STALE'});assert.equal(s.app.store.list('research-brief').length,0);assert.ok(freshSource.sourceInputReadId);
}finally{s.close();}});

test('pending selection fingerprints change even when clarifying freezes neither source',()=>{const s=setup();try{
 const who=actor(s);op(s,who,'workspace_read',{source:'project',path:'README.md'});const before=s.app.researchBriefs.sourceInputFingerprint(s.session.id,null,'clarifying');
 op(s,who,'workspace_read',{source:'project',path:'README.md'});const after=s.app.researchBriefs.sourceInputFingerprint(s.session.id,null,'clarifying');assert.deepEqual(before.inputs,[]);assert.deepEqual(after.inputs,[]);assert.notDeepEqual(before,after);
 const read=op(s,who,'workspace_read',{source:'project',path:'README.md'}),row=s.app.store.get('research-input-read',read.sourceInputReadId);s.app.sourceInputs.offer(who,row.id,row.callId);const selected=s.app.store.list('research-input-selection')[0];
 const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{generation:2});assert.throws(()=>s.app.sourceInputs.deliver(who,row.id,row.callId),{code:'LEASE_EXPIRED'});assert.deepEqual(s.app.store.list('research-input-selection')[0],selected);
}finally{s.close();}});

test('ordinary delivered facts cannot be borrowed by notice actors; same-byte writes stale approval',()=>{const s=setup();try{
 const who=actor(s),written=draft(s),read=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{path:'draft.md'})),input=plan({draftFiles:[{path:'draft.md',readId:read.draftReadId}]});
 for(const field of ['approvalNoticeMessageId','workflowNoticeMessageId','workflowContinuationId','continuationId','wakeupId','attemptId','permissionActionId'])assert.throws(()=>s.app.researchBriefs.save({...who,[field]:'foreign'},s.project.id,s.session.id,input));
 assert.equal(op(s,USER,'workspace_read',{path:'draft.md'}).draftReadId,undefined);s.app.sessionPermissions.initialize(s.session.id,'confirm');assert.throws(()=>op(s,who,'research_brief_save',input),{code:'APPROVAL_REQUIRED'});const action=s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);
 op(s,USER,'workspace_write',{path:'draft.md',content:'abc😀\r\n',expectedDigest:written.digest});assert.throws(()=>s.app.sessionPermissions.decide(USER,s.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true}),{code:'APPROVAL_STALE'});
}finally{s.close();}});

test('workspace host ACK rechecks permission and project epoch; readOnly proof does not grant ready',()=>{for(const change of ['permission','epoch','generation']){const s=setup();try{
 const who=actor(s);draft(s);s.app.sessionPermissions.initialize(s.session.id,'readOnly');const read=op(s,who,'workspace_read',{path:'draft.md'},'host-read'),host=new AgentHost(s.app),active={actor:who,sessionId:who.sessionId,generation:who.generation,ended:false},permission=s.app.sessionPermissions.capture(s.session.id),epoch=s.app.store.get('project',s.project.id).lifecycleEpoch;
 const token=host.readResponse(active,who,'workspace_read','host-read',read,permission,epoch),resultDigest=digest(JSON.stringify({content:[{type:'text',text:JSON.stringify(read)}],details:{}}));assert.ok(token);
 if(change==='permission')s.app.sessionPermissions.set(USER,s.session.id,{mode:'confirm',expectedVersion:s.app.sessionPermissions.status(USER,s.session.id).version});
 if(change==='epoch'){const row=s.app.store.get('project',s.project.id),archived=s.app.store.update('project',row.id,row.version,{status:'archived'});const activeProject=s.app.store.update('project',row.id,archived.version,{status:'active'});assert.equal(activeProject.lifecycleEpoch,epoch+2);}
 if(change==='generation'){const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{generation:2});}
 assert.equal(host.completeReadDelivery(active,'workspace_read','host-read',{readDelivery:token,resultDigest}),false,change);assert.equal(s.app.store.get('workspace-draft-read',read.draftReadId).delivery,'pending');
}finally{s.close();}}
 const s=setup();try{const who=actor(s);draft(s);s.app.sessionPermissions.initialize(s.session.id,'readOnly');const read=acknowledgeWorkspaceRead(s.app,who,op(s,who,'workspace_read',{path:'draft.md'}));assert.throws(()=>op(s,who,'research_brief_save',plan({draftFiles:[{path:'draft.md',readId:read.draftReadId}]})),{code:'SESSION_READ_ONLY'});}finally{s.close();}
});

test('fixed workspace selection shadows new legacy reads without changing the C fingerprint representation',async()=>{const s=setup();try{
 const who=actor(s),fixed=await op(s,who,'workspace_text_prepare',{path:'README.md',purpose:'dataset-reference'}),page=op(s,who,'artifact_read',{artifactId:fixed.artifactId,sourceDigest:fixed.sourceDigest,textSourceId:fixed.textSourceId,readProtocol:'fixed-text-v1',limit:4},'fixed-page');
 s.app.store.transaction(()=>{assert.equal(s.app.artifactTexts.offer(who,s.project.id,page.artifactReadId,'fixed-page'),true);s.app.artifactTexts.deliver(who,s.project.id,page.artifactReadId,'fixed-page');});
 const before=s.app.researchBriefs.sourceInputFingerprint(s.session.id,null),read=op(s,who,'workspace_read',{source:'project',path:'README.md'});assert.ok(read.sourceInputReadId);assert.equal(s.app.store.get('research-input-read',read.sourceInputReadId).delivery,'pending');assert.equal(s.app.store.list('research-input-selection').length,0);assert.deepEqual(s.app.researchBriefs.sourceInputFingerprint(s.session.id,null),before);
 const saved=op(s,who,'research_brief_save',plan());assert.equal(saved.sourceInputs[0].readId,fixed.workspaceBindingId);
}finally{s.close();}});

test('managed read resolves the current workspace under its writer lock before binding bytes',()=>{const s=setup();try{
 const who=actor(s);draft(s);const workspace=join(s.dir,'replacement-workspace');fs.mkdirSync(workspace);const transaction=s.app.store.transaction.bind(s.app.store);let changed=false;
 s.app.store.transaction=fn=>{if(!changed){changed=true;const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{workspace:s.app.store.paths.reference(workspace)});op(s,USER,'workspace_write',{path:'draft.md',content:'new workspace bytes',expectedDigest:null});}return transaction(fn);};
 let read;try{read=op(s,who,'workspace_read',{path:'draft.md'});}finally{s.app.store.transaction=transaction;}
 assert.equal(read.content,'new workspace bytes');assert.ok(read.draftReadId);assert.equal(s.app.store.get('workspace-draft-read',read.draftReadId).workspace,s.app.store.get('session',s.session.id).workspace);
}finally{s.close();}});

test('late project ACK cannot reselect an old binding over a newer pending choice',()=>{const s=setup();try{
 const who=actor(s),a=op(s,who,'workspace_read',{source:'project',path:'README.md'},'old-source');assert.equal(s.app.sourceInputs.offer(who,a.sourceInputReadId,'old-source'),true);
 const b=op(s,who,'workspace_read',{source:'project',path:'README.md'},'new-source'),selected=s.app.store.list('research-input-selection')[0];s.app.sourceInputs.deliver(who,a.sourceInputReadId,'old-source');assert.deepEqual(s.app.store.list('research-input-selection')[0],selected);
 assert.throws(()=>op(s,who,'research_brief_save',plan()),{code:'BRIEF_SOURCE_READ_REQUIRED'});acknowledgeWorkspaceRead(s.app,who,b);const saved=op(s,who,'research_brief_save',plan());assert.equal(saved.sourceInputs[0].readId,b.sourceInputReadId);
}finally{s.close();}});
