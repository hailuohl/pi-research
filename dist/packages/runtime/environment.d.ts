import type { AppContext } from '../domain/context.js';
import type { Actor } from '../domain/types.js';
export declare const ENVIRONMENT_FILE = "environment-variables.json";
export declare function environmentVariables(dataDir: string): Record<string, string>;
export declare function inspectEnvironment(c: AppContext, actor: Actor): {
    version: number;
    variables: {
        name: string;
        hasValue: true;
    }[];
    scope: "local";
};
export declare function configureEnvironment(c: AppContext, actor: Actor, value: unknown, key: string): {
    version: number;
    variables: {
        name: string;
        hasValue: true;
    }[];
    scope: "local";
};
/** Deleted/rotated values remain private, solely to protect historical output. */
export declare function environmentSecrets(dataDir: string): string[];
export declare function redactEnvironment(dataDir: string, value: string): string;
export declare function hasEnvironmentSecrets(dataDir: string): boolean;
/** Keep enough raw tail that no credential can cross an already published boundary. */
export declare function redactEnvironmentChunk(dataDir: string, value: string): {
    text: string;
    tail: string;
};
