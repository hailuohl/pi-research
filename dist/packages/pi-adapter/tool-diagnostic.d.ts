import type { JsonSchema } from '../contracts/operations/schema.js';
export type ToolDiagnostic = {
    code: 'APPROVAL_REQUIRED';
} | {
    code: 'INVALID_INPUT';
    path?: string;
    reason?: string;
};
export declare function safeToolDiagnostic(schema: JsonSchema, code: unknown, message: unknown): ToolDiagnostic | undefined;
/** Pinned Pi wraps a thrown error in exactly one text block; never forward that result. */
export declare function toolResultDiagnostic(schema: JsonSchema, result: unknown): ToolDiagnostic | undefined;
