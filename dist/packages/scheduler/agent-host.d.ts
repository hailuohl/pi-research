import { fork, type ChildProcess } from 'node:child_process';
import type { ResearchApp } from '../research-app.js';
import type { Actor, Session, Row, ModelConfig } from '../domain/types.js';
import { ToolDispatcher } from '../research-tools/dispatcher.js';
import { type ToolDiagnostic } from '../pi-adapter/tool-diagnostic.js';
interface Active {
    catalogFingerprint: string;
    admissionId: string;
    child: ChildProcess;
    sessionId: string;
    generation: number;
    actor: Actor;
    currentMessageId?: string | null;
    callIdActors?: Map<string, {
        tool: string;
        actor: Actor;
    }>;
    messageIds: string[];
    consumedIds: Set<string>;
    attemptId?: string;
    lastHeartbeat: number;
    sent: Set<string>;
    ended: boolean;
    exitObserved?: boolean;
    providerError?: string;
    pendingEmptyLength?: string;
    contextRecoveryEligible?: boolean;
    stopError?: string;
    assistantOutput?: boolean;
    failedToolCalls?: Set<string>;
    toolErrors?: Map<string, {
        tool: string;
        code: string;
        pendingActionId?: string;
        diagnostic?: ToolDiagnostic;
        diagnosticId?: string;
    }>;
    contextMessageIds?: string[];
    advertisedTools?: Set<string>;
    approvalNoticeId?: string;
    currentApprovalNoticeMessageId?: string;
    deltaTail?: string;
}
/** Dependency injection is in-process test infrastructure only; HTTP/config never select a replacement worker. */
interface HostDependencies {
    inspect?: (repoRoot: string, model: ModelConfig) => {
        ready: boolean;
        code: string;
        message: string;
    };
    workerEntry?: string;
    fork?: typeof fork;
}
export declare class AgentHost {
    private app;
    private dependencies;
    private redact;
    private clean;
    readonly tools: ToolDispatcher;
    readonly active: Map<string, Active>;
    private timer?;
    private ticking;
    private stopped;
    private readonly ownerHost;
    private readonly admission;
    constructor(app: ResearchApp, dependencies?: HostDependencies);
    private inspect;
    status(): {
        activeWorkers: number;
        maxModelWorkers: null;
        workerCapacity: import("./agent-admission.js").AgentCapacityDTO;
        workerUnit: string;
        httpConcurrencyMeasured: boolean;
        toolIsolation: string;
        osSandboxVerified: boolean;
        hostAccess: {
            available: boolean;
            boundary: string;
            requiresExplicitSessionEnable: boolean;
            revokedOnRestart: boolean;
        };
        ready: boolean;
        code: string;
        message: string;
    };
    start(): void;
    ensureReady(session: Row<Session>): void;
    tick(): void;
    private claimSession;
    private launch;
    private exited;
    private valid;
    private pendingSessionAction;
    private advertisedTools;
    private contextRecoveryEligible;
    private onMessage;
    private failInput;
    private sendInput;
    private savePath;
    private abortProcess;
    private finish;
    stop(): Promise<void>;
}
export {};
