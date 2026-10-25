import type { DatabaseSync } from 'node:sqlite';
import type { DataPaths } from './data-paths.js';
import type { ArtifactBlob } from './artifact-blob.js';
import { type MaintenancePermit } from './process-coordination.js';
export interface DocumentBlobPublication {
    format: 'document-blob-publication-v1';
    stagingId: string;
    blobs: Array<ArtifactBlob & {
        stage: {
            path: string;
            dev: number;
            ino: number;
        };
    }>;
}
/** Missing destinations mean not yet linked; existing destinations still require ordinary CAS verification. */
export declare function documentPublication(paths: DataPaths, projectId: unknown, value: Record<string, unknown>): DocumentBlobPublication;
export declare function existingPublicationBlobs(paths: DataPaths, projectId: unknown, value: Record<string, unknown>): (ArtifactBlob & {
    stage: {
        path: string;
        dev: number;
        ino: number;
    };
})[];
/** Offline recovery removes only an intent-bound redundant internal link, never a CAS destination. */
export declare function settleDocumentPublicationLinks(db: DatabaseSync, paths: DataPaths, permit: MaintenancePermit): void;
