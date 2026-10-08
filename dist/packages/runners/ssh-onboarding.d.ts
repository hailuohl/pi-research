import type { AppContext } from '../domain/context.js';
import type { PrivateSshTarget } from './ssh-targets.js';
export interface SshHealth {
    supervisor: 'ready' | 'missing' | 'mismatch' | 'unsafe' | 'unknown';
    docker: 'ready' | 'missing' | 'unavailable' | 'unsupported' | 'unknown';
    workspace: 'ready' | 'missing' | 'invalid' | 'unknown';
    errorCode?: string;
    engineId?: string;
    protocolDigest?: string;
}
export interface HostKey {
    keyType: string;
    key: string;
    fingerprint: string;
}
export interface SshChallenge extends HostKey {
    challengeId: string;
    expiresAt: string;
    target: Omit<PrivateSshTarget, 'knownHostsFile' | 'hostKeyDigest' | 'verified'>;
    expectedVersion: number;
    confirmedVersion?: number;
}
export declare const SSH_SETUP_CODES: Set<string>;
export declare function setupError(error: unknown): string;
export declare function sshPrivateDir(c: AppContext): string;
export declare function privateJson<T>(c: AppContext, name: string): T | undefined;
export declare function savePrivateJson(c: AppContext, name: string, value: unknown): void;
export declare function challengeName(id: string): string;
export declare function endpoint(t: {
    host: string;
    port: number;
}): string;
export declare function trustName(t: {
    host: string;
    port: number;
}): string;
export declare function hostToken(t: {
    host: string;
    port: number;
}): string;
/** Validate the SSH wire key before hashing it; scanner output never supplies a hostname or options. */
export declare function parseHostKeys(output: string): HostKey[];
export declare function scanHostKeys(t: {
    host: string;
    port: number;
}): Promise<HostKey[]>;
/** The command is bundled code only. All values, including helper bytes, travel as JSON over stdin. */
export declare function sshOnboardingRequest(c: AppContext, t: PrivateSshTarget, action: 'inspect' | 'install'): Promise<SshHealth>;
