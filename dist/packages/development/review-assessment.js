import { currentReviewIntegrity } from './review-integrity.js';
import { DEVELOPMENT_ASSESSMENT_REFERENCE_LIMIT } from '../contracts/operations/development-assessment-schemas.js';
import { obligationChecks, obligationReads, obligationChunk, obligationText, recordObligationRead } from './review-obligations.js';
import { fixedReviewReceipts, fixedReadingChecks, recordFixedRead } from './fixed-review-reading.js';
import { dirname, basename } from 'node:path';
import { digest } from '../storage/store.js';
import { ensure, DomainError } from '../domain/errors.js';
import { object, text, strings, oneOf } from '../contracts/validation.js';
import { readStableFile } from '../workspace/stable-file.js';
import { methodHostPaths } from '../research-workflows/method-contracts.js';
export const DEVELOPMENT_REVIEW_PROTOCOL = 1;
export const BEARING_REVIEW_PROTOCOL = 2;
export const ASSESSMENT_AREAS = ['implementation_and_tests', 'input_evidence', 'independent_units_and_intervals', 'threshold_interpretation', 'claim_boundaries'];
function closed(value, fields, name, optional = []) { const x = object(value); ensure(Object.keys(x).every(k => fields.includes(k)) && fields.every(k => optional.includes(k) || Object.hasOwn(x, k)), 'DEVELOPMENT_ASSESSMENT_INVALID', `${name}字段必须是 ${fields.join(', ')}`, 400); return x; }
export function parseDevelopmentAssessment(value) {
    const x = closed(value, ['stage', 'checks', 'deferredChecks', 'surfaceComparisons'], 'developmentAssessment', ['surfaceComparisons']);
    ensure(x.stage === 'pre_run', 'DEVELOPMENT_ASSESSMENT_INVALID', 'developmentAssessment.stage 必须为 pre_run', 400);
    ensure(Array.isArray(x.checks) && x.checks.length === ASSESSMENT_AREAS.length, 'DEVELOPMENT_ASSESSMENT_INVALID', `checks必须完整包含五项：${ASSESSMENT_AREAS.join(', ')}`, 400);
    const checks = x.checks.map(raw => {
        const c = closed(raw, ['area', 'finding', 'references', 'blockingGaps'], 'assessment.check');
        ensure(Array.isArray(c.references) && c.references.length <= DEVELOPMENT_ASSESSMENT_REFERENCE_LIMIT, 'DEVELOPMENT_ASSESSMENT_INVALID', `references最多${DEVELOPMENT_ASSESSMENT_REFERENCE_LIMIT}项`, 400);
        return { area: oneOf(c.area, ASSESSMENT_AREAS, 'assessment.area'), finding: text(c.finding, 'assessment.finding', 4000), references: c.references.map(raw => { const r = closed(raw, ['readId', 'quote'], 'assessment.reference'); return { readId: text(r.readId, 'readId', 100), quote: text(r.quote, 'quote', 16000) }; }), blockingGaps: strings(c.blockingGaps, 'blockingGaps', 16) };
    });
    ensure(new Set(checks.map(c => c.area)).size === ASSESSMENT_AREAS.length, 'DEVELOPMENT_ASSESSMENT_INVALID', `checks不可重复或缺项：${ASSESSMENT_AREAS.join(', ')}`, 400);
    let surfaceComparisons;
    if (x.surfaceComparisons !== undefined) {
        ensure(Array.isArray(x.surfaceComparisons) && x.surfaceComparisons.length <= 5000, 'DEVELOPMENT_ASSESSMENT_INVALID', 'surfaceComparisons最多5000个实际表面');
        surfaceComparisons = x.surfaceComparisons.map(raw => { const c = closed(raw, ['targetId', 'assertions'], 'surfaceComparison'); ensure(Array.isArray(c.assertions) && c.assertions.length >= 1 && c.assertions.length <= 16, 'DEVELOPMENT_ASSESSMENT_INVALID', '每个表面需要1至16条具体对照'); return { targetId: text(c.targetId, 'targetId', 1200), assertions: c.assertions.map(raw => { const a = closed(raw, ['claim', 'authority', 'caseId', 'finding', 'conclusion'], 'surface assertion'), reference = (v) => { const r = closed(v, ['readId', 'quote'], 'surface reference'); return { readId: text(r.readId, 'readId', 100), quote: text(r.quote, 'quote', 16000) }; }; return { claim: reference(a.claim), authority: reference(a.authority), caseId: text(a.caseId, 'caseId', 100), finding: text(a.finding, 'finding', 4000), conclusion: oneOf(a.conclusion, ['consistent', 'contradiction', 'unresolved'], 'conclusion') }; }) }; });
    }
    return { stage: 'pre_run', checks, deferredChecks: strings(x.deferredChecks, 'deferredChecks', 16), ...(surfaceComparisons === undefined ? {} : { surfaceComparisons }) };
}
function artifactText(store, pid, id, hash, size) {
    const a = store.get('artifact', id, pid), path = store.paths.physical(a.path), bytes = readStableFile(dirname(path), basename(path), 2 * 1024 * 1024);
    ensure(a.digest === hash && a.size === size && bytes.length === size && digest(bytes) === hash, 'ARTIFACT_CORRUPTED', '固定审查产物字节已改变');
    ensure(!bytes.includes(0), 'ARTIFACT_TEXT_REQUIRED', '固定审查产物不是文本', 415);
    try {
        return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    }
    catch {
        throw new DomainError('ARTIFACT_TEXT_REQUIRED', '固定审查产物不是UTF-8文本', 415);
    }
}
export function reviewReadingTargets(store, pid, r) {
    if (r.protocolVersion === undefined)
        return [];
    if (r.readingProtocol)
        return r.readingObligations.map(t => ({ ...t, read: () => obligationText(store, pid, r, t) }));
    ensure(r.protocolVersion === DEVELOPMENT_REVIEW_PROTOCOL || r.protocolVersion === BEARING_REVIEW_PROTOCOL, 'DEVELOPMENT_REVIEW_CORRUPTED', '未知开发审查协议版本');
    const job = store.get('sandbox-job', r.jobId, pid), targets = job.manifest.inputSnapshot.files.map(file => ({ targetId: `candidate:${file.path}`, kind: 'candidate', path: file.path, digest: file.digest, required: true, read: () => {
            const bytes = readStableFile(store.paths.physical(job.manifest.inputSnapshot.path), file.path, 2 * 1024 * 1024);
            ensure(bytes.length === file.size && digest(bytes) === file.digest, 'SNAPSHOT_CORRUPTED', `候选源码已改变：${file.path}`);
            ensure(!bytes.includes(0), 'BINARY_FILE', `候选不是文本：${file.path}`, 415);
            try {
                return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            }
            catch {
                throw new DomainError('BINARY_FILE', `候选不是UTF-8：${file.path}`, 415);
            }
        } }));
    if (r.protocolVersion === BEARING_REVIEW_PROTOCOL) {
        const a = r.briefArtifact;
        ensure(a, 'DEVELOPMENT_REVIEW_CORRUPTED', '新profile缺少完整固定brief原文');
        targets.push({ targetId: `brief:${a.id}`, kind: 'brief', path: a.path, digest: a.digest, artifactId: a.id, required: true, read: () => artifactText(store, pid, a.id, a.digest, a.size) });
    }
    for (const a of r.sourceInputs ?? [])
        targets.push({ targetId: `source_input:${a.artifactId}`, kind: 'source_input', path: a.path, digest: a.digest, artifactId: a.artifactId, required: true, read: () => artifactText(store, pid, a.artifactId, a.digest, a.size) });
    for (const a of r.dataArtifacts ?? [])
        if (!targets.some(t => t.artifactId === a.id))
            targets.push({ targetId: `source_input:${a.id}`, kind: 'source_input', path: `dataArtifact:${a.id}`, digest: a.digest, artifactId: a.id, required: job.manifest.syntheticFixture?.fixtureRef.id === a.id, read: () => artifactText(store, pid, a.id, a.digest, a.size) });
    for (const a of r.testArtifacts ?? [])
        targets.push({ targetId: `test_artifact:${a.id}`, kind: 'test_artifact', path: a.path, digest: a.digest, artifactId: a.id, required: a.required, read: () => artifactText(store, pid, a.id, a.digest, a.size) });
    return targets;
}
export function buildReviewInventory(store, pid, r) {
    const contract = store.get('research-brief', r.researchBrief.id, pid).methodContract, q = contract.specification.quantitative, job = store.get('sandbox-job', r.jobId, pid);
    ensure(q.type === 'comparison' && q.template === 'paired-rmse-plan-v2', 'DEVELOPMENT_REVIEW_CORRUPTED', 'inventory仅用于新闭合profile');
    const hostPaths = new Set(methodHostPaths(contract).map(path => `output/${path}`)), hostArtifacts = new Map(job.artifactIds.map(id => store.get('artifact', id, pid)).filter(a => a.origin === `development:${job.id}` && (a.id === job.reportArtifactId || hostPaths.has(a.title))).map(a => [a.id, a]));
    const targets = reviewReadingTargets(store, pid, r), items = targets.map(t => { const content = r.readingProtocol && (t.kind === 'source_input' || t.path === 'stdout.log' || t.path === 'stderr.log') ? undefined : t.read(), size = r.readingProtocol ? t.size : Buffer.byteLength(content), host = t.artifactId ? hostArtifacts.get(t.artifactId) : undefined, verification = t.kind === 'brief' || t.kind === 'candidate' ? 'unverified-open-text' : t.kind === 'source_input' ? 'fixed-source' : t.kind === 'test_artifact' && host && host.title === t.path && host.digest === t.digest && host.size === size ? 'host-derived' : [`output/metrics.json`, `output/${q.witness.artifactPath}`, `output/${q.provenanceArtifact}`, 'stdout.log', 'stderr.log'].includes(t.path) ? 'profile-checked-raw-evidence' : 'unverified-open-text'; return { targetId: t.targetId, kind: t.kind, path: t.path, digest: t.digest, size, ...(t.artifactId ? { artifactId: t.artifactId } : {}), verification, openSurface: (content === undefined ? size > 0 : content.trim().length > 0) && (verification === 'unverified-open-text' || t.path === `output/${q.provenanceArtifact}`) }; });
    const facts = r.testArtifacts.find(a => a.path === 'output/methods-facts.json');
    ensure(facts, 'DEVELOPMENT_REVIEW_CORRUPTED', 'inventory缺少宿主事实');
    const view = JSON.parse(artifactText(store, pid, facts.id, facts.digest, facts.size));
    ensure(new Set(items.map(i => i.targetId)).size === items.length, 'DEVELOPMENT_REVIEW_CORRUPTED', 'inventory目标重复');
    const inventory = { profile: 'paired-evidence-review-v1', items, caseIds: view.cases.map(c => c.id) };
    ensure(Buffer.byteLength(JSON.stringify(inventory)) <= 2 * 1024 * 1024, 'DEVELOPMENT_REVIEW_DATA_TEXT_REQUIRED', '完整inventory超过原必读2MiB文本限额');
    return inventory;
}
/** Called only after output validation, inside the successful operation receipt transaction. */
export function recordReviewRead(store, actor, r, operation, input, output, callId) {
    if (r.protocolVersion === undefined || actor.type !== 'agent' || actor.role !== 'reviewer' || actor.taskId !== r.taskId || !actor.attemptId)
        return;
    if (r.readingProtocol)
        return recordObligationRead(store, r.projectId, r, actor, operation, input, output, callId);
    const targets = reviewReadingTargets(store, r.projectId, r), target = operation === 'development_review_source_read' ? targets.find(t => t.kind === 'candidate' && t.path === input.path) : operation === 'artifact_read' ? targets.find(t => t.artifactId === input.artifactId) : undefined;
    if (!target)
        return;
    ensure(output.digest === target.digest, 'DEVELOPMENT_REVIEW_READ_INVALID', '实际返回摘要与固定审查目标不符');
    return recordFixedRead(store, r.projectId, 'development-review-read', actor, r, target, operation === 'artifact_read' ? input.cursor ?? 0 : output.cursor, operation === 'artifact_read' ? output.cursor : output.end, output.content, callId, 'DEVELOPMENT_REVIEW_READ_INVALID');
}
function receipts(store, pid, r, task) { return r.readingProtocol ? obligationReads(store, pid, r, task) : fixedReviewReceipts(store, pid, 'development-review-read', r, task); }
export function reviewReadingChecks(store, pid, r, task, integrity) { return r.readingProtocol ? obligationChecks(store, pid, r, task, integrity ?? currentReviewIntegrity(store, r.jobId)) : fixedReadingChecks(reviewReadingTargets(store, pid, r), receipts(store, pid, r, task)); }
export function validateDevelopmentAssessment(store, pid, r, task, result, integrity) {
    if (r.protocolVersion === undefined)
        return;
    ensure(result.developmentAssessment, 'DEVELOPMENT_ASSESSMENT_REQUIRED', `此审查需要developmentAssessment={stage:pre_run,checks:[${ASSESSMENT_AREAS.join(', ')}],deferredChecks:[]}；拒绝/阻断可保留部分引用并在blockingGaps说明缺口`);
    const assessment = parseDevelopmentAssessment(result.developmentAssessment), targets = reviewReadingTargets(store, pid, r), allowed = receipts(store, pid, r, task), accepting = result.outcome === 'completed' && result.verdict === 'accept';
    for (const [checkIndex, check] of assessment.checks.entries()) {
        const kinds = new Set();
        for (const [referenceIndex, reference] of check.references.entries()) {
            const label = `checks[${checkIndex}] area=${check.area} references[${referenceIndex}]`;
            const read = allowed.find(read => read.id === reference.readId), target = read ? targets.find(target => target.targetId === read.targetId && target.kind === read.readKind && target.digest === read.digest) : undefined;
            ensure(read && target, 'DEVELOPMENT_REVIEW_REFERENCE_INVALID', `${label}: readId=${reference.readId}不属于本任务当前attempt的成功读取`);
            const chunk = r.readingProtocol ? obligationChunk(store, pid, r, r.readingObligations.find(t => t.targetId === target.targetId), read) : target.read().slice(read.start, read.end);
            ensure((r.readingProtocol || target.read().length === read.total) && digest(chunk) === read.chunkDigest, 'DEVELOPMENT_REVIEW_REFERENCE_INVALID', `${label}: target=${target.targetId}固定读取片段已改变`);
            const offset = chunk.indexOf(reference.quote);
            ensure(offset >= 0, 'DEVELOPMENT_REVIEW_QUOTE_INVALID', `${label}: target=${target.targetId} quote未逐字匹配`);
            ensure(chunk.indexOf(reference.quote, offset + 1) < 0, 'DEVELOPMENT_REVIEW_QUOTE_INVALID', `${label}: target=${target.targetId} quote不唯一`);
            kinds.add(target.kind);
        }
        if (accepting) {
            ensure(check.blockingGaps.length === 0, 'DEVELOPMENT_ASSESSMENT_BLOCKED', `不能accept：${check.area}仍有blockingGaps：${check.blockingGaps.join('; ')}`);
            ensure(kinds.has('candidate'), 'DEVELOPMENT_ASSESSMENT_REFERENCE_REQUIRED', `${check.area}必须引用实际candidate读取的{readId,quote}`);
            if (check.area === 'implementation_and_tests')
                ensure(kinds.has('test_artifact'), 'DEVELOPMENT_ASSESSMENT_REFERENCE_REQUIRED', 'implementation_and_tests必须引用实际归档测试产物，wrapper不等于测试原文');
            if (check.area === 'input_evidence' && (r.sourceInputs?.length ?? 0) > 0)
                ensure(kinds.has('source_input'), 'DEVELOPMENT_ASSESSMENT_REFERENCE_REQUIRED', 'input_evidence必须引用固定sourceInputs原文的{readId,quote}');
        }
    }
    if (accepting && r.readingProtocol) {
        const input = assessment.checks.find(c => c.area === 'input_evidence');
        for (const t of r.readingObligations.filter(t => t.obligation === 'dataset-reference'))
            ensure(input.references.some(ref => allowed.some(read => read.id === ref.readId && read.targetId === t.targetId)), 'DEVELOPMENT_ASSESSMENT_REFERENCE_REQUIRED', `input_evidence必须引用此固定数据的实际检查原文：${t.targetId}`);
    }
    if (r.protocolVersion === BEARING_REVIEW_PROTOCOL) {
        const inventory = r.surfaceInventory;
        ensure(inventory && digest(inventory) === digest(buildReviewInventory(store, pid, r)), 'DEVELOPMENT_REVIEW_STALE', '全部实际承重表面清单已改变');
        const comparisons = assessment.surfaceComparisons ?? [];
        ensure(new Set(comparisons.map(c => c.targetId)).size === comparisons.length, 'DEVELOPMENT_ASSESSMENT_INVALID', '表面对照不可重复');
        const locate = (reference, label) => { const read = allowed.find(read => read.id === reference.readId), target = read ? targets.find(t => t.targetId === read.targetId && t.kind === read.readKind && t.digest === read.digest) : undefined; ensure(read && target, 'DEVELOPMENT_REVIEW_REFERENCE_INVALID', `${label}: readId=${reference.readId}不属于当前attempt的成功读取`); const chunk = r.readingProtocol ? obligationChunk(store, pid, r, r.readingObligations.find(t => t.targetId === target.targetId), read) : target.read().slice(read.start, read.end), at = chunk.indexOf(reference.quote); ensure((r.readingProtocol || target.read().length === read.total) && digest(chunk) === read.chunkDigest, 'DEVELOPMENT_REVIEW_REFERENCE_INVALID', `${label}: target=${target.targetId}固定读取片段已改变`); ensure(at >= 0, 'DEVELOPMENT_REVIEW_QUOTE_INVALID', `${label}: target=${target.targetId} quote未逐字匹配`); ensure(chunk.indexOf(reference.quote, at + 1) < 0, 'DEVELOPMENT_REVIEW_QUOTE_INVALID', `${label}: target=${target.targetId} quote不唯一`); return target; };
        const hostAuthority = (target) => { const item = inventory.items.find(i => i.targetId === target.targetId), bound = r.testArtifacts?.find(a => a.id === target.artifactId && a.path === target.path && a.digest === target.digest); if (target.kind !== 'test_artifact' || item?.kind !== 'test_artifact' || item.verification !== 'host-derived' || item.artifactId !== target.artifactId || item.path !== target.path || item.digest !== target.digest || !bound?.required || item.size !== bound.size)
            return false; const job = store.get('sandbox-job', r.jobId, pid), artifact = store.get('artifact', bound.id, pid); return job.artifactIds.includes(bound.id) && artifact.origin === `development:${job.id}` && artifact.title === bound.path && artifact.digest === bound.digest && artifact.size === bound.size; };
        for (const [surfaceIndex, comparison] of comparisons.entries()) {
            const item = inventory.items.find(i => i.targetId === comparison.targetId), surface = `surfaceComparisons[${surfaceIndex}] target=${comparison.targetId}`;
            ensure(item?.openSurface, 'DEVELOPMENT_ASSESSMENT_INVALID', `${surface}: 不属于宿主清单中的开放表面`);
            for (const [assertionIndex, a] of comparison.assertions.entries()) {
                const label = `${surface} assertions[${assertionIndex}]`, claim = locate(a.claim, `${label}.claim`), authority = locate(a.authority, `${label}.authority`);
                ensure(claim.targetId === item.targetId, 'DEVELOPMENT_ASSESSMENT_REFERENCE_REQUIRED', `${label}: claim target=${claim.targetId}与本表面不符`);
                ensure(hostAuthority(authority), 'DEVELOPMENT_ASSESSMENT_REFERENCE_REQUIRED', `${label}: authority target=${authority.targetId} kind=${authority.kind} verification=${inventory.items.find(i => i.targetId === authority.targetId)?.verification ?? 'missing'}不符合原准确归档host-derived资格`);
                ensure(inventory.caseIds.includes(a.caseId), 'DEVELOPMENT_ASSESSMENT_REFERENCE_REQUIRED', `${label}: caseId=${a.caseId}不属于固定案例`);
                if (accepting)
                    ensure(a.conclusion === 'consistent', 'DEVELOPMENT_ASSESSMENT_BLOCKED', `${label}: conclusion=${a.conclusion}，当前矛盾/未决不能accept或推迟到正式Run`);
            }
        }
        if (accepting) {
            const missing = inventory.items.filter(i => i.openSurface && !comparisons.some(c => c.targetId === i.targetId));
            ensure(!missing.length, 'DEVELOPMENT_ASSESSMENT_SURFACE_REQUIRED', `accept缺少开放表面对照：${missing.slice(0, 12).map(i => i.targetId).join(', ')}；schema不能证明自由语义正确`);
        }
    }
    if (accepting) {
        const missing = reviewReadingChecks(store, pid, r, task, integrity).filter(c => 'obligation' in c && c.obligation === 'dataset-reference' ? !('inspectionSatisfied' in c && c.inspectionSatisfied) : !c.readComplete);
        ensure(!missing.length, 'DEVELOPMENT_REVIEW_READING_INCOMPLETE', `不能accept，尚未完整实际读取：${missing.slice(0, 12).map(c => `${c.kind}:${c.path}${'blockedReason' in c && c.blockedReason ? `(${c.blockedReason})` : ` 缺${c.missingIntervals.map(i => `[${i.start},${i.end})`).join(',') || '一次实际读取'}`}`).join('; ')}。使用candidate/source API或artifact_read分页读取后重新提交`);
    }
}
//# sourceMappingURL=review-assessment.js.map