import type { DatabaseSync } from 'node:sqlite';
import type { SourceSnapshot } from '../domain/types.js';
export interface DataLocation {
    format: 1;
    activeRoot: string;
    legacyRoots: string[];
}
export declare function assertPhysicalDataRoot(path: string): void;
/** Logical references never probe an old root. All filesystem access belongs to this Store instance. */
export declare class DataPaths {
    readonly dataDir: string;
    readonly legacyRoots: readonly string[];
    constructor(dataDir: string, legacyRoots?: readonly string[]);
    key(reference: string): string;
    physical(reference: string): string;
    reference(path: string): string;
    same(a: string, b: string): boolean;
    physicalSnapshot(snapshot: SourceSnapshot): SourceSnapshot;
    referenceSnapshot(snapshot: SourceSnapshot): SourceSnapshot;
}
export declare function readDataLocation(db: DatabaseSync): DataLocation | null;
export declare function loadDataPaths(db: DatabaseSync, dataDir: string): DataPaths;
/** Administrative operation on an unpublished restore database, never a model capability. */
export declare function setDataLocation(db: DatabaseSync, dataDir: string, legacyRoots?: readonly string[]): DataPaths;
