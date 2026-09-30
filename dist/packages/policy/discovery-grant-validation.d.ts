import type { Store } from '../storage/store.js';
import type { Actor, Approval, Artifact, Row, Session, Task, TaskSpec, Team } from '../domain/types.js';
import type { DiscoveryGrant, DiscoveryGrantReference, DiscoveryContext, DiscoveryOperation, DiscoveryCall, DiscoveryTaskBinding } from './discovery-grant-types.js';
import { type SearchInput, type SourceId } from '../connectors/contracts.js';
import type { SearchPageRequest } from '../connectors/service.js';
import type { DocumentVersion } from '../documents/types.js';
export declare function discoveryGrantPayload(g: DiscoveryGrant): {
    taskBinding?: DiscoveryTaskBinding | undefined;
    model: import("../domain/types.js").ModelConfig;
    settingsVersion: number;
    sources: ("alphaxiv" | "openalex" | "biorxiv" | "pubmed" | "crossref")[];
    searches: SearchInput[];
    targets: import("../documents/types.js").DocumentAcquireInput[];
    allowSearchResults: boolean;
    formats: ("provider-text" | "original-pdf")[];
    maxRequests: number;
    maxResponseBytes: number;
    expiresAt: string;
    approvalId: string;
    sessionId?: string | undefined;
};
export declare const discoveryReference: (g: Row<DiscoveryGrant>) => DiscoveryGrantReference;
export declare function assertDiscoveryGrantRecord(store: Store, pid: string, id: string): {
    grant: Row<DiscoveryGrant>;
    approval: Row<Approval>;
};
export declare function assertDiscoveryGrantReference(store: Store, pid: string, ref: DiscoveryGrantReference): Row<DiscoveryGrant>;
type TeamPlan = Row<{
    sourceRevisionId?: string;
    teamId: string;
    planVersion: number;
    directiveVersion: number;
    tasks: TaskSpec[];
    goal: string;
    digest: string;
    model: Session['model'];
}>;
export declare function discoveryTaskSpec(task: Row<Task>): TaskSpec;
export declare function discoveryTeamPlanDigest(plan: TeamPlan): string;
export declare function buildDiscoveryTaskBinding(store: Store, pid: string, task: Row<Task>): {
    binding: DiscoveryTaskBinding;
    model: import("../domain/types.js").ModelConfig;
    team: Row<Team>;
    plan: Row<TeamPlan>;
};
export declare function assertTaskDiscoveryBinding(store: Store, pid: string, g: Row<DiscoveryGrant>, options?: {
    requireUnclaimed?: boolean;
    requireApproved?: boolean;
}): {
    task: Row<Task>;
    team: Row<Team>;
    plan: Row<TeamPlan>;
    approval: Row<Approval>;
};
export declare function assertDiscoveryContext(store: Store, pid: string, ctx: DiscoveryContext, newRequest?: boolean): Row<DiscoveryGrant>;
export declare function normalizedDiscoveryOperation(operation: DiscoveryOperation): DiscoveryOperation;
export declare function discoveryContext(store: Store, pid: string, actor: Actor, operation: DiscoveryOperation, key: string, ref?: DiscoveryGrantReference): DiscoveryContext | undefined;
export declare const discoveryScope: (scope: string, ctx?: DiscoveryContext | DiscoveryGrantReference) => string;
export declare function reserveConnectorCall(store: Store, pid: string, source: SourceId, url: URL, ctx?: DiscoveryContext, ownerPage?: {
    id: string;
    requestDigest: string;
}): Row<DiscoveryCall>;
export declare function assertDiscoveryArtifact(store: Store, pid: string, a: Row<Artifact>): void;
export declare function assertDiscoveryDocument(store: Store, pid: string, d: Row<DocumentVersion>): void;
export declare const discoveryProof: (ctx?: DiscoveryContext) => {
    discoveryGrant: DiscoveryGrantReference;
    discoveryCallIds: string[];
    discoveryRequestDigest: string;
} | {
    discoveryGrant?: undefined;
    discoveryCallIds?: undefined;
    discoveryRequestDigest?: undefined;
};
export declare function ownerSearchNextPage(store: Store, pid: string, previousSearchId: string): {
    search: SearchInput;
    pageRequest: SearchPageRequest;
};
export {};
