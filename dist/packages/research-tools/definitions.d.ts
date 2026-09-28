import type { JsonSchema } from '../contracts/operations/schema.js';
export declare const TOOL_DEFINITIONS: Record<string, {
    description: string;
    example: unknown;
    inputSchema: JsonSchema;
    outputSchema?: JsonSchema;
}>;
