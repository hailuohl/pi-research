import type { ResearchApp } from '../research-app.js';
import type { Actor, Row } from '../domain/types.js';
import type { SandboxJob, SandboxResources, SandboxState } from '../execution/contracts.js';
/** Development tests have their own approval and immutable result; they never create a scientific Run. */
export declare class DevelopmentService {
    private app;
    constructor(app: ResearchApp);
    private access;
    private data;
    prepare(actor: Actor, pid: string, sessionId: string, value: unknown): {
        developmentTaskId: string;
        manifest: {
            inputSnapshot: {
                digest: string;
                files: {
                    path: string;
                    size: number;
                    digest: string;
                    mode?: "100644" | "100755";
                }[];
            };
            dataArtifacts: {
                id: string;
                digest: string;
                size: number;
                sourceAcceptanceId?: string;
            }[];
            purpose: "development-test";
            sessionId: string;
            sourceRevisionId?: string;
            command: string[];
            environmentImageDigest: string;
            dockerContext: string;
            resources: SandboxResources;
            networkPolicy: "none";
            deadline: string;
            expectedArtifacts: string[];
            scopeTaskId?: string;
            scopeAttemptId?: string;
            scopeGeneration?: number;
            sessionGeneration?: number;
        };
        id: string;
        kind: string;
        projectId: string | null;
        version: number;
        createdAt: string;
        updatedAt: string;
        title: string;
        sessionId: string;
        sourceDigest: string;
        manifestDigest: string;
        grantId: string;
        state: "prepared" | "submitted";
        jobId?: string;
    };
    get(actor: Actor, pid: string, id: string): {
        developmentTaskId: string;
        manifest: {
            inputSnapshot: {
                digest: string;
                files: {
                    path: string;
                    size: number;
                    digest: string;
                    mode?: "100644" | "100755";
                }[];
            };
            dataArtifacts: {
                id: string;
                digest: string;
                size: number;
                sourceAcceptanceId?: string;
            }[];
            purpose: "development-test";
            sessionId: string;
            sourceRevisionId?: string;
            command: string[];
            environmentImageDigest: string;
            dockerContext: string;
            resources: SandboxResources;
            networkPolicy: "none";
            deadline: string;
            expectedArtifacts: string[];
            scopeTaskId?: string;
            scopeAttemptId?: string;
            scopeGeneration?: number;
            sessionGeneration?: number;
        };
        id: string;
        kind: string;
        projectId: string | null;
        version: number;
        createdAt: string;
        updatedAt: string;
        title: string;
        sessionId: string;
        sourceDigest: string;
        manifestDigest: string;
        grantId: string;
        state: "prepared" | "submitted";
        jobId?: string;
    };
    private current;
    assertCurrent(job: Row<SandboxJob>, verifyFiles?: boolean): void;
    submit(actor: Actor, pid: string, id: string): {
        id: string;
        jobId: string;
        developmentTaskId: string;
        sessionId: string;
        version: number;
        sourceDigest: string;
        manifestDigest: string;
        manifest: {
            inputSnapshot: {
                digest: string;
                files: {
                    path: string;
                    size: number;
                    digest: string;
                    mode?: "100644" | "100755";
                }[];
            };
            dataArtifacts: {
                id: string;
                digest: string;
                size: number;
                sourceAcceptanceId?: string;
            }[];
            purpose: "development-test";
            sessionId: string;
            sourceRevisionId?: string;
            command: string[];
            environmentImageDigest: string;
            dockerContext: string;
            resources: SandboxResources;
            networkPolicy: "none";
            deadline: string;
            expectedArtifacts: string[];
            scopeTaskId?: string;
            scopeAttemptId?: string;
            scopeGeneration?: number;
            sessionGeneration?: number;
        };
        imageId: string | undefined;
        grantId: string;
        state: SandboxState;
        integrity: "pending" | "complete" | "incomplete" | "invalid";
        exitCode: number | null;
        error: string | undefined;
        startedAt: string | undefined;
        endedAt: string | undefined;
        artifactIds: string[];
        stdoutArtifactId: string | undefined;
        stderrArtifactId: string | undefined;
        reportArtifactId: string | undefined;
        logTruncated: boolean | undefined;
        cancelRequested: boolean;
    };
    inspect(actor: Actor, pid: string, id: string): {
        id: string;
        jobId: string;
        developmentTaskId: string;
        sessionId: string;
        version: number;
        sourceDigest: string;
        manifestDigest: string;
        manifest: {
            inputSnapshot: {
                digest: string;
                files: {
                    path: string;
                    size: number;
                    digest: string;
                    mode?: "100644" | "100755";
                }[];
            };
            dataArtifacts: {
                id: string;
                digest: string;
                size: number;
                sourceAcceptanceId?: string;
            }[];
            purpose: "development-test";
            sessionId: string;
            sourceRevisionId?: string;
            command: string[];
            environmentImageDigest: string;
            dockerContext: string;
            resources: SandboxResources;
            networkPolicy: "none";
            deadline: string;
            expectedArtifacts: string[];
            scopeTaskId?: string;
            scopeAttemptId?: string;
            scopeGeneration?: number;
            sessionGeneration?: number;
        };
        imageId: string | undefined;
        grantId: string;
        state: SandboxState;
        integrity: "pending" | "complete" | "incomplete" | "invalid";
        exitCode: number | null;
        error: string | undefined;
        startedAt: string | undefined;
        endedAt: string | undefined;
        artifactIds: string[];
        stdoutArtifactId: string | undefined;
        stderrArtifactId: string | undefined;
        reportArtifactId: string | undefined;
        logTruncated: boolean | undefined;
        cancelRequested: boolean;
    };
    logs(actor: Actor, pid: string, id: string, stream: unknown, cursor?: unknown): {
        jobId: string;
        stream: string;
        content: string;
        cursor: number;
        complete: boolean;
    };
    cancel(actor: Actor, pid: string, id: string): {
        id: string;
        jobId: string;
        developmentTaskId: string;
        sessionId: string;
        version: number;
        sourceDigest: string;
        manifestDigest: string;
        manifest: {
            inputSnapshot: {
                digest: string;
                files: {
                    path: string;
                    size: number;
                    digest: string;
                    mode?: "100644" | "100755";
                }[];
            };
            dataArtifacts: {
                id: string;
                digest: string;
                size: number;
                sourceAcceptanceId?: string;
            }[];
            purpose: "development-test";
            sessionId: string;
            sourceRevisionId?: string;
            command: string[];
            environmentImageDigest: string;
            dockerContext: string;
            resources: SandboxResources;
            networkPolicy: "none";
            deadline: string;
            expectedArtifacts: string[];
            scopeTaskId?: string;
            scopeAttemptId?: string;
            scopeGeneration?: number;
            sessionGeneration?: number;
        };
        imageId: string | undefined;
        grantId: string;
        state: SandboxState;
        integrity: "pending" | "complete" | "incomplete" | "invalid";
        exitCode: number | null;
        error: string | undefined;
        startedAt: string | undefined;
        endedAt: string | undefined;
        artifactIds: string[];
        stdoutArtifactId: string | undefined;
        stderrArtifactId: string | undefined;
        reportArtifactId: string | undefined;
        logTruncated: boolean | undefined;
        cancelRequested: boolean;
    };
    finalize(id: string, result: {
        state: SandboxState;
        exitCode: number | null;
        error?: string;
        logTruncated?: boolean;
        recovered?: boolean;
        incomplete?: boolean;
        generation?: number;
    }): Row<SandboxJob>;
    assertResultMatches(actor: Actor, pid: string, id: string, candidateDigest: string): {
        id: string;
        jobId: string;
        developmentTaskId: string;
        sessionId: string;
        version: number;
        sourceDigest: string;
        manifestDigest: string;
        manifest: {
            inputSnapshot: {
                digest: string;
                files: {
                    path: string;
                    size: number;
                    digest: string;
                    mode?: "100644" | "100755";
                }[];
            };
            dataArtifacts: {
                id: string;
                digest: string;
                size: number;
                sourceAcceptanceId?: string;
            }[];
            purpose: "development-test";
            sessionId: string;
            sourceRevisionId?: string;
            command: string[];
            environmentImageDigest: string;
            dockerContext: string;
            resources: SandboxResources;
            networkPolicy: "none";
            deadline: string;
            expectedArtifacts: string[];
            scopeTaskId?: string;
            scopeAttemptId?: string;
            scopeGeneration?: number;
            sessionGeneration?: number;
        };
        imageId: string | undefined;
        grantId: string;
        state: SandboxState;
        integrity: "pending" | "complete" | "incomplete" | "invalid";
        exitCode: number | null;
        error: string | undefined;
        startedAt: string | undefined;
        endedAt: string | undefined;
        artifactIds: string[];
        stdoutArtifactId: string | undefined;
        stderrArtifactId: string | undefined;
        reportArtifactId: string | undefined;
        logTruncated: boolean | undefined;
        cancelRequested: boolean;
    };
}
