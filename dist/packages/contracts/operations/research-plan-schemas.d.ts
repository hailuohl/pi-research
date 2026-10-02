export declare const RESEARCH_CANDIDATE_INPUT_SCHEMA: {
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
export declare const EXPERIMENT_PLAN_INPUT_SCHEMA: {
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
export declare const PLAN_SOURCE_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly snapshotId: {
            readonly type: "string";
        };
        readonly experimentId: {
            readonly type: "string";
        };
        readonly revision: {
            readonly type: "integer";
        };
        readonly sourceDigest: {
            readonly type: "string";
        };
    };
    readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
    readonly additionalProperties: false;
};
export declare const RESEARCH_CANDIDATE_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly id: {
            readonly type: "string";
        };
        readonly kind: {
            readonly const: "research-candidate";
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
        readonly campaignId: {
            readonly type: "string";
        };
        readonly roundId: {
            readonly type: "string";
        };
        readonly planRevisionId: {
            readonly type: "string";
        };
        readonly decisionId: {
            readonly type: "string";
        };
        readonly spec: {
            readonly type: "object";
            readonly properties: {
                readonly title: {
                    readonly type: "string";
                };
                readonly hypothesis: {
                    readonly type: "string";
                };
                readonly config: {
                    readonly type: "object";
                    readonly additionalProperties: {
                        description: string;
                    };
                };
                readonly implementation: {
                    readonly enum: readonly ["config", "reviewed-code"];
                };
            };
            readonly required: ("title" | "hypothesis")[];
            readonly additionalProperties: false;
        };
        readonly parentSource: {
            readonly type: "object";
            readonly properties: {
                readonly snapshotId: {
                    readonly type: "string";
                };
                readonly experimentId: {
                    readonly type: "string";
                };
                readonly revision: {
                    readonly type: "integer";
                };
                readonly sourceDigest: {
                    readonly type: "string";
                };
            };
            readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
            readonly additionalProperties: false;
        };
        readonly state: {
            readonly enum: readonly ["awaiting_implementation", "prepared"];
        };
        readonly sessionId: {
            readonly type: "string";
        };
        readonly proposalId: {
            readonly type: "string";
        };
        readonly testJobId: {
            readonly type: "string";
        };
        readonly reviewId: {
            readonly type: "string";
        };
        readonly reviewAcceptanceId: {
            readonly type: "string";
        };
        readonly experimentId: {
            readonly type: "string";
        };
        readonly intentId: {
            readonly type: "string";
        };
        readonly repairOfMemberId: {
            readonly type: "string";
        };
        readonly repairRootMemberId: {
            readonly type: "string";
        };
        readonly integrationApprovalId: {
            readonly type: "string";
        };
        readonly testApprovalId: {
            readonly type: "string";
        };
        readonly reviewApprovalId: {
            readonly type: "string";
        };
        readonly runApprovalId: {
            readonly type: "string";
        };
    };
    readonly required: ("id" | "state" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "campaignId" | "roundId" | "planRevisionId" | "decisionId" | "spec" | "parentSource")[];
    readonly additionalProperties: false;
};
export declare const EXPERIMENT_PLAN_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly id: {
            readonly type: "string";
        };
        readonly kind: {
            readonly const: "experiment-plan-revision";
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
        readonly campaignId: {
            readonly type: "string";
        };
        readonly roundId: {
            readonly type: "string";
        };
        readonly decisionId: {
            readonly type: "string";
        };
        readonly parentSource: {
            readonly type: "object";
            readonly properties: {
                readonly snapshotId: {
                    readonly type: "string";
                };
                readonly experimentId: {
                    readonly type: "string";
                };
                readonly revision: {
                    readonly type: "integer";
                };
                readonly sourceDigest: {
                    readonly type: "string";
                };
            };
            readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
            readonly additionalProperties: false;
        };
        readonly contractDigest: {
            readonly type: "string";
        };
        readonly campaignApprovalId: {
            readonly type: "string";
        };
        readonly campaignPlanDigest: {
            readonly type: "string";
        };
        readonly decisionApprovalId: {
            readonly type: "string";
        };
        readonly controlBindings: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly runId: {
                        readonly type: "string";
                    };
                    readonly contentDigest: {
                        readonly type: "string";
                    };
                    readonly intentId: {
                        readonly type: "string";
                    };
                    readonly approvalId: {
                        readonly type: "string";
                    };
                    readonly manifestDigest: {
                        readonly type: "string";
                    };
                    readonly sourceDigest: {
                        readonly type: "string";
                    };
                };
                readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                readonly additionalProperties: false;
            };
        };
        readonly dataBindings: {
            readonly type: "array";
            readonly items: {
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
                    readonly sourceAcceptanceId: {
                        readonly type: "string";
                    };
                    readonly taskApprovals: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly teamId: {
                                    readonly type: "string";
                                };
                                readonly approvalId: {
                                    readonly type: "string";
                                };
                                readonly planDigest: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("approvalId" | "teamId" | "planDigest")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly run: {
                        readonly type: "object";
                        readonly properties: {
                            readonly runId: {
                                readonly type: "string";
                            };
                            readonly contentDigest: {
                                readonly type: "string";
                            };
                            readonly intentId: {
                                readonly type: "string";
                            };
                            readonly approvalId: {
                                readonly type: "string";
                            };
                            readonly manifestDigest: {
                                readonly type: "string";
                            };
                            readonly sourceDigest: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                        readonly additionalProperties: false;
                    };
                    readonly documents: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("id" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly parses: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly jobId: {
                                    readonly type: "string";
                                };
                                readonly manifestDigest: {
                                    readonly type: "string";
                                };
                                readonly approvalId: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("approvalId" | "manifestDigest" | "jobId")[];
                            readonly additionalProperties: false;
                        };
                    };
                };
                readonly required: ("size" | "digest" | "artifactId")[];
                readonly additionalProperties: false;
            };
        };
        readonly inputRuns: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly runId: {
                        readonly type: "string";
                    };
                    readonly contentDigest: {
                        readonly type: "string";
                    };
                    readonly answerReviewId: {
                        readonly type: "string";
                    };
                    readonly terminal: {
                        readonly type: "boolean";
                    };
                    readonly intentId: {
                        readonly type: "string";
                    };
                    readonly approvalId: {
                        readonly type: "string";
                    };
                    readonly manifestDigest: {
                        readonly type: "string";
                    };
                    readonly sourceDigest: {
                        readonly type: "string";
                    };
                };
                readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "intentId" | "terminal")[];
                readonly additionalProperties: false;
            };
        };
        readonly observationIds: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly inputDigest: {
            readonly type: "string";
        };
        readonly digest: {
            readonly type: "string";
        };
        readonly hypothesis: {
            readonly type: "string";
        };
        readonly controlRunIds: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly changedFactors: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly dataSplit: {
            readonly type: "string";
        };
        readonly dataArtifactIds: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly primaryMetric: {
            readonly type: "string";
        };
        readonly guardrailMetrics: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly repetitions: {
            readonly type: "object";
            readonly properties: {
                readonly count: {
                    readonly type: "integer";
                };
                readonly rationale: {
                    readonly type: "string";
                };
            };
            readonly required: ("count" | "rationale")[];
            readonly additionalProperties: false;
        };
        readonly successCriteria: {
            readonly type: "string";
        };
        readonly inconclusiveCriteria: {
            readonly type: "string";
        };
        readonly stoppingCriteria: {
            readonly type: "string";
        };
        readonly previousRevisionId: {
            readonly type: "string";
        };
    };
    readonly required: ("id" | "digest" | "contractDigest" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "inputDigest" | "successCriteria" | "hypothesis" | "controlRunIds" | "changedFactors" | "dataArtifactIds" | "guardrailMetrics" | "repetitions" | "dataSplit" | "primaryMetric" | "inconclusiveCriteria" | "stoppingCriteria" | "campaignId" | "roundId" | "decisionId" | "parentSource" | "controlBindings" | "dataBindings" | "inputRuns" | "observationIds" | "campaignApprovalId" | "campaignPlanDigest" | "decisionApprovalId")[];
    readonly additionalProperties: false;
};
export declare const RESEARCH_PLAN_INSPECTION_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly plan: {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                };
                readonly kind: {
                    readonly const: "experiment-plan-revision";
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
                readonly campaignId: {
                    readonly type: "string";
                };
                readonly roundId: {
                    readonly type: "string";
                };
                readonly decisionId: {
                    readonly type: "string";
                };
                readonly parentSource: {
                    readonly type: "object";
                    readonly properties: {
                        readonly snapshotId: {
                            readonly type: "string";
                        };
                        readonly experimentId: {
                            readonly type: "string";
                        };
                        readonly revision: {
                            readonly type: "integer";
                        };
                        readonly sourceDigest: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                    readonly additionalProperties: false;
                };
                readonly contractDigest: {
                    readonly type: "string";
                };
                readonly campaignApprovalId: {
                    readonly type: "string";
                };
                readonly campaignPlanDigest: {
                    readonly type: "string";
                };
                readonly decisionApprovalId: {
                    readonly type: "string";
                };
                readonly controlBindings: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly runId: {
                                readonly type: "string";
                            };
                            readonly contentDigest: {
                                readonly type: "string";
                            };
                            readonly intentId: {
                                readonly type: "string";
                            };
                            readonly approvalId: {
                                readonly type: "string";
                            };
                            readonly manifestDigest: {
                                readonly type: "string";
                            };
                            readonly sourceDigest: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly dataBindings: {
                    readonly type: "array";
                    readonly items: {
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
                            readonly sourceAcceptanceId: {
                                readonly type: "string";
                            };
                            readonly taskApprovals: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly teamId: {
                                            readonly type: "string";
                                        };
                                        readonly approvalId: {
                                            readonly type: "string";
                                        };
                                        readonly planDigest: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: ("approvalId" | "teamId" | "planDigest")[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly run: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly runId: {
                                        readonly type: "string";
                                    };
                                    readonly contentDigest: {
                                        readonly type: "string";
                                    };
                                    readonly intentId: {
                                        readonly type: "string";
                                    };
                                    readonly approvalId: {
                                        readonly type: "string";
                                    };
                                    readonly manifestDigest: {
                                        readonly type: "string";
                                    };
                                    readonly sourceDigest: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                                readonly additionalProperties: false;
                            };
                            readonly documents: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly digest: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: ("id" | "digest")[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly parses: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly jobId: {
                                            readonly type: "string";
                                        };
                                        readonly manifestDigest: {
                                            readonly type: "string";
                                        };
                                        readonly approvalId: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: ("approvalId" | "manifestDigest" | "jobId")[];
                                    readonly additionalProperties: false;
                                };
                            };
                        };
                        readonly required: ("size" | "digest" | "artifactId")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly inputRuns: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly runId: {
                                readonly type: "string";
                            };
                            readonly contentDigest: {
                                readonly type: "string";
                            };
                            readonly answerReviewId: {
                                readonly type: "string";
                            };
                            readonly terminal: {
                                readonly type: "boolean";
                            };
                            readonly intentId: {
                                readonly type: "string";
                            };
                            readonly approvalId: {
                                readonly type: "string";
                            };
                            readonly manifestDigest: {
                                readonly type: "string";
                            };
                            readonly sourceDigest: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "intentId" | "terminal")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly observationIds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly inputDigest: {
                    readonly type: "string";
                };
                readonly digest: {
                    readonly type: "string";
                };
                readonly hypothesis: {
                    readonly type: "string";
                };
                readonly controlRunIds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly changedFactors: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly dataSplit: {
                    readonly type: "string";
                };
                readonly dataArtifactIds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly primaryMetric: {
                    readonly type: "string";
                };
                readonly guardrailMetrics: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly repetitions: {
                    readonly type: "object";
                    readonly properties: {
                        readonly count: {
                            readonly type: "integer";
                        };
                        readonly rationale: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("count" | "rationale")[];
                    readonly additionalProperties: false;
                };
                readonly successCriteria: {
                    readonly type: "string";
                };
                readonly inconclusiveCriteria: {
                    readonly type: "string";
                };
                readonly stoppingCriteria: {
                    readonly type: "string";
                };
                readonly previousRevisionId: {
                    readonly type: "string";
                };
            };
            readonly required: ("id" | "digest" | "contractDigest" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "inputDigest" | "successCriteria" | "hypothesis" | "controlRunIds" | "changedFactors" | "dataArtifactIds" | "guardrailMetrics" | "repetitions" | "dataSplit" | "primaryMetric" | "inconclusiveCriteria" | "stoppingCriteria" | "campaignId" | "roundId" | "decisionId" | "parentSource" | "controlBindings" | "dataBindings" | "inputRuns" | "observationIds" | "campaignApprovalId" | "campaignPlanDigest" | "decisionApprovalId")[];
            readonly additionalProperties: false;
        };
        readonly candidates: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly kind: {
                        readonly const: "research-candidate";
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
                    readonly campaignId: {
                        readonly type: "string";
                    };
                    readonly roundId: {
                        readonly type: "string";
                    };
                    readonly planRevisionId: {
                        readonly type: "string";
                    };
                    readonly decisionId: {
                        readonly type: "string";
                    };
                    readonly spec: {
                        readonly type: "object";
                        readonly properties: {
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly hypothesis: {
                                readonly type: "string";
                            };
                            readonly config: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    description: string;
                                };
                            };
                            readonly implementation: {
                                readonly enum: readonly ["config", "reviewed-code"];
                            };
                        };
                        readonly required: ("title" | "hypothesis")[];
                        readonly additionalProperties: false;
                    };
                    readonly parentSource: {
                        readonly type: "object";
                        readonly properties: {
                            readonly snapshotId: {
                                readonly type: "string";
                            };
                            readonly experimentId: {
                                readonly type: "string";
                            };
                            readonly revision: {
                                readonly type: "integer";
                            };
                            readonly sourceDigest: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                        readonly additionalProperties: false;
                    };
                    readonly state: {
                        readonly enum: readonly ["awaiting_implementation", "prepared"];
                    };
                    readonly sessionId: {
                        readonly type: "string";
                    };
                    readonly proposalId: {
                        readonly type: "string";
                    };
                    readonly testJobId: {
                        readonly type: "string";
                    };
                    readonly reviewId: {
                        readonly type: "string";
                    };
                    readonly reviewAcceptanceId: {
                        readonly type: "string";
                    };
                    readonly experimentId: {
                        readonly type: "string";
                    };
                    readonly intentId: {
                        readonly type: "string";
                    };
                    readonly repairOfMemberId: {
                        readonly type: "string";
                    };
                    readonly repairRootMemberId: {
                        readonly type: "string";
                    };
                    readonly integrationApprovalId: {
                        readonly type: "string";
                    };
                    readonly testApprovalId: {
                        readonly type: "string";
                    };
                    readonly reviewApprovalId: {
                        readonly type: "string";
                    };
                    readonly runApprovalId: {
                        readonly type: "string";
                    };
                };
                readonly required: ("id" | "state" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "campaignId" | "roundId" | "planRevisionId" | "decisionId" | "spec" | "parentSource")[];
                readonly additionalProperties: false;
            };
        };
        readonly validity: {
            readonly enum: readonly ["current", "stale"];
        };
        readonly reasons: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
    };
    readonly required: ("validity" | "reasons" | "candidates" | "plan")[];
    readonly additionalProperties: false;
};
export declare const RESEARCH_COMPARISON_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly campaignId: {
            readonly type: "string";
        };
        readonly state: {
            readonly enum: readonly ["draft", "active", "paused", "stopped"];
        };
        readonly primaryMetric: {
            readonly type: "string";
        };
        readonly direction: {
            readonly enum: readonly ["min", "max"];
        };
        readonly unit: {
            readonly type: "string";
        };
        readonly plans: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly plan: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly kind: {
                                readonly const: "experiment-plan-revision";
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
                            readonly campaignId: {
                                readonly type: "string";
                            };
                            readonly roundId: {
                                readonly type: "string";
                            };
                            readonly decisionId: {
                                readonly type: "string";
                            };
                            readonly parentSource: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly snapshotId: {
                                        readonly type: "string";
                                    };
                                    readonly experimentId: {
                                        readonly type: "string";
                                    };
                                    readonly revision: {
                                        readonly type: "integer";
                                    };
                                    readonly sourceDigest: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                                readonly additionalProperties: false;
                            };
                            readonly contractDigest: {
                                readonly type: "string";
                            };
                            readonly campaignApprovalId: {
                                readonly type: "string";
                            };
                            readonly campaignPlanDigest: {
                                readonly type: "string";
                            };
                            readonly decisionApprovalId: {
                                readonly type: "string";
                            };
                            readonly controlBindings: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly runId: {
                                            readonly type: "string";
                                        };
                                        readonly contentDigest: {
                                            readonly type: "string";
                                        };
                                        readonly intentId: {
                                            readonly type: "string";
                                        };
                                        readonly approvalId: {
                                            readonly type: "string";
                                        };
                                        readonly manifestDigest: {
                                            readonly type: "string";
                                        };
                                        readonly sourceDigest: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly dataBindings: {
                                readonly type: "array";
                                readonly items: {
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
                                        readonly sourceAcceptanceId: {
                                            readonly type: "string";
                                        };
                                        readonly taskApprovals: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly teamId: {
                                                        readonly type: "string";
                                                    };
                                                    readonly approvalId: {
                                                        readonly type: "string";
                                                    };
                                                    readonly planDigest: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: ("approvalId" | "teamId" | "planDigest")[];
                                                readonly additionalProperties: false;
                                            };
                                        };
                                        readonly run: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly runId: {
                                                    readonly type: "string";
                                                };
                                                readonly contentDigest: {
                                                    readonly type: "string";
                                                };
                                                readonly intentId: {
                                                    readonly type: "string";
                                                };
                                                readonly approvalId: {
                                                    readonly type: "string";
                                                };
                                                readonly manifestDigest: {
                                                    readonly type: "string";
                                                };
                                                readonly sourceDigest: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                                            readonly additionalProperties: false;
                                        };
                                        readonly documents: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly id: {
                                                        readonly type: "string";
                                                    };
                                                    readonly digest: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: ("id" | "digest")[];
                                                readonly additionalProperties: false;
                                            };
                                        };
                                        readonly parses: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly jobId: {
                                                        readonly type: "string";
                                                    };
                                                    readonly manifestDigest: {
                                                        readonly type: "string";
                                                    };
                                                    readonly approvalId: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: ("approvalId" | "manifestDigest" | "jobId")[];
                                                readonly additionalProperties: false;
                                            };
                                        };
                                    };
                                    readonly required: ("size" | "digest" | "artifactId")[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly inputRuns: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly runId: {
                                            readonly type: "string";
                                        };
                                        readonly contentDigest: {
                                            readonly type: "string";
                                        };
                                        readonly answerReviewId: {
                                            readonly type: "string";
                                        };
                                        readonly terminal: {
                                            readonly type: "boolean";
                                        };
                                        readonly intentId: {
                                            readonly type: "string";
                                        };
                                        readonly approvalId: {
                                            readonly type: "string";
                                        };
                                        readonly manifestDigest: {
                                            readonly type: "string";
                                        };
                                        readonly sourceDigest: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "intentId" | "terminal")[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly observationIds: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly inputDigest: {
                                readonly type: "string";
                            };
                            readonly digest: {
                                readonly type: "string";
                            };
                            readonly hypothesis: {
                                readonly type: "string";
                            };
                            readonly controlRunIds: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly changedFactors: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly dataSplit: {
                                readonly type: "string";
                            };
                            readonly dataArtifactIds: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly primaryMetric: {
                                readonly type: "string";
                            };
                            readonly guardrailMetrics: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly repetitions: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly count: {
                                        readonly type: "integer";
                                    };
                                    readonly rationale: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("count" | "rationale")[];
                                readonly additionalProperties: false;
                            };
                            readonly successCriteria: {
                                readonly type: "string";
                            };
                            readonly inconclusiveCriteria: {
                                readonly type: "string";
                            };
                            readonly stoppingCriteria: {
                                readonly type: "string";
                            };
                            readonly previousRevisionId: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("id" | "digest" | "contractDigest" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "inputDigest" | "successCriteria" | "hypothesis" | "controlRunIds" | "changedFactors" | "dataArtifactIds" | "guardrailMetrics" | "repetitions" | "dataSplit" | "primaryMetric" | "inconclusiveCriteria" | "stoppingCriteria" | "campaignId" | "roundId" | "decisionId" | "parentSource" | "controlBindings" | "dataBindings" | "inputRuns" | "observationIds" | "campaignApprovalId" | "campaignPlanDigest" | "decisionApprovalId")[];
                        readonly additionalProperties: false;
                    };
                    readonly candidates: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly kind: {
                                    readonly const: "research-candidate";
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
                                readonly campaignId: {
                                    readonly type: "string";
                                };
                                readonly roundId: {
                                    readonly type: "string";
                                };
                                readonly planRevisionId: {
                                    readonly type: "string";
                                };
                                readonly decisionId: {
                                    readonly type: "string";
                                };
                                readonly spec: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly title: {
                                            readonly type: "string";
                                        };
                                        readonly hypothesis: {
                                            readonly type: "string";
                                        };
                                        readonly config: {
                                            readonly type: "object";
                                            readonly additionalProperties: {
                                                description: string;
                                            };
                                        };
                                        readonly implementation: {
                                            readonly enum: readonly ["config", "reviewed-code"];
                                        };
                                    };
                                    readonly required: ("title" | "hypothesis")[];
                                    readonly additionalProperties: false;
                                };
                                readonly parentSource: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly snapshotId: {
                                            readonly type: "string";
                                        };
                                        readonly experimentId: {
                                            readonly type: "string";
                                        };
                                        readonly revision: {
                                            readonly type: "integer";
                                        };
                                        readonly sourceDigest: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                                    readonly additionalProperties: false;
                                };
                                readonly state: {
                                    readonly enum: readonly ["awaiting_implementation", "prepared"];
                                };
                                readonly sessionId: {
                                    readonly type: "string";
                                };
                                readonly proposalId: {
                                    readonly type: "string";
                                };
                                readonly testJobId: {
                                    readonly type: "string";
                                };
                                readonly reviewId: {
                                    readonly type: "string";
                                };
                                readonly reviewAcceptanceId: {
                                    readonly type: "string";
                                };
                                readonly experimentId: {
                                    readonly type: "string";
                                };
                                readonly intentId: {
                                    readonly type: "string";
                                };
                                readonly repairOfMemberId: {
                                    readonly type: "string";
                                };
                                readonly repairRootMemberId: {
                                    readonly type: "string";
                                };
                                readonly integrationApprovalId: {
                                    readonly type: "string";
                                };
                                readonly testApprovalId: {
                                    readonly type: "string";
                                };
                                readonly reviewApprovalId: {
                                    readonly type: "string";
                                };
                                readonly runApprovalId: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("id" | "state" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "campaignId" | "roundId" | "planRevisionId" | "decisionId" | "spec" | "parentSource")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly validity: {
                        readonly enum: readonly ["current", "stale"];
                    };
                    readonly reasons: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
                readonly required: ("validity" | "reasons" | "candidates" | "plan")[];
                readonly additionalProperties: false;
            };
        };
        readonly results: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly observationId: {
                        readonly type: "string";
                    };
                    readonly runId: {
                        readonly type: "string";
                    };
                    readonly experimentId: {
                        readonly type: "string";
                    };
                    readonly planRevisionId: {
                        readonly type: "string";
                    };
                    readonly candidateId: {
                        readonly type: "string";
                    };
                    readonly validation: {
                        readonly enum: readonly ["verified", "incomplete", "invalid"];
                    };
                    readonly metrics: {
                        readonly type: "object";
                        readonly additionalProperties: {
                            readonly type: "number";
                        };
                    };
                    readonly evidenceIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
                readonly required: ("experimentId" | "runId" | "evidenceIds" | "validation" | "observationId" | "metrics")[];
                readonly additionalProperties: false;
            };
        };
        readonly controls: {
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
                    readonly manifestDigest: {
                        readonly type: "string";
                    };
                    readonly metrics: {
                        readonly type: "object";
                        readonly additionalProperties: {
                            readonly type: "number";
                        };
                    };
                    readonly evidenceIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
                readonly required: ("experimentId" | "manifestDigest" | "runId" | "evidenceIds" | "metrics")[];
                readonly additionalProperties: false;
            };
        };
        readonly blockers: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly conclusion: {
            readonly const: "requires_review";
        };
    };
    readonly required: ("state" | "primaryMetric" | "campaignId" | "direction" | "plans" | "results" | "controls" | "blockers" | "conclusion" | "unit")[];
    readonly additionalProperties: false;
};
export declare const RESEARCH_PLAN_INPUT_SCHEMAS: {
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
export declare const RESEARCH_PLAN_OUTPUT_SCHEMAS: {
    readonly campaign_plan_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly plan: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly kind: {
                        readonly const: "experiment-plan-revision";
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
                    readonly campaignId: {
                        readonly type: "string";
                    };
                    readonly roundId: {
                        readonly type: "string";
                    };
                    readonly decisionId: {
                        readonly type: "string";
                    };
                    readonly parentSource: {
                        readonly type: "object";
                        readonly properties: {
                            readonly snapshotId: {
                                readonly type: "string";
                            };
                            readonly experimentId: {
                                readonly type: "string";
                            };
                            readonly revision: {
                                readonly type: "integer";
                            };
                            readonly sourceDigest: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                        readonly additionalProperties: false;
                    };
                    readonly contractDigest: {
                        readonly type: "string";
                    };
                    readonly campaignApprovalId: {
                        readonly type: "string";
                    };
                    readonly campaignPlanDigest: {
                        readonly type: "string";
                    };
                    readonly decisionApprovalId: {
                        readonly type: "string";
                    };
                    readonly controlBindings: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly runId: {
                                    readonly type: "string";
                                };
                                readonly contentDigest: {
                                    readonly type: "string";
                                };
                                readonly intentId: {
                                    readonly type: "string";
                                };
                                readonly approvalId: {
                                    readonly type: "string";
                                };
                                readonly manifestDigest: {
                                    readonly type: "string";
                                };
                                readonly sourceDigest: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly dataBindings: {
                        readonly type: "array";
                        readonly items: {
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
                                readonly sourceAcceptanceId: {
                                    readonly type: "string";
                                };
                                readonly taskApprovals: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly teamId: {
                                                readonly type: "string";
                                            };
                                            readonly approvalId: {
                                                readonly type: "string";
                                            };
                                            readonly planDigest: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: ("approvalId" | "teamId" | "planDigest")[];
                                        readonly additionalProperties: false;
                                    };
                                };
                                readonly run: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly runId: {
                                            readonly type: "string";
                                        };
                                        readonly contentDigest: {
                                            readonly type: "string";
                                        };
                                        readonly intentId: {
                                            readonly type: "string";
                                        };
                                        readonly approvalId: {
                                            readonly type: "string";
                                        };
                                        readonly manifestDigest: {
                                            readonly type: "string";
                                        };
                                        readonly sourceDigest: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                                    readonly additionalProperties: false;
                                };
                                readonly documents: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly id: {
                                                readonly type: "string";
                                            };
                                            readonly digest: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: ("id" | "digest")[];
                                        readonly additionalProperties: false;
                                    };
                                };
                                readonly parses: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly jobId: {
                                                readonly type: "string";
                                            };
                                            readonly manifestDigest: {
                                                readonly type: "string";
                                            };
                                            readonly approvalId: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: ("approvalId" | "manifestDigest" | "jobId")[];
                                        readonly additionalProperties: false;
                                    };
                                };
                            };
                            readonly required: ("size" | "digest" | "artifactId")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly inputRuns: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly runId: {
                                    readonly type: "string";
                                };
                                readonly contentDigest: {
                                    readonly type: "string";
                                };
                                readonly answerReviewId: {
                                    readonly type: "string";
                                };
                                readonly terminal: {
                                    readonly type: "boolean";
                                };
                                readonly intentId: {
                                    readonly type: "string";
                                };
                                readonly approvalId: {
                                    readonly type: "string";
                                };
                                readonly manifestDigest: {
                                    readonly type: "string";
                                };
                                readonly sourceDigest: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "intentId" | "terminal")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly observationIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly inputDigest: {
                        readonly type: "string";
                    };
                    readonly digest: {
                        readonly type: "string";
                    };
                    readonly hypothesis: {
                        readonly type: "string";
                    };
                    readonly controlRunIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly changedFactors: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly dataSplit: {
                        readonly type: "string";
                    };
                    readonly dataArtifactIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly primaryMetric: {
                        readonly type: "string";
                    };
                    readonly guardrailMetrics: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly repetitions: {
                        readonly type: "object";
                        readonly properties: {
                            readonly count: {
                                readonly type: "integer";
                            };
                            readonly rationale: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("count" | "rationale")[];
                        readonly additionalProperties: false;
                    };
                    readonly successCriteria: {
                        readonly type: "string";
                    };
                    readonly inconclusiveCriteria: {
                        readonly type: "string";
                    };
                    readonly stoppingCriteria: {
                        readonly type: "string";
                    };
                    readonly previousRevisionId: {
                        readonly type: "string";
                    };
                };
                readonly required: ("id" | "digest" | "contractDigest" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "inputDigest" | "successCriteria" | "hypothesis" | "controlRunIds" | "changedFactors" | "dataArtifactIds" | "guardrailMetrics" | "repetitions" | "dataSplit" | "primaryMetric" | "inconclusiveCriteria" | "stoppingCriteria" | "campaignId" | "roundId" | "decisionId" | "parentSource" | "controlBindings" | "dataBindings" | "inputRuns" | "observationIds" | "campaignApprovalId" | "campaignPlanDigest" | "decisionApprovalId")[];
                readonly additionalProperties: false;
            };
            readonly candidates: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "research-candidate";
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
                        readonly campaignId: {
                            readonly type: "string";
                        };
                        readonly roundId: {
                            readonly type: "string";
                        };
                        readonly planRevisionId: {
                            readonly type: "string";
                        };
                        readonly decisionId: {
                            readonly type: "string";
                        };
                        readonly spec: {
                            readonly type: "object";
                            readonly properties: {
                                readonly title: {
                                    readonly type: "string";
                                };
                                readonly hypothesis: {
                                    readonly type: "string";
                                };
                                readonly config: {
                                    readonly type: "object";
                                    readonly additionalProperties: {
                                        description: string;
                                    };
                                };
                                readonly implementation: {
                                    readonly enum: readonly ["config", "reviewed-code"];
                                };
                            };
                            readonly required: ("title" | "hypothesis")[];
                            readonly additionalProperties: false;
                        };
                        readonly parentSource: {
                            readonly type: "object";
                            readonly properties: {
                                readonly snapshotId: {
                                    readonly type: "string";
                                };
                                readonly experimentId: {
                                    readonly type: "string";
                                };
                                readonly revision: {
                                    readonly type: "integer";
                                };
                                readonly sourceDigest: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                            readonly additionalProperties: false;
                        };
                        readonly state: {
                            readonly enum: readonly ["awaiting_implementation", "prepared"];
                        };
                        readonly sessionId: {
                            readonly type: "string";
                        };
                        readonly proposalId: {
                            readonly type: "string";
                        };
                        readonly testJobId: {
                            readonly type: "string";
                        };
                        readonly reviewId: {
                            readonly type: "string";
                        };
                        readonly reviewAcceptanceId: {
                            readonly type: "string";
                        };
                        readonly experimentId: {
                            readonly type: "string";
                        };
                        readonly intentId: {
                            readonly type: "string";
                        };
                        readonly repairOfMemberId: {
                            readonly type: "string";
                        };
                        readonly repairRootMemberId: {
                            readonly type: "string";
                        };
                        readonly integrationApprovalId: {
                            readonly type: "string";
                        };
                        readonly testApprovalId: {
                            readonly type: "string";
                        };
                        readonly reviewApprovalId: {
                            readonly type: "string";
                        };
                        readonly runApprovalId: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("id" | "state" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "campaignId" | "roundId" | "planRevisionId" | "decisionId" | "spec" | "parentSource")[];
                    readonly additionalProperties: false;
                };
            };
            readonly validity: {
                readonly enum: readonly ["current", "stale"];
            };
            readonly reasons: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly required: ("validity" | "reasons" | "candidates" | "plan")[];
        readonly additionalProperties: false;
    };
    readonly campaign_candidate_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "research-candidate";
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
            readonly campaignId: {
                readonly type: "string";
            };
            readonly roundId: {
                readonly type: "string";
            };
            readonly planRevisionId: {
                readonly type: "string";
            };
            readonly decisionId: {
                readonly type: "string";
            };
            readonly spec: {
                readonly type: "object";
                readonly properties: {
                    readonly title: {
                        readonly type: "string";
                    };
                    readonly hypothesis: {
                        readonly type: "string";
                    };
                    readonly config: {
                        readonly type: "object";
                        readonly additionalProperties: {
                            description: string;
                        };
                    };
                    readonly implementation: {
                        readonly enum: readonly ["config", "reviewed-code"];
                    };
                };
                readonly required: ("title" | "hypothesis")[];
                readonly additionalProperties: false;
            };
            readonly parentSource: {
                readonly type: "object";
                readonly properties: {
                    readonly snapshotId: {
                        readonly type: "string";
                    };
                    readonly experimentId: {
                        readonly type: "string";
                    };
                    readonly revision: {
                        readonly type: "integer";
                    };
                    readonly sourceDigest: {
                        readonly type: "string";
                    };
                };
                readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                readonly additionalProperties: false;
            };
            readonly state: {
                readonly enum: readonly ["awaiting_implementation", "prepared"];
            };
            readonly sessionId: {
                readonly type: "string";
            };
            readonly proposalId: {
                readonly type: "string";
            };
            readonly testJobId: {
                readonly type: "string";
            };
            readonly reviewId: {
                readonly type: "string";
            };
            readonly reviewAcceptanceId: {
                readonly type: "string";
            };
            readonly experimentId: {
                readonly type: "string";
            };
            readonly intentId: {
                readonly type: "string";
            };
            readonly repairOfMemberId: {
                readonly type: "string";
            };
            readonly repairRootMemberId: {
                readonly type: "string";
            };
            readonly integrationApprovalId: {
                readonly type: "string";
            };
            readonly testApprovalId: {
                readonly type: "string";
            };
            readonly reviewApprovalId: {
                readonly type: "string";
            };
            readonly runApprovalId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "campaignId" | "roundId" | "planRevisionId" | "decisionId" | "spec" | "parentSource")[];
        readonly additionalProperties: false;
    };
    readonly campaign_candidate_attach: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "research-candidate";
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
            readonly campaignId: {
                readonly type: "string";
            };
            readonly roundId: {
                readonly type: "string";
            };
            readonly planRevisionId: {
                readonly type: "string";
            };
            readonly decisionId: {
                readonly type: "string";
            };
            readonly spec: {
                readonly type: "object";
                readonly properties: {
                    readonly title: {
                        readonly type: "string";
                    };
                    readonly hypothesis: {
                        readonly type: "string";
                    };
                    readonly config: {
                        readonly type: "object";
                        readonly additionalProperties: {
                            description: string;
                        };
                    };
                    readonly implementation: {
                        readonly enum: readonly ["config", "reviewed-code"];
                    };
                };
                readonly required: ("title" | "hypothesis")[];
                readonly additionalProperties: false;
            };
            readonly parentSource: {
                readonly type: "object";
                readonly properties: {
                    readonly snapshotId: {
                        readonly type: "string";
                    };
                    readonly experimentId: {
                        readonly type: "string";
                    };
                    readonly revision: {
                        readonly type: "integer";
                    };
                    readonly sourceDigest: {
                        readonly type: "string";
                    };
                };
                readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                readonly additionalProperties: false;
            };
            readonly state: {
                readonly enum: readonly ["awaiting_implementation", "prepared"];
            };
            readonly sessionId: {
                readonly type: "string";
            };
            readonly proposalId: {
                readonly type: "string";
            };
            readonly testJobId: {
                readonly type: "string";
            };
            readonly reviewId: {
                readonly type: "string";
            };
            readonly reviewAcceptanceId: {
                readonly type: "string";
            };
            readonly experimentId: {
                readonly type: "string";
            };
            readonly intentId: {
                readonly type: "string";
            };
            readonly repairOfMemberId: {
                readonly type: "string";
            };
            readonly repairRootMemberId: {
                readonly type: "string";
            };
            readonly integrationApprovalId: {
                readonly type: "string";
            };
            readonly testApprovalId: {
                readonly type: "string";
            };
            readonly reviewApprovalId: {
                readonly type: "string";
            };
            readonly runApprovalId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "state" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "campaignId" | "roundId" | "planRevisionId" | "decisionId" | "spec" | "parentSource")[];
        readonly additionalProperties: false;
    };
    readonly campaign_comparison: {
        readonly type: "object";
        readonly properties: {
            readonly campaignId: {
                readonly type: "string";
            };
            readonly state: {
                readonly enum: readonly ["draft", "active", "paused", "stopped"];
            };
            readonly primaryMetric: {
                readonly type: "string";
            };
            readonly direction: {
                readonly enum: readonly ["min", "max"];
            };
            readonly unit: {
                readonly type: "string";
            };
            readonly plans: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly plan: {
                            readonly type: "object";
                            readonly properties: {
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly kind: {
                                    readonly const: "experiment-plan-revision";
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
                                readonly campaignId: {
                                    readonly type: "string";
                                };
                                readonly roundId: {
                                    readonly type: "string";
                                };
                                readonly decisionId: {
                                    readonly type: "string";
                                };
                                readonly parentSource: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly snapshotId: {
                                            readonly type: "string";
                                        };
                                        readonly experimentId: {
                                            readonly type: "string";
                                        };
                                        readonly revision: {
                                            readonly type: "integer";
                                        };
                                        readonly sourceDigest: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                                    readonly additionalProperties: false;
                                };
                                readonly contractDigest: {
                                    readonly type: "string";
                                };
                                readonly campaignApprovalId: {
                                    readonly type: "string";
                                };
                                readonly campaignPlanDigest: {
                                    readonly type: "string";
                                };
                                readonly decisionApprovalId: {
                                    readonly type: "string";
                                };
                                readonly controlBindings: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly runId: {
                                                readonly type: "string";
                                            };
                                            readonly contentDigest: {
                                                readonly type: "string";
                                            };
                                            readonly intentId: {
                                                readonly type: "string";
                                            };
                                            readonly approvalId: {
                                                readonly type: "string";
                                            };
                                            readonly manifestDigest: {
                                                readonly type: "string";
                                            };
                                            readonly sourceDigest: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                                        readonly additionalProperties: false;
                                    };
                                };
                                readonly dataBindings: {
                                    readonly type: "array";
                                    readonly items: {
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
                                            readonly sourceAcceptanceId: {
                                                readonly type: "string";
                                            };
                                            readonly taskApprovals: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly teamId: {
                                                            readonly type: "string";
                                                        };
                                                        readonly approvalId: {
                                                            readonly type: "string";
                                                        };
                                                        readonly planDigest: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: ("approvalId" | "teamId" | "planDigest")[];
                                                    readonly additionalProperties: false;
                                                };
                                            };
                                            readonly run: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly runId: {
                                                        readonly type: "string";
                                                    };
                                                    readonly contentDigest: {
                                                        readonly type: "string";
                                                    };
                                                    readonly intentId: {
                                                        readonly type: "string";
                                                    };
                                                    readonly approvalId: {
                                                        readonly type: "string";
                                                    };
                                                    readonly manifestDigest: {
                                                        readonly type: "string";
                                                    };
                                                    readonly sourceDigest: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "runId" | "intentId" | "contentDigest")[];
                                                readonly additionalProperties: false;
                                            };
                                            readonly documents: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly id: {
                                                            readonly type: "string";
                                                        };
                                                        readonly digest: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: ("id" | "digest")[];
                                                    readonly additionalProperties: false;
                                                };
                                            };
                                            readonly parses: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly jobId: {
                                                            readonly type: "string";
                                                        };
                                                        readonly manifestDigest: {
                                                            readonly type: "string";
                                                        };
                                                        readonly approvalId: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: ("approvalId" | "manifestDigest" | "jobId")[];
                                                    readonly additionalProperties: false;
                                                };
                                            };
                                        };
                                        readonly required: ("size" | "digest" | "artifactId")[];
                                        readonly additionalProperties: false;
                                    };
                                };
                                readonly inputRuns: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly runId: {
                                                readonly type: "string";
                                            };
                                            readonly contentDigest: {
                                                readonly type: "string";
                                            };
                                            readonly answerReviewId: {
                                                readonly type: "string";
                                            };
                                            readonly terminal: {
                                                readonly type: "boolean";
                                            };
                                            readonly intentId: {
                                                readonly type: "string";
                                            };
                                            readonly approvalId: {
                                                readonly type: "string";
                                            };
                                            readonly manifestDigest: {
                                                readonly type: "string";
                                            };
                                            readonly sourceDigest: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: ("approvalId" | "manifestDigest" | "sourceDigest" | "intentId" | "terminal")[];
                                        readonly additionalProperties: false;
                                    };
                                };
                                readonly observationIds: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly inputDigest: {
                                    readonly type: "string";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                                readonly hypothesis: {
                                    readonly type: "string";
                                };
                                readonly controlRunIds: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly changedFactors: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly dataSplit: {
                                    readonly type: "string";
                                };
                                readonly dataArtifactIds: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly primaryMetric: {
                                    readonly type: "string";
                                };
                                readonly guardrailMetrics: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly repetitions: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly count: {
                                            readonly type: "integer";
                                        };
                                        readonly rationale: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly required: ("count" | "rationale")[];
                                    readonly additionalProperties: false;
                                };
                                readonly successCriteria: {
                                    readonly type: "string";
                                };
                                readonly inconclusiveCriteria: {
                                    readonly type: "string";
                                };
                                readonly stoppingCriteria: {
                                    readonly type: "string";
                                };
                                readonly previousRevisionId: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("id" | "digest" | "contractDigest" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "inputDigest" | "successCriteria" | "hypothesis" | "controlRunIds" | "changedFactors" | "dataArtifactIds" | "guardrailMetrics" | "repetitions" | "dataSplit" | "primaryMetric" | "inconclusiveCriteria" | "stoppingCriteria" | "campaignId" | "roundId" | "decisionId" | "parentSource" | "controlBindings" | "dataBindings" | "inputRuns" | "observationIds" | "campaignApprovalId" | "campaignPlanDigest" | "decisionApprovalId")[];
                            readonly additionalProperties: false;
                        };
                        readonly candidates: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly kind: {
                                        readonly const: "research-candidate";
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
                                    readonly campaignId: {
                                        readonly type: "string";
                                    };
                                    readonly roundId: {
                                        readonly type: "string";
                                    };
                                    readonly planRevisionId: {
                                        readonly type: "string";
                                    };
                                    readonly decisionId: {
                                        readonly type: "string";
                                    };
                                    readonly spec: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly title: {
                                                readonly type: "string";
                                            };
                                            readonly hypothesis: {
                                                readonly type: "string";
                                            };
                                            readonly config: {
                                                readonly type: "object";
                                                readonly additionalProperties: {
                                                    description: string;
                                                };
                                            };
                                            readonly implementation: {
                                                readonly enum: readonly ["config", "reviewed-code"];
                                            };
                                        };
                                        readonly required: ("title" | "hypothesis")[];
                                        readonly additionalProperties: false;
                                    };
                                    readonly parentSource: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly snapshotId: {
                                                readonly type: "string";
                                            };
                                            readonly experimentId: {
                                                readonly type: "string";
                                            };
                                            readonly revision: {
                                                readonly type: "integer";
                                            };
                                            readonly sourceDigest: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: ("experimentId" | "sourceDigest" | "snapshotId" | "revision")[];
                                        readonly additionalProperties: false;
                                    };
                                    readonly state: {
                                        readonly enum: readonly ["awaiting_implementation", "prepared"];
                                    };
                                    readonly sessionId: {
                                        readonly type: "string";
                                    };
                                    readonly proposalId: {
                                        readonly type: "string";
                                    };
                                    readonly testJobId: {
                                        readonly type: "string";
                                    };
                                    readonly reviewId: {
                                        readonly type: "string";
                                    };
                                    readonly reviewAcceptanceId: {
                                        readonly type: "string";
                                    };
                                    readonly experimentId: {
                                        readonly type: "string";
                                    };
                                    readonly intentId: {
                                        readonly type: "string";
                                    };
                                    readonly repairOfMemberId: {
                                        readonly type: "string";
                                    };
                                    readonly repairRootMemberId: {
                                        readonly type: "string";
                                    };
                                    readonly integrationApprovalId: {
                                        readonly type: "string";
                                    };
                                    readonly testApprovalId: {
                                        readonly type: "string";
                                    };
                                    readonly reviewApprovalId: {
                                        readonly type: "string";
                                    };
                                    readonly runApprovalId: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("id" | "state" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "campaignId" | "roundId" | "planRevisionId" | "decisionId" | "spec" | "parentSource")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly validity: {
                            readonly enum: readonly ["current", "stale"];
                        };
                        readonly reasons: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                    };
                    readonly required: ("validity" | "reasons" | "candidates" | "plan")[];
                    readonly additionalProperties: false;
                };
            };
            readonly results: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly observationId: {
                            readonly type: "string";
                        };
                        readonly runId: {
                            readonly type: "string";
                        };
                        readonly experimentId: {
                            readonly type: "string";
                        };
                        readonly planRevisionId: {
                            readonly type: "string";
                        };
                        readonly candidateId: {
                            readonly type: "string";
                        };
                        readonly validation: {
                            readonly enum: readonly ["verified", "incomplete", "invalid"];
                        };
                        readonly metrics: {
                            readonly type: "object";
                            readonly additionalProperties: {
                                readonly type: "number";
                            };
                        };
                        readonly evidenceIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                    };
                    readonly required: ("experimentId" | "runId" | "evidenceIds" | "validation" | "observationId" | "metrics")[];
                    readonly additionalProperties: false;
                };
            };
            readonly controls: {
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
                        readonly manifestDigest: {
                            readonly type: "string";
                        };
                        readonly metrics: {
                            readonly type: "object";
                            readonly additionalProperties: {
                                readonly type: "number";
                            };
                        };
                        readonly evidenceIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                    };
                    readonly required: ("experimentId" | "manifestDigest" | "runId" | "evidenceIds" | "metrics")[];
                    readonly additionalProperties: false;
                };
            };
            readonly blockers: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly conclusion: {
                readonly const: "requires_review";
            };
        };
        readonly required: ("state" | "primaryMetric" | "campaignId" | "direction" | "plans" | "results" | "controls" | "blockers" | "conclusion" | "unit")[];
        readonly additionalProperties: false;
    };
};
