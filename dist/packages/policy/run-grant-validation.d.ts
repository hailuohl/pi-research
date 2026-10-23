import { type TaskModelPlan } from '../collaboration/task-model.js';
import type { Store } from '../storage/store.js';
import type { Actor, Approval, Artifact, Row, Run, RunIntent, Session, Task, TaskAttempt, TaskSpec, Team } from '../domain/types.js';
import type { RunGrant, RunGrantReference, RunGrantTaskBinding, RunGrantUse } from './run-grant-types.js';
type TeamPlan = Row<TaskModelPlan & {
    sourceRevisionId?: string;
    teamId: string;
    planVersion: number;
    directiveVersion: number;
    tasks: TaskSpec[];
    goal: string;
    digest: string;
    model: Session['model'];
}>;
export declare function runGrantPayload(g: RunGrant): {
    taskBinding?: RunGrantTaskBinding | undefined;
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
export declare function buildRunGrantTaskBinding(store: Store, pid: string, task: Row<Task>): {
    binding: RunGrantTaskBinding;
    model: import("../domain/types.js").ModelConfig;
    sessionId: string;
};
export declare function assertRunGrantTaskBinding(store: Store, pid: string, grant: Row<RunGrant>, options?: {
    requireUnclaimed?: boolean;
    requireApprovedTeam?: boolean;
    allowInvalidTeamApproval?: boolean;
}): {
    task: Row<Task>;
    team: Row<Team>;
    plan: Row<TeamPlan>;
    approval: Row<Approval>;
};
/** Checks the current Task worker and grant markers before submit or receipt replay. */
export declare function assertRunGrantTaskSubmission(store: Store, actor: Actor, intent: Row<RunIntent>, newSubmission?: boolean): {
    grant: Row<RunGrant>;
    task: Row<Task>;
    team: Row<Team>;
    attempt: Row<TaskAttempt>;
    session: Row<Session>;
    teamApproval: Row<Approval>;
};
export declare function assertRunGrantEntry(store: Store, pid: string, g: RunGrant, intent: Row<RunIntent>): Row<Approval>;
export declare function assertRunGrantIntent(store: Store, intent: Row<RunIntent>, admission?: boolean): Row<RunGrant> | undefined;
/** Read-only; callers use admission=true only before actual persisted start. */
export declare function assertRunGrantRun(store: Store, run: Row<Run>, admission?: boolean): void;
export declare function assertRunGrantActor(store: Store, actor: Actor, intent: Row<RunIntent>): void;
export declare function assertRunGrantArtifact(store: Store, pid: string, artifact: Row<Artifact>): void;
/** Caller holds the Run creation transaction. Submission is permanently counted. */
export declare function consumeRunGrant(store: Store, intent: Row<RunIntent>, runId: string, actor: Actor): Row<RunGrantUse> | undefined;
export {};
