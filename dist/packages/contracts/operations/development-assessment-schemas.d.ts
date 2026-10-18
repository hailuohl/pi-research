export declare const REVIEW_INVENTORY_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly profile: {
            readonly const: "paired-evidence-review-v1";
        };
        readonly items: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly targetId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly kind: {
                        readonly enum: readonly ["candidate", "source_input", "test_artifact", "brief"];
                    };
                    readonly path: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly digest: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly size: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly artifactId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly verification: {
                        readonly enum: readonly ["host-derived", "profile-checked-raw-evidence", "unverified-open-text", "fixed-source"];
                    };
                    readonly openSurface: {
                        readonly type: "boolean";
                    };
                };
                readonly required: readonly ["targetId", "kind", "path", "digest", "size", "verification", "openSurface"];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly caseIds: {
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
    readonly required: readonly ["profile", "items", "caseIds"];
    readonly additionalProperties: false;
};
export declare const REVIEW_BRIEF_ARTIFACT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly id: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly digest: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly size: {
            readonly type: "integer";
            readonly minimum: number;
            readonly maximum: number;
        };
        readonly path: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
    };
    readonly required: readonly ["id", "digest", "size", "path"];
    readonly additionalProperties: false;
};
export declare const DEVELOPMENT_ASSESSMENT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly surfaceComparisons: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly targetId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly assertions: {
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly claim: {
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
                                readonly authority: {
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
                                readonly caseId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly finding: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly conclusion: {
                                    readonly enum: readonly ["consistent", "contradiction", "unresolved"];
                                };
                            };
                            readonly required: readonly ["claim", "authority", "caseId", "finding", "conclusion"];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                };
                readonly required: readonly ["targetId", "assertions"];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly stage: {
            readonly const: "pre_run";
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
export declare const REVIEW_READING_CHECK_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly targetId: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly kind: {
            readonly enum: readonly ["candidate", "source_input", "test_artifact", "brief"];
        };
        readonly path: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly digest: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly total: {
            readonly anyOf: readonly [{
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            }, {
                readonly type: "null";
            }];
        };
        readonly readComplete: {
            readonly type: "boolean";
        };
        readonly missingIntervals: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly start: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly end: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: readonly ["start", "end"];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly blockedReason: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
    };
    readonly required: readonly ["targetId", "kind", "path", "digest", "total", "readComplete", "missingIntervals"];
    readonly additionalProperties: false;
};
export declare const ASSESSMENT_AREAS_SCHEMA: {
    readonly maxItems?: number | undefined;
    readonly type: "array";
    readonly items: {
        readonly enum: readonly ["implementation_and_tests", "input_evidence", "independent_units_and_intervals", "threshold_interpretation", "claim_boundaries"];
    };
    readonly minItems: number;
};
