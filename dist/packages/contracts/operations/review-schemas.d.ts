export declare const REVIEW_TEST_ARTIFACT_SCHEMA: {
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
            minLength: number;
            pattern: string;
            type: "string";
            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            maxLength: number;
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
        readonly required: {
            readonly type: "boolean";
        };
    };
    readonly required: readonly ["id", "digest", "size", "path", "required"];
    readonly additionalProperties: false;
};
export declare const REVIEW_INPUT_SCHEMAS: {
    readonly development_review_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly jobId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["jobId"];
        readonly additionalProperties: false;
    };
    readonly development_review_inspect: {
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
    readonly development_review_source_list: {
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
    readonly development_review_source_read: {
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
export declare const REVIEW_OUTPUT_SCHEMAS: {
    readonly development_review_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly producerSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly baseSourceRevisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly teamId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly taskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly approvalId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly manifestEvidenceId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly testEvidenceIds: {
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
            readonly requiredEvidenceIds: {
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
            readonly dataArtifacts: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly size: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly sourceAcceptanceId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["id", "digest", "size"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly digest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly status: {
                readonly enum: readonly ["awaiting_approval", "pending", "running", "passed", "rejected", "disputed", "failed", "stale"];
            };
            readonly reviewerSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly verdict: {
                readonly enum: readonly ["accept", "reject", "disputed"];
            };
            readonly reviewId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly jobId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly surfaceInventory: {
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
            readonly briefArtifact: {
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
            readonly draftRoles: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly role: {
                            readonly enum: readonly ["protocol", "implementation", "notes"];
                        };
                    };
                    readonly required: ("role" | "path")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly protocolDocument: {
                readonly type: "object";
                readonly properties: {
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
                    readonly compilerVersion: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: ("path" | "digest" | "compilerVersion")[];
                readonly additionalProperties: false;
            };
            readonly protocolVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly researchBrief: {
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
                    readonly revision: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly rootSessionId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: ("rootSessionId" | "id" | "digest" | "revision")[];
                readonly additionalProperties: false;
            };
            readonly sourceInputs: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly workspace: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly artifactId: {
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
                        readonly readId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("artifactId" | "path" | "size" | "digest" | "workspace" | "readId")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly testArtifacts: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
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
                        readonly required: {
                            readonly type: "boolean";
                        };
                    };
                    readonly required: readonly ["id", "digest", "size", "path", "required"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly readingChecks: {
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
                readonly minItems: number;
            };
            readonly assessmentRequiredAreas: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["implementation_and_tests", "input_evidence", "independent_units_and_intervals", "threshold_interpretation", "claim_boundaries"];
                };
                readonly minItems: number;
            };
            readonly blockingMessage: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["id", "reviewId", "jobId", "sourceDigest", "producerSessionId", "teamId", "taskId", "approvalId", "manifestEvidenceId", "testEvidenceIds", "requiredEvidenceIds", "digest", "status"];
        readonly additionalProperties: false;
    };
    readonly development_review_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly producerSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly baseSourceRevisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly teamId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly taskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly approvalId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly manifestEvidenceId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly testEvidenceIds: {
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
            readonly requiredEvidenceIds: {
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
            readonly dataArtifacts: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly size: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly sourceAcceptanceId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["id", "digest", "size"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly digest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly status: {
                readonly enum: readonly ["awaiting_approval", "pending", "running", "passed", "rejected", "disputed", "failed", "stale"];
            };
            readonly reviewerSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly verdict: {
                readonly enum: readonly ["accept", "reject", "disputed"];
            };
            readonly reviewId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly jobId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly surfaceInventory: {
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
            readonly briefArtifact: {
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
            readonly draftRoles: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly role: {
                            readonly enum: readonly ["protocol", "implementation", "notes"];
                        };
                    };
                    readonly required: ("role" | "path")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly protocolDocument: {
                readonly type: "object";
                readonly properties: {
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
                    readonly compilerVersion: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: ("path" | "digest" | "compilerVersion")[];
                readonly additionalProperties: false;
            };
            readonly protocolVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly researchBrief: {
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
                    readonly revision: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly rootSessionId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: ("rootSessionId" | "id" | "digest" | "revision")[];
                readonly additionalProperties: false;
            };
            readonly sourceInputs: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly workspace: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly artifactId: {
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
                        readonly readId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("artifactId" | "path" | "size" | "digest" | "workspace" | "readId")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly testArtifacts: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
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
                        readonly required: {
                            readonly type: "boolean";
                        };
                    };
                    readonly required: readonly ["id", "digest", "size", "path", "required"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly readingChecks: {
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
                readonly minItems: number;
            };
            readonly assessmentRequiredAreas: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["implementation_and_tests", "input_evidence", "independent_units_and_intervals", "threshold_interpretation", "claim_boundaries"];
                };
                readonly minItems: number;
            };
            readonly blockingMessage: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["id", "reviewId", "jobId", "sourceDigest", "producerSessionId", "teamId", "taskId", "approvalId", "manifestEvidenceId", "testEvidenceIds", "requiredEvidenceIds", "digest", "status"];
        readonly additionalProperties: false;
    };
    readonly development_review_source_list: {
        readonly type: "object";
        readonly properties: {
            readonly files: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        path: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        size: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        digest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        mode: {
                            readonly enum: readonly ["100644", "100755"];
                        };
                    };
                    readonly required: readonly ["path", "size", "digest"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly reviewId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly jobId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
        };
        readonly required: readonly ["reviewId", "jobId", "sourceDigest", "files"];
        readonly additionalProperties: false;
    };
    readonly development_review_source_read: {
        readonly type: "object";
        readonly properties: {
            readonly cursor: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly end: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly complete: {
                readonly type: "boolean";
            };
            readonly content: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly reviewReadId: {
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
            readonly size: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly digest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly mode: {
                readonly enum: readonly ["100644", "100755"];
            };
            readonly reviewId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly jobId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
        };
        readonly required: readonly ["reviewId", "jobId", "sourceDigest", "path", "size", "digest", "cursor", "end", "complete", "content"];
        readonly additionalProperties: false;
    };
};
