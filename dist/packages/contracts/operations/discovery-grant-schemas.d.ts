export declare const DISCOVERY_GRANT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly kind: {
            readonly const: "discovery-grant";
        };
        readonly sessionId: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly taskBinding: {
            readonly type: "object";
            readonly properties: {
                readonly taskId: {
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
                readonly teamApprovalId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly planDigest: {
                    minLength: number;
                    pattern: string;
                    type: "string";
                    description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    maxLength: number;
                };
                readonly planVersion: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly directiveVersion: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly taskSpecDigest: {
                    minLength: number;
                    pattern: string;
                    type: "string";
                    description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    maxLength: number;
                };
                readonly teamPlanId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly teamPlanVersion: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly teamPlanDigest: {
                    minLength: number;
                    pattern: string;
                    type: "string";
                    description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    maxLength: number;
                };
                readonly role: {
                    readonly const: "literature";
                };
            };
            readonly required: readonly [];
            readonly additionalProperties: false;
        };
        readonly model: {
            readonly type: "object";
            readonly properties: {
                readonly provider: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly model: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly thinking: {
                    readonly enum: readonly ["off", "minimal", "low", "medium", "high", "xhigh"];
                };
            };
            readonly required: readonly ["provider", "model", "thinking"];
            readonly additionalProperties: false;
        };
        readonly settingsVersion: {
            readonly type: "integer";
            readonly minimum: number;
            readonly maximum: number;
        };
        readonly sources: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
            };
            readonly minItems: number;
        };
        readonly searches: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
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
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly minItems: number;
                    };
                    readonly limit: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly strategy: {
                        readonly enum: readonly ["keyword", "embedding"];
                    };
                    readonly prioritize: {
                        readonly enum: readonly ["default", "recency", "historical", "popular"];
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
                readonly required: readonly ["query", "sources", "limit", "strategy", "prioritize"];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly targets: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
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
            readonly minItems: number;
        };
        readonly allowSearchResults: {
            readonly type: "boolean";
        };
        readonly formats: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly enum: readonly ["provider-text", "original-pdf"];
            };
            readonly minItems: number;
        };
        readonly maxRequests: {
            readonly type: "integer";
            readonly minimum: number;
            readonly maximum: number;
        };
        readonly maxResponseBytes: {
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
        readonly approvalId: {
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
        readonly state: {
            readonly enum: readonly ["draft", "active", "revoked"];
        };
        readonly activatedAt: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly revokedAt: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly effectiveState: {
            readonly enum: readonly ["draft", "active", "expired", "exhausted", "revoked", "stale"];
        };
        readonly validity: {
            readonly enum: readonly ["current", "stale"];
        };
        readonly reasons: {
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
        readonly usage: {
            readonly type: "object";
            readonly properties: {
                readonly limit: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly used: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly remaining: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly unit: {
                    readonly const: "http-request-attempt";
                };
            };
            readonly required: readonly ["limit", "used", "remaining", "unit"];
            readonly additionalProperties: false;
        };
        readonly calls: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly kind: {
                        readonly const: "connector-call";
                    };
                    readonly source: {
                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                    };
                    readonly host: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly status: {
                        readonly enum: readonly ["reserved", "succeeded", "failed-or-unknown"];
                    };
                    readonly startedAt: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
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
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly scopeTaskId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly scopeAttemptId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly scopeGeneration: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly requestDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly operationKeyDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly requestUrlDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly bytes: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly httpStatus: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly retryAfter: {
                        readonly anyOf: readonly [{
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly error: {
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
                    readonly projectId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly version: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly createdAt: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly updatedAt: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: ("version" | "bytes" | "id" | "source" | "requestDigest" | "error" | "createdAt" | "kind" | "status" | "host" | "projectId" | "updatedAt" | "startedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "scopeGeneration" | "operationKeyDigest" | "requestUrlDigest" | "httpStatus" | "retryAfter")[];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly searchResults: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
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
                        readonly required: ("number" | "cursor" | "rawItemCount" | "nextCursor" | "expiresAt" | "previousSearchId" | "nextCursorExpiresAt")[];
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
                                        readonly required: ("id" | "source")[];
                                        readonly additionalProperties: false;
                                    };
                                };
                            };
                            readonly required: ("id" | "source" | "title" | "abstract" | "duplicates" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
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
                readonly required: ("version" | "id" | "createdAt" | "kind" | "status" | "sources" | "query" | "coverage" | "projectId" | "updatedAt" | "settingsVersion" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "retrievedAt" | "items" | "request")[];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly papers: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly kind: {
                        readonly const: "paper-read";
                    };
                    readonly source: {
                        readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                    };
                    readonly idInSource: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly requestedId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly title: {
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
                    readonly artifactDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly rawArtifactIds: {
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
                    readonly contentKind: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly fullTextRead: {
                        readonly type: "boolean";
                    };
                    readonly retrievedAt: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
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
                        readonly anyOf: readonly [{
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly scopeTaskId: {
                        readonly anyOf: readonly [{
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly scopeAttemptId: {
                        readonly anyOf: readonly [{
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly discoveryCallIds: {
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
                    readonly discoveryRequestDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly id: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly projectId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly version: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly createdAt: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly updatedAt: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: ("version" | "id" | "source" | "createdAt" | "title" | "kind" | "artifactId" | "contentKind" | "requestedId" | "projectId" | "updatedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "idInSource" | "artifactDigest" | "rawArtifactIds" | "fullTextRead" | "retrievedAt" | "discoveryCallIds" | "discoveryRequestDigest")[];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly id: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly projectId: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly version: {
            readonly type: "integer";
            readonly minimum: number;
            readonly maximum: number;
        };
        readonly createdAt: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly updatedAt: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
    };
    readonly required: ("version" | "digest" | "id" | "state" | "sessionId" | "createdAt" | "model" | "kind" | "approvalId" | "sources" | "expiresAt" | "projectId" | "updatedAt" | "validity" | "settingsVersion" | "searches" | "targets" | "allowSearchResults" | "formats" | "maxRequests" | "maxResponseBytes" | "usage" | "effectiveState" | "reasons" | "searchResults" | "calls" | "papers")[];
    readonly additionalProperties: false;
};
export declare const DISCOVERY_GRANT_INPUT_SCHEMAS: {
    readonly discovery_grant_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
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
            readonly searches: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                readonly minItems: number;
            };
            readonly targets: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                readonly minItems: number;
            };
            readonly allowSearchResults: {
                readonly type: "boolean";
            };
            readonly formats: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["provider-text", "original-pdf"];
                };
                readonly minItems: number;
            };
            readonly maxRequests: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly maxResponseBytes: {
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
        readonly required: readonly ["searches", "targets", "allowSearchResults", "formats", "maxRequests", "maxResponseBytes", "expiresAt"];
        readonly additionalProperties: false;
    };
    readonly discovery_grant_inspect: {
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
    };
    readonly discovery_grant_activate: {
        readonly type: "object";
        readonly properties: {
            readonly grantId: {
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
        readonly required: readonly ["grantId", "expectedVersion"];
        readonly additionalProperties: false;
    };
    readonly discovery_grant_revoke: {
        readonly type: "object";
        readonly properties: {
            readonly grantId: {
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
        readonly required: readonly ["grantId", "expectedVersion"];
        readonly additionalProperties: false;
    };
};
export declare const DISCOVERY_GRANT_OUTPUT_SCHEMAS: {
    readonly discovery_grant_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly const: "discovery-grant";
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly taskBinding: {
                readonly type: "object";
                readonly properties: {
                    readonly taskId: {
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
                    readonly teamApprovalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly planDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly planVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly directiveVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly taskSpecDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly teamPlanId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly teamPlanVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly teamPlanDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly role: {
                        readonly const: "literature";
                    };
                };
                readonly required: readonly [];
                readonly additionalProperties: false;
            };
            readonly model: {
                readonly type: "object";
                readonly properties: {
                    readonly provider: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly model: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly thinking: {
                        readonly enum: readonly ["off", "minimal", "low", "medium", "high", "xhigh"];
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly settingsVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly sources: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                };
                readonly minItems: number;
            };
            readonly searches: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            readonly maxItems?: number | undefined;
                            readonly type: "array";
                            readonly items: {
                                readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                            };
                            readonly minItems: number;
                        };
                        readonly limit: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly strategy: {
                            readonly enum: readonly ["keyword", "embedding"];
                        };
                        readonly prioritize: {
                            readonly enum: readonly ["default", "recency", "historical", "popular"];
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
                    readonly required: readonly ["query", "sources", "limit", "strategy", "prioritize"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly targets: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                readonly minItems: number;
            };
            readonly allowSearchResults: {
                readonly type: "boolean";
            };
            readonly formats: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["provider-text", "original-pdf"];
                };
                readonly minItems: number;
            };
            readonly maxRequests: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly maxResponseBytes: {
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
            readonly approvalId: {
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
            readonly state: {
                readonly enum: readonly ["draft", "active", "revoked"];
            };
            readonly activatedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly revokedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly effectiveState: {
                readonly enum: readonly ["draft", "active", "expired", "exhausted", "revoked", "stale"];
            };
            readonly validity: {
                readonly enum: readonly ["current", "stale"];
            };
            readonly reasons: {
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
            readonly usage: {
                readonly type: "object";
                readonly properties: {
                    readonly limit: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly used: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly remaining: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly unit: {
                        readonly const: "http-request-attempt";
                    };
                };
                readonly required: readonly ["limit", "used", "remaining", "unit"];
                readonly additionalProperties: false;
            };
            readonly calls: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "connector-call";
                        };
                        readonly source: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly host: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly status: {
                            readonly enum: readonly ["reserved", "succeeded", "failed-or-unknown"];
                        };
                        readonly startedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
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
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeTaskId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeAttemptId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeGeneration: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly requestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly operationKeyDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly requestUrlDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly bytes: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly httpStatus: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly retryAfter: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly error: {
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
                        readonly projectId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly version: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly createdAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly updatedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("version" | "bytes" | "id" | "source" | "requestDigest" | "error" | "createdAt" | "kind" | "status" | "host" | "projectId" | "updatedAt" | "startedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "scopeGeneration" | "operationKeyDigest" | "requestUrlDigest" | "httpStatus" | "retryAfter")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly searchResults: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            readonly required: ("number" | "cursor" | "rawItemCount" | "nextCursor" | "expiresAt" | "previousSearchId" | "nextCursorExpiresAt")[];
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
                                            readonly required: ("id" | "source")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                };
                                readonly required: ("id" | "source" | "title" | "abstract" | "duplicates" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
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
                    readonly required: ("version" | "id" | "createdAt" | "kind" | "status" | "sources" | "query" | "coverage" | "projectId" | "updatedAt" | "settingsVersion" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "retrievedAt" | "items" | "request")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly papers: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "paper-read";
                        };
                        readonly source: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly idInSource: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly requestedId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly title: {
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
                        readonly artifactDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly rawArtifactIds: {
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
                        readonly contentKind: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly fullTextRead: {
                            readonly type: "boolean";
                        };
                        readonly retrievedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
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
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeTaskId: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeAttemptId: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly discoveryCallIds: {
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
                        readonly discoveryRequestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly id: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly projectId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly version: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly createdAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly updatedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("version" | "id" | "source" | "createdAt" | "title" | "kind" | "artifactId" | "contentKind" | "requestedId" | "projectId" | "updatedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "idInSource" | "artifactDigest" | "rawArtifactIds" | "fullTextRead" | "retrievedAt" | "discoveryCallIds" | "discoveryRequestDigest")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly projectId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly version: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly createdAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly updatedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: ("version" | "digest" | "id" | "state" | "sessionId" | "createdAt" | "model" | "kind" | "approvalId" | "sources" | "expiresAt" | "projectId" | "updatedAt" | "validity" | "settingsVersion" | "searches" | "targets" | "allowSearchResults" | "formats" | "maxRequests" | "maxResponseBytes" | "usage" | "effectiveState" | "reasons" | "searchResults" | "calls" | "papers")[];
        readonly additionalProperties: false;
    };
    readonly discovery_grant_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly const: "discovery-grant";
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly taskBinding: {
                readonly type: "object";
                readonly properties: {
                    readonly taskId: {
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
                    readonly teamApprovalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly planDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly planVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly directiveVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly taskSpecDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly teamPlanId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly teamPlanVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly teamPlanDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly role: {
                        readonly const: "literature";
                    };
                };
                readonly required: readonly [];
                readonly additionalProperties: false;
            };
            readonly model: {
                readonly type: "object";
                readonly properties: {
                    readonly provider: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly model: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly thinking: {
                        readonly enum: readonly ["off", "minimal", "low", "medium", "high", "xhigh"];
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly settingsVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly sources: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                };
                readonly minItems: number;
            };
            readonly searches: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            readonly maxItems?: number | undefined;
                            readonly type: "array";
                            readonly items: {
                                readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                            };
                            readonly minItems: number;
                        };
                        readonly limit: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly strategy: {
                            readonly enum: readonly ["keyword", "embedding"];
                        };
                        readonly prioritize: {
                            readonly enum: readonly ["default", "recency", "historical", "popular"];
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
                    readonly required: readonly ["query", "sources", "limit", "strategy", "prioritize"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly targets: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                readonly minItems: number;
            };
            readonly allowSearchResults: {
                readonly type: "boolean";
            };
            readonly formats: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["provider-text", "original-pdf"];
                };
                readonly minItems: number;
            };
            readonly maxRequests: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly maxResponseBytes: {
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
            readonly approvalId: {
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
            readonly state: {
                readonly enum: readonly ["draft", "active", "revoked"];
            };
            readonly activatedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly revokedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly effectiveState: {
                readonly enum: readonly ["draft", "active", "expired", "exhausted", "revoked", "stale"];
            };
            readonly validity: {
                readonly enum: readonly ["current", "stale"];
            };
            readonly reasons: {
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
            readonly usage: {
                readonly type: "object";
                readonly properties: {
                    readonly limit: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly used: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly remaining: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly unit: {
                        readonly const: "http-request-attempt";
                    };
                };
                readonly required: readonly ["limit", "used", "remaining", "unit"];
                readonly additionalProperties: false;
            };
            readonly calls: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "connector-call";
                        };
                        readonly source: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly host: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly status: {
                            readonly enum: readonly ["reserved", "succeeded", "failed-or-unknown"];
                        };
                        readonly startedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
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
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeTaskId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeAttemptId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeGeneration: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly requestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly operationKeyDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly requestUrlDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly bytes: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly httpStatus: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly retryAfter: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly error: {
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
                        readonly projectId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly version: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly createdAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly updatedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("version" | "bytes" | "id" | "source" | "requestDigest" | "error" | "createdAt" | "kind" | "status" | "host" | "projectId" | "updatedAt" | "startedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "scopeGeneration" | "operationKeyDigest" | "requestUrlDigest" | "httpStatus" | "retryAfter")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly searchResults: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            readonly required: ("number" | "cursor" | "rawItemCount" | "nextCursor" | "expiresAt" | "previousSearchId" | "nextCursorExpiresAt")[];
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
                                            readonly required: ("id" | "source")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                };
                                readonly required: ("id" | "source" | "title" | "abstract" | "duplicates" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
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
                    readonly required: ("version" | "id" | "createdAt" | "kind" | "status" | "sources" | "query" | "coverage" | "projectId" | "updatedAt" | "settingsVersion" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "retrievedAt" | "items" | "request")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly papers: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "paper-read";
                        };
                        readonly source: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly idInSource: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly requestedId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly title: {
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
                        readonly artifactDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly rawArtifactIds: {
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
                        readonly contentKind: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly fullTextRead: {
                            readonly type: "boolean";
                        };
                        readonly retrievedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
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
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeTaskId: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeAttemptId: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly discoveryCallIds: {
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
                        readonly discoveryRequestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly id: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly projectId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly version: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly createdAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly updatedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("version" | "id" | "source" | "createdAt" | "title" | "kind" | "artifactId" | "contentKind" | "requestedId" | "projectId" | "updatedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "idInSource" | "artifactDigest" | "rawArtifactIds" | "fullTextRead" | "retrievedAt" | "discoveryCallIds" | "discoveryRequestDigest")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly projectId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly version: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly createdAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly updatedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: ("version" | "digest" | "id" | "state" | "sessionId" | "createdAt" | "model" | "kind" | "approvalId" | "sources" | "expiresAt" | "projectId" | "updatedAt" | "validity" | "settingsVersion" | "searches" | "targets" | "allowSearchResults" | "formats" | "maxRequests" | "maxResponseBytes" | "usage" | "effectiveState" | "reasons" | "searchResults" | "calls" | "papers")[];
        readonly additionalProperties: false;
    };
    readonly discovery_grant_activate: {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly const: "discovery-grant";
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly taskBinding: {
                readonly type: "object";
                readonly properties: {
                    readonly taskId: {
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
                    readonly teamApprovalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly planDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly planVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly directiveVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly taskSpecDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly teamPlanId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly teamPlanVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly teamPlanDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly role: {
                        readonly const: "literature";
                    };
                };
                readonly required: readonly [];
                readonly additionalProperties: false;
            };
            readonly model: {
                readonly type: "object";
                readonly properties: {
                    readonly provider: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly model: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly thinking: {
                        readonly enum: readonly ["off", "minimal", "low", "medium", "high", "xhigh"];
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly settingsVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly sources: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                };
                readonly minItems: number;
            };
            readonly searches: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            readonly maxItems?: number | undefined;
                            readonly type: "array";
                            readonly items: {
                                readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                            };
                            readonly minItems: number;
                        };
                        readonly limit: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly strategy: {
                            readonly enum: readonly ["keyword", "embedding"];
                        };
                        readonly prioritize: {
                            readonly enum: readonly ["default", "recency", "historical", "popular"];
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
                    readonly required: readonly ["query", "sources", "limit", "strategy", "prioritize"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly targets: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                readonly minItems: number;
            };
            readonly allowSearchResults: {
                readonly type: "boolean";
            };
            readonly formats: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["provider-text", "original-pdf"];
                };
                readonly minItems: number;
            };
            readonly maxRequests: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly maxResponseBytes: {
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
            readonly approvalId: {
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
            readonly state: {
                readonly enum: readonly ["draft", "active", "revoked"];
            };
            readonly activatedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly revokedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly effectiveState: {
                readonly enum: readonly ["draft", "active", "expired", "exhausted", "revoked", "stale"];
            };
            readonly validity: {
                readonly enum: readonly ["current", "stale"];
            };
            readonly reasons: {
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
            readonly usage: {
                readonly type: "object";
                readonly properties: {
                    readonly limit: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly used: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly remaining: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly unit: {
                        readonly const: "http-request-attempt";
                    };
                };
                readonly required: readonly ["limit", "used", "remaining", "unit"];
                readonly additionalProperties: false;
            };
            readonly calls: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "connector-call";
                        };
                        readonly source: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly host: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly status: {
                            readonly enum: readonly ["reserved", "succeeded", "failed-or-unknown"];
                        };
                        readonly startedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
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
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeTaskId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeAttemptId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeGeneration: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly requestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly operationKeyDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly requestUrlDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly bytes: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly httpStatus: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly retryAfter: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly error: {
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
                        readonly projectId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly version: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly createdAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly updatedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("version" | "bytes" | "id" | "source" | "requestDigest" | "error" | "createdAt" | "kind" | "status" | "host" | "projectId" | "updatedAt" | "startedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "scopeGeneration" | "operationKeyDigest" | "requestUrlDigest" | "httpStatus" | "retryAfter")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly searchResults: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            readonly required: ("number" | "cursor" | "rawItemCount" | "nextCursor" | "expiresAt" | "previousSearchId" | "nextCursorExpiresAt")[];
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
                                            readonly required: ("id" | "source")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                };
                                readonly required: ("id" | "source" | "title" | "abstract" | "duplicates" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
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
                    readonly required: ("version" | "id" | "createdAt" | "kind" | "status" | "sources" | "query" | "coverage" | "projectId" | "updatedAt" | "settingsVersion" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "retrievedAt" | "items" | "request")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly papers: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "paper-read";
                        };
                        readonly source: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly idInSource: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly requestedId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly title: {
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
                        readonly artifactDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly rawArtifactIds: {
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
                        readonly contentKind: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly fullTextRead: {
                            readonly type: "boolean";
                        };
                        readonly retrievedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
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
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeTaskId: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeAttemptId: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly discoveryCallIds: {
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
                        readonly discoveryRequestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly id: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly projectId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly version: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly createdAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly updatedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("version" | "id" | "source" | "createdAt" | "title" | "kind" | "artifactId" | "contentKind" | "requestedId" | "projectId" | "updatedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "idInSource" | "artifactDigest" | "rawArtifactIds" | "fullTextRead" | "retrievedAt" | "discoveryCallIds" | "discoveryRequestDigest")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly projectId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly version: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly createdAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly updatedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: ("version" | "digest" | "id" | "state" | "sessionId" | "createdAt" | "model" | "kind" | "approvalId" | "sources" | "expiresAt" | "projectId" | "updatedAt" | "validity" | "settingsVersion" | "searches" | "targets" | "allowSearchResults" | "formats" | "maxRequests" | "maxResponseBytes" | "usage" | "effectiveState" | "reasons" | "searchResults" | "calls" | "papers")[];
        readonly additionalProperties: false;
    };
    readonly discovery_grant_revoke: {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly const: "discovery-grant";
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly taskBinding: {
                readonly type: "object";
                readonly properties: {
                    readonly taskId: {
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
                    readonly teamApprovalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly planDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly planVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly directiveVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly taskSpecDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly teamPlanId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly teamPlanVersion: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly teamPlanDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly role: {
                        readonly const: "literature";
                    };
                };
                readonly required: readonly [];
                readonly additionalProperties: false;
            };
            readonly model: {
                readonly type: "object";
                readonly properties: {
                    readonly provider: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly model: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly thinking: {
                        readonly enum: readonly ["off", "minimal", "low", "medium", "high", "xhigh"];
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly settingsVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly sources: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                };
                readonly minItems: number;
            };
            readonly searches: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            readonly maxItems?: number | undefined;
                            readonly type: "array";
                            readonly items: {
                                readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                            };
                            readonly minItems: number;
                        };
                        readonly limit: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly strategy: {
                            readonly enum: readonly ["keyword", "embedding"];
                        };
                        readonly prioritize: {
                            readonly enum: readonly ["default", "recency", "historical", "popular"];
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
                    readonly required: readonly ["query", "sources", "limit", "strategy", "prioritize"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly targets: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                readonly minItems: number;
            };
            readonly allowSearchResults: {
                readonly type: "boolean";
            };
            readonly formats: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["provider-text", "original-pdf"];
                };
                readonly minItems: number;
            };
            readonly maxRequests: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly maxResponseBytes: {
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
            readonly approvalId: {
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
            readonly state: {
                readonly enum: readonly ["draft", "active", "revoked"];
            };
            readonly activatedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly revokedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly effectiveState: {
                readonly enum: readonly ["draft", "active", "expired", "exhausted", "revoked", "stale"];
            };
            readonly validity: {
                readonly enum: readonly ["current", "stale"];
            };
            readonly reasons: {
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
            readonly usage: {
                readonly type: "object";
                readonly properties: {
                    readonly limit: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly used: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly remaining: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly unit: {
                        readonly const: "http-request-attempt";
                    };
                };
                readonly required: readonly ["limit", "used", "remaining", "unit"];
                readonly additionalProperties: false;
            };
            readonly calls: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "connector-call";
                        };
                        readonly source: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly host: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly status: {
                            readonly enum: readonly ["reserved", "succeeded", "failed-or-unknown"];
                        };
                        readonly startedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
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
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeTaskId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeAttemptId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly scopeGeneration: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly requestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly operationKeyDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly requestUrlDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly bytes: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly httpStatus: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly retryAfter: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly error: {
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
                        readonly projectId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly version: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly createdAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly updatedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("version" | "bytes" | "id" | "source" | "requestDigest" | "error" | "createdAt" | "kind" | "status" | "host" | "projectId" | "updatedAt" | "startedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "scopeGeneration" | "operationKeyDigest" | "requestUrlDigest" | "httpStatus" | "retryAfter")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly searchResults: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
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
                            readonly required: ("number" | "cursor" | "rawItemCount" | "nextCursor" | "expiresAt" | "previousSearchId" | "nextCursorExpiresAt")[];
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
                                            readonly required: ("id" | "source")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                };
                                readonly required: ("id" | "source" | "title" | "abstract" | "duplicates" | "contentKind" | "fullTextRead" | "url" | "publicationDate")[];
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
                    readonly required: ("version" | "id" | "createdAt" | "kind" | "status" | "sources" | "query" | "coverage" | "projectId" | "updatedAt" | "settingsVersion" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "retrievedAt" | "items" | "request")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly papers: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "paper-read";
                        };
                        readonly source: {
                            readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly idInSource: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly requestedId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly title: {
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
                        readonly artifactDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly rawArtifactIds: {
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
                        readonly contentKind: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly fullTextRead: {
                            readonly type: "boolean";
                        };
                        readonly retrievedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
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
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeTaskId: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly scopeAttemptId: {
                            readonly anyOf: readonly [{
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly discoveryCallIds: {
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
                        readonly discoveryRequestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly id: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly projectId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly version: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly createdAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly updatedAt: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("version" | "id" | "source" | "createdAt" | "title" | "kind" | "artifactId" | "contentKind" | "requestedId" | "projectId" | "updatedAt" | "discoveryGrant" | "scopeSessionId" | "scopeTaskId" | "scopeAttemptId" | "idInSource" | "artifactDigest" | "rawArtifactIds" | "fullTextRead" | "retrievedAt" | "discoveryCallIds" | "discoveryRequestDigest")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly projectId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly version: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly createdAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly updatedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: ("version" | "digest" | "id" | "state" | "sessionId" | "createdAt" | "model" | "kind" | "approvalId" | "sources" | "expiresAt" | "projectId" | "updatedAt" | "validity" | "settingsVersion" | "searches" | "targets" | "allowSearchResults" | "formats" | "maxRequests" | "maxResponseBytes" | "usage" | "effectiveState" | "reasons" | "searchResults" | "calls" | "papers")[];
        readonly additionalProperties: false;
    };
};
