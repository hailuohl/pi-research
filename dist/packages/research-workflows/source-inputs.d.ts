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
    preview(session: Row<Session>, anchorBriefId: string | null, inherited: ResearchSourceInput[]): {
        path: string;
        size: number;
        digest: string;
        workspace: string;
        readId: string;
        artifactId?: string;
    }[];
    previewBytes(session: Row<Session>, anchorBriefId: string | null, inherited: ResearchSourceInput[]): {
        bytes: Buffer<ArrayBufferLike>;
        path: string;
        size: number;
        digest: string;
        workspace: string;
        readId: string;
        artifactId?: string;
    }[];
    freeze(session: Row<Session>, anchorBriefId: string | null, inherited: ResearchSourceInput[]): ResearchSourceInput[];
}
