import { type SourceIntegrityContext } from '../storage/source-integrity.js';
import type { Actor, Row, Session } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import { type Store } from '../storage/store.js';
import type { ResearchSourceInput } from './source-inputs.js';
export interface WorkspaceBinding {
    sessionId: string;
    anchorBriefId: string | null;
    workspace: string;
    path: string;
    purpose: 'whole-text' | 'dataset-reference';
    artifactId: string;
    sourceDigest: string;
    size: number;
    textSourceId: string;
}
export declare function ordinaryWorkspaceReader(actor: Actor): boolean;
export declare const workspacePathKey: (workspace: string, path: string) => string;
export declare function assertWorkspaceInput(store: Store, pid: string, sessionId: string, input: ResearchSourceInput, integrity?: SourceIntegrityContext): void;
export declare function workspaceSelections(store: Store, session: Row<Session>): {
    workspace: string;
    path: string;
    bindingId: string;
    version: number;
    purpose: "whole-text" | "dataset-reference";
    artifactId: string;
    sourceDigest: string;
    size: number;
    textSourceId: string;
}[];
export declare class WorkspaceInputService {
    private app;
    constructor(app: ResearchApp);
    authorize(actor: Actor, pid: string, sessionId: string): Row<Session>;
    replay(actor: Actor, pid: string, sessionId: string, value: unknown, signal?: AbortSignal): {
        sourceKind: "workspace-snapshot";
        workspace: string;
        path: string;
        purpose: "whole-text" | "dataset-reference";
        workspaceBindingId: string;
        artifactId: string;
        sourceDigest: string;
        size: number;
        textSourceId: string;
        readProtocol: "fixed-text-v1";
        utf16Length: number;
        status: "ready";
    };
    private descriptor;
    prepare(actor: Actor, pid: string, sessionId: string, input: {
        path: string;
        purpose: WorkspaceBinding['purpose'];
    }, key: string, validate: () => void, signal?: AbortSignal, commitPrepared?: (value: unknown) => void): Promise<{
        sourceKind: "workspace-snapshot";
        workspace: string;
        path: string;
        purpose: "whole-text" | "dataset-reference";
        workspaceBindingId: string;
        artifactId: string;
        sourceDigest: string;
        size: number;
        textSourceId: string;
        readProtocol: "fixed-text-v1";
        utf16Length: number;
        status: "ready";
    }>;
    inputs(session: Row<Session>, inherited: ResearchSourceInput[], status: 'clarifying' | 'ready'): ResearchSourceInput[];
}
