import type { GitHubAccount, GitHubRepository, GitHubStatus } from './github-types.js';
export interface RemoteRepository extends Omit<GitHubRepository, 'private'> {
    private: boolean;
    ownerId: number;
    description: string | null;
}
export interface GitHubConnection {
    account: GitHubAccount;
    repository(name: string): Promise<RemoteRepository | null>;
    create(name: string, marker: string): Promise<RemoteRepository>;
    ref(name: string, ref: string): Promise<string | null>;
    push(repoPath: string, name: string, commit: string, ref: string): Promise<void>;
}
export interface GitHubClient {
    status(): Promise<GitHubStatus>;
    connect(accountId: number): Promise<GitHubConnection>;
}
type Result = {
    code: number;
    stdout: string;
};
export declare function githubProcess(command: string, args: string[], env: NodeJS.ProcessEnv, input?: string, timeoutMs?: number): Promise<Result>;
declare class Connection implements GitHubConnection {
    readonly account: GitHubAccount;
    private token;
    private run;
    constructor(account: GitHubAccount, token: string, run?: typeof githubProcess);
    api(path: string, method?: string, body?: unknown): Promise<{
        status: number;
        value: any;
    }>;
    private parsed;
    repository(name: string): Promise<RemoteRepository | null>;
    create(name: string, marker: string): Promise<RemoteRepository>;
    ref(name: string, ref: string): Promise<string | null>;
    push(repoPath: string, name: string, commit: string, ref: string): Promise<void>;
}
export declare class GitHubCommand implements GitHubClient {
    private run;
    constructor(run?: typeof githubProcess);
    private credentials;
    connect(accountId: number): Promise<Connection>;
    status(): Promise<GitHubStatus>;
}
export {};
