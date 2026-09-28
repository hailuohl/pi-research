import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
/** SQLite primary keys serialize independent control processes, not just one JS event loop. */
export class WorkspaceLeases {
    store;
    constructor(store) {
        this.store = store;
    }
    acquire(projectId, branch, owner, ttl = 60000) {
        return this.store.transaction(() => {
            const id = digest({ projectId, branch }), old = this.store.maybe('workspace-lease', id);
            ensure(!old || old.owner === owner || old.until <= Date.now(), 'WORKSPACE_LEASE_BUSY', '分支已有写入者');
            const value = { branch, owner, generation: old ? old.owner === owner && old.until > Date.now() ? old.generation : old.generation + 1 : 1, until: Date.now() + ttl };
            return old ? this.store.update('workspace-lease', id, old.version, value) : this.store.create('workspace-lease', projectId, value, id);
        });
    }
    assert(projectId, branch, owner, generation) {
        const lease = this.store.get('workspace-lease', digest({ projectId, branch }), projectId);
        ensure(lease.owner === owner && lease.generation === generation && lease.until > Date.now(), 'WORKSPACE_LEASE_EXPIRED', '分支写入租约已失效');
        return lease;
    }
    renew(projectId, branch, owner, generation, ttl = 60000) {
        return this.store.transaction(() => { const lease = this.assert(projectId, branch, owner, generation); return this.store.update('workspace-lease', lease.id, lease.version, { until: Date.now() + ttl }); });
    }
    release(projectId, branch, owner, generation) {
        return this.store.transaction(() => { const lease = this.assert(projectId, branch, owner, generation); return this.store.update('workspace-lease', lease.id, lease.version, { until: 0 }); });
    }
}
//# sourceMappingURL=leases.js.map