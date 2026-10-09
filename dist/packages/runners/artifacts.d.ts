import type { Row, Run } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
import type { DataPaths } from '../storage/data-paths.js';
/** Collect first, then derive completeness exclusively from the immutable archive. */
export declare function collectRunArtifacts(run: Row<Run>, evidence: EvidenceService, paths?: DataPaths): {
    artifactIds: string[];
    evidenceIds: string[];
    metrics: Record<string, number> | undefined;
    integrity: "complete" | "incomplete" | "invalid";
    errors: string[];
};
