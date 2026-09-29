import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { verifySnapshot } from '../workspace/files.js';
export function workingGrantPayload(g) {
    const { developmentTaskId, templateManifestDigest, sessionId, sourceRevisionId, model, baselineSnapshot, command, environmentImageDigest, dockerContext, resources, dataArtifacts, expectedArtifacts, editablePaths, maxTests, maxChangedBytes, expiresAt, approvalId } = g;
    return { developmentTaskId, templateManifestDigest, sessionId, sourceRevisionId, model, baselineSnapshot, command, environmentImageDigest, dockerContext, resources, dataArtifacts, expectedArtifacts, editablePaths, maxTests, maxChangedBytes, expiresAt, approvalId };
}
export const workingGrantReference = (g) => ({ id: g.id, digest: g.digest, approvalId: g.approvalId });
export function assertWorkingGrantRecord(store, pid, id) {
    const g = store.get('working-grant', id, pid);
    ensure(digest(workingGrantPayload(g)) === g.digest && digest(g.baselineSnapshot.files) === g.baselineSnapshot.digest, 'WORKING_GRANT_CORRUPTED', '私有实现授权的固定内容已改变');
    const template = store.get('development-task', g.developmentTaskId, pid);
    ensure(template.manifestDigest === g.templateManifestDigest && digest(template.manifest) === g.templateManifestDigest, 'WORKING_GRANT_TEMPLATE_STALE', '原测试模板已改变');
    const approval = store.get('approval', g.approvalId, pid);
    ensure(approval.subjectKind === 'working-grant' && approval.subjectId === g.id && approval.digest === g.digest && approval.scope === 'working-grant.activate' && !approval.workingGrant, 'APPROVAL_STALE', '私有实现授权的原批准身份不符');
    return { grant: g, approval };
}
/** Expiry closes future effects only. Revocation invalidates the original authority chain. */
export function assertWorkingGrantReference(store, pid, ref, admission = false) {
    const { grant: g, approval } = assertWorkingGrantRecord(store, pid, ref.id);
    ensure(g.digest === ref.digest && g.approvalId === ref.approvalId, 'WORKING_GRANT_STALE', '私有实现授权或原批准身份已改变');
    ensure(g.state === 'active', 'WORKING_GRANT_REVOKED', '私有实现授权尚未激活或已撤销');
    ensure(approval.status === 'approved', 'APPROVAL_STALE', '私有实现授权的原批准已失效');
    if (admission) {
        ensure(Date.parse(g.expiresAt) > Date.now(), 'WORKING_GRANT_EXPIRED', '私有实现授权已到期；历史产物保留');
        const s = store.get('session', g.sessionId, pid);
        ensure(s.workingGrantId === g.id && s.role === 'coordinator' && !s.taskId && s.sourceRevisionId === g.sourceRevisionId && digest(s.model) === digest(g.model), 'WORKING_GRANT_SCOPE_CHANGED', '会话、模型或固定来源已改变');
        ensure(s.state !== 'archived', 'SESSION_ARCHIVED', '会话已归档');
    }
    return g;
}
export function assertWorkingGrantDelta(g, files) {
    const before = new Map(g.baselineSnapshot.files.map(f => [f.path, f])), after = new Map(files.map(f => [f.path, f]));
    let changedBytes = 0;
    for (const path of new Set([...before.keys(), ...after.keys()])) {
        const a = before.get(path), b = after.get(path);
        if (a && b && a.digest === b.digest && (a.mode ?? '100644') === (b.mode ?? '100644'))
            continue;
        ensure(g.editablePaths.includes(path), 'WORKING_GRANT_PATH_DENIED', '源码变化超出批准的精确文件路径', 403);
        changedBytes += Math.max(a?.size ?? 0, b?.size ?? 0);
    }
    ensure(changedBytes <= g.maxChangedBytes, 'WORKING_GRANT_BYTES_EXCEEDED', '相对原始快照的变化文件字节数超过上限');
    return changedBytes;
}
export function assertWorkingGrantManifest(g, m) {
    ensure(m.sessionId === g.sessionId && m.sourceRevisionId === g.sourceRevisionId && !m.scopeTaskId && !m.scopeAttemptId && m.scopeGeneration === undefined, 'WORKING_GRANT_SCOPE_CHANGED', '测试会话或固定来源不属于本授权');
    const resources = Object.entries(g.resources).every(([key, limit]) => Number.isSafeInteger(m.resources[key]) && m.resources[key] > 0 && m.resources[key] <= limit) && Object.keys(m.resources).every(key => key in g.resources);
    ensure(digest(m.command) === digest(g.command) && m.environmentImageDigest === g.environmentImageDigest && m.dockerContext === g.dockerContext && resources && digest(m.dataArtifacts) === digest(g.dataArtifacts) && digest(m.expectedArtifacts) === digest(g.expectedArtifacts) && m.networkPolicy === 'none', 'WORKING_GRANT_TEST_DENIED', '测试命令、镜像、数据、资源或预期产物超出固定授权');
    ensure(Number.isFinite(Date.parse(m.deadline)) && Date.parse(m.deadline) <= Date.parse(g.expiresAt), 'WORKING_GRANT_TEST_DENIED', '测试期限超出授权期限');
    ensure(digest(m.inputSnapshot.files) === m.inputSnapshot.digest, 'MANIFEST_CORRUPTED', '测试源码清单摘要不符');
    assertWorkingGrantDelta(g, m.inputSnapshot.files);
}
/** Read-only authority verifier shared by execution, independent review, and publication. */
export function assertWorkingGrantJob(store, job, admission = false) {
    const m = job.manifest, approval = store.get('approval', job.grantId, job.projectId);
    if (!m.workingGrant) {
        ensure(!approval.workingGrant && !store.list('working-grant-use', job.projectId).some(u => u.jobId === job.id || u.developmentTaskId === job.developmentTaskId), 'WORKING_GRANT_STALE', '测试清单丢失派生授权依据');
        return;
    }
    const g = assertWorkingGrantReference(store, job.projectId, m.workingGrant, admission);
    ensure(digest(m) === job.manifestDigest && job.sourceDigest === m.inputSnapshot.digest, 'MANIFEST_CORRUPTED', '固定测试清单已改变');
    assertWorkingGrantManifest(g, m);
    ensure(approval.subjectKind === 'development-task' && approval.subjectId === job.developmentTaskId && approval.digest === job.manifestDigest && approval.scope === 'development.test' && approval.status === 'approved' && digest(approval.workingGrant) === digest(m.workingGrant), 'APPROVAL_STALE', '单次测试的派生批准不匹配');
    const id = digest({ grantId: g.id, developmentTaskId: job.developmentTaskId }), use = store.get('working-grant-use', id, job.projectId);
    ensure(use.grantId === g.id && use.grantDigest === g.digest && use.grantApprovalId === g.approvalId && use.developmentTaskId === job.developmentTaskId && use.manifestDigest === job.manifestDigest && use.approvalId === job.grantId && use.jobId === job.id, 'WORKING_GRANT_USE_MISMATCH', '测试作业与永久计次回执不匹配');
    verifySnapshot(g.baselineSnapshot.path, g.baselineSnapshot.files);
}
//# sourceMappingURL=working-grant-validation.js.map