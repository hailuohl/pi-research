/** Keep structural diagnostics only: exception text, arbitrary properties and raw stack lines may contain secrets. */
export declare function saveLocalToolDiagnostic(dataDir: string, repoRoot: string, sessionId: string, tool: string, callId: string, error: unknown): string | undefined;
