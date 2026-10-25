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
    selectionFingerprint(session: Row<Session>): {
        documentVersionId: string;
        bindingId: string;
        version: number;
    }[];
    preview(session: Row<Session>, anchorBriefId: string | null, inherited: ResearchSourceInput[], status?: 'clarifying' | 'ready'): {
        purpose?: "whole-text" | "dataset-reference" | undefined;
        digest: string;
        path: string;
        size: number;
        workspace: string;
        readId: string;
        documentVersionId?: string | undefined;
        readProtocol?: "fixed-text-v1" | undefined;
        artifactId?: string;
    }[];
    previewBytes(session: Row<Session>, anchorBriefId: string | null, inherited: ResearchSourceInput[], bytePaths: string[]): ({
        bytes: undefined;
        verifiedReference: true;
        purpose?: "whole-text" | "dataset-reference" | undefined;
        digest: string;
        path: string;
        size: number;
        workspace: string;
        readId: string;
        documentVersionId?: string | undefined;
        readProtocol?: "fixed-text-v1" | undefined;
        artifactId?: string;
    } | {
        bytes: Buffer<ArrayBufferLike>;
        purpose?: "whole-text" | "dataset-reference" | undefined;
        digest: string;
        path: string;
        size: number;
        workspace: string;
        readId: string;
        documentVersionId?: string | undefined;
        readProtocol?: "fixed-text-v1" | undefined;
        artifactId?: string;
    })[];
    freeze(session: Row<Session>, anchorBriefId: string | null, inherited: ResearchSourceInput[], status?: 'clarifying' | 'ready'): ResearchSourceInput[];
}
