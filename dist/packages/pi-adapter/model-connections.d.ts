import type { ModelRuntime } from '@earendil-works/pi-coding-agent';
import type { AppContext } from '../domain/context.js';
import type { Actor, ModelConfig } from '../domain/types.js';
import type { ModelDefinitionInput } from './model-management-types.js';
export declare const CONNECTION_APIS: readonly ["openai-completions", "openai-responses", "anthropic-messages"];
export declare const CONNECTION_FILE = "model-connections.json";
export declare const EMPTY_MODEL_CREDENTIALS: {
    read: () => Promise<undefined>;
    list: () => Promise<never[]>;
    modify: () => Promise<undefined>;
    delete: () => Promise<void>;
};
export interface StoredModel extends ModelDefinitionInput {
    enabled: boolean;
    deletedAt: string | null;
    order: number;
    revision: number;
    controlOnly?: boolean;
}
export interface ModelConnection {
    provider: string;
    name: string;
    baseUrl: string;
    api: typeof CONNECTION_APIS[number];
    apiKey: string;
    enabled?: boolean;
    deletedAt?: string | null;
    order?: number;
    models?: StoredModel[];
    credentialRevision?: number;
    controlOnly?: boolean;
    requiresCredential?: boolean;
}
export type PublicModelConnection = Omit<ModelConnection, 'apiKey'> & {
    hasApiKey: boolean;
};
interface ConnectionView {
    version: number;
    connections: PublicModelConnection[];
    supportedApis: typeof CONNECTION_APIS;
    liveVerified: false;
}
export interface ConnectionState {
    schemaVersion?: 2;
    version: number;
    connections: ModelConnection[];
    receipt?: {
        key: string;
        hash: string;
    };
}
export declare function parseModelConnection(value: unknown): ModelConnection;
/** The same normalized schema gates disk reads and every mutation before a temporary file is opened. */
export declare function validateModelState(value: unknown): ConnectionState;
export declare function readModelState(dataDir: string): ConnectionState;
export declare function inspectModelConnections(c: AppContext, actor: Actor): ConnectionView;
export declare function selectedModelConnection(dataDir: string, provider: string): ModelConnection | undefined;
export declare function modelConnectionCatalog(dataDir: string): {
    models?: ({
        model: string;
        enabled: boolean;
        deletedAt: string | null;
    } | {
        reasoning: {
            defaultLevel: string;
            levels: {
                id: string;
                piLevel: import("./model-management-types.js").PiThinking;
                parameters: Record<string, import("./model-management-types.js").JsonValue>;
            }[];
        };
        enabled: boolean;
        deletedAt: string | null;
        controlOnly?: boolean;
        model: string;
        nativeProfile: import("./model-management-types.js").NativeProfile;
        contextWindow: number;
        maxTokens: number;
        capabilities: import("./model-management-types.js").ModelCapabilities;
        parameters: Record<string, import("./model-management-types.js").JsonValue>;
        structuredOutput: null | {
            name: string;
            schema: Record<string, import("./model-management-types.js").JsonValue>;
            strict: boolean;
        };
    })[] | undefined;
    enabled?: boolean | undefined;
    deletedAt?: string | null | undefined;
    requiresCredential?: boolean | undefined;
    baseUrl?: string | undefined;
    api?: "openai-completions" | "openai-responses" | "anthropic-messages" | undefined;
    provider: string;
}[];
/** One read binds the selected credential/endpoint and its public catalog against A→B→A edits. */
export declare function modelConnectionSnapshot(dataDir: string, provider: string): {
    version: number;
    connection: ModelConnection | undefined;
    catalog: {
        models?: ({
            model: string;
            enabled: boolean;
            deletedAt: string | null;
        } | {
            reasoning: {
                defaultLevel: string;
                levels: {
                    id: string;
                    piLevel: import("./model-management-types.js").PiThinking;
                    parameters: Record<string, import("./model-management-types.js").JsonValue>;
                }[];
            };
            enabled: boolean;
            deletedAt: string | null;
            controlOnly?: boolean;
            model: string;
            nativeProfile: import("./model-management-types.js").NativeProfile;
            contextWindow: number;
            maxTokens: number;
            capabilities: import("./model-management-types.js").ModelCapabilities;
            parameters: Record<string, import("./model-management-types.js").JsonValue>;
            structuredOutput: null | {
                name: string;
                schema: Record<string, import("./model-management-types.js").JsonValue>;
                strict: boolean;
            };
        })[] | undefined;
        enabled?: boolean | undefined;
        deletedAt?: string | null | undefined;
        requiresCredential?: boolean | undefined;
        baseUrl?: string | undefined;
        api?: "openai-completions" | "openai-responses" | "anthropic-messages" | undefined;
        provider: string;
    }[];
};
export declare function modelNeedsCredential(connection: ModelConnection | undefined): boolean;
export declare function assertModelEnabled(dataDir: string, selected: {
    provider: string;
    model: string;
    thinking?: string;
}, captured?: ModelConnection): StoredModel | undefined;
export declare function mutateModelState(c: AppContext, expected: number, key: string, input: unknown, change: (state: ConnectionState) => void): ConnectionState;
/** Offline restore only: publish the validated credential-free state once into a new staging directory. */
export declare function restoreModelManagementState(dataDir: string, state: ConnectionState): void;
export declare function configureModelConnection(c: AppContext, actor: Actor, value: unknown, key: string): ConnectionView;
/** Runtime registration never writes models.json/auth.json or interprets a key as a config command. */
export declare function applyModelConnection(sdk: Pick<typeof import('@earendil-works/pi-coding-agent'), 'ModelRuntime'>, source: ModelRuntime, selected: ModelConfig, config: Omit<ModelConnection, 'apiKey'>, apiKey: string, authPath: string | null): Promise<ModelRuntime>;
/** An owner-configured endpoint is a model-only outlet; redirects cannot forward its credential. */
export declare function connectionFetch(fetcher: typeof fetch, endpoint: string): typeof fetch;
type ProviderStream = ReturnType<ModelRuntime['streamSimple']>;
/** Sanitize the SDK protocol before the agent sees or persists its final message, including HTTP 200 errors. */
export declare function safeConnectionStream<T extends ProviderStream>(source: T): T;
export {};
