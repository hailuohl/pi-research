export declare const DISCOVERY_GRANT_REFERENCE_SCHEMA: {
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
            readonly minLength: 64;
            readonly pattern: "^[a-f0-9]{64}$";
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly maxLength: number;
        };
        readonly approvalId: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
    };
    readonly required: readonly ["id", "digest", "approvalId"];
    readonly additionalProperties: false;
};
export declare const DISCOVERY_INPUT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly query: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly sources: {
            readonly anyOf: readonly [{
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                };
                readonly minItems: number;
            }, {
                readonly type: "null";
            }];
        };
        readonly limit: {
            readonly anyOf: readonly [{
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            }, {
                readonly type: "null";
            }];
        };
        readonly strategy: {
            readonly anyOf: readonly [{
                readonly enum: readonly ["keyword", "embedding"];
            }, {
                readonly type: "null";
            }];
        };
        readonly prioritize: {
            readonly anyOf: readonly [{
                readonly enum: readonly ["default", "recency", "historical", "popular"];
            }, {
                readonly type: "null";
            }];
        };
        readonly publishedAfter: {
            readonly format: "date";
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly publishedBefore: {
            readonly format: "date";
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
    };
    readonly required: readonly ["query"];
    readonly additionalProperties: false;
};
export declare const DISCOVERY_OUTPUT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly id: {
            readonly type: "string";
        };
        readonly kind: {
            readonly const: "connector-search";
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
        readonly query: {
            readonly type: "string";
        };
        readonly settingsVersion: {
            readonly type: "integer";
        };
        readonly scopeSessionId: {
            readonly anyOf: readonly [{
                readonly type: "string";
            }, {
                readonly type: "null";
            }];
        };
        readonly scopeTaskId: {
            readonly anyOf: readonly [{
                readonly type: "string";
            }, {
                readonly type: "null";
            }];
        };
        readonly scopeAttemptId: {
            readonly anyOf: readonly [{
                readonly type: "string";
            }, {
                readonly type: "null";
            }];
        };
        readonly request: {
            readonly type: "object";
            readonly properties: {
                readonly query: {
                    readonly type: "string";
                };
                readonly sources: {
                    readonly type: "array";
                    readonly items: {
                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                    };
                };
                readonly limit: {
                    readonly type: "integer";
                };
                readonly strategy: {
                    readonly enum: readonly ["keyword", "embedding"];
                };
                readonly prioritize: {
                    readonly enum: readonly ["default", "recency", "historical", "popular"];
                };
                readonly publishedAfter: {
                    readonly type: "string";
                };
                readonly publishedBefore: {
                    readonly type: "string";
                };
            };
            readonly required: ("sources" | "query" | "limit" | "strategy" | "prioritize")[];
            readonly additionalProperties: false;
        };
        readonly page: {
            readonly type: "object";
            readonly properties: {
                readonly nextCursor: {
                    readonly anyOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                };
                readonly nextCursorExpiresAt: {
                    readonly anyOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                };
                readonly rawItemCount: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly number: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly previousSearchId: {
                    readonly anyOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                };
                readonly cursor: {
                    readonly type: "string";
                };
                readonly expiresAt: {
                    readonly anyOf: readonly [{
                        readonly type: "string";
                    }, {
                        readonly type: "null";
                    }];
                };
            };
            readonly required: ("number" | "expiresAt" | "cursor" | "previousSearchId" | "nextCursor" | "nextCursorExpiresAt" | "rawItemCount")[];
            readonly additionalProperties: false;
        };
        readonly items: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly source: {
                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                    };
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly title: {
                        readonly type: "string";
                    };
                    readonly abstract: {
                        readonly type: "string";
                    };
                    readonly publicationDate: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly doi: {
                        readonly type: "string";
                    };
                    readonly url: {
                        readonly type: "string";
                    };
                    readonly citations: {
                        readonly type: "number";
                    };
                    readonly votes: {
                        readonly type: "number";
                    };
                    readonly snippets: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly text: {
                                    readonly type: "string";
                                };
                                readonly reportedPage: {
                                    readonly anyOf: readonly [{
                                        readonly type: "number";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("text" | "reportedPage")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly contentKind: {
                        readonly const: "metadata";
                    };
                    readonly fullTextRead: {
                        readonly const: false;
                    };
                    readonly duplicates: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly source: {
                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                };
                                readonly id: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("source" | "id")[];
                            readonly additionalProperties: false;
                        };
                    };
                };
                readonly required: ("abstract" | "source" | "duplicates" | "id" | "title" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
                readonly additionalProperties: false;
            };
        };
        readonly sources: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly source: {
                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                    };
                    readonly status: {
                        readonly enum: readonly ["succeeded", "failed", "disabled"];
                    };
                    readonly count: {
                        readonly type: "integer";
                    };
                    readonly error: {
                        readonly type: "string";
                    };
                };
                readonly required: ("source" | "status" | "count")[];
                readonly additionalProperties: false;
            };
        };
        readonly status: {
            readonly enum: readonly ["complete", "partial"];
        };
        readonly retrievedAt: {
            readonly type: "string";
        };
        readonly coverage: {
            readonly type: "string";
        };
        readonly discoveryGrant: {
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
                    readonly minLength: 64;
                    readonly pattern: "^[a-f0-9]{64}$";
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly maxLength: number;
                };
                readonly approvalId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["id", "digest", "approvalId"];
            readonly additionalProperties: false;
        };
        readonly discoveryCallIds: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly discoveryRequestDigest: {
            readonly type: "string";
        };
    };
    readonly required: ("sources" | "query" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "settingsVersion" | "status" | "retrievedAt" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "items" | "request" | "coverage")[];
    readonly additionalProperties: false;
};
export declare const DOCUMENT_EVIDENCE_LINK_SCHEMA: {
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
    };
    readonly required: ("textArtifactDigest" | "pageNumber" | "documentVersionId" | "rawDigest" | "parseResultId")[];
    readonly additionalProperties: false;
};
export declare const DOCUMENT_INPUT_SCHEMAS: {
    readonly literature_task_create: {
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly kind: {
                    readonly const: "search";
                };
                readonly search: {
                    readonly type: "object";
                    readonly properties: {
                        readonly query: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly sources: {
                            readonly anyOf: readonly [{
                                readonly maxItems?: number | undefined;
                                readonly type: "array";
                                readonly items: {
                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                };
                                readonly minItems: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly limit: {
                            readonly anyOf: readonly [{
                                readonly type: "integer";
                                readonly minimum: number;
                                readonly maximum: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly strategy: {
                            readonly anyOf: readonly [{
                                readonly enum: readonly ["keyword", "embedding"];
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly prioritize: {
                            readonly anyOf: readonly [{
                                readonly enum: readonly ["default", "recency", "historical", "popular"];
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly publishedAfter: {
                            readonly format: "date";
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly publishedBefore: {
                            readonly format: "date";
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["query"];
                    readonly additionalProperties: false;
                };
                readonly discoveryGrantId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["kind", "search"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
                readonly kind: {
                    readonly const: "search";
                };
                readonly previousSearchId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["kind", "previousSearchId"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
                readonly kind: {
                    readonly const: "retrieve";
                };
                readonly target: {
                    readonly type: "object";
                    readonly properties: {
                        readonly source: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly id: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly format: {
                            readonly enum: readonly ["provider-text", "original-pdf"];
                        };
                        readonly requestedVersion: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["source", "id", "format"];
                    readonly additionalProperties: false;
                };
                readonly discoveryGrantId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["kind", "target"];
            readonly additionalProperties: false;
        }];
    };
    readonly literature_task_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly taskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["taskId"];
        readonly additionalProperties: false;
    };
    readonly literature_task_cancel: {
        readonly type: "object";
        readonly properties: {
            readonly taskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["taskId"];
        readonly additionalProperties: false;
    };
    readonly literature_task_retry: {
        readonly type: "object";
        readonly properties: {
            readonly taskId: {
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
        };
        readonly required: readonly ["taskId", "expectedVersion"];
        readonly additionalProperties: false;
    };
    readonly document_import: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly mediaType: {
                readonly enum: readonly ["application/pdf", "text/plain", "text/markdown"];
            };
            readonly contentBase64: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly license: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["title", "mediaType", "contentBase64"];
        readonly additionalProperties: false;
    };
    readonly document_list: {
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
    readonly document_inspect: {
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
    readonly document_parser_status: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly document_parser_configure: {
        readonly type: "object";
        readonly properties: {
            readonly expectedVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly dockerContext: {
                readonly pattern: "^[A-Za-z0-9][A-Za-z0-9._-]*$";
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
    readonly document_parse_prepare: {
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
    readonly document_parse_submit: {
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
    readonly document_parse_inspect: {
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
    readonly document_parse_cancel: {
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
    readonly document_pages: {
        readonly type: "object";
        readonly properties: {
            readonly parseResultId: {
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
        readonly required: readonly ["parseResultId"];
        readonly additionalProperties: false;
    };
    readonly document_page_read: {
        readonly type: "object";
        readonly properties: {
            readonly parseResultId: {
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
        readonly required: readonly ["parseResultId", "pageNumber"];
        readonly additionalProperties: false;
    };
    readonly document_evidence_register: {
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
            readonly pageNumber: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
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
            readonly description: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["documentVersionId", "parseResultId", "pageNumber", "start", "end", "description"];
        readonly additionalProperties: false;
    };
};
export declare const DOCUMENT_OUTPUT_SCHEMAS: {
    readonly literature_task_create: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "literature-task";
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
            readonly kindOfTask: {
                readonly enum: readonly ["search", "retrieve"];
            };
            readonly request: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "search";
                        };
                        readonly search: {
                            readonly type: "object";
                            readonly properties: {
                                readonly query: {
                                    readonly type: "string";
                                };
                                readonly sources: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                };
                                readonly limit: {
                                    readonly type: "integer";
                                };
                                readonly strategy: {
                                    readonly enum: readonly ["keyword", "embedding"];
                                };
                                readonly prioritize: {
                                    readonly enum: readonly ["default", "recency", "historical", "popular"];
                                };
                                readonly publishedAfter: {
                                    readonly type: "string";
                                };
                                readonly publishedBefore: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("sources" | "query" | "limit" | "strategy" | "prioritize")[];
                            readonly additionalProperties: false;
                        };
                        readonly pageRequest: {
                            readonly type: "object";
                            readonly properties: {
                                readonly number: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly previousSearchId: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly cursor: {
                                    readonly type: "string";
                                };
                                readonly expiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("number" | "expiresAt" | "cursor" | "previousSearchId")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("search" | "kind")[];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "retrieve";
                        };
                        readonly target: {
                            readonly type: "object";
                            readonly properties: {
                                readonly source: {
                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                };
                                readonly id: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly format: {
                                    readonly enum: readonly ["provider-text", "original-pdf"];
                                };
                                readonly requestedVersion: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["source", "id", "format"];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("kind" | "target")[];
                    readonly additionalProperties: false;
                }];
            };
            readonly state: {
                readonly enum: readonly ["queued", "running", "succeeded", "partial", "failed", "cancelled", "interrupted"];
            };
            readonly phase: {
                readonly enum: readonly ["queued", "requesting", "publishing", "done"];
            };
            readonly settingsVersion: {
                readonly type: "integer";
            };
            readonly generation: {
                readonly type: "integer";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly resultSearchId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
                readonly type: "string";
            };
            readonly error: {
                readonly type: "object";
                readonly properties: {
                    readonly code: {
                        readonly type: "string";
                    };
                    readonly message: {
                        readonly type: "string";
                    };
                };
                readonly required: ("code" | "message")[];
                readonly additionalProperties: false;
            };
            readonly previousTaskId: {
                readonly type: "string";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly searchResult: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "connector-search";
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
                        readonly query: {
                            readonly type: "string";
                        };
                        readonly settingsVersion: {
                            readonly type: "integer";
                        };
                        readonly scopeSessionId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeTaskId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeAttemptId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly request: {
                            readonly type: "object";
                            readonly properties: {
                                readonly query: {
                                    readonly type: "string";
                                };
                                readonly sources: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                };
                                readonly limit: {
                                    readonly type: "integer";
                                };
                                readonly strategy: {
                                    readonly enum: readonly ["keyword", "embedding"];
                                };
                                readonly prioritize: {
                                    readonly enum: readonly ["default", "recency", "historical", "popular"];
                                };
                                readonly publishedAfter: {
                                    readonly type: "string";
                                };
                                readonly publishedBefore: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("sources" | "query" | "limit" | "strategy" | "prioritize")[];
                            readonly additionalProperties: false;
                        };
                        readonly page: {
                            readonly type: "object";
                            readonly properties: {
                                readonly nextCursor: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly nextCursorExpiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly rawItemCount: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly number: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly previousSearchId: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly cursor: {
                                    readonly type: "string";
                                };
                                readonly expiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("number" | "expiresAt" | "cursor" | "previousSearchId" | "nextCursor" | "nextCursorExpiresAt" | "rawItemCount")[];
                            readonly additionalProperties: false;
                        };
                        readonly items: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly source: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly title: {
                                        readonly type: "string";
                                    };
                                    readonly abstract: {
                                        readonly type: "string";
                                    };
                                    readonly publicationDate: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly doi: {
                                        readonly type: "string";
                                    };
                                    readonly url: {
                                        readonly type: "string";
                                    };
                                    readonly citations: {
                                        readonly type: "number";
                                    };
                                    readonly votes: {
                                        readonly type: "number";
                                    };
                                    readonly snippets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly text: {
                                                    readonly type: "string";
                                                };
                                                readonly reportedPage: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "number";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                            };
                                            readonly required: ("text" | "reportedPage")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                    readonly contentKind: {
                                        readonly const: "metadata";
                                    };
                                    readonly fullTextRead: {
                                        readonly const: false;
                                    };
                                    readonly duplicates: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly source: {
                                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                                };
                                                readonly id: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: ("source" | "id")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                };
                                readonly required: ("abstract" | "source" | "duplicates" | "id" | "title" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly sources: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly source: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                    readonly status: {
                                        readonly enum: readonly ["succeeded", "failed", "disabled"];
                                    };
                                    readonly count: {
                                        readonly type: "integer";
                                    };
                                    readonly error: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("source" | "status" | "count")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly status: {
                            readonly enum: readonly ["complete", "partial"];
                        };
                        readonly retrievedAt: {
                            readonly type: "string";
                        };
                        readonly coverage: {
                            readonly type: "string";
                        };
                        readonly discoveryGrant: {
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
                                    readonly minLength: 64;
                                    readonly pattern: "^[a-f0-9]{64}$";
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly maxLength: number;
                                };
                                readonly approvalId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["id", "digest", "approvalId"];
                            readonly additionalProperties: false;
                        };
                        readonly discoveryCallIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly discoveryRequestDigest: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("sources" | "query" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "settingsVersion" | "status" | "retrievedAt" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "items" | "request" | "coverage")[];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "null";
                }];
            };
            readonly discoveryGrant: {
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
                        readonly minLength: 64;
                        readonly pattern: "^[a-f0-9]{64}$";
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly maxLength: number;
                    };
                    readonly approvalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["id", "digest", "approvalId"];
                readonly additionalProperties: false;
            };
            readonly scopeSessionId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "generation" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "settingsVersion" | "cancelRequested" | "request" | "kindOfTask" | "phase" | "searchResult")[];
        readonly additionalProperties: false;
    };
    readonly literature_task_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "literature-task";
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
            readonly kindOfTask: {
                readonly enum: readonly ["search", "retrieve"];
            };
            readonly request: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "search";
                        };
                        readonly search: {
                            readonly type: "object";
                            readonly properties: {
                                readonly query: {
                                    readonly type: "string";
                                };
                                readonly sources: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                };
                                readonly limit: {
                                    readonly type: "integer";
                                };
                                readonly strategy: {
                                    readonly enum: readonly ["keyword", "embedding"];
                                };
                                readonly prioritize: {
                                    readonly enum: readonly ["default", "recency", "historical", "popular"];
                                };
                                readonly publishedAfter: {
                                    readonly type: "string";
                                };
                                readonly publishedBefore: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("sources" | "query" | "limit" | "strategy" | "prioritize")[];
                            readonly additionalProperties: false;
                        };
                        readonly pageRequest: {
                            readonly type: "object";
                            readonly properties: {
                                readonly number: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly previousSearchId: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly cursor: {
                                    readonly type: "string";
                                };
                                readonly expiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("number" | "expiresAt" | "cursor" | "previousSearchId")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("search" | "kind")[];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "retrieve";
                        };
                        readonly target: {
                            readonly type: "object";
                            readonly properties: {
                                readonly source: {
                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                };
                                readonly id: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly format: {
                                    readonly enum: readonly ["provider-text", "original-pdf"];
                                };
                                readonly requestedVersion: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["source", "id", "format"];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("kind" | "target")[];
                    readonly additionalProperties: false;
                }];
            };
            readonly state: {
                readonly enum: readonly ["queued", "running", "succeeded", "partial", "failed", "cancelled", "interrupted"];
            };
            readonly phase: {
                readonly enum: readonly ["queued", "requesting", "publishing", "done"];
            };
            readonly settingsVersion: {
                readonly type: "integer";
            };
            readonly generation: {
                readonly type: "integer";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly resultSearchId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
                readonly type: "string";
            };
            readonly error: {
                readonly type: "object";
                readonly properties: {
                    readonly code: {
                        readonly type: "string";
                    };
                    readonly message: {
                        readonly type: "string";
                    };
                };
                readonly required: ("code" | "message")[];
                readonly additionalProperties: false;
            };
            readonly previousTaskId: {
                readonly type: "string";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly searchResult: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "connector-search";
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
                        readonly query: {
                            readonly type: "string";
                        };
                        readonly settingsVersion: {
                            readonly type: "integer";
                        };
                        readonly scopeSessionId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeTaskId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeAttemptId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly request: {
                            readonly type: "object";
                            readonly properties: {
                                readonly query: {
                                    readonly type: "string";
                                };
                                readonly sources: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                };
                                readonly limit: {
                                    readonly type: "integer";
                                };
                                readonly strategy: {
                                    readonly enum: readonly ["keyword", "embedding"];
                                };
                                readonly prioritize: {
                                    readonly enum: readonly ["default", "recency", "historical", "popular"];
                                };
                                readonly publishedAfter: {
                                    readonly type: "string";
                                };
                                readonly publishedBefore: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("sources" | "query" | "limit" | "strategy" | "prioritize")[];
                            readonly additionalProperties: false;
                        };
                        readonly page: {
                            readonly type: "object";
                            readonly properties: {
                                readonly nextCursor: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly nextCursorExpiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly rawItemCount: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly number: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly previousSearchId: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly cursor: {
                                    readonly type: "string";
                                };
                                readonly expiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("number" | "expiresAt" | "cursor" | "previousSearchId" | "nextCursor" | "nextCursorExpiresAt" | "rawItemCount")[];
                            readonly additionalProperties: false;
                        };
                        readonly items: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly source: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly title: {
                                        readonly type: "string";
                                    };
                                    readonly abstract: {
                                        readonly type: "string";
                                    };
                                    readonly publicationDate: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly doi: {
                                        readonly type: "string";
                                    };
                                    readonly url: {
                                        readonly type: "string";
                                    };
                                    readonly citations: {
                                        readonly type: "number";
                                    };
                                    readonly votes: {
                                        readonly type: "number";
                                    };
                                    readonly snippets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly text: {
                                                    readonly type: "string";
                                                };
                                                readonly reportedPage: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "number";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                            };
                                            readonly required: ("text" | "reportedPage")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                    readonly contentKind: {
                                        readonly const: "metadata";
                                    };
                                    readonly fullTextRead: {
                                        readonly const: false;
                                    };
                                    readonly duplicates: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly source: {
                                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                                };
                                                readonly id: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: ("source" | "id")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                };
                                readonly required: ("abstract" | "source" | "duplicates" | "id" | "title" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly sources: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly source: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                    readonly status: {
                                        readonly enum: readonly ["succeeded", "failed", "disabled"];
                                    };
                                    readonly count: {
                                        readonly type: "integer";
                                    };
                                    readonly error: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("source" | "status" | "count")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly status: {
                            readonly enum: readonly ["complete", "partial"];
                        };
                        readonly retrievedAt: {
                            readonly type: "string";
                        };
                        readonly coverage: {
                            readonly type: "string";
                        };
                        readonly discoveryGrant: {
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
                                    readonly minLength: 64;
                                    readonly pattern: "^[a-f0-9]{64}$";
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly maxLength: number;
                                };
                                readonly approvalId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["id", "digest", "approvalId"];
                            readonly additionalProperties: false;
                        };
                        readonly discoveryCallIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly discoveryRequestDigest: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("sources" | "query" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "settingsVersion" | "status" | "retrievedAt" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "items" | "request" | "coverage")[];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "null";
                }];
            };
            readonly discoveryGrant: {
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
                        readonly minLength: 64;
                        readonly pattern: "^[a-f0-9]{64}$";
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly maxLength: number;
                    };
                    readonly approvalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["id", "digest", "approvalId"];
                readonly additionalProperties: false;
            };
            readonly scopeSessionId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "generation" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "settingsVersion" | "cancelRequested" | "request" | "kindOfTask" | "phase" | "searchResult")[];
        readonly additionalProperties: false;
    };
    readonly literature_task_cancel: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "literature-task";
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
            readonly kindOfTask: {
                readonly enum: readonly ["search", "retrieve"];
            };
            readonly request: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "search";
                        };
                        readonly search: {
                            readonly type: "object";
                            readonly properties: {
                                readonly query: {
                                    readonly type: "string";
                                };
                                readonly sources: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                };
                                readonly limit: {
                                    readonly type: "integer";
                                };
                                readonly strategy: {
                                    readonly enum: readonly ["keyword", "embedding"];
                                };
                                readonly prioritize: {
                                    readonly enum: readonly ["default", "recency", "historical", "popular"];
                                };
                                readonly publishedAfter: {
                                    readonly type: "string";
                                };
                                readonly publishedBefore: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("sources" | "query" | "limit" | "strategy" | "prioritize")[];
                            readonly additionalProperties: false;
                        };
                        readonly pageRequest: {
                            readonly type: "object";
                            readonly properties: {
                                readonly number: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly previousSearchId: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly cursor: {
                                    readonly type: "string";
                                };
                                readonly expiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("number" | "expiresAt" | "cursor" | "previousSearchId")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("search" | "kind")[];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "retrieve";
                        };
                        readonly target: {
                            readonly type: "object";
                            readonly properties: {
                                readonly source: {
                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                };
                                readonly id: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly format: {
                                    readonly enum: readonly ["provider-text", "original-pdf"];
                                };
                                readonly requestedVersion: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["source", "id", "format"];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("kind" | "target")[];
                    readonly additionalProperties: false;
                }];
            };
            readonly state: {
                readonly enum: readonly ["queued", "running", "succeeded", "partial", "failed", "cancelled", "interrupted"];
            };
            readonly phase: {
                readonly enum: readonly ["queued", "requesting", "publishing", "done"];
            };
            readonly settingsVersion: {
                readonly type: "integer";
            };
            readonly generation: {
                readonly type: "integer";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly resultSearchId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
                readonly type: "string";
            };
            readonly error: {
                readonly type: "object";
                readonly properties: {
                    readonly code: {
                        readonly type: "string";
                    };
                    readonly message: {
                        readonly type: "string";
                    };
                };
                readonly required: ("code" | "message")[];
                readonly additionalProperties: false;
            };
            readonly previousTaskId: {
                readonly type: "string";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly searchResult: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "connector-search";
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
                        readonly query: {
                            readonly type: "string";
                        };
                        readonly settingsVersion: {
                            readonly type: "integer";
                        };
                        readonly scopeSessionId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeTaskId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeAttemptId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly request: {
                            readonly type: "object";
                            readonly properties: {
                                readonly query: {
                                    readonly type: "string";
                                };
                                readonly sources: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                };
                                readonly limit: {
                                    readonly type: "integer";
                                };
                                readonly strategy: {
                                    readonly enum: readonly ["keyword", "embedding"];
                                };
                                readonly prioritize: {
                                    readonly enum: readonly ["default", "recency", "historical", "popular"];
                                };
                                readonly publishedAfter: {
                                    readonly type: "string";
                                };
                                readonly publishedBefore: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("sources" | "query" | "limit" | "strategy" | "prioritize")[];
                            readonly additionalProperties: false;
                        };
                        readonly page: {
                            readonly type: "object";
                            readonly properties: {
                                readonly nextCursor: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly nextCursorExpiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly rawItemCount: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly number: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly previousSearchId: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly cursor: {
                                    readonly type: "string";
                                };
                                readonly expiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("number" | "expiresAt" | "cursor" | "previousSearchId" | "nextCursor" | "nextCursorExpiresAt" | "rawItemCount")[];
                            readonly additionalProperties: false;
                        };
                        readonly items: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly source: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly title: {
                                        readonly type: "string";
                                    };
                                    readonly abstract: {
                                        readonly type: "string";
                                    };
                                    readonly publicationDate: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly doi: {
                                        readonly type: "string";
                                    };
                                    readonly url: {
                                        readonly type: "string";
                                    };
                                    readonly citations: {
                                        readonly type: "number";
                                    };
                                    readonly votes: {
                                        readonly type: "number";
                                    };
                                    readonly snippets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly text: {
                                                    readonly type: "string";
                                                };
                                                readonly reportedPage: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "number";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                            };
                                            readonly required: ("text" | "reportedPage")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                    readonly contentKind: {
                                        readonly const: "metadata";
                                    };
                                    readonly fullTextRead: {
                                        readonly const: false;
                                    };
                                    readonly duplicates: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly source: {
                                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                                };
                                                readonly id: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: ("source" | "id")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                };
                                readonly required: ("abstract" | "source" | "duplicates" | "id" | "title" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly sources: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly source: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                    readonly status: {
                                        readonly enum: readonly ["succeeded", "failed", "disabled"];
                                    };
                                    readonly count: {
                                        readonly type: "integer";
                                    };
                                    readonly error: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("source" | "status" | "count")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly status: {
                            readonly enum: readonly ["complete", "partial"];
                        };
                        readonly retrievedAt: {
                            readonly type: "string";
                        };
                        readonly coverage: {
                            readonly type: "string";
                        };
                        readonly discoveryGrant: {
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
                                    readonly minLength: 64;
                                    readonly pattern: "^[a-f0-9]{64}$";
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly maxLength: number;
                                };
                                readonly approvalId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["id", "digest", "approvalId"];
                            readonly additionalProperties: false;
                        };
                        readonly discoveryCallIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly discoveryRequestDigest: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("sources" | "query" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "settingsVersion" | "status" | "retrievedAt" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "items" | "request" | "coverage")[];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "null";
                }];
            };
            readonly discoveryGrant: {
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
                        readonly minLength: 64;
                        readonly pattern: "^[a-f0-9]{64}$";
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly maxLength: number;
                    };
                    readonly approvalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["id", "digest", "approvalId"];
                readonly additionalProperties: false;
            };
            readonly scopeSessionId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "generation" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "settingsVersion" | "cancelRequested" | "request" | "kindOfTask" | "phase" | "searchResult")[];
        readonly additionalProperties: false;
    };
    readonly literature_task_retry: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "literature-task";
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
            readonly kindOfTask: {
                readonly enum: readonly ["search", "retrieve"];
            };
            readonly request: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "search";
                        };
                        readonly search: {
                            readonly type: "object";
                            readonly properties: {
                                readonly query: {
                                    readonly type: "string";
                                };
                                readonly sources: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                };
                                readonly limit: {
                                    readonly type: "integer";
                                };
                                readonly strategy: {
                                    readonly enum: readonly ["keyword", "embedding"];
                                };
                                readonly prioritize: {
                                    readonly enum: readonly ["default", "recency", "historical", "popular"];
                                };
                                readonly publishedAfter: {
                                    readonly type: "string";
                                };
                                readonly publishedBefore: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("sources" | "query" | "limit" | "strategy" | "prioritize")[];
                            readonly additionalProperties: false;
                        };
                        readonly pageRequest: {
                            readonly type: "object";
                            readonly properties: {
                                readonly number: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly previousSearchId: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly cursor: {
                                    readonly type: "string";
                                };
                                readonly expiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("number" | "expiresAt" | "cursor" | "previousSearchId")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("search" | "kind")[];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "retrieve";
                        };
                        readonly target: {
                            readonly type: "object";
                            readonly properties: {
                                readonly source: {
                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                };
                                readonly id: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly format: {
                                    readonly enum: readonly ["provider-text", "original-pdf"];
                                };
                                readonly requestedVersion: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["source", "id", "format"];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("kind" | "target")[];
                    readonly additionalProperties: false;
                }];
            };
            readonly state: {
                readonly enum: readonly ["queued", "running", "succeeded", "partial", "failed", "cancelled", "interrupted"];
            };
            readonly phase: {
                readonly enum: readonly ["queued", "requesting", "publishing", "done"];
            };
            readonly settingsVersion: {
                readonly type: "integer";
            };
            readonly generation: {
                readonly type: "integer";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly resultSearchId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
                readonly type: "string";
            };
            readonly error: {
                readonly type: "object";
                readonly properties: {
                    readonly code: {
                        readonly type: "string";
                    };
                    readonly message: {
                        readonly type: "string";
                    };
                };
                readonly required: ("code" | "message")[];
                readonly additionalProperties: false;
            };
            readonly previousTaskId: {
                readonly type: "string";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly searchResult: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "connector-search";
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
                        readonly query: {
                            readonly type: "string";
                        };
                        readonly settingsVersion: {
                            readonly type: "integer";
                        };
                        readonly scopeSessionId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeTaskId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeAttemptId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly request: {
                            readonly type: "object";
                            readonly properties: {
                                readonly query: {
                                    readonly type: "string";
                                };
                                readonly sources: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                };
                                readonly limit: {
                                    readonly type: "integer";
                                };
                                readonly strategy: {
                                    readonly enum: readonly ["keyword", "embedding"];
                                };
                                readonly prioritize: {
                                    readonly enum: readonly ["default", "recency", "historical", "popular"];
                                };
                                readonly publishedAfter: {
                                    readonly type: "string";
                                };
                                readonly publishedBefore: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("sources" | "query" | "limit" | "strategy" | "prioritize")[];
                            readonly additionalProperties: false;
                        };
                        readonly page: {
                            readonly type: "object";
                            readonly properties: {
                                readonly nextCursor: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly nextCursorExpiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly rawItemCount: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly number: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly previousSearchId: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly cursor: {
                                    readonly type: "string";
                                };
                                readonly expiresAt: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("number" | "expiresAt" | "cursor" | "previousSearchId" | "nextCursor" | "nextCursorExpiresAt" | "rawItemCount")[];
                            readonly additionalProperties: false;
                        };
                        readonly items: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly source: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly title: {
                                        readonly type: "string";
                                    };
                                    readonly abstract: {
                                        readonly type: "string";
                                    };
                                    readonly publicationDate: {
                                        readonly anyOf: readonly [{
                                            readonly type: "string";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly doi: {
                                        readonly type: "string";
                                    };
                                    readonly url: {
                                        readonly type: "string";
                                    };
                                    readonly citations: {
                                        readonly type: "number";
                                    };
                                    readonly votes: {
                                        readonly type: "number";
                                    };
                                    readonly snippets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly text: {
                                                    readonly type: "string";
                                                };
                                                readonly reportedPage: {
                                                    readonly anyOf: readonly [{
                                                        readonly type: "number";
                                                    }, {
                                                        readonly type: "null";
                                                    }];
                                                };
                                            };
                                            readonly required: ("text" | "reportedPage")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                    readonly contentKind: {
                                        readonly const: "metadata";
                                    };
                                    readonly fullTextRead: {
                                        readonly const: false;
                                    };
                                    readonly duplicates: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly source: {
                                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                                };
                                                readonly id: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: ("source" | "id")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                };
                                readonly required: ("abstract" | "source" | "duplicates" | "id" | "title" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly sources: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly source: {
                                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                    };
                                    readonly status: {
                                        readonly enum: readonly ["succeeded", "failed", "disabled"];
                                    };
                                    readonly count: {
                                        readonly type: "integer";
                                    };
                                    readonly error: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("source" | "status" | "count")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly status: {
                            readonly enum: readonly ["complete", "partial"];
                        };
                        readonly retrievedAt: {
                            readonly type: "string";
                        };
                        readonly coverage: {
                            readonly type: "string";
                        };
                        readonly discoveryGrant: {
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
                                    readonly minLength: 64;
                                    readonly pattern: "^[a-f0-9]{64}$";
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly maxLength: number;
                                };
                                readonly approvalId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["id", "digest", "approvalId"];
                            readonly additionalProperties: false;
                        };
                        readonly discoveryCallIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly discoveryRequestDigest: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("sources" | "query" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "settingsVersion" | "status" | "retrievedAt" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "items" | "request" | "coverage")[];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "null";
                }];
            };
            readonly discoveryGrant: {
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
                        readonly minLength: 64;
                        readonly pattern: "^[a-f0-9]{64}$";
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly maxLength: number;
                    };
                    readonly approvalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["id", "digest", "approvalId"];
                readonly additionalProperties: false;
            };
            readonly scopeSessionId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "generation" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "settingsVersion" | "cancelRequested" | "request" | "kindOfTask" | "phase" | "searchResult")[];
        readonly additionalProperties: false;
    };
    readonly document_import: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "document-version";
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
            readonly original: {
                readonly type: "object";
                readonly properties: {
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
                };
                readonly required: ("size" | "digest" | "mediaType" | "artifactId")[];
                readonly additionalProperties: false;
            };
            readonly derivedText: {
                readonly type: "object";
                readonly properties: {
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
                };
                readonly required: ("size" | "digest" | "mediaType" | "artifactId")[];
                readonly additionalProperties: false;
            };
            readonly source: {
                readonly type: "object";
                readonly properties: {
                    readonly kind: {
                        readonly enum: readonly ["connector", "upload"];
                    };
                    readonly provider: {
                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                    };
                    readonly requestedId: {
                        readonly type: "string";
                    };
                    readonly resolvedId: {
                        readonly type: "string";
                    };
                    readonly requestedVersion: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly reportedVersion: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly versionAssurance: {
                        readonly type: "string";
                    };
                    readonly sourceUrl: {
                        readonly type: "string";
                    };
                };
                readonly required: ("kind" | "versionAssurance" | "reportedVersion" | "requestedVersion")[];
                readonly additionalProperties: false;
            };
            readonly contentKind: {
                readonly enum: readonly ["metadata", "abstract", "provider-text", "original-pdf", "user-text"];
            };
            readonly acquiredAt: {
                readonly type: "string";
            };
            readonly license: {
                readonly type: "object";
                readonly properties: {
                    readonly value: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly assurance: {
                        readonly enum: readonly ["provider-reported", "user-declared", "unknown"];
                    };
                };
                readonly required: ("value" | "assurance")[];
                readonly additionalProperties: false;
            };
            readonly rawResponseArtifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly scopeSessionId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly scopeTaskId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly limitations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly discoveryGrant: {
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
                        readonly minLength: 64;
                        readonly pattern: "^[a-f0-9]{64}$";
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly maxLength: number;
                    };
                    readonly approvalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["id", "digest", "approvalId"];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("source" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "title" | "limitations" | "contentKind" | "license" | "original" | "acquiredAt")[];
        readonly additionalProperties: false;
    };
    readonly document_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "document-version";
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
            readonly original: {
                readonly type: "object";
                readonly properties: {
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
                };
                readonly required: ("size" | "digest" | "mediaType" | "artifactId")[];
                readonly additionalProperties: false;
            };
            readonly derivedText: {
                readonly type: "object";
                readonly properties: {
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
                };
                readonly required: ("size" | "digest" | "mediaType" | "artifactId")[];
                readonly additionalProperties: false;
            };
            readonly source: {
                readonly type: "object";
                readonly properties: {
                    readonly kind: {
                        readonly enum: readonly ["connector", "upload"];
                    };
                    readonly provider: {
                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                    };
                    readonly requestedId: {
                        readonly type: "string";
                    };
                    readonly resolvedId: {
                        readonly type: "string";
                    };
                    readonly requestedVersion: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly reportedVersion: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly versionAssurance: {
                        readonly type: "string";
                    };
                    readonly sourceUrl: {
                        readonly type: "string";
                    };
                };
                readonly required: ("kind" | "versionAssurance" | "reportedVersion" | "requestedVersion")[];
                readonly additionalProperties: false;
            };
            readonly contentKind: {
                readonly enum: readonly ["metadata", "abstract", "provider-text", "original-pdf", "user-text"];
            };
            readonly acquiredAt: {
                readonly type: "string";
            };
            readonly license: {
                readonly type: "object";
                readonly properties: {
                    readonly value: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly assurance: {
                        readonly enum: readonly ["provider-reported", "user-declared", "unknown"];
                    };
                };
                readonly required: ("value" | "assurance")[];
                readonly additionalProperties: false;
            };
            readonly rawResponseArtifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly scopeSessionId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly scopeTaskId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly limitations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly discoveryGrant: {
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
                        readonly minLength: 64;
                        readonly pattern: "^[a-f0-9]{64}$";
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly maxLength: number;
                    };
                    readonly approvalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["id", "digest", "approvalId"];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("source" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "title" | "limitations" | "contentKind" | "license" | "original" | "acquiredAt")[];
        readonly additionalProperties: false;
    };
    readonly document_list: {
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
                            readonly const: "document-version";
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
                        readonly original: {
                            readonly type: "object";
                            readonly properties: {
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
                            };
                            readonly required: ("size" | "digest" | "mediaType" | "artifactId")[];
                            readonly additionalProperties: false;
                        };
                        readonly derivedText: {
                            readonly type: "object";
                            readonly properties: {
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
                            };
                            readonly required: ("size" | "digest" | "mediaType" | "artifactId")[];
                            readonly additionalProperties: false;
                        };
                        readonly source: {
                            readonly type: "object";
                            readonly properties: {
                                readonly kind: {
                                    readonly enum: readonly ["connector", "upload"];
                                };
                                readonly provider: {
                                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                                };
                                readonly requestedId: {
                                    readonly type: "string";
                                };
                                readonly resolvedId: {
                                    readonly type: "string";
                                };
                                readonly requestedVersion: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly reportedVersion: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly versionAssurance: {
                                    readonly type: "string";
                                };
                                readonly sourceUrl: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("kind" | "versionAssurance" | "reportedVersion" | "requestedVersion")[];
                            readonly additionalProperties: false;
                        };
                        readonly contentKind: {
                            readonly enum: readonly ["metadata", "abstract", "provider-text", "original-pdf", "user-text"];
                        };
                        readonly acquiredAt: {
                            readonly type: "string";
                        };
                        readonly license: {
                            readonly type: "object";
                            readonly properties: {
                                readonly value: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly assurance: {
                                    readonly enum: readonly ["provider-reported", "user-declared", "unknown"];
                                };
                            };
                            readonly required: ("value" | "assurance")[];
                            readonly additionalProperties: false;
                        };
                        readonly rawResponseArtifactIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly scopeSessionId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeTaskId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly limitations: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly discoveryGrant: {
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
                                    readonly minLength: 64;
                                    readonly pattern: "^[a-f0-9]{64}$";
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly maxLength: number;
                                };
                                readonly approvalId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: readonly ["id", "digest", "approvalId"];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("source" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "title" | "limitations" | "contentKind" | "license" | "original" | "acquiredAt")[];
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
    readonly document_parser_status: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly configured: {
                readonly type: "boolean";
            };
            readonly profileId: {
                readonly const: "pdfium-text-pages-v1";
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
                    readonly maxPages: {
                        readonly type: "integer";
                    };
                    readonly maxImageEdge: {
                        readonly type: "integer";
                    };
                    readonly textBytes: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("cpus" | "memoryMb" | "pids" | "timeoutSeconds" | "workMb" | "outputBytes" | "logBytes" | "maxPages" | "maxImageEdge" | "textBytes")[];
                readonly additionalProperties: false;
            };
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly profileId: {
                        readonly const: "pdfium-text-pages-v1";
                    };
                    readonly profileDigest: {
                        readonly type: "string";
                    };
                    readonly lockDigest: {
                        readonly type: "string";
                    };
                    readonly scriptDigest: {
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
                readonly required: ("dockerContext" | "imageDigest" | "profileId" | "imageId" | "profileDigest" | "lockDigest" | "scriptDigest")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("version" | "profileId" | "limits" | "configured")[];
        readonly additionalProperties: false;
    };
    readonly document_parser_configure: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly configured: {
                readonly type: "boolean";
            };
            readonly profileId: {
                readonly const: "pdfium-text-pages-v1";
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
                    readonly maxPages: {
                        readonly type: "integer";
                    };
                    readonly maxImageEdge: {
                        readonly type: "integer";
                    };
                    readonly textBytes: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("cpus" | "memoryMb" | "pids" | "timeoutSeconds" | "workMb" | "outputBytes" | "logBytes" | "maxPages" | "maxImageEdge" | "textBytes")[];
                readonly additionalProperties: false;
            };
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly profileId: {
                        readonly const: "pdfium-text-pages-v1";
                    };
                    readonly profileDigest: {
                        readonly type: "string";
                    };
                    readonly lockDigest: {
                        readonly type: "string";
                    };
                    readonly scriptDigest: {
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
                readonly required: ("dockerContext" | "imageDigest" | "profileId" | "imageId" | "profileDigest" | "lockDigest" | "scriptDigest")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("version" | "profileId" | "limits" | "configured")[];
        readonly additionalProperties: false;
    };
    readonly document_parse_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly jobId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
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
            readonly rawDigest: {
                readonly type: "string";
            };
            readonly profileId: {
                readonly const: "pdfium-text-pages-v1";
            };
            readonly profileDigest: {
                readonly type: "string";
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
                    cpus: {
                        readonly type: "number";
                    };
                    memoryMb: {
                        readonly type: "integer";
                    };
                    pids: {
                        readonly type: "integer";
                    };
                    timeoutSeconds: {
                        readonly type: "integer";
                    };
                    workMb: {
                        readonly type: "integer";
                    };
                    logBytes: {
                        readonly type: "integer";
                    };
                    outputBytes: {
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
        };
        readonly required: ("id" | "approvalId" | "manifestDigest" | "state" | "generation" | "dockerContext" | "resources" | "jobId" | "imageDigest" | "profileId" | "profileDigest" | "integrity" | "startRequested" | "cancelRequested" | "exitCode" | "artifactIds" | "documentVersionId" | "rawDigest")[];
        readonly additionalProperties: false;
    };
    readonly document_parse_submit: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly jobId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
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
            readonly rawDigest: {
                readonly type: "string";
            };
            readonly profileId: {
                readonly const: "pdfium-text-pages-v1";
            };
            readonly profileDigest: {
                readonly type: "string";
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
                    cpus: {
                        readonly type: "number";
                    };
                    memoryMb: {
                        readonly type: "integer";
                    };
                    pids: {
                        readonly type: "integer";
                    };
                    timeoutSeconds: {
                        readonly type: "integer";
                    };
                    workMb: {
                        readonly type: "integer";
                    };
                    logBytes: {
                        readonly type: "integer";
                    };
                    outputBytes: {
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
        };
        readonly required: ("id" | "approvalId" | "manifestDigest" | "state" | "generation" | "dockerContext" | "resources" | "jobId" | "imageDigest" | "profileId" | "profileDigest" | "integrity" | "startRequested" | "cancelRequested" | "exitCode" | "artifactIds" | "documentVersionId" | "rawDigest")[];
        readonly additionalProperties: false;
    };
    readonly document_parse_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly jobId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
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
            readonly rawDigest: {
                readonly type: "string";
            };
            readonly profileId: {
                readonly const: "pdfium-text-pages-v1";
            };
            readonly profileDigest: {
                readonly type: "string";
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
                    cpus: {
                        readonly type: "number";
                    };
                    memoryMb: {
                        readonly type: "integer";
                    };
                    pids: {
                        readonly type: "integer";
                    };
                    timeoutSeconds: {
                        readonly type: "integer";
                    };
                    workMb: {
                        readonly type: "integer";
                    };
                    logBytes: {
                        readonly type: "integer";
                    };
                    outputBytes: {
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
        };
        readonly required: ("id" | "approvalId" | "manifestDigest" | "state" | "generation" | "dockerContext" | "resources" | "jobId" | "imageDigest" | "profileId" | "profileDigest" | "integrity" | "startRequested" | "cancelRequested" | "exitCode" | "artifactIds" | "documentVersionId" | "rawDigest")[];
        readonly additionalProperties: false;
    };
    readonly document_parse_cancel: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly jobId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
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
            readonly rawDigest: {
                readonly type: "string";
            };
            readonly profileId: {
                readonly const: "pdfium-text-pages-v1";
            };
            readonly profileDigest: {
                readonly type: "string";
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
                    cpus: {
                        readonly type: "number";
                    };
                    memoryMb: {
                        readonly type: "integer";
                    };
                    pids: {
                        readonly type: "integer";
                    };
                    timeoutSeconds: {
                        readonly type: "integer";
                    };
                    workMb: {
                        readonly type: "integer";
                    };
                    logBytes: {
                        readonly type: "integer";
                    };
                    outputBytes: {
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
        };
        readonly required: ("id" | "approvalId" | "manifestDigest" | "state" | "generation" | "dockerContext" | "resources" | "jobId" | "imageDigest" | "profileId" | "profileDigest" | "integrity" | "startRequested" | "cancelRequested" | "exitCode" | "artifactIds" | "documentVersionId" | "rawDigest")[];
        readonly additionalProperties: false;
    };
    readonly document_pages: {
        readonly type: "object";
        readonly properties: {
            readonly resultId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
                readonly type: "string";
            };
            readonly rawDigest: {
                readonly type: "string";
            };
            readonly pageCount: {
                readonly type: "integer";
            };
            readonly quality: {
                readonly type: "object";
                readonly properties: {
                    readonly readingOrder: {
                        readonly const: "unverified";
                    };
                    readonly paragraphs: {
                        readonly const: "heuristic";
                    };
                    readonly tables: {
                        readonly const: "unknown";
                    };
                    readonly figures: {
                        readonly const: "unknown";
                    };
                    readonly ocr: {
                        readonly const: false;
                    };
                    readonly score: {
                        readonly type: "null";
                    };
                };
                readonly required: ("readingOrder" | "paragraphs" | "tables" | "figures" | "ocr" | "score")[];
                readonly additionalProperties: false;
            };
            readonly versionAssurance: {
                readonly enum: readonly ["marker-match", "unverified"];
            };
            readonly requestedVersion: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly observedVersion: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        pageNumber: {
                            readonly type: "integer";
                        };
                        pageLabel: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        width: {
                            readonly type: "number";
                        };
                        height: {
                            readonly type: "number";
                        };
                        imageWidth: {
                            readonly type: "integer";
                        };
                        imageHeight: {
                            readonly type: "integer";
                        };
                        textArtifactId: {
                            readonly type: "string";
                        };
                        textArtifactDigest: {
                            readonly type: "string";
                        };
                        imageArtifactId: {
                            readonly type: "string";
                        };
                        imageArtifactDigest: {
                            readonly type: "string";
                        };
                        paragraphs: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly index: {
                                        readonly type: "integer";
                                    };
                                    readonly start: {
                                        readonly type: "integer";
                                    };
                                    readonly end: {
                                        readonly type: "integer";
                                    };
                                };
                                readonly required: ("start" | "end" | "index")[];
                                readonly additionalProperties: false;
                            };
                        };
                        textStatus: {
                            readonly enum: readonly ["text-extracted", "no-text-layer"];
                        };
                    };
                    readonly required: ("textArtifactDigest" | "textArtifactId" | "imageArtifactDigest" | "textStatus" | "pageNumber" | "width" | "height" | "paragraphs" | "pageLabel" | "imageWidth" | "imageHeight" | "imageArtifactId")[];
                    readonly additionalProperties: false;
                };
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
        readonly required: ("complete" | "quality" | "cursor" | "end" | "versionAssurance" | "requestedVersion" | "resultId" | "items" | "documentVersionId" | "rawDigest" | "observedVersion" | "pageCount")[];
        readonly additionalProperties: false;
    };
    readonly document_page_read: {
        readonly type: "object";
        readonly properties: {
            readonly content: {
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
            readonly pageNumber: {
                readonly type: "integer";
            };
            readonly pageLabel: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly width: {
                readonly type: "number";
            };
            readonly height: {
                readonly type: "number";
            };
            readonly imageWidth: {
                readonly type: "integer";
            };
            readonly imageHeight: {
                readonly type: "integer";
            };
            readonly textArtifactId: {
                readonly type: "string";
            };
            readonly textArtifactDigest: {
                readonly type: "string";
            };
            readonly imageArtifactId: {
                readonly type: "string";
            };
            readonly imageArtifactDigest: {
                readonly type: "string";
            };
            readonly paragraphs: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly index: {
                            readonly type: "integer";
                        };
                        readonly start: {
                            readonly type: "integer";
                        };
                        readonly end: {
                            readonly type: "integer";
                        };
                    };
                    readonly required: ("start" | "end" | "index")[];
                    readonly additionalProperties: false;
                };
            };
            readonly textStatus: {
                readonly enum: readonly ["text-extracted", "no-text-layer"];
            };
            readonly resultId: {
                readonly type: "string";
            };
            readonly documentVersionId: {
                readonly type: "string";
            };
            readonly rawDigest: {
                readonly type: "string";
            };
        };
        readonly required: ("complete" | "cursor" | "textArtifactDigest" | "textArtifactId" | "imageArtifactDigest" | "textStatus" | "end" | "pageNumber" | "content" | "width" | "height" | "resultId" | "documentVersionId" | "rawDigest" | "paragraphs" | "pageLabel" | "imageWidth" | "imageHeight" | "imageArtifactId")[];
        readonly additionalProperties: false;
    };
    readonly document_evidence_register: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "evidence";
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
            readonly type: {
                readonly const: "paper";
            };
            readonly artifactId: {
                readonly type: "string";
            };
            readonly digest: {
                readonly type: "string";
            };
            readonly locator: {
                readonly type: "object";
                readonly properties: {
                    readonly start: {
                        readonly type: "integer";
                    };
                    readonly end: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("start" | "end")[];
                readonly additionalProperties: false;
            };
            readonly quote: {
                readonly type: "string";
            };
            readonly description: {
                readonly type: "string";
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
                };
                readonly required: ("textArtifactDigest" | "pageNumber" | "documentVersionId" | "rawDigest" | "parseResultId")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("id" | "digest" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "type" | "description" | "artifactId" | "locator" | "quote" | "document")[];
        readonly additionalProperties: false;
    };
};
