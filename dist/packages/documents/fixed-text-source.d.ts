import type { Store } from '../storage/store.js';
import type { Row } from '../domain/types.js';
import type { DocumentVersion } from './types.js';
/** Internal descriptor adapter. Callers must establish their own byte-reading authority. */
export declare function fixedDocumentTextSource(store: Store, d: Row<DocumentVersion>): {
    source: {
        blobPath: string;
        digest: string;
        size: number;
    };
    indexBlob: {
        blobPath: string;
        digest: string;
        size: number;
    };
    index: import("../storage/streamed-blob.js").FixedTextIndex;
};
