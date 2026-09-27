import type { AppContext } from '../domain/context.js';
import type { Actor, Row, Team, Task, TaskAttempt } from '../domain/types.js';
import type { SessionService } from '../pi-adapter/sessions.js';
import type { ApprovalService } from '../policy/approvals.js';
import type { BudgetService } from '../policy/budget.js';
import type { EvidenceService } from '../evidence/service.js';
export declare class TeamService {
    private c;
    private sessions;
    private approvals;
    private budget;
    private evidence;
    constructor(c: AppContext, sessions: SessionService, approvals: ApprovalService, budget: BudgetService, evidence: EvidenceService);
    get(actor: Actor, id: string): Row<Team>;
    tasks(actor: Actor, id: string): Row<Task>[];
    create(actor: Actor, rootSessionId: string, value: unknown): Row<Team>;
    activate(actor: Actor, id: string): Row<Team>;
    private assertInputsCurrent;
    private assertDispatchPlan;
    /** Claim and reserve atomically. No network, model or process launch in this transaction. */
    claim(id: string): {
        task: Row<Task>;
        attempt: Row<TaskAttempt>;
        context: unknown;
    } | null;
    active(actor: Actor): {
        task: Row<Task>;
        attempt: Row<TaskAttempt>;
    };
    /** A task reads only explicit inputs, dependency/review outputs, or its own immutable artifacts. */
    resources(actor: Actor): {
        artifactIds: Set<string>;
        evidenceIds: Set<string>;
        runIds: Set<string>;
        taskIds: Set<string>;
    };
    assertResource(actor: Actor, kind: 'artifact' | 'evidence' | 'run' | 'task', id: string): void;
    heartbeat(attemptId: string): Row<TaskAttempt> | undefined;
    submit(actor: Actor, value: unknown): Row<{
        attemptId: string;
        digest: string;
    }>;
    /** All named reviewers are gates. Conflicting opinions remain disputed, never last-writer-wins. */
    private aggregateReviews;
    refresh(id: string): Row<Team>;
    disable(actor: Actor, id: string): Row<Team>;
    pause(actor: Actor, id: string): Row<Team>;
    resume(actor: Actor, id: string): Row<Team>;
    fail(attemptId: string, error: string, unknown?: boolean): void;
    recover(): void;
    retry(actor: Actor, taskId: string): Row<Task>;
    cancel(actor: Actor, taskId: string): Row<Task>;
    directive(actor: Actor, id: string, value: unknown): Row<{
        teamId: string;
        kind: "steer" | "follow_up" | "revise";
        content: string;
        taskIds: string[];
        directiveVersion: number;
        deliveredSessionIds: never[];
    }>;
    manualReview(actor: Actor, taskId: string, value: unknown): Row<Task>;
}
