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
        readonly required: readonly ("title" | "runIds" | "claimIds" | "publicationResultIds" | "campaignIds")[];
        readonly additionalProperties: false;
    };
    readonly report_list: {
        readonly type: "object";
        readonly properties: {
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
        readonly required: readonly [];
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
    readonly report_list: {
        readonly type: "object";
        readonly properties: {
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly projectId: {
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
                        readonly createdAt: {
                            readonly type: "string";
                        };
                        readonly updatedAt: {
                            readonly type: "string";
                        };
                        readonly runCount: {
                            readonly type: "integer";
                        };
                        readonly claimCount: {
                            readonly type: "integer";
                        };
                    };
                    readonly required: ("id" | "createdAt" | "title" | "formatVersion" | "artifactId" | "projectId" | "updatedAt" | "runCount" | "claimCount")[];
                    readonly additionalProperties: false;
                };
            };
            readonly cursor: {
                readonly type: "integer";
            };
            readonly hasMore: {
                readonly type: "boolean";
            };
        };
        readonly required: ("cursor" | "items" | "hasMore")[];
        readonly additionalProperties: false;
    };
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
                            readonly enum: readonly ["run", "run-source", "artifact", "evidence", "development-job", "development-review", "claim", "publication", "figure-source", "figure-source-code", "publication-review", "research-comparison", "experiment-plan"];
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
                            readonly required: ("pageNumber" | "documentVersionId" | "parseResultId" | "end" | "textArtifactDigest" | "rawDigest" | "start" | "pageLabel" | "imageArtifactId" | "rawArtifactId")[];
                            readonly additionalProperties: false;
                        };
                        readonly providerText: {
                            readonly type: "object";
                            readonly properties: {
                                readonly documentVersionId: {
                                    readonly type: "string";
                                };
                                readonly documentDigest: {
                                    readonly type: "string";
                                };
                                readonly rawDigest: {
                                    readonly type: "string";
                                };
                                readonly textArtifactDigest: {
                                    readonly type: "string";
                                };
                                readonly reportedVersion: {
                                    readonly type: "string";
                                };
                                readonly start: {
                                    readonly type: "integer";
                                };
                                readonly end: {
                                    readonly type: "integer";
                                };
                                readonly rawArtifactId: {
                                    readonly type: "string";
                                };
                                readonly textArtifactId: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("documentVersionId" | "end" | "reportedVersion" | "textArtifactDigest" | "textArtifactId" | "documentDigest" | "rawDigest" | "start" | "rawArtifactId")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("id" | "targetId" | "label" | "type")[];
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
                                readonly required: ("value" | "name" | "unit" | "referenceId")[];
                                readonly additionalProperties: false;
                            };
                        };
                    };
                    readonly required: ("state" | "experimentId" | "sourceDigest" | "revision" | "runId" | "integrity" | "metrics" | "judgment")[];
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
                    readonly required: ("sourceDigest" | "title" | "revisionId" | "jobId" | "pages" | "resultId" | "pdfDigest" | "pdfArtifactId" | "referenceId")[];
                    readonly additionalProperties: false;
                };
            };
            readonly publicationReviews: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly resultId: {
                            readonly type: "string";
                        };
                        readonly reviewIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly reviews: {
                            readonly type: "array";
                            readonly items: {
                                readonly properties: {
                                    readonly referenceId: {
                                        readonly type: "string";
                                    };
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly publicationResultId: {
                                        readonly type: "string";
                                    };
                                    readonly revisionId: {
                                        readonly type: "string";
                                    };
                                    readonly jobId: {
                                        readonly type: "string";
                                    };
                                    readonly sourceDigest: {
                                        readonly type: "string";
                                    };
                                    readonly pdfDigest: {
                                        readonly type: "string";
                                    };
                                    readonly rootSessionId: {
                                        readonly type: "string";
                                    };
                                    readonly teamId: {
                                        readonly type: "string";
                                    };
                                    readonly taskId: {
                                        readonly type: "string";
                                    };
                                    readonly approvalId: {
                                        readonly type: "string";
                                    };
                                    readonly digest: {
                                        readonly type: "string";
                                    };
                                    readonly status: {
                                        readonly enum: readonly ["awaiting_approval", "pending", "running", "passed", "rejected", "disputed", "failed"];
                                    };
                                    readonly validity: {
                                        readonly enum: readonly ["current", "stale"];
                                    };
                                    readonly requiredEvidenceIds: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly artifactIds: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly reason: {
                                        readonly type: "string";
                                    };
                                    readonly reviewerSessionId: {
                                        readonly type: "string";
                                    };
                                    readonly attemptId: {
                                        readonly type: "string";
                                    };
                                    readonly inputDigest: {
                                        readonly type: "string";
                                    };
                                    readonly taskResultId: {
                                        readonly type: "string";
                                    };
                                    readonly taskResultDigest: {
                                        readonly type: "string";
                                    };
                                    readonly verdict: {
                                        readonly enum: readonly ["accept", "reject", "disputed"];
                                    };
                                    readonly summary: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: readonly [...("publicationResultId" | "digest" | "id" | "sourceDigest" | "teamId" | "taskId" | "status" | "approvalId" | "rootSessionId" | "revisionId" | "jobId" | "requiredEvidenceIds" | "validity" | "artifactIds" | "pdfDigest")[], "referenceId"];
                                readonly type: "object";
                                readonly additionalProperties: false;
                            };
                        };
                    };
                    readonly required: ("resultId" | "reviews" | "reviewIds")[];
                    readonly additionalProperties: false;
                };
            };
            readonly researchCampaigns: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly campaignId: {
                            readonly type: "string";
                        };
                        readonly state: {
                            readonly type: "string";
                        };
                        readonly primaryMetric: {
                            readonly type: "string";
                        };
                        readonly unit: {
                            readonly type: "string";
                        };
                        readonly conclusion: {
                            readonly enum: readonly ["requires_review"];
                        };
                        readonly referenceId: {
                            readonly type: "string";
                        };
                        readonly planReferences: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly planRevisionId: {
                                        readonly type: "string";
                                    };
                                    readonly referenceId: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("planRevisionId" | "referenceId")[];
                                readonly additionalProperties: false;
                            };
                        };
                    };
                    readonly required: ("state" | "primaryMetric" | "campaignId" | "conclusion" | "unit" | "referenceId" | "planReferences")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("id" | "title" | "formatVersion" | "artifactId" | "validity" | "reasons" | "integrity" | "references" | "runs")[];
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
                        readonly enum: readonly ["run", "run-source", "artifact", "evidence", "development-job", "development-review", "claim", "publication", "figure-source", "figure-source-code", "publication-review", "research-comparison", "experiment-plan"];
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
                        readonly required: ("pageNumber" | "documentVersionId" | "parseResultId" | "end" | "textArtifactDigest" | "rawDigest" | "start" | "pageLabel" | "imageArtifactId" | "rawArtifactId")[];
                        readonly additionalProperties: false;
                    };
                    readonly providerText: {
                        readonly type: "object";
                        readonly properties: {
                            readonly documentVersionId: {
                                readonly type: "string";
                            };
                            readonly documentDigest: {
                                readonly type: "string";
                            };
                            readonly rawDigest: {
                                readonly type: "string";
                            };
                            readonly textArtifactDigest: {
                                readonly type: "string";
                            };
                            readonly reportedVersion: {
                                readonly type: "string";
                            };
                            readonly start: {
                                readonly type: "integer";
                            };
                            readonly end: {
                                readonly type: "integer";
                            };
                            readonly rawArtifactId: {
                                readonly type: "string";
                            };
                            readonly textArtifactId: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("documentVersionId" | "end" | "reportedVersion" | "textArtifactDigest" | "textArtifactId" | "documentDigest" | "rawDigest" | "start" | "rawArtifactId")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly required: ("id" | "targetId" | "label" | "type")[];
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
        readonly required: ("complete" | "content" | "end" | "cursor" | "reference" | "mediaType")[];
        readonly additionalProperties: false;
    };
};
