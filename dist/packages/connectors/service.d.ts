import type { DiscoveryGrantReference } from '../policy/discovery-grant-types.js';
/** Bounded, host-owned literature adapters. No ORX CLI, hosted account or model calls. */
import type { AppContext } from '../domain/context.js';
import type { Actor, Row } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
import { deduplicate, type SearchInput, type SourceId } from './contracts.js';
import { ConnectorTransport, type Credentials } from './transport.js';
export interface SearchPageRequest {
    number: number;
    previousSearchId: string | null;
    cursor: string;
    expiresAt: string | null;
}
export interface SearchPageRecord extends SearchPageRequest {
    nextCursor: string | null;
    nextCursorExpiresAt: string | null;
    rawItemCount: number;
}
export interface SearchRecord {
    discoveryGrant?: DiscoveryGrantReference;
    discoveryCallIds?: string[];
    discoveryRequestDigest?: string;
    query: string;
    items: ReturnType<typeof deduplicate>;
    sources: {
        source: SourceId;
        status: 'succeeded' | 'failed' | 'disabled';
        count: number;
        error?: string;
    }[];
    status: 'complete' | 'partial';
    scopeSessionId: string | null;
    scopeTaskId: string | null;
    scopeAttemptId: string | null;
    settingsVersion: number;
    request: SearchInput;
    page?: SearchPageRecord;
    retrievedAt: string;
    coverage: string;
}
export declare class ConnectorService {
    private c;
    private evidence;
    private transport;
    private credentials;
    private inFlight;
    constructor(c: AppContext, evidence: EvidenceService, options?: {
        transport?: ConnectorTransport;
        credentials?: () => Credentials;
    });
    settings(actor: Actor, pid: string): {
        requestsUsed: number;
        credentials: {
            openalexKeyConfigured: boolean;
            ncbiKeyConfigured: boolean;
            ncbiEmailConfigured: boolean;
        };
        capabilities: ({
            id: string;
            category: string;
            operations: string[];
            implementation: string;
            verification: string;
            credential: string;
            content: string;
            limitation?: undefined;
        } | {
            id: string;
            category: string;
            operations: string[];
            implementation: string;
            verification: string;
            credential: string;
            content?: undefined;
            limitation?: undefined;
        } | {
            id: string;
            category: string;
            operations: string[];
            implementation: string;
            verification: string;
            limitation: string;
            credential?: undefined;
            content?: undefined;
        } | {
            id: string;
            category: string;
            operations: string[];
            implementation: string;
            verification: string;
            credential: string;
            limitation: string;
            content?: undefined;
        })[];
        budgetUnit: string;
        defaults: string;
        enabled: Record<SourceId, boolean>;
        requestLimit: number;
        version: number;
    };
    observations(actor: Actor, pid: string): {
        id: any;
        source: any;
        host: any;
        status: any;
        startedAt: any;
        httpStatus: any;
        retryAfter: any;
        error: any;
    }[];
    configure(actor: Actor, pid: string, value: unknown): {
        requestsUsed: number;
        credentials: {
            openalexKeyConfigured: boolean;
            ncbiKeyConfigured: boolean;
            ncbiEmailConfigured: boolean;
        };
        capabilities: ({
            id: string;
            category: string;
            operations: string[];
            implementation: string;
            verification: string;
            credential: string;
            content: string;
            limitation?: undefined;
        } | {
            id: string;
            category: string;
            operations: string[];
            implementation: string;
            verification: string;
            credential: string;
            content?: undefined;
            limitation?: undefined;
        } | {
            id: string;
            category: string;
            operations: string[];
            implementation: string;
            verification: string;
            limitation: string;
            credential?: undefined;
            content?: undefined;
        } | {
            id: string;
            category: string;
            operations: string[];
            implementation: string;
            verification: string;
            credential: string;
            limitation: string;
            content?: undefined;
        })[];
        budgetUnit: string;
        defaults: string;
        enabled: Record<SourceId, boolean>;
        requestLimit: number;
        version: number;
    };
    assertAuthorized(actor: Actor, pid: string): void;
    private bound;
    private request;
    private once;
    discover(actor: Actor, pid: string, value: unknown, key: string, callback?: () => void, signal?: AbortSignal): Promise<Row<SearchRecord>>;
    discoverPage(actor: Actor, pid: string, searchValue: unknown, pageValue: unknown, key: string, callback?: () => void, signal?: AbortSignal): Promise<Row<SearchRecord>>;
    paper(actor: Actor, pid: string, value: unknown, key: string, callback?: () => void, signal?: AbortSignal): Promise<Row<{
        pageMapping: "unavailable";
        artifactId: string;
        artifactDigest: string;
        rawArtifactIds: string[];
        fullTextRead: boolean;
        retrievedAt: string;
        scopeSessionId: string | null;
        scopeTaskId: string | null;
        scopeAttemptId: string | null;
        sourceResponses: {
            url: string;
            contentType: string;
        }[];
        limitations: string[];
        license?: string | undefined;
        resolvedId?: string | undefined;
        reportedVersion?: string | undefined;
        source: "alphaxiv" | "openalex" | "biorxiv" | "pubmed" | "crossref";
        idInSource: string;
        requestedId: string;
        title: string;
        sourceUrl: string;
        contentKind: "metadata" | "abstract" | "full_text";
        versionAssurance: "requested-address-unverified" | "provider-record";
        discoveryGrant: DiscoveryGrantReference;
        discoveryCallIds: string[];
        discoveryRequestDigest: string;
    } | {
        pageMapping: "unavailable";
        artifactId: string;
        artifactDigest: string;
        rawArtifactIds: string[];
        fullTextRead: boolean;
        retrievedAt: string;
        scopeSessionId: string | null;
        scopeTaskId: string | null;
        scopeAttemptId: string | null;
        sourceResponses: {
            url: string;
            contentType: string;
        }[];
        limitations: string[];
        license?: string | undefined;
        resolvedId?: string | undefined;
        reportedVersion?: string | undefined;
        source: "alphaxiv" | "openalex" | "biorxiv" | "pubmed" | "crossref";
        idInSource: string;
        requestedId: string;
        title: string;
        sourceUrl: string;
        contentKind: "metadata" | "abstract" | "full_text";
        versionAssurance: "requested-address-unverified" | "provider-record";
        discoveryGrant?: undefined;
        discoveryCallIds?: undefined;
        discoveryRequestDigest?: undefined;
    }>>;
    /** Owner-only two-step PubMed-to-PMC full text. Each EFetch call is reserved before send and never retried implicitly. */
    oaFullText(actor: Actor, pid: string, value: {
        source: 'pubmed';
        id: string;
    }, key: string, callback?: () => void, signal?: AbortSignal): Promise<Row<{
        source: string;
        idInSource: string;
        requestedId: string;
        resolvedId: string;
        title: string;
        sourceUrl: string;
        contentKind: string;
        versionAssurance: string;
        reportedVersion: string;
        pmcTextProfile: import("./pmc.js").PmcTextProfile;
        license: string;
        pageMapping: string;
        artifactId: string;
        artifactDigest: string;
        rawArtifactIds: string[];
        fullTextRead: boolean;
        retrievedAt: string;
        scopeSessionId: null;
        scopeTaskId: null;
        scopeAttemptId: null;
        sourceResponses: {
            url: string;
            contentType: string;
        }[];
        limitations: string[];
        discoveryGrant: DiscoveryGrantReference;
        discoveryCallIds: string[];
        discoveryRequestDigest: string;
    } | {
        source: string;
        idInSource: string;
        requestedId: string;
        resolvedId: string;
        title: string;
        sourceUrl: string;
        contentKind: string;
        versionAssurance: string;
        reportedVersion: string;
        pmcTextProfile: import("./pmc.js").PmcTextProfile;
        license: string;
        pageMapping: string;
        artifactId: string;
        artifactDigest: string;
        rawArtifactIds: string[];
        fullTextRead: boolean;
        retrievedAt: string;
        scopeSessionId: null;
        scopeTaskId: null;
        scopeAttemptId: null;
        sourceResponses: {
            url: string;
            contentType: string;
        }[];
        limitations: string[];
        discoveryGrant?: undefined;
        discoveryCallIds?: undefined;
        discoveryRequestDigest?: undefined;
    }>>;
    /** Host-facing acquisition used by durable tasks; callback retains their original authorization fence. */
    pdf(actor: Actor, pid: string, value: {
        source: SourceId;
        id: string;
        requestedVersion?: string;
    }, key: string, callback?: () => void, signal?: AbortSignal): Promise<Row<{
        source: "alphaxiv" | "openalex" | "biorxiv" | "pubmed" | "crossref";
        idInSource: string;
        requestedId: string;
        resolvedId: string;
        requestedVersion: string | null;
        title: string;
        sourceUrl: string;
        contentKind: string;
        versionAssurance: string;
        pageMapping: string;
        artifactId: string;
        artifactDigest: string;
        rawArtifactIds: string[];
        fullTextRead: boolean;
        retrievedAt: string;
        scopeSessionId: string | null;
        scopeTaskId: string | null;
        limitations: string[];
        discoveryGrant: DiscoveryGrantReference;
        discoveryCallIds: string[];
        discoveryRequestDigest: string;
    } | {
        source: "alphaxiv" | "openalex" | "biorxiv" | "pubmed" | "crossref";
        idInSource: string;
        requestedId: string;
        resolvedId: string;
        requestedVersion: string | null;
        title: string;
        sourceUrl: string;
        contentKind: string;
        versionAssurance: string;
        pageMapping: string;
        artifactId: string;
        artifactDigest: string;
        rawArtifactIds: string[];
        fullTextRead: boolean;
        retrievedAt: string;
        scopeSessionId: string | null;
        scopeTaskId: string | null;
        limitations: string[];
        discoveryGrant?: undefined;
        discoveryCallIds?: undefined;
        discoveryRequestDigest?: undefined;
    }>>;
}
