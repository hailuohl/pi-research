import type { DatabaseSync } from 'node:sqlite';
export declare function assertTextWriteSettled(root: string): void;
export declare function captureWritePreimage(root: string, path: string, metadata?: boolean): {
    bytes: NonSharedBuffer | null;
    identity: string | null;
    mode: number;
    parents: {
        path: string;
        identity: string;
    }[];
};
/** A text-write undo log only. SQLite's writer lock owns every journal transition. */
export declare class TextWriteRecovery {
    private db;
    private directory;
    private key;
    private current?;
    readonly conflicts: string[];
    constructor(db: DatabaseSync, path: string);
    private save;
    private target;
    write(root: string, path: string, bytes: Buffer, mode: number, metadata: boolean | undefined, preimage: ReturnType<typeof captureWritePreimage>): void;
    release(): void;
    rollback(): void;
    private finish;
    recover(): void;
}
