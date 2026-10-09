import type { ResearchApp } from '../../packages/research-app.js';
import { type Row } from '../../packages/domain/types.js';
export declare function campaignDemo(app: ResearchApp, progress?: (message: string) => void): Promise<{
    version: string;
    aiUsed: boolean;
    projectId: string;
    sessionId: string;
    campaign: Row<import("../../packages/research-workflows/types.js").Campaign>;
    rounds: Row<import("../../packages/research-workflows/types.js").ResearchRound>[];
    decisions: Row<import("../../packages/research-workflows/types.js").CampaignDecision>[];
    observations: Row<import("../../packages/research-workflows/types.js").RunObservation>[];
    runs: {
        id: string;
        experimentId: string;
        state: "unknown" | "succeeded" | "failed" | "cancelled" | "queued" | "running" | "cancelling" | "submitting";
        integrity: "pending" | "complete" | "incomplete" | "invalid";
        metrics: Record<string, number> | undefined;
        snapshotDigest: string;
        evidenceIds: string[];
    }[];
    retainedExperimentId: string;
    nextExperimentId: string;
    reportId: string;
    reportPath: string;
    traceArtifactId: string;
    limitations: string;
}>;
