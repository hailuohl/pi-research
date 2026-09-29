import type { SourceSnapshot } from '../domain/types.js';
import type { DataPaths } from '../storage/data-paths.js';
/** Docker mechanics shared by development jobs and formal Runs; no business-purpose coupling. */
export interface DockerJob {
    id: string;
    containerName: string;
    containerId?: string;
    startRequested: boolean;
    manifestDigest: string;
    controlDir: string;
    outputDir: string;
    manifest: {
        inputSnapshot: SourceSnapshot;
        dataArtifacts: Array<{
            id: string;
            path: string;
            digest: string;
            size: number;
        }>;
        command: string[];
        environmentImageDigest: string;
        dockerContext: string;
        resources: {
            pids: number;
            cpus: number;
            memoryMb: number;
            workMb: number;
            logBytes: number;
        };
    };
}
/** Short-lived execution paths; the original approved manifest and its digest remain untouched. */
export declare function physicalDockerJob(job: DockerJob, paths: DataPaths): DockerJob;
export declare const JOB_LABEL = "pi-research.sandbox-job";
export declare const MANIFEST_LABEL = "pi-research.manifest";
export declare const BOOTSTRAP = "cp -R /source/. /work/ && chmod -R u+rwX /work && find /work -type f -exec chmod 644 {} + && exec \"$@\"";
export declare function stageInputs(job: DockerJob): void;
export declare function dockerEnv(): NodeJS.ProcessEnv;
export declare function docker(context: string, args: string[], timeout?: number, limit?: number): Promise<string>;
export declare function preflight(context: string, image: string, options?: {
    allowLocalImageId?: boolean;
}): Promise<string>;
/** Read-only local engine identity; context aliases are not independent compute targets. */
export declare function probeDockerTarget(context: string): Promise<{
    targetId: string;
    engineId: string;
    endpoint: string;
}>;
export interface Container {
    Id: string;
    Image: string;
    Config: {
        Labels: Record<string, string>;
    };
    State: {
        Status: string;
        Running: boolean;
        ExitCode: number;
        StartedAt: string;
        FinishedAt: string;
        Error?: string;
    };
}
export declare function inspect(job: DockerJob): Promise<Container | null>;
/** Retire an ambiguous prior start without ever issuing another start request. */
export declare function retireUncertainStart(job: DockerJob, fence: () => unknown, run?: typeof docker, read?: typeof inspect): Promise<Container | null>;
export declare function createArgs(job: DockerJob): string[];
