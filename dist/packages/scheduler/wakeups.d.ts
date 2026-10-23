import type { ResearchApp } from '../research-app.js';
import type { Actor, Approval, Message, Row, Task, Team } from '../domain/types.js';
import type { RunObservation } from '../research-workflows/types.js';
export interface Wakeup {
    sourceKind: 'team' | 'campaign-result' | 'run-result' | 'task-continuation' | 'approval-result';
    approvalId?: string;
    resumePermission?: import('../policy/session-permissions.js').PermissionReference;
    continuationId?: string;
    jobKind?: 'development' | 'run' | 'review' | 'recovery' | 'prepared';
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
                methodContractDigest?: string;
                syntheticFixture?: import("../research-workflows/synthetic-fixtures.js").SyntheticFixtureBinding;
                researchBrief?: import("../domain/types.js").ResearchBriefRef;
                threadLimit?: number;
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
                metricArtifact?: string;
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
            development: number | null;
            run: number | null;
            continuations: number | null;
            durationMs: number | null;
        };
        expiresAt: string | null;
        budget: {
            limit: number | null;
            used: number;
            reserved: number;
            unknown: number;
            available: number | null;
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
                methodContractDigest?: string;
                syntheticFixture?: import("../research-workflows/synthetic-fixtures.js").SyntheticFixtureBinding;
                researchBrief?: import("../domain/types.js").ResearchBriefRef;
                threadLimit?: number;
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
                metricArtifact?: string;
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
            verdict?: "disputed" | "reject" | "accept" | undefined;
            reviewerSessionId?: string | undefined;
            blockingMessage?: string | undefined;
            readingChecks?: ({
                targetId: string;
                kind: string;
                path: string;
                digest: string;
                total: number;
                readComplete: boolean;
                missingIntervals: {
                    start: number;
                    end: number;
                }[];
                blockedReason?: undefined;
            } | {
                targetId: string;
                kind: string;
                path: string;
                digest: string;
                total: null;
                readComplete: boolean;
                missingIntervals: never[];
                blockedReason: string;
            })[] | undefined;
            assessmentRequiredAreas?: ("implementation_and_tests" | "input_evidence" | "independent_units_and_intervals" | "threshold_interpretation" | "claim_boundaries")[] | undefined;
            digest: string;
            status: "failed" | "running" | "pending" | "passed" | "stale" | "rejected" | "disputed" | "awaiting_approval";
            protocolDocument?: import("../research-workflows/method-contracts.js").ProtocolDocument | undefined;
            draftRoles?: import("../research-workflows/method-contracts.js").DraftRole[] | undefined;
            protocolVersion?: 2 | 1 | undefined;
            researchBrief?: import("../domain/types.js").ResearchBriefRef | undefined;
            sourceInputs?: import("../research-workflows/source-inputs.js").ResearchSourceInput[] | undefined;
            testArtifacts?: import("../development/review-assessment.js").ReviewTestArtifact[] | undefined;
            dataArtifacts?: Omit<{
                id: string;
                digest: string;
                size: number;
                path: string;
                sourceAcceptanceId?: string;
            }, "path">[] | undefined;
            teamId: string;
            taskId: string;
            approvalId: string;
            manifestEvidenceId: string;
            testEvidenceIds: string[];
            requiredEvidenceIds: string[];
            baseSourceRevisionId?: string | undefined;
            briefArtifact?: undefined;
            surfaceInventory?: undefined;
            jobId: string;
            sourceDigest: string;
            producerSessionId: string;
            id: string;
            reviewId: string;
        } | {
            verdict?: "disputed" | "reject" | "accept" | undefined;
            reviewerSessionId?: string | undefined;
            blockingMessage?: string | undefined;
            readingChecks?: ({
                targetId: string;
                kind: string;
                path: string;
                digest: string;
                total: number;
                readComplete: boolean;
                missingIntervals: {
                    start: number;
                    end: number;
                }[];
                blockedReason?: undefined;
            } | {
                targetId: string;
                kind: string;
                path: string;
                digest: string;
                total: null;
                readComplete: boolean;
                missingIntervals: never[];
                blockedReason: string;
            })[] | undefined;
            assessmentRequiredAreas?: ("implementation_and_tests" | "input_evidence" | "independent_units_and_intervals" | "threshold_interpretation" | "claim_boundaries")[] | undefined;
            digest: string;
            status: "failed" | "running" | "pending" | "passed" | "stale" | "rejected" | "disputed" | "awaiting_approval";
            protocolDocument?: import("../research-workflows/method-contracts.js").ProtocolDocument | undefined;
            draftRoles?: import("../research-workflows/method-contracts.js").DraftRole[] | undefined;
            protocolVersion?: 2 | 1 | undefined;
            researchBrief?: import("../domain/types.js").ResearchBriefRef | undefined;
            sourceInputs?: import("../research-workflows/source-inputs.js").ResearchSourceInput[] | undefined;
            testArtifacts?: import("../development/review-assessment.js").ReviewTestArtifact[] | undefined;
            dataArtifacts?: Omit<{
                id: string;
                digest: string;
                size: number;
                path: string;
                sourceAcceptanceId?: string;
            }, "path">[] | undefined;
            teamId: string;
            taskId: string;
            approvalId: string;
            manifestEvidenceId: string;
            testEvidenceIds: string[];
            requiredEvidenceIds: string[];
            baseSourceRevisionId?: string | undefined;
            briefArtifact: {
                id: string;
                digest: string;
                size: number;
                path: string;
            } | undefined;
            surfaceInventory: import("../development/review-assessment.js").ReviewInventory;
            jobId: string;
            sourceDigest: string;
            producerSessionId: string;
            id: string;
            reviewId: string;
        } | {
            metrics: Record<string, number> | null;
            metricsContract: Record<string, {
                unit: string;
                direction: "min" | "max";
            }>;
            exitCode: number | null | undefined;
            error: string | undefined;
            artifactIds: string[];
            evidenceIds: string[];
            failureDiagnostic?: {
                completion: any;
                version: 1;
                kind: "local-nonzero-exit";
                executionId: string;
                reportArtifactId: string;
                reportDigest: string;
            } | undefined;
            id: string;
            experimentId: string;
            state: "succeeded" | "failed" | "cancelled" | "queued" | "running" | "unknown" | "submitting" | "cancelling";
            integrity: "pending" | "complete" | "incomplete" | "invalid";
            validation: "incomplete" | "invalid" | "verified";
            explanation: string;
        } | {
            authorization: Row<import("../policy/research-automation.js").Authorization> | undefined;
            instruction: string;
            interruptedMessageId?: undefined;
            task?: undefined;
            receipts?: undefined;
        } | {
            interruptedMessageId: string;
            task: {
                budget: {
                    limit: number | null;
                    used: number;
                    reserved: number;
                    unknown: number;
                    available: number | null;
                    unit: "agent-attempt";
                };
                checkpoint: Row<Record<string, unknown>> | null;
                authorizations: Row<import("../policy/research-automation.js").Authorization>[];
                id: string;
                kind: string;
                projectId: string | null;
                version: number;
                createdAt: string;
                updatedAt: string;
                rootSessionId: string;
                originMessageId: string;
                originDigest: string;
                permission: import("../policy/session-permissions.js").PermissionReference;
                runtimeId: string;
                modelDigest: string;
                sourceRevisionId?: string;
                lifecycleEpoch?: number;
                expiresAt: string | null;
                limits: import("../policy/host-access.js").ResearchAutomationPolicy["limits"];
                policy?: import("../policy/host-access.js").ResearchAutomationPolicy;
                digest: string;
                state: "active" | "paused" | "blocked" | "cancelled" | "completed";
                reason?: string;
            };
            receipts: {
                callId: string;
                result: {
                    [k: string]: any;
                };
            }[];
            instruction: string;
            authorization?: undefined;
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
            state: "failed" | "cancelled" | "completed" | "partial" | "active" | "awaiting_approval" | "paused" | "draining";
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
            state: "succeeded" | "failed" | "cancelled" | "queued" | "running" | "unknown" | "submitting" | "cancelling";
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
