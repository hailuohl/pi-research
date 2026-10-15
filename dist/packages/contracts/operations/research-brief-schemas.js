import { s } from './schema.js';
const str = { type: 'string' };
const id = s.string(100);
const array = (items, max) => s.array(items, max);
const object = (properties, optional) => s.object(properties, Object.keys(properties).filter(k => !optional?.includes(k)));
const row = (kind, properties, optional) => object({ id: str, kind: { const: kind }, projectId: s.nullable(str), version: s.integer(1), createdAt: str, updatedAt: str, ...properties }, optional);
const hypothesis = object({ statement: s.string(2000), evidenceIds: array(id, 30) });
const step = object({ title: s.string(200), description: s.string(2000) });
const brief = row('research-brief', {
    rootSessionId: id, revision: s.integer(1), previousRevisionId: id, question: s.string(4000), scope: s.string(4000, 0),
    constraints: array(s.string(1000), 16), successCriteria: array(s.string(1000), 12), clarificationQuestions: array(s.string(1000), 12),
    literatureSummary: s.string(8000, 0), hypotheses: array(hypothesis, 12), evidenceIds: array(id, 60), steps: array(step, 16),
    status: s.enum(['clarifying', 'ready', 'confirmed']), digest: s.string(64, 64),
}, ['previousRevisionId']);
export const RESEARCH_BRIEF_INPUT_SCHEMAS = {
    research_brief_save: object({
        question: s.string(4000), scope: s.string(4000, 0), constraints: array(s.string(1000), 16),
        successCriteria: array(s.string(1000), 12), clarificationQuestions: array(s.string(1000), 12),
        literatureSummary: s.string(8000, 0), hypotheses: array(hypothesis, 12), evidenceIds: array(id, 60), steps: array(step, 16),
        status: s.enum(['clarifying', 'ready']), expectedRevisionId: s.nullable(id),
    }),
    research_brief_inspect: object({ briefId: id }, ['briefId']),
    research_brief_confirm: object({ briefId: id, expectedVersion: s.integer(1, Number.MAX_SAFE_INTEGER) }),
};
export const RESEARCH_BRIEF_OUTPUT_SCHEMAS = {
    research_brief_save: brief,
    research_brief_inspect: object({
        brief: s.nullable(brief), latestId: s.nullable(id),
        history: array(object({ id, revision: s.integer(1), status: s.enum(['clarifying', 'ready', 'confirmed']), digest: s.string(64, 64) }), 20),
        evidenceChecks: array(object({ evidenceId: id, current: { type: 'boolean' }, code: s.string(100) }, ['code']), 60),
        blockedReason: s.string(100),
    }, ['blockedReason']),
    research_brief_confirm: brief,
};
//# sourceMappingURL=research-brief-schemas.js.map