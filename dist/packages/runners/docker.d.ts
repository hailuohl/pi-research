import { type Container, type DockerJob } from '../execution/docker.js';
import type { DataPaths } from '../storage/data-paths.js';
import type { DockerRun, RunnerAdapter, RunnerCapabilities, RunnerLogSink, RunnerProcess } from './adapter.js';
export declare function formalDockerJob(run: DockerRun): DockerJob;
export declare class DockerAdapter implements RunnerAdapter {
    readonly run: DockerRun;
    private readonly fence;
    private readonly verifyTarget?;
    readonly capabilities: RunnerCapabilities;
    readonly job: DockerJob;
    imageId?: string;
    constructor(run: DockerRun, fence: () => void, verifyTarget?: (() => Promise<void>) | undefined, paths?: DataPaths);
    private guarded;
    preflight(): Promise<void>;
    stage(): Promise<void>;
    inspect(): Promise<Container | null>;
    /** Create-or-adopt only. Starting requires a separately persisted startRequested fence. */
    submit(): Promise<Container>;
    private capture;
    start(onLog: RunnerLogSink): Promise<RunnerProcess>;
    readLogs(onLog: RunnerLogSink): Promise<RunnerProcess>;
    cancel(): Promise<Container | null>;
    reconcile(): Promise<Container | null>;
    private retireStart;
    /** Validate stopped output without granting it evidence authority; RunService archives it. */
    collect(): Promise<{
        incomplete: boolean;
        outputExceeded: boolean;
        errors: string[];
    }>;
}
