import { type Hit, type SourceId, type SearchInput, type PaperContent } from './contracts.js';
import type { Credentials } from './transport.js';
export type Request = (url: URL, headers?: Record<string, string>) => Promise<{
    text: string;
    bytes: number;
    contentType: string;
}>;
export declare function searchProvider(source: SourceId, q: SearchInput, request: Request, credentials: Credentials): Promise<Hit[]>;
export declare function readProvider(source: SourceId, id: string, request: Request, credentials: Credentials): Promise<PaperContent>;
