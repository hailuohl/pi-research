/** An exited container is judged by Docker's completion time, never its polling time. */
export declare function executionTimeStatus(startedAt: string | undefined, state: {
    StartedAt?: string;
    FinishedAt?: string;
}, timeoutSeconds: number, deadline?: string, observedAt?: number): 'within' | 'exceeded' | 'invalid';
