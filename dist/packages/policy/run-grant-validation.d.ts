import type { Store } from '../storage/store.js';
import type { Actor, Approval, Artifact, Row, Run, RunIntent } from '../domain/types.js';
import type { RunGrant, RunGrantReference, RunGrantUse } from './run-grant-types.js';
export declare function runGrantPayload(g: RunGrant): {
    sessionId: string;
    model: import("../domain/types.js").ModelConfig;
    entries: import("./run-grant-types.js").RunGrantEntry[];
    maxRuns: number;
    expiresAt: string;
    approvalId: string;
};
export declare const runGrantReference: (g: Row<RunGrant>) => RunGrantReference;
export declare function assertRunGrantRecord(store: Store, pid: string, id: string): {
    grant: Row<RunGrant>;
    approval: Row<Approval>;
};
export declare function assertRunGrantReference(store: Store, pid: string, ref: RunGrantReference, admission?: boolean): Row<RunGrant>;
export declare function assertRunGrantEntry(store: Store, pid: string, g: RunGrant, intent: Row<RunIntent>): Row<Approval>;
export declare function assertRunGrantIntent(store: Store, intent: Row<RunIntent>, admission?: boolean): Row<RunGrant> | undefined;
/** Read-only; callers use admission=true only before actual persisted start. */
export declare function assertRunGrantRun(store: Store, run: Row<Run>, admission?: boolean): void;
export declare function assertRunGrantActor(store: Store, actor: Actor, intent: Row<RunIntent>): void;
export declare function assertRunGrantArtifact(store: Store, pid: string, artifact: Row<Artifact>): void;
/** Caller holds the Run creation transaction. Submission is permanently counted. */
export declare function consumeRunGrant(store: Store, intent: Row<RunIntent>, runId: string): Row<RunGrantUse> | undefined;
