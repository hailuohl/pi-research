import { DatabaseSync } from 'node:sqlite';
export interface BackupSummary {
    backupDir: string;
    sourceRoot: string;
    files: number;
    bytes: number;
    manifestDigest: string;
    schema: number[];
    excluded: string[];
    restoredTo?: string;
    relocated?: boolean;
}
/** Destructive maintenance is stricter than the existing history-preserving backup contract. */
export declare function stateCheck(db: DatabaseSync, forPurge?: boolean): {
    schema: number[];
    rows: {
        kind: string;
        id: string;
        projectId: string | null;
        value: Record<string, unknown>;
    }[];
};
export declare function verifyDataBackup(path: string): Promise<BackupSummary>;
export declare function createDataBackup(source: string, path: string, options: {
    offline: boolean;
}): Promise<BackupSummary>;
export declare function restoreDataBackup(path: string, targetPath: string, options: {
    offline: boolean;
    relocate?: boolean;
}): Promise<BackupSummary>;
