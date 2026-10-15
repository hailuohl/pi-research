import { RESEARCH_ACTION_INPUT_SCHEMA, RESEARCH_ACTION_INPUT_SCHEMAS } from '../contracts/operations/research-action-schemas.js';
import { validateSchema } from '../contracts/operations/schema.js';
import { asError, ensure } from '../domain/errors.js';
import { text } from '../contracts/validation.js';
import { scope, userOnly, interactiveCoordinator } from '../policy/permissions.js';
import { assertProjectReadable, assertProjectWritable } from '../policy/lifecycle.js';
import { assertCorpusDocument } from '../policy/text-corpus-grants.js';
import { assertDiscoveryDocument } from '../policy/discovery-grant-validation.js';
import { digest } from '../storage/store.js';
const TWO_HOURS = 2 * 60 * 60 * 1000;
const SOURCE_KINDS = new Set(['text-evidence-settings', 'text-corpus', 'document-version', 'document-parse-result', 'document-parse-job', 'artifact', 'evidence', 'claim', 'approval', 'discovery-grant', 'connector-call', 'paper-read', 'run', 'run-intent', 'experiment', 'source-revision', 'acceptance-record', 'change-proposal', 'development-task', 'development-review', 'sandbox-job', 'working-grant', 'run-grant', 'task', 'task-attempt', 'task-result', 'team', 'team-plan', 'manuscript-revision', 'publication-build-result', 'publication-build-job', 'publication-review', 'campaign', 'research-round', 'campaign-member', 'run-observation', 'campaign-decision', 'experiment-plan-revision', 'research-candidate']);
const summary = (r) => ({ id: r.id, sessionId: r.sessionId, kind: r.actionKind, state: r.state, effectiveState: r.effectiveState, expiresAt: r.expiresAt, ...(r.resultRef ? { resultRef: r.resultRef } : {}) });
export class ResearchActionService {
    app;
    constructor(app) {
        this.app = app;
    }
    root(actor, pid, sessionId) {
        scope(actor, pid);
        assertProjectReadable(this.app.store, pid, actor);
        const s = this.app.store.get('session', text(sessionId, 'sessionId', 100), pid);
        ensure(s.role === 'coordinator' && !s.taskId && !s.teamId, 'INVALID_ROOT_SESSION', '人工请求只属于项目主协调会话', 403);
        if (actor.type === 'agent') {
            interactiveCoordinator(actor, pid, s);
            ensure(!actor.continuationId && !actor.approvalResumeId, 'TASK_SCOPE_DENIED', '自动续接不能准备或回查人工请求', 403);
        }
        else
            userOnly(actor);
        return s;
    }
    origin(actor, pid, s, initial = true) {
        ensure(actor.messageId, 'RESEARCH_ACTION_ORIGIN_REQUIRED', '人工请求必须绑定当前人工用户消息', 403);
        const m = this.app.store.get('message', actor.messageId, pid);
        ensure(m.sessionId === s.id && m.role === 'user' && m.origin !== 'automation' && !m.wakeupId && !m.approvalNoticeId && !m.queueRemoved && (!initial || m.status === 'running' && m.generation === actor.generation), 'RESEARCH_ACTION_ORIGIN_REQUIRED', '通知、已移除消息或其他会话消息不能创建人工请求', 403);
        ensure(actor.researchModelDigest === this.app.researchAutomation.modelIdentity(s), 'RESEARCH_ACTION_MODEL_CHANGED', '主会话执行模型连接已改变', 403);
        return m;
    }
    corpus(pid, input, fixed) {
        const config = this.app.store.get('text-evidence-settings', pid, pid);
        ensure(config.enabled && config.corpusId, 'TEXT_EVIDENCE_DISABLED', '请先明确启用已有固定原文集合');
        ensure(!fixed || fixed.corpusId === config.corpusId && fixed.configurationVersion === config.version, 'TEXT_EVIDENCE_CONFIGURATION_CHANGED', '固定原文集合已改变');
        const corpus = this.app.store.get('text-corpus', config.corpusId, pid), x = input.textGrant;
        ensure(digest({ projectId: pid, sources: corpus.sources, documents: corpus.documents, parserVersion: corpus.parserVersion, ...(corpus.pmcDocuments ? { pmcDocuments: corpus.pmcDocuments } : {}) }) === corpus.id, 'TEXT_DOCUMENT_STALE', '固定原文集合摘要不符');
        const keys = x.documents.map(p => `${p.documentVersionId}\0${p.parseResultId}`), pmc = x.pmcDocuments ?? [];
        ensure(new Set(keys).size === keys.length && new Set(pmc.map(p => p.documentVersionId)).size === pmc.length, 'INVALID_INPUT', '原文来源不能重复', 400);
        ensure(pmc.length ? pmc.length === 1 && x.documents.length === 0 : x.documents.length > 0, 'TEXT_SOURCE_REQUIRED', '请选择固定 PDF 解析版本，或单独选择一份 PMC 文档', 400);
        for (const p of x.documents) {
            const ref = corpus.documents?.find(r => r.documentVersionId === p.documentVersionId && r.parseResultId === p.parseResultId);
            ensure(ref, 'TEXT_SOURCE_NOT_APPROVED', '固定 PDF 解析版本不在用户已有集合中', 403);
            assertCorpusDocument(this.app.store, pid, ref);
        }
        for (const p of pmc) {
            const ref = corpus.pmcDocuments?.find(r => r.documentVersionId === p.documentVersionId);
            ensure(ref, 'TEXT_SOURCE_NOT_APPROVED', '固定 PMC 文档不在用户已有集合中', 403);
            const d = this.app.store.get('document-version', p.documentVersionId, pid);
            ensure(digest(d) === ref.documentDigest, 'PMC_SOURCE_STALE', '固定 PMC 文档已改变');
            assertDiscoveryDocument(this.app.store, pid, d);
        }
        return { corpusId: config.corpusId, configurationVersion: config.version };
    }
    /** Hash metadata and its linked provenance; never open original text while preparing a card. */
    source(pid, input, textCorpus) {
        if (input.kind === 'history')
            return digest(input);
        const rows = new Map(), add = (kind, id) => { const r = this.app.store.get(kind, id, pid); rows.set(`${kind}:${id}`, r); };
        if (input.kind === 'text_grant') {
            const fixed = this.corpus(pid, input, textCorpus);
            add('text-evidence-settings', pid);
            add('text-corpus', fixed.corpusId);
        }
        else if (input.kind === 'claim_decision')
            add('claim', input.claim.claimId);
        else {
            const x = input.report;
            ensure(x.runIds.length + x.claimIds.length + x.publicationResultIds.length + (x.campaignIds?.length ?? 0) > 0, 'REPORT_EMPTY', '请选择已有运行、已采纳结论或固定文稿结果', 400);
            for (const [kind, ids] of [['run', x.runIds], ['claim', x.claimIds], ['publication-build-result', x.publicationResultIds], ['campaign', x.campaignIds ?? []]]) {
                ensure(new Set(ids).size === ids.length, 'INVALID_INPUT', '报告来源不能重复', 400);
                for (const id of ids)
                    add(kind, id);
            }
            for (const kind of ['research-round', 'campaign-member', 'run-observation', 'campaign-decision', 'experiment-plan-revision', 'research-candidate'])
                for (const r of this.app.store.list(kind, pid))
                    if (x.campaignIds?.includes(r.campaignId))
                        rows.set(`${kind}:${r.id}`, r);
            for (const r of this.app.store.list('publication-review', pid))
                if (x.publicationResultIds.includes(r.resultId))
                    rows.set(`${r.kind}:${r.id}`, r);
        }
        const visited = new Set();
        const linked = (value, key = '') => {
            if (Array.isArray(value)) {
                value.forEach(v => linked(v, key));
                return;
            }
            if (value && typeof value === 'object') {
                for (const [k, v] of Object.entries(value))
                    linked(v, k);
                return;
            }
            if (typeof value !== 'string' || !/Ids?$/.test(key) || ['id', 'projectId', 'sessionId', 'rootSessionId', 'parentSessionId', 'scopeSessionId', 'producerSessionId'].includes(key))
                return;
            for (const raw of this.app.store.db.prepare('SELECT kind,data FROM records WHERE project_id=? AND id=?').all(pid, value)) {
                const kind = String(raw.kind);
                if (SOURCE_KINDS.has(kind)) {
                    const r = JSON.parse(String(raw.data));
                    rows.set(`${kind}:${r.id}`, r);
                }
            }
        };
        while ([...rows.keys()].some(k => !visited.has(k))) {
            for (const [key, row] of [...rows])
                if (!visited.has(key)) {
                    visited.add(key);
                    linked(row);
                }
            ensure(rows.size <= 10000, 'RESEARCH_ACTION_TOO_LARGE', '人工请求来源元数据超过上限', 413);
        }
        return digest([...rows].sort(([a], [b]) => a.localeCompare(b)).map(([key, row]) => [key, digest(row)]));
    }
    view(row) {
        const reasons = [], pid = row.projectId;
        try {
            const s = this.app.store.get('session', row.sessionId, pid), p = this.app.store.get('project', pid);
            ensure(s.role === 'coordinator' && !s.taskId && !s.teamId && s.state !== 'archived', 'INVALID_ROOT_SESSION', '原主会话已归档或改变');
            ensure(p.status === 'active' && p.lifecycleEpoch === row.lifecycleEpoch, 'PROJECT_LIFECYCLE_STALE', '项目生命周期已改变');
            ensure(this.app.researchAutomation.modelIdentity(s) === row.modelDigest, 'RESEARCH_ACTION_MODEL_CHANGED', '原模型或连接已改变');
            if (row.completionPermissionReference)
                ensure(row.state === 'completed' && row.input.kind === 'text_grant' && row.decision === 'confirm' && row.resultRef && 'grantId' in row.resultRef && s.textCorpusGrantId === row.resultRef.grantId && row.completionPermissionReference.rootSessionId === row.permissionReference.rootSessionId && row.completionPermissionReference.epoch === row.permissionReference.epoch && row.completionPermissionReference.hostEpoch === row.permissionReference.hostEpoch, 'RESEARCH_ACTION_CORRUPTED', '权限完成回执只属于本次固定原文授权');
            this.app.sessionPermissions.assert(row.completionPermissionReference ?? row.permissionReference, false);
            const m = this.app.store.get('message', row.originMessageId, pid);
            ensure(m.sessionId === s.id && m.role === 'user' && m.origin !== 'automation' && !m.wakeupId && !m.approvalNoticeId && !m.queueRemoved && digest(m.content) === row.originDigest, 'RESEARCH_ACTION_ORIGIN_STALE', '原人工消息已改变');
            ensure(row.actionKind === row.input.kind && digest(row.input) === row.requestDigest, 'RESEARCH_ACTION_CORRUPTED', '固定人工请求内容已改变');
            if (row.input.kind === 'text_grant')
                ensure(!s.textCorpusGrantId || row.state === 'completed' && row.resultRef && 'grantId' in row.resultRef && s.textCorpusGrantId === row.resultRef.grantId, 'TEXT_GRANT_SESSION_REQUIRED', '此主会话已有固定原文授权，不能替换');
            ensure(this.source(pid, row.input, row.textCorpus) === (row.completionSourceDigest ?? row.sourceDigest), 'RESEARCH_ACTION_SOURCE_STALE', '固定请求来源已改变');
            if (row.state === 'pending' && row.input.kind === 'claim_decision')
                ensure(this.app.store.get('claim', row.input.claim.claimId, pid).version === row.input.claim.expectedVersion, 'VERSION_CONFLICT', '结论版本已改变');
        }
        catch (error) {
            reasons.push(asError(error).code);
        }
        const effectiveState = reasons.length ? 'stale' : row.state === 'pending' && Date.now() >= Date.parse(row.expiresAt) ? 'expired' : row.state;
        return { ...row, effectiveState, reasons };
    }
    list(actor, pid, sessionId) {
        userOnly(actor);
        return this.app.store.readSnapshot(() => { const s = this.root(actor, pid, sessionId); return this.app.store.list('research-action', pid).filter(r => r.sessionId === s.id).map(r => this.view(r)); });
    }
    inspect(actor, pid, sessionId, requestId) {
        return this.app.store.readSnapshot(() => { this.root(actor, pid, sessionId); const r = this.app.store.get('research-action', text(requestId, 'requestId', 100), pid); ensure(r.sessionId === sessionId, 'SCOPE_DENIED', '人工请求属于其他主会话', 403); return summary(this.view(r)); });
    }
    prepare(actor, pid, sessionId, value, receiptId) {
        validateSchema(RESEARCH_ACTION_INPUT_SCHEMA, value);
        const input = value;
        return this.app.store.transaction(() => {
            const s = this.root(actor, pid, sessionId);
            ensure(actor.type === 'agent', 'PERMISSION_DENIED', '只有交互主 Agent 可准备人工请求', 403);
            const requestDigest = digest(input), existing = this.app.store.list('research-action', pid).find(r => r.sessionId === s.id && r.originMessageId === actor.messageId && r.requestDigest === requestDigest);
            const m = this.origin(actor, pid, s, !receiptId && !existing), permissionReference = actor.permission ?? this.app.sessionPermissions.capture(s.id);
            this.app.sessionPermissions.assert(permissionReference);
            const p = assertProjectWritable(this.app.store, pid);
            if (receiptId) {
                const prior = this.app.store.get('research-action', receiptId, pid);
                ensure(prior.sessionId === s.id && prior.originMessageId === m.id && prior.requestDigest === requestDigest, 'IDEMPOTENCY_CONFLICT', '同一调用标识不能用于其他人工消息或请求');
                return summary(this.view(prior));
            }
            if (existing)
                return summary(this.view(existing));
            const textCorpus = input.kind === 'text_grant' ? this.corpus(pid, input) : undefined;
            if (input.kind === 'text_grant') {
                ensure(!s.textCorpusGrantId, 'TEXT_GRANT_SESSION_REQUIRED', '此主会话已有固定原文授权，不能替换');
                const at = Date.parse(input.textGrant.expiresAt);
                ensure(Number.isFinite(at) && at > Date.now() && at <= Date.now() + 86400000, 'INVALID_INPUT', '原文授权期限必须在未来24小时内', 400);
            }
            if (input.kind === 'claim_decision')
                ensure(this.app.store.get('claim', input.claim.claimId, pid).version === input.claim.expectedVersion, 'VERSION_CONFLICT', '结论版本已改变');
            const sourceDigest = this.source(pid, input, textCorpus), expiresAt = new Date(Math.min(Date.now() + TWO_HOURS, input.kind === 'text_grant' ? Date.parse(input.textGrant.expiresAt) : Infinity)).toISOString();
            const r = this.app.store.create('research-action', pid, { sessionId: s.id, originMessageId: m.id, originDigest: digest(m.content), generation: actor.generation, modelDigest: this.app.researchAutomation.modelIdentity(s), permissionReference, lifecycleEpoch: p.lifecycleEpoch, actionKind: input.kind, input: JSON.parse(JSON.stringify(input)), ...(textCorpus ? { textCorpus } : {}), sourceDigest, requestDigest, expiresAt, state: 'pending' });
            this.app.store.event(pid, 'research-action.prepared', { sessionId: s.id, requestId: r.id, kind: input.kind, originMessageId: m.id });
            return summary(this.view(r));
        });
    }
    decide(actor, pid, sessionId, value) {
        userOnly(actor);
        validateSchema(RESEARCH_ACTION_INPUT_SCHEMAS.research_action_decide, value);
        const x = value;
        return this.app.store.transaction(() => {
            this.root(actor, pid, sessionId);
            const r = this.app.store.get('research-action', x.requestId, pid);
            ensure(r.sessionId === sessionId, 'SCOPE_DENIED', '人工请求属于其他主会话', 403);
            const allowed = r.actionKind === 'claim_decision' ? ['accepted', 'rejected', 'disputed', 'dismiss'] : r.actionKind === 'history' ? ['dismiss'] : ['confirm', 'reject'];
            ensure(allowed.includes(x.decision), 'INVALID_INPUT', '此人工请求不接受该决定', 400);
            const closing = x.decision === 'reject' || x.decision === 'dismiss', current = this.view(r);
            if (closing) {
                assertProjectWritable(this.app.store, pid);
                if (r.state === 'rejected') {
                    ensure(r.decision === x.decision && r.decisionVersion === x.expectedVersion, 'RESEARCH_ACTION_ALREADY_DECIDED', '人工请求已按其他版本或决定处理');
                    return summary(current);
                }
                if (r.state === 'pending') {
                    ensure(r.version === x.expectedVersion, 'VERSION_CONFLICT', '人工请求已变化，请刷新后重试');
                    const updated = this.app.store.update('research-action', r.id, r.version, { state: 'rejected', decision: x.decision, decisionVersion: x.expectedVersion });
                    this.app.store.event(pid, 'research-action.decided', { sessionId, requestId: r.id, kind: r.actionKind, decision: x.decision });
                    return summary(this.view(updated));
                }
            }
            ensure(current.effectiveState !== 'stale' && current.effectiveState !== 'expired', 'RESEARCH_ACTION_STALE', '人工请求已失效，请通过新的人工消息重新准备');
            assertProjectWritable(this.app.store, pid, r.lifecycleEpoch);
            if (r.state !== 'pending') {
                ensure(r.decision === x.decision && r.decisionVersion === x.expectedVersion, 'RESEARCH_ACTION_ALREADY_DECIDED', '人工请求已按其他版本或决定处理');
                return summary(current);
            }
            ensure(r.version === x.expectedVersion, 'VERSION_CONFLICT', '人工请求已变化，请刷新后重试');
            let resultRef;
            if (r.input.kind === 'text_grant' && x.decision === 'confirm') {
                const g = this.app.textCorpusGrants.prepare(actor, pid, { sessionId, ...r.input.textGrant, ...r.textCorpus }), a = this.app.store.get('approval', g.approvalId, pid);
                this.app.approvals.decide(actor, a.id, a.version, true);
                const active = this.app.textCorpusGrants.activate(actor, pid, { grantId: g.id, expectedVersion: g.version });
                resultRef = { grantId: active.id };
            }
            else if (r.input.kind === 'claim_decision' && x.decision !== 'dismiss')
                this.app.evidence.decideClaim(actor, r.input.claim.claimId, r.input.claim.expectedVersion, x.decision);
            else if (r.input.kind === 'report_compose' && x.decision === 'confirm') {
                const a = this.app.reports.create(actor, pid, r.input.report), reports = this.app.store.list('report', pid).filter(row => row.artifactId === a.id);
                ensure(reports.length === 1, 'RESEARCH_ACTION_RESULT_INVALID', '组合报告缺少唯一固定记录');
                resultRef = { reportId: reports[0].id };
            }
            const state = 'completed', completionSourceDigest = this.source(pid, r.input, r.textCorpus), completionPermissionReference = r.input.kind === 'text_grant' ? this.app.sessionPermissions.capture(sessionId) : undefined;
            if (completionPermissionReference)
                ensure(completionPermissionReference.rootSessionId === r.permissionReference.rootSessionId && completionPermissionReference.epoch === r.permissionReference.epoch && completionPermissionReference.hostEpoch === r.permissionReference.hostEpoch, 'SESSION_PERMISSION_STALE', '原文授权完成期间外部权限已改变');
            const updated = this.app.store.update('research-action', r.id, r.version, { state, decision: x.decision, decisionVersion: x.expectedVersion, completionSourceDigest, ...(completionPermissionReference ? { completionPermissionReference } : {}), ...(resultRef ? { resultRef } : {}) });
            this.app.store.event(pid, 'research-action.decided', { sessionId, requestId: r.id, kind: r.actionKind, decision: x.decision, ...(resultRef ? { resultRef } : {}) });
            return summary(this.view(updated));
        });
    }
}
//# sourceMappingURL=actions.js.map