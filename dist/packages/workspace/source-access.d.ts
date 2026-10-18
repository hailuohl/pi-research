import type { ResearchApp } from '../research-app.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Experiment, Row, SourceRevision } from '../domain/types.js';
import type { DataPaths } from '../storage/data-paths.js';
export type SourceSelector = {
    experimentId: string;
    revision: number;
} | {
    snapshotId: string;
};
export declare const sourceMetadata: (r: Row<SourceRevision>) => {
    snapshotId: string;
    experimentId: string;
    revision: number;
    sourceDigest: string;
};
export declare function validateSourceRevision(c: AppContext, projectId: string, id: string): Row<SourceRevision>;
/** Called only in experiment write transactions; reads never invent historical revisions. */
export declare function captureSourceRevision(c: AppContext, e: Row<Experiment>, observedNow?: boolean): Row<SourceRevision>;
/** Copy verified bytes, never filesystem links or caller-selected roots. */
export declare function copySourceRevision(r: Row<SourceRevision>, workspace: string, copyModes?: boolean, paths?: DataPaths): void;
export declare class SourceAccessService {
    private app;
    constructor(app: ResearchApp);
    private selector;
    resolve(actor: Actor, projectId: string, value: unknown, historical?: boolean): Row<SourceRevision>;
    list(actor: Actor, projectId: string, value: unknown): {
        files: {
            path: string;
            size: number;
            digest: string;
            mode?: "100644" | "100755";
        }[];
        snapshotId: string;
        experimentId: string;
        revision: number;
        sourceDigest: string;
    };
    read(actor: Actor, projectId: string, value: unknown): {
        cursor: number;
        end: number;
        complete: boolean;
        content: string;
        path: string;
        size: number;
        digest: string;
        mode?: "100644" | "100755";
        snapshotId: string;
        experimentId: string;
        revision: number;
        sourceDigest: string;
    };
    diff(actor: Actor, projectId: string, value: unknown): {
        from: {
            snapshotId: string;
            experimentId: string;
            revision: number;
            sourceDigest: string;
        };
        to: {
            snapshotId: string;
            experimentId: string;
            revision: number;
            sourceDigest: string;
        };
        files: {
            path: string;
            status: "added" | "modified" | "deleted";
            beforeDigest: string | null;
            afterDigest: string | null;
            beforeMode: "100644" | "100755" | null;
            afterMode: "100644" | "100755" | null;
        }[];
    };
    prepare(actor: Actor, projectId: string, sessionId: string, value: unknown): {
        gitState?: "failed" | "pending" | "ready" | "conflict" | undefined;
        gitOperationId?: string | undefined;
        sessionId: string;
        sessionVersion: number;
        prepared: boolean;
        snapshotId: string;
        experimentId: string;
        revision: number;
        sourceDigest: string;
    };
}
