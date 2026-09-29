import { PUBLICATION_REVIEW_SCHEMA } from './publication-schemas.js';
import { s } from './schema.js';
const id = s.string(100), string = { type: 'string' }, number = { type: 'number' }, integer = { type: 'integer' };
const array = (items) => ({ type: 'array', items });
const object = (properties, optional) => ({ type: 'object', properties, required: Object.keys(properties).filter(k => !optional?.includes(k)), additionalProperties: false });
const document = object({ documentVersionId: string, rawDigest: string, parseResultId: string, pageNumber: integer, textArtifactDigest: string, start: integer, end: integer, pageLabel: { anyOf: [string, { type: 'null' }] }, rawArtifactId: string, imageArtifactId: string });
const providerText = object({ documentVersionId: string, documentDigest: string, rawDigest: string, textArtifactDigest: string, reportedVersion: string, start: integer, end: integer, rawArtifactId: string, textArtifactId: string });
const reference = object({ id: string, type: s.enum(['run', 'run-source', 'artifact', 'evidence', 'development-job', 'development-review', 'claim', 'publication', 'figure-source', 'figure-source-code', 'publication-review', 'research-comparison', 'experiment-plan']), targetId: string, label: string, runId: string, path: string, digest: string, relation: s.enum(['exact', 'ancestry']), document, providerText }, ['runId', 'path', 'digest', 'relation', 'document', 'providerText']);
const publication = object({ resultId: string, jobId: string, revisionId: string, title: string, sourceDigest: string, pdfArtifactId: string, pdfDigest: string, pages: integer, referenceId: string });
const publicationReviews = object({ resultId: string, reviewIds: array(string), reviews: array({ ...PUBLICATION_REVIEW_SCHEMA, properties: { ...PUBLICATION_REVIEW_SCHEMA.properties, referenceId: string }, required: [...PUBLICATION_REVIEW_SCHEMA.required, 'referenceId'] }) });
export const REPORT_INPUT_SCHEMAS = {
    report_create: s.object({ title: s.string(200), runIds: s.array(id, 100), claimIds: s.array(id, 100), publicationResultIds: s.array(id, 20), campaignIds: s.array(id, 5) }),
    report_inspect: s.object({ reportId: id }, ['reportId']),
    report_reference_read: s.object({ reportId: id, referenceId: id, cursor: s.integer(0, Number.MAX_SAFE_INTEGER), limit: s.integer(1, 64000) }, ['reportId', 'referenceId']),
    report_export: s.object({ reportId: id }, ['reportId']),
};
export const REPORT_OUTPUT_SCHEMAS = {
    report_inspect: object({ id: string, artifactId: string, title: string, formatVersion: s.enum([0, 1]), integrity: s.enum(['verified', 'invalid']), validity: s.enum(['current', 'stale', 'legacy']), reasons: array(string), references: array(reference), runs: array(object({ runId: string, experimentId: string, revision: integer, state: s.enum(['succeeded', 'failed', 'cancelled']), integrity: s.enum(['pending', 'complete', 'incomplete', 'invalid']), judgment: s.enum(['pending', 'supported', 'not_supported', 'inconclusive']), sourceDigest: string, gitCommit: string, metrics: array(object({ name: string, value: number, unit: string, referenceId: string })) }, ['gitCommit'])), publications: array(publication), publicationReviews: array(publicationReviews), researchCampaigns: array(object({ campaignId: string, state: string, primaryMetric: string, unit: string, conclusion: s.enum(['requires_review']), referenceId: string, planReferences: array(object({ planRevisionId: string, referenceId: string })) })) }, ['publications', 'publicationReviews', 'researchCampaigns']),
    report_reference_read: object({ reference, content: string, mediaType: string, cursor: integer, end: integer, complete: { type: 'boolean' } }),
};
//# sourceMappingURL=report-schemas.js.map