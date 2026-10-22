import type { ResearchApp } from '../research-app.js';
export interface ValidationBinding {
    projectId: string;
    sessionId: string;
    kind: 'run' | 'development-job';
    id: string;
    manifestDigest: string;
    sourceDigest: string;
}
export interface ValidationResult extends ValidationBinding {
    checkedAt: string;
    receiptCheck: 'pass' | 'fail' | 'unknown' | 'not_run';
    applicability: 'current' | 'stale' | 'unknown';
    observedSourceDigest?: string;
    receipt: {
        state: string;
        integrity: string;
        exitCode: number | null;
        startedAt?: string;
        endedAt?: string;
    };
    receiptReason?: string;
    applicabilityReason?: string;
}
/** USER-only read boundary: no operations registration, execution or caller-supplied paths. */
export declare function readValidation(app: ResearchApp, b: ValidationBinding): ValidationResult;
