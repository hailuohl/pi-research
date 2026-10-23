import type { ModelRuntime } from '@earendil-works/pi-coding-agent';
import type { AppContext } from '../domain/context.js';
import type { Actor, ModelConfig, Row, Session, TaskSpec } from '../domain/types.js';
import type { ModelDefinitionInput, ThinkingPolicy, PiThinking } from './model-management-types.js';
import { type FrozenTaskModel } from '../collaboration/task-model.js';
export declare function thinkingPolicies(c: AppContext): ThinkingPolicy[];
export declare function thinkingPolicy(c: AppContext, model: ModelConfig): ThinkingPolicy | undefined;
type SdkModel = NonNullable<ReturnType<ModelRuntime['getModel']>>;
export declare function thinkingDefinition(c: AppContext, selected: ModelConfig): Promise<{
    runtime: ModelRuntime;
    definition: ModelDefinitionInput | undefined;
}>;
export declare function saveThinkingPolicy(c: AppContext, actor: Actor, input: Record<string, unknown>, key: string): Promise<void>;
export declare function inspectThinkingPolicy(c: AppContext, model: ModelConfig): {
    validation: string;
    candidates: {
        id: string;
        purpose: string;
    }[];
    version: number;
    schemaVersion: 1;
    provider: string;
    model: string;
    restoreEpoch: number;
} | null;
export interface TaskModelExecution {
    selection: ModelConfig;
    sdkVersion: string;
    requestedPiThinking: PiThinking;
    piThinking: PiThinking;
    api: string;
    endpointDigest: string;
    metadata: Record<string, unknown>;
    parameters: ModelDefinitionInput['parameters'];
    structuredOutput: ModelDefinitionInput['structuredOutput'];
    catalogDigest: string;
}
/** Match the actual adapter's shallow overrides, retaining only credential-free execution metadata. */
export declare function taskModelExecution(selected: ModelConfig, model: SdkModel, definition: ModelDefinitionInput | undefined, catalogDigest: string, actualPiThinking?: PiThinking): TaskModelExecution;
/** The pinned SDK's own JSONC reader keeps comments/trailing commas and display-only edits out of this guard. */
export declare function selectedCatalogDigest(c: Pick<AppContext, 'repoRoot' | 'dataDir'>, selected: ModelConfig, managed: boolean, actualPiThinking?: PiThinking, catalogSource?: string | null): string;
export interface PreparedTaskModels {
    resolve(rootModel: ModelConfig, tasks: TaskSpec[]): Record<string, FrozenTaskModel>;
}
export declare function prepareTaskModels(c: AppContext, rootSession: Row<Session>, tasks: TaskSpec[]): Promise<PreparedTaskModels | undefined>;
export declare function assertTaskModelCurrentSync(c: Pick<AppContext, 'dataDir' | 'repoRoot'>, frozen: FrozenTaskModel): void;
export declare function assertSessionTaskModelCurrent(c: AppContext, session: Row<Session>): Promise<FrozenTaskModel | undefined>;
export {};
