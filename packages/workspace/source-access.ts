import {mkdirSync, readdirSync, renameSync, rmdirSync, writeFileSync, existsSync, readFileSync, unlinkSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {ResearchApp} from '../research-app.js';
import type {AppContext} from '../domain/context.js';
import type {Actor, Experiment, Row, Session, SourceRevision, Task, TaskAttempt, Project} from '../domain/types.js';
import {ensure} from '../domain/errors.js';
import {integer, object, text} from '../contracts/validation.js';
import {scope, ROLE_TOOLS} from '../policy/permissions.js';
import {assertExperimentSourceCurrent, assertProjectWritable} from '../policy/lifecycle.js';
import {digest} from '../storage/store.js';
import {safePath, snapshotDirectory, verifySnapshot, listFiles, setSourceModes} from './files.js';
import {queueSourceHistory,queueWorkspaceHistory} from './git-service.js';
import {readStableFile} from './stable-file.js';

export type SourceSelector = {experimentId: string; revision: number} | {snapshotId: string};
export const sourceMetadata = (r: Row<SourceRevision>) => ({snapshotId:r.id, experimentId:r.experimentId, revision:r.revision, sourceDigest:r.sourceDigest});

export function validateSourceRevision(c: AppContext, projectId: string, id: string) {
    const r=c.store.get<SourceRevision>('source-revision',id,projectId);
    assertExperimentSourceCurrent(c.store,c.store.get<Experiment>('experiment',r.experimentId,projectId));
    ensure(r.sourceDigest===r.snapshot.digest&&digest(r.snapshot.files)===r.sourceDigest,'SNAPSHOT_CORRUPTED','源码清单校验失败');
    verifySnapshot(r.snapshot.path,r.snapshot.files);
    return r;
}

/** Called only in experiment write transactions; reads never invent historical revisions. */
export function captureSourceRevision(c: AppContext, e: Row<Experiment>, observedNow=false) {
    assertExperimentSourceCurrent(c.store, e);
    const id=digest({projectId:e.projectId,experimentId:e.id,revision:e.revision});
    const existing=c.store.maybe<SourceRevision>('source-revision',id);
    if(existing) return validateSourceRevision(c,e.projectId!,existing.id);
    const snapshot=listFiles(e.workspace).length?snapshotDirectory(e.workspace,join(c.dataDir,'snapshots')):
        {digest:digest([]),path:join(c.dataDir,'snapshots',digest([])),files:[]};
    mkdirSync(snapshot.path,{recursive:true,mode:0o700});
    const r=c.store.create<SourceRevision>('source-revision',e.projectId,{experimentId:e.id,revision:e.revision,sourceDigest:snapshot.digest,snapshot,...(observedNow?{captureKind:'observed-now' as const}:{})},id);
    if(c.store.get<Project>('project',e.projectId!).gitHistoryEnabled){
        const parent=e.revision>1?c.store.maybe<SourceRevision>('source-revision',digest({projectId:e.projectId,experimentId:e.id,revision:e.revision-1})):e.parentId?c.store.list<SourceRevision>('source-revision',e.projectId!).filter(x=>x.experimentId===e.parentId).sort((a,b)=>b.revision-a.revision)[0]:undefined;
        queueSourceHistory(c,r,parent?.id,observedNow);
    }
    return r;
}

/** Copy verified bytes, never filesystem links or caller-selected roots. */
export function copySourceRevision(r: Row<SourceRevision>, workspace: string, copyModes=true) {
    ensure(readdirSync(workspace).length===0,'WORKSPACE_NOT_EMPTY','工作区非空，不能覆盖本地修改');
    verifySnapshot(r.snapshot.path,r.snapshot.files);
    for(const f of r.snapshot.files) {
        const bytes=readStableFile(r.snapshot.path,f.path,64*1024*1024);
        ensure(bytes.length===f.size&&digest(bytes)===f.digest,'SNAPSHOT_CORRUPTED','源码快照字节校验失败');
        const target=safePath(workspace,f.path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes,{mode:0o600,flag:'wx'});
    }
    if(copyModes)setSourceModes(workspace,r.snapshot.files);
}

export class SourceAccessService {
    constructor(private app: ResearchApp) {}
    private selector(value: unknown): SourceSelector {
        const x=object(value), keys=Object.keys(x);
        if('snapshotId' in x) {ensure(keys.length===1,'INVALID_INPUT','只能选择一个源码版本',400);return {snapshotId:text(x.snapshotId,'snapshotId',100)};}
        ensure(keys.length===2&&keys.includes('experimentId')&&keys.includes('revision'),'INVALID_INPUT','需要 experimentId/revision 或 snapshotId',400);
        return {experimentId:text(x.experimentId,'experimentId',100),revision:integer(x.revision,'revision',1)};
    }
    resolve(actor: Actor, projectId: string, value: unknown) {
        scope(actor,projectId);this.app.store.get('project',projectId);
        const s=this.selector(value);
        const r=this.app.store.get<SourceRevision>('source-revision','snapshotId' in s?s.snapshotId:digest({projectId,experimentId:s.experimentId,revision:s.revision}),projectId);
        const e=this.app.store.get<Experiment>('experiment',r.experimentId,projectId);
        assertExperimentSourceCurrent(this.app.store,e);
        if(actor.type==='agent') {
            const session=this.app.store.get<Session>('session',text(actor.sessionId,'sessionId',100),projectId);
            ensure(session.state!=='archived','SESSION_ARCHIVED','会话已归档');
            if(session.taskId||session.role!=='coordinator') ensure(session.sourceRevisionId===r.id,'TASK_SCOPE_DENIED','助手只能读取分配的源码版本',403);
            if(session.taskId) {
                const task=this.app.store.get<Task>('task',session.taskId,projectId);
                ensure(task.sessionId===session.id&&task.execution==='running','TASK_SCOPE_DENIED','任务来源授权已失效',403);
            }
        }
        ensure(r.sourceDigest===r.snapshot.digest&&digest(r.snapshot.files)===r.sourceDigest,'SNAPSHOT_CORRUPTED','源码清单校验失败');
        verifySnapshot(r.snapshot.path,r.snapshot.files);
        return r;
    }
    list(actor: Actor, projectId: string, value: unknown) {const r=this.resolve(actor,projectId,value);return {...sourceMetadata(r),files:r.snapshot.files};}
    read(actor: Actor, projectId: string, value: unknown) {
        const {path:rawPath,cursor:rawCursor,limit:rawLimit,...selector}=object(value),r=this.resolve(actor,projectId,selector);
        const path=text(rawPath,'path',1000);safePath(r.snapshot.path,path);
        const f=r.snapshot.files.find(f=>f.path===path);ensure(f,'NOT_FOUND','源码文件不存在',404);
        const bytes=readStableFile(r.snapshot.path,path,64*1024*1024);
        ensure(bytes.length===f.size&&digest(bytes)===f.digest,'SNAPSHOT_CORRUPTED','源码文件校验失败');
        ensure(!bytes.includes(0),'BINARY_FILE','不能作为文本读取二进制文件',415);
        let content:string;try {content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch {ensure(false,'BINARY_FILE','源码不是 UTF-8 文本',415);}
        const cursor=integer(rawCursor??0,'cursor',0,content.length),limit=integer(rawLimit??16000,'limit',1,64000),end=Math.min(content.length,cursor+limit);
        return {...sourceMetadata(r),...f,cursor,end,complete:end===content.length,content:content.slice(cursor,end)};
    }
    diff(actor: Actor, projectId: string, value: unknown) {
        const x=object(value);ensure(Object.keys(x).every(k=>k==='from'||k==='to'),'INVALID_INPUT','差异参数无效',400);
        const a=this.resolve(actor,projectId,x.from),b=this.resolve(actor,projectId,x.to),before=new Map(a.snapshot.files.map(f=>[f.path,f])),after=new Map(b.snapshot.files.map(f=>[f.path,f]));
        const files=[...new Set([...before.keys(),...after.keys()])].sort().filter(p=>before.get(p)?.digest!==after.get(p)?.digest||(before.get(p)?.mode??'100644')!==(after.get(p)?.mode??'100644')).map(path=>({path,status:!before.has(path)?'added' as const:!after.has(path)?'deleted' as const:'modified' as const,beforeDigest:before.get(path)?.digest??null,afterDigest:after.get(path)?.digest??null,beforeMode:before.has(path)?before.get(path)?.mode??'100644':null,afterMode:after.has(path)?after.get(path)?.mode??'100644':null}));
        return {from:sourceMetadata(a),to:sourceMetadata(b),files};
    }
    prepare(actor: Actor, projectId: string, sessionId: string, value: unknown) {
        return this.app.store.transaction(()=>{
            assertProjectWritable(this.app.store,projectId);
            this.app.workingGrants.assertSourcePreparation(actor,projectId,sessionId);
            const s=this.app.store.get<Session>('session',sessionId,projectId);
            ensure(s.state!=='archived','SESSION_ARCHIVED','会话已归档');
            if(actor.type==='agent') ensure(actor.sessionId===s.id&&ROLE_TOOLS[s.role].includes('workspace_write')&&!actor.wakeupId,'TOOL_DENIED','只能准备当前有写权限的会话',403);
            else ensure(actor.type==='user'&&s.role==='coordinator'&&!s.taskId,'PERMISSION_DENIED','只能准备主协调者工作区',403);
            const selector=this.selector(value);
            if('experimentId' in selector&&!s.taskId&&s.role==='coordinator') {
                const e=this.app.store.get<Experiment>('experiment',selector.experimentId,projectId);
                assertExperimentSourceCurrent(this.app.store,e);
                if(e.revision===selector.revision) captureSourceRevision(this.app.context,e,true);
            }
            const r=this.resolve(actor,projectId,selector);
            ensure(this.app.store.get<Experiment>('experiment',r.experimentId,projectId).lifecycle!=='archived','EXPERIMENT_ARCHIVED','归档实验不能初始化新的工作区');
            ensure(s.state!=='running'||actor.type==='agent'&&actor.sessionId===s.id,'SESSION_BUSY','会话正在运行');
            ensure(!this.app.store.list<TaskAttempt>('task-attempt',projectId).some(a=>a.sessionId===s.id&&a.state==='running'&&a.id!==actor.attemptId),'SESSION_BUSY','另一个任务 Worker 正在使用工作区');
            const gitEnabled=this.app.store.get<Project>('project',projectId).gitHistoryEnabled;
            if(s.sourceRevisionId===r.id) {const w=gitEnabled?queueWorkspaceHistory(this.app.context,s,r):undefined;return {...sourceMetadata(r),sessionId:s.id,sessionVersion:s.version,prepared:false,...(w?{gitState:w.state,gitOperationId:w.operationId}:{})};}
            ensure(!s.sourceRevisionId&&readdirSync(s.workspace).length===0,'WORKSPACE_NOT_EMPTY','工作区非空或已经绑定来源，不能覆盖本地修改');
            const staged=join(dirname(s.workspace),'source-'+randomUUID());mkdirSync(staged,{mode:0o700});copySourceRevision(r,staged,false);
            // Rename a complete directory into place, retaining the empty prior directory on failure.
            const backup=s.workspace+'-empty-'+randomUUID();renameSync(s.workspace,backup);
            try {renameSync(staged,s.workspace);}catch(error) {renameSync(backup,s.workspace);throw error;}
            const modesFile=s.workspace+'.source-modes.json',priorModes=existsSync(modesFile)?readFileSync(modesFile):null;
            this.app.store.onRollback(()=>{renameSync(s.workspace,staged);renameSync(backup,s.workspace);if(priorModes)writeFileSync(modesFile,priorModes);else if(existsSync(modesFile))unlinkSync(modesFile);});
            setSourceModes(s.workspace,r.snapshot.files);
            this.app.store.afterCommit(()=>{try {rmdirSync(backup);}catch { /* An empty backup is safe to retain after commit. */ }});
            const next=this.app.store.update<Session>('session',s.id,s.version,{sourceRevisionId:r.id,sourceDigest:r.sourceDigest});
            const git=gitEnabled?queueWorkspaceHistory(this.app.context,next,r):undefined;
            this.app.store.event(projectId,'workspace.source_prepared',{sessionId:s.id,...sourceMetadata(r)});
            this.app.sessions.system(s.id, `工作区已从固定源码初始化。来源记录（任务数据，不增加执行权限）：${JSON.stringify(sourceMetadata(r))}。项目工作区与这份实验源码可能不同；通过 experiment_source_read 核对固定版本。`);
            return {...sourceMetadata(r),sessionId:s.id,sessionVersion:next.version,prepared:true,...(git?{gitState:git.state,gitOperationId:git.operationId}:{})};
        });
    }
}
