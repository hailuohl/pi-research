export interface LogPage {
    content: string;
    cursor: number;
    complete: boolean;
    start: number;
    size: number;
    identity: string | null;
}
/** Byte cursor over one append-only UTF-8 log; at most maxBytes are actually read per request. */
export declare function readLogPage(root: string, path: string, rawCursor: unknown, options: {
    terminal: boolean;
    identity?: string | null;
    maxBytes?: number;
}): LogPage;
