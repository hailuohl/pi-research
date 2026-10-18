import {randomUUID} from 'node:crypto';
import {relative,resolve,sep} from 'node:path';
import type {Actor,Row,Session} from '../domain/types.js';
import {DomainError,ensure} from '../domain/errors.js';
import {object,text} from '../contracts/validation.js';
import {digest,type Store} from '../storage/store.js';
import {readText,safePath} from '../workspace/files.js';

interface WorkspaceDraft {sessionId:string;workspace:string;}
interface DraftWrite extends WorkspaceDraft {path:string;pathKey:string;digest:string;size:number;callId:string;writeVersion:number;}
interface DraftRead extends DraftWrite {writeId:string;}
export interface DraftFile extends WorkspaceDraft {path:string;digest:string;size:number;readId:string;writeVersion:number;}
export interface DraftFileInput {path:string;readId:string;}

/** Host receipts are deliberately separate from the model's workspace and cached tool responses. */
export class DraftReadService {
    constructor(private store:Store) {}
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
    recordRead(actor:Actor,s:Row<Session>,file:{path:string;digest:string;size:number;content:string},callId:string):{draftReadId:string}|{draftReadBlockedReason:'BRIEF_DRAFT_CHANGED'|'BRIEF_DRAFT_ENCODING_INVALID'}|undefined {
        if(actor.type!=='agent'||actor.sessionId!==s.id||actor.role!=='coordinator'||actor.taskId||s.role!=='coordinator'||s.taskId||s.teamId)return;
        const binding=this.workspace(s),pathKey=this.path(s,file.path),writeId=digest({...binding,pathKey}),write=this.store.maybe<DraftWrite>('workspace-draft-write',writeId);
        if(!write)return;
        const shown=Buffer.from(file.content);if(shown.length!==file.size||digest(shown)!==file.digest)return {draftReadBlockedReason:'BRIEF_DRAFT_ENCODING_INVALID'};
        if(write.digest!==file.digest||write.size!==file.size)return {draftReadBlockedReason:'BRIEF_DRAFT_CHANGED'};
        const id=randomUUID();this.store.create<DraftRead>('workspace-draft-read',s.projectId!,{...binding,path:file.path,digest:file.digest,size:file.size,pathKey,callId,writeId,writeVersion:write.writeVersion},id);return {draftReadId:id};
    }
    validate(s:Row<Session>,value:unknown):DraftFile[] {
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
            let actual:ReturnType<typeof readText>;try{actual=readText(this.store.paths.physical(s.workspace),write.path);}catch{throw new DomainError('BRIEF_DRAFT_CHANGED','草稿文件已删除或不可读取，请修复后重新保存并回读');}
            ensure(actual.digest===write.digest&&actual.size===write.size,'BRIEF_DRAFT_CHANGED','草稿内容已改变，请重新保存并回读');
            return {...binding,path:write.path,digest:write.digest,size:write.size,readId:read.id,writeVersion:write.writeVersion};
        }).sort((a,b)=>a.path.localeCompare(b.path));
    }
    assertCurrent(s:Row<Session>,files:DraftFile[]|undefined) {
        if(files===undefined)return;
        const current=this.validate(s,files.map(f=>({path:f.path,readId:f.readId})));
        ensure(digest(current)===digest(files),'BRIEF_DRAFT_CHANGED','固定研究计划草稿已改变，请重新保存 ready 修订');
    }
}
