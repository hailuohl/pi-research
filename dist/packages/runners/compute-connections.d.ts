import type { AppContext } from '../domain/context.js';
import type { Actor } from '../domain/types.js';
import type { SshTargetService } from './ssh-targets.js';
import type { GpuDevice } from './gpu.js';
export declare const CONNECTION_TTL_MS = 30000;
export interface ConnectionObservation {
    attempt: string;
    configurationDigest?: string;
    status: 'unverified' | 'verified' | 'unavailable';
    checkedAt?: string;
    validUntil?: string;
    errorCode?: string;
    targetId?: string;
    serverVersion?: string;
    cpus?: number;
    memoryMb?: number;
    devices?: GpuDevice[];
}
export interface ConnectionState {
    status: 'unverified' | 'verified' | 'stale' | 'unavailable';
    checkedAt?: string;
    validUntil?: string;
    errorCode?: string;
    targetId?: string;
}
export interface DockerConnection extends ConnectionState {
    context: string;
    serverVersion?: string;
    cpus?: number;
    memoryMb?: number;
}
export interface SshPreferences {
    version: number;
    cpu: boolean;
    gpu: boolean;
}
export interface SshConnection extends ConnectionState {
    id: string;
    configurationVersion: number;
    preferences: SshPreferences;
    capabilities: {
        cpu: boolean;
        gpu: boolean;
    };
    gpuDevices: GpuDevice[];
    gpuValidUntil?: string;
    host?: string;
    port?: number;
    user?: string;
    remoteRoot?: string;
}
/** Observations are separate from frozen execution identities and never contain stderr or credentials. */
export declare class ComputeConnectionService {
    private c;
    constructor(c: AppContext);
    observation(id: string, kind?: string): ConnectionObservation | undefined;
    private save;
    begin(id: string, configurationDigest?: string, kind?: string): string;
    finish(id: string, attempt: string, value: Omit<ConnectionObservation, 'attempt'>, kind?: string): boolean;
    invalidateSsh(id: string, configurationDigest: string): void;
    preferences(id: string): SshPreferences;
    configurePreferences(actor: Actor, value: unknown, targets: SshTargetService): {
        version: number;
        cpu: boolean;
        gpu: boolean;
        id: string;
    };
    private state;
    private contextState;
    docker(context: string): DockerConnection;
    list(actor: Actor, targets: SshTargetService): {
        docker: DockerConnection[];
        ssh: SshConnection[];
    };
    private ssh;
}
export declare function localHardware(): {
    cpuModel: string;
    logicalCpus: number;
    totalMemoryMb: number;
    freeMemoryMb: number;
    arch: NodeJS.Architecture;
};
