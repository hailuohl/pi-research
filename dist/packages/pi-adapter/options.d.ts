import type { Role, ModelConfig } from '../domain/types.js';
export interface SessionSetup {
    cwd: string;
    agentDir: string;
    sessionDir: string;
    sessionFile: string | null;
    systemPrompt: string;
    thinking: ModelConfig['thinking'];
    skills?: {
        name: string;
        description: string;
        filePath: string;
        baseDir: string;
        source: string;
        disableModelInvocation: boolean;
    }[];
}
/** Narrow runtime boundary. Real SDK validation remains a required live acceptance test. */
export declare function buildSessionOptions(sdk: any, setup: SessionSetup, customTools: any[], modelRuntime: unknown, model: unknown): {
    cwd: string;
    agentDir: string;
    modelRuntime: unknown;
    model: unknown;
    thinkingLevel: "off" | "minimal" | "low" | "medium" | "high" | "xhigh";
    tools: any[];
    noTools: string;
    customTools: any[];
    sessionManager: any;
    settingsManager: any;
    resourceLoader: {
        getExtensions: () => {
            extensions: never[];
            errors: never[];
            runtime: any;
        };
        getSkills: () => {
            skills: {
                name: string;
                description: string;
                filePath: string;
                baseDir: string;
                source: string;
                disableModelInvocation: boolean;
            }[];
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
