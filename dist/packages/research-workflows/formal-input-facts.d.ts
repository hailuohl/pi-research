import { type PairedPlanQuantitative, type ClosedPairedQuantitative } from './method-contracts.js';
export interface FormalFactsBinding {
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
}
export declare function computeFormalInputFacts(bytes: Buffer, q: PairedPlanQuantitative | ClosedPairedQuantitative, binding: FormalFactsBinding, witness: unknown, fit: unknown): {
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
export type FormalInputFacts = ReturnType<typeof computeFormalInputFacts>;
export declare function renderFormalInputFacts(f: FormalInputFacts): string;
