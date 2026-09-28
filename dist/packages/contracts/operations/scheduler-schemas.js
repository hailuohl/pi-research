import { s } from './schema.js';
const str = { type: 'string' }, num = { type: 'number' }, int = { type: 'integer' }, bool = { type: 'boolean' };
const array = (items) => ({ type: 'array', items });
const object = (properties, optional) => ({ type: 'object', properties, required: Object.keys(properties).filter(k => !optional?.includes(k)), additionalProperties: false });
const limitFields = { maxRuns: s.integer(0, 256), maxDevelopment: s.integer(0, 256), maxJobs: s.integer(0, 256), cpus: s.nullable(s.number(0, 1024)), memoryMb: s.nullable(s.integer(0, Number.MAX_SAFE_INTEGER)), maxQueued: s.nullable(s.integer(0, Number.MAX_SAFE_INTEGER)) };
const limits = object(limitFields), configuration = object({ version: int, targetId: str, limits });
const usage = object({ jobs: int, runs: int, development: int, cpus: num, memoryMb: int, unknown: int });
const available = object({ jobs: int, runs: int, development: int, cpus: s.nullable(num), memoryMb: s.nullable(int) });
const counts = object({ reserved: int, running: int, stopping: int, unknown: int, held: int });
const roles = s.enum(['coordinator', 'literature', 'designer', 'implementer', 'analyst', 'reviewer', 'writer']);
const agents = object({ version: int, maxWorkers: int, available: int, unit: { const: 'pi-worker' }, httpConcurrencyMeasured: { const: false }, counts,
    queued: array(object({ sessionId: str, role: roles, reasons: array(object({ code: str, message: str })) })),
    project: object({ projectId: str, maxActiveAgents: int, maxConcurrentAssistants: int, effectiveMaxAgents: int, counts, assistantHeld: int, available: int, assistantAvailable: int, byRole: { type: 'object', propertyNames: roles, additionalProperties: int }, blockedBy: array(str) }) }, ['queued', 'project']);
export const SCHEDULER_INPUT_SCHEMAS = {
    compute_target_probe: s.object({ context: { ...s.string(100), pattern: '^[A-Za-z0-9][A-Za-z0-9._-]*$' } }, ['context']),
    compute_queue_inspect: s.object({ cursor: s.integer(0, Number.MAX_SAFE_INTEGER), limit: s.integer(1, 256) }),
    compute_capacity_configure: s.object({ expectedVersion: s.integer(0, Number.MAX_SAFE_INTEGER), targetId: s.string(100), limits: { ...s.object(limitFields), minProperties: 1 } }, ['expectedVersion', 'limits']),
    agent_capacity_inspect: s.object({}),
    agent_capacity_configure: s.object({ expectedVersion: s.integer(1, Number.MAX_SAFE_INTEGER), maxWorkers: s.integer(1, 32) }, ['expectedVersion', 'maxWorkers']),
};
export const SCHEDULER_OUTPUT_SCHEMAS = {
    compute_target_probe: object({ context: str, targetId: str, backend: { const: 'docker' }, observedAt: str }),
    compute_queue_inspect: object({ scope: { const: 'shared-data-directory' }, configuration, usage, available, queued: int,
        targets: array(object({ targetId: str, backend: s.enum(['docker', 'trusted-example']), contexts: array(str), configuration, usage, available })),
        items: array(object({ kind: s.enum(['run', 'development']), id: str, projectId: str, sequence: int, state: str, held: bool, backend: s.enum(['docker', 'trusted-example']), targetId: s.nullable(str), requested: object({ cpus: num, memoryMb: int }), generation: int, leaseUntil: int, nextAttemptAt: int, reason: s.enum(['ready', 'worker_active', 'recovery_due', 'target_unresolved', 'target_unavailable', 'target_changed', 'legacy_target_unknown', 'request_too_large', 'host_capacity', 'target_capacity', 'earlier_job', 'recovery_backoff', 'manual_recovery_required']) })), nextCursor: s.nullable(int) }),
    compute_capacity_configure: configuration, agent_capacity_inspect: agents, agent_capacity_configure: agents,
};
//# sourceMappingURL=scheduler-schemas.js.map