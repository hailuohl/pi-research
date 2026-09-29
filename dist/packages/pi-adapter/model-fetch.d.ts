/** Count the HTTP transport lifetime, including the streamed body, rather than an SDK turn. */
export declare function managedModelFetch(fetcher: typeof fetch, acquire: (key: string) => Promise<{
    allowed: boolean;
}>, finish: (key: string, value: {
    state: 'succeeded' | 'failed' | 'cancelled';
    httpStatus?: number;
    receivedBytes?: number;
}) => Promise<unknown>, stop: AbortSignal): typeof fetch;
