import type { Store } from '../storage/store.js';
import type { Artifact, ResearchBriefRef, Row, Run, Task, TaskResult, Team } from '../domain/types.js';
import { type DevelopmentAssessment } from '../development/review-assessment.js';
import { type FixedReadTarget } from '../development/fixed-review-reading.js';
export type FormalTargetKind = 'report' | 'run_source' | 'fixed_input' | 'run_artifact' | 'brief' | 'host_facts';
export interface FormalTarget {
    targetId: string;
    kind: FormalTargetKind;
    roles: FormalTargetKind[];
    path: string;
    digest: string;
    size: number;
    artifactId?: string;
    artifactRecordDigest?: string;
}
export interface FormalReportAssessment extends Omit<DevelopmentAssessment, 'stage' | 'surfaceComparisons'> {
    stage: 'post_run_report';
}
export interface FormalReportReview {
    protocolVersion: 1;
    rootSessionId: string;
    runId: string;
    manifestDigest: string;
    sourceDigest: string;
    runBindingDigest: string;
    researchBrief: ResearchBriefRef;
    methodContractDigest: string;
    reportArtifactId: string;
    reportDigest: string;
    targets: FormalTarget[];
    factsDigest: string;
    permissionEpochs: {
        epoch: number;
        hostEpoch: number;
    };
    teamId: string;
    taskId: string;
    approvalId: string;
    planDigest: string;
    taskSpecDigest: string;
    requiredEvidenceIds: string[];
    digest: string;
}
export declare function formalReviewPayload(r: FormalReportReview): {
    protocolVersion: 1;
    rootSessionId: string;
    runId: string;
    manifestDigest: string;
    sourceDigest: string;
    runBindingDigest: string;
    researchBrief: ResearchBriefRef;
    methodContractDigest: string;
    reportArtifactId: string;
    reportDigest: string;
    targets: FormalTarget[];
    factsDigest: string;
    permissionEpochs: {
        epoch: number;
        hostEpoch: number;
    };
    teamId: string;
    taskId: string;
    approvalId: string;
    planDigest: string;
    taskSpecDigest: string;
    requiredEvidenceIds: string[];
    digest?: string | undefined;
};
export declare function formalReviewInputs(r: Pick<FormalReportReview, 'protocolVersion' | 'rootSessionId' | 'runId' | 'manifestDigest' | 'sourceDigest' | 'researchBrief' | 'methodContractDigest' | 'reportArtifactId' | 'reportDigest' | 'targets' | 'factsDigest'> & {
    id: string;
}): {
    reviewId: string;
    protocolVersion: 1;
    rootSessionId: string;
    runId: string;
    manifestDigest: string;
    sourceDigest: string;
    researchBrief: ResearchBriefRef;
    methodContractDigest: string;
    reportArtifactId: string;
    reportDigest: string;
    targets: FormalTarget[];
    factsDigest: string;
};
export declare function formalTaskSpec(t: Task): any;
export declare function formalRunBinding(r: Run): {
    manifest: import("../domain/types.js").Manifest;
    manifestDigest: string;
    state: "succeeded" | "failed" | "cancelled" | "queued" | "running" | "unknown" | "submitting" | "cancelling";
    integrity: "pending" | "complete" | "incomplete" | "invalid";
    exitCode: number | null | undefined;
    artifactIds: string[];
    evidenceIds: string[];
    metrics: Record<string, number> | undefined;
    execution: import("../runners/adapter.js").RunExecution | null;
};
export declare function formalPermissionEpochs(store: Store, id: string): {
    epoch: number;
    hostEpoch: number;
};
export declare function formalArtifactText(store: Store, pid: string, id: string, maxBytes?: number): {
    artifact: Row<Artifact>;
    bytes: Buffer<ArrayBufferLike>;
    content: string;
};
export declare function formalReviewTargets(store: Store, pid: string, r: Pick<FormalReportReview, 'runId' | 'targets'>): FixedReadTarget[];
export declare function formalFacts(store: Store, pid: string, run: Row<Run>): {
    parserProfile: {
        id: string;
        delimiter: string;
        decimalEncoding: string;
        distinctLimit: number;
    };
    columnNames: string[];
    raw: {
        source: "fixed-input-cells";
        rows: number;
        columns: {
            name: string;
            missing: number;
            nonNumeric: number;
            nonFinite: number;
            finiteCount: number;
            integerCount: number;
            nonIntegerCount: number;
            min: string | null;
            max: string | null;
            distinctCount: number;
            distinctValues: string[] | null;
        }[];
        response: {
            name: string;
            missing: number;
            nonNumeric: number;
            nonFinite: number;
            finiteCount: number;
            integerCount: number;
            nonIntegerCount: number;
            min: string | null;
            max: string | null;
            distinctCount: number;
            distinctValues: string[] | null;
        };
    };
    processed: {
        source: "fixed-input-and-frozen-preprocessing";
        preprocessing: {
            duplicates: "retain" | "drop-exact";
            missing: "reject" | "drop-complete-case";
            scaling: "training-only";
        };
        duplicateEquality: "decoded-complete-cell-text-tuple";
        uniqueRows: number;
        duplicateRows: number;
        rows: number;
        excludedMissingRows: number;
        policySatisfied: boolean;
        columns: {
            name: string;
            missing: number;
            nonNumeric: number;
            nonFinite: number;
            finiteCount: number;
            integerCount: number;
            nonIntegerCount: number;
            min: string | null;
            max: string | null;
            distinctCount: number;
            distinctValues: string[] | null;
        }[];
        response: {
            name: string;
            missing: number;
            nonNumeric: number;
            nonFinite: number;
            finiteCount: number;
            integerCount: number;
            nonIntegerCount: number;
            min: string | null;
            max: string | null;
            distinctCount: number;
            distinctValues: string[] | null;
        };
    };
    runWitness: {
        source: "actual-run-archived-witness";
        trainRows: number;
        testRows: number;
        trainUnique: boolean;
        testUnique: boolean;
        disjoint: boolean;
        countsMatchProcessed: boolean;
        membership: "not-reconstructed";
    };
    limitation: string;
    runId: string;
    manifestDigest: string;
    sourceDigest: string;
    inputPath: string;
    inputDigest: string;
    methodContractDigest: string;
    ledgerDigest: string;
    witnessArtifactRefs: Array<{
        id: string;
        path: string;
        digest: string;
        size: number;
    }>;
    factsVersion: "formal-input-facts-v1";
};
export declare function assertFormalReviewCurrent(store: Store, pid: string, r: Row<FormalReportReview>): {
    run: Row<Run>;
    task: Row<Task>;
    team: Row<Team>;
};
export declare function parseFormalReportAssessment(value: unknown): FormalReportAssessment;
export declare function formalReadingChecks(store: Store, pid: string, r: Row<FormalReportReview>, task: Row<Task>): ({
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
export declare function validateFormalReportAssessment(store: Store, pid: string, r: Row<FormalReportReview>, task: Row<Task>, result: TaskResult): void;
export declare function formalReportAcceptanceBasis(store: Store, pid: string, task: Row<Task>): {
    reviewId: string;
    digest: string;
    runId: string;
    reportArtifactId: string;
    mechanicalStatus: string;
    nativeVerdict: "accept";
    scientificAcceptance: string;
} | undefined;
