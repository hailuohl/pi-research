import type { AppContext } from '../domain/context.js';
import type { Actor, Row } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
import type { ConnectorService } from '../connectors/service.js';
import type { DocumentVersion, DocumentAcquireInput, LiteratureDocumentAcquireInput, DocumentStreamInput, DocumentTextPageInput } from './types.js';
export declare class DocumentService {
    private c;
    private evidence;
    private connectors;
    constructor(c: AppContext, evidence: EvidenceService, connectors: ConnectorService);
    get(actor: Actor, pid: string, id: string): Row<DocumentVersion>;
    inspect(actor: Actor, pid: string, id: string): Row<DocumentVersion>;
    private verify;
    private textSource;
    importStream(actor: Actor, pid: string, value: DocumentStreamInput, input: AsyncIterable<Uint8Array>, key: string, signal?: AbortSignal): Promise<Row<DocumentVersion>>;
    readText(actor: Actor, pid: string, id: string, input: DocumentTextPageInput): {
        utf16Start?: number | undefined;
        utf16End?: number | undefined;
        content: string;
        cursor: number;
        end: number;
        totalBytes: number;
        complete: boolean;
        documentVersionId: string;
        sourceDigest: string;
        cursorUnit: "utf8-byte";
        integrityScope: "delivered-blocks";
    };
    list(actor: Actor, pid: string, input?: {
        cursor?: number;
        limit?: number;
    }): {
        items: Row<DocumentVersion>[];
        cursor: number;
        hasMore: boolean;
    };
    import(actor: Actor, pid: string, value: {
        title: string;
        mediaType: string;
        contentBase64: string;
        license?: string;
    }, key: string): Row<DocumentVersion>;
    createFromPaper(actor: Actor, pid: string, paperReadId: string, key: string): Row<DocumentVersion>;
    private stagePaper;
    acquire(actor: Actor, pid: string, input: DocumentAcquireInput | LiteratureDocumentAcquireInput, key: string, validate?: () => void, signal?: AbortSignal): Promise<Row<DocumentVersion>>;
    private descriptor;
    private publish;
}
