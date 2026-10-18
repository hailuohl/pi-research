import type { Actor, ResearchBriefRef, Row } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import type { DraftFile } from './draft-reads.js';
import { type ResearchSourceInput } from './source-inputs.js';
import type { Store } from '../storage/store.js';
import { type FrozenMethodContract, type MethodRequirement, type DraftRole, type ProtocolDocument } from './method-contracts.js';
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
    draftFiles?: DraftFile[];
    sourceInputs?: ResearchSourceInput[];
    methodContract?: FrozenMethodContract;
    methodRequirements?: MethodRequirement[];
    draftRoles?: DraftRole[];
    protocolDocument?: ProtocolDocument;
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
export declare function fixedResearchBrief(store: Store, projectId: string, ref: ResearchBriefRef, phase?: 'formal'): Row<ResearchBrief>;
export declare class ResearchBriefService {
    private app;
    constructor(app: ResearchApp);
    private root;
    private checkEvidence;
    capture(actor: Actor, projectId: string, rootSessionId: string, phase?: 'formal'): ResearchBriefRef | undefined;
    assertReference(actor: Actor, projectId: string, rootSessionId: string, ref: ResearchBriefRef, phase?: 'formal'): void;
    captureDevelopmentReference(actor: Actor, projectId: string, sessionId: string): ResearchBriefRef | undefined;
    /** Host-only: validate admission evidence without granting access to brief contents. */
    assertAdmission(projectId: string, ref: ResearchBriefRef, phase?: 'formal'): void;
    validateReadyDrafts(actor: Actor, projectId: string, sessionId: string, input: unknown): void;
    sourceInputFingerprint(sessionId: string, expectedRevisionId: string | null): {
        digest: string;
        workspace: string;
        path: string;
        size: number;
        readId: string;
        artifactId?: string;
    }[] | undefined;
    save(actor: Actor, projectId: string, sessionId: string, input: unknown): Row<ResearchBrief>;
    inspect(actor: Actor, projectId: string, sessionId: string, briefId?: string): ResearchBriefInspection;
    confirm(actor: Actor, projectId: string, sessionId: string, input: unknown): Row<ResearchBrief>;
}
