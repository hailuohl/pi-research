import type { PrivateSshTarget } from './ssh-targets.js';
export declare const SSH_COMMAND = "python3 /usr/local/lib/pi-research/ssh-runner.py";
export declare function sshEnvironment(): NodeJS.ProcessEnv;
export declare function sshArgs(t: PrivateSshTarget): string[];
/** One bounded JSON request. Transport ambiguity never means the remote operation failed. */
export declare function sshRequest(t: PrivateSshTarget, request: Record<string, unknown>, limit?: number): Promise<Record<string, any>>;
