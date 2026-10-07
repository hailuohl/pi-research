import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { asError, ensure } from '../domain/errors.js';
import { object, integer, text } from '../contracts/validation.js';
import { userOnly, scope, interactiveCoordinator } from '../policy/permissions.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { assertWorkingGrantReference } from '../policy/working-grant-validation.js';
import { digest, now } from '../storage/store.js';
import { snapshotDirectory, verifySnapshot } from './files.js';
import { validateSourceRevision } from './source-access.js';
import { GitCommand } from './git-command.js';
import { WorkspaceLeases } from './leases.js';
import { excluded, safeExportBytes } from '../publications/reports.js';
import { GitHubCommand } from './github-command.js';
export function githubSlug(name) { const { pinyin } = createRequire(import.meta.url)('pinyin-pro'); return pinyin(name, { toneType: 'none', nonZh: 'consecutive', separator: '-' }).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[^A-Za-z0-9]+|[.-]+$/g, '').slice(0, 90).replace(/[.-]+$/g, '') || 'project'; }
const active = (j) => ['creating', 'uploading'].includes(j.state);
function alive(pid) { if (!pid)
    return false; try {
    process.kill(pid, 0);
    return true;
}
catch (e) {
    return e.code !== 'ESRCH';
} }
export class GitHubUploadService {
    app;
    client;
    running;
    stopped = false;
    constructor(app, client = new GitHubCommand()) {
        this.app = app;
        this.client = client;
    }
    status(actor) { userOnly(actor); return this.client.status(); }
    async createProject(actor, input, key) {
        userOnly(actor);
        text(key, 'Idempotency-Key', 200);
        const x = object(input), request = { body: x, query: '' }, old = this.app.store.operationResult('POST:/projects', key, request);
        if (old.found)
            return old.value;
        ensure(Object.keys(x).every(k => ['name', 'description', 'template', 'github'].includes(k)), 'INVALID_INPUT', '项目包含未知字段', 400);
        const github = object(x.github);
        ensure(Object.keys(github).length === 2 && github.enabled === true, 'INVALID_INPUT', 'github 需要 enabled:true 和 expectedAccountId', 400);
        const expected = integer(github.expectedAccountId, 'expectedAccountId', 1), status = await this.client.status();
        ensure(status.ready && status.gitInstalled && status.cliInstalled && status.account?.id === expected, 'GITHUB_NOT_READY', 'GitHub 未就绪或账号已变化，请刷新状态');
        const account = status.account;
        const { github: _, ...local } = x;
        return this.app.store.operation('POST:/projects', key, request, () => {
            const p = this.app.projects.create(actor, local), snapshot = this.app.store.paths.referenceSnapshot(snapshotDirectory(this.app.store.paths.physical(p.workspace), join(this.app.context.dataDir, 'snapshots'))), setting = this.app.store.create('github-setting', p.id, { enabled: true, epoch: 1, account, baseName: githubSlug(p.name), eventCursor: this.app.store.eventCursor(p.id), origin: 'user-project-setting' }, p.id), id = randomUUID();
            this.app.store.create('github-upload-job', p.id, { state: 'queued', phase: 'create', epoch: setting.epoch, snapshot, commitDate: now(), ref: 'refs/heads/main', candidate: setting.baseName, suffix: 0, marker: `Pi Research upload ${id}`, generation: 0, leaseUntil: 0 }, id);
            this.app.store.event(p.id, 'github.enabled', { accountId: account.id, automaticCommittedSource: true });
            return this.app.store.update('project', p.id, p.version, { gitHistoryEnabled: true });
        });
    }
    inspect(actor, pid) {
        userOnly(actor);
        scope(actor, pid);
        const project = this.app.store.get('project', pid), s = this.app.store.maybe('github-setting', pid);
        if (!s)
            return { version: 0, enabled: false, state: 'local', pendingCount: 0, retryable: false };
        const jobs = this.app.store.list('github-upload-job', pid), pending = jobs.filter(j => j.state !== 'synced'), first = this.next(s, pending), current = pending.filter(j => j.epoch === s.epoch || active(j) || j.state === 'unknown' || !s.repository && !j.operationId), state = !s.enabled || project.archived ? 'paused' : first?.state ?? (s.repository ? 'synced' : 'queued');
        return { version: s.version, enabled: s.enabled, state, account: s.account, ...(s.repository ? { repository: s.repository } : {}), pendingCount: current.length, ...(s.lastCommit ? { lastCommit: s.lastCommit } : {}), ...(first?.error ? { error: first.error } : {}), retryable: s.enabled && !project.archived && !!first && ['failed', 'unknown', 'paused'].includes(first.state) && !alive(first.workerPid) };
    }
    inspectCommit(actor, pid, commit) {
        scope(actor, pid);
        ensure(typeof commit === 'string' && commit.length === 40 && /^[0-9a-f]{40}$/.test(commit), 'INVALID_INPUT', 'githubCommit 需要40位小写完整 SHA', 400);
        return this.app.store.readSnapshot(() => {
            if (actor.type === 'agent')
                interactiveCoordinator(actor, pid, this.app.operations.authorizeAgent(actor, 'project_inspect'));
            else
                userOnly(actor);
            this.app.store.get('project', pid);
            const setting = this.app.store.maybe('github-setting', pid);
            const jobs = this.app.store.db.prepare("SELECT id,json_extract(data,'$.operationId') operationId,json_extract(data,'$.ref') ref,json_extract(data,'$.state') state,json_extract(data,'$.error.code') errorCode,json_extract(data,'$.updatedAt') recordedAt FROM records WHERE kind='github-upload-job' AND project_id=? AND json_extract(data,'$.commit')=? ORDER BY rowid DESC LIMIT 21").all(pid, commit);
            return { commit, enabled: setting?.enabled ?? false, observedAt: now(), receipts: jobs.slice(0, 20).map(j => ({ jobId: String(j.id), ...(j.operationId ? { operationId: String(j.operationId) } : {}), ref: String(j.ref), state: j.state, ...(j.errorCode ? { errorCode: String(j.errorCode) } : {}), recordedAt: String(j.recordedAt) })), hasMore: jobs.length > 20 };
        });
    }
    configure(actor, pid, input) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(input);
        ensure(Object.keys(x).every(k => ['expectedVersion', 'enabled'].includes(k)) && typeof x.enabled === 'boolean', 'INVALID_INPUT', '需要 expectedVersion 和 enabled', 400);
        const expected = integer(x.expectedVersion, 'expectedVersion', 1);
        this.app.store.transaction(() => { assertProjectWritable(this.app.store, pid); const s = this.app.store.get('github-setting', pid); ensure(s.version === expected, 'VERSION_CONFLICT', 'GitHub 设置已变化'); if (s.enabled === x.enabled)
            return; this.app.store.update('github-setting', pid, s.version, { enabled: x.enabled, epoch: s.epoch + 1, eventCursor: this.app.store.eventCursor(pid) }); for (const j of this.app.store.list('github-upload-job', pid))
            if (j.state === 'queued')
                this.app.store.update('github-upload-job', j.id, j.version, { state: 'paused' }); this.app.store.event(pid, 'github.configured', { enabled: x.enabled }); });
        return this.inspect(actor, pid);
    }
    retry(actor, pid, input) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(input);
        ensure(Object.keys(x).length === 1, 'INVALID_INPUT', '恢复只接受 expectedVersion', 400);
        const expected = integer(x.expectedVersion, 'expectedVersion', 1);
        this.app.store.transaction(() => { assertProjectWritable(this.app.store, pid); const s = this.app.store.get('github-setting', pid); ensure(s.version === expected && s.enabled, 'VERSION_CONFLICT', '设置已变化或同步已关闭'); const pending = this.app.store.list('github-upload-job', pid).filter(j => j.state !== 'synced'), job = this.next(s, pending); ensure(job && ['failed', 'unknown', 'paused'].includes(job.state) && !alive(job.workerPid), 'GITHUB_JOB_BUSY', '任务仍在运行或没有可恢复任务'); this.source(job); this.app.store.update('github-upload-job', job.id, job.version, { state: job.state === 'unknown' ? 'unknown' : 'queued', epoch: s.epoch, workerPid: undefined, leaseUntil: 0, error: undefined }); this.app.store.update('github-setting', pid, s.version, {}); this.app.store.event(pid, 'github.retry_requested', { jobId: job.id }); });
        return this.inspect(actor, pid);
    }
    /** Called under the same transaction that completes the local operation. Disabled periods are not backfilled. */
    completed(op) {
        const s = this.app.store.maybe('github-setting', op.projectId);
        if (!s?.enabled || op.action === 'checkout' || op.state !== 'complete' || !op.gitCommit)
            return;
        const id = digest({ projectId: op.projectId, operationId: op.id, kind: 'github-sync' });
        if (this.app.store.maybe('github-upload-job', id))
            return;
        this.app.store.create('github-upload-job', op.projectId, { state: 'queued', phase: 'push', epoch: s.epoch, operationId: op.id, snapshot: op.snapshot, commitDate: op.commitDate, commit: op.gitCommit, ref: op.action === 'source' ? `refs/heads/source-${op.sourceRevisionId}` : op.branch, candidate: s.repository?.fullName.split('/')[1] ?? s.baseName, suffix: 0, marker: '', generation: 0, leaseUntil: 0 }, id);
    }
    source(job) { verifySnapshot(this.app.store.paths.physical(job.snapshot.path), job.snapshot.files); if (!job.operationId)
        return; const op = this.app.store.get('git-operation', job.operationId, job.projectId); ensure(op.state === 'complete' && op.gitCommit === job.commit && op.snapshot.digest === job.snapshot.digest, 'GITHUB_SOURCE_CHANGED', '本地受管提交与同步记录不一致'); validateSourceRevision(this.app.context, job.projectId, op.sourceRevisionId); if (op.permission)
        this.app.sessionPermissions.assertGit({ ...op, id: op.id }); if (op.workingGrant)
        assertWorkingGrantReference(this.app.store, job.projectId, op.workingGrant, true); }
    async checkHistory(job, repo) {
        await repo.verifyHistory([job.commit], true);
        // ponytail: recheck at most 200 commits/64 MiB; add verified-object caching when real history exceeds this bound.
        const history = await repo.history(job.commit), known = this.app.store.list('git-operation', job.projectId).filter(o => o.state === 'complete' && o.gitCommit && o.action !== 'checkout'), initial = this.app.store.list('github-upload-job', job.projectId).filter(j => !j.operationId && j.commit), checked = [];
        let size = 0;
        const secrets = Object.entries(process.env).filter(([k, v]) => /token|password|secret|api[_-]?key/i.test(k) && v && v.length >= 8).flatMap(([, v]) => [v, JSON.stringify(v).slice(1, -1)]), scanned = new Set();
        const check = (path, bytes) => { ensure(!excluded(path) && !/(^|\/)(?:state\.db(?:-.*)?|.*\.(?:sqlite|sqlite3))$/i.test(path), 'GITHUB_SOURCE_DENIED', '源码历史包含禁止上传的路径'); ensure(!secrets.some(s => path.includes(s) || bytes.includes(Buffer.from(s))), 'EXPORT_SECRET_DETECTED', '源码历史含当前配置凭据'); safeExportBytes(bytes, this.app.context); };
        for (const h of history) {
            const op = known.find(o => o.gitCommit === h.commit), init = initial.find(j => j.commit === h.commit);
            ensure(op || init, 'GITHUB_HISTORY_UNOWNED', '提交祖先不属于本项目受管历史');
            const snapshot = op?.snapshot ?? init.snapshot;
            checked.push({ ...job, operationId: op?.id, commit: h.commit, snapshot });
            if (op) {
                this.source({ ...job, operationId: op.id, commit: op.gitCommit, snapshot });
                const parents = op.action === 'commit' ? [op.expectedHead] : op.parentSourceRevisionId ? [this.app.store.get('git-source-binding', op.parentSourceRevisionId, job.projectId).gitCommit] : [];
                ensure(digest(h.parents) === digest(parents), 'GITHUB_HISTORY_CHANGED', '提交祖先与受管记录不符');
            }
            else
                ensure(h.parents.length === 0, 'GITHUB_HISTORY_CHANGED', '初始上传不得携带祖先');
            check('commit-message', h.message);
            const tree = await repo.tree(h.commit);
            ensure(tree.length === snapshot.files.length, 'GITHUB_HISTORY_CHANGED', '提交文件清单不符');
            for (const f of tree) {
                const expected = snapshot.files.find(e => e.path === f.path);
                ensure(expected && (expected.mode ?? '100644') === f.mode, 'GITHUB_HISTORY_CHANGED', '提交路径或模式不符');
                const bytes = await repo.readBlob(f.oid);
                ensure(bytes.length === expected.size && digest(bytes) === expected.digest, 'GITHUB_HISTORY_CHANGED', '提交字节与固定源码不符');
                if (!scanned.has(f.oid)) {
                    size += bytes.length;
                    ensure(size <= 64 * 1024 * 1024, 'GITHUB_HISTORY_LIMIT', '待核对源码历史超过64 MiB');
                    scanned.add(f.oid);
                    check(f.path, bytes);
                }
                else
                    check(f.path, Buffer.alloc(0));
            }
        }
        return checked;
    }
    tick() { if (!this.running && !this.stopped)
        this.running = this.processNext().catch(() => { }).finally(() => { this.running = undefined; }); }
    next(s, jobs) { return jobs.find(j => active(j) || j.state === 'unknown') ?? (!s.repository ? jobs.find(j => !j.operationId) : jobs.find(j => j.epoch === s.epoch)); }
    async stop() { this.stopped = true; await this.running; }
    async processNext(projectId) {
        const store = this.app.store, leases = new WorkspaceLeases(store), owner = randomUUID();
        let claimed;
        store.transaction(() => {
            for (const s of store.list('github-setting', projectId)) {
                const pid = s.projectId;
                if (!s.enabled || store.get('project', pid).archived)
                    continue;
                const job = this.next(s, store.list('github-upload-job', pid).filter(j => j.state !== 'synced'));
                if (!job)
                    continue;
                if (active(job)) {
                    if (alive(job.workerPid))
                        continue;
                    store.update('github-upload-job', job.id, job.version, { state: 'unknown', workerPid: undefined, leaseUntil: 0, error: { code: 'GITHUB_RESPONSE_UNKNOWN', message: '上次进程退出，须先核对远端结果' } });
                    continue;
                }
                if (!['queued', 'unknown'].includes(job.state) || job.epoch !== s.epoch || job.leaseUntil > Date.now() || alive(job.workerPid))
                    continue;
                // Unknown is only automatically reconciled once; unresolved results await explicit retry.
                if (job.state === 'unknown' && job.error)
                    continue;
                let lease;
                try {
                    lease = leases.acquire(pid, 'github-upload', owner);
                }
                catch {
                    continue;
                }
                claimed = { job: store.update('github-upload-job', job.id, job.version, { workerPid: process.pid, generation: job.generation + 1, leaseUntil: Date.now() + 60000 }), lease };
                break;
            }
        });
        if (!claimed)
            return false;
        let job = claimed.job, historySources = [];
        const pid = job.projectId, repo = new GitCommand(this.app.context.dataDir, pid), generation = job.generation;
        let attempted = false, unresolvedWrite = job.state === 'unknown';
        const fence = () => { leases.assert(pid, 'github-upload', owner, claimed.lease.generation); const j = store.get('github-upload-job', job.id, pid), s = store.get('github-setting', pid); ensure(j.generation === generation && j.workerPid === process.pid && s.enabled && s.epoch === j.epoch, 'GITHUB_SYNC_PAUSED', '同步设置已变化，禁止新外发'); assertProjectWritable(store, pid); this.source(j); for (const ancestor of historySources)
            this.source(ancestor); return { j, s }; };
        const renew = setInterval(() => { try {
            store.transaction(() => { const { j } = fence(); leases.renew(pid, 'github-upload', owner, claimed.lease.generation); store.update('github-upload-job', j.id, j.version, { leaseUntil: Date.now() + 60000 }); });
        }
        catch { } }, 3000);
        const patch = (value) => { const current = store.get('github-upload-job', job.id); job = store.update('github-upload-job', current.id, current.version, value); };
        try {
            let { s } = fence();
            const connection = await this.client.connect(s.account.id);
            fence();
            ensure(connection.account.login === s.account.login, 'GITHUB_ACCOUNT_CHANGED', 'GitHub 账号名称已变化，请核对固定目标');
            if (!job.commit) {
                const commit = await repo.commitSnapshot(store.paths.physicalSnapshot(job.snapshot), join(this.app.context.dataDir, 'git-operations', job.id), { message: 'Initial project source', date: job.commitDate });
                fence();
                const ref = `refs/pi/operations/${job.id}`, old = await repo.ref(ref);
                ensure(!old || old === commit, 'GITHUB_SOURCE_CHANGED', '初始提交回执不同');
                if (!old)
                    await repo.updateRef(ref, commit, null);
                patch({ commit });
            }
            historySources = await this.checkHistory(job, repo);
            fence();
            const verify = async (name) => { const remote = await connection.repository(name); fence(); ensure(remote, 'GITHUB_REPOSITORY_MISSING', '固定远端仓库不可访问'); const current = store.get('github-setting', pid); ensure(remote.ownerId === current.account.id && remote.private === true && (!current.repository || remote.id === current.repository.id && remote.fullName === current.repository.fullName), 'GITHUB_REPOSITORY_MISMATCH', '固定仓库身份或私密性变化'); return remote; };
            if (!s.repository) {
                ensure(!job.operationId, 'GITHUB_INITIAL_REQUIRED', '初始仓库尚未绑定');
                let remote = null;
                if (job.state === 'unknown') {
                    remote = await connection.repository(job.candidate);
                    fence();
                    // Only an explicit retry clears the unknown error. A missing target may then be retried at this exact name.
                    if (!remote) {
                        patch({ state: 'creating' });
                        attempted = true;
                        try {
                            remote = await connection.create(job.candidate, job.marker);
                        }
                        catch (e) {
                            if (asError(e).code !== 'GITHUB_NAME_EXISTS')
                                throw e;
                            remote = await connection.repository(job.candidate);
                            fence();
                        }
                    }
                    ensure(remote && remote.description === job.marker, 'GITHUB_RESPONSE_UNKNOWN', '不能确认上次创建结果；保留候选名称，禁止换名重建');
                }
                else
                    for (;;) {
                        fence();
                        remote = await connection.repository(job.candidate);
                        fence();
                        if (remote) {
                            if (remote.description === job.marker)
                                break;
                            ensure(job.suffix < 99, 'GITHUB_NAME_LIMIT', '仓库重名次数超过上限');
                            const suffix = job.suffix + 1;
                            patch({ candidate: `${s.baseName}-${suffix}`, suffix });
                            continue;
                        }
                        patch({ state: 'creating', phase: 'create' });
                        attempted = true;
                        try {
                            remote = await connection.create(job.candidate, job.marker);
                            break;
                        }
                        catch (e) {
                            if (asError(e).code !== 'GITHUB_NAME_EXISTS')
                                throw e;
                            attempted = false;
                            ensure(job.suffix < 99, 'GITHUB_NAME_LIMIT', '仓库重名次数超过上限');
                            const suffix = job.suffix + 1;
                            patch({ state: 'queued', candidate: `${s.baseName}-${suffix}`, suffix });
                        }
                    }
                fence();
                ensure(remote && remote.ownerId === s.account.id && remote.private === true && remote.fullName === `${s.account.login}/${job.candidate}` && remote.description === job.marker, 'GITHUB_REPOSITORY_MISMATCH', '创建仓库回执不符');
                const verified = await verify(job.candidate);
                ensure(verified.id === remote.id && verified.description === job.marker, 'GITHUB_REPOSITORY_MISMATCH', '创建仓库回读不符');
                store.transaction(() => { const current = fence().s; store.update('github-setting', pid, current.version, { repository: { id: remote.id, fullName: remote.fullName, url: remote.url, private: true } }); patch({ phase: 'push', state: 'queued' }); });
                attempted = false;
                unresolvedWrite = false;
                s = store.get('github-setting', pid);
            }
            const name = s.repository.fullName.split('/')[1];
            await verify(name);
            const current = await connection.ref(name, job.ref);
            fence();
            if (current !== job.commit) {
                if (current) {
                    const prior = store.list('github-upload-job', pid).filter(j => j.state === 'synced' && j.ref === job.ref).at(-1);
                    ensure(prior?.commit === current, 'GITHUB_REMOTE_CONFLICT', '远端分支包含未核实的更改');
                }
                patch({ state: 'uploading', phase: 'push', candidate: name });
                fence();
                attempted = true;
                await connection.push(repo.repoPath, name, job.commit, job.ref);
                fence();
            }
            await verify(name);
            ensure(await connection.ref(name, job.ref) === job.commit, 'GITHUB_PUSH_UNKNOWN', '远端分支尚未确认准确提交');
            store.transaction(() => { const current = fence().s; patch({ state: 'synced', workerPid: undefined, leaseUntil: 0, error: undefined }); store.update('github-setting', pid, current.version, { lastCommit: job.commit }); store.event(pid, 'github.synced', { jobId: job.id, operationId: job.operationId, commit: job.commit, ref: job.ref, repositoryId: current.repository.id }); });
        }
        catch (error) {
            const e = asError(error);
            store.transaction(() => { const current = store.get('github-upload-job', job.id); if (current.generation !== generation)
                return; patch({ state: unresolvedWrite || attempted && e.code !== 'GITHUB_CREATE_FAILED' ? 'unknown' : ['GITHUB_SYNC_PAUSED', 'PROJECT_ARCHIVED'].includes(e.code) ? 'paused' : 'failed', workerPid: undefined, leaseUntil: 0, error: { code: e.code, message: e.message } }); });
        }
        finally {
            clearInterval(renew);
            try {
                leases.release(pid, 'github-upload', owner, claimed.lease.generation);
            }
            catch { }
        }
        return true;
    }
}
//# sourceMappingURL=github-upload.js.map