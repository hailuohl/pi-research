import type { ResearchApp } from '../research-app.js';
import type { Actor, Approval, Message, Row, Task, Team } from '../domain/types.js';
import type { RunObservation } from '../research-workflows/types.js';
export interface Wakeup {
    sourceKind: 'team' | 'campaign-result' | 'run-result' | 'task-continuation' | 'approval-result';
    approvalId?: string;
    resumePermission?: import('../policy/session-permissions.js').PermissionReference;
    continuationId?: string;
    jobKind?: 'development' | 'run';
    sourceId: string;
    ownerId: string;
    rootSessionId: string;
    sourceDigest: string;
    automatic: boolean;
    requested: boolean;
    state: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'superseded';
    attempts: number;
    maxAttempts: number;
    queueGeneration?: number;
    blockReason?: string;
    messageId?: string;
    reservationId?: string;
    analysisSessionPath?: string;
    generation?: number;
    error?: string;
}
type Source = Pick<Wakeup, 'sourceKind' | 'sourceId' | 'ownerId' | 'rootSessionId' | 'sourceDigest' | 'automatic' | 'continuationId' | 'jobKind' | 'approvalId' | 'resumePermission'>;
export declare function teamWakeupSource(t: Row<Team>, tasks: Row<Task>[]): Source;
export declare const wakeupId: (source: Source) => string;
/** A durable inbox. One pending signal is not the full result set: prompts reread authoritative records. */
export declare class WakeupService {
    private app;
    constructor(app: ResearchApp);
    get(actor: Actor, id: string): Row<Wakeup>;
    list(actor: Actor, projectId: string): Row<Wakeup>[];
    private teamSource;
    private campaignSource;
    private runResultSource;
    approvalDecided(a: Row<Approval>): void;
    assertApprovalResume(actor: Actor, subjectId?: string): Row<Wakeup>;
    private continuationSource;
    private enqueue;
    private sourceStatus;
    private block;
    private clearEmptyQueue;
    private invalidate;
    reconcile(): void;
    private continuationRunResult;
    context(w: Row<Wakeup>): {
        purpose: string;
        task: {
            blockedReason?: string | undefined;
            developmentTaskId: string;
            manifest: {
                inputSnapshot: {
                    digest: string;
                    files: {
                        path: string;
                        size: number;
                        digest: string;
                        mode?: "100644" | "100755";
                    }[];
                };
                dataArtifacts: {
                    id: string;
                    digest: string;
                    size: number;
                    sourceAcceptanceId?: string;
                }[];
                approvalResumeDigest?: string;
                workingGrant?: import("../execution/contracts.js").WorkingGrantReference;
                purpose: "development-test";
                sessionId: string;
                sourceRevisionId?: string;
                command: string[];
                environmentImageDigest: string;
                dockerContext: string;
                resources: import("../execution/contracts.js").SandboxResources;
                networkPolicy: "none";
                deadline: string;
                expectedArtifacts: string[];
                scopeTaskId?: string;
                scopeAttemptId?: string;
                scopeGeneration?: number;
                sessionGeneration?: number;
            };
            approval: Row<Approval>;
            effectiveState: string;
            canSubmit: boolean;
            id: string;
            kind: string;
            projectId: string | null;
            version: number;
            createdAt: string;
            updatedAt: string;
            originMessageId?: string;
            title: string;
            sessionId: string;
            sourceDigest: string;
            manifestDigest: string;
            grantId: string;
            state: "prepared" | "submitted";
            jobId?: string;
        };
        originMessageId?: undefined;
        goal?: undefined;
        limits?: undefined;
        expiresAt?: undefined;
        budget?: undefined;
        result?: undefined;
        notice?: undefined;
        team?: undefined;
        tasks?: undefined;
        campaign?: undefined;
        observations?: undefined;
        run?: undefined;
    } | {
        purpose: string;
        originMessageId: string;
        goal: string;
        limits: {
            readonly development: 3;
            readonly run: 2;
            readonly continuations: 6;
            readonly durationMs: number;
        };
        expiresAt: string;
        budget: {
            limit: number;
            used: number;
            reserved: number;
            unknown: number;
            available: number;
            unit: "agent-attempt";
        };
        result: {
            approval: Row<Approval>;
            effectiveState: "submitted";
            canSubmit: boolean;
            id: string;
            jobId: string;
            developmentTaskId: string;
            sessionId: string;
            version: number;
            sourceDigest: string;
            manifestDigest: string;
            manifest: {
                inputSnapshot: {
                    digest: string;
                    files: {
                        path: string;
                        size: number;
                        digest: string;
                        mode?: "100644" | "100755";
                    }[];
                };
                dataArtifacts: {
                    id: string;
                    digest: string;
                    size: number;
                    sourceAcceptanceId?: string;
                }[];
                approvalResumeDigest?: string;
                workingGrant?: import("../execution/contracts.js").WorkingGrantReference;
                purpose: "development-test";
                sessionId: string;
                sourceRevisionId?: string;
                command: string[];
                environmentImageDigest: string;
                dockerContext: string;
                resources: import("../execution/contracts.js").SandboxResources;
                networkPolicy: "none";
                deadline: string;
                expectedArtifacts: string[];
                scopeTaskId?: string;
                scopeAttemptId?: string;
                scopeGeneration?: number;
                sessionGeneration?: number;
            };
            imageId: string | undefined;
            grantId: string;
            state: import("../execution/contracts.js").SandboxState;
            integrity: "pending" | "complete" | "incomplete" | "invalid";
            exitCode: number | null;
            error: string | undefined;
            startedAt: string | undefined;
            endedAt: string | undefined;
            artifactIds: string[];
            stdoutArtifactId: string | undefined;
            stderrArtifactId: string | undefined;
            reportArtifactId: string | undefined;
            logTruncated: boolean | undefined;
            cancelRequested: boolean;
        } | {
            id: string;
            experimentId: string;
            state: "unknown" | "succeeded" | "failed" | "cancelled" | "queued" | "running" | "cancelling" | "submitting";
            integrity: "pending" | "complete" | "incomplete" | "invalid";
            validation: "incomplete" | "invalid" | "verified";
            explanation: string;
            metrics: Record<string, number> | null;
            metricsContract: Record<string, {
                unit: string;
                direction: "min" | "max";
            }>;
            exitCode: number | null | undefined;
            error: string | undefined;
            artifactIds: string[];
            evidenceIds: string[];
        };
        notice: string;
        task?: undefined;
        team?: undefined;
        tasks?: undefined;
        campaign?: undefined;
        observations?: undefined;
        run?: undefined;
    } | {
        purpose: string;
        team: {
            id: string;
            goal: string;
            state: "active" | "failed" | "cancelled" | "completed" | "partial" | "paused" | "awaiting_approval" | "draining";
        };
        tasks: {
            id: string;
            key: string;
            execution: "failed" | "cancelled" | "running" | "pending" | "output_submitted" | "blocked" | "superseded" | "waiting_user";
            acceptance: "pending" | "rejected" | "accepted" | "disputed";
            result: import("../domain/types.js").TaskResult | null;
        }[];
        task?: undefined;
        originMessageId?: undefined;
        goal?: undefined;
        limits?: undefined;
        expiresAt?: undefined;
        budget?: undefined;
        result?: undefined;
        notice?: undefined;
        campaign?: undefined;
        observations?: undefined;
        run?: undefined;
    } | {
        purpose: string;
        campaign: {
            id: string;
            goal: string;
            expectedVersion: number;
            roundNumber: number;
            focusExperimentId: string;
            primaryMetric: string;
            limits: import("../research-workflows/types.js").CampaignLimits;
        };
        observations: Row<RunObservation>[];
        task?: undefined;
        originMessageId?: undefined;
        goal?: undefined;
        limits?: undefined;
        expiresAt?: undefined;
        budget?: undefined;
        result?: undefined;
        notice?: undefined;
        team?: undefined;
        tasks?: undefined;
        run?: undefined;
    } | {
        purpose: string;
        run: {
            id: string;
            state: "unknown" | "succeeded" | "failed" | "cancelled" | "queued" | "running" | "cancelling" | "submitting";
            integrity: "pending" | "complete" | "incomplete" | "invalid";
            validation: "incomplete" | "invalid" | "verified";
            explanation: string;
            metrics: Record<string, number> | null;
            metricsContract: Record<string, {
                unit: string;
                direction: "min" | "max";
            }>;
            exitCode: number | null;
            error: string | null;
            artifactIds: string[];
            evidenceIds: string[];
            manifestBrief: {
                id: string;
                digest: string;
                revision: number;
                rootSessionId: string;
            } | null;
        };
        task?: undefined;
        originMessageId?: undefined;
        goal?: undefined;
        limits?: undefined;
        expiresAt?: undefined;
        budget?: undefined;
        result?: undefined;
        notice?: undefined;
        team?: undefined;
        tasks?: undefined;
        campaign?: undefined;
        observations?: undefined;
    };
    dispatch(id: string, readiness: {
        ready: boolean;
        message?: string;
    }): {
        notice: Row<Wakeup>;
        message: Row<Message>;
    } | null;
    markStarted(id: string, sessionId: string, generation: number, messageId: string): Row<Wakeup>;
    assertActive(actor: Actor): Row<Wakeup>;
    finish(id: string, error?: string, unknown?: boolean): Row<Wakeup>;
    request(actor: Actor, id: string): Row<Wakeup>;
    retry(actor: Actor, id: string): Row<Wakeup>;
    private neverStarted;
    cancel(actor: Actor, id: string): Row<Wakeup>;
    resources(actor: Actor): {
        evidenceIds: Set<string>;
        artifactIds: Set<string>;
        runIds: Set<string>;
        taskIds: Set<string>;
    };
    assertResource(actor: Actor, kind: 'artifact' | 'evidence' | 'run' | 'task', id: string): void;
}
export {};
