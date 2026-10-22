/** Shared owner-management contracts. No credentials or runtime dependencies. */
export type ModelApi = 'openai-completions' | 'openai-responses' | 'anthropic-messages';
export type PiThinking = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
export type NativeProfile = 'none' | 'openai' | 'anthropic' | 'qwen' | 'openrouter';
export type JsonValue = null | boolean | number | string | JsonValue[] | {
    [key: string]: JsonValue;
};
export interface ModelCapabilities {
    text: boolean;
    image: boolean;
    pdf: boolean;
    video: boolean;
    structuredOutput: boolean;
    nativeWebSearch: boolean;
    midConversationSystem: boolean;
}
export interface ReasoningLevel {
    id: string;
    label: string;
    piLevel: PiThinking;
    parameters: Record<string, JsonValue>;
}
export interface ModelDefinitionInput {
    model: string;
    name: string;
    nativeProfile: NativeProfile;
    contextWindow: number;
    maxTokens: number;
    capabilities: ModelCapabilities;
    reasoning: {
        defaultLevel: string;
        levels: ReasoningLevel[];
    };
    parameters: Record<string, JsonValue>;
    structuredOutput: null | {
        name: string;
        schema: Record<string, JsonValue>;
        strict: boolean;
    };
    configuration: {
        mode: 'matched' | 'manual';
        overrides: string[];
    };
}
export interface ModelProbeResult {
    coverage: 'minimal-availability';
    state: 'passed' | 'failed' | 'stale' | 'running' | 'unknown';
    category: 'success' | 'authentication' | 'model_not_found' | 'rate_limit' | 'network' | 'server' | 'invalid_request' | 'unsupported' | 'unknown';
    checkedAt: string;
    durationMs: number;
    requests: number;
    httpStatus?: number;
}
export interface EffectiveCapability {
    declared: boolean;
    state: 'available' | 'disabled' | 'unsupported';
    reason: string;
}
export interface ManagedModel extends ModelDefinitionInput {
    restoreEpoch?: number;
    enabled: boolean;
    deletedAt: string | null;
    order: number;
    revision: number;
    source: 'managed' | 'legacy';
    effectiveCapabilities: Record<keyof ModelCapabilities, EffectiveCapability>;
    test: ModelProbeResult | null;
}
export interface ManagedProvider {
    requiresCredential?: boolean;
    provider: string;
    name: string;
    enabled: boolean;
    deletedAt: string | null;
    order: number;
    source: 'managed' | 'legacy';
    baseUrl: string;
    api: ModelApi;
    hasApiKey: boolean;
    models: ManagedModel[];
    test: ModelProbeResult | null;
}
export interface ModelSelection {
    provider: string;
    model: string;
    thinking: string;
}
export interface ModelPreset {
    id: string;
    name: string;
    group: string;
    providerBrand: string;
    baseUrl: string;
    api: ModelApi;
}
export interface ModelManagementView {
    schemaVersion: 2;
    version: number;
    defaultModel: ModelSelection;
    defaultModelVersion: number;
    defaultUsable: boolean;
    providers: ManagedProvider[];
    presets: ModelPreset[];
    supportedApis: ModelApi[];
}
export type ModelManagementCommand = {
    expectedVersion: number;
    action: 'provider.upsert';
    provider: string;
    value: {
        name: string;
        baseUrl: string;
        api: ModelApi;
        apiKey?: string;
    };
} | {
    expectedVersion: number;
    action: 'provider.enabled';
    provider: string;
    value: {
        enabled: boolean;
    };
} | {
    expectedVersion: number;
    action: 'provider.delete';
    provider: string;
} | {
    expectedVersion: number;
    action: 'providers.reorder';
    value: {
        providers: string[];
    };
} | {
    expectedVersion: number;
    action: 'model.upsert';
    provider: string;
    model: string;
    value: ModelDefinitionInput;
} | {
    expectedVersion: number;
    action: 'model.enabled';
    provider: string;
    model: string;
    value: {
        enabled: boolean;
    };
} | {
    expectedVersion: number;
    action: 'model.delete';
    provider: string;
    model: string;
} | {
    expectedVersion: number;
    action: 'model.restore';
    provider: string;
    model: string;
} | {
    expectedVersion: number;
    action: 'models.reorder';
    provider: string;
    value: {
        models: string[];
    };
};
export interface ModelRecommendation {
    matched: boolean;
    source: {
        provider: string;
        model: string;
        sdkVersion: string;
    } | null;
    value: ModelDefinitionInput | null;
    changes: {
        field: string;
        current: JsonValue | undefined;
        recommended: JsonValue | undefined;
    }[];
}
export interface ModelProbeInput {
    expectedVersion: number;
    provider: string;
    model?: string;
    kind: 'connection' | 'model';
    acknowledgedCost: true;
}
