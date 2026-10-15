import { s } from './schema.js';
const id = s.string(100), revision = s.integer(1), digest = { ...s.string(64), minLength: 64, pattern: '^[a-f0-9]{64}$' };
const offset = s.integer(0, Number.MAX_SAFE_INTEGER);
const selection = (properties, required) => ({
    type: 'object',
    anyOf: [
        s.object({ ...properties, experimentId: id, revision }, ['experimentId', 'revision', ...required]),
        s.object({ ...properties, snapshotId: id }, ['snapshotId', ...required]),
    ],
});
const selector = selection({}, []);
const metadata = { snapshotId: id, experimentId: id, revision, sourceDigest: digest };
const source = s.object(metadata, ['snapshotId', 'experimentId', 'revision', 'sourceDigest']);
const file = s.object({ path: s.string(1000), digest, size: offset, mode: s.enum(['100644', '100755']) }, ['path', 'digest', 'size']);
export const SOURCE_INPUT_SCHEMAS = {
    experiment_source_list: selector,
    experiment_source_read: selection({ path: s.string(1000), cursor: offset, limit: s.integer(1, 64000) }, ['path']),
    experiment_source_diff: s.object({ from: selector, to: selector }, ['from', 'to']),
    workspace_prepare_from_revision: selector,
};
export const SOURCE_OUTPUT_SCHEMAS = {
    experiment_source_list: s.object({ ...metadata, files: s.array(file, 5000) }, ['snapshotId', 'experimentId', 'revision', 'sourceDigest', 'files']),
    experiment_source_read: s.object({ ...metadata, path: s.string(1000), digest, size: offset, mode: s.enum(['100644', '100755']), cursor: offset, end: offset, complete: s.boolean(), content: s.string(64000, 0) }, ['snapshotId', 'experimentId', 'revision', 'sourceDigest', 'path', 'digest', 'size', 'cursor', 'end', 'complete', 'content']),
    experiment_source_diff: s.object({ from: source, to: source, files: s.array(s.object({ path: s.string(1000), status: s.enum(['added', 'modified', 'deleted']), beforeDigest: s.nullable(digest), afterDigest: s.nullable(digest), beforeMode: s.nullable(s.enum(['100644', '100755'])), afterMode: s.nullable(s.enum(['100644', '100755'])) }, ['path', 'status', 'beforeDigest', 'afterDigest']), 10000) }, ['from', 'to', 'files']),
    workspace_prepare_from_revision: s.object({ ...metadata, sessionId: id, sessionVersion: s.integer(1), prepared: s.boolean(), gitState: s.enum(['pending', 'ready', 'conflict', 'failed']), gitOperationId: id }, ['snapshotId', 'experimentId', 'revision', 'sourceDigest', 'sessionId', 'sessionVersion', 'prepared']),
};
//# sourceMappingURL=source-schemas.js.map