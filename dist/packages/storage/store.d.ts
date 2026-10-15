import { type OperationOwner } from './operation-ownership.js';
import { DatabaseSync } from 'node:sqlite';
import type { Row } from '../domain/types.js';
import { TextWriteRecovery } from '../workspace/text-write-recovery.js';
import { type DataPaths } from './data-paths.js';
export declare function stable(value: unknown): string;
export declare const digest: (value: unknown) => string;
export declare const now: () => string;
export interface EventPageItem {
    seq: number;
    id: string;
    projectId: string | null;
    type: string;
    payload: unknown;
    createdAt: string;
    omitted?: true;
    payloadBytes?: number;
}
export interface EventPage {
    items: EventPageItem[];
    cursor: number;
    hasMore: boolean;
    latestCursor: number;
    reset: boolean;
}
export declare const EVENT_PAYLOAD_BYTES: number, EVENT_PAGE_PAYLOAD_BYTES: number;
export declare class Store {
    path: string;
    readonly db: DatabaseSync;
    readonly paths: DataPaths;
    private depth;
    private reading;
    private rollbackCallbacks;
    private commitCallbacks;
    textWrites?: TextWriteRecovery;
    constructor(path: string);
    private migrateLocalGpuQueue;
    private migrateSshQueue;
    private migratePublicationQueue;
    private migrateDocumentQueue;
    private migrateComputeQueue;
    onRollback(fn: () => void): void;
    afterCommit(fn: () => void): void;
    transaction<T>(fn: () => T): T;
    /** Consistent synchronous reads without reserving SQLite's writer lock. */
    readSnapshot<T>(fn: () => T): T;
    create<T extends object>(kind: string, projectId: string | null, data: T, id?: string): Row<T>;
    get<T = Record<string, unknown>>(kind: string, id: string, projectId?: string): Row<T>;
    maybe<T = Record<string, unknown>>(kind: string, id: string): Row<T> | undefined;
    list<T = Record<string, unknown>>(kind: string, projectId?: string): Row<T>[];
    update<T extends object>(kind: string, id: string, version: number, patch: Partial<T>): Row<T>;
    event(projectId: string | null, type: string, payload: unknown): {
        seq: number;
        id: `${string}-${string}-${string}-${string}-${string}`;
        projectId: string | null;
        type: string;
        payload: unknown;
        createdAt: string;
    };
    events(after?: number, projectId?: string, limit?: number): {
        seq: number;
        id: import("node:sqlite").SQLOutputValue;
        projectId: import("node:sqlite").SQLOutputValue;
        type: import("node:sqlite").SQLOutputValue;
        payload: any;
        createdAt: import("node:sqlite").SQLOutputValue;
    }[];
    eventCursor(projectId?: string): number;
    /** User-facing cursors include global events and readable project history only. */
    visibleEventCursor(projectId?: string): number;
    eventPage(after?: number, projectId?: string, limit?: number): EventPage;
    consume(consumer: string, eventId: string, fn: () => void): boolean;
    operationResult<T>(scope: string, key: string, input: unknown, trustedOwner?: Exclude<OperationOwner, {
        kind: 'unknown';
    }>): {
        found: false;
    } | {
        found: true;
        value: T;
    };
    /** v0.2 stored operations under lease generations. Reuse a unique historic result,
     * but never silently choose between already-duplicated side effects. */
    agentOperationResult<T>(sessionId: string, key: string, input: unknown): {
        found: false;
    } | {
        found: true;
        value: T;
    };
    operation<T>(scope: string, key: string, input: unknown, fn: () => T, trustedOwner?: Exclude<OperationOwner, {
        kind: 'unknown';
    }>): T;
    close(): void;
}
