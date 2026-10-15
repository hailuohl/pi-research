import type { Run, Row } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
import type { RunObservation } from './types.js';
export declare function runContentDigest(run: Row<Run>): string;
/** Verify actual immutable metric artifacts, not merely the existence of a database reference. */
export declare function inspectObservation(run: Row<Run>, evidence: EvidenceService): Pick<RunObservation, 'validation' | 'explanation' | 'metrics'>;
