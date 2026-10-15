import type { Actor, ResearchBriefRef, Row } from '../domain/types.js';
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
    capture(actor: Actor, projectId: string, rootSessionId: string): ResearchBriefRef | undefined;
    assertReference(actor: Actor, projectId: string, rootSessionId: string, ref: ResearchBriefRef): void;
    /** Host-only: validate admission evidence without granting access to brief contents. */
    assertAdmission(projectId: string, ref: ResearchBriefRef): void;
    save(actor: Actor, projectId: string, sessionId: string, input: unknown): Row<ResearchBrief>;
    inspect(actor: Actor, projectId: string, sessionId: string, briefId?: string): ResearchBriefInspection;
    confirm(actor: Actor, projectId: string, sessionId: string, input: unknown): Row<ResearchBrief>;
}
