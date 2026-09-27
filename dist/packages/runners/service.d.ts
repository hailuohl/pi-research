import type { AppContext } from '../domain/context.js';
import type { Actor, RunIntent, Run, Row } from '../domain/types.js';
import { ApprovalService } from '../policy/approvals.js';
import { EvidenceService } from '../evidence/service.js';
export declare const TERMINAL: string[];
export declare class RunService {
    private c;
    private approvals;
    private evidence;
    private launching;
    constructor(c: AppContext, approvals: ApprovalService, evidence: EvidenceService);
    get(actor: Actor, id: string): Row<Run>;
    prepare(actor: Actor, experimentId: string): Row<RunIntent>;
    submit(actor: Actor, id: string): Row<Run>;
    /** Keep the version read and heartbeat write in one inter-process SQLite transaction. */
    heartbeat(id: string): Row<Run>;
    launchPending(): void;
    cancel(actor: Actor, id: string): Row<Run>;
    logs(actor: Actor, id: string, cursor?: number): {
        content: string;
        cursor: number;
        complete: boolean;
    };
    finalize(id: string, exitCode: number | null, state: 'succeeded' | 'failed' | 'cancelled', error?: string): Row<Run>;
    reviewOutcome(actor: Actor, id: string, value: unknown): Row<Run>;
    reconcile(): void;
}
