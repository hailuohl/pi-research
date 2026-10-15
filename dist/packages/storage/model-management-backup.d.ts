import { type ConnectionState, type ModelConnection } from '../pi-adapter/model-connections.js';
type PublicConnection = Pick<ModelConnection, 'provider' | 'name' | 'baseUrl' | 'api' | 'enabled' | 'deletedAt' | 'order' | 'models' | 'credentialRevision' | 'controlOnly'>;
export interface ModelManagementSnapshot {
    format: 'pi-model-management-backup-v1';
    state: {
        schemaVersion: 2;
        version: number;
        connections: PublicConnection[];
    };
    digest: string;
}
/** Only nonsecret catalog state is archived; receipts and private keys are never projected. */
export declare function createModelManagementSnapshot(dataDir: string): ModelManagementSnapshot | undefined;
/** Validate even recomputed manifests: API keys/receipts/restore flags cannot be smuggled into the public schema. */
export declare function validateModelManagementSnapshot(value: unknown): ConnectionState;
export declare function restoreModelManagementSnapshot(dataDir: string, value: unknown): void;
export {};
