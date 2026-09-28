import type { RunExecution } from '../runners/adapter.js';
export interface Entity {
    id: string;
    kind: string;
    projectId: string | null;
    version: number;
    createdAt: string;
    updatedAt: string;
}
export type Row<T = Record<string, unknown>> = Entity & T;
export type Role = 'coordinator' | 'literature' | 'designer' | 'implementer' | 'analyst' | 'reviewer' | 'writer';
export interface Actor {
    type: 'user' | 'agent' | 'system';
    projectId?: string;
    sessionId?: string;
    role?: Role;
    taskId?: string;
    attemptId?: string;
    generation?: number;
    wakeupId?: string;
}
export declare const USER: Actor;
export declare const SYSTEM: Actor;
export interface CollaborationSettings {
    enabled: boolean;
    strategy: 'adaptive' | 'manual';
    maxActiveAgents: number;
    maxConcurrentAssistants: number;
    maxTasksPerTeam: number;
    maxTaskAttempts: number;
    requirePlanConfirmation: boolean;
    shutdownPolicy: 'drain';
}
export declare const DEFAULT_COLLABORATION: CollaborationSettings;
export interface Project {
    name: string;
    description: string;
    workspace: string;
    archived: boolean;
    gitHistoryEnabled?: boolean;
    settings: CollaborationSettings;
}
export interface ModelConfig {
    provider: string;
    model: string;
    thinking: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
}
export interface Session {
    sourceRevisionId?: string;
    sourceDigest?: string;
    title: string;
    role: Role;
    state: 'idle' | 'queued' | 'running' | 'interrupted' | 'failed' | 'waiting' | 'archived';
    workspace: string;
    piSessionPath: string | null;
    model: ModelConfig;
    generation: number;
    leaseUntil: number;
    lastError?: string;
    teamId?: string;
    taskId?: string;
    parentSessionId?: string;
}
export interface Message {
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    mode: 'prompt' | 'steer' | 'follow_up';
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    error?: string;
    origin?: 'user' | 'automation';
    wakeupId?: string;
    usage?: unknown;
}
export interface Approval {
    subjectKind: string;
    subjectId: string;
    digest: string;
    scope: string;
    status: 'pending' | 'approved' | 'rejected' | 'stale';
    reason: string;
    decidedAt?: string;
}
export interface ResearchContract {
    command: string[];
    environment: Record<string, string>;
    datasetVersion: string;
    evaluationProtocolVersion: string;
    metrics: Record<string, {
        unit: string;
        direction: 'min' | 'max';
    }>;
    expectedArtifacts: string[];
    timeoutSeconds: number;
    runner: 'trusted-example' | 'docker';
    image?: string;
    cpus: number;
    memoryMb: number;
    dockerContext?: string;
    pids?: number;
    workMb?: number;
    logBytes?: number;
    outputBytes?: number;
    networkPolicy?: 'none';
}
export interface Experiment {
    title: string;
    hypothesis: string;
    parentId: string | null;
    lifecycle: 'provisional' | 'frozen' | 'archived';
    changeProposalId?: string;
    contract: ResearchContract;
    contractDigest: string;
    workspace: string;
    notes: string[];
    revision: number;
}
export interface Manifest {
    experimentId: string;
    experimentVersion: number;
    experimentRevision: number;
    contract: ResearchContract;
    contractDigest: string;
    snapshotDigest: string;
    snapshotPath: string;
    sourceFiles: Array<{
        path: string;
        digest: string;
        size: number;
        mode?: '100644' | '100755';
    }>;
    createdAt: string;
    sourceRevisionId?: string;
    gitCommit?: string;
}
export interface RunIntent {
    experimentId: string;
    manifest: Manifest;
    manifestDigest: string;
    approvalId: string;
    status: 'prepared' | 'submitted';
    runId?: string;
}
export interface Run {
    experimentId: string;
    intentId: string;
    manifest: Manifest;
    manifestDigest: string;
    state: 'queued' | 'submitting' | 'running' | 'cancelling' | 'succeeded' | 'failed' | 'cancelled' | 'unknown';
    integrity: 'pending' | 'complete' | 'incomplete' | 'invalid';
    judgment: 'pending' | 'supported' | 'not_supported' | 'inconclusive';
    answerDisposition?: 'answered' | 'unanswered' | 'needs_review';
    answerReviewId?: string;
    outputDir: string;
    supervisorPid?: number;
    childPid?: number;
    heartbeat?: number;
    startedAt?: string;
    endedAt?: string;
    exitCode?: number | null;
    cancelRequested: boolean;
    metrics?: Record<string, number>;
    error?: string;
    artifactIds: string[];
    evidenceIds: string[];
    execution?: RunExecution;
}
export interface Artifact {
    title: string;
    digest: string;
    size: number;
    path: string;
    mediaType: string;
    origin: string;
    wakeupId?: string;
    runId?: string;
    taskId?: string;
}
export interface Evidence {
    type: 'artifact' | 'run' | 'paper' | 'code';
    artifactId: string;
    digest: string;
    locator: {
        start: number;
        end: number;
    };
    quote: string;
    description: string;
    runId?: string;
}
export interface Claim {
    statement: string;
    evidenceIds: string[];
    limitations: string[];
    status: 'proposal' | 'accepted' | 'rejected' | 'disputed';
    taskId?: string;
    sourceAttemptId?: string;
    sourceResultDigest?: string;
    sourceAcceptanceId?: string;
    sourceAcceptanceIds?: string[];
    validity?: 'current' | 'stale';
    invalidatedBy?: string;
}
export interface AcceptanceRecord {
    taskId: string;
    taskIds: string[];
    basis: unknown[];
    basisDigest: string;
    validity: 'current' | 'stale';
    invalidatedBy?: string;
}
export interface ExpectedTaskOutput {
    kind: 'report' | 'dataset' | 'patch' | 'analysis' | 'review' | 'code' | 'text';
    schemaId: 'report' | 'text' | 'csv' | 'json' | 'patch' | 'code' | 'review';
    required: boolean;
    title?: string;
    mediaType?: string;
    minBytes?: number;
}
export interface TaskSpec {
    key: string;
    role: Exclude<Role, 'coordinator'>;
    objective: string;
    dependencies: string[];
    critical?: boolean;
    reviewOf?: string;
    required?: boolean;
    inputEvidenceIds?: string[];
    expectedOutputs?: ExpectedTaskOutput[];
    acceptanceRuleIds?: string[];
}
export interface Team {
    sourceRevisionId?: string;
    rootSessionId: string;
    goal: string;
    state: 'awaiting_approval' | 'active' | 'paused' | 'draining' | 'completed' | 'partial' | 'failed' | 'cancelled';
    settings: CollaborationSettings;
    delegationEnabled: boolean;
    planVersion: number;
    directiveVersion: number;
    planDigest: string;
    approvalId: string;
    summarySent: boolean;
    autoSummarize?: boolean;
    blockReason?: string;
}
export interface Task extends TaskSpec {
    teamId: string;
    sessionId?: string;
    execution: 'pending' | 'running' | 'output_submitted' | 'failed' | 'cancelled' | 'blocked' | 'superseded' | 'waiting_user';
    acceptance: 'pending' | 'accepted' | 'rejected' | 'disputed';
    planVersion: number;
    directiveVersion: number;
    attemptCount: number;
    generation: number;
    attemptId?: string;
    blockReason?: string;
    result?: TaskResult;
}
export interface TaskAttempt {
    teamId: string;
    taskId: string;
    sessionId: string;
    generation: number;
    state: 'running' | 'finished' | 'failed' | 'cancelled' | 'unknown';
    workspace: string;
    leaseUntil: number;
    inputDigest: string;
    budgetReservationId: string;
    usage?: unknown;
    error?: string;
}
export interface TaskResult {
    summary: string;
    outcome: 'completed' | 'partial' | 'blocked';
    evidenceIds: string[];
    artifactIds: string[];
    claims: Array<{
        statement: string;
        evidenceIds: string[];
        limitations: string[];
    }>;
    unresolvedQuestions: string[];
    verdict?: 'accept' | 'reject' | 'disputed';
}
export interface SourceSnapshot {
    digest: string;
    path: string;
    files: Array<{
        path: string;
        size: number;
        digest: string;
        mode?: '100644' | '100755';
    }>;
}
export interface SourceRevision {
    captureKind?: 'observed-now';
    experimentId: string;
    revision: number;
    sourceDigest: string;
    snapshot: SourceSnapshot;
}
export interface ChangeProposal {
    baseExperimentId: string;
    baseRevision: number;
    baseSnapshot: SourceSnapshot;
    contractDigest: string;
    title: string;
    hypothesis: string;
    changes: Array<{
        path: string;
        expectedDigest: string | null;
        artifactId: string | null;
        artifactDigest: string | null;
        taskId?: string;
        taskResultDigest?: string;
        sourceAcceptanceId?: string;
    }>;
    candidateSnapshot: SourceSnapshot;
    digest: string;
    approvalId: string;
    state: 'prepared' | 'applied';
    testsStatus: 'not_run' | 'passed';
    testJobId?: string;
    appliedExperimentId?: string;
    sourceValidity?: 'current' | 'stale';
    invalidatedBy?: string;
}
