import type { Row, Session } from '../domain/types.js';
import type { Store } from '../storage/store.js';
/** Root-owned helpers share execution authority; independent branches do not. */
export declare function assertSessionIdle(store: Store, session: Row<Session>): void;
/** Database-only retirement is rolled back together with the session CAS. */
export declare function retireSessionAuthority(store: Store, s: Row<Session>): void;
