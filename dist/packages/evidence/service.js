import { assertGrantAdmission } from '../policy/grant-retirement.js';
import { assertDiscoveryArtifact, assertDiscoveryDocument } from '../policy/discovery-grant-validation.js';
import { assertPdfArtifactRead, assertTextCorpusGrantActor } from '../policy/text-corpus-grants.js';
import { verifyDocumentLink } from './document-link.js';
import { assertPmcArtifactRead, pmcOwner, verifyPmcText } from '../documents/pmc-text.js';
import { captureAcceptance, assertAcceptanceCurrent } from './acceptance.js';
import { assertProjectReadable, assertProjectWritable } from '../policy/lifecycle.js';
import { readFileSync } from 'node:fs';
import { prepareArtifactBlob } from '../storage/artifact-blob.js';
import { verifyFixedTextEvidence } from './fixed-text.js';
import { scope, userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { text, integer, strings } from '../contracts/validation.js';
import { environmentSecrets, redactEnvironment } from '../runtime/environment.js';
import { fixedResearchBrief } from '../research-workflows/briefs.js';
import { assertFrozenMethod } from '../research-workflows/method-contracts.js';
function evidenceDescriptor(c, actor, id) { const a = c.store.get('artifact', id); scope(actor, a.projectId); assertProjectReadable(c.store, a.projectId, actor); ensure(a.origin !== 'native-continuation' || actor.type !== 'agent', 'NATIVE_CONTINUATION_PRIVATE', '原生续跑材料不向普通助手提供', 403); assertPmcArtifactRead(c.store, actor, a.projectId, id); assertPdfArtifactRead(c.store, actor, a.projectId, id); return a; }
function readEvidenceArtifact(c, actor, id) { const a = evidenceDescriptor(c, actor, id), bytes = readFileSync(c.store.paths.physical(a.path)); ensure(digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '产物内容校验失败', 409); return { artifact: a, bytes }; }
/** Host reference validation shares the complete evidence chain with the ordinary service. */
export function verifyEvidence(c, projectId, evidenceId, current = true) { const e = c.store.get('evidence', evidenceId, projectId); const artifact = evidenceDescriptor(c, { type: 'system' }, e.artifactId); if (e.fixedText)
    verifyFixedTextEvidence(c.store, projectId, artifact, e);
else {
    const { bytes } = readEvidenceArtifact(c, { type: 'system' }, e.artifactId);
    ensure(artifact.projectId === projectId && artifact.digest === e.digest && bytes.toString('utf8').slice(e.locator.start, e.locator.end) === e.quote, 'EVIDENCE_INVALID', '证据引用或内容已失效', 409);
} if (current)
    assertDiscoveryArtifact(c.store, projectId, artifact); if (e.providerText)
    verifyPmcText(c, projectId, e.providerText.documentVersionId, e.providerText, e.artifactId); if (e.document) {
    const link = verifyDocumentLink(c, projectId, e.document, e.artifactId);
    if (current)
        assertDiscoveryDocument(c.store, projectId, link.document);
} return e; }
export class EvidenceService {
    c;
    constructor(c) {
        this.c = c;
    }
    /** Host-only: reuse the original confirmed brief; never resolve to its latest revision. */
    fixedResearchMethods(projectId, ref, expectedContractDigest) {
        const original = this.c.store.get('research-brief', ref.id, projectId);
        if (!original.methodContract && expectedContractDigest === undefined)
            return undefined;
        const brief = fixedResearchBrief(this.c.store, projectId, ref, 'formal');
        ensure(brief.methodContract && brief.methodContract.contractDigest === expectedContractDigest, 'METHOD_CONTRACT_CORRUPTED', '方法清单标识缺失或不符合原冻结计划');
        const compiled = assertFrozenMethod(this.c.store, projectId, brief.methodContract, brief.sourceInputs, brief.rootSessionId, 'formal');
        return { contract: brief.methodContract, protocol: compiled.protocol };
    }
    /** Host-only staging: immutable CAS bytes, without publishing any database record. */
    prepareArtifact(projectId, title, bytes, mediaType = 'text/plain', origin = 'user', extra = {}, maxBytes = 32 * 1024 * 1024) {
        this.c.store.get('project', projectId);
        if (origin.startsWith('agent:')) {
            const secrets = environmentSecrets(this.c.dataDir);
            ensure(!secrets.some(secret => mediaType.includes(secret)), 'ARTIFACT_SECRET_METADATA', '产物格式包含环境变量敏感值，未创建', 409);
            title = redactEnvironment(this.c.dataDir, title);
            if (secrets.some(secret => bytes.includes(Buffer.from(secret)))) {
                let content;
                try {
                    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
                    ensure(!content.includes('\0'), 'ARTIFACT_SECRET_BINARY', '二进制产物包含环境变量敏感值，未创建', 409);
                }
                catch {
                    ensure(false, 'ARTIFACT_SECRET_BINARY', '二进制产物包含环境变量敏感值，未创建', 409);
                }
                bytes = Buffer.from(redactEnvironment(this.c.dataDir, content));
            }
        }
        text(title, 'title', 200);
        ensure(Number.isSafeInteger(maxBytes) && maxBytes > 0 && bytes.length <= maxBytes, 'ARTIFACT_TOO_LARGE', `产物超过 ${maxBytes} bytes`, 413);
        const blob = prepareArtifactBlob(this.c.store, bytes);
        return { ...extra, title, digest: blob.digest, size: blob.size, path: blob.blobPath, mediaType, origin };
    }
    /** Receives only host-prepared descriptors; callers fence authorization inside the publish transaction. */
    publishPrepared(projectId, prepared) { this.c.store.get('project', projectId); return this.c.store.create('artifact', projectId, prepared); }
    put(projectId, title, bytes, mediaType = 'text/plain', origin = 'user', extra = {}, maxBytes = 32 * 1024 * 1024) { return this.publishPrepared(projectId, this.prepareArtifact(projectId, title, bytes, mediaType, origin, extra, maxBytes)); }
    /** Metadata only; transport/task authority remains the caller's responsibility. */
    descriptor(actor, id) { return evidenceDescriptor(this.c, actor, id); }
    read(actor, id) { return readEvidenceArtifact(this.c, actor, id); }
    register(actor, projectId, artifactId, start, end, description, type = 'artifact', runId, exactQuote) {
        scope(actor, projectId);
        const a = this.c.store.get('artifact', artifactId, projectId);
        ensure(a.origin !== 'native-continuation', 'NATIVE_CONTINUATION_PRIVATE', '原生续跑协议材料不能登记为科研证据或导出来源', 403);
        assertDiscoveryArtifact(this.c.store, projectId, a);
        const { bytes } = this.read(actor, a.id);
        ensure(bytes.length <= 2 * 1024 * 1024 && !bytes.includes(0), 'EVIDENCE_TEXT_REQUIRED', '需要可定位的文本产物', 400);
        let content;
        try {
            content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
        }
        catch {
            ensure(false, 'EVIDENCE_TEXT_REQUIRED', '需要有效 UTF-8 文本', 400);
        }
        if (exactQuote !== undefined) {
            text(exactQuote, 'exactQuote', 16000);
            if (start === undefined && end === undefined) {
                start = content.indexOf(exactQuote);
                ensure(start >= 0, 'EVIDENCE_QUOTE_NOT_FOUND', 'exactQuote 必须逐字来自实际正文，保留空格和换行；请重新读取原文，不能猜测位置或省略内容', 400);
                ensure(content.indexOf(exactQuote, start + 1) < 0, 'EVIDENCE_QUOTE_AMBIGUOUS', '原文有重复片段；请扩展 exactQuote 包含唯一上下文，或提供已核对的 UTF-16 start/end', 400);
                end = start + exactQuote.length;
            }
        }
        start = integer(start, 'start', 0, content.length);
        end = integer(end, 'end', start + 1, content.length);
        if (exactQuote !== undefined)
            ensure(content.slice(start, end) === exactQuote, 'EVIDENCE_QUOTE_MISMATCH', '指定范围与 exactQuote 不一致；请核对原文，不估算位置', 400);
        if (runId)
            this.c.store.get('run', runId, projectId);
        return this.c.store.create('evidence', projectId, { type, artifactId: a.id, digest: a.digest, locator: { start, end }, quote: content.slice(start, end), description: text(description, 'description', 2000), ...(runId ? { runId } : {}) });
    }
    verify(projectId, evidenceId, current = true) { return verifyEvidence(this.c, projectId, evidenceId, current); }
    /** Host local search only; no caller-supplied authority flag or new agent tool. */
    registerProviderText(actor, projectId, providerText, start, end, description) {
        pmcOwner(actor);
        scope(actor, projectId);
        assertProjectWritable(this.c.store, projectId);
        return this.registerProviderTextCore(actor, projectId, providerText, start, end, description);
    }
    /** Host search path only; never exposed as a tool or a caller-supplied authority flag. */
    registerGrantedProviderText(actor, projectId, providerText, start, end, description, reference) {
        return this.c.store.transaction(() => {
            ensure(reference, 'TEXT_GRANT_REQUIRED', '缺少固定检索授权');
            const grant = assertTextCorpusGrantActor(this.c.store, actor, projectId, reference);
            assertGrantAdmission(this.c.store, projectId, 'text-corpus-grant', grant.id);
            ensure(grant.pmcDocuments?.some(p => p.documentVersionId === providerText.documentVersionId), 'TEXT_GRANT_SOURCE_DENIED', 'PMC 证据来源不在授权内', 403);
            return this.registerProviderTextCore({ type: 'system' }, projectId, providerText, start, end, description);
        });
    }
    registerProviderTextCore(actor, projectId, providerText, start, end, description) {
        return this.c.store.transaction(() => { const { document } = verifyPmcText(this.c, projectId, providerText.documentVersionId, providerText); const e = this.register(actor, projectId, document.derivedText.artifactId, start, end, description, 'paper'); return this.c.store.update('evidence', e.id, e.version, { providerText }); });
    }
    registerDocument(actor, projectId, input) {
        userOnly(actor);
        scope(actor, projectId);
        assertProjectWritable(this.c.store, projectId);
        return this.registerDocumentCore(actor, projectId, input);
    }
    /** Host search path only; no tool exposes this method or accepts an authority flag. */
    registerGrantedDocument(actor, projectId, input, reference) {
        return this.c.store.transaction(() => {
            ensure(reference, 'TEXT_GRANT_REQUIRED', '缺少固定检索授权');
            const grant = assertTextCorpusGrantActor(this.c.store, actor, projectId, reference);
            assertGrantAdmission(this.c.store, projectId, 'text-corpus-grant', grant.id);
            ensure(grant.documents.some(p => p.documentVersionId === input.documentVersionId && p.parseResultId === input.parseResultId), 'TEXT_GRANT_SOURCE_DENIED', '证据来源不在授权内', 403);
            return this.registerDocumentCore({ type: 'system' }, projectId, input);
        });
    }
    registerDocumentCore(actor, projectId, input) {
        return this.c.store.transaction(() => {
            const result = this.c.store.get('document-parse-result', input.parseResultId, projectId);
            const page = result.pages.find(p => p.pageNumber === integer(input.pageNumber, 'pageNumber', 1, 10000));
            ensure(page, 'DOCUMENT_PAGE_NOT_FOUND', '原文没有该页', 404);
            const document = { documentVersionId: input.documentVersionId, rawDigest: result.rawDigest, parseResultId: result.id, pageNumber: page.pageNumber, textArtifactDigest: page.textArtifactDigest };
            assertDiscoveryDocument(this.c.store, projectId, verifyDocumentLink(this.c, projectId, document, page.textArtifactId).document);
            const e = this.register(actor, projectId, page.textArtifactId, input.start, input.end, input.description, 'paper');
            return this.c.store.update('evidence', e.id, e.version, { document });
        });
    }
    proposeClaim(actor, projectId, statement, evidenceIds, limitations = [], taskId) {
        scope(actor, projectId);
        ensure(evidenceIds.length > 0, 'EVIDENCE_REQUIRED', '结论候选必须引用证据', 400);
        evidenceIds.forEach(id => this.verify(projectId, id));
        const task = taskId ? this.c.store.get('task', taskId, projectId) : undefined;
        return this.c.store.create('claim', projectId, { statement: text(statement, 'statement', 10000), evidenceIds: strings(evidenceIds, 'evidenceIds'),
            limitations: strings(limitations, 'limitations'), status: 'proposal', validity: 'current',
            ...(task ? { taskId: task.id, sourceAttemptId: task.attemptId, sourceResultDigest: task.result ? digest(task.result) : undefined } : {}) });
    }
    /** File hashes establish integrity; acceptance bindings establish applicability. */
    assertClaimCurrent(claim) {
        ensure(claim.validity !== 'stale', 'CLAIM_STALE', '结论依赖的前提或审查已撤销，不能作为当前结论使用');
        const sourceTasks = new Set(claim.taskId ? [claim.taskId] : []);
        claim.evidenceIds.forEach(id => { const e = this.verify(claim.projectId, id); const a = this.c.store.get('artifact', e.artifactId, claim.projectId); if (a.taskId)
            sourceTasks.add(a.taskId); });
        const refs = claim.sourceAcceptanceIds ?? (claim.sourceAcceptanceId ? [claim.sourceAcceptanceId] : []);
        const bound = new Set(refs.map(id => assertAcceptanceCurrent(this.c.store, claim.projectId, id).taskId));
        ensure([...sourceTasks].every(id => bound.has(id)), 'CLAIM_REAPPROVAL_REQUIRED', '历史任务结论缺少当前版本采纳依据，请重新核验后采纳');
        return claim;
    }
    decideClaim(actor, id, version, status) {
        userOnly(actor);
        return this.c.store.transaction(() => {
            const c = this.c.store.get('claim', id);
            scope(actor, c.projectId);
            assertProjectWritable(this.c.store, c.projectId);
            ensure(['accepted', 'rejected', 'disputed'].includes(status), 'INVALID_INPUT', '结论状态无效', 400);
            const taskIds = new Set(c.taskId ? [c.taskId] : []);
            c.evidenceIds.forEach(id => { const e = this.verify(c.projectId, id, status === 'accepted'); const a = this.c.store.get('artifact', e.artifactId, c.projectId); if (a.taskId)
                taskIds.add(a.taskId); });
            const refs = [];
            if (status === 'accepted') {
                ensure(c.validity !== 'stale', 'CLAIM_STALE', '旧前提已撤销，需要新任务结果或显式重新研究，不能直接重置历史结论');
                if (c.taskId) {
                    const t = this.c.store.get('task', c.taskId, c.projectId);
                    ensure((!c.sourceAttemptId || c.sourceAttemptId === t.attemptId) && (!c.sourceResultDigest || c.sourceResultDigest === digest(t.result)) &&
                        t.result?.claims.some(p => p.statement === c.statement && digest(p.evidenceIds) === digest(c.evidenceIds)), 'CLAIM_STALE', '结论不属于当前任务提交版本');
                }
                for (const tid of taskIds)
                    refs.push(captureAcceptance(this.c.store, c.projectId, tid).id);
            }
            const sourceAcceptanceId = c.taskId && status === 'accepted' ? refs.find(ref => this.c.store.get('acceptance-record', ref).taskId === c.taskId) : c.sourceAcceptanceId;
            const next = this.c.store.update('claim', id, version, { status, ...(status === 'accepted' ? { sourceAcceptanceId, sourceAcceptanceIds: refs, validity: 'current' } : {}) });
            this.c.store.event(c.projectId, 'claim.decided', { claimId: id, status, sourceAcceptanceIds: refs });
            return next;
        });
    }
}
//# sourceMappingURL=service.js.map