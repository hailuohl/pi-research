import { randomUUID } from 'node:crypto';
import { digest, now } from '../storage/store.js';
import { ensure, asError } from '../domain/errors.js';
import { object, text, integer } from '../contracts/validation.js';
import { scope, userOnly } from './permissions.js';
import { assertProjectWritable } from './lifecycle.js';
import { assertDiscoveryDocument } from './discovery-grant-validation.js';
export const textCorpusGrantReference = (g) => ({ id: g.id, digest: g.digest, approvalId: g.approvalId });
const payload = (g) => { const { sessionId, model, corpusId, configurationVersion, documents, maxSearches, expiresAt, approvalId } = g; return { sessionId, model, corpusId, configurationVersion, documents, maxSearches, expiresAt, approvalId }; };
const pairKey = (p) => `${p.documentVersionId}\0${p.parseResultId}`;
/** Metadata only: reject stale authority before opening any original or page file. */
export function assertCorpusDocument(store, pid, ref) {
    const d = store.get('document-version', ref.documentVersionId, pid), r = store.get('document-parse-result', ref.parseResultId, pid), j = store.get('document-parse-job', r.jobId, pid), a = store.get('approval', j.approvalId, pid);
    ensure(d.contentKind === 'original-pdf' && d.original.mediaType === 'application/pdf' && digest(d) === ref.documentDigest && digest(r) === ref.resultDigest && r.documentVersionId === d.id && r.rawDigest === d.original.digest && r.pageCount === r.pages.length && r.pages.every((p, i) => p.pageNumber === i + 1) && digest(r.pages) === digest(ref.pages), 'TEXT_DOCUMENT_STALE', '固定 PDF 文档或解析结果已改变');
    ensure(j.id === ref.jobId && j.documentVersionId === d.id && j.state === 'succeeded' && j.integrity === 'complete' && j.resultId === r.id && j.manifestDigest === ref.manifestDigest && r.manifestDigest === j.manifestDigest && digest(j.manifest) === j.manifestDigest && j.manifest.documentDigest === ref.documentDigest && j.manifest.rawDigest === r.rawDigest && j.approvalId === ref.approvalId, 'TEXT_DOCUMENT_STALE', '固定解析任务已改变');
    ensure(a.subjectKind === 'document-parse-job' && a.subjectId === j.id && a.scope === 'document.parse' && a.digest === j.manifestDigest && a.status === 'approved' && !a.runGrant && !a.workingGrant, 'APPROVAL_STALE', '固定解析批准已失效');
    assertDiscoveryDocument(store, pid, d);
}
function record(store, pid, id) {
    const g = store.get('text-corpus-grant', id, pid), a = store.get('approval', g.approvalId, pid);
    ensure(digest(payload(g)) === g.digest && Number.isInteger(g.maxSearches) && g.maxSearches >= 1 && g.maxSearches <= 2, 'TEXT_GRANT_CORRUPTED', '固定原文授权已改变');
    ensure(a.subjectKind === 'text-corpus-grant' && a.subjectId === g.id && a.digest === g.digest && a.scope === 'text-corpus-grant.activate' && !a.runGrant && !a.workingGrant, 'APPROVAL_STALE', '原文授权批准身份不符');
    return { grant: g, approval: a };
}
function sources(store, pid, g) {
    const config = store.get('text-evidence-settings', pid, pid);
    ensure(config.enabled, 'TEXT_EVIDENCE_DISABLED', '本地原文检索已关闭');
    ensure(config.corpusId === g.corpusId && config.version === g.configurationVersion, 'TEXT_EVIDENCE_CONFIGURATION_CHANGED', '文献集合已改变');
    const corpus = store.get('text-corpus', g.corpusId, pid);
    ensure(digest({ projectId: pid, sources: corpus.sources, documents: corpus.documents, parserVersion: corpus.parserVersion }) === g.corpusId, 'TEXT_DOCUMENT_STALE', '固定语料内容与标识不符');
    const refs = g.documents.map(p => { const ref = corpus.documents?.find(r => pairKey(r) === pairKey(p)); ensure(ref && digest(ref) === p.sourceDigest, 'TEXT_DOCUMENT_STALE', '固定授权来源已改变'); return ref; });
    refs.forEach(ref => assertCorpusDocument(store, pid, ref));
    return refs;
}
export function assertTextCorpusGrantActor(store, actor, pid, reference) {
    scope(actor, pid);
    assertProjectWritable(store, pid);
    ensure(actor.type === 'agent' && actor.sessionId && actor.role === 'coordinator' && !actor.taskId && !actor.wakeupId, 'PERMISSION_DENIED', 'PDF 检索仅允许明确授权的主 Pi 会话', 403);
    const s = store.get('session', actor.sessionId, pid);
    ensure(s.textCorpusGrantId, 'PERMISSION_DENIED', '此主会话没有固定 PDF 检索授权', 403);
    const { grant: g, approval } = record(store, pid, s.textCorpusGrantId);
    ensure(!reference || digest(reference) === digest(textCorpusGrantReference(g)), 'TEXT_GRANT_STALE', '检索授权引用不符');
    ensure(g.state === 'active' && approval.status === 'approved', 'TEXT_GRANT_REVOKED', '原文授权未激活或已撤销');
    ensure(g.sessionId === s.id && s.role === 'coordinator' && !s.taskId && s.state !== 'archived' && digest(s.model) === digest(g.model), 'TEXT_GRANT_SCOPE_CHANGED', '指定主会话或模型已改变');
    ensure(s.generation === actor.generation && s.state === 'running' && s.leaseUntil > Date.now(), 'LEASE_EXPIRED', '会话已中止或租约过期');
    ensure(Date.now() < Date.parse(g.expiresAt), 'TEXT_GRANT_EXPIRED', '原文授权已到期');
    sources(store, pid, g);
    return g;
}
/** A PDF grant never permits reading an entire parser artifact through a generic tool. */
export function isPdfArtifact(store, pid, id) {
    const a = store.get('artifact', id, pid);
    // ponytail: scan existing provenance records; add an artifact index if PDF catalogs grow.
    return a.origin === 'document-parser' || store.list('document-version', pid).some(d => d.contentKind === 'original-pdf' && (d.original.artifactId === id || d.derivedText?.artifactId === id)) || store.list('document-parse-result', pid).some(r => r.manifestArtifactId === id || r.pages.some(p => p.textArtifactId === id || p.imageArtifactId === id));
}
export function assertPdfArtifactRead(store, actor, pid, id) {
    if (actor.type === 'agent' && !actor.taskId && !actor.wakeupId)
        ensure(!isPdfArtifact(store, pid, id), 'TEXT_GRANT_TOOL_DENIED', 'PDF 原件和解析页仅通过固定授权词项检索读取', 403);
}
export class TextCorpusGrantService {
    app;
    constructor(app) {
        this.app = app;
    }
    inspect(actor, pid, id) {
        userOnly(actor);
        scope(actor, pid);
        const g = this.app.store.get('text-corpus-grant', id, pid), reasons = [];
        try {
            const { approval } = record(this.app.store, pid, id);
            ensure(g.state === 'draft' ? ['pending', 'approved'].includes(approval.status) : g.state === 'active' && approval.status === 'approved', 'TEXT_GRANT_REVOKED', '原文授权已失效');
            const s = this.app.store.get('session', g.sessionId, pid);
            ensure(s.role === 'coordinator' && !s.taskId && s.state !== 'archived' && digest(s.model) === digest(g.model) && (g.state !== 'active' || s.textCorpusGrantId === g.id), 'TEXT_GRANT_SCOPE_CHANGED', '指定会话或模型改变');
            sources(this.app.store, pid, g);
        }
        catch (error) {
            reasons.push(asError(error).code);
        }
        const uses = this.app.store.list('text-corpus-grant-use', pid).filter(u => u.grantId === id), remaining = Math.max(0, g.maxSearches - uses.length);
        const effectiveState = g.state === 'revoked' ? 'revoked' : reasons.length ? 'stale' : Date.now() >= Date.parse(g.expiresAt) ? 'expired' : g.state === 'draft' ? 'draft' : remaining === 0 ? 'exhausted' : 'active';
        return { ...g, effectiveState, validity: reasons.length ? 'stale' : 'current', reasons, usage: { limit: g.maxSearches, used: uses.length, remaining, unit: 'search' }, uses, searchResults: uses.map(u => this.app.store.get('text-evidence-search', u.searchId, pid)) };
    }
    prepare(actor, pid, value) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(value);
        ensure(Object.keys(x).every(k => ['sessionId', 'documents', 'corpusId', 'configurationVersion', 'maxSearches', 'expiresAt'].includes(k)), 'INVALID_INPUT', '原文授权包含未知字段');
        return this.app.store.transaction(() => {
            assertProjectWritable(this.app.store, pid);
            const s = this.app.store.get('session', text(x.sessionId, 'sessionId', 100), pid);
            ensure(s.role === 'coordinator' && !s.taskId && s.state !== 'archived' && !s.textCorpusGrantId, 'TEXT_GRANT_SESSION_REQUIRED', '请选择尚未绑定原文授权的主协调会话');
            const selected = this.app.textEvidence.authorizeSearch(actor, pid, { documents: x.documents, corpusId: x.corpusId, configurationVersion: x.configurationVersion });
            ensure(selected.pairs.length > 0, 'TEXT_SOURCE_REQUIRED', '请选择精确 PDF 文档与解析版本');
            const expiresAt = text(x.expiresAt, 'expiresAt', 50);
            ensure(Date.parse(expiresAt) > Date.now() && Date.parse(expiresAt) <= Date.now() + 86400000, 'INVALID_INPUT', '期限必须在未来24小时内');
            const fixed = { sessionId: s.id, model: s.model, corpusId: selected.config.corpusId, configurationVersion: selected.config.version, documents: selected.documentRefs.map(ref => ({ documentVersionId: ref.documentVersionId, parseResultId: ref.parseResultId, sourceDigest: digest(ref) })), maxSearches: integer(x.maxSearches, 'maxSearches', 1, 2), expiresAt: new Date(expiresAt).toISOString() };
            const id = randomUUID(), a = this.app.approvals.request(pid, 'text-corpus-grant', id, '', 'text-corpus-grant.activate', '仅批准指定主 Pi 会话对固定完整 PDF 解析结果最多两次新词项检索；不授权全文下载、联网、计算或科学结论'), hash = digest({ ...fixed, approvalId: a.id });
            this.app.store.update('approval', a.id, a.version, { digest: hash });
            this.app.store.create('text-corpus-grant', pid, { ...fixed, approvalId: a.id, digest: hash, state: 'draft' }, id);
            this.app.store.event(pid, 'text-corpus-grant.prepared', { grantId: id, sessionId: s.id, approvalId: a.id });
            return this.inspect(actor, pid, id);
        });
    }
    activate(actor, pid, value) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(value);
        return this.app.store.transaction(() => {
            assertProjectWritable(this.app.store, pid);
            const { grant: g } = record(this.app.store, pid, text(x.grantId, 'grantId', 100)), s = this.app.store.get('session', g.sessionId, pid);
            ensure(g.state === 'draft' && g.version === integer(x.expectedVersion, 'expectedVersion', 1), 'VERSION_CONFLICT', '草案已变化或撤销');
            ensure(!s.textCorpusGrantId && s.role === 'coordinator' && !s.taskId && s.state !== 'archived' && digest(s.model) === digest(g.model), 'TEXT_GRANT_SCOPE_CHANGED', '指定会话或模型改变');
            ensure(Date.now() < Date.parse(g.expiresAt), 'TEXT_GRANT_EXPIRED', '原文授权已到期');
            sources(this.app.store, pid, g);
            this.app.approvals.assert(g.approvalId, pid, g.id, g.digest, 'text-corpus-grant.activate');
            this.app.store.update('session', s.id, s.version, { textCorpusGrantId: g.id });
            this.app.store.update('text-corpus-grant', g.id, g.version, { state: 'active', activatedAt: now() });
            this.app.store.event(pid, 'text-corpus-grant.activated', { grantId: g.id, sessionId: s.id });
            return this.inspect(actor, pid, g.id);
        });
    }
    revoke(actor, pid, value) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(value);
        return this.app.store.transaction(() => { const g = this.app.store.get('text-corpus-grant', text(x.grantId, 'grantId', 100), pid); if (g.state === 'revoked')
            return this.inspect(actor, pid, g.id); this.app.store.update('text-corpus-grant', g.id, integer(x.expectedVersion, 'expectedVersion', 1), { state: 'revoked', revokedAt: now() }); this.app.approvals.stale(g.id); this.app.store.event(pid, 'text-corpus-grant.revoked', { grantId: g.id }); return this.inspect(actor, pid, g.id); });
    }
    authorizeContent(actor, pid, name, x) {
        if (actor.type !== 'agent' || actor.taskId || actor.wakeupId)
            return;
        if (name === 'artifact_read' || name === 'evidence_register') {
            assertPdfArtifactRead(this.app.store, actor, pid, x.artifactId);
            return;
        }
        if (name !== 'evidence_read')
            return;
        const evidence = this.app.store.get('evidence', x.evidenceId, pid);
        if (!evidence.document && !isPdfArtifact(this.app.store, pid, evidence.artifactId))
            return;
        const g = assertTextCorpusGrantActor(this.app.store, actor, pid);
        const allowed = this.app.store.list('text-corpus-grant-use', pid).filter(u => u.grantId === g.id && u.grantDigest === g.digest).some(u => {
            const search = this.app.store.get('text-evidence-search', u.searchId, pid);
            return digest(search.textCorpusGrant) === digest(textCorpusGrantReference(g)) && search.hits.some(h => h.evidenceId === evidence.id || h.alternativeSources?.some(a => a.evidenceId === evidence.id));
        });
        ensure(allowed, 'TEXT_GRANT_EVIDENCE_DENIED', '只能回查此授权已返回的 PDF 证据', 403);
    }
}
//# sourceMappingURL=text-corpus-grants.js.map