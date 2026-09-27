import type { ResearchApp } from '../../packages/research-app.js';
import type { AgentHost } from '../../packages/scheduler/agent-host.js';
export declare function readRoute(app: ResearchApp, host: AgentHost, path: string, url: URL): unknown;
export declare function writeRoute(app: ResearchApp, host: AgentHost, path: string, body: unknown, method?: string): unknown;
