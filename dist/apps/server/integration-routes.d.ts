import type { ResearchApp } from '../../packages/research-app.js';
export declare function readIntegrationRoute(app: ResearchApp, path: string, url: URL): unknown;
export declare function writeIntegrationRoute(app: ResearchApp, path: string, body: unknown): unknown;
/** This asynchronous branch must run outside Store.operation's synchronous transaction. */
export declare function asyncIntegrationRoute(app: ResearchApp, path: string, body: unknown, key: string, signal: AbortSignal): Promise<unknown>;
