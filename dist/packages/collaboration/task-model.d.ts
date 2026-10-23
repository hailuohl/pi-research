import type { ModelConfig, TaskSpec, Session, Row, Team } from '../domain/types.js';
import type { Store } from '../storage/store.js';
import type { TaskModelExecution } from '../pi-adapter/thinking-policy.js';
export interface FrozenTaskModel {
    model: ModelConfig;
    execution: TaskModelExecution;
    digest: string;
}
export interface TaskModelPlan {
    model: ModelConfig;
    tasks?: TaskSpec[];
    taskModels?: Record<string, FrozenTaskModel>;
    digest?: string;
    goal?: string;
    settings?: Team['settings'];
    limit?: number;
    autoSummarize?: boolean;
    sourceRevisionId?: string;
    developmentReviewInputs?: unknown;
    formalReportReviewInputs?: unknown;
    taskPermissionEffects?: string[];
    permission?: Team['permission'];
}
export declare function taskModelSpec(task: TaskSpec): TaskSpec;
export declare function assertFrozenTaskPlan(plan: TaskModelPlan): void;
export declare function resolveTaskModel(plan: TaskModelPlan, task: TaskSpec): ModelConfig;
export declare function sessionTaskModel(store: Store, session: Row<Session>): FrozenTaskModel | undefined;
