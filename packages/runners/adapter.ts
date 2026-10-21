import type {Row, Run} from '../domain/types.js';
import type {DataPaths} from '../storage/data-paths.js';

export interface RunnerCapabilities {backend: 'local' | 'docker' | 'trusted-example' | 'ssh'; isolated: boolean; recoverable: boolean;}
export type RunnerLogSink = (stream: 'stdout' | 'stderr', chunk: Buffer) => void;
export interface RunnerProcess {
    pid?: number;
    completion: Promise<{exitCode: number | null; signal?: NodeJS.Signals | null; error?: string}>;
    cancel(): Promise<void>;
    /** Detach only the controller's stream; never stop the independent workload. */
    detach?(): Promise<void>;
}
/** Only real common operations; durable inspection and recovery belong to Docker. */
export interface RunnerAdapter {
    readonly capabilities: RunnerCapabilities;
    preflight(): Promise<void>;
    stage(): Promise<void>;
    start(onLog: RunnerLogSink): Promise<RunnerProcess>;
}
export interface RunExecution {
    backend: 'local' | 'docker' | 'ssh';
    sshHandle?: string;
    dockerContext: string;
    containerName: string;
    containerId?: string;
    imageId?: string;
    controlDir: string;
    generation: number;
    leaseUntil: number;
    startRequested: boolean;
    recoveryCount: number;
    localExecutionId?: string;
    logTruncated?: boolean;
    logsIncomplete?: boolean;
    outputExceeded?: boolean;
}
export type DockerRun = Row<Run> & {execution: RunExecution};
export interface DockerRunResult {
    state: 'succeeded' | 'failed' | 'cancelled';
    exitCode: number | null;
    error?: string;
    incomplete: boolean;
    logTruncated: boolean;
    outputExceeded: boolean;
    generation: number;
    localCompletion?: {version:2;executionId:string;manifestDigest:string;stopped:true;exitCode:number|null;cancelled:boolean};
}
export interface DockerSupervisorCallbacks {
    paths?:DataPaths;
    verifyTarget?(): Promise<void>;
    read(): DockerRun;
    patch(patch: Partial<Run> & {execution?: RunExecution}): DockerRun;
    assertGrant(run: DockerRun): void;
    /** Throws when this worker no longer owns its generation/lease. */
    fence(): void;
    finalize(result: DockerRunResult): void | Promise<void>;
}
