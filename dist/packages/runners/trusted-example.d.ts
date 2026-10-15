import type { Row, Run } from '../domain/types.js';
import type { RunnerAdapter, RunnerCapabilities, RunnerLogSink, RunnerProcess } from './adapter.js';
import type { DataPaths } from '../storage/data-paths.js';
/** This host backend runs only the bundled, hash-verified numerical example. */
export declare class TrustedExampleAdapter implements RunnerAdapter {
    private readonly run;
    private readonly repoRoot;
    private readonly paths?;
    readonly capabilities: RunnerCapabilities;
    private started;
    private readonly controlDir;
    private readonly snapshotDir;
    private readonly outputDir;
    constructor(run: Row<Run>, repoRoot: string, paths?: DataPaths | undefined);
    preflight(): Promise<void>;
    stage(): Promise<void>;
    start(onLog: RunnerLogSink): Promise<RunnerProcess>;
}
