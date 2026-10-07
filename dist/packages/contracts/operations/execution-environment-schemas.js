import { s } from './schema.js';
const str = s.string(2000), int = s.integer(0), arr = (items) => s.array(items, 256);
export const GPU_SCHEMA = s.object({ vendor: { const: 'nvidia' }, deviceIds: s.array({ ...s.string(80), pattern: '^GPU-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' }, 16, 1) }, ['vendor', 'deviceIds']);
export const LOCAL_RUNTIME_SCHEMA = s.object({ id: str, version: int, executableName: str, runtimeVersion: str, executableDigest: str, hostId: str, digest: str, platform: str, protocolDigest: str }, ['id', 'version', 'executableName', 'runtimeVersion', 'executableDigest', 'hostId', 'digest', 'platform', 'protocolDigest']);
export const LOCAL_EXECUTION_SCHEMA = s.object({ isolation: { const: 'none' }, resourceEnforcement: { const: 'advisory' }, networkIsolation: { const: false } }, ['isolation', 'resourceEnforcement', 'networkIsolation']);
export const GPU_TARGET_SCHEMA = s.object({ backend: s.enum(['local', 'docker', 'ssh']), targetId: str, context: str, sshTargetId: str, localRuntimeId: str, observedAt: str, devices: arr(s.object({ uuid: str, name: str, memoryMb: int }, ['uuid', 'name', 'memoryMb'])) }, ['backend', 'targetId', 'observedAt', 'devices']);
export const SSH_TARGET_SCHEMA = s.object({ id: str, version: int, hostKeyDigest: str, configDigest: str, engineId: str, protocolDigest: str, targetId: str, gpuProtocol: s.boolean() }, ['id', 'version', 'hostKeyDigest', 'configDigest', 'engineId', 'protocolDigest', 'targetId']);
export const EXECUTION_ENVIRONMENT_INPUT_SCHEMAS = {
    local_runtime_configure: s.object({ id: s.string(80), executable: str, expectedVersion: int }, ['id', 'executable', 'expectedVersion']),
    execution_environment_list: s.object({}),
    gpu_target_probe: s.object({ backend: s.enum(['local', 'docker', 'ssh']), context: s.string(100), sshTargetId: s.string(80), localRuntimeId: s.string(80), image: s.string(250) }, ['backend']),
    ssh_target_configure: s.object({ id: s.string(80), host: s.string(253), port: s.integer(1, 65535), user: s.string(64), identityFile: str, knownHostsFile: str, remoteRoot: s.string(500), expectedVersion: int, gpuProtocol: s.boolean() }, ['id', 'host', 'user', 'identityFile', 'knownHostsFile', 'remoteRoot', 'expectedVersion']),
    ssh_target_probe: s.object({ id: s.string(80) }, ['id']),
};
export const EXECUTION_ENVIRONMENT_OUTPUT_SCHEMAS = {
    local_runtime_configure: LOCAL_RUNTIME_SCHEMA,
    execution_environment_list: s.object({ local: s.object({ platform: str, hostId: str, runtimes: arr(LOCAL_RUNTIME_SCHEMA), isolation: { const: 'none' }, resourceEnforcement: { const: 'advisory' }, networkIsolation: { const: false } }, ['platform', 'hostId', 'runtimes', 'isolation', 'resourceEnforcement', 'networkIsolation']), gpuTargets: arr(GPU_TARGET_SCHEMA), sshTargets: arr({ anyOf: [SSH_TARGET_SCHEMA, s.object({ id: str, version: int, verified: { const: false } }, ['id', 'version', 'verified'])] }) }, ['local', 'gpuTargets', 'sshTargets']),
    gpu_target_probe: GPU_TARGET_SCHEMA,
    ssh_target_configure: s.object({ id: str, version: int, verified: { const: false } }, ['id', 'version', 'verified']),
    ssh_target_probe: SSH_TARGET_SCHEMA,
};
//# sourceMappingURL=execution-environment-schemas.js.map