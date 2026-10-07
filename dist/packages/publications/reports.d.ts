import type { ResearchApp } from '../research-app.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Row, Artifact } from '../domain/types.js';
import type { EvidenceService } from '../evidence/service.js';
import type { ReportReference, ReportInspection, ReportExportCollection } from './report-types.js';
export declare const excluded: (path: string) => boolean;
export declare function safeExportBytes(bytes: Buffer, context: Pick<AppContext, 'dataDir' | 'repoRoot' | 'store'>): void;
export declare class ReportService {
    private c;
    private evidence;
    private app?;
    constructor(c: AppContext, evidence: EvidenceService, app?: ResearchApp | undefined);
    private record;
    list(actor: Actor, pid: string, cursor?: number, limit?: number): {
        items: {
            id: string;
            projectId: string;
            artifactId: string;
            title: string;
            formatVersion: number;
            createdAt: string;
            updatedAt: string;
            runCount: number;
            claimCount: number;
        }[];
        cursor: number;
        hasMore: boolean;
    };
    private bytes;
    private checkRecord;
    private publication;
    private figureJob;
    private checkProposal;
    private document;
    create(actor: Actor, pid: string, value: unknown): Row<Artifact>;
    inspect(actor: Actor, pid: string, id: string): ReportInspection;
    readReference(actor: Actor, pid: string, id: string, referenceId: string, cursor?: number, limit?: number): {
        reference: ReportReference;
        content: string;
        mediaType: string;
        cursor: number;
        end: number;
        complete: boolean;
    };
    private stateDigest;
    assertExportCurrent(actor: Actor, pid: string, id: string, expectedBindingsDigest: string, expectedStateDigest: string): void;
    collectExport(actor: Actor, pid: string, id: string): ReportExportCollection;
}
