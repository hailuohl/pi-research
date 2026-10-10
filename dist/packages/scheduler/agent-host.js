import { digest } from '../storage/store.js';
import { publicationImageCatalog, imageReference, documentImageReference, CONTEXT_IMAGE_BYTES, PUBLICATION_IMAGE_TOOL, DOCUMENT_IMAGE_TOOL } from '../pi-adapter/publication-image.js';
import { modelConnectionSnapshot, assertModelEnabled } from '../pi-adapter/model-connections.js';
import { environmentVariables, redactEnvironment, redactEnvironmentChunk } from '../runtime/environment.js';
import { canSteerSession } from '../pi-adapter/session-history.js';
import { messageInput, nativeMessageFiles, nativeInputFiles, nativeAttachmentFile } from '../pi-adapter/attachments.js';
import { inputEnvelope, NATIVE_ATTACHMENT_BYTES } from '../pi-adapter/attachment-input.js';
import { prepareSessionSkills } from '../skills/runtime.js';
import { fork } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { SYSTEM } from '../domain/types.js';
import { ToolDispatcher } from '../research-tools/dispatcher.js';
import { TOOL_DEFINITIONS } from '../research-tools/definitions.js';
import { s as schema } from '../contracts/operations/schema.js';
import { safeToolDiagnostic } from '../pi-adapter/tool-diagnostic.js';
import { inspectPi } from '../pi-adapter/runtime.js';
import { asError, ensure, DomainError } from '../domain/errors.js';
import { assertWorkspaceReady } from '../workspace/git-service.js';
import { randomUUID } from 'node:crypto';
const redact = (s) => s.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED]').replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]');
export class AgentHost {
    app;
    dependencies;
    redact(value) { return redactEnvironment(this.app.context.dataDir, redact(value)); }
    clean(value) { return this.redact(value).slice(0, 32000); }
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
    status() { const capacity = this.admission.snapshot(); return { ...this.inspect(this.app.sessions.model()), activeWorkers: capacity.counts.held, maxModelWorkers: capacity.maxWorkers, workerCapacity: capacity, workerUnit: 'pi-worker', httpConcurrencyMeasured: false, toolIsolation: 'host-allowlist-explicit-trusted-shell', osSandboxVerified: false, hostAccess: { available: true, boundary: 'trusted-host', requiresExplicitSessionEnable: true, revokedOnRestart: true } }; }
    start() {
        this.app.researchAutomation.startOwner();
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
        assertModelEnabled(this.app.context.dataDir, session.model);
        const state = this.inspect(session.model);
        if (!state.ready)
            throw new DomainError(state.code, state.message, 503);
    }
    tick() {
        if (this.ticking || this.stopped)
            return;
        this.ticking = true;
        try {
            this.app.researchAutomation.heartbeatOwner();
            this.app.git.tick();
            this.app.github.tick();
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
                if (Date.now() - active.lastHeartbeat > 3000) {
                    // Fixed inputs are verified at tool boundaries and once per heartbeat, not per text delta.
                    if (a?.state === 'running') {
                        try {
                            this.app.teams.active(active.actor);
                        }
                        catch (error) {
                            this.abortProcess(active, this.clean(asError(error).message));
                            continue;
                        }
                    }
                    this.app.store.transaction(() => { this.admission.heartbeat(active.admissionId, this.ownerHost, active.generation); const latest = this.app.store.get('session', s.id); ensure(latest.generation === active.generation, 'LEASE_EXPIRED', '会话已失效'); this.app.store.update('session', latest.id, latest.version, { leaseUntil: Date.now() + 30000 }); if (a)
                        this.app.teams.heartbeat(a.id); });
                    active.lastHeartbeat = Date.now();
                }
                if (!s.taskId && !active.actor.wakeupId && !this.app.hostAccess.status({ type: 'user' }, s.id).pending)
                    for (const queued of this.app.sessions.messages(SYSTEM, s.id).filter(m => m.role === 'user' && m.origin !== 'automation' && !m.wakeupId && m.status === 'queued' && m.mode === 'steer')) {
                        const m = this.app.store.transaction(() => {
                            const latest = this.app.store.get('session', s.id), input = this.app.store.get('message', queued.id, latest.projectId);
                            if (!this.valid(active) || !canSteerSession(this.app.store, latest) || input.sessionId !== latest.id || input.status !== 'queued' || input.mode !== 'steer' || (input.steerGeneration !== undefined && input.steerGeneration !== active.generation) || JSON.stringify(input.permission) !== JSON.stringify(active.actor.permission))
                                return null;
                            return this.app.store.update('message', input.id, input.version, { status: 'running', generation: active.generation });
                        });
                        if (!m)
                            continue;
                        active.messageIds.push(m.id);
                        active.sent.add(m.id);
                        try {
                            const manifest = { envelope: inputEnvelope(m.id), files: nativeMessageFiles(this.app.store, s, m) };
                            this.sendInput(active, { type: 'steer', content: messageInput(m), messageId: m.id, attachmentManifest: manifest }, m.id);
                        }
                        catch (error) {
                            this.finish(active, this.clean(asError(error).message));
                        }
                    }
                if (s.taskId && a?.state === 'running')
                    for (const d of this.app.store.list('directive', s.projectId).filter(d => d.kind !== 'revise' && d.taskIds.includes(s.taskId) && !d.deliveredSessionIds.includes(s.id))) {
                        if (active.sent.has(d.id))
                            continue;
                        active.sent.add(d.id);
                        active.child.send({ type: d.kind, content: messageInput({ id: d.id, content: d.content }), messageId: d.id, attachmentManifest: { envelope: inputEnvelope(d.id), files: [] } });
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
            for (const grant of this.app.store.list('host-access').filter(g => g.state === 'pending'))
                if (!this.active.has(grant.sessionId))
                    this.app.hostAccess.activatePending(grant.sessionId);
            this.app.wakeups.reconcile();
            for (const s of this.app.store.list('session').filter(s => !s.taskId && s.state === 'queued')) {
                if (this.active.has(s.id) || this.app.hostAccess.status({ type: 'user' }, s.id).pending)
                    continue;
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
                        if (e.code === 'SESSION_PERMISSION_STALE') {
                            const m = this.app.store.get('message', next.id);
                            if (m.status === 'queued')
                                this.app.store.update('message', m.id, m.version, { status: 'failed', error: e.message });
                        }
                    }
                }
            }
            for (const w of this.app.store.list('wakeup').filter(w => w.state === 'pending')) {
                const root = this.app.sessions.get(SYSTEM, w.rootSessionId);
                try {
                    assertWorkspaceReady(this.app.context, root.id);
                }
                catch {
                    continue;
                }
                try {
                    const dispatch = this.app.store.transaction(() => { if (this.app.hostAccess.status({ type: 'user' }, root.id).pending || this.admission.sessionHeld(root.id) || !this.admission.check(root.projectId, root.role))
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
            if (['running', 'archived'].includes(latest.state) || this.app.hostAccess.status({ type: 'user' }, latest.id).pending)
                return null;
            const input = messageId ? store.get('message', messageId, latest.projectId) : undefined;
            if (input) {
                ensure(input.sessionId === latest.id, 'SCOPE_DENIED', '消息不属于此会话', 403);
                if (input.status !== 'queued')
                    return null;
            }
            const continuationId = input?.wakeupId ? this.app.wakeups.get(SYSTEM, input.wakeupId).continuationId : undefined;
            const permission = this.app.sessionPermissions.capture(latest.id, !!input?.wakeupId && !continuationId);
            if (input && !input.permission)
                ensure(permission.epoch === 0 && permission.hostEpoch === 0, 'SESSION_PERMISSION_STALE', '旧排队输入没有当前权限依据，请用户明确重试');
            if (input?.permission)
                ensure(JSON.stringify(input.permission) === JSON.stringify(permission), 'SESSION_PERMISSION_STALE', '排队消息权限已变化，请用户明确重试');
            if (latest.teamId) {
                const team = store.get('team', latest.teamId, latest.projectId);
                if (team.permission)
                    this.app.sessionPermissions.assert(team.permission, false);
                else
                    ensure(permission.epoch === 0 && permission.hostEpoch === 0, 'SESSION_PERMISSION_STALE', '旧协作计划没有当前权限依据');
            }
            const slot = this.admission.tryAcquire(latest, latest.generation + 1, this.ownerHost, attempt?.teamId);
            if (!slot)
                return null;
            const next = store.update('session', latest.id, latest.version, { state: 'running', generation: latest.generation + 1, leaseUntil: Date.now() + 30000, lastError: undefined, executionPermission: permission });
            let message;
            if (input) {
                const m = input;
                ensure(m.status === 'queued' && m.sessionId === next.id && m.projectId === next.projectId, 'MESSAGE_STALE', '消息已失效');
                message = store.update('message', m.id, m.version, { status: 'running', generation: next.generation });
                if (m.wakeupId)
                    this.app.wakeups.markStarted(m.wakeupId, next.id, next.generation, m.id);
            }
            const wakeupId = messageId ? store.get('message', messageId).wakeupId : undefined;
            const approvalResumeId = wakeupId ? this.app.wakeups.get(SYSTEM, wakeupId).approvalId : undefined;
            const actor = { researchModelDigest: this.app.researchAutomation.modelIdentity(next), ...(approvalResumeId ? { approvalResumeId } : {}), ...(messageId ? { messageId } : {}), ...(continuationId ? { continuationId } : {}), type: 'agent', projectId: next.projectId, sessionId: next.id, role: next.role, generation: attempt?.generation ?? next.generation, ...(attempt ? { taskId: attempt.taskId, attemptId: attempt.id } : {}), ...(wakeupId ? { wakeupId } : {}) };
            // Resolve against the pre-claim generation; the whole claim rolls back on missing capability.
            const bundleId = prepareSessionSkills(this.app, latest, actor);
            ensure(!attempt || attempt.skillBundleId === bundleId, 'SKILL_BINDING_MISMATCH', '任务与会话技能包不一致');
            const bound = store.update('session', next.id, next.version, { skillBundleId: bundleId });
            store.event(next.projectId, 'session.skill_bundle_bound', { sessionId: next.id, generation: next.generation, bundleId });
            return { session: bound, slot, message };
        });
    }
    launch(session, prompt, messageId, attempt, prepared) {
        const reservation = prepared ?? this.claimSession(session, messageId, attempt);
        if (!reservation)
            return;
        const { session: claimed, slot } = reservation, store = this.app.store;
        if (messageId) {
            ensure(reservation.message?.id === messageId, 'MESSAGE_STALE', '领取正文缺失');
            prompt = messageInput(reservation.message);
        }
        const wakeupId = messageId ? store.get('message', messageId).wakeupId : undefined;
        const continuationId = wakeupId ? this.app.wakeups.get(SYSTEM, wakeupId).continuationId : undefined;
        const approvalResumeId = wakeupId ? this.app.wakeups.get(SYSTEM, wakeupId).approvalId : undefined;
        const actor = { researchModelDigest: this.app.researchAutomation.modelIdentity(claimed), ...(approvalResumeId ? { approvalResumeId } : {}), ...(messageId ? { messageId } : {}), ...(continuationId ? { continuationId } : {}), permission: claimed.executionPermission, ...(wakeupId ? { wakeupId } : {}), type: 'agent', projectId: claimed.projectId, sessionId: claimed.id, role: claimed.role, generation: attempt?.generation ?? claimed.generation, ...(attempt ? { taskId: attempt.taskId, attemptId: attempt.id } : {}) };
        let active, requested = false;
        try {
            const bundleId = prepareSessionSkills(this.app, claimed, actor);
            const skillBundle = this.app.skills.bundleBootstrap(claimed.projectId, claimed.role, bundleId);
            this.ensureReady(claimed);
            const connectionSnapshot = modelConnectionSnapshot(this.app.context.dataDir, claimed.model.provider), configuredConnection = connectionSnapshot.connection;
            if (configuredConnection)
                assertModelEnabled(this.app.context.dataDir, claimed.model, configuredConnection);
            const catalogFingerprint = publicationImageCatalog(join(this.app.context.dataDir, 'models.json'), connectionSnapshot.catalog);
            actor.researchModelDigest = digest({ model: claimed.model, connectionVersion: connectionSnapshot.version, connectionDigest: digest(connectionSnapshot.connection ?? null), catalogDigest: catalogFingerprint });
            const toolDefinitions = this.tools.definitions(claimed.role, !!wakeupId, claimed.id, !!continuationId, !!approvalResumeId);
            const isolatedRunAnalysis = !!wakeupId && this.app.wakeups.get(SYSTEM, wakeupId).sourceKind === 'run-result';
            const home = join(this.app.context.dataDir, 'sessions', claimed.id), agentDir = join(home, 'agent'), sessionDir = isolatedRunAnalysis ? join(home, 'pi-analysis', wakeupId) : join(home, 'pi');
            mkdirSync(agentDir, { recursive: true, mode: 0o700 });
            mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
            const connection = configuredConnection ? (({ apiKey, ...publicConfig }) => publicConfig)(configuredConnection) : undefined;
            const env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, HOME: home, USERPROFILE: home, PI_API_KEY: configuredConnection?.apiKey ?? process.env.PI_API_KEY, NO_COLOR: '1' };
            const configuredEnvironment = environmentVariables(this.app.context.dataDir);
            for (const [name, value] of Object.entries(configuredEnvironment))
                if (env[name] === undefined)
                    env[name] = value;
            env.PI_API_KEY = configuredConnection?.apiKey ?? configuredEnvironment.PI_API_KEY ?? process.env.PI_API_KEY;
            // Explicit local variables only; never inherit host credentials or interpreter options.
            const child = store.transaction(() => {
                // Serialize the final revocation check with process creation across controllers.
                this.app.skills.ensureBundleStartAllowed(claimed.projectId, bundleId);
                const marked = this.admission.markSpawnRequested(slot.id, this.ownerHost, claimed.generation);
                store.update('agent-admission', marked.id, marked.version, { httpManagedVersion: 1 });
                requested = true;
                const spawned = (this.dependencies.fork ?? fork)(this.dependencies.workerEntry ?? join(this.app.context.repoRoot, 'dist/apps/agent-worker/index.js'), [], { cwd: this.app.store.paths.physical(claimed.workspace), env, execArgv: [], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
                // Retain the child before commit: a commit failure is not proof of zero model use.
                active = { catalogFingerprint, admissionId: slot.id, child: spawned, sessionId: claimed.id, generation: claimed.generation, actor, currentMessageId: messageId ?? null, callIdActors: new Map(), messageIds: messageId ? [messageId] : [], consumedIds: new Set(messageId ? [messageId] : []), attemptId: attempt?.id, lastHeartbeat: Date.now(), sent: new Set(), ended: false, advertisedTools: new Set(toolDefinitions.map(tool => tool.name)) };
                this.active.set(claimed.id, active);
                spawned.on('error', error => this.finish(active, this.clean(error.message)));
                spawned.once('exit', code => { active.exitObserved = true; if (active.ended)
                    this.exited(active, code); });
                spawned.once('close', code => { if (this.active.get(claimed.id) === active)
                    this.exited(active, code); });
                return spawned;
            });
            const worker = active;
            child.stdout?.on('data', () => { });
            child.stderr?.on('data', () => { });
            child.on('message', raw => { void this.onMessage(worker, raw, sessionDir).catch(e => this.finish(worker, this.clean(asError(e).message))); });
            // exit can precede buffered IPC messages; close confirms those messages have drained.
            this.admission.markRunning(slot.id, this.ownerHost, claimed.generation, child.pid);
            const hostMessages = !wakeupId && !attempt ? this.app.sessions.pendingNotices(claimed.id) : [];
            worker.contextMessageIds = hostMessages.map(m => m.id);
            const { completed, input } = store.transaction(() => { const completed = this.app.sessions.messages(SYSTEM, claimed.id).filter(m => m.status === 'completed' && (m.role !== 'system' || m.origin === 'automation')); let input = reservation.message ? store.get('message', reservation.message.id, claimed.projectId) : undefined; if (input && input.role === 'user' && input.origin !== 'automation' && !input.wakeupId && input.nativeAttachmentContextIds === undefined && !claimed.piSessionPath && !wakeupId && !attempt) {
                const ids = completed.filter(m => m.role === 'user' && !m.queueRemoved && !m.nativeAttachmentsDisabled && m.attachments?.some(a => a.inputMode === 'native')).map(m => m.id);
                input = store.update('message', input.id, input.version, { nativeAttachmentContextIds: ids });
            } return { completed, input }; });
            const history = !isolatedRunAnalysis && !claimed.piSessionPath ? completed.map(m => ({ role: m.role, content: messageInput(m) })) : [];
            const attachmentManifests = !wakeupId && !attempt ? completed.filter(m => m.role === 'user' && !m.queueRemoved && !m.nativeAttachmentsDisabled).map(m => ({ envelope: inputEnvelope(m.id), files: nativeInputFiles(store, claimed, m) })) : [];
            const currentEnvelope = inputEnvelope(messageId ?? randomUUID());
            if (!messageId)
                prompt += currentEnvelope;
            const currentFiles = input && !wakeupId && !attempt ? nativeInputFiles(store, claimed, input) : [];
            attachmentManifests.push({ envelope: currentEnvelope, files: currentFiles });
            this.sendInput(worker, { type: 'start', dataDir: this.app.context.dataDir, ...(connection ? { connection } : {}), attachmentManifests, managedHttp: true, catalogFingerprint, permissionMode: actor.permission?.mode ?? 'legacy', skillBundle, repoRoot: this.app.context.repoRoot, workspace: this.app.store.paths.physical(claimed.workspace), agentDir, sessionDir, modelsPath: join(this.app.context.dataDir, 'models.json'), piSessionPath: !isolatedRunAnalysis && claimed.piSessionPath ? this.app.store.paths.physical(claimed.piSessionPath) : null, role: claimed.role, model: claimed.model, tools: toolDefinitions, history: history.length ? JSON.stringify(history) : null, hostMessages, prompt }, messageId);
            store.event(claimed.projectId, 'agent.started', { sessionId: claimed.id, generation: claimed.generation, attemptId: attempt?.id });
        }
        catch (error) {
            const failure = asError(error), startError = this.clean(`${failure.code} — ${failure.message}`);
            if (active) {
                try {
                    store.transaction(() => { const held = this.admission.assertOwned(slot.id, this.ownerHost, claimed.generation); store.update('agent-admission', held.id, held.version, { spawnRequested: true, workerPid: active.child.pid, httpManagedVersion: 1 }); });
                    this.finish(active, this.clean(error.message));
                }
                finally {
                    if (!active.exitObserved) {
                        if (active.child.connected)
                            active.child.disconnect();
                        active.child.kill('SIGTERM');
                    }
                }
                return;
            }
            store.transaction(() => { this.admission.release(slot.id, this.ownerHost, claimed.generation, requested ? 'synchronous-fork-failure' : 'not-forked'); if (attempt)
                this.app.teams.fail(attempt.id, startError, false, true); if (messageId) {
                const m = store.get('message', messageId);
                if (m.status === 'running')
                    store.update('message', m.id, m.version, { status: 'failed', error: startError });
            } if (wakeupId) {
                const w = this.app.wakeups.get(SYSTEM, wakeupId);
                store.update('wakeup', w.id, w.version, { state: 'queued', attempts: Math.max(0, w.attempts - 1), generation: undefined });
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
    pendingSessionAction(a, tool, details) {
        const ref = details;
        if (typeof ref?.actionId !== 'string' || ref.operation !== tool)
            return;
        const action = this.app.store.maybe('session-action', ref.actionId);
        if (!action || action.projectId !== a.actor.projectId || action.sessionId !== a.sessionId || action.operation !== tool || action.state !== 'pending')
            return;
        const approval = this.app.store.maybe('approval', action.approvalId);
        if (approval?.projectId === a.actor.projectId && approval.subjectKind === 'session-action' && approval.subjectId === action.id && approval.scope === 'session.action' && approval.status === 'pending')
            return action.id;
    }
    async onMessage(a, m, sessionDir) {
        if (m?.type === 'model_http_acquire' || m?.type === 'model_http_finish') {
            const identity = { admissionId: a.admissionId, ownerHost: this.ownerHost, sessionId: a.sessionId, generation: a.generation };
            try {
                let result;
                if (m.type === 'model_http_acquire') {
                    result = this.app.store.transaction(() => {
                        ensure(!a.ended && !a.exitObserved && !a.stopError && this.valid(a), 'MODEL_HTTP_SCOPE_EXPIRED', '会话已停止，不能外发模型请求');
                        const attachmentRefs = m.attachmentRefs ?? [];
                        ensure(Array.isArray(attachmentRefs), 'MODEL_ATTACHMENT_UNBOUND', '模型附件引用无效');
                        if (attachmentRefs.length) {
                            if (a.actor.permission)
                                this.app.sessionPermissions.assert(a.actor.permission, false);
                            ensure(!a.actor.taskId && !a.actor.wakeupId && publicationImageCatalog(join(this.app.context.dataDir, 'models.json')) === a.catalogFingerprint, 'MODEL_ATTACHMENT_CATALOG_CHANGED', '模型或目录已改变，原生附件不能继续发送');
                            let bytes = 0;
                            const session = this.app.sessions.get(SYSTEM, a.sessionId);
                            for (const ref of attachmentRefs) {
                                bytes += nativeAttachmentFile(this.app.store, session, ref).reference.size;
                                ensure(bytes <= NATIVE_ATTACHMENT_BYTES, 'MODEL_ATTACHMENT_LIMIT', '实际原生附件合计最多20 MiB');
                            }
                        }
                        const refs = m.imageRefs === undefined ? [] : m.imageRefs;
                        ensure(Array.isArray(refs) && refs.length <= Math.floor(CONTEXT_IMAGE_BYTES / 33), 'MODEL_IMAGE_UNBOUND', '模型图片引用无效');
                        if (refs.length)
                            ensure(publicationImageCatalog(join(this.app.context.dataDir, 'models.json')) === a.catalogFingerprint, 'MODEL_IMAGE_CATALOG_CHANGED', '模型目录已改变，禁止继续发送图片');
                        let imageBytes = 0;
                        const checked = new Set();
                        for (const value of refs) {
                            const ref = value?.kind === 'document-page' ? documentImageReference(value) : imageReference(value);
                            imageBytes += ref.bytes;
                            ensure(imageBytes <= CONTEXT_IMAGE_BYTES, 'MODEL_IMAGE_LIMIT', '实际图片总量超过16 MiB');
                            const key = JSON.stringify(ref);
                            if (!checked.has(key)) {
                                try {
                                    if ('kind' in ref)
                                        this.app.sessionPermissions.assertDocumentImageAction(a.actor, ref);
                                    else
                                        this.app.sessionPermissions.assertImageAction(a.actor, ref);
                                }
                                catch (error) {
                                    const e = asError(error);
                                    throw new DomainError('MODEL_IMAGE_BLOCKED', `${e.code}: ${e.message}`, 403);
                                }
                                checked.add(key);
                            }
                        }
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
                    a.child.send({ type: 'model_http_response', requestId: m.requestId, error: { code: e.code, message: this.clean(e.message) } });
                }
            }
            return;
        }
        if (a.ended)
            return;
        if (m?.type === 'tool') {
            if (a.exitObserved)
                return;
            const tool = String(m.tool), callId = String(m.toolCallId);
            a.toolErrors?.delete(callId);
            try {
                ensure(!a.stopError && this.valid(a), 'LEASE_EXPIRED', '会话已中止');
                // Cached reads also require current inputs while a task is running; finished submit receipts may drain.
                if (a.attemptId && this.app.store.get('task-attempt', a.attemptId).state === 'running')
                    this.app.teams.active(a.actor);
                if (m.tool === PUBLICATION_IMAGE_TOOL || m.tool === DOCUMENT_IMAGE_TOOL)
                    ensure(publicationImageCatalog(join(this.app.context.dataDir, 'models.json')) === a.catalogFingerprint, 'MODEL_IMAGE_CATALOG_CHANGED', '模型目录已改变，图片不能读取');
                const binding = a.callIdActors?.get(callId);
                ensure(!binding || binding.tool === tool, 'SCOPE_DENIED', '工具调用来源不匹配', 403);
                ensure(tool !== 'research_action_prepare' || binding, 'RESEARCH_ACTION_ORIGIN_REQUIRED', '人工请求需要合法工具开始边界', 403);
                const result = await this.tools.execute(binding?.actor ?? a.actor, String(m.tool), m.input, String(m.toolCallId));
                if (!a.exitObserved && a.child.connected)
                    a.child.send({ type: 'tool_response', requestId: m.requestId, result });
            }
            catch (e) {
                const error = asError(e);
                const definition = TOOL_DEFINITIONS[tool];
                const pendingActionId = error.code === 'APPROVAL_REQUIRED' ? this.pendingSessionAction(a, tool, error.details) : undefined;
                (a.toolErrors ??= new Map()).set(callId, { tool, code: error.code, pendingActionId, diagnostic: definition ? safeToolDiagnostic(definition.inputSchema, error.code, error.message) : undefined });
                if (!a.exitObserved && a.child.connected)
                    a.child.send({ type: 'tool_response', requestId: m.requestId, error: { code: error.code, message: this.clean(error.message) } });
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
            this.finish(a, this.clean(String(m.error)));
            return;
        }
        if (!this.valid(a))
            return;
        const s = this.app.store.get('session', a.sessionId);
        if (m?.type === 'context_ack') {
            ensure(Array.isArray(m.messageIds) && m.messageIds.every((id) => typeof id === 'string' && a.contextMessageIds?.includes(id)), 'SCOPE_DENIED', '不能确认未投递的上下文通知', 403);
            this.app.store.transaction(() => this.app.sessions.acknowledgeNotices(s.id, m.messageIds));
        }
        if (m?.type === 'tool_execution_start' || m?.type === 'tool_execution_end') {
            const tool = String(m.tool ?? '');
            // Revocation fences effects, but must not erase the final failure event for an already advertised tool.
            if (!(a.advertisedTools ?? new Set(this.tools.definitions(a.actor.role, !!a.actor.wakeupId, a.sessionId, !!a.actor.continuationId, !!a.actor.approvalResumeId).map(definition => definition.name))).has(tool))
                return;
            const callId = String(m.toolCallId ?? tool), record = a.toolErrors?.get(callId), error = record?.tool === tool ? record : undefined;
            if (m.type === 'tool_execution_start' && typeof m.toolCallId === 'string') {
                const actors = a.callIdActors ??= new Map();
                // Keep the source captured at tool start even if a later steer is consumed.
                if (!actors.has(callId))
                    actors.set(callId, { tool, actor: { ...a.actor, messageId: a.currentMessageId === undefined ? a.actor.messageId : a.currentMessageId ?? undefined } });
            }
            const failed = m.type === 'tool_execution_end' && (m.isError || error);
            const reported = safeToolDiagnostic(schema.object({ input: TOOL_DEFINITIONS[tool].inputSchema }, ['input']), m.diagnostic?.code, `${m.diagnostic?.path}: ${m.diagnostic?.reason}`);
            const diagnostic = error ? error.diagnostic : reported?.code === 'INVALID_INPUT' ? reported : undefined;
            const failedCallId = failed ? callId.slice(0, 200) : null;
            const seen = a.failedToolCalls ??= new Set();
            let noticeSaved = false;
            this.app.store.transaction(() => {
                ensure(this.valid(a), 'LEASE_EXPIRED', '旧 Worker 不能保存当前工具状态');
                const approvalRequired = failed && error?.pendingActionId && this.pendingSessionAction(a, tool, { actionId: error.pendingActionId, operation: tool }) === error.pendingActionId;
                this.app.store.event(s.projectId, 'session.activity', { sessionId: s.id, generation: a.generation, tool, status: m.type === 'tool_execution_start' ? 'running' : failed && !approvalRequired ? 'failed' : 'completed' });
                if (failedCallId !== null) {
                    if (!seen.has(failedCallId)) {
                        const content = approvalRequired ? `工具 ${tool} 需要用户确认本次操作，请处理当前审批卡。` : diagnostic?.code === 'INVALID_INPUT' ? `工具 ${tool} 调用失败（INVALID_INPUT${diagnostic.path ? ` — ${diagnostic.path}: ${diagnostic.reason}` : '：输入不符合工具要求'}）。请按完整调用示例核对参数。` : `工具 ${tool} 调用失败。请查看智能体说明或对应任务的诊断。`;
                        const notice = this.app.store.create('message', s.projectId, { sessionId: s.id, generation: a.generation, role: 'system', content, mode: 'follow_up', status: approvalRequired ? 'completed' : 'failed' });
                        this.app.store.event(s.projectId, 'session.message_completed', { sessionId: s.id, messageId: notice.id });
                        noticeSaved = true;
                    }
                }
            });
            if (noticeSaved)
                seen.add(failedCallId);
            return;
        }
        if (m?.type === 'ready') {
            ensure(m.model?.provider === s.model.provider && m.model?.id === s.model.model, 'MODEL_FALLBACK_REFUSED', 'Pi 尝试切换未经批准的模型');
            if (m.sessionFile)
                this.savePath(a, String(m.sessionFile), sessionDir);
        }
        if (m?.type === 'assistant_message') {
            a.deltaTail = '';
            if (m.error)
                a.providerError = this.clean(String(m.error));
            else if (typeof m.content === 'string' && m.content.trim())
                a.assistantOutput = true;
            const content = this.redact(String(m.content ?? ''));
            this.app.store.transaction(() => {
                ensure(this.valid(a), 'LEASE_EXPIRED', '旧 Worker 不能保存当前会话输出');
                const allowed = a.advertisedTools ?? new Set(this.tools.definitions(a.actor.role, !!a.actor.wakeupId, a.sessionId, !!a.actor.continuationId, !!a.actor.approvalResumeId).map(definition => definition.name));
                const toolCalls = Array.isArray(m.toolCalls) ? m.toolCalls.filter((name) => typeof name === 'string' && allowed.has(name)).slice(0, 64) : [];
                const record = this.app.store.create('message', s.projectId, { sessionId: s.id, generation: a.generation, phase: toolCalls.length || m.phase === 'commentary' || m.stopReason === 'toolUse' ? 'commentary' : 'final_answer', ...(toolCalls.length ? { toolCalls } : {}), ...(a.actor.wakeupId ? { origin: 'automation', wakeupId: a.actor.wakeupId } : {}), role: 'assistant', content: content.slice(0, 32000), ...(content.length > 32000 ? { contentTruncated: true } : {}), mode: 'prompt', status: m.error ? 'failed' : 'completed', error: m.error ? this.clean(String(m.error)) : undefined, usage: m.usage });
                this.app.store.event(s.projectId, 'session.message_completed', { sessionId: s.id, generation: s.generation, messageId: record.id });
                this.app.store.create('model-usage', s.projectId, { sessionId: s.id, attemptId: a.attemptId ?? null, provider: s.model.provider, model: s.model.model, usage: m.usage, status: m.usage ? 'reported' : 'unknown', stopReason: m.stopReason ?? null });
            });
        }
        if (m?.type === 'delta' && typeof m.text === 'string') {
            const chunk = redactEnvironmentChunk(this.app.context.dataDir, (a.deltaTail ?? '') + m.text);
            a.deltaTail = chunk.tail;
            const text = redact(chunk.text);
            if (text)
                this.app.store.transaction(() => { ensure(this.valid(a), 'LEASE_EXPIRED', '旧 Worker 不能保存当前会话输出'); this.app.store.event(s.projectId, 'session.delta', { sessionId: s.id, generation: a.generation, text: text.slice(0, 4000), truncated: text.length > 4000 }); });
        }
        if (m?.type === 'input_consumed' && a.messageIds.includes(m.messageId) && a.sent.has(m.messageId)) {
            const input = this.app.store.maybe('message', m.messageId);
            const ordinary = input?.projectId === s.projectId && input.sessionId === s.id && input.role === 'user' && input.origin !== 'automation' && !input.wakeupId && !input.approvalNoticeId && !input.queueRemoved && input.status === 'running' && input.generation === a.generation;
            if (ordinary) {
                a.consumedIds.add(m.messageId);
                a.currentMessageId = m.messageId;
            }
            else
                a.currentMessageId = null;
        }
        if (m?.type === 'control_error' && a.messageIds.includes(m.messageId))
            this.failInput(a, m.messageId, this.clean(String(m.error ?? 'Worker 未接受输入')));
        if (m?.type === 'message_ack' && !a.messageIds.includes(m.messageId) && a.actor.taskId && a.sent.has(m.messageId)) {
            const d = this.app.store.maybe('directive', m.messageId);
            if (d && d.projectId === s.projectId && d.taskIds.includes(s.taskId) && !d.deliveredSessionIds.includes(s.id))
                this.app.store.update('directive', d.id, d.version, { deliveredSessionIds: [...d.deliveredSessionIds, s.id] });
        }
    }
    failInput(a, id, error) {
        this.app.store.transaction(() => { const m = this.app.store.get('message', id); if (m.sessionId === a.sessionId && m.status === 'running')
            this.app.store.update('message', id, m.version, { status: 'failed', error }); });
    }
    sendInput(a, payload, messageId) {
        const failed = (error) => { if (!error)
            return; if (messageId)
            this.failInput(a, messageId, this.clean(error.message)); if (payload.type === 'start')
            this.finish(a, this.clean(error.message)); };
        try {
            a.child.send(payload, failed);
        }
        catch (error) {
            failed(error);
        }
    }
    savePath(a, file, root) { const rel = relative(resolve(root), resolve(file)); ensure(rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) && file.endsWith('.jsonl'), 'SESSION_PATH_INVALID', 'Pi Session 路径超出受控目录'); const s = this.app.store.get('session', a.sessionId); if (a.actor?.wakeupId) {
        const w = this.app.wakeups.get(SYSTEM, a.actor.wakeupId);
        if (w.sourceKind === 'run-result') {
            this.app.store.update('wakeup', w.id, w.version, { analysisSessionPath: this.app.store.paths.reference(resolve(file)) });
            return;
        }
    } if (s.piSessionPath && this.app.store.paths.same(s.piSessionPath, resolve(file)))
        return; this.app.store.update('session', s.id, s.version, { piSessionPath: this.app.store.paths.reference(resolve(file)) }); }
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
                    store.update('message', m.id, m.version, { status: error || !a.consumedIds.has(id) ? 'failed' : 'completed', error: error ?? (a.consumedIds.has(id) ? undefined : '未确认处理，请核对后重试') });
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
        this.app.researchAutomation.stopOwner();
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
        await this.app.github.stop();
        await this.app.documentParsing.stop();
        await this.app.publicationBuilds.stop();
        await this.app.compute.stop();
    }
}
//# sourceMappingURL=agent-host.js.map