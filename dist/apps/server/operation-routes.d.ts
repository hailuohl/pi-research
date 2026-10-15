import type { ResearchApp } from '../../packages/research-app.js';
/** Transport fields never become an Actor or an operation argument. */
export declare function operationRoute(app: ResearchApp, path: string, body: unknown, key: string | undefined, signal: AbortSignal, method: string, query: string): {
    result: unknown;
} | undefined;
