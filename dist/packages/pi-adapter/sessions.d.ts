import { type SessionView } from './session-history.js';
import { type ParsedAttachmentPair, type ParsedAttachmentMetadata } from './attachments.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Session, Message, ModelConfig, Role, Row } from '../domain/types.js';
export declare class SessionService {
    private c;
    parsedAttachmentMetadata?: (actor: Actor, session: Row<Session>, pair: ParsedAttachmentPair) => ParsedAttachmentMetadata;
    permissionCapture?: (sessionId: string) => import('../policy/session-permissions.js').PermissionReference;
    taskPermissionCapture?: (sessionId: string) => import('../policy/session-permissions.js').PermissionReference;
    permissionBranch?: (originalId: string, branchId: string) => void;
    constructor(c: AppContext);
    model(): ModelConfig;
    models(): ModelConfig[];
    configure(actor: Actor, value: unknown): Row<{
        model: ModelConfig;
        models: ModelConfig[];
    }>;
    selectModel(actor: Actor, id: string, value: unknown): Row<Session>;
    get(actor: Actor, id: string): Row<Session>;
    create(actor: Actor, projectId: string, input: unknown, internal?: {
        role: Role;
        teamId?: string;
        taskId?: string;
        workspace?: string;
    }): Row<Session>;
    send(actor: Actor, id: string, value: unknown): Row<Message>;
    queue(actor: Actor, id: string, input?: unknown): {
        items: {
            contentTruncated: boolean;
            previewTruncated: boolean;
            contentBytes: number;
            id: string;
            kind: string;
            projectId: string | null;
            version: number;
            createdAt: string;
            updatedAt: string;
            nativeRequestId?: string;
            permission?: import("../policy/session-permissions.js").PermissionReference;
            generation?: number;
            phase?: "commentary" | "final_answer";
            toolCalls?: string[];
            attachments?: import("../domain/types.js").MessageAttachment[];
            sessionId: string;
            role: "user" | "assistant" | "system";
            content: string;
            mode: "prompt" | "steer" | "follow_up";
            steerGeneration?: number;
            queueRemoved?: boolean;
            status: "queued" | "running" | "completed" | "failed" | "cancelled";
            error?: string;
            origin?: "user" | "automation";
            wakeupId?: string;
            usage?: unknown;
        }[];
        total: number;
        nextCursor: string | null;
        canSteer: boolean;
    };
    queueAction(actor: Actor, id: string, value: unknown): Row<Message>;
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
