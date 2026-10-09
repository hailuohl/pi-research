import { randomUUID } from 'node:crypto';
import type { Actor, ResearchBriefRef, Row, Session } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import { ensure, asError } from '../domain/errors.js';
import { integer, object, oneOf, text } from '../contracts/validation.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { scope, userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';

export interface ResearchBrief {
    rootSessionId: string;
    revision: number;
    previousRevisionId?: string;
    question: string;
    scope: string;
    constraints: string[];
    successCriteria: string[];
    clarificationQuestions: string[];
    literatureSummary: string;
    hypotheses: Array<{statement: string; evidenceIds: string[]}>;
    evidenceIds: string[];
    steps: Array<{title: string; description: string}>;
    status: 'clarifying' | 'ready' | 'confirmed';
    digest: string;
}

export interface ResearchBriefInspection {
    brief: Row<ResearchBrief> | null;
    latestId: string | null;
    history: Array<{id: string; revision: number; status: ResearchBrief['status']; digest: string}>;
    evidenceChecks: Array<{evidenceId: string; current: boolean; code?: string}>;
    blockedReason?: string;
}

type BriefContent = Omit<ResearchBrief, 'rootSessionId' | 'revision' | 'previousRevisionId' | 'status' | 'digest'>;
const SAVE_FIELDS = ['question','scope','constraints','successCriteria','clarificationQuestions','literatureSummary','hypotheses','evidenceIds','steps','status','expectedRevisionId'] as const;

function exactObject(value: unknown, fields: readonly string[], name: string) {
    const x = object(value);
    ensure(Object.keys(x).length === fields.length && fields.every(k => Object.hasOwn(x, k)), 'INVALID_INPUT', `${name} 字段缺失或包含未知字段`, 400);
    return x;
}

function textList(value: unknown, name: string, maxItems: number, maxText: number): string[] {
    ensure(Array.isArray(value) && value.length <= maxItems, 'INVALID_INPUT', `${name} 必须是最多 ${maxItems} 项的数组`, 400);
    return value.map(item => text(item, name, maxText));
}

function parseContent(value: unknown) {
    const x = exactObject(value, SAVE_FIELDS, '研究简报');
    const constraints = textList(x.constraints, 'constraints', 16, 1000);
    const successCriteria = textList(x.successCriteria, 'successCriteria', 12, 1000);
    const clarificationQuestions = textList(x.clarificationQuestions, 'clarificationQuestions', 12, 1000);
    const evidenceIds = textList(x.evidenceIds, 'evidenceIds', 60, 100);
    ensure(new Set(evidenceIds).size === evidenceIds.length, 'INVALID_INPUT', 'evidenceIds 不能重复', 400);
    ensure(Array.isArray(x.hypotheses) && x.hypotheses.length <= 12, 'INVALID_INPUT', 'hypotheses 必须是最多 12 项的数组', 400);
    const hypotheses = x.hypotheses.map(value => {
        const h = exactObject(value, ['statement','evidenceIds'], 'hypothesis');
        const ids = textList(h.evidenceIds, 'hypothesis.evidenceIds', 30, 100);
        ensure(new Set(ids).size === ids.length && ids.every(id => evidenceIds.includes(id)), 'INVALID_INPUT', '假设只能引用简报的 evidenceIds', 400);
        return { statement: text(h.statement, 'hypothesis.statement', 2000), evidenceIds: ids };
    });
    ensure(Array.isArray(x.steps) && x.steps.length <= 16, 'INVALID_INPUT', 'steps 必须是最多 16 项的数组', 400);
    const steps = x.steps.map(value => {
        const step = exactObject(value, ['title','description'], 'step');
        return { title: text(step.title, 'step.title', 200), description: text(step.description, 'step.description', 2000) };
    });
    const status = oneOf(x.status, ['clarifying','ready'] as const, 'status');
    if (status === 'ready') ensure(successCriteria.length > 0 && steps.length > 0 && clarificationQuestions.length === 0,
        'BRIEF_NOT_READY', 'ready 研究计划需要成功标准和步骤，并清空澄清问题', 400);
    const expectedRevisionId = x.expectedRevisionId === null ? null : text(x.expectedRevisionId, 'expectedRevisionId', 100);
    const content: BriefContent = {
        question: text(x.question, 'question', 4000), scope: text(x.scope, 'scope', 4000, true), constraints,
        successCriteria, clarificationQuestions, literatureSummary: text(x.literatureSummary, 'literatureSummary', 8000, true),
        hypotheses, evidenceIds, steps,
    };
    return { content, status, expectedRevisionId };
}

function payload(brief: ResearchBrief) {
    return {
        rootSessionId: brief.rootSessionId, revision: brief.revision,
        ...(brief.previousRevisionId ? { previousRevisionId: brief.previousRevisionId } : {}),
        question: brief.question, scope: brief.scope, constraints: brief.constraints,
        successCriteria: brief.successCriteria, clarificationQuestions: brief.clarificationQuestions,
        literatureSummary: brief.literatureSummary, hypotheses: brief.hypotheses, evidenceIds: brief.evidenceIds, steps: brief.steps,
    };
}

