import { type JsonSchema } from './schema.js';
export declare const SESSION_HISTORY_INPUT_SCHEMAS: {
    readonly session_list: {
        readonly type: "object";
        readonly properties: {
            readonly query: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly beforeSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly role: {
                readonly enum: readonly ["all", "coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
            };
            readonly stateFilter: {
                readonly enum: readonly ["active", "archived", "all"];
            };
            readonly limit: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
        };
        readonly required: readonly ("role" | "query" | "limit" | "stateFilter" | "beforeSessionId")[];
        readonly additionalProperties: false;
    };
    readonly session_view: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly beforeMessageId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly afterMessageId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly limit: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
        };
        readonly required: readonly ["sessionId"];
        readonly additionalProperties: false;
    };
    readonly session_message_read: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly messageId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly cursor: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly limit: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly expectedVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
        };
        readonly required: readonly ["sessionId", "messageId"];
        readonly additionalProperties: false;
    };
    readonly session_attachment_read: {
        readonly type: "object";
        readonly properties: {
            readonly messageId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly documentVersionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly cursor: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly limit: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
        };
        readonly required: readonly ["messageId", "documentVersionId"];
        readonly additionalProperties: false;
    };
};
export declare const SESSION_HISTORY_OUTPUT_SCHEMAS: Record<keyof typeof SESSION_HISTORY_INPUT_SCHEMAS, JsonSchema>;
