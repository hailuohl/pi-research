import { DatabaseSync } from 'node:sqlite';
export interface MaintenancePermit {
    readonly maintenance: true;
}
export declare function coordinationSchema(db: DatabaseSync): void;
/** Claims deliberately survive Store.close: filesystem work can outlive its SQLite connection. */
export declare function registerProcess(db: DatabaseSync, root: string, role?: string): string;
export declare function registerDataProcess(root: string, role: string): string;
export declare function acquireMaintenance(db: DatabaseSync, root: string, operationId: string, resume: boolean, check: () => void): MaintenancePermit;
export declare function assertMaintenance(db: DatabaseSync, root: string, permit: MaintenancePermit): void;
export declare function releaseMaintenance(db: DatabaseSync, root: string, permit: MaintenancePermit): void;
/** Only an unpublished backup/restore copy may discard another machine's runtime claims. */
export declare function clearCopiedCoordination(db: DatabaseSync): void;
