import { s } from './schema.js';
const str = { type: 'string' }, num = { type: 'integer' }, arr = (items) => ({ type: 'array', items });
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const row = (kind, p) => obj({ id: str, kind: { const: kind }, projectId: s.nullable(str), version: num, createdAt: str, updatedAt: str, ...p });
export const SKILL_REQUIREMENTS_SCHEMA = obj({ tools: arr(str), backends: arr(str), artifactIds: arr(str) });
const roles = s.enum(['coordinator', 'literature', 'designer', 'implementer', 'analyst', 'reviewer', 'writer']);
const file = s.object({ path: str, digest: str, size: num, mediaType: { const: 'image/png' } }, ['path', 'digest', 'size']);
const revision = row('skill-package-revision', { packageId: str, revisionTag: str, description: str, roles: arr(roles), license: s.nullable(str), requirements: SKILL_REQUIREMENTS_SCHEMA, files: arr(file), contentDigest: str, authorization: s.enum(['text-only', 'text-with-static-assets']) });
const review = row('skill-review', { revisionId: str, contentDigest: str, decision: s.enum(['approved', 'rejected']), note: str });
const revocation = row('skill-revocation', { revisionId: str, contentDigest: str, note: str });
const configuration = obj({ version: num, bundleId: str, builtinBundleId: str, revisionIds: arr(str), disabledBuiltinIds: arr(str) }), inspection = obj({ revision, reviews: arr(review), revocations: arr(revocation) });
// Old durable configuration receipts retain their original wire shape on replay.
const configurationReply = s.object({ version: num, bundleId: str, builtinBundleId: str, revisionIds: arr(str), disabledBuiltinIds: arr(str) }, ['version', 'bundleId', 'revisionIds']);
const builtinRelease = obj({ bundleId: str, current: s.boolean(), skillCount: num });
const builtinSkill = obj({ id: str, description: str, digest: str, resources: arr(str), source: obj({ repository: str, commit: str, path: str, blob: str }) });
const preflight = obj({ sessionId: str, version: num, skillBundleId: s.nullable(str), skillIds: arr(str), ready: s.boolean(), missing: arr(obj({ skillId: str, kind: s.enum(['tool', 'backend', 'artifact', 'binding']), value: str, reason: str })) });
const id = s.string(100);
export const SKILL_INPUT_SCHEMAS = {
    skill_package_import: s.object({ packageId: id, revisionTag: s.string(100), description: s.string(2000), roles: s.array(roles, 7, 1), license: s.nullable(s.string(2000)), requirements: s.object({ tools: s.array(s.string(1000), 100), backends: s.array(s.string(1000), 30), artifactIds: s.array(s.string(1000), 64) }, ['tools', 'backends', 'artifactIds']), files: s.array(s.object({ path: s.string(200), contentBase64: s.string(174764, 0) }, ['path', 'contentBase64']), 64, 1), zipBase64: s.string(2796204) }, ['packageId', 'revisionTag', 'description', 'roles', 'license', 'requirements']),
    skill_package_list: s.object({}), skill_package_inspect: s.object({ revisionId: id }, ['revisionId']), skill_package_read: s.object({ revisionId: id, resource: s.string(200) }, ['revisionId']),
    skill_package_review: s.object({ revisionId: id, decision: s.enum(['approved', 'rejected']), note: s.string(4000) }, ['revisionId', 'decision', 'note']), skill_package_revoke: s.object({ revisionId: id, note: s.string(4000) }, ['revisionId', 'note']),
    skill_package_delete: s.object({ revisionId: id, expectedVersion: s.integer(0) }, ['revisionId', 'expectedVersion']),
    skill_bundle_configure: s.object({ expectedVersion: s.integer(0), revisionIds: s.array(id, 64), bundleId: id, builtinBundleId: id, disabledBuiltinIds: s.array(id, 64) }, ['expectedVersion']),
    skill_session_select: s.object({ sessionId: id, expectedVersion: s.integer(1), skillIds: s.array(id, 32) }, ['sessionId', 'expectedVersion', 'skillIds']), skill_preflight: s.object({ sessionId: id }, ['sessionId']),
};
const textResource = s.object({ revisionId: str, resource: str, content: str, digest: str }, ['revisionId', 'resource', 'content', 'digest']);
const imageResource = s.object({ revisionId: str, resource: str, digest: str, mediaType: { const: 'image/png' }, contentBase64: str }, ['revisionId', 'resource', 'digest', 'mediaType', 'contentBase64']);
export const SKILL_OUTPUT_SCHEMAS = { skill_package_import: revision, skill_package_list: obj({ configuration, revisions: arr(inspection), builtinReleases: arr(builtinRelease), builtinSkills: arr(builtinSkill) }), skill_package_inspect: inspection, skill_package_read: { anyOf: [textResource, imageResource] }, skill_package_review: review, skill_package_revoke: revocation, skill_package_delete: configuration, skill_bundle_configure: configurationReply, skill_session_select: preflight, skill_preflight: preflight };
//# sourceMappingURL=skill-schemas.js.map