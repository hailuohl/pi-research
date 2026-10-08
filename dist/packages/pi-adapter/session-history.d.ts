import type { Store } from '../storage/store.js';
import type { Message, Role, Row, Session } from '../domain/types.js';
export declare const MESSAGE_PREVIEW_CHARACTERS = 4000, MESSAGE_PAGE_BYTES = 262144;
export type SessionCatalogItem = Pick<Row<Session>, 'id' | 'kind' | 'projectId' | 'version' | 'createdAt' | 'updatedAt' | 'title' | 'role' | 'state' | 'model' | 'teamId' | 'taskId'>;
export interface SessionCatalogPage {
    items: SessionCatalogItem[];
    nextCursor: string | null;
    query: string;
    role: Role | 'all';
    stateFilter: 'active' | 'archived' | 'all';
    limit: number;
}
export interface SessionHistoryPage {
    beforeMessageId: string | null;
    afterMessageId: string | null;
    atLatest: boolean;
    previewCharacters: number;
    byteLimit: number;
    returnedBytes: number;
}
export type HistoryMessage = Row<Message> & {
    previewTruncated: boolean;
    contentBytes: number;
};
export interface SessionView {
    session: Row<Session>;
    messages: HistoryMessage[];
    history: SessionHistoryPage;
    pendingMessages: HistoryMessage[];
    pendingTotal: number;
    pendingNextCursor: string | null;
    progress: {
        generation: number;
        active: boolean;
        canSteer: boolean;
        content: string;
        truncated: boolean;
        cursor: number;
        activity?: {
            tool: string;
            status: 'running' | 'completed' | 'failed';
        } | null;
    };
}
export interface SessionMessageContent {
    sessionId: string;
    messageId: string;
    version: number;
    content: string;
    cursor: number;
    end: number;
    total: number;
    complete: boolean;
    cursorUnit: 'utf8-byte';
    sourceTruncated: boolean;
}
export declare function sessionCatalog(store: Store, pid: string, value?: unknown): SessionCatalogPage;
export declare function sessionMessagePage(store: Store, session: Row<Session>, value?: unknown): {
    messages: HistoryMessage[];
    history: {
        beforeMessageId: string | null;
        afterMessageId: string | null;
        atLatest: boolean;
        previewCharacters: number;
        byteLimit: number;
        returnedBytes: number;
    };
};
export declare function sessionMessageContent(store: Store, session: Row<Session>, value: unknown): SessionMessageContent;
export declare function canSteerSession(store: Store, session: Row<Session>): boolean;
export declare function sessionQueue(store: Store, session: Row<Session>, value?: unknown): {
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
        nativeAttachmentContextIds?: string[];
        nativeAttachmentsDisabled?: boolean;
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
