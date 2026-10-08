import type { Actor, Approval, Row, Session } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import type { GitOperation } from '../workspace/git-types.js';
export type RestrictedMode = 'readOnly' | 'confirm' | 'autoEdit';
export interface PermissionReference {
    rootSessionId: string;
    epoch: number;
    hostEpoch: number;
    mode: RestrictedMode | 'legacy' | 'fullAccess';
}
export interface ApprovedExecution {
    kind: 'run' | 'development';
    subjectId: string;
    approvalId: string;
    manifestDigest: string;
}
export interface JobPermission {
    policy: PermissionReference;
    approvedExecution?: ApprovedExecution;
}
export interface GitActionApproval {
    actionId: string;
    approvalId: string;
    operation: string;
    tupleDigest: string;
}
interface Permission {
    sessionId: string;
    mode: RestrictedMode;
    epoch: number;
}
export declare const TASK_PERMISSION_EFFECTS: string[];
export declare class SessionPermissionService {
    private app;
    constructor(app: ResearchApp);
    root(sessionId: string): Row<Session>;
    capture(sessionId: string, restricted?: boolean): PermissionReference;
    assert(ref: PermissionReference, effect?: boolean): void;
    captureJob(actor: Actor, execution: ApprovedExecution): JobPermission;
    assertJob(permission: JobPermission, execution: ApprovedExecution, sessionId?: string): void;
    captureGit(actor: Actor, job: GitOperation & {
        id: string;
    }): GitActionApproval | undefined;
    assertGit(job: GitOperation & {
        id: string;
    }): void;
    private refresh;
    status(actor: Actor, id: string): {
        sessionId: string;
        mode: string;
        version: number;
        epoch: number;
        available: boolean;
        reason: string;
        hostAccess: {
            sessionId: string;
            version: number;
            epoch: number;
            available: boolean;
            enabled: boolean;
            boundary: "trusted-host";
            osSandboxVerified: boolean;
            reason: string;
            revokedOnRestart: boolean;
            activeCommands: number;
            unknownCommands: number;
            jobs: {
                id: string;
                state: "succeeded" | "failed" | "cancelled" | "running" | "unknown" | "starting";
                pid: number | undefined;
                exitCode: number | null | undefined;
                error: string | undefined;
                createdAt: string;
                epoch: number;
            }[];
        };
        hasMoreActions: boolean;
        actions: {
            approval: Row<Approval>;
            id: string;
            kind: string;
            projectId: string | null;
            version: number;
            createdAt: string;
            updatedAt: string;
            sessionId: string;
            operation: string;
            input: Record<string, unknown>;
            epoch: number;
            policy: PermissionReference;
            source: string;
            approvalId: string;
            generation?: number;
            state: "pending" | "approved" | "rejected" | "stale" | "executing" | "completed" | "failed" | "unknown";
            error?: string;
            before?: {
                path: string;
                content: string | null;
                digest: string | null;
            };
        }[];
    };
    initialize(id: string, mode?: RestrictedMode): Row<Permission>;
    set(actor: Actor, id: string, value: unknown): {
        sessionId: string;
        mode: string;
        version: number;
        epoch: number;
        available: boolean;
        reason: string;
        hostAccess: {
            sessionId: string;
            version: number;
            epoch: number;
            available: boolean;
            enabled: boolean;
            boundary: "trusted-host";
            osSandboxVerified: boolean;
            reason: string;
            revokedOnRestart: boolean;
            activeCommands: number;
            unknownCommands: number;
            jobs: {
                id: string;
                state: "succeeded" | "failed" | "cancelled" | "running" | "unknown" | "starting";
                pid: number | undefined;
                exitCode: number | null | undefined;
                error: string | undefined;
                createdAt: string;
                epoch: number;
            }[];
        };
        hasMoreActions: boolean;
        actions: {
            approval: Row<Approval>;
            id: string;
            kind: string;
            projectId: string | null;
            version: number;
            createdAt: string;
            updatedAt: string;
            sessionId: string;
            operation: string;
            input: Record<string, unknown>;
            epoch: number;
            policy: PermissionReference;
            source: string;
            approvalId: string;
            generation?: number;
            state: "pending" | "approved" | "rejected" | "stale" | "executing" | "completed" | "failed" | "unknown";
            error?: string;
            before?: {
                path: string;
                content: string | null;
                digest: string | null;
            };
        }[];
    };
    stale(id: string): void;
    source(sessionId: string, operation: string, input: Record<string, unknown>): {
        fingerprint: string;
        before: {
            path: string;
            content: string | null;
            digest: string | null;
        } | undefined;
    };
    guard(actor: Actor, operation: string, input: Record<string, unknown>, callId: string | undefined): {
        reference: PermissionReference;
        actionId?: undefined;
        key?: undefined;
        consumed?: undefined;
    } | {
        reference: PermissionReference;
        actionId: string;
        key: string;
        consumed: boolean;
    } | {
        reference: PermissionReference;
        actionId: string;
        key: string;
        consumed?: undefined;
    } | undefined;
    private bindDocumentCall;
    private documentAction;
    documentImageScope(actor: Actor, input: Record<string, unknown>): {
        actionId: string;
        firstPage: number;
        lastPage: number;
    };
    assertDocumentImageAction(actor: Actor, value: unknown): void;
    assertImageAction(actor: Actor, value: unknown): void;
    validate(ref: PermissionReference, sessionId: string, operation: string, input: Record<string, unknown>, actionId?: string): void;
    begin(id: string): void;
    complete(id: string): void;
    failed(id: string, error: unknown, uncertain?: boolean): void;
    decide(actor: Actor, id: string, actionId: string, value: unknown): {
        sessionId: string;
        mode: string;
        version: number;
        epoch: number;
        available: boolean;
        reason: string;
        hostAccess: {
            sessionId: string;
            version: number;
            epoch: number;
            available: boolean;
            enabled: boolean;
            boundary: "trusted-host";
            osSandboxVerified: boolean;
            reason: string;
            revokedOnRestart: boolean;
            activeCommands: number;
            unknownCommands: number;
            jobs: {
                id: string;
                state: "succeeded" | "failed" | "cancelled" | "running" | "unknown" | "starting";
                pid: number | undefined;
                exitCode: number | null | undefined;
                error: string | undefined;
                createdAt: string;
                epoch: number;
            }[];
        };
        hasMoreActions: boolean;
        actions: {
            approval: Row<Approval>;
            id: string;
            kind: string;
            projectId: string | null;
            version: number;
            createdAt: string;
            updatedAt: string;
            sessionId: string;
            operation: string;
            input: Record<string, unknown>;
            epoch: number;
            policy: PermissionReference;
            source: string;
            approvalId: string;
            generation?: number;
            state: "pending" | "approved" | "rejected" | "stale" | "executing" | "completed" | "failed" | "unknown";
            error?: string;
            before?: {
                path: string;
                content: string | null;
                digest: string | null;
            };
        }[];
    };
}
export {};
