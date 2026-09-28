import {answerDisposition} from '../runners/outcome.js';
import { randomUUID } from 'node:crypto';
import type { ResearchApp } from '../research-app.js';
import type { Actor, Experiment, Row, Run, RunIntent } from '../domain/types.js';
import { SYSTEM } from '../domain/types.js';
import { ensure } from '../domain/errors.js';
import { integer, object, oneOf, strings, text } from '../contracts/validation.js';
import { userOnly } from '../policy/permissions.js';
import { digest, now } from '../storage/store.js';
import { TERMINAL } from '../runners/service.js';
import { runContentDigest } from './observations.js';
import type { Campaign, CandidateSpec, CampaignDecision, ResearchRound,ResearchCandidate,CampaignMember } from './types.js';

type Proposal = Pick<CampaignDecision, 'action' | 'reason' | 'observationIds' | 'selectedRunId' | 'candidates'>;

function parseProposal(value: Record<string, unknown>): Proposal {
    const action = oneOf(value.action, ['repair', 'refill', 'promote', 'stop'] as const, 'action');
    const observationIds = strings(value.observationIds, 'observationIds', 100);
    ensure(observationIds.length > 0 && new Set(observationIds).size === observationIds.length,
        'OBSERVATION_REQUIRED', '决定必须引用不重复的实际运行观测', 400);
    const raw = value.candidates ?? [];
    ensure(Array.isArray(raw) && raw.length <= 24, 'INVALID_INPUT', 'candidates 最多 24 项', 400);
    const candidates: CandidateSpec[] = raw.map(item => {
        const x = object(item),implementation=x.implementation===undefined?'config':oneOf(x.implementation,['config','reviewed-code'] as const,'implementation');
        const config=implementation==='config'?object(x.config):undefined;
        ensure(implementation!=='reviewed-code'||x.config===undefined,'INVALID_INPUT','受审代码候选不接受另行配置覆盖',400);
        ensure(!config||JSON.stringify(config).length <= 16000, 'INVALID_INPUT', '候选配置过大', 400);
        return { title: text(x.title, 'title', 200), hypothesis: text(x.hypothesis, 'hypothesis', 10000), ...(config?{config}:{}),...(x.implementation!==undefined?{implementation}:{}) };
    });
    const planned=value.experimentPlan!==undefined;
    ensure(action!=='repair'||(planned?candidates.length===1&&candidates[0].implementation==='reviewed-code':candidates.length===0), 'INVALID_INPUT', '新方案 Repair 必须有一个受审代码候选', 400);
    ensure(action!=='stop'||candidates.length===0,'INVALID_INPUT','Stop 不接受候选',400);
    ensure(planned||candidates.every(c=>c.implementation!=='reviewed-code'),'PLAN_REQUIRED','受审候选需要明确研究方案',400);
    ensure(action !== 'refill' || candidates.length > 0, 'INVALID_INPUT', 'Refill 至少需要一个候选', 400);
    const selectedRunId = value.selectedRunId ? text(value.selectedRunId, 'selectedRunId', 100) : undefined;
    ensure(action === 'promote' ? !!selectedRunId : !selectedRunId, 'INVALID_INPUT', '只有 Promote 必须指定 selectedRunId', 400);
    return { action, reason: text(value.reason, 'reason', 8000), observationIds, candidates, ...(selectedRunId ? { selectedRunId } : {}) };
}

export class DecisionService {
    constructor(private app: ResearchApp) {}

