import type { AppContext } from '../domain/context.js';
import type { Actor, Session, Message, ModelConfig, Role } from '../domain/types.js';
export declare class SessionService {
    private c;
    constructor(c: AppContext);
    model(): ModelConfig;
    configure(actor: Actor, value: unknown): import("../domain/types.js").Row<{
        model: ModelConfig;
    }>;
    get(actor: Actor, id: string): import("../domain/types.js").Row<Session>;
    create(actor: Actor, projectId: string, input: unknown, internal?: {
        role: Role;
        teamId?: string;
        taskId?: string;
        workspace?: string;
    }): import("../domain/types.js").Row<Session>;
    send(actor: Actor, id: string, value: unknown): import("../domain/types.js").Row<Message>;
    rename(actor: Actor, id: string, title: string, expectedVersion: number): import("../domain/types.js").Row<Session>;
    archive(actor: Actor, id: string, expectedVersion: number): import("../domain/types.js").Row<Session>;
    interrupt(actor: Actor, id: string): import("../domain/types.js").Row<Session>;
    messages(actor: Actor, id: string): import("../domain/types.js").Row<Message>[];
    /** Host-only persisted input; never masquerades as a user-authored message. */
    automation(id: string, wakeupId: string, content: string): import("../domain/types.js").Row<Message>;
    system(id: string, content: string): import("../domain/types.js").Row<Message>;
    /** Host notices are transported as data, never as new system instructions.
     * Delivery is at-least-once until a successful prompt checkpoint is acknowledged. */
    pendingNotices(id: string): {
        id: string;
        content: string;
        truncated: boolean;
    }[];
    acknowledgeNotices(id: string, messageIds: string[]): void;
    branch(actor: Actor, id: string, throughMessageId: string): import("../domain/types.js").Row<Session>;
    retry(actor: Actor, id: string, messageId: string): import("../domain/types.js").Row<Message>;
}
