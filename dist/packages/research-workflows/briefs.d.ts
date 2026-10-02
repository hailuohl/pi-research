import type { Actor, Row } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
export interface ResearchBrief {
    rootSessionId: string;
    revision: number;
    previousRevisionId?: string;
    question: string;
    scope: string;
    constraints: string[];
    successCriteria: string[];
    clarificationQuestions: string[];
    literatureSummary: string;
    hypotheses: Array<{
        statement: string;
        evidenceIds: string[];
    }>;
    evidenceIds: string[];
    steps: Array<{
        title: string;
        description: string;
    }>;
    status: 'clarifying' | 'ready' | 'confirmed';
    digest: string;
}
export interface ResearchBriefInspection {
    brief: Row<ResearchBrief> | null;
    latestId: string | null;
    history: Array<{
        id: string;
        revision: number;
        status: ResearchBrief['status'];
        digest: string;
    }>;
    evidenceChecks: Array<{
        evidenceId: string;
        current: boolean;
        code?: string;
    }>;
    blockedReason?: string;
}
export declare class ResearchBriefService {
    private app;
    constructor(app: ResearchApp);
    private root;
    private checkEvidence;
    save(actor: Actor, projectId: string, sessionId: string, input: unknown): Row<ResearchBrief>;
    inspect(actor: Actor, projectId: string, sessionId: string, briefId?: string): ResearchBriefInspection;
    confirm(actor: Actor, projectId: string, sessionId: string, input: unknown): Row<ResearchBrief>;
}
