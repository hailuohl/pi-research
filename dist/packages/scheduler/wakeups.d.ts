import type { ResearchApp } from '../research-app.js';
import type { Actor, Message, Row } from '../domain/types.js';
import type { RunObservation } from '../research-workflows/types.js';
export interface Wakeup {
    sourceKind: 'team' | 'campaign-result';
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
    generation?: number;
    error?: string;
}
/** A durable inbox. One pending signal is not the full result set: prompts reread authoritative records. */
export declare class WakeupService {
    private app;
    constructor(app: ResearchApp);
    get(actor: Actor, id: string): Row<Wakeup>;
    list(actor: Actor, projectId: string): Row<Wakeup>[];
    private teamSource;
    private campaignSource;
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
            state: "failed" | "cancelled" | "completed" | "awaiting_approval" | "active" | "paused" | "draining" | "partial";
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
    cancel(actor: Actor, id: string): Row<Wakeup>;
    resources(actor: Actor): {
        evidenceIds: Set<string>;
        artifactIds: Set<string>;
        runIds: Set<string>;
        taskIds: Set<string>;
    };
    assertResource(actor: Actor, kind: 'artifact' | 'evidence' | 'run' | 'task', id: string): void;
}
