import {relative,resolve,sep} from 'node:path';
import type {Actor,Row,Session} from '../domain/types.js';
import {DomainError,ensure} from '../domain/errors.js';
import {object,text} from '../contracts/validation.js';
import {digest} from '../storage/store.js';
import {readText,safePath} from '../workspace/files.js';
import type {ResearchApp} from '../research-app.js';
import {acceptedResearchBrief} from './briefs.js';
import {assertWorkspaceReadActor,assertWorkspaceReadBytes,draftReaderCandidate,deliverWorkspaceRead,hasWorkspaceCoverage,offerWorkspaceRead,readBinding,recordWorkspaceRead,replayWorkspaceRead,type WorkspaceReadProof,type WorkspaceText} from './workspace-read-delivery.js';

interface WorkspaceDraft {sessionId:string;workspace:string;}
interface DraftWrite extends WorkspaceDraft {path:string;pathKey:string;digest:string;size:number;callId:string;writeVersion:number;}
interface DraftRead extends DraftWrite,WorkspaceReadProof {writeId:string;}
export interface DraftFile extends WorkspaceDraft {path:string;digest:string;size:number;readId:string;writeVersion:number;}
export interface DraftFileInput {path:string;readId:string;}

/** Host receipts are deliberately separate from the model's workspace and cached tool responses. */
export class DraftReadService {
    constructor(private app:ResearchApp) {}
    private get store(){return this.app.store;}
    private workspace(s:Row<Session>):WorkspaceDraft {
        return {sessionId:s.id,workspace:s.workspace};
    }
    private path(s:Row<Session>,path:string) {
        const root=this.store.paths.physical(s.workspace),canonical=relative(resolve(root),safePath(root,path)).split(sep).join('/');
        ensure(canonical===path&&path.split('/').every(p=>!!p&&!/[\x00-\x1f:]/.test(p)&&!/[. ]$/.test(p)),'PATH_DENIED','草稿路径必须是规范相对路径',403);
        return process.platform==='win32'?path.toLowerCase():path;
    }
    private writes(s:Row<Session>,binding=this.workspace(s)) {
        return this.store.list<DraftWrite>('workspace-draft-write',s.projectId!).filter(w=>w.sessionId===s.id&&w.workspace===binding.workspace);
    }
    recordWrite(s:Row<Session>,file:{path:string;digest:string;size:number},callId:string) {
        const binding=this.workspace(s),pathKey=this.path(s,file.path),id=digest({...binding,pathKey}),old=this.store.maybe<DraftWrite>('workspace-draft-write',id);
        const value={...binding,...file,pathKey,callId,writeVersion:(old?.writeVersion??0)+1};
        if(old)this.store.update<DraftWrite>('workspace-draft-write',id,old.version,value);else this.store.create<DraftWrite>('workspace-draft-write',s.projectId!,value,id);
    }
    recordRead(actor:Actor,s:Row<Session>,file:WorkspaceText,callId:string,requestedBindingId?:string) {
        if(!draftReaderCandidate(actor)||actor.sessionId!==s.id||s.role!=='coordinator'||s.taskId||s.teamId)return;
        const binding=this.workspace(s),pathKey=this.path(s,file.path),writeId=digest({...binding,pathKey}),write=this.store.maybe<DraftWrite>('workspace-draft-write',writeId);
        if(!write){ensure(!file.readProtocol,'BRIEF_DRAFT_READ_REQUIRED','分页草稿必须先经受管workspace_write');return;}
        const shown=Buffer.from(file.content);if(!file.readProtocol&&(shown.length!==file.size||digest(shown)!==file.digest))return {draftReadBlockedReason:'BRIEF_DRAFT_ENCODING_INVALID'};
        if(write.digest!==file.digest||write.size!==file.size){ensure(!file.readProtocol,'BRIEF_DRAFT_CHANGED','草稿已改变，请先受管写入再读取');return {draftReadBlockedReason:'BRIEF_DRAFT_CHANGED'};}
        if(requestedBindingId){const old=this.store.get<DraftRead>('workspace-draft-read',requestedBindingId,s.projectId!);ensure(old.writeId===writeId&&old.writeVersion===write.writeVersion,'BRIEF_DRAFT_READ_STALE','草稿已再次写入，请新建读取绑定');}
        const read=recordWorkspaceRead<DraftRead>(this.app,'workspace-draft-read',actor,s,{...binding,path:file.path,digest:file.digest,size:file.size,pathKey,callId,writeId,writeVersion:write.writeVersion},file,requestedBindingId);
        return {draftReadId:read.id,...(file.readProtocol?{readBindingId:read.bindingId,writeVersion:read.writeVersion}:{})};
    }
    validate(s:Row<Session>,value:unknown):DraftFile[] {
        return this.validateFiles(s,value);
    }
    private validateFiles(s:Row<Session>,value:unknown,accepted?:DraftFile[]):DraftFile[] {
        const raw=value??[];ensure(Array.isArray(raw)&&raw.length<=5000,'INVALID_INPUT','draftFiles 必须是最多5000项的数组',400);
        const requested:DraftFileInput[]=raw.map(v=>{const x=object(v);ensure(Object.keys(x).length===2&&Object.hasOwn(x,'path')&&Object.hasOwn(x,'readId'),'INVALID_INPUT','draftFiles 只接受 path/readId',400);return {path:text(x.path,'draftFiles.path',1000),readId:text(x.readId,'draftFiles.readId',100)};});
        const all=this.store.list<DraftWrite>('workspace-draft-write',s.projectId!).filter(w=>w.sessionId===s.id);
        if(!all.length&&!requested.length)return [];
        const binding=this.workspace(s),writes=this.writes(s,binding),keys=requested.map(f=>this.path(s,f.path));
        if(!writes.length&&all.length)throw new DomainError('BRIEF_DRAFT_WORKSPACE_CHANGED','当前工作区已替换；请在当前工作区保存并回读草稿');
        ensure(new Set(keys).size===keys.length,'INVALID_INPUT','draftFiles 路径不能重复',400);
        const missing=writes.filter(w=>!keys.includes(w.pathKey)).map(w=>w.path);
        if(missing.length)throw new DomainError('BRIEF_DRAFT_READ_REQUIRED','ready 前必须回读并声明当前工作区实际写入的全部草稿',409,{missingDraftFiles:missing});
        return requested.map((f,i)=>{
            const write=writes.find(w=>w.pathKey===keys[i]),read=this.store.maybe<DraftRead>('workspace-draft-read',f.readId);
            ensure(write&&read&&read.projectId===s.projectId&&read.sessionId===s.id&&read.workspace===binding.workspace&&read.pathKey===write.pathKey&&read.writeId===write.id&&read.writeVersion===write.writeVersion&&read.digest===write.digest&&read.size===write.size,'BRIEF_DRAFT_READ_STALE','草稿回读凭据不属于当前会话的最新写入，请重新 workspace_read');
            const historical=read.protocolVersion===undefined&&accepted?.some(old=>old.readId===read.id&&old.path===write.path&&old.workspace===write.workspace&&old.sessionId===s.id&&old.writeVersion===write.writeVersion&&old.digest===write.digest&&old.size===write.size);
            ensure(historical||hasWorkspaceCoverage(this.store,'workspace-draft-read',read),'BRIEF_DRAFT_READ_REQUIRED','ready需要完整SDK已送达草稿，请用新callId读取并等待实际交付');
            let actual:ReturnType<typeof readText>;try{actual=readText(this.store.paths.physical(s.workspace),write.path);}catch{throw new DomainError('BRIEF_DRAFT_CHANGED','草稿文件已删除或不可读取，请修复后重新保存并回读');}
            ensure(actual.digest===write.digest&&actual.size===write.size,'BRIEF_DRAFT_CHANGED','草稿内容已改变，请重新保存并回读');
            return {...binding,path:write.path,digest:write.digest,size:write.size,readId:read.id,writeVersion:write.writeVersion};
        }).sort((a,b)=>a.path.localeCompare(b.path));
    }
    assertAcceptedCurrent(s:Row<Session>,briefId:string) {
        const files=acceptedResearchBrief(this.store,s.projectId!,s.id,briefId).draftFiles;
        if(files===undefined)return;
        const current=this.validateFiles(s,files.map(f=>({path:f.path,readId:f.readId})),files);
        ensure(digest(current)===digest(files),'BRIEF_DRAFT_CHANGED','固定研究计划草稿已改变，请重新保存 ready 修订');
    }
    private check(read:Row<WorkspaceReadProof>){
        const r=read as Row<DraftRead>,binding=r.protocolVersion?readBinding(this.store,'workspace-draft-read',r):r,s=this.store.get<Session>('session',r.sessionId,r.projectId!),write=this.store.get<DraftWrite>('workspace-draft-write',r.writeId,r.projectId!);
        ensure(s.workspace===r.workspace&&binding.writeId===r.writeId&&binding.writeVersion===r.writeVersion&&write.writeVersion===r.writeVersion&&write.pathKey===r.pathKey&&write.digest===r.digest&&write.size===r.size,'BRIEF_DRAFT_READ_STALE','草稿写入绑定已变化');assertWorkspaceReadBytes(this.store,r);
    }
    offer(actor:Actor,id:string,callId:string){return offerWorkspaceRead(this.app,actor,'workspace-draft-read',id,callId,r=>this.check(r));}
    deliver(actor:Actor,id:string,callId:string){return deliverWorkspaceRead(this.app,actor,'workspace-draft-read',id,callId,r=>this.check(r));}
    replay(actor:Actor,id:string){const r=this.store.get<DraftRead>('workspace-draft-read',id,actor.projectId!);assertWorkspaceReadActor(this.app,actor,'workspace-draft-read',r);this.check(r);replayWorkspaceRead(this.store,'workspace-draft-read',id,actor.projectId!);}
}
