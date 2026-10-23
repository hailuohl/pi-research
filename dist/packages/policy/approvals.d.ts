import type { AppContext } from '../domain/context.js';
import type { Actor, Approval } from '../domain/types.js';
export declare class ApprovalService {
    private c;
    automaticCurrent?: (approval: import('../domain/types.js').Row<Approval>) => void;
    assertEffect(id: string, pid: string, subjectId: string, hash: string, requiredScope: string): import("../domain/types.js").Row<Approval>;
    automaticDelegate?: (actor: Actor, ref: import('./automatic-approvals.js').AutomaticApprovalReference, kind: string, id: string) => Actor;
    proofGuard?: (approval: import('../domain/types.js').Row<Approval>) => void;
    onDecided?: (approval: import('../domain/types.js').Row<Approval>) => void;
    constructor(c: AppContext);
    request(projectId: string, subjectKind: string, subjectId: string, digest: string, scopeName: string, reason: string): import("../domain/types.js").Row<Approval>;
    decide(actor: Actor, id: string, version: number, approved: boolean): import("../domain/types.js").Row<Approval>;
    assert(id: string, projectId: string, subjectId: string, digest: string, requiredScope: string): import("../domain/types.js").Row<Approval>;
    stale(subjectId: string): void;
}
