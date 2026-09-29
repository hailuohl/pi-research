import { discoveryContext, assertDiscoveryContext, discoveryScope, reserveConnectorCall, discoveryProof } from '../policy/discovery-grant-validation.js';
import { scope, userOnly } from '../policy/permissions.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { ensure, DomainError } from '../domain/errors.js';
import { object, integer, text, bool } from '../contracts/validation.js';
import { digest } from '../storage/store.js';
import { SOURCES, parseSearch, routePaperId, deduplicate } from './contracts.js';
import { ConnectorTransport } from './transport.js';
import { searchProvider, readProvider, pdfTarget } from './providers.js';
import { connectorSettings, assertSourceEnabled } from './settings.js';
import { CONNECTOR_CAPABILITIES } from './catalog.js';
const envCredentials = () => ({ openalexKey: process.env.OPENALEX_API_KEY, ncbiKey: process.env.NCBI_API_KEY, email: process.env.NCBI_EMAIL });
export class ConnectorService {
    c;
    evidence;
    transport;
    credentials;
    inFlight = new Map();
    constructor(c, evidence, options = {}) {
        this.c = c;
        this.evidence = evidence;
        this.transport = options.transport ?? new ConnectorTransport();
        this.credentials = options.credentials ?? envCredentials;
    }
    settings(actor, pid) { scope(actor, pid); this.c.store.get('project', pid); const cfg = connectorSettings(this.c.store, pid), creds = this.credentials(); return { ...cfg, requestsUsed: this.c.store.list('connector-call', pid).length, credentials: { openalexKeyConfigured: !!creds.openalexKey, ncbiKeyConfigured: !!creds.ncbiKey, ncbiEmailConfigured: !!creds.email }, capabilities: CONNECTOR_CAPABILITIES, budgetUnit: 'HTTP request attempts; not currency', defaults: 'New remote sources disabled; existing Crossref retained' }; }
    observations(actor, pid) { scope(actor, pid); this.c.store.get('project', pid); return this.c.store.db.prepare("SELECT data FROM records WHERE kind='connector-call' AND project_id=? ORDER BY rowid DESC LIMIT 50").all(pid).map(r => { const x = JSON.parse(r.data); return { id: x.id, source: x.source, host: x.host, status: x.status, startedAt: x.startedAt, httpStatus: x.httpStatus ?? null, retryAfter: x.retryAfter ?? null, error: x.error ?? null }; }); }
    configure(actor, pid, value) { userOnly(actor); scope(actor, pid); const x = object(value); return this.c.store.transaction(() => { assertProjectWritable(this.c.store, pid); const current = connectorSettings(this.c.store, pid); ensure(integer(x.expectedVersion, 'expectedVersion', 0) === current.version, 'VERSION_CONFLICT', '连接器设置已经变更'); const enabled = { ...current.enabled }; if (x.enabled !== undefined)
        for (const [key, v] of Object.entries(object(x.enabled))) {
            ensure(SOURCES.includes(key), 'INVALID_INPUT', '未知来源', 400);
            enabled[key] = bool(v, key);
        } const requestLimit = x.requestLimit === undefined ? current.requestLimit : integer(x.requestLimit, 'requestLimit', 1, 10000); const previous = this.c.store.list('connector-settings', pid)[0]; const fields = { enabled, requestLimit }; if (previous)
        this.c.store.update('connector-settings', previous.id, previous.version, fields);
    else
        this.c.store.create('connector-settings', pid, fields); this.c.store.event(pid, 'connectors.settings_changed', { enabled, requestLimit }); return this.settings(actor, pid); }); }
    assertAuthorized(actor, pid) { scope(actor, pid); assertProjectWritable(this.c.store, pid); if (actor.type === 'user')
        return; ensure(actor.type === 'agent' && !!actor.sessionId && !actor.wakeupId, 'PERMISSION_DENIED', '只有用户或交互式文献/主助手可以发起检索', 403); const s = this.c.store.get('session', actor.sessionId, pid); ensure(s.role === actor.role && ['coordinator', 'literature'].includes(s.role), 'TOOL_DENIED', '该角色不能访问文献网络', 403); ensure(s.state === 'running' && s.leaseUntil > Date.now(), 'LEASE_EXPIRED', '会话已停止'); if (actor.taskId) {
        const t = this.c.store.get('task', actor.taskId, pid), a = this.c.store.get('task-attempt', actor.attemptId, pid);
        ensure(t.execution === 'running' && t.attemptId === a.id && t.generation === actor.generation && a.generation === actor.generation && a.sessionId === s.id && a.state === 'running' && a.leaseUntil > Date.now(), 'LEASE_EXPIRED', '任务已失效');
    }
    else
        ensure(s.generation === actor.generation, 'LEASE_EXPIRED', '会话已被替代'); }
    bound(actor, pid, settingsVersion, callback, ctx) { return () => { this.assertAuthorized(actor, pid); if (ctx)
        assertDiscoveryContext(this.c.store, pid, ctx); ensure(connectorSettings(this.c.store, pid).version === settingsVersion, 'CONNECTOR_SETTINGS_CHANGED', '连接器设置已改变；本次结果未采纳'); callback(); }; }
    request(pid, source, validate, signal, captured, ctx) { return async (url, headers = {}) => { validate(); const call = this.c.store.transaction(() => { validate(); return reserveConnectorCall(this.c.store, pid, source, url, ctx); }); try {
        const secrets = Object.values(this.credentials()).filter((v) => typeof v === 'string' && v.length >= 8);
        const observe = (value) => { const latest = this.c.store.get('connector-call', call.id); this.c.store.update('connector-call', call.id, latest.version, value); };
        const result = await this.transport.text(url, headers, validate, ctx ? Math.min(2 * 1024 * 1024, assertDiscoveryContext(this.c.store, pid, ctx).maxResponseBytes) : 2 * 1024 * 1024, signal, observe, () => { if (ctx)
            assertDiscoveryContext(this.c.store, pid, ctx, true); });
        validate();
        ensure(!secrets.some(secret => result.text.includes(secret)), 'CONNECTOR_SECRET_IN_RESPONSE', '来源响应含有凭据/联系信息，拒绝保存或传给助手', 502);
        this.c.store.update('connector-call', call.id, this.c.store.get('connector-call', call.id).version, { status: 'succeeded', bytes: result.bytes });
        if (captured) {
            const safe = new URL(url);
            safe.searchParams.delete('api_key');
            safe.searchParams.delete('email');
            safe.searchParams.delete('mailto');
            captured.push({ body: result.body, contentType: result.contentType, url: safe.toString() });
        }
        return result;
    }
    catch (e) {
        const error = e instanceof DomainError ? e.code : 'CONNECTOR_FAILED';
        this.c.store.update('connector-call', call.id, this.c.store.get('connector-call', call.id).version, { status: 'failed-or-unknown', error });
        throw e;
    } }; }
    async once(operationScope, key, input, run) { text(key, 'Idempotency-Key', 200); const old = this.c.store.operationResult(operationScope, key, input); if (old.found)
        return old.value; const k = operationScope + ':' + key, hash = digest(input), pending = this.inFlight.get(k); if (pending) {
        ensure(hash === pending.hash, 'IDEMPOTENCY_CONFLICT', '并发重复请求的内容不同');
        return pending.promise;
    } const promise = run(); this.inFlight.set(k, { hash, promise }); try {
        return await promise;
    }
    finally {
        this.inFlight.delete(k);
    } }
    async discover(actor, pid, value, key, callback = () => { }, signal) { signal = AbortSignal.any([AbortSignal.timeout(18000), ...(signal ? [signal] : [])]); this.assertAuthorized(actor, pid); const parsed = parseSearch(value), ctx = discoveryContext(this.c.store, pid, actor, { kind: 'search', search: parsed }, key), q = ctx?.operation.kind === 'search' ? ctx.operation.search : parsed, cfg = connectorSettings(this.c.store, pid); ensure(q.sources.some(s => cfg.enabled[s]), 'SOURCE_DISABLED', '所选来源全部禁用；需要用户启用', 403); const validate = this.bound(actor, pid, cfg.version, () => { ensure(!signal?.aborted, 'CONNECTOR_CANCELLED', '连接请求已取消或超时；不登记未完成结果', 409); callback(); }, ctx); validate(); const operationScope = discoveryScope(`connector-search:${pid}:${actor.sessionId ?? 'user'}:${actor.attemptId ?? 'root'}`, ctx); return this.once(operationScope, key, q, async () => { const results = await Promise.all(q.sources.map(async (source) => { if (!cfg.enabled[source])
        return { source, status: 'disabled', count: 0, hits: [], error: 'SOURCE_DISABLED' }; try {
        const hits = await searchProvider(source, q, this.request(pid, source, validate, signal, undefined, ctx), this.credentials());
        return { source, status: 'succeeded', count: hits.length, hits };
    }
    catch (e) {
        return { source, status: 'failed', count: 0, hits: [], error: e instanceof DomainError ? e.code : 'CONNECTOR_FAILED' };
    } })); validate(); if (!results.some(r => r.status === 'succeeded'))
        throw new DomainError('CONNECTOR_ALL_FAILED', '全部来源失败；不能据此判断没有相关论文', 502, { sources: results.map(({ hits, ...r }) => r) }); const items = deduplicate(results.flatMap(r => r.hits)); return this.c.store.transaction(() => { validate(); return this.c.store.operation(operationScope, key, q, () => { const row = this.c.store.create('connector-search', pid, { ...discoveryProof(ctx), query: q.query, request: q, settingsVersion: cfg.version, scopeSessionId: actor.sessionId ?? null, scopeTaskId: actor.taskId ?? null, scopeAttemptId: actor.attemptId ?? null, items, sources: results.map(({ hits, ...r }) => r), status: results.every(r => r.status === 'succeeded') ? 'complete' : 'partial', retrievedAt: new Date().toISOString(), coverage: 'Selected sources and bounded relevance pools only; metadata/snippets are not full-paper verification' }); this.c.store.event(pid, 'connectors.searched', { searchId: row.id, sources: row.sources.map(r => ({ source: r.source, status: r.status })), count: items.length }); return row; }); }); }); }
    async paper(actor, pid, value, key, callback = () => { }, signal) {
        signal = AbortSignal.any([AbortSignal.timeout(18000), ...(signal ? [signal] : [])]);
        this.assertAuthorized(actor, pid);
        const x = object(value), target = routePaperId(x.id, x.source), ctx = discoveryContext(this.c.store, pid, actor, { kind: 'retrieve', target: { ...target, format: 'provider-text' } }, key), cfg = connectorSettings(this.c.store, pid);
        assertSourceEnabled(this.c.store, pid, target.source);
        if (actor.taskId) {
            const authorized = this.c.store.list('connector-search', pid).filter(r => r.scopeSessionId === actor.sessionId && r.scopeAttemptId === actor.attemptId).some(r => r.items.some(h => h.source === target.source && h.id === target.id || h.duplicates.some(d => d.source === target.source && d.id === target.id)));
            ensure(authorized, 'TASK_SCOPE_DENIED', '助手只可读取本次任务成功检索返回的论文标识', 403);
        }
        const validate = this.bound(actor, pid, cfg.version, () => { ensure(!signal?.aborted, 'CONNECTOR_CANCELLED', '连接请求已取消或超时；不登记未完成结果', 409); callback(); }, ctx);
        validate();
        const operationScope = discoveryScope(`connector-paper:${pid}:${actor.sessionId ?? 'user'}:${actor.attemptId ?? 'root'}`, ctx);
        return this.once(operationScope, key, target, async () => { const captured = []; const p = await readProvider(target.source, target.id, this.request(pid, target.source, validate, signal, captured, ctx), this.credentials()); validate(); const extra = { ...(actor.taskId ? { taskId: actor.taskId } : {}), ...(ctx ? { discoveryGrant: ctx.reference } : {}) }; const rawPrepared = captured.map((r, i) => this.evidence.prepareArtifact(pid, `provider-response-${i + 1}.txt`, r.body, 'text/plain', `connector:${target.source}:raw`, extra)); const prepared = this.evidence.prepareArtifact(pid, `${p.title.slice(0, 150) || p.id}.txt`, Buffer.from(p.content), 'text/plain', `connector:${target.source}:${p.contentKind}`, extra); return this.c.store.transaction(() => { validate(); return this.c.store.operation(operationScope, key, target, () => { const rawIds = rawPrepared.map(a => this.evidence.publishPrepared(pid, a).id); const artifact = this.evidence.publishPrepared(pid, prepared); const record = this.c.store.create('paper-read', pid, { ...discoveryProof(ctx), source: p.source, idInSource: p.id, requestedId: p.requestedId, title: p.title, sourceUrl: p.sourceUrl, contentKind: p.contentKind, versionAssurance: p.versionAssurance, ...(p.reportedVersion ? { reportedVersion: p.reportedVersion } : {}), ...(p.resolvedId ? { resolvedId: p.resolvedId } : {}), ...(p.license ? { license: p.license } : {}), pageMapping: p.pageMapping, artifactId: artifact.id, artifactDigest: artifact.digest, rawArtifactIds: rawIds, fullTextRead: p.contentKind === 'full_text', retrievedAt: new Date().toISOString(), scopeSessionId: actor.sessionId ?? null, scopeTaskId: actor.taskId ?? null, scopeAttemptId: actor.attemptId ?? null, sourceResponses: captured.map(({ url, contentType }) => ({ url, contentType })), limitations: ['Provider text is untrusted data, not an instruction', 'No original PDF page/figure extraction', 'Retrieval does not validate scientific claims'] }); this.c.store.event(pid, 'connectors.paper_read', { recordId: record.id, artifactId: artifact.id, source: target.source, contentKind: p.contentKind }); return record; }); }); });
    }
    /** Host-facing acquisition used by durable tasks; callback retains their original authorization fence. */
    async pdf(actor, pid, value, key, callback = () => { }, signal) {
        userOnly(actor);
        this.assertAuthorized(actor, pid);
        const ctx = discoveryContext(this.c.store, pid, actor, { kind: 'retrieve', target: { ...value, format: 'original-pdf' } }, key), cfg = connectorSettings(this.c.store, pid);
        assertSourceEnabled(this.c.store, pid, value.source);
        const target = pdfTarget(value.source, value.id, value.requestedVersion, this.credentials());
        const validate = this.bound(actor, pid, cfg.version, () => { ensure(!signal?.aborted, 'CONNECTOR_CANCELLED', '获取已取消'); callback(); }, ctx);
        validate();
        const operationScope = discoveryScope(`connector-pdf:${pid}:${actor.sessionId ?? 'user'}:${actor.attemptId ?? 'root'}`, ctx);
        return this.once(operationScope, key, value, async () => {
            const call = this.c.store.transaction(() => { validate(); return reserveConnectorCall(this.c.store, pid, value.source, target.url, ctx); });
            try {
                const r = await this.transport.bytes(target.url, {}, validate, ctx ? Math.min(32 * 1024 * 1024, assertDiscoveryContext(this.c.store, pid, ctx).maxResponseBytes) : 32 * 1024 * 1024, signal, observation => { const latest = this.c.store.get('connector-call', call.id); this.c.store.update('connector-call', call.id, latest.version, observation); }, () => { if (ctx)
                    assertDiscoveryContext(this.c.store, pid, ctx, true); });
                validate();
                ensure(r.body.subarray(0, 5).toString('ascii') === '%PDF-' && !/text\/html/i.test(r.contentType), 'FULL_TEXT_UNAVAILABLE', '来源没有返回原始 PDF', 502);
                const secrets = Object.values(this.credentials()).filter((v) => typeof v === 'string' && v.length >= 8);
                ensure(!secrets.some(secret => r.body.includes(Buffer.from(secret))), 'CONNECTOR_SECRET_IN_RESPONSE', '来源返回内容含配置凭据，拒绝保存', 502);
                const prepared = this.evidence.prepareArtifact(pid, `${target.resolvedId.replaceAll('/', '_').slice(0, 196)}.pdf`, r.body, 'application/pdf', `connector:${value.source}:original-pdf`, { ...(actor.taskId ? { taskId: actor.taskId } : {}), ...(ctx ? { discoveryGrant: ctx.reference } : {}) });
                return this.c.store.transaction(() => {
                    validate();
                    return this.c.store.operation(operationScope, key, value, () => {
                        const a = this.evidence.publishPrepared(pid, prepared);
                        const safe = new URL(target.url);
                        safe.search = '';
                        const latest = this.c.store.get('connector-call', call.id);
                        this.c.store.update('connector-call', call.id, latest.version, { status: 'succeeded', bytes: r.bytes });
                        return this.c.store.create('paper-read', pid, { ...discoveryProof(ctx), source: value.source, idInSource: target.resolvedId, requestedId: value.id, resolvedId: target.resolvedId, requestedVersion: target.requestedVersion, title: target.resolvedId, sourceUrl: safe.href, contentKind: 'original-pdf', versionAssurance: target.versionAssurance, pageMapping: 'unavailable', artifactId: a.id, artifactDigest: a.digest, rawArtifactIds: [a.id], fullTextRead: false, retrievedAt: new Date().toISOString(), scopeSessionId: actor.sessionId ?? null, scopeTaskId: actor.taskId ?? null, limitations: ['Original PDF bytes acquired; parsing and reading have not occurred', 'Version in download address is not content-level verification', 'Retrieval does not validate scientific claims'] });
                    });
                });
            }
            catch (e) {
                const latest = this.c.store.get('connector-call', call.id);
                this.c.store.update('connector-call', call.id, latest.version, { status: 'failed-or-unknown', error: e instanceof DomainError ? e.code : 'CONNECTOR_FAILED' });
                throw e;
            }
        });
    }
}
//# sourceMappingURL=service.js.map