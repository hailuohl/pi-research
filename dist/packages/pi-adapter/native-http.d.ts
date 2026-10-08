import type { Store } from '../storage/store.js';
export interface OwnerNativeHttpIdentity {
    ownerKind: 'owner-native';
    operationId: string;
    ownerHost: string;
    ownerPid: number;
    sessionId: string;
    provider: string;
    model: string;
}
type Outcome = 'succeeded' | 'failed' | 'cancelled' | 'unknown';
/** Uses the shared HTTP journal; this identity never impersonates an AgentAdmission. */
export declare function acquireOwnerNativeHttp(store: Store, projectId: string, identity: OwnerNativeHttpIdentity, validate: () => void): string;
/** Only a drained local transport can release the shared journal; provider outcome may remain unknown. */
export declare function finishOwnerNativeHttp(store: Store, identity: OwnerNativeHttpIdentity, outcome: Outcome, httpStatus?: number, receivedBytes?: number, transportEnded?: boolean): void;
/** A confirmed lost process does not authorize another paid request. */
export declare function recoverOwnerNativeHttp(store: Store): void;
export {};
