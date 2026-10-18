import { assertDiscoveryArtifact } from '../policy/discovery-grant-validation.js';
import { assertRunGrantArtifact } from '../policy/run-grant-validation.js';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, chmodSync, rmdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { SANDBOX_TERMINAL } from '../execution/contracts.js';
import { ensure, asError } from '../domain/errors.js';
import { object, text, integer, strings, finiteMetrics } from '../contracts/validation.js';
import { scope, ROLE_TOOLS } from '../policy/permissions.js';
import { assertProjectReadable, assertProjectWritable, assertExperimentSourceCurrent } from '../policy/lifecycle.js';
import { digest, now } from '../storage/store.js';
import { safePath, snapshotDirectory, verifySnapshot, listFiles, readSourceMode } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
import { validateSourceRevision } from '../workspace/source-access.js';
import { captureAcceptance, assertAcceptanceCurrent } from '../evidence/acceptance.js';
import { assertWorkspaceReady } from '../workspace/git-service.js';
import { readLogPage } from '../execution/log-page.js';
import { assertWorkingGrantReference, assertWorkingGrantManifest, assertWorkingGrantJob } from '../policy/working-grant-validation.js';
import { fixedResearchBrief } from '../research-workflows/briefs.js';
import { closedPaired, isPlan, methodHostPaths, assertMethodSnapshot, assertDevelopmentMethodArchive, assertFrozenMethod, methodAttachments, methodResult, methodSyntheticFixture } from '../research-workflows/method-contracts.js';
import { assertSyntheticManifest, assertSyntheticFixture } from '../research-workflows/synthetic-fixtures.js';
const MiB = 1024 * 1024;
const DEFAULTS = { cpus: 1, memoryMb: 256, pids: 64, timeoutSeconds: 60, workMb: 128, outputBytes: 32 * MiB, logBytes: 2 * MiB };
const LIMITS = { cpus: 8, memoryMb: 8192, pids: 512, timeoutSeconds: 600, workMb: 1024, outputBytes: 128 * MiB, logBytes: 16 * MiB };
const MINIMUMS = { cpus: 1, memoryMb: 64, pids: 16, timeoutSeconds: 1, workMb: 16, outputBytes: 1, logBytes: 1 };
const publicManifest = (m) => ({ ...m, inputSnapshot: { digest: m.inputSnapshot.digest, files: m.inputSnapshot.files }, dataArtifacts: m.dataArtifacts.map(({ path, ...a }) => a) });
function diagnostic(error, started) {
    const metricCode = error.match(/\b(METRIC_ARTIFACT_INVALID_UTF8|METRIC_ARTIFACT_INVALID_JSON|INVALID_METRICS)\b/);
    if (metricCode)
        return metricCode[1];
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
        assertProjectReadable(this.app.store, pid, actor);
        ensure(actor.type === 'user' || actor.type === 'agent', 'PERMISSION_DENIED', '需要用户或助手身份', 403);
        const s = this.app.store.get('session', sessionId, pid);
        if (actor.type === 'agent') {
            const own = this.app.store.get('session', text(actor.sessionId, 'sessionId', 100), pid);
            ensure(own.role === actor.role && own.taskId === actor.taskId, 'SCOPE_DENIED', '会话身份不匹配', 403);
            ensure(own.id === s.id || !write && own.role === 'coordinator' && !own.taskId, 'TASK_SCOPE_DENIED', '只能访问自己的开发测试', 403);
            if (actor.continuationId || actor.approvalResumeId)
                ensure(own.id === s.id, 'TASK_SCOPE_DENIED', '自动回合只能读取当前根会话的私有开发测试', 403);
            if (write) {
                if (actor.continuationId)
                    this.app.researchAutomation.assertActor(actor);
                if (actor.approvalResumeId)
                    this.app.wakeups.assertApprovalResume(actor);
                ensure((!actor.wakeupId || !!actor.continuationId || !!actor.approvalResumeId) && ROLE_TOOLS[own.role].includes('workspace_write'), 'TOOL_DENIED', '此会话不能准备开发测试', 403);
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
        assertRunGrantArtifact(this.app.store, pid, a);
        assertDiscoveryArtifact(this.app.store, pid, a);
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
        const bytes = readStableFile(dirname(this.app.store.paths.physical(a.path)), basename(this.app.store.paths.physical(a.path)), 32 * MiB);
        ensure(bytes.length === a.size && digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '数据产物校验失败');
        return { id: a.id, digest: a.digest, size: a.size, path: a.path, ...(sourceAcceptanceId ? { sourceAcceptanceId } : {}) };
    }
    validateSyntheticPreparation(actor, pid, sessionId, value) {
        const s = this.access(actor, pid, sessionId), selected = this.app.methodContracts.requirements(s).some(r => r === 'structured-paired-protocol' || r === 'closed-paired-evidence'), row = s.researchBriefId ? this.app.store.get('research-brief', s.researchBriefId, pid) : undefined;
        if (!selected && !['method-contract-v3', 'method-contract-v4'].includes(row?.methodContract?.compilerVersion ?? ''))
            return;
        this.app.methodContracts.assertSelected(s, row?.methodContract);
        ensure(row, 'METHOD_STRUCTURED_PLAN_REQUIRED', '先保存并确认v3完整计划');
        const brief = fixedResearchBrief(this.app.store, pid, { id: row.id, digest: row.digest, revision: row.revision, rootSessionId: s.id }), binding = methodSyntheticFixture(brief.methodContract);
        const x = object(value);
        ensure(x.metricArtifact !== undefined || s.workingGrantId, 'METHOD_METRIC_REQUIRED', 'v3开发检查必须固定metricArtifact');
        ensure(Array.isArray(x.command), 'INVALID_INPUT', '需要固定argv');
        ensure(x.dataArtifactIds === undefined || Array.isArray(x.dataArtifactIds) && x.dataArtifactIds.length === 1 && x.dataArtifactIds[0] === binding.fixtureRef.id, 'SYNTHETIC_FIXTURE_DATA_DENIED', 'v3不能把真实/本地数据声明为fixture输入');
        const a = assertSyntheticFixture(this.app.store, pid, binding.fixtureRef, s.id).artifact;
        assertSyntheticManifest(this.app.store, pid, s.id, binding, binding, x.command, [{ id: a.id, digest: a.digest, size: a.size, path: a.path }]);
    }
    prepare(actor, pid, sessionId, value) {
        ensure(!actor.approvalResumeId, 'AUTOMATION_SCOPE_DENIED', '批准恢复不能准备新测试', 403);
        return this.app.store.transaction(() => {
            const s = this.access(actor, pid, sessionId, true), x = object(value), resume = this.app.researchAutomation.captureResume(actor);
            const working = this.app.workingGrants.forPreparation(actor, pid, sessionId);
            ensure(Object.keys(x).every(k => ['title', 'command', 'environmentImageDigest', 'dockerContext', 'resources', 'deadline', 'expectedArtifacts', 'metricArtifact', 'dataArtifactIds'].includes(k)), 'INVALID_INPUT', '开发测试参数包含未授权字段', 400);
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
                safePath(this.app.store.paths.physical(s.workspace), p);
                ensure(p.split('/').every(Boolean), 'PATH_DENIED', '产物必须是规范相对路径', 400);
            }
            ensure(new Set(expectedArtifacts).size === expectedArtifacts.length, 'INVALID_INPUT', '预期产物重复', 400);
            const metricArtifact = x.metricArtifact === undefined ? working?.metricArtifact : text(x.metricArtifact, 'metricArtifact', 1000);
            if (metricArtifact !== undefined)
                ensure(expectedArtifacts.includes(metricArtifact), 'INVALID_INPUT', 'metricArtifact 必须同时列入 expectedArtifacts', 400);
            const ids = strings(x.dataArtifactIds ?? working?.dataArtifacts.map(a => a.id) ?? [], 'dataArtifactIds', 10);
            ensure(new Set(ids).size === ids.length, 'INVALID_INPUT', '数据产物重复', 400);
            const currentBrief = metricArtifact !== undefined && s.role === 'coordinator' && !s.taskId ? this.app.researchBriefs.captureDevelopmentReference(actor, pid, s.id) : undefined;
            const researchBrief = working ? working.researchBrief : currentBrief;
            const fixedBrief = researchBrief ? fixedResearchBrief(this.app.store, pid, researchBrief) : undefined;
            this.app.methodContracts.assertSelected(s, fixedBrief?.methodContract, this.app.methodContracts.requirements(s, fixedBrief?.methodRequirements));
            const syntheticFixture = methodSyntheticFixture(fixedBrief?.methodContract);
            let dataArtifacts;
            if (syntheticFixture) {
                ensure(x.dataArtifactIds === undefined || ids.length === 1 && ids[0] === syntheticFixture.fixtureRef.id, 'SYNTHETIC_FIXTURE_DATA_DENIED', '本模式只允许宿主fixture，不能另给本地/真实数据artifact');
                const a = assertSyntheticFixture(this.app.store, pid, syntheticFixture.fixtureRef, s.id).artifact;
                dataArtifacts = [{ id: a.id, digest: a.digest, size: a.size, path: a.path }];
                assertSyntheticManifest(this.app.store, pid, s.id, syntheticFixture, syntheticFixture, command, dataArtifacts);
            }
            else
                dataArtifacts = ids.map(id => this.data({ ...actor, taskId: s.taskId }, pid, id));
            ensure(dataArtifacts.reduce((n, a) => n + a.size, 0) <= 128 * MiB, 'ARTIFACT_TOO_LARGE', '输入数据超过 128 MiB', 413);
            if (metricArtifact !== undefined && (this.app.methodContracts.requirements(s, fixedBrief?.methodRequirements).length || fixedBrief?.sourceInputs?.length && this.app.methodContracts.supports(s)))
                ensure(fixedBrief?.methodContract, 'METHOD_CONTRACT_REQUIRED', '所选方法或新技能包的来源绑定科学开发需要方法契约；先编译规范附件并ready、回读、确认研究计划');
            if (fixedBrief?.methodContract) {
                ensure(metricArtifact !== undefined, 'METHOD_METRIC_REQUIRED', '方法契约开发必须固定metricArtifact');
                ensure(!expectedArtifacts.some(p => methodHostPaths(fixedBrief.methodContract).includes(p)), 'METHOD_ARTIFACT_RESERVED', 'methods-*规范方法产物由宿主归档，不得列为候选输出');
                for (const p of fixedBrief.methodContract.specification.quantitative.type === 'comparison' ? fixedBrief.methodContract.specification.quantitative.decisionOutputs ?? [] : [])
                    ensure(expectedArtifacts.includes(p.artifactPath), 'METHOD_DECISION_OUTPUT_INVALID', '声明判定原文必须列入expectedArtifacts');
            }
            const quantitative = fixedBrief?.methodContract?.specification.quantitative;
            if (quantitative?.type === 'comparison' && quantitative.template === 'paired-rmse-delta-v1')
                ensure(expectedArtifacts.includes(quantitative.witness.artifactPath), 'METHOD_WITNESS_REQUIRED', '预测见证文件必须列入expectedArtifacts');
            if (quantitative && isPlan(quantitative))
                ensure(expectedArtifacts.includes(quantitative.witness.artifactPath) && expectedArtifacts.includes(quantitative.provenanceArtifact), 'METHOD_WITNESS_REQUIRED', 'v3必须声明预测见证及fit provenance原文');
            if (closedPaired(fixedBrief?.methodContract)) {
                const q = closedPaired(fixedBrief?.methodContract);
                ensure(metricArtifact === 'metrics.json' && expectedArtifacts.length === 3 && ['metrics.json', q.witness.artifactPath, q.provenanceArtifact].every(p => expectedArtifacts.includes(p)), 'METHOD_OUTPUT_PROFILE_INVALID', '新profile只声明三类原始候选证据，派生CSV/事实由宿主生成');
            }
            if (s.sourceRevisionId)
                validateSourceRevision(this.app.context, pid, s.sourceRevisionId);
            const inputSnapshot = this.app.store.paths.referenceSnapshot(snapshotDirectory(this.app.store.paths.physical(s.workspace), join(this.app.context.dataDir, 'snapshots')));
            assertMethodSnapshot(fixedBrief?.methodContract, inputSnapshot.files);
            const manifest = { ...(syntheticFixture ? { syntheticFixture } : {}), ...(fixedBrief?.methodContract ? { methodContractDigest: fixedBrief.methodContract.contractDigest } : {}), ...(resume ? { approvalResumeDigest: digest(resume) } : {}), ...(researchBrief ? { researchBrief } : {}), purpose: 'development-test', sessionId: s.id, inputSnapshot, command, environmentImageDigest: image, dockerContext, resources, networkPolicy: 'none', deadline, expectedArtifacts, ...(metricArtifact === undefined ? {} : { metricArtifact }), dataArtifacts,
                ...(!working ? { threadLimit: resources.cpus } : working.threadLimit === undefined ? {} : { threadLimit: working.threadLimit }),
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
            if (!working)
                this.app.researchAutomation.authorize(actor, approval, dockerContext);
            this.app.store.create('development-task', pid, { ...(actor.messageId ? { originMessageId: actor.messageId } : {}), resume, title: text(x.title ?? '开发测试', 'title', 200), sessionId: s.id, sourceDigest: inputSnapshot.digest, manifest, manifestDigest, grantId: approval.id, state: 'prepared' }, id);
            this.app.store.event(pid, 'development.prepared', { developmentTaskId: id, sourceDigest: inputSnapshot.digest, grantId: approval.id });
            return this.get(actor, pid, id);
        });
    }
    get(actor, pid, id) { if (actor.approvalResumeId)
        this.app.wakeups.assertApprovalResume(actor, id); const t = this.app.store.get('development-task', id, pid); this.access(actor, pid, t.sessionId); const approval = this.app.store.get('approval', t.grantId, pid); let blockedReason; try {
        if (!t.jobId) {
            this.assertSubmittable(actor, pid, t);
        }
    }
    catch (error) {
        blockedReason = asError(error).code;
    } const effectiveState = t.jobId ? 'submitted' : blockedReason === 'DEVELOPMENT_EXPIRED' ? 'expired' : blockedReason && approval.status === 'approved' ? 'stale' : approval.status; const { resume, ...publicTask } = t; return { ...publicTask, developmentTaskId: t.id, manifest: publicManifest(t.manifest), approval, effectiveState, canSubmit: !t.jobId && !blockedReason, ...(blockedReason ? { blockedReason } : {}) }; }
    assertSubmittable(actor, pid, t) {
        this.access(actor, pid, t.sessionId, true);
        ensure(Date.parse(t.manifest.deadline) > Date.now(), 'DEVELOPMENT_EXPIRED', '开发测试授权已过期');
        this.app.researchAutomation.assertSubmission(actor, this.app.store.get('approval', t.grantId, pid));
        this.current(t, pid, true, true);
        this.workspaceCurrent(t, pid);
        this.app.compute.assertEnqueue('development', pid, t.manifest.dockerContext);
    }
    workspaceCurrent(t, pid) {
        const s = this.app.store.get('session', t.sessionId, pid), root = this.app.store.paths.physical(s.workspace), legacy = t.manifest.inputSnapshot.files.every(f => f.mode === undefined);
        let total = 0;
        const files = listFiles(root).map(f => { const bytes = readStableFile(root, f.path, 64 * MiB); total += bytes.length; ensure(total <= 64 * MiB, 'SNAPSHOT_TOO_LARGE', '工作区超过测试快照上限'); return { path: f.path, size: bytes.length, digest: digest(bytes), ...(!legacy ? { mode: readSourceMode(root, f.path) } : {}) }; }).sort((a, b) => a.path.localeCompare(b.path));
        ensure(digest(files) === t.sourceDigest, 'DEVELOPMENT_SOURCE_STALE', '工作区已变化，请重新准备测试');
    }
    current(t, pid, active, deadline, verifyFiles = true) {
        if ('developmentTaskId' in t && (active || !this.app.store.get('approval', t.grantId, pid).fullAccess))
            this.assertPermission(t);
        ensure(digest(t.manifest) === t.manifestDigest && t.sourceDigest === t.manifest.inputSnapshot.digest && digest(t.manifest.inputSnapshot.files) === t.sourceDigest, 'MANIFEST_CORRUPTED', '开发测试清单校验失败');
        const id = 'developmentTaskId' in t ? t.developmentTaskId : t.id;
        const approval = this.app.approvals.assert(t.grantId, pid, id, t.manifestDigest, 'development.test');
        ensure(approval.subjectKind === 'development-task', 'APPROVAL_STALE', '审批类型不匹配');
        if (active)
            this.app.researchAutomation.assertApproval(approval, true);
        const m = t.manifest, s = this.app.store.get('session', t.sessionId, pid);
        if (m.researchBrief) {
            ensure(m.researchBrief.rootSessionId === s.id, 'BRIEF_REFERENCE_MISMATCH', '开发测试研究来源不属于本会话');
            const brief = fixedResearchBrief(this.app.store, pid, m.researchBrief);
            ensure(m.methodContractDigest === brief.methodContract?.contractDigest, 'METHOD_CONTRACT_CORRUPTED', '测试方法契约标识与原计划不一致');
            assertMethodSnapshot(brief.methodContract, m.inputSnapshot.files);
            const expected = methodSyntheticFixture(brief.methodContract);
            if (expected)
                assertSyntheticManifest(this.app.store, pid, s.id, expected, m.syntheticFixture, m.command, m.dataArtifacts);
            else
                ensure(!m.syntheticFixture, 'SYNTHETIC_FIXTURE_BINDING_INVALID', '旧计划不能自添fixture身份');
        }
        else
            ensure(!m.methodContractDigest && !m.syntheticFixture, 'METHOD_CONTRACT_CORRUPTED', '测试方法契约缺少原研究计划');
        ensure(m.threadLimit === undefined || Number.isSafeInteger(m.threadLimit) && m.threadLimit >= 1 && m.threadLimit <= 8, 'MANIFEST_CORRUPTED', '开发测试线程上限无效');
        ensure(m.metricArtifact === undefined || typeof m.metricArtifact === 'string' && m.expectedArtifacts.includes(m.metricArtifact), 'MANIFEST_CORRUPTED', '指标产物未绑定预期产物');
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
            verifySnapshot(this.app.store.paths.physical(m.inputSnapshot.path), m.inputSnapshot.files);
        if (m.scopeTaskId) {
            const task = this.app.store.get('task', m.scopeTaskId, pid), attempt = this.app.store.get('task-attempt', m.scopeAttemptId, pid);
            ensure(task.attemptId === attempt.id && task.generation === m.scopeGeneration && attempt.generation === m.scopeGeneration && attempt.sessionId === s.id && !['cancelled', 'superseded', 'failed'].includes(task.execution), 'TASK_INPUT_STALE', '任务来源授权已失效');
            const team = this.app.store.get('team', task.teamId, pid);
            this.app.approvals.assert(team.approvalId, pid, team.id, team.planDigest, 'collaboration');
        }
        for (const a of m.dataArtifacts) {
            const actual = this.app.store.get('artifact', a.id, pid);
            assertRunGrantArtifact(this.app.store, pid, actual);
            assertDiscoveryArtifact(this.app.store, pid, actual);
            ensure(actual.path === a.path && actual.digest === a.digest && actual.size === a.size, 'ARTIFACT_CORRUPTED', '批准的数据已改变');
            if (verifyFiles) {
                const bytes = readStableFile(dirname(this.app.store.paths.physical(actual.path)), basename(this.app.store.paths.physical(actual.path)), 32 * MiB);
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
    assertPermission(job) { if (job.permission)
        this.app.sessionPermissions.assertJob(job.permission, { kind: 'development', subjectId: job.developmentTaskId, approvalId: job.grantId, manifestDigest: job.manifestDigest }, job.sessionId);
    else if (job.permissionOrigin !== 'owner') {
        const ref = this.app.sessionPermissions.capture(job.sessionId);
        ensure(ref.epoch === 0 && ref.hostEpoch === 0, 'SESSION_PERMISSION_STALE', '旧测试没有当前会话权限依据');
    } }
    submit(actor, pid, id) {
        if (actor.approvalResumeId)
            this.app.wakeups.assertApprovalResume(actor, id);
        return this.app.store.transaction(() => {
            const t = this.app.store.get('development-task', id, pid);
            this.access(actor, pid, t.sessionId);
            if (t.jobId) {
                const j = this.app.store.get('sandbox-job', t.jobId, pid);
                ensure(j.developmentTaskId === t.id && j.sessionId === t.sessionId && j.manifestDigest === t.manifestDigest && j.grantId === t.grantId, 'APPROVAL_STALE', '历史作业与准确准备单不匹配');
                return this.inspect(actor, pid, t.jobId);
            }
            this.assertSubmittable(actor, pid, t);
            const jobId = randomUUID(), root = join(this.app.context.dataDir, 'sandbox-jobs', jobId), outputDir = join(root, 'output'), controlDir = join(root, 'control');
            this.app.researchAutomation.consume(actor, this.app.store.get('approval', t.grantId, pid), jobId);
            this.app.workingGrants.consume(pid, t, jobId);
            mkdirSync(outputDir, { recursive: true, mode: 0o777 });
            chmodSync(outputDir, 0o777);
            mkdirSync(controlDir, { recursive: true, mode: 0o700 });
            this.app.store.onRollback(() => { rmdirSync(controlDir); rmdirSync(outputDir); rmdirSync(root); });
            const permission = actor.type === 'agent' ? this.app.sessionPermissions.captureJob(actor, { kind: 'development', subjectId: t.id, approvalId: t.grantId, manifestDigest: t.manifestDigest }) : undefined;
            this.app.store.create('sandbox-job', pid, { permissionOrigin: actor.type === 'user' ? 'owner' : 'agent', ...(permission ? { permission } : {}), developmentTaskId: t.id, sessionId: t.sessionId, sourceDigest: t.sourceDigest, manifest: t.manifest, manifestDigest: t.manifestDigest, grantId: t.grantId, state: 'queued', integrity: 'pending', containerName: `pi-development-${jobId}`, outputDir: this.app.store.paths.reference(outputDir), controlDir: this.app.store.paths.reference(controlDir), generation: 0, leaseUntil: 0, startRequested: false, cancelRequested: false, artifactIds: [], recoveryCount: 0 }, jobId);
            this.app.store.update('development-task', t.id, t.version, { state: 'submitted', jobId });
            this.app.store.event(pid, 'development.submitted', { developmentTaskId: t.id, jobId });
            return this.inspect(actor, pid, jobId);
        });
    }
    inspect(actor, pid, id) {
        const j = this.app.store.get('sandbox-job', id, pid);
        if (actor.approvalResumeId)
            this.app.wakeups.assertApprovalResume(actor, j.developmentTaskId);
        this.access(actor, pid, j.sessionId);
        return { approval: this.app.store.get('approval', j.grantId, pid), effectiveState: 'submitted', canSubmit: false, id: j.id, jobId: j.id, developmentTaskId: j.developmentTaskId, sessionId: j.sessionId, version: j.version, sourceDigest: j.sourceDigest, manifestDigest: j.manifestDigest, manifest: publicManifest(j.manifest), imageId: j.imageId, grantId: j.grantId, state: j.state, integrity: j.integrity, exitCode: j.exitCode ?? null, error: j.error ? diagnostic(j.error, j.startRequested) : undefined, startedAt: j.startedAt, endedAt: j.endedAt, artifactIds: j.artifactIds, stdoutArtifactId: j.stdoutArtifactId, stderrArtifactId: j.stderrArtifactId, reportArtifactId: j.reportArtifactId, logTruncated: j.logTruncated, cancelRequested: j.cancelRequested };
    }
    logs(actor, pid, id, stream, cursor = 0, identity) {
        this.inspect(actor, pid, id);
        ensure(stream === 'stdout' || stream === 'stderr', 'INVALID_INPUT', '日志流必须是 stdout 或 stderr', 400);
        const j = this.app.store.get('sandbox-job', id, pid);
        return { jobId: id, stream, ...readLogPage(this.app.store.paths.physical(j.controlDir), `${stream}.log`, cursor, { terminal: SANDBOX_TERMINAL.includes(j.state), identity }) };
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
            try {
                this.assertPermission(j);
            }
            catch (e) {
                const error = asError(e), state = result.state === 'succeeded' ? 'failed' : result.state;
                const stopped = this.app.store.update('sandbox-job', id, j.version, { state, integrity: 'invalid', exitCode: result.exitCode, error: error.code + ': ' + error.message, endedAt: now(), leaseUntil: 0, artifactIds: [] });
                this.app.store.event(pid, 'development.finalized', { jobId: id, state, integrity: 'invalid', permissionStale: true });
                return stopped;
            }
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
            const stdout = archive(this.app.store.paths.physical(j.controlDir), 'stdout.log', j.manifest.resources.logBytes, 'text/plain', !j.startRequested), stderr = archive(this.app.store.paths.physical(j.controlDir), 'stderr.log', j.manifest.resources.logBytes, 'text/plain', !j.startRequested);
            if (existsSync(join(this.app.store.paths.physical(j.controlDir), 'diagnostic.log')))
                archive(this.app.store.paths.physical(j.controlDir), 'diagnostic.log', j.manifest.resources.logBytes, 'text/plain');
            let size = 0, count = 0;
            const collected = new Map();
            let methodBrief, fixtureContext;
            try {
                methodBrief = j.manifest.researchBrief ? fixedResearchBrief(this.app.store, pid, j.manifest.researchBrief) : undefined;
            }
            catch (error) {
                integrity = 'invalid';
                errors.push(`METHOD_SOURCE_INVALID: ${asError(error).code}`);
            }
            if (methodBrief) {
                const expected = methodSyntheticFixture(methodBrief.methodContract);
                try {
                    if (expected)
                        fixtureContext = assertSyntheticManifest(this.app.store, pid, j.sessionId, expected, j.manifest.syntheticFixture, j.manifest.command, j.manifest.dataArtifacts);
                }
                catch (error) {
                    integrity = 'invalid';
                    errors.push(`SYNTHETIC_FIXTURE_INVALID: ${asError(error).code}`);
                }
            }
            const collect = (relative = '') => {
                for (const entry of readdirSync(safePath(this.app.store.paths.physical(j.outputDir), relative, true), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
                    ensure(++count <= 5000, 'OUTPUT_LIMIT', '输出文件数量超过上限');
                    const path = relative ? `${relative}/${entry.name}` : entry.name;
                    ensure(!entry.isSymbolicLink() && (entry.isFile() || entry.isDirectory()), 'OUTPUT_UNSAFE', '输出只能包含普通文件和目录');
                    if (entry.isDirectory())
                        collect(path);
                    else {
                        const a = archive(this.app.store.paths.physical(j.outputDir), path, j.manifest.resources.outputBytes - size, 'application/octet-stream', false, `output/${path}`);
                        if (a) {
                            size += a.size;
                            collected.set(path, a);
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
            if (methodBrief?.methodContract && methodHostPaths(methodBrief.methodContract).some(name => collected.has(name))) {
                integrity = 'invalid';
                errors.push('METHOD_ARTIFACT_RESERVED: candidate occupied host methods artifact');
            }
            const missing = j.manifest.expectedArtifacts.filter(path => !collected.has(path));
            for (const path of missing) {
                integrity = 'incomplete';
                errors.push(`archive failed: required output/${path}`);
            }
            if (j.manifest.metricArtifact && collected.has(j.manifest.metricArtifact)) {
                const artifact = collected.get(j.manifest.metricArtifact), bytes = this.app.evidence.read({ type: 'user' }, artifact.id).bytes;
                let code = 'METRIC_ARTIFACT_INVALID_UTF8';
                try {
                    const raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
                    code = 'METRIC_ARTIFACT_INVALID_JSON';
                    const value = JSON.parse(raw);
                    code = 'INVALID_METRICS';
                    const metrics = finiteMetrics(value);
                    if (methodBrief?.methodContract && !methodHostPaths(methodBrief.methodContract).some(name => collected.has(name))) {
                        const contract = methodBrief.methodContract, compiled = assertFrozenMethod(this.app.store, pid, contract, methodBrief.sourceInputs), archived = [...collected.entries()].map(([title, a]) => ({ ...a, title, bytes: this.app.evidence.read({ type: 'user' }, a.id).bytes }));
                        code = 'METHOD_RESULT_INVALID';
                        const methodOutput = methodResult(contract, { ...artifact, title: j.manifest.metricArtifact, bytes }, metrics, { sourceDigest: j.sourceDigest, subjectId: j.id }, archived, fixtureContext, { sourceFiles: j.manifest.inputSnapshot.files, logs: artifactIds.filter(id => !this.app.store.get('artifact', id).title.startsWith('output/')).map(id => { const a = this.app.store.get('artifact', id); return { ...a, bytes: this.app.evidence.read({ type: 'user' }, id).bytes }; }), successful: result.state === 'succeeded' && result.exitCode === 0 }), attachments = methodAttachments(contract, compiled.protocol, methodOutput, archived);
                        ensure(size + [...attachments.values()].reduce((n, b) => n + b.length, 0) <= j.manifest.resources.outputBytes, 'METHOD_OUTPUT_LIMIT', '宿主方法附件与候选输出合计超过固定归档字节上限');
                        for (const [name, body] of attachments) {
                            const a = this.app.evidence.put(pid, `output/${name}`, body, name.endsWith('.md') ? 'text/markdown' : name.endsWith('.csv') ? 'text/csv' : 'application/json', `development:${id}`, extra);
                            artifactIds.push(a.id);
                            collected.set(name, a);
                        }
                    }
                }
                catch (error) {
                    integrity = 'invalid';
                    errors.push(`${code}: ${asError(error).code}: output/${j.manifest.metricArtifact}`);
                }
            }
            if (missing.length) {
                errors.push('声明产物路径相对 PI_OUTPUT_DIR（/output）；只收集 /output，工作目录文件须由代码写入该目录或显式复制');
                if (missing.some(path => path.startsWith('output/') && collected.has(path.slice(7))))
                    errors.push('预期路径可能多写了 output/ 前缀；请核对实际目录，不会自动改写路径');
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
            const report = { purpose: 'development-test', jobId: id, sourceDigest: j.sourceDigest, command: j.manifest.command, image: j.manifest.environmentImageDigest, imageId: j.imageId, ...(j.manifest.threadLimit === undefined ? {} : { threadLimit: j.manifest.threadLimit }), exitCode: result.exitCode, status: state, integrity, artifactIds: [...artifactIds], error, recovered: !!result.recovered, scientificConclusion: false };
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
            const a = this.app.store.get('artifact', id, pid), bytes = readStableFile(dirname(this.app.store.paths.physical(a.path)), basename(this.app.store.paths.physical(a.path)), 32 * MiB);
            ensure(bytes.length === a.size && digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '测试归档产物已改变');
        }
        if (j.manifest.researchBrief) {
            const brief = fixedResearchBrief(this.app.store, pid, j.manifest.researchBrief);
            assertDevelopmentMethodArchive(this.app.store, j, brief.methodContract, assertFrozenMethod(this.app.store, pid, brief.methodContract, brief.sourceInputs)?.protocol);
        }
        return this.inspect(actor, pid, id);
    }
}
//# sourceMappingURL=service.js.map