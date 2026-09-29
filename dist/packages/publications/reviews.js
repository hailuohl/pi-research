import { assertRunGrantRun } from '../policy/run-grant-validation.js';
import { basename, dirname } from 'node:path';
import { readStableFile } from '../workspace/stable-file.js';
import { scope, userOnly } from '../policy/permissions.js';
import { assertProjectWritable, assertExperimentSourceCurrent } from '../policy/lifecycle.js';
import { verifyRunRecord } from '../evidence/run-verifier.js';
import { verifyDocumentLink } from '../evidence/document-link.js';
import { verifySnapshot } from '../workspace/files.js';
import { captureAcceptance, assertAcceptanceCurrent } from '../evidence/acceptance.js';
import { ensure, asError } from '../domain/errors.js';
import { object, text, strings } from '../contracts/validation.js';
import { digest } from '../storage/store.js';
const USER = { type: 'user' };
const clean = (value) => JSON.parse(JSON.stringify(value));
const binding = (r) => clean({ publicationResultId: r.publicationResultId, publicationResultDigest: r.publicationResultDigest, revisionId: r.revisionId, revisionDigest: r.revisionDigest, jobId: r.jobId, manifestDigest: r.manifestDigest, buildApprovalId: r.buildApprovalId, sourceDigest: r.sourceDigest, pdfDigest: r.pdfDigest, rootSessionId: r.rootSessionId, producerSessionIds: r.producerSessionIds, teamId: r.teamId, taskId: r.taskId, approvalId: r.approvalId, planDigest: r.planDigest, taskSpecDigest: r.taskSpecDigest, requiredEvidenceIds: r.requiredEvidenceIds, artifactIds: r.artifactIds, artifacts: r.artifacts, evidence: r.evidence, inputAcceptanceIds: r.inputAcceptanceIds, digest: r.digest });
const specDigest = (t) => digest(clean({ key: t.key, role: t.role, objective: t.objective, dependencies: t.dependencies, critical: t.critical, reviewOf: t.reviewOf, required: t.required, inputEvidenceIds: t.inputEvidenceIds, expectedOutputs: t.expectedOutputs, acceptanceRuleIds: t.acceptanceRuleIds, skillIds: t.skillIds }));
const approval = (a) => ({ id: a.id, subjectKind: a.subjectKind, subjectId: a.subjectId, digest: a.digest, scope: a.scope, status: a.status });
export class PublicationReviewService {
    app;
    constructor(app) {
        this.app = app;
    }
    artifact(pid, id) {
        const a = this.app.store.get('artifact', id, pid), bytes = readStableFile(dirname(this.app.store.paths.physical(a.path)), basename(this.app.store.paths.physical(a.path)), 32 * 1024 * 1024);
        ensure(bytes.length === a.size && digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '审查原始产物已改变');
        return clean({ id: a.id, digest: a.digest, size: a.size, title: a.title, mediaType: a.mediaType, taskId: a.taskId, runId: a.runId });
    }
    evidence(pid, id) {
        const e = this.app.evidence.verify(pid, id), a = this.app.store.get('artifact', e.artifactId, pid), sourceBindings = [];
        if (e.document) {
            const { job } = verifyDocumentLink(this.app.context, pid, e.document, e.artifactId);
            const grant = this.app.store.get('approval', job.approvalId, pid);
            ensure(grant.subjectKind === 'document-parse-job', 'APPROVAL_STALE', '审查文档解析审批类型改变');
            this.app.approvals.assert(job.approvalId, pid, job.id, job.manifestDigest, 'document.parse');
            sourceBindings.push({ kind: 'document-parse', id: job.id, approvalId: job.approvalId, manifestDigest: job.manifestDigest });
        }
        for (const runId of new Set([e.runId, a.runId].filter((id) => !!id))) {
            const run = this.app.store.get('run', runId, pid), intent = this.app.store.get('run-intent', run.intentId, pid);
            assertRunGrantRun(this.app.store, run);
            ensure(run.artifactIds.includes(a.id) && intent.runId === run.id && intent.status === 'submitted' && intent.manifestDigest === run.manifestDigest && digest(intent.manifest) === run.manifestDigest, 'PUBLICATION_REVIEW_STALE', '审查输入运行来源改变');
            verifyRunRecord(run, this.app.evidence);
            this.app.approvals.assert(intent.approvalId, pid, intent.id, run.manifestDigest, 'run.submit');
            assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', run.experimentId, pid));
            verifySnapshot(this.app.store.paths.physical(run.manifest.snapshotPath), run.manifest.sourceFiles);
            sourceBindings.push({ kind: 'run', id: intent.id, approvalId: intent.approvalId, manifestDigest: run.manifestDigest, sourceDigest: run.manifest.snapshotDigest });
        }
        return clean({ id: e.id, type: e.type, artifactId: e.artifactId, digest: e.digest, locator: e.locator, quote: e.quote, description: e.description, runId: e.runId, document: e.document, sourceBindings });
    }
    target(pid, id) {
        const result = this.app.publicationBuilds.result(USER, pid, id), job = this.app.publicationBuilds.get(USER, pid, result.jobId);
        ensure(result.status === 'succeeded' && result.pdf && job.state === 'succeeded' && job.integrity === 'complete' && job.exitCode === 0, 'PUBLICATION_REVIEW_TARGET_INVALID', '审查需要完整成功的固定文稿构建');
        const revision = this.app.publicationBuilds.assertCurrent(job, true);
        return { result: this.app.store.get('publication-build-result', id, pid), revision, job };
    }
    prepare(actor, pid, value) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(value);
        ensure(Object.keys(x).every(k => ['resultId', 'rootSessionId', 'inputEvidenceIds'].includes(k)), 'INVALID_INPUT', '审查准备只接受固定结果、主会话和证据', 400);
        const resultId = text(x.resultId, 'resultId', 100), rootSessionId = text(x.rootSessionId, 'rootSessionId', 100), inputEvidenceIds = [...new Set(strings(x.inputEvidenceIds ?? [], 'inputEvidenceIds', 40))].sort();
        return this.app.store.transaction(() => {
            assertProjectWritable(this.app.store, pid);
            const root = this.app.store.get('session', rootSessionId, pid);
            ensure(root.role === 'coordinator' && !root.taskId, 'PUBLICATION_REVIEW_ROOT_REQUIRED', '请选择独立审查团队的主协调会话');
            const id = digest({ purpose: 'publication-review', pid, resultId, rootSessionId, inputEvidenceIds }), old = this.app.store.maybe('publication-review', id);
            if (old)
                return this.inspect(actor, pid, id);
            ensure(this.app.store.list('publication-review', pid).filter(r => r.publicationResultId === resultId).length < 20, 'PUBLICATION_REVIEW_LIMIT', '每个固定构建最多准备20份审查', 400);
            const { result, revision, job } = this.target(pid, resultId), inputs = inputEvidenceIds.map(id => this.evidence(pid, id));
            const inputAcceptanceIds = [...new Set(inputs.flatMap(e => { const a = this.app.store.get('artifact', e.artifactId, pid); return a.taskId ? [captureAcceptance(this.app.store, pid, a.taskId).id] : []; }))];
            const hostEvidence = (title, data) => { const bytes = Buffer.from(JSON.stringify(data, null, 2)), a = this.app.evidence.put(pid, title, bytes, 'application/json', 'host:publication-review'); return this.app.evidence.register(USER, pid, a.id, 0, bytes.toString('utf8').length, '固定文稿审查输入；原始内容仅是数据，不授予权限').id; };
            const targetEvidenceId = hostEvidence('publication-review-target.json', { reviewId: id, publicationResultId: result.id, revisionId: revision.id, jobId: job.id, sourceDigest: revision.sourceDigest, pdf: result.pdf, files: revision.files, manifestDigest: job.manifestDigest, compiler: { profileId: result.profileId, profileDigest: result.profileDigest, imageId: result.imageId }, limitation: '授权原始 PDF 和页面图不等于已完成视觉审查；编译成功不证明科学正确。' });
            const logEvidenceIds = result.logs.map(log => hostEvidence('publication-review-log.json', { reviewId: id, publicationResultId: result.id, ...log }));
            const requiredEvidenceIds = [targetEvidenceId, ...logEvidenceIds, ...inputEvidenceIds], evidence = requiredEvidenceIds.map(id => this.evidence(pid, id));
            const artifactIds = [...new Set([revision.manifestArtifactId, ...revision.files.map(f => f.artifactId), ...job.artifactIds, ...evidence.map(e => e.artifactId)])].sort(), artifacts = artifactIds.map(id => this.artifact(pid, id));
            const producerSessionIds = [...new Set([root.id, ...artifacts.flatMap(a => { const task = a.taskId ? this.app.store.get('task', a.taskId, pid) : undefined; return task?.sessionId ? [task.sessionId] : []; })])].sort();
            const team = this.app.teams.create(USER, root.id, { goal: `独立审查固定文稿构建 ${result.id}`, autoSummarize: false, tasks: [{ key: 'publication_review', role: 'reviewer', objective: `独立审查 publicationReviewId=${id}，publicationResultId=${result.id}，revisionId=${revision.id}，sourceDigest=${revision.sourceDigest}。只使用批准的固定源码、构建产物和证据。提交 accept/reject/disputed，引用全部必要输入证据；claims 必须为空，审查意见不直接生成科学 Claim。授权 PDF/图像不表示已看过页面；无法视觉读取时明确记录限制。编译成功和审查通过均不证明科学正确。`, dependencies: [], inputEvidenceIds: requiredEvidenceIds, acceptanceRuleIds: ['evidence-required'] }] }, false);
            const task = this.app.teams.tasks(USER, team.id)[0];
            this.app.store.update('task', task.id, task.version, { publicationReviewId: id });
            const payload = { publicationResultId: result.id, publicationResultDigest: digest(result), revisionId: revision.id, revisionDigest: digest(revision), jobId: job.id, manifestDigest: job.manifestDigest, buildApprovalId: job.approvalId, sourceDigest: revision.sourceDigest, pdfDigest: result.pdf.digest, rootSessionId: root.id, producerSessionIds, teamId: team.id, taskId: task.id, approvalId: team.approvalId, planDigest: team.planDigest, taskSpecDigest: specDigest(task), requiredEvidenceIds, artifactIds, artifacts, evidence, inputAcceptanceIds };
            this.app.store.create('publication-review', pid, { ...payload, digest: digest(payload) }, id);
            this.app.store.event(pid, 'publication.review_prepared', { reviewId: id, publicationResultId: result.id, teamId: team.id, taskId: task.id });
            return this.inspect(actor, pid, id);
        });
    }
    current(pid, r, requireApproval = false) {
        const { digest: expected, ...payload } = binding(r);
        ensure(digest(payload) === expected, 'PUBLICATION_REVIEW_CORRUPTED', '审查固定绑定已改变');
        const { result, revision, job } = this.target(pid, r.publicationResultId);
        ensure(digest(result) === r.publicationResultDigest && digest(revision) === r.revisionDigest && revision.id === r.revisionId && job.id === r.jobId && job.manifestDigest === r.manifestDigest && job.approvalId === r.buildApprovalId && result.pdf.digest === r.pdfDigest, 'PUBLICATION_REVIEW_STALE', '审查不再对应固定构建');
        for (const a of r.artifacts)
            ensure(digest(this.artifact(pid, a.id)) === digest(a), 'ARTIFACT_CORRUPTED', '审查固定产物描述已改变');
        for (const e of r.evidence)
            ensure(digest(this.evidence(pid, e.id)) === digest(e), 'EVIDENCE_INVALID', '审查固定证据已改变');
        r.inputAcceptanceIds.forEach(id => assertAcceptanceCurrent(this.app.store, pid, id));
        const task = this.app.store.get('task', r.taskId, pid), team = this.app.store.get('team', r.teamId, pid), root = this.app.store.get('session', r.rootSessionId, pid), grant = this.app.store.get('approval', r.approvalId, pid);
        ensure(root.role === 'coordinator' && !root.taskId && task.publicationReviewId === r.id && !task.reviewId && task.role === 'reviewer' && task.teamId === team.id && team.rootSessionId === r.rootSessionId && team.approvalId === r.approvalId && team.planDigest === r.planDigest && specDigest(task) === r.taskSpecDigest && digest(task.inputEvidenceIds ?? []) === digest(r.requiredEvidenceIds) && task.execution !== 'superseded', 'PUBLICATION_REVIEW_STALE', '审查任务或团队绑定已改变');
        ensure(grant.scope === 'collaboration' && grant.subjectKind === 'team' && grant.subjectId === team.id && grant.digest === r.planDigest && grant.status !== 'stale', 'APPROVAL_STALE', '独立审查审批已改变');
        if (requireApproval || task.attemptId)
            this.app.approvals.assert(grant.id, pid, team.id, r.planDigest, 'collaboration');
        if (task.sessionId) {
            const reviewer = this.app.store.get('session', task.sessionId, pid);
            ensure(!r.producerSessionIds.includes(reviewer.id) && reviewer.role === 'reviewer' && reviewer.taskId === task.id && reviewer.teamId === team.id, 'REVIEW_NOT_INDEPENDENT', '审查必须由独立 Reviewer 会话完成');
        }
        let attempt, taskResult;
        if (task.attemptId) {
            attempt = this.app.store.get('task-attempt', task.attemptId, pid);
            const contexts = this.app.store.list('context-snapshot', pid).filter(c => c.taskId === task.id && c.attemptId === attempt.id), context = contexts[0];
            ensure(attempt.taskId === task.id && attempt.teamId === team.id && attempt.sessionId === task.sessionId && (task.execution === 'running' || task.execution === 'output_submitted' ? attempt.generation === task.generation : attempt.generation <= task.generation) && contexts.length === 1 && context.inputDigest === attempt.inputDigest && digest(context.content) === attempt.inputDigest && context.content.publicationReview?.reviewId === r.id && context.content.publicationReview.digest === r.digest && digest(context.content.inputEvidenceIds) === digest(r.requiredEvidenceIds), 'PUBLICATION_REVIEW_STALE', '审查执行输入或尝试绑定已改变');
            const records = this.app.store.list('task-result', pid).filter(x => x.taskId === task.id && x.attemptId === attempt.id);
            if (task.result) {
                const archived = records[0];
                ensure(records.length === 1 && archived && attempt.state === 'finished' && archived.digest === digest(archived.result) && archived.digest === digest(task.result) && archived.inputDigest === attempt.inputDigest && archived.planVersion === task.planVersion && archived.directiveVersion === task.directiveVersion, 'PUBLICATION_REVIEW_STALE', '审查提交与归档结果不符');
                ensure(task.result.claims.length === 0 && task.result.verdict && (task.result.outcome !== 'completed' || r.requiredEvidenceIds.every(id => task.result.evidenceIds.includes(id))), 'PUBLICATION_REVIEW_STALE', '审查意见或必要证据缺失');
                if (task.result.outcome === 'completed')
                    ensure(['output_submitted', 'cancelled'].includes(task.execution) && task.acceptance === (task.result.verdict === 'accept' ? 'accepted' : task.result.verdict === 'reject' ? 'rejected' : 'disputed'), 'PUBLICATION_REVIEW_STALE', '审查意见与验收状态不符');
                ensure(task.result.artifactIds.every(id => r.artifactIds.includes(id)) && task.result.evidenceIds.every(id => r.requiredEvidenceIds.includes(id)), 'PUBLICATION_REVIEW_STALE', '审查引用必须属于固定只读输入');
                taskResult = clean({ id: archived.id, taskId: archived.taskId, attemptId: archived.attemptId, planVersion: archived.planVersion, directiveVersion: archived.directiveVersion, inputDigest: archived.inputDigest, digest: archived.digest, result: archived.result });
            }
            else if (task.execution === 'pending')
                ensure(attempt.state !== 'running' && records.every(record => record.digest === digest(record.result)), 'PUBLICATION_REVIEW_STALE', '重试前的历史尝试或归档无效');
            else
                ensure(records.length === 0, 'PUBLICATION_REVIEW_STALE', '审查任务丢失归档结果');
        }
        else
            ensure(!task.result && !task.sessionId, 'PUBLICATION_REVIEW_STALE', '审查结果缺少执行尝试');
        return { task, team, grant, attempt, taskResult };
    }
    assertTaskCurrent(task) { if (!task.publicationReviewId)
        return; const r = this.app.store.get('publication-review', task.publicationReviewId, task.projectId); ensure(r.taskId === task.id, 'PUBLICATION_REVIEW_STALE', '审查不属于此任务'); this.current(task.projectId, r, true); }
    inspect(actor, pid, id) {
        userOnly(actor);
        scope(actor, pid);
        const r = this.app.store.get('publication-review', id, pid), task = this.app.store.get('task', r.taskId, pid), grant = this.app.store.get('approval', r.approvalId, pid);
        const status = grant.status === 'pending' ? 'awaiting_approval' : grant.status === 'rejected' ? 'rejected' : task.execution === 'running' ? 'running' : ['failed', 'cancelled', 'blocked', 'superseded', 'waiting_user'].includes(task.execution) ? 'failed' : task.result?.verdict === 'reject' ? 'rejected' : task.result?.verdict === 'disputed' ? 'disputed' : task.result?.verdict === 'accept' && task.acceptance === 'accepted' && task.result.outcome === 'completed' ? 'passed' : 'pending';
        const inspection = clean({ id: r.id, publicationResultId: r.publicationResultId, revisionId: r.revisionId, jobId: r.jobId, sourceDigest: r.sourceDigest, pdfDigest: r.pdfDigest, rootSessionId: r.rootSessionId, teamId: r.teamId, taskId: r.taskId, approvalId: r.approvalId, digest: r.digest, status, validity: 'current', requiredEvidenceIds: r.requiredEvidenceIds, artifactIds: r.artifactIds, reviewerSessionId: task.sessionId, attemptId: task.attemptId, verdict: task.result?.verdict });
        try {
            const { attempt, taskResult } = this.current(pid, r);
            if (attempt)
                inspection.inputDigest = attempt.inputDigest;
            if (taskResult) {
                inspection.taskResultId = taskResult.id;
                inspection.taskResultDigest = taskResult.digest;
                inspection.summary = taskResult.result.summary;
            }
        }
        catch (error) {
            inspection.validity = 'stale';
            inspection.reason = asError(error).code;
        }
        return inspection;
    }
    list(actor, pid, options) { userOnly(actor); scope(actor, pid); const id = text(options.resultId, 'resultId', 100); this.app.store.get('publication-build-result', id, pid); return this.app.store.list('publication-review', pid).filter(r => r.publicationResultId === id).map(r => this.inspect(actor, pid, r.id)); }
    snapshot(actor, pid, id) {
        const review = this.inspect(actor, pid, id);
        ensure(review.validity === 'current', review.reason ?? 'PUBLICATION_REVIEW_STALE', '审查已失效，不能生成当前快照');
        const r = this.app.store.get('publication-review', id, pid), { task, grant, attempt, taskResult } = this.current(pid, r);
        const artifacts = [...r.artifacts], evidence = [...r.evidence];
        for (const eid of task.result?.evidenceIds ?? [])
            if (!evidence.some(e => e.id === eid))
                evidence.push(this.evidence(pid, eid));
        for (const aid of [...(task.result?.artifactIds ?? []), ...evidence.map(e => e.artifactId)])
            if (!artifacts.some(a => a.id === aid))
                artifacts.push(this.artifact(pid, aid));
        return clean({ review, binding: binding(r), approvals: { build: approval(this.app.store.get('approval', r.buildApprovalId, pid)), review: approval(grant) }, task: { id: task.id, execution: task.execution, acceptance: task.acceptance, generation: task.generation, planVersion: task.planVersion, directiveVersion: task.directiveVersion, attemptId: task.attemptId, sessionId: task.sessionId, result: task.result }, ...(attempt ? { attempt: { id: attempt.id, taskId: attempt.taskId, teamId: attempt.teamId, sessionId: attempt.sessionId, generation: attempt.generation, state: attempt.state, inputDigest: attempt.inputDigest } } : {}), ...(taskResult ? { taskResult } : {}), artifacts, evidence });
    }
}
//# sourceMappingURL=reviews.js.map