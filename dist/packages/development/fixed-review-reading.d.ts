import type { Actor, Row, Task } from '../domain/types.js';
import type { Store } from '../storage/store.js';
export interface FixedReadTarget {
    targetId: string;
    kind: string;
    path: string;
    digest: string;
    artifactId?: string;
    required: boolean;
    read: () => string;
}
export interface FixedReviewRead {
    reviewId: string;
    reviewDigest: string;
    taskId: string;
    attemptId: string;
    sessionId: string;
    generation: number;
    targetId: string;
    readKind: string;
    digest: string;
    start: number;
    end: number;
    total: number;
    chunkDigest: string;
    callId: string;
}
export interface ReadReviewIdentity {
    id: string;
    digest: string;
    taskId: string;
}
export declare function fixedReviewReceipts(store: Store, pid: string, kind: string, r: ReadReviewIdentity, task: Row<Task>): Row<FixedReviewRead>[];
export declare function recordFixedRead(store: Store, pid: string, kind: string, actor: Actor, r: ReadReviewIdentity, target: FixedReadTarget, start: number, end: number, chunk: unknown, callId: string, errorCode: string): {
    reviewReadId: `${string}-${string}-${string}-${string}-${string}`;
};
export declare function fixedReadingChecks(targets: FixedReadTarget[], reads: Array<Row<FixedReviewRead>>): ({
    targetId: string;
    kind: string;
    path: string;
    digest: string;
    total: number;
    readComplete: boolean;
    missingIntervals: {
        start: number;
        end: number;
    }[];
    blockedReason?: undefined;
} | {
    targetId: string;
    kind: string;
    path: string;
    digest: string;
    total: null;
    readComplete: boolean;
    missingIntervals: never[];
    blockedReason: string;
})[];
export declare function locateFixedReference(targets: FixedReadTarget[], reads: Array<Row<FixedReviewRead>>, reference: {
    readId: string;
    quote: string;
}, label: string, prefix: string): FixedReadTarget;
