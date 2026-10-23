import type { ResearchApp } from '../research-app.js';
import type { Actor, Message, Row } from '../domain/types.js';
import type { PermissionReference } from './session-permissions.js';
type Kind = 'brief' | 'campaign' | 'change';
interface Source {
    sourceKind: Kind;
    sourceId: string;
    sourceDigest: string;
}
interface WorkflowContinuation extends Source {
    rootSessionId: string;
    permission: PermissionReference;
    modelDigest: string;
    lifecycleEpoch: number;
    humanMessageId: string | null;
    sourceProof: string;
    bindingDigest: string;
    initialMessageId?: string;
    resultId?: string;
    invalidatedReasonCode?: string;
    blockReason?: string;
}
export interface WorkflowStatus extends Source {
    id: string;
    route: 'workflow' | 'existing-handoff';
    state: 'blocked' | 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'superseded';
    reasonCode?: string;
    reason?: string;
    resultId?: string;
}
export declare class WorkflowContinuationService {
    private app;
    constructor(app: ResearchApp);
    private root;
    private identity;
    private modelIdentity;
    private row;
    private bound;
    private eligibility;
    private proof;
    confirm(actor: Actor, projectId: string, sessionId: string, value: unknown): WorkflowStatus;
    existingHandoffStatus(projectId: string, rootSessionId: string, source: Source): WorkflowStatus;
    assertBindingCurrent(id: string): Row<WorkflowContinuation>;
    forMessage(message: Message | undefined): string | undefined;
    assertClaim(message: Row<Message>): Row<WorkflowContinuation> | undefined;
    assertActor(actor: Actor): Row<WorkflowContinuation>;
    consumed(message: Row<Message>, generation: number): boolean;
    humanConsumed(sessionId: string, messageId: string): void;
    invalidate(id: string, reasonCode: string): void;
    stop(sessionId: string): void;
    waiting(message: Message): void;
    fail(message: Row<Message>, code: string): void;
    status(receipt: Row<WorkflowContinuation>): WorkflowStatus;
    list(actor: Actor, projectId: string, sessionId: string): WorkflowStatus[];
}
export {};
