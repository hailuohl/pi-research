import type { Actor, Approval, Row, Session, RunIntent, Run, Experiment } from '../domain/types.js';
import type { DevelopmentTask, SandboxJob } from '../execution/contracts.js';
import type { ResearchApp } from '../research-app.js';
import type { Store } from '../storage/store.js';
import type { PermissionReference } from './session-permissions.js';
import type { ResearchAutomationPolicy } from './host-access.js';
export declare const AUTOMATION_LIMITS: {
    readonly development: 3;
    readonly run: 2;
    readonly continuations: 6;
    readonly durationMs: number;
};
export declare const APPROVAL_RESUME_TOOLS: string[];
export declare const CONTINUATION_TOOLS: string[];
export interface ApprovalResumeBinding {
    rootSessionId: string;
    originMessageId: string;
    originDigest: string;
    modelDigest: string;
    permission: PermissionReference;
}
export interface FullAccessReference {
    continuationId: string;
    digest: string;
}
export interface ResearchContinuation {
    rootSessionId: string;
    originMessageId: string;
    originDigest: string;
    permission: PermissionReference;
    runtimeId: string;
    modelDigest: string;
    sourceRevisionId?: string;
    lifecycleEpoch?: number;
    expiresAt: string | null;
    limits: ResearchAutomationPolicy['limits'];
    policy?: ResearchAutomationPolicy;
    digest: string;
    state: 'active' | 'paused' | 'blocked' | 'cancelled' | 'completed';
    reason?: string;
}
export interface Authorization {
    continuationId: string;
    subjectKind: 'development-task' | 'run-intent';
    subjectId: string;
    manifestDigest: string;
    approvalId: string;
    dockerTarget?: {
        context: string;
        targetId: string;
        engineId: string;
        endpoint: string;
    };
    jobId?: string;
}
export declare function modelDigest(store: Store, s: Session): string;
/** Frozen proof remains readable; only admission and live execution require the owner lease. */
export declare function assertResearchReference(store: Store, pid: string, ref: FullAccessReference, current?: boolean, execution?: boolean): Row<ResearchContinuation>;
export declare class ResearchAutomationService {
    private app;
    modelIdentity(session: Session): string;
    private ownerStarted;
    private ownerClaimed;
    private ownerSuperseded;
    constructor(app: ResearchApp);
    isOwner(): boolean;
    private cancelOwnedChains;
    startOwner(): void;
    heartbeatOwner(): void;
    stopOwner(): void;
    cancelSession(sessionId: string, reason: string): void;
    pauseSession(sessionId: string, reason: string): void;
    inspect(actor: Actor, id: string): {
        budget: {
            limit: number | null;
            used: number;
            reserved: number;
            unknown: number;
            available: number | null;
            unit: "agent-attempt";
        };
        checkpoint: Row<Record<string, unknown>> | null;
        authorizations: Row<Authorization>[];
        id: string;
        kind: string;
        projectId: string | null;
        version: number;
        createdAt: string;
        updatedAt: string;
        rootSessionId: string;
        originMessageId: string;
        originDigest: string;
        permission: PermissionReference;
        runtimeId: string;
        modelDigest: string;
        sourceRevisionId?: string;
        lifecycleEpoch?: number;
        expiresAt: string | null;
        limits: ResearchAutomationPolicy["limits"];
        policy?: ResearchAutomationPolicy;
        digest: string;
        state: "active" | "paused" | "blocked" | "cancelled" | "completed";
        reason?: string;
    };
    list(actor: Actor, sessionId: string): {
        budget: {
            limit: number | null;
            used: number;
            reserved: number;
            unknown: number;
            available: number | null;
            unit: "agent-attempt";
        };
        checkpoint: Row<Record<string, unknown>> | null;
        authorizations: Row<Authorization>[];
        id: string;
        kind: string;
        projectId: string | null;
        version: number;
        createdAt: string;
        updatedAt: string;
        rootSessionId: string;
        originMessageId: string;
        originDigest: string;
        permission: PermissionReference;
        runtimeId: string;
        modelDigest: string;
        sourceRevisionId?: string;
        lifecycleEpoch?: number;
        expiresAt: string | null;
        limits: ResearchAutomationPolicy["limits"];
        policy?: ResearchAutomationPolicy;
        digest: string;
        state: "active" | "paused" | "blocked" | "cancelled" | "completed";
        reason?: string;
    }[];
    checkpoint(actor: Actor, input: unknown): {
        continuationId: string;
        state: "waiting" | "completed" | "needs_attention";
        summary: string;
        runIds: string[];
        developmentJobIds: string[];
        scientificConclusion: false;
    };
    control(actor: Actor, id: string, input: unknown): Row<ResearchContinuation>;
    block(id: string, reason: string): void;
    assertActor(actor: Actor): Row<ResearchContinuation>;
    captureResume(actor: Actor): ApprovalResumeBinding | undefined;
    assertResume(task: Row<DevelopmentTask>): ApprovalResumeBinding;
    private chain;
    private target;
    authorize(actor: Actor, approval: Row<Approval>, dockerContext?: string, runner?: string, experimentId?: string): {
        continuationId: string;
        digest: string;
    } | undefined;
    authorizeDecisionRun(actor: Actor, ref: import('./automatic-approvals.js').AutomaticApprovalReference, d: Row<import('../research-workflows/types.js').CampaignDecision>, intent: Row<RunIntent>): FullAccessReference;
    assertApproval(a: Row<Approval>, current?: boolean, execution?: boolean): Row<ResearchContinuation> | undefined;
    private submissionChain;
    /** Read-only admission check; consume repeats it inside the job-creation transaction. */
    assertSubmission(actor: Actor, a: Row<Approval>): Row<Authorization> | undefined;
    consume(actor: Actor, a: Row<Approval>, jobId: string): void;
    resultReady(c: ResearchContinuation, j: Row<SandboxJob | Run>): boolean;
    authorizeSource(actor: Actor, source: {
        id: string;
        experimentId: string;
        sourceDigest: string;
    }): void;
    private experimentInScope;
    variantSource(actor: Actor, pid: string, input: Record<string, unknown>): Row<import("../domain/types.js").SourceRevision> | {
        snapshot: import("../domain/types.js").SourceSnapshot;
        sourceDigest: string;
        repair: {
            parentSourceDigest: string;
            reviewId?: {} | undefined;
            runId: string;
            jobId: string;
        };
        id: string;
        kind: string;
        projectId: string | null;
        version: number;
        createdAt: string;
        updatedAt: string;
        captureKind?: "observed-now";
        experimentId: string;
        revision: number;
    };
    recordVariant(actor: Actor, child: Row<Experiment>, source: {
        id: string;
        sourceDigest: string;
        repair?: {
            parentSourceDigest: string;
        };
    }): void;
    authorization(subjectId: string): Row<Authorization> | undefined;
    recoveryReceipts(id: string): {
        callId: string;
        result: {
            [k: string]: any;
        };
    }[];
    paused(subjectId: string): boolean;
    resultSources(): {
        a: Row<Authorization>;
        c: Row<ResearchContinuation>;
        j: Row<Run | SandboxJob>;
    }[];
}