    /** Includes membership and true result states; excludes heartbeat and UI/session noise. */
    inputDigest(c: Row<Campaign>): string {
        const members = this.app.campaigns.members(SYSTEM, c.id).filter(m => m.roundId === c.currentRoundId);
        return digest({ campaignVersion: c.version, state: c.state, roundId: c.currentRoundId,
            focus: c.focusExperimentId, contract: c.contractDigest, limits: c.limits,
            rootModel: this.app.store.get('session', c.rootSessionId).model,
            members: members.map(m => {
                const intent = this.app.store.get<RunIntent>('run-intent', m.intentId, c.projectId!);
                const e = this.app.store.get<Experiment>('experiment', m.experimentId, c.projectId!);
                const run = intent.runId ? this.app.store.get<Run>('run', intent.runId, c.projectId!) : null;
                return { id: m.id, required: m.required, revision: e.revision, manifest: intent.manifestDigest,
                    run: run ? runContentDigest(run) : null, answer:run?answerDisposition(run):null, answerReviewId:run?.answerReviewId };
            }), observations: this.app.campaigns.observations(SYSTEM, c.id).filter(o => o.roundId === c.currentRoundId)
                .map(o => ({ id: o.id, digest: o.contentDigest, validation: o.validation, status: o.status })) });
    }

    private validate(c: Row<Campaign>, p: Proposal) {
        this.app.campaigns.assertActive(c);
        const observations = p.observationIds.map(id => this.app.campaigns.verifyObservation(c, id));
        ensure(observations.some(o => o.status === 'pending'), 'RESULT_ALREADY_DECIDED', '这些观测已处理；请读取新增结果或使用用户停止控制');
        const members = this.app.campaigns.members(SYSTEM, c.id).filter(m => m.roundId === c.currentRoundId);
        const uniqueExperiments = new Set(members.filter(m=>!m.repairOfMemberId).map(m => m.experimentId));
        const pending=this.app.store.list<ResearchCandidate>('research-candidate',c.projectId!).filter(candidate=>candidate.campaignId===c.id&&candidate.roundId===c.currentRoundId&&candidate.state==='awaiting_implementation');
        if (p.action === 'repair') {
            ensure(observations.length === 1, 'INVALID_INPUT', '一次 Repair 只针对一个无结果运行', 400);
            const observation = observations[0], run = this.app.store.get<Run>('run', observation.runId);
            const e = this.app.store.get<Experiment>('experiment', run.experimentId);
            // A measured failure may answer a research question. Never call it an infrastructure-only failure.
            ensure(observation.validation === 'incomplete' && e.lifecycle === 'provisional' &&
                (!run.metrics || Object.keys(run.metrics).length === 0), 'RESULT_ALREADY_ANSWERED', '已有测量或无效证据不允许自动按无结果修复；请审核或派生新实验');
            ensure(answerDisposition(run)==='unanswered','RESULT_REVIEW_REQUIRED','须由用户先判断失败是否回答研究问题，不能按退出码机械修复');
            const member=members.find(m=>m.id===observation.memberId)!,root=member.repairRootMemberId??members.find(m=>m.experimentId===member.experimentId)!.id;
            const rootMember=members.find(m=>m.id===root)!;
            ensure(members.filter(m => m.experimentId===rootMember.experimentId||m.repairRootMemberId===root||m.experimentId===e.id).length+pending.filter(p=>p.repairRootMemberId===root).length < c.limits.maxUnansweredRunsPerNode,
                'REPAIR_LIMIT', '该节点已达到无结果运行上限');
            const latest = members.filter(m => m.experimentId === e.id).at(-1)!;
            ensure(latest.id === observation.memberId, 'OBSERVATION_STALE', 'Repair 必须针对该节点的最新尝试');
        }
        if (p.action === 'refill')
            ensure(uniqueExperiments.size + pending.filter(p=>!p.repairOfMemberId).length + p.candidates.length <= c.limits.maxCandidatesPerRound,
                'CANDIDATE_LIMIT', '补充候选将超出本轮上限');
        if (p.action === 'promote') {
            ensure(pending.length===0,'ROUND_INCOMPLETE','本轮仍有待实现候选');
            ensure(c.roundNumber < c.limits.maxRounds, 'ROUND_LIMIT', '已达到研究轮次上限，请停止或建立新的研究活动');
            ensure(p.candidates.length <= c.limits.maxCandidatesPerRound, 'CANDIDATE_LIMIT', '下一轮候选超出上限');
            for (const m of members.filter(m => m.required)) {
                const intent = this.app.store.get<RunIntent>('run-intent', m.intentId);
                const run = intent.runId ? this.app.store.get<Run>('run', intent.runId) : null;
                ensure(run && TERMINAL.includes(run.state), 'ROUND_INCOMPLETE', '本轮必需方案仍未提交、运行中或状态未知');
                ensure(this.app.campaigns.observations(SYSTEM, c.id).some(o => o.memberId === m.id),
                    'ROUND_INCOMPLETE', '必需运行仍未完成结果对账');
            }
            const selected = observations.find(o => o.runId === p.selectedRunId);
            ensure(selected?.validation === 'verified', 'INVALID_PROMOTION', '只能晋级引用列表中已核验的完整结果');
            const exp = this.app.store.get<Experiment>('experiment', selected.experimentId);
            ensure(exp.lifecycle === 'frozen' && exp.contractDigest === c.contractDigest, 'INVALID_PROMOTION', '晋级节点必须已冻结且契约一致');
        }
        return observations;
    }

