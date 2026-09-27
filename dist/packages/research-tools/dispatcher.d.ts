import type { ResearchApp } from '../research-app.js';
import type { Actor, Session } from '../domain/types.js';
export declare class ToolDispatcher {
    private app;
    constructor(app: ResearchApp);
    definitions(role: NonNullable<Actor['role']>, automation?: boolean): {
        description: string;
        example: unknown;
        name: string;
    }[];
    /** Ownership and fencing apply even to replays; completed calls may only return their stored response. */
    private identity;
    authorize(actor: Actor, name: string): import("../domain/types.js").Row<Session>;
    execute(actor: Actor, name: string, raw: unknown, callId: string): Promise<any>;
    private invoke;
}
