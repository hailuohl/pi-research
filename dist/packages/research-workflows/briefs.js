import { randomUUID } from 'node:crypto';
import { ensure, asError } from '../domain/errors.js';
import { integer, object, oneOf, text } from '../contracts/validation.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { scope, userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';
const SAVE_FIELDS = ['question', 'scope', 'constraints', 'successCriteria', 'clarificationQuestions', 'literatureSummary', 'hypotheses', 'evidenceIds', 'steps', 'status', 'expectedRevisionId'];
function exactObject(value, fields, name) {
    const x = object(value);
    ensure(Object.keys(x).length === fields.length && fields.every(k => Object.hasOwn(x, k)), 'INVALID_INPUT', `${name} 字段缺失或包含未知字段`, 400);
    return x;
}
function textList(value, name, maxItems, maxText) {
    ensure(Array.isArray(value) && value.length <= maxItems, 'INVALID_INPUT', `${name} 必须是最多 ${maxItems} 项的数组`, 400);
    return value.map(item => text(item, name, maxText));
}
function parseContent(value) {
    const x = exactObject(value, SAVE_FIELDS, '研究简报');
    const constraints = textList(x.constraints, 'constraints', 16, 1000);
    const successCriteria = textList(x.successCriteria, 'successCriteria', 12, 1000);
    const clarificationQuestions = textList(x.clarificationQuestions, 'clarificationQuestions', 12, 1000);
    const evidenceIds = textList(x.evidenceIds, 'evidenceIds', 60, 100);
    ensure(new Set(evidenceIds).size === evidenceIds.length, 'INVALID_INPUT', 'evidenceIds 不能重复', 400);
    ensure(Array.isArray(x.hypotheses) && x.hypotheses.length <= 12, 'INVALID_INPUT', 'hypotheses 必须是最多 12 项的数组', 400);
    const hypotheses = x.hypotheses.map(value => {
        const h = exactObject(value, ['statement', 'evidenceIds'], 'hypothesis');
        const ids = textList(h.evidenceIds, 'hypothesis.evidenceIds', 30, 100);
        ensure(new Set(ids).size === ids.length && ids.every(id => evidenceIds.includes(id)), 'INVALID_INPUT', '假设只能引用简报的 evidenceIds', 400);
        return { statement: text(h.statement, 'hypothesis.statement', 2000), evidenceIds: ids };
    });
    ensure(Array.isArray(x.steps) && x.steps.length <= 16, 'INVALID_INPUT', 'steps 必须是最多 16 项的数组', 400);
    const steps = x.steps.map(value => {
        const step = exactObject(value, ['title', 'description'], 'step');
        return { title: text(step.title, 'step.title', 200), description: text(step.description, 'step.description', 2000) };
    });
    const status = oneOf(x.status, ['clarifying', 'ready'], 'status');
    if (status === 'ready')
        ensure(successCriteria.length > 0 && steps.length > 0 && clarificationQuestions.length === 0, 'BRIEF_NOT_READY', 'ready 研究计划需要成功标准和步骤，并清空澄清问题', 400);
    const expectedRevisionId = x.expectedRevisionId === null ? null : text(x.expectedRevisionId, 'expectedRevisionId', 100);
    const content = {
        question: text(x.question, 'question', 4000), scope: text(x.scope, 'scope', 4000, true), constraints,
        successCriteria, clarificationQuestions, literatureSummary: text(x.literatureSummary, 'literatureSummary', 8000, true),
        hypotheses, evidenceIds, steps,
    };
    return { content, status, expectedRevisionId };
}
function payload(brief) {
    return {
        rootSessionId: brief.rootSessionId, revision: brief.revision,
        ...(brief.previousRevisionId ? { previousRevisionId: brief.previousRevisionId } : {}),
        question: brief.question, scope: brief.scope, constraints: brief.constraints,
        successCriteria: brief.successCriteria, clarificationQuestions: brief.clarificationQuestions,
        literatureSummary: brief.literatureSummary, hypotheses: brief.hypotheses, evidenceIds: brief.evidenceIds, steps: brief.steps,
    };
}
function isIntact(brief) { return brief.digest === digest(payload(brief)); }
function briefRow(row) {
    return { id: row.id, kind: row.kind, projectId: row.projectId, version: row.version, createdAt: row.createdAt, updatedAt: row.updatedAt,
        ...payload(row), status: row.status, digest: row.digest };
}
export class ResearchBriefService {
    app;
    constructor(app) {
        this.app = app;
    }
    root(actor, projectId, sessionId, writable = false) {
        scope(actor, projectId);
        ensure(actor.type === 'user' || actor.type === 'agent', 'PERMISSION_DENIED', '需要用户或主协调会话身份', 403);
        const root = this.app.store.get('session', text(sessionId, 'sessionId', 100), projectId);
        ensure(root.role === 'coordinator' && !root.taskId && !root.teamId, 'INVALID_ROOT_SESSION', '研究简报只属于项目主协调会话', 403);
        if (actor.type === 'agent') {
            const teamId = actor.teamId;
            ensure(actor.projectId === projectId && actor.sessionId === root.id && actor.role === 'coordinator' &&
                !actor.taskId && !actor.attemptId && !actor.wakeupId && !teamId, 'TASK_SCOPE_DENIED', '只有本主会话的交互式协调者可操作研究简报', 403);
            ensure(root.state === 'running' && root.generation === actor.generation && root.leaseUntil > Date.now(), 'LEASE_EXPIRED', '主会话执行租约已失效', 403);
        }
        else if (writable)
            ensure(root.state !== 'archived', 'SESSION_ARCHIVED', '主会话已归档');
        if (writable)
            assertProjectWritable(this.app.store, projectId);
        return root;
    }
    checkEvidence(actor, projectId, evidenceIds) {
        for (const evidenceId of evidenceIds) {
            this.app.textCorpusGrants.authorizeContent(actor, projectId, 'evidence_read', { evidenceId });
            this.app.evidence.verify(projectId, evidenceId);
        }
    }
    save(actor, projectId, sessionId, input) {
        const { content, status, expectedRevisionId } = parseContent(input);
        return this.app.store.transaction(() => {
            const root = this.root(actor, projectId, sessionId, true), previousId = root.researchBriefId ?? null;
            ensure(previousId === expectedRevisionId, 'VERSION_CONFLICT', '研究简报已变化，请重新读取后再保存');
            const previous = previousId ? this.app.store.get('research-brief', previousId, projectId) : undefined;
            if (previous) {
                ensure(previous.rootSessionId === root.id && isIntact(previous), 'BRIEF_CORRUPTED', '当前研究简报版本损坏，不能继续修订');
            }
            this.checkEvidence(actor, projectId, content.evidenceIds);
            const revision = (previous?.revision ?? 0) + 1;
            const fixed = { rootSessionId: root.id, revision, ...(previous ? { previousRevisionId: previous.id } : {}), ...content };
            const row = this.app.store.create('research-brief', projectId, { ...fixed, status, digest: digest(fixed) }, randomUUID());
            this.app.store.update('session', root.id, root.version, { researchBriefId: row.id });
            this.app.store.event(projectId, 'session.research_brief_saved', { sessionId: root.id, briefId: row.id, revision, status });
            return row;
        });
    }
    inspect(actor, projectId, sessionId, briefId) {
        return this.app.store.readSnapshot(() => {
            const root = this.root(actor, projectId, sessionId), latestId = root.researchBriefId ?? null;
            const history = this.app.store.list('research-brief', projectId)
                .filter(row => row.rootSessionId === root.id)
                .sort((a, b) => b.revision - a.revision)
                .slice(0, 20)
                .map(({ id, revision, status, digest: hash }) => ({ id, revision, status, digest: hash }));
            const selectedId = briefId === undefined ? latestId : text(briefId, 'briefId', 100);
            if (selectedId === null)
                return { brief: null, latestId, history, evidenceChecks: [] };
            const row = this.app.store.get('research-brief', selectedId, projectId);
            ensure(row.rootSessionId === root.id, 'SCOPE_DENIED', '研究简报属于其他主会话', 403);
            const checks = [];
            let invalidEvidence = false;
            for (const evidenceId of row.evidenceIds ?? []) {
                try {
                    this.checkEvidence(actor, projectId, [evidenceId]);
                    checks.push({ evidenceId, current: true });
                }
                catch (error) {
                    invalidEvidence = true;
                    checks.push({ evidenceId, current: false, code: asError(error).code });
                }
            }
            if (!isIntact(row))
                return { brief: null, latestId, history, evidenceChecks: checks, blockedReason: 'BRIEF_CORRUPTED' };
            if (actor.type === 'agent' && invalidEvidence)
                return { brief: null, latestId, history, evidenceChecks: checks, blockedReason: 'EVIDENCE_UNAVAILABLE' };
            return { brief: briefRow(row), latestId, history, evidenceChecks: checks };
        });
    }
    confirm(actor, projectId, sessionId, input) {
        userOnly(actor);
        const x = exactObject(input, ['briefId', 'expectedVersion'], '研究简报确认');
        const briefId = text(x.briefId, 'briefId', 100), expectedVersion = integer(x.expectedVersion, 'expectedVersion', 1, Number.MAX_SAFE_INTEGER);
        return this.app.store.transaction(() => {
            const root = this.root(actor, projectId, sessionId, true);
            ensure(root.researchBriefId === briefId, 'BRIEF_NOT_LATEST', '只能确认当前最新研究简报');
            const row = this.app.store.get('research-brief', briefId, projectId);
            ensure(row.rootSessionId === root.id, 'SCOPE_DENIED', '研究简报属于其他主会话', 403);
            ensure(row.status === 'ready', 'BRIEF_NOT_READY', '只能确认 ready 研究计划');
            ensure(row.version === expectedVersion, 'VERSION_CONFLICT', '研究简报已变化，请刷新后重试');
            ensure(isIntact(row), 'BRIEF_CORRUPTED', '研究简报内容校验失败');
            this.checkEvidence(actor, projectId, row.evidenceIds);
            const next = this.app.store.update('research-brief', row.id, row.version, { status: 'confirmed' });
            this.app.store.event(projectId, 'session.research_brief_confirmed', { sessionId: root.id, briefId: row.id, revision: row.revision, digest: row.digest });
            return next;
        });
    }
}
//# sourceMappingURL=briefs.js.map