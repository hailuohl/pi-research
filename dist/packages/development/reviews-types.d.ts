import type { SourceIntegrityContext } from '../storage/source-integrity.js';
import { type ReviewObligation, type FIXED_REVIEW_READING } from './review-obligations.js';
import type { Store } from '../storage/store.js';
import type { Row, Task, Team, ResearchBriefRef } from '../domain/types.js';
import type { SandboxJob } from '../execution/contracts.js';
import type { ResearchSourceInput } from '../research-workflows/source-inputs.js';
import { type ReviewTestArtifact, type ReviewInventory } from './review-assessment.js';
import type { DraftRole, ProtocolDocument } from '../research-workflows/method-contracts.js';
export interface DevelopmentReview {
    readingProtocol?: typeof FIXED_REVIEW_READING;
    readingObligations?: ReviewObligation[];
    jobId: string;
    sourceDigest: string;
    producerSessionId: string;
    baseSourceRevisionId?: string;
    teamId: string;
    taskId: string;
    approvalId: string;
    manifestEvidenceId: string;
    testEvidenceIds: string[];
    requiredEvidenceIds: string[];
    digest: string;
    dataArtifacts?: Array<Omit<SandboxJob['manifest']['dataArtifacts'][number], 'path'>>;
    protocolVersion?: 1 | 2;
    briefArtifact?: {
        id: string;
        digest: string;
        size: number;
        path: string;
    };
    surfaceInventory?: ReviewInventory;
    researchBrief?: ResearchBriefRef;
    sourceInputs?: ResearchSourceInput[];
    testArtifacts?: ReviewTestArtifact[];
    draftRoles?: DraftRole[];
    protocolDocument?: ProtocolDocument;
}
export declare function reviewInputBinding(r: Pick<DevelopmentReview, 'jobId' | 'dataArtifacts' | 'protocolVersion' | 'researchBrief' | 'sourceInputs' | 'testArtifacts' | 'draftRoles' | 'protocolDocument' | 'briefArtifact' | 'surfaceInventory' | 'readingProtocol' | 'readingObligations'> & {
    id: string;
}): {
    protocolDocument?: ProtocolDocument | undefined;
    draftRoles?: DraftRole[] | undefined;
    protocolVersion?: 2 | 1 | undefined;
    researchBrief?: ResearchBriefRef | undefined;
    sourceInputs?: ResearchSourceInput[] | undefined;
    testArtifacts?: ReviewTestArtifact[] | undefined;
    dataArtifacts?: Omit<{
        id: string;
        digest: string;
        size: number;
        path: string;
        sourceAcceptanceId?: string;
    }, "path">[] | undefined;
    readingProtocol?: "fixed-obligations-v1" | undefined;
    readingObligations?: ReviewObligation[] | undefined;
    briefArtifact?: {
        id: string;
        digest: string;
        size: number;
        path: string;
    } | undefined;
    surfaceInventory?: ReviewInventory | undefined;
    reviewId: string;
    jobId: string;
};
export type DevelopmentReviewInputBinding = ReturnType<typeof reviewInputBinding>;
export declare function reviewPayload(r: DevelopmentReview): {
    protocolDocument?: ProtocolDocument | undefined;
    draftRoles?: DraftRole[] | undefined;
    protocolVersion?: 2 | 1 | undefined;
    researchBrief?: ResearchBriefRef | undefined;
    sourceInputs?: ResearchSourceInput[] | undefined;
    testArtifacts?: ReviewTestArtifact[] | undefined;
    dataArtifacts?: Omit<{
        id: string;
        digest: string;
        size: number;
        path: string;
        sourceAcceptanceId?: string;
    }, "path">[] | undefined;
    teamId: string;
    taskId: string;
    approvalId: string;
    manifestEvidenceId: string;
    testEvidenceIds: string[];
    requiredEvidenceIds: string[];
    baseSourceRevisionId?: string | undefined;
    readingProtocol?: "fixed-obligations-v1" | undefined;
    readingObligations?: ReviewObligation[] | undefined;
    briefArtifact?: {
        id: string;
        digest: string;
        size: number;
        path: string;
    } | undefined;
    surfaceInventory?: ReviewInventory | undefined;
    jobId: string;
    sourceDigest: string;
    producerSessionId: string;
};
/** Shared by dispatch and acceptance: historical records cannot silently acquire a new test target. */
export declare function assertDevelopmentReviewTarget(store: Store, pid: string, r: Row<DevelopmentReview>, integrity?: SourceIntegrityContext): {
    job: Row<SandboxJob>;
    task: Row<Task>;
    team: Row<Team>;
};
export declare function developmentReviewAcceptanceBasis(store: Store, pid: string, task: Row<Task>, integrity?: SourceIntegrityContext): {
    reviewId: string;
    digest: string;
    jobId: string;
    sourceDigest: string;
    manifestEvidenceId: string;
    testEvidenceIds: string[];
    inputAcceptanceIds: string[];
} | undefined;
