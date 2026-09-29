import { type InferSchema } from './schema.js';
/** Shape/primitive validation is shared; permissions, filesystem checks and state-dependent limits stay in services. */
export declare const INPUT_SCHEMAS: {
    readonly research_skill_list: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly research_skill_read: {
        readonly type: "object";
        readonly properties: {
            readonly skillId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly resource: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["skillId"];
        readonly additionalProperties: false;
    };
    readonly connector_status: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly literature_discover: {
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
    readonly paper_read: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly source: {
                readonly enum: readonly ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
            };
        };
        readonly required: readonly ["id"];
        readonly additionalProperties: false;
    };
    readonly campaign_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly campaignId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["campaignId"];
        readonly additionalProperties: false;
    };
    readonly campaign_enroll: {
        readonly type: "object";
        readonly properties: {
            readonly campaignId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly intentId: {
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
            readonly required: {
                readonly anyOf: readonly [{
                    readonly type: "boolean";
                }, {
                    readonly type: "null";
                }];
            };
            readonly repairDecisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["campaignId", "intentId", "expectedVersion"];
        readonly additionalProperties: false;
    };
    readonly campaign_decision_submit: {
        readonly type: "object";
        readonly properties: {
            readonly campaignId: {
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
            readonly action: {
                readonly enum: readonly ["repair", "refill", "promote", "stop"];
            };
            readonly observationIds: {
                readonly minItems: 1;
                readonly uniqueItems: true;
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly reason: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly selectedRunId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly candidates: {
                readonly anyOf: readonly [{
                    readonly maxItems?: number | undefined;
                    readonly type: "array";
                    readonly items: {
                        readonly anyOf: readonly [{
                            readonly type: "object";
                            readonly properties: {
                                readonly title: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly hypothesis: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly config: {
                                    readonly type: "object";
                                    readonly additionalProperties: {
                                        description: string;
                                    };
                                };
                                readonly implementation: {
                                    readonly const: "config";
                                };
                            };
                            readonly required: readonly ["title", "hypothesis", "config"];
                            readonly additionalProperties: false;
                        }, {
                            readonly type: "object";
                            readonly properties: {
                                readonly title: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly hypothesis: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly implementation: {
                                    readonly const: "reviewed-code";
                                };
                                readonly config: {
                                    readonly type: "object";
                                    readonly properties: {};
                                    readonly required: readonly never[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly required: readonly ["title", "hypothesis", "implementation"];
                            readonly additionalProperties: false;
                        }];
                    };
                    readonly minItems: number;
                }, {
                    readonly type: "null";
                }];
            };
            readonly experimentPlan: {
                readonly type: "object";
                readonly properties: {
                    readonly hypothesis: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly controlRunIds: {
                        readonly uniqueItems: true;
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
                    readonly changedFactors: {
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
                    readonly dataSplit: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly dataArtifactIds: {
                        readonly uniqueItems: true;
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
                    readonly primaryMetric: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly guardrailMetrics: {
                        readonly uniqueItems: true;
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
                    readonly repetitions: {
                        readonly type: "object";
                        readonly properties: {
                            readonly count: {
                                readonly type: "integer";
                                readonly minimum: number;
                                readonly maximum: number;
                            };
                            readonly rationale: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: readonly ["count", "rationale"];
                        readonly additionalProperties: false;
                    };
                    readonly successCriteria: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly inconclusiveCriteria: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly stoppingCriteria: {
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
                };
                readonly required: readonly ["hypothesis", "controlRunIds", "changedFactors", "dataSplit", "dataArtifactIds", "primaryMetric", "guardrailMetrics", "repetitions", "successCriteria", "inconclusiveCriteria", "stoppingCriteria"];
                readonly additionalProperties: false;
            };
        };
        readonly required: readonly ["campaignId", "expectedVersion", "action", "observationIds", "reason"];
        readonly additionalProperties: false;
    };
    readonly change_proposal_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly testJobId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly baseExperimentId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly expectedRevision: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly title: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly hypothesis: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly changes: {
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
                        readonly artifactId: {
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
                        readonly expectedDigest: {
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
                    };
                    readonly required: readonly ["path", "artifactId", "expectedDigest"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
        };
        readonly required: readonly ["baseExperimentId", "expectedRevision", "title", "hypothesis", "changes"];
        readonly additionalProperties: false;
    };
    readonly reviewed_change_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly reviewId: {
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
            readonly hypothesis: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["reviewId", "title", "hypothesis"];
        readonly additionalProperties: false;
    };
    readonly artifact_read: {
        readonly type: "object";
        readonly properties: {
            readonly artifactId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly cursor: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["artifactId"];
        readonly additionalProperties: false;
    };
    readonly session_notice_read: {
        readonly type: "object";
        readonly properties: {
            readonly messageId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly cursor: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["messageId"];
        readonly additionalProperties: false;
    };
    readonly project_inspect: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly workspace_list: {
        readonly type: "object";
        readonly properties: {
            readonly source: {
                readonly anyOf: readonly [{
                    readonly enum: readonly ["session", "project"];
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly "source"[];
        readonly additionalProperties: false;
    };
    readonly text_evidence_search: {
        readonly type: "object";
        readonly properties: {
            readonly query: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly artifactIds: {
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
            readonly corpusId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly configurationVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
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
            readonly mmrLambda: {
                readonly maximum?: number | undefined;
                readonly minimum?: number | undefined;
                readonly type: "number";
            };
            readonly deduplicateExact: {
                readonly anyOf: readonly [{
                    readonly type: "boolean";
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["query"];
        readonly additionalProperties: false;
    };
    readonly workspace_read: {
        readonly type: "object";
        readonly properties: {
            readonly path: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly source: {
                readonly anyOf: readonly [{
                    readonly enum: readonly ["session", "project"];
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["path"];
        readonly additionalProperties: false;
    };
    readonly workspace_write: {
        readonly type: "object";
        readonly properties: {
            readonly path: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly content: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly expectedDigest: {
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
            readonly source: {
                readonly description: "Project writes require a user actor; agents can write only their session workspace.";
                readonly anyOf: readonly [{
                    readonly enum: readonly ["session", "project"];
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["path", "content", "expectedDigest"];
        readonly additionalProperties: false;
    };
    readonly evidence_read: {
        readonly type: "object";
        readonly properties: {
            readonly evidenceId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["evidenceId"];
        readonly additionalProperties: false;
    };
    readonly evidence_register: {
        readonly type: "object";
        readonly properties: {
            readonly artifactId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
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
        readonly required: readonly ["artifactId", "start", "end", "description"];
        readonly additionalProperties: false;
    };
    readonly artifact_create: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly content: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly mediaType: {
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
        };
        readonly required: readonly ["title", "content"];
        readonly additionalProperties: false;
    };
    readonly literature_search: {
        readonly type: "object";
        readonly properties: {
            readonly query: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
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
        };
        readonly required: readonly ["query"];
        readonly additionalProperties: false;
    };
    readonly experiment_plan_submit: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly hypothesis: {
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
            readonly parentId: {
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
            readonly config: {
                readonly type: "object";
                readonly additionalProperties: {
                    description: string;
                };
                readonly description: "Runner-specific experiment configuration; schema validation does not apply defaults or coerce values.";
            };
            readonly contract: {
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly runner: {
                            readonly enum: readonly ["trusted-example", "docker"];
                        };
                        readonly image: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly command: {
                            readonly maxItems?: number | undefined;
                            readonly type: "array";
                            readonly items: {
                                readonly pattern: "^[^\0]*$";
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly minItems: number;
                        };
                        readonly environment: {
                            readonly type: "object";
                            readonly properties: {};
                            readonly required: readonly never[];
                            readonly additionalProperties: false;
                        };
                        readonly datasetVersion: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly evaluationProtocolVersion: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly metrics: {
                            readonly type: "object";
                            readonly minProperties: 1;
                            readonly propertyNames: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly additionalProperties: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly unit: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                    readonly direction: {
                                        readonly enum: readonly ["min", "max"];
                                    };
                                };
                                readonly required: readonly ["unit", "direction"];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly expectedArtifacts: {
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
                        readonly timeoutSeconds: {
                            readonly anyOf: readonly [{
                                readonly type: "integer";
                                readonly minimum: number;
                                readonly maximum: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly cpus: {
                            readonly anyOf: readonly [{
                                readonly type: "integer";
                                readonly minimum: number;
                                readonly maximum: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly memoryMb: {
                            readonly anyOf: readonly [{
                                readonly type: "integer";
                                readonly minimum: number;
                                readonly maximum: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly dockerContext: {
                            readonly pattern: "^[A-Za-z0-9][A-Za-z0-9_.-]*$";
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly pids: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly workMb: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly logBytes: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly outputBytes: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly networkPolicy: {
                            readonly const: "none";
                        };
                    };
                    readonly required: readonly ["runner", "command", "datasetVersion", "evaluationProtocolVersion", "metrics", "expectedArtifacts"];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["title"];
        readonly additionalProperties: false;
    };
    readonly run_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly experimentId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["experimentId"];
        readonly additionalProperties: false;
    };
    readonly run_submit: {
        readonly type: "object";
        readonly properties: {
            readonly intentId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["intentId"];
        readonly additionalProperties: false;
    };
    readonly run_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly runId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["runId"];
        readonly additionalProperties: false;
    };
    readonly run_logs: {
        readonly type: "object";
        readonly properties: {
            readonly runId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly cursor: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                }, {
                    readonly type: "null";
                }];
            };
            readonly stream: {
                readonly enum: readonly ["stdout", "stderr"];
            };
            readonly identity: {
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
        };
        readonly required: readonly ["runId"];
        readonly additionalProperties: false;
    };
    readonly run_source_list: {
        readonly type: "object";
        readonly properties: {
            readonly runId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["runId"];
        readonly additionalProperties: false;
    };
    readonly run_source_read: {
        readonly type: "object";
        readonly properties: {
            readonly runId: {
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
        readonly required: readonly ["runId", "path"];
        readonly additionalProperties: false;
    };
    readonly approval_request: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly collaboration_plan_submit: {
        readonly type: "object";
        readonly properties: {
            readonly goal: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly tasks: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly key: {
                            readonly pattern: "^[a-zA-Z0-9_-]+$";
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly role: {
                            readonly enum: readonly ["literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                        };
                        readonly objective: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly dependencies: {
                            readonly anyOf: readonly [{
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
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly critical: {
                            readonly type: "boolean";
                        };
                        readonly required: {
                            readonly type: "boolean";
                        };
                        readonly inputEvidenceIds: {
                            readonly anyOf: readonly [{
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
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly skillIds: {
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
                        readonly reviewOf: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly expectedOutputs: {
                            readonly maxItems?: number | undefined;
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly kind: {
                                        readonly enum: readonly ["report", "dataset", "patch", "analysis", "review", "code", "text"];
                                    };
                                    readonly schemaId: {
                                        readonly enum: readonly ["report", "text", "csv", "json", "patch", "code", "review"];
                                    };
                                    readonly required: {
                                        readonly anyOf: readonly [{
                                            readonly type: "boolean";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly minBytes: {
                                        readonly anyOf: readonly [{
                                            readonly type: "integer";
                                            readonly minimum: number;
                                            readonly maximum: number;
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly title: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                    readonly mediaType: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                };
                                readonly required: readonly ["kind", "schemaId"];
                                readonly additionalProperties: false;
                            };
                            readonly minItems: number;
                        };
                        readonly acceptanceRuleIds: {
                            readonly anyOf: readonly [{
                                readonly maxItems?: number | undefined;
                                readonly type: "array";
                                readonly items: {
                                    readonly enum: readonly ["artifact-required", "evidence-required", "claims-evidenced"];
                                };
                                readonly minItems: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: readonly ["key", "role", "objective"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly budget: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                }, {
                    readonly type: "null";
                }];
            };
            readonly autoSummarize: {
                readonly anyOf: readonly [{
                    readonly type: "boolean";
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["goal", "tasks"];
        readonly additionalProperties: false;
    };
    readonly agent_delegate: {
        readonly type: "object";
        readonly properties: {
            readonly goal: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly tasks: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly key: {
                            readonly pattern: "^[a-zA-Z0-9_-]+$";
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly role: {
                            readonly enum: readonly ["literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                        };
                        readonly objective: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly dependencies: {
                            readonly anyOf: readonly [{
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
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly critical: {
                            readonly type: "boolean";
                        };
                        readonly required: {
                            readonly type: "boolean";
                        };
                        readonly inputEvidenceIds: {
                            readonly anyOf: readonly [{
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
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly skillIds: {
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
                        readonly reviewOf: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly expectedOutputs: {
                            readonly maxItems?: number | undefined;
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly kind: {
                                        readonly enum: readonly ["report", "dataset", "patch", "analysis", "review", "code", "text"];
                                    };
                                    readonly schemaId: {
                                        readonly enum: readonly ["report", "text", "csv", "json", "patch", "code", "review"];
                                    };
                                    readonly required: {
                                        readonly anyOf: readonly [{
                                            readonly type: "boolean";
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly minBytes: {
                                        readonly anyOf: readonly [{
                                            readonly type: "integer";
                                            readonly minimum: number;
                                            readonly maximum: number;
                                        }, {
                                            readonly type: "null";
                                        }];
                                    };
                                    readonly title: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                    readonly mediaType: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                };
                                readonly required: readonly ["kind", "schemaId"];
                                readonly additionalProperties: false;
                            };
                            readonly minItems: number;
                        };
                        readonly acceptanceRuleIds: {
                            readonly anyOf: readonly [{
                                readonly maxItems?: number | undefined;
                                readonly type: "array";
                                readonly items: {
                                    readonly enum: readonly ["artifact-required", "evidence-required", "claims-evidenced"];
                                };
                                readonly minItems: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: readonly ["key", "role", "objective"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly budget: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                }, {
                    readonly type: "null";
                }];
            };
            readonly autoSummarize: {
                readonly anyOf: readonly [{
                    readonly type: "boolean";
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: readonly ["goal", "tasks"];
        readonly additionalProperties: false;
    };
    readonly task_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly teamId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly "teamId"[];
        readonly additionalProperties: false;
    };
    readonly task_result_read: {
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
    readonly task_context_read: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly task_progress_report: {
        readonly type: "object";
        readonly properties: {
            readonly message: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["message"];
        readonly additionalProperties: false;
    };
    readonly task_result_submit: {
        readonly type: "object";
        readonly properties: {
            readonly summary: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly outcome: {
                readonly enum: readonly ["completed", "partial", "blocked"];
            };
            readonly evidenceIds: {
                readonly anyOf: readonly [{
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
                }, {
                    readonly type: "null";
                }];
            };
            readonly artifactIds: {
                readonly anyOf: readonly [{
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
                }, {
                    readonly type: "null";
                }];
            };
            readonly claims: {
                readonly anyOf: readonly [{
                    readonly maxItems?: number | undefined;
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly statement: {
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
                            readonly limitations: {
                                readonly anyOf: readonly [{
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
                                }, {
                                    readonly type: "null";
                                }];
                            };
                        };
                        readonly required: readonly ["statement", "evidenceIds"];
                        readonly additionalProperties: false;
                    };
                    readonly minItems: number;
                }, {
                    readonly type: "null";
                }];
            };
            readonly unresolvedQuestions: {
                readonly anyOf: readonly [{
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
                }, {
                    readonly type: "null";
                }];
            };
            readonly verdict: {
                readonly enum: readonly ["accept", "reject", "disputed"];
            };
        };
        readonly required: readonly ["summary", "outcome"];
        readonly additionalProperties: false;
    };
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
    readonly experiment_source_list: {
        readonly type: "object";
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly experimentId: {
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
            };
            readonly required: readonly ["experimentId", "revision"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
                readonly snapshotId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["snapshotId"];
            readonly additionalProperties: false;
        }];
    };
    readonly experiment_source_read: {
        readonly type: "object";
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
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
            } & {
                readonly experimentId: {
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
            };
            readonly required: readonly ["experimentId", "revision", "path"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
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
            } & {
                readonly snapshotId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["snapshotId", "path"];
            readonly additionalProperties: false;
        }];
    };
    readonly experiment_source_diff: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "object";
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly experimentId: {
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
                    };
                    readonly required: readonly ["experimentId", "revision"];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly snapshotId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["snapshotId"];
                    readonly additionalProperties: false;
                }];
            };
            readonly to: {
                readonly type: "object";
                readonly anyOf: readonly [{
                    readonly type: "object";
                    readonly properties: {
                        readonly experimentId: {
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
                    };
                    readonly required: readonly ["experimentId", "revision"];
                    readonly additionalProperties: false;
                }, {
                    readonly type: "object";
                    readonly properties: {
                        readonly snapshotId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["snapshotId"];
                    readonly additionalProperties: false;
                }];
            };
        };
        readonly required: readonly ["from", "to"];
        readonly additionalProperties: false;
    };
    readonly workspace_prepare_from_revision: {
        readonly type: "object";
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly experimentId: {
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
            };
            readonly required: readonly ["experimentId", "revision"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
                readonly snapshotId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["snapshotId"];
            readonly additionalProperties: false;
        }];
    };
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
            readonly limit: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
        };
        readonly required: readonly ("query" | "limit" | "role" | "beforeSessionId")[];
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
    readonly compute_target_probe: {
        readonly type: "object";
        readonly properties: {
            readonly context: {
                readonly pattern: "^[A-Za-z0-9][A-Za-z0-9._-]*$";
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["context"];
        readonly additionalProperties: false;
    };
    readonly compute_queue_inspect: {
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
    readonly compute_capacity_configure: {
        readonly type: "object";
        readonly properties: {
            readonly expectedVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly targetId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly limits: {
                readonly minProperties: 1;
                readonly type: "object";
                readonly properties: {
                    maxRuns: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    maxDevelopment: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    maxJobs: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    cpus: {
                        readonly anyOf: readonly [{
                            readonly maximum?: number | undefined;
                            readonly minimum?: number | undefined;
                            readonly type: "number";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    memoryMb: {
                        readonly anyOf: readonly [{
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        }, {
                            readonly type: "null";
                        }];
                    };
                    maxQueued: {
                        readonly anyOf: readonly [{
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        }, {
                            readonly type: "null";
                        }];
                    };
                };
                readonly required: readonly ("maxRuns" | "cpus" | "memoryMb" | "maxDevelopment" | "maxJobs" | "maxQueued")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: readonly ["expectedVersion", "limits"];
        readonly additionalProperties: false;
    };
    readonly agent_capacity_inspect: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly agent_capacity_configure: {
        readonly type: "object";
        readonly properties: {
            readonly expectedVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly maxWorkers: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
        };
        readonly required: readonly ["expectedVersion", "maxWorkers"];
        readonly additionalProperties: false;
    };
    readonly model_http_inspect: {
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
    readonly model_http_configure: {
        readonly type: "object";
        readonly properties: {
            readonly expectedVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly maxRequests: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
        };
        readonly required: readonly ["expectedVersion", "maxRequests"];
        readonly additionalProperties: false;
    };
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
    readonly workspace_history_inspect: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly workspace_history_diff: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly workspace_history_commit: {
        readonly type: "object";
        readonly properties: {
            readonly expectedHead: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly message: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["expectedHead", "message"];
        readonly additionalProperties: false;
    };
    readonly workspace_history_set_mode: {
        readonly type: "object";
        readonly properties: {
            readonly path: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly mode: {
                readonly enum: readonly ["100644", "100755"];
            };
            readonly expectedSourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
        };
        readonly required: readonly ["path", "mode", "expectedSourceDigest"];
        readonly additionalProperties: false;
    };
    readonly workspace_history_operation: {
        readonly type: "object";
        readonly properties: {
            readonly operationId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["operationId"];
        readonly additionalProperties: false;
    };
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
        readonly required: readonly ["sessionId", "searches", "targets", "allowSearchResults", "formats", "maxRequests", "maxResponseBytes", "expiresAt"];
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
    readonly run_grant_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly intentIds: {
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
            readonly maxRuns: {
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
        readonly required: readonly ["sessionId", "intentIds", "maxRuns", "expiresAt"];
        readonly additionalProperties: false;
    };
    readonly run_grant_inspect: {
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
    readonly run_grant_activate: {
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
    readonly run_grant_revoke: {
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
    readonly working_grant_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly developmentTaskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly editablePaths: {
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
            readonly maxTests: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly maxChangedBytes: {
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
        readonly required: readonly ["developmentTaskId", "editablePaths", "maxTests", "maxChangedBytes", "expiresAt"];
        readonly additionalProperties: false;
    };
    readonly working_grant_inspect: {
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
    readonly working_grant_activate: {
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
    readonly working_grant_revoke: {
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
    readonly development_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly title: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly command: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly pattern: "^[^\0]*$";
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly minItems: number;
            };
            readonly environmentImageDigest: {
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                minLength: number;
                maxLength: number;
            };
            readonly dockerContext: {
                readonly pattern: "^[a-zA-Z0-9][a-zA-Z0-9_.-]*$";
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly resources: {
                readonly type: "object";
                readonly properties: {
                    readonly cpus: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly memoryMb: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly pids: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly timeoutSeconds: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly workMb: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly outputBytes: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly logBytes: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: readonly [];
                readonly additionalProperties: false;
            };
            readonly deadline: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly expectedArtifacts: {
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
            readonly dataArtifactIds: {
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
        readonly required: readonly ["command", "environmentImageDigest"];
        readonly additionalProperties: false;
    };
    readonly development_submit: {
        readonly type: "object";
        readonly properties: {
            readonly developmentTaskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["developmentTaskId"];
        readonly additionalProperties: false;
    };
    readonly development_inspect: {
        readonly type: "object";
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly developmentTaskId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["developmentTaskId"];
            readonly additionalProperties: false;
        }, {
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
        }];
    };
    readonly development_logs: {
        readonly type: "object";
        readonly properties: {
            readonly jobId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly stream: {
                readonly enum: readonly ["stdout", "stderr"];
            };
            readonly cursor: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly identity: {
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
        };
        readonly required: readonly ["jobId"];
        readonly additionalProperties: false;
    };
    readonly development_cancel: {
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
        readonly required: readonly ["resultId", "rootSessionId"];
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
        readonly required: readonly ("limit" | "cursor" | "revisionId")[];
        readonly additionalProperties: false;
    };
    readonly skill_package_import: {
        readonly type: "object";
        readonly properties: {
            readonly packageId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly revisionTag: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly description: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly roles: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                };
                readonly minItems: number;
            };
            readonly license: {
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
            readonly requirements: {
                readonly type: "object";
                readonly properties: {
                    readonly tools: {
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
                    readonly backends: {
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
                    readonly artifactIds: {
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
                readonly required: readonly ["tools", "backends", "artifactIds"];
                readonly additionalProperties: false;
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
        readonly required: readonly ["packageId", "revisionTag", "description", "roles", "license", "requirements"];
        readonly additionalProperties: false;
    };
    readonly skill_package_list: {
        readonly type: "object";
        readonly properties: {};
        readonly required: readonly never[];
        readonly additionalProperties: false;
    };
    readonly skill_package_inspect: {
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
    readonly skill_package_read: {
        readonly type: "object";
        readonly properties: {
            readonly revisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly resource: {
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
    readonly skill_package_review: {
        readonly type: "object";
        readonly properties: {
            readonly revisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly decision: {
                readonly enum: readonly ["approved", "rejected"];
            };
            readonly note: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["revisionId", "decision", "note"];
        readonly additionalProperties: false;
    };
    readonly skill_package_revoke: {
        readonly type: "object";
        readonly properties: {
            readonly revisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly note: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["revisionId", "note"];
        readonly additionalProperties: false;
    };
    readonly skill_bundle_configure: {
        readonly type: "object";
        readonly properties: {
            readonly expectedVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly revisionIds: {
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
            readonly bundleId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly builtinBundleId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["expectedVersion"];
        readonly additionalProperties: false;
    };
    readonly skill_session_select: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
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
            readonly skillIds: {
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
        readonly required: readonly ["sessionId", "expectedVersion", "skillIds"];
        readonly additionalProperties: false;
    };
    readonly skill_preflight: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["sessionId"];
        readonly additionalProperties: false;
    };
    readonly campaign_plan_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly planRevisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["planRevisionId"];
        readonly additionalProperties: false;
    };
    readonly campaign_candidate_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly candidateId: {
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
        };
        readonly required: readonly ["candidateId", "sessionId"];
        readonly additionalProperties: false;
    };
    readonly campaign_candidate_attach: {
        readonly type: "object";
        readonly properties: {
            readonly candidateId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly proposalId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["candidateId", "proposalId"];
        readonly additionalProperties: false;
    };
    readonly campaign_comparison: {
        readonly type: "object";
        readonly properties: {
            readonly campaignId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["campaignId"];
        readonly additionalProperties: false;
    };
};
export type OperationInput<N extends keyof typeof INPUT_SCHEMAS> = InferSchema<(typeof INPUT_SCHEMAS)[N]>;
