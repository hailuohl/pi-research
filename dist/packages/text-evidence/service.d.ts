import type { ResearchApp } from '../research-app.js';
import type { Actor, Artifact } from '../domain/types.js';
import type { DocumentEvidenceLink } from '../documents/types.js';
import type { DocumentParseResult } from '../documents/parse-types.js';
import { type Chunk } from './text.js';
type SourceRef = {
    artifactId: string;
    digest: string;
    title: string;
    size: number;
};
type DocumentPair = {
    documentVersionId: string;
    parseResultId: string;
};
type DocumentSourceRef = DocumentPair & {
    title: string;
    pageCount: number;
    documentDigest: string;
    resultDigest: string;
    jobId: string;
    approvalId: string;
    manifestDigest: string;
    pages: DocumentParseResult['pages'];
};
type Corpus = {
    sources: SourceRef[];
    documents?: DocumentSourceRef[];
    parserVersion: string;
};
type Configuration = {
    enabled: boolean;
    corpusId: string | null;
};
type DocumentChunk = Chunk & {
    sourceKind: 'document_page';
    page: number;
    document: DocumentEvidenceLink;
};
type VerifiedDocument = {
    ref: DocumentSourceRef;
    pages: Array<{
        page: DocumentParseResult['pages'][number];
        link: DocumentEvidenceLink;
        chunks: DocumentChunk[];
        textBytes: number;
    }>;
    chunks: DocumentChunk[];
    textBytes: number;
};
export declare class TextEvidenceService {
    private app;
    constructor(app: ResearchApp);
    private config;
    private allowed;
    private load;
    private documentPairs;
    private verifyDocument;
    status(actor: Actor, projectId: string): {
        enabled: boolean;
        version: number;
        corpusId: string | null;
        sources: SourceRef[];
        documents: {
            documentVersionId: string;
            parseResultId: string;
            title: string;
            pageCount: number;
        }[];
        method: string;
        parserVersion: string;
        limits: {
            files: number;
            fileBytes: number;
            totalBytes: number;
            chunks: number;
        };
        networkCalls: number;
        modelCalls: number;
    };
    configure(actor: Actor, projectId: string, value: unknown): {
        enabled: boolean;
        version: number;
        corpusId: string | null;
        sources: SourceRef[];
        documents: {
            documentVersionId: string;
            parseResultId: string;
            title: string;
            pageCount: number;
        }[];
        method: string;
        parserVersion: string;
        limits: {
            files: number;
            fileBytes: number;
            totalBytes: number;
            chunks: number;
        };
        networkCalls: number;
        modelCalls: number;
    };
    /** Executed before cached tool replays too: disabling/removing a source must take effect. */
    authorizeSearch(actor: Actor, projectId: string, value: unknown): {
        config: import("../domain/types.js").Row<Configuration>;
        corpus: import("../domain/types.js").Row<Corpus>;
        ids: string[];
        pairs: DocumentPair[];
        loaded: {
            artifact: import("../domain/types.js").Row<Artifact>;
            chunks: Chunk[];
        }[];
        selectedDocuments: VerifiedDocument[];
    };
    search(actor: Actor, projectId: string, value: unknown): any;
}
export {};
