import { ensure } from '../domain/errors.js';
import { withSourceIntegrity, sourceIntegrityScope } from '../storage/source-integrity.js';
const scopeId = (jobId) => `development-review:${jobId}`;
export const currentReviewIntegrity = (store, jobId) => sourceIntegrityScope(store, scopeId(jobId));
export function withReviewIntegrity(store, pid, jobId, inputs, mode, fn) {
    const blobs = (inputs ?? []).filter(i => i.purpose === 'dataset-reference').map(i => { const a = store.get('artifact', i.artifactId, pid); ensure(a.digest === i.digest && a.size === i.size, 'ARTIFACT_CORRUPTED', '审查数据引用与原件身份不符'); return { blobPath: a.path, digest: a.digest, size: a.size }; });
    return withSourceIntegrity(store, scopeId(jobId), mode, blobs, fn);
}
//# sourceMappingURL=review-integrity.js.map