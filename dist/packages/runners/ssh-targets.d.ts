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
    managed?: boolean;
    verified?: SshTarget;
}
export declare class SshTargetService {
    private c;
    private request;
    constructor(c: AppContext, request?: typeof sshRequest);
    private scan;
    private onboarding;
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
        managed: boolean;
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
    observe(id: string, validate?: () => void): Promise<SshTarget>;
    verify(id: string, background?: boolean, validate?: () => void): Promise<SshTarget>;
    private verifyUnlocked;
    private assertSetupIdle;
    private assertAvailable;
    private assertTrust;
    challenge(actor: Actor, value: unknown): Promise<{
        challengeId: string;
        id: string;
        host: string;
        port: number;
        user: string;
        remoteRoot: string;
        keyType: string;
        fingerprint: string;
        expiresAt: string;
    }>;
    confirm(actor: Actor, value: unknown): Promise<{
        errorCode?: string | undefined;
        id: string;
        version: number;
        verified: boolean;
    }>;
    private reserveSetup;
    private setupTarget;
    private setupResult;
    setup(actor: Actor, value: unknown): Promise<{
        errorCode?: string | undefined;
        id: string;
        version: number;
        verified: boolean;
    }>;
    private healthFailure;
    private runSetup;
}
