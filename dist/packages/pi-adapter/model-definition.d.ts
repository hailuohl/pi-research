import type { ModelApi, ModelCapabilities, ModelDefinitionInput, JsonValue, PiThinking, EffectiveCapability } from './model-management-types.js';
export declare const PI_THINKING: readonly ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
export declare const CAPABILITY_KEYS: readonly ["text", "image", "pdf", "video", "structuredOutput", "nativeWebSearch", "midConversationSystem"];
export declare const MODEL_OVERRIDE_FIELDS: string[];
export declare function jsonObject(value: unknown): Record<string, JsonValue>;
export declare function modelParameters(value: unknown, api: ModelApi): Record<string, JsonValue>;
export declare function defaultModelDefinition(model: string): ModelDefinitionInput;
export declare function validateModelDefinition(value: unknown, api: ModelApi): ModelDefinitionInput;
export declare function effectiveCapabilities(model: ModelDefinitionInput, api?: ModelApi): Record<keyof ModelCapabilities, EffectiveCapability>;
export declare function resolvedThinking(model: ModelDefinitionInput | undefined, id: string): PiThinking;
/** The application alone owns messages/tools/auth/dispatch; user JSON can only change validated parameter roots. */
export declare function modelPayload(payload: unknown, model: ModelDefinitionInput, thinking: string, api: ModelApi): unknown;
