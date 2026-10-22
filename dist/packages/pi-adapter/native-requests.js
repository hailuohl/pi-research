import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { userOnly, scope } from '../policy/permissions.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { ensure, DomainError } from '../domain/errors.js';
import { object, text, integer } from '../contracts/validation.js';
import { digest } from '../storage/store.js';
import { readArtifactBlob } from '../storage/artifact-blob.js';
import { environmentSecrets } from '../runtime/environment.js';
import { modelCatalog } from './model-management.js';
import { locatePi, PI_VERSION } from './runtime.js';
import { resolvedThinking } from './model-definition.js';
import { modelConnectionSnapshot, readModelState, assertModelEnabled, assertModelRestoreCurrent } from './model-connections.js';
import { publicationImageCatalog } from './publication-image.js';
import { nativeAvailability, nativeEndpoint, nativeRequestBody, NATIVE_FILE_BYTES, NATIVE_RESPONSE_BYTES } from './native-protocol.js';
import { acquireOwnerNativeHttp, finishOwnerNativeHttp, recoverOwnerNativeHttp } from './native-http.js';
import { parseNativeResponse } from './native-response.js';
const closed = (value, keys) => { const x = object(value); ensure(Object.keys(x).every(k => keys.includes(k)), 'INVALID_INPUT', '原生请求包含未知字段', 400); return x; };
const terminal = new Set(['completed', 'incomplete', 'failed', 'cancelled', 'unknown', 'rejected', 'stale']);
const MAX_RESPONSE_MS = 120000;
const safeError = (status) => status === 401 || status === 403 ? '供应商认证失败' : status === 404 ? '供应商模型或接口不存在' : status === 429 ? '供应商限制请求频率' : status >= 500 ? '供应商服务失败' : '供应商拒绝原生请求';
const tuple = (r) => ({ sessionId: r.sessionId, prompt: r.prompt, model: r.model, destination: r.destination, sources: r.sources, search: r.search, maxOutputTokens: r.maxOutputTokens, expiresAt: r.expiresAt, permission: r.permission, metadataDigest: r.metadataDigest, catalogFingerprint: r.catalogFingerprint, credentialRevision: r.credentialRevision, managementVersion: r.managementVersion, ...(r.previousRequestId ? { previousRequestId: r.previousRequestId, previousReceiptDigest: r.previousReceiptDigest, previousContinuationDigest: r.previousContinuationDigest } : {}) });
/** Explicit owner requests run independently of Pi's AgentLoop and its image grants. */
export class NativeRequestService {
    app;
    fetcher;
    ownerHost = randomUUID();
    active = new Map();
    drains = new Map();
    stopped = false;
    get hasPending() { return this.drains.size > 0; }
    constructor(app, fetcher = globalThis.fetch) {
        this.app = app;
        this.fetcher = fetcher;
        recoverOwnerNativeHttp(app.store);
    }
    owner(actor, sessionId, write = true) { userOnly(actor); ensure(!actor.taskId && !actor.wakeupId && !actor.attemptId && !actor.sessionId, 'NATIVE_OWNER_REQUIRED', '原生外发仅接受未绑定任务的本机用户操作', 403); const session = this.app.sessions.get(actor, sessionId); scope(actor, session.projectId); if (write) {
        assertProjectWritable(this.app.store, session.projectId);
        ensure(session.role === 'coordinator' && !session.teamId && !session.taskId && session.state !== 'archived', 'NATIVE_SCOPE_DENIED', '原生外发仅支持未归档的交互主会话', 403);
    } return session; }
    selected(session) {
        assertModelRestoreCurrent(this.app.context.dataDir, session.model);
        const snap = modelConnectionSnapshot(this.app.context.dataDir, session.model.provider), connection = snap.connection;
        ensure(connection && !connection.controlOnly && !connection.deletedAt && connection.enabled !== false, 'NATIVE_MANAGED_MODEL_REQUIRED', '请先保存并启用模型连接与完整模型定义', 409);
        const definition = assertModelEnabled(this.app.context.dataDir, session.model, connection);
        ensure(definition, 'NATIVE_MANAGED_MODEL_REQUIRED', '原生外发需要页面保存的完整模型定义', 409);
        const permission = this.app.sessionPermissions.capture(session.id);
        ensure(permission.mode !== 'readOnly', 'SESSION_READ_ONLY', '只读会话不能外发原件或原生联网请求', 403);
        const model = { ...session.model };
        const { name, order, revision, configuration, ...metadata } = definition;
        return { connection, definition, model, permission, metadataDigest: digest(metadata), catalogFingerprint: publicationImageCatalog(join(this.app.context.dataDir, 'models.json'), snap.catalog), credentialRevision: connection.credentialRevision ?? 1, managementVersion: snap.version };
    }
    redactor(capturedSecrets = [], outputOnly = false) {
        const values = [...capturedSecrets, process.env.PI_API_KEY ?? ''];
        try {
            values.push(...readModelState(this.app.context.dataDir).connections.map(p => p.apiKey));
        }
        catch (error) {
            if (!outputOnly)
                throw error;
        }
        try {
            values.push(...environmentSecrets(this.app.context.dataDir));
        }
        catch (error) {
            if (!outputOnly)
                throw error;
        }
        const secrets = [...new Set(values.filter(Boolean).flatMap(s => [s, encodeURIComponent(s), JSON.stringify(s).slice(1, -1)]))].sort((a, b) => b.length - a.length);
        return (input) => secrets.reduce((s, key) => s.split(key).join('[REDACTED]'), input);
    }
    source(actor, session, pick, read = false) {
        const x = closed(pick, ['kind', 'id']), id = text(x.id, 'source.id', 100);
        let source;
        if (x.kind === 'document') {
            const d = this.app.store.get('document-version', id, session.projectId);
            ensure(d.source.kind === 'upload' && d.contentKind === 'original-pdf' && !d.discoveryGrant && !d.scopeSessionId && !d.scopeTaskId && d.original.mediaType === 'application/pdf', 'NATIVE_SOURCE_DENIED', '只允许本项目用户上传的原始PDF；来源授权不由通用ID绕过', 403);
            source = { kind: 'document', id: d.id, ...d.original, title: d.title, mediaType: 'application/pdf', scope: 'whole-file' };
        }
        else {
            ensure(x.kind === 'media', 'INVALID_INPUT', '来源类型须为document或media', 400);
            const m = this.app.store.get('native-media', id, session.projectId);
            source = { kind: 'media', id: m.id, artifactId: m.artifactId, digest: m.digest, title: m.title, size: m.size, mediaType: m.mediaType, scope: 'whole-file' };
        }
        const artifact = this.app.store.get('artifact', source.artifactId, session.projectId);
        ensure(artifact.origin === (source.kind === 'document' ? 'document:user-upload' : 'native-media:user-upload') && !artifact.taskId && !artifact.runId && !artifact.wakeupId && !artifact.discoveryGrant && artifact.digest === source.digest && artifact.size === source.size && artifact.mediaType === source.mediaType, 'NATIVE_SOURCE_INVALID', '原件身份或摘要已变化', 409);
        ensure(source.size > 0 && source.size <= NATIVE_FILE_BYTES && ['application/pdf', 'video/mp4'].includes(source.mediaType), 'NATIVE_SOURCE_LIMIT', '原件最多20 MiB，只支持PDF/MP4', 413);
        source.title = this.redactor()(source.title);
        if (!read)
            return source;
        const bytes = readArtifactBlob(this.app.store, { blobPath: artifact.path, digest: artifact.digest, size: artifact.size }, NATIVE_FILE_BYTES);
        if (source.mediaType === 'application/pdf')
            ensure(bytes.subarray(0, 5).toString('ascii') === '%PDF-', 'NATIVE_SOURCE_INVALID', 'PDF原件签名无效', 409);
        else
            ensure(bytes.length >= 24 && bytes.toString('ascii', 4, 8) === 'ftyp', 'NATIVE_SOURCE_INVALID', 'MP4原件容器签名无效', 409);
        return { source, bytes };
    }
    files(actor, session, sources) { ensure(sources.length <= 5, 'INVALID_INPUT', '最多选择5个原件', 400); ensure(new Set(sources.map(s => s.kind + ':' + s.id)).size === sources.length, 'INVALID_INPUT', '原件不能重复', 400); const files = sources.map(p => this.source(actor, session, p, true)); ensure(files.reduce((n, f) => n + f.bytes.length, 0) <= NATIVE_FILE_BYTES, 'NATIVE_SOURCE_LIMIT', '一次外发原件合计最多20 MiB', 413); return files; }
    continuation(row) { ensure(row.continuation, 'NATIVE_CONTINUATION_UNAVAILABLE', '原生续跑数据不可用', 409); const artifact = this.app.store.get('artifact', row.continuation.artifactId, row.projectId); ensure(artifact.origin === 'native-continuation' && artifact.digest === row.continuation.digest, 'NATIVE_CONTINUATION_INVALID', '原生续跑绑定已变化', 409); const bytes = readArtifactBlob(this.app.store, { blobPath: artifact.path, digest: artifact.digest, size: artifact.size }, NATIVE_RESPONSE_BYTES); let data; try {
        data = JSON.parse(bytes.toString('utf8'));
    }
    catch {
        throw new DomainError('NATIVE_CONTINUATION_INVALID', '原生续跑数据无法读取', 409);
    } ensure(Array.isArray(data), 'NATIVE_CONTINUATION_INVALID', '原生续跑数据不是准确返回块', 409); ensure(this.redactor()(JSON.stringify(data)) === JSON.stringify(data), 'NATIVE_CONTINUATION_UNAVAILABLE', '原生续跑含受保护内容，不能发送', 409); return data; }
    validate(actor, row, approval = true) {
        ensure(row.tupleDigest === digest(tuple(row)), 'NATIVE_TUPLE_INVALID', '固定请求元组已变化，不能沿原批准外发', 409);
        const session = this.owner(actor, row.sessionId), captured = this.selected(session);
        ensure(digest(captured.model) === digest(row.model) && captured.connection.baseUrl === row.destination.baseUrl && captured.connection.api === row.destination.api && captured.definition.nativeProfile === row.destination.profile && captured.metadataDigest === row.metadataDigest && captured.catalogFingerprint === row.catalogFingerprint && captured.credentialRevision === row.credentialRevision && captured.managementVersion === row.managementVersion, 'NATIVE_CONFIGURATION_STALE', '模型、连接、凭据版本或目录已变化，需重新准备并批准', 409);
        this.app.sessionPermissions.assert(row.permission);
        ensure(digest(captured.permission) === digest(row.permission), 'SESSION_PERMISSION_STALE', '当前会话权限已变化', 403);
        ensure(Date.now() < Date.parse(row.expiresAt), 'NATIVE_EXPIRED', '原生请求准备已过期，请重新准备', 409);
        const files = this.files(actor, session, row.sources.map(({ kind, id }) => ({ kind, id })));
        ensure(digest(files.map(f => f.source)) === digest(row.sources), 'NATIVE_SOURCE_INVALID', '固定原件描述已改变', 409);
        let previous, blocks;
        if (row.previousRequestId) {
            previous = this.app.store.get('native-request', row.previousRequestId, row.projectId);
            ensure(previous.sessionId === row.sessionId && previous.state === 'incomplete' && previous.receipt?.digest === row.previousReceiptDigest && previous.continuation?.digest === row.previousContinuationDigest, 'NATIVE_CONTINUATION_INVALID', '前次原生回执已变化', 409);
            blocks = this.continuation(previous);
        }
        if (approval)
            this.app.approvals.assert(row.approvalId, row.projectId, row.id, row.tupleDigest, 'native.request');
        return { session, captured, files, ...(previous && blocks ? { previous: { prompt: previous.prompt, blocks } } : {}) };
    }
    refresh(row) { if (this.app.store.get('project', row.projectId).status !== 'active' || !['pending', 'approved'].includes(row.state))
        return row; try {
        this.validate({ type: 'user' }, row, false);
    }
    catch {
        this.app.store.transaction(() => { const current = this.app.store.get('native-request', row.id); if (['pending', 'approved'].includes(current.state)) {
            this.app.store.update('native-request', row.id, current.version, { state: 'stale', error: '原件、模型、权限或请求期限已变化，请重新准备。' });
            this.app.approvals.stale(row.id);
        } });
        return this.app.store.get('native-request', row.id);
    } return row; }
    view(row) {
        const approval = this.app.store.get('approval', row.approvalId, row.projectId);
        let response = null;
        if (row.receipt) {
            const artifact = this.app.store.get('artifact', row.receipt.artifactId, row.projectId);
            ensure(artifact.origin === 'native-receipt' && artifact.digest === row.receipt.digest, 'NATIVE_RECEIPT_INVALID', '固定回执绑定已变化', 409);
            const bytes = readArtifactBlob(this.app.store, { blobPath: artifact.path, digest: artifact.digest, size: artifact.size }, NATIVE_RESPONSE_BYTES);
            response = JSON.parse(bytes.toString('utf8'));
        }
        return { id: row.id, version: row.version, projectId: row.projectId, sessionId: row.sessionId, createdAt: row.createdAt, updatedAt: row.updatedAt, prompt: row.prompt, model: row.model, destination: row.destination, sources: row.sources, search: row.search, maxOutputTokens: row.maxOutputTokens, expiresAt: row.expiresAt, state: row.state, dispatchBudget: 1, dispatched: row.dispatched, ...(row.previousRequestId ? { previousRequestId: row.previousRequestId } : {}), approval: { id: approval.id, version: approval.version, status: approval.status, reason: approval.reason }, response, receipt: row.receipt ?? null, continuationAvailable: !!row.continuation, ...(row.error ? { error: row.error } : {}) };
    }
    inspect(actor, id) { userOnly(actor); const row = this.app.store.get('native-request', text(id, 'requestId', 100)); this.owner(actor, row.sessionId, false); return this.view(this.refresh(row)); }
    list(actor, sessionId, input = {}) {
        const session = this.owner(actor, sessionId, false), x = closed(input, ['cursor', 'limit']), cursor = integer(x.cursor ?? 0, 'cursor', 0, Number.MAX_SAFE_INTEGER), limit = integer(x.limit ?? 20, 'limit', 1, 50), rows = this.app.store.db.prepare("SELECT rowid,data FROM records WHERE kind='native-request' AND project_id=? AND json_extract(data,'$.sessionId')=? AND (?=0 OR rowid<?) ORDER BY rowid DESC LIMIT ?").all(session.projectId, sessionId, cursor, cursor, limit + 1), sources = [];
        for (const kind of ['document-version', 'native-media'])
            for (const raw of this.app.store.list(kind, session.projectId)) {
                try {
                    sources.push(this.source(actor, session, { kind: kind === 'document-version' ? 'document' : 'media', id: raw.id }));
                }
                catch { /* Protected connector and unsupported sources are not choices. */ }
            }
        let availability;
        try {
            this.owner(actor, sessionId);
            const selected = this.selected(session);
            availability = nativeAvailability(selected.connection.api, selected.definition);
        }
        catch (error) {
            availability = { ...nativeAvailability(null, undefined), reason: error.message };
        }
        return { requests: rows.slice(0, limit).map(raw => this.view(this.refresh(JSON.parse(String(raw.data))))), sources, availability, nextCursor: rows.length > limit ? Number(rows[limit - 1].rowid) : null };
    }
    importMedia(actor, sessionId, value, key) { const session = this.owner(actor, sessionId), x = closed(value, ['title', 'mediaType', 'contentBase64']); ensure(x.mediaType === 'video/mp4', 'INVALID_INPUT', '仅支持用户选择的MP4原视频', 400); const title = text(x.title, 'title', 200), encoded = text(x.contentBase64, 'contentBase64', Math.ceil(NATIVE_FILE_BYTES / 3) * 4); ensure(encoded.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(encoded), 'INVALID_INPUT', 'MP4必须是标准Base64', 400); const bytes = Buffer.from(encoded, 'base64'); ensure(bytes.length >= 24 && bytes.length <= NATIVE_FILE_BYTES && bytes.toString('base64') === encoded && bytes.toString('ascii', 4, 8) === 'ftyp', 'NATIVE_MEDIA_INVALID', 'MP4须为有效容器签名且不超过20 MiB', 400); const cleanTitle = this.redactor()(title), request = { title: cleanTitle, digest: digest(bytes) }, op = 'native-media-import:' + session.projectId; text(key, 'Idempotency-Key', 200); const old = this.app.store.operationResult(op, key, request); if (old.found)
        return this.source(actor, session, { kind: 'media', id: old.value.id }); const staged = this.app.evidence.prepareArtifact(session.projectId, cleanTitle, bytes, 'video/mp4', 'native-media:user-upload'); return this.app.store.transaction(() => { this.owner(actor, sessionId); const saved = this.app.store.operation(op, key, request, () => { const artifact = this.app.evidence.publishPrepared(session.projectId, staged), media = this.app.store.create('native-media', session.projectId, { artifactId: artifact.id, digest: artifact.digest, title: cleanTitle, size: artifact.size, mediaType: 'video/mp4', scope: 'whole-file' }); return { id: media.id }; }); return this.source(actor, session, { kind: 'media', id: saved.id }); }); }
    prepare(actor, sessionId, value, key) {
        const session = this.owner(actor, sessionId), x = closed(value, ['expectedSessionVersion', 'prompt', 'sources', 'search', 'maxOutputTokens', 'previousRequestId']);
        text(key, 'Idempotency-Key', 200);
        const op = 'native-prepare:' + sessionId, old = this.app.store.operationResult(op, key, value);
        if (old.found)
            return this.inspect(actor, old.value.id);
        ensure(session.version === integer(x.expectedSessionVersion, 'expectedSessionVersion', 1), 'VERSION_CONFLICT', '会话版本已变化，请刷新保留的草稿', 409);
        const prompt = text(x.prompt, 'prompt', 16000);
        ensure(Array.isArray(x.sources) && typeof x.search === 'boolean', 'INVALID_INPUT', '需要明确的原件列表与搜索选择', 400);
        const captured = this.selected(session), files = this.files(actor, session, x.sources);
        ensure(files.length || x.search === true || x.previousRequestId, 'NATIVE_INPUT_REQUIRED', '请选择整原件或原生搜索', 400);
        const maxOutputTokens = integer(x.maxOutputTokens, 'maxOutputTokens', 1, Math.min(captured.definition.maxTokens, 8192)), sources = files.map(f => f.source), redact = this.redactor();
        ensure(redact(prompt) === prompt && redact(captured.connection.baseUrl) === captured.connection.baseUrl, 'NATIVE_SECRET_INPUT', '提示或目标地址包含受保护值，请移除后重试', 400);
        let previous, blocks;
        if (x.previousRequestId !== undefined) {
            previous = this.app.store.get('native-request', text(x.previousRequestId, 'previousRequestId', 100), session.projectId);
            ensure(previous.sessionId === sessionId && previous.state === 'incomplete' && previous.receipt && previous.continuation && digest(previous.model) === digest(captured.model) && digest(previous.sources) === digest(sources) && previous.search === x.search && previous.destination.baseUrl === captured.connection.baseUrl && previous.catalogFingerprint === captured.catalogFingerprint && previous.credentialRevision === captured.credentialRevision, 'NATIVE_CONTINUATION_INVALID', '续跑仅允许相同会话、原件、模型与固定前次回执', 409);
            blocks = this.continuation(previous);
        }
        nativeRequestBody(captured.connection.api, captured.definition, captured.model, prompt, files, x.search, maxOutputTokens, previous && blocks ? { prompt: previous.prompt, blocks } : undefined);
        const fields = { sessionId, prompt, model: captured.model, destination: { baseUrl: captured.connection.baseUrl, api: captured.connection.api, profile: captured.definition.nativeProfile }, sources, search: x.search, maxOutputTokens, expiresAt: new Date(Date.now() + MAX_RESPONSE_MS).toISOString(), permission: captured.permission, metadataDigest: captured.metadataDigest, catalogFingerprint: captured.catalogFingerprint, credentialRevision: captured.credentialRevision, managementVersion: captured.managementVersion, ...(previous ? { previousRequestId: previous.id, previousReceiptDigest: previous.receipt.digest, previousContinuationDigest: previous.continuation.digest } : {}) };
        const tupleDigest = digest(fields), id = randomUUID();
        return this.app.store.transaction(() => { this.owner(actor, sessionId); const latest = this.selected(this.app.sessions.get(actor, sessionId)); ensure(latest.catalogFingerprint === captured.catalogFingerprint && latest.credentialRevision === captured.credentialRevision && latest.managementVersion === captured.managementVersion && latest.metadataDigest === captured.metadataDigest && digest(latest.model) === digest(captured.model) && digest(latest.permission) === digest(captured.permission), 'NATIVE_CONFIGURATION_STALE', '准备期间配置已变化，未创建外发批准', 409); const saved = this.app.store.operation(op, key, value, () => { const reason = `允许当前会话向 ${captured.model.provider}/${captured.model.model}（${captured.connection.api}，${captured.connection.baseUrl}）外发${sources.length ? '整原件 ' + sources.map(s => s.title + ' · ' + s.size + '字节 · SHA256 ' + s.digest).join('；') : '本次提示'}${x.search ? '并执行最多一次供应商原生搜索' : ''}。仅一次provider HTTP请求；已发送内容无法撤回。重开仅查看历史，不自动重发。回执是供应商返回资料，不自动采纳为科学结论。`; const approval = this.app.approvals.request(session.projectId, 'native-request', id, tupleDigest, 'native.request', reason); this.app.store.create('native-request', session.projectId, { ...fields, tupleDigest, approvalId: approval.id, state: 'pending', dispatchBudget: 1, dispatched: 0 }, id); this.app.store.event(session.projectId, 'native-request.prepared', { requestId: id, sessionId }); return { id }; }); return this.inspect(actor, saved.id); });
    }
    decide(actor, id, value) { const x = closed(value, ['expectedVersion', 'expectedApprovalVersion', 'approved']), approved = x.approved; ensure(typeof approved === 'boolean', 'INVALID_INPUT', '批准必须为布尔值', 400); return this.app.store.transaction(() => { const row = this.app.store.get('native-request', id); this.owner(actor, row.sessionId); ensure(row.version === integer(x.expectedVersion, 'expectedVersion', 1), 'VERSION_CONFLICT', '原生请求已变化，请刷新', 409); ensure(row.state === 'pending', 'APPROVAL_NOT_PENDING', '原生请求不再等待批准', 409); this.validate(actor, row, false); this.app.approvals.decide(actor, row.approvalId, integer(x.expectedApprovalVersion, 'expectedApprovalVersion', 1), approved); this.app.store.update('native-request', id, row.version, { state: approved ? 'approved' : 'rejected' }); return this.inspect(actor, id); }); }
    cancel(actor, id, value) { const x = closed(value, ['expectedVersion']); const row = this.app.store.get('native-request', id); this.owner(actor, row.sessionId); ensure(row.version === integer(x.expectedVersion, 'expectedVersion', 1), 'VERSION_CONFLICT', '原生请求已变化，请刷新', 409); if (terminal.has(row.state))
        return this.inspect(actor, id); this.active.get(id)?.abort(); if (row.dispatched === 0) {
        this.app.store.transaction(() => { const current = this.app.store.get('native-request', id); if (current.dispatched === 0) {
            this.app.store.update('native-request', id, current.version, { state: 'cancelled' });
            this.app.approvals.stale(id);
        } });
    }
    else {
        this.app.store.transaction(() => { const current = this.app.store.get('native-request', id); if (current.state === 'running')
            this.app.store.update('native-request', id, current.version, { state: 'unknown', error: '请求已外发并已取消，供应商结果未确认；不会自动重发。' }); });
    } return this.inspect(actor, id); }
    async execute(actor, id, value, key, clientSignal) {
        const x = closed(value, ['expectedVersion']);
        text(key, 'Idempotency-Key', 200);
        const op = 'native-execute:' + id, old = this.app.store.operationResult(op, key, value);
        if (old.found)
            return this.inspect(actor, id);
        let row = this.app.store.get('native-request', id);
        this.owner(actor, row.sessionId);
        if (row.dispatched === 1 || terminal.has(row.state) || this.active.has(id))
            return this.inspect(actor, id);
        ensure(row.version === integer(x.expectedVersion, 'expectedVersion', 1) && row.state === 'approved', 'VERSION_CONFLICT', '需要当前已批准的原生请求版本', 409);
        ensure(!this.stopped, 'NATIVE_STOPPED', '原生请求服务已停止', 409);
        const controller = new AbortController(), signal = AbortSignal.any([controller.signal, AbortSignal.timeout(Math.max(1, Math.min(MAX_RESPONSE_MS, Date.parse(row.expiresAt) - Date.now()))), ...(clientSignal ? [clientSignal] : [])]);
        this.active.set(id, controller);
        let drained;
        this.drains.set(id, new Promise(resolve => { drained = resolve; }));
        let identity, httpStatus, receivedBytes = 0, bodyComplete = false, providerResponse, claimed = false, fetchStarted = false, transportEnded = false, closeTransport, httpOutcome = 'unknown';
        try {
            signal.throwIfAborted();
            const current = this.validate(actor, row), installed = locatePi(this.app.context.repoRoot);
            ensure(installed && installed.version === PI_VERSION && installed.aiVersion === PI_VERSION, 'PI_NOT_INSTALLED', '原生执行需要已安装的固定Pi SDK与pi-ai；不会使用替代模型', 409);
            const ai = await import(pathToFileURL(installed.aiPath).href), catalog = await modelCatalog(this.app.context), known = catalog.getModel(row.model.provider, row.model.model), requested = resolvedThinking(current.captured.definition, row.model.thinking), level = known ? ai.clampThinkingLevel(known, requested) : requested;
            const body = nativeRequestBody(current.captured.connection.api, current.captured.definition, current.captured.model, row.prompt, current.files, row.search, row.maxOutputTokens, current.previous, { level, value: known?.thinkingLevelMap?.[level], adaptive: known?.compat && 'forceAdaptiveThinking' in known.compat ? known.compat.forceAdaptiveThinking === true : false }), payload = JSON.stringify(body), url = nativeEndpoint(row.destination.baseUrl, row.destination.api), capturedKey = current.captured.connection.apiKey, initialRedact = this.redactor([capturedKey]);
            identity = { ownerKind: 'owner-native', operationId: id, ownerHost: this.ownerHost, ownerPid: process.pid, sessionId: row.sessionId, provider: row.model.provider, model: row.model.model };
            this.app.store.transaction(() => { signal.throwIfAborted(); const fresh = this.app.store.get('native-request', id); ensure(fresh.state === 'approved' && fresh.dispatched === 0 && fresh.version === row.version, 'NATIVE_ALREADY_DISPATCHED', '请求已执行、取消或版本已变化', 409); acquireOwnerNativeHttp(this.app.store, row.projectId, identity, () => { this.validate(actor, fresh); signal.throwIfAborted(); }); this.app.store.update('native-request', id, fresh.version, { state: 'running', dispatched: 1, ownerPid: process.pid, ownerHost: this.ownerHost }); this.app.store.operation(op, key, value, () => ({ id })); });
            claimed = true;
            const headers = row.destination.api === 'anthropic-messages' ? { 'content-type': 'application/json', 'x-api-key': capturedKey, 'anthropic-version': '2023-06-01' } : { 'content-type': 'application/json', authorization: 'Bearer ' + capturedKey };
            signal.throwIfAborted();
            fetchStarted = true;
            try {
                providerResponse = await this.fetcher(url, { method: 'POST', headers, body: payload, signal, redirect: 'error' });
            }
            catch (error) {
                transportEnded = true;
                throw error;
            }
            const response = providerResponse;
            httpStatus = response.status;
            let bodyCancellation;
            closeTransport = () => bodyCancellation ??= (async () => { await response.body?.cancel(); transportEnded = true; })();
            if (!response.ok) {
                await closeTransport();
                throw new DomainError('NATIVE_PROVIDER_REJECTED', safeError(response.status), 502);
            }
            ensure(response.headers.get('content-type')?.includes('application/json'), 'NATIVE_RESPONSE_INVALID', '供应商没有返回JSON原生回执', 502);
            const chunks = [];
            if (response.body) {
                const reader = response.body.getReader();
                let cancellation;
                closeTransport = () => cancellation ??= (async () => { await reader.cancel(); transportEnded = true; })();
                const abort = () => { void closeTransport().catch(() => { }); };
                signal.addEventListener('abort', abort, { once: true });
                try {
                    for (;;) {
                        signal.throwIfAborted();
                        const next = await reader.read();
                        if (next.done) {
                            if (!cancellation) {
                                bodyComplete = true;
                                transportEnded = true;
                            }
                            break;
                        }
                        receivedBytes += next.value.byteLength;
                        ensure(receivedBytes <= NATIVE_RESPONSE_BYTES, 'NATIVE_RESPONSE_LIMIT', '供应商JSON回执超过4 MiB', 502);
                        chunks.push(next.value);
                    }
                }
                finally {
                    signal.removeEventListener('abort', abort);
                    await closeTransport().catch(() => { });
                    reader.releaseLock();
                }
            }
            else {
                bodyComplete = true;
                transportEnded = true;
            }
            signal.throwIfAborted();
            let raw;
            try {
                raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
            }
            catch {
                throw new DomainError('NATIVE_RESPONSE_INVALID', '供应商原生回执不是完整有效JSON', 502);
            }
            const latestRedact = this.redactor([capturedKey], true), redact = (s) => latestRedact(initialRedact(s)), parsed = parseNativeResponse(row.destination.api, raw, redact), { continuation, ...publicResponse } = parsed;
            if (row.search && !publicResponse.searchCalls.length) {
                publicResponse.status = 'incomplete';
                publicResponse.continuationUnavailable = '供应商未返回可核实的原生搜索调用/引用，不能称搜索已执行。';
            }
            if (row.search && (publicResponse.searchCalls.length > 1 || (publicResponse.usage.server_web_search_requests ?? 0) > 1)) {
                publicResponse.status = 'incomplete';
                publicResponse.continuationUnavailable = '供应商报告搜索调用超过批准的一次预算；保留审计回执，不能自动续跑。';
            }
            const responseBytes = Buffer.from(JSON.stringify(publicResponse));
            ensure(responseBytes.length <= NATIVE_RESPONSE_BYTES, 'NATIVE_RESPONSE_LIMIT', '标准原生回执过大', 502);
            const staged = this.app.evidence.prepareArtifact(row.projectId, '原生请求回执 ' + id, responseBytes, 'application/json', 'native-receipt');
            let privateStaged;
            if (continuation && !publicResponse.continuationUnavailable) {
                const bytes = Buffer.from(JSON.stringify(continuation));
                ensure(bytes.length <= NATIVE_RESPONSE_BYTES && redact(bytes.toString('utf8')) === bytes.toString('utf8'), 'NATIVE_CONTINUATION_UNAVAILABLE', '原生续跑数据不可安全保存', 502);
                privateStaged = this.app.evidence.prepareArtifact(row.projectId, '原生续跑 ' + id, bytes, 'application/json', 'native-continuation');
            }
            const chatContent = `${publicResponse.status === 'incomplete' ? '原生资料请求（未完成，部分回执已保存）' : '原生资料请求'} · 请求模型 ${row.model.provider}/${row.model.model}\n\n${publicResponse.text}`;
            this.app.store.transaction(() => { const currentRow = this.app.store.get('native-request', id); if (currentRow.state !== 'running' || signal.aborted)
                return; const receipt = this.app.evidence.publishPrepared(row.projectId, staged), privateReceipt = privateStaged ? this.app.evidence.publishPrepared(row.projectId, privateStaged) : undefined; this.app.store.update('native-request', id, currentRow.version, { state: publicResponse.status, receipt: { artifactId: receipt.id, digest: receipt.digest }, ...(privateReceipt ? { continuation: { artifactId: privateReceipt.id, digest: privateReceipt.digest } } : {}) }); this.app.store.create('message', row.projectId, { sessionId: row.sessionId, role: 'assistant', phase: 'final_answer', content: chatContent.slice(0, 32000), mode: 'prompt', status: 'completed', nativeRequestId: id, ...(chatContent.length > 32000 ? { contentTruncated: true } : {}) }); this.app.store.event(row.projectId, 'native-request.completed', { requestId: id, sessionId: row.sessionId, state: publicResponse.status }); });
            httpOutcome = 'succeeded';
        }
        catch (error) {
            if (!claimed && this.app.store.get('native-request', id).dispatched === 1)
                return this.inspect(actor, id);
            row = this.app.store.get('native-request', id);
            const uncertain = row.dispatched === 1 && (signal.aborted || !bodyComplete && !(error instanceof DomainError && error.code === 'NATIVE_PROVIDER_REJECTED')), state = row.dispatched === 0 ? signal.aborted ? 'cancelled' : 'stale' : uncertain ? 'unknown' : 'failed';
            const message = row.dispatched === 0 ? '请求未外发，已取消或前置检查未通过。' : uncertain ? '请求已外发但结果未确认，不自动重发。' : error instanceof DomainError ? error.message : '原生请求失败，请核对固定配置。';
            this.app.store.transaction(() => { const current = this.app.store.get('native-request', id); if (['approved', 'running'].includes(current.state)) {
                this.app.store.update('native-request', id, current.version, { state, error: message });
                if (row.dispatched === 0)
                    this.app.approvals.stale(id);
                this.app.store.event(row.projectId, 'native-request.failed', { requestId: id, sessionId: row.sessionId, state });
            } });
            httpOutcome = uncertain ? 'unknown' : row.dispatched === 0 ? 'cancelled' : 'failed';
        }
        finally {
            await closeTransport?.().catch(() => { });
            this.active.delete(id);
            try {
                if (identity && claimed) {
                    if (signal.aborted || this.app.store.get('native-request', id).state === 'unknown')
                        httpOutcome = 'unknown';
                    finishOwnerNativeHttp(this.app.store, identity, httpOutcome, httpStatus, receivedBytes, transportEnded || !fetchStarted);
                }
            }
            finally {
                this.drains.delete(id);
                drained();
            }
        }
        return this.inspect(actor, id);
    }
    async shutdown() { this.stopped = true; for (const [id, controller] of this.active) {
        controller.abort();
        const row = this.app.store.get('native-request', id);
        if (row.state === 'running')
            this.app.store.update('native-request', id, row.version, { state: 'unknown', error: '服务已停止；已外发结果未确认，不自动重发。' });
    } await Promise.allSettled([...this.drains.values()]); }
}
//# sourceMappingURL=native-requests.js.map