export interface GitSnapshot {
    path: string;
    files: Array<{
        path: string;
        size: number;
        digest: string;
        mode?: '100644' | '100755';
    }>;
}
export interface GitTreeEntry {
    path: string;
    mode: '100644' | '100755';
    oid: string;
}
export interface GitImport {
    commit: string;
    remote?: string;
    files: GitTreeEntry[];
}
export declare function gitEnvironment(): NodeJS.ProcessEnv;
export declare class GitCommand {
    readonly repoPath: string;
    private readonly hooksPath;
    constructor(dataDir: string, projectId: string);
    private run;
    private bare;
    static readImport(sourcePath: string): Promise<GitImport | null>;
    initialize(): Promise<string>;
    commitSnapshot(snapshot: GitSnapshot, operationDir: string, options: {
        parent?: string;
        message: string;
        date: string;
    }): Promise<string>;
    updateRef(ref: string, next: string, previous: string | null): Promise<void>;
    ref(ref: string): Promise<string | null>;
    tree(commit: string): Promise<GitTreeEntry[]>;
    /** Read-only check on a copied bare repository; never follow worktree paths into the live source. */
    verifyHistory(commits: string[]): Promise<void>;
    readBlob(objectId: string): Promise<Buffer>;
    inspectWorktree(path: string): Promise<{
        head: string;
        branch: string;
        dirty: boolean;
        repoPath: string;
    }>;
    setWorktreeIndex(path: string, commit: string): Promise<void>;
    addWorktree(path: string, branch: string, commit: string): Promise<{
        head: string;
        branch: string;
        dirty: boolean;
        repoPath: string;
    }>;
}
