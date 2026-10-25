import type { Store } from '../storage/store.js';
import type { Actor, Row } from '../domain/types.js';
export interface ResearchAutomationPolicy {
    version: 2;
    limits: {
        development: number | null;
        run: number | null;
        continuations: number | null;
        durationMs: number | null;
    };
    recoverAfterRestart: boolean;
}
export interface HostAccessGrant {
    automaticApprovalScope?: 1;
    automaticApprovalAcknowledgedAt?: string;
    researchAutomationScope?: 1 | 2;
    researchAutomationPolicy?: ResearchAutomationPolicy;
    researchAutomationAcknowledgedAt?: string;
    sessionId: string;
    epoch: number;
    runtimeId: string;
    state: 'pending' | 'enabled' | 'revoked';
    boundary: 'trusted-host';
    acknowledgedSameUserAccess: true;
    acknowledgedUnknownJobIds?: string[];
}
export interface HostCommand {
    sessionId: string;
    generation: number;
    epoch: number;
    runtimeId: string;
    requestDigest: string;
    argv: string[];
    cwd: string;
    timeoutMs: number;
    state: 'starting' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'unknown';
    pid?: number;
    stdout: string;
    stderr: string;
    outputTruncated: boolean;
    exitCode?: number | null;
    error?: string;
}
/** Trusted same-user host execution, deliberately NOT an OS sandbox or owner-auth boundary. */
export declare class HostAccessService {
    private c;
    onChanged?: (sessionId: string, previousHostEpoch?: number) => void;
    private readonly runtimeId;
    researchRuntimeId(): `${string}-${string}-${string}-${string}-${string}`;
    private readonly active;
    private readonly uncertain;
    private stopping;
    private closing;
    constructor(c: {
        store: Store;
        dataDir: string;
        repoRoot: string;
        sessionHeld: (sessionId: string) => boolean;
    });
    private jobs;
    private hasUnreviewed;
    status(actor: Actor, sessionId: string): {
        automaticApprovalScope: number;
        researchAutomation: boolean;
        researchAutomationScope: number;
        researchAutomationPolicy: ResearchAutomationPolicy | undefined;
        sessionId: string;
        version: number;
        epoch: number;
        available: boolean;
        enabled: boolean;
        pending: boolean;
        boundary: "trusted-host";
        osSandboxVerified: boolean;
        reason: string;
        revokedOnRestart: boolean;
        activeCommands: number;
        unknownCommands: number;
        jobs: {
            id: string;
            state: "succeeded" | "failed" | "cancelled" | "unknown" | "running" | "starting";
            pid: number | undefined;
            exitCode: number | null | undefined;
            error: string | undefined;
            createdAt: string;
            epoch: number;
        }[];
    };
    private session;
    private executionActive;
    enable(actor: Actor, id: string, input: unknown): {
        automaticApprovalScope: number;
        researchAutomation: boolean;
        researchAutomationScope: number;
        researchAutomationPolicy: ResearchAutomationPolicy | undefined;
        sessionId: string;
        version: number;
        epoch: number;
        available: boolean;
        enabled: boolean;
        pending: boolean;
        boundary: "trusted-host";
        osSandboxVerified: boolean;
        reason: string;
        revokedOnRestart: boolean;
        activeCommands: number;
        unknownCommands: number;
        jobs: {
            id: string;
            state: "succeeded" | "failed" | "cancelled" | "unknown" | "running" | "starting";
            pid: number | undefined;
            exitCode: number | null | undefined;
            error: string | undefined;
            createdAt: string;
            epoch: number;
        }[];
    };
    activatePending(id: string): boolean;
    revoke(actor: Actor, id: string, input: unknown): {
        automaticApprovalScope: number;
        researchAutomation: boolean;
        researchAutomationScope: number;
        researchAutomationPolicy: ResearchAutomationPolicy | undefined;
        sessionId: string;
        version: number;
        epoch: number;
        available: boolean;
        enabled: boolean;
        pending: boolean;
        boundary: "trusted-host";
        osSandboxVerified: boolean;
        reason: string;
        revokedOnRestart: boolean;
        activeCommands: number;
        unknownCommands: number;
        jobs: {
            id: string;
            state: "succeeded" | "failed" | "cancelled" | "unknown" | "running" | "starting";
            pid: number | undefined;
            exitCode: number | null | undefined;
            error: string | undefined;
            createdAt: string;
            epoch: number;
        }[];
    };
    assertAgent(actor: Actor, epoch?: number): Row<HostAccessGrant>;
    canExpose(sessionId: string, automation?: boolean): boolean;
    execute(actor: Actor, input: unknown, callId: string): Promise<Row<HostCommand>>;
    stop(): Promise<void>;
    close(): void;
}
