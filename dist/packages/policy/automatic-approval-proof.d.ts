import type { Store } from '../storage/store.js';
import type { Actor } from '../domain/types.js';
import type { AutomaticApprovalReference } from './automatic-approvals.js';
/** Pure metadata guard, also usable by original text authority without status/capture recursion. */
export declare function assertAutomaticApprovalReference(store: Store, ref: AutomaticApprovalReference, current?: boolean): void;
export declare function assertAutomaticTextContinuation(store: Store, actor: Actor, ref: AutomaticApprovalReference): void;