    propose(actor: Actor, id: string, value: unknown) {
        const x = object(value), proposal = parseProposal(x);
        return this.app.store.transaction(() => {
            const c = this.app.campaigns.get(actor, id); this.app.campaigns.coordinator(actor, c);
            ensure(c.version === integer(x.expectedVersion, 'expectedVersion', 1), 'VERSION_CONFLICT', '研究活动版本已变化');
            this.validate(c, proposal);
            const decisionId = randomUUID(), inputDigest = this.inputDigest(c);
            // Allocate the approval identity inside this transaction so the immutable plan can bind it.
            const approval=this.app.approvals.request(c.projectId!,'campaign-decision',decisionId,'','campaign.decision',`执行 ${proposal.action} 决定；可能创建 ${proposal.candidates.length} 个待批准方案。不批准任何正式计算。`);
            const plan=x.experimentPlan===undefined?undefined:this.app.researchPlans.create(actor,c,decisionId,approval.id,proposal,x.experimentPlan,inputDigest);
            const body = {campaignId: id, roundId: c.currentRoundId, ...proposal, inputDigest,...(plan?{planRevisionId:plan.id,planDigest:plan.digest}:{}) };
            const decisionDigest = digest(body);
            this.app.store.update('approval',approval.id,approval.version,{digest:decisionDigest});
            const decision = this.app.store.create<CampaignDecision>('campaign-decision', c.projectId, {
                ...body, approvalId: approval.id, decisionDigest, status: 'proposed' }, decisionId);
            this.app.researchPlans.assertDecision(decision);
            this.app.store.event(c.projectId, 'campaign.decision_proposed', { campaignId: id, decisionId, action: proposal.action });
            return decision;
        });
    }

