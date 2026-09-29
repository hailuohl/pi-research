import { existsSync, mkdirSync, unlinkSync, writeFileSync, readdirSync, rmdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ensure, asError } from '../domain/errors.js';
import { object, text } from '../contracts/validation.js';
import { scope, ROLE_TOOLS } from '../policy/permissions.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { digest, now } from '../storage/store.js';
import { listFiles, safePath, snapshotDirectory, verifySnapshot, setSourceModes, setSourceMode } from './files.js';
import { readStableFile } from './stable-file.js';
import { validateSourceRevision } from './source-access.js';
import { GitCommand } from './git-command.js';
import { WorkspaceLeases } from './leases.js';
const terminal = (state) => ['complete', 'conflict', 'failed'].includes(state);
const snapshot = (c, path) => {
    if (listFiles(path).length)
        return snapshotDirectory(path, join(c.dataDir, 'snapshots'));
    const id = digest([]), root = join(c.dataDir, 'snapshots', id);
    mkdirSync(root, { recursive: true });
    return { path: root, digest: id, files: [] };
};
export function queueSourceHistory(c, r, parentSourceRevisionId, legacy = false) {
    return c.store.transaction(() => {
        const id = digest({ sourceRevisionId: r.id, action: 'source' }), old = c.store.maybe('git-operation', id);
        if (old) {
            ensure(old.snapshot.digest === r.sourceDigest, 'GIT_SOURCE_CONFLICT', '源码版本已有不同 Git 导入');
            return old;
        }
        const op = c.store.create('git-operation', r.projectId, { action: 'source', state: 'queued', sourceRevisionId: r.id, snapshot: r.snapshot, parentSourceRevisionId, message: `${legacy ? 'Import existing CAS' : 'Capture source'} ${r.id}`, commitDate: now(), generation: 0, leaseUntil: 0 }, id);
        c.store.create('git-import-provenance', r.projectId, { sourceRevisionId: r.id, sourceDigest: r.sourceDigest, originalCreatedAt: r.createdAt, captureKind: legacy ? 'legacy-import' : 'new-source' }, id);
        return op;
    });
}
export function queueWorkspaceHistory(c, s, r) {
    return c.store.transaction(() => {
        const old = c.store.maybe('git-workspace', s.id);
        if (old) {
            ensure(old.sourceRevisionId === r.id, 'WORKSPACE_NOT_EMPTY', '已绑定另一 Git 来源，不能覆盖工作区');
            return old;
        }
        queueSourceHistory(c, r, undefined, true);
        const id = randomUUID(), branch = `refs/heads/session-${s.id}`, path = join(c.dataDir, 'git-worktrees', s.projectId, s.id), input = snapshot(c, s.workspace);
        c.store.create('git-operation', s.projectId, { action: 'checkout', state: 'queued', sourceRevisionId: r.id, sessionId: s.id, snapshot: input, branch, workspace: path, previousWorkspace: s.workspace, message: `Prepare session ${s.id}`, commitDate: now(), generation: 0, leaseUntil: 0 }, id);
        const result = c.store.create('git-workspace', s.projectId, { sessionId: s.id, sourceRevisionId: r.id, branch, path, state: 'pending', operationId: id, snapshot: input }, s.id);
        c.store.event(s.projectId, 'git.workspace_queued', { sessionId: s.id, operationId: id });
        return result;
    });
}
/** Shared by tools and host launch; source-free note sessions have no code branch to lock. */
export function assertWorkspaceReady(c, sessionId) {
    const s = c.store.get('session', sessionId);
    if (!s.sourceRevisionId || !c.store.get('project', s.projectId).gitHistoryEnabled)
        return;
    const w = c.store.maybe('git-workspace', s.id);
    ensure(w?.state === 'ready' && w.path === s.workspace && w.sourceRevisionId === s.sourceRevisionId, 'WORKSPACE_NOT_READY', 'Git 工作区尚未就绪；通过 workspace_history_inspect 查询');
    ensure(w.branch === `refs/heads/session-${s.id}`, 'WORKSPACE_OWNER_MISMATCH', 'Git 分支不属于此会话');
    return new WorkspaceLeases(c.store).acquire(s.projectId, w.branch, `session:${s.id}`);
}
export class GitService {
    app;
    active;
    stopped = false;
    constructor(app) {
        this.app = app;
    }
    enable(actor, pid) {
        ensure(actor.type === 'user', 'PERMISSION_DENIED', '需要用户明确启用 Git 历史', 403);
        return this.app.store.transaction(() => { const p = assertProjectWritable(this.app.store, pid); if (!p.gitHistoryEnabled)
            this.app.store.update('project', p.id, p.version, { gitHistoryEnabled: true }); const operations = this.migrate(actor, pid); for (const s of this.app.store.list('session', pid).filter(s => s.sourceRevisionId && s.state !== 'archived'))
            queueWorkspaceHistory(this.app.context, s, validateSourceRevision(this.app.context, pid, s.sourceRevisionId)); return { enabled: true, ...operations }; });
    }
    access(actor, pid, sessionId, write = false) {
        scope(actor, pid);
        const s = this.app.store.get('session', sessionId, pid);
        ensure(actor.type === 'user' || actor.type === 'agent', 'PERMISSION_DENIED', '需要用户或助手身份', 403);
        if (actor.type === 'agent') {
            const own = this.app.store.get('session', text(actor.sessionId, 'sessionId', 100), pid);
            ensure(own.role === actor.role && own.taskId === actor.taskId, 'SCOPE_DENIED', '会话身份不匹配', 403);
            ensure(actor.sessionId === s.id || !write && actor.role === 'coordinator' && !actor.taskId, 'TASK_SCOPE_DENIED', '只能写入自己的 Git 工作区', 403);
            if (write) {
                ensure(!actor.wakeupId && ROLE_TOOLS[s.role].includes('workspace_write'), 'TOOL_DENIED', '此角色无权提交源码', 403);
                if (own.taskId)
                    this.app.teams.active(actor);
                else
                    ensure(own.state === 'running' && own.generation === actor.generation && own.leaseUntil > Date.now(), 'LEASE_EXPIRED', '会话写入租约已失效');
            }
        }
        if (write) {
            assertProjectWritable(this.app.store, pid);
            ensure(s.state !== 'archived', 'SESSION_ARCHIVED', '会话已归档');
            assertWorkspaceReady(this.app.context, s.id);
        }
        return s;
    }
    inspect(actor, pid, sessionId) {
        const s = this.access(actor, pid, sessionId), w = this.app.store.maybe('git-workspace', s.id);
        if (!w)
            return { sessionId: s.id, state: 'unbound' };
        const op = this.app.store.get('git-operation', w.operationId);
        return { sessionId: s.id, state: w.state, sourceRevisionId: w.sourceRevisionId, branch: w.branch, head: w.head, operationId: op.id, operationState: op.state, error: op.error, sourceDigest: w.snapshot.digest };
    }
    operation(actor, pid, id) {
        scope(actor, pid);
        const op = this.app.store.get('git-operation', id, pid);
        if (op.sessionId)
            this.access(actor, pid, op.sessionId);
        else
            this.app.sources.resolve(actor, pid, { snapshotId: op.sourceRevisionId });
        return { operationId: op.id, action: op.action, state: op.state, sourceRevisionId: op.sourceRevisionId, sessionId: op.sessionId, sourceDigest: op.snapshot.digest, gitCommit: op.gitCommit, error: op.error };
    }
    diff(actor, pid, sessionId) {
        const s = this.access(actor, pid, sessionId), w = this.app.store.get('git-workspace', sessionId, pid);
        ensure(w.state === 'ready', 'WORKSPACE_NOT_READY', 'Git 工作区尚未就绪');
        const current = snapshot(this.app.context, s.workspace), before = new Map(w.snapshot.files.map(f => [f.path, f])), after = new Map(current.files.map(f => [f.path, f]));
        const files = [...new Set([...before.keys(), ...after.keys()])].sort().filter(p => { const a = before.get(p), b = after.get(p); return a?.digest !== b?.digest || (a?.mode ?? '100644') !== (b?.mode ?? '100644'); }).map(path => ({ path, status: !before.has(path) ? 'added' : !after.has(path) ? 'deleted' : 'modified', beforeDigest: before.get(path)?.digest ?? null, afterDigest: after.get(path)?.digest ?? null, beforeMode: before.get(path)?.mode ?? (before.has(path) ? '100644' : null), afterMode: after.get(path)?.mode ?? null }));
        return { sessionId, head: w.head, sourceDigest: current.digest, files };
    }
    commit(actor, pid, sessionId, value) {
        return this.app.store.transaction(() => {
            const s = this.access(actor, pid, sessionId, true), w = this.app.store.get('git-workspace', sessionId, pid), x = object(value);
            this.app.workingGrants.assertWorkspace(actor, pid, sessionId);
            ensure(w.head === text(x.expectedHead, 'expectedHead', 64), 'GIT_HEAD_CONFLICT', 'Git HEAD 已变化，请重新查看差异');
            const input = snapshot(this.app.context, s.workspace);
            ensure(input.digest !== w.snapshot.digest, 'CHANGE_EMPTY', '工作区没有源码变化');
            const id = randomUUID();
            this.app.store.create('git-operation', pid, { action: 'commit', state: 'queued', sourceRevisionId: w.sourceRevisionId, sessionId, branch: w.branch, workspace: w.path, expectedHead: w.head, snapshot: input, message: text(x.message, 'message', 1000), commitDate: now(), generation: 0, leaseUntil: 0 }, id);
            this.app.store.update('git-workspace', w.id, w.version, { state: 'pending', operationId: id });
            this.app.store.event(pid, 'git.commit_queued', { sessionId, operationId: id, sourceDigest: input.digest });
            return this.operation(actor, pid, id);
        });
    }
    setMode(actor, pid, sessionId, value) {
        return this.app.store.transaction(() => {
            const s = this.access(actor, pid, sessionId, true), x = object(value), path = text(x.path, 'path', 1000), mode = x.mode;
            ensure(mode === '100644' || mode === '100755', 'INVALID_INPUT', '只支持普通文件及可执行文件模式', 400);
            this.app.workingGrants.assertWrite(actor, pid, sessionId, path, undefined, mode);
            const current = snapshot(this.app.context, s.workspace);
            ensure(current.digest === text(x.expectedSourceDigest, 'expectedSourceDigest', 64), 'FILE_VERSION_CONFLICT', '源码已变化');
            const before = current.files.find(f => f.path === path);
            ensure(before, 'NOT_FOUND', '文件不存在', 404);
            setSourceMode(s.workspace, path, mode);
            this.app.store.onRollback(() => setSourceMode(s.workspace, path, before.mode ?? '100644'));
            this.app.store.event(pid, 'workspace.mode_changed', { sessionId, path, mode });
            return { path, mode, sourceDigest: snapshot(this.app.context, s.workspace).digest };
        });
    }
    migrate(actor, pid) {
        ensure(actor.type === 'user', 'PERMISSION_DENIED', '历史导入需要用户身份', 403);
        assertProjectWritable(this.app.store, pid);
        return this.app.store.transaction(() => ({ operationIds: this.app.store.list('source-revision', pid).map(r => queueSourceHistory(this.app.context, r, undefined, true).id) }));
    }
    /** Called before model availability checks. Git never executes within the caller's SQL transaction. */
    tick() { if (!this.active && !this.stopped)
        this.active = this.processNext().catch(() => { }).finally(() => { this.active = undefined; }); }
    async stop() { this.stopped = true; await this.active; }
    async drain(projectId) { await this.active; while (await this.processNext(projectId)) { } }
    async processNext(projectId) {
        const store = this.app.store, leases = new WorkspaceLeases(store);
        const claimed = store.transaction(() => {
            const jobs = store.list('git-operation', projectId);
            for (const op of jobs) {
                if (terminal(op.state) || op.leaseUntil > Date.now())
                    continue;
                const dependency = op.action === 'source' ? op.parentSourceRevisionId : op.sourceRevisionId;
                if (dependency && !store.maybe('git-source-binding', dependency))
                    continue;
                let lease;
                try {
                    lease = leases.acquire(op.projectId, 'repository', `operation:${op.id}`);
                }
                catch (error) {
                    if (asError(error).code === 'WORKSPACE_LEASE_BUSY')
                        continue;
                    throw error;
                }
                const job = store.update('git-operation', op.id, op.version, { state: 'running', generation: op.generation + 1, workerPid: process.pid, leaseUntil: Date.now() + 60000, error: undefined });
                return { job, lease };
            }
            return null;
        });
        if (!claimed)
            return false;
        let job = claimed.job;
        const owner = `operation:${job.id}`, pid = job.projectId, repo = new GitCommand(this.app.context.dataDir, pid), opDir = join(this.app.context.dataDir, 'git-operations', job.id), receipt = `refs/pi/operations/${job.id}`;
        const fence = () => { leases.assert(pid, 'repository', owner, claimed.lease.generation); const j = store.get('git-operation', job.id); ensure(j.generation === job.generation && j.leaseUntil > Date.now() && j.state === 'running', 'WORKSPACE_LEASE_EXPIRED', 'Git 执行器已失去租约'); return j; };
        const renew = setInterval(() => { try {
            store.transaction(() => { const j = fence(); leases.renew(pid, 'repository', owner, claimed.lease.generation); store.update('git-operation', j.id, j.version, { leaseUntil: Date.now() + 60000 }); });
        }
        catch { } }, 3000);
        try {
            assertProjectWritable(store, pid);
            validateSourceRevision(this.app.context, pid, job.sourceRevisionId);
            verifySnapshot(job.snapshot.path, job.snapshot.files);
            if (job.sessionId)
                this.validateSession(job);
            await repo.initialize();
            fence();
            mkdirSync(opDir, { recursive: true });
            let commit = await repo.ref(receipt);
            fence();
            const hadReceipt = !!commit;
            const parent = job.action === 'commit' ? job.expectedHead : job.parentSourceRevisionId ? store.get('git-source-binding', job.parentSourceRevisionId).gitCommit : undefined;
            if (job.action !== 'checkout') {
                const wanted = await repo.commitSnapshot(job.snapshot, opDir, { parent, message: job.message, date: job.commitDate });
                fence();
                ensure(!commit || commit === wanted, 'GIT_RECEIPT_CONFLICT', 'Git 操作回执与固定源码不符');
                if (!commit) {
                    await repo.updateRef(receipt, wanted, null);
                    fence();
                    commit = wanted;
                }
            }
            else
                commit = store.get('git-source-binding', job.sourceRevisionId).gitCommit;
            if (job.action === 'source') {
                const ref = `refs/pi/source/${job.sourceRevisionId}`, old = await repo.ref(ref);
                fence();
                ensure(!old || old === commit, 'GIT_HISTORY_FROZEN', '历史源码 ref 不可重写');
                if (!old) {
                    await repo.updateRef(ref, commit, null);
                    fence();
                }
            }
            else if (job.action === 'checkout') {
                ensure(snapshot(this.app.context, job.previousWorkspace).digest === job.snapshot.digest, 'GIT_DIRTY_CONFLICT', '旧工作区在准备期间已变化，原目录保留');
                const branchHead = await repo.ref(job.branch);
                fence();
                ensure(!branchHead || branchHead === commit, 'GIT_HEAD_CONFLICT', '工作区分支已有其他来源');
                if (!branchHead) {
                    await repo.updateRef(job.branch, commit, null);
                    fence();
                }
                if (!existsSync(join(job.workspace, '.git'))) {
                    await repo.addWorktree(job.workspace, job.branch, commit);
                    fence();
                }
                const w = await repo.inspectWorktree(job.workspace);
                fence();
                ensure(w.head === commit && w.branch === job.branch, 'GIT_WORKTREE_CONFLICT', '已有工作区不属于此操作');
                if (!hadReceipt)
                    this.restoreSnapshot(job.snapshot, job.workspace, store.get('source-revision', job.sourceRevisionId).snapshot);
                ensure(snapshot(this.app.context, job.workspace).digest === job.snapshot.digest, 'GIT_DIRTY_CONFLICT', '目标工作区内容已变化，禁止覆盖');
                const old = await repo.ref(receipt);
                fence();
                ensure(!old || old === commit, 'GIT_RECEIPT_CONFLICT', '工作区操作回执不符');
                if (!old) {
                    await repo.updateRef(receipt, commit, null);
                    fence();
                }
            }
            else {
                ensure(snapshot(this.app.context, job.workspace).digest === job.snapshot.digest, 'GIT_DIRTY_CONFLICT', '提交准备后源码已变化，保留原目录与候选提交');
                const old = await repo.ref(job.branch);
                fence();
                ensure(old === job.expectedHead || old === commit, 'GIT_HEAD_CONFLICT', '分支出现其他提交，不能覆盖');
                if (old !== commit) {
                    await repo.updateRef(job.branch, commit, job.expectedHead);
                    fence();
                }
                await repo.setWorktreeIndex(job.workspace, commit);
                fence();
            }
            store.transaction(() => {
                job = fence();
                assertProjectWritable(store, pid);
                validateSourceRevision(this.app.context, pid, job.sourceRevisionId);
                if (job.action === 'source') {
                    const prior = store.maybe('git-source-binding', job.sourceRevisionId), r = store.get('source-revision', job.sourceRevisionId), provenance = store.get('git-import-provenance', job.id);
                    if (prior)
                        ensure(prior.gitCommit === commit && prior.sourceDigest === job.snapshot.digest, 'GIT_SOURCE_CONFLICT', '已有源码绑定不一致');
                    else
                        store.create('git-source-binding', pid, { sourceRevisionId: r.id, sourceDigest: r.sourceDigest, originalCreatedAt: r.createdAt, gitCommit: commit, importedAt: now(), captureKind: provenance.captureKind, operationId: job.id }, r.id);
                }
                else {
                    const s = this.validateSession(job), w = store.get('git-workspace', s.id, pid);
                    ensure(w.operationId === job.id, 'GIT_SOURCE_CONFLICT', '会话 Git 操作已被替代');
                    ensure(snapshot(this.app.context, job.action === 'checkout' ? job.previousWorkspace : s.workspace).digest === job.snapshot.digest, 'GIT_DIRTY_CONFLICT', '发布前源码发生变化');
                    if (job.action === 'checkout') {
                        ensure(s.workspace === job.previousWorkspace, 'GIT_WORKTREE_CONFLICT', '会话目录已变化');
                        store.update('session', s.id, s.version, { workspace: job.workspace });
                    }
                    const base = job.action === 'checkout' ? snapshot(this.app.context, store.get('source-revision', job.sourceRevisionId).snapshot.path) : job.snapshot;
                    store.update('git-workspace', w.id, w.version, { state: 'ready', head: commit, snapshot: base });
                    leases.acquire(pid, w.branch, `session:${s.id}`);
                }
                store.update('git-operation', job.id, job.version, { state: 'complete', gitCommit: commit, leaseUntil: 0 });
                store.event(pid, 'git.operation_completed', { operationId: job.id, gitCommit: commit, sessionId: job.sessionId });
            });
        }
        catch (error) {
            const e = asError(error);
            try {
                store.transaction(() => { job = fence(); const state = /CONFLICT|FROZEN|CORRUPTED|STALE/.test(e.code) ? 'conflict' : 'failed'; store.update('git-operation', job.id, job.version, { state, error: e.code, diagnostic: e.message.slice(0, 4000), leaseUntil: 0 }); if (job.sessionId) {
                    const w = store.get('git-workspace', job.sessionId);
                    if (w.operationId === job.id)
                        store.update('git-workspace', w.id, w.version, { state });
                } store.event(pid, 'git.operation_failed', { operationId: job.id, error: e.code }); });
            }
            catch { }
        }
        finally {
            clearInterval(renew);
            try {
                leases.release(pid, 'repository', owner, claimed.lease.generation);
            }
            catch { }
        }
        return true;
    }
    retry(actor, pid, id) {
        ensure(actor.type === 'user', 'PERMISSION_DENIED', '恢复操作需要用户身份', 403);
        return this.app.store.transaction(() => { const op = this.app.store.get('git-operation', id, pid); ensure(['failed', 'conflict'].includes(op.state), 'GIT_OPERATION_BUSY', '只能重试已停止的 Git 操作'); assertProjectWritable(this.app.store, pid); this.app.store.update('git-operation', id, op.version, { state: 'queued', error: undefined, leaseUntil: 0 }); if (op.sessionId) {
            const w = this.app.store.get('git-workspace', op.sessionId);
            ensure(w.operationId === id, 'GIT_SOURCE_CONFLICT', '操作已被替代');
            this.app.store.update('git-workspace', w.id, w.version, { state: 'pending' });
        } return this.operation(actor, pid, id); });
    }
    validateSession(job) {
        const s = this.app.store.get('session', job.sessionId, job.projectId);
        ensure(s.state !== 'archived' && s.sourceRevisionId === job.sourceRevisionId, 'GIT_SOURCE_CONFLICT', '会话来源已失效');
        if (s.taskId) {
            const t = this.app.store.get('task', s.taskId), team = this.app.store.get('team', t.teamId);
            ensure(['pending', 'running'].includes(t.execution) && team.state === 'active' && team.delegationEnabled, 'TASK_INPUT_STALE', '任务不再允许准备源码');
            this.app.approvals.assert(team.approvalId, job.projectId, team.id, team.planDigest, 'collaboration');
        }
        return s;
    }
    restoreSnapshot(input, workspace, base) {
        verifySnapshot(input.path, input.files);
        const wanted = new Map(input.files.map(f => [f.path, f])), original = new Map(base.files.map(f => [f.path, f]));
        // Before the receipt exists, resume only recognizable base/candidate bytes, never overwrite an unrelated edit.
        const existing = listFiles(workspace);
        for (const f of existing) {
            const hash = digest(readStableFile(workspace, f.path, 64 * 1024 * 1024));
            ensure(hash === wanted.get(f.path)?.digest || hash === original.get(f.path)?.digest, 'GIT_DIRTY_CONFLICT', '未发布工作区出现其他修改，原目录保留');
        }
        for (const f of existing)
            if (!wanted.has(f.path))
                unlinkSync(safePath(workspace, f.path));
        const emptyDirectories = (relative = '') => { const root = safePath(workspace, relative, true); for (const e of readdirSync(root, { withFileTypes: true })) {
            if (e.name === '.git')
                continue;
            if (e.isDirectory())
                emptyDirectories(relative ? `${relative}/${e.name}` : e.name);
        } if (relative && readdirSync(root).length === 0)
            rmdirSync(root); };
        emptyDirectories();
        for (const f of input.files) {
            const target = safePath(workspace, f.path);
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, readStableFile(input.path, f.path, 64 * 1024 * 1024), { mode: 0o600 });
        }
        setSourceModes(workspace, input.files);
    }
}
//# sourceMappingURL=git-service.js.map