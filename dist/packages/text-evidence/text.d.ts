export declare const PARSER_VERSION = "literal-paragraph-utf16-v1";
export declare const METHOD_VERSION = "local-tfidf-exact-dedup-mmr-v1";
export declare const MAX_CHUNK = 1200;
export interface Chunk {
    chunkId: string;
    artifactId: string;
    digest: string;
    title: string;
    quote: string;
    locator: {
        start: number;
        end: number;
    };
    lineStart: number;
    lineEnd: number;
}
/** Exact UTF-16 offsets into the original decoded file; no normalized text is stored as evidence. */
export declare function splitText(artifactId: string, sourceDigest: string, title: string, content: string): Chunk[];
/** Lexical, not semantic: Latin words + Han unigrams/bigrams. Normalization is for scores only. */
export declare function tokenize(text: string): string[];
export declare function rankChunks(rawChunks: Chunk[], query: string, limit: number, lambda: number, deduplicateExact?: boolean): {
    selected: {
        vector: Map<string, number>;
        score: number;
        alternativeSources: {
            artifactId: string;
            digest: string;
            title: string;
            locator: {
                start: number;
                end: number;
            };
            lineStart: number;
            lineEnd: number;
        }[];
        chunkId: string;
        artifactId: string;
        digest: string;
        title: string;
        quote: string;
        locator: {
            start: number;
            end: number;
        };
        lineStart: number;
        lineEnd: number;
    }[];
    matchingChunks: number;
    exactDuplicatesGrouped: number;
    uniqueChunks: number;
    candidateLimitReached: boolean;
    candidatesConsidered: number;
};
