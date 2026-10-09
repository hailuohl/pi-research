import type { ModelConfig } from '../domain/types.js';
export declare const PI_VERSION = "0.87.1";
export declare const MODEL_HTTP_TIMEOUT_MS = 600000;
export declare const PROVIDER_TIMEOUT_FAILURE = "PROVIDER_TIMEOUT: \u6A21\u578B\u8BF7\u6C42\u7B49\u5F85\u8D85\u65F6\uFF1B\u5DF2\u5B8C\u6210\u7684\u5DE5\u5177\u64CD\u4F5C\u548C\u5386\u53F2\u4FDD\u7559\uFF0C\u8BF7\u5728\u539F\u4F1A\u8BDD\u6838\u5BF9\u540E\u7EE7\u7EED\uFF0C\u907F\u514D\u91CD\u590D\u5DF2\u5B8C\u6210\u64CD\u4F5C\u3002";
export declare function isProviderTimeout(error: unknown): boolean;
export declare function locatePi(repoRoot: string): {
    base: string;
    version: string;
    aiVersion: string;
    sdkPath: string;
    aiPath: string;
} | null;
export declare function piFailure(error: unknown): string;
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
