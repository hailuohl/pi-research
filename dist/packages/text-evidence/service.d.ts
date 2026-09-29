import type { ResearchApp } from '../research-app.js';
import type { Actor } from '../domain/types.js';
import type { DocumentParseResult } from '../documents/parse-types.js';
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
export type DocumentSourceRef = DocumentPair & {
    title: string;
    pageCount: number;
    documentDigest: string;
    resultDigest: string;
    jobId: string;
    approvalId: string;
    manifestDigest: string;
    pages: DocumentParseResult['pages'];
};
export type Corpus = {
    sources: SourceRef[];
    documents?: DocumentSourceRef[];
    parserVersion: string;
};
export type Configuration = {
    enabled: boolean;
    corpusId: string | null;
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
        documentRefs: DocumentSourceRef[];
        grant: import("../domain/types.js").Row<import("../policy/text-corpus-grants.js").TextCorpusGrant> | undefined;
    };
    verifyReplay(actor: Actor, projectId: string, value: unknown): void;
    search(actor: Actor, projectId: string, value: unknown): any;
}
export {};
