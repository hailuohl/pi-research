import { type Hit, type SourceId, type SearchInput, type PaperContent } from './contracts.js';
import type { Credentials } from './transport.js';
export type Request = (url: URL, headers?: Record<string, string>) => Promise<{
    text: string;
    bytes: number;
    contentType: string;
}>;
export interface ProviderPage {
    hits: Hit[];
    rawItemCount: number;
    nextCursor: string | null;
}
/** Exact official routes only; never follow a provider-supplied publisher URL. */
export declare function pdfTarget(source: SourceId, rawId: string, requestedVersion: string | undefined, credentials: Credentials): {
    url: URL;
    resolvedId: string;
    requestedVersion: string;
    versionAssurance: string;
} | {
    url: URL;
    resolvedId: string;
    requestedVersion: null;
    versionAssurance: string;
};
export declare function searchProvider(source: SourceId, q: SearchInput, request: Request, credentials: Credentials): Promise<Hit[]>;
export declare function searchOpenAlexPage(q: SearchInput, cursor: string, request: Request, credentials: Credentials): Promise<ProviderPage>;
export declare function searchCrossrefPage(q: SearchInput, cursor: string, request: Request): Promise<ProviderPage>;
export declare function readProvider(source: SourceId, id: string, request: Request, credentials: Credentials): Promise<PaperContent>;
