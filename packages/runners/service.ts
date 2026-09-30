import {SshTargetService} from './ssh-targets.js';
import { assertExperimentSourceCurrent, assertProjectWritable } from '../policy/lifecycle.js';
import {answerDisposition,assertOutcomeBoundary} from './outcome.js';
import {object,text,integer,oneOf} from '../contracts/validation.js';
import {collectRunArtifacts} from './artifacts.js';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync, writeFileSync, openSync, closeSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import type { AppContext } from '../domain/context.js';
import type { Actor, Experiment, RunIntent, Run, Manifest, Row, SourceRevision } from '../domain/types.js';
import type {GitSourceBinding} from '../workspace/git-types.js';
import type {RunExecution,DockerRunResult} from './adapter.js';
import { ensure, asError } from '../domain/errors.js';
import { scope, userOnly, toolAllowed } from '../policy/permissions.js';
import { ApprovalService } from '../policy/approvals.js';
import { EvidenceService } from '../evidence/service.js';
import { digest, now } from '../storage/store.js';
import { snapshotDirectory, verifySnapshot, listFiles, safePath } from '../workspace/files.js';
import { verifyTrustedExample, validateContract } from './contracts.js';
import { finiteMetrics } from '../contracts/validation.js';
import {readStableFile} from '../workspace/stable-file.js';
import {readLogPage} from '../execution/log-page.js';
import {ComputeQueue} from '../scheduler/compute-queue.js';
import {assertRunGrantActor,assertRunGrantIntent,assertRunGrantRun,consumeRunGrant} from '../policy/run-grant-validation.js';
export const TERMINAL = ['succeeded', 'failed', 'cancelled'];
export class RunService {
    researchSourceGuard?: (experimentId:string,stage:'prepare'|'submit'|'execute',intentId?:string)=>void;
    private launching = new Set<string>();
    constructor(private c: AppContext, private approvals: ApprovalService, private evidence: EvidenceService, private compute = new ComputeQueue(c)) { }
    get(actor: Actor, id: string) { const run = this.c.store.get<Run>('run', id); scope(actor, run.projectId!); return run; }
    list(actor: Actor, projectId: string, cursor = 0, limit = 20) {
        userOnly(actor); scope(actor, projectId);
        integer(cursor, 'cursor', 0, Number.MAX_SAFE_INTEGER); integer(limit, 'limit', 1, 100);
        return this.c.store.readSnapshot(() => {
            const rows = this.c.store.db.prepare('SELECT rowid, data FROM records WHERE kind=? AND project_id=? AND rowid>? ORDER BY rowid LIMIT ?').all('run', projectId, cursor, limit + 1);
            const page = rows.slice(0, limit);
            const nextCursor = page.length ? Number(page.at(-1)!.rowid) : cursor;
            ensure(Number.isSafeInteger(nextCursor), 'RUN_CURSOR_UNSAFE', '运行游标超出安全范围', 500);
            return {
                items: page.map(row => {
                    const run = JSON.parse(String(row.data)) as Row<Run>;
                    return {
                        id: run.id, projectId: run.projectId!, experimentId: run.experimentId, intentId: run.intentId,
                        state: run.state, integrity: run.integrity, judgment: run.judgment, manifestDigest: run.manifestDigest,
                        createdAt: run.createdAt, updatedAt: run.updatedAt,
                        ...(run.startedAt === undefined ? {} : {startedAt: run.startedAt}),
                        ...(run.endedAt === undefined ? {} : {endedAt: run.endedAt}),
                        ...(run.metrics === undefined ? {} : {metrics: run.metrics})
                    };
                }),
                cursor: nextCursor,
                hasMore: rows.length > limit
            };
        });
    }
    prepare(actor: Actor, experimentId: string) {
        if (actor.type !== 'user')
            toolAllowed(actor, 'run_prepare');
        return this.c.store.transaction(() => {
            const e=this.c.store.get<Experiment>('experiment',experimentId);scope(actor,e.projectId!);assertProjectWritable(this.c.store,e.projectId!);assertExperimentSourceCurrent(this.c.store,e);ensure(e.lifecycle!=='archived','EXPERIMENT_ARCHIVED','归档实验不能执行');assertOutcomeBoundary(this.c.store,e);
            validateContract(e.contract);
            this.researchSourceGuard?.(experimentId,'prepare');
            const snap=snapshotDirectory(this.c.store.paths.physical(e.workspace),join(this.c.dataDir,'snapshots')),revision=this.c.store.maybe<SourceRevision>('source-revision',digest({projectId:e.projectId,experimentId:e.id,revision:e.revision}));
            const binding=revision?this.c.store.maybe<GitSourceBinding>('git-source-binding',revision.id):undefined;
            const manifest:Manifest={experimentId:e.id,experimentVersion:e.version,experimentRevision:e.revision,contract:structuredClone(e.contract),contractDigest:e.contractDigest,snapshotDigest:snap.digest,snapshotPath:this.c.store.paths.reference(snap.path),sourceFiles:snap.files,createdAt:now(),...(revision?.sourceDigest===snap.digest?{sourceRevisionId:revision.id,...(binding&&binding.sourceDigest===snap.digest?{gitCommit:binding.gitCommit}:{})}:{})};
            if(manifest.contract.runner==='ssh')manifest.sshTarget=new SshTargetService(this.c).frozen(manifest.contract.sshTargetId!,true);
            verifyTrustedExample(manifest,this.c.repoRoot,this.c.store.paths);
            const id=randomUUID(),hash=digest(manifest),approval=this.approvals.request(e.projectId!,'run-intent',id,hash,'run.submit','批准此不可变快照、固定运行契约及计算资源；不授予其他实验权限');
            const result=this.c.store.create<RunIntent>('run-intent',e.projectId,{experimentId:e.id,manifest,manifestDigest:hash,approvalId:approval.id,status:'prepared'},id);this.c.store.event(e.projectId,'run.prepared',{intentId:id,experimentId:e.id,approvalId:approval.id,snapshotDigest:snap.digest});return result;
        });
    }
    submit(actor: Actor, id: string) {
        if (actor.type !== 'user')
            toolAllowed(actor, 'run_submit');
        return this.c.store.transaction(() => {
            const intent = this.c.store.get<RunIntent>('run-intent', id);
            scope(actor, intent.projectId!);
            assertRunGrantActor(this.c.store,actor,intent);
            if (intent.runId)
                return this.c.store.get<Run>('run', intent.runId);
            assertProjectWritable(this.c.store,intent.projectId!);
            assertRunGrantIntent(this.c.store,intent,true);
            this.researchSourceGuard?.(intent.experimentId,'submit',intent.id);
            const e = this.c.store.get<Experiment>('experiment', intent.experimentId, intent.projectId!);
            assertExperimentSourceCurrent(this.c.store,e);
            ensure(e.revision === intent.manifest.experimentRevision && e.contractDigest === intent.manifest.contractDigest, 'APPROVAL_STALE', '实验方案已修改，请重新准备并批准');
            assertOutcomeBoundary(this.c.store,e);
            this.approvals.assert(intent.approvalId, intent.projectId!, id, intent.manifestDigest, 'run.submit');
            verifySnapshot(this.c.store.paths.physical(intent.manifest.snapshotPath), intent.manifest.sourceFiles);
            verifyTrustedExample(intent.manifest, this.c.repoRoot,this.c.store.paths);
            if(intent.manifest.contract.runner==='ssh'){ensure(intent.manifest.sshTarget,'SSH_TARGET_REQUIRED','SSH 目标未冻结');new SshTargetService(this.c).assertFrozen(intent.manifest.sshTarget,true);}
            this.compute.assertEnqueue('run',intent.projectId!,intent.manifest.contract.runner==='ssh'?'ssh:'+intent.manifest.contract.sshTargetId:intent.manifest.contract.runner==='docker'?intent.manifest.contract.dockerContext??'default':undefined);
            const runId = randomUUID(), outputDir = join(this.c.dataDir, 'jobs', runId, 'output');
            consumeRunGrant(this.c.store,intent,runId);
            mkdirSync(outputDir, { recursive: true, mode: 0o777 });
            chmodSync(outputDir,0o777);
            const execution:RunExecution|undefined=intent.manifest.contract.runner!=='trusted-example'?{backend:intent.manifest.contract.runner,dockerContext:intent.manifest.contract.runner==='ssh'?'ssh:'+intent.manifest.contract.sshTargetId:intent.manifest.contract.dockerContext??'default',...(intent.manifest.contract.runner==='ssh'?{sshHandle:`pi-ssh-${runId}`} : {}),containerName:`pi-research-${runId}`,controlDir:this.c.store.paths.reference(join(this.c.dataDir,'jobs',runId,'control')),generation:0,leaseUntil:0,startRequested:false,recoveryCount:0}:undefined;
            const run = this.c.store.create<Run>('run', intent.projectId, { experimentId: e.id, intentId: id, manifest: intent.manifest, manifestDigest: intent.manifestDigest, state: 'queued', integrity: 'pending', judgment: 'pending', outputDir:this.c.store.paths.reference(outputDir), cancelRequested: false, artifactIds: [], evidenceIds: [],...(execution?{execution}:{}),...(intent.runGrant?{runGrant:intent.runGrant}:{}) }, runId);
            if(run.manifest.sshTarget){const t=run.manifest.sshTarget;this.c.store.db.prepare("UPDATE compute_queue SET target_id=?,engine_id=?,endpoint=?,bound=1 WHERE kind='run' AND id=?").run(t.targetId,t.engineId,t.configDigest+':'+t.protocolDigest,run.id);}
            this.c.store.update<RunIntent>('run-intent', id, intent.version, { status: 'submitted', runId });
            this.c.store.event(intent.projectId, 'run.queued', { runId, intentId: id });
            return run;
        });
    }
    /** Keep the version read and heartbeat write in one inter-process SQLite transaction. */
    heartbeat(id: string) {
        return this.c.store.transaction(() => {
            const run = this.c.store.get<Run>('run', id);
            if (TERMINAL.includes(run.state))
                return run;
            return this.c.store.update<Run>('run', id, run.version, { heartbeat: Date.now() });
        });
    }
    /** Recheck the durable execution grant inside the transaction that claims a queued Run. */
    assertLaunchable(run: Row<Run>) {
        ensure(run.state === 'queued' && !run.startedAt && !run.childPid && !run.cancelRequested, 'RUN_NOT_LAUNCHABLE', '作业已启动、取消或不再排队');
        this.assertExecutionGrant(run);
    }
    /** Also used just before Docker start and while supervising a running immutable job. */
    assertExecutionGrant(run: Row<Run>,admission=!TERMINAL.includes(run.state)&&(run.execution?!run.execution.startRequested:!run.startRequested)) {
        assertRunGrantRun(this.c.store,run,admission);
        this.researchSourceGuard?.(run.experimentId,'execute',run.intentId);
        assertProjectWritable(this.c.store, run.projectId!);
        const e = this.c.store.get<Experiment>('experiment', run.experimentId, run.projectId!);
        assertExperimentSourceCurrent(this.c.store, e);
        ensure(e.lifecycle !== 'archived', 'EXPERIMENT_ARCHIVED', '归档实验不能执行');
        const intent = this.c.store.get<RunIntent>('run-intent', run.intentId, run.projectId!);
        ensure(intent.status === 'submitted' && intent.runId === run.id && intent.experimentId === e.id && run.manifest.experimentId === e.id &&
            intent.manifestDigest === run.manifestDigest && digest(intent.manifest) === run.manifestDigest && digest(run.manifest) === run.manifestDigest,
            'APPROVAL_STALE', '作业、运行意向与已批准快照不一致');
        ensure(e.revision === run.manifest.experimentRevision && e.contractDigest === run.manifest.contractDigest,
            'APPROVAL_STALE', '实验方案已修改，请重新准备并批准');
        ensure(digest(run.manifest.contract)===run.manifest.contractDigest&&digest(run.manifest.sourceFiles)===run.manifest.snapshotDigest,'MANIFEST_CORRUPTED','运行契约或源码清单摘要不符');
        if(run.execution?.backend==='ssh'){const t=run.manifest.sshTarget;ensure(t&&run.manifest.contract.runner==='ssh'&&t.id===run.manifest.contract.sshTargetId&&run.execution.sshHandle===`pi-ssh-${run.id}`&&run.execution.dockerContext==='ssh:'+t.id&&this.c.store.paths.same(run.execution.controlDir,join(this.c.dataDir,'jobs',run.id,'control')),'APPROVAL_STALE','SSH 运行身份与批准契约不符');new SshTargetService(this.c).assertFrozen(t,admission);}
        else if(run.execution)ensure(run.execution.backend==='docker'&&run.manifest.contract.runner==='docker'&&run.execution.dockerContext===(run.manifest.contract.dockerContext??'default')&&run.execution.containerName===`pi-research-${run.id}`&&this.c.store.paths.same(run.execution.controlDir,join(this.c.dataDir,'jobs',run.id,'control')),'APPROVAL_STALE','运行目标与批准契约不符');
        assertOutcomeBoundary(this.c.store, e);
        this.approvals.assert(intent.approvalId, run.projectId!, intent.id, run.manifestDigest, 'run.submit');
    }
    /** Both launch callers hold the same write transaction as their authorization check. */
    cancelBeforeLaunch(run: Row<Run>, error: unknown) {
        if (run.state !== 'queued' || run.startedAt || run.childPid) return;
        const reason = asError(error);
        this.c.store.update<Run>('run', run.id, run.version, {state: 'cancelled', cancelRequested: true, integrity: 'incomplete', endedAt: now(), error: `${reason.code}: ${reason.message}`});
        this.c.store.event(run.projectId, 'run.cancelled_before_launch', {runId: run.id, reason: reason.code});
    }
    launchPending() {
        this.compute.tick();
        this.c.store.transaction(() => {
            for (const id of this.compute.queued('run')) {
                const run=this.c.store.get<Run>('run',id);
                if(run.state!=='queued'||run.startedAt||run.childPid)continue;
                try { this.assertLaunchable(run); }
                catch (error) { this.cancelBeforeLaunch(run, error); }
            }
        });
        const id=this.compute.candidates('run').find(id=>!this.launching.has(id));
        if(!id)return;
        const run=this.c.store.get<Run>('run',id);
        this.launching.add(run.id);
        const logDir = join(this.c.dataDir, 'jobs', run.id, 'control');
        mkdirSync(logDir, { recursive: true, mode: 0o700 });
        const fd = openSync(join(logDir, 'supervisor.log'), 'a', 0o600);
        try {
            const env:NodeJS.ProcessEnv=Object.fromEntries(['PATH','SystemRoot','WINDIR','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','ProgramData'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
            const child = spawn(process.execPath, [join(this.c.repoRoot, 'dist', 'apps', 'runner-supervisor', 'index.js'), this.c.dataDir, this.c.repoRoot, run.id], { detached: true, stdio: ['ignore', fd, fd], env, windowsHide: true });
            child.on('error', () => { this.launching.delete(run.id); });
            child.unref();
        }
        finally {
            closeSync(fd);
        }
        setTimeout(() => this.launching.delete(run.id), 2000).unref();
    }
    cancel(actor: Actor, id: string) {
        userOnly(actor);
        return this.c.store.transaction(() => {
            const r = this.get(actor, id);
            if (TERMINAL.includes(r.state))
                return r;
            ensure(r.state !== 'unknown'||!!r.execution, 'PROVIDER_STATE_UNKNOWN', '作业状态未知，禁止盲目按 PID 取消；请先对账', 409);
            const queued = r.state === 'queued';
            const result = this.c.store.update<Run>('run', id, r.version, { cancelRequested: true, state: queued ? 'cancelled' : 'cancelling', ...(queued ? { integrity: 'incomplete', endedAt: now() } : {}) });
            this.c.store.event(r.projectId, 'run.cancel_requested', { runId: id });
            return result;
        });
    }
    logs(actor: Actor, id: string, cursor = 0, stream:'stdout'|'stderr'='stdout',identity?:string|null) {
        const run=this.get(actor,id);oneOf(stream,['stdout','stderr'] as const,'stream');
        return readLogPage(this.c.store.paths.physical(run.execution?.controlDir??run.outputDir),`${stream}.log`,cursor,{terminal:TERMINAL.includes(run.state),identity});
    }
    sourceList(actor:Actor,id:string) {const r=this.get(actor,id);verifySnapshot(this.c.store.paths.physical(r.manifest.snapshotPath),r.manifest.sourceFiles);const revisionId=r.manifest.sourceRevisionId??digest({projectId:r.projectId,experimentId:r.experimentId,revision:r.manifest.experimentRevision}),binding=this.c.store.maybe<GitSourceBinding>('git-source-binding',revisionId);return {runId:r.id,experimentId:r.experimentId,revision:r.manifest.experimentRevision,sourceDigest:r.manifest.snapshotDigest,gitCommit:r.manifest.gitCommit??(binding?.sourceDigest===r.manifest.snapshotDigest?binding.gitCommit:undefined),files:r.manifest.sourceFiles};}
    sourceRead(actor:Actor,id:string,value:unknown) {
        const x=object(value),r=this.get(actor,id),meta=this.sourceList(actor,id),path=text(x.path,'path',1000),f=meta.files.find(f=>f.path===path);ensure(f,'NOT_FOUND','运行快照中没有该文件',404);
        ensure(f.size<=2*1024*1024,'FILE_TOO_LARGE','该源码文件超过文本预览上限',413);const bytes=readStableFile(this.c.store.paths.physical(r.manifest.snapshotPath),path,2*1024*1024);ensure(bytes.length===f.size&&digest(bytes)===f.digest,'SNAPSHOT_CORRUPTED','运行源码字节不符');ensure(!bytes.includes(0),'BINARY_FILE','该文件不能作为文本源码预览',415);
        let content:string;try{content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{ensure(false,'BINARY_FILE','源码不是 UTF-8 文本',415);}
        const cursor=integer(x.cursor??0,'cursor',0,content.length),limit=integer(x.limit??16000,'limit',1,64000),end=Math.min(content.length,cursor+limit),{files,...metadata}=meta;return {...metadata,...f,content:content.slice(cursor,end),cursor,end,complete:end===content.length};
    }
    finalize(id: string, exitCode: number | null, state: 'succeeded' | 'failed' | 'cancelled', error?: string, facts?:DockerRunResult) {
        return this.c.store.transaction(() => {
            let r = this.c.store.get<Run>('run', id);
            if (TERMINAL.includes(r.state))
                return r;
            if(facts)ensure(r.execution?.generation===facts.generation&&r.execution.leaseUntil>Date.now(),'LEASE_EXPIRED','旧监管器不能归档当前作业');
            const collected=collectRunArtifacts(r,this.evidence,this.c.store.paths),{metrics,artifactIds,evidenceIds,errors}=collected;let integrity=collected.integrity;
            if(facts?.incomplete&&integrity!=='invalid')integrity='incomplete';
            if(r.execution||r.runGrant){try{this.assertExecutionGrant(r,false);}catch{integrity='invalid';errors.push('运行来源或批准已失效');}}
            if (errors.length) error = [error, ...errors].filter(Boolean).join('; ').slice(0, 8000);
            if(r.execution){const report={runId:r.id,manifestDigest:r.manifestDigest,sourceDigest:r.manifest.snapshotDigest,gitCommit:r.manifest.gitCommit,command:r.manifest.contract.command,image:r.manifest.contract.image,imageId:r.execution.imageId,containerId:r.execution.containerId,...(r.execution.backend==='ssh'?{backend:'ssh',sshHandle:r.execution.sshHandle,sshTarget:r.manifest.sshTarget}:{}),exitCode,state,integrity,error,artifactIds:[...artifactIds],scientificConclusion:false},a=this.evidence.put(r.projectId!,'execution.json',Buffer.from(JSON.stringify(report,null,2)),'application/json','run',{runId:r.id});artifactIds.push(a.id);}
            r = this.c.store.update<Run>('run', id, r.version, { state, integrity, judgment: 'pending', answerDisposition: metrics && evidenceIds.length ? 'answered' : 'needs_review', exitCode, endedAt: now(), heartbeat: Date.now(), metrics, artifactIds, evidenceIds, ...(error ? { error } : {}),...(r.execution?{execution:{...r.execution,leaseUntil:0,logTruncated:facts?.logTruncated??r.execution.logTruncated,outputExceeded:facts?.outputExceeded??r.execution.outputExceeded}}:{}) });
            if (metrics && evidenceIds.length > 0) {
                const exp = this.c.store.get<Experiment>('experiment', r.experimentId);
                if (exp.revision === r.manifest.experimentRevision && exp.lifecycle === 'provisional')
                    this.c.store.update<Experiment>('experiment', exp.id, exp.version, { lifecycle: 'frozen' });
            }
            this.c.store.event(r.projectId, 'run.completed', { runId: id, state, integrity, evidenceIds });
            return r;
        });
    }
    reviewOutcome(actor:Actor,id:string,value:unknown){
        userOnly(actor);const x=object(value),disposition=oneOf(x.disposition,['answered','unanswered'] as const,'disposition'),reason=text(x.reason,'reason',4000);
        return this.c.store.transaction(()=>{const r=this.get(actor,id);ensure(TERMINAL.includes(r.state),'RUN_NOT_TERMINAL','运行尚未结束');ensure(r.version===integer(x.expectedVersion,'expectedVersion',1),'VERSION_CONFLICT','运行记录已变化');
            ensure(answerDisposition(r)!=='answered'||disposition==='answered','RESULT_ALREADY_ANSWERED','已有结果不能撤销为无结果以绕过冻结');
            const e=this.c.store.get<Experiment>('experiment',r.experimentId);ensure(e.revision===r.manifest.experimentRevision,'OUTCOME_REVISION_STALE','代码已离开该运行版本，不能借历史评议修改当前节点');
            r.artifactIds.forEach(id=>this.evidence.read(actor,id));
            const review=this.c.store.create('run-outcome-review',r.projectId,{runId:id,disposition,reason,manifestDigest:r.manifestDigest,artifactIds:r.artifactIds,previous:answerDisposition(r)});
            const next=this.c.store.update<Run>('run',id,r.version,{answerDisposition:disposition,answerReviewId:review.id});
            if(disposition==='answered'&&e.lifecycle==='provisional')this.c.store.update<Experiment>('experiment',e.id,e.version,{lifecycle:'frozen'});
            this.c.store.event(r.projectId,'run.outcome_reviewed',{runId:id,reviewId:review.id,disposition});return next;
        });
    }
    reconcile() {
        for (const id of this.compute.active('run')) {
            const r=this.c.store.get<Run>('run',id);
            if(TERMINAL.includes(r.state)||r.state==='queued')continue;
            const receipt = join(this.c.dataDir, 'jobs', r.id, 'control', r.execution?`terminal-${r.execution.generation}.json`:'terminal.json');
            if (existsSync(receipt)) {
                try {
                    const x = JSON.parse(readFileSync(receipt, 'utf8'));
                    ensure(x.manifestDigest === r.manifestDigest && TERMINAL.includes(x.state), 'INVALID_RECEIPT', '运行收据不匹配');
                    if(r.execution){ensure(x.facts?.generation===r.execution.generation,'INVALID_RECEIPT','Docker 运行回执 generation 不符');this.c.store.transaction(()=>{const current=this.c.store.get<Run>('run',r.id);if(current.execution)this.c.store.update<Run>('run',r.id,current.version,{execution:{...current.execution,leaseUntil:Date.now()+60000}});this.finalize(r.id,x.exitCode,x.state,x.error,x.facts);});}
                    else this.finalize(r.id, x.exitCode, x.state, x.error);
                }
                catch (e) {
                    this.c.store.event(r.projectId, 'run.reconciliation_error', { runId: r.id, message: (e as Error).message });
                }
            }
            else if (r.heartbeat && Date.now() - r.heartbeat > (r.execution?60000:15000) && r.state !== 'unknown') {
                this.c.store.transaction(() => {
                    const current = this.c.store.get<Run>('run', r.id);
                    if (!TERMINAL.includes(current.state) && current.state !== 'unknown' && current.heartbeat && Date.now() - current.heartbeat > (current.execution?60000:15000)) {
                        this.c.store.update<Run>('run', current.id, current.version, { state: 'unknown', error: '监管心跳超时；不自动重复提交或按旧 PID 取消' });
                        this.c.store.event(current.projectId, 'run.unknown', { runId: current.id });
                    }
                });
            }
        }
    }
}
