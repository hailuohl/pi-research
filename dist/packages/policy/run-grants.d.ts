import type { ResearchApp } from '../research-app.js';
import type { Actor } from '../domain/types.js';
import type { RunGrantDTO } from './run-grant-types.js';
export type { RunGrant, RunGrantDTO, RunGrantEntry, RunGrantReference, RunGrantTaskBinding, RunGrantUse } from './run-grant-types.js';
export { assertRunGrantRun, assertRunGrantIntent } from './run-grant-validation.js';
export declare class RunGrantService {
    private app;
    constructor(app: ResearchApp);
    private source;
    private fresh;
    inspect(actor: Actor, pid: string, id: string): RunGrantDTO;
    prepare(actor: Actor, pid: string, value: unknown): RunGrantDTO;
    activate(actor: Actor, pid: string, value: unknown): RunGrantDTO;
    revoke(actor: Actor, pid: string, value: unknown): RunGrantDTO;
}
