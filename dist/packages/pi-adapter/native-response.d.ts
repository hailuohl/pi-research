import type { ModelApi } from './model-management-types.js';
export interface NativeCitation {
    url: string;
    title: string;
    startIndex?: number;
    endIndex?: number;
    citedText?: string;
}
export interface NativeSearchCall {
    id?: string;
    status: string;
    query?: string;
    queries?: string[];
    action?: string;
    targetUrl?: string;
    pattern?: string;
    sources: NativeCitation[];
    error?: string;
}
export interface NativeResponse {
    text: string;
    citations: NativeCitation[];
    searchCalls: NativeSearchCall[];
    usage: Record<string, number>;
    responseId?: string;
    stopReason: string;
    status: 'completed' | 'incomplete';
    continuation?: unknown[];
    continuationUnavailable?: string;
}
/** Keep provider citations as untrusted links; they do not establish locally verified evidence. */
export declare function parseNativeResponse(api: ModelApi, value: unknown, redact?: (value: string) => string): NativeResponse;
