import type { ResearchApp } from '../research-app.js';
import type { Actor, ModelConfig, Row } from '../domain/types.js';
import type { DocumentSourceRef } from '../text-evidence/service.js';
import { Store } from '../storage/store.js';
export interface TextCorpusGrantReference {
    id: string;
    digest: string;
    approvalId: string;
}
export interface TextCorpusGrant {
    sessionId: string;
    model: ModelConfig;
    corpusId: string;
    configurationVersion: number;
    documents: Array<{
        documentVersionId: string;
        parseResultId: string;
        sourceDigest: string;
    }>;
    pmcDocuments?: Array<{
        documentVersionId: string;
        sourceDigest: string;
    }>;
    maxSearches: number;
    expiresAt: string;
    approvalId: string;
    digest: string;
    state: 'draft' | 'active' | 'revoked';
    activatedAt?: string;
    revokedAt?: string;
}
export interface TextCorpusGrantUse {
    grantId: string;
    grantDigest: string;
    sessionId: string;
    requestDigest: string;
    searchId: string;
}
export type TextCorpusGrantDTO = Row<TextCorpusGrant> & {
    effectiveState: 'draft' | 'active' | 'revoked' | 'stale' | 'expired' | 'exhausted';
    validity: 'current' | 'stale';
    reasons: string[];
    usage: {
        limit: number;
        used: number;
        remaining: number;
        unit: 'search';
    };
    uses: Array<Row<TextCorpusGrantUse>>;
    searchResults: Array<Row>;
};
export declare const textCorpusGrantReference: (g: Row<TextCorpusGrant>) => TextCorpusGrantReference;
/** Metadata only: reject stale authority before opening any original or page file. */
export declare function assertCorpusDocument(store: Store, pid: string, ref: DocumentSourceRef): void;
export declare function assertTextCorpusGrantActor(store: Store, actor: Actor, pid: string, reference?: TextCorpusGrantReference): Row<TextCorpusGrant>;
/** A PDF grant never permits reading an entire parser artifact through a generic tool. */
export declare function isPdfArtifact(store: Store, pid: string, id: string): boolean;
export declare function assertPdfArtifactRead(store: Store, actor: Actor, pid: string, id: string): void;
export declare class TextCorpusGrantService {
    private app;
    constructor(app: ResearchApp);
    inspect(actor: Actor, pid: string, id: string): TextCorpusGrantDTO;
    prepare(actor: Actor, pid: string, value: unknown): TextCorpusGrantDTO;
    activate(actor: Actor, pid: string, value: unknown): TextCorpusGrantDTO;
    revoke(actor: Actor, pid: string, value: unknown): TextCorpusGrantDTO;
    authorizeContent(actor: Actor, pid: string, name: string, x: Record<string, unknown>): void;
}
