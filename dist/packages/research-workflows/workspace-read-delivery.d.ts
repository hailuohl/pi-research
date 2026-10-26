import type { Actor, Row, Session } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import { type Store } from '../storage/store.js';
import { readText } from '../workspace/files.js';
import type { PermissionReference } from '../policy/session-permissions.js';
export type WorkspaceReadKind = 'workspace-draft-read' | 'research-input-read';
export interface WorkspaceReadProof {
    sessionId: string;
    workspace: string;
    path: string;
    digest: string;
    size: number;
    callId: string;
    bindingId?: string;
    protocolVersion?: 1;
    actor?: Actor;
    permission?: PermissionReference;
    continuation?: {
        continuationId: string;
        digest: string;
        originMessageId: string;
    };
    cursor?: number;
    end?: number;
    complete?: boolean;
    contentDigest?: string;
    delivery?: 'pending' | 'delivered';
    offered?: boolean;
    replayed?: boolean;
}
export interface WorkspaceTextInput {
    path: string;
    readProtocol?: 'workspace-text-v1';
    readBindingId?: string;
    cursor?: number;
    limit?: number;
}
export type WorkspaceText = ReturnType<typeof readText> & {
    readProtocol?: 'workspace-text-v1';
    cursorUnit?: 'utf8-byte';
    cursor?: number;
    end?: number;
    totalBytes?: number;
    complete?: boolean;
};
export declare function workspaceText(root: string, input: WorkspaceTextInput): WorkspaceText;
/** This is only an eligibility shape; assertWorkspaceReader verifies the host's actual continuation proof. */
export declare function draftReaderCandidate(actor: Actor): boolean;
export declare function assertWorkspaceReader(app: ResearchApp, actor: Actor, session: Row<Session>, kind?: WorkspaceReadKind): WorkspaceReadProof['continuation'];
export declare function assertWorkspaceReadActor(app: ResearchApp, actor: Actor, kind: WorkspaceReadKind, r: Row<WorkspaceReadProof>): void;
export declare function readBinding<T extends WorkspaceReadProof>(store: Store, kind: WorkspaceReadKind, read: Row<T>): Row<T>;
export declare function recordWorkspaceRead<T extends WorkspaceReadProof>(app: ResearchApp, kind: WorkspaceReadKind, actor: Actor, session: Row<Session>, data: T, page: WorkspaceText, requestedBindingId?: string): Row<T>;
export declare function hasWorkspaceCoverage(store: Store, kind: WorkspaceReadKind, read: Row<WorkspaceReadProof>): boolean;
export declare function replayWorkspaceRead(store: Store, kind: WorkspaceReadKind, id: string, pid: string): void;
export declare function offerWorkspaceRead(app: ResearchApp, actor: Actor, kind: WorkspaceReadKind, id: string, callId: string, check: (r: Row<WorkspaceReadProof>) => void): boolean;
export declare function deliverWorkspaceRead(app: ResearchApp, actor: Actor, kind: WorkspaceReadKind, id: string, callId: string, check: (r: Row<WorkspaceReadProof>) => void): void;
export declare function assertWorkspaceReadBytes(store: Store, r: Row<WorkspaceReadProof>): void;
