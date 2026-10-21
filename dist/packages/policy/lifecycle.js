import { ensure } from '../domain/errors.js';
import { assertAcceptanceCurrent } from '../evidence/acceptance.js';
/** Call inside the write transaction at the point a NEW side effect is authorized. */
export function assertProjectWritable(store, projectId, expectedEpoch) {
    const project = store.get('project', projectId);
    ensure(!['trashed', 'purging'].includes(project.status), 'PROJECT_DELETED', '项目已移入回收站；普通内容不可访问', 410);
    ensure(project.status === 'active', 'PROJECT_ARCHIVED', '项目已归档；历史仍可读取，不能开始新操作');
    ensure(expectedEpoch === undefined || project.lifecycleEpoch === expectedEpoch, 'PROJECT_LIFECYCLE_STALE', '项目生命周期已变化；请重新发起操作');
    return project;
}
/** Already submitted Runs keep their history; new Runs cannot inherit revoked code approval. */
export function assertExperimentSourceCurrent(store, experiment, historical = false) {
    const seen = new Set();
    let e = experiment;
    while (e) {
        if (e.changeProposalId) {
            const proposal = store.get('change-proposal', e.changeProposalId);
            ensure(proposal.sourceValidity !== 'stale', 'CHANGE_SOURCE_STALE', '实验来源的审查已失效，请重新审查并准备新版本');
            if (proposal.flow === 'reviewed-development') {
                ensure(proposal.reviewAcceptanceId, 'CHANGE_SOURCE_STALE', '受审实验缺少审查绑定');
                if (!historical)
                    assertAcceptanceCurrent(store, proposal.projectId, proposal.reviewAcceptanceId);
            }
        }
        if (!e.parentId)
            break;
        ensure(!seen.has(e.parentId), 'EXPERIMENT_CYCLE', '实验血缘存在循环');
        seen.add(e.parentId);
        e = store.get('experiment', e.parentId);
    }
}
/** Owner history is readable, but agents may only enter active projects. */
export function assertProjectReadable(store, projectId, actor) {
    const project = store.get('project', projectId);
    ensure(!['trashed', 'purging'].includes(project.status), 'PROJECT_DELETED', '项目已移入回收站；普通内容不可访问', 410);
    ensure(project.status === 'active' || actor.type !== 'agent' && project.status === 'archived', 'PROJECT_UNAVAILABLE', '项目不在可读取状态', 409);
    return project;
}
/** Holds the same writer transaction as the lifecycle CAS. Unknown effects remain busy. */
export function assertProjectIdle(store, pid) {
    ensure(!store.db.prepare("SELECT 1 FROM compute_queue WHERE project_id=? AND (held<>0 OR phase NOT IN ('succeeded','failed','cancelled','timed_out')) LIMIT 1").get(pid), 'PROJECT_BUSY', '项目还有计算排队、运行或未知结果');
    ensure(!store.db.prepare('SELECT 1 FROM compute_gpu_claims g JOIN compute_queue q ON q.kind=g.kind AND q.id=g.id WHERE q.project_id=? LIMIT 1').get(pid), 'PROJECT_BUSY', '项目还有未确认释放的 GPU 占用');
    const terminal = ['succeeded', 'failed', 'cancelled', 'timed_out'];
    for (const raw of store.db.prepare('SELECT kind,data FROM records WHERE project_id=?').all(pid)) {
        const kind = String(raw.kind), r = JSON.parse(String(raw.data)), state = r.state;
        let busy = false;
        if (['run', 'sandbox-job'].includes(kind))
            busy = !terminal.includes(state);
        if (['document-parse-job', 'publication-build-job'].includes(kind))
            busy = state !== 'prepared' && !terminal.includes(state);
        if (kind === 'agent-admission')
            busy = state !== 'released';
        if (kind === 'model-http-request')
            busy = ['queued', 'active', 'unknown'].includes(state) || (r.ownerKind === 'owner-native' && state === 'interrupted' && r.transportEnded !== true);
        if (kind === 'session')
            busy = ['queued', 'running'].includes(state);
        if (kind === 'message')
            busy = r.status === 'running';
        if (kind === 'task')
            busy = r.execution === 'running';
        if (kind === 'task-attempt')
            busy = ['running', 'unknown'].includes(state);
        if (['literature-task', 'git-operation'].includes(kind))
            busy = ['queued', 'running', 'unknown', 'recovering', 'cancelling'].includes(state);
        if (kind === 'github-upload-job')
            busy = ['queued', 'creating', 'uploading', 'unknown'].includes(state);
        if (kind === 'workspace-lease')
            busy = Number(r.until) > Date.now();
        if (kind === 'wakeup')
            busy = ['queued', 'running'].includes(state);
        if (kind === 'native-request')
            busy = ['running', 'unknown'].includes(state);
        if (kind === 'host-command')
            busy = ['starting', 'running', 'unknown'].includes(state);
        if (kind === 'session-action')
            busy = ['executing', 'unknown'].includes(state);
        if (['operation-pending', 'ssh-setup'].includes(kind))
            busy = true;
        ensure(!busy, 'PROJECT_BUSY', `项目仍有未结束执行：${kind}/${r.id}`);
    }
}
/** Revoke execution authority without deleting fixed source or research history. */
export function retireProjectAuthority(store, pid) {
    const update = (kind, states, patch, field = 'state') => {
        for (const row of store.list(kind, pid))
            if (states.includes(String(row[field])))
                store.update(kind, row.id, row.version, patch);
    };
    update('approval', ['pending', 'approved'], { status: 'stale' }, 'status');
    for (const kind of ['working-grant', 'run-grant', 'discovery-grant', 'text-corpus-grant'])
        update(kind, ['draft', 'active'], { state: 'revoked', revokedAt: new Date().toISOString() });
    update('session-action', ['pending', 'approved'], { state: 'stale' });
    update('native-request', ['pending', 'approved'], { state: 'stale', error: '项目已归档，请重新准备' });
    for (const row of store.list('host-access', pid))
        if (row.state !== 'revoked')
            store.update('host-access', row.id, row.version, { state: 'revoked', epoch: Number(row.epoch) + 1 });
    for (const session of store.list('session', pid)) {
        const permission = store.maybe('session-permission', session.id);
        if (permission)
            store.update('session-permission', permission.id, permission.version, { mode: permission.mode === 'readOnly' ? 'readOnly' : 'confirm', epoch: Number(permission.epoch) + 1 });
        else
            store.create('session-permission', pid, { sessionId: session.id, mode: 'confirm', epoch: 1 }, session.id);
    }
    update('message', ['queued'], { status: 'cancelled', error: '项目已归档，未开始的请求已取消' }, 'status');
    update('team', ['active', 'paused', 'awaiting_approval', 'draining'], { state: 'paused', delegationEnabled: false, blockReason: '项目已归档；需要重新授权' });
    update('campaign', ['draft', 'active', 'paused'], { state: 'stopped', autoAnalyze: false, stopReason: '项目已归档' });
    update('research-continuation', ['active', 'paused', 'blocked'], { state: 'cancelled', reason: '项目已归档' });
    update('task', ['pending', 'blocked', 'waiting_user'], { execution: 'cancelled' }, 'execution');
    update('wakeup', ['pending'], { state: 'superseded', error: '项目已归档', requested: false });
    for (const row of store.list('github-setting', pid))
        if (row.enabled)
            store.update('github-setting', row.id, row.version, { enabled: false, epoch: Number(row.epoch) + 1, eventCursor: store.eventCursor(pid) });
}
//# sourceMappingURL=lifecycle.js.map