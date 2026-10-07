import type { AppContext } from '../domain/context.js';
import type { Actor } from '../domain/types.js';
import { sshRequest } from './ssh.js';
export interface SshTarget {
    id: string;
    version: number;
    hostKeyDigest: string;
    configDigest: string;
    engineId: string;
    protocolDigest: string;
    targetId: string;
    gpuProtocol?: boolean;
}
export interface PrivateSshTarget {
    id: string;
    version: number;
    host: string;
    port: number;
    user: string;
    identityFile: string;
    knownHostsFile: string;
    remoteRoot: string;
    identityDigest: string;
    hostKeyDigest: string;
    gpuProtocol?: boolean;
    verified?: SshTarget;
}
export declare class SshTargetService {
    private c;
    private request;
    constructor(c: AppContext, request?: typeof sshRequest);
    private file;
    private read;
    private write;
    configure(actor: Actor, value: unknown): {
        id: string;
        version: number;
        verified: boolean;
    };
    private configDigest;
    directory(): {
        target: PrivateSshTarget;
        configurationDigest: string;
    }[];
    inspect(actor: Actor, id: string): {
        id: string;
        version: number;
        host: string;
        port: number;
        user: string;
        identityFile: string;
        knownHostsFile: string;
        remoteRoot: string;
        gpuProtocol: boolean;
    };
    privateTarget(id: string): PrivateSshTarget;
    frozen(id: string, currentProtocol?: boolean): SshTarget;
    assertFrozen(target: SshTarget, currentProtocol?: boolean): void;
    list(actor: Actor): (SshTarget | {
        id: string;
        version: number;
        verified: boolean;
    })[];
    get(actor: Actor, id: string): SshTarget;
    probe(actor: Actor, id: string): Promise<SshTarget>;
    verify(id: string): Promise<SshTarget>;
}
