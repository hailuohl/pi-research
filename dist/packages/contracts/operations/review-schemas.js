import { s } from './schema.js';
const id = s.string(100), digest = { ...s.string(64), minLength: 64, pattern: '^[a-f0-9]{64}$' }, position = s.integer(0, Number.MAX_SAFE_INTEGER);
const metadata = { reviewId: id, jobId: id, sourceDigest: digest };
const file = { path: s.string(1000), size: position, digest, mode: s.enum(['100644', '100755']) };
const review = s.object({ id, ...metadata, producerSessionId: id, baseSourceRevisionId: id, teamId: id, taskId: id, approvalId: id, manifestEvidenceId: id, testEvidenceIds: s.array(id, 10), requiredEvidenceIds: s.array(id, 20), digest, status: s.enum(['awaiting_approval', 'pending', 'running', 'passed', 'rejected', 'disputed', 'failed', 'stale']), reviewerSessionId: id, verdict: s.enum(['accept', 'reject', 'disputed']) }, ['id', 'reviewId', 'jobId', 'sourceDigest', 'producerSessionId', 'teamId', 'taskId', 'approvalId', 'manifestEvidenceId', 'testEvidenceIds', 'requiredEvidenceIds', 'digest', 'status']);
export const REVIEW_INPUT_SCHEMAS = {
    development_review_prepare: s.object({ jobId: id }, ['jobId']),
    development_review_inspect: s.object({ reviewId: id }, ['reviewId']),
    development_review_source_list: s.object({ reviewId: id }, ['reviewId']),
    development_review_source_read: s.object({ reviewId: id, path: s.string(1000), cursor: position, limit: s.integer(1, 64000) }, ['reviewId', 'path']),
};
export const REVIEW_OUTPUT_SCHEMAS = {
    development_review_prepare: review, development_review_inspect: review,
    development_review_source_list: s.object({ ...metadata, files: s.array(s.object(file, ['path', 'size', 'digest']), 5000) }, ['reviewId', 'jobId', 'sourceDigest', 'files']),
    development_review_source_read: s.object({ ...metadata, ...file, cursor: position, end: position, complete: s.boolean(), content: s.string(64000, 0) }, ['reviewId', 'jobId', 'sourceDigest', 'path', 'size', 'digest', 'cursor', 'end', 'complete', 'content']),
};
//# sourceMappingURL=review-schemas.js.map