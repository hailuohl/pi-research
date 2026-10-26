import { type Stats } from 'node:fs';
import type { Store } from './store.js';
import type { ArtifactBlob } from './artifact-blob.js';
declare const brand: unique symbol;
/** Host-created, synchronous boundary only; no transport can supply or retain this capability. */
export interface SourceIntegrityContext {
    readonly [brand]: true;
}
interface State {
    store: Store;
    active: boolean;
    mode: 'authority' | 'full';
    deferred: Set<string>;
    verified: Map<string, Stats>;
    failed: Map<string, unknown>;
}
export declare function sourceIntegrityScope(store: Store, id: string): SourceIntegrityContext | undefined;
export declare function verifiedSourceContext(store: Store, blob: ArtifactBlob): SourceIntegrityContext | undefined;
export declare function withSourceIntegrity<T>(store: Store, id: string, mode: State['mode'], blobs: ArtifactBlob[], fn: (context: SourceIntegrityContext) => T): T;
export declare function verifySourceBlob(store: Store, blob: ArtifactBlob, context?: SourceIntegrityContext): void;
export {};
