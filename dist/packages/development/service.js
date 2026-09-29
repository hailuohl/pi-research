import { randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, chmodSync, rmdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { SANDBOX_TERMINAL } from '../execution/contracts.js';
import { ensure } from '../domain/errors.js';
import { object, text, integer, strings } from '../contracts/validation.js';
import { scope, ROLE_TOOLS } from '../policy/permissions.js';
import { assertProjectWritable, assertExperimentSourceCurrent } from '../policy/lifecycle.js';
import { digest, now } from '../storage/store.js';
import { safePath, snapshotDirectory, verifySnapshot } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
import { validateSourceRevision } from '../workspace/source-access.js';
import { captureAcceptance, assertAcceptanceCurrent } from '../evidence/acceptance.js';
import { assertWorkspaceReady } from '../workspace/git-service.js';
import { readLogPage } from '../execution/log-page.js';
import { assertWorkingGrantReference, assertWorkingGrantManifest, assertWorkingGrantJob } from '../policy/working-grant-validation.js';
const MiB = 1024 * 1024;
const DEFAULTS = { cpus: 1, memoryMb: 256, pids: 64, timeoutSeconds: 60, workMb: 128, outputBytes: 32 * MiB, logBytes: 2 * MiB };
const LIMITS = { cpus: 8, memoryMb: 8192, pids: 512, timeoutSeconds: 600, workMb: 1024, outputBytes: 128 * MiB, logBytes: 16 * MiB };
const MINIMUMS = { cpus: 1, memoryMb: 64, pids: 16, timeoutSeconds: 1, workMb: 16, outputBytes: 1, logBytes: 1 };
const publicManifest = (m) => ({ ...m, inputSnapshot: { digest: m.inputSnapshot.digest, files: m.inputSnapshot.files }, dataArtifacts: m.dataArtifacts.map(({ path, ...a }) => a) });
function diagnostic(error, started) {
    for (const [pattern, code] of [[/DOCKER_IMAGE_UNAVAILABLE|no such image|image.*not found/i, 'DOCKER_IMAGE_UNAVAILABLE'], [/DOCKER_ENGINE_UNAVAILABLE|connect|daemon|ENOENT|pipe/i, 'DOCKER_ENGINE_UNAVAILABLE'], [/DOCKER_CONTEXT_DENIED|only local|context/i, 'DOCKER_CONTEXT_DENIED'], [/LINUX_CONTAINER_REQUIRED|linux containers/i, 'LINUX_CONTAINER_REQUIRED'], [/OUTPUT_LIMIT|output limit/i, 'OUTPUT_LIMIT'], [/LOG_INCOMPLETE|log limit|log stream|recovered execution/i, 'LOG_INCOMPLETE'], [/ARCHIVE_INCOMPLETE|archive failed/i, 'ARCHIVE_INCOMPLETE'], [/SOURCE_STALE|source or approval/i, 'SOURCE_STALE'], [/TIME_LIMIT|timeout|timed out/i, 'TIME_LIMIT']])
        if (pattern.test(error))
            return code;
    return started ? 'EXECUTION_FAILED' : 'DOCKER_PREFLIGHT_FAILED';
}
/** Development tests have their own approval and immutable result; they never create a scientific Run. */
export class DevelopmentService {
    app;
    constructor(app) {
        this.app = app;
    }
    access(actor, pid, sessionId, write = false) {
        scope(actor, pid);
        this.app.store.get('project', pid);
        ensure(actor.type === 'user' || actor.type === 'agent', 'PERMISSION_DENIED', '需要用户或助手身份', 403);
        const s = this.app.store.get('session', sessionId, pid);
        if (actor.type === 'agent') {
            const own = this.app.store.get('session', text(actor.sessionId, 'sessionId', 100), pid);
            ensure(own.role === actor.role && own.taskId === actor.taskId, 'SCOPE_DENIED', '会话身份不匹配', 403);
            ensure(own.id === s.id || !write && own.role === 'coordinator' && !own.taskId, 'TASK_SCOPE_DENIED', '只能访问自己的开发测试', 403);
            if (write) {
                ensure(!actor.wakeupId && ROLE_TOOLS[own.role].includes('workspace_write'), 'TOOL_DENIED', '此会话不能准备开发测试', 403);
                if (own.taskId)
                    this.app.teams.active(actor);
                else
                    ensure(own.generation === actor.generation && own.state === 'running' && own.leaseUntil > Date.now(), 'LEASE_EXPIRED', '会话执行租约失效');
            }
        }
        if (write) {
            assertProjectWritable(this.app.store, pid);
            ensure(s.state !== 'archived', 'SESSION_ARCHIVED', '会话已归档');
            assertWorkspaceReady(this.app.context, s.id);
        }
        return s;
    }
    data(actor, pid, id) {
        const a = this.app.store.get('artifact', id, pid);
        if (actor.type === 'agent') {
            if (actor.taskId)
                this.app.teams.assertResource(actor, 'artifact', id);
            else
                ensure(a.origin === 'user' || a.origin === `agent:${actor.sessionId}` || !!a.taskId, 'TASK_SCOPE_DENIED', '数据不属于当前会话', 403);
        }
        let sourceAcceptanceId;
        if (a.taskId && a.taskId !== actor.taskId) {
            const t = this.app.store.get('task', a.taskId, pid);
            ensure(t.execution === 'output_submitted' && t.acceptance === 'accepted' && t.result?.artifactIds.includes(a.id), 'CHANGE_SOURCE_STALE', '数据任务成果未被当前采纳');
            sourceAcceptanceId = captureAcceptance(this.app.store, pid, t.id).id;
        }
        const bytes = readStableFile(dirname(a.path), basename(a.path), 32 * MiB);
        ensure(bytes.length === a.size && digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '数据产物校验失败');
        return { id: a.id, digest: a.digest, size: a.size, path: a.path, ...(sourceAcceptanceId ? { sourceAcceptanceId } : {}) };
    }
    prepare(actor, pid, sessionId, value) {
        return this.app.store.transaction(() => {
            const s = this.access(actor, pid, sessionId, true), x = object(value);
            const working = this.app.workingGrants.forPreparation(actor, pid, sessionId);
            ensure(Object.keys(x).every(k => ['title', 'command', 'environmentImageDigest', 'dockerContext', 'resources', 'deadline', 'expectedArtifacts', 'dataArtifactIds'].includes(k)), 'INVALID_INPUT', '开发测试参数包含未授权字段', 400);
            ensure(Array.isArray(x.command) && x.command.length > 0 && x.command.length <= 64, 'INVALID_INPUT', '需要 1–64 个 argv', 400);
            const command = x.command.map((a, i) => text(a, 'command', 1000, i > 0));
            ensure(command.every(a => !a.includes('\0')), 'INVALID_INPUT', 'argv 不能含 NUL', 400);
            const image = text(x.environmentImageDigest, 'environmentImageDigest', 300);
            ensure(/^[a-zA-Z0-9][a-zA-Z0-9._/:\-]*@sha256:[a-f0-9]{64}$/.test(image), 'IMAGE_NOT_PINNED', '镜像必须固定为 image@sha256:digest', 400);
            const dockerContext = text(x.dockerContext ?? working?.dockerContext ?? 'default', 'dockerContext', 100);
            ensure(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(dockerContext), 'INVALID_INPUT', 'Docker context 无效', 400);
            const raw = object(x.resources ?? {});
            ensure(Object.keys(raw).every(k => k in DEFAULTS), 'INVALID_INPUT', '资源字段无效', 400);
            const resources = { ...DEFAULTS };
            for (const k of Object.keys(DEFAULTS))
                resources[k] = integer(raw[k] ?? working?.resources[k] ?? DEFAULTS[k], k, MINIMUMS[k], LIMITS[k]);
            const deadline = text(x.deadline ?? new Date(Math.min(Date.now() + 30 * 60 * 1000, working ? Date.parse(working.expiresAt) : Infinity)).toISOString(), 'deadline', 50);
            ensure(Number.isFinite(Date.parse(deadline)) && Date.parse(deadline) > Date.now() && Date.parse(deadline) <= Date.now() + 24 * 60 * 60 * 1000, 'INVALID_INPUT', 'deadline 必须在未来 24 小时内', 400);
            const expectedArtifacts = strings(x.expectedArtifacts ?? working?.expectedArtifacts ?? [], 'expectedArtifacts', 32);
            for (const p of expectedArtifacts) {
                safePath(s.workspace, p);
                ensure(p.split('/').every(Boolean), 'PATH_DENIED', '产物必须是规范相对路径', 400);
            }
            ensure(new Set(expectedArtifacts).size === expectedArtifacts.length, 'INVALID_INPUT', '预期产物重复', 400);
            const ids = strings(x.dataArtifactIds ?? working?.dataArtifacts.map(a => a.id) ?? [], 'dataArtifactIds', 10);
            ensure(new Set(ids).size === ids.length, 'INVALID_INPUT', '数据产物重复', 400);
            const dataArtifacts = ids.map(id => this.data({ ...actor, taskId: s.taskId }, pid, id));
            ensure(dataArtifacts.reduce((n, a) => n + a.size, 0) <= 128 * MiB, 'ARTIFACT_TOO_LARGE', '输入数据超过 128 MiB', 413);
            if (s.sourceRevisionId)
                validateSourceRevision(this.app.context, pid, s.sourceRevisionId);
            const inputSnapshot = snapshotDirectory(s.workspace, join(this.app.context.dataDir, 'snapshots'));
            const manifest = { purpose: 'development-test', sessionId: s.id, inputSnapshot, command, environmentImageDigest: image, dockerContext, resources, networkPolicy: 'none', deadline, expectedArtifacts, dataArtifacts,
                ...(s.sourceRevisionId ? { sourceRevisionId: s.sourceRevisionId } : {}), ...(s.taskId ? { scopeTaskId: s.taskId, scopeAttemptId: actor.attemptId, scopeGeneration: actor.generation } : { sessionGeneration: s.generation }) };
            // A user may approve an assistant workspace, but cannot invent its attempt identity.
            if (s.taskId && actor.type === 'user') {
                const t = this.app.store.get('task', s.taskId, pid);
                const a = this.app.store.get('task-attempt', text(t.attemptId, 'attemptId', 100), pid);
                ensure(a.sessionId === s.id && a.state === 'running' && t.execution === 'running', 'LEASE_EXPIRED', '任务不在执行');
                manifest.scopeAttemptId = a.id;
                manifest.scopeGeneration = a.generation;
            }
            if (working)
                manifest.workingGrant = this.app.workingGrants.authorizeManifest(working, manifest);
            const id = randomUUID(), manifestDigest = digest(manifest), approval = this.app.approvals.request(pid, 'development-task', id, manifestDigest, 'development.test', '只批准本次固定源码、argv、镜像、数据与资源限制的开发测试');
            if (working)
                this.app.store.update('approval', approval.id, approval.version, { status: 'approved', workingGrant: manifest.workingGrant, decidedAt: now(), reason: '由固定私有实现授权派生的单次测试批准；提交时原子计次，不批准正式Run' });
            this.app.store.create('development-task', pid, { title: text(x.title ?? '开发测试', 'title', 200), sessionId: s.id, sourceDigest: inputSnapshot.digest, manifest, manifestDigest, grantId: approval.id, state: 'prepared' }, id);
            this.app.store.event(pid, 'development.prepared', { developmentTaskId: id, sourceDigest: inputSnapshot.digest, grantId: approval.id });
            return this.get(actor, pid, id);
        });
    }
    get(actor, pid, id) { const t = this.app.store.get('development-task', id, pid); this.access(actor, pid, t.sessionId); return { ...t, developmentTaskId: t.id, manifest: publicManifest(t.manifest) }; }
    current(t, pid, active, deadline, verifyFiles = true) {
        ensure(digest(t.manifest) === t.manifestDigest && t.sourceDigest === t.manifest.inputSnapshot.digest && digest(t.manifest.inputSnapshot.files) === t.sourceDigest, 'MANIFEST_CORRUPTED', '开发测试清单校验失败');
        const id = 'developmentTaskId' in t ? t.developmentTaskId : t.id;
        const approval = this.app.approvals.assert(t.grantId, pid, id, t.manifestDigest, 'development.test');
        ensure(approval.subjectKind === 'development-task', 'APPROVAL_STALE', '审批类型不匹配');
        const m = t.manifest, s = this.app.store.get('session', t.sessionId, pid);
        if (deadline && s.workingGrantId)
            ensure(m.workingGrant?.id === s.workingGrantId, 'WORKING_GRANT_REQUIRED', '会话已绑定授权；旧单次清单不能绕过范围或计次，请重新准备');
        if (m.workingGrant) {
            const g = assertWorkingGrantReference(this.app.store, pid, m.workingGrant, deadline);
            ensure(digest(approval.workingGrant) === digest(m.workingGrant), 'APPROVAL_STALE', '单次派生批准依据不符');
            assertWorkingGrantManifest(g, m);
            if ('developmentTaskId' in t)
                assertWorkingGrantJob(this.app.store, t, deadline);
        }
        else
            ensure(!approval.workingGrant, 'WORKING_GRANT_STALE', '测试清单丢失派生授权依据');
        ensure(m.sessionId === s.id && s.taskId === m.scopeTaskId && s.sourceRevisionId === m.sourceRevisionId, 'DEVELOPMENT_SOURCE_STALE', '会话来源绑定已改变');
        if (active) {
            assertProjectWritable(this.app.store, pid);
            ensure(s.state !== 'archived', 'SESSION_ARCHIVED', '会话已归档');
        }
        if (deadline)
            ensure(Date.parse(m.deadline) > Date.now(), 'DEVELOPMENT_EXPIRED', '开发测试授权已过期');
        if (m.sourceRevisionId) {
            if (verifyFiles)
                validateSourceRevision(this.app.context, pid, m.sourceRevisionId);
            else {
                const revision = this.app.store.get('source-revision', m.sourceRevisionId, pid);
                assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', revision.experimentId, pid));
            }
        }
        if (verifyFiles)
            verifySnapshot(m.inputSnapshot.path, m.inputSnapshot.files);
        if (m.scopeTaskId) {
            const task = this.app.store.get('task', m.scopeTaskId, pid), attempt = this.app.store.get('task-attempt', m.scopeAttemptId, pid);
            ensure(task.attemptId === attempt.id && task.generation === m.scopeGeneration && attempt.generation === m.scopeGeneration && attempt.sessionId === s.id && !['cancelled', 'superseded', 'failed'].includes(task.execution), 'TASK_INPUT_STALE', '任务来源授权已失效');
            const team = this.app.store.get('team', task.teamId, pid);
            this.app.approvals.assert(team.approvalId, pid, team.id, team.planDigest, 'collaboration');
        }
        for (const a of m.dataArtifacts) {
            const actual = this.app.store.get('artifact', a.id, pid);
            ensure(actual.path === a.path && actual.digest === a.digest && actual.size === a.size, 'ARTIFACT_CORRUPTED', '批准的数据已改变');
            if (verifyFiles) {
                const bytes = readStableFile(dirname(actual.path), basename(actual.path), 32 * MiB);
                ensure(bytes.length === a.size && digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '批准的数据字节已改变');
            }
            if (actual.taskId && actual.taskId !== m.scopeTaskId) {
                const task = this.app.store.get('task', actual.taskId, pid);
                ensure(task.execution === 'output_submitted' && task.acceptance === 'accepted' && task.result?.artifactIds.includes(a.id), 'CHANGE_SOURCE_STALE', '输入数据采纳已撤销');
            }
            if ('sourceAcceptanceId' in a)
                assertAcceptanceCurrent(this.app.store, pid, text(a.sourceAcceptanceId, 'sourceAcceptanceId', 100));
        }
    }
    assertCurrent(job, verifyFiles = true) { this.current(job, job.projectId, true, (job.state === 'queued' || job.state === 'starting') && !job.startRequested, verifyFiles); }
    submit(actor, pid, id) {
        return this.app.store.transaction(() => {
            const t = this.app.store.get('development-task', id, pid);
            this.access(actor, pid, t.sessionId);
            if (t.jobId)
                return this.inspect(actor, pid, t.jobId);
            const s = this.access(actor, pid, t.sessionId, true);
            this.current(t, pid, true, true);
            ensure(snapshotDirectory(s.workspace, join(this.app.context.dataDir, 'snapshots'), { legacy: t.manifest.inputSnapshot.files.every(f => f.mode === undefined) }).digest === t.sourceDigest, 'DEVELOPMENT_SOURCE_STALE', '工作区已变化，请重新准备并批准测试');
            this.app.compute.assertEnqueue('development', pid, t.manifest.dockerContext);
            const jobId = randomUUID(), root = join(this.app.context.dataDir, 'sandbox-jobs', jobId), outputDir = join(root, 'output'), controlDir = join(root, 'control');
            this.app.workingGrants.consume(pid, t, jobId);
            mkdirSync(outputDir, { recursive: true, mode: 0o777 });
            chmodSync(outputDir, 0o777);
            mkdirSync(controlDir, { recursive: true, mode: 0o700 });
            this.app.store.onRollback(() => { rmdirSync(controlDir); rmdirSync(outputDir); rmdirSync(root); });
            this.app.store.create('sandbox-job', pid, { developmentTaskId: t.id, sessionId: t.sessionId, sourceDigest: t.sourceDigest, manifest: t.manifest, manifestDigest: t.manifestDigest, grantId: t.grantId, state: 'queued', integrity: 'pending', containerName: `pi-development-${jobId}`, outputDir, controlDir, generation: 0, leaseUntil: 0, startRequested: false, cancelRequested: false, artifactIds: [], recoveryCount: 0 }, jobId);
            this.app.store.update('development-task', t.id, t.version, { state: 'submitted', jobId });
            this.app.store.event(pid, 'development.submitted', { developmentTaskId: t.id, jobId });
            return this.inspect(actor, pid, jobId);
        });
    }
    inspect(actor, pid, id) {
        const j = this.app.store.get('sandbox-job', id, pid);
        this.access(actor, pid, j.sessionId);
        return { id: j.id, jobId: j.id, developmentTaskId: j.developmentTaskId, sessionId: j.sessionId, version: j.version, sourceDigest: j.sourceDigest, manifestDigest: j.manifestDigest, manifest: publicManifest(j.manifest), imageId: j.imageId, grantId: j.grantId, state: j.state, integrity: j.integrity, exitCode: j.exitCode ?? null, error: j.error ? diagnostic(j.error, j.startRequested) : undefined, startedAt: j.startedAt, endedAt: j.endedAt, artifactIds: j.artifactIds, stdoutArtifactId: j.stdoutArtifactId, stderrArtifactId: j.stderrArtifactId, reportArtifactId: j.reportArtifactId, logTruncated: j.logTruncated, cancelRequested: j.cancelRequested };
    }
    logs(actor, pid, id, stream, cursor = 0, identity) {
        this.inspect(actor, pid, id);
        ensure(stream === 'stdout' || stream === 'stderr', 'INVALID_INPUT', '日志流必须是 stdout 或 stderr', 400);
        const j = this.app.store.get('sandbox-job', id, pid);
        return { jobId: id, stream, ...readLogPage(j.controlDir, `${stream}.log`, cursor, { terminal: SANDBOX_TERMINAL.includes(j.state), identity }) };
    }
    cancel(actor, pid, id) {
        return this.app.store.transaction(() => { const j = this.app.store.get('sandbox-job', id, pid); this.access(actor, pid, j.sessionId); ensure(actor.type === 'user' || actor.sessionId === j.sessionId, 'TASK_SCOPE_DENIED', '助手只能取消自己会话的测试', 403); if (!SANDBOX_TERMINAL.includes(j.state)) {
            this.app.store.update('sandbox-job', id, j.version, { cancelRequested: true });
            this.app.store.event(pid, 'development.cancel_requested', { jobId: id });
            if (j.state === 'queued' && !j.startRequested && !j.containerId)
                this.finalize(id, { state: 'cancelled', exitCode: null, error: 'Cancelled before execution', incomplete: true });
        } return this.inspect(actor, pid, id); });
    }
    finalize(id, result) {
        return this.app.store.transaction(() => {
            const j = this.app.store.get('sandbox-job', id), pid = j.projectId;
            ensure(result.generation === undefined || j.generation === result.generation, 'LEASE_EXPIRED', '旧执行器不能归档新任务');
            if (SANDBOX_TERMINAL.includes(j.state))
                return j;
            ensure(SANDBOX_TERMINAL.includes(result.state), 'INVALID_INPUT', '只允许归档已确认结束的任务');
            let integrity = 'complete', state = result.state;
            const errors = [], artifactIds = [], extra = j.manifest.scopeTaskId ? { taskId: j.manifest.scopeTaskId } : {};
            const archive = (root, path, limit, media = 'application/octet-stream', emptyIfAbsent = false, title = path) => { try {
                const bytes = emptyIfAbsent && !existsSync(safePath(root, path)) ? Buffer.alloc(0) : readStableFile(root, path, Math.min(limit, 32 * MiB)), a = this.app.evidence.put(pid, title, bytes, media, `development:${id}`, extra);
                artifactIds.push(a.id);
                return a;
            }
            catch {
                integrity = 'incomplete';
                errors.push(`archive failed: ${title}`);
                return undefined;
            } };
            const stdout = archive(j.controlDir, 'stdout.log', j.manifest.resources.logBytes, 'text/plain', !j.startRequested), stderr = archive(j.controlDir, 'stderr.log', j.manifest.resources.logBytes, 'text/plain', !j.startRequested);
            if (existsSync(join(j.controlDir, 'diagnostic.log')))
                archive(j.controlDir, 'diagnostic.log', j.manifest.resources.logBytes, 'text/plain');
            let size = 0, count = 0;
            const collected = new Set();
            const collect = (relative = '') => {
                for (const entry of readdirSync(safePath(j.outputDir, relative, true), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
                    ensure(++count <= 5000, 'OUTPUT_LIMIT', '输出文件数量超过上限');
                    const path = relative ? `${relative}/${entry.name}` : entry.name;
                    ensure(!entry.isSymbolicLink() && (entry.isFile() || entry.isDirectory()), 'OUTPUT_UNSAFE', '输出只能包含普通文件和目录');
                    if (entry.isDirectory())
                        collect(path);
                    else {
                        const a = archive(j.outputDir, path, j.manifest.resources.outputBytes - size, 'application/octet-stream', false, `output/${path}`);
                        if (a) {
                            size += a.size;
                            collected.add(path);
                        }
                    }
                }
            };
            try {
                collect();
            }
            catch {
                integrity = 'incomplete';
                errors.push('archive failed: unsafe or excessive output');
            }
            for (const path of j.manifest.expectedArtifacts)
                if (!collected.has(path)) {
                    integrity = 'incomplete';
                    errors.push(`archive failed: required output/${path}`);
                }
            if (result.incomplete) {
                integrity = 'incomplete';
                errors.push('archive failed: execution evidence incomplete');
            }
            if (result.logTruncated) {
                integrity = 'incomplete';
                errors.push('log limit exceeded');
            }
            if (result.recovered) {
                integrity = 'incomplete';
                errors.push('recovered execution: log completeness not proven');
            }
            try {
                this.current(j, pid, false, false);
            }
            catch {
                integrity = 'invalid';
                errors.push('source or approval no longer current');
            }
            if (state === 'succeeded' && (result.exitCode !== 0 || integrity !== 'complete'))
                state = 'failed';
            const error = [result.error ? diagnostic(result.error, j.startRequested) : '', ...errors].filter(Boolean).join('; ') || undefined;
            const report = { purpose: 'development-test', jobId: id, sourceDigest: j.sourceDigest, command: j.manifest.command, image: j.manifest.environmentImageDigest, imageId: j.imageId, exitCode: result.exitCode, status: state, integrity, artifactIds: [...artifactIds], error, recovered: !!result.recovered, scientificConclusion: false };
            const a = this.app.evidence.put(pid, 'test-report.json', Buffer.from(JSON.stringify(report, null, 2)), 'application/json', `development:${id}`, extra);
            artifactIds.push(a.id);
            const next = this.app.store.update('sandbox-job', id, j.version, { state, integrity, exitCode: result.exitCode, error, endedAt: now(), leaseUntil: 0, stdoutArtifactId: stdout?.id, stderrArtifactId: stderr?.id, reportArtifactId: a.id, artifactIds, logTruncated: !!result.logTruncated });
            this.app.store.event(pid, 'development.finalized', { jobId: id, state, integrity, artifactIds });
            return next;
        });
    }
    assertResultMatches(actor, pid, id, candidateDigest) {
        this.inspect(actor, pid, id);
        const j = this.app.store.get('sandbox-job', id, pid);
        ensure(j.state === 'succeeded' && j.integrity === 'complete' && j.exitCode === 0, 'DEVELOPMENT_TEST_FAILED', '需要成功且完整的开发测试');
        ensure(j.sourceDigest === candidateDigest, 'DEVELOPMENT_SOURCE_STALE', '测试结果不属于候选源码');
        this.current(j, pid, false, false);
        for (const id of j.artifactIds) {
            const a = this.app.store.get('artifact', id, pid), bytes = readStableFile(dirname(a.path), basename(a.path), 32 * MiB);
            ensure(bytes.length === a.size && digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '测试归档产物已改变');
        }
        return this.inspect(actor, pid, id);
    }
}
//# sourceMappingURL=service.js.map