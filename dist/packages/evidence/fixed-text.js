import { ordinaryWorkspaceReader } from '../research-workflows/workspace-inputs.js';
import { ARTIFACT_TEXT_PREPARE_TIMEOUT_MS } from '../contracts/tool-budgets.js';
import { randomUUID } from 'node:crypto';
import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { integer, text } from '../contracts/validation.js';
import { prepareFixedTextIndex, publishFixedTextIndex, readStreamedText, verifyStreamedBlob } from '../storage/streamed-blob.js';
import { assertTextIndexSource, textIndexPublication } from '../storage/text-index-publication.js';
import { fixedDocumentTextSource } from '../documents/fixed-text-source.js';
import { assertDiscoveryArtifact } from '../policy/discovery-grant-validation.js';
function readerIdentity(actor) { const { type, projectId, sessionId, role, taskId, attemptId, generation, wakeupId, continuationId, approvalResumeId, workflowContinuationId } = actor; return Object.fromEntries(Object.entries({ type, projectId, sessionId, role, taskId, attemptId, generation, wakeupId, continuationId, approvalResumeId, workflowContinuationId }).filter(([, value]) => value !== undefined)); }
const blob = (a) => ({ blobPath: a.path, digest: a.digest, size: a.size });
function fixed(store, pid, a, id) {
    const source = store.get('artifact-text-source', id, pid);
    ensure(source.artifactId === a.id && source.sourceDigest === a.digest && source.size === a.size, 'ARTIFACT_SOURCE_CHANGED', '固定文本来源绑定已变化', 409);
    const index = store.get('artifact', source.indexArtifactId, pid);
    ensure(['artifact:text-index', 'document:text-index'].includes(index.origin) && !index.taskId && !index.runId && !index.wakeupId && !index.discoveryGrant, 'ARTIFACT_SOURCE_CHANGED', '固定文本索引归属无效', 409);
    return { source: blob(a), indexBlob: blob(index), index: source.index };
}
export function verifyFixedTextEvidence(store, pid, a, e) {
    const ref = e.fixedText;
    ensure(ref.readProtocol === 'fixed-text-v1' && a.projectId === pid && a.id === e.artifactId && a.digest === e.digest, 'EVIDENCE_INVALID', '固定引文来源不符', 409);
    const source = fixed(store, pid, a, ref.textSourceId);
    verifyStreamedBlob(store, source.source);
    integer(ref.start, 'start', 0, a.size);
    integer(ref.end, 'end', ref.start + 1, Math.min(a.size, ref.start + 16000));
    const page = readStreamedText(store, source.source, source.indexBlob, source.index, ref.start, Math.max(4, ref.end - ref.start), true), quote = Buffer.from(page.content).subarray(0, ref.end - ref.start);
    ensure(quote.equals(Buffer.from(e.quote)) && Buffer.byteLength(e.quote) === ref.end - ref.start && page.utf16Start === e.locator.start && e.locator.end === e.locator.start + e.quote.length, 'EVIDENCE_INVALID', '固定引文或原UTF-16位置已失效', 409);
    return e;
}
export class ArtifactTextService {
    app;
    constructor(app) {
        this.app = app;
    }
    /** Every entry/replay/ACK starts at original authority, never at the derived token. */
    authorize(actor, pid, artifactId) {
        const { app } = this;
        if (actor.type === 'agent') {
            app.operations.authorizeAgent(actor, 'artifact_read');
            if (actor.permission)
                app.sessionPermissions.assert(actor.permission, false);
        }
        if (actor.taskId || actor.wakeupId)
            (actor.taskId ? app.teams : app.wakeups).assertResource(actor, 'artifact', artifactId);
        app.textCorpusGrants.authorizeContent(actor, pid, 'artifact_read', { artifactId });
        const a = app.evidence.descriptor(actor, artifactId);
        ensure(a.projectId === pid, 'SCOPE_DENIED', '产物不属于此项目', 403);
        ensure(a.origin !== 'native-continuation', 'NATIVE_CONTINUATION_PRIVATE', '原生续跑材料不能用作科研原文', 403);
        if (actor.type === 'agent')
            assertDiscoveryArtifact(app.store, pid, a);
        const review = actor.type === 'agent' && actor.role === 'reviewer' && actor.taskId && app.store.get('task', actor.taskId, pid).reviewId;
        const limit = review ? app.developmentReviews.archivedLogLimit(actor, pid, artifactId) ?? 2 * 1024 * 1024 : a.size;
        ensure(a.size <= limit, 'ARTIFACT_TEXT_REQUIRED', '产物超过当前获准读取范围', 415);
        return a;
    }
    descriptor(actor, pid, input) {
        const a = this.authorize(actor, pid, input.artifactId);
        ensure(a.digest === input.sourceDigest, 'ARTIFACT_SOURCE_CHANGED', '请使用原件准确sourceDigest', 409);
        const f = fixed(this.app.store, pid, a, input.textSourceId);
        return { artifactId: a.id, sourceDigest: a.digest, size: a.size, textSourceId: input.textSourceId, readProtocol: 'fixed-text-v1', utf16Length: f.index.utf16Length, status: 'ready' };
    }
    async prepare(actor, pid, input, validate, signal) {
        const deadline = Date.now() + ARTIFACT_TEXT_PREPARE_TIMEOUT_MS, budget = () => { ensure(Date.now() < deadline, 'ARTIFACT_TEXT_PREPARE_TIMEOUT', '固定文本准备超过服务期限，未发布就绪结果', 409); ensure(!signal?.aborted, 'CONNECTOR_CANCELLED', '准备请求已取消', 409); };
        budget();
        const { app } = this, a = this.authorize(actor, pid, input.artifactId);
        ensure(a.digest === input.sourceDigest, 'ARTIFACT_SOURCE_CHANGED', '请使用原件准确sourceDigest', 409);
        const id = digest({ projectId: pid, artifactId: a.id, digest: a.digest, size: a.size }), result = () => this.descriptor(actor, pid, { ...input, textSourceId: id });
        const check = () => { budget(); validate(); budget(); const current = this.authorize(actor, pid, a.id); ensure(digest(current) === digest(a), 'ARTIFACT_SOURCE_CHANGED', '准备期间原件记录改变', 409); };
        check();
        if (app.store.maybe('artifact-text-source', id)) {
            const f = fixed(app.store, pid, a, id);
            verifyStreamedBlob(app.store, f.source, budget);
            verifyStreamedBlob(app.store, f.indexBlob, budget);
            check();
            return result();
        }
        const row = app.store.db.prepare("SELECT id FROM records WHERE kind='document-text-source' AND project_id=? AND json_extract(data,'$.original.artifactId')=?").get(pid, a.id);
        if (row) {
            const existing = app.store.get('document-text-source', String(row.id), pid), doc = app.store.get('document-version', existing.documentVersionId, pid), f = fixedDocumentTextSource(app.store, doc);
            ensure(f.source.digest === a.digest && f.source.size === a.size && f.source.blobPath === a.path, 'ARTIFACT_SOURCE_CHANGED', '文档索引原件不匹配', 409);
            verifyStreamedBlob(app.store, f.source, budget);
            verifyStreamedBlob(app.store, f.indexBlob, budget);
            return app.store.transaction(() => { check(); if (!app.store.maybe('artifact-text-source', id))
                app.store.create('artifact-text-source', pid, { artifactId: a.id, sourceDigest: a.digest, size: a.size, indexArtifactId: existing.indexArtifact.artifactId, index: f.index }, id); check(); return result(); });
        }
        const prepared = await prepareFixedTextIndex(app.store, pid, a.id, blob(a), a.size, budget, check);
        try {
            app.store.transaction(() => { check(); const intent = app.store.create('text-index-publication', pid, prepared.publication, prepared.publication.stagingId); assertTextIndexSource(app.store.db, pid, textIndexPublication(app.store.paths, pid, { ...intent })); });
            await publishFixedTextIndex(app.store, prepared.publication, check);
            verifyStreamedBlob(app.store, blob(a), budget);
            check();
            await prepared.dispose();
            return app.store.transaction(() => { check(); if (!app.store.maybe('artifact-text-source', id)) {
                const index = app.evidence.publishPrepared(pid, { title: 'UTF-8 fixed artifact index', mediaType: 'application/octet-stream', origin: 'artifact:text-index', path: prepared.indexBlob.blobPath, digest: prepared.indexBlob.digest, size: prepared.indexBlob.size });
                app.store.create('artifact-text-source', pid, { artifactId: a.id, sourceDigest: a.digest, size: a.size, indexArtifactId: index.id, index: prepared.index }, id);
            } const selected = fixed(app.store, pid, a, id); ensure(digest(selected.index) === digest(prepared.index) && digest(selected.indexBlob) === digest(prepared.indexBlob), 'ARTIFACT_SOURCE_CHANGED', '并发索引不一致', 409); app.store.db.prepare("DELETE FROM records WHERE kind='text-index-publication' AND id=? AND project_id=?").run(prepared.publication.stagingId, pid); check(); return result(); });
        }
        finally {
            await prepared.dispose();
        }
    }
    page(actor, pid, input) {
        this.descriptor(actor, pid, input);
        const a = this.authorize(actor, pid, input.artifactId), f = fixed(this.app.store, pid, a, input.textSourceId), page = readStreamedText(this.app.store, f.source, f.indexBlob, f.index, integer(input.cursor ?? 0, 'cursor', 0, a.size), integer(input.limit ?? 16000, 'limit', 4, 16000), true);
        return { artifactId: a.id, digest: a.digest, sourceDigest: a.digest, title: a.title, mediaType: a.mediaType, textSourceId: input.textSourceId, readProtocol: 'fixed-text-v1', cursorUnit: 'utf8-byte', integrityScope: 'delivered-blocks', ...page, utf16Start: page.utf16Start, utf16End: page.utf16End };
    }
    record(actor, pid, page, callId) {
        const artifact = this.authorize(actor, pid, page.artifactId);
        const read = this.app.store.create('artifact-text-read', pid, { ...(artifact.origin === `workspace-snapshot:${actor.sessionId}` && ordinaryWorkspaceReader(actor) ? { workspaceInputEligible: true } : {}), artifactId: page.artifactId, textSourceId: page.textSourceId, sourceDigest: page.sourceDigest, actor: readerIdentity(actor), ...(actor.type === 'agent' ? { permission: actor.permission ?? this.app.sessionPermissions.capture(actor.sessionId) } : {}), callId, cursor: page.cursor, end: page.end, utf16Start: page.utf16Start, utf16End: page.utf16End, contentDigest: digest(Buffer.from(page.content)), delivery: actor.type === 'user' ? 'owner-read' : 'pending' }, randomUUID());
        return { artifactReadId: read.id };
    }
    markReplay(actor, pid, id) { const r = this.app.store.get('artifact-text-read', id, pid); this.authorize(actor, pid, r.artifactId); if (r.delivery === 'pending' && !r.replayed)
        this.app.store.update('artifact-text-read', r.id, r.version, { replayed: true }); }
    offer(actor, pid, id, callId) { const r = this.app.store.get('artifact-text-read', id, pid); if (r.delivery !== 'pending' || r.offered || r.replayed || r.callId !== callId || digest(r.actor) !== digest(readerIdentity(actor)))
        return false; this.checkRead(actor, pid, r); this.app.store.update('artifact-text-read', r.id, r.version, { offered: true }); return true; }
    deliver(actor, pid, id, callId) { const r = this.app.store.get('artifact-text-read', id, pid); ensure(r.delivery === 'pending' && !r.replayed && r.offered && r.callId === callId, 'ARTIFACT_DELIVERY_STALE', '固定页回执状态不符', 409); this.checkRead(actor, pid, r); this.app.store.update('artifact-text-read', r.id, r.version, { delivery: 'delivered' }); }
    checkRead(actor, pid, r, approvedInput, evidenceId) {
        const current = readerIdentity(actor), same = digest(r.actor) === digest(current);
        if (!same) {
            const { generation, ...originalStable } = r.actor, { generation: currentGeneration, ...currentStable } = current;
            ensure(approvedInput && r.delivery === 'delivered' && digest(originalStable) === digest(currentStable), 'ARTIFACT_READ_REQUIRED', '需要此执行身份实际读取的单页回执', 403);
        }
        if (approvedInput && actor.permissionActionId)
            this.app.sessionPermissions.assertEvidenceAction(actor, approvedInput, { generation: r.actor.generation, sessionId: r.actor.sessionId }, evidenceId);
        else
            ensure(same, 'ARTIFACT_READ_REQUIRED', '需要此执行身份实际读取的单页回执', 403);
        this.authorize(actor, pid, r.artifactId);
        if (r.permission)
            this.app.sessionPermissions.assert(r.permission, false);
        const page = this.page(actor, pid, { artifactId: r.artifactId, sourceDigest: r.sourceDigest, textSourceId: r.textSourceId, cursor: r.cursor, limit: Math.max(4, r.end - r.cursor) });
        ensure(page.end === r.end && page.utf16Start === r.utf16Start && page.utf16End === r.utf16End && digest(Buffer.from(page.content)) === r.contentDigest, 'ARTIFACT_DELIVERY_STALE', '原页已改变', 409);
        return page;
    }
    register(actor, pid, input) {
        const a = this.authorize(actor, pid, input.artifactId);
        assertDiscoveryArtifact(this.app.store, pid, a);
        const r = this.app.store.get('artifact-text-read', input.readId, pid);
        ensure(r.artifactId === a.id && (actor.type === 'user' ? r.delivery === 'owner-read' : actor.type === 'agent' && r.delivery === 'delivered'), 'ARTIFACT_READ_REQUIRED', '登记需要自己的已送达单页或Owner手动读取记录', 403);
        const page = this.checkRead(actor, pid, r, input), quote = text(input.exactQuote, 'exactQuote', 16000), start = page.content.indexOf(quote);
        ensure(start >= 0, 'EVIDENCE_QUOTE_NOT_FOUND', 'exactQuote 必须逐字来自这一已返回页', 400);
        ensure(page.content.indexOf(quote, start + 1) < 0, 'EVIDENCE_QUOTE_AMBIGUOUS', '这一页内有重复片段；请扩大引文或重新读取有界页', 400);
        const end = start + quote.length, boundary = (i) => i === 0 || i === page.content.length || !(page.content.charCodeAt(i) >= 0xdc00 && page.content.charCodeAt(i) <= 0xdfff && page.content.charCodeAt(i - 1) >= 0xd800 && page.content.charCodeAt(i - 1) <= 0xdbff);
        ensure(boundary(start) && boundary(end) && Buffer.from(quote).toString('utf8') === quote, 'EVIDENCE_QUOTE_MISMATCH', '引文不能拆分完整字符', 400);
        verifyStreamedBlob(this.app.store, blob(a));
        const byteStart = r.cursor + Buffer.byteLength(page.content.slice(0, start)), byteEnd = byteStart + Buffer.byteLength(quote);
        return this.app.store.create('evidence', pid, { type: 'artifact', artifactId: a.id, digest: a.digest, locator: { start: r.utf16Start + start, end: r.utf16Start + end }, quote, description: '原文片段；解释与研究断言未核验', fixedText: { readProtocol: 'fixed-text-v1', textSourceId: r.textSourceId, readId: r.id, start: byteStart, end: byteEnd } });
    }
    replayQuote(actor, pid, input, id) {
        const a = this.authorize(actor, pid, input.artifactId);
        assertDiscoveryArtifact(this.app.store, pid, a);
        const r = this.app.store.get('artifact-text-read', input.readId, pid);
        ensure(r.artifactId === input.artifactId && (actor.type === 'user' ? r.delivery === 'owner-read' : r.delivery === 'delivered'), 'ARTIFACT_READ_REQUIRED', '回执不属于此引文', 403);
        this.checkRead(actor, pid, r, input, id);
        const e = this.app.evidence.verify(pid, id);
        ensure(e.fixedText?.readId === r.id && e.artifactId === input.artifactId && e.quote === input.exactQuote, 'EVIDENCE_INVALID', '缓存引文绑定不符', 409);
        return e;
    }
}
//# sourceMappingURL=fixed-text.js.map