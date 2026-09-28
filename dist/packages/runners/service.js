import { assertExperimentSourceCurrent, assertProjectWritable } from '../policy/lifecycle.js';
import { answerDisposition, assertOutcomeBoundary } from './outcome.js';
import { object, text, integer, oneOf } from '../contracts/validation.js';
import { collectRunArtifacts } from './artifacts.js';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync, openSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { ensure, asError } from '../domain/errors.js';
import { scope, userOnly, toolAllowed } from '../policy/permissions.js';
import { digest, now } from '../storage/store.js';
import { snapshotDirectory, verifySnapshot } from '../workspace/files.js';
import { verifyTrustedExample } from './contracts.js';
export const TERMINAL = ['succeeded', 'failed', 'cancelled'];
export class RunService {
    c;
    approvals;
    evidence;
    launching = new Set();
    constructor(c, approvals, evidence) {
        this.c = c;
        this.approvals = approvals;
        this.evidence = evidence;
    }
    get(actor, id) { const run = this.c.store.get('run', id); scope(actor, run.projectId); return run; }
    prepare(actor, experimentId) {
        if (actor.type !== 'user')
            toolAllowed(actor, 'run_prepare');
        return this.c.store.transaction(() => { const e = this.c.store.get('experiment', experimentId); scope(actor, e.projectId); assertProjectWritable(this.c.store, e.projectId); assertExperimentSourceCurrent(this.c.store, e); ensure(e.lifecycle !== 'archived', 'EXPERIMENT_ARCHIVED', '归档实验不能执行'); assertOutcomeBoundary(this.c.store, e); const snap = snapshotDirectory(e.workspace, join(this.c.dataDir, 'snapshots')); const manifest = { experimentId: e.id, experimentVersion: e.version, experimentRevision: e.revision, contract: structuredClone(e.contract), contractDigest: e.contractDigest, snapshotDigest: snap.digest, snapshotPath: snap.path, sourceFiles: snap.files, createdAt: now() }; verifyTrustedExample(manifest, this.c.repoRoot); const id = randomUUID(), hash = digest(manifest); const approval = this.approvals.request(e.projectId, 'run-intent', id, hash, 'run.submit', '批准此不可变快照、固定运行契约及计算资源；不授予其他实验权限'); const result = this.c.store.create('run-intent', e.projectId, { experimentId: e.id, manifest, manifestDigest: hash, approvalId: approval.id, status: 'prepared' }, id); this.c.store.event(e.projectId, 'run.prepared', { intentId: id, experimentId: e.id, approvalId: approval.id, snapshotDigest: snap.digest }); return result; });
    }
    submit(actor, id) {
        if (actor.type !== 'user')
            toolAllowed(actor, 'run_submit');
        return this.c.store.transaction(() => {
            const intent = this.c.store.get('run-intent', id);
            scope(actor, intent.projectId);
            if (intent.runId)
                return this.c.store.get('run', intent.runId);
            assertProjectWritable(this.c.store, intent.projectId);
            const e = this.c.store.get('experiment', intent.experimentId, intent.projectId);
            assertExperimentSourceCurrent(this.c.store, e);
            ensure(e.revision === intent.manifest.experimentRevision && e.contractDigest === intent.manifest.contractDigest, 'APPROVAL_STALE', '实验方案已修改，请重新准备并批准');
            assertOutcomeBoundary(this.c.store, e);
            this.approvals.assert(intent.approvalId, intent.projectId, id, intent.manifestDigest, 'run.submit');
            verifySnapshot(intent.manifest.snapshotPath, intent.manifest.sourceFiles);
            verifyTrustedExample(intent.manifest, this.c.repoRoot);
            if (intent.manifest.contract.runner === 'docker') {
                const check = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], { encoding: 'utf8', timeout: 4000 });
                ensure(check.status === 0, 'RUNNER_UNAVAILABLE', 'Docker 服务未就绪；不会回退到无隔离宿主执行', 503);
            }
            const runId = randomUUID(), outputDir = join(this.c.dataDir, 'jobs', runId, 'output');
            mkdirSync(outputDir, { recursive: true, mode: 0o777 });
            const run = this.c.store.create('run', intent.projectId, { experimentId: e.id, intentId: id, manifest: intent.manifest, manifestDigest: intent.manifestDigest, state: 'queued', integrity: 'pending', judgment: 'pending', outputDir, cancelRequested: false, artifactIds: [], evidenceIds: [] }, runId);
            this.c.store.update('run-intent', id, intent.version, { status: 'submitted', runId });
            this.c.store.event(intent.projectId, 'run.queued', { runId, intentId: id });
            return run;
        });
    }
    /** Keep the version read and heartbeat write in one inter-process SQLite transaction. */
    heartbeat(id) {
        return this.c.store.transaction(() => {
            const run = this.c.store.get('run', id);
            if (TERMINAL.includes(run.state))
                return run;
            return this.c.store.update('run', id, run.version, { heartbeat: Date.now() });
        });
    }
    /** Recheck the durable execution grant inside the transaction that claims a queued Run. */
    assertLaunchable(run) {
        ensure(run.state === 'queued' && !run.startedAt && !run.childPid && !run.cancelRequested, 'RUN_NOT_LAUNCHABLE', '作业已启动、取消或不再排队');
        assertProjectWritable(this.c.store, run.projectId);
        const e = this.c.store.get('experiment', run.experimentId, run.projectId);
        assertExperimentSourceCurrent(this.c.store, e);
        ensure(e.lifecycle !== 'archived', 'EXPERIMENT_ARCHIVED', '归档实验不能执行');
        const intent = this.c.store.get('run-intent', run.intentId, run.projectId);
        ensure(intent.status === 'submitted' && intent.runId === run.id && intent.experimentId === e.id && run.manifest.experimentId === e.id &&
            intent.manifestDigest === run.manifestDigest && digest(intent.manifest) === run.manifestDigest && digest(run.manifest) === run.manifestDigest, 'APPROVAL_STALE', '作业、运行意向与已批准快照不一致');
        ensure(e.revision === run.manifest.experimentRevision && e.contractDigest === run.manifest.contractDigest, 'APPROVAL_STALE', '实验方案已修改，请重新准备并批准');
        assertOutcomeBoundary(this.c.store, e);
        this.approvals.assert(intent.approvalId, run.projectId, intent.id, run.manifestDigest, 'run.submit');
    }
    /** Both launch callers hold the same write transaction as their authorization check. */
    cancelBeforeLaunch(run, error) {
        if (run.state !== 'queued' || run.startedAt || run.childPid)
            return;
        const reason = asError(error);
        this.c.store.update('run', run.id, run.version, { state: 'cancelled', cancelRequested: true, integrity: 'incomplete', endedAt: now(), error: `${reason.code}: ${reason.message}` });
        this.c.store.event(run.projectId, 'run.cancelled_before_launch', { runId: run.id, reason: reason.code });
    }
    launchPending() {
        this.c.store.transaction(() => {
            for (const run of this.c.store.list('run').filter(r => r.state === 'queued' && !r.startedAt && !r.childPid)) {
                try {
                    this.assertLaunchable(run);
                }
                catch (error) {
                    this.cancelBeforeLaunch(run, error);
                }
            }
        });
        const all = this.c.store.list('run');
        if (all.some(r => ['submitting', 'running', 'cancelling', 'unknown'].includes(r.state)))
            return;
        const run = all.find(r => r.state === 'queued' && !r.startedAt && !r.childPid && !this.launching.has(r.id));
        if (!run)
            return;
        this.launching.add(run.id);
        const logDir = join(this.c.dataDir, 'jobs', run.id, 'control');
        mkdirSync(logDir, { recursive: true, mode: 0o700 });
        const fd = openSync(join(logDir, 'supervisor.log'), 'a', 0o600);
        try {
            const child = spawn(process.execPath, [join(this.c.repoRoot, 'dist', 'apps', 'runner-supervisor', 'index.js'), this.c.dataDir, this.c.repoRoot, run.id], { detached: process.platform !== 'win32', stdio: ['ignore', fd, fd], env: { PATH: process.env.PATH ?? '', SystemRoot: process.env.SystemRoot ?? '', HOME: logDir }, windowsHide: true });
            child.on('error', () => { this.launching.delete(run.id); });
            child.unref();
        }
        finally {
            closeSync(fd);
        }
        setTimeout(() => this.launching.delete(run.id), 2000).unref();
    }
    cancel(actor, id) {
        userOnly(actor);
        return this.c.store.transaction(() => {
            const r = this.get(actor, id);
            if (TERMINAL.includes(r.state))
                return r;
            ensure(r.state !== 'unknown', 'PROVIDER_STATE_UNKNOWN', '作业状态未知，禁止盲目按 PID 取消；请先对账', 409);
            const queued = r.state === 'queued';
            const result = this.c.store.update('run', id, r.version, { cancelRequested: true, state: queued ? 'cancelled' : 'cancelling', ...(queued ? { integrity: 'incomplete', endedAt: now() } : {}) });
            this.c.store.event(r.projectId, 'run.cancel_requested', { runId: id });
            return result;
        });
    }
    logs(actor, id, cursor = 0) { const run = this.get(actor, id); const path = join(run.outputDir, 'stdout.log'); const bytes = existsSync(path) ? readFileSync(path) : Buffer.alloc(0); const start = Math.min(Math.max(0, cursor), bytes.length), end = Math.min(start + 65536, bytes.length); return { content: bytes.subarray(start, end).toString('utf8'), cursor: end, complete: TERMINAL.includes(run.state) && end === bytes.length }; }
    finalize(id, exitCode, state, error) {
        return this.c.store.transaction(() => {
            let r = this.c.store.get('run', id);
            if (TERMINAL.includes(r.state))
                return r;
            const { integrity, metrics, artifactIds, evidenceIds, errors } = collectRunArtifacts(r, this.evidence);
            if (errors.length)
                error = [error, ...errors].filter(Boolean).join('; ').slice(0, 8000);
            r = this.c.store.update('run', id, r.version, { state, integrity, judgment: 'pending', answerDisposition: metrics && evidenceIds.length ? 'answered' : 'needs_review', exitCode, endedAt: now(), heartbeat: Date.now(), metrics, artifactIds, evidenceIds, ...(error ? { error } : {}) });
            if (metrics && evidenceIds.length > 0) {
                const exp = this.c.store.get('experiment', r.experimentId);
                if (exp.revision === r.manifest.experimentRevision && exp.lifecycle === 'provisional')
                    this.c.store.update('experiment', exp.id, exp.version, { lifecycle: 'frozen' });
            }
            this.c.store.event(r.projectId, 'run.completed', { runId: id, state, integrity, evidenceIds });
            return r;
        });
    }
    reviewOutcome(actor, id, value) {
        userOnly(actor);
        const x = object(value), disposition = oneOf(x.disposition, ['answered', 'unanswered'], 'disposition'), reason = text(x.reason, 'reason', 4000);
        return this.c.store.transaction(() => {
            const r = this.get(actor, id);
            ensure(TERMINAL.includes(r.state), 'RUN_NOT_TERMINAL', '运行尚未结束');
            ensure(r.version === integer(x.expectedVersion, 'expectedVersion', 1), 'VERSION_CONFLICT', '运行记录已变化');
            ensure(answerDisposition(r) !== 'answered' || disposition === 'answered', 'RESULT_ALREADY_ANSWERED', '已有结果不能撤销为无结果以绕过冻结');
            const e = this.c.store.get('experiment', r.experimentId);
            ensure(e.revision === r.manifest.experimentRevision, 'OUTCOME_REVISION_STALE', '代码已离开该运行版本，不能借历史评议修改当前节点');
            r.artifactIds.forEach(id => this.evidence.read(actor, id));
            const review = this.c.store.create('run-outcome-review', r.projectId, { runId: id, disposition, reason, manifestDigest: r.manifestDigest, artifactIds: r.artifactIds, previous: answerDisposition(r) });
            const next = this.c.store.update('run', id, r.version, { answerDisposition: disposition, answerReviewId: review.id });
            if (disposition === 'answered' && e.lifecycle === 'provisional')
                this.c.store.update('experiment', e.id, e.version, { lifecycle: 'frozen' });
            this.c.store.event(r.projectId, 'run.outcome_reviewed', { runId: id, reviewId: review.id, disposition });
            return next;
        });
    }
    reconcile() {
        for (const r of this.c.store.list('run').filter(r => !TERMINAL.includes(r.state) && r.state !== 'queued')) {
            const receipt = join(this.c.dataDir, 'jobs', r.id, 'control', 'terminal.json');
            if (existsSync(receipt)) {
                try {
                    const x = JSON.parse(readFileSync(receipt, 'utf8'));
                    ensure(x.manifestDigest === r.manifestDigest && TERMINAL.includes(x.state), 'INVALID_RECEIPT', '运行收据不匹配');
                    this.finalize(r.id, x.exitCode, x.state, x.error);
                }
                catch (e) {
                    this.c.store.event(r.projectId, 'run.reconciliation_error', { runId: r.id, message: e.message });
                }
            }
            else if (r.heartbeat && Date.now() - r.heartbeat > 15000 && r.state !== 'unknown') {
                this.c.store.transaction(() => {
                    const current = this.c.store.get('run', r.id);
                    if (!TERMINAL.includes(current.state) && current.state !== 'unknown' && current.heartbeat && Date.now() - current.heartbeat > 15000) {
                        this.c.store.update('run', current.id, current.version, { state: 'unknown', error: '监管心跳超时；不自动重复提交或按旧 PID 取消' });
                        this.c.store.event(current.projectId, 'run.unknown', { runId: current.id });
                    }
                });
            }
        }
    }
}
//# sourceMappingURL=service.js.map