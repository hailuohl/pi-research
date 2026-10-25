import type { Store } from './store.js';
import type { ArtifactBlob } from './artifact-blob.js';
import type { DocumentBlobPublication } from './document-publication.js';
export declare const TEXT_BLOCK_BYTES: number;
export interface FixedTextIndex {
    format: 'utf8-block-tree-v1';
    sourceDigest: string;
    sourceSize: number;
    blockBytes: number;
    blockCount: number;
    leafCount: number;
    rootDigest: string;
    utf16Length: number;
}
/** Full integrity boundary, bounded memory; never use metadata as a hash substitute. */
export declare function verifyStreamedBlob(store: Pick<Store, 'paths'>, blob: ArtifactBlob): void;
/** Private project-owned staging only. The caller must persist ownership before publishing CAS files. */
export declare function prepareStreamedText(store: Store, projectId: string, input: AsyncIterable<Uint8Array>, maxBytes: number, validate: () => void): Promise<{
    blob: {
        blobPath: string;
        digest: string;
        size: number;
    };
    indexBlob: {
        blobPath: string;
        digest: string;
        size: number;
    };
    index: FixedTextIndex;
    publication: DocumentBlobPublication;
    dispose: () => Promise<void>;
}>;
export declare function publishStreamedText(store: Store, publication: DocumentBlobPublication, validate: () => void): Promise<void>;
/** Merkle proofs authenticate only touched block entries, keeping index I/O bounded even for large configured limits. */
export declare function readStreamedText(store: Store, source: ArtifactBlob, indexBlob: ArtifactBlob, index: FixedTextIndex, cursor: number, limit: number): {
    content: string;
    cursor: number;
    end: number;
    totalBytes: number;
    complete: boolean;
};
