import type { Row, Run } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
/** Collect first, then derive completeness exclusively from the immutable archive. */
export declare function collectRunArtifacts(run: Row<Run>, evidence: EvidenceService): {
    artifactIds: string[];
    evidenceIds: string[];
    metrics: Record<string, number> | undefined;
    integrity: "complete" | "incomplete" | "invalid";
    errors: string[];
};
