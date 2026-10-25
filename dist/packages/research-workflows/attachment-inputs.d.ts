import type { Actor, Session, Row } from '../domain/types.js';
import { type Store } from '../storage/store.js';
import type { ResearchSourceInput } from './source-inputs.js';
export interface AttachmentBinding {
    sessionId: string;
    anchorBriefId: string | null;
    messageId: string;
    documentVersionId: string;
    artifactId: string;
    digest: string;
    size: number;
    purpose: 'whole-text' | 'dataset-reference';
    readProtocol: 'fixed-text-v1';
    path: string;
    workspace: string;
}
export interface AttachmentRead {
    bindingId: string;
    sessionId: string;
    generation: number;
    callId: string;
    cursor: number;
    end: number;
    contentDigest: string;
    delivery: 'pending' | 'delivered';
    offered?: boolean;
}
export interface FixedAttachmentPage {
    readProtocol?: string;
    purpose?: AttachmentBinding['purpose'];
    documentVersionId: string;
    messageId: string;
    artifactId: string;
    sourceDigest?: string;
    digest: string;
    size: number;
    cursor: number;
    end: number;
    content: string;
}
export declare function recordAttachmentRead(store: Store, actor: Actor, selected: Row<Session>, page: FixedAttachmentPage, callId: string, requestedBindingId?: string): {
    attachmentReadId: string;
    attachmentBindingId: string;
    sourceInputPath: string;
} | undefined;
/** Host-only ACK. The host additionally validates the exact SDK result and worker identity. */
export declare function deliverAttachmentRead(store: Store, actor: Actor, readId: string, callId: string): void;
export declare function attachmentSelectionFingerprint(store: Store, session: Row<Session>): {
    documentVersionId: string;
    bindingId: string;
    version: number;
}[];
export declare function assertAttachmentInput(store: Store, pid: string, sessionId: string, input: ResearchSourceInput): void;
export declare function attachmentInputs(store: Store, session: Row<Session>, inheritedIds: string[], status: 'clarifying' | 'ready'): ResearchSourceInput[];
