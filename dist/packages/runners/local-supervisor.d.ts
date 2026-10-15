import type { AppContext } from '../domain/context.js';
import type { DockerRun, DockerSupervisorCallbacks } from './adapter.js';
export declare function superviseLocalRun(initial: DockerRun, c: AppContext, callbacks: DockerSupervisorCallbacks): Promise<void>;
