import type { Store } from '../storage/store.js';
import type { Actor, Row, Task, TaskResult } from '../domain/types.js';
import type { DevelopmentReview } from './reviews-types.js';
export declare const DEVELOPMENT_REVIEW_PROTOCOL: 1;
export declare const BEARING_REVIEW_PROTOCOL: 2;
export declare const ASSESSMENT_AREAS: readonly ["implementation_and_tests", "input_evidence", "independent_units_and_intervals", "threshold_interpretation", "claim_boundaries"];
type Area = typeof ASSESSMENT_AREAS[number];
interface ReviewReference {
    readId: string;
    quote: string;
}
export interface SurfaceComparison {
    targetId: string;
    assertions: Array<{
        claim: ReviewReference;
        authority: ReviewReference;
        caseId: string;
        finding: string;
        conclusion: 'consistent' | 'contradiction' | 'unresolved';
    }>;
}
export interface DevelopmentAssessment {
    stage: 'pre_run';
    checks: Array<{
        area: Area;
        finding: string;
        references: ReviewReference[];
        blockingGaps: string[];
    }>;
    deferredChecks: string[];
    surfaceComparisons?: SurfaceComparison[];
}
export interface ReviewTestArtifact {
    id: string;
    digest: string;
    size: number;
    path: string;
    required: boolean;
}
export interface ReviewInventory {
    profile: 'paired-evidence-review-v1';
    items: Array<{
        targetId: string;
        kind: ReviewReadKind;
        path: string;
        digest: string;
        size: number;
        artifactId?: string;
        openSurface: boolean;
        verification: 'host-derived' | 'profile-checked-raw-evidence' | 'unverified-open-text' | 'fixed-source';
    }>;
    caseIds: string[];
}
export type ReviewReadKind = 'candidate' | 'source_input' | 'test_artifact' | 'brief';
interface Target {
    targetId: string;
    kind: ReviewReadKind;
    path: string;
    digest: string;
    artifactId?: string;
    read: () => string;
    required: boolean;
}
export declare function parseDevelopmentAssessment(value: unknown): DevelopmentAssessment;
export declare function reviewReadingTargets(store: Store, pid: string, r: DevelopmentReview): Target[];
export declare function buildReviewInventory(store: Store, pid: string, r: DevelopmentReview): ReviewInventory;
/** Called only after output validation, inside the successful operation receipt transaction. */
export declare function recordReviewRead(store: Store, actor: Actor, r: Row<DevelopmentReview>, operation: string, input: Record<string, unknown>, output: Record<string, unknown>, callId: string): {
    reviewReadId: `${string}-${string}-${string}-${string}-${string}`;
} | undefined;
export declare function reviewReadingChecks(store: Store, pid: string, r: Row<DevelopmentReview>, task: Row<Task>): ({
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
export declare function validateDevelopmentAssessment(store: Store, pid: string, r: Row<DevelopmentReview>, task: Row<Task>, result: TaskResult): void;
export {};
