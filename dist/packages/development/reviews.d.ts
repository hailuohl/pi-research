import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Task } from '../domain/types.js';
import { type ReviewTestArtifact } from './review-assessment.js';
export declare class DevelopmentReviewService {
    private app;
    constructor(app: ResearchApp);
    private access;
    private referenceBudget;
    validatePreparationBudget(actor: Actor, pid: string, value: unknown): void;
    withPreparationIntegrity<T>(actor: Actor, pid: string, value: unknown, fn: () => T): T;
    isFixedTask(task: Row<Task>): boolean;
    withTaskIntegrity<T>(task: Row<Task>, fn: () => T): T;
    operationIntegrity<T>(actor: Actor, id: string, value: unknown, pid: string, fn: () => T): T;
    prepare(actor: Actor, pid: string, value: unknown): {
        verdict?: "disputed" | "reject" | "accept" | undefined;
        reviewerSessionId?: string | undefined;
        blockingMessage?: string | undefined;
        readingChecks?: ({
            total: number;
            readComplete: boolean;
            missingIntervals: never[];
            referenceVerified: boolean;
            inspectionSatisfied: boolean;
            inspectedRanges: {
                start: number;
                end: number;
            }[];
            targetId: string;
            kind: import("./review-assessment.js").ReviewReadKind;
            path: string;
            digest: string;
            obligation: "whole-text" | "dataset-reference";
            cursorUnit: "utf16";
        } | {
            total: number;
            readComplete: boolean;
            missingIntervals: {
                start: number;
                end: number;
            }[];
            targetId: string;
            kind: import("./review-assessment.js").ReviewReadKind;
            path: string;
            digest: string;
            obligation: "whole-text" | "dataset-reference";
            cursorUnit: "utf16";
        } | {
            blockedReason: string;
            referenceVerified?: boolean | undefined;
            inspectionSatisfied?: boolean | undefined;
            inspectedRanges?: never[] | undefined;
            total: null;
            readComplete: boolean;
            missingIntervals: never[];
            targetId: string;
            kind: import("./review-assessment.js").ReviewReadKind;
            path: string;
            digest: string;
            obligation: "whole-text" | "dataset-reference";
            cursorUnit: "utf16";
        })[] | ({
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
        protocolVersion?: 2 | 1 | undefined;
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
        readingProtocol?: "fixed-obligations-v1" | undefined;
        readingObligations?: import("./review-obligations.js").ReviewObligation[] | undefined;
        briefArtifact?: {
            id: string;
            digest: string;
            size: number;
            path: string;
        } | undefined;
        surfaceInventory?: import("./review-assessment.js").ReviewInventory | undefined;
        jobId: string;
        sourceDigest: string;
        producerSessionId: string;
        id: string;
        reviewId: string;
    };
    private prepareCurrent;
    inspect(actor: Actor, pid: string, id: string): {
        verdict?: "disputed" | "reject" | "accept" | undefined;
        reviewerSessionId?: string | undefined;
        blockingMessage?: string | undefined;
        readingChecks?: ({
            total: number;
            readComplete: boolean;
            missingIntervals: never[];
            referenceVerified: boolean;
            inspectionSatisfied: boolean;
            inspectedRanges: {
                start: number;
                end: number;
            }[];
            targetId: string;
            kind: import("./review-assessment.js").ReviewReadKind;
            path: string;
            digest: string;
            obligation: "whole-text" | "dataset-reference";
            cursorUnit: "utf16";
        } | {
            total: number;
            readComplete: boolean;
            missingIntervals: {
                start: number;
                end: number;
            }[];
            targetId: string;
            kind: import("./review-assessment.js").ReviewReadKind;
            path: string;
            digest: string;
            obligation: "whole-text" | "dataset-reference";
            cursorUnit: "utf16";
        } | {
            blockedReason: string;
            referenceVerified?: boolean | undefined;
            inspectionSatisfied?: boolean | undefined;
            inspectedRanges?: never[] | undefined;
            total: null;
            readComplete: boolean;
            missingIntervals: never[];
            targetId: string;
            kind: import("./review-assessment.js").ReviewReadKind;
            path: string;
            digest: string;
            obligation: "whole-text" | "dataset-reference";
            cursorUnit: "utf16";
        })[] | ({
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
        protocolVersion?: 2 | 1 | undefined;
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
        readingProtocol?: "fixed-obligations-v1" | undefined;
        readingObligations?: import("./review-obligations.js").ReviewObligation[] | undefined;
        briefArtifact?: {
            id: string;
            digest: string;
            size: number;
            path: string;
        } | undefined;
        surfaceInventory?: import("./review-assessment.js").ReviewInventory | undefined;
        jobId: string;
        sourceDigest: string;
        producerSessionId: string;
        id: string;
        reviewId: string;
    };
    private inspectCurrent;
    recordReading(actor: Actor, pid: string, operation: string, input: Record<string, unknown>, output: Record<string, unknown>, callId: string): {
        reviewReadId: `${string}-${string}-${string}-${string}-${string}`;
    } | undefined;
    assertTaskCurrent(task: Row<Task>): void;
    archivedLogLimit(actor: Actor, pid: string, artifactId: string): number | undefined;
    fixedReadTarget(actor: Actor, pid: string, artifactId: string): import("./review-obligations.js").ReviewObligation | undefined;
    private currentRead;
    offerRead(actor: Actor, pid: string, id: string, callId: string): boolean;
    deliverRead(actor: Actor, pid: string, id: string, callId: string): void;
    replayRead(actor: Actor, pid: string, id: string): void;
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
    private assertPassedCurrent;
}
