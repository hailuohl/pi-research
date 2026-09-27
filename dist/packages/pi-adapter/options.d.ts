import type { CreateAgentSessionOptions, ToolDefinition, Skill } from '@earendil-works/pi-coding-agent';
import type { Role, ModelConfig } from '../domain/types.js';
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
export declare function buildSessionOptions(sdk: Pick<typeof import('@earendil-works/pi-coding-agent'), 'SessionManager' | 'SettingsManager' | 'createExtensionRuntime' | 'CURRENT_SESSION_VERSION'>, setup: SessionSetup, customTools: ToolDefinition[], modelRuntime: CreateAgentSessionOptions['modelRuntime'], model: CreateAgentSessionOptions['model']): {
    cwd: string;
    agentDir: string;
    modelRuntime: import("@earendil-works/pi-coding-agent").ModelRuntime | undefined;
    model: import("@earendil-works/pi-ai").Model<any> | undefined;
    thinkingLevel: "off" | "minimal" | "low" | "medium" | "high" | "xhigh";
    tools: string[];
    noTools: "builtin";
    customTools: ToolDefinition<import("@earendil-works/pi-ai").TSchema, unknown, any>[];
    sessionManager: import("@earendil-works/pi-coding-agent").SessionManager;
    settingsManager: import("@earendil-works/pi-coding-agent").SettingsManager;
    resourceLoader: {
        getExtensions: () => {
            extensions: never[];
            errors: never[];
            runtime: import("@earendil-works/pi-coding-agent").ExtensionRuntime;
        };
        getSkills: () => {
            skills: Skill[];
            diagnostics: never[];
        };
        getPrompts: () => {
            prompts: never[];
            diagnostics: never[];
        };
        getThemes: () => {
            themes: never[];
            diagnostics: never[];
        };
        getAgentsFiles: () => {
            agentsFiles: never[];
        };
        getSystemPrompt: () => string;
        getSystemPromptSource: () => undefined;
        getAppendSystemPrompt: () => never[];
        getAppendSystemPromptSources: () => never[];
        extendResources: () => void;
        reload: () => Promise<void>;
    };
};
export declare function systemInstruction(role: Role): string;
export declare function assistantFailure(message: {
    stopReason?: string;
    errorMessage?: string;
}): string | undefined;
