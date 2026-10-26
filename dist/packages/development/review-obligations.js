import { verifySourceBlob } from '../storage/source-integrity.js';
import { posix } from 'node:path';
import { randomUUID } from 'node:crypto';
import { dirname, basename } from 'node:path';
import { digest } from '../storage/store.js';
import { ensure, asError } from '../domain/errors.js';
import { readStableFile } from '../workspace/stable-file.js';
import { readStreamedText } from '../storage/streamed-blob.js';
import { closedPaired } from '../research-workflows/method-contracts.js';
export const FIXED_REVIEW_READING = 'fixed-obligations-v1';
const blob = (a) => ({ blobPath: a.path, digest: a.digest, size: a.size });
const canonical = (p) => posix.normalize(p.replaceAll('\\', '/')).toLowerCase();
const overlap = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
/** Derive every target from the pinned job/brief, never from a caller's allowlist. */
export function buildReadingObligations(store, pid, r, integrity) {
    ensure(r.readingProtocol === FIXED_REVIEW_READING && r.protocolVersion && r.researchBrief, 'DEVELOPMENT_REVIEW_CORRUPTED', '固定阅读协议需要原科学profile及计划');
    const job = store.get('sandbox-job', r.jobId, pid), brief = store.get('research-brief', r.researchBrief.id, pid), targets = job.manifest.inputSnapshot.files.map(f => ({ targetId: `candidate:${f.path}`, kind: 'candidate', path: f.path, digest: f.digest, size: f.size, required: true, obligation: 'whole-text' }));
    const add = (kind, a, required, input) => {
        const actual = store.get('artifact', a.id, pid);
        ensure(actual.digest === a.digest && actual.size === a.size, 'ARTIFACT_CORRUPTED', '固定审查目标描述已改变');
        verifySourceBlob(store, blob(actual), integrity);
        const dataset = input?.purpose === 'dataset-reference';
        ensure(!dataset || input.readProtocol === 'fixed-text-v1', 'DEVELOPMENT_REVIEW_CORRUPTED', '数据引用需要原固定来源协议');
        targets.push({ targetId: `${kind}:${a.id}`, kind, path: a.path, artifactId: a.id, digest: a.digest, size: a.size, required, obligation: dataset ? 'dataset-reference' : 'whole-text', ...(dataset ? { sourceBinding: { projectId: pid, rootSessionId: r.researchBrief.rootSessionId, researchBrief: r.researchBrief, input } } : {}) });
    };
    if (r.protocolVersion === 2) {
        ensure(r.briefArtifact, 'DEVELOPMENT_REVIEW_CORRUPTED', '缺少固定brief');
        add('brief', r.briefArtifact, true);
    }
    for (const input of r.sourceInputs ?? [])
        add('source_input', { ...input, id: input.artifactId }, true, input);
    for (const a of r.dataArtifacts ?? [])
        if (!targets.some(t => t.artifactId === a.id))
            add('source_input', { ...a, path: `dataArtifact:${a.id}` }, job.manifest.syntheticFixture?.fixtureRef.id === a.id);
    for (const a of r.testArtifacts ?? [])
        add('test_artifact', a, a.required);
    // A literal argv operand matching a dataset is ambiguous in this reference-only development flow.
    const codePaths = [...job.manifest.inputSnapshot.files.map(f => f.path), ...job.manifest.command.filter(arg => !arg.startsWith('-')), ...(r.draftRoles ?? []).map(f => f.path), ...(brief.methodContract ? [brief.methodContract.protocolPath] : []), ...(closedPaired(brief.methodContract) ? [closedPaired(brief.methodContract).fitImplementation.path] : [])].map(canonical);
    for (const t of targets.filter(t => t.obligation === 'dataset-reference')) {
        const input = t.sourceBinding.input;
        ensure(!codePaths.some(path => overlap(canonical(input.path), path)) && !job.manifest.inputSnapshot.files.some(f => f.digest === t.digest) && !job.manifest.dataArtifacts.some(a => a.id === t.artifactId || a.digest === t.digest), 'DEVELOPMENT_REVIEW_ROLE_CONFLICT', '数据引用与执行源码/协议/fixture角色冲突');
        ensure(targets.filter(other => other.artifactId === t.artifactId).length === 1 && !targets.some(other => other !== t && (other.digest === t.digest || other.kind === 'source_input' && overlap(canonical(other.path), canonical(t.path)))), 'DEVELOPMENT_REVIEW_ROLE_CONFLICT', '数据引用存在重复身份、路径或角色歧义');
    }
    ensure(new Set(targets.map(t => t.targetId)).size === targets.length, 'DEVELOPMENT_REVIEW_CORRUPTED', '固定审查目标重复');
    return targets;
}
export function assertReadingObligations(store, pid, r, integrity) {
    if (r.readingProtocol === undefined) {
        ensure(r.readingObligations === undefined, 'DEVELOPMENT_REVIEW_CORRUPTED', '旧审查不能携带新阅读义务');
        return;
    }
    ensure(r.readingProtocol === FIXED_REVIEW_READING && digest(r.readingObligations) === digest(buildReadingObligations(store, pid, r, integrity)), 'DEVELOPMENT_REVIEW_STALE', '准确固定阅读义务已改变');
}
export function obligationText(store, pid, r, t) {
    ensure(t.obligation === 'whole-text', 'DEVELOPMENT_REVIEW_DATA_REFERENCE', '数据引用只能使用有界固定页');
    const job = store.get('sandbox-job', r.jobId, pid), a = t.artifactId ? store.get('artifact', t.artifactId, pid) : undefined, root = a ? dirname(store.paths.physical(a.path)) : store.paths.physical(job.manifest.inputSnapshot.path), path = a ? basename(store.paths.physical(a.path)) : t.path, bytes = readStableFile(root, path, 2 * 1024 * 1024);
    ensure(bytes.length === t.size && digest(bytes) === t.digest && !bytes.includes(0), 'ARTIFACT_CORRUPTED', '固定审查文本已改变');
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
}
function artifactPage(store, pid, t, read) {
    const a = store.get('artifact', t.artifactId, pid), source = store.get('artifact-text-source', read.textSourceId, pid), index = store.get('artifact', source.indexArtifactId, pid);
    ensure(a.id === read.artifactId && read.sourceDigest === t.digest && read.actor.projectId === pid && a.digest === t.digest && a.size === t.size && source.artifactId === a.id && source.sourceDigest === a.digest && source.size === a.size && ['artifact:text-index', 'document:text-index'].includes(index.origin) && !index.taskId && !index.runId && !index.wakeupId && !index.discoveryGrant, 'DEVELOPMENT_REVIEW_READ_INVALID', '固定页来源与目标不符');
    const page = readStreamedText(store, blob(a), blob(index), source.index, read.cursor, Math.max(4, read.end - read.cursor), true);
    ensure(page.end === read.end && page.utf16Start === read.utf16Start && page.utf16End === read.utf16End && digest(Buffer.from(page.content)) === read.contentDigest, 'DEVELOPMENT_REVIEW_READ_INVALID', '固定页与原回执不符');
    return { ...page, total: source.index.utf16Length };
}
export function recordObligationRead(store, pid, r, actor, operation, input, output, callId) {
    const target = r.readingObligations.find(t => operation === 'development_review_source_read' ? t.kind === 'candidate' && t.path === input.path : t.artifactId === input.artifactId);
    if (!target)
        return;
    ensure(output.digest === target.digest && typeof output.content === 'string', 'DEVELOPMENT_REVIEW_READ_INVALID', '实际读取摘要与固定目标不符');
    let start, end, total, artifactReadId, byteStart, byteEnd, readProtocol = 'legacy-utf16';
    if (output.readProtocol === 'fixed-text-v1') {
        artifactReadId = output.artifactReadId;
        const read = store.get('artifact-text-read', artifactReadId, pid), page = artifactPage(store, pid, target, read);
        ensure(read.actor.sessionId === actor.sessionId && read.actor.taskId === actor.taskId && read.actor.attemptId === actor.attemptId && read.actor.generation === actor.generation && read.callId === callId && page.content === output.content, 'DEVELOPMENT_REVIEW_READ_INVALID', '固定页不是当前实际调用');
        start = read.utf16Start;
        end = read.utf16End;
        total = page.total;
        readProtocol = 'fixed-text-v1';
        byteStart = read.cursor;
        byteEnd = read.end;
    }
    else {
        const content = obligationText(store, pid, r, target);
        start = operation === 'artifact_read' ? (input.cursor ?? 0) : output.cursor;
        end = operation === 'artifact_read' ? output.cursor : output.end;
        total = content.length;
        ensure(Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && end >= start && end <= total && content.slice(start, end) === output.content, 'DEVELOPMENT_REVIEW_READ_INVALID', '实际片段与固定文本不符');
    }
    const id = randomUUID();
    store.create('development-obligation-read', pid, { reviewId: r.id, reviewDigest: r.digest, taskId: r.taskId, attemptId: actor.attemptId, sessionId: actor.sessionId, generation: actor.generation, targetId: target.targetId, readKind: target.kind, digest: target.digest, start, end, total, chunkDigest: digest(output.content), callId, cursorUnit: 'utf16', readProtocol, ...(artifactReadId ? { artifactReadId, byteStart, byteEnd } : {}), delivery: 'pending' }, id);
    return { reviewReadId: id, reviewReadingProtocol: FIXED_REVIEW_READING };
}
export function obligationReads(store, pid, r, task) { return store.list('development-obligation-read', pid).filter(v => v.reviewId === r.id && v.reviewDigest === r.digest && v.taskId === task.id && v.attemptId === task.attemptId && v.sessionId === task.sessionId && v.generation === task.generation && v.delivery === 'delivered'); }
export function obligationChunk(store, pid, r, t, read, requireDelivered = true) {
    ensure(read.targetId === t.targetId && read.readKind === t.kind && read.digest === t.digest && read.cursorUnit === 'utf16' && ['legacy-utf16', 'fixed-text-v1'].includes(read.readProtocol), 'DEVELOPMENT_REVIEW_READ_INVALID', '读取目标已改变');
    let chunk, total, start = read.start, end = read.end;
    if (read.readProtocol === 'fixed-text-v1') {
        const source = store.get('artifact-text-read', read.artifactReadId, pid), page = artifactPage(store, pid, t, source);
        ensure((!requireDelivered || source.delivery === 'delivered') && source.actor.taskId === read.taskId && source.actor.attemptId === read.attemptId && source.actor.sessionId === read.sessionId && source.actor.generation === read.generation && source.callId === read.callId && source.cursor === read.byteStart && source.end === read.byteEnd && page.utf16Start === start && page.utf16End === end, 'DEVELOPMENT_REVIEW_READ_INVALID', '原固定页没有当前独立任务的实际交付');
        chunk = page.content;
        total = page.total;
    }
    else {
        const content = obligationText(store, pid, r, t);
        total = content.length;
        chunk = content.slice(start, end);
    }
    ensure(Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && end >= start && end <= total && total === read.total && digest(chunk) === read.chunkDigest, 'DEVELOPMENT_REVIEW_READ_INVALID', '准确读取区间已改变');
    return chunk;
}
export function obligationChecks(store, pid, r, task, integrity) {
    const reads = obligationReads(store, pid, r, task);
    return r.readingObligations.filter(t => t.required).map(t => {
        const base = { targetId: t.targetId, kind: t.kind, path: t.path, digest: t.digest, obligation: t.obligation, cursorUnit: 'utf16' };
        try {
            if (t.obligation === 'dataset-reference') {
                const a = store.get('artifact', t.artifactId, pid);
                ensure(a.digest === t.digest && a.size === t.size, 'ARTIFACT_CORRUPTED', '固定数据描述已改变');
                verifySourceBlob(store, blob(a), integrity);
            }
            const matching = reads.filter(v => v.targetId === t.targetId);
            for (const read of matching)
                obligationChunk(store, pid, r, t, read);
            const ranges = matching.map(v => ({ start: v.start, end: v.end })).sort((a, b) => a.start - b.start), missingIntervals = [];
            let covered = 0;
            for (const v of ranges) {
                if (v.start > covered)
                    missingIntervals.push({ start: covered, end: v.start });
                covered = Math.max(covered, v.end);
            }
            const total = matching[0]?.total ?? (t.size === 0 ? 0 : null);
            if (total !== null && covered < total)
                missingIntervals.push({ start: covered, end: total });
            if (t.obligation === 'dataset-reference')
                return { ...base, total, readComplete: false, missingIntervals: [], referenceVerified: true, inspectionSatisfied: ranges.some(v => v.end > v.start), inspectedRanges: ranges };
            return { ...base, total, readComplete: matching.length > 0 && missingIntervals.length === 0, missingIntervals };
        }
        catch (error) {
            return { ...base, total: null, readComplete: false, missingIntervals: [], ...(t.obligation === 'dataset-reference' ? { referenceVerified: false, inspectionSatisfied: false, inspectedRanges: [] } : {}), blockedReason: asError(error).code };
        }
    });
}
//# sourceMappingURL=review-obligations.js.map