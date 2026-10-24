import type { Store } from '../storage/store.js';
declare const kinds: readonly ["discovery-grant", "working-grant", "run-grant", "text-corpus-grant"];
type GrantKind = typeof kinds[number];
export declare function assertGrantAdmission(store: Store, pid: string, grantKind: GrantKind, grantId: string): void;
/** Separate admission retirement from immutable proof used by historical evidence. */
export declare function retireSessionGrants(store: Store, pid: string, rootSessionId: string): void;
export {};
