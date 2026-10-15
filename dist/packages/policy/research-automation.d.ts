import type { Actor, Approval, Row, Session, Run, Experiment } from '../domain/types.js';
import type { DevelopmentTask, SandboxJob } from '../execution/contracts.js';
import type { ResearchApp } from '../research-app.js';
import type { Store } from '../storage/store.js';
import type { PermissionReference } from './session-permissions.js';
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
    expiresAt: string;
    limits: typeof AUTOMATION_LIMITS;
    digest: string;
    state: 'active' | 'blocked' | 'cancelled';
    reason?: string;
}
interface Authorization {
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
/** Frozen proof remains readable; only admission and live execution require the owner lease. */
export declare function assertResearchReference(store: Store, pid: string, ref: FullAccessReference, current?: boolean): Row<ResearchContinuation>;
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
    assertApproval(a: Row<Approval>, current?: boolean): Row<ResearchContinuation> | undefined;
    private submissionChain;
    /** Read-only admission check; consume repeats it inside the job-creation transaction. */
    assertSubmission(actor: Actor, a: Row<Approval>): Row<Authorization> | undefined;
    consume(actor: Actor, a: Row<Approval>, jobId: string): void;
    private experimentInScope;
    variantSource(actor: Actor, pid: string, input: Record<string, unknown>): Row<import("../domain/types.js").SourceRevision>;
    recordVariant(actor: Actor, child: Row<Experiment>, source: {
        id: string;
        sourceDigest: string;
    }): void;
    authorization(subjectId: string): Row<Authorization> | undefined;
    resultSources(): {
        a: Row<Authorization>;
        c: Row<ResearchContinuation>;
        j: Row<Run | SandboxJob>;
    }[];
}
export {};
