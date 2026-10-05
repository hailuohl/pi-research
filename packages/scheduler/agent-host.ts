import {canSteerSession} from '../pi-adapter/session-history.js';
import {messageInput} from '../pi-adapter/attachments.js';
import {prepareSessionSkills} from '../skills/runtime.js';
import { fork, type ChildProcess } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import type { ResearchApp } from '../research-app.js';
import type { Actor, Session, Message, Task, TaskAttempt, Team, Row, ModelConfig } from '../domain/types.js';
import { SYSTEM } from '../domain/types.js';
import { ToolDispatcher } from '../research-tools/dispatcher.js';
import type { Wakeup } from './wakeups.js';
import { inspectPi } from '../pi-adapter/runtime.js';
import { asError, ensure, DomainError } from '../domain/errors.js';
import {assertWorkspaceReady} from '../workspace/git-service.js';
import {randomUUID} from 'node:crypto';
import {AgentAdmissionService,type AgentAdmission} from './agent-admission.js';
interface Active {
    admissionId: string;
    child: ChildProcess;
    sessionId: string;
    generation: number;
    actor: Actor;
    messageIds: string[];
    consumedIds: Set<string>;
    attemptId?: string;
    started: number;
    lastHeartbeat: number;
    sent: Set<string>;
    ended: boolean;
    exitObserved?: boolean;
    providerError?: string;
    stopError?: string;
    assistantOutput?: boolean;
    failedToolCalls?: Set<string>;
    contextMessageIds?: string[];
    advertisedTools?: Set<string>;
}
const redact = (s: string) => s.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]').replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]');
const clean = (s: string) => redact(s).slice(0, 32000);
/** Dependency injection is in-process test infrastructure only; HTTP/config never select a replacement worker. */
interface HostDependencies {
    inspect?: (repoRoot: string, model: ModelConfig) => {ready: boolean; code: string; message: string};
    workerEntry?: string;
    fork?: typeof fork;
}
export class AgentHost {
    readonly tools: ToolDispatcher;
    readonly active = new Map<string, Active>();
    private timer?: NodeJS.Timeout;
    private ticking = false;
    private stopped = false;
    private readonly ownerHost=randomUUID();
    private readonly admission:AgentAdmissionService;
    constructor(private app: ResearchApp, private dependencies: HostDependencies = {}) { this.tools = new ToolDispatcher(app); this.admission=app.agentAdmission; }
    private inspect(model: ModelConfig) { return (this.dependencies.inspect ?? inspectPi)(this.app.context.repoRoot, model); }
    status() { const capacity=this.admission.snapshot();return { ...this.inspect(this.app.sessions.model()), activeWorkers: capacity.counts.held, maxModelWorkers: capacity.maxWorkers, workerCapacity:capacity,workerUnit:'pi-worker',httpConcurrencyMeasured:false,toolIsolation: 'host-allowlist-explicit-trusted-shell', osSandboxVerified: false,hostAccess:{available:true,boundary:'trusted-host',requiresExplicitSessionEnable:true,revokedOnRestart:true} }; }
    start() {
        this.timer = setInterval(() => {
            try {
                this.tick();
            }
            catch (e) {
                console.error('Scheduler:', asError(e).code);
            }
        }, 250);
        this.timer.unref();
    }
    ensureReady(session: Row<Session>) {
        const state = this.inspect(session.model);
        if (!state.ready)
            throw new DomainError(state.code, state.message, 503);
    }
    tick() {
        if (this.ticking || this.stopped)
            return;
        this.ticking = true;
        try {
            this.app.git.tick();
            this.app.runs.reconcile();
            this.app.runs.launchPending();
            this.app.execution.launchPending();
            this.app.documentParsing.tick();
            this.app.publicationBuilds.tick();
            this.app.literatureTasks.tick();
            this.admission.recover();
            this.app.modelHttp.recover();
            this.app.teams.recover();
            this.app.campaigns.observe();
            this.app.wakeups.reconcile();
            for (const active of this.active.values()) {
                if(active.ended || active.exitObserved || active.stopError)continue;
                const s = this.app.store.get<Session>('session', active.sessionId);
                const a = active.attemptId ? this.app.store.get<TaskAttempt>('task-attempt', active.attemptId) : null;
                if (!this.valid(active)) {
                    this.abortProcess(active);
                    continue;
                }
                if (Date.now() - active.started > 300000) {
                    this.abortProcess(active, 'Agent 超过五分钟执行上限');
                    continue;
                }
                if (Date.now() - active.lastHeartbeat > 3000) {
                    // Fixed inputs are verified at tool boundaries and once per heartbeat, not per text delta.
                    if (a?.state === 'running') {
                        try { this.app.teams.active(active.actor); }
                        catch (error) { this.abortProcess(active, clean(asError(error).message)); continue; }
                    }
                    this.app.store.transaction(()=>{this.admission.heartbeat(active.admissionId,this.ownerHost,active.generation);const latest=this.app.store.get<Session>('session',s.id);ensure(latest.generation===active.generation,'LEASE_EXPIRED','会话已失效');this.app.store.update<Session>('session',latest.id,latest.version,{leaseUntil:Date.now()+30000});if(a)this.app.teams.heartbeat(a.id);});
                    active.lastHeartbeat = Date.now();
                }
                if (!s.taskId && !active.actor.wakeupId)
                    for (const queued of this.app.sessions.messages(SYSTEM, s.id).filter(m=>m.role==='user'&&m.origin!=='automation'&&!m.wakeupId&&m.status==='queued'&&m.mode==='steer')) {
                        const m=this.app.store.transaction(()=>{
                            const latest=this.app.store.get<Session>('session',s.id),input=this.app.store.get<Message>('message',queued.id,latest.projectId!);
                            if(!this.valid(active)||!canSteerSession(this.app.store,latest)||input.sessionId!==latest.id||input.status!=='queued'||input.mode!=='steer'||(input.steerGeneration!==undefined&&input.steerGeneration!==active.generation)||JSON.stringify(input.permission)!==JSON.stringify(active.actor.permission))return null;
                            return this.app.store.update<Message>('message',input.id,input.version,{status:'running'});
                        });
                        if(!m)continue;
                        active.messageIds.push(m.id);active.sent.add(m.id);
                        this.sendInput(active,{type:'steer',content:messageInput(m),messageId:m.id},m.id);
                    }
                if (s.taskId && a?.state === 'running')
                    for (const d of this.app.store.list<any>('directive', s.projectId!).filter(d => d.kind !== 'revise' && d.taskIds.includes(s.taskId) && !d.deliveredSessionIds.includes(s.id))) {
                        if (active.sent.has(d.id))
                            continue;
                        active.sent.add(d.id);
                        active.child.send({ type: d.kind, content: d.content, messageId: d.id });
                    }
            }
            // Recover abandoned single writers, but never retry a possibly paid request automatically.
            for (const s of this.app.store.list<Session>('session').filter(s => s.state === 'running' && !this.active.has(s.id) && s.leaseUntil < Date.now())) {
                this.app.store.transaction(()=>{const latest=this.app.store.get<Session>('session',s.id);if(latest.state!=='running'||latest.leaseUntil>=Date.now())return;
                this.app.store.update<Session>('session', s.id, latest.version, { state: 'failed', lastError: '会话租约过期；请核对后显式重试', generation: latest.generation + 1, leaseUntil: 0 });
                for (const m of this.app.sessions.messages(SYSTEM, s.id).filter(m => m.status === 'running'))
                    this.app.store.update<Message>('message', m.id, m.version, { status: 'failed', error: '进程中断，用量待对账' });
                });
            }
            this.app.wakeups.reconcile();
            if (!this.admission.snapshot().available)
                return;
            for (const s of this.app.store.list<Session>('session').filter(s => !s.taskId && s.state === 'queued')) {
                if (!this.admission.snapshot().available)
                    break;
                if(this.active.has(s.id))continue;
                if (!this.inspect(s.model).ready)
                    continue;
                try{assertWorkspaceReady(this.app.context,s.id);}catch{continue;}
                const messages = this.app.sessions.messages(SYSTEM, s.id).filter(m => m.status === 'queued');
                const next = messages.find(m => m.role === 'user') ?? messages.find(m => m.origin === 'automation');
                if (next) {
                    try { this.launch(s, next.content, next.id); } catch(error) {const e=asError(error),latest=this.app.store.get<Session>('session',s.id);this.app.store.update<Session>('session',s.id,latest.version,{state:'failed',lastError:`${e.code} — ${e.message}`});if(e.code==='SESSION_PERMISSION_STALE'){const m=this.app.store.get<Message>('message',next.id);if(m.status==='queued')this.app.store.update<Message>('message',m.id,m.version,{status:'failed',error:e.message});}}
                }
            }
            for (const w of this.app.store.list<Wakeup>('wakeup').filter(w => w.state === 'pending')) {
                if (!this.admission.snapshot().available) break;
                const root = this.app.sessions.get(SYSTEM, w.rootSessionId);
                try{assertWorkspaceReady(this.app.context,root.id);}catch{continue;}
                try {
                const dispatch=this.app.store.transaction(()=>{if(this.admission.sessionHeld(root.id)||!this.admission.check(root.projectId!,root.role))return null;const dispatched=this.app.wakeups.dispatch(w.id,this.inspect(root.model));if(!dispatched)return null;const prepared=this.claimSession(this.app.sessions.get(SYSTEM,root.id),dispatched.message.id);ensure(prepared,'AGENT_CAPACITY_CHANGED','Worker 准入未完成');return {dispatched,prepared};});
                if(dispatch)this.launch(dispatch.prepared.session,dispatch.dispatched.message.content,dispatch.dispatched.message.id,undefined,dispatch.prepared);
                } catch(error) {const e=asError(error),latest=this.app.store.get<Wakeup>('wakeup',w.id);if(latest.blockReason!==`${e.code} — ${e.message}`)this.app.store.update<Wakeup>('wakeup',w.id,latest.version,{blockReason:`${e.code} — ${e.message}`});}
            }
            for (const team of this.app.store.list<Team>('team').filter(t => t.state === 'active')) {
                if (!this.admission.snapshot().available)
                    break;
                const root = this.app.store.get<Session>('session', team.rootSessionId);
                const dispatch=this.app.store.transaction(()=>{
                    if(!this.admission.check(team.projectId!,'implementer',team.id))return null;
                    const claimed=this.app.teams.claim(team.id,!this.inspect(root.model).ready);if(!claimed)return null;
                    const s=this.app.store.get<Session>('session',claimed.attempt.sessionId),prepared=this.claimSession(s,undefined,claimed.attempt);
                    ensure(prepared,'AGENT_CAPACITY_CHANGED','Worker 准入未完成');return {claimed,prepared};
                });
                if (dispatch) {
                    this.launch(dispatch.prepared.session, JSON.stringify(dispatch.claimed.context, null, 2), undefined, dispatch.claimed.attempt,dispatch.prepared);
                }
            }
        }
        finally {
            this.ticking = false;
        }
    }
    private claimSession(session:Row<Session>,messageId?:string,attempt?:Row<TaskAttempt>) {
        const store = this.app.store;
        return store.transaction(() => {
            const latest = store.get<Session>('session', session.id);
            assertWorkspaceReady(this.app.context,latest.id);
            if(['running','archived'].includes(latest.state))return null;
            const input=messageId?store.get<Message>('message',messageId,latest.projectId!):undefined;
            if(input){ensure(input.sessionId===latest.id,'SCOPE_DENIED','消息不属于此会话',403);if(input.status!=='queued')return null;}
            const permission=this.app.sessionPermissions.capture(latest.id,!!input?.wakeupId);
            if(input&&!input.permission)ensure(permission.epoch===0&&permission.hostEpoch===0,'SESSION_PERMISSION_STALE','旧排队输入没有当前权限依据，请用户明确重试');
            if(input?.permission)ensure(JSON.stringify(input.permission)===JSON.stringify(permission),'SESSION_PERMISSION_STALE','排队消息权限已变化，请用户明确重试');
            if(latest.teamId){const team=store.get<Team>('team',latest.teamId,latest.projectId!);if(team.permission)this.app.sessionPermissions.assert(team.permission,false);else ensure(permission.epoch===0&&permission.hostEpoch===0,'SESSION_PERMISSION_STALE','旧协作计划没有当前权限依据');}
            const slot=this.admission.tryAcquire(latest,latest.generation+1,this.ownerHost,attempt?.teamId);if(!slot)return null;
            const next = store.update<Session>('session', latest.id, latest.version, { state: 'running', generation: latest.generation + 1, leaseUntil: Date.now() + 30000, lastError: undefined,executionPermission:permission });
            let message:Row<Message>|undefined;
            if (input) {
                const m = input;
                ensure(m.status === 'queued' && m.sessionId === next.id && m.projectId===next.projectId, 'MESSAGE_STALE', '消息已失效');
                message=store.update<Message>('message', m.id, m.version, { status: 'running',generation:next.generation });
                if (m.wakeupId) this.app.wakeups.markStarted(m.wakeupId, next.id, next.generation, m.id);
            }
            const wakeupId=messageId?store.get<Message>('message',messageId).wakeupId:undefined;
            const actor:Actor={type:'agent',projectId:next.projectId!,sessionId:next.id,role:next.role,generation:attempt?.generation??next.generation,...(attempt?{taskId:attempt.taskId,attemptId:attempt.id}:{}),...(wakeupId?{wakeupId}:{})};
            // Resolve against the pre-claim generation; the whole claim rolls back on missing capability.
            const bundleId=prepareSessionSkills(this.app,latest,actor);
            ensure(!attempt||attempt.skillBundleId===bundleId,'SKILL_BINDING_MISMATCH','任务与会话技能包不一致');
            const bound=store.update<Session>('session',next.id,next.version,{skillBundleId:bundleId});
            store.event(next.projectId,'session.skill_bundle_bound',{sessionId:next.id,generation:next.generation,bundleId});
            return {session:bound,slot,message};
        });
    }
    private launch(session: Row<Session>, prompt: string, messageId?: string, attempt?: Row<TaskAttempt>,prepared?:{session:Row<Session>;slot:Row<AgentAdmission>;message?:Row<Message>}) {
        const reservation=prepared??this.claimSession(session,messageId,attempt);if(!reservation)return;
        const {session:claimed,slot}=reservation,store=this.app.store;
        if(messageId){ensure(reservation.message?.id===messageId,'MESSAGE_STALE','领取正文缺失');prompt=messageInput(reservation.message);}
        const wakeupId = messageId ? store.get<Message>('message', messageId).wakeupId : undefined;
        const actor: Actor = { permission:claimed.executionPermission,...(wakeupId ? { wakeupId } : {}), type: 'agent', projectId: claimed.projectId!, sessionId: claimed.id, role: claimed.role, generation: attempt?.generation ?? claimed.generation, ...(attempt ? { taskId: attempt.taskId, attemptId: attempt.id } : {}) };
        let active:Active|undefined,requested=false;
        try {
        const bundleId=prepareSessionSkills(this.app,claimed,actor);
        const skillBundle = this.app.skills.bundleBootstrap(claimed.projectId!,claimed.role,bundleId);
        this.ensureReady(claimed);
        const toolDefinitions=this.tools.definitions(claimed.role,!!wakeupId,claimed.id);
        const isolatedRunAnalysis=!!wakeupId&&this.app.wakeups.get(SYSTEM,wakeupId).sourceKind==='run-result';
        const home = join(this.app.context.dataDir, 'sessions', claimed.id), agentDir = join(home, 'agent'), sessionDir = isolatedRunAnalysis?join(home,'pi-analysis',wakeupId!):join(home, 'pi');
        mkdirSync(agentDir, { recursive: true, mode: 0o700 });
        mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
        const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, HOME: home, USERPROFILE: home, PI_API_KEY: process.env.PI_API_KEY, NO_COLOR: '1' };
        // Only the selected model credential enters a worker. No SSH/cloud credentials or inherited Node flags.
        const child = store.transaction(()=>{
            // Serialize the final revocation check with process creation across controllers.
            this.app.skills.ensureBundleStartAllowed(claimed.projectId!,bundleId);
            const marked=this.admission.markSpawnRequested(slot.id,this.ownerHost,claimed.generation);store.update('agent-admission',marked.id,marked.version,{httpManagedVersion:1});requested=true;
            const spawned = (this.dependencies.fork??fork)(this.dependencies.workerEntry ?? join(this.app.context.repoRoot, 'dist/apps/agent-worker/index.js'), [], { cwd: this.app.store.paths.physical(claimed.workspace), env, execArgv: [], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
            // Retain the child before commit: a commit failure is not proof of zero model use.
            active = {admissionId:slot.id,child:spawned,sessionId:claimed.id,generation:claimed.generation,actor,messageIds:messageId?[messageId]:[],consumedIds:new Set(messageId?[messageId]:[]),attemptId:attempt?.id,started:Date.now(),lastHeartbeat:Date.now(),sent:new Set(),ended:false,advertisedTools:new Set(toolDefinitions.map(tool=>tool.name))};
            this.active.set(claimed.id,active);
            spawned.on('error',error=>this.finish(active!,clean(error.message)));
            spawned.once('exit',code=>{active!.exitObserved=true;if(active!.ended)this.exited(active!,code);});
            spawned.once('close',code=>{if(this.active.get(claimed.id)===active)this.exited(active!,code);});
            return spawned;
        });
        const worker = active!;
        child.stdout?.on('data', () => { });
        child.stderr?.on('data', () => { });
        child.on('message', raw => { void this.onMessage(worker, raw as any, sessionDir).catch(e => this.finish(worker, clean(asError(e).message))); });
        // exit can precede buffered IPC messages; close confirms those messages have drained.
        this.admission.markRunning(slot.id,this.ownerHost,claimed.generation,child.pid);
        const hostMessages = !wakeupId && !attempt ? this.app.sessions.pendingNotices(claimed.id) : [];
        worker.contextMessageIds = hostMessages.map(m => m.id);
        const history = !isolatedRunAnalysis&&!claimed.piSessionPath ? this.app.sessions.messages(SYSTEM, claimed.id).filter(m => m.status === 'completed' && (m.role !== 'system' || m.origin === 'automation')).map(m => ({ role: m.role, content: messageInput(m) })) : [];
        this.sendInput(worker,{ type: 'start', managedHttp:true, permissionMode:actor.permission?.mode??'legacy', skillBundle, repoRoot: this.app.context.repoRoot, workspace: this.app.store.paths.physical(claimed.workspace), agentDir, sessionDir, modelsPath: join(this.app.context.dataDir, 'models.json'), piSessionPath: !isolatedRunAnalysis&&claimed.piSessionPath?this.app.store.paths.physical(claimed.piSessionPath):null, role: claimed.role, model: claimed.model, tools: toolDefinitions, history: history.length ? JSON.stringify(history) : null, hostMessages, prompt },messageId);
        store.event(claimed.projectId, 'agent.started', { sessionId: claimed.id, generation:claimed.generation, attemptId: attempt?.id });
        } catch(error) {
            const failure=asError(error),startError=`${failure.code} — ${failure.message}`;
            if(active){
                try {
                    store.transaction(()=>{const held=this.admission.assertOwned(slot.id,this.ownerHost,claimed.generation);store.update<AgentAdmission>('agent-admission',held.id,held.version,{spawnRequested:true,workerPid:active!.child.pid,httpManagedVersion:1});});
                    this.finish(active,clean((error as Error).message));
                } finally {if(!active.exitObserved){if(active.child.connected)active.child.disconnect();active.child.kill('SIGTERM');}}
                return;
            }
            store.transaction(()=>{this.admission.release(slot.id,this.ownerHost,claimed.generation,requested?'synchronous-fork-failure':'not-forked');if(attempt)this.app.teams.fail(attempt.id,startError,false,true);if(messageId){const m=store.get<Message>('message',messageId);if(m.status==='running')store.update<Message>('message',m.id,m.version,{status:'failed',error:startError});}if(wakeupId){const w=this.app.wakeups.get(SYSTEM,wakeupId);store.update<Wakeup>('wakeup',w.id,w.version,{state:'queued',attempts:Math.max(0,w.attempts-1),generation:undefined});this.app.wakeups.finish(w.id,startError,false);}const latest=store.get<Session>('session',claimed.id);if(latest.generation===claimed.generation)store.update<Session>('session',latest.id,latest.version,{state:'failed',leaseUntil:0,lastError:startError});});
        }
    }
    private exited(a:Active,code:number|null) {
        try{if(!a.ended)this.finish(a,`Worker 退出（${code}）；请求或工具用量可能需要对账`);this.app.modelHttp.workerExited(a.admissionId,this.ownerHost,a.generation);this.admission.release(a.admissionId,this.ownerHost,a.generation,'confirmed-exit');}finally{if(this.active.get(a.sessionId)===a)this.active.delete(a.sessionId);}
    }
    private valid(a: Active) {
        if(a.admissionId){try{this.admission.assertOwned(a.admissionId,this.ownerHost,a.generation);}catch{return false;}}
        const s = this.app.store.get<Session>('session', a.sessionId);
        if (s.generation !== a.generation || s.state !== 'running' || s.leaseUntil <= Date.now()) return false;
        if (a.actor.taskId) {
            const task = this.app.store.get<Task>('task', a.actor.taskId);
            if (task.execution === 'superseded' || task.generation !== a.actor.generation || task.attemptId !== a.actor.attemptId) return false;
            const attempt = this.app.store.get<TaskAttempt>('task-attempt', a.actor.attemptId!);
            if (attempt.taskId !== task.id || attempt.sessionId !== s.id || attempt.generation !== a.actor.generation) return false;
            if (attempt.state !== 'running' && attempt.state !== 'finished') return false;
            if (attempt.state === 'running' && (task.execution !== 'running' || attempt.leaseUntil <= Date.now())) return false;
        }
        if (a.actor.wakeupId) { try { this.app.wakeups.assertActive(a.actor); } catch { return false; } }
        return true;
    }
    private async onMessage(a: Active, m: any, sessionDir: string) {
        if(m?.type==='model_http_acquire'||m?.type==='model_http_finish'){
            const identity={admissionId:a.admissionId,ownerHost:this.ownerHost,sessionId:a.sessionId,generation:a.generation};
            try{
                let result:unknown;
                if(m.type==='model_http_acquire'){
                    result=this.app.store.transaction(()=>{
                        ensure(!a.ended&&!a.exitObserved&&!a.stopError&&this.valid(a),'MODEL_HTTP_SCOPE_EXPIRED','会话已停止，不能外发模型请求');
                        if(a.actor.taskId)this.app.teams.active(a.actor);
                        return this.app.modelHttp.acquire(identity,m.key);
                    });
                }else result=this.app.modelHttp.finish(identity,m.key,m.result);
                if(!a.exitObserved&&a.child.connected)a.child.send({type:'model_http_response',requestId:m.requestId,result:result??null});
            }catch(error){if(!a.exitObserved&&a.child.connected){const e=asError(error);a.child.send({type:'model_http_response',requestId:m.requestId,error:{code:e.code,message:clean(e.message)}});}}
            return;
        }
        if (a.ended)
            return;
        if (m?.type === 'tool') {
            if (a.exitObserved) return;
            try {
                ensure(!a.stopError && this.valid(a), 'LEASE_EXPIRED', '会话已中止');
                // Cached reads also require current inputs while a task is running; finished submit receipts may drain.
                if (a.attemptId && this.app.store.get<TaskAttempt>('task-attempt', a.attemptId).state === 'running') this.app.teams.active(a.actor);
                const result = await this.tools.execute(a.actor, String(m.tool), m.input, String(m.toolCallId));
                if (!a.exitObserved && a.child.connected)
                    a.child.send({ type: 'tool_response', requestId: m.requestId, result });
            }
            catch (e) {
                const error = asError(e);
                if (!a.exitObserved && a.child.connected)
                    a.child.send({ type: 'tool_response', requestId: m.requestId, error: { code: error.code, message: clean(error.message) } });
            }
            return;
        }
        if (m?.type === 'done') {
            if (m.sessionFile && this.valid(a))
                this.savePath(a, String(m.sessionFile), sessionDir);
            this.finish(a, m.aborted ? 'Agent 已中止' : undefined);
            return;
        }
        if (m?.type === 'failure') {
            this.finish(a, clean(String(m.error)));
            return;
        }
        if (!this.valid(a))
            return;
        const s = this.app.store.get<Session>('session', a.sessionId);
        if (m?.type === 'context_ack') {
            ensure(Array.isArray(m.messageIds) && m.messageIds.every((id: unknown) => typeof id === 'string' && a.contextMessageIds?.includes(id)), 'SCOPE_DENIED', '不能确认未投递的上下文通知', 403);
            this.app.store.transaction(() => this.app.sessions.acknowledgeNotices(s.id, m.messageIds));
        }
        if (m?.type === 'tool_execution_start' || m?.type === 'tool_execution_end') {
            const tool = String(m.tool ?? '');
            // Revocation fences effects, but must not erase the final failure event for an already advertised tool.
            if (!(a.advertisedTools??new Set(this.tools.definitions(a.actor.role!,!!a.actor.wakeupId,a.sessionId).map(definition=>definition.name))).has(tool)) return;
            const failedCallId=m.type === 'tool_execution_end' && m.isError ? String(m.toolCallId ?? tool).slice(0,200) : null;
            const seen=a.failedToolCalls ??= new Set<string>();
            let noticeSaved=false;
            this.app.store.transaction(() => {
                ensure(this.valid(a), 'LEASE_EXPIRED', '旧 Worker 不能保存当前工具状态');
                this.app.store.event(s.projectId, 'session.activity', {sessionId:s.id,generation:a.generation,tool,status:m.type === 'tool_execution_start' ? 'running' : m.isError ? 'failed' : 'completed'});
                if (failedCallId !== null) {
                    if (!seen.has(failedCallId)) {
                        const notice = this.app.store.create<Message>('message', s.projectId, {sessionId:s.id,generation:a.generation,role:'system',content:`工具 ${tool} 调用失败。请查看智能体说明或对应任务的诊断。`,mode:'follow_up',status:'failed'});
                        this.app.store.event(s.projectId, 'session.message_completed', {sessionId:s.id,messageId:notice.id});
                        noticeSaved=true;
                    }
                }
            });
            if(noticeSaved)seen.add(failedCallId!);
            return;
        }
        if (m?.type === 'ready') {
            ensure(m.model?.provider === s.model.provider && m.model?.id === s.model.model, 'MODEL_FALLBACK_REFUSED', 'Pi 尝试切换未经批准的模型');
            if (m.sessionFile)
                this.savePath(a, String(m.sessionFile), sessionDir);
        }
        if (m?.type === 'assistant_message') {
            if (m.error) a.providerError = clean(String(m.error));
            else if (typeof m.content === 'string' && m.content.trim()) a.assistantOutput = true;
            const content=redact(String(m.content??''));
            this.app.store.transaction(()=>{
                ensure(this.valid(a),'LEASE_EXPIRED','旧 Worker 不能保存当前会话输出');
                const allowed = a.advertisedTools??new Set(this.tools.definitions(a.actor.role!, !!a.actor.wakeupId,a.sessionId).map(definition => definition.name));
                const toolCalls = Array.isArray(m.toolCalls) ? m.toolCalls.filter((name:unknown):name is string => typeof name === 'string' && allowed.has(name)).slice(0,64) : [];
                const record = this.app.store.create<Message>('message', s.projectId, { sessionId: s.id, generation:a.generation,phase:toolCalls.length || m.phase === 'commentary' || m.stopReason === 'toolUse' ? 'commentary' : 'final_answer',...(toolCalls.length ? {toolCalls} : {}), ...(a.actor.wakeupId ? { origin: 'automation' as const, wakeupId: a.actor.wakeupId } : {}), role: 'assistant', content: content.slice(0,32000),...(content.length>32000?{contentTruncated:true}:{}), mode: 'prompt', status: m.error ? 'failed' : 'completed', error: m.error ? clean(String(m.error)) : undefined, usage: m.usage });
                this.app.store.event(s.projectId, 'session.message_completed', { sessionId: s.id, generation:s.generation,messageId: record.id });
                this.app.store.create('model-usage', s.projectId, { sessionId: s.id, attemptId: a.attemptId ?? null, provider: s.model.provider, model: s.model.model, usage: m.usage, status: m.usage ? 'reported' : 'unknown', stopReason: m.stopReason ?? null });
            });
        }
        if (m?.type === 'delta' && typeof m.text === 'string') {
            const text=redact(m.text);this.app.store.transaction(()=>{ensure(this.valid(a),'LEASE_EXPIRED','旧 Worker 不能保存当前会话输出');this.app.store.event(s.projectId, 'session.delta', { sessionId: s.id, generation:a.generation,text:text.slice(0,4000),truncated:text.length>4000 });});
        }
        if(m?.type==='input_consumed'&&a.messageIds.includes(m.messageId)&&a.sent.has(m.messageId))a.consumedIds.add(m.messageId);
        if(m?.type==='control_error'&&a.messageIds.includes(m.messageId))this.failInput(a,m.messageId,clean(String(m.error??'Worker 未接受输入')));
        if (m?.type === 'message_ack' && !a.messageIds.includes(m.messageId) && a.actor.taskId && a.sent.has(m.messageId)) {
            const d=this.app.store.maybe<any>('directive',m.messageId);
            if(d&&d.projectId===s.projectId&&d.taskIds.includes(s.taskId)&&!d.deliveredSessionIds.includes(s.id))this.app.store.update('directive',d.id,d.version,{deliveredSessionIds:[...d.deliveredSessionIds,s.id]});
        }
    }
    private failInput(a:Active,id:string,error:string){
        this.app.store.transaction(()=>{const m=this.app.store.get<Message>('message',id);if(m.sessionId===a.sessionId&&m.status==='running')this.app.store.update<Message>('message',id,m.version,{status:'failed',error});});
    }
    private sendInput(a:Active,payload:Record<string,unknown>,messageId?:string){
        const failed=(error:Error|null)=>{if(!error)return;if(messageId)this.failInput(a,messageId,clean(error.message));if(payload.type==='start')this.finish(a,clean(error.message));};
        try{a.child.send(payload,failed);}catch(error){failed(error as Error);}
    }
    private savePath(a: Active, file: string, root: string) { const rel = relative(resolve(root), resolve(file)); ensure(rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) && file.endsWith('.jsonl'), 'SESSION_PATH_INVALID', 'Pi Session 路径超出受控目录'); const s = this.app.store.get<Session>('session', a.sessionId); if(a.actor?.wakeupId){const w=this.app.wakeups.get(SYSTEM,a.actor.wakeupId);if(w.sourceKind==='run-result'){this.app.store.update<Wakeup>('wakeup',w.id,w.version,{analysisSessionPath:this.app.store.paths.reference(resolve(file))});return;}} if(s.piSessionPath&&this.app.store.paths.same(s.piSessionPath,resolve(file)))return;this.app.store.update<Session>('session', s.id, s.version, { piSessionPath: this.app.store.paths.reference(resolve(file)) }); }
    private abortProcess(a: Active, error = '会话已中止或任务已失效') {
        if (a.ended || a.stopError)
            return;
        a.stopError = error;
        if (a.child.connected)
            a.child.send({ type: 'abort' });
        const timer = setTimeout(() => {
            if (!a.ended)
                a.child.kill('SIGTERM');
        }, 1500);
        timer.unref();
    }
    private finish(a: Active, error?: string) {
        if (a.ended)
            return;
        error = error ?? a.providerError ?? a.stopError ?? (a.actor.wakeupId && !a.assistantOutput ? 'Pi 已结束但没有可展示的最终分析；请核对后重试' : undefined) ?? (this.valid(a) ? undefined : '会话已中止或自动分析来源已失效');
        const missingResult = !error && a.attemptId && this.app.store.get<TaskAttempt>('task-attempt', a.attemptId).state === 'running';
        if (missingResult) error = 'Pi 结束但没有提交结构化结果';
        a.ended = true;
        const store = this.app.store;
        store.transaction(() => {
            this.admission.stopping(a.admissionId,this.ownerHost,a.generation);
            const s = store.get<Session>('session', a.sessionId);
            if (a.attemptId) {
                const attempt = store.get<TaskAttempt>('task-attempt', a.attemptId);
                if (attempt.state === 'running')
                    this.app.teams.fail(a.attemptId, error!, !missingResult);
            }
            if (a.actor.wakeupId) {const wakeup=this.app.wakeups.get(SYSTEM,a.actor.wakeupId);if(wakeup.generation===a.generation)this.app.wakeups.finish(a.actor.wakeupId, error, !!error);}
            for (const id of a.messageIds) {
                const m = store.get<Message>('message', id);
                if (m.status === 'running')
                    store.update<Message>('message', m.id, m.version, { status: error||!a.consumedIds.has(id) ? 'failed' : 'completed', error:error??(a.consumedIds.has(id)?undefined:'未确认处理，请核对后重试') });
            }
            if (s.generation === a.generation && s.state === 'running') {
                const queued = this.app.sessions.messages(SYSTEM, s.id).some(m => m.status === 'queued');
                store.update<Session>('session', s.id, s.version, { state: queued ? 'queued' : error ? 'failed' : 'idle', leaseUntil: 0, lastError: error });
            }
            store.event(s.projectId, 'agent.finished', { sessionId: s.id, generation:a.generation,error: error ?? null, attemptId: a.attemptId ?? null });
        });
        if (!a.exitObserved) {
            if (a.child.connected) a.child.disconnect();
            a.child.kill('SIGTERM');
        }
    }
    async stop() {
        this.stopped = true;
        if (this.timer)
            clearInterval(this.timer);
        const stopping=[...this.active.values()];
        const exits=stopping.map(a=>new Promise<void>(resolve=>{if(a.child.exitCode!==null||a.child.signalCode!==null){resolve();return;}const done=()=>{clearTimeout(force);clearTimeout(deadline);a.child.off('exit',done);a.child.off('close',done);resolve();};a.child.once('exit',done);a.child.once('close',done);const force=setTimeout(()=>a.child.kill('SIGKILL'),2000),deadline=setTimeout(done,4000);}));
        for (const a of stopping) {
            this.abortProcess(a);
            this.finish(a, '控制服务关闭；Agent 停止，正式实验不受影响');
        }
        await Promise.all(exits);
        await this.app.git.stop();
        await this.app.documentParsing.stop();
        await this.app.publicationBuilds.stop();
        await this.app.compute.stop();
    }
}
