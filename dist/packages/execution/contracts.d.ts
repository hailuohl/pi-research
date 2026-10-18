import type { SourceSnapshot } from '../domain/types.js';
export interface WorkingGrantReference {
    id: string;
    digest: string;
    approvalId: string;
}
export interface SandboxResources {
    cpus: number;
    memoryMb: number;
    pids: number;
    timeoutSeconds: number;
    workMb: number;
    outputBytes: number;
    logBytes: number;
}
export interface SandboxManifest {
    methodContractDigest?: string;
    syntheticFixture?: import('../research-workflows/synthetic-fixtures.js').SyntheticFixtureBinding;
    researchBrief?: import('../domain/types.js').ResearchBriefRef;
    threadLimit?: number;
    approvalResumeDigest?: string;
    workingGrant?: WorkingGrantReference;
    purpose: 'development-test';
    sessionId: string;
    inputSnapshot: SourceSnapshot;
    sourceRevisionId?: string;
    command: string[];
    environmentImageDigest: string;
    dockerContext: string;
    resources: SandboxResources;
    networkPolicy: 'none';
    deadline: string;
    expectedArtifacts: string[];
    metricArtifact?: string;
    dataArtifacts: Array<{
        id: string;
        digest: string;
        size: number;
        path: string;
        sourceAcceptanceId?: string;
    }>;
    scopeTaskId?: string;
    scopeAttemptId?: string;
    scopeGeneration?: number;
    sessionGeneration?: number;
}
export interface DevelopmentTask {
    originMessageId?: string;
    resume?: import('../policy/research-automation.js').ApprovalResumeBinding;
    title: string;
    sessionId: string;
    sourceDigest: string;
    manifest: SandboxManifest;
    manifestDigest: string;
    grantId: string;
    state: 'prepared' | 'submitted';
    jobId?: string;
}
export type SandboxState = 'queued' | 'starting' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out' | 'unknown';
export interface SandboxJob {
    permissionOrigin?: 'owner' | 'agent';
    permission?: import('../policy/session-permissions.js').JobPermission;
    developmentTaskId: string;
    sessionId: string;
    sourceDigest: string;
    manifest: SandboxManifest;
    manifestDigest: string;
    grantId: string;
    state: SandboxState;
    integrity: 'pending' | 'complete' | 'incomplete' | 'invalid';
    containerName: string;
    containerId?: string;
    imageId?: string;
    outputDir: string;
    controlDir: string;
    workerPid?: number;
    generation: number;
    leaseUntil: number;
    startRequested: boolean;
    cancelRequested: boolean;
    startedAt?: string;
    endedAt?: string;
    exitCode?: number | null;
    error?: string;
    stdoutArtifactId?: string;
    stderrArtifactId?: string;
    reportArtifactId?: string;
    artifactIds: string[];
    logTruncated?: boolean;
    recoveryCount: number;
}
export declare const SANDBOX_TERMINAL: SandboxState[];
