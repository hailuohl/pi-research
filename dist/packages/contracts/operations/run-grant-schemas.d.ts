export declare const RUN_GRANT_REFERENCE_SCHEMA: {
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
export declare const RUN_GRANT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly kind: {
            readonly const: "run-grant";
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
                    readonly const: "analyst";
                };
            };
            readonly required: readonly ["taskId", "teamId", "teamApprovalId", "planDigest", "planVersion", "directiveVersion", "taskSpecDigest", "teamPlanId", "teamPlanVersion", "teamPlanDigest", "role"];
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
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["provider", "model", "thinking"];
            readonly additionalProperties: false;
        };
        readonly entries: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    intentId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    experimentId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    experimentRevision: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    manifestDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    sourceDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    contractDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    approvalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId"];
                readonly additionalProperties: false;
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
                    readonly const: "run-submission";
                };
            };
            readonly required: readonly ["limit", "used", "remaining", "unit"];
            readonly additionalProperties: false;
        };
        readonly uses: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly kind: {
                        readonly const: "run-grant-use";
                    };
                    readonly grantId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly grantDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly grantApprovalId: {
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
                    readonly manifestDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly approvalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly runId: {
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
                    readonly teamId: {
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
                    readonly attemptId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly generation: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
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
                readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "intentId", "manifestDigest", "approvalId", "runId"];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly manifests: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly threadLimit: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly contract: {
                        readonly type: "object";
                        readonly properties: {
                            readonly threadLimit: {
                                readonly type: "integer";
                                readonly minimum: number;
                                readonly maximum: number;
                            };
                            readonly command: {
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
                            readonly environment: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
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
                                readonly type: "integer";
                                readonly minimum: number;
                                readonly maximum: number;
                            };
                            readonly runner: {
                                readonly enum: readonly ["trusted-example", "local", "docker", "ssh"];
                            };
                            readonly localRuntimeId: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly gpu: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly vendor: {
                                        readonly const: "nvidia";
                                    };
                                    readonly deviceIds: {
                                        readonly maxItems?: number | undefined;
                                        readonly type: "array";
                                        readonly items: {
                                            readonly pattern: "^GPU-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
                                            readonly type: "string";
                                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                            readonly minLength: number;
                                            readonly maxLength: number;
                                        };
                                        readonly minItems: number;
                                    };
                                };
                                readonly required: readonly ["vendor", "deviceIds"];
                                readonly additionalProperties: false;
                            };
                            readonly sshTargetId: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly image: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
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
                            readonly dockerContext: {
                                readonly pattern?: string | undefined;
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
                                readonly enum: readonly ["none", "host"];
                            };
                        };
                        readonly required: readonly ["command", "environment", "datasetVersion", "evaluationProtocolVersion", "metrics", "expectedArtifacts", "timeoutSeconds", "runner", "cpus", "memoryMb"];
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
                            };
                            readonly required: readonly ["path", "size", "digest"];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                    readonly intentId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly experimentId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly experimentRevision: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly manifestDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly sourceDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly contractDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                    readonly approvalId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId", "contract", "files"];
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
    readonly required: ("sessionId" | "approvalId" | "kind" | "projectId" | "id" | "version" | "createdAt" | "updatedAt" | "digest" | "model" | "usage" | "entries" | "expiresAt" | "state" | "effectiveState" | "validity" | "reasons" | "uses" | "maxRuns" | "manifests")[];
    readonly additionalProperties: false;
};
export declare const RUN_GRANT_INPUT_SCHEMAS: {
    readonly run_grant_prepare: {
        readonly anyOf: readonly [{
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
        }, {
            readonly type: "object";
            readonly properties: {
                readonly taskId: {
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
            readonly required: readonly ["taskId", "intentIds", "maxRuns", "expiresAt"];
            readonly additionalProperties: false;
        }];
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
};
export declare const RUN_GRANT_OUTPUT_SCHEMAS: {
    readonly run_grant_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly const: "run-grant";
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
                        readonly const: "analyst";
                    };
                };
                readonly required: readonly ["taskId", "teamId", "teamApprovalId", "planDigest", "planVersion", "directiveVersion", "taskSpecDigest", "teamPlanId", "teamPlanVersion", "teamPlanDigest", "role"];
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
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly entries: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        intentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        experimentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        experimentRevision: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        sourceDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        contractDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId"];
                    readonly additionalProperties: false;
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
                        readonly const: "run-submission";
                    };
                };
                readonly required: readonly ["limit", "used", "remaining", "unit"];
                readonly additionalProperties: false;
            };
            readonly uses: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "run-grant-use";
                        };
                        readonly grantId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly grantDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly grantApprovalId: {
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
                        readonly manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly runId: {
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
                        readonly teamId: {
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
                        readonly attemptId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly generation: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
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
                    readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "intentId", "manifestDigest", "approvalId", "runId"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly manifests: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly threadLimit: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly contract: {
                            readonly type: "object";
                            readonly properties: {
                                readonly threadLimit: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly command: {
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
                                readonly environment: {
                                    readonly type: "object";
                                    readonly additionalProperties: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
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
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly runner: {
                                    readonly enum: readonly ["trusted-example", "local", "docker", "ssh"];
                                };
                                readonly localRuntimeId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly gpu: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly vendor: {
                                            readonly const: "nvidia";
                                        };
                                        readonly deviceIds: {
                                            readonly maxItems?: number | undefined;
                                            readonly type: "array";
                                            readonly items: {
                                                readonly pattern: "^GPU-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
                                                readonly type: "string";
                                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                                readonly minLength: number;
                                                readonly maxLength: number;
                                            };
                                            readonly minItems: number;
                                        };
                                    };
                                    readonly required: readonly ["vendor", "deviceIds"];
                                    readonly additionalProperties: false;
                                };
                                readonly sshTargetId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly image: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
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
                                readonly dockerContext: {
                                    readonly pattern?: string | undefined;
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
                                    readonly enum: readonly ["none", "host"];
                                };
                            };
                            readonly required: readonly ["command", "environment", "datasetVersion", "evaluationProtocolVersion", "metrics", "expectedArtifacts", "timeoutSeconds", "runner", "cpus", "memoryMb"];
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
                                };
                                readonly required: readonly ["path", "size", "digest"];
                                readonly additionalProperties: false;
                            };
                            readonly minItems: number;
                        };
                        readonly intentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly experimentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly experimentRevision: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly sourceDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly contractDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId", "contract", "files"];
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
        readonly required: ("sessionId" | "approvalId" | "kind" | "projectId" | "id" | "version" | "createdAt" | "updatedAt" | "digest" | "model" | "usage" | "entries" | "expiresAt" | "state" | "effectiveState" | "validity" | "reasons" | "uses" | "maxRuns" | "manifests")[];
        readonly additionalProperties: false;
    };
    readonly run_grant_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly const: "run-grant";
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
                        readonly const: "analyst";
                    };
                };
                readonly required: readonly ["taskId", "teamId", "teamApprovalId", "planDigest", "planVersion", "directiveVersion", "taskSpecDigest", "teamPlanId", "teamPlanVersion", "teamPlanDigest", "role"];
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
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly entries: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        intentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        experimentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        experimentRevision: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        sourceDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        contractDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId"];
                    readonly additionalProperties: false;
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
                        readonly const: "run-submission";
                    };
                };
                readonly required: readonly ["limit", "used", "remaining", "unit"];
                readonly additionalProperties: false;
            };
            readonly uses: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "run-grant-use";
                        };
                        readonly grantId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly grantDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly grantApprovalId: {
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
                        readonly manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly runId: {
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
                        readonly teamId: {
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
                        readonly attemptId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly generation: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
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
                    readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "intentId", "manifestDigest", "approvalId", "runId"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly manifests: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly threadLimit: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly contract: {
                            readonly type: "object";
                            readonly properties: {
                                readonly threadLimit: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly command: {
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
                                readonly environment: {
                                    readonly type: "object";
                                    readonly additionalProperties: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
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
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly runner: {
                                    readonly enum: readonly ["trusted-example", "local", "docker", "ssh"];
                                };
                                readonly localRuntimeId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly gpu: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly vendor: {
                                            readonly const: "nvidia";
                                        };
                                        readonly deviceIds: {
                                            readonly maxItems?: number | undefined;
                                            readonly type: "array";
                                            readonly items: {
                                                readonly pattern: "^GPU-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
                                                readonly type: "string";
                                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                                readonly minLength: number;
                                                readonly maxLength: number;
                                            };
                                            readonly minItems: number;
                                        };
                                    };
                                    readonly required: readonly ["vendor", "deviceIds"];
                                    readonly additionalProperties: false;
                                };
                                readonly sshTargetId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly image: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
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
                                readonly dockerContext: {
                                    readonly pattern?: string | undefined;
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
                                    readonly enum: readonly ["none", "host"];
                                };
                            };
                            readonly required: readonly ["command", "environment", "datasetVersion", "evaluationProtocolVersion", "metrics", "expectedArtifacts", "timeoutSeconds", "runner", "cpus", "memoryMb"];
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
                                };
                                readonly required: readonly ["path", "size", "digest"];
                                readonly additionalProperties: false;
                            };
                            readonly minItems: number;
                        };
                        readonly intentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly experimentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly experimentRevision: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly sourceDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly contractDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId", "contract", "files"];
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
        readonly required: ("sessionId" | "approvalId" | "kind" | "projectId" | "id" | "version" | "createdAt" | "updatedAt" | "digest" | "model" | "usage" | "entries" | "expiresAt" | "state" | "effectiveState" | "validity" | "reasons" | "uses" | "maxRuns" | "manifests")[];
        readonly additionalProperties: false;
    };
    readonly run_grant_activate: {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly const: "run-grant";
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
                        readonly const: "analyst";
                    };
                };
                readonly required: readonly ["taskId", "teamId", "teamApprovalId", "planDigest", "planVersion", "directiveVersion", "taskSpecDigest", "teamPlanId", "teamPlanVersion", "teamPlanDigest", "role"];
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
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly entries: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        intentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        experimentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        experimentRevision: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        sourceDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        contractDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId"];
                    readonly additionalProperties: false;
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
                        readonly const: "run-submission";
                    };
                };
                readonly required: readonly ["limit", "used", "remaining", "unit"];
                readonly additionalProperties: false;
            };
            readonly uses: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "run-grant-use";
                        };
                        readonly grantId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly grantDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly grantApprovalId: {
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
                        readonly manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly runId: {
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
                        readonly teamId: {
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
                        readonly attemptId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly generation: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
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
                    readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "intentId", "manifestDigest", "approvalId", "runId"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly manifests: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly threadLimit: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly contract: {
                            readonly type: "object";
                            readonly properties: {
                                readonly threadLimit: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly command: {
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
                                readonly environment: {
                                    readonly type: "object";
                                    readonly additionalProperties: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
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
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly runner: {
                                    readonly enum: readonly ["trusted-example", "local", "docker", "ssh"];
                                };
                                readonly localRuntimeId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly gpu: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly vendor: {
                                            readonly const: "nvidia";
                                        };
                                        readonly deviceIds: {
                                            readonly maxItems?: number | undefined;
                                            readonly type: "array";
                                            readonly items: {
                                                readonly pattern: "^GPU-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
                                                readonly type: "string";
                                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                                readonly minLength: number;
                                                readonly maxLength: number;
                                            };
                                            readonly minItems: number;
                                        };
                                    };
                                    readonly required: readonly ["vendor", "deviceIds"];
                                    readonly additionalProperties: false;
                                };
                                readonly sshTargetId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly image: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
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
                                readonly dockerContext: {
                                    readonly pattern?: string | undefined;
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
                                    readonly enum: readonly ["none", "host"];
                                };
                            };
                            readonly required: readonly ["command", "environment", "datasetVersion", "evaluationProtocolVersion", "metrics", "expectedArtifacts", "timeoutSeconds", "runner", "cpus", "memoryMb"];
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
                                };
                                readonly required: readonly ["path", "size", "digest"];
                                readonly additionalProperties: false;
                            };
                            readonly minItems: number;
                        };
                        readonly intentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly experimentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly experimentRevision: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly sourceDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly contractDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId", "contract", "files"];
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
        readonly required: ("sessionId" | "approvalId" | "kind" | "projectId" | "id" | "version" | "createdAt" | "updatedAt" | "digest" | "model" | "usage" | "entries" | "expiresAt" | "state" | "effectiveState" | "validity" | "reasons" | "uses" | "maxRuns" | "manifests")[];
        readonly additionalProperties: false;
    };
    readonly run_grant_revoke: {
        readonly type: "object";
        readonly properties: {
            readonly kind: {
                readonly const: "run-grant";
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
                        readonly const: "analyst";
                    };
                };
                readonly required: readonly ["taskId", "teamId", "teamApprovalId", "planDigest", "planVersion", "directiveVersion", "taskSpecDigest", "teamPlanId", "teamPlanVersion", "teamPlanDigest", "role"];
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
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly entries: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        intentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        experimentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        experimentRevision: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        sourceDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        contractDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId"];
                    readonly additionalProperties: false;
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
                        readonly const: "run-submission";
                    };
                };
                readonly required: readonly ["limit", "used", "remaining", "unit"];
                readonly additionalProperties: false;
            };
            readonly uses: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly const: "run-grant-use";
                        };
                        readonly grantId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly grantDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly grantApprovalId: {
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
                        readonly manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly runId: {
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
                        readonly teamId: {
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
                        readonly attemptId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly generation: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
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
                    readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "intentId", "manifestDigest", "approvalId", "runId"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly manifests: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly threadLimit: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly contract: {
                            readonly type: "object";
                            readonly properties: {
                                readonly threadLimit: {
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly command: {
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
                                readonly environment: {
                                    readonly type: "object";
                                    readonly additionalProperties: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
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
                                    readonly type: "integer";
                                    readonly minimum: number;
                                    readonly maximum: number;
                                };
                                readonly runner: {
                                    readonly enum: readonly ["trusted-example", "local", "docker", "ssh"];
                                };
                                readonly localRuntimeId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly gpu: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly vendor: {
                                            readonly const: "nvidia";
                                        };
                                        readonly deviceIds: {
                                            readonly maxItems?: number | undefined;
                                            readonly type: "array";
                                            readonly items: {
                                                readonly pattern: "^GPU-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";
                                                readonly type: "string";
                                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                                readonly minLength: number;
                                                readonly maxLength: number;
                                            };
                                            readonly minItems: number;
                                        };
                                    };
                                    readonly required: readonly ["vendor", "deviceIds"];
                                    readonly additionalProperties: false;
                                };
                                readonly sshTargetId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly image: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
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
                                readonly dockerContext: {
                                    readonly pattern?: string | undefined;
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
                                    readonly enum: readonly ["none", "host"];
                                };
                            };
                            readonly required: readonly ["command", "environment", "datasetVersion", "evaluationProtocolVersion", "metrics", "expectedArtifacts", "timeoutSeconds", "runner", "cpus", "memoryMb"];
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
                                };
                                readonly required: readonly ["path", "size", "digest"];
                                readonly additionalProperties: false;
                            };
                            readonly minItems: number;
                        };
                        readonly intentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly experimentId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly experimentRevision: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        readonly manifestDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly sourceDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly contractDigest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        readonly approvalId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: readonly ["intentId", "experimentId", "experimentRevision", "manifestDigest", "sourceDigest", "contractDigest", "approvalId", "contract", "files"];
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
        readonly required: ("sessionId" | "approvalId" | "kind" | "projectId" | "id" | "version" | "createdAt" | "updatedAt" | "digest" | "model" | "usage" | "entries" | "expiresAt" | "state" | "effectiveState" | "validity" | "reasons" | "uses" | "maxRuns" | "manifests")[];
        readonly additionalProperties: false;
    };
};
