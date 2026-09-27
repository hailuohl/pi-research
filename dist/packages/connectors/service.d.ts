/** Bounded, host-owned literature adapters. No ORX CLI, hosted account or model calls. */
import type { AppContext } from '../domain/context.js';
import type { Actor } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
import { deduplicate, type SourceId } from './contracts.js';
import { ConnectorTransport, type Credentials } from './transport.js';
export interface SearchRecord {
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
    request: unknown;
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
        })[];
        budgetUnit: string;
        defaults: string;
        enabled: Record<SourceId, boolean>;
        requestLimit: number;
        version: number;
    };
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
        })[];
        budgetUnit: string;
        defaults: string;
        enabled: Record<SourceId, boolean>;
        requestLimit: number;
        version: number;
    };
    private authorize;
    private bound;
    private request;
    private once;
    discover(actor: Actor, pid: string, value: unknown, key: string, callback?: () => void, signal?: AbortSignal): Promise<import("../domain/types.js").Row<SearchRecord>>;
    paper(actor: Actor, pid: string, value: unknown, key: string, callback?: () => void, signal?: AbortSignal): Promise<import("../domain/types.js").Row<{
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
}
