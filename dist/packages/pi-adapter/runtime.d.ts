import type { ModelConfig } from '../domain/types.js';
export declare const PI_VERSION = "0.87.1";
export declare function locatePi(repoRoot: string): {
    base: string;
    version: string;
    sdkPath: string;
    aiPath: string;
} | null;
export declare function inspectPi(repoRoot: string, model: ModelConfig): {
    ready: boolean;
    code: string;
    message: string;
    expectedVersion: string;
    installedVersion: string | null;
    node: string;
    requiredNode: string;
    liveVerified: boolean;
};
