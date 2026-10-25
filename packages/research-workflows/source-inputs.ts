import {assertAttachmentInput,attachmentInputs,attachmentSelectionFingerprint} from './attachment-inputs.js';
import {randomUUID} from 'node:crypto';
import {dirname,basename,relative,resolve,sep} from 'node:path';
import type {Actor,Artifact,Project,Row,Session} from '../domain/types.js';
import type {ResearchApp} from '../research-app.js';
import {DomainError,ensure} from '../domain/errors.js';
import {digest,type Store} from '../storage/store.js';
import {safePath} from '../workspace/files.js';
import {readStableFile} from '../workspace/stable-file.js';

export interface ResearchSourceInput {path:string;workspace:string;artifactId:string;digest:string;size:number;readId:string;readProtocol?:'fixed-text-v1';purpose?:'whole-text'|'dataset-reference';documentVersionId?:string;}
interface InputRead {sessionId:string;workspace:string;anchorBriefId:string|null;path:string;digest:string;size:number;callId:string;blockedReason?:'BRIEF_SOURCE_PATH_INVALID'|'BRIEF_SOURCE_ENCODING_INVALID';}
type PendingInput=Omit<ResearchSourceInput,'artifactId'>&{artifactId?:string;bytes?:Buffer};
const MAX_INPUTS=32,MAX_BYTES=8*1024*1024,MAX_FILE=2*1024*1024;
const pathKey=(workspace:string,path:string)=>digest({workspace,path:process.platform==='win32'?path.toLowerCase():path});

export function assertSourceInputs(store:Store,pid:string,sessionId:string,inputs:ResearchSourceInput[]|undefined) {
    if(inputs===undefined)return;
    ensure(Array.isArray(inputs)&&inputs.length<=MAX_INPUTS&&new Set(inputs.map(i=>pathKey(i.workspace,i.path))).size===inputs.length,'BRIEF_SOURCE_CORRUPTED','固定研究输入清单无效');
    let total=0;
    for(const input of inputs) {
        if(input.readProtocol==='fixed-text-v1'){assertAttachmentInput(store,pid,sessionId,input);continue;}
        ensure(input.purpose===undefined&&input.documentVersionId===undefined,'BRIEF_SOURCE_CORRUPTED','旧研究输入不能改写读取模式');
        const read=store.get<InputRead>('research-input-read',input.readId,pid),artifact=store.get<Artifact>('artifact',input.artifactId,pid);
        ensure(!read.blockedReason&&read.sessionId===sessionId&&read.workspace===input.workspace&&read.path===input.path&&read.digest===input.digest&&read.size===input.size&&artifact.origin===`research-input:${sessionId}`&&artifact.digest===input.digest&&artifact.size===input.size,'BRIEF_SOURCE_CORRUPTED',`固定研究输入来源不符：${input.path}`);
        const physical=store.paths.physical(artifact.path),bytes=readStableFile(dirname(physical),basename(physical),MAX_FILE);total+=bytes.length;
        ensure(total<=MAX_BYTES&&bytes.length===input.size&&digest(bytes)===input.digest,'BRIEF_SOURCE_CORRUPTED',`固定研究输入字节已改变：${input.path}`);
    }
}

