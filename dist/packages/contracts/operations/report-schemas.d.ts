export declare const REPORT_INPUT_SCHEMAS: {
    readonly report_create: {
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
        };
        readonly required: readonly ("title" | "runIds" | "claimIds" | "publicationResultIds")[];
        readonly additionalProperties: false;
    };
    readonly report_inspect: {
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
    };
    readonly report_reference_read: {
        readonly type: "object";
        readonly properties: {
            readonly reportId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly referenceId: {
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
        readonly required: readonly ["reportId", "referenceId"];
        readonly additionalProperties: false;
    };
    readonly report_export: {
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
    };
};
export declare const REPORT_OUTPUT_SCHEMAS: {
    readonly report_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly artifactId: {
                readonly type: "string";
            };
            readonly title: {
                readonly type: "string";
            };
            readonly formatVersion: {
                readonly enum: readonly [0, 1];
            };
            readonly integrity: {
                readonly enum: readonly ["verified", "invalid"];
            };
            readonly validity: {
                readonly enum: readonly ["current", "stale", "legacy"];
            };
            readonly reasons: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly references: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly type: {
                            readonly enum: readonly ["run", "run-source", "artifact", "evidence", "development-job", "development-review", "claim", "publication", "figure-source", "figure-source-code"];
                        };
                        readonly targetId: {
                            readonly type: "string";
                        };
                        readonly label: {
                            readonly type: "string";
                        };
                        readonly runId: {
                            readonly type: "string";
                        };
                        readonly path: {
                            readonly type: "string";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly relation: {
                            readonly enum: readonly ["exact", "ancestry"];
                        };
                        readonly document: {
                            readonly type: "object";
                            readonly properties: {
                                readonly documentVersionId: {
                                    readonly type: "string";
                                };
                                readonly rawDigest: {
                                    readonly type: "string";
                                };
                                readonly parseResultId: {
                                    readonly type: "string";
                                };
                                readonly pageNumber: {
                                    readonly type: "integer";
                                };
                                readonly textArtifactDigest: {
                                    readonly type: "string";
                                };
                                readonly start: {
                                    readonly type: "integer";
                                };
                                readonly end: {
                                    readonly type: "integer";
                                };
                                readonly pageLabel: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly rawArtifactId: {
                                    readonly type: "string";
                                };
                                readonly imageArtifactId: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("end" | "pageNumber" | "documentVersionId" | "rawDigest" | "start" | "parseResultId" | "textArtifactDigest" | "pageLabel" | "imageArtifactId" | "rawArtifactId")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("id" | "type" | "targetId" | "label")[];
                    readonly additionalProperties: false;
                };
            };
            readonly runs: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly runId: {
                            readonly type: "string";
                        };
                        readonly experimentId: {
                            readonly type: "string";
                        };
                        readonly revision: {
                            readonly type: "integer";
                        };
                        readonly state: {
                            readonly enum: readonly ["succeeded", "failed", "cancelled"];
                        };
                        readonly integrity: {
                            readonly enum: readonly ["pending", "complete", "incomplete", "invalid"];
                        };
                        readonly judgment: {
                            readonly enum: readonly ["pending", "supported", "not_supported", "inconclusive"];
                        };
                        readonly sourceDigest: {
                            readonly type: "string";
                        };
                        readonly gitCommit: {
                            readonly type: "string";
                        };
                        readonly metrics: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly value: {
                                        readonly type: "number";
                                    };
                                    readonly unit: {
                                        readonly type: "string";
                                    };
                                    readonly referenceId: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("value" | "name" | "referenceId" | "unit")[];
                                readonly additionalProperties: false;
                            };
                        };
                    };
                    readonly required: ("sourceDigest" | "experimentId" | "revision" | "integrity" | "state" | "runId" | "judgment" | "metrics")[];
                    readonly additionalProperties: false;
                };
            };
            readonly publications: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly resultId: {
                            readonly type: "string";
                        };
                        readonly jobId: {
                            readonly type: "string";
                        };
                        readonly revisionId: {
                            readonly type: "string";
                        };
                        readonly title: {
                            readonly type: "string";
                        };
                        readonly sourceDigest: {
                            readonly type: "string";
                        };
                        readonly pdfArtifactId: {
                            readonly type: "string";
                        };
                        readonly pdfDigest: {
                            readonly type: "string";
                        };
                        readonly pages: {
                            readonly type: "integer";
                        };
                        readonly referenceId: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("jobId" | "sourceDigest" | "pages" | "title" | "resultId" | "revisionId" | "pdfArtifactId" | "pdfDigest" | "referenceId")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("id" | "validity" | "formatVersion" | "artifactId" | "title" | "integrity" | "reasons" | "references" | "runs")[];
        readonly additionalProperties: false;
    };
    readonly report_reference_read: {
        readonly type: "object";
        readonly properties: {
            readonly reference: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly type: {
                        readonly enum: readonly ["run", "run-source", "artifact", "evidence", "development-job", "development-review", "claim", "publication", "figure-source", "figure-source-code"];
                    };
                    readonly targetId: {
                        readonly type: "string";
                    };
                    readonly label: {
                        readonly type: "string";
                    };
                    readonly runId: {
                        readonly type: "string";
                    };
                    readonly path: {
                        readonly type: "string";
                    };
                    readonly digest: {
                        readonly type: "string";
                    };
                    readonly relation: {
                        readonly enum: readonly ["exact", "ancestry"];
                    };
                    readonly document: {
                        readonly type: "object";
                        readonly properties: {
                            readonly documentVersionId: {
                                readonly type: "string";
                            };
                            readonly rawDigest: {
                                readonly type: "string";
                            };
                            readonly parseResultId: {
                                readonly type: "string";
                            };
                            readonly pageNumber: {
                                readonly type: "integer";
                            };
                            readonly textArtifactDigest: {
                                readonly type: "string";
                            };
                            readonly start: {
                                readonly type: "integer";
                            };
                            readonly end: {
                                readonly type: "integer";
                            };
                            readonly pageLabel: {
                                readonly anyOf: readonly [{
                                    readonly type: "string";
                                }, {
                                    readonly type: "null";
                                }];
                            };
                            readonly rawArtifactId: {
                                readonly type: "string";
                            };
                            readonly imageArtifactId: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("end" | "pageNumber" | "documentVersionId" | "rawDigest" | "start" | "parseResultId" | "textArtifactDigest" | "pageLabel" | "imageArtifactId" | "rawArtifactId")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly required: ("id" | "type" | "targetId" | "label")[];
                readonly additionalProperties: false;
            };
            readonly content: {
                readonly type: "string";
            };
            readonly mediaType: {
                readonly type: "string";
            };
            readonly cursor: {
                readonly type: "integer";
            };
            readonly end: {
                readonly type: "integer";
            };
            readonly complete: {
                readonly type: "boolean";
            };
        };
        readonly required: ("complete" | "cursor" | "end" | "mediaType" | "content" | "reference")[];
        readonly additionalProperties: false;
    };
};
