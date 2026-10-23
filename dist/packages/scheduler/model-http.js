import { sessionTaskModel } from '../collaboration/task-model.js';
import { assertTaskModelCurrentSync } from '../pi-adapter/thinking-policy.js';
import { recoverOwnerNativeHttp } from '../pi-adapter/native-http.js';
import { assertModelEnabled, assertModelRestoreCurrent } from '../pi-adapter/model-connections.js';
import { digest, now } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { integer, object, text } from '../contracts/validation.js';
import { scope, userOnly } from '../policy/permissions.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
// These pinned SDK adapters accept options.fetch. WebSocket and other SDK transports fail closed.
export const MANAGED_HTTP_APIS = ['openai-completions', 'openai-responses', 'azure-openai-responses', 'anthropic-messages'];
const terminal = (state) => !['queued', 'active', 'unknown'].includes(state);
const identityKeys = ['admissionId', 'ownerHost', 'sessionId', 'generation'];
export class ModelHttpService {
    store;
    repoRoot;
    constructor(store, repoRoot = process.cwd()) {
        this.store = store;
        this.repoRoot = repoRoot;
        store.transaction(() => { store.db.exec("CREATE INDEX IF NOT EXISTS model_http_state ON records(kind,json_extract(data,'$.state')) WHERE kind='model-http-request'"); if (!store.maybe('model-http-capacity', 'global'))
            store.create('model-http-capacity', null, { maxRequests: null }, 'global'); });
    }
    live() { return this.store.db.prepare("SELECT rowid,data FROM records WHERE kind='model-http-request' AND json_extract(data,'$.state') IN ('queued','active','unknown') ORDER BY rowid").all().map(r => ({ sequence: Number(r.rowid), ...JSON.parse(r.data) })); }
    legacy() { return Number(this.store.db.prepare("SELECT count(*) n FROM records WHERE kind='agent-admission' AND json_extract(data,'$.state')<>'released' AND COALESCE(json_extract(data,'$.httpManagedVersion'),0)<>1").get().n); }
    current(w) { const a = this.store.get('agent-admission', w.admissionId), s = this.store.get('session', w.sessionId, a.projectId); ensure(a.ownerHost === w.ownerHost && a.sessionId === s.id && a.generation === w.generation && a.httpManagedVersion === 1 && a.state === 'running' && a.leaseUntil > Date.now() && s.state === 'running' && s.generation === w.generation && s.leaseUntil > Date.now(), 'MODEL_HTTP_SCOPE_EXPIRED', '模型HTTP请求的原会话或Worker租约已失效'); assertProjectWritable(this.store, s.projectId); assertModelRestoreCurrent(this.store.paths.dataDir, s.model); return s; }
    owned(w, key) { const id = digest({ admissionId: w.admissionId, key: text(key, 'requestKey', 100) }), r = this.store.maybe('model-http-request', id); if (r)
        ensure(identityKeys.every(k => r[k] === w[k]), 'MODEL_HTTP_SCOPE_DENIED', '请求不属于原Worker'); return { id, row: r }; }
    acquire(w, key) {
        return this.store.transaction(() => {
            const session = this.current(w), prior = this.owned(w, key);
            let r = prior.row;
            if (r?.state !== 'active') {
                assertModelEnabled(this.store.paths.dataDir, session.model);
                const frozen = sessionTaskModel(this.store, session);
                if (frozen)
                    assertTaskModelCurrentSync({ dataDir: this.store.paths.dataDir, repoRoot: this.repoRoot }, frozen);
            }
            if (r) {
                ensure(!terminal(r.state) && r.state !== 'unknown', 'MODEL_HTTP_ALREADY_FINISHED', '已结束或未知的请求不能重新发送');
                ensure(r.provider === session.model.provider && r.model === session.model.model, 'MODEL_HTTP_MODEL_CHANGED', '请求的固定模型已改变');
                if (r.state === 'active')
                    return { allowed: true, requestId: r.id };
            }
            else {
                r = this.store.create('model-http-request', session.projectId, { ...w, provider: session.model.provider, model: session.model.model, state: 'queued', queuedAt: now() }, prior.id);
                this.store.event(session.projectId, 'model-http.queued', { requestId: r.id, sessionId: r.sessionId });
            }
            r = this.store.update('model-http-request', r.id, r.version, { state: 'active', startedAt: now() });
            this.store.event(r.projectId, 'model-http.started', { requestId: r.id, sessionId: r.sessionId });
            return { allowed: true, requestId: r.id };
        });
    }
    finish(w, key, value) {
        const x = object(value), state = x.state;
        ensure(['succeeded', 'failed', 'cancelled'].includes(state), 'INVALID_INPUT', 'HTTP结束状态无效');
        ensure(Object.keys(x).every(k => ['state', 'httpStatus', 'receivedBytes'].includes(k)), 'INVALID_INPUT', 'HTTP回执包含未知字段');
        const fields = { state: state, ...(x.httpStatus === undefined ? {} : { httpStatus: integer(x.httpStatus, 'httpStatus', 100, 599) }), ...(x.receivedBytes === undefined ? {} : { receivedBytes: integer(x.receivedBytes, 'receivedBytes', 0, Number.MAX_SAFE_INTEGER) }) };
        return this.store.transaction(() => {
            const { row: r } = this.owned(w, key);
            if (!r)
                return; // Cancellation before the acquire RPC reached the host has no external effect.
            if (terminal(r.state))
                return;
            ensure(r.state !== 'queued' || fields.state === 'cancelled', 'MODEL_HTTP_NOT_STARTED', '未外发请求只能取消');
            this.store.update('model-http-request', r.id, r.version, { ...fields, endedAt: now(), outcome: r.state === 'queued' ? 'cancelled-before-dispatch' : fields.state === 'succeeded' ? 'body-complete' : fields.state === 'cancelled' ? 'transport-cancelled' : 'transport-failed' });
            this.store.event(r.projectId, 'model-http.finished', { requestId: r.id, sessionId: r.sessionId, state: fields.state });
        });
    }
    /** Called only after a child exit/close event proves the local HTTP connection cannot continue. */
    workerExited(admissionId, ownerHost, generation) { this.store.transaction(() => { for (const r of this.live().filter(r => r.admissionId === admissionId)) {
        ensure(r.ownerHost === ownerHost && r.generation === generation, 'MODEL_HTTP_SCOPE_DENIED', '退出回执不属于原Worker');
        this.closeLost(r, true);
    } }); }
    closeLost(r, gone) { const state = r.state === 'queued' ? 'cancelled' : gone ? 'interrupted' : 'unknown'; if (r.state === state)
        return; this.store.update('model-http-request', r.id, r.version, { state, ...(gone || r.state === 'queued' ? { endedAt: now() } : {}), outcome: r.state === 'queued' ? 'cancelled-before-dispatch' : gone ? 'worker-exit-provider-outcome-unknown' : 'worker-unconfirmed-capacity-held' }); this.store.event(r.projectId, 'model-http.reconciled', { requestId: r.id, sessionId: r.sessionId, state }); }
    recover() { this.store.transaction(() => { for (const r of this.live()) {
        if (r.ownerKind === 'owner-native')
            continue;
        const a = this.store.maybe('agent-admission', r.admissionId);
        let current = false;
        try {
            this.current(r);
            current = true;
        }
        catch { }
        if (!current)
            this.closeLost(r, a?.state === 'released');
    } recoverOwnerNativeHttp(this.store); }); }
    inspect(actor, pid, input = {}) {
        userOnly(actor);
        if (pid) {
            scope(actor, pid);
            this.store.get('project', pid);
        }
        const cursor = integer(input.cursor ?? 0, 'cursor', 0, Number.MAX_SAFE_INTEGER), limit = integer(input.limit ?? 30, 'limit', 1, 100), setting = this.store.get('model-http-capacity', 'global'), live = this.live(), legacyWorkerCount = this.legacy(), counts = { queued: live.filter(r => r.state === 'queued').length, active: live.filter(r => r.state === 'active').length, unknown: live.filter(r => r.state === 'unknown').length };
        const rows = pid ? this.store.db.prepare("SELECT rowid,data FROM records WHERE kind='model-http-request' AND project_id=? AND (?=0 OR rowid<?) ORDER BY rowid DESC LIMIT ?").all(pid, cursor, cursor, limit + 1) : [];
        const items = rows.slice(0, limit).map(raw => { const { id, sessionId, provider, model, state, queuedAt, startedAt, endedAt, httpStatus, receivedBytes, outcome } = JSON.parse(raw.data); return { id, sessionId, provider, model, state, queuedAt, startedAt, endedAt, httpStatus, receivedBytes, outcome }; });
        return { configuration: { version: setting.version, maxRequests: null }, scope: 'shared-data-directory', unit: 'pi-http-request', counts, available: null, coverage: legacyWorkerCount ? 'legacy-workers-present' : 'managed-fetch', legacyWorkerCount, supportedApis: [...MANAGED_HTTP_APIS], items, nextCursor: rows.length > limit ? Number(rows[limit - 1].rowid) : null };
    }
    configure(actor, _value, _pid) { userOnly(actor); ensure(false, 'HOST_CAPACITY_DISABLED', '本地 Pi 不设置宿主 HTTP 并发上限', 409); }
}
//# sourceMappingURL=model-http.js.map