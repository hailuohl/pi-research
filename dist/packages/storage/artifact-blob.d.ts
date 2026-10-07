import { type Store } from './store.js';
export interface ArtifactBlob {
    blobPath: string;
    digest: string;
    size: number;
}
/** Host-only CAS staging; publishing records is the caller's transaction. */
export declare function prepareArtifactBlob(store: Store, bytes: Buffer): ArtifactBlob;
export declare function readArtifactBlob(store: Store, file: ArtifactBlob, maxBytes: number): Buffer;
