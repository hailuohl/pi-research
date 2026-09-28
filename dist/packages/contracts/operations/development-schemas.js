import { s } from './schema.js';
const MiB = 1024 * 1024, id = s.string(100), integer = s.integer(0, Number.MAX_SAFE_INTEGER);
const digest = { ...s.string(64), minLength: 64, pattern: '^[a-f0-9]{64}$' };
const image = { ...s.string(300), pattern: '^[a-zA-Z0-9][a-zA-Z0-9._/:\\-]*@sha256:[a-f0-9]{64}$' };
const resources = s.object({ cpus: s.integer(1, 8), memoryMb: s.integer(64, 8192), pids: s.integer(16, 512), timeoutSeconds: s.integer(1, 600), workMb: s.integer(16, 1024), outputBytes: s.integer(1, 128 * MiB), logBytes: s.integer(1, 16 * MiB) });
const file = s.object({ path: s.string(1000), digest, size: integer, mode: s.enum(['100644', '100755']) }, ['path', 'digest', 'size']);
const data = s.object({ id, digest, size: integer, sourceAcceptanceId: id }, ['id', 'digest', 'size']);
const manifest = s.object({
    purpose: { const: 'development-test' }, sessionId: id, inputSnapshot: s.object({ digest, files: s.array(file, 5000) }, ['digest', 'files']), sourceRevisionId: id,
    command: s.array(s.string(1000, 0), 64, 1), environmentImageDigest: image, dockerContext: s.string(100), resources: { ...resources, required: ['cpus', 'memoryMb', 'pids', 'timeoutSeconds', 'workMb', 'outputBytes', 'logBytes'] }, networkPolicy: { const: 'none' }, deadline: s.string(50), expectedArtifacts: s.array(s.string(1000), 32), dataArtifacts: s.array(data, 10), scopeTaskId: id, scopeAttemptId: id, scopeGeneration: integer, sessionGeneration: integer,
}, ['purpose', 'sessionId', 'inputSnapshot', 'command', 'environmentImageDigest', 'dockerContext', 'resources', 'networkPolicy', 'deadline', 'expectedArtifacts', 'dataArtifacts']);
const task = s.object({
    id, kind: { const: 'development-task' }, projectId: id, version: s.integer(1), createdAt: s.string(50), updatedAt: s.string(50), developmentTaskId: id, title: s.string(200), sessionId: id, sourceDigest: digest, manifest, manifestDigest: digest, grantId: id, state: s.enum(['prepared', 'submitted']), jobId: id,
}, ['id', 'kind', 'projectId', 'version', 'createdAt', 'updatedAt', 'developmentTaskId', 'title', 'sessionId', 'sourceDigest', 'manifest', 'manifestDigest', 'grantId', 'state']);
const job = s.object({
    id, jobId: id, developmentTaskId: id, sessionId: id, version: s.integer(1), sourceDigest: digest, manifestDigest: digest, manifest, imageId: s.string(100), grantId: id, state: s.enum(['queued', 'starting', 'running', 'succeeded', 'failed', 'cancelled', 'timed_out', 'unknown']), integrity: s.enum(['pending', 'complete', 'incomplete', 'invalid']), exitCode: s.nullable(s.integer(-2147483648, 2147483647)), error: s.string(10000), startedAt: s.string(50), endedAt: s.string(50), artifactIds: s.array(id, 5004), stdoutArtifactId: id, stderrArtifactId: id, reportArtifactId: id, logTruncated: s.boolean(), cancelRequested: s.boolean(),
}, ['id', 'jobId', 'developmentTaskId', 'sessionId', 'version', 'sourceDigest', 'manifestDigest', 'manifest', 'grantId', 'state', 'integrity', 'exitCode', 'artifactIds', 'cancelRequested']);
export const DEVELOPMENT_INPUT_SCHEMAS = {
    development_prepare: s.object({ title: s.string(200), command: s.array({ ...s.string(1000, 0), pattern: '^[^\u0000]*$' }, 64, 1), environmentImageDigest: image, dockerContext: { ...s.string(100), pattern: '^[a-zA-Z0-9][a-zA-Z0-9_.-]*$' }, resources, deadline: s.string(50), expectedArtifacts: s.array(s.string(1000), 32), dataArtifactIds: s.array(id, 10) }, ['command', 'environmentImageDigest']),
    development_submit: s.object({ developmentTaskId: id }, ['developmentTaskId']),
    development_inspect: { type: 'object', anyOf: [s.object({ developmentTaskId: id }, ['developmentTaskId']), s.object({ jobId: id }, ['jobId'])] },
    development_logs: s.object({ jobId: id, stream: s.enum(['stdout', 'stderr']), cursor: integer, identity: s.nullable(s.string(100)) }, ['jobId']),
    development_cancel: s.object({ jobId: id }, ['jobId']),
};
export const DEVELOPMENT_OUTPUT_SCHEMAS = {
    development_prepare: task, development_submit: job, development_inspect: { type: 'object', anyOf: [task, job] }, development_cancel: job,
    development_logs: s.object({ jobId: id, stream: s.enum(['stdout', 'stderr']), content: s.string(65536, 0), cursor: integer, complete: s.boolean(), start: integer, size: integer, identity: s.nullable(s.string(100)) }, ['jobId', 'stream', 'content', 'cursor', 'complete', 'start', 'size', 'identity']),
};
//# sourceMappingURL=development-schemas.js.map