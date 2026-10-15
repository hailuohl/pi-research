import type { AppContext } from '../domain/context.js';
import type { Actor } from '../domain/types.js';
import { probeDockerTarget } from '../execution/docker.js';
import type { ComputeKind, ComputeConfiguration, ComputeQueueInspection, ComputeTargetProbe, RunSchedulingInspection } from './compute-types.js';
interface Dependencies {
    probe?: typeof probeDockerTarget;
    inspect?: (context: string, id: string) => Promise<{
        Id: string;
        Config: {
            Labels?: Record<string, string>;
        };
    } | null>;
}
/** One SQLite-backed budget for formal Runs and development jobs; leases never release resources. */
export declare class ComputeQueue {
    private c;
    private pending?;
    private stopped;
    private cursors;
    private readonly probe;
    private readonly inspectContainer;
    constructor(c: AppContext, dependencies?: Dependencies);
    private row;
    private context;
    private config;
    private usage;
    private targetReady;
    private fits;
    private available;
    private effectiveAvailable;
    private tooLarge;
    private capacity;
    private gpuBusy;
    private bindCachedQueued;
    /** Earliest non-oversized job per target: temporarily blocked large jobs cannot be overtaken there. */
    private heads;
    private next;
    candidates(kind: ComputeKind, limit?: number): string[];
    private page;
    queued(kind: ComputeKind, limit?: number): string[];
    active(kind: ComputeKind, limit?: number): string[];
    withAdmission<T>(kind: ComputeKind, id: string, fn: () => T): T | null;
    assertEnqueue(kind: ComputeKind, _projectId: string, context?: string, localTargetId?: string): void;
    /** Owner-only identity discovery; does not create a job, bind old jobs or grant execution. */
    probeContext(actor: Actor, context: string, validate?: () => void, background?: boolean): Promise<ComputeTargetProbe>;
    private observeDocker;
    private probeContextCurrent;
    private remember;
    private ownsLegacy;
    verifyTarget(kind: ComputeKind, id: string): Promise<void>;
    private verifyTargetCurrent;
    tick(): void;
    private probeNext;
    stop(): Promise<void>;
    configure(actor: Actor, value: unknown): ComputeConfiguration;
    private reason;
    inspectRun(actor: Actor, pid: string, id: string): RunSchedulingInspection;
    inspect(actor: Actor, pid?: string, options?: {
        cursor?: number;
        limit?: number;
    }): ComputeQueueInspection;
}
export {};
