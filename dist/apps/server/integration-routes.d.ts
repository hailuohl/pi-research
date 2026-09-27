import type { ResearchApp } from '../../packages/research-app.js';
export declare function readIntegrationRoute(app: ResearchApp, path: string, url: URL): unknown;
export declare function writeIntegrationRoute(app: ResearchApp, path: string, body: unknown): unknown;
/** This asynchronous branch must run outside Store.operation's synchronous transaction. */
export declare function asyncIntegrationRoute(app: ResearchApp, path: string, body: unknown, key: string, signal: AbortSignal): Promise<import("../../packages/domain/types.js").Row<import("../../packages/connectors/service.js").SearchRecord> | import("../../packages/domain/types.js").Row<{
    source: "alphaxiv" | "openalex" | "biorxiv" | "pubmed" | "crossref";
    idInSource: string;
    requestedId: string;
    title: string;
    sourceUrl: string;
    contentKind: "metadata" | "abstract" | "full_text";
    versionAssurance: "requested-address-unverified" | "provider-record";
    pageMapping: "unavailable";
    artifactId: string;
    artifactDigest: string;
    rawArtifactIds: string[];
    fullTextRead: boolean;
    retrievedAt: string;
    scopeSessionId: string | null;
    scopeAttemptId: string | null;
    sourceResponses: {
        url: string;
        contentType: string;
    }[];
    limitations: string[];
}>>;
