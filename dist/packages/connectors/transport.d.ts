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
    bytes(url: URL, headers: Record<string, string>, validate: () => void, maxBytes?: number, signal?: AbortSignal, observe?: (value: {
        httpStatus: number;
        retryAfter: string | null;
    }) => void): Promise<{
        body: Buffer<ArrayBuffer>;
        bytes: number;
        contentType: string;
        status: number;
        rateLimitRemaining: string | null;
    }>;
    text(url: URL, headers: Record<string, string>, validate: () => void, maxBytes?: number, signal?: AbortSignal, observe?: (value: {
        httpStatus: number;
        retryAfter: string | null;
    }) => void): Promise<{
        text: string;
        body: Buffer<ArrayBuffer>;
        bytes: number;
        contentType: string;
        status: number;
        rateLimitRemaining: string | null;
    }>;
}
