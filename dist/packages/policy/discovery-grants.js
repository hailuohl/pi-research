import { assertGrantAdmission } from './grant-retirement.js';
import { assertProjectWritable } from './lifecycle.js';
import { userOnly, scope } from './permissions.js';
import { object, text, integer, bool, oneOf } from '../contracts/validation.js';
import { ensure, asError } from '../domain/errors.js';
import { digest, now } from '../storage/store.js';
import { randomUUID } from 'node:crypto';
import { connectorSettings, assertSourceEnabled } from '../connectors/settings.js';
import { parseSearch } from '../connectors/contracts.js';
import { discoveryGrantPayload, discoveryReference, assertDiscoveryGrantRecord, assertDiscoveryGrantReference, assertTaskDiscoveryBinding, buildDiscoveryTaskBinding, normalizedDiscoveryOperation, isTaskDiscoveryScope } from './discovery-grant-validation.js';
export class DiscoveryGrantService {
    app;
    constructor(app) {
        this.app = app;
    }
    inspect(actor, pid, id) {
        userOnly(actor);
        scope(actor, pid);
        const g = this.app.store.get('discovery-grant', id, pid), reasons = [];
        try {
            assertGrantAdmission(this.app.store, pid, 'discovery-grant', id);
            const { approval } = assertDiscoveryGrantRecord(this.app.store, pid, id);
            ensure(g.state === 'draft' ? ['pending', 'approved'].includes(approval.status) : g.state === 'active' && approval.status === 'approved', 'DISCOVERY_GRANT_REVOKED', '授权已失效');
        }
        catch (e) {
            reasons.push(asError(e).code);
        }
        const calls = this.app.store.list('connector-call', pid).filter(c => c.discoveryGrant?.id === id), remaining = Math.max(0, g.maxRequests - calls.length), s = g.sessionId ? this.app.store.get('session', g.sessionId, pid) : undefined;
        const taskScopeChanged = g.taskBinding ? (() => { try {
            assertTaskDiscoveryBinding(this.app.store, pid, g);
            return connectorSettings(this.app.store, pid).version !== g.settingsVersion;
        }
        catch {
            return true;
        } })() : false;
        const scopeChanged = g.taskBinding ? taskScopeChanged : g.state === 'active' && (!s || s.discoveryGrantId !== g.id || s.state === 'archived' || digest(s.model) !== digest(g.model) || connectorSettings(this.app.store, pid).version !== g.settingsVersion);
        if (scopeChanged)
            reasons.push('DISCOVERY_SCOPE_CHANGED');
        const effectiveState = g.state === 'revoked' ? 'revoked' : reasons.length ? 'stale' : Date.now() >= Date.parse(g.expiresAt) ? 'expired' : g.state === 'draft' ? 'draft' : remaining === 0 ? 'exhausted' : 'active';
        const papers = this.app.store.list('paper-read', pid).filter(p => p.discoveryGrant?.id === id).map(p => { const { id, kind, projectId, version, createdAt, updatedAt, source, idInSource, requestedId, title, artifactId, artifactDigest, rawArtifactIds, contentKind, fullTextRead, retrievedAt, discoveryGrant, scopeSessionId, scopeTaskId, scopeAttemptId, discoveryCallIds, discoveryRequestDigest } = p; return { id, kind, projectId, version, createdAt, updatedAt, source, idInSource, requestedId, title, artifactId, artifactDigest, rawArtifactIds, contentKind, fullTextRead, retrievedAt, discoveryGrant, scopeSessionId, scopeTaskId, scopeAttemptId, discoveryCallIds, discoveryRequestDigest }; });
        return { ...g, effectiveState, validity: reasons.length ? 'stale' : 'current', reasons, usage: { limit: g.maxRequests, used: calls.length, remaining, unit: 'http-request-attempt' }, calls, searchResults: this.app.store.list('connector-search', pid).filter(s => s.discoveryGrant?.id === id), papers };
    }
    prepare(actor, pid, value) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(value);
        ensure(Object.keys(x).every(k => ['sessionId', 'taskId', 'searches', 'targets', 'allowSearchResults', 'formats', 'maxRequests', 'maxResponseBytes', 'expiresAt'].includes(k)), 'INVALID_INPUT', '发现授权包含未知字段');
        return this.app.store.transaction(() => {
            assertProjectWritable(this.app.store, pid);
            const taskId = x.taskId === undefined ? undefined : text(x.taskId, 'taskId', 100), task = taskId ? this.app.store.get('task', taskId, pid) : undefined, s = task ? undefined : this.app.store.get('session', text(x.sessionId, 'sessionId', 100), pid);
            ensure(!(task && x.sessionId !== undefined) && (!task || !Object.hasOwn(x, 'sessionId')), 'INVALID_INPUT', 'sessionId 与 taskId 不能同时指定');
            if (task)
                ensure(task.role === 'literature' && task.execution === 'pending' && task.attemptCount === 0 && !task.attemptId && !task.sessionId && !task.discoveryGrantId, 'DISCOVERY_TASK_REQUIRED', '只能授权尚未派发且未绑定授权的 literature 任务');
            else
                ensure(s.role === 'coordinator' && !s.taskId && s.state !== 'archived' && !s.discoveryGrantId, 'DISCOVERY_SESSION_REQUIRED', '请使用尚未绑定发现授权的专用主协调会话');
            ensure(Array.isArray(x.searches) && x.searches.length <= 8 && Array.isArray(x.targets) && x.targets.length <= 20, 'INVALID_INPUT', '最多8项检索和20项目标');
            const searches = x.searches.map(v => { const q = object(v); ensure(Object.keys(q).every(k => ['query', 'sources', 'limit', 'strategy', 'prioritize', 'publishedAfter', 'publishedBefore'].includes(k)), 'INVALID_INPUT', '检索条件包含未知字段'); const parsed = parseSearch(q); return { ...parsed, sources: [...parsed.sources].sort() }; });
            const targets = x.targets.map(v => { const t = object(v); ensure(Object.keys(t).every(k => ['source', 'id', 'format', 'requestedVersion'].includes(k)), 'INVALID_INPUT', '资料目标包含未知字段'); const normalized = normalizedDiscoveryOperation({ kind: 'retrieve', target: { source: t.source, id: text(t.id, 'id', 300), format: oneOf(t.format, ['provider-text', 'original-pdf'], 'format'), ...(t.requestedVersion ? { requestedVersion: text(t.requestedVersion, 'requestedVersion', 40) } : {}) } }); ensure(normalized.kind === 'retrieve', 'INVALID_INPUT', '资料目标无效'); return normalized.target; });
            ensure(searches.length + targets.length > 0 && new Set(searches.map(digest)).size === searches.length && new Set(targets.map(digest)).size === targets.length, 'INVALID_INPUT', '范围须非空且不重复');
            ensure(Array.isArray(x.formats) && x.formats.length > 0 && x.formats.length <= 2, 'INVALID_INPUT', '请选择资料格式');
            const formats = [...new Set(x.formats.map(v => oneOf(v, ['provider-text', 'original-pdf'], 'format')))];
            ensure(targets.every(t => formats.includes(t.format)), 'INVALID_INPUT', '目标格式不在批准格式范围');
            const sources = [...new Set([...searches.flatMap(q => q.sources), ...targets.map(t => t.source)])].sort();
            sources.forEach(source => assertSourceEnabled(this.app.store, pid, source));
            const expiresAt = text(x.expiresAt, 'expiresAt', 50);
            ensure(Date.parse(expiresAt) > Date.now() && Date.parse(expiresAt) <= Date.now() + 86400000, 'INVALID_INPUT', '期限必须在未来24小时内');
            const allowSearchResults = bool(x.allowSearchResults, 'allowSearchResults');
            ensure(!allowSearchResults || searches.length > 0, 'INVALID_INPUT', '允许命中资料时需要已固定检索');
            const taskDetails = task ? buildDiscoveryTaskBinding(this.app.store, pid, task) : undefined, taskBinding = taskDetails?.binding, maxRequests = integer(x.maxRequests, 'maxRequests', 1, 100);
            if (task)
                ensure(isTaskDiscoveryScope({ sources, searches, targets, allowSearchResults, formats, maxRequests }), 'DISCOVERY_TASK_SCOPE_INVALID', 'literature 任务只允许一次固定 Crossref 关键词检索或 DOI 元数据读取');
            const fixed = { sessionId: s?.id ?? taskDetails.team.rootSessionId, ...(taskBinding ? { taskBinding } : {}), model: taskDetails?.model ?? s.model, settingsVersion: connectorSettings(this.app.store, pid).version, sources, searches, targets, allowSearchResults, formats, maxRequests, maxResponseBytes: integer(x.maxResponseBytes, 'maxResponseBytes', 1024, 32 * 1024 * 1024), expiresAt: new Date(expiresAt).toISOString() }, id = randomUUID(), a = this.app.approvals.request(pid, 'discovery-grant', id, '', 'discovery-grant.activate', '仅批准固定来源与请求范围内的有限HTTP请求；不批准模型、计算或发布'), hash = digest(discoveryGrantPayload({ ...fixed, approvalId: a.id }));
            this.app.store.update('approval', a.id, a.version, { digest: hash });
            this.app.store.create('discovery-grant', pid, { ...fixed, approvalId: a.id, digest: hash, state: 'draft' }, id);
            if (task)
                this.app.store.update('task', task.id, task.version, { discoveryGrantId: id });
            this.app.store.event(pid, 'discovery-grant.prepared', { grantId: id, ...(task ? { taskId: task.id, teamId: task.teamId } : { sessionId: s.id }) });
            return this.inspect(actor, pid, id);
        });
    }
    activate(actor, pid, value) { userOnly(actor); scope(actor, pid); const x = object(value); return this.app.store.transaction(() => { assertProjectWritable(this.app.store, pid); const { grant: g } = assertDiscoveryGrantRecord(this.app.store, pid, text(x.grantId, 'grantId', 100)); assertGrantAdmission(this.app.store, pid, 'discovery-grant', g.id); if (g.state === 'active') {
        if (g.taskBinding)
            assertTaskDiscoveryBinding(this.app.store, pid, g);
        else
            ensure(this.app.store.get('session', g.sessionId, pid).discoveryGrantId === g.id, 'DISCOVERY_SCOPE_CHANGED', '会话绑定改变');
        return this.inspect(actor, pid, g.id);
    } ensure(g.state === 'draft' && g.version === integer(x.expectedVersion, 'expectedVersion', 1), 'VERSION_CONFLICT', '草案已变化或撤销'); if (g.taskBinding)
        assertTaskDiscoveryBinding(this.app.store, pid, g, { requireUnclaimed: true });
    else {
        const s = this.app.store.get('session', g.sessionId, pid);
        ensure(!s.discoveryGrantId && s.role === 'coordinator' && !s.taskId && s.state !== 'archived' && digest(s.model) === digest(g.model), 'DISCOVERY_SCOPE_CHANGED', '指定会话或模型改变');
    } ensure(Date.now() < Date.parse(g.expiresAt) && connectorSettings(this.app.store, pid).version === g.settingsVersion, 'DISCOVERY_SETTINGS_CHANGED', '期限或来源设置已变化'); g.sources.forEach(source => assertSourceEnabled(this.app.store, pid, source)); this.app.approvals.assert(g.approvalId, pid, g.id, g.digest, 'discovery-grant.activate'); if (!g.taskBinding) {
        const s = this.app.store.get('session', g.sessionId, pid);
        this.app.store.update('session', s.id, s.version, { discoveryGrantId: g.id });
    } this.app.store.update('discovery-grant', g.id, g.version, { state: 'active', activatedAt: now() }); this.app.store.event(pid, 'discovery-grant.activated', { grantId: g.id, ...(g.taskBinding ? { taskId: g.taskBinding.taskId } : { sessionId: g.sessionId }) }); return this.inspect(actor, pid, g.id); }); }
    revoke(actor, pid, value) { userOnly(actor); scope(actor, pid); const x = object(value); return this.app.store.transaction(() => { const g = this.app.store.get('discovery-grant', text(x.grantId, 'grantId', 100), pid); if (g.state === 'revoked')
        return this.inspect(actor, pid, g.id); this.app.store.update('discovery-grant', g.id, integer(x.expectedVersion, 'expectedVersion', 1), { state: 'revoked', revokedAt: now() }); this.app.approvals.stale(g.id); this.app.store.event(pid, 'discovery-grant.revoked', { grantId: g.id }); return this.inspect(actor, pid, g.id); }); }
    owner(actor, pid, id) { userOnly(actor); scope(actor, pid); const g = this.app.store.get('discovery-grant', id, pid); ensure(!g.taskBinding, 'DISCOVERY_TASK_GRANT_OWNER_DENIED', '任务发现授权只能由宿主绑定的任务尝试使用'); assertDiscoveryGrantReference(this.app.store, pid, discoveryReference(g)); return { type: 'user', sessionId: g.sessionId }; }
}
//# sourceMappingURL=discovery-grants.js.map