import type { Store } from '../storage/store.js';
import type { Row, Task, Team } from '../domain/types.js';
import type { SandboxJob } from '../execution/contracts.js';
export interface DevelopmentReview {
    jobId: string;
    sourceDigest: string;
    producerSessionId: string;
    baseSourceRevisionId?: string;
    teamId: string;
    taskId: string;
    approvalId: string;
    manifestEvidenceId: string;
    testEvidenceIds: string[];
    requiredEvidenceIds: string[];
    digest: string;
}
export declare function reviewPayload(r: DevelopmentReview): {
    teamId: string;
    taskId: string;
    approvalId: string;
    manifestEvidenceId: string;
    testEvidenceIds: string[];
    requiredEvidenceIds: string[];
    baseSourceRevisionId?: string | undefined;
    jobId: string;
    sourceDigest: string;
    producerSessionId: string;
};
/** Shared by dispatch and acceptance: historical records cannot silently acquire a new test target. */
export declare function assertDevelopmentReviewTarget(store: Store, pid: string, r: Row<DevelopmentReview>): {
    job: Row<SandboxJob>;
    task: Row<Task>;
    team: Row<Team>;
};
export declare function developmentReviewAcceptanceBasis(store: Store, pid: string, task: Row<Task>): {
    reviewId: string;
    digest: string;
    jobId: string;
    sourceDigest: string;
    manifestEvidenceId: string;
    testEvidenceIds: string[];
    inputAcceptanceIds: string[];
} | undefined;