function isIntact(brief: ResearchBrief) { return brief.digest === digest(payload(brief)); }

function briefRow(row: Row<ResearchBrief>): Row<ResearchBrief> {
    return { id: row.id, kind: row.kind, projectId: row.projectId, version: row.version, createdAt: row.createdAt, updatedAt: row.updatedAt,
        ...payload(row), status: row.status, digest: row.digest };
}

export class ResearchBriefService {
    constructor(private app: ResearchApp) {}

    private root(actor: Actor, projectId: string, sessionId: string, writable = false): Row<Session> {
        scope(actor, projectId);
        ensure(actor.type === 'user' || actor.type === 'agent', 'PERMISSION_DENIED', '需要用户或主协调会话身份', 403);
        const root = this.app.store.get<Session>('session', text(sessionId, 'sessionId', 100), projectId);
        ensure(root.role === 'coordinator' && !root.taskId && !root.teamId,
            'INVALID_ROOT_SESSION', '研究简报只属于项目主协调会话', 403);
        if (actor.type === 'agent') {
            if(actor.continuationId)this.app.researchAutomation.assertActor(actor);
            const teamId = (actor as Actor & {teamId?: string}).teamId;
            ensure(actor.projectId === projectId && actor.sessionId === root.id && actor.role === 'coordinator' &&
                !actor.taskId && !actor.attemptId && (!actor.wakeupId || !!actor.continuationId) && !teamId, 'TASK_SCOPE_DENIED', '只有本主会话的交互式协调者可操作研究简报', 403);
            ensure(root.state === 'running' && root.generation === actor.generation && root.leaseUntil > Date.now(),
                'LEASE_EXPIRED', '主会话执行租约已失效', 403);
        } else if (writable) ensure(root.state !== 'archived', 'SESSION_ARCHIVED', '主会话已归档');
        if (writable) assertProjectWritable(this.app.store, projectId);
        return root;
    }

    private checkEvidence(actor: Actor, projectId: string, evidenceIds: string[]) {
        for (const evidenceId of evidenceIds) {
            this.app.textCorpusGrants.authorizeContent(actor, projectId, 'evidence_read', { evidenceId });
            this.app.evidence.verify(projectId, evidenceId);
        }
    }

    capture(actor: Actor, projectId: string, rootSessionId: string): ResearchBriefRef | undefined {
        const root = this.root(actor, projectId, rootSessionId, true), id = root.researchBriefId;
        if (id === undefined) return undefined;
        const row = this.app.store.get<ResearchBrief>('research-brief', id, projectId);
        ensure(row.rootSessionId === root.id, 'BRIEF_CORRUPTED', '最新研究简报不属于当前主会话');
        ensure(row.status === 'confirmed', 'BRIEF_NOT_CONFIRMED', '当前最新研究计划尚未确认');
        ensure(isIntact(row), 'BRIEF_CORRUPTED', '研究简报内容校验失败');
        this.checkEvidence(actor, projectId, row.evidenceIds);
        return { id: row.id, digest: row.digest, revision: row.revision, rootSessionId: row.rootSessionId };
    }

    assertReference(actor: Actor, projectId: string, rootSessionId: string, ref: ResearchBriefRef): void {
        const root = this.root(actor, projectId, rootSessionId);
        ensure(ref.rootSessionId === root.id, 'BRIEF_REFERENCE_MISMATCH', '研究简报引用不属于当前主会话');
        const row = this.app.store.get<ResearchBrief>('research-brief', ref.id, projectId);
        ensure(row.rootSessionId === root.id && row.id === ref.id && row.digest === ref.digest && row.revision === ref.revision,
            'BRIEF_REFERENCE_MISMATCH', '固定研究简报引用与原记录不一致');
        ensure(row.status === 'confirmed', 'BRIEF_NOT_CONFIRMED', '固定研究计划尚未确认');
        ensure(isIntact(row), 'BRIEF_CORRUPTED', '研究简报内容校验失败');
        this.checkEvidence(actor, projectId, row.evidenceIds);
    }

    /** Host-only: validate admission evidence without granting access to brief contents. */
    assertAdmission(projectId: string, ref: ResearchBriefRef): void {
        const root = this.app.store.get<Session>('session', ref.rootSessionId, projectId);
        ensure(root.role === 'coordinator' && !root.taskId && !root.teamId, 'INVALID_ROOT_SESSION', '研究简报只属于项目主协调会话');
        const row = this.app.store.get<ResearchBrief>('research-brief', ref.id, projectId);
        ensure(row.rootSessionId === ref.rootSessionId && row.id === ref.id && row.digest === ref.digest && row.revision === ref.revision,
            'BRIEF_REFERENCE_MISMATCH', '固定研究简报引用与原记录不一致');
        ensure(row.status === 'confirmed', 'BRIEF_NOT_CONFIRMED', '固定研究计划尚未确认');
        ensure(isIntact(row), 'BRIEF_CORRUPTED', '研究简报内容校验失败');
        for (const evidenceId of row.evidenceIds) this.app.evidence.verify(projectId, evidenceId, true);
    }

