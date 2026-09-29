import type { Store } from '../storage/store.js';
import type { Message, Role, Row, Session } from '../domain/types.js';
export declare const MESSAGE_PREVIEW_CHARACTERS = 4000, MESSAGE_PAGE_BYTES = 262144;
export type SessionCatalogItem = Pick<Row<Session>, 'id' | 'kind' | 'projectId' | 'version' | 'createdAt' | 'updatedAt' | 'title' | 'role' | 'state' | 'model' | 'teamId' | 'taskId'>;
export interface SessionCatalogPage {
    items: SessionCatalogItem[];
    nextCursor: string | null;
    query: string;
    role: Role | 'all';
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
    progress: {
        generation: number;
        active: boolean;
        content: string;
        truncated: boolean;
        cursor: number;
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
