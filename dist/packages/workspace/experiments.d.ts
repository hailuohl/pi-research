import type { AppContext } from '../domain/context.js';
import type { Actor, Experiment, Row, ChangeProposal } from '../domain/types.js';
import type { ResearchBriefService } from '../research-workflows/briefs.js';
import { ProjectService } from './projects.js';
export declare class ExperimentService {
    private c;
    private projects;
    private briefs?;
    automation?: import('../policy/research-automation.js').ResearchAutomationService;
    constructor(c: AppContext, projects: ProjectService, briefs?: ResearchBriefService | undefined);
    get(actor: Actor, id: string): Row<Experiment>;
    /** Internal fixed-plan derivation; source is an immutable revision, never a caller filesystem path. */
    createFromRevision(actor: Actor, projectId: string, snapshotId: string, spec: {
        title: string;
        hypothesis: string;
        config?: Record<string, unknown>;
    }): Row<Experiment>;
    create(actor: Actor, projectId: string, input: unknown, selectedRootSessionId?: string): Row<Experiment>;
    /** Host-only integration of a fixed proposal; never takes caller-supplied filesystem paths. */
    createApprovedChild(actor: Actor, proposal: Row<ChangeProposal>): Row<Experiment>;
    readFile(actor: Actor, id: string, path: string): {
        path: string;
        content: string;
        digest: string;
        size: number;
    };
    writeFile(actor: Actor, id: string, path: string, content: string, expectedDigest: string | null, expectedVersion: number): {
        path: string;
        digest: string;
        size: number;
    };
    note(actor: Actor, id: string, content: string): Row<Experiment>;
}
