import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { assertExperimentSourceCurrent } from '../policy/lifecycle.js';
import { developmentReviewAcceptanceBasis } from '../development/reviews-types.js';
export function reviewStateDigest(store, projectId, target) {
    return digest(store.list('task', projectId).filter(r => r.teamId === target.teamId && r.reviewOf === target.key)
        .map(r => ({ id: r.id, attemptId: r.attemptId, generation: r.generation, execution: r.execution, acceptance: r.acceptance, result: r.result ?? null })));
}
/** Immutable semantic basis, separate from file integrity and current execution leases.
 * Plain dependencies consume accepted output; a reviewOf edge reads submitted output.
 */
export function taskAcceptanceBasis(store, projectId, taskId) {
    const all = store.list('task', projectId), byId = new Map(all.map(t => [t.id, t]));
    const nodes = new Map(), visiting = new Set();
    const visit = (id) => {
        if (nodes.has(id))
            return;
        ensure(!visiting.has(id), 'ACCEPTANCE_STALE', '验收依据出现循环');
        const t = byId.get(id);
        ensure(t && t.execution === 'output_submitted' && t.acceptance === 'accepted' && t.result?.outcome === 'completed', 'TASK_NOT_ACCEPTED', '结果不是当前已采纳的完整任务成果');
        visiting.add(id);
        const developmentReview = developmentReviewAcceptanceBasis(store, projectId, t);
        const team = store.get('team', t.teamId, projectId);
        let source;
        if (team.sourceRevisionId) {
            const revision = store.get('source-revision', team.sourceRevisionId, projectId);
            ensure(revision.sourceDigest === revision.snapshot.digest && digest(revision.snapshot.files) === revision.sourceDigest, 'SNAPSHOT_CORRUPTED', '验收源码清单校验失败');
            assertExperimentSourceCurrent(store, store.get('experiment', revision.experimentId, projectId));
            source = { snapshotId: revision.id, sourceDigest: revision.sourceDigest, experimentId: revision.experimentId, revision: revision.revision };
        }
        const a = store.get('task-attempt', t.attemptId, projectId);
        const r = store.list('task-result', projectId)
            .find(r => r.taskId === id && r.attemptId === a.id);
        ensure(a.state === 'finished' && r && r.digest === digest(t.result) && a.generation === t.generation, 'ACCEPTANCE_STALE', '当前结果与执行尝试或归档提交不匹配');
        const reviews = all.filter(r => r.teamId === t.teamId && r.reviewOf === t.key);
        const manual = store.list('manual-review', projectId).filter(m => m.taskId === id && m.resultDigest === digest(t.result)).at(-1);
        if (manual) {
            ensure(manual.verdict === 'accepted' && !reviews.some(r => ['superseded', 'running', 'pending'].includes(r.execution)), 'ACCEPTANCE_STALE', '人工裁决的审查依据已失效');
            ensure(manual.reviewStateDigest === reviewStateDigest(store, projectId, t), 'ACCEPTANCE_STALE', '人工裁决需要基于当前审查状态重新确认');
            for (const review of reviews)
                nodes.set(review.id, { id: review.id, generation: review.generation, attemptId: review.attemptId,
                    resultDigest: review.result ? digest(review.result) : null, execution: review.execution, acceptance: review.acceptance, manualOverride: manual.id });
        }
        else {
            ensure(!t.critical || reviews.length > 0, 'ACCEPTANCE_STALE', '关键任务缺少审查依据');
            for (const review of reviews) {
                ensure(review.result?.verdict === 'accept' && review.sessionId !== t.sessionId, 'ACCEPTANCE_STALE', '审查未通过或不独立');
                visit(review.id);
            }
        }
        for (const key of t.dependencies) {
            const dependency = all.find(d => d.teamId === t.teamId && d.key === key);
            ensure(dependency, 'ACCEPTANCE_STALE', '任务依赖已丢失');
            visit(dependency.id);
        }
        for (const acceptanceId of developmentReview?.inputAcceptanceIds ?? [])
            visit(store.get('acceptance-record', acceptanceId, projectId).taskId);
        for (const eid of [...(t.inputEvidenceIds ?? []), ...t.result.evidenceIds]) {
            const e = store.get('evidence', eid, projectId), artifact = store.get('artifact', e.artifactId, projectId);
            if (artifact.taskId && artifact.taskId !== id) {
                const producer = byId.get(artifact.taskId);
                // Reviewer legitimately reads its target before acceptance. Its result binding is
                // recorded below; do not create an artificial accepted->accepted cycle here.
                if (!(producer?.teamId === t.teamId && producer.key === t.reviewOf))
                    visit(artifact.taskId);
            }
        }
        const reviewTarget = t.reviewOf ? all.find(d => d.teamId === t.teamId && d.key === t.reviewOf) : undefined;
        nodes.set(id, { ...(developmentReview ? { developmentReview } : {}), ...(source ? { source } : {}), id, attemptId: a.id, resultId: r.id, resultDigest: r.digest, inputDigest: a.inputDigest,
            generation: t.generation, planVersion: t.planVersion, directiveVersion: t.directiveVersion,
            dependencies: t.dependencies, reviewOf: t.reviewOf ?? null, reviewTargetDigest: reviewTarget?.result ? digest(reviewTarget.result) : null,
            reviews: reviews.map(r => r.id), manualReviewId: manual?.id ?? null,
            evidence: t.result.evidenceIds.map(eid => { const e = store.get('evidence', eid, projectId); return { id: e.id, digest: e.digest, locator: e.locator }; }) });
        visiting.delete(id);
    };
    visit(taskId);
    const taskIds = [...nodes.keys()].sort(), basis = taskIds.map(id => nodes.get(id));
    return { taskId, taskIds, basis, basisDigest: digest(basis) };
}
export function captureAcceptance(store, projectId, taskId) {
    const value = taskAcceptanceBasis(store, projectId, taskId), id = digest({ projectId, ...value });
    const old = store.maybe('acceptance-record', id);
    if (old) {
        ensure(old.validity === 'current', 'ACCEPTANCE_STALE', '旧采纳记录已撤销，不能自动重新生效');
        return old;
    }
    return store.create('acceptance-record', projectId, { ...value, validity: 'current' }, id);
}
export function assertAcceptanceCurrent(store, projectId, id) {
    const record = store.get('acceptance-record', id, projectId);
    ensure(record.validity === 'current', 'ACCEPTANCE_STALE', '采纳记录已失效');
    ensure(taskAcceptanceBasis(store, projectId, record.taskId).basisDigest === record.basisDigest, 'ACCEPTANCE_STALE', '结果的输入或审查依据已变化');
    return record;
}
//# sourceMappingURL=acceptance.js.map