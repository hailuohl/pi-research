import { assertDiscoveryArtifact, assertDiscoveryDocument } from '../policy/discovery-grant-validation.js';
import { verifyDocumentLink } from './document-link.js';
import { captureAcceptance, assertAcceptanceCurrent } from './acceptance.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scope, userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { text, integer, strings } from '../contracts/validation.js';
export class EvidenceService {
    c;
    constructor(c) {
        this.c = c;
    }
    /** Host-only staging: immutable CAS bytes, without publishing any database record. */
    prepareArtifact(projectId, title, bytes, mediaType = 'text/plain', origin = 'user', extra = {}) {
        this.c.store.get('project', projectId);
        text(title, 'title', 200);
        ensure(bytes.length <= 32 * 1024 * 1024, 'ARTIFACT_TOO_LARGE', '产物超过 32 MiB', 413);
        const hash = digest(bytes), dir = join(this.c.dataDir, 'artifacts');
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        const physical = join(dir, hash);
        if (!existsSync(physical))
            writeFileSync(physical, bytes, { mode: 0o444, flag: 'wx' });
        else
            ensure(digest(readFileSync(physical)) === hash, 'ARTIFACT_CORRUPTED', '产物库校验失败', 500);
        return { ...extra, title, digest: hash, size: bytes.length, path: this.c.store.paths.reference(physical), mediaType, origin };
    }
    /** Receives only host-prepared descriptors; callers fence authorization inside the publish transaction. */
    publishPrepared(projectId, prepared) { this.c.store.get('project', projectId); return this.c.store.create('artifact', projectId, prepared); }
    put(projectId, title, bytes, mediaType = 'text/plain', origin = 'user', extra = {}) { return this.publishPrepared(projectId, this.prepareArtifact(projectId, title, bytes, mediaType, origin, extra)); }
    read(actor, id) { const a = this.c.store.get('artifact', id); scope(actor, a.projectId); const bytes = readFileSync(this.c.store.paths.physical(a.path)); ensure(digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '产物内容校验失败', 409); return { artifact: a, bytes }; }
    register(actor, projectId, artifactId, start, end, description, type = 'artifact', runId) {
        scope(actor, projectId);
        const a = this.c.store.get('artifact', artifactId, projectId);
        assertDiscoveryArtifact(this.c.store, projectId, a);
        const { bytes } = this.read(actor, a.id);
        ensure(bytes.length <= 2 * 1024 * 1024 && !bytes.includes(0), 'EVIDENCE_TEXT_REQUIRED', '需要可定位的文本产物', 400);
        const content = bytes.toString('utf8');
        integer(start, 'start', 0, content.length);
        integer(end, 'end', start + 1, content.length);
        if (runId)
            this.c.store.get('run', runId, projectId);
        return this.c.store.create('evidence', projectId, { type, artifactId: a.id, digest: a.digest, locator: { start, end }, quote: content.slice(start, end), description: text(description, 'description', 2000), ...(runId ? { runId } : {}) });
    }
    verify(projectId, evidenceId, current = true) { const e = this.c.store.get('evidence', evidenceId, projectId); const { artifact, bytes } = this.read({ type: 'system' }, e.artifactId); ensure(artifact.projectId === projectId && artifact.digest === e.digest && bytes.toString('utf8').slice(e.locator.start, e.locator.end) === e.quote, 'EVIDENCE_INVALID', '证据引用或内容已失效', 409); if (current)
        assertDiscoveryArtifact(this.c.store, projectId, artifact); if (e.document) {
        const link = verifyDocumentLink(this.c, projectId, e.document, e.artifactId);
        if (current)
            assertDiscoveryDocument(this.c.store, projectId, link.document);
    } return e; }
    registerDocument(actor, projectId, input) {
        userOnly(actor);
        scope(actor, projectId);
        assertProjectWritable(this.c.store, projectId);
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