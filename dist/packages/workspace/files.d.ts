import { type Store } from '../storage/store.js';
import type { SourceSnapshot } from '../domain/types.js';
export declare const MAX_TEXT_BYTES: number;
export type SourceMode = '100644' | '100755';
export declare function safePath(root: string, path: string, allowRoot?: boolean): string;
export declare function readSourceMode(root: string, path: string): SourceMode;
/** A missing legacy mode becomes an explicitly new 100644 copy; never mutate its original manifest. */
export declare function setSourceModes(root: string, files: Array<{
    path: string;
    mode?: SourceMode;
}>, readOnly?: boolean): void;
export declare function setSourceMode(root: string, path: string, mode: SourceMode): void;
export declare function copySourceModes(from: string, to: string, files: Array<{
    path: string;
}>): void;
export declare function readText(root: string, path: string): {
    path: string;
    content: string;
    digest: string;
    size: number;
};
export declare function writeText(root: string, path: string, content: string, expectedDigest: string | null, store?: Store): {
    path: string;
    digest: string;
    size: number;
};
export declare function listFiles(root: string, sub?: string): Array<{
    path: string;
    size: number;
    digest?: string;
}>;
export declare function snapshotDirectory(root: string, store: string, options?: {
    legacy?: boolean;
}): SourceSnapshot;
export declare function verifySnapshot(path: string, files: Array<{
    path: string;
    digest: string;
    size: number;
    mode?: SourceMode;
}>): void;
