import type { Run, Row } from '../domain/types.js';
import type { EvidenceService } from './service.js';
/** Shared report/observation verifier; persistence status alone is never proof. */
export declare function verifyRunRecord(run: Row<Run>, evidence: EvidenceService): Record<string, number> | undefined;
