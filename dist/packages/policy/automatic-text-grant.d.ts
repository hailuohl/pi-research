import type { Store } from '../storage/store.js';
import type { Session } from '../domain/types.js';
import type { HostAccessGrant } from './host-access.js';
/** Provenance compatibility only; original text guards independently enforce live reading authority. */
export declare function automaticTextGrantCompatible(store: Store, s: Session & {
    id: string;
    projectId: string | null;
}, host?: HostAccessGrant): boolean;
