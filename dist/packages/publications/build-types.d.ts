import type { SourceSnapshot } from '../domain/types.js';
export declare const PUBLICATION_PROFILE = "latex-document-v1";
export declare const PUBLICATION_RESOURCES: {
    cpus: number;
    memoryMb: number;
    pids: number;
    timeoutSeconds: number;
    workMb: number;
    logBytes: number;
    outputBytes: number;
};
export declare const PUBLICATION_TERMINAL: readonly ["succeeded", "failed", "cancelled", "timed_out"];
export type PublicationEngine = 'pdflatex' | 'xelatex' | 'lualatex';
export type BibliographyMode = 'auto' | 'none' | 'bibtex' | 'biber';
export interface PublicationProfile {
    profileId: typeof PUBLICATION_PROFILE;
    lockDigest: string;
    scriptDigest: string;
    dockerfileDigest: string;
    profileDigest: string;
}
export interface CompilerConfiguration extends PublicationProfile {
    dockerContext: string;
    imageDigest: string;
    imageId: string;
}
export interface AssetProvenance {
    kind: 'unknown' | 'run' | 'sandbox-job';
    id?: string;
    sourceDigest?: string;
    manifestDigest?: string;
    approvalId?: string;
}
export interface ManuscriptFile {
    path: string;
    artifactId: string;
    digest: string;
    size: number;
    mediaType: string;
    provenance: AssetProvenance;
}
export interface ManuscriptRevision {
    title: string;
    engine: PublicationEngine;
    mainFile: string;
    bibliography: BibliographyMode;
    templateId?: string;
    sourceDigest: string;
    manifestArtifactId: string;
    manifestArtifactDigest: string;
    files: ManuscriptFile[];
}
export interface PublicationManifest extends PublicationProfile {
    purpose: 'publication-build';
    revisionId: string;
    revisionDigest: string;
    sourceDigest: string;
    engine: PublicationEngine;
    mainFile: string;
    bibliography: BibliographyMode;
    dockerContext: string;
    environmentImageDigest: string;
    command: string[];
    inputSnapshot: SourceSnapshot;
    dataArtifacts: Array<{
        id: string;
        digest: string;
        size: number;
        path: string;
    }>;
    resources: typeof PUBLICATION_RESOURCES;
}
export interface PublicationBuildJob {
    revisionId: string;
    manifest: PublicationManifest;
    manifestDigest: string;
    approvalId: string;
    state: 'prepared' | 'queued' | 'starting' | 'running' | 'unknown' | 'succeeded' | 'failed' | 'cancelled' | 'timed_out';
    integrity: 'pending' | 'complete' | 'incomplete' | 'invalid';
    containerName: string;
    containerId?: string;
    imageId?: string;
    generation: number;
    leaseUntil: number;
    workerPid?: number;
    startRequested: boolean;
    cancelRequested: boolean;
    recoveryCount: number;
    outputDir: string;
    controlDir: string;
    startedAt?: string;
    endedAt?: string;
    exitCode?: number | null;
    error?: string;
    artifactIds: string[];
    resultId?: string;
    logTruncated?: boolean;
}
export interface BuildDiagnostic {
    severity: 'error' | 'warning';
    code: string;
    message: string;
    file: string | null;
    line: number | null;
    pass: number | null;
}
export interface BuildOutput {
    formatVersion: 1;
    profileId: typeof PUBLICATION_PROFILE;
    sourceDigest: string;
    engine: PublicationEngine;
    bibliography: BibliographyMode;
    engineVersion: string;
    status: 'succeeded' | 'failed' | 'timed_out' | 'non_convergent';
    hadErrors: boolean;
    converged: boolean;
    passes: number;
    diagnostics: BuildDiagnostic[];
    pdf: {
        file: string;
        digest: string;
        bytes: number;
        pages: number;
    } | null;
    previews: Array<{
        pageNumber: number;
        file: string;
        digest: string;
        bytes: number;
        width: number;
        height: number;
    }>;
    logs: Array<{
        file: string;
        digest: string;
        bytes: number;
    }>;
}
export interface PublicationBuildResult extends Omit<BuildOutput, 'pdf' | 'previews' | 'logs'> {
    revisionId: string;
    jobId: string;
    manifestDigest: string;
    profileDigest: string;
    imageId: string;
    manifestArtifactId: string;
    manifestArtifactDigest: string;
    pdf: {
        artifactId: string;
        digest: string;
        bytes: number;
        pages: number;
    } | null;
    previews: Array<{
        pageNumber: number;
        artifactId: string;
        digest: string;
        bytes: number;
        width: number;
        height: number;
    }>;
    logs: Array<{
        artifactId: string;
        digest: string;
        bytes: number;
    }>;
}
