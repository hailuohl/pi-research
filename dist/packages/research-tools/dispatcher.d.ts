import type { ResearchApp } from '../research-app.js';
import type { Actor, Session } from '../domain/types.js';
export declare class ToolDispatcher {
    private app;
    constructor(app: ResearchApp);
    definitions(role: NonNullable<Actor['role']>, automation?: boolean, sessionId?: string, continuation?: boolean, approvalResume?: boolean, approvalNoticeId?: string): {
        description: string;
        example: unknown;
        inputSchema: import("../contracts/operations/schema.js").JsonSchema;
        outputSchema?: import("../contracts/operations/schema.js").JsonSchema;
        name: string;
    }[];
    authorize(actor: Actor, name: string): import("../domain/types.js").Row<Session>;
    execute(actor: Actor, name: string, raw: unknown, callId: string): Promise<unknown>;
}
