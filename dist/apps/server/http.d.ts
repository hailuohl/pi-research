import http from 'node:http';
import { ResearchApp } from '../../packages/research-app.js';
import { AgentHost } from '../../packages/scheduler/agent-host.js';
export interface ServerOptions {
    dataDir: string;
    repoRoot: string;
    port?: number;
    computeMonitoring?: boolean;
}
export declare function createHttpServer(options: ServerOptions): {
    app: ResearchApp;
    host: AgentHost;
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    listen: () => Promise<number>;
    close: () => Promise<void>;
};
