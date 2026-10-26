import type { Actor, Row, Session } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import { type WorkspaceText } from './workspace-read-delivery.js';
interface WorkspaceDraft {
    sessionId: string;
    workspace: string;
}
export interface DraftFile extends WorkspaceDraft {
    path: string;
    digest: string;
    size: number;
    readId: string;
    writeVersion: number;
}
export interface DraftFileInput {
    path: string;
    readId: string;
}
/** Host receipts are deliberately separate from the model's workspace and cached tool responses. */
export declare class DraftReadService {
    private app;
    constructor(app: ResearchApp);
    private get store();
    private workspace;
    private path;
    private writes;
    recordWrite(s: Row<Session>, file: {
        path: string;
        digest: string;
        size: number;
    }, callId: string): void;
    recordRead(actor: Actor, s: Row<Session>, file: WorkspaceText, callId: string, requestedBindingId?: string): {
        draftReadBlockedReason: string;
    } | {
        readBindingId?: string | undefined;
        writeVersion?: number | undefined;
        draftReadId: string;
        draftReadBlockedReason?: undefined;
    } | undefined;
    validate(s: Row<Session>, value: unknown): DraftFile[];
    private validateFiles;
    assertAcceptedCurrent(s: Row<Session>, briefId: string): void;
    private check;
    offer(actor: Actor, id: string, callId: string): boolean;
    deliver(actor: Actor, id: string, callId: string): void;
    replay(actor: Actor, id: string): void;
}
export {};
