import type { AppContext } from '../domain/context.js';
import type { Actor } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
export declare class ReportService {
    private c;
    private evidence;
    constructor(c: AppContext, evidence: EvidenceService);
    create(actor: Actor, projectId: string, value: unknown): import("../domain/types.js").Row<import("../domain/types.js").Artifact>;
}
