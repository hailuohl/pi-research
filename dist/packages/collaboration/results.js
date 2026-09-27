import { object, text, strings, oneOf } from '../contracts/validation.js';
import { ensure } from '../domain/errors.js';
export function parseTaskResult(value) {
    const x = object(value);
    ensure(Array.isArray(x.claims ?? []) && (x.claims ?? []).length <= 24, 'INVALID_INPUT', '结论候选需要数组且不超过24条', 400);
    return { summary: text(x.summary, 'summary', 16000), outcome: oneOf(x.outcome, ['completed', 'partial', 'blocked'], 'outcome'), evidenceIds: strings(x.evidenceIds ?? [], 'evidenceIds', 100), artifactIds: strings(x.artifactIds ?? [], 'artifactIds', 100), claims: (x.claims ?? []).map(raw => { const p = object(raw); return { statement: text(p.statement, 'statement', 8000), evidenceIds: strings(p.evidenceIds, 'evidenceIds', 100), limitations: strings(p.limitations ?? [], 'limitations', 30) }; }), unresolvedQuestions: strings(x.unresolvedQuestions ?? [], 'unresolvedQuestions', 30), ...(x.verdict ? { verdict: oneOf(x.verdict, ['accept', 'reject', 'disputed'], 'verdict') } : {}) };
}
/** Enforce the declared deliverables, rather than trusting a model's outcome. */
export function validateDeliverables(task, result, read) {
    if (result.outcome !== 'completed')
        return;
    const artifacts = result.artifactIds.map(read);
    for (const o of task.expectedOutputs ?? []) {
        const matches = artifacts.filter(({ artifact: a }) => a.taskId === task.id &&
            (!o.title || a.title === o.title) && (!o.mediaType || a.mediaType === o.mediaType) &&
            (o.title || o.mediaType || (o.schemaId === 'csv' ? a.mediaType === 'text/csv' :
                o.schemaId === 'json' ? a.mediaType === 'application/json' :
                    o.schemaId === 'report' ? /^(text\/markdown|text\/plain)$/.test(a.mediaType) : true)));
        if (!matches.length && !o.required)
            continue;
        ensure(matches.length > 0, 'TASK_OUTPUT_MISSING', `缺少必需产物：${o.title ?? o.kind}`, 400);
        ensure(matches.some(({ bytes }) => {
            if (bytes.length < (o.minBytes ?? 1) || !bytes.toString('utf8').trim())
                return false;
            if (o.schemaId === 'json') {
                try {
                    JSON.parse(bytes.toString('utf8'));
                }
                catch {
                    return false;
                }
            }
            if (o.schemaId === 'csv' && bytes.toString('utf8').trim().split(/\r?\n/).length < 2)
                return false;
            return true;
        }), 'TASK_OUTPUT_INVALID', `产物未满足非空/格式合同：${o.title ?? o.kind}`, 400);
    }
    if (task.acceptanceRuleIds?.includes('artifact-required'))
        ensure(artifacts.some(a => a.artifact.taskId === task.id && a.bytes.length > 0), 'TASK_OUTPUT_MISSING', '任务必须交付自己的非空产物', 400);
    if (task.acceptanceRuleIds?.includes('evidence-required'))
        ensure(result.evidenceIds.length > 0, 'EVIDENCE_REQUIRED', '任务验收要求原始证据', 400);
}
//# sourceMappingURL=results.js.map