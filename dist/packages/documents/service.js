import { fixedDocumentTextSource } from './fixed-text-source.js';
import { assertDiscoveryArtifact, discoveryContext, discoveryScope } from '../policy/discovery-grant-validation.js';
import { digest } from '../storage/store.js';
import { connectorSettings, assertSourceEnabled } from '../connectors/settings.js';
import { userOnly, scope } from '../policy/permissions.js';
import { assertProjectWritable, assertProjectReadable } from '../policy/lifecycle.js';
import { ensure } from '../domain/errors.js';
import { integer, text, oneOf } from '../contracts/validation.js';
import { routePaperId } from '../connectors/contracts.js';
import { filePolicy, TEXT_PAGE_BYTES, LEGACY_DOCUMENT_BYTES } from '../storage/file-policy.js';
import { prepareStreamedText, publishStreamedText, readStreamedText, verifyStreamedBlob } from '../storage/streamed-blob.js';
import { assertUploadedMedia } from './uploaded-media.js';
import { ATTACHMENT_MEDIA_TYPES, NATIVE_ATTACHMENT_BYTES } from '../pi-adapter/attachment-input.js';
export class DocumentService {
    c;
    evidence;
    connectors;
    constructor(c, evidence, connectors) {
        this.c = c;
        this.evidence = evidence;
        this.connectors = connectors;
    }
    get(actor, pid, id) { userOnly(actor); scope(actor, pid); assertProjectReadable(this.c.store, pid, actor); return this.c.store.get('document-version', id, pid); }
    inspect(actor, pid, id) { const d = this.get(actor, pid, id); this.verify(d); return d; }
    verify(d) {
        if (this.c.store.maybe('document-text-source', d.id)) {
            const fixed = this.textSource(d);
            verifyStreamedBlob(this.c.store, fixed.source);
            verifyStreamedBlob(this.c.store, fixed.indexBlob);
            return;
        }
        ensure(d.original.size <= LEGACY_DOCUMENT_BYTES, 'DOCUMENT_TEXT_INDEX_REQUIRED', '大原件缺少固定文本索引，不能退回旧全文读取路径', 409);
        for (const item of [d.original, ...(d.derivedText ? [d.derivedText] : [])]) {
            const { artifact: a } = this.evidence.read({ type: 'system' }, item.artifactId);
            ensure(a.projectId === d.projectId && a.digest === item.digest && a.size === item.size && a.mediaType === item.mediaType, 'DOCUMENT_INVALID', '文档原件或派生文本绑定已失效');
        }
    }
    textSource(d) { return fixedDocumentTextSource(this.c.store, d); }
    async importStream(actor, pid, value, input, key, signal) {
        userOnly(actor);
        scope(actor, pid);
        ensure(!actor.sessionId && !actor.taskId && !actor.attemptId && !actor.wakeupId, 'DOCUMENT_OWNER_ONLY', '流式原件导入仅接受未绑定会话的 owner 请求', 403);
        const epoch = assertProjectWritable(this.c.store, pid).lifecycleEpoch, policy = filePolicy();
        text(key, 'Idempotency-Key', 200);
        const title = text(value.title, 'title', 200), mediaType = oneOf(value.mediaType, policy.mediaTypes, 'mediaType'), license = value.license === undefined ? null : text(value.license, 'license', 1000);
        const validate = () => { userOnly(actor); scope(actor, pid); assertProjectWritable(this.c.store, pid, epoch); ensure(!signal?.aborted, 'DOCUMENT_UPLOAD_CANCELLED', '上传已取消', 409); };
        const prepared = await prepareStreamedText(this.c.store, pid, input, policy.maxFileBytes, validate), request = { title, mediaType, license, digest: prepared.blob.digest }, op = `document-stream-import:${pid}`;
        const replay = () => { const previous = this.c.store.operationResult(op, key, request); if (!previous.found)
            return; const current = this.get(actor, pid, previous.value.id); ensure(digest(current) === digest(previous.value), 'DOCUMENT_INVALID', '原幂等文档记录已改变', 409); const fixed = this.textSource(current); ensure(digest(fixed.index) === digest(prepared.index) && digest(fixed.indexBlob) === digest(prepared.indexBlob) && digest(fixed.source) === digest(prepared.blob), 'DOCUMENT_INVALID', '原幂等文档索引已改变', 409); verifyStreamedBlob(this.c.store, fixed.source); verifyStreamedBlob(this.c.store, fixed.indexBlob); validate(); return current; };
        try {
            const previous = this.c.store.transaction(() => { validate(); const prior = replay(); if (prior)
                return prior; this.c.store.create('document-blob-publication', pid, prepared.publication, prepared.publication.stagingId); });
            if (previous)
                return previous;
            await publishStreamedText(this.c.store, prepared.publication, validate);
            // Keep durable ownership until redundant stage links are gone, including a crash before the final transaction.
            await prepared.dispose();
            return this.c.store.transaction(() => {
                validate();
                const prior = replay();
                const result = prior ?? this.c.store.operation(op, key, request, () => {
                    const original = this.evidence.publishPrepared(pid, { title, mediaType, origin: 'document:user-upload', path: prepared.blob.blobPath, digest: prepared.blob.digest, size: prepared.blob.size });
                    const indexArtifact = this.evidence.publishPrepared(pid, { title: 'UTF-8 fixed text index', mediaType: 'application/octet-stream', origin: 'document:text-index', path: prepared.indexBlob.blobPath, digest: prepared.indexBlob.digest, size: prepared.indexBlob.size });
                    const d = this.publish(pid, { title, original: this.descriptor(original), source: { kind: 'upload', requestedVersion: null, reportedVersion: null, versionAssurance: 'user-supplied' }, contentKind: 'user-text', acquiredAt: new Date().toISOString(), license: { value: license, assurance: license ? 'user-declared' : 'unknown' }, limitations: ['User-supplied content is untrusted data', 'Acquisition does not verify scientific claims or publication identity', 'Large-file parsing, model delivery and Run inputs require their own supported paths'] });
                    this.c.store.create('document-text-source', pid, { documentVersionId: d.id, original: d.original, indexArtifact: this.descriptor(indexArtifact), index: prepared.index }, d.id);
                    return d;
                });
                this.c.store.db.prepare("DELETE FROM records WHERE kind='document-blob-publication' AND id=? AND project_id=?").run(prepared.publication.stagingId, pid);
                return result;
            });
        }
        finally {
            await prepared.dispose();
        }
    }
    readText(actor, pid, id, input) {
        const d = this.get(actor, pid, id);
        ensure(input.sourceDigest === d.original.digest, 'DOCUMENT_SOURCE_CHANGED', '请使用固定原件的 sourceDigest 续读', 409);
        const fixed = this.textSource(d), page = readStreamedText(this.c.store, fixed.source, fixed.indexBlob, fixed.index, input.cursor ?? 0, input.limit ?? TEXT_PAGE_BYTES);
        // A page proves delivered blocks only, and is never a whole-document reading receipt.
        assertProjectReadable(this.c.store, pid, actor);
        return { documentVersionId: d.id, sourceDigest: d.original.digest, cursorUnit: 'utf8-byte', integrityScope: 'delivered-blocks', ...page };
    }
    list(actor, pid, input = {}) {
        userOnly(actor);
        scope(actor, pid);
        assertProjectReadable(this.c.store, pid, actor);
        const cursor = integer(input.cursor ?? 0, 'cursor', 0, Number.MAX_SAFE_INTEGER), limit = integer(input.limit ?? 50, 'limit', 1, 100);
        const rows = this.c.store.db.prepare("SELECT rowid,data FROM records WHERE kind='document-version' AND project_id=? AND rowid>? ORDER BY rowid LIMIT ?").all(pid, cursor, limit + 1);
        const visible = rows.slice(0, limit);
        return { items: visible.map(r => JSON.parse(r.data)), cursor: visible.length ? Number(visible.at(-1).rowid) : cursor, hasMore: rows.length > limit };
    }
    import(actor, pid, value, key) {
        userOnly(actor);
        scope(actor, pid);
        assertProjectWritable(this.c.store, pid);
        text(key, 'Idempotency-Key', 200);
        const title = text(value.title, 'title', 200), mediaType = oneOf(value.mediaType, ATTACHMENT_MEDIA_TYPES, 'mediaType');
        const encoded = text(value.contentBase64, 'contentBase64', Math.ceil(32 * 1024 * 1024 / 3) * 4);
        ensure(encoded.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(encoded), 'INVALID_INPUT', '需要标准 Base64', 400);
        const bytes = Buffer.from(encoded, 'base64');
        ensure(bytes.toString('base64') === encoded, 'INVALID_INPUT', '需要标准 Base64', 400);
        ensure(bytes.length > 0 && bytes.length <= 32 * 1024 * 1024, 'ARTIFACT_TOO_LARGE', '文档必须在 1 byte–32 MiB 范围', 413);
        if (mediaType.startsWith('text/'))
            ensure(bytes.length <= filePolicy().maxFileBytes, 'ARTIFACT_TOO_LARGE', `原始文本或数据文件最多 ${filePolicy().maxFileBytes} bytes`, 413);
        if (!mediaType.startsWith('text/')) {
            if (mediaType !== 'application/pdf')
                ensure(bytes.length <= NATIVE_ATTACHMENT_BYTES, 'ARTIFACT_TOO_LARGE', '图片或视频原件最多20 MiB', 413);
            assertUploadedMedia(bytes, mediaType);
        }
        else {
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            }
            catch {
                ensure(false, 'DOCUMENT_FORMAT_INVALID', '文本必须是有效 UTF-8', 400);
            }
            ensure(!bytes.includes(0), 'DOCUMENT_FORMAT_INVALID', '文本含无效字符', 400);
        }
        const license = value.license === undefined ? null : text(value.license, 'license', 1000);
        const request = { title, mediaType, license, digest: digest(bytes) }, op = `document-import:${pid}`;
        const old = this.c.store.operationResult(op, key, request);
        if (old.found)
            return old.value;
        const prepared = this.evidence.prepareArtifact(pid, title, bytes, mediaType, 'document:user-upload');
        return this.c.store.operation(op, key, request, () => { scope(actor, pid); assertProjectWritable(this.c.store, pid); const a = this.evidence.publishPrepared(pid, prepared); return this.publish(pid, { title, original: this.descriptor(a), source: { kind: 'upload', requestedVersion: null, reportedVersion: null, versionAssurance: 'user-supplied' }, contentKind: mediaType === 'application/pdf' ? 'original-pdf' : mediaType.startsWith('text/') ? 'user-text' : 'user-media', acquiredAt: new Date().toISOString(), license: { value: license, assurance: license ? 'user-declared' : 'unknown' }, limitations: ['User-supplied content is untrusted data', 'Acquisition does not verify scientific claims or publication identity'] }); });
    }
    createFromPaper(actor, pid, paperReadId, key) {
        userOnly(actor);
        scope(actor, pid);
        assertProjectWritable(this.c.store, pid);
        text(key, 'Idempotency-Key', 200);
        const op = `document-paper:${pid}`, request = { paperReadId }, old = this.c.store.operationResult(op, key, request);
        if (old.found)
            return old.value;
        const prepared = this.stagePaper(actor, pid, paperReadId);
        return this.c.store.operation(op, key, request, () => { prepared.validate(); return this.publish(pid, prepared.doc); });
    }
    stagePaper(actor, pid, paperReadId) {
        const p = this.c.store.get('paper-read', paperReadId, pid), rawIds = p.rawArtifactIds ?? [];
        const id = rawIds.length ? rawIds[0] : p.artifactId;
        const artifacts = [...new Set([id, p.artifactId, ...rawIds])].map(id => this.evidence.read(actor, id).artifact);
        artifacts.forEach(a => { ensure(a.projectId === pid, 'SCOPE_DENIED', '原件属于其他项目', 403); assertDiscoveryArtifact(this.c.store, pid, a); });
        const a = artifacts.find(a => a.id === id);
        ensure(artifacts.find(a => a.id === p.artifactId).digest === p.artifactDigest, 'DOCUMENT_INVALID', '论文读取内容绑定失效');
        const contentKind = p.contentKind === 'full_text' ? 'provider-text' : oneOf(p.contentKind, ['metadata', 'abstract', 'original-pdf'], 'contentKind');
        const doc = { ...(p.pmcTextProfile !== undefined ? { pmcTextProfile: oneOf(p.pmcTextProfile, ['pmc-jats-text-v1', 'pmc-jats-text-v2'], 'pmcTextProfile') } : {}), ...(p.discoveryGrant ? { discoveryGrant: p.discoveryGrant } : {}), title: String(p.title).slice(0, 200), original: this.descriptor(a), ...(id !== p.artifactId ? { derivedText: this.descriptor(artifacts.find(a => a.id === p.artifactId)) } : {}), source: { kind: 'connector', provider: p.source, requestedId: p.requestedId, resolvedId: p.resolvedId ?? p.idInSource, requestedVersion: p.requestedVersion ?? p.requestedId?.match(/v([1-9]\d*)$/)?.[1] ?? null, reportedVersion: p.reportedVersion ?? null, versionAssurance: p.versionAssurance, sourceUrl: p.sourceUrl }, contentKind, acquiredAt: p.retrievedAt, license: { value: p.license ?? null, assurance: p.license ? 'provider-reported' : 'unknown' }, rawResponseArtifactIds: rawIds, ...(p.pageMapping ? { pageMapping: p.pageMapping } : {}), scopeSessionId: p.scopeSessionId ?? null, scopeTaskId: p.scopeTaskId ?? null, limitations: [...(p.limitations ?? []), ...(!rawIds.length ? ['Legacy paper record has no original response bytes; retained artifact is derived/provider text, not verified original network bytes'] : [])] };
        const hash = digest(p), artifactHashes = artifacts.map(a => ({ id: a.id, hash: digest(a) }));
        return { doc, validate: () => { artifacts.forEach(a => assertDiscoveryArtifact(this.c.store, pid, a)); scope(actor, pid); assertProjectWritable(this.c.store, pid); ensure(digest(this.c.store.get('paper-read', paperReadId, pid)) === hash && artifactHashes.every(a => digest(this.c.store.get('artifact', a.id, pid)) === a.hash), 'DOCUMENT_INVALID', '已暂存的原件记录已改变'); } };
    }
    async acquire(actor, pid, input, key, validate = () => { }, signal) {
        userOnly(actor);
        scope(actor, pid);
        text(key, 'Idempotency-Key', 200);
        this.connectors.assertAuthorized(actor, pid);
        validate();
        const settingsVersion = connectorSettings(this.c.store, pid).version;
        const originalValidate = validate, lifecycleEpoch = assertProjectWritable(this.c.store, pid).lifecycleEpoch;
        validate = () => { assertProjectWritable(this.c.store, pid, lifecycleEpoch); originalValidate(); this.connectors.assertAuthorized(actor, pid); assertSourceEnabled(this.c.store, pid, input.source); ensure(connectorSettings(this.c.store, pid).version === settingsVersion, 'CONNECTOR_SETTINGS_CHANGED', '来源设置已改变'); ensure(!signal?.aborted, 'CONNECTOR_CANCELLED', '获取已取消'); };
        validate();
        const target = routePaperId(input.id, input.source), format = oneOf(input.format, ['provider-text', 'original-pdf', 'oa-full-text'], 'format');
        if (format === 'oa-full-text') {
            ensure(target.source === 'pubmed', 'PAPER_SOURCE_MISMATCH', 'oa-full-text 只支持 PubMed PMID', 400);
            ensure(!input.requestedVersion, 'PAPER_VERSION_UNSUPPORTED', 'oa-full-text 使用来源报告的 PMC 版本', 400);
            ensure(!actor.sessionId && !actor.taskId && !actor.attemptId && !actor.wakeupId, 'FULL_TEXT_OWNER_ONLY', 'PMC OA 全文只支持未绑定会话的 owner 请求', 403);
        }
        const normalized = { ...target, format, ...(input.requestedVersion ? { requestedVersion: text(input.requestedVersion, 'requestedVersion', 10) } : {}) };
        const ctx = format === 'oa-full-text' ? undefined : discoveryContext(this.c.store, pid, actor, { kind: 'retrieve', target: { ...normalized, format: format } }, key);
        const op = discoveryScope(`document-acquire:${pid}`, ctx), old = this.c.store.operationResult(op, key, normalized);
        if (old.found) {
            this.verify(old.value);
            return old.value;
        }
        // A paper receipt makes a crash between network completion and document publication replayable.
        let p;
        if (format === 'original-pdf')
            p = await this.connectors.pdf(actor, pid, normalized, `document:${key}`, validate, signal);
        else if (format === 'oa-full-text')
            p = await this.connectors.oaFullText(actor, pid, target, `document:${key}`, validate, signal);
        else {
            ensure(!normalized.requestedVersion || target.source === 'alphaxiv', 'PAPER_VERSION_UNSUPPORTED', '该来源文本接口不支持指定版本', 400);
            if (normalized.requestedVersion) {
                const v = normalized.requestedVersion.replace(/^v/, '');
                ensure(/^[1-9]\d{0,5}$/.test(v), 'INVALID_INPUT', '版本必须是正整数', 400);
                const embedded = target.id.match(/v([1-9]\d*)$/)?.[1];
                ensure(!embedded || embedded === v, 'PAPER_VERSION_MISMATCH', '地址与指定版本不一致', 400);
            }
            const id = normalized.requestedVersion ? target.id.replace(/v[1-9]\d*$/, '') + 'v' + normalized.requestedVersion.replace(/^v/, '') : target.id;
            p = await this.connectors.paper(actor, pid, { ...target, id }, `document:${key}`, validate, signal);
        }
        validate();
        ensure(!signal?.aborted, 'CONNECTOR_CANCELLED', '获取已取消');
        const prepared = this.stagePaper(actor, pid, p.id);
        return this.c.store.transaction(() => { validate(); prepared.validate(); return this.c.store.operation(op, key, normalized, () => this.publish(pid, prepared.doc)); });
    }
    descriptor(a) { return { artifactId: a.id, digest: a.digest, size: a.size, mediaType: a.mediaType }; }
    publish(pid, doc) { const row = this.c.store.create('document-version', pid, doc); this.c.store.event(pid, 'document.acquired', { documentVersionId: row.id, contentKind: row.contentKind }); return row; }
}
//# sourceMappingURL=service.js.map