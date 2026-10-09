import { s } from './schema.js';
import { WORKING_GRANT_REFERENCE_SCHEMA } from './working-grant-schemas.js';
import { RUN_GRANT_REFERENCE_SCHEMA } from './run-grant-schemas.js';
const id = s.string(100);
export const FULL_ACCESS_REFERENCE_SCHEMA = s.object({ continuationId: id, digest: id });
export const AUTOMATION_APPROVAL_SCHEMA = s.object({ id, kind: { const: 'approval' }, projectId: id, version: s.integer(1), createdAt: s.string(100), updatedAt: s.string(100), subjectKind: id, subjectId: id, digest: id, scope: id, status: s.enum(['pending', 'approved', 'rejected', 'stale']), reason: s.string(10000), decidedAt: s.string(100), fullAccess: FULL_ACCESS_REFERENCE_SCHEMA, workingGrant: WORKING_GRANT_REFERENCE_SCHEMA, runGrant: RUN_GRANT_REFERENCE_SCHEMA }, ['id', 'kind', 'projectId', 'version', 'createdAt', 'updatedAt', 'subjectKind', 'subjectId', 'digest', 'scope', 'status', 'reason']);
//# sourceMappingURL=research-automation-schemas.js.map