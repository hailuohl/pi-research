import type {RunExecution} from '../runners/adapter.js';
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
    /** Host-only current input and validated continuation; never tool arguments. */
    messageId?:string;
    /** Host-only consumed approval notice, captured separately from human research input. */
    approvalNoticeMessageId?:string;
    researchModelDigest?:string;
    continuationId?:string;
    approvalResumeId?:string;
    /** Host-only; never parsed from request/tool input. */
    permissionActionId?:string;
    permission?: import('../policy/session-permissions.js').PermissionReference;
    type: 'user' | 'agent' | 'system';
    projectId?: string;
    sessionId?: string;
    role?: Role;
    taskId?: string;
    attemptId?: string;
    generation?: number;
    wakeupId?: string;
}
export const USER: Actor = { type: 'user' };
export const SYSTEM: Actor = { type: 'system' };
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
export const DEFAULT_COLLABORATION: CollaborationSettings = { enabled: false, strategy: 'adaptive', maxActiveAgents: 4, maxConcurrentAssistants: 3, maxTasksPerTeam: 24, maxTaskAttempts: 2, requirePlanConfirmation: true, shutdownPolicy: 'drain' };
export interface Project {
    name: string;
    description: string;
    workspace: string;
    status: 'active' | 'archived' | 'trashed' | 'purging';
    lifecycleEpoch: number;
    restoreStatus?: 'active' | 'archived';
    deletedAt?: string;
    /** Read-only legacy projection; persistence uses status. */
    readonly archived?: boolean;
    gitHistoryEnabled?: boolean;
    settings: CollaborationSettings;
}
export interface ProjectLifecycleView extends Pick<Entity,'id'|'version'|'createdAt'|'updatedAt'> {
    name:string;
    status:Project['status'];
    lifecycleEpoch:number;
    archived:boolean;
    deletedAt?:string;
    restoreStatus?:'active'|'archived';
}
export interface ProjectPurgeView {
    projectId:string;purgeId:string;state:'pending'|'running'|'failed'|'completed';
    phase:'waiting_offline'|'planning'|'files'|'records'|'verify'|'completed';
    completedPaths:number;totalPaths:number;updatedAt:string;error?:string;dataDir:string;offlineRequired:true;
}
export interface ModelConfig {
    restoreEpoch?: number;
    provider: string;
    model: string;
    thinking: string;
}
export interface Session {
    executionPermission?: import('../policy/session-permissions.js').PermissionReference;
    researchBriefId?: string;
    textCorpusGrantId?: string;
    discoveryGrantId?: string;
    runGrantId?: string;
    workingGrantId?: string;
    skillIds?: string[];
    skillBundleId?: string;
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
    /** Historical provenance only; never grants access to the source session or its native request. */
    branchSource?: {sessionId:string;messageId:string};
    /** Host-only binding for the history folded into one persisted Pi user input. */
    nativeAttachmentContextIds?:string[];
    nativeAttachmentsDisabled?:boolean;
    nativeRequestId?:string;
    permission?: import('../policy/session-permissions.js').PermissionReference;
    generation?: number;
    phase?: 'commentary' | 'final_answer';
    toolCalls?: string[];
    attachments?: MessageAttachment[];
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    contentTruncated?: boolean;
    mode: 'prompt' | 'steer' | 'follow_up';
    steerGeneration?: number;
    queueRemoved?: boolean;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    error?: string;
    origin?: 'user' | 'automation';
    /** Host-generated approval follow-up, never a new research goal. */
    approvalNoticeId?:string;
    wakeupId?: string;
    usage?: unknown;
}
export interface MessageAttachment {
    inputMode?:'native';
    parseResultId?:string;
    resultDigest?:string;
    pageCount?:number;
    documentVersionId:string;
    artifactId:string;
    digest:string;
    title:string;
    mediaType:string;
    size:number;
}
export interface Approval {
    fullAccess?: import('../policy/research-automation.js').FullAccessReference;
    runGrant?: import('../policy/run-grant-types.js').RunGrantReference;
    workingGrant?: import('../execution/contracts.js').WorkingGrantReference;
    subjectKind: string;
    subjectId: string;
    digest: string;
    scope: string;
    status: 'pending' | 'approved' | 'rejected' | 'stale';
    reason: string;
    decidedAt?: string;
}
export interface ResearchContract {
    threadLimit?: number;
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
    runner: 'trusted-example' | 'local' | 'docker' | 'ssh';
    localRuntimeId?: string;
    gpu?: import('../runners/gpu.js').GpuRequest;
    sshTargetId?: string;
    image?: string;
    cpus: number;
    memoryMb: number;
    dockerContext?: string;
    pids?: number;
    workMb?: number;
    logBytes?: number;
    outputBytes?: number;
    networkPolicy?: 'none' | 'host';
}
export interface ResearchBriefRef { id:string; digest:string; revision:number; rootSessionId:string; }
export interface Experiment {
    researchBrief?: ResearchBriefRef;
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
    methodContractDigest?:string;
    threadLimit?: number;
    localRuntime?: import('../runners/local-runtime.js').LocalRuntime;
    localExecution?: {isolation:'none';resourceEnforcement:'advisory';networkIsolation:false};
    gpuTarget?: import('../runners/gpu.js').GpuTarget;
    analysis?: {rootSessionId:string; model:ModelConfig; maxAttempts:1};
    researchBrief?: ResearchBriefRef;
    sshTarget?: import('../runners/ssh-targets.js').SshTarget;
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
    /** Trusted creator context; does not change the fixed computation manifest. */
    rootSessionId?: string;
    runGrant?: import('../policy/run-grant-types.js').RunGrantReference;
    experimentId: string;
    manifest: Manifest;
    manifestDigest: string;
    approvalId: string;
    status: 'prepared' | 'submitted';
    runId?: string;
}
export interface Run {
    failureDiagnostic?: {version:1;kind:'local-nonzero-exit';executionId:string;reportArtifactId:string;reportDigest:string};
    permissionOrigin?:'owner'|'agent';
    permission?: import('../policy/session-permissions.js').JobPermission;
    runGrant?: import('../policy/run-grant-types.js').RunGrantReference;
    startRequested?: boolean;
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
    discoveryGrant?: import('../policy/discovery-grant-types.js').DiscoveryGrantReference;
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
    document?: import('../documents/types.js').DocumentEvidenceLink;
    providerText?: import('../documents/types.js').ProviderTextEvidenceLink;
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
    skillIds?: string[];
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
    taskPermissionEffects?: string[];
    permission?: import('../policy/session-permissions.js').PermissionReference;
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
    discoveryGrantId?: string;
    runGrantId?: string;
    /** Host-created binding for an independent review of one fixed manuscript build. */
    publicationReviewId?: string;
    formalReportReviewId?: string;
    /** Host-created binding for an independent review of a fixed development result. */
    reviewId?: string;
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
    discoveryGrant?: import('../policy/discovery-grant-types.js').DiscoveryGrantReference;
    runGrant?: import('../policy/run-grant-types.js').RunGrantReference;
    skillBundleId?: string;
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
    developmentAssessment?: import('../development/review-assessment.js').DevelopmentAssessment;
    formalReportAssessment?: import('../publications/formal-report-review-types.js').FormalReportAssessment;
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

export interface SourceSnapshot {digest:string; path:string; files:Array<{path:string;size:number;digest:string;mode?:'100644'|'100755'}>}
export interface SourceRevision {
    captureKind?: 'observed-now';
    experimentId: string;
    revision: number;
    sourceDigest: string;
    snapshot: SourceSnapshot;
}
export interface ChangeProposal {
    baseExperimentId:string; baseRevision:number; baseSnapshot:SourceSnapshot; contractDigest:string;
    title:string; hypothesis:string; rootSessionId?:string;
    changes:Array<{path:string;expectedDigest:string|null;artifactId:string|null;artifactDigest:string|null;taskId?:string;taskResultDigest?:string;sourceAcceptanceId?:string;mode?:'100644'|'100755';beforeMode?:'100644'|'100755'}>;
    candidateSnapshot:SourceSnapshot; digest:string; approvalId:string; state:'prepared'|'applied'; testsStatus:'not_run'|'passed'; testJobId?:string; appliedExperimentId?:string; sourceValidity?:'current'|'stale'; invalidatedBy?:string;
    flow?:'reviewed-development';
    reviewId?:string;
    reviewAcceptanceId?:string;
}
