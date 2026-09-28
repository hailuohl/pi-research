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
    parentSource?: PlanSource;
}
export interface CampaignMember {
    campaignId: string;
    roundId: string;
    experimentId: string;
    intentId: string;
    required: boolean;
    repairDecisionId?: string;
    candidateId?: string;
    repairOfMemberId?: string;
    repairRootMemberId?: string;
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
    config?: Record<string, unknown>;
    implementation?: 'config' | 'reviewed-code';
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
    planRevisionId?: string;
    planDigest?: string;
    appliedAt?: string;
    effects?: {
        experimentIds: string[];
        intentIds: string[];
        roundId: string;
        stopped: boolean;
        candidateIds?: string[];
    };
}

export interface PlanSource { snapshotId:string; experimentId:string; revision:number; sourceDigest:string; }
export interface ExperimentPlanInput {
    hypothesis:string; controlRunIds:string[]; changedFactors:string[]; dataSplit:string; dataArtifactIds:string[];
    primaryMetric:string; guardrailMetrics:string[]; repetitions:{count:number;rationale:string};
    successCriteria:string; inconclusiveCriteria:string; stoppingCriteria:string; previousRevisionId?:string;
}
export interface ExperimentPlanRevision extends ExperimentPlanInput {
    campaignId:string; roundId:string; decisionId:string; parentSource:PlanSource; contractDigest:string;
    campaignApprovalId:string; campaignPlanDigest:string; decisionApprovalId:string;
    controlBindings:Array<PlanRunBinding & {runId:string;contentDigest:string}>;
    dataBindings:Array<{artifactId:string;digest:string;size:number;sourceAcceptanceId?:string;taskApprovals?:Array<{teamId:string;approvalId:string;planDigest:string}>;run?:PlanRunBinding & {runId:string;contentDigest:string};documents?:Array<{id:string;digest:string}>;parses?:Array<{jobId:string;manifestDigest:string;approvalId:string}>}>;
    inputRuns:Array<PlanRunBinding & {runId?:string;contentDigest?:string;answerReviewId?:string;terminal:boolean}>;
    observationIds:string[]; inputDigest:string; digest:string;
}
export interface PlanRunBinding {intentId:string;approvalId:string;manifestDigest:string;sourceDigest:string;}
export interface ResearchCandidate {
    campaignId:string; roundId:string; planRevisionId:string; decisionId:string; spec:CandidateSpec; parentSource:PlanSource;
    state:'awaiting_implementation'|'prepared'; sessionId?:string; proposalId?:string; testJobId?:string; reviewId?:string;
    reviewAcceptanceId?:string; experimentId?:string; intentId?:string; repairOfMemberId?:string; repairRootMemberId?:string;
    integrationApprovalId?:string; testApprovalId?:string; reviewApprovalId?:string; runApprovalId?:string;
}
