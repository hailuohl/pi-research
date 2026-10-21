import type { AppContext } from '../domain/context.js';
import type { Actor } from '../domain/types.js';
export interface LocalRuntime {
    protocolVersion?: 2;
    id: string;
    version: number;
    executableName: string;
    runtimeVersion: string;
    executableDigest: string;
    hostId: string;
    platform: string;
    protocolDigest: string;
    digest: string;
}
interface PrivateRuntime extends LocalRuntime {
    executable: string;
}
export declare function hostIdentity(): string;
export declare function executablePath(value: string): string;
export declare function localEnvironment(control: string, output: string, gpus?: string[]): NodeJS.ProcessEnv;
export declare class LocalRuntimeService {
    private c;
    constructor(c: AppContext);
    private file;
    private protocol;
    private read;
    list(): LocalRuntime[];
    configure(actor: Actor, value: unknown): LocalRuntime;
    frozen(id: string): LocalRuntime;
    resolve(id: string, expected?: LocalRuntime): PrivateRuntime;
}
export {};
