/** An exited container is judged by Docker's completion time, never its polling time. */
export function executionTimeStatus(startedAt, state, timeoutSeconds, deadline, observedAt) {
    const timestamp = (value) => typeof value === 'string' ? Date.parse(value) : NaN;
    const start = timestamp(startedAt ?? state.StartedAt);
    const cutoff = Math.min(start + timeoutSeconds * 1000, deadline === undefined ? Infinity : timestamp(deadline));
    const finish = observedAt ?? (typeof state.FinishedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(state.FinishedAt) ? timestamp(state.FinishedAt) : NaN);
    if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0 || !Number.isFinite(cutoff) || cutoff <= 0 || !Number.isFinite(finish) || finish <= 0 || finish < start)
        return 'invalid';
    return finish >= cutoff ? 'exceeded' : 'within';
}
//# sourceMappingURL=completion-time.js.map