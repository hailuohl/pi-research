import { type JsonSchema } from '../contracts/operations/schema.js';
import type { CreateAgentSessionOptions, ToolDefinition, Skill } from '@earendil-works/pi-coding-agent';
import type { Role } from '../domain/types.js';
import type { PiThinking } from './model-management-types.js';
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
    thinking: PiThinking;
    skills?: Skill[];
}
/** Compile against the pinned SDK; imports stay type-only for dependency-free core startup. */
export declare function buildSessionOptions(sdk: Pick<typeof import('@earendil-works/pi-coding-agent'), 'SessionManager' | 'SettingsManager' | 'createExtensionRuntime' | 'CURRENT_SESSION_VERSION'>, setup: SessionSetup, customTools: ToolDefinition[], modelRuntime: CreateAgentSessionOptions['modelRuntime'], model: CreateAgentSessionOptions['model']): CreateAgentSessionOptions;
export declare function systemInstruction(role: Role, hostAccess?: boolean, mode?: import('../policy/session-permissions.js').PermissionReference['mode'], fixedTextExecution?: boolean): string;
export declare const EMPTY_LENGTH_FAILURE = "CONTEXT_LENGTH_INCOMPLETE: \u6A21\u578B\u4E0A\u4E0B\u6587\u8F93\u51FA\u989D\u5EA6\u4E0D\u8DB3\uFF0C\u672A\u83B7\u5F97\u5B8C\u6574\u56DE\u7B54\uFF1B\u5386\u53F2\u4E0E\u5DF2\u5B8C\u6210\u64CD\u4F5C\u4FDD\u7559\uFF0C\u8BF7\u5728\u539F\u4F1A\u8BDD\u6838\u5BF9\u540E\u7EE7\u7EED\u3002";
export declare function emptyLengthAssistant(message: {
    stopReason?: string;
    content?: unknown;
    toolCalls?: unknown;
}): boolean;
export declare function assistantFailure(message: {
    stopReason?: string;
    errorMessage?: string;
    content?: unknown;
    toolCalls?: unknown;
}): string | undefined;
