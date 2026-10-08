import { object } from '../contracts/validation.js';
import { DomainError, ensure } from '../domain/errors.js';
import { digest } from './store.js';
import { readModelState, validateModelState, restoreModelManagementState } from '../pi-adapter/model-connections.js';
const publicState = (state) => ({ schemaVersion: 2, version: state.version, connections: state.connections.map(({ provider, name, baseUrl, api, enabled, deletedAt, order, models, credentialRevision, controlOnly }) => ({ provider, name, baseUrl, api, enabled, deletedAt, order, models, credentialRevision, ...(controlOnly ? { controlOnly: true } : {}) })) });
/** Only nonsecret catalog state is archived; receipts and private keys are never projected. */
export function createModelManagementSnapshot(dataDir) {
    const state = readModelState(dataDir);
    if (state.version === 0)
        return undefined;
    const projected = publicState(state), snapshot = { format: 'pi-model-management-backup-v1', state: projected, digest: digest(projected) };
    validateModelManagementSnapshot(snapshot);
    return snapshot;
}
/** Validate even recomputed manifests: API keys/receipts/restore flags cannot be smuggled into the public schema. */
export function validateModelManagementSnapshot(value) {
    try {
        const snapshot = object(value);
        ensure(Object.keys(snapshot).length === 3 && snapshot.format === 'pi-model-management-backup-v1' && typeof snapshot.digest === 'string', 'BACKUP_MODEL_MANAGEMENT_INVALID', '模型目录备份格式无效', 409);
        const state = object(snapshot.state);
        ensure(Object.keys(state).length === 3 && state.schemaVersion === 2 && Array.isArray(state.connections) && snapshot.digest === digest(state), 'BACKUP_MODEL_MANAGEMENT_INVALID', '模型目录备份摘要或字段无效', 409);
        const connections = state.connections.map(item => { const p = object(item); ensure(Object.keys(p).every(k => ['provider', 'name', 'baseUrl', 'api', 'enabled', 'deletedAt', 'order', 'models', 'credentialRevision', 'controlOnly'].includes(k)), 'BACKUP_MODEL_MANAGEMENT_INVALID', '模型目录备份包含非公开字段', 409); return { ...p, apiKey: '', ...(!p.deletedAt && p.controlOnly !== true ? { requiresCredential: true } : {}) }; });
        const restored = validateModelState({ schemaVersion: 2, version: state.version, connections });
        ensure(digest(publicState(restored)) === digest(state), 'BACKUP_MODEL_MANAGEMENT_INVALID', '模型目录备份不是规范化的公开结构', 409);
        ensure(Buffer.byteLength(JSON.stringify(restored)) <= 512 * 1024, 'BACKUP_MODEL_MANAGEMENT_INVALID', '恢复后的模型目录超过容量限制', 409);
        return restored;
    }
    catch (error) {
        if (error instanceof DomainError && error.code === 'BACKUP_MODEL_MANAGEMENT_INVALID')
            throw error;
        throw new DomainError('BACKUP_MODEL_MANAGEMENT_INVALID', '模型目录备份校验失败，未恢复任何模型配置', 409);
    }
}
export function restoreModelManagementSnapshot(dataDir, value) { restoreModelManagementState(dataDir, validateModelManagementSnapshot(value)); }
//# sourceMappingURL=model-management-backup.js.map