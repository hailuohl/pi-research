import type { ModelConfig, Row, ResearchContract, SourceSnapshot } from '../domain/types.js';
export interface RunGrantReference {
    id: string;
    digest: string;
    approvalId: string;
}
export interface RunGrantEntry {
    intentId: string;
    experimentId: string;
    experimentRevision: number;
    manifestDigest: string;
    sourceDigest: string;
    contractDigest: string;
    approvalId: string;
}
export interface RunGrant {
    sessionId: string;
    model: ModelConfig;
    entries: RunGrantEntry[];
    maxRuns: number;
    expiresAt: string;
    approvalId: string;
    digest: string;
    state: 'draft' | 'active' | 'revoked';
    activatedAt?: string;
    revokedAt?: string;
}
export interface RunGrantUse {
    grantId: string;
    grantDigest: string;
    grantApprovalId: string;
    intentId: string;
    manifestDigest: string;
    approvalId: string;
    runId: string;
}
export type RunGrantDTO = Row<RunGrant> & {
    effectiveState: 'draft' | 'active' | 'expired' | 'exhausted' | 'revoked' | 'stale';
    validity: 'current' | 'stale';
    reasons: string[];
    usage: {
        limit: number;
        used: number;
        remaining: number;
        unit: 'run-submission';
    };
    uses: Array<Row<RunGrantUse>>;
    manifests: Array<RunGrantEntry & {
        contract: ResearchContract;
        files: SourceSnapshot['files'];
    }>;
};
