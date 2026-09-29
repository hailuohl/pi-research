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
export declare function verifyDataBackup(path: string): Promise<BackupSummary>;
export declare function createDataBackup(source: string, path: string, options: {
    offline: boolean;
}): Promise<BackupSummary>;
export declare function restoreDataBackup(path: string, targetPath: string, options: {
    offline: boolean;
    relocate?: boolean;
}): Promise<BackupSummary>;
