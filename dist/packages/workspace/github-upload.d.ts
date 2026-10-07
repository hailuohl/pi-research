import type { ResearchApp } from '../research-app.js';
import type { Actor, Project, Row } from '../domain/types.js';
import type { GitOperation } from './git-types.js';
import { type GitHubClient } from './github-command.js';
import type { ProjectGitHubStatus } from './github-types.js';
export declare function githubSlug(name: string): string;
export declare class GitHubUploadService {
    private app;
    client: GitHubClient;
    private running?;
    private stopped;
    constructor(app: ResearchApp, client?: GitHubClient);
    status(actor: Actor): Promise<import("./github-types.js").GitHubStatus>;
    createProject(actor: Actor, input: unknown, key: string): Promise<Row<Project>>;
    inspect(actor: Actor, pid: string): ProjectGitHubStatus;
    configure(actor: Actor, pid: string, input: unknown): ProjectGitHubStatus;
    retry(actor: Actor, pid: string, input: unknown): ProjectGitHubStatus;
    /** Called under the same transaction that completes the local operation. Disabled periods are not backfilled. */
    completed(op: Row<GitOperation>): void;
    private source;
    private checkHistory;
    tick(): void;
    private next;
    stop(): Promise<void>;
    processNext(projectId?: string): Promise<boolean>;
}
