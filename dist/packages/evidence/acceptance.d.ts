import type { Store } from '../storage/store.js';
import type { Task, AcceptanceRecord } from '../domain/types.js';
export declare function reviewStateDigest(store: Store, projectId: string, target: Task): string;
/** Immutable semantic basis, separate from file integrity and current execution leases.
 * Plain dependencies consume accepted output; a reviewOf edge reads submitted output.
 */
export declare function taskAcceptanceBasis(store: Store, projectId: string, taskId: string): {
    taskId: string;
    taskIds: string[];
    basis: unknown[];
    basisDigest: string;
};
export declare function captureAcceptance(store: Store, projectId: string, taskId: string): import("../domain/types.js").Row<AcceptanceRecord>;
export declare function assertAcceptanceCurrent(store: Store, projectId: string, id: string): import("../domain/types.js").Row<AcceptanceRecord>;
