import type { AppContext } from '../domain/context.js';
import type { Actor, Artifact, Row } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
import type { ReportService } from './reports.js';
export declare class ExportService {
    private c;
    private reports;
    private evidence;
    constructor(c: AppContext, reports: ReportService, evidence: EvidenceService);
    create(actor: Actor, pid: string, value: unknown, requestKey: string, validate?: () => void): Promise<Row<Artifact>>;
}
