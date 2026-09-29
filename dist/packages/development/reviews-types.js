import { assertDiscoveryArtifact } from '../policy/discovery-grant-validation.js';
import { assertRunGrantArtifact } from '../policy/run-grant-validation.js';
import { dirname, basename } from 'node:path';
import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { assertExperimentSourceCurrent } from '../policy/lifecycle.js';
import { verifySnapshot } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
import { assertAcceptanceCurrent } from '../evidence/acceptance.js';
import { assertWorkingGrantJob } from '../policy/working-grant-validation.js';
export function reviewPayload(r) { const { jobId, sourceDigest, producerSessionId, baseSourceRevisionId, teamId, taskId, approvalId, manifestEvidenceId, testEvidenceIds, requiredEvidenceIds } = r; return { jobId, sourceDigest, producerSessionId, ...(baseSourceRevisionId ? { baseSourceRevisionId } : {}), teamId, taskId, approvalId, manifestEvidenceId, testEvidenceIds, requiredEvidenceIds }; }
/** Shared by dispatch and acceptance: historical records cannot silently acquire a new test target. */
export function assertDevelopmentReviewTarget(store, pid, r) {
    ensure(digest(reviewPayload(r)) === r.digest, 'DEVELOPMENT_REVIEW_CORRUPTED', '审查绑定摘要已改变');
    const job = store.get('sandbox-job', r.jobId, pid), s = store.get('session', r.producerSessionId, pid);
    assertWorkingGrantJob(store, job, false);
    ensure(s.role === 'coordinator' && !s.taskId && job.sessionId === s.id && job.manifest.sessionId === s.id && !job.manifest.scopeTaskId && s.sourceRevisionId === r.baseSourceRevisionId && job.manifest.sourceRevisionId === r.baseSourceRevisionId, 'DEVELOPMENT_REVIEW_STALE', '审查生产者或源码来源已改变');
    ensure(job.state === 'succeeded' && job.integrity === 'complete' && job.exitCode === 0 && job.sourceDigest === r.sourceDigest && job.manifest.inputSnapshot.digest === r.sourceDigest && digest(job.manifest.inputSnapshot.files) === r.sourceDigest && digest(job.manifest) === job.manifestDigest, 'DEVELOPMENT_REVIEW_STALE', '审查测试不是当前成功且完整的固定源码结果');
    const grant = store.get('approval', job.grantId, pid);
    ensure(grant.status === 'approved' && grant.scope === 'development.test' && grant.subjectKind === 'development-task' && grant.subjectId === job.developmentTaskId && grant.digest === job.manifestDigest, 'APPROVAL_STALE', '开发测试审批已失效');
    if (r.baseSourceRevisionId) {
        const source = store.get('source-revision', r.baseSourceRevisionId, pid);
        ensure(source.sourceDigest === source.snapshot.digest && digest(source.snapshot.files) === source.sourceDigest, 'SNAPSHOT_CORRUPTED', '基础源码摘要已改变');
        assertExperimentSourceCurrent(store, store.get('experiment', source.experimentId, pid));
        verifySnapshot(source.snapshot.path, source.snapshot.files);
    }
    verifySnapshot(job.manifest.inputSnapshot.path, job.manifest.inputSnapshot.files);
    for (const a of job.manifest.dataArtifacts) {
        const actual = store.get('artifact', a.id, pid), bytes = readStableFile(dirname(actual.path), basename(actual.path), 32 * 1024 * 1024);
        assertRunGrantArtifact(store, pid, actual);
        assertDiscoveryArtifact(store, pid, actual);
        ensure(actual.path === a.path && actual.digest === a.digest && actual.size === a.size && bytes.length === a.size && digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '测试输入数据已改变');
        if (a.sourceAcceptanceId)
            assertAcceptanceCurrent(store, pid, a.sourceAcceptanceId);
    }
    for (const id of job.artifactIds) {
        const a = store.get('artifact', id, pid), bytes = readStableFile(dirname(a.path), basename(a.path), 32 * 1024 * 1024);
        ensure(bytes.length === a.size && digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '测试归档已改变');
    }
    for (const id of r.requiredEvidenceIds) {
        const e = store.get('evidence', id, pid), a = store.get('artifact', e.artifactId, pid), bytes = readStableFile(dirname(a.path), basename(a.path), 2 * 1024 * 1024);
        ensure(digest(bytes) === a.digest && a.digest === e.digest && bytes.toString('utf8').slice(e.locator.start, e.locator.end) === e.quote, 'EVIDENCE_INVALID', '审查输入证据已改变');
    }
    const task = store.get('task', r.taskId, pid), team = store.get('team', r.teamId, pid);
    ensure(task.reviewId === r.id && task.role === 'reviewer' && task.teamId === team.id && team.rootSessionId === s.id && team.approvalId === r.approvalId && digest(task.inputEvidenceIds ?? []) === digest(r.requiredEvidenceIds), 'DEVELOPMENT_REVIEW_STALE', '审查任务不再绑定固定目标');
    if (task.sessionId) {
        const reviewer = store.get('session', task.sessionId, pid);
        ensure(reviewer.id !== s.id && reviewer.role === 'reviewer' && reviewer.taskId === task.id, 'REVIEW_NOT_INDEPENDENT', '审查必须由独立 Reviewer 会话完成');
    }
    return { job, task, team };
}
export function developmentReviewAcceptanceBasis(store, pid, task) {
    if (!task.reviewId)
        return undefined;
    const review = store.get('development-review', task.reviewId, pid), target = assertDevelopmentReviewTarget(store, pid, review), approval = store.get('approval', review.approvalId, pid);
    ensure(target.task.id === task.id && approval.status === 'approved' && approval.digest === target.team.planDigest && approval.scope === 'collaboration' && approval.subjectId === target.team.id, 'APPROVAL_STALE', '审查计划审批已失效');
    ensure(task.result?.outcome === 'completed' && task.result.verdict === 'accept' && review.requiredEvidenceIds.every(id => task.result.evidenceIds.includes(id)), 'DEVELOPMENT_REVIEW_NOT_PASSED', '必须完成独立审查、接受并引用全部必要输入');
    return { reviewId: review.id, digest: review.digest, jobId: review.jobId, sourceDigest: review.sourceDigest, manifestEvidenceId: review.manifestEvidenceId, testEvidenceIds: review.testEvidenceIds, inputAcceptanceIds: target.job.manifest.dataArtifacts.flatMap(a => a.sourceAcceptanceId ? [a.sourceAcceptanceId] : []) };
}
//# sourceMappingURL=reviews-types.js.map