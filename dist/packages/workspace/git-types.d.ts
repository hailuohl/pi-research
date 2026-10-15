import type { SourceSnapshot } from '../domain/types.js';
export interface GitOperation {
    permissionOrigin?: 'owner' | 'agent';
    permission?: import('../policy/session-permissions.js').PermissionReference;
    workingGrant?: import('../execution/contracts.js').WorkingGrantReference;
    approvedAction?: import('../policy/session-permissions.js').GitActionApproval;
    action: 'source' | 'checkout' | 'commit';
    state: 'queued' | 'running' | 'complete' | 'conflict' | 'failed';
    sourceRevisionId: string;
    sessionId?: string;
    snapshot: SourceSnapshot;
    parentSourceRevisionId?: string;
    expectedHead?: string;
    branch?: string;
    workspace?: string;
    previousWorkspace?: string;
    message: string;
    commitDate: string;
    generation: number;
    leaseUntil: number;
    workerPid?: number;
    gitCommit?: string;
    error?: string;
    diagnostic?: string;
}
export interface GitSourceBinding {
    sourceRevisionId: string;
    sourceDigest: string;
    originalCreatedAt: string;
    gitCommit: string;
    importedAt: string;
    captureKind: 'new-source' | 'legacy-import';
    operationId: string;
}
export interface GitWorkspace {
    sessionId: string;
    sourceRevisionId: string;
    branch: string;
    path: string;
    state: 'pending' | 'ready' | 'conflict' | 'failed';
    operationId: string;
    head?: string;
    snapshot: SourceSnapshot;
}
export interface WorkspaceLease {
    branch: string;
    owner: string;
    generation: number;
    until: number;
}
