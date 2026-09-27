import type { ModelConfig } from '../domain/types.js';

export interface CampaignLimits {
    maxRounds: number;
    maxCandidatesPerRound: number;
    maxUnansweredRunsPerNode: number;
    maxConsecutiveRegressions: number;
    maxAnalysisAttempts: number;
    deadline?: string;
}
export interface Campaign {
    goal: string;
    rootSessionId: string;
    rootModel: ModelConfig;
    baselineExperimentId: string;
    focusExperimentId: string;
    contractDigest: string;
    primaryMetric: string;
    direction: 'min' | 'max';
    state: 'draft' | 'active' | 'paused' | 'stopped';
    currentRoundId: string;
    roundNumber: number;
    limits: CampaignLimits;
    autoAnalyze: boolean;
    approvalId: string;
    planDigest: string;
    consecutiveRegressions: number;
    stopReason?: string;
}
export interface ResearchRound {
    campaignId: string;
    number: number;
    parentExperimentId: string;
    state: 'open' | 'closed';
    decisionId?: string;
}
export interface CampaignMember {
    campaignId: string;
    roundId: string;
    experimentId: string;
    intentId: string;
    required: boolean;
    repairDecisionId?: string;
}
/** A terminal result observation, not a scientific assertion. */
export interface RunObservation {
    campaignId: string;
    roundId: string;
    memberId: string;
    runId: string;
    experimentId: string;
    manifestDigest: string;
    contentDigest: string;
    executionState: string;
    integrity: string;
    metrics: Record<string, number>;
    evidenceIds: string[];
    validation: 'verified' | 'incomplete' | 'invalid';
    explanation: string;
    status: 'pending' | 'decided';
    decisionId?: string;
}
export interface CandidateSpec {
    title: string;
    hypothesis: string;
    config: Record<string, unknown>;
}
export interface CampaignDecision {
    campaignId: string;
    roundId: string;
    action: 'repair' | 'refill' | 'promote' | 'stop';
    reason: string;
    observationIds: string[];
    selectedRunId?: string;
    candidates: CandidateSpec[];
    inputDigest: string;
    approvalId: string;
    decisionDigest: string;
    status: 'proposed' | 'applied';
    appliedAt?: string;
    effects?: {
        experimentIds: string[];
        intentIds: string[];
        roundId: string;
        stopped: boolean;
    };
}
