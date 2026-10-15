import type { ResearchApp } from '../research-app.js';
import type { Actor } from '../domain/types.js';
import type { ProviderTextEvidenceLink } from '../documents/types.js';
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
type PmcSourceRef = ProviderTextEvidenceLink & {
    title: string;
};
export type Corpus = {
    sources: SourceRef[];
    documents?: DocumentSourceRef[];
    pmcDocuments?: PmcSourceRef[];
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
    private pmcPairs;
    private verifyPmc;
    private verifyDocument;
    status(actor: Actor, projectId: string): {
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
        pmcDocuments?: {
            documentVersionId: string;
            title: string;
            reportedVersion: string;
        }[] | undefined;
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
    };
    configure(actor: Actor, projectId: string, value: unknown): {
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
        pmcDocuments?: {
            documentVersionId: string;
            title: string;
            reportedVersion: string;
        }[] | undefined;
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
    };
    /** Executed before cached tool replays too: disabling/removing a source must take effect. */
    authorizeSearch(actor: Actor, projectId: string, value: unknown): {
        config: import("../domain/types.js").Row<Configuration>;
        corpus: import("../domain/types.js").Row<Corpus>;
        ids: string[];
        pairs: DocumentPair[];
        documentRefs: DocumentSourceRef[];
        pmcPairs: {
            documentVersionId: string;
        }[];
        pmcRefs: PmcSourceRef[];
        grant: import("../domain/types.js").Row<import("../policy/text-corpus-grants.js").TextCorpusGrant> | undefined;
    };
    verifyReplay(actor: Actor, projectId: string, value: unknown): void;
    search(actor: Actor, projectId: string, value: unknown): any;
}
export {};
