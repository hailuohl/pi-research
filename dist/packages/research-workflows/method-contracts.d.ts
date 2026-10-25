import { BEARING_PROFILE, type BearingExecution, type BearingFacts } from './bearing-outputs.js';
import type { Actor, Row, Session } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import { type Store } from '../storage/store.js';
import type { ResearchSourceInput } from './source-inputs.js';
import type { DraftFile } from './draft-reads.js';
import type { SandboxJob } from '../execution/contracts.js';
import { type SyntheticFixtureRef, type SyntheticFixtureContext, type SyntheticFixtureBinding, FIXTURE_PROFILE } from './synthetic-fixtures.js';
export declare const METHOD_COMPILER = "method-contract-v1";
export declare const METHOD_ARTIFACTS: readonly ["methods-protocol.md", "methods-ledger.json", "methods-boundaries.json", "methods-results.json"];
export type MethodRequirement = 'literature-identity' | 'quantitative-decision' | 'structured-paired-protocol' | 'closed-paired-evidence';
interface PairedRmseQuantitative {
    type: 'comparison';
    template: 'paired-rmse-delta-v1';
    outcomeUnit: string;
    witness: {
        artifactPath: string;
        recordsPointer: string;
        idField: string;
        observedField: string;
        baselinePredictionField: string;
        candidatePredictionField: string;
    };
    metrics: {
        baselineRmse: string;
        candidateRmse: string;
        gain: string;
    };
    minimumGain: number;
    decisionOutputs?: Array<{
        artifactPath: string;
        jsonPointer: string;
    }>;
}
export interface PairedPlanQuantitative extends Omit<PairedRmseQuantitative, 'template'> {
    template: 'paired-rmse-plan-v1';
    precisionGate: null | {
        maxHalfWidth: number;
    };
    developmentData: {
        mode: 'host-synthetic-only';
        profile: typeof FIXTURE_PROFILE;
        fixtureRef: SyntheticFixtureRef;
        inputArgumentIndex: number;
    };
    plan: {
        formalInput: {
            path: string;
            digest: string;
            predictorField: string;
            outcomeField: string;
        };
        models: {
            baseline: {
                family: 'polynomial';
                degree: 1;
            };
            candidate: {
                family: 'polynomial';
                degree: 2;
            };
        };
        preprocessing: {
            duplicates: 'retain' | 'drop-exact';
            missing: 'reject' | 'drop-complete-case';
            scaling: 'training-only';
        };
        split: {
            testFraction: number;
            seed: number;
        };
    };
    provenanceArtifact: string;
}
export interface ClosedPairedQuantitative extends Omit<PairedPlanQuantitative, 'template' | 'decisionOutputs'> {
    template: 'paired-rmse-plan-v2';
    outputProfile: typeof BEARING_PROFILE;
    fitImplementation: {
        path: string;
        entryPoint: string;
    };
    decisionOutputs?: never;
}
type PlanQuantitative = PairedPlanQuantitative | ClosedPairedQuantitative;
export declare function isPlan(q: MethodSpecification['quantitative']): q is PlanQuantitative;
export declare function closedPaired(contract: FrozenMethodContract | undefined): ClosedPairedQuantitative | undefined;
export declare function methodHostPaths(contract: FrozenMethodContract): string[];
export interface DraftRole {
    path: string;
    role: 'protocol' | 'implementation' | 'notes';
}
export interface ProtocolDocument {
    path: string;
    digest: string;
    compilerVersion: string;
}
export interface MethodSpecification {
    version: 1;
    literatureSources: Array<{
        path: string;
        digest: string;
        recordsPointer: string;
        recordIdField: string;
        doiField: string;
    }>;
    quantitative: {
        type: 'descriptive';
    } | {
        type: 'comparison';
        template: 'positive-benefit-v1';
        gain: {
            metric: string;
            unit: string;
        };
        interval: {
            lowerMetric: string;
            upperMetric: string;
            unit: string;
        };
        minimumGain: number;
        decisionOutputs?: Array<{
            artifactPath: string;
            jsonPointer: string;
        }>;
    } | PairedRmseQuantitative | PairedPlanQuantitative | ClosedPairedQuantitative;
}
export type MethodDecision = 'criterion_met' | 'nonpositive_estimate' | 'inconclusive';
export interface LiteratureLedger {
    sources: MethodSpecification['literatureSources'];
    records: Array<{
        sourcePath: string;
        sourceDigest: string;
        pointer: string;
        recordIdentity: string;
        recordId: string | null;
        doi: string | null;
        reportCandidateId: string;
        studyIdentity: 'unknown';
    }>;
    recordsObserved: number;
    reportCandidates: number;
    confirmedStudyMappings: 0;
    totalStudies: null;
}
export interface FrozenMethodContract {
    specification: MethodSpecification;
    compilerVersion: string;
    contractDigest: string;
    protocolPath: string;
    protocolDigest: string;
    literatureLedger: LiteratureLedger;
    boundaryExamples: Array<{
        gain: number;
        lower: number;
        upper: number;
        decision: MethodDecision;
        halfWidth?: number;
        precisionGate?: null | {
            maxHalfWidth: number;
        };
    }>;
}
type Source = Pick<ResearchSourceInput, 'path' | 'digest' | 'size'> & {
    bytes?: Buffer;
    verifiedReference?: true;
};
export type Archived = {
    id: string;
    digest: string;
    size: number;
    title: string;
    bytes: Buffer;
    origin?: string;
    runId?: string;
};
export declare function atPointer(value: unknown, path: string): unknown;
export declare function parseMethodSpecification(value: unknown): MethodSpecification;
export declare function normalizeDoi(value: unknown): string | null;
export declare function evaluatePlanPredicate(q: PlanQuantitative, gain: number, lower: number, upper: number): {
    halfWidth: number;
    precisionGate: {
        maxHalfWidth: number;
    } | null;
    decision: MethodDecision;
};
export declare function evaluateMethod(spec: MethodSpecification, metrics: Record<string, number>): {
    type: "descriptive";
    comparisonVerified: false;
    inputs?: undefined;
    decision?: undefined;
} | {
    type: "comparison";
    comparisonVerified: true;
    inputs: {
        gain: number;
        lower: number;
        upper: number;
    };
    decision: MethodDecision;
};
export declare function compileMethodContract(value: unknown, sources: Source[]): {
    specification: MethodSpecification;
    compilerVersion: string;
    contractDigest: string;
    protocol: string;
    protocolDigest: string;
    literatureLedger: LiteratureLedger;
    boundaryExamples: {
        gain: number;
        lower: number;
        upper: number;
        decision: MethodDecision;
        halfWidth?: number;
        precisionGate?: null | {
            maxHalfWidth: number;
        };
    }[];
};
export declare function assertFrozenMethod(store: Store, pid: string, contract: FrozenMethodContract | undefined, inputs: ResearchSourceInput[] | undefined, rootSessionId?: string, phase?: 'formal'): {
    specification: MethodSpecification;
    compilerVersion: string;
    contractDigest: string;
    protocol: string;
    protocolDigest: string;
    literatureLedger: LiteratureLedger;
    boundaryExamples: {
        gain: number;
        lower: number;
        upper: number;
        decision: MethodDecision;
        halfWidth?: number;
        precisionGate?: null | {
            maxHalfWidth: number;
        };
    }[];
} | undefined;
export declare function assertMethodSnapshot(contract: FrozenMethodContract | undefined, files: Array<{
    path: string;
    digest: string;
    size: number;
}>, phase?: 'formal'): void;
export declare function methodSyntheticFixture(contract: FrozenMethodContract | undefined): SyntheticFixtureBinding | undefined;
export declare function validateProtocolRoles(contract: FrozenMethodContract | undefined, drafts: DraftFile[] | undefined, input: unknown): DraftRole[] | undefined;
export declare function methodRequiredPaths(contract: FrozenMethodContract): string[];
export declare function methodResult(contract: FrozenMethodContract, metric: Archived, metrics: Record<string, number>, binding: {
    sourceDigest: string;
    subjectId: string;
}, artifacts: Archived[], fixture?: SyntheticFixtureContext, execution?: BearingExecution): {
    facts?: BearingFacts | undefined;
    metricArtifact: {
        id: string;
        digest: string;
        size: number;
        path: string;
    };
    evaluation: {
        type: "descriptive";
        comparisonVerified: false;
        inputs?: undefined;
        decision?: undefined;
    } | {
        type: "comparison";
        comparisonVerified: true;
        inputs: {
            gain: number;
            lower: number;
            upper: number;
        };
        decision: MethodDecision;
    } | {
        type: "comparison";
        template: "paired-rmse-plan-v2" | "paired-rmse-plan-v1" | "paired-rmse-delta-v1";
        measurementVerification: "paired-prediction-witness";
        intervalMethod: string;
        witnessArtifact: {
            id: string;
            digest: string;
            size: number;
            path: string;
            recordsPointer: string;
        };
        n: number;
        baselineRmse: number;
        candidateRmse: number;
        gain: number;
        standardError: number;
        lower: number;
        upper: number;
        outcomeUnit: string;
        decision: MethodDecision;
    };
    boundaryExamples: {
        gain: number;
        lower: number;
        upper: number;
        decision: MethodDecision;
        halfWidth?: number;
        precisionGate?: null | {
            maxHalfWidth: number;
        };
    }[];
    sourceDigest: string;
    subjectId: string;
    compilerVersion: string;
    contractDigest: string;
    protocolDigest: string;
};
export declare function methodAttachments(contract: FrozenMethodContract, protocolText: string, result: unknown, artifacts?: Archived[]): Map<string, Buffer<ArrayBufferLike>>;
export declare function assertMethodArchive(contract: FrozenMethodContract, protocolText: string, metric: Archived, metrics: Record<string, number>, binding: {
    sourceDigest: string;
    subjectId: string;
}, artifacts: Archived[], fixture?: SyntheticFixtureContext, execution?: BearingExecution): void;
export declare function assertDevelopmentMethodArchive(store: Store, job: Row<SandboxJob>, contract: FrozenMethodContract | undefined, protocolText: string | undefined): void;
export declare class MethodContractService {
    private app;
    constructor(app: ResearchApp);
    recordSkillRead(actor: Actor, selected: Row<Session> | undefined, value: unknown): void;
    requirements(s: Row<Session>, inherited?: MethodRequirement[]): MethodRequirement[];
    supports(s: Row<Session>): boolean;
    assertSelected(s: Row<Session>, contract: FrozenMethodContract | undefined, required?: MethodRequirement[]): void;
    preview(s: Row<Session>, specification: unknown, inputs: ResearchSourceInput[] | undefined): {
        specification: MethodSpecification;
        compilerVersion: string;
        contractDigest: string;
        protocol: string;
        protocolDigest: string;
        literatureLedger: LiteratureLedger;
        boundaryExamples: {
            gain: number;
            lower: number;
            upper: number;
            decision: MethodDecision;
            halfWidth?: number;
            precisionGate?: null | {
                maxHalfWidth: number;
            };
        }[];
    };
    compile(actor: Actor, pid: string, sessionId: string, value: unknown): {
        specification: MethodSpecification;
        compilerVersion: string;
        contractDigest: string;
        protocol: string;
        protocolDigest: string;
        literatureLedger: LiteratureLedger;
        boundaryExamples: {
            gain: number;
            lower: number;
            upper: number;
            decision: MethodDecision;
            halfWidth?: number;
            precisionGate?: null | {
                maxHalfWidth: number;
            };
        }[];
    };
    freeze(s: Row<Session>, value: unknown, inputs: ResearchSourceInput[], drafts: DraftFile[] | undefined): FrozenMethodContract;
    validateReady(s: Row<Session>, value: unknown, inputs: ResearchSourceInput[] | undefined, drafts: DraftFile[] | undefined, inherited: FrozenMethodContract | undefined, required: MethodRequirement[], roles: unknown): void;
}
export {};
