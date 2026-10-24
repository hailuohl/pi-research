import { assertGrantAdmission } from './grant-retirement.js';
import { resolveTaskModel } from '../collaboration/task-model.js';
import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { verifySnapshot } from '../workspace/files.js';
import { assertExperimentSourceCurrent } from './lifecycle.js';
import { discoveryTaskSpec, discoveryTeamPlanDigest } from './discovery-grant-validation.js';
export function runGrantPayload(g) { const { sessionId, taskBinding, model, entries, maxRuns, expiresAt, approvalId } = g; return { sessionId, model, entries, maxRuns, expiresAt, approvalId, ...(taskBinding ? { taskBinding } : {}) }; }
export const runGrantReference = (g) => ({ id: g.id, digest: g.digest, approvalId: g.approvalId });
export function assertRunGrantRecord(store, pid, id) {
    const grant = store.get('run-grant', id, pid);
    ensure(digest(runGrantPayload(grant)) === grant.digest, 'RUN_GRANT_CORRUPTED', '冻结运行授权内容已改变');
    const approval = store.get('approval', grant.approvalId, pid);
    ensure(approval.subjectKind === 'run-grant' && approval.subjectId === grant.id && approval.digest === grant.digest && approval.scope === 'run-grant.activate' && !approval.workingGrant && !approval.runGrant, 'APPROVAL_STALE', '运行授权的原批准身份不符');
    return { grant, approval };
}
export function assertRunGrantReference(store, pid, ref, admission = false) {
    const { grant: g, approval } = assertRunGrantRecord(store, pid, ref.id);
    ensure(g.digest === ref.digest && g.approvalId === ref.approvalId, 'RUN_GRANT_STALE', '运行授权的原身份已改变');
    ensure(g.state === 'active', 'RUN_GRANT_REVOKED', '运行授权尚未激活或已撤销');
    ensure(approval.status === 'approved', 'APPROVAL_STALE', '运行授权的原批准已失效');
    if (admission) {
        assertGrantAdmission(store, pid, 'run-grant', g.id);
        ensure(Date.parse(g.expiresAt) > Date.now(), 'RUN_GRANT_EXPIRED', '运行授权已到期；历史结果保留');
        if (!g.taskBinding) {
            const s = store.get('session', g.sessionId, pid);
            ensure(s.runGrantId === g.id && s.role === 'coordinator' && !s.taskId && s.state !== 'archived' && digest(s.model) === digest(g.model), 'RUN_GRANT_SCOPE_CHANGED', '指定会话或模型已改变');
        }
    }
    return g;
}
export function buildRunGrantTaskBinding(store, pid, task) {
    ensure(task.role === 'analyst', 'RUN_GRANT_TASK_REQUIRED', '只支持 analyst Task 的固定运行授权');
    const team = store.get('team', task.teamId, pid), plans = store.list('team-plan', pid).filter(p => p.teamId === team.id);
    ensure(plans.length === 1, 'RUN_GRANT_TASK_PLAN_INVALID', '任务没有唯一的原始团队计划');
    const plan = plans[0];
    const approval = store.get('approval', team.approvalId, pid);
    ensure(approval.subjectKind === 'team' && approval.subjectId === team.id && approval.digest === team.planDigest && approval.scope === 'collaboration' && !approval.workingGrant && !approval.runGrant && ['pending', 'approved'].includes(approval.status), 'RUN_GRANT_TEAM_APPROVAL_STALE', '原团队计划批准身份无效');
    const taskSpec = discoveryTaskSpec(task), taskSpecDigest = digest(taskSpec);
    ensure(plan.teamId === team.id && plan.planVersion === team.planVersion && plan.directiveVersion === team.directiveVersion && plan.digest === team.planDigest && plan.tasks.some(x => digest(x) === taskSpecDigest), 'RUN_GRANT_TASK_PLAN_INVALID', '任务与原始团队计划不符');
    const binding = { taskId: task.id, teamId: team.id, teamApprovalId: team.approvalId, planDigest: team.planDigest, planVersion: team.planVersion, directiveVersion: team.directiveVersion, taskSpecDigest, teamPlanId: plan.id, teamPlanVersion: plan.version, teamPlanDigest: discoveryTeamPlanDigest(plan), role: 'analyst' };
    return { binding, model: resolveTaskModel(plan, task), sessionId: team.rootSessionId };
}
export function assertRunGrantTaskBinding(store, pid, grant, options = {}) {
    const b = grant.taskBinding;
    ensure(b && b.role === 'analyst', 'RUN_GRANT_TASK_BINDING_REQUIRED', '缺少固定 analyst Task 绑定');
    const task = store.get('task', b.taskId, pid), team = store.get('team', b.teamId, pid), plan = store.get('team-plan', b.teamPlanId, pid), approval = store.get('approval', b.teamApprovalId, pid), root = store.get('session', team.rootSessionId, pid);
    ensure(grant.sessionId === team.rootSessionId && root.role === 'coordinator' && !root.taskId, 'RUN_GRANT_TASK_BINDING_REQUIRED', 'Task RunGrant 根会话不属于原团队');
    ensure(task.runGrantId === grant.id && task.teamId === b.teamId && task.role === 'analyst' && task.id === b.taskId, 'RUN_GRANT_TASK_BINDING_REQUIRED', 'Task 运行授权标记或角色不符');
    ensure(team.id === b.teamId && team.approvalId === b.teamApprovalId && team.planDigest === b.planDigest && team.planVersion === b.planVersion && team.directiveVersion === b.directiveVersion, 'RUN_GRANT_TASK_PLAN_STALE', '原团队计划或批准已改变');
    ensure(approval.subjectKind === 'team' && approval.subjectId === team.id && approval.digest === b.planDigest && approval.scope === 'collaboration' && !approval.workingGrant && !approval.runGrant, 'RUN_GRANT_TEAM_APPROVAL_STALE', '原团队批准身份不符');
    if (!options.allowInvalidTeamApproval)
        ensure(['pending', 'approved'].includes(approval.status), 'RUN_GRANT_TEAM_APPROVAL_STALE', '原团队批准已失效');
    if (options.requireApprovedTeam)
        ensure(approval.status === 'approved', 'RUN_GRANT_TEAM_APPROVAL_REQUIRED', '原团队计划尚未批准');
    const specDigest = digest(discoveryTaskSpec(task));
    ensure(plan.id === b.teamPlanId && plan.version === b.teamPlanVersion && plan.teamId === team.id && plan.planVersion === b.planVersion && plan.directiveVersion === b.directiveVersion && plan.digest === b.planDigest && discoveryTeamPlanDigest(plan) === b.teamPlanDigest && digest(resolveTaskModel(plan, task)) === digest(grant.model) && task.planVersion === b.planVersion && task.directiveVersion === b.directiveVersion && specDigest === b.taskSpecDigest && plan.tasks.some(x => digest(x) === specDigest), 'RUN_GRANT_TASK_PLAN_STALE', '冻结团队计划、模型或任务规范已改变');
    if (options.requireUnclaimed)
        ensure(task.execution === 'pending' && task.attemptCount === 0 && !task.attemptId && !task.sessionId, 'RUN_GRANT_TASK_ALREADY_DISPATCHED', '只能为尚未派发的 analyst Task 授权');
    return { task, team, plan, approval };
}
/** Checks the current Task worker and grant markers before submit or receipt replay. */
export function assertRunGrantTaskSubmission(store, actor, intent, newSubmission = true) {
    ensure(actor.type === 'agent' && actor.taskId && actor.attemptId && actor.sessionId && !actor.wakeupId, 'RUN_GRANT_SCOPE_DENIED', '需要当前 analyst Task 尝试身份', 403);
    ensure(intent.runGrant, 'RUN_GRANT_SCOPE_DENIED', 'Task 只能提交其固定 RunGrant 中的 RunIntent', 403);
    const { grant, approval } = assertRunGrantRecord(store, intent.projectId, intent.runGrant.id), ref = runGrantReference(grant);
    ensure(digest(ref) === digest(intent.runGrant) && grant.digest === intent.runGrant.digest && grant.approvalId === intent.runGrant.approvalId, 'RUN_GRANT_STALE', 'Task RunGrant 引用已改变');
    const { task, team, approval: teamApproval } = assertRunGrantTaskBinding(store, intent.projectId, grant, { requireApprovedTeam: newSubmission, allowInvalidTeamApproval: !newSubmission });
    const attempt = store.get('task-attempt', actor.attemptId, intent.projectId), session = store.get('session', actor.sessionId, intent.projectId);
    ensure(actor.role === 'analyst' && task.role === 'analyst' && actor.taskId === task.id && actor.sessionId === task.sessionId && task.execution === 'running' && task.attemptId === attempt.id && task.generation === actor.generation && attempt.taskId === task.id && attempt.teamId === team.id && attempt.sessionId === session.id && attempt.generation === actor.generation && attempt.state === 'running' && attempt.leaseUntil > Date.now(), 'LEASE_EXPIRED', 'RunGrant 只能由当前有效 Task 尝试提交');
    ensure(session.taskId === task.id && session.teamId === team.id && session.role === 'analyst' && session.runGrantId === grant.id && session.state === 'running' && session.leaseUntil > Date.now() && digest(session.model) === digest(grant.model) && task.runGrantId === grant.id && attempt.runGrant && digest(attempt.runGrant) === digest(ref), 'RUN_GRANT_SCOPE_CHANGED', 'Task、Session、Attempt 或固定模型授权标记不一致');
    const entry = grant.entries.find(e => e.intentId === intent.id), m = intent.manifest, intentApproval = store.get('approval', intent.approvalId, intent.projectId);
    ensure(entry && entry.experimentId === intent.experimentId && entry.manifestDigest === intent.manifestDigest && entry.approvalId === intent.approvalId && digest(m) === entry.manifestDigest && digest(intent.runGrant) === digest(ref) && intentApproval.subjectKind === 'run-intent' && intentApproval.subjectId === intent.id && intentApproval.scope === 'run.submit' && intentApproval.digest === entry.manifestDigest && digest(intentApproval.runGrant) === digest(ref), 'RUN_GRANT_INTENT_CHANGED', 'RunIntent 不在该 Task 的冻结授权集合内');
    if (newSubmission) {
        assertRunGrantReference(store, intent.projectId, ref, true);
        ensure(approval.status === 'approved' && intentApproval.status === 'approved' && intent.status === 'prepared' && !intent.runId, 'RUN_GRANT_INTENT_UNAVAILABLE', '仅能提交当前有效授权中的未提交 RunIntent');
    }
    return { grant, task, team, attempt, session, teamApproval };
}
export function assertRunGrantEntry(store, pid, g, intent) {
    const e = g.entries.find(e => e.intentId === intent.id), m = intent.manifest;
    ensure(e && intent.experimentId === e.experimentId && intent.approvalId === e.approvalId && intent.manifestDigest === e.manifestDigest && digest(m) === e.manifestDigest && m.experimentId === e.experimentId && m.experimentRevision === e.experimentRevision && m.snapshotDigest === e.sourceDigest && m.contractDigest === e.contractDigest && digest(m.contract) === e.contractDigest && digest(m.sourceFiles) === e.sourceDigest, 'RUN_GRANT_INTENT_CHANGED', '清单不在批准集合或原清单、源码、契约、批准身份已改变');
    const approval = store.get('approval', e.approvalId, pid);
    ensure(approval.subjectKind === 'run-intent' && approval.subjectId === intent.id && approval.scope === 'run.submit' && approval.digest === e.manifestDigest && !approval.workingGrant, 'APPROVAL_STALE', '冻结清单的精确批准不符');
    verifySnapshot(store.paths.physical(m.snapshotPath), m.sourceFiles);
    assertExperimentSourceCurrent(store, store.get('experiment', intent.experimentId, pid));
    return approval;
}
export function assertRunGrantIntent(store, intent, admission = false) {
    const a = store.get('approval', intent.approvalId, intent.projectId);
    if (!intent.runGrant) {
        ensure(!a.runGrant && !store.list('run-grant-use', intent.projectId).some(u => u.intentId === intent.id), 'RUN_GRANT_STALE', '清单丢失运行授权依据');
        return;
    }
    const g = assertRunGrantReference(store, intent.projectId, intent.runGrant, admission), approval = assertRunGrantEntry(store, intent.projectId, g, intent);
    ensure(approval.status === 'approved' && digest(approval.runGrant) === digest(intent.runGrant), 'APPROVAL_STALE', '清单的派生批准与原运行授权不一致');
    return g;
}
/** Read-only; callers use admission=true only before actual persisted start. */
export function assertRunGrantRun(store, run, admission = false) {
    const intent = store.get('run-intent', run.intentId, run.projectId);
    ensure(digest(run.runGrant) === digest(intent.runGrant), 'RUN_GRANT_STALE', 'Run与清单的原授权不一致');
    const g = assertRunGrantIntent(store, intent, admission);
    if (!g)
        return;
    ensure(intent.runId === run.id && intent.status === 'submitted' && run.experimentId === intent.experimentId && run.manifestDigest === intent.manifestDigest && digest(run.manifest) === run.manifestDigest, 'RUN_GRANT_INTENT_CHANGED', 'Run不属于已授权的固定清单');
    const id = digest({ grantId: g.id, intentId: intent.id }), u = store.get('run-grant-use', id, run.projectId);
    ensure(u.grantId === g.id && u.grantDigest === g.digest && u.grantApprovalId === g.approvalId && u.intentId === intent.id && u.manifestDigest === run.manifestDigest && u.approvalId === intent.approvalId && u.runId === run.id, 'RUN_GRANT_USE_MISMATCH', 'Run与永久提交计次不匹配');
    if (g.taskBinding) {
        const a = store.get('task-attempt', u.attemptId, run.projectId);
        ensure(u.taskId === g.taskBinding.taskId && u.teamId === g.taskBinding.teamId && !!u.sessionId && u.generation === a.generation && a.taskId === u.taskId && a.teamId === u.teamId && a.sessionId === u.sessionId && a.runGrant?.id === g.id && a.runGrant.digest === g.digest && a.runGrant.approvalId === g.approvalId, 'RUN_GRANT_USE_MISMATCH', 'Task RunGrant 的提交尝试记录不匹配');
    }
}
export function assertRunGrantActor(store, actor, intent) {
    const s = actor.type === 'agent' && actor.sessionId ? store.get('session', actor.sessionId, intent.projectId) : undefined;
    if (actor.type === 'agent' && (actor.role === 'analyst' || actor.taskId || s?.taskId)) {
        ensure(actor.role === 'analyst' && actor.taskId && s?.taskId === actor.taskId, 'RUN_GRANT_SCOPE_DENIED', '需要完整的 analyst Task 会话身份', 403);
        ensure(intent.runGrant, 'RUN_GRANT_SCOPE_DENIED', 'Task 只能提交其固定 RunGrant 中的 RunIntent', 403);
        const g = store.get('run-grant', intent.runGrant.id, intent.projectId);
        ensure(g.taskBinding, 'RUN_GRANT_SCOPE_DENIED', 'Task 只能提交 Task 级 RunGrant 的 RunIntent', 403);
        assertRunGrantTaskSubmission(store, actor, intent, !intent.runId);
        return;
    }
    if (intent.runGrant) {
        const g = store.get('run-grant', intent.runGrant.id, intent.projectId);
        if (g.taskBinding) {
            ensure(actor.type === 'user' && !!intent.runId, 'RUN_GRANT_SCOPE_DENIED', 'Task RunGrant 只能由当前 analyst Task 新建 Run', 403);
            const run = store.get('run', intent.runId, intent.projectId);
            ensure(run.intentId === intent.id && run.manifestDigest === intent.manifestDigest && digest(run.runGrant) === digest(intent.runGrant), 'RUN_GRANT_STALE', '已有 Task Run 回执与固定 RunIntent 不符');
            return;
        }
    }
    if (actor.type !== 'agent')
        return;
    if (!s?.runGrantId && !intent.runGrant)
        return;
    ensure(s && actor.role === 'coordinator' && s.role === 'coordinator' && !s.taskId && !actor.taskId && !actor.wakeupId && s.runGrantId === intent.runGrant?.id, 'RUN_GRANT_SCOPE_DENIED', '指定会话只能使用其运行授权集合', 403);
    const g = store.get('run-grant', intent.runGrant.id, intent.projectId);
    ensure(g.sessionId === s.id, 'RUN_GRANT_SCOPE_DENIED', '运行授权属于其他会话', 403);
    ensure(s.state === 'running' && s.generation === actor.generation && s.leaseUntil > Date.now(), 'LEASE_EXPIRED', '提交会话租约已失效');
}
export function assertRunGrantArtifact(store, pid, artifact) { if (!artifact.runId)
    return; const run = store.get('run', artifact.runId, pid); ensure(artifact.projectId === pid && run.artifactIds.includes(artifact.id), 'RUN_GRANT_ARTIFACT_CHANGED', '产物不属于固定运行来源'); assertRunGrantRun(store, run, false); }
