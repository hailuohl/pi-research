import { prepareSessionSkills } from '../skills/runtime.js';
import { fork } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { SYSTEM } from '../domain/types.js';
import { ToolDispatcher } from '../research-tools/dispatcher.js';
import { inspectPi } from '../pi-adapter/runtime.js';
import { asError, ensure, DomainError } from '../domain/errors.js';
import { assertWorkspaceReady } from '../workspace/git-service.js';
import { randomUUID } from 'node:crypto';
const redact = (s) => s.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]').replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]');
const clean = (s) => redact(s).slice(0, 32000);
export class AgentHost {
    app;
    dependencies;
    tools;
    active = new Map();
    timer;
    ticking = false;
    stopped = false;
    ownerHost = randomUUID();
    admission;
    constructor(app, dependencies = {}) {
        this.app = app;
        this.dependencies = dependencies;
        this.tools = new ToolDispatcher(app);
        this.admission = app.agentAdmission;
    }
    inspect(model) { return (this.dependencies.inspect ?? inspectPi)(this.app.context.repoRoot, model); }
    status() { const capacity = this.admission.snapshot(); return { ...this.inspect(this.app.sessions.model()), activeWorkers: capacity.counts.held, maxModelWorkers: capacity.maxWorkers, workerCapacity: capacity, workerUnit: 'pi-worker', httpConcurrencyMeasured: false, toolIsolation: 'host-allowlist-no-shell', osSandboxVerified: false }; }
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
    ensureReady(session) {
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
                if (active.ended || active.exitObserved || active.stopError)
                    continue;
                const s = this.app.store.get('session', active.sessionId);
                const a = active.attemptId ? this.app.store.get('task-attempt', active.attemptId) : null;
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
                        try {
                            this.app.teams.active(active.actor);
                        }
                        catch (error) {
                            this.abortProcess(active, clean(asError(error).message));
                            continue;
                        }
                    }
                    this.app.store.transaction(() => { this.admission.heartbeat(active.admissionId, this.ownerHost, active.generation); const latest = this.app.store.get('session', s.id); ensure(latest.generation === active.generation, 'LEASE_EXPIRED', '会话已失效'); this.app.store.update('session', latest.id, latest.version, { leaseUntil: Date.now() + 30000 }); if (a)
                        this.app.teams.heartbeat(a.id); });
                    active.lastHeartbeat = Date.now();
                }
                if (!s.taskId && !active.actor.wakeupId)
                    for (const m of this.app.sessions.messages(SYSTEM, s.id).filter(m => m.role === 'user' && m.status === 'queued' && ['steer', 'follow_up'].includes(m.mode))) {
                        if (active.sent.has(m.id))
                            continue;
                        active.sent.add(m.id);
                        active.child.send({ type: m.mode, content: m.content, messageId: m.id });
                    }
                if (s.taskId && a?.state === 'running')
                    for (const d of this.app.store.list('directive', s.projectId).filter(d => d.kind !== 'revise' && d.taskIds.includes(s.taskId) && !d.deliveredSessionIds.includes(s.id))) {
                        if (active.sent.has(d.id))
                            continue;
                        active.sent.add(d.id);
                        active.child.send({ type: d.kind, content: d.content, messageId: d.id });
                    }
            }
            // Recover abandoned single writers, but never retry a possibly paid request automatically.
            for (const s of this.app.store.list('session').filter(s => s.state === 'running' && !this.active.has(s.id) && s.leaseUntil < Date.now())) {
                this.app.store.transaction(() => {
                    const latest = this.app.store.get('session', s.id);
                    if (latest.state !== 'running' || latest.leaseUntil >= Date.now())
                        return;
                    this.app.store.update('session', s.id, latest.version, { state: 'failed', lastError: '会话租约过期；请核对后显式重试', generation: latest.generation + 1, leaseUntil: 0 });
                    for (const m of this.app.sessions.messages(SYSTEM, s.id).filter(m => m.status === 'running'))
                        this.app.store.update('message', m.id, m.version, { status: 'failed', error: '进程中断，用量待对账' });
                });
            }
            this.app.wakeups.reconcile();
            if (!this.admission.snapshot().available)
                return;
            for (const s of this.app.store.list('session').filter(s => !s.taskId && s.state === 'queued')) {
                if (!this.admission.snapshot().available)
                    break;
                if (!this.inspect(s.model).ready)
                    continue;
                try {
                    assertWorkspaceReady(this.app.context, s.id);
                }
                catch {
                    continue;
                }
                const messages = this.app.sessions.messages(SYSTEM, s.id).filter(m => m.status === 'queued');
                const next = messages.find(m => m.role === 'user') ?? messages.find(m => m.origin === 'automation');
                if (next) {
                    try {
                        this.launch(s, next.content, next.id);
                    }
                    catch (error) {
                        const e = asError(error), latest = this.app.store.get('session', s.id);
                        this.app.store.update('session', s.id, latest.version, { state: 'failed', lastError: `${e.code} — ${e.message}` });
                    }
                }
            }
            for (const w of this.app.store.list('wakeup').filter(w => w.state === 'pending')) {
                if (!this.admission.snapshot().available)
                    break;
                const root = this.app.sessions.get(SYSTEM, w.rootSessionId);
                try {
                    assertWorkspaceReady(this.app.context, root.id);
                }
                catch {
                    continue;
                }
                try {
                    const dispatch = this.app.store.transaction(() => { if (this.admission.sessionHeld(root.id) || !this.admission.check(root.projectId, root.role))
                        return null; const dispatched = this.app.wakeups.dispatch(w.id, this.inspect(root.model)); if (!dispatched)
                        return null; const prepared = this.claimSession(this.app.sessions.get(SYSTEM, root.id), dispatched.message.id); ensure(prepared, 'AGENT_CAPACITY_CHANGED', 'Worker 准入未完成'); return { dispatched, prepared }; });
                    if (dispatch)
                        this.launch(dispatch.prepared.session, dispatch.dispatched.message.content, dispatch.dispatched.message.id, undefined, dispatch.prepared);
                }
                catch (error) {
                    const e = asError(error), latest = this.app.store.get('wakeup', w.id);
                    if (latest.blockReason !== `${e.code} — ${e.message}`)
                        this.app.store.update('wakeup', w.id, latest.version, { blockReason: `${e.code} — ${e.message}` });
                }
            }
            for (const team of this.app.store.list('team').filter(t => t.state === 'active')) {
                if (!this.admission.snapshot().available)
                    break;
                const root = this.app.store.get('session', team.rootSessionId);
                const dispatch = this.app.store.transaction(() => {
                    if (!this.admission.check(team.projectId, 'implementer', team.id))
                        return null;
                    const claimed = this.app.teams.claim(team.id, !this.inspect(root.model).ready);
                    if (!claimed)
                        return null;
                    const s = this.app.store.get('session', claimed.attempt.sessionId), prepared = this.claimSession(s, undefined, claimed.attempt);
                    ensure(prepared, 'AGENT_CAPACITY_CHANGED', 'Worker 准入未完成');
                    return { claimed, prepared };
                });
                if (dispatch) {
                    this.launch(dispatch.prepared.session, JSON.stringify(dispatch.claimed.context, null, 2), undefined, dispatch.claimed.attempt, dispatch.prepared);
                }
            }
        }
        finally {
            this.ticking = false;
        }
    }
    claimSession(session, messageId, attempt) {
        const store = this.app.store;
        return store.transaction(() => {
            const latest = store.get('session', session.id);
            assertWorkspaceReady(this.app.context, latest.id);
            if (['running', 'archived'].includes(latest.state))
                return null;
            const slot = this.admission.tryAcquire(latest, latest.generation + 1, this.ownerHost, attempt?.teamId);
            if (!slot)
                return null;
            const next = store.update('session', latest.id, latest.version, { state: 'running', generation: latest.generation + 1, leaseUntil: Date.now() + 30000, lastError: undefined });
            if (messageId) {
                const m = store.get('message', messageId);
                ensure(m.status === 'queued' && m.sessionId === next.id, 'MESSAGE_STALE', '消息已失效');
                store.update('message', m.id, m.version, { status: 'running' });
                if (m.wakeupId)
                    this.app.wakeups.markStarted(m.wakeupId, next.id, next.generation, m.id);
            }
            const wakeupId = messageId ? store.get('message', messageId).wakeupId : undefined;
            const actor = { type: 'agent', projectId: next.projectId, sessionId: next.id, role: next.role, generation: attempt?.generation ?? next.generation, ...(attempt ? { taskId: attempt.taskId, attemptId: attempt.id } : {}), ...(wakeupId ? { wakeupId } : {}) };
            // Resolve against the pre-claim generation; the whole claim rolls back on missing capability.
            const bundleId = prepareSessionSkills(this.app, latest, actor);
            ensure(!attempt || attempt.skillBundleId === bundleId, 'SKILL_BINDING_MISMATCH', '任务与会话技能包不一致');
            const bound = store.update('session', next.id, next.version, { skillBundleId: bundleId });
            store.event(next.projectId, 'session.skill_bundle_bound', { sessionId: next.id, generation: next.generation, bundleId });
            return { session: bound, slot };
        });
    }
    launch(session, prompt, messageId, attempt, prepared) {
        const reservation = prepared ?? this.claimSession(session, messageId, attempt);
        if (!reservation)
            return;
        const { session: claimed, slot } = reservation, store = this.app.store;
        const wakeupId = messageId ? store.get('message', messageId).wakeupId : undefined;
        const actor = { ...(wakeupId ? { wakeupId } : {}), type: 'agent', projectId: claimed.projectId, sessionId: claimed.id, role: claimed.role, generation: attempt?.generation ?? claimed.generation, ...(attempt ? { taskId: attempt.taskId, attemptId: attempt.id } : {}) };
        let active, requested = false;
        try {
            const bundleId = prepareSessionSkills(this.app, claimed, actor);
            const skillBundle = this.app.skills.bundleBootstrap(claimed.projectId, claimed.role, bundleId);
            this.ensureReady(claimed);
            const home = join(this.app.context.dataDir, 'sessions', claimed.id), agentDir = join(home, 'agent'), sessionDir = join(home, 'pi');
            mkdirSync(agentDir, { recursive: true, mode: 0o700 });
            mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
            const env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, HOME: home, USERPROFILE: home, PI_API_KEY: process.env.PI_API_KEY, NO_COLOR: '1' };
            // Only the selected model credential enters a worker. No SSH/cloud credentials or inherited Node flags.
            const child = store.transaction(() => {
                // Serialize the final revocation check with process creation across controllers.
                this.app.skills.ensureBundleStartAllowed(claimed.projectId, bundleId);
                const marked = this.admission.markSpawnRequested(slot.id, this.ownerHost, claimed.generation);
                store.update('agent-admission', marked.id, marked.version, { httpManagedVersion: 1 });
                requested = true;
                return (this.dependencies.fork ?? fork)(this.dependencies.workerEntry ?? join(this.app.context.repoRoot, 'dist/apps/agent-worker/index.js'), [], { cwd: claimed.workspace, env, execArgv: [], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
            });
            const worker = { admissionId: slot.id, child, sessionId: claimed.id, generation: claimed.generation, actor, messageIds: messageId ? [messageId] : [], attemptId: attempt?.id, started: Date.now(), lastHeartbeat: Date.now(), sent: new Set(), ended: false };
            active = worker;
            this.active.set(claimed.id, worker);
            child.stdout?.on('data', () => { });
            child.stderr?.on('data', () => { });
            child.on('message', raw => { void this.onMessage(worker, raw, sessionDir).catch(e => this.finish(worker, clean(asError(e).message))); });
            child.on('error', e => this.finish(worker, clean(e.message)));
            // exit can precede buffered IPC messages; close confirms those messages have drained.
            child.once('exit', code => { worker.exitObserved = true; if (worker.ended)
                this.exited(worker, code); });
            child.once('close', code => { if (this.active.get(worker.sessionId) === worker)
                this.exited(worker, code); });
            this.admission.markRunning(slot.id, this.ownerHost, claimed.generation, child.pid);
            const hostMessages = !wakeupId && !attempt ? this.app.sessions.pendingNotices(claimed.id) : [];
            worker.contextMessageIds = hostMessages.map(m => m.id);
            const history = !claimed.piSessionPath ? this.app.sessions.messages(SYSTEM, claimed.id).filter(m => m.status === 'completed' && (m.role !== 'system' || m.origin === 'automation')).map(m => ({ role: m.role, content: m.content })) : [];
            child.send({ type: 'start', managedHttp: true, skillBundle, repoRoot: this.app.context.repoRoot, workspace: claimed.workspace, agentDir, sessionDir, modelsPath: join(this.app.context.dataDir, 'models.json'), piSessionPath: claimed.piSessionPath, role: claimed.role, model: claimed.model, tools: this.tools.definitions(claimed.role, !!wakeupId), history: history.length ? JSON.stringify(history) : null, hostMessages, prompt });
            store.event(claimed.projectId, 'agent.started', { sessionId: claimed.id, generation: claimed.generation, attemptId: attempt?.id });
        }
        catch (error) {
            const failure = asError(error), startError = `${failure.code} — ${failure.message}`;
            if (active) {
                this.finish(active, clean(error.message));
                return;
            }
            store.transaction(() => { this.admission.release(slot.id, this.ownerHost, claimed.generation, requested ? 'synchronous-fork-failure' : 'not-forked'); if (attempt)
                this.app.teams.fail(attempt.id, startError, false, true); if (messageId) {
                const m = store.get('message', messageId);
                if (m.status === 'running')
                    store.update('message', m.id, m.version, { status: 'failed', error: startError });
            } if (wakeupId) {
                const w = this.app.wakeups.get(SYSTEM, wakeupId);
                store.update('wakeup', w.id, w.version, { state: 'queued', attempts: Math.max(0, w.attempts - 1) });
                this.app.wakeups.finish(w.id, startError, false);
            } const latest = store.get('session', claimed.id); if (latest.generation === claimed.generation)
                store.update('session', latest.id, latest.version, { state: 'failed', leaseUntil: 0, lastError: startError }); });
        }
    }
    exited(a, code) {
        try {
            if (!a.ended)
                this.finish(a, `Worker 退出（${code}）；请求或工具用量可能需要对账`);
            this.app.modelHttp.workerExited(a.admissionId, this.ownerHost, a.generation);
            this.admission.release(a.admissionId, this.ownerHost, a.generation, 'confirmed-exit');
        }
        finally {
            if (this.active.get(a.sessionId) === a)
                this.active.delete(a.sessionId);
        }
    }
    valid(a) {
        if (a.admissionId) {
            try {
                this.admission.assertOwned(a.admissionId, this.ownerHost, a.generation);
            }
            catch {
                return false;
            }
        }
        const s = this.app.store.get('session', a.sessionId);
        if (s.generation !== a.generation || s.state !== 'running' || s.leaseUntil <= Date.now())
            return false;
        if (a.actor.taskId) {
            const task = this.app.store.get('task', a.actor.taskId);
            if (task.execution === 'superseded' || task.generation !== a.actor.generation || task.attemptId !== a.actor.attemptId)
                return false;
            const attempt = this.app.store.get('task-attempt', a.actor.attemptId);
            if (attempt.taskId !== task.id || attempt.sessionId !== s.id || attempt.generation !== a.actor.generation)
                return false;
            if (attempt.state !== 'running' && attempt.state !== 'finished')
                return false;
            if (attempt.state === 'running' && (task.execution !== 'running' || attempt.leaseUntil <= Date.now()))
                return false;
        }
        if (a.actor.wakeupId) {
            try {
                this.app.wakeups.assertActive(a.actor);
            }
            catch {
                return false;
            }
        }
        return true;
    }
    async onMessage(a, m, sessionDir) {
        if (m?.type === 'model_http_acquire' || m?.type === 'model_http_finish') {
            const identity = { admissionId: a.admissionId, ownerHost: this.ownerHost, sessionId: a.sessionId, generation: a.generation };
            try {
                let result;
                if (m.type === 'model_http_acquire') {
                    result = this.app.store.transaction(() => {
                        ensure(!a.ended && !a.exitObserved && !a.stopError && this.valid(a), 'MODEL_HTTP_SCOPE_EXPIRED', '会话已停止，不能外发模型请求');
                        if (a.actor.taskId)
                            this.app.teams.active(a.actor);
                        return this.app.modelHttp.acquire(identity, m.key);
                    });
                }
                else
                    result = this.app.modelHttp.finish(identity, m.key, m.result);
                if (!a.exitObserved && a.child.connected)
                    a.child.send({ type: 'model_http_response', requestId: m.requestId, result: result ?? null });
            }
            catch (error) {
                if (!a.exitObserved && a.child.connected) {
                    const e = asError(error);
                    a.child.send({ type: 'model_http_response', requestId: m.requestId, error: { code: e.code, message: clean(e.message) } });
                }
            }
            return;
        }
        if (a.ended)
            return;
        if (m?.type === 'tool') {
            if (a.exitObserved)
                return;
            try {
                ensure(!a.stopError && this.valid(a), 'LEASE_EXPIRED', '会话已中止');
                // Cached reads also require current inputs while a task is running; finished submit receipts may drain.
                if (a.attemptId && this.app.store.get('task-attempt', a.attemptId).state === 'running')
                    this.app.teams.active(a.actor);
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
        const s = this.app.store.get('session', a.sessionId);
        if (m?.type === 'context_ack') {
            ensure(Array.isArray(m.messageIds) && m.messageIds.every((id) => typeof id === 'string' && a.contextMessageIds?.includes(id)), 'SCOPE_DENIED', '不能确认未投递的上下文通知', 403);
            this.app.store.transaction(() => this.app.sessions.acknowledgeNotices(s.id, m.messageIds));
        }
        if (m?.type === 'ready') {
            ensure(m.model?.provider === s.model.provider && m.model?.id === s.model.model, 'MODEL_FALLBACK_REFUSED', 'Pi 尝试切换未经批准的模型');
            if (m.sessionFile)
                this.savePath(a, String(m.sessionFile), sessionDir);
        }
        if (m?.type === 'assistant_message') {
            if (m.error)
                a.providerError = clean(String(m.error));
            else if (typeof m.content === 'string' && m.content.trim())
                a.assistantOutput = true;
            const content = redact(String(m.content ?? ''));
            this.app.store.transaction(() => {
                ensure(this.valid(a), 'LEASE_EXPIRED', '旧 Worker 不能保存当前会话输出');
                const record = this.app.store.create('message', s.projectId, { sessionId: s.id, ...(a.actor.wakeupId ? { origin: 'automation', wakeupId: a.actor.wakeupId } : {}), role: 'assistant', content: content.slice(0, 32000), ...(content.length > 32000 ? { contentTruncated: true } : {}), mode: 'prompt', status: m.error ? 'failed' : 'completed', error: m.error ? clean(String(m.error)) : undefined, usage: m.usage });
                this.app.store.event(s.projectId, 'session.message_completed', { sessionId: s.id, generation: s.generation, messageId: record.id });
                this.app.store.create('model-usage', s.projectId, { sessionId: s.id, attemptId: a.attemptId ?? null, provider: s.model.provider, model: s.model.model, usage: m.usage, status: m.usage ? 'reported' : 'unknown', stopReason: m.stopReason ?? null });
            });
        }
        if (m?.type === 'delta' && typeof m.text === 'string') {
            const text = redact(m.text);
            this.app.store.transaction(() => { ensure(this.valid(a), 'LEASE_EXPIRED', '旧 Worker 不能保存当前会话输出'); this.app.store.event(s.projectId, 'session.delta', { sessionId: s.id, generation: a.generation, text: text.slice(0, 4000), truncated: text.length > 4000 }); });
        }
        if (m?.type === 'message_ack') {
            const msg = this.app.store.maybe('message', m.messageId);
            if (msg && msg.sessionId === s.id && msg.status === 'queued') {
                this.app.store.update('message', msg.id, msg.version, { status: 'running' });
                a.messageIds.push(msg.id);
            }
            else {
                const d = this.app.store.maybe('directive', m.messageId);
                if (d)
                    this.app.store.update('directive', d.id, d.version, { deliveredSessionIds: [...d.deliveredSessionIds, s.id] });
            }
        }
    }
    savePath(a, file, root) { const rel = relative(resolve(root), resolve(file)); ensure(rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) && file.endsWith('.jsonl'), 'SESSION_PATH_INVALID', 'Pi Session 路径超出受控目录'); const s = this.app.store.get('session', a.sessionId); this.app.store.update('session', s.id, s.version, { piSessionPath: resolve(file) }); }
    abortProcess(a, error = '会话已中止或任务已失效') {
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
    finish(a, error) {
        if (a.ended)
            return;
        error = error ?? a.providerError ?? a.stopError ?? (a.actor.wakeupId && !a.assistantOutput ? 'Pi 已结束但没有可展示的最终分析；请核对后重试' : undefined) ?? (this.valid(a) ? undefined : '会话已中止或自动分析来源已失效');
        const missingResult = !error && a.attemptId && this.app.store.get('task-attempt', a.attemptId).state === 'running';
        if (missingResult)
            error = 'Pi 结束但没有提交结构化结果';
        a.ended = true;
        const store = this.app.store;
        store.transaction(() => {
            this.admission.stopping(a.admissionId, this.ownerHost, a.generation);
            const s = store.get('session', a.sessionId);
            if (a.attemptId) {
                const attempt = store.get('task-attempt', a.attemptId);
                if (attempt.state === 'running')
                    this.app.teams.fail(a.attemptId, error, !missingResult);
            }
            if (a.actor.wakeupId) {
                const wakeup = this.app.wakeups.get(SYSTEM, a.actor.wakeupId);
                if (wakeup.generation === a.generation)
                    this.app.wakeups.finish(a.actor.wakeupId, error, !!error);
            }
            for (const id of a.messageIds) {
                const m = store.get('message', id);
                if (m.status === 'running')
                    store.update('message', m.id, m.version, { status: error ? 'failed' : 'completed', error });
            }
            if (s.generation === a.generation && s.state === 'running') {
                const queued = this.app.sessions.messages(SYSTEM, s.id).some(m => m.status === 'queued');
                store.update('session', s.id, s.version, { state: queued ? 'queued' : error ? 'failed' : 'idle', leaseUntil: 0, lastError: error });
            }
            store.event(s.projectId, 'agent.finished', { sessionId: s.id, generation: a.generation, error: error ?? null, attemptId: a.attemptId ?? null });
        });
        if (!a.exitObserved) {
            if (a.child.connected)
                a.child.disconnect();
            a.child.kill('SIGTERM');
        }
    }
    async stop() {
        this.stopped = true;
        if (this.timer)
            clearInterval(this.timer);
        const stopping = [...this.active.values()];
        const exits = stopping.map(a => new Promise(resolve => { if (a.child.exitCode !== null || a.child.signalCode !== null) {
            resolve();
            return;
        } const done = () => { clearTimeout(force); clearTimeout(deadline); a.child.off('exit', done); a.child.off('close', done); resolve(); }; a.child.once('exit', done); a.child.once('close', done); const force = setTimeout(() => a.child.kill('SIGKILL'), 2000), deadline = setTimeout(done, 4000); }));
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
//# sourceMappingURL=agent-host.js.map