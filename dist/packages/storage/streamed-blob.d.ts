import { type Stats } from 'node:fs';
import type { Store } from './store.js';
import type { ArtifactBlob } from './artifact-blob.js';
import type { DocumentBlobPublication } from './document-publication.js';
import type { TextIndexPublication } from './text-index-publication.js';
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
declare function validBlob(store: Pick<Store, 'paths'>, blob: ArtifactBlob): string;
export declare const validateStreamedBlobReference: typeof validBlob;
/** Full integrity boundary, bounded memory; never use metadata as a hash substitute. */
export declare function verifyStreamedBlob(store: Pick<Store, 'paths'>, blob: ArtifactBlob, validate?: () => void): Stats;
export declare function prepareStreamedText(store: Store, projectId: string, input: AsyncIterable<Uint8Array>, maxBytes: number, validate: () => void, allowEmpty?: boolean): Promise<{
    publication: {
        format: "document-blob-publication-v1";
        stagingId: `${string}-${string}-${string}-${string}-${string}`;
        blobs: {
            stage: {
                path: string;
                dev: number;
                ino: number;
            };
            blobPath: string;
            digest: string;
            size: number;
        }[];
    };
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
    dispose: () => Promise<void>;
}>;
/** Index an already-owned fixed source: only entries/index are staged, never the source bytes. */
export declare function prepareFixedTextIndex(store: Store, projectId: string, artifactId: string, source: ArtifactBlob, maxBytes: number, validate: () => void, checkpoint?: () => void): Promise<{
    publication: TextIndexPublication;
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
    dispose: () => Promise<void>;
}>;
export declare function publishFixedTextIndex(store: Store, publication: TextIndexPublication, validate: () => void): Promise<void>;
export declare function publishStreamedText(store: Store, publication: DocumentBlobPublication, validate: () => void, checkpoint?: () => void): Promise<void>;
/** Merkle proofs authenticate only touched block entries, keeping index I/O bounded even for large configured limits. */
export declare function assertStreamedIndex(store: Store, source: ArtifactBlob, indexBlob: ArtifactBlob, index: FixedTextIndex): void;
export declare function readStreamedText(store: Store, source: ArtifactBlob, indexBlob: ArtifactBlob, index: FixedTextIndex, cursor: number, limit: number, utf16?: boolean): {
    utf16Start?: number | undefined;
    utf16End?: number | undefined;
    content: string;
    cursor: number;
    end: number;
    totalBytes: number;
    complete: boolean;
};
export {};
