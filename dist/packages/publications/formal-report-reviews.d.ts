import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Task } from '../domain/types.js';
import { type FormalReportReview, type FormalTarget } from './formal-report-review-types.js';
export declare class FormalReportReviewService {
    private app;
    constructor(app: ResearchApp);
    private access;
    authorize(actor: Actor, pid: string, id: string): Row<FormalReportReview>;
    prepare(actor: Actor, pid: string, value: unknown): {
        blockingMessage?: string | undefined;
        nativeVerdict?: "disputed" | "reject" | "accept" | undefined;
        digest: string;
        teamId: string;
        taskId: string;
        approvalId: string;
        requiredEvidenceIds: string[];
        status: string;
        scientificAcceptance: string;
        readingChecks: ({
            targetId: string;
            kind: string;
            path: string;
            digest: string;
            total: number;
            readComplete: boolean;
            missingIntervals: {
                start: number;
                end: number;
            }[];
            blockedReason?: undefined;
        } | {
            targetId: string;
            kind: string;
            path: string;
            digest: string;
            total: null;
            readComplete: boolean;
            missingIntervals: never[];
            blockedReason: string;
        })[];
        assessmentRequiredAreas: ("implementation_and_tests" | "input_evidence" | "independent_units_and_intervals" | "threshold_interpretation" | "claim_boundaries")[];
        reviewId: string;
        protocolVersion: 1;
        rootSessionId: string;
        runId: string;
        manifestDigest: string;
        sourceDigest: string;
        researchBrief: import("../domain/types.js").ResearchBriefRef;
        methodContractDigest: string;
        reportArtifactId: string;
        reportDigest: string;
        targets: FormalTarget[];
        factsDigest: string;
        id: string;
    };
    inspect(actor: Actor, pid: string, id: string): {
        blockingMessage?: string | undefined;
        nativeVerdict?: "disputed" | "reject" | "accept" | undefined;
        digest: string;
        teamId: string;
        taskId: string;
        approvalId: string;
        requiredEvidenceIds: string[];
        status: string;
        scientificAcceptance: string;
        readingChecks: ({
            targetId: string;
            kind: string;
            path: string;
            digest: string;
            total: number;
            readComplete: boolean;
            missingIntervals: {
                start: number;
                end: number;
            }[];
            blockedReason?: undefined;
        } | {
            targetId: string;
            kind: string;
            path: string;
            digest: string;
            total: null;
            readComplete: boolean;
            missingIntervals: never[];
            blockedReason: string;
        })[];
        assessmentRequiredAreas: ("implementation_and_tests" | "input_evidence" | "independent_units_and_intervals" | "threshold_interpretation" | "claim_boundaries")[];
        reviewId: string;
        protocolVersion: 1;
        rootSessionId: string;
        runId: string;
        manifestDigest: string;
        sourceDigest: string;
        researchBrief: import("../domain/types.js").ResearchBriefRef;
        methodContractDigest: string;
        reportArtifactId: string;
        reportDigest: string;
        targets: FormalTarget[];
        factsDigest: string;
        id: string;
    };
    assertTaskCurrent(task: Row<Task>): void;
    sourceRead(actor: Actor, pid: string, id: string, path: string, cursor?: number, limit?: number): {
        reviewId: string;
        runId: string;
        targetId: string;
        path: string;
        digest: string;
        cursor: number;
        end: number;
        content: string;
        complete: boolean;
    };
    recordReading(actor: Actor, pid: string, operation: string, input: Record<string, unknown>, output: Record<string, unknown>, callId: string): {
        reviewReadId: `${string}-${string}-${string}-${string}-${string}`;
    } | undefined;
}
