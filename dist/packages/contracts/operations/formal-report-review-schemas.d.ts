import { type JsonSchema } from './schema.js';
export declare const FORMAL_REPORT_ASSESSMENT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly stage: {
            readonly const: "post_run_report";
        };
        readonly checks: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly area: {
                        readonly enum: readonly ["implementation_and_tests", "input_evidence", "independent_units_and_intervals", "threshold_interpretation", "claim_boundaries"];
                    };
                    readonly finding: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly references: {
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly readId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly quote: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["readId", "quote"];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                    readonly blockingGaps: {
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly minItems: number;
                    };
                };
                readonly required: readonly ["area", "finding", "references", "blockingGaps"];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly deferredChecks: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly minItems: number;
        };
    };
    readonly required: readonly ["stage", "checks", "deferredChecks"];
    readonly additionalProperties: false;
};
export declare const FORMAL_REPORT_CONTEXT_SCHEMA: JsonSchema;
export declare const FORMAL_REPORT_INPUT_SCHEMAS: {
    readonly formal_report_review_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly runId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly reportArtifactId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["runId", "reportArtifactId"];
        readonly additionalProperties: false;
    };
    readonly formal_report_review_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly reviewId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["reviewId"];
        readonly additionalProperties: false;
    };
    readonly formal_report_review_source_read: {
        readonly type: "object";
        readonly properties: {
            readonly reviewId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly path: {
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
        readonly required: readonly ["reviewId", "path"];
        readonly additionalProperties: false;
    };
};
export declare const FORMAL_REPORT_OUTPUT_SCHEMAS: Record<'formal_report_review_prepare' | 'formal_report_review_inspect' | 'formal_report_review_source_read', JsonSchema>;
