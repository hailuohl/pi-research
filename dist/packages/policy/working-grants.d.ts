import type { ResearchApp } from '../research-app.js';
import type { Actor, Row } from '../domain/types.js';
import type { DevelopmentTask, SandboxManifest, WorkingGrantReference } from '../execution/contracts.js';
import type { WorkingGrant, WorkingGrantUse, WorkingGrantDTO } from './working-grant-types.js';
export type { WorkingGrant, WorkingGrantUse, WorkingGrantDTO } from './working-grant-types.js';
export { assertWorkingGrantJob } from './working-grant-validation.js';
/** Exact private paths and a permanent submission ledger; no model or formal Run permission. */
export declare class WorkingGrantService {
    private app;
    constructor(app: ResearchApp);
    private session;
    private path;
    private origin;
    private uses;
    inspect(actor: Actor, pid: string, id: string): WorkingGrantDTO;
    prepare(actor: Actor, pid: string, value: unknown): WorkingGrantDTO;
    activate(actor: Actor, pid: string, value: unknown): WorkingGrantDTO;
    revoke(actor: Actor, pid: string, value: unknown): WorkingGrantDTO;
    /** Host-only binding lookup: caller cannot omit a grant to restore legacy permissions. */
    forPreparation(actor: Actor, pid: string, sessionId: string): Row<WorkingGrant> | undefined;
    assertSourcePreparation(actor: Actor, pid: string, sessionId: string): void;
    private workspaceFiles;
    assertWrite(actor: Actor, pid: string, sessionId: string, path: string, content?: string, mode?: '100644' | '100755'): void;
    assertWorkspace(actor: Actor, pid: string, sessionId: string): void;
    authorizeManifest(g: Row<WorkingGrant>, manifest: SandboxManifest): WorkingGrantReference;
    /** Called in the submission transaction after the exact per-test manifest passed validation. */
    consume(pid: string, task: Row<DevelopmentTask>, jobId: string): Row<WorkingGrantUse> | undefined;
}
