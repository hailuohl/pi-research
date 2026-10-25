import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Task } from '../domain/types.js';
import { type ReviewTestArtifact } from './review-assessment.js';
export declare class DevelopmentReviewService {
    private app;
    constructor(app: ResearchApp);
    private access;
    prepare(actor: Actor, pid: string, value: unknown): {
        verdict?: "disputed" | "reject" | "accept" | undefined;
        reviewerSessionId?: string | undefined;
        blockingMessage?: string | undefined;
        readingChecks?: ({
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
        })[] | undefined;
        assessmentRequiredAreas?: ("implementation_and_tests" | "input_evidence" | "independent_units_and_intervals" | "threshold_interpretation" | "claim_boundaries")[] | undefined;
        digest: string;
        status: "failed" | "running" | "pending" | "passed" | "stale" | "rejected" | "disputed" | "awaiting_approval";
        protocolDocument?: import("../research-workflows/method-contracts.js").ProtocolDocument | undefined;
        draftRoles?: import("../research-workflows/method-contracts.js").DraftRole[] | undefined;
        protocolVersion?: 1 | 2 | undefined;
        researchBrief?: import("../domain/types.js").ResearchBriefRef | undefined;
        sourceInputs?: import("../research-workflows/source-inputs.js").ResearchSourceInput[] | undefined;
        testArtifacts?: ReviewTestArtifact[] | undefined;
        dataArtifacts?: Omit<{
            id: string;
            digest: string;
            size: number;
            path: string;
            sourceAcceptanceId?: string;
        }, "path">[] | undefined;
        teamId: string;
        taskId: string;
        approvalId: string;
        manifestEvidenceId: string;
        testEvidenceIds: string[];
        requiredEvidenceIds: string[];
        baseSourceRevisionId?: string | undefined;
        briefArtifact?: undefined;
        surfaceInventory?: undefined;
        jobId: string;
        sourceDigest: string;
        producerSessionId: string;
        id: string;
        reviewId: string;
    } | {
        verdict?: "disputed" | "reject" | "accept" | undefined;
        reviewerSessionId?: string | undefined;
        blockingMessage?: string | undefined;
        readingChecks?: ({
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
        })[] | undefined;
        assessmentRequiredAreas?: ("implementation_and_tests" | "input_evidence" | "independent_units_and_intervals" | "threshold_interpretation" | "claim_boundaries")[] | undefined;
        digest: string;
        status: "failed" | "running" | "pending" | "passed" | "stale" | "rejected" | "disputed" | "awaiting_approval";
        protocolDocument?: import("../research-workflows/method-contracts.js").ProtocolDocument | undefined;
        draftRoles?: import("../research-workflows/method-contracts.js").DraftRole[] | undefined;
        protocolVersion?: 1 | 2 | undefined;
        researchBrief?: import("../domain/types.js").ResearchBriefRef | undefined;
        sourceInputs?: import("../research-workflows/source-inputs.js").ResearchSourceInput[] | undefined;
        testArtifacts?: ReviewTestArtifact[] | undefined;
        dataArtifacts?: Omit<{
            id: string;
            digest: string;
            size: number;
            path: string;
            sourceAcceptanceId?: string;
        }, "path">[] | undefined;
        teamId: string;
        taskId: string;
        approvalId: string;
        manifestEvidenceId: string;
        testEvidenceIds: string[];
        requiredEvidenceIds: string[];
        baseSourceRevisionId?: string | undefined;
        briefArtifact: {
            id: string;
            digest: string;
            size: number;
            path: string;
        } | undefined;
        surfaceInventory: import("./review-assessment.js").ReviewInventory;
        jobId: string;
        sourceDigest: string;
        producerSessionId: string;
        id: string;
        reviewId: string;
    };
    inspect(actor: Actor, pid: string, id: string): {
        verdict?: "disputed" | "reject" | "accept" | undefined;
        reviewerSessionId?: string | undefined;
        blockingMessage?: string | undefined;
        readingChecks?: ({
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
        })[] | undefined;
        assessmentRequiredAreas?: ("implementation_and_tests" | "input_evidence" | "independent_units_and_intervals" | "threshold_interpretation" | "claim_boundaries")[] | undefined;
        digest: string;
        status: "failed" | "running" | "pending" | "passed" | "stale" | "rejected" | "disputed" | "awaiting_approval";
        protocolDocument?: import("../research-workflows/method-contracts.js").ProtocolDocument | undefined;
        draftRoles?: import("../research-workflows/method-contracts.js").DraftRole[] | undefined;
        protocolVersion?: 1 | 2 | undefined;
        researchBrief?: import("../domain/types.js").ResearchBriefRef | undefined;
        sourceInputs?: import("../research-workflows/source-inputs.js").ResearchSourceInput[] | undefined;
        testArtifacts?: ReviewTestArtifact[] | undefined;
        dataArtifacts?: Omit<{
            id: string;
            digest: string;
            size: number;
            path: string;
            sourceAcceptanceId?: string;
        }, "path">[] | undefined;
        teamId: string;
        taskId: string;
        approvalId: string;
        manifestEvidenceId: string;
        testEvidenceIds: string[];
        requiredEvidenceIds: string[];
        baseSourceRevisionId?: string | undefined;
        briefArtifact?: undefined;
        surfaceInventory?: undefined;
        jobId: string;
        sourceDigest: string;
        producerSessionId: string;
        id: string;
        reviewId: string;
    } | {
        verdict?: "disputed" | "reject" | "accept" | undefined;
        reviewerSessionId?: string | undefined;
        blockingMessage?: string | undefined;
        readingChecks?: ({
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
        })[] | undefined;
        assessmentRequiredAreas?: ("implementation_and_tests" | "input_evidence" | "independent_units_and_intervals" | "threshold_interpretation" | "claim_boundaries")[] | undefined;
        digest: string;
        status: "failed" | "running" | "pending" | "passed" | "stale" | "rejected" | "disputed" | "awaiting_approval";
        protocolDocument?: import("../research-workflows/method-contracts.js").ProtocolDocument | undefined;
        draftRoles?: import("../research-workflows/method-contracts.js").DraftRole[] | undefined;
        protocolVersion?: 1 | 2 | undefined;
        researchBrief?: import("../domain/types.js").ResearchBriefRef | undefined;
        sourceInputs?: import("../research-workflows/source-inputs.js").ResearchSourceInput[] | undefined;
        testArtifacts?: ReviewTestArtifact[] | undefined;
        dataArtifacts?: Omit<{
            id: string;
            digest: string;
            size: number;
            path: string;
            sourceAcceptanceId?: string;
        }, "path">[] | undefined;
        teamId: string;
        taskId: string;
        approvalId: string;
        manifestEvidenceId: string;
        testEvidenceIds: string[];
        requiredEvidenceIds: string[];
        baseSourceRevisionId?: string | undefined;
        briefArtifact: {
            id: string;
            digest: string;
            size: number;
            path: string;
        } | undefined;
        surfaceInventory: import("./review-assessment.js").ReviewInventory;
        jobId: string;
        sourceDigest: string;
        producerSessionId: string;
        id: string;
        reviewId: string;
    };
    recordReading(actor: Actor, pid: string, operation: string, input: Record<string, unknown>, output: Record<string, unknown>, callId: string): {
        reviewReadId: `${string}-${string}-${string}-${string}-${string}`;
    } | undefined;
    assertTaskCurrent(task: Row<Task>): void;
    archivedLogLimit(actor: Actor, pid: string, artifactId: string): number | undefined;
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
