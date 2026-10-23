import { type JsonSchema, type InferSchema } from './schema.js';
export declare const RESEARCH_ACTION_INPUT_SCHEMA: {
    readonly type: "object";
    readonly anyOf: readonly [{
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly enum: readonly ["text_grant"];
            };
            readonly textGrant: {
                readonly type: "object";
                readonly properties: {
                    readonly documents: {
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly documentVersionId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly parseResultId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["documentVersionId", "parseResultId"];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                    readonly pmcDocuments: {
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly documentVersionId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["documentVersionId"];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                    readonly maxSearches: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly expiresAt: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["documents", "maxSearches", "expiresAt"];
                readonly additionalProperties: false;
            };
        };
        readonly required: readonly ["kind", "textGrant"];
        readonly additionalProperties: false;
    }, {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly enum: readonly ["claim_decision"];
            };
            readonly claim: {
                readonly type: "object";
                readonly properties: {
                    readonly claimId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly expectedVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly proposedDecision: {
                        readonly enum: readonly ["accepted", "rejected", "disputed"];
                    };
                    readonly reason: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly evidenceIds: {
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
                readonly required: readonly ["claimId", "expectedVersion"];
                readonly additionalProperties: false;
            };
        };
        readonly required: readonly ["kind", "claim"];
        readonly additionalProperties: false;
    }, {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly enum: readonly ["report_compose"];
            };
            readonly report: {
                readonly type: "object";
                readonly properties: {
                    readonly title: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly runIds: {
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
                    readonly claimIds: {
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
                    readonly publicationResultIds: {
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
                    readonly campaignIds: {
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
                readonly required: readonly ["title", "runIds", "claimIds", "publicationResultIds"];
                readonly additionalProperties: false;
            };
        };
        readonly required: readonly ["kind", "report"];
        readonly additionalProperties: false;
    }, {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly enum: readonly ["history"];
            };
            readonly history: {
                readonly type: "object";
                readonly properties: {
                    readonly kind: {
                        readonly enum: readonly ["documents", "evidence", "claims", "reports"];
                    };
                };
                readonly required: readonly ["kind"];
                readonly additionalProperties: false;
            };
        };
        readonly required: readonly ["kind", "history"];
        readonly additionalProperties: false;
    }];
};
export type ResearchActionInput = InferSchema<typeof RESEARCH_ACTION_INPUT_SCHEMA>;
export declare const RESEARCH_ACTION_INPUT_SCHEMAS: {
    readonly research_action_prepare: {
        readonly type: "object";
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly kind: {
                    readonly enum: readonly ["text_grant"];
                };
                readonly textGrant: {
                    readonly type: "object";
                    readonly properties: {
                        readonly documents: {
                            readonly maxItems?: number | undefined;
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly documentVersionId: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                    readonly parseResultId: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                };
                                readonly required: readonly ["documentVersionId", "parseResultId"];
                                readonly additionalProperties: false;
                            };
                            readonly minItems: number;
                        };
                        readonly pmcDocuments: {
                            readonly maxItems?: number | undefined;
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly documentVersionId: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                };
                                readonly required: readonly ["documentVersionId"];
                                readonly additionalProperties: false;
                            };
                            readonly minItems: number;
                        };
                        readonly maxSearches: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly expiresAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["documents", "maxSearches", "expiresAt"];
                    readonly additionalProperties: false;
                };
            };
            readonly required: readonly ["kind", "textGrant"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
                readonly kind: {
                    readonly enum: readonly ["claim_decision"];
                };
                readonly claim: {
                    readonly type: "object";
                    readonly properties: {
                        readonly claimId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly expectedVersion: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly proposedDecision: {
                            readonly enum: readonly ["accepted", "rejected", "disputed"];
                        };
                        readonly reason: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly evidenceIds: {
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
                    readonly required: readonly ["claimId", "expectedVersion"];
                    readonly additionalProperties: false;
                };
            };
            readonly required: readonly ["kind", "claim"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
                readonly kind: {
                    readonly enum: readonly ["report_compose"];
                };
                readonly report: {
                    readonly type: "object";
                    readonly properties: {
                        readonly title: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly runIds: {
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
                        readonly claimIds: {
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
                        readonly publicationResultIds: {
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
                        readonly campaignIds: {
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
                    readonly required: readonly ["title", "runIds", "claimIds", "publicationResultIds"];
                    readonly additionalProperties: false;
                };
            };
            readonly required: readonly ["kind", "report"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
                readonly kind: {
                    readonly enum: readonly ["history"];
                };
                readonly history: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly enum: readonly ["documents", "evidence", "claims", "reports"];
                        };
                    };
                    readonly required: readonly ["kind"];
                    readonly additionalProperties: false;
                };
            };
            readonly required: readonly ["kind", "history"];
            readonly additionalProperties: false;
        }];
    };
    readonly research_action_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly requestId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["requestId"];
        readonly additionalProperties: false;
    };
    readonly research_action_decide: {
        readonly type: "object";
        readonly properties: {
            readonly requestId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly expectedVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly decision: {
                readonly enum: readonly ["confirm", "reject", "accepted", "rejected", "disputed", "dismiss"];
            };
        };
        readonly required: readonly ["requestId", "expectedVersion", "decision"];
        readonly additionalProperties: false;
    };
};
export type ResearchActionDecision = InferSchema<typeof RESEARCH_ACTION_INPUT_SCHEMAS.research_action_decide>['decision'];
export declare const RESEARCH_ACTION_OUTPUT_SCHEMAS: {
    readonly research_action_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly automaticApproval: JsonSchema;
            readonly automaticExecution: JsonSchema;
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly kind: {
                readonly enum: readonly ["text_grant", "claim_decision", "report_compose", "history"];
            };
            readonly state: {
                readonly enum: readonly ["pending", "completed", "rejected"];
            };
            readonly effectiveState: {
                readonly enum: readonly ["pending", "completed", "rejected", "stale", "expired"];
            };
            readonly expiresAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly resultRef: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly grantId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["grantId"];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly reportId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["reportId"];
                    readonly additionalProperties: false;
                }];
            };
        };
        readonly required: readonly ["id", "sessionId", "kind", "state", "effectiveState", "expiresAt"];
        readonly additionalProperties: false;
    };
    readonly research_action_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly automaticApproval: JsonSchema;
            readonly automaticExecution: JsonSchema;
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly kind: {
                readonly enum: readonly ["text_grant", "claim_decision", "report_compose", "history"];
            };
            readonly state: {
                readonly enum: readonly ["pending", "completed", "rejected"];
            };
            readonly effectiveState: {
                readonly enum: readonly ["pending", "completed", "rejected", "stale", "expired"];
            };
            readonly expiresAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly resultRef: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly grantId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["grantId"];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly reportId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["reportId"];
                    readonly additionalProperties: false;
                }];
            };
        };
        readonly required: readonly ["id", "sessionId", "kind", "state", "effectiveState", "expiresAt"];
        readonly additionalProperties: false;
    };
    readonly research_action_decide: {
        readonly type: "object";
        readonly properties: {
            readonly automaticApproval: JsonSchema;
            readonly automaticExecution: JsonSchema;
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly kind: {
                readonly enum: readonly ["text_grant", "claim_decision", "report_compose", "history"];
            };
            readonly state: {
                readonly enum: readonly ["pending", "completed", "rejected"];
            };
            readonly effectiveState: {
                readonly enum: readonly ["pending", "completed", "rejected", "stale", "expired"];
            };
            readonly expiresAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly resultRef: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly grantId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["grantId"];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly reportId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["reportId"];
                    readonly additionalProperties: false;
                }];
            };
        };
        readonly required: readonly ["id", "sessionId", "kind", "state", "effectiveState", "expiresAt"];
        readonly additionalProperties: false;
    };
};
