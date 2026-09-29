import { assertRunGrantRun } from '../policy/run-grant-validation.js';
import { randomUUID } from 'node:crypto';
import { SYSTEM } from '../domain/types.js';
import { bool, integer, object, text } from '../contracts/validation.js';
import { ensure } from '../domain/errors.js';
import { scope, userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';
import { TERMINAL } from '../runners/service.js';
import { inspectObservation, runContentDigest } from './observations.js';
import { assertExperimentSourceCurrent } from '../policy/lifecycle.js';
import { captureSourceRevision, sourceMetadata } from '../workspace/source-access.js';
function parseLimits(value) {
    const x = object(value ?? {});
    const limits = {
        maxRounds: integer(x.maxRounds ?? 4, 'maxRounds', 1, 20),
        maxCandidatesPerRound: integer(x.maxCandidatesPerRound ?? 6, 'maxCandidatesPerRound', 1, 24),
        maxUnansweredRunsPerNode: integer(x.maxUnansweredRunsPerNode ?? 2, 'maxUnansweredRunsPerNode', 1, 5),
        maxConsecutiveRegressions: integer(x.maxConsecutiveRegressions ?? 3, 'maxConsecutiveRegressions', 1, 10),
        maxAnalysisAttempts: integer(x.maxAnalysisAttempts ?? 12, 'maxAnalysisAttempts', 0, 100),
    };
    if (x.deadline !== undefined && x.deadline !== '') {
        const value = text(x.deadline, 'deadline', 80), time = Date.parse(value);
        ensure(Number.isFinite(time) && time > Date.now(), 'INVALID_INPUT', '截止时间必须是有效的未来时间', 400);
        limits.deadline = new Date(time).toISOString();
    }
    return limits;
}
/** Business state only. Never starts a model or a process while holding a transaction. */
export class CampaignService {
    app;
    constructor(app) {
        this.app = app;
    }
    get(actor, id) { const c = this.app.store.get('campaign', id); scope(actor, c.projectId); return c; }
    rounds(actor, id) { const c = this.get(actor, id); return this.app.store.list('research-round', c.projectId).filter(r => r.campaignId === id); }
    members(actor, id) { const c = this.get(actor, id); return this.app.store.list('campaign-member', c.projectId).filter(m => m.campaignId === id); }
    observations(actor, id) { const c = this.get(actor, id); return this.app.store.list('run-observation', c.projectId).filter(o => o.campaignId === id); }
    decisions(actor, id) { const c = this.get(actor, id); return this.app.store.list('campaign-decision', c.projectId).filter(d => d.campaignId === id); }
    coordinator(actor, c) {
        scope(actor, c.projectId);
        ensure(actor.type === 'user' || actor.type === 'agent' && actor.role === 'coordinator' &&
            actor.sessionId === c.rootSessionId && !actor.taskId, 'PERMISSION_DENIED', '只有用户或所属主协调会话可提出研究决定', 403);
    }
    assertActive(c) {
        ensure(c.state === 'active', 'CAMPAIGN_NOT_ACTIVE', '研究活动未启动、已暂停或已停止');
        ensure(!this.app.store.get('project', c.projectId).archived, 'PROJECT_ARCHIVED', '项目已归档');
        ensure(!c.limits.deadline || Date.now() < Date.parse(c.limits.deadline), 'CAMPAIGN_DEADLINE', '研究活动已到截止时间');
    }
    create(actor, projectId, value) {
        userOnly(actor);
        scope(actor, projectId);
        this.app.projects.get(actor, projectId);
        const x = object(value), root = this.app.sessions.get(actor, text(x.rootSessionId, 'rootSessionId', 100));
        ensure(root.projectId === projectId, 'SCOPE_DENIED', '主会话属于其他项目', 403);
        ensure(root.role === 'coordinator' && !root.taskId && root.state !== 'archived', 'INVALID_ROOT_SESSION', '需要可用的主协调会话');
        const baseline = this.app.store.get('experiment', text(x.baselineExperimentId, 'baselineExperimentId', 100), projectId);
        ensure(baseline.lifecycle !== 'archived', 'EXPERIMENT_ARCHIVED', '基线已归档');
        const goal = text(x.goal, 'goal', 8000), limits = parseLimits(x.limits), autoAnalyze = bool(x.autoAnalyze ?? false, 'autoAnalyze');
        const primaryMetric = text(x.primaryMetric ?? Object.keys(baseline.contract.metrics)[0], 'primaryMetric', 100);
        ensure(Object.hasOwn(baseline.contract.metrics, primaryMetric), 'INVALID_METRIC', '主指标不在固定契约中');
        ensure(!autoAnalyze || limits.maxAnalysisAttempts > 0, 'BUDGET_EXCEEDED', '自动分析需要预留分析尝试额度');
        return this.app.store.transaction(() => {
            const id = randomUUID(), roundId = randomUUID();
            const plan = { goal, rootSessionId: root.id, rootModel: root.model, baselineExperimentId: baseline.id,
                contractDigest: baseline.contractDigest, primaryMetric, limits, autoAnalyze };
            const planDigest = digest(plan);
            const approval = this.app.approvals.request(projectId, 'campaign', id, planDigest, 'campaign.activate', `研究活动最多 ${limits.maxRounds} 轮、每轮 ${limits.maxCandidatesPerRound} 个方案；自动分析=${autoAnalyze}，最多 ${limits.maxAnalysisAttempts} 次模型尝试。不批准任何正式计算。`);
            const c = this.app.store.create('campaign', projectId, { ...plan, focusExperimentId: baseline.id,
                direction: baseline.contract.metrics[primaryMetric].direction, state: 'draft', currentRoundId: roundId,
                roundNumber: 1, approvalId: approval.id, planDigest, consecutiveRegressions: 0 }, id);
            this.app.store.create('research-round', projectId, { campaignId: id, number: 1,
                parentExperimentId: baseline.id, parentSource: sourceMetadata(captureSourceRevision(this.app.context, baseline)), state: 'open' }, roundId);
            this.app.budget.configure(projectId, id, limits.maxAnalysisAttempts);
            this.app.store.event(projectId, 'campaign.created', { campaignId: id, approvalId: approval.id });
            return c;
        });
    }
    activate(actor, id, expectedVersion) {
        userOnly(actor);
        return this.app.store.transaction(() => {
            const c = this.get(actor, id);
            ensure(c.state === 'draft', 'CAMPAIGN_STATE_INVALID', '只能启动待批准的研究活动');
            this.app.projects.get(actor, c.projectId);
            const root = this.app.store.get('session', c.rootSessionId, c.projectId);
            ensure(root.state !== 'archived', 'SESSION_ARCHIVED', '主会话已归档');
            ensure(digest(root.model) === digest(c.rootModel), 'APPROVAL_STALE', '主会话模型已变化，请重新创建研究计划');
            this.app.approvals.assert(c.approvalId, c.projectId, id, c.planDigest, 'campaign.activate');
            ensure(!c.limits.deadline || Date.now() < Date.parse(c.limits.deadline), 'CAMPAIGN_DEADLINE', '研究活动已过期');
            const next = this.app.store.update('campaign', id, expectedVersion, { state: 'active' });
            this.app.store.event(c.projectId, 'campaign.activated', { campaignId: id });
            return next;
        });
    }
    pause(actor, id, expectedVersion) {
        userOnly(actor);
        return this.app.store.transaction(() => {
            const c = this.get(actor, id);
            this.assertActive(c);
            const next = this.app.store.update('campaign', id, expectedVersion, { state: 'paused' });
            this.app.store.event(c.projectId, 'campaign.paused', { campaignId: id });
            return next;
        });
    }
    resume(actor, id, expectedVersion) {
        userOnly(actor);
        return this.app.store.transaction(() => {
            const c = this.get(actor, id);
            ensure(c.state === 'paused', 'CAMPAIGN_STATE_INVALID', '只能恢复已暂停的活动');
            this.app.projects.get(actor, c.projectId);
            const root = this.app.store.get('session', c.rootSessionId);
            ensure(root.state !== 'archived', 'SESSION_ARCHIVED', '主会话已归档');
            ensure(digest(root.model) === digest(c.rootModel), 'APPROVAL_STALE', '模型配置不再匹配活动授权');
            ensure(!c.limits.deadline || Date.now() < Date.parse(c.limits.deadline), 'CAMPAIGN_DEADLINE', '研究活动已过期');
            const next = this.app.store.update('campaign', id, expectedVersion, { state: 'active' });
            this.app.store.event(c.projectId, 'campaign.resumed', { campaignId: id });
            return next;
        });
    }
    closeRound(c) {
        const r = this.app.store.get('research-round', c.currentRoundId);
        if (r.state !== 'closed')
            this.app.store.update('research-round', r.id, r.version, { state: 'closed' });
    }
    stop(actor, id, value) {
        userOnly(actor);
        const x = object(value);
        return this.app.store.transaction(() => {
            const c = this.get(actor, id);
            if (c.state === 'stopped')
                return c;
            const next = this.app.store.update('campaign', id, integer(x.expectedVersion, 'expectedVersion', 1), { state: 'stopped', stopReason: text(x.reason, 'reason', 4000) });
            this.closeRound(next);
            this.app.store.event(c.projectId, 'campaign.stopped', { campaignId: id, reason: next.stopReason });
            return next;
        });
    }
    /** Internal caller must hold Store.transaction and validate the campaign state/version first. */
    addMember(c, intentId, required, repairDecisionId, candidate) {
        const intent = this.app.store.get('run-intent', intentId, c.projectId);
        const e = this.app.store.get('experiment', intent.experimentId, c.projectId);
        ensure(intent.manifest.contractDigest === c.contractDigest && e.contractDigest === c.contractDigest, 'CONTRACT_CHANGED', '运行契约不同，不能进入同一研究比较');
        ensure(intent.manifest.experimentRevision === e.revision && e.lifecycle !== 'archived', 'APPROVAL_STALE', '该准备清单不再匹配实验');
        const all = this.members(SYSTEM, c.id), same = all.find(m => m.intentId === intentId);
        if (same) {
            ensure(same.required === required && same.repairDecisionId === repairDecisionId, 'IDEMPOTENCY_CONFLICT', '已有方案绑定不能覆盖');
            return same;
        }
        const current = all.filter(m => m.roundId === c.currentRoundId);
        const repairParent = candidate?.repairOfMemberId ? this.app.store.get('campaign-member', candidate.repairOfMemberId, c.projectId) : undefined;
        if (candidate)
            ensure(candidate.campaignId === c.id && candidate.roundId === c.currentRoundId && candidate.intentId === intentId && candidate.experimentId === e.id, 'PLAN_CANDIDATE_MISMATCH', '方案候选与运行清单不一致');
        ensure(e.id === c.focusExperimentId || e.parentId === c.focusExperimentId || repairParent && repairParent.campaignId === c.id && repairParent.roundId === c.currentRoundId && e.parentId === repairParent.experimentId, 'LINEAGE_MISMATCH', '本轮方案必须来自固定父实验或明确修复来源');
        const sameExperiment = current.filter(m => m.experimentId === e.id);
        let legacyRepairRoot;
        if (repairParent) {
            const decision = this.app.store.get('campaign-decision', repairDecisionId, c.projectId);
            ensure(decision.status === 'applied' && decision.action === 'repair' && decision.campaignId === c.id && decision.planRevisionId === candidate.planRevisionId && decision.observationIds.some(id => this.app.store.get('run-observation', id, c.projectId).memberId === repairParent.id), 'REPAIR_APPROVAL_REQUIRED', '修复候选未绑定当前已应用方案');
            ensure(!all.some(m => m.repairDecisionId === decision.id), 'REPAIR_APPROVAL_REQUIRED', '修复方案已使用');
            const root = repairParent.repairRootMemberId ?? current.find(m => m.experimentId === repairParent.experimentId).id, rootMember = this.app.store.get('campaign-member', root, c.projectId);
            ensure(candidate.repairRootMemberId === root && current.filter(m => m.experimentId === rootMember.experimentId || m.repairRootMemberId === root).length < c.limits.maxUnansweredRunsPerNode, 'REPAIR_LIMIT', '修复链已达上限');
        }
        else if (sameExperiment.length) {
            ensure(!!repairDecisionId, 'REPAIR_APPROVAL_REQUIRED', '同节点重复运行需有界 Repair 决定');
            const repair = this.app.store.get('campaign-decision', repairDecisionId, c.projectId);
            ensure(repair.campaignId === c.id && repair.roundId === c.currentRoundId && repair.action === 'repair' && repair.status === 'applied', 'REPAIR_APPROVAL_REQUIRED', '修复授权无效');
            const source = this.app.store.get('run-observation', repair.observationIds[0], c.projectId);
            ensure(source.experimentId === e.id && !all.some(m => m.repairDecisionId === repairDecisionId), 'REPAIR_APPROVAL_REQUIRED', '修复授权属于其他节点或已消耗');
            ensure(sameExperiment.length < c.limits.maxUnansweredRunsPerNode, 'REPAIR_LIMIT', '已达到该节点的无结果尝试上限');
            legacyRepairRoot = sameExperiment[0].repairRootMemberId ?? sameExperiment[0].id;
        }
        else {
            ensure(!repairDecisionId, 'REPAIR_APPROVAL_REQUIRED', '修复授权不能用于新候选');
            const pending = this.app.store.list('research-candidate', c.projectId).filter(p => p.campaignId === c.id && p.roundId === c.currentRoundId && p.state === 'awaiting_implementation' && !p.repairOfMemberId && p.id !== candidate?.id);
            ensure(new Set(current.filter(m => !m.repairOfMemberId).map(m => m.experimentId)).size + pending.length < c.limits.maxCandidatesPerRound, 'CANDIDATE_LIMIT', '已达到本轮候选上限');
        }
        return this.app.store.create('campaign-member', c.projectId, {
            campaignId: c.id, roundId: c.currentRoundId, experimentId: e.id, intentId, required,
            ...(repairDecisionId ? { repairDecisionId } : {}), ...(legacyRepairRoot ? { repairRootMemberId: legacyRepairRoot } : {}), ...(candidate ? { candidateId: candidate.id, ...(candidate.repairOfMemberId ? { repairOfMemberId: candidate.repairOfMemberId, repairRootMemberId: candidate.repairRootMemberId } : {}) } : {})
        });
    }
    enroll(actor, id, value) {
        const x = object(value);
        return this.app.store.transaction(() => {
            const c = this.get(actor, id);
            this.coordinator(actor, c);
            this.assertActive(c);
            ensure(c.version === integer(x.expectedVersion, 'expectedVersion', 1), 'VERSION_CONFLICT', '研究活动已变化，请刷新');
            const intentId = text(x.intentId, 'intentId', 100), before = this.members(SYSTEM, id).length;
            const member = this.addMember(c, intentId, bool(x.required ?? true, 'required'), x.repairDecisionId ? text(x.repairDecisionId, 'repairDecisionId', 100) : undefined);
            if (this.members(SYSTEM, id).length !== before) {
                this.app.store.update('campaign', c.id, c.version, {});
                this.app.store.event(c.projectId, 'campaign.member_added', { campaignId: id, memberId: member.id });
            }
            return member;
        });
    }
    observe() {
        // Full authoritative rescan also covers completion before event publication / application restart.
        for (const previous of this.app.store.list('campaign')) {
            this.app.store.transaction(() => {
                let c = this.get(SYSTEM, previous.id);
                if (c.state === 'active' && c.limits.deadline && Date.now() >= Date.parse(c.limits.deadline)) {
                    c = this.app.store.update('campaign', c.id, c.version, { state: 'stopped', stopReason: '已达到研究截止时间；只收集已有结果' });
                    this.closeRound(c);
                    this.app.store.event(c.projectId, 'campaign.stopped', { campaignId: c.id, reason: c.stopReason });
                }
                for (const m of this.members(SYSTEM, c.id)) {
                    const intent = this.app.store.get('run-intent', m.intentId, c.projectId);
                    if (!intent.runId)
                        continue;
                    const run = this.app.store.get('run', intent.runId, c.projectId);
                    if (!TERMINAL.includes(run.state))
                        continue;
                    const id = digest({ campaignId: c.id, runId: run.id });
                    if (this.app.store.maybe('run-observation', id))
                        continue;
                    const observation = this.app.store.create('run-observation', c.projectId, {
                        campaignId: c.id, roundId: m.roundId, memberId: m.id, runId: run.id, experimentId: run.experimentId,
                        manifestDigest: run.manifestDigest, contentDigest: runContentDigest(run), executionState: run.state,
                        integrity: run.integrity, evidenceIds: [...run.evidenceIds], ...inspectObservation(run, this.app.evidence), status: 'pending'
                    }, id);
                    this.app.store.event(c.projectId, 'campaign.result_observed', { campaignId: c.id, observationId: observation.id, runId: run.id });
                }
            });
        }
    }
    verifyObservation(c, observationId) {
        const o = this.app.store.get('run-observation', observationId, c.projectId);
        ensure(o.campaignId === c.id && o.roundId === c.currentRoundId, 'OBSERVATION_SCOPE_DENIED', '证据不属于活动当前轮次', 403);
        const run = this.app.store.get('run', o.runId, c.projectId);
        assertRunGrantRun(this.app.store, run);
        assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', run.experimentId, c.projectId));
        this.app.researchPlans.assertRunSource(run.experimentId, 'execute', run.intentId);
        ensure(runContentDigest(run) === o.contentDigest && run.manifestDigest === o.manifestDigest, 'OBSERVATION_STALE', '观测记录与真实运行不一致');
        const inspected = inspectObservation(run, this.app.evidence);
        ensure(inspected.validation === o.validation && digest(inspected.metrics) === digest(o.metrics), 'EVIDENCE_INVALID', '观测证据已经失效');
        return o;
    }
}
//# sourceMappingURL=campaign-service.js.map