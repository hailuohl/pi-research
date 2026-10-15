import type { ResearchApp } from '../research-app.js';
import type { Actor, Row } from '../domain/types.js';
import type { Campaign, CampaignDecision } from './types.js';
export declare class DecisionService {
    private app;
    constructor(app: ResearchApp);
    /** Includes membership and true result states; excludes heartbeat and UI/session noise. */
    inputDigest(c: Row<Campaign>): string;
    private validate;
    propose(actor: Actor, id: string, value: unknown): Row<CampaignDecision>;
    apply(actor: Actor, id: string, expectedVersion: number): Row<CampaignDecision>;
}
