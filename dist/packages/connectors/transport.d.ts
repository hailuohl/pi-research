export declare const DEFAULT_CONNECTOR_TIMEOUT_MS = 12000;
export declare const PAPER_READ_TIMEOUT_MS = 60000;
export declare const SEARCH_OPERATION_TIMEOUT_MS = 65000;
export declare const SEARCH_RPC_TIMEOUT_MS = 75000;
export declare const SEARCH_NETWORK_POLICY: {
    readonly networkTimeoutMs: 30000;
};
export type TransportTimeout = number | typeof SEARCH_NETWORK_POLICY;
export type ConnectorFailureStage = 'queue' | 'rate-limit' | 'headers' | 'body' | 'validation';
export interface ConnectorObservation {
    httpStatus?: number;
    retryAfter?: string | null;
    sentAt?: string;
    headersAt?: string;
    finishedAt?: string;
    receivedBytes?: number;
    failureStage?: ConnectorFailureStage;
}
/** The deadline stops external work; publication independently checks caller and authorization. */
export declare function searchDeadline(caller?: AbortSignal): {
    signal: AbortSignal;
    expired: () => boolean;
    checkCaller: () => void;
    check: () => void;
    dispose: () => void;
};
export interface Credentials {
    openalexKey?: string;
    ncbiKey?: string;
    email?: string;
}
export interface TransportOptions {
    fetcher?: typeof fetch;
    minIntervalMs?: number;
}
/** Fixed HTTPS hosts, no redirects/proxies supplied by agents, bounded bodies and no implicit retries. */
export declare class ConnectorTransport {
    private fetcher;
    private active;
    private ncbiNext;
    private interval;
    constructor(options?: TransportOptions);
    bytes(url: URL, headers: Record<string, string>, validate: () => void, maxBytes?: number, signal?: AbortSignal, observe?: (value: ConnectorObservation) => void, beforeSend?: () => void, timeoutMs?: TransportTimeout): Promise<{
        body: Buffer<ArrayBuffer>;
        bytes: number;
        contentType: string;
        status: number;
        rateLimitRemaining: string | null;
    }>;
    text(url: URL, headers: Record<string, string>, validate: () => void, maxBytes?: number, signal?: AbortSignal, observe?: (value: ConnectorObservation) => void, beforeSend?: () => void, timeoutMs?: TransportTimeout): Promise<{
        text: string;
        body: Buffer<ArrayBuffer>;
        bytes: number;
        contentType: string;
        status: number;
        rateLimitRemaining: string | null;
    }>;
}
