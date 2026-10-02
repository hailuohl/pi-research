import type { Actor, Message, MessageAttachment, Row, Session } from '../domain/types.js';
import { type Store } from '../storage/store.js';
/** Reuse owner-imported project documents; attaching does not grant access to connector or parsed corpus data. */
export declare function attachmentReferences(store: Store, session: Row<Session>, value: unknown): MessageAttachment[];
export declare function attachmentScope(store: Store, actor: Actor, session: Row<Session>, value: unknown): MessageAttachment;
export declare function readAttachment(store: Store, actor: Actor, session: Row<Session>, value: unknown): {
    messageId: unknown;
    content: string;
    cursor: number;
    end: number;
    total: number;
    complete: boolean;
    status: "requires_parse";
    cursorUnit: "utf16";
    documentVersionId: string;
    artifactId: string;
    digest: string;
    title: string;
    mediaType: string;
    size: number;
} | {
    messageId: unknown;
    content: string;
    cursor: number;
    end: number;
    total: number;
    complete: boolean;
    status: "text";
    cursorUnit: "utf16";
    documentVersionId: string;
    artifactId: string;
    digest: string;
    title: string;
    mediaType: string;
    size: number;
};
export declare function messageInput(message: Pick<Row<Message>, 'id' | 'content' | 'attachments'>): string;
