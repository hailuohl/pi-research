import type { Row } from '../domain/types.js';
import type { SandboxJob } from './contracts.js';
export declare const JOB_LABEL = "pi-research.sandbox-job";
export declare const MANIFEST_LABEL = "pi-research.manifest";
export declare const BOOTSTRAP = "cp -R /source/. /work/ && chmod -R u+rwX /work && find /work -type f -exec chmod 644 {} + && exec \"$@\"";
export declare function stageInputs(job: Row<SandboxJob>): void;
export declare function dockerEnv(): NodeJS.ProcessEnv;
export declare function docker(context: string, args: string[], timeout?: number, limit?: number): Promise<string>;
export declare function preflight(context: string, image: string): Promise<string>;
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
export declare function inspect(job: Row<SandboxJob>): Promise<Container | null>;
/** Retire an ambiguous prior start without ever issuing another start request. */
export declare function retireUncertainStart(job: Row<SandboxJob>, fence: () => unknown, run?: typeof docker, read?: typeof inspect): Promise<Container | null>;
export declare function createArgs(job: Row<SandboxJob>): string[];
