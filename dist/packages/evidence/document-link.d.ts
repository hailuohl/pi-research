import type { AppContext } from '../domain/context.js';
import type { DocumentVersion, DocumentEvidenceLink } from '../documents/types.js';
import type { DocumentParseResult } from '../documents/parse-types.js';
/** Verify the entire provenance chain; a matching quote alone cannot establish a PDF page. */
export declare function verifyDocumentLink(c: AppContext, pid: string, link: DocumentEvidenceLink, artifactId?: string): {
    document: import("../domain/types.js").Row<DocumentVersion>;
    result: import("../domain/types.js").Row<DocumentParseResult>;
    page: import("../documents/parse-types.js").DocumentPage;
    bytes: NonSharedBuffer;
};
