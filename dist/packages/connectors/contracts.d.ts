export declare const SOURCES: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
export type SourceId = typeof SOURCES[number];
export interface SearchInput {
    query: string;
    sources: SourceId[];
    limit: number;
    strategy: 'keyword' | 'embedding';
    prioritize: 'default' | 'recency' | 'historical' | 'popular';
    publishedAfter?: string;
    publishedBefore?: string;
}
export interface Hit {
    source: SourceId;
    id: string;
    title: string;
    abstract: string;
    publicationDate: string | null;
    doi?: string;
    url: string;
    citations?: number;
    votes?: number;
    snippets?: {
        text: string;
        reportedPage: number | null;
    }[];
    contentKind: 'metadata';
    fullTextRead: false;
}
export interface PaperContent {
    source: SourceId;
    id: string;
    title: string;
    content: string;
    contentKind: 'metadata' | 'abstract' | 'full_text';
    sourceUrl: string;
    requestedId: string;
    versionAssurance: 'requested-address-unverified' | 'provider-record';
    pageMapping: 'unavailable';
    reportedVersion?: string;
    resolvedId?: string;
    license?: string;
}
export declare function date(value: unknown): string;
export declare function normalizeDate(value: unknown): string | null;
export declare function inWindow(d: string | null, window: {
    publishedAfter?: string;
    publishedBefore?: string;
}): boolean;
export declare function parseSearch(value: unknown): SearchInput;
export declare function routePaperId(raw: unknown, source?: unknown): {
    source: SourceId;
    id: string;
};
export declare function reconstructAbstract(value: unknown): string;
export declare function rank(hits: Hit[], q: SearchInput): Hit[];
export declare function deduplicate(hits: Hit[]): Array<Hit & {
    duplicates: {
        source: SourceId;
        id: string;
    }[];
}>;
