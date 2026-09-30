import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Task } from '../domain/types.js';
export declare class DevelopmentReviewService {
    private app;
    constructor(app: ResearchApp);
    private access;
    prepare(actor: Actor, pid: string, value: unknown): {
        verdict?: "disputed" | "accept" | "reject" | undefined;
        reviewerSessionId?: string | undefined;
        digest: string;
        status: "failed" | "stale" | "running" | "pending" | "rejected" | "disputed" | "awaiting_approval" | "passed";
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
        id: string;
        reviewId: string;
    };
    inspect(actor: Actor, pid: string, id: string): {
        verdict?: "disputed" | "accept" | "reject" | undefined;
        reviewerSessionId?: string | undefined;
        digest: string;
        status: "failed" | "stale" | "running" | "pending" | "rejected" | "disputed" | "awaiting_approval" | "passed";
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
        id: string;
        reviewId: string;
    };
    assertTaskCurrent(task: Row<Task>): void;
    sourceList(actor: Actor, pid: string, id: string): {
        reviewId: string;
        jobId: string;
        sourceDigest: string;
        files: {
            path: string;
            size: number;
            digest: string;
            mode?: "100644" | "100755";
        }[];
    };
    sourceRead(actor: Actor, pid: string, id: string, path: string, cursor?: number, limit?: number): {
        cursor: number;
        end: number;
        content: string;
        complete: boolean;
        path: string;
        size: number;
        digest: string;
        mode?: "100644" | "100755";
        reviewId: string;
        jobId: string;
        sourceDigest: string;
    };
    assertPassed(actor: Actor, pid: string, id: string, candidateDigest: string): {
        reviewId: string;
        reviewAcceptanceId: string;
        jobId: string;
        sourceDigest: string;
        producerSessionId: string;
    };
}
