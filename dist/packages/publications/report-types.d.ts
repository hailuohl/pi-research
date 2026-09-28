import type { Run, SourceSnapshot } from '../domain/types.js';
import type { DocumentVersion, DocumentEvidenceLink } from '../documents/types.js';
import type { DocumentParseResult, DocumentParseManifest } from '../documents/parse-types.js';
export interface ReportReference {
    id: string;
    type: 'run' | 'run-source' | 'artifact' | 'evidence' | 'development-job' | 'development-review' | 'claim';
    targetId: string;
    label: string;
    runId?: string;
    path?: string;
    digest?: string;
    relation?: 'exact' | 'ancestry';
    document?: DocumentEvidenceLink & {
        start: number;
        end: number;
        pageLabel: string | null;
        rawArtifactId: string;
        imageArtifactId: string;
    };
}
export interface ReportRun {
    runId: string;
    experimentId: string;
    revision: number;
    state: Run['state'];
    integrity: Run['integrity'];
    judgment: Run['judgment'];
    sourceDigest: string;
    gitCommit?: string;
    metrics: Array<{
        name: string;
        value: number;
        unit: string;
        referenceId: string;
    }>;
}
export interface ReportInspection {
    id: string;
    artifactId: string;
    title: string;
    formatVersion: 0 | 1;
    integrity: 'verified' | 'invalid';
    validity: 'current' | 'stale' | 'legacy';
    reasons: string[];
    references: ReportReference[];
    runs: ReportRun[];
}
export interface ReportBindings {
    documents?: Array<{
        documentVersionId: string;
        documentDigest: string;
        parseResultId: string;
        resultDigest: string;
        document: DocumentVersion;
        result: DocumentParseResult;
        parser: Pick<DocumentParseManifest, 'profileId' | 'profileDigest' | 'lockDigest' | 'scriptDigest' | 'environmentImageDigest' | 'resources'> & {
            approvalId: string;
        };
    }>;
    runs: Array<{
        runId: string;
        manifestDigest: string;
        sourceDigest: string;
        contractDigest: string;
        artifactIds: string[];
        evidenceIds: string[];
    }>;
    sources: Array<{
        runId: string;
        sourceDigest: string;
        files: SourceSnapshot['files'];
    }>;
    artifacts: Array<{
        id: string;
        digest: string;
        size: number;
        title: string;
        mediaType: string;
    }>;
    claims: Array<{
        id: string;
        contentDigest: string;
        acceptanceIds: string[];
    }>;
    proposals: Array<{
        id: string;
        digest: string;
        reviewAcceptanceId?: string;
        reviewId?: string;
        jobId?: string;
        sourceDigest: string;
    }>;
    objects: Array<{
        referenceId: string;
        mediaType: string;
        content: string;
    }>;
}
export interface ReportRecord {
    artifactId: string;
    artifactDigest?: string;
    title?: string;
    formatVersion?: 1;
    runIds: string[];
    claimIds: string[];
    evidenceIds: string[];
    references?: ReportReference[];
    runs?: ReportRun[];
    bindings?: ReportBindings;
    bindingsDigest?: string;
}
export interface ReportExportManifest {
    formatVersion: 1;
    report: ReportInspection;
    bindingsDigest: string;
    stateDigest: string;
    bindings: ReportBindings;
}
export interface ReportExportCollection {
    manifest: ReportExportManifest;
    files: Array<{
        path: string;
        bytes: Buffer;
        mode?: '100644' | '100755';
    }>;
}
