import type { DatabaseSync } from 'node:sqlite';
export type OperationOwner = {
    kind: 'project';
    projectId: string;
} | {
    kind: 'global';
} | {
    kind: 'unknown';
};
/** Exact identifiers only: receipt bodies and scope tokens must agree on their owner. */
export declare function inferOperationOwner(db: DatabaseSync, scope: string, input: unknown, response: unknown, trusted?: Exclude<OperationOwner, {
    kind: 'unknown';
}>): OperationOwner;
export declare function storedOperationOwner(row: {
    owner_kind?: unknown;
    project_id?: unknown;
}): OperationOwner;
export declare function assertOperationReceipt(db: DatabaseSync, scope: string, input: unknown, value: unknown, stored: OperationOwner, trusted?: Exclude<OperationOwner, {
    kind: 'unknown';
}>): void;
