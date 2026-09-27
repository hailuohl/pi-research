import {verifyRunRecord} from '../evidence/run-verifier.js';
import type { Run, Row } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
import { digest } from '../storage/store.js';
import { ensure, asError } from '../domain/errors.js';
import type { RunObservation } from './types.js';

export function runContentDigest(run: Row<Run>): string {
    // Heartbeats/row versions are operational noise, not research input changes.
    return digest({ id: run.id, manifestDigest: run.manifestDigest, state: run.state,
        integrity: run.integrity, metrics: run.metrics ?? {}, evidenceIds: run.evidenceIds,
        artifactIds: run.artifactIds });
}

/** Verify actual immutable metric artifacts, not merely the existence of a database reference. */
export function inspectObservation(run: Row<Run>, evidence: EvidenceService):
    Pick<RunObservation, 'validation' | 'explanation' | 'metrics'> {
    try {
        const metrics = verifyRunRecord(run, evidence);
        if (run.integrity !== 'complete' || run.state !== 'succeeded') {
            return {validation: run.integrity === 'invalid' ? 'invalid' : 'incomplete', explanation: '执行或产物不完整；保留证据，不自动晋级。', metrics: {}};
        }
        return { validation: 'verified', explanation: '指标和全部必需产物已核验；科研解释仍需审核。', metrics: {...metrics} };
    } catch (error) { return {validation: 'invalid', explanation: asError(error).message, metrics: {}}; }
}
