import { type PreparedTaskModels } from '../../pi-adapter/thinking-policy.js';
import type { ResearchApp } from '../../research-app.js';
import type { Actor, Session, Row } from '../../domain/types.js';
import { type JsonSchema } from './schema.js';
export interface OperationScope {
    projectId: string;
    sessionId?: string;
    idempotencyKey?: string;
    signal?: AbortSignal;
    /** Host-only binding for fixed execution; never a transport or model argument. */
    approvedActionId?: string;
    /** Only trusted legacy adapters provide these, never request JSON. */
    legacy?: {
        scope: string;
        input: unknown;
    };
}
interface OperationContext extends OperationScope {
    preparedTaskModels?: PreparedTaskModels;
    commitPrepared?: (value: unknown) => void;
    app: ResearchApp;
    actor: Actor;
    session?: Row<Session>;
    validate: () => void;
}
export interface OperationSpec {
    id: string;
    inputSchema: JsonSchema;
    outputSchema: JsonSchema;
    idempotencyPolicy: 'read-only' | 'key-required';
    asynchronous?: boolean;
    requiresSession?: boolean;
    authorize: (context: OperationContext, input: Record<string, unknown>) => void;
    preconditions: (context: OperationContext, input: Record<string, unknown>) => void;
    execute: (context: OperationContext, input: Record<string, unknown>) => unknown;
}
/** One domain boundary for the migrated HTTP, CLI and Pi actions. */
export declare class OperationRegistry {
    private app;
    private pending;
    constructor(app: ResearchApp);
    has(id: string): boolean;
    specs(): {
        requiresSession?: true | undefined;
        id: string;
        inputSchema: JsonSchema;
        outputSchema: JsonSchema;
        idempotencyPolicy: "read-only" | "key-required";
    }[];
    /** Identity and fencing still apply to completed-call replay. */
    agentIdentity(actor: Actor, name: string): Row<Session>;
    authorizeAgent(actor: Actor, name: string): Row<Session>;
    execute(actor: Actor, id: string, raw: unknown, options: OperationScope): unknown;
}
export {};
