import type { Store } from '../storage/store.js';
import type { WorkspaceLease } from './git-types.js';
/** SQLite primary keys serialize independent control processes, not just one JS event loop. */
export declare class WorkspaceLeases {
    private store;
    constructor(store: Store);
    acquire(projectId: string, branch: string, owner: string, ttl?: number): import("../domain/types.js").Row<WorkspaceLease>;
    assert(projectId: string, branch: string, owner: string, generation: number): import("../domain/types.js").Row<WorkspaceLease>;
    renew(projectId: string, branch: string, owner: string, generation: number, ttl?: number): import("../domain/types.js").Row<WorkspaceLease>;
    release(projectId: string, branch: string, owner: string, generation: number): import("../domain/types.js").Row<WorkspaceLease>;
}
