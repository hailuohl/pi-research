import type { Archived, ClosedPairedQuantitative, FrozenMethodContract } from './method-contracts.js';
export declare const BEARING_PROFILE = "paired-evidence-only-v1";
export declare const BEARING_EXPORTS: readonly ["methods-facts.json", "methods-facts.md", "predictions.csv"];
export interface BearingExecution {
    sourceFiles: Array<{
        path: string;
        digest: string;
    }>;
    logs: Archived[];
    successful: boolean;
    allowHost?: boolean;
}
export interface BearingFacts {
    version: 1;
    outputProfile: typeof BEARING_PROFILE;
    stage: 'synthetic-development' | 'formal';
    contractDigest: string;
    sourceDigest: string;
    subjectId: string;
    input: unknown;
    metricArtifact: unknown;
    witnessArtifact: unknown;
    fitArtifact: unknown;
    quantities: {
        n: number;
        baselineRmse: number;
        candidateRmse: number;
        gain: number;
        standardError: number;
        lower: number;
        upper: number;
        halfWidth: number;
        unit: string;
    };
    rule: {
        minimumGain: number;
        precisionGate: null | {
            maxHalfWidth: number;
        };
        decision: string;
    };
    cases: Array<{
        id: string;
        gain: number;
        lower: number;
        upper: number;
        decision: string;
    }>;
    limits: string;
}
export declare function bearingCandidatePaths(q: ClosedPairedQuantitative): string[];
export declare function validateBearingOutputs(q: ClosedPairedQuantitative, artifacts: Archived[], hostPaths: readonly string[], execution: BearingExecution): {
    rows: Record<string, unknown>[];
    fitArtifact: {
        id: string;
        digest: string;
        size: number;
        path: string;
    };
    provenance: {
        sharedEntryPoint: string;
    };
};
export declare function bearingFacts(contract: FrozenMethodContract, q: ClosedPairedQuantitative, result: {
    sourceDigest: string;
    subjectId: string;
    metricArtifact: unknown;
    evaluation: Record<string, unknown>;
}): BearingFacts;
export declare function renderBearingFacts(f: BearingFacts): string;
export declare function bearingExports(facts: BearingFacts, rows: Array<Record<string, unknown>>, q: ClosedPairedQuantitative): Map<string, Buffer<ArrayBufferLike>>;
