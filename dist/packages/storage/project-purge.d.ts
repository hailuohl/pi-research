import { DatabaseSync } from 'node:sqlite';
import type { ProjectPurgeView } from '../domain/types.js';
export declare function projectPurgeView(db: DatabaseSync, dataDir: string, projectId: string): ProjectPurgeView;
export declare function readPurgeStatus(dataDir: string, projectId: string): ProjectPurgeView;
export declare function runOfflinePurge(dataDir: string, projectId: string, options: {
    offline: boolean;
    confirmName: string;
    resume?: boolean;
}, hooks?: {
    afterPath?: (completed: number) => void;
}): ProjectPurgeView;
