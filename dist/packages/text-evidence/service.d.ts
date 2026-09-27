import type { ResearchApp } from '../research-app.js';
import type { Actor, Artifact } from '../domain/types.js';
type SourceRef = {
    artifactId: string;
    digest: string;
    title: string;
    size: number;
};
type Corpus = {
    sources: SourceRef[];
    parserVersion: string;
};
type Configuration = {
    enabled: boolean;
    corpusId: string | null;
};
export declare class TextEvidenceService {
    private app;
    constructor(app: ResearchApp);
    private config;
    private allowed;
    private load;
    status(actor: Actor, projectId: string): {
        enabled: boolean;
        version: number;
        corpusId: string | null;
        sources: SourceRef[];
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
        loaded: {
            artifact: import("../domain/types.js").Row<Artifact>;
            chunks: import("./text.js").Chunk[];
        }[];
    };
    search(actor: Actor, projectId: string, value: unknown): any;
}
export {};
