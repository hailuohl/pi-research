import type { Actor, Row, Session } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import { type Store } from '../storage/store.js';
export interface ResearchSourceInput {
    path: string;
    workspace: string;
    artifactId: string;
    digest: string;
    size: number;
    readId: string;
    readProtocol?: 'fixed-text-v1';
    purpose?: 'whole-text' | 'dataset-reference';
    documentVersionId?: string;
    sourceKind?: 'workspace-snapshot';
    textSourceId?: string;
}
export declare function assertSourceInputs(store: Store, pid: string, sessionId: string, inputs: ResearchSourceInput[] | undefined): void;
export declare class SourceInputService {
    private app;
    constructor(app: ResearchApp);
    recordRead(actor: Actor, selectedSession: Row<Session> | undefined, file: {
        path: string;
        content: string;
        digest: string;
        size: number;
    }, callId: string): {
        sourceInputReadBlockedReason: string;
    } | undefined;
    private collect;
    selectionFingerprint(session: Row<Session>): ({
        documentVersionId: string;
        bindingId: string;
        version: number;
    } | {
        workspace: string;
        path: string;
        bindingId: string;
        version: number;
        purpose: "whole-text" | "dataset-reference";
        artifactId: string;
        sourceDigest: string;
        size: number;
        textSourceId: string;
        sourceKind: "workspace-snapshot";
    })[];
    preview(session: Row<Session>, anchorBriefId: string | null, inherited: ResearchSourceInput[], status?: 'clarifying' | 'ready'): {
        documentVersionId?: string | undefined;
        purpose?: "whole-text" | "dataset-reference" | undefined;
        digest: string;
        path: string;
        textSourceId?: string | undefined;
        readId: string;
        readProtocol?: "fixed-text-v1" | undefined;
        size: number;
        workspace: string;
        sourceKind?: "workspace-snapshot" | undefined;
        artifactId?: string;
    }[];
    previewBytes(session: Row<Session>, anchorBriefId: string | null, inherited: ResearchSourceInput[], bytePaths: string[]): ({
        bytes: undefined;
        verifiedReference: true;
        documentVersionId?: string | undefined;
        purpose?: "whole-text" | "dataset-reference" | undefined;
        digest: string;
        path: string;
        textSourceId?: string | undefined;
        readId: string;
        readProtocol?: "fixed-text-v1" | undefined;
        size: number;
        workspace: string;
        sourceKind?: "workspace-snapshot" | undefined;
        artifactId?: string;
    } | {
        bytes: Buffer<ArrayBufferLike>;
        documentVersionId?: string | undefined;
        purpose?: "whole-text" | "dataset-reference" | undefined;
        digest: string;
        path: string;
        textSourceId?: string | undefined;
        readId: string;
        readProtocol?: "fixed-text-v1" | undefined;
        size: number;
        workspace: string;
        sourceKind?: "workspace-snapshot" | undefined;
        artifactId?: string;
    })[];
    freeze(session: Row<Session>, anchorBriefId: string | null, inherited: ResearchSourceInput[], status?: 'clarifying' | 'ready'): ResearchSourceInput[];
}
