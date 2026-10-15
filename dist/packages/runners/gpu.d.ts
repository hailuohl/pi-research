import type { AppContext } from '../domain/context.js';
import type { Actor, ResearchContract } from '../domain/types.js';
export interface GpuRequest {
    vendor: 'nvidia';
    deviceIds: string[];
}
export interface GpuDevice {
    uuid: string;
    name: string;
    memoryMb: number;
}
export interface GpuTarget {
    backend: 'local' | 'docker' | 'ssh';
    targetId: string;
    context?: string;
    sshTargetId?: string;
    localRuntimeId?: string;
    observedAt: string;
    devices: GpuDevice[];
}
export declare function validateGpu(value: unknown): GpuRequest;
export declare function parseGpuInventory(stdout: string): GpuDevice[];
export declare function nativeGpuInventory(): Promise<GpuDevice[]>;
export declare function assertGpuDevices(request: GpuRequest, devices: GpuDevice[]): void;
export declare function currentDockerContext(): string;
export declare class GpuService {
    private c;
    constructor(c: AppContext);
    list(): GpuTarget[];
    saved(contract: ResearchContract): GpuTarget;
    probe(actor: Actor, value: unknown): Promise<GpuTarget>;
}
