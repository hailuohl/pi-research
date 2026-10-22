import type { Row, Session, SourceRevision } from '../domain/types.js';
import { type Store } from '../storage/store.js';
/** Receipt replay settles housekeeping only; a changed binding keeps its recovery data. */
export declare function settleSourcePreparationReceipt(store: Store, projectId: string, sessionId: string, receipt: {
    sessionId: string;
    snapshotId: string;
    sourceDigest: string;
}): void;
/** SQLite's writer lock serializes this authenticated, fixed-identity directory swap. */
export declare function prepareSourceWorkspace(store: Store, s: Row<Session>, r: Row<SourceRevision>, copy: (staged: string) => void): void;
