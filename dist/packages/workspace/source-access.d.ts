import type { ResearchApp } from '../research-app.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Experiment, Row, SourceRevision } from '../domain/types.js';
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
export declare function copySourceRevision(r: Row<SourceRevision>, workspace: string): void;
export declare class SourceAccessService {
    private app;
    constructor(app: ResearchApp);
    private selector;
    resolve(actor: Actor, projectId: string, value: unknown): Row<SourceRevision>;
    list(actor: Actor, projectId: string, value: unknown): {
        files: {
            path: string;
            size: number;
            digest: string;
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
            status: "added" | "deleted" | "modified";
            beforeDigest: string | null;
            afterDigest: string | null;
        }[];
    };
    prepare(actor: Actor, projectId: string, sessionId: string, value: unknown): {
        sessionId: string;
        sessionVersion: number;
        prepared: boolean;
        snapshotId: string;
        experimentId: string;
        revision: number;
        sourceDigest: string;
    };
}
