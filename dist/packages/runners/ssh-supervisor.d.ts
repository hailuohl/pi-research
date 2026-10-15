import type { AppContext } from '../domain/context.js';
import type { DockerRun, DockerSupervisorCallbacks } from './adapter.js';
import { sshRequest } from './ssh.js';
/** Durable local lease plus a single remote start request; recovery only inspects the frozen handle. */
export declare function superviseSshRun(initial: DockerRun, c: AppContext, callbacks: DockerSupervisorCallbacks, request?: typeof sshRequest): Promise<void>;
