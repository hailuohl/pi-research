import { AUTOMATIC_APPROVAL_REFERENCE_SCHEMA, AUTOMATIC_EXECUTION_SCHEMA } from './automatic-approval-schemas.js';
import { s } from './schema.js';
const id = s.string(100), version = s.integer(1, Number.MAX_SAFE_INTEGER);
export const RESEARCH_ACTION_INPUT_SCHEMA = { type: 'object', anyOf: [
        s.object({ kind: s.enum(['text_grant']), textGrant: s.object({ documents: s.array(s.object({ documentVersionId: id, parseResultId: id }, ['documentVersionId', 'parseResultId']), 30), pmcDocuments: s.array(s.object({ documentVersionId: id }, ['documentVersionId']), 1), maxSearches: s.integer(1, 2), expiresAt: s.string(50) }, ['documents', 'maxSearches', 'expiresAt']) }, ['kind', 'textGrant']),
        s.object({ kind: s.enum(['claim_decision']), claim: s.object({ claimId: id, expectedVersion: version, proposedDecision: s.enum(['accepted', 'rejected', 'disputed']), reason: s.string(4000), evidenceIds: s.array(id, 60) }, ['claimId', 'expectedVersion']) }, ['kind', 'claim']),
        s.object({ kind: s.enum(['report_compose']), report: s.object({ title: s.string(200), runIds: s.array(id, 100), claimIds: s.array(id, 100), publicationResultIds: s.array(id, 20), campaignIds: s.array(id, 5) }, ['title', 'runIds', 'claimIds', 'publicationResultIds']) }, ['kind', 'report']),
        s.object({ kind: s.enum(['history']), history: s.object({ kind: s.enum(['documents', 'evidence', 'claims', 'reports']) }, ['kind']) }, ['kind', 'history']),
    ] };
export const RESEARCH_ACTION_INPUT_SCHEMAS = {
    research_action_prepare: RESEARCH_ACTION_INPUT_SCHEMA,
    research_action_inspect: s.object({ requestId: id }, ['requestId']),
    research_action_decide: s.object({ requestId: id, expectedVersion: version, decision: s.enum(['confirm', 'reject', 'accepted', 'rejected', 'disputed', 'dismiss']) }, ['requestId', 'expectedVersion', 'decision']),
};
const summary = s.object({ automaticApproval: AUTOMATIC_APPROVAL_REFERENCE_SCHEMA, automaticExecution: AUTOMATIC_EXECUTION_SCHEMA, id, sessionId: id, kind: s.enum(['text_grant', 'claim_decision', 'report_compose', 'history']), state: s.enum(['pending', 'completed', 'rejected']), effectiveState: s.enum(['pending', 'completed', 'rejected', 'stale', 'expired']), expiresAt: s.string(50), resultRef: { anyOf: [s.object({ grantId: id }, ['grantId']), s.object({ reportId: id }, ['reportId'])] } }, ['id', 'sessionId', 'kind', 'state', 'effectiveState', 'expiresAt']);
export const RESEARCH_ACTION_OUTPUT_SCHEMAS = { research_action_prepare: summary, research_action_inspect: summary, research_action_decide: summary };
//# sourceMappingURL=research-action-schemas.js.map