    apply(actor: Actor, id: string, expectedVersion: number) {
        userOnly(actor);
        return this.app.store.transaction(() => {
            const d = this.app.store.get<CampaignDecision>('campaign-decision', id);
            let c = this.app.campaigns.get(actor, d.campaignId);
            if (d.status === 'applied') return d; // Replays do not create another branch or preparation.
            ensure(d.version === expectedVersion, 'VERSION_CONFLICT', '决定已更新');
            this.app.campaigns.assertActive(c);
            ensure(this.inputDigest(c) === d.inputDigest && c.currentRoundId === d.roundId, 'APPROVAL_STALE', '决定依据已变化，请基于最新结果重新提出并批准');
            this.app.approvals.assert(d.approvalId, c.projectId!, d.id, d.decisionDigest, 'campaign.decision');
            this.app.researchPlans.assertDecision(d);
            const body = { campaignId: d.campaignId, roundId: d.roundId, action: d.action, reason: d.reason,
                observationIds: d.observationIds, ...(d.selectedRunId ? { selectedRunId: d.selectedRunId } : {}),
                candidates: d.candidates, inputDigest: d.inputDigest,...(d.planRevisionId?{planRevisionId:d.planRevisionId,planDigest:d.planDigest}:{}) };
            ensure(digest(body) === d.decisionDigest, 'APPROVAL_STALE', '批准后决定内容被改动');
            const observations = this.validate(c, d);
            let parentId = c.focusExperimentId, stopReason: string | undefined;
            if (d.action === 'promote') {
                const selected = observations.find(o => o.runId === d.selectedRunId)!;
                const previous = this.app.campaigns.observations(SYSTEM, c.id).filter(o =>
                    o.experimentId === c.focusExperimentId && o.validation === 'verified').at(-1);
                const delta = previous ? selected.metrics[c.primaryMetric] - previous.metrics[c.primaryMetric] : 0;
                const worse = c.direction === 'min' ? delta > 0 : delta < 0;
                const regressions = worse ? c.consecutiveRegressions + 1 : 0;
                if (regressions >= c.limits.maxConsecutiveRegressions) {
                    stopReason = '已达到连续退步上限，停止新增研究任务';
                    c = this.app.store.update<Campaign>('campaign', c.id, c.version, { consecutiveRegressions: regressions });
                } else {
                    const oldRound = this.app.store.get<ResearchRound>('research-round', c.currentRoundId);
                    this.app.store.update<ResearchRound>('research-round', oldRound.id, oldRound.version, { state: 'closed' });
                    parentId = selected.experimentId;
                    const round = this.app.store.create<ResearchRound>('research-round', c.projectId, {
                        campaignId: c.id, number: c.roundNumber + 1, parentExperimentId: parentId, state: 'open', decisionId: id,...(d.planRevisionId?{parentSource:this.app.store.get<import('./types.js').ExperimentPlanRevision>('experiment-plan-revision',d.planRevisionId,c.projectId!).parentSource}:{}) });
                    c = this.app.store.update<Campaign>('campaign', c.id, c.version, { focusExperimentId: parentId,
                        currentRoundId: round.id, roundNumber: round.number, consecutiveRegressions: regressions });
                }
            }
            let experimentIds: string[] = [], intentIds: string[] = [],candidateIds:string[]|undefined;
            if(!stopReason&&d.planRevisionId){const effects=this.app.researchPlans.materialize(actor,c,d);experimentIds=effects.experimentIds;intentIds=effects.intentIds;candidateIds=effects.candidateIds;}
            else if (!stopReason && ['refill', 'promote'].includes(d.action)) {
                for (const spec of d.candidates) {
                    const e = this.app.experiments.create(actor, c.projectId!, { ...spec, parentId });
                    const intent = this.app.runs.prepare(actor, e.id);
                    this.app.campaigns.addMember(c, intent.id, true);
                    experimentIds.push(e.id); intentIds.push(intent.id);
                }
            }
            if (d.action === 'stop') stopReason = d.reason;
            if (stopReason) c = this.app.campaigns.stop(actor, c.id, { expectedVersion: c.version, reason: stopReason });
            else c = this.app.store.update<Campaign>('campaign', c.id, c.version, {});
            for (const observation of observations.filter(o => o.status === 'pending'))
                this.app.store.update('run-observation', observation.id, observation.version, { status: 'decided', decisionId: id });
            const effects = { experimentIds, intentIds, roundId: c.currentRoundId, stopped: c.state === 'stopped',...(candidateIds?{candidateIds}:{}) };
            const applied = this.app.store.update<CampaignDecision>('campaign-decision', id, d.version,
                { status: 'applied', appliedAt: now(), effects });
            this.app.store.event(c.projectId, 'campaign.decision_applied', { campaignId: c.id, decisionId: id, action: d.action, effects });
            return applied;
        });
    }
}
