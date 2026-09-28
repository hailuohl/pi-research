import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Experiment, ChangeProposal } from '../domain/types.js';
/** Immutable, explicitly reviewed file handoff. This is NOT a Git merge or a test runner. */
export declare class ChangeProposalService {
    private app;
    constructor(app: ResearchApp);
    get(actor: Actor, id: string): Row<ChangeProposal>;
    private payload;
    private content;
    prepare(actor: Actor, projectId: string, value: unknown): Row<ChangeProposal>;
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
    apply(actor: Actor, id: string): Row<Experiment>;
}
