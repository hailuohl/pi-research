import type { ResearchApp } from '../research-app.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Row, Session, SourceRevision } from '../domain/types.js';
import type { GitOperation, GitWorkspace } from './git-types.js';
export declare function queueSourceHistory(c: AppContext, r: Row<SourceRevision>, parentSourceRevisionId?: string, legacy?: boolean): Row<GitOperation>;
export declare function queueWorkspaceHistory(c: AppContext, s: Row<Session>, r: Row<SourceRevision>, permission?: import('../policy/session-permissions.js').PermissionReference, approve?: (job: GitOperation & {
    id: string;
}) => import('../policy/session-permissions.js').GitActionApproval | undefined): Row<GitWorkspace>;
/** Shared by tools and host launch; source-free note sessions have no code branch to lock. */
export declare function assertWorkspaceReady(c: AppContext, sessionId: string): Row<import("./git-types.js").WorkspaceLease> | undefined;
export declare class GitService {
    private app;
    private active?;
    private stopped;
    constructor(app: ResearchApp);
    enable(actor: Actor, pid: string): {
        operationIds: string[];
        enabled: true;
    };
    private access;
    inspect(actor: Actor, pid: string, sessionId: string): {
        sessionId: string;
        state: "unbound";
        sourceRevisionId?: undefined;
        branch?: undefined;
        head?: undefined;
        operationId?: undefined;
        operationState?: undefined;
        error?: undefined;
        sourceDigest?: undefined;
    } | {
        sessionId: string;
        state: "failed" | "pending" | "conflict" | "ready";
        sourceRevisionId: string;
        branch: string;
        head: string | undefined;
        operationId: string;
        operationState: "failed" | "queued" | "running" | "complete" | "conflict";
        error: string | undefined;
        sourceDigest: string;
    };
    operation(actor: Actor, pid: string, id: string): {
        operationId: string;
        action: "source" | "checkout" | "commit";
        state: "failed" | "queued" | "running" | "complete" | "conflict";
        sourceRevisionId: string;
        sessionId: string | undefined;
        sourceDigest: string;
        gitCommit: string | undefined;
        error: string | undefined;
    };
    diff(actor: Actor, pid: string, sessionId: string): {
        sessionId: string;
        head: string;
        sourceDigest: string;
        files: {
            path: string;
            status: "added" | "deleted" | "modified";
            beforeDigest: string | null;
            afterDigest: string | null;
            beforeMode: "100644" | "100755" | null;
            afterMode: "100644" | "100755" | null;
        }[];
    };
    commit(actor: Actor, pid: string, sessionId: string, value: unknown): {
        operationId: string;
        action: "source" | "checkout" | "commit";
        state: "failed" | "queued" | "running" | "complete" | "conflict";
        sourceRevisionId: string;
        sessionId: string | undefined;
        sourceDigest: string;
        gitCommit: string | undefined;
        error: string | undefined;
    };
    setMode(actor: Actor, pid: string, sessionId: string, value: unknown): {
        path: string;
        mode: string;
        sourceDigest: string;
    };
    migrate(actor: Actor, pid: string): {
        operationIds: string[];
    };
    /** Called before model availability checks. Git never executes within the caller's SQL transaction. */
    tick(): void;
    stop(): Promise<void>;
    drain(projectId?: string): Promise<void>;
    processNext(projectId?: string): Promise<boolean>;
    retry(actor: Actor, pid: string, id: string): {
        operationId: string;
        action: "source" | "checkout" | "commit";
        state: "failed" | "queued" | "running" | "complete" | "conflict";
        sourceRevisionId: string;
        sessionId: string | undefined;
        sourceDigest: string;
        gitCommit: string | undefined;
        error: string | undefined;
    };
    private validateSession;
    private restoreSnapshot;
}
