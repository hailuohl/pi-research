import type { Store } from '../storage/store.js';
import type { SourceId } from './contracts.js';
export interface ConnectorSettings {
    enabled: Record<SourceId, boolean>;
    requestLimit: number;
}
export declare const DEFAULT_CONNECTORS: ConnectorSettings;
export declare function connectorSettings(store: Store, pid: string): {
    enabled: Record<SourceId, boolean>;
    requestLimit: number;
    version: number;
};
/** Used by the old Crossref entry as well: disabling a source is not bypassed by its legacy tool. */
export declare function assertSourceEnabled(store: Store, pid: string, source: SourceId): void;
