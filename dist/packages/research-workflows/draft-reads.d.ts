import type { Actor, Row, Session } from '../domain/types.js';
import { type Store } from '../storage/store.js';
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
    private store;
    constructor(store: Store);
    private workspace;
    private path;
    private writes;
    recordWrite(s: Row<Session>, file: {
        path: string;
        digest: string;
        size: number;
    }, callId: string): void;
    recordRead(actor: Actor, s: Row<Session>, file: {
        path: string;
        digest: string;
        size: number;
        content: string;
    }, callId: string): {
        draftReadId: string;
    } | {
        draftReadBlockedReason: 'BRIEF_DRAFT_CHANGED' | 'BRIEF_DRAFT_ENCODING_INVALID';
    } | undefined;
    validate(s: Row<Session>, value: unknown): DraftFile[];
    assertCurrent(s: Row<Session>, files: DraftFile[] | undefined): void;
}
export {};
