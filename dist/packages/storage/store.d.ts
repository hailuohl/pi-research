import { DatabaseSync } from 'node:sqlite';
import type { Row } from '../domain/types.js';
export declare function stable(value: unknown): string;
export declare const digest: (value: unknown) => string;
export declare const now: () => string;
export declare class Store {
    path: string;
    readonly db: DatabaseSync;
    private depth;
    constructor(path: string);
    transaction<T>(fn: () => T): T;
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
    consume(consumer: string, eventId: string, fn: () => void): boolean;
    operationResult<T>(scope: string, key: string, input: unknown): {
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
    operation<T>(scope: string, key: string, input: unknown, fn: () => T): T;
    close(): void;
}
