import type { SourceSnapshot } from '../domain/types.js';
export declare const DOCUMENT_PARSER_PROFILE = "pdfium-text-images-v2";
export declare const DOCUMENT_PARSER_LEGACY_PROFILE = "pdfium-text-pages-v1";
export type DocumentParserProfile = typeof DOCUMENT_PARSER_PROFILE | typeof DOCUMENT_PARSER_LEGACY_PROFILE;
export declare const DOCUMENT_PARSE_RESOURCES: {
    cpus: number;
    memoryMb: number;
    pids: number;
    timeoutSeconds: number;
    workMb: number;
    logBytes: number;
    outputBytes: number;
};
export type DocumentParseState = 'prepared' | 'queued' | 'starting' | 'running' | 'unknown' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out';
export declare const DOCUMENT_PARSE_TERMINAL: readonly ["succeeded", "failed", "cancelled", "timed_out"];
export interface DocumentParserConfiguration {
    dockerContext: string;
    imageDigest: string;
    imageId: string;
    profileId: DocumentParserProfile;
    lockDigest: string;
    scriptDigest: string;
    profileDigest: string;
}
export interface DocumentParseManifest {
    purpose: 'document-parse';
    documentVersionId: string;
    documentDigest: string;
    rawArtifactId: string;
    rawDigest: string;
    rawSize: number;
    profileId: DocumentParserProfile;
    profileDigest: string;
    lockDigest: string;
    scriptDigest: string;
    dockerContext: string;
    environmentImageDigest: string;
    command: string[];
    inputSnapshot: SourceSnapshot;
    dataArtifacts: Array<{
        id: string;
        digest: string;
        size: number;
        path: string;
    }>;
    resources: typeof DOCUMENT_PARSE_RESOURCES;
}
export interface DocumentParseJob {
    documentVersionId: string;
    manifest: DocumentParseManifest;
    manifestDigest: string;
    approvalId: string;
    state: DocumentParseState;
    integrity: 'pending' | 'complete' | 'incomplete' | 'invalid';
    containerName: string;
    containerId?: string;
    imageId?: string;
    generation: number;
    leaseUntil: number;
    workerPid?: number;
    startRequested: boolean;
    cancelRequested: boolean;
    recoveryCount: number;
    outputDir: string;
    controlDir: string;
    startedAt?: string;
    endedAt?: string;
    exitCode?: number | null;
    error?: string;
    artifactIds: string[];
    resultId?: string;
    logTruncated?: boolean;
}
export interface DocumentParagraph {
    index: number;
    start: number;
    end: number;
}
export interface DocumentImageCandidate {
    index: number;
    method: 'embedded-raster-object';
    pixelBounds: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
}
export interface DocumentPage {
    pageNumber: number;
    pageLabel: string | null;
    width: number;
    height: number;
    imageWidth: number;
    imageHeight: number;
    textArtifactId: string;
    textArtifactDigest: string;
    imageArtifactId: string;
    imageArtifactDigest: string;
    paragraphs: DocumentParagraph[];
    textStatus: 'text-extracted' | 'no-text-layer';
    imageCandidates?: DocumentImageCandidate[];
}
export interface DocumentParseResult {
    documentVersionId: string;
    jobId: string;
    rawDigest: string;
    manifestDigest: string;
    profileId: DocumentParserProfile;
    profileDigest: string;
    imageId: string;
    pageCount: number;
    pages: DocumentPage[];
    manifestArtifactId: string;
    manifestArtifactDigest: string;
    versionAssurance: 'marker-match' | 'unverified';
    requestedVersion: string | null;
    observedVersion: string | null;
    quality: {
        readingOrder: 'unverified';
        paragraphs: 'heuristic';
        tables: 'unknown';
        figures: 'unknown';
        ocr: false;
        score: null;
    };
}
export interface ParserOutput {
    formatVersion: 1 | 2;
    profileId: DocumentParserProfile;
    rawDigest: string;
    pageCount: number;
    quality: DocumentParseResult['quality'];
    pages: Array<{
        pageNumber: number;
        pageLabel: string | null;
        width: number;
        height: number;
        imageWidth: number;
        imageHeight: number;
        textFile: string;
        textDigest: string;
        textBytes: number;
        imageFile: string;
        imageDigest: string;
        imageBytes: number;
        paragraphs: DocumentParagraph[];
        textStatus: 'text-extracted' | 'no-text-layer';
        imageCandidates?: DocumentImageCandidate[];
    }>;
}
