import {randomUUID} from 'node:crypto';
import type {Actor,Message,Row,Session} from '../domain/types.js';
import type {ResearchApp} from '../research-app.js';
import {ensure} from '../domain/errors.js';
import {digest,type Store} from '../storage/store.js';
import {integer} from '../contracts/validation.js';
import {readText} from '../workspace/files.js';
import type {PermissionReference} from '../policy/session-permissions.js';
import {ordinaryWorkspaceReader} from './workspace-inputs.js';
import {assertResearchReference} from '../policy/research-automation.js';

export type WorkspaceReadKind='workspace-draft-read'|'research-input-read';
export interface WorkspaceReadProof {
 sessionId:string;workspace:string;path:string;digest:string;size:number;callId:string;
 bindingId?:string;protocolVersion?:1;actor?:Actor;permission?:PermissionReference;
 continuation?:{continuationId:string;digest:string;originMessageId:string};
 cursor?:number;end?:number;complete?:boolean;contentDigest?:string;
 delivery?:'pending'|'delivered';offered?:boolean;replayed?:boolean;
}
export interface WorkspaceTextInput {path:string;readProtocol?:'workspace-text-v1';readBindingId?:string;cursor?:number;limit?:number;}
export type WorkspaceText=ReturnType<typeof readText>&{readProtocol?:'workspace-text-v1';cursorUnit?:'utf8-byte';cursor?:number;end?:number;totalBytes?:number;complete?:boolean;};
export function workspaceText(root:string,input:WorkspaceTextInput):WorkspaceText {
 const file=readText(root,input.path);if(!input.readProtocol)return file;
 const bytes=Buffer.from(file.content);ensure(bytes.length===file.size&&digest(bytes)===file.digest,'BRIEF_SOURCE_ENCODING_INVALID','分页需要完整有效UTF-8文本');
 const cursor=integer(input.cursor??0,'cursor',0,bytes.length),limit=integer(input.limit??16000,'limit',4,16000);
 ensure(input.readBindingId||cursor===0,'INVALID_INPUT','首个工作区分页必须从0开始',400);
 ensure(cursor===bytes.length||(bytes[cursor]!&0xc0)!==0x80,'INVALID_INPUT','cursor必须位于UTF-8字符边界',400);
 let end=Math.min(bytes.length,cursor+limit);while(end<bytes.length&&(bytes[end]!&0xc0)===0x80)end--;
 return {...file,content:bytes.subarray(cursor,end).toString('utf8'),readProtocol:'workspace-text-v1',cursorUnit:'utf8-byte',cursor,end,totalBytes:file.size,complete:end===file.size};
}
/** This is only an eligibility shape; assertWorkspaceReader verifies the host's actual continuation proof. */
export function draftReaderCandidate(actor:Actor){return ordinaryWorkspaceReader(actor)||actor.type==='agent'&&actor.role==='coordinator'&&!!actor.continuationId&&!!actor.wakeupId&&!!actor.messageId&&!actor.taskId&&!actor.attemptId&&!actor.approvalResumeId&&!actor.approvalNoticeMessageId&&!actor.workflowContinuationId&&!actor.workflowNoticeMessageId&&!actor.permissionActionId;}
export function assertWorkspaceReader(app:ResearchApp,actor:Actor,session:Row<Session>,kind:WorkspaceReadKind='research-input-read'):WorkspaceReadProof['continuation'] {
 ensure((ordinaryWorkspaceReader(actor)||kind==='workspace-draft-read'&&draftReaderCandidate(actor))&&actor.sessionId===session.id&&actor.projectId===session.projectId&&session.role==='coordinator'&&!session.taskId&&!session.teamId,'TASK_SCOPE_DENIED','读取凭据需要当前根读取权限',403);
 app.operations.authorizeAgent(actor,'workspace_read');
 ensure(session.state==='running'&&session.generation===actor.generation&&session.leaseUntil>Date.now(),'LEASE_EXPIRED','读取凭据会话租约已失效',403);
 if(!ordinaryWorkspaceReader(actor)){
  const c=app.researchAutomation.assertActor(actor),m=app.store.get<Message>('message',actor.messageId!,session.projectId!);
  ensure(m.sessionId===session.id&&m.wakeupId===actor.wakeupId&&m.status==='running'&&m.generation===actor.generation&&digest(m.permission)===digest(c.permission)&&actor.researchModelDigest===app.researchAutomation.modelIdentity(session),'AUTOMATION_STALE','草稿读取必须绑定实际消费的原任务续接',403);
  app.sessionPermissions.assert(c.permission,false);return {continuationId:c.id,digest:c.digest,originMessageId:c.originMessageId};
 }
}
const identity=(actor:Actor)=>({type:actor.type,projectId:actor.projectId,sessionId:actor.sessionId,role:actor.role,generation:actor.generation,...(actor.continuationId?{continuationId:actor.continuationId,wakeupId:actor.wakeupId,messageId:actor.messageId,researchModelDigest:actor.researchModelDigest}:{})});
const source=(r:WorkspaceReadProof)=>({sessionId:r.sessionId,workspace:r.workspace,path:r.path,digest:r.digest,size:r.size,...(r.continuation?{continuation:r.continuation}:{})});
function historicalReader(store:Store,kind:WorkspaceReadKind,r:Row<WorkspaceReadProof>){
 if(!r.actor||r.actor.sessionId!==r.sessionId||r.actor.projectId!==r.projectId)return false;
 if(!r.continuation)return ordinaryWorkspaceReader(r.actor);
 if(kind!=='workspace-draft-read'||!draftReaderCandidate(r.actor)||r.actor.continuationId!==r.continuation.continuationId)return false;
 const c=assertResearchReference(store,r.projectId!,r.continuation);return c.rootSessionId===r.sessionId&&c.originMessageId===r.continuation.originMessageId&&r.actor.researchModelDigest===c.modelDigest&&!!r.permission&&digest(r.permission)===digest(c.permission);
}
export function assertWorkspaceReadActor(app:ResearchApp,actor:Actor,kind:WorkspaceReadKind,r:Row<WorkspaceReadProof>){
 const continuation=assertWorkspaceReader(app,actor,app.store.get<Session>('session',r.sessionId,actor.projectId),kind);
 ensure(digest(continuation??null)===digest(r.continuation??null),'WORKSPACE_READ_STALE','不能切换读取绑定的原任务权限');
}
export function readBinding<T extends WorkspaceReadProof>(store:Store,kind:WorkspaceReadKind,read:Row<T>):Row<T> {
 const binding=store.get<T>(kind,read.bindingId??read.id,read.projectId!);
 ensure(read.protocolVersion===1&&binding.protocolVersion===1&&binding.bindingId===binding.id&&digest(source(read))===digest(source(binding)),'WORKSPACE_READ_STALE','读取绑定不符');return binding;
}
export function recordWorkspaceRead<T extends WorkspaceReadProof>(app:ResearchApp,kind:WorkspaceReadKind,actor:Actor,session:Row<Session>,data:T,page:WorkspaceText,requestedBindingId?:string) {
 const continuation=assertWorkspaceReader(app,actor,session,kind),bound={...data,...(continuation?{continuation}:{})},id=randomUUID(),old=requestedBindingId?app.store.get<T>(kind,requestedBindingId,session.projectId!):undefined;
 if(old)ensure(old.protocolVersion===1&&old.bindingId===old.id&&digest(source(old))===digest(source(bound)),'WORKSPACE_READ_STALE','固定读取来源或原任务权限已变化');
 return app.store.create<T>(kind,session.projectId!,{...bound,bindingId:old?.id??id,protocolVersion:1,actor:identity(actor),permission:actor.permission??app.sessionPermissions.capture(session.id),cursor:page.cursor??0,end:page.end??page.size,complete:page.complete??true,contentDigest:digest(Buffer.from(page.content)),delivery:'pending'},id);
}
export function hasWorkspaceCoverage(store:Store,kind:WorkspaceReadKind,read:Row<WorkspaceReadProof>) {
 if(read.protocolVersion!==1||!read.bindingId)return false;
 const binding=readBinding(store,kind,read),reads=store.list<WorkspaceReadProof>(kind,read.projectId!).filter(r=>r.protocolVersion===1&&r.bindingId===binding.id&&r.delivery==='delivered'&&!r.replayed&&digest(source(r))===digest(source(binding))&&historicalReader(store,kind,r)).sort((a,b)=>a.cursor!-b.cursor!);
 if(binding.size===0)return reads.some(r=>r.cursor===0&&r.end===0&&r.complete&&r.contentDigest===digest(Buffer.alloc(0)));
 let end=0;for(const r of reads){if(r.cursor!>end)break;if(r.end!>r.cursor!)end=Math.max(end,r.end!);}return end===binding.size;
}
export function replayWorkspaceRead(store:Store,kind:WorkspaceReadKind,id:string,pid:string) {
 const r=store.get<WorkspaceReadProof>(kind,id,pid);if(r.delivery==='pending'&&!r.replayed)store.update<WorkspaceReadProof>(kind,id,r.version,{replayed:true});
}
export function offerWorkspaceRead(app:ResearchApp,actor:Actor,kind:WorkspaceReadKind,id:string,callId:string,check:(r:Row<WorkspaceReadProof>)=>void) {
 const r=app.store.get<WorkspaceReadProof>(kind,id,actor.projectId!);
 if(r.protocolVersion!==1||r.delivery!=='pending'||r.offered||r.replayed||r.callId!==callId||digest(r.actor)!==digest(identity(actor)))return false;
 assertWorkspaceReadActor(app,actor,kind,r);if(r.permission)app.sessionPermissions.assert(r.permission,false);check(r);
 app.store.update<WorkspaceReadProof>(kind,r.id,r.version,{offered:true});return true;
}
export function deliverWorkspaceRead(app:ResearchApp,actor:Actor,kind:WorkspaceReadKind,id:string,callId:string,check:(r:Row<WorkspaceReadProof>)=>void) {
 const r=app.store.get<WorkspaceReadProof>(kind,id,actor.projectId!);
 ensure(r.protocolVersion===1&&r.delivery==='pending'&&r.offered&&!r.replayed&&r.callId===callId&&digest(r.actor)===digest(identity(actor)),'WORKSPACE_DELIVERY_STALE','工作区读取交付状态已失效');
 assertWorkspaceReadActor(app,actor,kind,r);if(r.permission)app.sessionPermissions.assert(r.permission,false);check(r);
 app.store.update<WorkspaceReadProof>(kind,r.id,r.version,{delivery:'delivered'});
}
export function assertWorkspaceReadBytes(store:Store,r:Row<WorkspaceReadProof>) {
 const file=readText(store.paths.physical(r.workspace),r.path),bytes=Buffer.from(file.content);
 ensure(file.digest===r.digest&&file.size===r.size&&digest(bytes)===r.digest&&(!r.protocolVersion||digest(bytes.subarray(r.cursor!,r.end!))===r.contentDigest),'WORKSPACE_READ_STALE','读取来源或页内容已变化');
}
