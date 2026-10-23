import { s } from './schema.js';
const common = { sourceId: s.string(100), sourceDigest: s.string(64, 64), expectedVersion: s.integer(1) };
const approval = { approvalId: s.string(100), expectedApprovalVersion: s.integer(1) };
export const WORKFLOW_CONFIRM_INPUT = { anyOf: [
        s.object({ ...common, sourceKind: { const: 'brief' } }, ['sourceKind', 'sourceId', 'sourceDigest', 'expectedVersion']),
        s.object({ ...common, ...approval, sourceKind: { enum: ['campaign', 'change'] } }, ['sourceKind', 'sourceId', 'sourceDigest', 'expectedVersion', 'approvalId', 'expectedApprovalVersion']),
    ] };
export const WORKFLOW_STATUS_SCHEMA = s.object({
    id: s.string(100), sourceKind: { enum: ['brief', 'campaign', 'change'] }, sourceId: s.string(100), sourceDigest: s.string(64, 64),
    route: { enum: ['workflow', 'existing-handoff'] }, state: { enum: ['blocked', 'pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'superseded'] },
    reasonCode: s.string(100), reason: s.string(500), resultId: s.string(100),
}, ['id', 'sourceKind', 'sourceId', 'sourceDigest', 'route', 'state']);
//# sourceMappingURL=workflow-continuation-schemas.js.map