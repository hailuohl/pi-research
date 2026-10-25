import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
/** Internal descriptor adapter. Callers must establish their own byte-reading authority. */
export function fixedDocumentTextSource(store, d) {
    ensure(d.source.kind === 'upload' && d.contentKind === 'user-text' && !d.discoveryGrant && !d.scopeSessionId && !d.scopeTaskId && !d.derivedText, 'DOCUMENT_TEXT_SOURCE_DENIED', '分页只接受用户上传的固定文本原件', 403);
    const fixed = store.maybe('document-text-source', d.id);
    ensure(fixed, 'DOCUMENT_TEXT_INDEX_REQUIRED', '该原件没有流式文本索引；旧 JSON 导入保留原读取协议', 409);
    ensure(fixed.projectId === d.projectId, 'SCOPE_DENIED', '固定文本索引属于其他项目', 403);
    ensure(fixed.documentVersionId === d.id && digest(fixed.original) === digest(d.original), 'DOCUMENT_INVALID', '固定文本索引绑定已改变', 409);
    const artifact = (descriptor, origin) => { const a = store.get('artifact', descriptor.artifactId, d.projectId); ensure(digest({ artifactId: a.id, digest: a.digest, size: a.size, mediaType: a.mediaType }) === digest(descriptor) && a.origin === origin && !a.taskId && !a.runId && !a.wakeupId && !a.discoveryGrant, 'DOCUMENT_INVALID', '固定文本产物绑定已改变', 409); return { blobPath: a.path, digest: a.digest, size: a.size }; };
    return { source: artifact(fixed.original, 'document:user-upload'), indexBlob: artifact(fixed.indexArtifact, 'document:text-index'), index: fixed.index };
}
//# sourceMappingURL=fixed-text-source.js.map