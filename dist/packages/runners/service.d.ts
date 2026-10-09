import { BudgetService } from '../policy/budget.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Approval, RunIntent, Run, Manifest, Row } from '../domain/types.js';
import type { ResearchBriefService } from '../research-workflows/briefs.js';
import type { DockerRunResult } from './adapter.js';
import { ApprovalService } from '../policy/approvals.js';
import { EvidenceService } from '../evidence/service.js';
import { ComputeQueue } from '../scheduler/compute-queue.js';
export declare const TERMINAL: string[];
export declare class RunService {
    private c;
    private approvals;
    private evidence;
    private compute;
    private briefs?;
    private budget;
    automation?: import('../policy/research-automation.js').ResearchAutomationService;
    permissionCapture?: (actor: Actor, execution: import('../policy/session-permissions.js').ApprovedExecution) => import('../policy/session-permissions.js').JobPermission | undefined;
    permissionGuard?: (permission: import('../policy/session-permissions.js').JobPermission, execution: import('../policy/session-permissions.js').ApprovedExecution, sessionId?: string) => void;
    permissionForSession?: (id: string) => import('../policy/session-permissions.js').PermissionReference;
    researchSourceGuard?: (experimentId: string, stage: 'prepare' | 'submit' | 'execute', intentId?: string) => void;
    private launching;
    constructor(c: AppContext, approvals: ApprovalService, evidence: EvidenceService, compute?: ComputeQueue, briefs?: ResearchBriefService | undefined, budget?: BudgetService);
    get(actor: Actor, id: string): Row<Run>;
    list(actor: Actor, projectId: string, cursor?: number, limit?: number): {
        items: {
            metrics?: Record<string, number> | undefined;
            endedAt?: string | undefined;
            startedAt?: string | undefined;
            id: string;
            projectId: string;
            experimentId: string;
            intentId: string;
            state: "succeeded" | "failed" | "cancelled" | "queued" | "running" | "unknown" | "cancelling" | "submitting";
            integrity: "pending" | "complete" | "incomplete" | "invalid";
            judgment: "pending" | "supported" | "not_supported" | "inconclusive";
            manifestDigest: string;
            createdAt: string;
            updatedAt: string;
        }[];
        cursor: number;
        hasMore: boolean;
    };
    prepare(actor: Actor, experimentId: string, selectedRootSessionId?: string, autoAnalyze?: boolean): {
        approval: Row<Approval>;
        id: string;
        kind: string;
        projectId: string | null;
        version: number;
        createdAt: string;
        updatedAt: string;
        rootSessionId?: string;
        runGrant?: import("../policy/run-grant-types.js").RunGrantReference;
        experimentId: string;
        manifest: Manifest;
        manifestDigest: string;
        approvalId: string;
        status: "prepared" | "submitted";
        runId?: string;
    };
    assertIntentActor(actor: Actor, intent: Row<RunIntent>): void;
    submit(actor: Actor, id: string): Row<Run>;
    /** Keep the version read and heartbeat write in one inter-process SQLite transaction. */
    heartbeat(id: string): Row<Run>;
    /** Recheck the durable execution grant inside the transaction that claims a queued Run. */
    assertLaunchable(run: Row<Run>): void;
    /** Also used just before Docker start and while supervising a running immutable job. */
    assertExecutionGrant(run: Row<Run>, admission?: boolean): void;
    private assertPermission;
    /** Both launch callers hold the same write transaction as their authorization check. */
    cancelBeforeLaunch(run: Row<Run>, error: unknown): void;
    launchPending(): void;
    cancel(actor: Actor, id: string): Row<Run>;
    logs(actor: Actor, id: string, cursor?: number, stream?: 'stdout' | 'stderr', identity?: string | null): import("../execution/log-page.js").LogPage;
    sourceList(actor: Actor, id: string): {
        runId: string;
        experimentId: string;
        revision: number;
        sourceDigest: string;
        gitCommit: string | undefined;
        files: {
            path: string;
            digest: string;
            size: number;
            mode?: "100644" | "100755";
        }[];
    };
    sourceRead(actor: Actor, id: string, value: unknown): {
        content: string;
        cursor: number;
        end: number;
        complete: boolean;
        path: string;
        digest: string;
        size: number;
        mode?: "100644" | "100755";
        runId: string;
        experimentId: string;
        revision: number;
        sourceDigest: string;
        gitCommit: string | undefined;
    };
    finalize(id: string, exitCode: number | null, state: 'succeeded' | 'failed' | 'cancelled', error?: string, facts?: DockerRunResult): Row<Run>;
    reviewOutcome(actor: Actor, id: string, value: unknown): Row<Run>;
    reconcile(): void;
}
