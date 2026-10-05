import type { ResearchApp } from '../research-app.js';
import type { Actor, Message, Row, Task, Team } from '../domain/types.js';
import type { RunObservation } from '../research-workflows/types.js';
export interface Wakeup {
    sourceKind: 'team' | 'campaign-result' | 'run-result';
    sourceId: string;
    ownerId: string;
    rootSessionId: string;
    sourceDigest: string;
    automatic: boolean;
    requested: boolean;
    state: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'superseded';
    attempts: number;
    maxAttempts: number;
    queueGeneration?: number;
    blockReason?: string;
    messageId?: string;
    reservationId?: string;
    analysisSessionPath?: string;
    generation?: number;
    error?: string;
}
type Source = Pick<Wakeup, 'sourceKind' | 'sourceId' | 'ownerId' | 'rootSessionId' | 'sourceDigest' | 'automatic'>;
export declare function teamWakeupSource(t: Row<Team>, tasks: Row<Task>[]): Source;
export declare const wakeupId: (source: Source) => string;
/** A durable inbox. One pending signal is not the full result set: prompts reread authoritative records. */
export declare class WakeupService {
    private app;
    constructor(app: ResearchApp);
    get(actor: Actor, id: string): Row<Wakeup>;
    list(actor: Actor, projectId: string): Row<Wakeup>[];
    private teamSource;
    private campaignSource;
    private runResultSource;
    private enqueue;
    private sourceStatus;
    private block;
    private clearEmptyQueue;
    private invalidate;
    reconcile(): void;
    context(w: Row<Wakeup>): {
        purpose: string;
        team: {
            id: string;
            goal: string;
            state: "failed" | "cancelled" | "completed" | "active" | "partial" | "awaiting_approval" | "paused" | "draining";
        };
        tasks: {
            id: string;
            key: string;
            execution: "failed" | "cancelled" | "running" | "pending" | "output_submitted" | "blocked" | "superseded" | "waiting_user";
            acceptance: "pending" | "rejected" | "accepted" | "disputed";
            result: import("../domain/types.js").TaskResult | null;
        }[];
        campaign?: undefined;
        observations?: undefined;
        run?: undefined;
    } | {
        purpose: string;
        campaign: {
            id: string;
            goal: string;
            expectedVersion: number;
            roundNumber: number;
            focusExperimentId: string;
            primaryMetric: string;
            limits: import("../research-workflows/types.js").CampaignLimits;
        };
        observations: Row<RunObservation>[];
        team?: undefined;
        tasks?: undefined;
        run?: undefined;
    } | {
        purpose: string;
        run: {
            id: string;
            state: "succeeded" | "failed" | "cancelled" | "queued" | "running" | "unknown" | "submitting" | "cancelling";
            integrity: "pending" | "complete" | "incomplete" | "invalid";
            validation: "incomplete" | "invalid" | "verified";
            explanation: string;
            metrics: Record<string, number> | null;
            metricsContract: Record<string, {
                unit: string;
                direction: "min" | "max";
            }>;
            exitCode: number | null;
            error: string | null;
            artifactIds: string[];
            evidenceIds: string[];
            manifestBrief: {
                id: string;
                digest: string;
                revision: number;
                rootSessionId: string;
            } | null;
        };
        team?: undefined;
        tasks?: undefined;
        campaign?: undefined;
        observations?: undefined;
    };
    dispatch(id: string, readiness: {
        ready: boolean;
        message?: string;
    }): {
        notice: Row<Wakeup>;
        message: Row<Message>;
    } | null;
    markStarted(id: string, sessionId: string, generation: number, messageId: string): Row<Wakeup>;
    assertActive(actor: Actor): Row<Wakeup>;
    finish(id: string, error?: string, unknown?: boolean): Row<Wakeup>;
    request(actor: Actor, id: string): Row<Wakeup>;
    retry(actor: Actor, id: string): Row<Wakeup>;
    private neverStarted;
    cancel(actor: Actor, id: string): Row<Wakeup>;
    resources(actor: Actor): {
        evidenceIds: Set<string>;
        artifactIds: Set<string>;
        runIds: Set<string>;
        taskIds: Set<string>;
    };
    assertResource(actor: Actor, kind: 'artifact' | 'evidence' | 'run' | 'task', id: string): void;
}
export {};
