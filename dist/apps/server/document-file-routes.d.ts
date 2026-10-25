import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ResearchApp } from '../../packages/research-app.js';
export declare const DOCUMENT_UPLOAD_TIMEOUT_MS: number;
/** Owner-only binary transport; deliberately separate from the legacy JSON operation and agent tool registry. */
export declare function documentFileRoute(app: ResearchApp, route: string, url: URL, req: IncomingMessage, res: ServerResponse): Promise<{
    result: unknown;
} | undefined>;
