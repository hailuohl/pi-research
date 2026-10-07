import type { ModelRuntime } from '@earendil-works/pi-coding-agent';
import type { AppContext } from '../domain/context.js';
import type { Actor, ModelConfig } from '../domain/types.js';
export declare const CONNECTION_APIS: readonly ["openai-completions", "openai-responses", "anthropic-messages"];
export declare const CONNECTION_FILE = "model-connections.json";
export interface ModelConnection {
    provider: string;
    name: string;
    baseUrl: string;
    api: typeof CONNECTION_APIS[number];
    apiKey: string;
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
export declare function inspectModelConnections(c: AppContext, actor: Actor): ConnectionView;
export declare function selectedModelConnection(dataDir: string, provider: string): ModelConnection | undefined;
export declare function modelConnectionCatalog(dataDir: string): {
    provider: string;
    baseUrl: string;
    api: "openai-completions" | "openai-responses" | "anthropic-messages";
}[];
/** One read binds the selected credential/endpoint and its public catalog against A→B→A edits. */
export declare function modelConnectionSnapshot(dataDir: string, provider: string): {
    connection: ModelConnection | undefined;
    catalog: {
        provider: string;
        baseUrl: string;
        api: "openai-completions" | "openai-responses" | "anthropic-messages";
    }[];
};
export declare function configureModelConnection(c: AppContext, actor: Actor, value: unknown, key: string): ConnectionView;
/** Runtime registration never writes models.json/auth.json or interprets a key as a config command. */
export declare function applyModelConnection(sdk: Pick<typeof import('@earendil-works/pi-coding-agent'), 'ModelRuntime'>, source: ModelRuntime, selected: ModelConfig, config: Omit<ModelConnection, 'apiKey'>, apiKey: string, authPath: string): Promise<ModelRuntime>;
/** An owner-configured endpoint is a model-only outlet; redirects cannot forward its credential. */
export declare function connectionFetch(fetcher: typeof fetch, endpoint: string): typeof fetch;
type ProviderStream = ReturnType<ModelRuntime['streamSimple']>;
/** Sanitize the SDK protocol before the agent sees or persists its final message, including HTTP 200 errors. */
export declare function safeConnectionStream<T extends ProviderStream>(source: T): T;
export {};
