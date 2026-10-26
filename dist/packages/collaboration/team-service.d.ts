import { type PreparedTaskModels } from '../pi-adapter/thinking-policy.js';
import { formalReviewInputs } from '../publications/formal-report-review-types.js';
import type { DevelopmentReviewInputBinding } from '../development/reviews-types.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Project, Row, Session, Team, Task, TaskAttempt, TaskSpec } from '../domain/types.js';
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
    skillPreflight?: (task: Row<Task>, preparedSession?: Row<Session>) => string;
    reviewValidator?: (task: Row<Task>) => void;
    private validateReview;
    constructor(c: AppContext, sessions: SessionService, approvals: ApprovalService, budget: BudgetService, evidence: EvidenceService);
    get(actor: Actor, id: string): Row<Team>;
    tasks(actor: Actor, id: string): Row<Task>[];
    validatePlan(actor: Actor, rootSessionId: string, value: unknown, inheritSource?: boolean): {
        s: Row<Session>;
        p: Row<Project>;
        tasks: TaskSpec[];
        goal: string;
        limit: number;
        autoSummarize: boolean;
        source: {
            sourceRevisionId: string;
        } | {
            sourceRevisionId?: undefined;
        };
    };
    create(actor: Actor, rootSessionId: string, value: unknown, inheritSource?: boolean, developmentReviewInputs?: DevelopmentReviewInputBinding, formalReportReviewInputs?: ReturnType<typeof formalReviewInputs>, preparedTaskModels?: PreparedTaskModels): Row<Team>;
    activateAutomatic(actor: Actor, ref: import('../policy/automatic-approvals.js').AutomaticApprovalReference, id: string): Row<Team>;
    activate(actor: Actor, id: string): Row<Team>;
    private assertInputsCurrent;
    private requireFormalReportRoute;
    private assertAutomaticPermission;
    assertPermission(t: Row<Team>): void;
    private assertDispatchPlan;
    /** Claim and reserve atomically. No network, model or process launch in this transaction. */
    claim(id: string, prepareOnly?: boolean): {
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
    resourcesForTask(task: Row<Task>): {
        artifactIds: Set<string>;
        evidenceIds: Set<string>;
        runIds: Set<string>;
        taskIds: Set<string>;
    };
    assertResource(actor: Actor, kind: 'artifact' | 'evidence' | 'run' | 'task', id: string): void;
    heartbeat(attemptId: string): Row<TaskAttempt> | undefined;
    reviewIntegrity?: <T>(task: Row<Task>, fn: () => T) => T;
    submit(actor: Actor, value: unknown): Row<{
        attemptId: string;
        digest: string;
    }>;
    private submitCurrent;
    /** All named reviewers are gates. Conflicting opinions remain disputed, never last-writer-wins. */
    private aggregateReviews;
    refresh(id: string): Row<Team>;
    disable(actor: Actor, id: string): Row<Team>;
    pause(actor: Actor, id: string): Row<Team>;
    resume(actor: Actor, id: string): Row<Team>;
    fail(attemptId: string, error: string, unknown?: boolean, notStarted?: boolean): void;
    recover(): void;
    private assertRetry;
    retryEligibility(actor: Actor, taskId: string): {
        eligible: boolean;
        code?: string;
        reason?: string;
    };
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
