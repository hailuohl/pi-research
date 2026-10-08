import type { ModelApi, ModelDefinitionInput, ModelSelection, PiThinking } from './model-management-types.js';
import { type NativeSource } from './native-request-types.js';
export { nativeAvailability } from './native-request-types.js';
export declare const NATIVE_FILE_BYTES: number, NATIVE_REQUEST_BYTES: number, NATIVE_RESPONSE_BYTES: number;
export declare function nativeEndpoint(baseUrl: string, api: ModelApi): string;
export interface NativeFile {
    source: NativeSource;
    bytes: Buffer;
}
export interface NativePrevious {
    prompt: string;
    blocks: unknown[];
}
export interface NativeReasoning {
    level: PiThinking;
    value?: string | null;
    adaptive?: boolean;
}
/** Only host-verified bytes can enter these fixed protocol shapes. No arbitrary request body or tools. */
export declare function nativeRequestBody(api: ModelApi, definition: ModelDefinitionInput, selection: ModelSelection, prompt: string, files: NativeFile[], search: boolean, maxOutputTokens: number, previous?: NativePrevious, reasoning?: NativeReasoning): Record<string, unknown>;
