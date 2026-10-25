import type { DatabaseSync } from 'node:sqlite';
import type { DataPaths } from './data-paths.js';
import type { ArtifactBlob } from './artifact-blob.js';
import type { DocumentBlobPublication } from './document-publication.js';
import { type MaintenancePermit } from './process-coordination.js';
export interface TextIndexPublication {
    format: 'text-index-publication-v1';
    stagingId: string;
    source: ArtifactBlob & {
        artifactId: string;
    };
    blobs: DocumentBlobPublication['blobs'];
}
export declare function textIndexPublication(paths: DataPaths, projectId: unknown, value: Record<string, unknown>): TextIndexPublication;
export declare function assertTextIndexSource(db: DatabaseSync, projectId: unknown, publication: TextIndexPublication): void;
export declare function existingTextIndexBlobs(db: DatabaseSync, paths: DataPaths, projectId: unknown, value: Record<string, unknown>): (ArtifactBlob & {
    stage: {
        path: string;
        dev: number;
        ino: number;
    };
})[];
/** Offline recovery removes only the redundant intent-bound stage link; CAS remains owned. */
export declare function settleTextIndexLinks(db: DatabaseSync, paths: DataPaths, permit: MaintenancePermit): void;
