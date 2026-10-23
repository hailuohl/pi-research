import { digest } from '../storage/store.js';
import { assertResearchReference, modelDigest } from './research-automation.js';
import { assertModelRestoreCurrent } from '../pi-adapter/model-connections.js';
import { ensure } from '../domain/errors.js';
/** Pure metadata guard, also usable by original text authority without status/capture recursion. */
export function assertAutomaticApprovalReference(store, ref, current = true) {
    const { digest: hash, ...fixed } = ref, proof = store.get('automatic-approval-proof', hash);
    ensure(hash === digest(fixed) && digest(proof.reference) === digest(ref), 'AUTOMATIC_APPROVAL_STALE', '自动批准固定证明已改变', 403);
    if (!current)
        return;
    const pid = proof.projectId, s = store.get('session', ref.rootSessionId, pid), g = store.get('host-access', s.id, pid), p = store.get('project', pid), m = store.get('message', ref.originMessageId, pid), permission = store.maybe('session-permission', s.id);
    ensure(g.state === 'enabled' && g.automaticApprovalScope === 1 && g.researchAutomationScope === 2 && g.epoch === ref.permission.hostEpoch && g.runtimeId === ref.runtimeId && p.lifecycleEpoch === ref.lifecycleEpoch && !p.archived && s.state !== 'archived' && !s.parentSessionId && !s.taskId && !s.teamId && s.role === 'coordinator' && s.sourceRevisionId === ref.sourceRevisionId && (permission?.epoch ?? 0) === ref.permission.epoch, 'AUTOMATIC_APPROVAL_REVOKED', '原根任务授权、来源或生命周期已变化', 403);
    assertModelRestoreCurrent(store.paths.dataDir, s.model);
    ensure(modelDigest(store, s) === ref.modelDigest && m.sessionId === s.id && m.role === 'user' && !m.origin && !m.wakeupId && !m.approvalNoticeId && !m.queueRemoved && digest(m.content) === ref.originDigest && digest(m.permission) === digest(ref.permission), 'AUTOMATIC_APPROVAL_ORIGIN_STALE', '原人工输入或模型连接已变化', 403);
}
export function assertAutomaticTextContinuation(store, actor, ref) {
    ensure(actor.continuationId && actor.wakeupId, 'PERMISSION_DENIED', '原文续接必须绑定准确原任务', 403);
    const c = store.get('research-continuation', actor.continuationId, actor.projectId), w = store.get('wakeup', actor.wakeupId, actor.projectId);
    assertResearchReference(store, actor.projectId, { continuationId: c.id, digest: c.digest }, true);
    ensure(c.rootSessionId === actor.sessionId && c.originMessageId === ref.originMessageId && c.permission.hostEpoch === ref.permission.hostEpoch && w.continuationId === c.id && w.rootSessionId === actor.sessionId && w.state === 'running' && w.generation === actor.generation && w.messageId === actor.messageId, 'PERMISSION_DENIED', '原文续接不属于本次准确根任务', 403);
}
//# sourceMappingURL=automatic-approval-proof.js.map