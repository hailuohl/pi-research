import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Experiment, ChangeProposal } from '../domain/types.js';
export declare function changeProposalPayload(p: ChangeProposal): {
    flow?: "reviewed-development" | undefined;
    reviewId?: string | undefined;
    reviewAcceptanceId?: string | undefined;
    testJobId?: string | undefined;
    rootSessionId?: string | undefined;
    baseExperimentId: string;
    baseRevision: number;
    baseSnapshot: import("../domain/types.js").SourceSnapshot;
    contractDigest: string;
    title: string;
    hypothesis: string;
    changes: {
        path: string;
        expectedDigest: string | null;
        artifactId: string | null;
        artifactDigest: string | null;
        taskId?: string;
        taskResultDigest?: string;
        sourceAcceptanceId?: string;
        mode?: "100644" | "100755";
        beforeMode?: "100644" | "100755";
    }[];
    candidateSnapshot: import("../domain/types.js").SourceSnapshot;
};
/** Immutable, explicitly reviewed file handoff. This is NOT a Git merge or a test runner. */
export declare class ChangeProposalService {
    private app;
    constructor(app: ResearchApp);
    get(actor: Actor, id: string): Row<ChangeProposal>;
    private ownerSession;
    private content;
    prepare(actor: Actor, projectId: string, value: unknown, sessionId?: string): Row<ChangeProposal>;
    /** The reviewed flow derives the entire candidate from tested CAS, never caller-supplied file mappings. */
    prepareReviewed(actor: Actor, projectId: string, value: unknown): Row<ChangeProposal>;
    inspect(actor: Actor, id: string): {
        proposal: Row<ChangeProposal>;
        files: {
            path: string;
            expectedDigest: string | null;
            artifactDigest: string | null;
            beforeMode: "100644" | "100755" | undefined;
            afterMode: "100644" | "100755" | undefined;
            before: string | null;
            after: string | null;
        }[];
    };
    applyAutomatic(actor: Actor, ref: import('../policy/automatic-approvals.js').AutomaticApprovalReference, id: string): Row<Experiment>;
    apply(actor: Actor, id: string): Row<Experiment>;
}
