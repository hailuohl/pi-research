import { ensure } from '../domain/errors.js';
export const BEARING_PROFILE = 'paired-evidence-only-v1';
export const BEARING_EXPORTS = ['methods-facts.json', 'methods-facts.md', 'predictions.csv'];
function exact(value, keys, label) { ensure(value !== null && typeof value === 'object' && !Array.isArray(value), 'METHOD_OUTPUT_PROFILE_INVALID', `${label}必须为闭合JSON对象`); const x = value; ensure(Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k)), 'METHOD_OUTPUT_PROFILE_INVALID', `${label}只接受字段 ${keys.join(', ')}`); return x; }
function json(a) {
    ensure(a.size <= 2 * 1024 * 1024, 'METHOD_OUTPUT_PROFILE_INVALID', '承重JSON超过2MiB必读文本上限');
    let raw, value;
    try {
        raw = new TextDecoder('utf-8', { fatal: true }).decode(a.bytes);
        value = JSON.parse(raw);
    }
    catch {
        ensure(false, 'METHOD_OUTPUT_PROFILE_INVALID', `承重产物不是UTF-8 JSON：${a.title}`);
    }
    // JSON.parse establishes grammar; this token pass only rejects duplicate object keys.
    const objects = [];
    for (const token of raw.matchAll(/"(?:\\.|[^"\\])*"|[{}\[\]]/gs)) {
        if (token[0] === '{')
            objects.push(new Set());
        else if (token[0] === '[')
            objects.push(null);
        else if (token[0] === '}' || token[0] === ']')
            objects.pop();
        else if (/^\s*:/.test(raw.slice(token.index + token[0].length))) {
            const keys = objects.at(-1), key = JSON.parse(token[0]);
            ensure(keys && !keys.has(key), 'METHOD_OUTPUT_PROFILE_INVALID', '承重JSON对象不能有重复key覆盖另一数量/判定');
            keys.add(key);
        }
    }
    return value;
}
function one(artifacts, path) { const matches = artifacts.filter(a => a.title === path); ensure(matches.length === 1, 'METHOD_OUTPUT_PROFILE_INVALID', `需要唯一的原始产物：${path}`); return matches[0]; }
export function bearingCandidatePaths(q) { return ['metrics.json', q.witness.artifactPath, q.provenanceArtifact]; }
export function validateBearingOutputs(q, artifacts, hostPaths, execution) {
    const paths = bearingCandidatePaths(q), allowed = execution.allowHost ? [...paths, ...hostPaths] : paths;
    ensure(new Set(artifacts.map(a => a.title)).size === artifacts.length && artifacts.every(a => allowed.includes(a.title)), 'METHOD_OUTPUT_PROFILE_INVALID', '实际输出包含未声明或重复产物；原始归档保留，不允许改名绕过profile');
    const metric = one(artifacts, 'metrics.json');
    exact(json(metric), Object.values(q.metrics), 'numeric-measurements');
    const witness = one(artifacts, q.witness.artifactPath);
    let value = json(witness);
    for (const token of q.witness.recordsPointer === '' ? [] : q.witness.recordsPointer.slice(1).split('/').map(s => s.replaceAll('~1', '/').replaceAll('~0', '~'))) {
        const ancestor = exact(value, [token], 'witness pointer祖先');
        value = ancestor[token];
    }
    ensure(Array.isArray(value), 'METHOD_OUTPUT_PROFILE_INVALID', 'witness pointer必须定位数组');
    const rows = value;
    for (const row of rows)
        exact(row, [q.witness.idField, q.witness.observedField, q.witness.baselinePredictionField, q.witness.candidatePredictionField], 'prediction-witness row');
    const fit = one(artifacts, q.provenanceArtifact), p = exact(json(fit), ['trainRowIds', 'normalization', 'models', 'implementation'], 'fit-evidence'), normalization = exact(p.normalization, ['predictor'], 'normalization'), predictor = exact(normalization.predictor, ['center', 'scale'], 'normalization.predictor');
    ensure(typeof predictor.center === 'number' && Number.isFinite(predictor.center) && typeof predictor.scale === 'number' && Number.isFinite(predictor.scale) && predictor.scale > 0, 'METHOD_OUTPUT_PROFILE_INVALID', 'predictor normalization需有限center和正有限scale');
    const models = exact(p.models, ['baseline', 'candidate'], 'models');
    for (const [name, n] of [['baseline', 2], ['candidate', 3]]) {
        const m = exact(models[name], ['coefficients'], `models.${name}`);
        ensure(Array.isArray(m.coefficients) && m.coefficients.length === n && m.coefficients.every(v => typeof v === 'number' && Number.isFinite(v)), 'METHOD_OUTPUT_PROFILE_INVALID', '系数必须是2/3个有限JSON数');
    }
    const implementation = exact(p.implementation, ['path', 'entryPoint', 'digest'], 'implementation'), file = execution.sourceFiles.find(f => f.path === q.fitImplementation.path);
    ensure(file && implementation.path === q.fitImplementation.path && implementation.entryPoint === q.fitImplementation.entryPoint && implementation.digest === file.digest, 'METHOD_FIT_BINDING_INVALID', 'fit implementation必须绑定固定源码文件准确摘要及entryPoint');
    if (execution.successful)
        for (const name of ['stdout.log', 'stderr.log']) {
            const log = one(execution.logs, name);
            ensure(log.bytes.length === 0, 'METHOD_OUTPUT_PROFILE_INVALID', `成功profile的${name}必须为空；原日志保留`);
        }
    return { rows, fitArtifact: { id: fit.id, digest: fit.digest, size: fit.size, path: fit.title }, provenance: { ...p, sharedEntryPoint: q.fitImplementation.entryPoint } };
}
export function bearingFacts(contract, q, result) {
    const e = result.evaluation, development = Object.hasOwn(e, 'syntheticFixture');
    return { version: 1, outputProfile: BEARING_PROFILE, stage: development ? 'synthetic-development' : 'formal', contractDigest: contract.contractDigest, sourceDigest: result.sourceDigest, subjectId: result.subjectId, input: development ? e.syntheticFixture : q.plan.formalInput, metricArtifact: result.metricArtifact, witnessArtifact: e.witnessArtifact, fitArtifact: e.provenanceArtifact, quantities: { n: e.n, baselineRmse: e.baselineRmse, candidateRmse: e.candidateRmse, gain: e.gain, standardError: e.standardError, lower: e.lower, upper: e.upper, halfWidth: e.halfWidth, unit: q.outcomeUnit }, rule: { minimumGain: q.minimumGain, precisionGate: q.precisionGate, decision: e.decision }, cases: [{ id: 'actual', gain: e.gain, lower: e.lower, upper: e.upper, decision: e.decision }, ...contract.boundaryExamples.map((b, i) => ({ id: `boundary-${i + 1}`, gain: b.gain, lower: b.lower, upper: b.upper, decision: b.decision }))], limits: 'Presented held-out prediction witness and frozen operating criterion only. Not proof of iid, coverage, fit/training provenance, hidden-data absence, domain utility or free-text scientific correctness.' };
}
export function renderBearingFacts(f) { return `## Host paired comparison facts\n\nStage: ${f.stage}. ${f.stage === 'synthetic-development' ? 'These are synthetic development quantities, not real research effects.' : 'These are formal Run quantities from the separately frozen input.'}\nContract: ${f.contractDigest}\nSource: ${f.sourceDigest}\nSubject: ${f.subjectId}\n\n| Quantity | Unrounded value |\n|---|---:|\n${Object.entries(f.quantities).map(([k, v]) => `| ${k} | ${JSON.stringify(v)} |`).join('\n')}\n\nFrozen operating rule: minimumGain=${f.rule.minimumGain}; precisionGate=${JSON.stringify(f.rule.precisionGate)}; decision=${f.rule.decision}. ${f.rule.precisionGate === null ? 'Observed halfWidth is descriptive only and supplies no extra threshold.' : 'The frozen precision predicate is applied first; equality does not filter.'}\ncriterion_met means only the operating criterion, never validated domain utility. inconclusive means neither equivalence nor absence of effect.\n\n${f.limits}\n`; }
export function bearingExports(facts, rows, q) { const quote = (v) => `"${String(v).replaceAll('"', '""')}"`, keys = [q.witness.idField, q.witness.observedField, q.witness.baselinePredictionField, q.witness.candidatePredictionField], csv = ['rowId,observed,baselinePrediction,candidatePrediction', ...rows.map(r => keys.map(k => quote(r[k])).join(','))].join('\r\n') + '\r\n'; return new Map([['methods-facts.json', Buffer.from(JSON.stringify(facts, null, 2))], ['methods-facts.md', Buffer.from(renderBearingFacts(facts))], ['predictions.csv', Buffer.from(csv)]]); }
//# sourceMappingURL=bearing-outputs.js.map