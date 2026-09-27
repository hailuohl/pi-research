import type { AppContext } from '../domain/context.js';
import type { Actor, Experiment, Row, ChangeProposal } from '../domain/types.js';
import { ProjectService } from './projects.js';
export declare class ExperimentService {
    private c;
    private projects;
    constructor(c: AppContext, projects: ProjectService);
    get(actor: Actor, id: string): Row<Experiment>;
    create(actor: Actor, projectId: string, input: unknown): Row<Experiment>;
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