export class SourceInputService {
    constructor(private app:ResearchApp) {}
    recordRead(actor:Actor,selectedSession:Row<Session>|undefined,file:{path:string;content:string;digest:string;size:number},callId:string) {
        if(actor.type!=='agent'||!selectedSession||actor.sessionId!==selectedSession.id||actor.role!=='coordinator'||actor.taskId||actor.attemptId||actor.wakeupId||actor.continuationId||actor.approvalResumeId)return;
        // The registry's pre-lock snapshot selects the session, never the read's current anchor.
        const session=this.app.store.get<Session>('session',selectedSession.id,actor.projectId);
        ensure(session.projectId===actor.projectId&&session.role==='coordinator'&&!session.taskId&&!session.teamId,'TASK_SCOPE_DENIED','研究输入读取必须属于当前主协调会话',403);
        ensure(session.state==='running'&&session.generation===actor.generation&&session.leaseUntil>Date.now(),'LEASE_EXPIRED','研究输入读取的主会话租约已失效',403);
        const project=this.app.store.get<Project>('project',session.projectId!),root=this.app.store.paths.physical(project.workspace);
        const path=relative(resolve(root),safePath(root,file.path)).split(sep).join('/'),bytes=Buffer.from(file.content);
        const blockedReason=path!==file.path||!path.split('/').every(p=>!!p&&!/[\x00-\x1f:]/.test(p)&&!/[. ]$/.test(p))?'BRIEF_SOURCE_PATH_INVALID':bytes.length!==file.size||digest(bytes)!==file.digest?'BRIEF_SOURCE_ENCODING_INVALID':undefined;
        this.app.store.create<InputRead>('research-input-read',session.projectId!,{sessionId:session.id,workspace:project.workspace,anchorBriefId:session.researchBriefId??null,path,digest:file.digest,size:file.size,callId,...(blockedReason?{blockedReason}:{})},randomUUID());
        return blockedReason?{sourceInputReadBlockedReason:blockedReason}:undefined;
    }
    private collect(session:Row<Session>,anchorBriefId:string|null,inherited:ResearchSourceInput[],status:'clarifying'|'ready'='ready'):PendingInput[] {
        assertSourceInputs(this.app.store,session.projectId!,session.id,inherited);
        const inputs=new Map(inherited.map(i=>[pathKey(i.workspace,i.path),{...i} as PendingInput]));
        const reads=new Map<string,Row<InputRead>>();
        for(const read of this.app.store.list<InputRead>('research-input-read',session.projectId!))if(read.sessionId===session.id&&read.anchorBriefId===anchorBriefId)reads.set(pathKey(read.workspace,read.path),read);
        const project=this.app.store.get<Project>('project',session.projectId!);
        for(const [key,read]of reads) {
            ensure(!read.blockedReason,'BRIEF_SOURCE_READ_REQUIRED',`研究输入尚未获得完整读取记录，请修复并用规范path、新callId重新workspace_read(source=project)：${read.path} (${read.blockedReason})`);
            ensure(project.workspace===read.workspace,'BRIEF_SOURCE_CHANGED',`项目输入工作区已变化，请重新workspace_read(source=project)：${read.path}`);
            let bytes:Buffer;try{bytes=readStableFile(this.app.store.paths.physical(read.workspace),read.path,MAX_FILE);}catch{throw new DomainError('BRIEF_SOURCE_CHANGED',`研究输入不可读取，请修复后重新workspace_read(source=project)：${read.path}`);}
            ensure(bytes.length===read.size&&digest(bytes)===read.digest,'BRIEF_SOURCE_CHANGED',`研究输入已变化，请用新callId重新workspace_read(source=project)：${read.path}`);
            try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new DomainError('BRIEF_SOURCE_ENCODING_INVALID',`研究输入不是UTF-8文本：${read.path}`);}
            const old=inputs.get(key);ensure(!old?.readProtocol,'BRIEF_SOURCE_BINDING_CHANGED','旧workspace读取不能覆盖固定附件输入');if(old&&old.digest===read.digest&&old.size===read.size)continue;
            inputs.set(key,{path:read.path,workspace:read.workspace,digest:read.digest,size:read.size,readId:read.id,bytes});
        }
        for(const input of attachmentInputs(this.app.store,session,inherited.filter(i=>i.readProtocol==='fixed-text-v1').map(i=>i.readId),status)){const key=pathKey(input.workspace,input.path),old=inputs.get(key);ensure(!old||old.readProtocol==='fixed-text-v1'&&old.documentVersionId===input.documentVersionId,'BRIEF_SOURCE_BINDING_CHANGED','固定附件不能覆盖旧workspace输入');inputs.set(key,input);}
        const result=[...inputs.values()].sort((a,b)=>pathKey(a.workspace,a.path).localeCompare(pathKey(b.workspace,b.path)));
        ensure(result.length<=MAX_INPUTS&&result.reduce((n,i)=>n+(i.readProtocol?0:i.size),0)<=MAX_BYTES,'BRIEF_SOURCE_LIMIT','固定研究输入最多32份、每份2MiB、合计8MiB');return result;
    }
    selectionFingerprint(session:Row<Session>){return attachmentSelectionFingerprint(this.app.store,session);}
    preview(session:Row<Session>,anchorBriefId:string|null,inherited:ResearchSourceInput[],status:'clarifying'|'ready'='ready') {return this.collect(session,anchorBriefId,inherited,status).map(({bytes,...meta})=>meta);}
    previewBytes(session:Row<Session>,anchorBriefId:string|null,inherited:ResearchSourceInput[],bytePaths:string[]) {return this.collect(session,anchorBriefId,inherited).map(input=>{
        if(!bytePaths.includes(input.path))return {...input,bytes:undefined,verifiedReference:true as const};
        if(input.bytes)return {...input,bytes:input.bytes};
        const a=this.app.store.get<Artifact>('artifact',input.artifactId!,session.projectId!),physical=this.app.store.paths.physical(a.path);return {...input,bytes:readStableFile(dirname(physical),basename(physical),MAX_FILE)};
    });}
    freeze(session:Row<Session>,anchorBriefId:string|null,inherited:ResearchSourceInput[],status:'clarifying'|'ready'='ready'):ResearchSourceInput[] {
        return this.collect(session,anchorBriefId,inherited,status).map(({bytes,...meta})=>{
            if(meta.artifactId)return meta as ResearchSourceInput;
            const prepared=this.app.evidence.prepareArtifact(session.projectId!,meta.path.slice(0,200),bytes!,'text/plain',`research-input:${session.id}`),artifact=this.app.evidence.publishPrepared(session.projectId!,prepared);
            return {...meta,artifactId:artifact.id};
        });
    }
}
