import { fork } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { SYSTEM } from '../domain/types.js';
import { ToolDispatcher } from '../research-tools/dispatcher.js';
import { inspectPi } from '../pi-adapter/runtime.js';
import { asError, ensure, DomainError } from '../domain/errors.js';
const clean = (s) => s.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]').replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]').slice(0, 32000);
export class AgentHost {
    app;
    dependencies;
    tools;
    active = new Map();
    timer;
    ticking = false;
    stopped = false;
    constructor(app, dependencies = {}) {
        this.app = app;
        this.dependencies = dependencies;
        this.tools = new ToolDispatcher(app);
    }
    inspect(model) { return (this.dependencies.inspect ?? inspectPi)(this.app.context.repoRoot, model); }
    status() { return { ...this.inspect(this.app.sessions.model()), activeWorkers: this.active.size, maxModelWorkers: 2, toolIsolation: 'host-allowlist-no-shell', osSandboxVerified: false }; }
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
            this.app.runs.reconcile();
            this.app.runs.launchPending();
            this.app.teams.recover();
            this.app.campaigns.observe();
            this.app.wakeups.reconcile();
            for (const active of this.active.values()) {
                const s = this.app.store.get('session', active.sessionId);
                const a = active.attemptId ? this.app.store.get('task-attempt', active.attemptId) : null;
                if (!this.valid(active) || a && a.state !== 'running' || Date.now() - active.started > 300000) {
                    this.abortProcess(active);
                    continue;
                }
                if (Date.now() - active.lastHeartbeat > 3000) {
                    this.app.store.update('session', s.id, s.version, { leaseUntil: Date.now() + 30000 });
                    if (a)
                        this.app.teams.heartbeat(a.id);
                    active.lastHeartbeat = Date.now();
                }
                if (!s.taskId && !active.actor.wakeupId)
                    for (const m of this.app.sessions.messages(SYSTEM, s.id).filter(m => m.role === 'user' && m.status === 'queued' && ['steer', 'follow_up'].includes(m.mode))) {
                        if (active.sent.has(m.id))
                            continue;
                        active.sent.add(m.id);
                        active.child.send({ type: m.mode, content: m.content, messageId: m.id });
                    }
                if (s.taskId)
                    for (const d of this.app.store.list('directive', s.projectId).filter(d => d.kind !== 'revise' && d.taskIds.includes(s.taskId) && !d.deliveredSessionIds.includes(s.id))) {
                        if (active.sent.has(d.id))
                            continue;
                        active.sent.add(d.id);
                        active.child.send({ type: d.kind, content: d.content, messageId: d.id });
                    }
            }
            // Recover abandoned single writers, but never retry a possibly paid request automatically.
            for (const s of this.app.store.list('session').filter(s => s.state === 'running' && !this.active.has(s.id) && s.leaseUntil < Date.now())) {
                this.app.store.update('session', s.id, s.version, { state: 'failed', lastError: '会话租约过期；请核对后显式重试', generation: s.generation + 1, leaseUntil: 0 });
                for (const m of this.app.sessions.messages(SYSTEM, s.id).filter(m => m.status === 'running'))
                    this.app.store.update('message', m.id, m.version, { status: 'failed', error: '进程中断，用量待对账' });
            }
            this.app.wakeups.reconcile();
            if (this.active.size >= 2)
                return;
            for (const s of this.app.store.list('session').filter(s => !s.taskId && s.state === 'queued')) {
                if (this.active.size >= 2)
                    break;
                if (!this.inspect(s.model).ready)
                    continue;
                const messages = this.app.sessions.messages(SYSTEM, s.id).filter(m => m.status === 'queued');
                const next = messages.find(m => m.role === 'user') ?? messages.find(m => m.origin === 'automation');
                if (next)
                    this.launch(s, next.content, next.id);
            }
            for (const w of this.app.store.list('wakeup').filter(w => w.state === 'pending')) {
                if (this.active.size >= 2)
                    break;
                const root = this.app.sessions.get(SYSTEM, w.rootSessionId);
                const dispatched = this.app.wakeups.dispatch(w.id, this.inspect(root.model));
                if (dispatched)
                    this.launch(this.app.sessions.get(SYSTEM, root.id), dispatched.message.content, dispatched.message.id);
            }
            for (const team of this.app.store.list('team').filter(t => t.state === 'active')) {
                if (this.active.size >= 2)
                    break;
                const root = this.app.store.get('session', team.rootSessionId);
                if (!this.inspect(root.model).ready)
                    continue;
                const claimed = this.app.teams.claim(team.id);
                if (claimed) {
                    const s = this.app.store.get('session', claimed.attempt.sessionId);
                    this.launch(s, JSON.stringify(claimed.context, null, 2), undefined, claimed.attempt);
                }
            }
        }
        finally {
            this.ticking = false;
        }
    }
    launch(session, prompt, messageId, attempt) {
        const skillBundle = this.app.skills.bootstrap(session.role);
        this.ensureReady(session);
        const store = this.app.store;
        const claimed = store.transaction(() => {
            const latest = store.get('session', session.id);
            ensure(!['running', 'archived'].includes(latest.state), 'SESSION_BUSY', '会话已有有效写入者');
            const next = store.update('session', latest.id, latest.version, { state: 'running', generation: latest.generation + 1, leaseUntil: Date.now() + 30000, lastError: undefined });
            if (messageId) {
                const m = store.get('message', messageId);
                ensure(m.status === 'queued' && m.sessionId === next.id, 'MESSAGE_STALE', '消息已失效');
                store.update('message', m.id, m.version, { status: 'running' });
                if (m.wakeupId)
                    this.app.wakeups.markStarted(m.wakeupId, next.id, next.generation, m.id);
            }
            return next;
        });
        const wakeupId = messageId ? store.get('message', messageId).wakeupId : undefined;
        const actor = { ...(wakeupId ? { wakeupId } : {}), type: 'agent', projectId: claimed.projectId, sessionId: claimed.id, role: claimed.role, generation: attempt?.generation ?? claimed.generation, ...(attempt ? { taskId: attempt.taskId, attemptId: attempt.id } : {}) };
        const home = join(this.app.context.dataDir, 'sessions', claimed.id), agentDir = join(home, 'agent'), sessionDir = join(home, 'pi');
        mkdirSync(agentDir, { recursive: true, mode: 0o700 });
        mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
        const env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, HOME: home, USERPROFILE: home, PI_API_KEY: process.env.PI_API_KEY, NO_COLOR: '1' };
        // Only the selected model credential enters a worker. No SSH/cloud credentials or inherited Node flags.
        const child = fork(this.dependencies.workerEntry ?? join(this.app.context.repoRoot, 'dist/apps/agent-worker/index.js'), [], { cwd: claimed.workspace, env, execArgv: [], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
        const active = { child, sessionId: claimed.id, generation: claimed.generation, actor, messageIds: messageId ? [messageId] : [], attemptId: attempt?.id, started: Date.now(), lastHeartbeat: Date.now(), sent: new Set(), ended: false };
        this.active.set(claimed.id, active);
        child.stdout?.on('data', () => { });
        child.stderr?.on('data', () => { });
        child.on('message', raw => { void this.onMessage(active, raw, sessionDir).catch(e => this.finish(active, clean(asError(e).message))); });
        child.on('error', e => this.finish(active, clean(e.message)));
        child.on('exit', (code) => {
            if (!active.ended)
                this.finish(active, `Worker 退出（${code}）；请求或工具用量可能需要对账`);
        });
        const hostMessages = !wakeupId && !attempt ? this.app.sessions.pendingNotices(claimed.id) : [];
        active.contextMessageIds = hostMessages.map(m => m.id);
        const history = !claimed.piSessionPath ? this.app.sessions.messages(SYSTEM, claimed.id).filter(m => m.status === 'completed' && (m.role !== 'system' || m.origin === 'automation')).map(m => ({ role: m.role, content: m.content })) : [];
        this.app.store.event(claimed.projectId, 'session.skill_bundle_bound', { sessionId: claimed.id, generation: claimed.generation, bundleId: skillBundle.bundleId });
        child.send({ type: 'start', skillBundle, repoRoot: this.app.context.repoRoot, workspace: claimed.workspace, agentDir, sessionDir, modelsPath: join(this.app.context.dataDir, 'models.json'), piSessionPath: claimed.piSessionPath, role: claimed.role, model: claimed.model, tools: this.tools.definitions(claimed.role, !!wakeupId), history: history.length ? JSON.stringify(history) : null, hostMessages, prompt });
        store.event(claimed.projectId, 'agent.started', { sessionId: claimed.id, attemptId: attempt?.id });
    }
    valid(a) {
        const s = this.app.store.get('session', a.sessionId);
        if (s.generation !== a.generation || s.state !== 'running')
            return false;
        if (a.actor.taskId) {
            const task = this.app.store.get('task', a.actor.taskId);
            if (task.execution === 'superseded' || task.generation !== a.actor.generation || task.attemptId !== a.actor.attemptId)
                return false;
            const state = this.app.store.get('task-attempt', a.actor.attemptId).state;
            if (state !== 'running' && state !== 'finished')
                return false;
            if (state === 'running') {
                try {
                    this.app.teams.active(a.actor);
                }
                catch {
                    return false;
                }
            }
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
        if (a.ended)
            return;
        if (m?.type === 'tool') {
            try {
                ensure(this.valid(a), 'LEASE_EXPIRED', '会话已中止');
                const result = await this.tools.execute(a.actor, String(m.tool), m.input, String(m.toolCallId));
                if (a.child.connected)
                    a.child.send({ type: 'tool_response', requestId: m.requestId, result });
            }
            catch (e) {
                const error = asError(e);
                if (a.child.connected)
                    a.child.send({ type: 'tool_response', requestId: m.requestId, error: { code: error.code, message: clean(error.message) } });
            }
            return;
        }
        if (m?.type === 'done') {
            if (m.sessionFile && this.valid(a))
                this.savePath(a, String(m.sessionFile), sessionDir);
            this.finish(a, m.aborted && !a.attemptId ? 'Agent 已中止' : undefined);
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
            const record = this.app.store.create('message', s.projectId, { sessionId: s.id, ...(a.actor.wakeupId ? { origin: 'automation', wakeupId: a.actor.wakeupId } : {}), role: 'assistant', content: clean(String(m.content ?? '')), mode: 'prompt', status: m.error ? 'failed' : 'completed', error: m.error ? clean(String(m.error)) : undefined, usage: m.usage });
            this.app.store.event(s.projectId, 'session.message_completed', { sessionId: s.id, messageId: record.id });
            this.app.store.create('model-usage', s.projectId, { sessionId: s.id, attemptId: a.attemptId ?? null, provider: s.model.provider, model: s.model.model, usage: m.usage, status: m.usage ? 'reported' : 'unknown', stopReason: m.stopReason ?? null });
        }
        if (m?.type === 'delta' && typeof m.text === 'string')
            this.app.store.event(s.projectId, 'session.delta', { sessionId: s.id, text: clean(m.text.slice(0, 4000)) });
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
    abortProcess(a) {
        if (a.ended)
            return;
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
        error = error ?? a.providerError ?? (a.actor.wakeupId && !a.assistantOutput ? 'Pi 已结束但没有可展示的最终分析；请核对后重试' : undefined) ?? (this.valid(a) ? undefined : '会话已中止或自动分析来源已失效');
        a.ended = true;
        this.active.delete(a.sessionId);
        const store = this.app.store;
        store.transaction(() => {
            const s = store.get('session', a.sessionId);
            if (a.attemptId) {
                const attempt = store.get('task-attempt', a.attemptId);
                if (attempt.state === 'running')
                    this.app.teams.fail(a.attemptId, error ?? 'Pi 结束但没有提交结构化结果', !!error);
            }
            if (a.actor.wakeupId)
                this.app.wakeups.finish(a.actor.wakeupId, error, !!error);
            for (const id of a.messageIds) {
                const m = store.get('message', id);
                if (m.status === 'running')
                    store.update('message', m.id, m.version, { status: error ? 'failed' : 'completed', error });
            }
            if (s.generation === a.generation && s.state === 'running') {
                const queued = this.app.sessions.messages(SYSTEM, s.id).some(m => m.status === 'queued');
                store.update('session', s.id, s.version, { state: queued ? 'queued' : error ? 'failed' : 'idle', leaseUntil: 0, lastError: error });
            }
            store.event(s.projectId, 'agent.finished', { sessionId: s.id, error: error ?? null, attemptId: a.attemptId ?? null });
        });
        if (a.child.connected)
            a.child.disconnect();
        a.child.kill('SIGTERM');
    }
    async stop() {
        this.stopped = true;
        if (this.timer)
            clearInterval(this.timer);
        for (const a of this.active.values()) {
            this.abortProcess(a);
            this.finish(a, '控制服务关闭；Agent 停止，正式实验不受影响');
        }
    }
}
//# sourceMappingURL=agent-host.js.map