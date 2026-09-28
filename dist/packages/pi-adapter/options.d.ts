import { type JsonSchema } from '../contracts/operations/schema.js';
import type { CreateAgentSessionOptions, ToolDefinition, Skill } from '@earendil-works/pi-coding-agent';
import type { Role, ModelConfig } from '../domain/types.js';
/** Validate raw model arguments before Pi's optional-null normalization and primitive coercion. */
export declare function buildCustomTools(definitions: {
    name: string;
    description: string;
    example: unknown;
    inputSchema: JsonSchema;
}[], dispatch: (name: string, input: unknown, callId: string) => Promise<unknown>): ToolDefinition[];
export interface SessionSetup {
    cwd: string;
    agentDir: string;
    sessionDir: string;
    sessionFile: string | null;
    systemPrompt: string;
    thinking: ModelConfig['thinking'];
    skills?: Skill[];
}
/** Compile against the pinned SDK; imports stay type-only for dependency-free core startup. */
export declare function buildSessionOptions(sdk: Pick<typeof import('@earendil-works/pi-coding-agent'), 'SessionManager' | 'SettingsManager' | 'createExtensionRuntime' | 'CURRENT_SESSION_VERSION'>, setup: SessionSetup, customTools: ToolDefinition[], modelRuntime: CreateAgentSessionOptions['modelRuntime'], model: CreateAgentSessionOptions['model']): CreateAgentSessionOptions;
export declare function systemInstruction(role: Role): string;
export declare function assistantFailure(message: {
    stopReason?: string;
    errorMessage?: string;
}): string | undefined;
