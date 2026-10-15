import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Session, MessageAttachment } from '../domain/types.js';
import type { DocumentVersion } from './types.js';
import { DOCUMENT_PARSER_PROFILE, type DocumentParserProfile, type DocumentParseManifest, type DocumentParseJob, type DocumentParseResult, type ParserOutput, type DocumentPage } from './parse-types.js';
export declare function parserProfile(repoRoot: string): {
    profileId: typeof DOCUMENT_PARSER_PROFILE;
    lockDigest: string;
    scriptDigest: string;
    profileDigest: string;
};
export declare function verifyParserImage(context: string, image: string, profile: Pick<DocumentParseManifest, 'profileId' | 'lockDigest' | 'scriptDigest' | 'profileDigest'>): Promise<string>;
/** Validate parser-controlled files before any result gains evidence authority. */
export declare function validateParserOutput(root: string, rawDigest: string, expectedProfileId?: DocumentParserProfile): {
    manifest: ParserOutput;
    manifestBytes: Buffer<ArrayBufferLike>;
    files: Map<string, Buffer<ArrayBufferLike>>;
};
export declare function checkDocumentVersion(source: DocumentVersion['source'], texts: string[]): {
    requestedVersion: string | null;
    observedVersion: string | null;
    versionAssurance: "marker-match" | "unverified";
};
export declare class DocumentParsingService {
    private app;
    private stopped;
    constructor(app: ResearchApp);
    status(actor: Actor, pid?: string): {
        configuration?: {
            dockerContext: string;
            imageDigest: string;
            imageId: string;
            profileId: DocumentParserProfile;
            lockDigest: string;
            scriptDigest: string;
            profileDigest: string;
        } | undefined;
        version: number;
        configured: boolean;
        profileId: string;
        limits: {
            cpus: number;
            memoryMb: number;
            pids: number;
            timeoutSeconds: number;
            workMb: number;
            logBytes: number;
            outputBytes: number;
            maxPages: number;
            maxImageEdge: number;
            textBytes: number;
        };
    };
    configure(actor: Actor, value: unknown, validate?: () => void, key?: string): Promise<{
        configuration?: {
            dockerContext: string;
            imageDigest: string;
            imageId: string;
            profileId: DocumentParserProfile;
            lockDigest: string;
            scriptDigest: string;
            profileDigest: string;
        } | undefined;
        version: number;
        configured: boolean;
        profileId: string;
        limits: {
            cpus: number;
            memoryMb: number;
            pids: number;
            timeoutSeconds: number;
            workMb: number;
            logBytes: number;
            outputBytes: number;
            maxPages: number;
            maxImageEdge: number;
            textBytes: number;
        };
    }>;
    get(actor: Actor, pid: string, id: string): Row<DocumentParseJob>;
    prepare(actor: Actor, pid: string, value: unknown, key?: string): {
        endedAt?: string | undefined;
        startedAt?: string | undefined;
        error?: string | undefined;
        resultId?: string | undefined;
        imageId?: string | undefined;
        id: string;
        jobId: string;
        documentVersionId: string;
        approvalId: string;
        state: import("./parse-types.js").DocumentParseState;
        integrity: "incomplete" | "pending" | "complete" | "invalid";
        manifestDigest: string;
        rawDigest: string;
        profileId: DocumentParserProfile;
        profileDigest: string;
        imageDigest: string;
        dockerContext: string;
        resources: {
            cpus: number;
            memoryMb: number;
            pids: number;
            timeoutSeconds: number;
            workMb: number;
            logBytes: number;
            outputBytes: number;
        };
        generation: number;
        startRequested: boolean;
        cancelRequested: boolean;
        exitCode: number | null;
        artifactIds: string[];
    };
    assertCurrent(job: Row<DocumentParseJob>, verifyBytes?: boolean): Row<DocumentVersion>;
    submit(actor: Actor, pid: string, id: string): {
        endedAt?: string | undefined;
        startedAt?: string | undefined;
        error?: string | undefined;
        resultId?: string | undefined;
        imageId?: string | undefined;
        id: string;
        jobId: string;
        documentVersionId: string;
        approvalId: string;
        state: import("./parse-types.js").DocumentParseState;
        integrity: "incomplete" | "pending" | "complete" | "invalid";
        manifestDigest: string;
        rawDigest: string;
        profileId: DocumentParserProfile;
        profileDigest: string;
        imageDigest: string;
        dockerContext: string;
        resources: {
            cpus: number;
            memoryMb: number;
            pids: number;
            timeoutSeconds: number;
            workMb: number;
            logBytes: number;
            outputBytes: number;
        };
        generation: number;
        startRequested: boolean;
        cancelRequested: boolean;
        exitCode: number | null;
        artifactIds: string[];
    };
    inspect(actor: Actor, pid: string, id: string): {
        endedAt?: string | undefined;
        startedAt?: string | undefined;
        error?: string | undefined;
        resultId?: string | undefined;
        imageId?: string | undefined;
        id: string;
        jobId: string;
        documentVersionId: string;
        approvalId: string;
        state: import("./parse-types.js").DocumentParseState;
        integrity: "incomplete" | "pending" | "complete" | "invalid";
        manifestDigest: string;
        rawDigest: string;
        profileId: DocumentParserProfile;
        profileDigest: string;
        imageDigest: string;
        dockerContext: string;
        resources: {
            cpus: number;
            memoryMb: number;
            pids: number;
            timeoutSeconds: number;
            workMb: number;
            logBytes: number;
            outputBytes: number;
        };
        generation: number;
        startRequested: boolean;
        cancelRequested: boolean;
        exitCode: number | null;
        artifactIds: string[];
    };
    cancel(actor: Actor, pid: string, id: string): {
        endedAt?: string | undefined;
        startedAt?: string | undefined;
        error?: string | undefined;
        resultId?: string | undefined;
        imageId?: string | undefined;
        id: string;
        jobId: string;
        documentVersionId: string;
        approvalId: string;
        state: import("./parse-types.js").DocumentParseState;
        integrity: "incomplete" | "pending" | "complete" | "invalid";
        manifestDigest: string;
        rawDigest: string;
        profileId: DocumentParserProfile;
        profileDigest: string;
        imageDigest: string;
        dockerContext: string;
        resources: {
            cpus: number;
            memoryMb: number;
            pids: number;
            timeoutSeconds: number;
            workMb: number;
            logBytes: number;
            outputBytes: number;
        };
        generation: number;
        startRequested: boolean;
        cancelRequested: boolean;
        exitCode: number | null;
        artifactIds: string[];
    };
    result(actor: Actor, pid: string, id: string): Row<DocumentParseResult>;
    /** Internal integrity check, not an owner-tool impersonation or an Agent content endpoint. */
    private fixedResult;
    /** Fixed source proof shared by metadata selection and narrowly approved visual reads. */
    visualSource(pid: string, documentVersionId: string, parseResultId: string, firstPage: number, lastPage: number): {
        documentVersionId: string;
        parseResultId: string;
        documentDigest: string;
        resultDigest: string;
        rawDigest: string;
        jobId: string;
        manifestDigest: string;
        manifestArtifactDigest: string;
        approvalId: string;
        firstPage: number;
        lastPage: number;
        pageCount: number;
        pages: {
            pageNumber: number;
            artifactId: string;
            digest: string;
            bytes: number;
            width: number;
            height: number;
        }[];
    };
    attachmentMetadata(actor: Actor, session: Row<Session>, pair: {
        documentVersionId: string;
        parseResultId: string;
    }): Required<Pick<MessageAttachment, 'parseResultId' | 'resultDigest' | 'pageCount'>>;
    pageImage(pid: string, documentVersionId: string, parseResultId: string, pageNumber: number, firstPage: number, lastPage: number): {
        data: string;
        pageNumber: number;
        artifactId: string;
        digest: string;
        bytes: number;
        width: number;
        height: number;
    };
    readPageImage(actor: Actor, pid: string, input: Record<string, unknown>): {
        reference: {
            documentVersionId: unknown;
            parseResultId: unknown;
            pageNumber: number;
            digest: string;
            bytes: number;
            width: number;
            height: number;
            actionId: string;
            firstPage: number;
            lastPage: number;
            kind: string;
        };
        mimeType: string;
        data: string;
    };
    pages(actor: Actor, pid: string, id: string, cursor?: number, limit?: number): {
        resultId: string;
        documentVersionId: string;
        rawDigest: string;
        pageCount: number;
        quality: {
            readingOrder: "unverified";
            paragraphs: "heuristic";
            tables: "unknown";
            figures: "unknown";
            ocr: false;
            score: null;
        };
        versionAssurance: "marker-match" | "unverified";
        requestedVersion: string | null;
        observedVersion: string | null;
        items: DocumentPage[];
        cursor: number;
        end: number;
        complete: boolean;
    };
    readPage(actor: Actor, pid: string, resultId: string, pageNumber: number, cursor?: number, limit?: number): {
        content: string;
        cursor: number;
        end: number;
        complete: boolean;
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
        paragraphs: import("./parse-types.js").DocumentParagraph[];
        textStatus: "text-extracted" | "no-text-layer";
        imageCandidates?: import("./parse-types.js").DocumentImageCandidate[];
        resultId: string;
        documentVersionId: string;
        rawDigest: string;
    };
    finalize(id: string, result: {
        state: 'succeeded' | 'failed' | 'cancelled' | 'timed_out';
        exitCode: number | null;
        incomplete?: boolean;
        logTruncated?: boolean;
        error?: string;
        generation?: number;
    }): Row<DocumentParseJob>;
    tick(): void;
    stop(): Promise<void>;
}
