import { join } from 'node:path';
import { publicationImageCatalog, PUBLICATION_IMAGE_TOOL, imageReference } from '../pi-adapter/publication-image.js';
import { ensure, DomainError } from '../domain/errors.js';
import { object, integer, oneOf } from '../contracts/validation.js';
import { digest } from '../storage/store.js';
import { readText, listFiles, readSourceMode } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
import { scope, userOnly, interactiveCoordinator } from './permissions.js';
const gitTuple = (job) => ({ id: job.id, action: job.action, sessionId: job.sessionId, sourceRevisionId: job.sourceRevisionId, snapshot: job.snapshot, expectedHead: job.expectedHead, branch: job.branch, workspace: job.workspace, previousWorkspace: job.previousWorkspace, message: job.message, commitDate: job.commitDate });
// Explicit effects: idempotency receipts do not make an operation a pure read.
const READ = new Set(['execution_environment_list', 'development_review_inspect', 'development_review_source_list', 'development_review_source_read', 'run_source_list', 'run_source_read', 'workspace_history_inspect', 'workspace_history_diff', 'workspace_history_operation', 'development_inspect', 'development_logs', 'experiment_source_list', 'experiment_source_read', 'experiment_source_diff', 'research_skill_list', 'research_skill_read', 'connector_status', 'project_inspect', 'workspace_list', 'workspace_read', 'evidence_read', 'artifact_read', 'run_inspect', 'run_logs', 'task_inspect', 'task_result_read', 'task_context_read', 'session_notice_read', 'research_brief_inspect', 'session_attachment_read', 'campaign_inspect', 'publication_templates', 'publication_template_inspect', 'publication_template_read', 'manuscript_list', 'manuscript_inspect', 'manuscript_source_read', 'publication_status', 'publication_inspect', 'publication_result', 'publication_build_list', 'publication_review_inspect', 'publication_review_list', 'approval_request']);
const EDIT = new Set(['workspace_write', 'workspace_history_set_mode', 'workspace_prepare_from_revision']);
const WRITE = new Set([PUBLICATION_IMAGE_TOOL, 'research_brief_save', 'development_review_prepare', 'reviewed_change_prepare', 'development_prepare', 'development_cancel', 'change_proposal_prepare', 'artifact_create', 'evidence_register', 'experiment_plan_submit', 'run_prepare', 'collaboration_plan_submit', 'agent_delegate', 'campaign_prepare', 'campaign_enroll', 'campaign_decision_submit', 'publication_template_import', 'manuscript_create', 'publication_prepare', 'publication_review_prepare', 'text_evidence_search', 'task_result_submit']);
const EXECUTE = new Set(['host_execute', 'workspace_history_commit', 'development_submit', 'run_submit']);
export const TASK_PERMISSION_EFFECTS = ['workspace_write', 'workspace_history_set_mode', 'workspace_prepare_from_revision', 'artifact_create', 'evidence_register', 'text_evidence_search', 'experiment_plan_submit', 'task_result_submit'];
const NETWORK = new Set(['literature_search', 'literature_discover', 'paper_read']);
export class SessionPermissionService {
    app;
    constructor(app) {
        this.app = app;
    }
    root(sessionId) { const s = this.app.store.get('session', sessionId); if (s.teamId)
        return this.app.store.get('session', this.app.store.get('team', s.teamId, s.projectId).rootSessionId, s.projectId); return s; }
    capture(sessionId, restricted = false) { const s = this.root(sessionId), p = this.app.store.maybe('session-permission', s.id), host = this.app.hostAccess.status({ type: 'user' }, s.id); return { rootSessionId: s.id, epoch: p?.epoch ?? 0, hostEpoch: host.epoch, mode: host.enabled && !restricted && sessionId === s.id ? 'fullAccess' : p?.mode ?? 'legacy' }; }
    assert(ref, effect = true) { const current = this.capture(ref.rootSessionId), p = this.app.store.maybe('session-permission', ref.rootSessionId); ensure(current.epoch === ref.epoch && current.hostEpoch === ref.hostEpoch && (current.mode === ref.mode || current.mode === 'fullAccess' && ref.mode === (p?.mode ?? 'legacy')), 'SESSION_PERMISSION_STALE', '会话权限已变化；需要用户明确重试', 403); ensure(!effect || ref.mode !== 'readOnly', 'SESSION_READ_ONLY', '只读会话不能产生副作用', 403); }
    captureJob(actor, execution) { const policy = this.capture(actor.sessionId, true); if (policy.mode !== 'readOnly')
        return { policy }; this.app.hostAccess.assertAgent(actor); this.app.approvals.assert(execution.approvalId, actor.projectId, execution.subjectId, execution.manifestDigest, execution.kind === 'run' ? 'run.submit' : 'development.test'); return { policy, approvedExecution: execution }; }
    assertJob(permission, execution, sessionId) { if (sessionId)
        ensure(this.root(sessionId).id === permission.policy.rootSessionId, 'APPROVAL_STALE', '作业权限不属于实际会话'); this.assert(permission.policy, false); if (permission.approvedExecution) {
        ensure(digest(permission.approvedExecution) === digest(execution), 'APPROVAL_STALE', '后台作业与精确批准清单不符');
        this.app.approvals.assert(execution.approvalId, this.root(permission.policy.rootSessionId).projectId, execution.subjectId, execution.manifestDigest, execution.kind === 'run' ? 'run.submit' : 'development.test');
    } ensure(permission.policy.mode !== 'readOnly' || permission.approvedExecution, 'SESSION_READ_ONLY', '只读上限未提供此精确后台作业授权', 403); }
    captureGit(actor, job) { const policy = this.capture(actor.sessionId, true); if (policy.mode !== 'readOnly')
        return undefined; this.app.hostAccess.assertAgent(actor); ensure(actor.permissionActionId, 'APPROVAL_REQUIRED', '后台Git副作用需要固定操作批准'); const a = this.app.store.get('session-action', actor.permissionActionId, actor.projectId); ensure(a.sessionId === actor.sessionId && a.state === 'executing' && job.sessionId === a.sessionId, 'APPROVAL_STALE', 'Git批准不属于当前准确操作'); this.assert(a.policy, false); const revision = this.app.store.get('source-revision', job.sourceRevisionId, actor.projectId); ensure(job.action === 'commit' && a.operation === 'workspace_history_commit' && a.input.message === job.message && a.source === this.source(a.sessionId, a.operation, a.input).fingerprint || job.action === 'checkout' && a.operation === 'workspace_prepare_from_revision' && (a.input.snapshotId === job.sourceRevisionId || a.input.experimentId === revision.experimentId && a.input.revision === revision.revision), 'APPROVAL_STALE', 'Git固定来源或动作不匹配'); this.app.approvals.assert(a.approvalId, a.projectId, a.id, digest({ operation: a.operation, input: a.input, policy: a.policy, source: a.source }), 'session.action'); return { actionId: a.id, approvalId: a.approvalId, operation: a.operation, tupleDigest: digest(gitTuple(job)) }; }
    assertGit(job) { if (!job.permission)
        return; ensure(job.sessionId && this.root(job.sessionId).id === job.permission.rootSessionId, 'APPROVAL_STALE', 'Git权限不属于实际会话'); this.assert(job.permission, false); const ref = job.approvedAction; if (ref) {
        const a = this.app.store.get('session-action', ref.actionId);
        ensure(a.sessionId === job.sessionId && a.approvalId === ref.approvalId && a.operation === ref.operation && ['executing', 'completed'].includes(a.state) && ref.tupleDigest === digest(gitTuple(job)) && a.policy.epoch === job.permission.epoch && a.policy.hostEpoch === job.permission.hostEpoch, 'APPROVAL_STALE', 'Git作业冻结清单或原批准已变化');
        this.app.approvals.assert(a.approvalId, a.projectId, a.id, digest({ operation: a.operation, input: a.input, policy: a.policy, source: a.source }), 'session.action');
    } ensure(job.permission.mode !== 'readOnly' || ref, 'SESSION_READ_ONLY', '只读上限未提供此准确Git作业授权', 403); }
    refresh(id) { this.app.store.transaction(() => { for (const a of this.app.store.list('session-action').filter(a => a.sessionId === id && ['pending', 'approved'].includes(a.state))) {
        let valid = true;
        try {
            this.assert(a.policy, false);
            valid = a.source === this.source(id, a.operation, a.input).fingerprint;
        }
        catch {
            valid = false;
        }
        if (!valid) {
            this.app.store.update('session-action', a.id, a.version, { state: 'stale' });
            this.app.approvals.stale(a.id);
        }
    } }); }
    status(actor, id) { this.refresh(id); const s = this.app.sessions.get(actor, id); ensure(actor.type === 'user' || actor.sessionId === id, 'SCOPE_DENIED', '只能查看自己的权限', 403); const p = this.app.store.maybe('session-permission', id), hostAccess = this.app.hostAccess.status(actor, id), available = s.role === 'coordinator' && !s.taskId && !s.teamId && s.state !== 'archived' && !this.app.store.get('project', s.projectId).archived; return { sessionId: id, mode: hostAccess.enabled ? 'fullAccess' : p?.mode ?? 'legacy', version: p?.version ?? 0, epoch: p?.epoch ?? 0, available, reason: available ? '权限为现有角色、任务和固定来源授权设置额外上限。' : '仅当前交互主会话可设置权限。', hostAccess, hasMoreActions: this.app.store.list('session-action', s.projectId).filter(a => a.sessionId === id).length > 20, actions: this.app.store.list('session-action', s.projectId).filter(a => a.sessionId === id).slice(-20).map(a => ({ ...a, approval: this.app.store.get('approval', a.approvalId, s.projectId) })) }; }
    initialize(id, mode = 'confirm') { const s = this.app.store.get('session', id); return this.app.store.create('session-permission', s.projectId, { sessionId: id, mode, epoch: 1 }, id); }
    set(actor, id, value) { userOnly(actor); const x = object(value); ensure(Object.keys(x).every(k => ['mode', 'expectedVersion', 'expectedHostVersion'].includes(k)), 'INVALID_INPUT', '权限设置包含未知字段'); const mode = oneOf(x.mode, ['readOnly', 'confirm', 'autoEdit'], 'mode'), expected = integer(x.expectedVersion, 'expectedVersion', 0), hostExpected = x.expectedHostVersion === undefined ? undefined : integer(x.expectedHostVersion, 'expectedHostVersion', 0); this.app.store.transaction(() => { const s = this.app.sessions.get(actor, id), status = this.status(actor, id), persistedHost = this.app.store.maybe('host-access', id); ensure(status.available, 'SESSION_PERMISSION_UNAVAILABLE', status.reason, 403); ensure(status.version === expected, 'VERSION_CONFLICT', '权限已变化，请刷新'); ensure(hostExpected !== undefined || persistedHost?.state !== 'enabled', 'VERSION_CONFLICT', '切换完全访问需要当前宿主权限版本'); if (hostExpected !== undefined)
        ensure(status.hostAccess.version === hostExpected, 'VERSION_CONFLICT', '宿主权限已变化，请刷新'); const old = this.app.store.maybe('session-permission', id); if (old)
        this.app.store.update('session-permission', id, old.version, { mode, epoch: old.epoch + 1 });
    else
        this.initialize(id, mode); if (persistedHost?.state === 'enabled')
        this.app.hostAccess.revoke(actor, id, { expectedVersion: status.hostAccess.version }); this.stale(id); this.app.store.event(s.projectId, 'session.permissions_changed', { sessionId: id, mode }); }); return this.status(actor, id); }
    stale(id) { const root = this.root(id); for (const a of this.app.store.list('session-action', root.projectId).filter(a => this.root(a.sessionId).id === root.id && ['pending', 'approved'].includes(a.state))) {
        this.app.store.update('session-action', a.id, a.version, { state: 'stale' });
        this.app.approvals.stale(a.id);
    } }
    source(sessionId, operation, input) {
        const s = this.app.store.get('session', sessionId), refs = ['workingGrantId', 'runGrantId', 'discoveryGrantId', 'textCorpusGrantId'].map(k => { const id = s[k]; if (!id)
            return null; const row = this.app.store.db.prepare('SELECT kind,version,data FROM records WHERE id=? AND project_id=?').get(String(id), s.projectId); return [id, row?.kind, row?.version, row ? digest(JSON.parse(String(row.data))) : null]; });
        let before;
        if (operation === 'workspace_write') {
            let content = null;
            try {
                content = readText(this.app.store.paths.physical(s.workspace), input.path).content;
            }
            catch (error) {
                if (error.code !== 'NOT_FOUND')
                    throw error;
            }
            before = { path: input.path, content, digest: content === null ? null : digest(content) };
        }
        const targets = [];
        const walk = (value, key = '') => { if (Array.isArray(value)) {
            for (const v of value)
                walk(v, key);
            return;
        } if (value && typeof value === 'object') {
            for (const [k, v] of Object.entries(value))
                walk(v, k);
            return;
        } if (typeof value === 'string' && /Ids?$/.test(key)) {
            const row = this.app.store.db.prepare('SELECT kind,version,data FROM records WHERE id=? AND project_id=?').get(value, s.projectId);
            if (row) {
                const d = JSON.parse(String(row.data));
                targets.push([key, value, row.kind, d.manifestDigest, d.sourceDigest, d.contractDigest, d.digest, d.sourceRevisionId, d.snapshot, d.researchBrief, d.revision, d.candidateSnapshot]);
            }
        } };
        walk(input);
        const task = s.taskId ? this.app.store.get('task', s.taskId, s.projectId) : undefined;
        const settings = NETWORK.has(operation) ? this.app.connectors.settings({ type: 'user' }, s.projectId) : undefined;
        let sourceWorkspace;
        if (['workspace_history_commit', 'workspace_history_set_mode', 'development_prepare', 'change_proposal_prepare'].includes(operation))
            sourceWorkspace = s.workspace;
        if (operation === 'experiment_plan_submit')
            sourceWorkspace = input.parentId ? this.app.store.get('experiment', input.parentId, s.projectId).workspace : this.app.store.get('project', s.projectId).workspace;
        if (operation === 'run_prepare')
            sourceWorkspace = this.app.store.get('experiment', input.experimentId, s.projectId).workspace;
        let workspaceFiles;
        if (sourceWorkspace) {
            const root = this.app.store.paths.physical(sourceWorkspace), files = listFiles(root);
            ensure(files.reduce((n, f) => n + f.size, 0) <= 64 * 1024 * 1024, 'SESSION_SOURCE_TOO_LARGE', '审批源码总量最多64 MiB', 413);
            workspaceFiles = files.map(f => ({ path: f.path, digest: digest(readStableFile(root, f.path, 64 * 1024 * 1024)), mode: readSourceMode(root, f.path) }));
        }
        const brief = ['experiment_plan_submit', 'run_prepare', 'manuscript_create'].includes(operation) && s.role === 'coordinator' && s.researchBriefId ? this.app.store.get('research-brief', s.researchBriefId, s.projectId) : undefined;
        const researchBrief = brief ? { id: brief.id, digest: brief.digest, revision: brief.revision, status: brief.status, rootSessionId: brief.rootSessionId } : null;
        let publicationImage;
        if (operation === PUBLICATION_IMAGE_TOOL) {
            const { data, ...page } = this.app.publicationBuilds.pageImage({ type: 'user' }, s.projectId, input.publicationResultId, input.pageNumber);
            ensure(this.app.store.get('manuscript-revision', page.revisionId, s.projectId).rootSessionId === sessionId, 'SCOPE_DENIED', '固定文稿不属于当前会话', 403);
            publicationImage = { ...page, catalog: publicationImageCatalog(join(this.app.context.dataDir, 'models.json')) };
        }
        return { fingerprint: digest({ ...(publicationImage ? { publicationImage } : {}), workspace: s.workspace, sourceWorkspace, workspaceFiles, researchBrief, model: s.model, role: s.role, taskId: s.taskId, attemptId: task?.attemptId, sourceRevisionId: s.sourceRevisionId, sourceDigest: s.sourceDigest, refs, targets, before, connectors: settings ? { version: settings.version, enabled: settings.enabled, requestLimit: settings.requestLimit } : null }), before };
    }
    guard(actor, operation, input, callId) {
        if (actor.type !== 'agent')
            return undefined;
        const current = this.capture(actor.sessionId, !!actor.wakeupId), ref = actor.permission ?? current;
        ensure(digest(ref) === digest(current), 'SESSION_PERMISSION_STALE', '执行身份的权限已变化', 403);
        ensure(READ.has(operation) || EDIT.has(operation) || WRITE.has(operation) || EXECUTE.has(operation) || NETWORK.has(operation) || operation === 'task_progress_report', 'SESSION_OPERATION_UNCLASSIFIED', '未分类操作不能执行', 403);
        if (READ.has(operation) || operation === 'task_progress_report')
            return { reference: ref };
        ensure(current.mode !== 'readOnly', 'SESSION_READ_ONLY', '只读会话禁止修改、联网或执行', 403);
        if (actor.taskId) {
            const taskSession = this.app.store.get('session', actor.sessionId);
            if (taskSession.teamId) {
                const team = this.app.store.get('team', taskSession.teamId, taskSession.projectId);
                if (team.permission)
                    this.assert(team.permission, false);
            }
        }
        const preciseGit = current.mode === 'fullAccess' && this.capture(actor.sessionId, true).mode === 'readOnly' && (operation === 'workspace_history_commit' || operation === 'workspace_prepare_from_revision' && !!this.app.store.get('project', actor.projectId).gitHistoryEnabled);
        if (operation !== PUBLICATION_IMAGE_TOOL && (current.mode === 'legacy' || current.mode === 'fullAccess' && !preciseGit && !actor.wakeupId && !actor.taskId && this.root(actor.sessionId).id === actor.sessionId))
            return { reference: ref };
        const s = this.app.store.get('session', actor.sessionId);
        ensure(!actor.wakeupId, 'SESSION_AUTOMATION_ACTION_UNAPPROVED', '自动唤醒仅可读取固定资料；写入须由用户交互主会话处理', 403);
        if (actor.taskId && s.teamId) {
            const team = this.app.store.get('team', s.teamId, s.projectId), plan = this.app.store.list('team-plan', s.projectId).find(p => p.teamId === team.id);
            if (team.permission)
                this.assert(team.permission, false);
            this.app.approvals.assert(team.approvalId, s.projectId, team.id, team.planDigest, 'collaboration');
            ensure(digest(team.taskPermissionEffects) === digest(plan?.taskPermissionEffects) && digest(team.permission) === digest(plan?.permission), 'APPROVAL_STALE', '任务副作用授权与批准计划不符');
            if (team.taskPermissionEffects?.includes(operation) && TASK_PERMISSION_EFFECTS.includes(operation) || NETWORK.has(operation) && s.discoveryGrantId || operation === 'run_submit' && s.runGrantId) {
                if (operation !== 'task_result_submit')
                    this.app.teams.active(actor);
                return { reference: ref };
            }
            ensure(false, 'SESSION_TASK_ACTION_UNAPPROVED', '此任务计划未批准该副作用；请用户先建立对应固定授权后重新派发任务', 403);
        }
        if (current.mode === 'autoEdit' && (EDIT.has(operation) || NETWORK.has(operation) && !!s.discoveryGrantId))
            return { reference: ref };
        const callRef = callId ? digest({ sessionId: s.id, callId }) : undefined, mapped = callRef ? this.app.store.maybe('permission-call', callRef) : undefined;
        if (mapped) {
            ensure(mapped.operation === operation && mapped.inputDigest === digest(input), 'IDEMPOTENCY_CONFLICT', '同一调用标识不能用于其他参数');
            const a = this.app.store.get('session-action', mapped.actionId);
            this.assert(a.policy);
            ensure(!['failed', 'unknown', 'stale', 'rejected'].includes(a.state), 'SESSION_ACTION_CONSUMED', '批准已失败、撤销或效果待核对，不重复执行');
            if (['executing', 'completed'].includes(a.state))
                return { reference: ref, actionId: a.id, key: `permission-action:${a.id}`, consumed: true };
        }
        const source = this.source(s.id, operation, input), matching = this.app.store.list('session-action', s.projectId).filter(a => a.sessionId === s.id && a.operation === operation && digest(a.input) === digest(input) && a.epoch === ref.epoch && digest(a.policy) === digest(ref) && a.source === source.fingerprint);
        ensure(!matching.some(a => a.state === 'rejected' && a.generation === actor.generation), 'APPROVAL_REJECTED', '此轮操作已被用户拒绝，请停止并等待新的用户输入');
        ensure(!matching.some(a => ['failed', 'unknown'].includes(a.state)), 'SESSION_ACTION_CONSUMED', '本次批准执行失败或效果待核对，不自动重复');
        const approved = matching.find(a => a.state === 'approved' && this.app.store.get('approval', a.approvalId).status === 'approved');
        if (approved) {
            if (callRef)
                this.app.store.transaction(() => { if (!this.app.store.maybe('permission-call', callRef))
                    this.app.store.create('permission-call', s.projectId, { actionId: approved.id, operation, inputDigest: digest(input) }, callRef); });
            return { reference: ref, actionId: approved.id, key: `permission-action:${approved.id}` };
        }
        const old = matching.find(a => ['executing', 'completed'].includes(a.state));
        if (old)
            return { reference: ref, actionId: old.id, key: `permission-action:${old.id}`, consumed: true };
        let pending = matching.find(a => a.state === 'pending');
        if (!pending)
            this.app.store.transaction(() => { const id = digest({ sessionId: s.id, operation, input, policy: ref, source: source.fingerprint, callId, generation: actor.generation }), approval = this.app.approvals.request(s.projectId, 'session-action', id, digest({ operation, input, policy: ref, source: source.fingerprint }), 'session.action', operation === PUBLICATION_IMAGE_TOOL ? `允许固定文稿 ${input.publicationResultId} 第 ${input.pageNumber} 页加入当前会话并发送给 ${s.model.provider}/${s.model.model}；后续请求及重开可能再次发送。权限或来源失效时停止；已发送内容无法撤回。仅检查布局，不证明科学结论。` : '批准本次准确参数、来源和权限版本的操作'); pending = this.app.store.create('session-action', s.projectId, { sessionId: s.id, operation, input, epoch: ref.epoch, policy: ref, source: source.fingerprint, approvalId: approval.id, generation: actor.generation, state: 'pending', ...(source.before ? { before: source.before } : {}) }, id); });
        throw new DomainError('APPROVAL_REQUIRED', '需要用户批准此项具体操作', 409, { actionId: pending.id, operation });
    }
    assertImageAction(actor, value) {
        const ref = imageReference(value), s = this.app.store.get('session', actor.sessionId, actor.projectId);
        interactiveCoordinator(actor, s.projectId, s);
        const a = this.app.store.get('session-action', ref.actionId, s.projectId);
        ensure(a.operation === PUBLICATION_IMAGE_TOOL && a.sessionId === s.id && ['executing', 'completed'].includes(a.state) && a.input.publicationResultId === ref.publicationResultId && a.input.pageNumber === ref.pageNumber, 'PERMISSION_IMAGE_UNAPPROVED', '图片未绑定当前会话的已批准准确操作', 403);
        this.assert(a.policy);
        ensure(a.source === this.source(s.id, a.operation, a.input).fingerprint, 'MODEL_IMAGE_SOURCE_STALE', '图片批准的来源、模型或目录已变化');
        this.app.approvals.assert(a.approvalId, s.projectId, a.id, digest({ operation: a.operation, input: a.input, policy: a.policy, source: a.source }), 'session.action');
        const page = this.app.publicationBuilds.pageImage(actor, s.projectId, ref.publicationResultId, ref.pageNumber);
        ensure(['digest', 'bytes', 'width', 'height'].every(k => ref[k] === page[k]), 'MODEL_IMAGE_INVALID', '历史图片引用与当前固定资产不符');
    }
    validate(ref, sessionId, operation, input, actionId) { this.assert(ref); if (actionId) {
        const a = this.app.store.get('session-action', actionId);
        ensure(a.sessionId === sessionId && a.operation === operation && digest(a.input) === digest(input) && a.source === this.source(sessionId, operation, input).fingerprint && ['approved', 'executing'].includes(a.state), 'APPROVAL_STALE', '审批来源、参数或状态已失效');
        this.app.approvals.assert(a.approvalId, a.projectId, a.id, digest({ operation, input, policy: ref, source: a.source }), 'session.action');
    } }
    begin(id) { const a = this.app.store.get('session-action', id); ensure(a.state === 'approved', 'SESSION_ACTION_CONSUMED', '批准已被消费，禁止再次执行'); this.app.store.update('session-action', id, a.version, { state: 'executing' }); }
    complete(id) { const a = this.app.store.get('session-action', id); this.app.store.update('session-action', id, a.version, { state: 'completed' }); }
    failed(id, error, uncertain = false) { const a = this.app.store.get('session-action', id); if (['approved', 'executing'].includes(a.state))
        this.app.store.update('session-action', id, a.version, { state: uncertain ? 'unknown' : 'failed', error: error.message }); }
    decide(actor, id, actionId, value) { userOnly(actor); const ownerSession = this.app.sessions.get(actor, id); scope(actor, ownerSession.projectId); this.refresh(id); const x = object(value); ensure(Object.keys(x).every(k => ['expectedVersion', 'expectedApprovalVersion', 'approved'].includes(k)) && typeof x.approved === 'boolean', 'INVALID_INPUT', '审批参数无效'); return this.app.store.transaction(() => { const s = this.app.sessions.get(actor, id), a = this.app.store.get('session-action', actionId, s.projectId); ensure(a.sessionId === id, 'SCOPE_DENIED', '审批不属于当前会话', 403); ensure(a.state !== 'stale', 'APPROVAL_STALE', '操作来源或权限已失效'); ensure(a.version === integer(x.expectedVersion, 'expectedVersion', 1), 'VERSION_CONFLICT', '操作版本已变化'); ensure(a.state === 'pending', 'APPROVAL_NOT_PENDING', '操作已处理'); this.assert(a.policy); ensure(a.source === this.source(id, a.operation, a.input).fingerprint, 'APPROVAL_STALE', '操作来源已变化'); this.app.approvals.decide(actor, a.approvalId, integer(x.expectedApprovalVersion, 'expectedApprovalVersion', 1), x.approved); this.app.store.update('session-action', a.id, a.version, { state: x.approved ? 'approved' : 'rejected' }); if (x.approved && !s.taskId)
        this.app.sessions.send(actor, id, { mode: 'follow_up', content: `用户已批准固定操作 ${a.id}。请调用 ${a.operation}，沿原生会话中该次工具调用的固定准确参数继续；参数不能回查则停止。不得更改参数或重复已完成的副作用。` }); return this.status(actor, id); }); }
}
//# sourceMappingURL=session-permissions.js.map