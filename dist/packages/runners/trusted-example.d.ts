import type { Row, Run } from '../domain/types.js';
import type { RunnerAdapter, RunnerCapabilities, RunnerLogSink, RunnerProcess } from './adapter.js';
/** This host backend runs only the bundled, hash-verified numerical example. */
export declare class TrustedExampleAdapter implements RunnerAdapter {
    private readonly run;
    private readonly repoRoot;
    readonly capabilities: RunnerCapabilities;
    private started;
    private readonly controlDir;
    constructor(run: Row<Run>, repoRoot: string);
    preflight(): Promise<void>;
    stage(): Promise<void>;
    start(onLog: RunnerLogSink): Promise<RunnerProcess>;
}
