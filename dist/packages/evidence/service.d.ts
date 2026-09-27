import type { AppContext } from '../domain/context.js';
import type { Actor, Artifact, Evidence, Claim, Row } from '../domain/types.js';
export declare class EvidenceService {
    private c;
    constructor(c: AppContext);
    put(projectId: string, title: string, bytes: Buffer, mediaType?: string, origin?: string, extra?: Partial<Artifact>): Row<Artifact>;
    read(actor: Actor, id: string): {
        artifact: Row<Artifact>;
        bytes: NonSharedBuffer;
    };
    register(actor: Actor, projectId: string, artifactId: string, start: number, end: number, description: string, type?: Evidence['type'], runId?: string): Row<Evidence>;
    verify(projectId: string, evidenceId: string): Row<Evidence>;
    proposeClaim(actor: Actor, projectId: string, statement: string, evidenceIds: string[], limitations?: string[], taskId?: string): Row<Claim>;
    /** File hashes establish integrity; acceptance bindings establish applicability. */
    assertClaimCurrent(claim: Row<Claim>): Row<Claim>;
    decideClaim(actor: Actor, id: string, version: number, status: Claim['status']): Row<Claim>;
}
