export interface HostNotice {
    id: string;
    content: string;
    truncated?: boolean;
}
/** Uses the ordinary prompt channel. Untrusted excerpts never become system policy. */
export declare function buildWorkerPrompt(prompt: string, history: string | null, hostMessages?: HostNotice[]): string;
