export declare const PUBLICATION_REVIEW_SCHEMA: {
    readonly type: "object";
    readonly properties: {
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
    readonly required: ("publicationResultId" | "digest" | "id" | "sourceDigest" | "teamId" | "taskId" | "status" | "approvalId" | "rootSessionId" | "revisionId" | "jobId" | "requiredEvidenceIds" | "validity" | "artifactIds" | "pdfDigest")[];
    readonly additionalProperties: false;
};
export declare const PUBLICATION_INPUT_SCHEMAS: {
    readonly publication_page_image_read: {
        readonly type: "object";
        readonly properties: {
            readonly publicationResultId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly pageNumber: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
        };
        readonly required: readonly ["publicationResultId", "pageNumber"];
        readonly additionalProperties: false;
    };
    readonly publication_review_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly resultId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly rootSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly inputEvidenceIds: {
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
        readonly required: readonly ["resultId"];
        readonly additionalProperties: false;
    };
    readonly publication_review_inspect: {
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
    readonly publication_review_list: {
        readonly type: "object";
        readonly properties: {
            readonly resultId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["resultId"];
        readonly additionalProperties: false;
    };
    readonly publication_template_import: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly files: {
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
                        readonly contentBase64: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["path", "contentBase64"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly zipBase64: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["title", "engine", "mainFile", "bibliography"];
        readonly additionalProperties: false;
    };
    readonly publication_template_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly templateId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["templateId"];
        readonly additionalProperties: false;
    };
    readonly publication_template_read: {
        readonly type: "object";
        readonly properties: {
            readonly templateId: {
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
        };
        readonly required: readonly ["templateId", "path"];
        readonly additionalProperties: false;
    };
    readonly publication_templates: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly manuscript_create: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly templateId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly previousRevisionId: {
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
            readonly files: {
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
                        readonly contentBase64: {
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
                    };
                    readonly required: readonly ["path"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
        };
        readonly required: readonly ["title", "engine", "mainFile", "bibliography", "files"];
        readonly additionalProperties: false;
    };
    readonly manuscript_list: {
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
        readonly required: readonly ("limit" | "cursor")[];
        readonly additionalProperties: false;
    };
    readonly manuscript_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly revisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["revisionId"];
        readonly additionalProperties: false;
    };
    readonly manuscript_source_read: {
        readonly type: "object";
        readonly properties: {
            readonly revisionId: {
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
        readonly required: readonly ["revisionId", "path"];
        readonly additionalProperties: false;
    };
    readonly publication_status: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly publication_configure: {
        readonly type: "object";
        readonly properties: {
            readonly expectedVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly dockerContext: {
                readonly pattern: "^[A-Za-z0-9][A-Za-z0-9_.-]*$";
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly imageDigest: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["expectedVersion", "dockerContext", "imageDigest"];
        readonly additionalProperties: false;
    };
    readonly publication_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly revisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["revisionId"];
        readonly additionalProperties: false;
    };
    readonly publication_submit: {
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
    readonly publication_inspect: {
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
    readonly publication_cancel: {
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
    readonly publication_result: {
        readonly type: "object";
        readonly properties: {
            readonly resultId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["resultId"];
        readonly additionalProperties: false;
    };
    readonly publication_build_list: {
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
            readonly revisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ("revisionId" | "limit" | "cursor")[];
        readonly additionalProperties: false;
    };
};
export declare const PUBLICATION_OUTPUT_SCHEMAS: {
    readonly publication_page_image_read: {
        readonly type: "object";
        readonly properties: {
            readonly reference: {
                readonly type: "object";
                readonly properties: {
                    readonly actionId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly publicationResultId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly pageNumber: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly digest: {
                        readonly pattern: "^[a-f0-9]{64}$";
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly bytes: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly width: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly height: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: ("publicationResultId" | "actionId" | "pageNumber" | "digest" | "bytes" | "width" | "height")[];
                readonly additionalProperties: false;
            };
            readonly mimeType: {
                readonly const: "image/png";
            };
            readonly data: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: ("data" | "reference" | "mimeType")[];
        readonly additionalProperties: false;
    };
    readonly publication_review_prepare: {
        readonly type: "object";
        readonly properties: {
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
        readonly required: ("publicationResultId" | "digest" | "id" | "sourceDigest" | "teamId" | "taskId" | "status" | "approvalId" | "rootSessionId" | "revisionId" | "jobId" | "requiredEvidenceIds" | "validity" | "artifactIds" | "pdfDigest")[];
        readonly additionalProperties: false;
    };
    readonly publication_review_inspect: {
        readonly type: "object";
        readonly properties: {
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
        readonly required: ("publicationResultId" | "digest" | "id" | "sourceDigest" | "teamId" | "taskId" | "status" | "approvalId" | "rootSessionId" | "revisionId" | "jobId" | "requiredEvidenceIds" | "validity" | "artifactIds" | "pdfDigest")[];
        readonly additionalProperties: false;
    };
    readonly publication_review_list: {
        readonly maxItems?: number | undefined;
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
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
            readonly required: ("publicationResultId" | "digest" | "id" | "sourceDigest" | "teamId" | "taskId" | "status" | "approvalId" | "rootSessionId" | "revisionId" | "jobId" | "requiredEvidenceIds" | "validity" | "artifactIds" | "pdfDigest")[];
            readonly additionalProperties: false;
        };
        readonly minItems: number;
    };
    readonly publication_template_import: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly title: {
                readonly type: "string";
            };
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly type: "string";
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly contentDigest: {
                readonly type: "string";
            };
            readonly builtin: {
                readonly type: "boolean";
            };
            readonly files: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly type: "string";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly size: {
                            readonly type: "integer";
                        };
                        readonly mediaType: {
                            readonly type: "string";
                        };
                        readonly content: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("digest" | "path" | "size" | "mediaType")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("id" | "title" | "engine" | "bibliography" | "files" | "mainFile" | "contentDigest" | "builtin")[];
        readonly additionalProperties: false;
    };
    readonly publication_template_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly title: {
                readonly type: "string";
            };
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly type: "string";
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly contentDigest: {
                readonly type: "string";
            };
            readonly builtin: {
                readonly type: "boolean";
            };
            readonly files: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly type: "string";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly size: {
                            readonly type: "integer";
                        };
                        readonly mediaType: {
                            readonly type: "string";
                        };
                        readonly content: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("digest" | "path" | "size" | "mediaType")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("id" | "title" | "engine" | "bibliography" | "files" | "mainFile" | "contentDigest" | "builtin")[];
        readonly additionalProperties: false;
    };
    readonly publication_template_read: {
        readonly type: "object";
        readonly properties: {
            readonly path: {
                readonly type: "string";
            };
            readonly digest: {
                readonly type: "string";
            };
            readonly size: {
                readonly type: "integer";
            };
            readonly mediaType: {
                readonly type: "string";
            };
            readonly contentBase64: {
                readonly type: "string";
            };
            readonly content: {
                readonly type: "string";
            };
        };
        readonly required: ("digest" | "path" | "size" | "mediaType" | "contentBase64")[];
        readonly additionalProperties: false;
    };
    readonly publication_templates: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                };
                readonly title: {
                    readonly type: "string";
                };
                readonly engine: {
                    readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
                };
                readonly mainFile: {
                    readonly type: "string";
                };
                readonly bibliography: {
                    readonly enum: readonly ["auto", "none", "bibtex", "biber"];
                };
                readonly contentDigest: {
                    readonly type: "string";
                };
                readonly builtin: {
                    readonly type: "boolean";
                };
                readonly files: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly path: {
                                readonly type: "string";
                            };
                            readonly digest: {
                                readonly type: "string";
                            };
                            readonly size: {
                                readonly type: "integer";
                            };
                            readonly mediaType: {
                                readonly type: "string";
                            };
                            readonly content: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("digest" | "path" | "size" | "mediaType")[];
                        readonly additionalProperties: false;
                    };
                };
            };
            readonly required: ("id" | "title" | "engine" | "bibliography" | "files" | "mainFile" | "contentDigest" | "builtin")[];
            readonly additionalProperties: false;
        };
    };
    readonly manuscript_create: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "manuscript-revision";
            };
            readonly projectId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly version: {
                readonly type: "integer";
            };
            readonly createdAt: {
                readonly type: "string";
            };
            readonly updatedAt: {
                readonly type: "string";
            };
        } & {
            readonly title: {
                readonly type: "string";
            };
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly type: "string";
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly templateId: {
                readonly type: "string";
            };
            readonly rootSessionId: {
                readonly type: "string";
            };
            readonly previousRevisionId: {
                readonly type: "string";
            };
            readonly researchBrief: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly digest: {
                        readonly type: "string";
                    };
                    readonly revision: {
                        readonly type: "integer";
                    };
                    readonly rootSessionId: {
                        readonly type: "string";
                    };
                };
                readonly required: ("digest" | "id" | "revision" | "rootSessionId")[];
                readonly additionalProperties: false;
            };
            readonly evidenceIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly sourceDigest: {
                readonly type: "string";
            };
            readonly manifestArtifactId: {
                readonly type: "string";
            };
            readonly manifestArtifactDigest: {
                readonly type: "string";
            };
            readonly files: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly type: "string";
                        };
                        readonly artifactId: {
                            readonly type: "string";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly size: {
                            readonly type: "integer";
                        };
                        readonly mediaType: {
                            readonly type: "string";
                        };
                        readonly provenance: {
                            readonly type: "object";
                            readonly properties: {
                                readonly kind: {
                                    readonly enum: readonly ["unknown", "run", "sandbox-job"];
                                };
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly sourceDigest: {
                                    readonly type: "string";
                                };
                                readonly manifestDigest: {
                                    readonly type: "string";
                                };
                                readonly approvalId: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: "kind"[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("digest" | "path" | "size" | "artifactId" | "mediaType" | "provenance")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("version" | "id" | "createdAt" | "sourceDigest" | "title" | "kind" | "engine" | "bibliography" | "files" | "projectId" | "updatedAt" | "mainFile" | "manifestArtifactId" | "manifestArtifactDigest")[];
        readonly additionalProperties: false;
    };
    readonly manuscript_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "manuscript-revision";
            };
            readonly projectId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly version: {
                readonly type: "integer";
            };
            readonly createdAt: {
                readonly type: "string";
            };
            readonly updatedAt: {
                readonly type: "string";
            };
        } & {
            readonly title: {
                readonly type: "string";
            };
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly type: "string";
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly templateId: {
                readonly type: "string";
            };
            readonly rootSessionId: {
                readonly type: "string";
            };
            readonly previousRevisionId: {
                readonly type: "string";
            };
            readonly researchBrief: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly digest: {
                        readonly type: "string";
                    };
                    readonly revision: {
                        readonly type: "integer";
                    };
                    readonly rootSessionId: {
                        readonly type: "string";
                    };
                };
                readonly required: ("digest" | "id" | "revision" | "rootSessionId")[];
                readonly additionalProperties: false;
            };
            readonly evidenceIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly sourceDigest: {
                readonly type: "string";
            };
            readonly manifestArtifactId: {
                readonly type: "string";
            };
            readonly manifestArtifactDigest: {
                readonly type: "string";
            };
            readonly files: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly type: "string";
                        };
                        readonly artifactId: {
                            readonly type: "string";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly size: {
                            readonly type: "integer";
                        };
                        readonly mediaType: {
                            readonly type: "string";
                        };
                        readonly provenance: {
                            readonly type: "object";
                            readonly properties: {
                                readonly kind: {
                                    readonly enum: readonly ["unknown", "run", "sandbox-job"];
                                };
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly sourceDigest: {
                                    readonly type: "string";
                                };
                                readonly manifestDigest: {
                                    readonly type: "string";
                                };
                                readonly approvalId: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: "kind"[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("digest" | "path" | "size" | "artifactId" | "mediaType" | "provenance")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("version" | "id" | "createdAt" | "sourceDigest" | "title" | "kind" | "engine" | "bibliography" | "files" | "projectId" | "updatedAt" | "mainFile" | "manifestArtifactId" | "manifestArtifactDigest")[];
        readonly additionalProperties: false;
    };
    readonly manuscript_list: {
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
                        readonly kind: {
                            readonly const: "manuscript-revision";
                        };
                        readonly projectId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly version: {
                            readonly type: "integer";
                        };
                        readonly createdAt: {
                            readonly type: "string";
                        };
                        readonly updatedAt: {
                            readonly type: "string";
                        };
                    } & {
                        readonly title: {
                            readonly type: "string";
                        };
                        readonly engine: {
                            readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
                        };
                        readonly mainFile: {
                            readonly type: "string";
                        };
                        readonly bibliography: {
                            readonly enum: readonly ["auto", "none", "bibtex", "biber"];
                        };
                        readonly templateId: {
                            readonly type: "string";
                        };
                        readonly rootSessionId: {
                            readonly type: "string";
                        };
                        readonly previousRevisionId: {
                            readonly type: "string";
                        };
                        readonly researchBrief: {
                            readonly type: "object";
                            readonly properties: {
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                                readonly revision: {
                                    readonly type: "integer";
                                };
                                readonly rootSessionId: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("digest" | "id" | "revision" | "rootSessionId")[];
                            readonly additionalProperties: false;
                        };
                        readonly evidenceIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly sourceDigest: {
                            readonly type: "string";
                        };
                        readonly manifestArtifactId: {
                            readonly type: "string";
                        };
                        readonly manifestArtifactDigest: {
                            readonly type: "string";
                        };
                        readonly files: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly path: {
                                        readonly type: "string";
                                    };
                                    readonly artifactId: {
                                        readonly type: "string";
                                    };
                                    readonly digest: {
                                        readonly type: "string";
                                    };
                                    readonly size: {
                                        readonly type: "integer";
                                    };
                                    readonly mediaType: {
                                        readonly type: "string";
                                    };
                                    readonly provenance: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly kind: {
                                                readonly enum: readonly ["unknown", "run", "sandbox-job"];
                                            };
                                            readonly id: {
                                                readonly type: "string";
                                            };
                                            readonly sourceDigest: {
                                                readonly type: "string";
                                            };
                                            readonly manifestDigest: {
                                                readonly type: "string";
                                            };
                                            readonly approvalId: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: "kind"[];
                                        readonly additionalProperties: false;
                                    };
                                };
                                readonly required: ("digest" | "path" | "size" | "artifactId" | "mediaType" | "provenance")[];
                                readonly additionalProperties: false;
                            };
                        };
                    };
                    readonly required: ("version" | "id" | "createdAt" | "sourceDigest" | "title" | "kind" | "engine" | "bibliography" | "files" | "projectId" | "updatedAt" | "mainFile" | "manifestArtifactId" | "manifestArtifactDigest")[];
                    readonly additionalProperties: false;
                };
            };
            readonly nextCursor: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: ("nextCursor" | "items")[];
        readonly additionalProperties: false;
    };
    readonly manuscript_source_read: {
        readonly type: "object";
        readonly properties: {
            readonly path: {
                readonly type: "string";
            };
            readonly content: {
                readonly type: "string";
            };
            readonly digest: {
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
        readonly required: ("digest" | "path" | "complete" | "content" | "end" | "cursor" | "mediaType")[];
        readonly additionalProperties: false;
    };
    readonly publication_status: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly configured: {
                readonly type: "boolean";
            };
            readonly profileId: {
                readonly const: "latex-document-v1";
            };
            readonly limits: {
                readonly type: "object";
                readonly properties: {
                    readonly cpus: {
                        readonly type: "number";
                    };
                    readonly memoryMb: {
                        readonly type: "integer";
                    };
                    readonly pids: {
                        readonly type: "integer";
                    };
                    readonly timeoutSeconds: {
                        readonly type: "integer";
                    };
                    readonly workMb: {
                        readonly type: "integer";
                    };
                    readonly logBytes: {
                        readonly type: "integer";
                    };
                    readonly outputBytes: {
                        readonly type: "integer";
                    };
                    readonly maxFiles: {
                        readonly type: "integer";
                    };
                    readonly maxSourceBytes: {
                        readonly type: "integer";
                    };
                    readonly maxPages: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("cpus" | "memoryMb" | "pids" | "timeoutSeconds" | "workMb" | "outputBytes" | "logBytes" | "maxFiles" | "maxSourceBytes" | "maxPages")[];
                readonly additionalProperties: false;
            };
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly profileId: {
                        readonly const: "latex-document-v1";
                    };
                    readonly lockDigest: {
                        readonly type: "string";
                    };
                    readonly scriptDigest: {
                        readonly type: "string";
                    };
                    readonly dockerfileDigest: {
                        readonly type: "string";
                    };
                    readonly profileDigest: {
                        readonly type: "string";
                    };
                    readonly dockerContext: {
                        readonly type: "string";
                    };
                    readonly imageDigest: {
                        readonly type: "string";
                    };
                    readonly imageId: {
                        readonly type: "string";
                    };
                };
                readonly required: ("profileId" | "dockerContext" | "imageDigest" | "imageId" | "profileDigest" | "lockDigest" | "scriptDigest" | "dockerfileDigest")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("version" | "profileId" | "limits" | "configured")[];
        readonly additionalProperties: false;
    };
    readonly publication_configure: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly configured: {
                readonly type: "boolean";
            };
            readonly profileId: {
                readonly const: "latex-document-v1";
            };
            readonly limits: {
                readonly type: "object";
                readonly properties: {
                    readonly cpus: {
                        readonly type: "number";
                    };
                    readonly memoryMb: {
                        readonly type: "integer";
                    };
                    readonly pids: {
                        readonly type: "integer";
                    };
                    readonly timeoutSeconds: {
                        readonly type: "integer";
                    };
                    readonly workMb: {
                        readonly type: "integer";
                    };
                    readonly logBytes: {
                        readonly type: "integer";
                    };
                    readonly outputBytes: {
                        readonly type: "integer";
                    };
                    readonly maxFiles: {
                        readonly type: "integer";
                    };
                    readonly maxSourceBytes: {
                        readonly type: "integer";
                    };
                    readonly maxPages: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("cpus" | "memoryMb" | "pids" | "timeoutSeconds" | "workMb" | "outputBytes" | "logBytes" | "maxFiles" | "maxSourceBytes" | "maxPages")[];
                readonly additionalProperties: false;
            };
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly profileId: {
                        readonly const: "latex-document-v1";
                    };
                    readonly lockDigest: {
                        readonly type: "string";
                    };
                    readonly scriptDigest: {
                        readonly type: "string";
                    };
                    readonly dockerfileDigest: {
                        readonly type: "string";
                    };
                    readonly profileDigest: {
                        readonly type: "string";
                    };
                    readonly dockerContext: {
                        readonly type: "string";
                    };
                    readonly imageDigest: {
                        readonly type: "string";
                    };
                    readonly imageId: {
                        readonly type: "string";
                    };
                };
                readonly required: ("profileId" | "dockerContext" | "imageDigest" | "imageId" | "profileDigest" | "lockDigest" | "scriptDigest" | "dockerfileDigest")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("version" | "profileId" | "limits" | "configured")[];
        readonly additionalProperties: false;
    };
    readonly publication_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly type: "string";
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly imageDigest: {
                readonly type: "string";
            };
            readonly dockerContext: {
                readonly type: "string";
            };
            readonly resources: {
                readonly type: "object";
                readonly properties: {
                    readonly cpus: {
                        readonly type: "number";
                    };
                    readonly memoryMb: {
                        readonly type: "integer";
                    };
                    readonly pids: {
                        readonly type: "integer";
                    };
                    readonly timeoutSeconds: {
                        readonly type: "integer";
                    };
                    readonly workMb: {
                        readonly type: "integer";
                    };
                    readonly logBytes: {
                        readonly type: "integer";
                    };
                    readonly outputBytes: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("cpus" | "memoryMb" | "pids" | "timeoutSeconds" | "workMb" | "outputBytes" | "logBytes")[];
                readonly additionalProperties: false;
            };
            readonly generation: {
                readonly type: "integer";
            };
            readonly startRequested: {
                readonly type: "boolean";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly exitCode: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                }, {
                    readonly type: "null";
                }];
            };
            readonly artifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly imageId: {
                readonly type: "string";
            };
            readonly resultId: {
                readonly type: "string";
            };
            readonly error: {
                readonly type: "string";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly profileId: {
                readonly const: "latex-document-v1";
            };
            readonly lockDigest: {
                readonly type: "string";
            };
            readonly scriptDigest: {
                readonly type: "string";
            };
            readonly dockerfileDigest: {
                readonly type: "string";
            };
            readonly profileDigest: {
                readonly type: "string";
            };
            readonly id: {
                readonly type: "string";
            };
            readonly jobId: {
                readonly type: "string";
            };
            readonly revisionId: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly state: {
                readonly enum: readonly ["prepared", "queued", "starting", "running", "unknown", "succeeded", "failed", "cancelled", "timed_out"];
            };
            readonly integrity: {
                readonly enum: readonly ["pending", "complete", "incomplete", "invalid"];
            };
            readonly manifestDigest: {
                readonly type: "string";
            };
            readonly sourceDigest: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "generation" | "exitCode" | "sourceDigest" | "approvalId" | "profileId" | "engine" | "bibliography" | "manifestDigest" | "revisionId" | "dockerContext" | "resources" | "jobId" | "imageDigest" | "artifactIds" | "mainFile" | "profileDigest" | "integrity" | "startRequested" | "cancelRequested" | "lockDigest" | "scriptDigest" | "dockerfileDigest")[];
        readonly additionalProperties: false;
    };
    readonly publication_submit: {
        readonly type: "object";
        readonly properties: {
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly type: "string";
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly imageDigest: {
                readonly type: "string";
            };
            readonly dockerContext: {
                readonly type: "string";
            };
            readonly resources: {
                readonly type: "object";
                readonly properties: {
                    readonly cpus: {
                        readonly type: "number";
                    };
                    readonly memoryMb: {
                        readonly type: "integer";
                    };
                    readonly pids: {
                        readonly type: "integer";
                    };
                    readonly timeoutSeconds: {
                        readonly type: "integer";
                    };
                    readonly workMb: {
                        readonly type: "integer";
                    };
                    readonly logBytes: {
                        readonly type: "integer";
                    };
                    readonly outputBytes: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("cpus" | "memoryMb" | "pids" | "timeoutSeconds" | "workMb" | "outputBytes" | "logBytes")[];
                readonly additionalProperties: false;
            };
            readonly generation: {
                readonly type: "integer";
            };
            readonly startRequested: {
                readonly type: "boolean";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly exitCode: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                }, {
                    readonly type: "null";
                }];
            };
            readonly artifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly imageId: {
                readonly type: "string";
            };
            readonly resultId: {
                readonly type: "string";
            };
            readonly error: {
                readonly type: "string";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly profileId: {
                readonly const: "latex-document-v1";
            };
            readonly lockDigest: {
                readonly type: "string";
            };
            readonly scriptDigest: {
                readonly type: "string";
            };
            readonly dockerfileDigest: {
                readonly type: "string";
            };
            readonly profileDigest: {
                readonly type: "string";
            };
            readonly id: {
                readonly type: "string";
            };
            readonly jobId: {
                readonly type: "string";
            };
            readonly revisionId: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly state: {
                readonly enum: readonly ["prepared", "queued", "starting", "running", "unknown", "succeeded", "failed", "cancelled", "timed_out"];
            };
            readonly integrity: {
                readonly enum: readonly ["pending", "complete", "incomplete", "invalid"];
            };
            readonly manifestDigest: {
                readonly type: "string";
            };
            readonly sourceDigest: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "generation" | "exitCode" | "sourceDigest" | "approvalId" | "profileId" | "engine" | "bibliography" | "manifestDigest" | "revisionId" | "dockerContext" | "resources" | "jobId" | "imageDigest" | "artifactIds" | "mainFile" | "profileDigest" | "integrity" | "startRequested" | "cancelRequested" | "lockDigest" | "scriptDigest" | "dockerfileDigest")[];
        readonly additionalProperties: false;
    };
    readonly publication_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly type: "string";
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly imageDigest: {
                readonly type: "string";
            };
            readonly dockerContext: {
                readonly type: "string";
            };
            readonly resources: {
                readonly type: "object";
                readonly properties: {
                    readonly cpus: {
                        readonly type: "number";
                    };
                    readonly memoryMb: {
                        readonly type: "integer";
                    };
                    readonly pids: {
                        readonly type: "integer";
                    };
                    readonly timeoutSeconds: {
                        readonly type: "integer";
                    };
                    readonly workMb: {
                        readonly type: "integer";
                    };
                    readonly logBytes: {
                        readonly type: "integer";
                    };
                    readonly outputBytes: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("cpus" | "memoryMb" | "pids" | "timeoutSeconds" | "workMb" | "outputBytes" | "logBytes")[];
                readonly additionalProperties: false;
            };
            readonly generation: {
                readonly type: "integer";
            };
            readonly startRequested: {
                readonly type: "boolean";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly exitCode: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                }, {
                    readonly type: "null";
                }];
            };
            readonly artifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly imageId: {
                readonly type: "string";
            };
            readonly resultId: {
                readonly type: "string";
            };
            readonly error: {
                readonly type: "string";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly profileId: {
                readonly const: "latex-document-v1";
            };
            readonly lockDigest: {
                readonly type: "string";
            };
            readonly scriptDigest: {
                readonly type: "string";
            };
            readonly dockerfileDigest: {
                readonly type: "string";
            };
            readonly profileDigest: {
                readonly type: "string";
            };
            readonly id: {
                readonly type: "string";
            };
            readonly jobId: {
                readonly type: "string";
            };
            readonly revisionId: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly state: {
                readonly enum: readonly ["prepared", "queued", "starting", "running", "unknown", "succeeded", "failed", "cancelled", "timed_out"];
            };
            readonly integrity: {
                readonly enum: readonly ["pending", "complete", "incomplete", "invalid"];
            };
            readonly manifestDigest: {
                readonly type: "string";
            };
            readonly sourceDigest: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "generation" | "exitCode" | "sourceDigest" | "approvalId" | "profileId" | "engine" | "bibliography" | "manifestDigest" | "revisionId" | "dockerContext" | "resources" | "jobId" | "imageDigest" | "artifactIds" | "mainFile" | "profileDigest" | "integrity" | "startRequested" | "cancelRequested" | "lockDigest" | "scriptDigest" | "dockerfileDigest")[];
        readonly additionalProperties: false;
    };
    readonly publication_cancel: {
        readonly type: "object";
        readonly properties: {
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly mainFile: {
                readonly type: "string";
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly imageDigest: {
                readonly type: "string";
            };
            readonly dockerContext: {
                readonly type: "string";
            };
            readonly resources: {
                readonly type: "object";
                readonly properties: {
                    readonly cpus: {
                        readonly type: "number";
                    };
                    readonly memoryMb: {
                        readonly type: "integer";
                    };
                    readonly pids: {
                        readonly type: "integer";
                    };
                    readonly timeoutSeconds: {
                        readonly type: "integer";
                    };
                    readonly workMb: {
                        readonly type: "integer";
                    };
                    readonly logBytes: {
                        readonly type: "integer";
                    };
                    readonly outputBytes: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("cpus" | "memoryMb" | "pids" | "timeoutSeconds" | "workMb" | "outputBytes" | "logBytes")[];
                readonly additionalProperties: false;
            };
            readonly generation: {
                readonly type: "integer";
            };
            readonly startRequested: {
                readonly type: "boolean";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly exitCode: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                }, {
                    readonly type: "null";
                }];
            };
            readonly artifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly imageId: {
                readonly type: "string";
            };
            readonly resultId: {
                readonly type: "string";
            };
            readonly error: {
                readonly type: "string";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly profileId: {
                readonly const: "latex-document-v1";
            };
            readonly lockDigest: {
                readonly type: "string";
            };
            readonly scriptDigest: {
                readonly type: "string";
            };
            readonly dockerfileDigest: {
                readonly type: "string";
            };
            readonly profileDigest: {
                readonly type: "string";
            };
            readonly id: {
                readonly type: "string";
            };
            readonly jobId: {
                readonly type: "string";
            };
            readonly revisionId: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly state: {
                readonly enum: readonly ["prepared", "queued", "starting", "running", "unknown", "succeeded", "failed", "cancelled", "timed_out"];
            };
            readonly integrity: {
                readonly enum: readonly ["pending", "complete", "incomplete", "invalid"];
            };
            readonly manifestDigest: {
                readonly type: "string";
            };
            readonly sourceDigest: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "generation" | "exitCode" | "sourceDigest" | "approvalId" | "profileId" | "engine" | "bibliography" | "manifestDigest" | "revisionId" | "dockerContext" | "resources" | "jobId" | "imageDigest" | "artifactIds" | "mainFile" | "profileDigest" | "integrity" | "startRequested" | "cancelRequested" | "lockDigest" | "scriptDigest" | "dockerfileDigest")[];
        readonly additionalProperties: false;
    };
    readonly publication_result: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "publication-build-result";
            };
            readonly projectId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly version: {
                readonly type: "integer";
            };
            readonly createdAt: {
                readonly type: "string";
            };
            readonly updatedAt: {
                readonly type: "string";
            };
        } & {
            readonly revisionId: {
                readonly type: "string";
            };
            readonly jobId: {
                readonly type: "string";
            };
            readonly sourceDigest: {
                readonly type: "string";
            };
            readonly manifestDigest: {
                readonly type: "string";
            };
            readonly imageId: {
                readonly type: "string";
            };
            readonly manifestArtifactId: {
                readonly type: "string";
            };
            readonly manifestArtifactDigest: {
                readonly type: "string";
            };
            readonly engine: {
                readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
            };
            readonly bibliography: {
                readonly enum: readonly ["auto", "none", "bibtex", "biber"];
            };
            readonly engineVersion: {
                readonly type: "string";
            };
            readonly status: {
                readonly enum: readonly ["succeeded", "failed", "timed_out", "non_convergent"];
            };
            readonly hadErrors: {
                readonly type: "boolean";
            };
            readonly converged: {
                readonly type: "boolean";
            };
            readonly passes: {
                readonly type: "integer";
            };
            readonly diagnostics: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly severity: {
                            readonly enum: readonly ["error", "warning"];
                        };
                        readonly code: {
                            readonly type: "string";
                        };
                        readonly message: {
                            readonly type: "string";
                        };
                        readonly file: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly line: {
                            readonly anyOf: readonly [{
                                readonly type: "integer";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly pass: {
                            readonly anyOf: readonly [{
                                readonly type: "integer";
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: ("file" | "message" | "code" | "severity" | "line" | "pass")[];
                    readonly additionalProperties: false;
                };
            };
            readonly pdf: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly pages: {
                            readonly type: "integer";
                        };
                        readonly artifactId: {
                            readonly type: "string";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly bytes: {
                            readonly type: "integer";
                        };
                    };
                    readonly required: ("digest" | "bytes" | "artifactId" | "pages")[];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "null";
                }];
            };
            readonly previews: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly pageNumber: {
                            readonly type: "integer";
                        };
                        readonly width: {
                            readonly type: "integer";
                        };
                        readonly height: {
                            readonly type: "integer";
                        };
                        readonly artifactId: {
                            readonly type: "string";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly bytes: {
                            readonly type: "integer";
                        };
                    };
                    readonly required: ("pageNumber" | "digest" | "bytes" | "width" | "height" | "artifactId")[];
                    readonly additionalProperties: false;
                };
            };
            readonly logs: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        artifactId: {
                            readonly type: "string";
                        };
                        digest: {
                            readonly type: "string";
                        };
                        bytes: {
                            readonly type: "integer";
                        };
                    };
                    readonly required: ("digest" | "bytes" | "artifactId")[];
                    readonly additionalProperties: false;
                };
            };
            readonly sourceValidity: {
                readonly enum: readonly ["current", "stale"];
            };
            readonly sourceError: {
                readonly type: "string";
            };
            readonly profileId: {
                readonly const: "latex-document-v1";
            };
            readonly lockDigest: {
                readonly type: "string";
            };
            readonly scriptDigest: {
                readonly type: "string";
            };
            readonly dockerfileDigest: {
                readonly type: "string";
            };
            readonly profileDigest: {
                readonly type: "string";
            };
            readonly formatVersion: {
                readonly const: 1;
            };
        };
        readonly required: ("version" | "id" | "createdAt" | "sourceDigest" | "kind" | "logs" | "diagnostics" | "status" | "pdf" | "previews" | "formatVersion" | "profileId" | "engine" | "bibliography" | "engineVersion" | "hadErrors" | "converged" | "passes" | "manifestDigest" | "revisionId" | "projectId" | "updatedAt" | "jobId" | "imageId" | "profileDigest" | "manifestArtifactId" | "manifestArtifactDigest" | "sourceValidity")[];
        readonly additionalProperties: false;
    };
    readonly publication_build_list: {
        readonly type: "object";
        readonly properties: {
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly engine: {
                            readonly enum: readonly ["pdflatex", "xelatex", "lualatex"];
                        };
                        readonly mainFile: {
                            readonly type: "string";
                        };
                        readonly bibliography: {
                            readonly enum: readonly ["auto", "none", "bibtex", "biber"];
                        };
                        readonly imageDigest: {
                            readonly type: "string";
                        };
                        readonly dockerContext: {
                            readonly type: "string";
                        };
                        readonly resources: {
                            readonly type: "object";
                            readonly properties: {
                                readonly cpus: {
                                    readonly type: "number";
                                };
                                readonly memoryMb: {
                                    readonly type: "integer";
                                };
                                readonly pids: {
                                    readonly type: "integer";
                                };
                                readonly timeoutSeconds: {
                                    readonly type: "integer";
                                };
                                readonly workMb: {
                                    readonly type: "integer";
                                };
                                readonly logBytes: {
                                    readonly type: "integer";
                                };
                                readonly outputBytes: {
                                    readonly type: "integer";
                                };
                            };
                            readonly required: ("cpus" | "memoryMb" | "pids" | "timeoutSeconds" | "workMb" | "outputBytes" | "logBytes")[];
                            readonly additionalProperties: false;
                        };
                        readonly generation: {
                            readonly type: "integer";
                        };
                        readonly startRequested: {
                            readonly type: "boolean";
                        };
                        readonly cancelRequested: {
                            readonly type: "boolean";
                        };
                        readonly exitCode: {
                            readonly anyOf: readonly [{
                                readonly type: "integer";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly artifactIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly imageId: {
                            readonly type: "string";
                        };
                        readonly resultId: {
                            readonly type: "string";
                        };
                        readonly error: {
                            readonly type: "string";
                        };
                        readonly startedAt: {
                            readonly type: "string";
                        };
                        readonly endedAt: {
                            readonly type: "string";
                        };
                        readonly profileId: {
                            readonly const: "latex-document-v1";
                        };
                        readonly lockDigest: {
                            readonly type: "string";
                        };
                        readonly scriptDigest: {
                            readonly type: "string";
                        };
                        readonly dockerfileDigest: {
                            readonly type: "string";
                        };
                        readonly profileDigest: {
                            readonly type: "string";
                        };
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly jobId: {
                            readonly type: "string";
                        };
                        readonly revisionId: {
                            readonly type: "string";
                        };
                        readonly approvalId: {
                            readonly type: "string";
                        };
                        readonly state: {
                            readonly enum: readonly ["prepared", "queued", "starting", "running", "unknown", "succeeded", "failed", "cancelled", "timed_out"];
                        };
                        readonly integrity: {
                            readonly enum: readonly ["pending", "complete", "incomplete", "invalid"];
                        };
                        readonly manifestDigest: {
                            readonly type: "string";
                        };
                        readonly sourceDigest: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("id" | "state" | "generation" | "exitCode" | "sourceDigest" | "approvalId" | "profileId" | "engine" | "bibliography" | "manifestDigest" | "revisionId" | "dockerContext" | "resources" | "jobId" | "imageDigest" | "artifactIds" | "mainFile" | "profileDigest" | "integrity" | "startRequested" | "cancelRequested" | "lockDigest" | "scriptDigest" | "dockerfileDigest")[];
                    readonly additionalProperties: false;
                };
            };
            readonly nextCursor: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: ("nextCursor" | "items")[];
        readonly additionalProperties: false;
    };
};
