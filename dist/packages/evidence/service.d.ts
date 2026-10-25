import { type TextCorpusGrantReference } from '../policy/text-corpus-grants.js';
import type { ProviderTextEvidenceLink } from '../documents/types.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Artifact, Evidence, Claim, Row } from '../domain/types.js';
/** Host reference validation shares the complete evidence chain with the ordinary service. */
export declare function verifyEvidence(c: Pick<AppContext, 'store'>, projectId: string, evidenceId: string, current?: boolean): Row<Evidence>;
export declare class EvidenceService {
    private c;
    constructor(c: AppContext);
    /** Host-only: reuse the original confirmed brief; never resolve to its latest revision. */
    fixedResearchMethods(projectId: string, ref: import('../domain/types.js').ResearchBriefRef, expectedContractDigest?: string): {
        contract: import("../research-workflows/method-contracts.js").FrozenMethodContract;
        protocol: string;
    } | undefined;
    /** Host-only staging: immutable CAS bytes, without publishing any database record. */
    prepareArtifact(projectId: string, title: string, bytes: Buffer, mediaType?: string, origin?: string, extra?: Partial<Artifact>, maxBytes?: number): Artifact;
    /** Receives only host-prepared descriptors; callers fence authorization inside the publish transaction. */
    publishPrepared(projectId: string, prepared: Artifact): Row<Artifact>;
    put(projectId: string, title: string, bytes: Buffer, mediaType?: string, origin?: string, extra?: Partial<Artifact>, maxBytes?: number): Row<Artifact>;
    /** Metadata only; transport/task authority remains the caller's responsibility. */
    descriptor(actor: Actor, id: string): Row<Artifact>;
    read(actor: Actor, id: string): {
        artifact: Row<Artifact>;
        bytes: NonSharedBuffer;
    };
    register(actor: Actor, projectId: string, artifactId: string, start: number | undefined, end: number | undefined, description: string, type?: Evidence['type'], runId?: string, exactQuote?: string): Row<Evidence>;
    verify(projectId: string, evidenceId: string, current?: boolean): Row<Evidence>;
    /** Host local search only; no caller-supplied authority flag or new agent tool. */
    registerProviderText(actor: Actor, projectId: string, providerText: ProviderTextEvidenceLink, start: number, end: number, description: string): Row<Evidence>;
    /** Host search path only; never exposed as a tool or a caller-supplied authority flag. */
    registerGrantedProviderText(actor: Actor, projectId: string, providerText: ProviderTextEvidenceLink, start: number, end: number, description: string, reference?: TextCorpusGrantReference): Row<Evidence>;
    private registerProviderTextCore;
    registerDocument(actor: Actor, projectId: string, input: {
        documentVersionId: string;
        parseResultId: string;
        pageNumber: number;
        start: number;
        end: number;
        description: string;
    }): Row<Evidence>;
    /** Host search path only; no tool exposes this method or accepts an authority flag. */
    registerGrantedDocument(actor: Actor, projectId: string, input: Parameters<EvidenceService['registerDocument']>[2], reference?: TextCorpusGrantReference): Row<Evidence>;
    private registerDocumentCore;
    proposeClaim(actor: Actor, projectId: string, statement: string, evidenceIds: string[], limitations?: string[], taskId?: string): Row<Claim>;
    /** File hashes establish integrity; acceptance bindings establish applicability. */
    assertClaimCurrent(claim: Row<Claim>): Row<Claim>;
    decideClaim(actor: Actor, id: string, version: number, status: Claim['status']): Row<Claim>;
}
