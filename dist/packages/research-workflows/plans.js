import { SYSTEM } from '../domain/types.js';
import { ensure, asError } from '../domain/errors.js';
import { integer, object, strings, text } from '../contracts/validation.js';
import { scope, userOnly } from '../policy/permissions.js';
import { assertExperimentSourceCurrent } from '../policy/lifecycle.js';
import { assertAcceptanceCurrent, captureAcceptance } from '../evidence/acceptance.js';
import { digest } from '../storage/store.js';
import { captureSourceRevision, sourceMetadata, validateSourceRevision } from '../workspace/source-access.js';
import { verifySnapshot } from '../workspace/files.js';
import { runContentDigest, inspectObservation } from './observations.js';
/** Plans fix research intent. Tests, integration and formal compute retain their existing approvals. */
export class ResearchPlanService {
    app;
    checkingPlans = new Set();
    constructor(app) {
        this.app = app;
    }
    taskDataBinding(pid, taskId) {
        const acceptance = captureAcceptance(this.app.store, pid, taskId), teamIds = new Set(acceptance.taskIds.map(id => this.app.store.get('task', id, pid).teamId));
        return { sourceAcceptanceId: acceptance.id, taskApprovals: [...teamIds].map(teamId => { const t = this.app.store.get('team', teamId, pid); return { teamId, approvalId: t.approvalId, planDigest: t.planDigest }; }) };
    }
    assertRunSource(experimentId, stage, intentId) {
        let e = this.app.store.get('experiment', experimentId);
        const seen = new Set();
        for (;;) {
            ensure(!seen.has(e.id), 'EXPERIMENT_CYCLE', '实验来源循环');
            seen.add(e.id);
            const candidate = this.app.store.list('research-candidate', e.projectId).find(c => c.experimentId === e.id);
            if (candidate) {
                this.assertCandidate(candidate);
                if (e.id === experimentId) {
                    ensure(stage !== 'prepare' && candidate.intentId === intentId, 'PLAN_RUN_BOUND', '方案候选已固定运行清单；新尝试需要新方案');
                    if (stage === 'submit')
                        this.app.campaigns.assertActive(this.app.campaigns.get(SYSTEM, candidate.campaignId));
                }
            }
            if (!e.parentId)
                break;
            e = this.app.store.get('experiment', e.parentId, e.projectId);
        }
    }
    runBinding(pid, intentId) { const i = this.app.store.get('run-intent', intentId, pid); return { intentId: i.id, approvalId: i.approvalId, manifestDigest: i.manifestDigest, sourceDigest: i.manifest.snapshotDigest }; }
    assertRunBinding(pid, b, runId) {
        const i = this.app.store.get('run-intent', b.intentId, pid);
        ensure(i.approvalId === b.approvalId && i.manifestDigest === b.manifestDigest && i.manifest.snapshotDigest === b.sourceDigest && digest(i.manifest) === b.manifestDigest, 'PLAN_RUN_STALE', '固定运行清单或原批准身份改变');
        const grant = this.app.store.get('approval', b.approvalId, pid);
        ensure(grant.subjectKind === 'run-intent' && grant.subjectId === i.id && grant.digest === b.manifestDigest && grant.scope === 'run.submit' && !['stale', 'rejected'].includes(grant.status), 'APPROVAL_STALE', '固定运行审批失效');
        if (runId) {
            const r = this.app.store.get('run', runId, pid);
            ensure(i.status === 'submitted' && i.runId === r.id && r.intentId === i.id && r.manifestDigest === b.manifestDigest, 'PLAN_RUN_STALE', '固定Run与批准清单不一致');
            this.app.approvals.assert(b.approvalId, pid, i.id, b.manifestDigest, 'run.submit');
        }
        verifySnapshot(i.manifest.snapshotPath, i.manifest.sourceFiles);
    }
    sourceForRun(pid, run) {
        const id = run.manifest.sourceRevisionId ?? digest({ projectId: pid, experimentId: run.experimentId, revision: run.manifest.experimentRevision });
        const source = validateSourceRevision(this.app.context, pid, id);
        ensure(source.experimentId === run.experimentId && source.revision === run.manifest.experimentRevision && source.sourceDigest === run.manifest.snapshotDigest, 'PLAN_SOURCE_MISMATCH', '运行来源与固定源码版本不一致');
        return source;
    }
    create(actor, c, decisionId, decisionApprovalId, proposal, value, inputDigest) {
        const x = object(value), keys = ['hypothesis', 'controlRunIds', 'changedFactors', 'dataSplit', 'dataArtifactIds', 'primaryMetric', 'guardrailMetrics', 'repetitions', 'successCriteria', 'inconclusiveCriteria', 'stoppingCriteria', 'previousRevisionId'];
        ensure(Object.keys(x).every(k => keys.includes(k)), 'INVALID_INPUT', '研究方案包含未知字段', 400);
        const pid = c.projectId, focus = this.app.store.get('experiment', c.focusExperimentId, pid);
        const selected = proposal.action === 'promote' ? this.app.store.get('run', proposal.selectedRunId, pid) : proposal.action === 'repair' ? this.app.store.get('run', this.app.store.get('run-observation', proposal.observationIds[0], pid).runId, pid) : undefined;
        const round = this.app.store.get('research-round', c.currentRoundId, pid);
        const source = selected ? this.sourceForRun(pid, selected) : round.parentSource ? validateSourceRevision(this.app.context, pid, round.parentSource.snapshotId) : captureSourceRevision(this.app.context, focus);
        ensure(source.experimentId === (selected?.experimentId ?? c.focusExperimentId) && focus.contractDigest === c.contractDigest, 'PLAN_SOURCE_MISMATCH', '轮次父来源或固定契约不一致');
        if (!selected && round.parentSource)
            ensure(digest(sourceMetadata(source)) === digest(round.parentSource), 'PLAN_SOURCE_MISMATCH', '轮次父版本绑定被改变');
        if (!selected && !round.parentSource)
            this.app.store.update('research-round', round.id, round.version, { parentSource: sourceMetadata(source) });
        const primaryMetric = text(x.primaryMetric, 'primaryMetric', 100), guardrailMetrics = strings(x.guardrailMetrics ?? [], 'guardrailMetrics', 30);
        ensure(primaryMetric === c.primaryMetric && [primaryMetric, ...guardrailMetrics].every(k => Object.hasOwn(focus.contract.metrics, k)), 'INVALID_METRIC', '方案指标必须匹配活动及固定契约');
        ensure(new Set(guardrailMetrics).size === guardrailMetrics.length && !guardrailMetrics.includes(primaryMetric), 'INVALID_METRIC', '保护指标不能重复或等于主指标');
        const controlRunIds = strings(x.controlRunIds, 'controlRunIds', 24), dataArtifactIds = strings(x.dataArtifactIds ?? [], 'dataArtifactIds', 24), changedFactors = strings(x.changedFactors, 'changedFactors', 24);
        if (actor.type === 'agent' && actor.wakeupId) {
            const allowed = this.app.campaigns.observations(SYSTEM, c.id).map(o => this.app.store.get('run', o.runId, pid));
            ensure(controlRunIds.every(id => allowed.some(r => r.id === id)) && dataArtifactIds.every(id => allowed.some(r => r.artifactIds.includes(id))), 'PLAN_DATA_SCOPE_DENIED', '自动分析只能引用当前活动已有观测的运行与产物', 403);
        }
        ensure(controlRunIds.length > 0 && changedFactors.length > 0 && new Set(controlRunIds).size === controlRunIds.length && new Set(dataArtifactIds).size === dataArtifactIds.length, 'INVALID_INPUT', '需要明确且不重复的对照、数据和变化因素', 400);
        const controlBindings = controlRunIds.map(runId => { const r = this.app.store.get('run', runId, pid); ensure(r.manifest.contractDigest === c.contractDigest && inspectObservation(r, this.app.evidence).validation === 'verified', 'PLAN_CONTROL_INVALID', '对照必须是相同契约的真实完整结果'); assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', r.experimentId, pid)); const binding = this.runBinding(pid, r.intentId); this.assertRunBinding(pid, binding, r.id); this.assertRunSource(r.experimentId, 'execute', r.intentId); return { runId, contentDigest: runContentDigest(r), ...binding }; });
        const dataBindings = dataArtifactIds.map(artifactId => { const { artifact } = this.app.evidence.read(actor, artifactId); ensure(artifact.projectId === pid, 'SCOPE_DENIED', '数据属于其他项目', 403); if (artifact.taskId)
            ensure(this.app.store.get('task', artifact.taskId, pid).result?.artifactIds.includes(artifactId), 'PLAN_DATA_STALE', '数据不是来源任务明确交付的产物'); const run = artifact.runId ? this.app.store.get('run', artifact.runId, pid) : undefined; if (run)
            ensure(run.artifactIds.includes(artifact.id), 'PLAN_DATA_STALE', '数据不在来源Run产物中'); const documents = this.app.store.list('document-version', pid).filter(d => d.original.artifactId === artifactId || d.derivedText?.artifactId === artifactId).map(d => ({ id: d.id, digest: digest(this.app.documents.inspect({ type: 'user' }, pid, d.id)) })), parses = this.app.store.list('document-parse-job', pid).filter(j => j.artifactIds.includes(artifactId)).map(j => { this.app.documentParsing.assertCurrent(j); return { jobId: j.id, manifestDigest: j.manifestDigest, approvalId: j.approvalId }; }); return { artifactId, digest: artifact.digest, size: artifact.size, ...(artifact.taskId ? this.taskDataBinding(pid, artifact.taskId) : {}), ...(run ? { run: { runId: run.id, contentDigest: runContentDigest(run), ...this.runBinding(pid, run.intentId) } } : {}), ...(documents.length ? { documents } : {}), ...(parses.length ? { parses } : {}) }; });
        const reps = object(x.repetitions);
        ensure(Object.keys(reps).every(k => ['count', 'rationale'].includes(k)), 'INVALID_INPUT', '重复依据字段无效', 400);
        const previousRevisionId = x.previousRevisionId === undefined ? undefined : text(x.previousRevisionId, 'previousRevisionId', 100);
        if (previousRevisionId) {
            const previous = this.app.store.get('experiment-plan-revision', previousRevisionId, pid);
            ensure(previous.campaignId === c.id, 'PLAN_SCOPE_DENIED', '方案修订必须属于同一活动');
        }
        const inputRuns = this.app.campaigns.members(SYSTEM, c.id).filter(m => m.roundId === c.currentRoundId).map(m => { const i = this.app.store.get('run-intent', m.intentId, pid), r = i.runId ? this.app.store.get('run', i.runId, pid) : undefined; return { ...this.runBinding(pid, i.id), terminal: !!r && ['succeeded', 'failed', 'cancelled'].includes(r.state), ...(r ? { runId: r.id, contentDigest: runContentDigest(r), ...(r.answerReviewId ? { answerReviewId: r.answerReviewId } : {}) } : {}) }; });
        const data = { campaignId: c.id, roundId: c.currentRoundId, decisionId, decisionApprovalId, campaignApprovalId: c.approvalId, campaignPlanDigest: c.planDigest, parentSource: sourceMetadata(source), contractDigest: c.contractDigest, hypothesis: text(x.hypothesis, 'hypothesis', 10000), controlRunIds, changedFactors, dataSplit: text(x.dataSplit, 'dataSplit', 4000), dataArtifactIds, primaryMetric, guardrailMetrics, repetitions: { count: integer(reps.count, 'count', 1, 24), rationale: text(reps.rationale, 'rationale', 4000) }, successCriteria: text(x.successCriteria, 'successCriteria', 4000), inconclusiveCriteria: text(x.inconclusiveCriteria, 'inconclusiveCriteria', 4000), stoppingCriteria: text(x.stoppingCriteria, 'stoppingCriteria', 4000), ...(previousRevisionId ? { previousRevisionId } : {}), controlBindings, dataBindings, inputRuns, observationIds: [...proposal.observationIds], inputDigest };
        return this.app.store.create('experiment-plan-revision', pid, { ...data, digest: digest(data) });
    }
    assertPlanDigest(p) {
        const { id, kind, projectId, version, createdAt, updatedAt, digest: hash, ...payload } = p;
        ensure(digest(payload) === hash, 'PLAN_CORRUPTED', '固定方案摘要不一致');
    }
    assertPlan(p) {
        ensure(!this.checkingPlans.has(p.id), 'PLAN_SOURCE_CYCLE', '研究方案来源出现循环');
        this.checkingPlans.add(p.id);
        try {
            this.checkPlan(p);
        }
        finally {
            this.checkingPlans.delete(p.id);
        }
    }
    checkPlan(p) {
        this.assertPlanDigest(p);
        const { id, projectId, digest: hash } = p;
        const campaign = this.app.campaigns.get(SYSTEM, p.campaignId);
        ensure(campaign.projectId === projectId && campaign.approvalId === p.campaignApprovalId && campaign.planDigest === p.campaignPlanDigest, 'PLAN_APPROVAL_STALE', '活动的原批准身份改变');
        const campaignApproval = this.app.approvals.assert(p.campaignApprovalId, projectId, campaign.id, p.campaignPlanDigest, 'campaign.activate');
        ensure(campaignApproval.subjectKind === 'campaign', 'APPROVAL_STALE', '活动审批类型不符');
        const source = validateSourceRevision(this.app.context, projectId, p.parentSource.snapshotId);
        ensure(digest(sourceMetadata(source)) === digest(p.parentSource), 'PLAN_SOURCE_MISMATCH', '父源码绑定不一致');
        const parent = this.app.store.get('experiment', source.experimentId, projectId);
        ensure(parent.contractDigest === p.contractDigest, 'CONTRACT_CHANGED', '方案契约改变');
        const parentCandidate = this.app.store.list('research-candidate', projectId).find(c => c.experimentId === parent.id);
        this.assertRunSource(parent.id, 'execute', parentCandidate?.intentId);
        for (const b of p.controlBindings) {
            this.assertRunBinding(projectId, b, b.runId);
            const r = this.app.store.get('run', b.runId, projectId);
            this.assertRunSource(r.experimentId, 'execute', r.intentId);
            ensure(runContentDigest(r) === b.contentDigest && r.manifestDigest === b.manifestDigest && inspectObservation(r, this.app.evidence).validation === 'verified', 'PLAN_CONTROL_STALE', '对照证据已改变');
            assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', r.experimentId, projectId));
        }
        for (const b of p.dataBindings) {
            const { artifact } = this.app.evidence.read(SYSTEM, b.artifactId);
            ensure(artifact.projectId === projectId && artifact.digest === b.digest && artifact.size === b.size, 'PLAN_DATA_STALE', '数据证据已变化');
            if (b.sourceAcceptanceId) {
                const acceptance = assertAcceptanceCurrent(this.app.store, projectId, b.sourceAcceptanceId);
                ensure(artifact.taskId === acceptance.taskId && this.app.store.get('task', acceptance.taskId, projectId).result?.artifactIds.includes(artifact.id), 'PLAN_DATA_STALE', '数据来源任务或交付清单改变');
            }
            for (const source of b.taskApprovals ?? []) {
                const team = this.app.store.get('team', source.teamId, projectId);
                ensure(team.approvalId === source.approvalId && team.planDigest === source.planDigest, 'PLAN_DATA_STALE', '数据任务的原批准身份改变');
                const grant = this.app.approvals.assert(source.approvalId, projectId, team.id, source.planDigest, 'collaboration');
                ensure(grant.subjectKind === 'team', 'APPROVAL_STALE', '数据任务批准类型改变');
            }
            if (b.run) {
                this.assertRunBinding(projectId, b.run, b.run.runId);
                const run = this.app.store.get('run', b.run.runId, projectId);
                this.assertRunSource(run.experimentId, 'execute', run.intentId);
                ensure(runContentDigest(run) === b.run.contentDigest && run.artifactIds.includes(b.artifactId) && inspectObservation(run, this.app.evidence).validation !== 'invalid', 'PLAN_DATA_STALE', '数据来源Run改变');
                assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', run.experimentId, projectId));
            }
            for (const doc of b.documents ?? [])
                ensure(digest(this.app.documents.inspect({ type: 'user' }, projectId, doc.id)) === doc.digest, 'PLAN_DATA_STALE', '数据来源文档改变');
            for (const parse of b.parses ?? []) {
                const job = this.app.store.get('document-parse-job', parse.jobId, projectId);
                ensure(job.approvalId === parse.approvalId && job.manifestDigest === parse.manifestDigest && job.artifactIds.includes(b.artifactId), 'PLAN_DATA_STALE', '数据来源解析批准身份改变');
                const grant = this.app.store.get('approval', parse.approvalId, projectId);
                ensure(grant.subjectKind === 'document-parse-job', 'APPROVAL_STALE', '数据解析批准类型改变');
                this.app.documentParsing.assertCurrent(job);
            }
        }
        const d = this.app.store.get('campaign-decision', p.decisionId, projectId);
        for (const b of p.inputRuns) {
            const i = this.app.store.get('run-intent', b.intentId, projectId), r = i.runId ? this.app.store.get('run', i.runId, projectId) : undefined;
            this.assertRunBinding(projectId, b, i.runId);
            if (d.status === 'proposed' || b.terminal)
                ensure(i.runId === b.runId && (!r || runContentDigest(r) === b.contentDigest && r.answerReviewId === b.answerReviewId), 'PLAN_INPUT_STALE', '方案输入出现晚到结果或语义审查变化');
            if (r) {
                assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', r.experimentId, projectId));
                this.assertRunSource(r.experimentId, 'execute', r.intentId);
            }
        }
        ensure(d.planRevisionId === id && d.planDigest === hash && d.approvalId === p.decisionApprovalId, 'PLAN_CORRUPTED', '决定未绑定该方案或原批准');
        const decisionGrant = this.app.store.get('approval', p.decisionApprovalId, projectId);
        ensure(decisionGrant.subjectKind === 'campaign-decision' && decisionGrant.subjectId === d.id && decisionGrant.scope === 'campaign.decision' && decisionGrant.digest === d.decisionDigest && !['stale', 'rejected'].includes(decisionGrant.status), 'APPROVAL_STALE', '方案决定审批失效');
        const body = { campaignId: d.campaignId, roundId: d.roundId, action: d.action, reason: d.reason, observationIds: d.observationIds, ...(d.selectedRunId ? { selectedRunId: d.selectedRunId } : {}), candidates: d.candidates, inputDigest: d.inputDigest, planRevisionId: d.planRevisionId, planDigest: d.planDigest };
        ensure(digest(body) === d.decisionDigest, 'PLAN_CORRUPTED', '方案的决定内容已变化');
        if (d.status === 'proposed')
            ensure(this.app.decisions.inputDigest(this.app.campaigns.get(SYSTEM, p.campaignId)) === p.inputDigest, 'PLAN_INPUT_STALE', '待批准方案的活动输入已变化');
        else
            this.app.approvals.assert(d.approvalId, projectId, d.id, d.decisionDigest, 'campaign.decision');
    }
    assertDecision(d) { if (d.planRevisionId) {
        const p = this.app.store.get('experiment-plan-revision', d.planRevisionId, d.projectId);
        this.assertPlan(p);
        return p;
    } }
    candidates(pid, planId) { return this.app.store.list('research-candidate', pid).filter(c => c.planRevisionId === planId); }
    assertCandidate(candidate) {
        const p = this.app.store.get('experiment-plan-revision', candidate.planRevisionId, candidate.projectId);
        this.assertPlan(p);
        ensure(candidate.decisionId === p.decisionId && candidate.campaignId === p.campaignId && digest(candidate.parentSource) === digest(p.parentSource), 'PLAN_CANDIDATE_MISMATCH', '候选与方案来源不一致');
        const d = this.app.store.get('campaign-decision', p.decisionId, p.projectId);
        ensure(d.candidates.some(spec => digest(spec) === digest(candidate.spec)), 'PLAN_CANDIDATE_MISMATCH', '候选规格不在已批准方案中');
        if (candidate.proposalId)
            this.checkProposal(candidate, candidate.proposalId);
        if (candidate.experimentId) {
            assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', candidate.experimentId, candidate.projectId));
            const intent = this.app.store.get('run-intent', candidate.intentId, candidate.projectId);
            ensure(intent.experimentId === candidate.experimentId && intent.approvalId === candidate.runApprovalId && intent.manifest.contractDigest === p.contractDigest && intent.manifestDigest === digest(intent.manifest), 'PLAN_IMPLEMENTATION_MISMATCH', '候选运行清单改变');
            this.assertRunBinding(candidate.projectId, this.runBinding(candidate.projectId, intent.id), intent.runId);
            if (candidate.proposalId)
                ensure(intent.manifest.snapshotDigest === this.app.store.get('change-proposal', candidate.proposalId, candidate.projectId).candidateSnapshot.digest, 'PLAN_IMPLEMENTATION_MISMATCH', '运行源码不是受审候选');
        }
        return p;
    }
    inspect(actor, pid, id) {
        scope(actor, pid);
        const plan = this.app.store.get('experiment-plan-revision', id, pid), candidates = this.candidates(pid, id), reasons = [];
        try {
            this.assertPlan(plan);
            for (const candidate of candidates)
                this.assertCandidate(candidate);
        }
        catch (error) {
            reasons.push(asError(error).code);
        }
        return { plan, candidates, validity: reasons.length ? 'stale' : 'current', reasons };
    }
    /** Called only by user-approved DecisionService.apply inside its transaction. */
    materialize(actor, c, d) {
        const p = this.app.store.get('experiment-plan-revision', d.planRevisionId, c.projectId);
        const ids = [], experimentIds = [], intentIds = [];
        const repair = d.action === 'repair' ? this.app.store.get('run-observation', d.observationIds[0], c.projectId) : undefined;
        const member = repair ? this.app.store.get('campaign-member', repair.memberId, c.projectId) : undefined;
        const root = member ? (member.repairRootMemberId ?? this.app.campaigns.members(SYSTEM, c.id).find(m => m.roundId === member.roundId && m.experimentId === member.experimentId).id) : undefined;
        for (const spec of d.candidates) {
            let candidate = this.app.store.create('research-candidate', c.projectId, { campaignId: c.id, roundId: c.currentRoundId, planRevisionId: p.id, decisionId: d.id, spec, parentSource: p.parentSource, state: 'awaiting_implementation', ...(member ? { repairOfMemberId: member.id, repairRootMemberId: root } : {}) });
            if ((spec.implementation ?? 'config') === 'config') {
                const e = this.app.experiments.createFromRevision(actor, c.projectId, p.parentSource.snapshotId, spec), intent = this.app.runs.prepare(actor, e.id);
                candidate = this.app.store.update('research-candidate', candidate.id, candidate.version, { state: 'prepared', experimentId: e.id, intentId: intent.id, runApprovalId: intent.approvalId });
                this.app.campaigns.addMember(c, intent.id, true, undefined, candidate);
                experimentIds.push(e.id);
                intentIds.push(intent.id);
            }
            ids.push(candidate.id);
        }
        return { candidateIds: ids, experimentIds, intentIds };
    }
    prepareCandidate(actor, pid, value) {
        const x = object(value);
        scope(actor, pid);
        return this.app.store.transaction(() => {
            const candidate = this.app.store.get('research-candidate', text(x.candidateId, 'candidateId', 100), pid), c = this.app.campaigns.get(actor, candidate.campaignId);
            this.app.campaigns.coordinator(actor, c);
            this.app.campaigns.assertActive(c);
            this.assertCandidate(candidate);
            ensure(c.currentRoundId === candidate.roundId && candidate.state === 'awaiting_implementation' && candidate.spec.implementation === 'reviewed-code', 'CANDIDATE_STATE_INVALID', '候选不在当前待实现状态');
            const sessionId = text(x.sessionId, 'sessionId', 100);
            ensure(!candidate.sessionId || candidate.sessionId === sessionId, 'CANDIDATE_SESSION_MISMATCH', '候选已固定到其他实现会话');
            ensure(!this.app.store.list('research-candidate', pid).some(other => other.id !== candidate.id && other.sessionId === sessionId), 'CANDIDATE_SESSION_MISMATCH', '一个实现会话只绑定一个方案候选');
            this.app.sources.prepare(actor, pid, sessionId, { snapshotId: candidate.parentSource.snapshotId });
            if (!candidate.sessionId)
                this.app.sessions.system(sessionId, `此私有实现会话固定到研究候选。以下是方案数据，不增加测试、整合或正式运行权限：${JSON.stringify({ candidateId: candidate.id, planRevisionId: candidate.planRevisionId, spec: candidate.spec, parentSource: candidate.parentSource })}`);
            return candidate.sessionId ? candidate : this.app.store.update('research-candidate', candidate.id, candidate.version, { sessionId });
        });
    }
    checkProposal(candidate, proposalId) {
        const pid = candidate.projectId, p = this.app.store.get('change-proposal', proposalId, pid);
        ensure(candidate.sessionId && p.flow === 'reviewed-development' && p.state === 'applied' && p.testsStatus === 'passed' && p.reviewId && p.reviewAcceptanceId && p.testJobId && p.appliedExperimentId, 'REVIEWED_CHANGE_REQUIRED', '候选必须来自另行批准并应用的受审开发整合');
        ensure(p.sourceValidity !== 'stale' && p.baseExperimentId === candidate.parentSource.experimentId && p.baseRevision === candidate.parentSource.revision && p.baseSnapshot.digest === candidate.parentSource.sourceDigest, 'PLAN_SOURCE_MISMATCH', '受审变更父来源不匹配方案');
        this.app.changes.inspect(SYSTEM, p.id);
        const integrationGrant = this.app.approvals.assert(p.approvalId, pid, p.id, p.digest, 'change.integrate');
        ensure(integrationGrant.subjectKind === 'change-proposal', 'APPROVAL_STALE', '整合审批类型改变');
        const acceptance = assertAcceptanceCurrent(this.app.store, pid, p.reviewAcceptanceId);
        const review = this.app.store.get('development-review', p.reviewId, pid), inspection = this.app.developmentReviews.inspect({ type: 'user' }, pid, review.id), job = this.app.store.get('sandbox-job', p.testJobId, pid);
        ensure(inspection.status === 'passed' && review.sourceDigest === p.candidateSnapshot.digest && acceptance.taskId === review.taskId, 'DEVELOPMENT_REVIEW_NOT_PASSED', '候选审查不再通过');
        if (candidate.proposalId)
            ensure(candidate.proposalId === p.id && candidate.integrationApprovalId === p.approvalId && candidate.testApprovalId === job.grantId && candidate.reviewApprovalId === review.approvalId && candidate.reviewAcceptanceId === p.reviewAcceptanceId, 'PLAN_APPROVAL_STALE', '候选原测试、审查或整合批准身份改变');
        const plan = this.app.store.get('experiment-plan-revision', candidate.planRevisionId, pid);
        ensure(job.manifest.dataArtifacts.length === plan.dataBindings.length && plan.dataBindings.every(b => job.manifest.dataArtifacts.some(a => a.id === b.artifactId && a.digest === b.digest && a.size === b.size)), 'PLAN_DATA_MISMATCH', '开发测试数据必须匹配方案固定数据');
        ensure(review.jobId === job.id && job.manifest.sessionId === candidate.sessionId && job.manifest.sourceRevisionId === candidate.parentSource.snapshotId, 'PLAN_IMPLEMENTATION_MISMATCH', '测试、审查、会话或固定父版本不是同一候选');
        this.app.development.assertResultMatches({ type: 'user' }, pid, job.id, p.candidateSnapshot.digest);
        const e = this.app.store.get('experiment', p.appliedExperimentId, pid), source = validateSourceRevision(this.app.context, pid, digest({ projectId: pid, experimentId: e.id, revision: 1 }));
        ensure(e.changeProposalId === p.id && e.parentId === p.baseExperimentId && e.revision === 1 && source.sourceDigest === p.candidateSnapshot.digest, 'PLAN_IMPLEMENTATION_MISMATCH', '整合子实验源码不再匹配受审候选');
        return { proposal: p, experiment: e };
    }
    attachCandidate(actor, pid, value) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(value);
        return this.app.store.transaction(() => {
            let candidate = this.app.store.get('research-candidate', text(x.candidateId, 'candidateId', 100), pid);
            const c = this.app.campaigns.get(actor, candidate.campaignId);
            const proposalId = text(x.proposalId, 'proposalId', 100);
            this.assertCandidate(candidate);
            if (candidate.state === 'prepared') {
                ensure(candidate.proposalId === proposalId, 'IDEMPOTENCY_CONFLICT', '候选已接入其他整合');
                return candidate;
            }
            this.app.campaigns.assertActive(c);
            ensure(c.currentRoundId === candidate.roundId, 'PLAN_INPUT_STALE', '候选所属轮次已经关闭');
            const { proposal, experiment } = this.checkProposal(candidate, proposalId);
            ensure(!this.app.store.list('research-candidate', pid).some(other => other.id !== candidate.id && other.proposalId === proposalId), 'PLAN_IMPLEMENTATION_MISMATCH', '整合已用于其他候选');
            const intent = this.app.runs.prepare(actor, experiment.id);
            ensure(intent.manifest.snapshotDigest === proposal.candidateSnapshot.digest, 'PLAN_IMPLEMENTATION_MISMATCH', '整合后工作源码已改变，不能接入活动');
            candidate = this.app.store.update('research-candidate', candidate.id, candidate.version, { state: 'prepared', proposalId, experimentId: experiment.id, intentId: intent.id, testJobId: proposal.testJobId, reviewId: proposal.reviewId, reviewAcceptanceId: proposal.reviewAcceptanceId, integrationApprovalId: proposal.approvalId, testApprovalId: this.app.store.get('sandbox-job', proposal.testJobId, pid).grantId, reviewApprovalId: this.app.store.get('development-review', proposal.reviewId, pid).approvalId, runApprovalId: intent.approvalId });
            this.app.campaigns.addMember(c, intent.id, true, candidate.repairOfMemberId ? candidate.decisionId : undefined, candidate);
            this.app.store.update('campaign', c.id, c.version, {});
            this.app.store.event(pid, 'campaign.candidate_attached', { campaignId: c.id, candidateId: candidate.id, intentId: intent.id });
            return candidate;
        });
    }
    comparison(actor, pid, value) {
        scope(actor, pid);
        const x = object(value), c = this.app.campaigns.get(actor, text(x.campaignId, 'campaignId', 100));
        ensure(c.projectId === pid, 'SCOPE_DENIED', '活动属于其他项目', 403);
        const plans = this.app.store.list('experiment-plan-revision', pid).filter(p => p.campaignId === c.id).map(p => this.inspect(actor, pid, p.id));
        const candidates = this.app.store.list('research-candidate', pid).filter(p => p.campaignId === c.id), blockers = [];
        for (const p of plans)
            if (p.validity === 'stale')
                blockers.push(...p.reasons.map(reason => `${p.plan.id}:${reason}`));
        if (this.app.budget.summary(c.id).available === 0 && c.autoAnalyze)
            blockers.push('ANALYSIS_BUDGET_EXHAUSTED');
        if (c.stopReason)
            blockers.push(c.stopReason);
        const results = this.app.campaigns.observations(actor, c.id).map(o => { const member = this.app.store.get('campaign-member', o.memberId, pid), bound = candidates.find(v => v.id === member.candidateId), run = this.app.store.get('run', o.runId, pid); let validation = o.validation; try {
            ensure(runContentDigest(run) === o.contentDigest, 'OBSERVATION_STALE', '运行结果已改变');
            assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', run.experimentId, pid));
            this.assertRunSource(run.experimentId, 'execute', run.intentId);
            const inspected = inspectObservation(run, this.app.evidence);
            ensure(inspected.validation === o.validation && digest(inspected.metrics) === digest(o.metrics) && o.manifestDigest === run.manifestDigest && o.experimentId === run.experimentId && digest(o.evidenceIds) === digest(run.evidenceIds), 'OBSERVATION_STALE', '观测指标或来源与真实运行不一致');
            validation = inspected.validation;
        }
        catch (error) {
            validation = 'invalid';
            blockers.push(`${o.id}:${asError(error).code}`);
        } return { observationId: o.id, runId: o.runId, experimentId: o.experimentId, ...(bound ? { candidateId: bound.id, planRevisionId: bound.planRevisionId } : {}), validation, metrics: validation === 'invalid' ? {} : o.metrics, evidenceIds: o.evidenceIds }; });
        const parent = this.app.store.get('experiment', c.baselineExperimentId, pid);
        for (const p of plans)
            if (p.plan.repetitions.count > 1)
                blockers.push(`${p.plan.id}:REPETITIONS_REQUIRE_VERIFICATION`);
        const controls = [...new Set(plans.flatMap(p => p.plan.controlRunIds))].map(runId => { const r = this.app.store.get('run', runId, pid); let metrics = r.metrics ?? {}; try {
            for (const inspection of plans.filter(p => p.plan.controlRunIds.includes(runId))) {
                this.assertPlanDigest(inspection.plan);
                const binding = inspection.plan.controlBindings.find(b => b.runId === runId);
                ensure(binding && binding.contentDigest === runContentDigest(r), 'PLAN_CONTROL_STALE', '对照内容与固定绑定不一致');
                this.assertRunBinding(pid, binding, runId);
            }
            this.assertRunSource(r.experimentId, 'execute', r.intentId);
            const inspected = inspectObservation(r, this.app.evidence);
            ensure(inspected.validation === 'verified', 'PLAN_CONTROL_STALE', '对照不再是完整核验结果');
            metrics = inspected.metrics;
        }
        catch (error) {
            metrics = {};
            blockers.push(`${runId}:${asError(error).code}`);
        } return { runId, experimentId: r.experimentId, manifestDigest: r.manifestDigest, metrics, evidenceIds: r.evidenceIds }; });
        return { campaignId: c.id, state: c.state, primaryMetric: c.primaryMetric, direction: c.direction, unit: parent.contract.metrics[c.primaryMetric].unit, plans, results, controls, blockers, conclusion: 'requires_review' };
    }
    reportSnapshot(actor, pid, campaignId) {
        const comparison = this.comparison(actor, pid, { campaignId }), decisions = this.app.campaigns.decisions(actor, campaignId);
        comparison.plans.forEach(p => this.assertPlanDigest(p.plan));
        const applied = new Set(decisions.filter(d => d.status === 'applied').map(d => d.planRevisionId)), plans = comparison.plans.filter(p => applied.has(p.plan.id));
        const unappliedPlans = comparison.plans.filter(p => !applied.has(p.plan.id)).map(p => ({ ...p, notice: '不属于执行依据，未额外打包其输入' }));
        ensure(plans.every(p => p.validity === 'current') && comparison.results.every(r => r.validation !== 'invalid'), 'PLAN_INPUT_STALE', '已应用方案或受审来源失效，不能生成新交付');
        const c = this.app.campaigns.get(actor, campaignId);
        const campaign = { id: c.id, version: c.version, goal: c.goal, roundNumber: c.roundNumber, currentRoundId: c.currentRoundId, focusExperimentId: c.focusExperimentId, baselineExperimentId: c.baselineExperimentId, contractDigest: c.contractDigest, limits: c.limits, state: c.state, approvalId: c.approvalId, planDigest: c.planDigest };
        const approvalIds = new Set([c.approvalId, ...decisions.map(d => d.approvalId), ...plans.flatMap(p => [...p.plan.controlBindings.map(b => b.approvalId), ...p.plan.inputRuns.map(b => b.approvalId), ...p.plan.dataBindings.flatMap(b => [...(b.run ? [b.run.approvalId] : []), ...(b.taskApprovals ?? []).map(a => a.approvalId), ...(b.parses ?? []).map(a => a.approvalId)]), ...p.candidates.flatMap(candidate => [candidate.integrationApprovalId, candidate.testApprovalId, candidate.reviewApprovalId, candidate.runApprovalId].filter((id) => !!id))])]);
        const approvals = [...approvalIds].map(id => { const a = this.app.store.get('approval', id, pid); return { id, subjectKind: a.subjectKind, subjectId: a.subjectId, digest: a.digest, scope: a.scope, status: a.status }; });
        const controls = comparison.controls.filter(control => plans.some(p => p.plan.controlRunIds.includes(control.runId))), blockers = comparison.blockers.filter(reason => !unappliedPlans.some(p => reason.startsWith(p.plan.id + ':')));
        const snapshot = { ...comparison, plans, unappliedPlans, controls, blockers, campaign, approvals, decisions };
        return { ...snapshot, digest: digest(snapshot) };
    }
}
//# sourceMappingURL=plans.js.map