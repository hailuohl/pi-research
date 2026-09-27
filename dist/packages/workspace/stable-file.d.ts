/** Bounded read of one regular file. Detect replacement/growth during collection. */
export declare function readStableFile(root: string, path: string, maxBytes: number): Buffer;
