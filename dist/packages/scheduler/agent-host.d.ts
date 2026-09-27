import { type ChildProcess } from 'node:child_process';
import type { ResearchApp } from '../research-app.js';
import type { Actor, Session, Row, ModelConfig } from '../domain/types.js';
import { ToolDispatcher } from '../research-tools/dispatcher.js';
interface Active {
    child: ChildProcess;
    sessionId: string;
    generation: number;
    actor: Actor;
    messageIds: string[];
    attemptId?: string;
    started: number;
    lastHeartbeat: number;
    sent: Set<string>;
    ended: boolean;
    providerError?: string;
    assistantOutput?: boolean;
    contextMessageIds?: string[];
}
/** Dependency injection is in-process test infrastructure only; HTTP/config never select a replacement worker. */
interface HostDependencies {
    inspect?: (repoRoot: string, model: ModelConfig) => {
        ready: boolean;
        code: string;
        message: string;
    };
    workerEntry?: string;
}
export declare class AgentHost {
    private app;
    private dependencies;
    readonly tools: ToolDispatcher;
    readonly active: Map<string, Active>;
    private timer?;
    private ticking;
    private stopped;
    constructor(app: ResearchApp, dependencies?: HostDependencies);
    private inspect;
    status(): {
        activeWorkers: number;
        maxModelWorkers: number;
        toolIsolation: string;
        osSandboxVerified: boolean;
        ready: boolean;
        code: string;
        message: string;
    };
    start(): void;
    ensureReady(session: Row<Session>): void;
    tick(): void;
    private launch;
    private valid;
    private onMessage;
    private savePath;
    private abortProcess;
    private finish;
    stop(): Promise<void>;
}
export {};
