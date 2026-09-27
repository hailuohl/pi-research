import type { Store } from '../storage/store.js';
/** A review is an acceptance prerequisite: invalidation flows in BOTH directions.
 * Sources explicitly assigned as evidence can connect teams within one project.
 */
export declare function invalidationClosure(store: Store, projectId: string, ids: string[]): Set<string>;
export declare function expireDerivations(store: Store, projectId: string, taskIds: Set<string>, directiveId: string): void;
