import { type SessionView } from './session-history.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Session, Message, ModelConfig, Role, Row } from '../domain/types.js';
export declare class SessionService {
    private c;
    constructor(c: AppContext);
    model(): ModelConfig;
    configure(actor: Actor, value: unknown): Row<{
        model: ModelConfig;
    }>;
    get(actor: Actor, id: string): Row<Session>;
    create(actor: Actor, projectId: string, input: unknown, internal?: {
        role: Role;
        teamId?: string;
        taskId?: string;
        workspace?: string;
    }): Row<Session>;
    send(actor: Actor, id: string, value: unknown): Row<Message>;
    rename(actor: Actor, id: string, title: string, expectedVersion: number): Row<Session>;
    archive(actor: Actor, id: string, expectedVersion: number): Row<Session>;
    interrupt(actor: Actor, id: string): Row<Session>;
    messages(actor: Actor, id: string): Row<Message>[];
    list(actor: Actor, pid: string, input?: unknown): import("./session-history.js").SessionCatalogPage;
    recent(actor: Actor, pid: string, selectedId?: string): Row<Session>[];
    messageRead(actor: Actor, id: string, input: unknown): import("./session-history.js").SessionMessageContent;
    /** Durable messages and the current generation's bounded preview share one read snapshot. */
    view(actor: Actor, id: string, input?: unknown): SessionView;
    /** Host-only persisted input; never masquerades as a user-authored message. */
    automation(id: string, wakeupId: string, content: string): Row<Message>;
    system(id: string, content: string): Row<Message>;
    /** Host notices are transported as data, never as new system instructions.
     * Delivery is at-least-once until a successful prompt checkpoint is acknowledged. */
    pendingNotices(id: string): {
        id: string;
        content: string;
        truncated: boolean;
    }[];
    acknowledgeNotices(id: string, messageIds: string[]): void;
    branch(actor: Actor, id: string, throughMessageId: string): Row<Session>;
    retry(actor: Actor, id: string, messageId: string): Row<Message>;
}