/** Caller holds the Run creation transaction. Submission is permanently counted. */
export function consumeRunGrant(store, intent, runId, actor) {
    const g = assertRunGrantIntent(store, intent, true);
    if (!g)
        return;
    const id = digest({ grantId: g.id, intentId: intent.id });
    ensure(!store.maybe('run-grant-use', id), 'RUN_GRANT_USE_MISMATCH', '清单已计次但Run回执缺失，不能重复提交');
    ensure(store.list('run-grant-use', intent.projectId).filter(u => u.grantId === g.id).length < g.maxRuns, 'RUN_GRANT_EXHAUSTED', '冻结运行授权提交次数已用完；失败、取消和未知状态不退次数');
    const task = g.taskBinding ? store.get('task', g.taskBinding.taskId, intent.projectId) : undefined, attempt = g.taskBinding ? store.get('task-attempt', actor.attemptId, intent.projectId) : undefined;
    if (g.taskBinding)
        ensure(actor.type === 'agent' && actor.taskId === task.id && actor.attemptId === attempt.id && attempt.taskId === task.id && attempt.teamId === g.taskBinding.teamId && attempt.sessionId === actor.sessionId && attempt.generation === actor.generation && attempt.runGrant?.id === g.id && attempt.runGrant.digest === g.digest && attempt.runGrant.approvalId === g.approvalId, 'RUN_GRANT_SCOPE_DENIED', '当前任务尝试不能计入此运行授权', 403);
    const use = store.create('run-grant-use', intent.projectId, { grantId: g.id, grantDigest: g.digest, grantApprovalId: g.approvalId, intentId: intent.id, manifestDigest: intent.manifestDigest, approvalId: intent.approvalId, runId, ...(g.taskBinding && attempt ? { taskId: g.taskBinding.taskId, teamId: g.taskBinding.teamId, sessionId: attempt.sessionId, attemptId: attempt.id, generation: attempt.generation } : {}) }, id);
    store.event(intent.projectId, 'run-grant.used', { grantId: g.id, intentId: intent.id, runId, useId: use.id });
    return use;
}
//# sourceMappingURL=run-grant-validation.js.map