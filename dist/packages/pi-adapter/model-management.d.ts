import type { ModelRuntime } from '@earendil-works/pi-coding-agent';
import type { AppContext } from '../domain/context.js';
import type { Actor, ModelConfig } from '../domain/types.js';
import { type ConnectionState, type ModelConnection, type StoredModel } from './model-connections.js';
import type { ModelDefinitionInput, ModelManagementView, ModelPreset, ModelRecommendation } from './model-management-types.js';
export declare const MODEL_PRESETS: ModelPreset[];
export declare function modelSdk(c: AppContext): Promise<typeof import("@earendil-works/pi-coding-agent")>;
export declare function modelCatalog(c: AppContext): Promise<ModelRuntime>;
export declare function defaultSelection(c: AppContext): ModelConfig;
export declare function legacyModels(c: AppContext): ModelConfig[];
/** SDK preparation stays outside SQLite transactions; the returned guard runs inside the write. */
export declare function prepareModelSelection(c: AppContext): Promise<{
    globalVersion: number;
    current: ModelConfig;
    assertCurrent(): void;
    resolve(selected: ModelConfig, repair?: boolean): ModelConfig;
}>;
export type PreparedModelSelection = Awaited<ReturnType<typeof prepareModelSelection>>;
export declare function availableSelections(c: AppContext): ModelConfig[];
type SdkModel = NonNullable<ReturnType<ModelRuntime['getModel']>>;
export declare function recommendedDefinition(model: string, source: SdkModel | undefined): ModelDefinitionInput;
export declare function probeBinding(connection: ModelConnection, model?: StoredModel): string;
export declare function inspectModelManagement(c: AppContext, actor: Actor, state?: ConnectionState): Promise<ModelManagementView>;
export declare function recommendModel(c: AppContext, actor: Actor, provider: string, model: string): Promise<ModelRecommendation>;
export declare function configureModelManagement(c: AppContext, actor: Actor, value: unknown, key: string): Promise<ModelManagementView>;
export {};