    save(actor: Actor, projectId: string, sessionId: string, input: unknown): Row<ResearchBrief> {
        const { content, status, expectedRevisionId } = parseContent(input);
        return this.app.store.transaction(() => {
            const root = this.root(actor, projectId, sessionId, true), previousId = root.researchBriefId ?? null;
            ensure(previousId === expectedRevisionId, 'VERSION_CONFLICT', '研究简报已变化，请重新读取后再保存');
            const previous = previousId ? this.app.store.get<ResearchBrief>('research-brief', previousId, projectId) : undefined;
            if (previous) {
                ensure(previous.rootSessionId === root.id && isIntact(previous), 'BRIEF_CORRUPTED', '当前研究简报版本损坏，不能继续修订');
            }
            this.checkEvidence(actor, projectId, content.evidenceIds);
            const revision = (previous?.revision ?? 0) + 1;
            const fixed = { rootSessionId: root.id, revision, ...(previous ? { previousRevisionId: previous.id } : {}), ...content };
            const row = this.app.store.create<ResearchBrief>('research-brief', projectId, { ...fixed, status, digest: digest(fixed) }, randomUUID());
            this.app.store.update<Session>('session', root.id, root.version, { researchBriefId: row.id });
            this.app.store.event(projectId, 'session.research_brief_saved', { sessionId: root.id, briefId: row.id, revision, status });
            return row;
        });
    }

    inspect(actor: Actor, projectId: string, sessionId: string, briefId?: string): ResearchBriefInspection {
        return this.app.store.readSnapshot(() => {
            const root = this.root(actor, projectId, sessionId), latestId = root.researchBriefId ?? null;
            const history = this.app.store.list<ResearchBrief>('research-brief', projectId)
                .filter(row => row.rootSessionId === root.id)
                .sort((a, b) => b.revision - a.revision)
                .slice(0, 20)
                .map(({ id, revision, status, digest: hash }) => ({ id, revision, status, digest: hash }));
            const selectedId = briefId === undefined ? latestId : text(briefId, 'briefId', 100);
            if (selectedId === null) return { brief: null, latestId, history, evidenceChecks: [] };
            const row = this.app.store.get<ResearchBrief>('research-brief', selectedId, projectId);
            ensure(row.rootSessionId === root.id, 'SCOPE_DENIED', '研究简报属于其他主会话', 403);
            const checks: Array<{evidenceId: string; current: boolean; code?: string}> = [];
            let invalidEvidence = false;
            for (const evidenceId of row.evidenceIds ?? []) {
                try {
                    this.checkEvidence(actor, projectId, [evidenceId]);
                    checks.push({ evidenceId, current: true });
                } catch (error) {
                    invalidEvidence = true;
                    checks.push({ evidenceId, current: false, code: asError(error).code });
                }
            }
            if (!isIntact(row)) return { brief: null, latestId, history, evidenceChecks: checks, blockedReason: 'BRIEF_CORRUPTED' };
            if (actor.type === 'agent' && invalidEvidence)
                return { brief: null, latestId, history, evidenceChecks: checks, blockedReason: 'EVIDENCE_UNAVAILABLE' };
            return { brief: briefRow(row), latestId, history, evidenceChecks: checks };
        });
    }

    confirm(actor: Actor, projectId: string, sessionId: string, input: unknown): Row<ResearchBrief> {
        userOnly(actor);
        const x = exactObject(input, ['briefId','expectedVersion'], '研究简报确认');
        const briefId = text(x.briefId, 'briefId', 100), expectedVersion = integer(x.expectedVersion, 'expectedVersion', 1, Number.MAX_SAFE_INTEGER);
        return this.app.store.transaction(() => {
            const root = this.root(actor, projectId, sessionId, true);
            ensure(root.researchBriefId === briefId, 'BRIEF_NOT_LATEST', '只能确认当前最新研究简报');
            const row = this.app.store.get<ResearchBrief>('research-brief', briefId, projectId);
            ensure(row.rootSessionId === root.id, 'SCOPE_DENIED', '研究简报属于其他主会话', 403);
            ensure(row.status === 'ready', 'BRIEF_NOT_READY', '只能确认 ready 研究计划');
            ensure(row.version === expectedVersion, 'VERSION_CONFLICT', '研究简报已变化，请刷新后重试');
            ensure(isIntact(row), 'BRIEF_CORRUPTED', '研究简报内容校验失败');
            this.checkEvidence(actor, projectId, row.evidenceIds);
            const next = this.app.store.update<ResearchBrief>('research-brief', row.id, row.version, { status: 'confirmed' });
            this.app.store.event(projectId, 'session.research_brief_confirmed', { sessionId: root.id, briefId: row.id, revision: row.revision, digest: row.digest });
            return next;
        });
    }
}
