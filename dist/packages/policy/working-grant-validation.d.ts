import type { Store } from '../storage/store.js';
import type { Approval, Row, SourceSnapshot } from '../domain/types.js';
import type { SandboxManifest, SandboxJob, WorkingGrantReference } from '../execution/contracts.js';
import type { WorkingGrant } from './working-grant-types.js';
export declare function workingGrantPayload(g: WorkingGrant): {
    developmentTaskId: string;
    templateManifestDigest: string;
    sessionId: string;
    sourceRevisionId: string;
    model: import("../domain/types.js").ModelConfig;
    baselineSnapshot: SourceSnapshot;
    command: string[];
    environmentImageDigest: string;
    dockerContext: string;
    resources: import("../execution/contracts.js").SandboxResources;
    dataArtifacts: {
        id: string;
        digest: string;
        size: number;
        path: string;
        sourceAcceptanceId?: string;
    }[];
    expectedArtifacts: string[];
    editablePaths: string[];
    maxTests: number;
    maxChangedBytes: number;
    expiresAt: string;
    approvalId: string;
};
export declare const workingGrantReference: (g: Row<WorkingGrant>) => WorkingGrantReference;
export declare function assertWorkingGrantRecord(store: Store, pid: string, id: string): {
    grant: Row<WorkingGrant>;
    approval: Row<Approval>;
};
/** Expiry closes future effects only. Revocation invalidates the original authority chain. */
export declare function assertWorkingGrantReference(store: Store, pid: string, ref: WorkingGrantReference, admission?: boolean): Row<WorkingGrant>;
export declare function assertWorkingGrantDelta(g: WorkingGrant, files: SourceSnapshot['files']): number;
export declare function assertWorkingGrantManifest(g: WorkingGrant, m: SandboxManifest): void;
/** Read-only authority verifier shared by execution, independent review, and publication. */
export declare function assertWorkingGrantJob(store: Store, job: Row<SandboxJob>, admission?: boolean): void;
