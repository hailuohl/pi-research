import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Session } from '../domain/types.js';
import type { Campaign, CampaignMember, ResearchRound, RunObservation, CampaignDecision, ResearchCandidate } from './types.js';
/** Business state only. Never starts a model or a process while holding a transaction. */
export declare class CampaignService {
    private app;
    constructor(app: ResearchApp);
    get(actor: Actor, id: string): Row<Campaign>;
    rounds(actor: Actor, id: string): Row<ResearchRound>[];
    members(actor: Actor, id: string): Row<CampaignMember>[];
    observations(actor: Actor, id: string): Row<RunObservation>[];
    decisions(actor: Actor, id: string): Row<CampaignDecision>[];
    coordinator(actor: Actor, c: Row<Campaign>): void;
    prepareSession(actor: Actor, projectId: string, sessionId: string): Row<Session>;
    assertActive(c: Row<Campaign>): void;
    create(actor: Actor, projectId: string, value: unknown): Row<Campaign>;
    prepare(actor: Actor, projectId: string, sessionId: string, value: unknown): Row<Campaign>;
    private createDraft;
    activateAutomatic(actor: Actor, ref: import('../policy/automatic-approvals.js').AutomaticApprovalReference, id: string, version: number): Row<Campaign>;
    activate(actor: Actor, id: string, expectedVersion: number): Row<Campaign>;
    pause(actor: Actor, id: string, expectedVersion: number): Row<Campaign>;
    resume(actor: Actor, id: string, expectedVersion: number): Row<Campaign>;
    private closeRound;
    stop(actor: Actor, id: string, value: unknown): Row<Campaign>;
    /** Internal caller must hold Store.transaction and validate the campaign state/version first. */
    addMember(c: Row<Campaign>, intentId: string, required: boolean, repairDecisionId?: string, candidate?: Row<ResearchCandidate>): Row<CampaignMember>;
    enroll(actor: Actor, id: string, value: unknown): Row<CampaignMember>;
    observe(): void;
    verifyObservation(c: Row<Campaign>, observationId: string): Row<RunObservation>;
}
