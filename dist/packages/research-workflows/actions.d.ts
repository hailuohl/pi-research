import type { Actor, Row } from '../domain/types.js';
import type { PermissionReference } from '../policy/session-permissions.js';
import type { ResearchApp } from '../research-app.js';
import { type ResearchActionInput, type ResearchActionDecision } from '../contracts/operations/research-action-schemas.js';
export type { ResearchActionInput, ResearchActionDecision } from '../contracts/operations/research-action-schemas.js';
export interface ResearchAction {
    sessionId: string;
    originMessageId: string;
    originDigest: string;
    generation: number;
    modelDigest: string;
    permissionReference: PermissionReference;
    lifecycleEpoch: number;
    actionKind: ResearchActionInput['kind'];
    input: ResearchActionInput;
    textCorpus?: {
        corpusId: string;
        configurationVersion: number;
    };
    sourceDigest: string;
    requestDigest: string;
    expiresAt: string;
    state: 'pending' | 'completed' | 'rejected';
    resultRef?: {
        grantId: string;
    } | {
        reportId: string;
    };
    decision?: ResearchActionDecision;
    decisionVersion?: number;
    completionSourceDigest?: string;
    completionPermissionReference?: PermissionReference;
}
export type ResearchActionDTO = Row<ResearchAction> & {
    effectiveState: ResearchAction['state'] | 'stale' | 'expired';
    reasons: string[];
};
export type ResearchActionSummary = Pick<ResearchActionDTO, 'id' | 'sessionId' | 'state' | 'effectiveState' | 'expiresAt' | 'resultRef'> & {
    kind: ResearchActionInput['kind'];
};
export declare class ResearchActionService {
    private app;
    constructor(app: ResearchApp);
    private root;
    private origin;
    private corpus;
    /** Hash metadata and its linked provenance; never open original text while preparing a card. */
    private source;
    private view;
    list(actor: Actor, pid: string, sessionId: string): ResearchActionDTO[];
    inspect(actor: Actor, pid: string, sessionId: string, requestId: string): ResearchActionSummary;
    prepare(actor: Actor, pid: string, sessionId: string, value: unknown, receiptId?: string): ResearchActionSummary;
    decide(actor: Actor, pid: string, sessionId: string, value: unknown): ResearchActionSummary;
}
