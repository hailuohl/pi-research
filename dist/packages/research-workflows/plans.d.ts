import type { ResearchApp } from '../research-app.js';
import type { Actor, Row } from '../domain/types.js';
import type { Campaign, CampaignDecision, ExperimentPlanRevision, ResearchCandidate } from './types.js';
/** Plans fix research intent. Tests, integration and formal compute retain their existing approvals. */
export declare class ResearchPlanService {
    private app;
    private readonly checkingPlans;
    constructor(app: ResearchApp);
    private taskDataBinding;
    assertRunSource(experimentId: string, stage: 'prepare' | 'submit' | 'execute', intentId?: string): void;
    private runBinding;
    private assertRunBinding;
    private sourceForRun;
    create(actor: Actor, c: Row<Campaign>, decisionId: string, decisionApprovalId: string, proposal: Pick<CampaignDecision, 'action' | 'selectedRunId' | 'observationIds'>, value: unknown, inputDigest: string): Row<ExperimentPlanRevision>;
    private assertPlanDigest;
    private assertPlan;
    private checkPlan;
    assertDecision(d: Row<CampaignDecision>): Row<ExperimentPlanRevision> | undefined;
    private candidates;
    private assertCandidate;
    inspect(actor: Actor, pid: string, id: string): {
        plan: Row<ExperimentPlanRevision>;
        candidates: Row<ResearchCandidate>[];
        validity: "stale" | "current";
        reasons: string[];
    };
    /** Called only by user-approved DecisionService.apply inside its transaction. */
    materialize(actor: Actor, c: Row<Campaign>, d: Row<CampaignDecision>): {
        candidateIds: string[];
        experimentIds: string[];
        intentIds: string[];
    };
    prepareCandidate(actor: Actor, pid: string, value: unknown): Row<ResearchCandidate>;
    private checkProposal;
    attachCandidate(actor: Actor, pid: string, value: unknown): Row<ResearchCandidate>;
    comparison(actor: Actor, pid: string, value: unknown): {
        campaignId: string;
        state: "active" | "draft" | "paused" | "stopped";
        primaryMetric: string;
        direction: "min" | "max";
        unit: string;
        plans: {
            plan: Row<ExperimentPlanRevision>;
            candidates: Row<ResearchCandidate>[];
            validity: "stale" | "current";
            reasons: string[];
        }[];
        results: {
            validation: "incomplete" | "invalid" | "verified";
            metrics: Record<string, number>;
            evidenceIds: string[];
            candidateId?: string | undefined;
            planRevisionId?: string | undefined;
            observationId: string;
            runId: string;
            experimentId: string;
        }[];
        controls: {
            runId: string;
            experimentId: string;
            manifestDigest: string;
            metrics: Record<string, number>;
            evidenceIds: string[];
        }[];
        blockers: string[];
        conclusion: "requires_review";
    };
    reportSnapshot(actor: Actor, pid: string, campaignId: string): {
        digest: string;
        plans: {
            plan: Row<ExperimentPlanRevision>;
            candidates: Row<ResearchCandidate>[];
            validity: "stale" | "current";
            reasons: string[];
        }[];
        unappliedPlans: {
            notice: string;
            plan: Row<ExperimentPlanRevision>;
            candidates: Row<ResearchCandidate>[];
            validity: "stale" | "current";
            reasons: string[];
        }[];
        controls: {
            runId: string;
            experimentId: string;
            manifestDigest: string;
            metrics: Record<string, number>;
            evidenceIds: string[];
        }[];
        blockers: string[];
        campaign: {
            id: string;
            version: number;
            goal: string;
            roundNumber: number;
            currentRoundId: string;
            focusExperimentId: string;
            baselineExperimentId: string;
            contractDigest: string;
            limits: import("./types.js").CampaignLimits;
            state: "active" | "draft" | "paused" | "stopped";
            approvalId: string;
            planDigest: string;
        };
        approvals: {
            id: string;
            subjectKind: string;
            subjectId: string;
            digest: string;
            scope: string;
            status: "pending" | "approved" | "rejected" | "stale";
        }[];
        decisions: Row<CampaignDecision>[];
        campaignId: string;
        state: "active" | "draft" | "paused" | "stopped";
        primaryMetric: string;
        direction: "min" | "max";
        unit: string;
        results: {
            validation: "incomplete" | "invalid" | "verified";
            metrics: Record<string, number>;
            evidenceIds: string[];
            candidateId?: string | undefined;
            planRevisionId?: string | undefined;
            observationId: string;
            runId: string;
            experimentId: string;
        }[];
        conclusion: "requires_review";
    };
}
