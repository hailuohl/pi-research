import { ensure } from '../domain/errors.js';
export const DEFAULT_CONNECTORS = { enabled: { alphaxiv: true, openalex: true, biorxiv: true, pubmed: true, crossref: true }, requestLimit: 100 };
export function connectorSettings(store, pid) { const row = store.list('connector-settings', pid)[0]; return { version: row?.version ?? 0, ...(row ? { enabled: row.enabled, requestLimit: row.requestLimit } : structuredClone(DEFAULT_CONNECTORS)) }; }
/** Used by the old Crossref entry as well: disabling a source is not bypassed by its legacy tool. */
export function assertSourceEnabled(store, pid, source) { ensure(connectorSettings(store, pid).enabled[source], 'SOURCE_DISABLED', `${source} 已禁用；需要用户明确启用`, 403); }
//# sourceMappingURL=settings.js.map