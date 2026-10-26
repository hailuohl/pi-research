import { type SourceIntegrityContext } from '../storage/source-integrity.js';
import type { Actor, Row, Task, ResearchBriefRef } from '../domain/types.js';
import type { Store } from '../storage/store.js';
import type { ResearchSourceInput } from '../research-workflows/source-inputs.js';
import type { DevelopmentReview } from './reviews-types.js';
import type { ReviewReadKind } from './review-assessment.js';
export declare const FIXED_REVIEW_READING: "fixed-obligations-v1";
export interface ReviewObligation {
    targetId: string;
    kind: ReviewReadKind;
    path: string;
    artifactId?: string;
    digest: string;
    size: number;
    required: boolean;
    obligation: 'whole-text' | 'dataset-reference';
    sourceBinding?: {
        projectId: string;
        rootSessionId: string;
        researchBrief: ResearchBriefRef;
        input: ResearchSourceInput;
    };
}
export interface ObligationRead {
    reviewId: string;
    reviewDigest: string;
    taskId: string;
    attemptId: string;
    sessionId: string;
    generation: number;
    targetId: string;
    readKind: ReviewReadKind;
    digest: string;
    start: number;
    end: number;
    total: number;
    chunkDigest: string;
    callId: string;
    cursorUnit: 'utf16';
    readProtocol: 'legacy-utf16' | 'fixed-text-v1';
    byteStart?: number;
    byteEnd?: number;
    artifactReadId?: string;
    delivery: 'pending' | 'delivered';
    offered?: boolean;
    replayed?: boolean;
}
/** Derive every target from the pinned job/brief, never from a caller's allowlist. */
export declare function buildReadingObligations(store: Store, pid: string, r: DevelopmentReview, integrity?: SourceIntegrityContext): ReviewObligation[];
export declare function assertReadingObligations(store: Store, pid: string, r: DevelopmentReview, integrity?: SourceIntegrityContext): void;
export declare function obligationText(store: Store, pid: string, r: DevelopmentReview, t: ReviewObligation): string;
export declare function recordObligationRead(store: Store, pid: string, r: Row<DevelopmentReview>, actor: Actor, operation: string, input: Record<string, unknown>, output: Record<string, unknown>, callId: string): {
    reviewReadId: `${string}-${string}-${string}-${string}-${string}`;
    reviewReadingProtocol: "fixed-obligations-v1";
} | undefined;
export declare function obligationReads(store: Store, pid: string, r: Row<DevelopmentReview>, task: Row<Task>): Row<ObligationRead>[];
export declare function obligationChunk(store: Store, pid: string, r: DevelopmentReview, t: ReviewObligation, read: ObligationRead, requireDelivered?: boolean): string;
export declare function obligationChecks(store: Store, pid: string, r: Row<DevelopmentReview>, task: Row<Task>, integrity?: SourceIntegrityContext): ({
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
    kind: ReviewReadKind;
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
    kind: ReviewReadKind;
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
    kind: ReviewReadKind;
    path: string;
    digest: string;
    obligation: "whole-text" | "dataset-reference";
    cursorUnit: "utf16";
})[];
