import type { DockerRun, DockerSupervisorCallbacks } from './adapter.js';
/** Runs inside the detached supervisor process; the caller owns SQLite and approval authority. */
export declare function superviseDockerRun(initial: DockerRun, callbacks: DockerSupervisorCallbacks): Promise<void>;
