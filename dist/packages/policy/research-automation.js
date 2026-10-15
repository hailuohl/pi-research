import { join } from 'node:path';
import { modelConnectionSnapshot } from '../pi-adapter/model-connections.js';
import { publicationImageCatalog } from '../pi-adapter/publication-image.js';
import { validateSourceRevision } from '../workspace/source-access.js';
import { assertExperimentSourceCurrent } from './lifecycle.js';
import { digest, now } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
export const AUTOMATION_LIMITS = { development: 3, run: 2, continuations: 6, durationMs: 2 * 60 * 60 * 1000 };
export const APPROVAL_RESUME_TOOLS = ['development_inspect', 'development_submit', 'development_logs'];
export const CONTINUATION_TOOLS = ['project_inspect', 'execution_environment_list', 'research_brief_inspect', 'workspace_list', 'workspace_read', 'workspace_write', 'workspace_prepare_from_revision', 'experiment_source_list', 'experiment_source_read', 'experiment_plan_submit', 'development_prepare', 'development_submit', 'development_inspect', 'development_logs', 'development_review_prepare', 'development_review_inspect', 'run_prepare', 'run_submit', 'run_inspect', 'run_logs', 'run_source_list', 'run_source_read', 'artifact_read', 'evidence_read', 'research_skill_list', 'research_skill_read'];
function modelDigest(store, s) { const snapshot = modelConnectionSnapshot(store.paths.dataDir, s.model.provider); return digest({ model: s.model, connectionVersion: snapshot.version, connectionDigest: digest(snapshot.connection ?? null), catalogDigest: publicationImageCatalog(join(store.paths.dataDir, 'models.json'), snapshot.catalog) }); }
/** Frozen proof remains readable; only admission and live execution require the owner lease. */
export function assertResearchReference(store, pid, ref, current = false) {
    const c = store.get('research-continuation', ref.continuationId, pid);
    const { id, kind, projectId, version, createdAt, updatedAt, state, reason, digest: hash, ...fixed } = c;
    ensure(hash === ref.digest && digest(fixed) === hash, 'AUTOMATION_STALE', '持续任务的固定授权已变化', 403);
    if (!current)
        return c;
    const s = store.get('session', c.rootSessionId, pid), grant = store.get('host-access', s.id, pid);
    const permission = store.maybe('session-permission', s.id), runtime = store.maybe('research-runtime', 'owner');
    ensure(c.state === 'active' && Date.parse(c.expiresAt) > Date.now(), 'AUTOMATION_STOPPED', c.reason ?? '持续任务已停止或过期', 403);
    ensure(!store.get('project', pid).archived && s.state !== 'archived' && !s.parentSessionId && !s.taskId && !s.teamId && s.role === 'coordinator', 'AUTOMATION_STALE', '持续任务的项目或根会话已失效', 403);
    ensure(!s.workingGrantId && !s.runGrantId && !s.discoveryGrantId && !s.textCorpusGrantId && modelDigest(store, s) === c.modelDigest && s.sourceRevisionId === c.sourceRevisionId, 'AUTOMATION_STALE', '持续任务的模型、来源或授权绑定已变化', 403);
    ensure((permission?.epoch ?? 0) === c.permission.epoch && grant.epoch === c.permission.hostEpoch && grant.runtimeId === c.runtimeId && grant.state === 'enabled' && grant.researchAutomationScope === 1, 'AUTOMATION_REVOKED', '当前自主计算授权已撤销或替换', 403);
    ensure(runtime?.runtimeId === c.runtimeId && runtime.state === 'active' && runtime.leaseUntil > Date.now(), 'AUTOMATION_RUNTIME_EXPIRED', '原授权执行端已停止或租约失效', 403);
    const origin = store.get('message', c.originMessageId, pid);
    ensure(origin.sessionId === s.id && origin.role === 'user' && !origin.origin && !origin.wakeupId && !origin.approvalNoticeId && digest(origin.content) === c.originDigest && digest(origin.permission) === digest(c.permission), 'AUTOMATION_STALE', '原用户任务已变化', 403);
    const stopped = store.db.prepare("SELECT 1 FROM events WHERE project_id=? AND seq>(SELECT COALESCE(MIN(seq),0) FROM events WHERE project_id=? AND type='research.continuation_created' AND json_extract(payload,'$.continuationId')=?) AND (type='project.archived' OR type='session.interrupted' AND json_extract(payload,'$.sessionId')=?) LIMIT 1").get(pid, pid, c.id, s.id);
    ensure(!stopped, 'AUTOMATION_STOPPED', '原任务已停止或归档，重开不能恢复旧授权', 403);
    return c;
}
export class ResearchAutomationService {
    app;
    modelIdentity(session) { return modelDigest(this.app.store, session); }
    ownerStarted = false;
    ownerClaimed = false;
    ownerSuperseded = false;
    constructor(app) {
        this.app = app;
    }
    isOwner() { const r = this.app.store.maybe('research-runtime', 'owner'); return r?.runtimeId === this.app.hostAccess.researchRuntimeId() && r.state === 'active' && r.leaseUntil > Date.now(); }
    cancelOwnedChains(reason) { for (const c of this.app.store.list('research-continuation').filter(c => c.runtimeId === this.app.hostAccess.researchRuntimeId() && c.state === 'active'))
        this.app.store.update('research-continuation', c.id, c.version, { state: 'cancelled', reason }); }
    startOwner() { if (this.ownerStarted)
        return; this.ownerStarted = true; this.ownerClaimed = false; this.ownerSuperseded = false; this.heartbeatOwner(); }
    heartbeatOwner() {
        if (!this.ownerStarted) {
            this.startOwner();
            return;
        }
        if (this.ownerSuperseded)
            return;
        this.app.store.transaction(() => {
            const id = this.app.hostAccess.researchRuntimeId(), r = this.app.store.maybe('research-runtime', 'owner');
            // A replaced host keeps ordinary work alive, but never reclaims the other owner's lease.
            if (this.ownerClaimed && r?.runtimeId !== id) {
                this.ownerSuperseded = true;
                return;
            }
            const authorized = this.app.store.list('host-access').some(g => g.researchAutomationScope === 1 && g.runtimeId === id && g.state === 'enabled' && this.app.hostAccess.status({ type: 'user' }, g.sessionId).researchAutomation);
            if (!authorized) {
                if (this.ownerClaimed && r?.runtimeId === id && r.state === 'active') {
                    this.app.store.update('research-runtime', r.id, r.version, { state: 'stopped', leaseUntil: 0 });
                    this.cancelOwnedChains('自主计算授权已停用');
                }
                return;
            }
            if (r?.runtimeId === id && r.state === 'active' && r.leaseUntil > Date.now()) {
                this.ownerClaimed = true;
                if (r.leaseUntil - Date.now() < 20000)
                    this.app.store.update('research-runtime', r.id, r.version, { leaseUntil: Date.now() + 30000 });
                return;
            }
            if (r?.runtimeId === id)
                this.cancelOwnedChains('原自主执行端已停止或租约过期；旧任务不能恢复');
            const value = { runtimeId: id, leaseUntil: Date.now() + 30000, state: 'active' };
            if (r)
                this.app.store.update('research-runtime', r.id, r.version, value);
            else
                this.app.store.create('research-runtime', null, value, 'owner');
            this.ownerClaimed = true;
        });
    }
    stopOwner() {
        if (!this.ownerStarted)
            return;
        this.app.store.transaction(() => { const r = this.app.store.maybe('research-runtime', 'owner'); if (this.ownerClaimed && r?.runtimeId === this.app.hostAccess.researchRuntimeId()) {
            if (r.state === 'active')
                this.app.store.update('research-runtime', r.id, r.version, { state: 'stopped', leaseUntil: 0 });
            this.cancelOwnedChains('自主执行端已停止；旧任务不能恢复');
        } });
        this.ownerStarted = false;
        this.ownerClaimed = false;
        this.ownerSuperseded = false;
    }
    cancelSession(sessionId, reason) { for (const c of this.app.store.list('research-continuation').filter(c => c.rootSessionId === sessionId && c.state === 'active'))
        this.app.store.update('research-continuation', c.id, c.version, { state: 'cancelled', reason }); }
    block(id, reason) { const c = this.app.store.get('research-continuation', id); if (c.state === 'active')
        this.app.store.update('research-continuation', id, c.version, { state: 'blocked', reason }); }
    assertActor(actor) {
        ensure(actor.type === 'agent' && actor.continuationId && actor.wakeupId && !actor.taskId && !actor.attemptId, 'AUTOMATION_SCOPE_DENIED', '缺少宿主持续任务身份', 403);
        const c = this.app.store.get('research-continuation', actor.continuationId, actor.projectId), w = this.app.store.get('wakeup', actor.wakeupId, actor.projectId), s = this.app.store.get('session', c.rootSessionId, actor.projectId);
        assertResearchReference(this.app.store, actor.projectId, { continuationId: c.id, digest: c.digest }, true);
        ensure(w.continuationId === c.id && w.rootSessionId === s.id && w.state === 'running' && w.generation === actor.generation && actor.sessionId === s.id && s.state === 'running' && s.generation === actor.generation && s.leaseUntil > Date.now(), 'AUTOMATION_STALE', '续接来源或执行租约失效', 403);
        return c;
    }
    captureResume(actor) {
        if (actor.type !== 'agent' || !actor.sessionId || !actor.messageId || actor.taskId || actor.wakeupId)
            return;
        const s = this.app.store.get('session', actor.sessionId, actor.projectId), m = this.app.store.get('message', actor.messageId, actor.projectId);
        if (s.role !== 'coordinator' || s.teamId || s.parentSessionId || m.role !== 'user' || m.origin === 'automation' || m.wakeupId || m.approvalNoticeId || m.sessionId !== s.id)
            return;
        ensure(m.status === 'running' && m.generation === actor.generation && actor.researchModelDigest === this.modelIdentity(s), 'APPROVAL_RESUME_SOURCE_STALE', '准备时的用户任务或模型连接失效');
        return { rootSessionId: s.id, originMessageId: m.id, originDigest: digest(m.content), modelDigest: actor.researchModelDigest, permission: this.app.sessionPermissions.capture(s.id, true) };
    }
    assertResume(task) { const ref = task.resume; ensure(ref && digest(task.manifest) === task.manifestDigest && task.manifest.approvalResumeDigest === digest(ref), 'APPROVAL_RESUME_UNBOUND', '旧测试没有固定恢复来源'); const s = this.app.store.get('session', ref.rootSessionId, task.projectId), m = this.app.store.get('message', ref.originMessageId, task.projectId); this.app.sessionPermissions.assert(ref.permission, false); ensure(s.id === task.sessionId && s.role === 'coordinator' && !s.taskId && !s.teamId && !s.parentSessionId && s.state !== 'archived' && this.modelIdentity(s) === ref.modelDigest && m.sessionId === s.id && m.role === 'user' && m.origin !== 'automation' && !m.wakeupId && !m.approvalNoticeId && digest(m.content) === ref.originDigest, 'APPROVAL_RESUME_SOURCE_STALE', '原准备任务、用户来源或模型连接已变化'); return ref; }
    chain(actor) {
        if (actor.continuationId)
            return this.assertActor(actor);
        if (actor.type !== 'agent' || actor.wakeupId || !actor.sessionId || !actor.messageId)
            return;
        const grant = this.app.store.maybe('host-access', actor.sessionId);
        if (grant?.researchAutomationScope !== 1 || !this.app.hostAccess.status({ type: 'user' }, actor.sessionId).enabled)
            return;
        this.app.hostAccess.assertAgent(actor);
        const s = this.app.store.get('session', actor.sessionId, actor.projectId), m = this.app.store.get('message', actor.messageId, actor.projectId);
        const policy = this.app.sessionPermissions.capture(s.id);
        ensure(actor.researchModelDigest === this.modelIdentity(s), 'AUTOMATION_MODEL_CHANGED', '模型连接已变化或执行身份未固定模型来源', 403);
        ensure(m.sessionId === s.id && m.role === 'user' && !m.origin && !m.wakeupId && !m.approvalNoticeId && m.status === 'running' && m.generation === actor.generation && digest(m.permission) === digest(policy) && Date.parse(m.createdAt) >= Date.parse(grant.researchAutomationAcknowledgedAt), 'AUTOMATION_ORIGIN_REQUIRED', '只允许本次新授权之后的当前用户任务', 403);
        const active = this.app.store.list('research-continuation', s.projectId).find(c => c.rootSessionId === s.id && c.state === 'active');
        if (active)
            return assertResearchReference(this.app.store, s.projectId, { continuationId: active.id, digest: active.digest }, true);
        const id = digest({ rootSessionId: s.id, messageId: m.id }), old = this.app.store.maybe('research-continuation', id);
        if (old)
            return assertResearchReference(this.app.store, s.projectId, { continuationId: id, digest: old.digest }, true);
        const fixed = { rootSessionId: s.id, originMessageId: m.id, originDigest: digest(m.content), permission: policy, runtimeId: grant.runtimeId, modelDigest: modelDigest(this.app.store, s), ...(s.sourceRevisionId ? { sourceRevisionId: s.sourceRevisionId } : {}), expiresAt: new Date(Date.parse(m.createdAt) + AUTOMATION_LIMITS.durationMs).toISOString(), limits: AUTOMATION_LIMITS };
        const c = this.app.store.create('research-continuation', s.projectId, { ...fixed, digest: digest(fixed), state: 'active' }, id);
        this.app.budget.configure(s.projectId, id, AUTOMATION_LIMITS.continuations);
        this.app.store.event(s.projectId, 'research.continuation_created', { continuationId: id, sessionId: s.id, messageId: m.id });
        return assertResearchReference(this.app.store, s.projectId, { continuationId: id, digest: c.digest }, true);
    }
    target(context, fresh = true) { const row = this.app.store.db.prepare('SELECT * FROM compute_contexts WHERE context=?').get(context); ensure(row?.status === 'ready' && (!fresh || Number(row.next_probe_at) > Date.now()) && typeof row.endpoint === 'string' && (/^(unix:\/\/\/|npipe:\/\/)/.test(row.endpoint)) && row.engine_id && row.target_id, 'AUTOMATION_LOCAL_DOCKER_REQUIRED', '自主开发测试需要已核验的本机 Docker endpoint 和 engine', 403); return { context, targetId: String(row.target_id), engineId: String(row.engine_id), endpoint: row.endpoint }; }
    authorize(actor, approval, dockerContext, runner, experimentId) {
        if (runner && runner !== 'local' && runner !== 'trusted-example')
            return undefined;
        const c = this.chain(actor);
        if (!c)
            return undefined;
        ensure(approval.subjectKind === 'development-task' || approval.subjectKind === 'run-intent', 'AUTOMATION_SCOPE_DENIED', '该审批不属于自主计算范围', 403);
        if (runner)
            ensure(runner === 'local' || runner === 'trusted-example', 'AUTOMATION_TARGET_DENIED', '自主运行仅限已保存的本机运行时或可信示例', 403);
        if (runner)
            ensure(experimentId && this.experimentInScope(c, experimentId), 'AUTOMATION_EXPERIMENT_UNBOUND', '自主运行只接受原任务之前已存在的合法实验或本链配置变体', 403);
        const dockerTarget = dockerContext ? this.target(dockerContext) : undefined, ref = { continuationId: c.id, digest: c.digest };
        this.app.store.create('research-authorization', approval.projectId, { continuationId: c.id, subjectKind: approval.subjectKind, subjectId: approval.subjectId, manifestDigest: approval.digest, approvalId: approval.id, ...(dockerTarget ? { dockerTarget } : {}) }, approval.subjectId);
        this.app.store.update('approval', approval.id, approval.version, { status: 'approved', fullAccess: ref, decidedAt: now(), reason: '当前用户明确授权的有界自主计算；仅批准此准确冻结清单，不是人工逐项批准' });
        return ref;
    }
    assertApproval(a, current = false) { if (!a.fullAccess)
        return; const c = assertResearchReference(this.app.store, a.projectId, a.fullAccess, current), auth = this.app.store.get('research-authorization', a.subjectId, a.projectId); ensure(!a.workingGrant && !a.runGrant && auth.continuationId === c.id && auth.subjectId === a.subjectId && auth.approvalId === a.id && auth.manifestDigest === a.digest && auth.subjectKind === a.subjectKind && (a.subjectKind === 'development-task' && a.scope === 'development.test' || a.subjectKind === 'run-intent' && a.scope === 'run.submit'), 'APPROVAL_STALE', '自主计算的准确派生依据不符', 403); if (current && auth.dockerTarget)
        ensure(digest(this.target(auth.dockerTarget.context, false)) === digest(auth.dockerTarget), 'AUTOMATION_TARGET_CHANGED', '本机 Docker 目标已变化', 403); return c; }
    submissionChain(actor) {
        if (actor.continuationId)
            return this.assertActor(actor);
        if (actor.type !== 'agent' || actor.wakeupId || actor.taskId || !actor.sessionId)
            return;
        const grant = this.app.store.maybe('host-access', actor.sessionId);
        if (grant?.researchAutomationScope !== 1 || !this.app.hostAccess.status({ type: 'user' }, actor.sessionId).enabled)
            return;
        const chains = this.app.store.list('research-continuation', actor.projectId).filter(c => c.rootSessionId === actor.sessionId && c.runtimeId === grant.runtimeId && c.permission.hostEpoch === grant.epoch);
        const c = chains.find(c => c.originMessageId === actor.messageId) ?? chains.find(c => c.state === 'active') ?? chains.at(-1);
        if (!c)
            return;
        this.app.hostAccess.assertAgent(actor);
        return assertResearchReference(this.app.store, actor.projectId, { continuationId: c.id, digest: c.digest }, true);
    }
    /** Read-only admission check; consume repeats it inside the job-creation transaction. */
    assertSubmission(actor, a) {
        if (actor.approvalResumeId) {
            const resume = this.app.wakeups.assertApprovalResume(actor, a.subjectId);
            ensure(a.subjectKind === 'development-task' && resume.approvalId === a.id && !a.fullAccess, 'AUTOMATION_APPROVAL_REQUIRED', '批准恢复只允许这一次准确人工批准测试', 403);
            return;
        }
        const required = this.submissionChain(actor);
        if (required)
            ensure(a.fullAccess?.continuationId === required.id && a.fullAccess.digest === required.digest, 'AUTOMATION_APPROVAL_REQUIRED', '自动提交需要当前持续任务的准确派生批准', 403);
        const c = this.assertApproval(a, true);
        if (!c)
            return;
        if (actor.type === 'agent')
            ensure(required?.id === c.id && actor.sessionId === c.rootSessionId, 'AUTOMATION_APPROVAL_REQUIRED', '执行身份不属于此持续任务', 403);
        const auth = this.app.store.get('research-authorization', a.subjectId, a.projectId);
        ensure(!auth.jobId, 'AUTOMATION_ALREADY_CONSUMED', '该计算授权已消费');
        const uses = this.app.store.list('research-authorization', a.projectId).filter(x => x.continuationId === c.id && x.jobId);
        ensure(uses.filter(x => x.subjectKind === a.subjectKind).length < (a.subjectKind === 'development-task' ? c.limits.development : c.limits.run), 'AUTOMATION_BUDGET_EXHAUSTED', '本任务计算次数已用完');
        for (const u of uses) {
            const j = this.app.store.get(u.subjectKind === 'development-task' ? 'sandbox-job' : 'run', u.jobId, a.projectId);
            ensure(['succeeded', 'failed', 'cancelled', 'timed_out'].includes(String(j.state)), 'AUTOMATION_COMPUTE_BUSY', '本任务已有在途或未知计算');
            ensure(j.integrity === 'complete', 'AUTOMATION_RESULT_INCOMPLETE', '前次归档不完整，不自动继续计算');
        }
        return auth;
    }
    consume(actor, a, jobId) { const auth = this.assertSubmission(actor, a); if (auth)
        this.app.store.update('research-authorization', auth.id, auth.version, { jobId }); }
    experimentInScope(c, id) { return !!this.app.store.db.prepare("SELECT 1 FROM records e JOIN records m ON m.id=? AND m.kind='message' AND m.project_id=e.project_id WHERE e.id=? AND e.kind='experiment' AND e.project_id=? AND e.rowid<m.rowid").get(c.originMessageId, id, c.projectId) || this.app.store.maybe('research-variant', id)?.continuationId === c.id; }
    variantSource(actor, pid, input) {
        const c = this.assertActor(actor);
        ensure(c.projectId === pid && typeof input.parentId === 'string' && Number.isSafeInteger(input.expectedParentRevision) && input.config && typeof input.config === 'object' && !Array.isArray(input.config) && input.contract === undefined, 'AUTOMATION_VARIANT_DENIED', '续接只允许明确父修订的完整配置变体，不能创建新根或改变契约', 403);
        const parent = this.app.store.get('experiment', input.parentId, pid);
        ensure(this.experimentInScope(c, parent.id), 'AUTOMATION_VARIANT_DENIED', '父实验不属于原有合法来源或本链配置变体', 403);
        ensure(parent.revision === input.expectedParentRevision && parent.lifecycle !== 'archived' && ['local', 'trusted-example'].includes(parent.contract.runner), 'AUTOMATION_VARIANT_DENIED', '父修订、生命周期或本机计算契约已变化', 403);
        assertExperimentSourceCurrent(this.app.store, parent);
        return validateSourceRevision(this.app.context, pid, digest({ projectId: pid, experimentId: parent.id, revision: parent.revision }));
    }
    recordVariant(actor, child, source) { const c = this.assertActor(actor); this.app.store.create('research-variant', child.projectId, { continuationId: c.id, parentId: child.parentId, parentSourceRevisionId: source.id, parentSourceDigest: source.sourceDigest, contractDigest: child.contractDigest }, child.id); }
    authorization(subjectId) { return this.app.store.maybe('research-authorization', subjectId); }
    resultSources() { return this.app.store.list('research-authorization').filter(a => a.jobId).map(a => { const c = this.app.store.get('research-continuation', a.continuationId), j = this.app.store.get(a.subjectKind === 'development-task' ? 'sandbox-job' : 'run', a.jobId, a.projectId); return { a, c, j }; }); }
}
//# sourceMappingURL=research-automation.js.map