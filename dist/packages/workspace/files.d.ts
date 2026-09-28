import { type Store } from '../storage/store.js';
export declare const MAX_TEXT_BYTES: number;
export declare function safePath(root: string, path: string, allowRoot?: boolean): string;
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
export declare function snapshotDirectory(root: string, store: string): {
    digest: string;
    path: string;
    files: {
        path: string;
        size: number;
        digest: string;
    }[];
};
export declare function verifySnapshot(path: string, files: Array<{
    path: string;
    digest: string;
    size: number;
}>): void;
