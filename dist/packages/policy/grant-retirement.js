import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
const kinds = ['discovery-grant', 'working-grant', 'run-grant', 'text-corpus-grant'];
export function assertGrantAdmission(store, pid, grantKind, grantId) {
    const retired = store.maybe('grant-retirement', digest({ grantKind, grantId }));
    if (retired)
        store.get('grant-retirement', retired.id, pid);
    ensure(!retired, 'GRANT_RETIRED', '会话归档已关闭此授权的新操作；历史保留');
}
/** Separate admission retirement from immutable proof used by historical evidence. */
export function retireSessionGrants(store, pid, rootSessionId) {
    for (const grantKind of kinds)
        for (const grant of store.list(grantKind, pid)) {
            const team = grant.taskBinding ? store.maybe('team', grant.taskBinding.teamId) : undefined, owner = grant.taskBinding ? team?.projectId === pid ? team.rootSessionId : undefined : grant.sessionId;
            if (owner !== rootSessionId || !['draft', 'active'].includes(grant.state))
                continue;
            const grantId = grant.id, id = digest({ grantKind, grantId });
            if (!store.maybe('grant-retirement', id))
                store.create('grant-retirement', pid, { grantKind, grantId, rootSessionId }, id);
        }
}
//# sourceMappingURL=grant-retirement.js.map