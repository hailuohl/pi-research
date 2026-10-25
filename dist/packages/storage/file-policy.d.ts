export declare const DEFAULT_MAX_FILE_BYTES: number;
export declare const LEGACY_DOCUMENT_BYTES: number;
export declare const TEXT_PAGE_BYTES: number;
export declare const STREAM_TEXT_MEDIA_TYPES: readonly ["text/plain", "text/markdown", "text/csv", "text/tab-separated-values", "application/json", "application/x-ndjson"];
/** One deployment policy for ordinary text/data originals; transport and media caps remain separate. */
export declare function filePolicy(): {
    maxFileBytes: number;
    legacyJsonFileBytes: number;
    textPageBytes: number;
    mediaTypes: readonly ["text/plain", "text/markdown", "text/csv", "text/tab-separated-values", "application/json", "application/x-ndjson"];
};
