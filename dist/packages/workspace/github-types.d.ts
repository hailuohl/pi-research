import type { SourceSnapshot } from '../domain/types.js';
export interface GitHubAccount {
    id: number;
    login: string;
}
export interface GitHubRepository {
    id: number;
    fullName: string;
    url: string;
    private: true;
}
export interface GitHubStatus {
    ready: boolean;
    gitInstalled: boolean;
    cliInstalled: boolean;
    version?: string;
    account?: GitHubAccount;
    state: 'ready' | 'missing-git' | 'missing-cli' | 'unauthenticated' | 'unavailable';
    message: string;
    checkedAt: string;
}
export interface ProjectGitHubStatus {
    version: number;
    enabled: boolean;
    state: 'local' | 'queued' | 'creating' | 'uploading' | 'synced' | 'failed' | 'unknown' | 'paused';
    account?: GitHubAccount;
    repository?: GitHubRepository;
    pendingCount: number;
    lastCommit?: string;
    error?: {
        code: string;
        message: string;
    };
    retryable: boolean;
}
export interface GitHubSetting {
    enabled: boolean;
    epoch: number;
    account: GitHubAccount;
    repository?: GitHubRepository;
    baseName: string;
    eventCursor: number;
    lastCommit?: string;
    origin: 'user-project-setting';
}
export interface GitHubUploadJob {
    state: 'queued' | 'creating' | 'uploading' | 'synced' | 'failed' | 'unknown' | 'paused';
    phase: 'create' | 'push';
    epoch: number;
    operationId?: string;
    snapshot: SourceSnapshot;
    commitDate: string;
    commit?: string;
    ref: string;
    candidate: string;
    suffix: number;
    marker: string;
    generation: number;
    leaseUntil: number;
    workerPid?: number;
    error?: {
        code: string;
        message: string;
    };
}
