import type { TaskResult, Task } from '../domain/types.js';
export declare function parseTaskResult(value: unknown): TaskResult;
/** Enforce the declared deliverables, rather than trusting a model's outcome. */
export declare function validateDeliverables(task: Task & {
    id: string;
}, result: TaskResult, read: (id: string) => {
    artifact: {
        title: string;
        mediaType: string;
        taskId?: string;
    };
    bytes: Buffer;
}): void;
