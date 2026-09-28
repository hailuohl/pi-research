import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Task } from '../domain/types.js';
import type { PublicationReviewInspection, PublicationReviewSnapshot } from './reviews-types.js';
export declare class PublicationReviewService {
    private app;
    constructor(app: ResearchApp);
    private artifact;
    private evidence;
    private target;
    prepare(actor: Actor, pid: string, value: unknown): PublicationReviewInspection;
    private current;
    assertTaskCurrent(task: Row<Task>): void;
    inspect(actor: Actor, pid: string, id: string): PublicationReviewInspection;
    list(actor: Actor, pid: string, options: {
        resultId: string;
    }): PublicationReviewInspection[];
    snapshot(actor: Actor, pid: string, id: string): PublicationReviewSnapshot;
}
