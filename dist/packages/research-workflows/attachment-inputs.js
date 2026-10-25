import { randomUUID } from 'node:crypto';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { attachmentScope } from '../pi-adapter/attachments.js';
import { fixedDocumentTextSource } from '../documents/fixed-text-source.js';
import { verifyStreamedBlob, readStreamedText } from '../storage/streamed-blob.js';
export function recordAttachmentRead(store, actor, selected, page, callId, requestedBindingId) {
    if (page.readProtocol !== 'fixed-text-v1')
        return;
    const session = store.get('session', selected.id, actor.projectId);
    attachmentScope(store, actor, session, page);
    ensure(actor.type === 'agent' && !actor.taskId && !actor.attemptId && !actor.wakeupId && !actor.continuationId && !actor.approvalResumeId, 'ATTACHMENT_SCOPE_DENIED', '固定输入仅支持普通主会话', 403);
    const project = store.get('project', session.projectId), selectionId = digest({ sessionId: session.id, documentVersionId: page.documentVersionId }), selection = store.maybe('attachment-input-selection', selectionId);
    if (selection)
        ensure(selection.projectId === session.projectId && selection.sessionId === session.id && selection.documentVersionId === page.documentVersionId, 'BRIEF_SOURCE_CORRUPTED', '当前固定输入选择归属不符');
    const selectedId = requestedBindingId ?? selection?.bindingId, old = selectedId ? store.get('attachment-input-binding', selectedId, session.projectId) : undefined;
    const extension = { 'text/plain': 'txt', 'text/markdown': 'md', 'text/csv': 'csv', 'text/tab-separated-values': 'tsv', 'application/json': 'json', 'application/x-ndjson': 'jsonl' }, doc = store.get('document-version', page.documentVersionId, session.projectId);
    const binding = { sessionId: session.id, anchorBriefId: session.researchBriefId ?? null, messageId: page.messageId, documentVersionId: page.documentVersionId, artifactId: page.artifactId, digest: page.digest, size: page.size, purpose: page.purpose, readProtocol: 'fixed-text-v1', path: `inputs/attachments/${page.documentVersionId}.${extension[doc.original.mediaType]}`, workspace: project.workspace };
    const same = old && old.sessionId === binding.sessionId && old.documentVersionId === binding.documentVersionId && old.artifactId === binding.artifactId && old.digest === binding.digest && old.size === binding.size && old.purpose === binding.purpose && old.messageId === binding.messageId && old.workspace === binding.workspace;
    ensure(!requestedBindingId || same, 'BRIEF_SOURCE_BINDING_CHANGED', '明确绑定的用途、消息或来源不能改变', 409);
    const id = same ? old.id : randomUUID();
    if (!same)
        store.create('attachment-input-binding', session.projectId, binding, id);
    // Selection follows a fresh explicit read, never a delayed ACK or cached result.
    if (!selection)
        store.create('attachment-input-selection', session.projectId, { sessionId: session.id, documentVersionId: page.documentVersionId, bindingId: id }, selectionId);
    else if (selection.bindingId !== id)
        store.update('attachment-input-selection', selection.id, selection.version, { bindingId: id });
    const read = store.create('attachment-input-read', session.projectId, { bindingId: id, sessionId: session.id, generation: actor.generation, callId, cursor: page.cursor, end: page.end, contentDigest: digest(Buffer.from(page.content)), delivery: 'pending' }, randomUUID());
    return { attachmentReadId: read.id, attachmentBindingId: id, sourceInputPath: binding.path };
}
/** Host-only ACK. The host additionally validates the exact SDK result and worker identity. */
export function deliverAttachmentRead(store, actor, readId, callId) {
    const read = store.get('attachment-input-read', readId, actor.projectId), binding = store.get('attachment-input-binding', read.bindingId, actor.projectId), session = store.get('session', actor.sessionId, actor.projectId);
    ensure(read.delivery === 'pending' && read.offered && read.callId === callId && read.sessionId === actor.sessionId && read.generation === actor.generation && binding.sessionId === actor.sessionId, 'ATTACHMENT_DELIVERY_STALE', '固定输入回执身份不符', 409);
    attachmentScope(store, actor, session, binding);
    const fixed = fixedDocumentTextSource(store, store.get('document-version', binding.documentVersionId, actor.projectId));
    ensure(fixed.source.digest === binding.digest && fixed.source.size === binding.size, 'BRIEF_SOURCE_CHANGED', '固定输入已变化');
    const page = readStreamedText(store, fixed.source, fixed.indexBlob, fixed.index, read.cursor, Math.max(4, read.end - read.cursor));
    ensure(page.end === read.end && digest(Buffer.from(page.content)) === read.contentDigest, 'ATTACHMENT_DELIVERY_STALE', '固定页在送达前已变化');
    store.update('attachment-input-read', read.id, read.version, { delivery: 'delivered' });
}
function hasDeliveredCoverage(store, pid, binding) {
    const reads = store.list('attachment-input-read', pid).filter(r => r.bindingId === binding.id && r.sessionId === binding.sessionId && r.delivery === 'delivered' && r.end > r.cursor).sort((a, b) => a.cursor - b.cursor);
    if (!reads.length)
        return false;
    if (binding.purpose === 'whole-text') {
        let end = 0;
        for (const r of reads) {
            if (r.cursor > end)
                break;
            end = Math.max(end, r.end);
        }
        return end === binding.size;
    }
    return true;
}
function assertAttachmentAuthority(store, session, binding) {
    ensure(binding.sessionId === session.id, 'BRIEF_SOURCE_CORRUPTED', '固定附件不属于当前主会话');
    attachmentScope(store, { type: 'user', projectId: session.projectId }, session, binding);
    const message = store.get('message', binding.messageId, session.projectId);
    ensure(['running', 'completed'].includes(message.status) && !message.queueRemoved && !message.nativeAttachmentsDisabled, 'ATTACHMENT_NOT_DELIVERED', '附件消息已撤回或未投递', 403);
}
export function attachmentSelectionFingerprint(store, session) {
    return store.list('attachment-input-selection', session.projectId).filter(s => s.sessionId === session.id).map(s => ({ documentVersionId: s.documentVersionId, bindingId: s.bindingId, version: s.version })).sort((a, b) => a.documentVersionId.localeCompare(b.documentVersionId));
}
export function assertAttachmentInput(store, pid, sessionId, input) {
    const binding = store.get('attachment-input-binding', input.readId, pid);
    ensure(binding.sessionId === sessionId && input.readProtocol === 'fixed-text-v1' && input.documentVersionId === binding.documentVersionId && input.purpose === binding.purpose && input.artifactId === binding.artifactId && input.path === binding.path && input.workspace === binding.workspace && input.digest === binding.digest && input.size === binding.size, 'BRIEF_SOURCE_CORRUPTED', '固定附件输入绑定不符');
    // Frozen history keeps its original delivered facts. Current message authority is required at new freeze boundaries.
    ensure(hasDeliveredCoverage(store, pid, binding), 'BRIEF_SOURCE_READ_REQUIRED', binding.purpose === 'whole-text' ? 'whole-text需要完整已送达覆盖；EOF不代表中间范围已读' : '固定输入需要实际SDK送达的检查页');
    const fixed = fixedDocumentTextSource(store, store.get('document-version', binding.documentVersionId, pid));
    ensure(fixed.source.digest === input.digest && fixed.source.size === input.size, 'BRIEF_SOURCE_CHANGED', '固定输入来源已变化');
    verifyStreamedBlob(store, fixed.source);
    verifyStreamedBlob(store, fixed.indexBlob);
}
export function attachmentInputs(store, session, inheritedIds, status) {
    const selected = attachmentSelectionFingerprint(store, session).flatMap(selection => {
        const b = store.get('attachment-input-binding', selection.bindingId, session.projectId);
        ensure(b.sessionId === session.id && b.documentVersionId === selection.documentVersionId, 'BRIEF_SOURCE_CORRUPTED', '当前固定输入选择不符');
        if (status === 'clarifying' && !inheritedIds.includes(b.id) && !hasDeliveredCoverage(store, session.projectId, b))
            return [];
        assertAttachmentAuthority(store, session, b);
        const input = { path: b.path, workspace: b.workspace, artifactId: b.artifactId, digest: b.digest, size: b.size, readId: b.id, readProtocol: b.readProtocol, purpose: b.purpose, documentVersionId: b.documentVersionId };
        assertAttachmentInput(store, session.projectId, session.id, input);
        return [input];
    });
    for (const id of inheritedIds) {
        const old = store.get('attachment-input-binding', id, session.projectId), replacement = selected.find(input => input.documentVersionId === old.documentVersionId && input.readId !== id);
        if (replacement)
            ensure(replacement.artifactId === old.artifactId && replacement.digest === old.digest && replacement.size === old.size && replacement.path === old.path && replacement.workspace === old.workspace, 'BRIEF_SOURCE_BINDING_CHANGED', '替换输入必须保留原文档、产物及摘要');
        else
            assertAttachmentAuthority(store, session, old);
    }
    return selected;
}
//# sourceMappingURL=attachment-inputs.js.map