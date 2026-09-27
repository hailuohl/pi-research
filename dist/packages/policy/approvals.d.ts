import type { AppContext } from '../domain/context.js';
import type { Actor, Approval } from '../domain/types.js';
export declare class ApprovalService {
    private c;
    constructor(c: AppContext);
    request(projectId: string, subjectKind: string, subjectId: string, digest: string, scopeName: string, reason: string): import("../domain/types.js").Row<Approval>;
    decide(actor: Actor, id: string, version: number, approved: boolean): import("../domain/types.js").Row<Approval>;
    assert(id: string, projectId: string, subjectId: string, digest: string, requiredScope: string): import("../domain/types.js").Row<Approval>;
    stale(subjectId: string): void;
}
