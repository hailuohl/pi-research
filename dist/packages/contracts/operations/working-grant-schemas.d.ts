export declare const WORKING_GRANT_REFERENCE_SCHEMA: {
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
export declare const WORKING_GRANT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
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
            readonly required: ("id" | "rootSessionId" | "revision" | "digest")[];
            readonly additionalProperties: false;
        };
        readonly threadLimit: {
            readonly type: "integer";
            readonly minimum: number;
            readonly maximum: number;
        };
        readonly metricArtifact: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly syntheticFixture: {
            readonly type: "object";
            readonly properties: {
                readonly fixtureRef: {
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
                        readonly generatorVersion: {
                            readonly const: "numeric-regression-v1";
                        };
                        readonly profile: {
                            readonly const: "numeric-regression-v1";
                        };
                        readonly seed: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly splitDigest: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                    };
                    readonly required: ("id" | "seed" | "digest" | "size" | "generatorVersion" | "profile" | "splitDigest")[];
                    readonly additionalProperties: false;
                };
                readonly inputPath: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly inputArgumentIndex: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
            };
            readonly required: ("fixtureRef" | "inputPath" | "inputArgumentIndex")[];
            readonly additionalProperties: false;
        };
        readonly kind: {
            readonly const: "working-grant";
        };
        readonly developmentTaskId: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly templateManifestDigest: {
            minLength: number;
            pattern: string;
            type: "string";
            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            maxLength: number;
        };
        readonly sessionId: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly sourceRevisionId: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
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
                readonly restoreEpoch: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
            };
            readonly required: readonly ["provider", "model", "thinking"];
            readonly additionalProperties: false;
        };
        readonly baselineSnapshot: {
            readonly type: "object";
            readonly properties: {
                readonly digest: {
                    minLength: number;
                    pattern: string;
                    type: "string";
                    description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    maxLength: number;
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
                            readonly mode: {
                                readonly enum: readonly ["100644", "100755"];
                            };
                        };
                        readonly required: readonly ["path", "digest", "size"];
                        readonly additionalProperties: false;
                    };
                    readonly minItems: number;
                };
            };
            readonly required: readonly ["digest", "files"];
            readonly additionalProperties: false;
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
        readonly environmentImageDigest: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly dockerContext: {
            readonly pattern?: string | undefined;
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
            readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
            readonly additionalProperties: false;
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
                    readonly const: "test-submission";
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
                        readonly const: "working-grant-use";
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
                    readonly developmentTaskId: {
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
                    readonly jobId: {
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
                readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "developmentTaskId", "manifestDigest", "approvalId", "jobId"];
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
    readonly required: ("version" | "sessionId" | "state" | "id" | "createdAt" | "projectId" | "model" | "usage" | "digest" | "sourceRevisionId" | "kind" | "updatedAt" | "expiresAt" | "approvalId" | "dockerContext" | "effectiveState" | "resources" | "validity" | "reasons" | "dataArtifacts" | "developmentTaskId" | "templateManifestDigest" | "baselineSnapshot" | "command" | "environmentImageDigest" | "expectedArtifacts" | "editablePaths" | "maxTests" | "maxChangedBytes" | "uses")[];
    readonly additionalProperties: false;
};
export declare const WORKING_GRANT_INPUT_SCHEMAS: {
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
};
export declare const WORKING_GRANT_OUTPUT_SCHEMAS: {
    readonly working_grant_prepare: {
        readonly type: "object";
        readonly properties: {
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
                readonly required: ("id" | "rootSessionId" | "revision" | "digest")[];
                readonly additionalProperties: false;
            };
            readonly threadLimit: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly metricArtifact: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly syntheticFixture: {
                readonly type: "object";
                readonly properties: {
                    readonly fixtureRef: {
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
                            readonly generatorVersion: {
                                readonly const: "numeric-regression-v1";
                            };
                            readonly profile: {
                                readonly const: "numeric-regression-v1";
                            };
                            readonly seed: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly splitDigest: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("id" | "seed" | "digest" | "size" | "generatorVersion" | "profile" | "splitDigest")[];
                        readonly additionalProperties: false;
                    };
                    readonly inputPath: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly inputArgumentIndex: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: ("fixtureRef" | "inputPath" | "inputArgumentIndex")[];
                readonly additionalProperties: false;
            };
            readonly kind: {
                readonly const: "working-grant";
            };
            readonly developmentTaskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly templateManifestDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sourceRevisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
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
                    readonly restoreEpoch: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly baselineSnapshot: {
                readonly type: "object";
                readonly properties: {
                    readonly digest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
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
                                readonly mode: {
                                    readonly enum: readonly ["100644", "100755"];
                                };
                            };
                            readonly required: readonly ["path", "digest", "size"];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                };
                readonly required: readonly ["digest", "files"];
                readonly additionalProperties: false;
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
            readonly environmentImageDigest: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly dockerContext: {
                readonly pattern?: string | undefined;
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
                readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
                readonly additionalProperties: false;
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
                        readonly const: "test-submission";
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
                            readonly const: "working-grant-use";
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
                        readonly developmentTaskId: {
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
                        readonly jobId: {
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
                    readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "developmentTaskId", "manifestDigest", "approvalId", "jobId"];
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
        readonly required: ("version" | "sessionId" | "state" | "id" | "createdAt" | "projectId" | "model" | "usage" | "digest" | "sourceRevisionId" | "kind" | "updatedAt" | "expiresAt" | "approvalId" | "dockerContext" | "effectiveState" | "resources" | "validity" | "reasons" | "dataArtifacts" | "developmentTaskId" | "templateManifestDigest" | "baselineSnapshot" | "command" | "environmentImageDigest" | "expectedArtifacts" | "editablePaths" | "maxTests" | "maxChangedBytes" | "uses")[];
        readonly additionalProperties: false;
    };
    readonly working_grant_inspect: {
        readonly type: "object";
        readonly properties: {
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
                readonly required: ("id" | "rootSessionId" | "revision" | "digest")[];
                readonly additionalProperties: false;
            };
            readonly threadLimit: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly metricArtifact: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly syntheticFixture: {
                readonly type: "object";
                readonly properties: {
                    readonly fixtureRef: {
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
                            readonly generatorVersion: {
                                readonly const: "numeric-regression-v1";
                            };
                            readonly profile: {
                                readonly const: "numeric-regression-v1";
                            };
                            readonly seed: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly splitDigest: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("id" | "seed" | "digest" | "size" | "generatorVersion" | "profile" | "splitDigest")[];
                        readonly additionalProperties: false;
                    };
                    readonly inputPath: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly inputArgumentIndex: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: ("fixtureRef" | "inputPath" | "inputArgumentIndex")[];
                readonly additionalProperties: false;
            };
            readonly kind: {
                readonly const: "working-grant";
            };
            readonly developmentTaskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly templateManifestDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sourceRevisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
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
                    readonly restoreEpoch: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly baselineSnapshot: {
                readonly type: "object";
                readonly properties: {
                    readonly digest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
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
                                readonly mode: {
                                    readonly enum: readonly ["100644", "100755"];
                                };
                            };
                            readonly required: readonly ["path", "digest", "size"];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                };
                readonly required: readonly ["digest", "files"];
                readonly additionalProperties: false;
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
            readonly environmentImageDigest: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly dockerContext: {
                readonly pattern?: string | undefined;
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
                readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
                readonly additionalProperties: false;
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
                        readonly const: "test-submission";
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
                            readonly const: "working-grant-use";
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
                        readonly developmentTaskId: {
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
                        readonly jobId: {
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
                    readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "developmentTaskId", "manifestDigest", "approvalId", "jobId"];
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
        readonly required: ("version" | "sessionId" | "state" | "id" | "createdAt" | "projectId" | "model" | "usage" | "digest" | "sourceRevisionId" | "kind" | "updatedAt" | "expiresAt" | "approvalId" | "dockerContext" | "effectiveState" | "resources" | "validity" | "reasons" | "dataArtifacts" | "developmentTaskId" | "templateManifestDigest" | "baselineSnapshot" | "command" | "environmentImageDigest" | "expectedArtifacts" | "editablePaths" | "maxTests" | "maxChangedBytes" | "uses")[];
        readonly additionalProperties: false;
    };
    readonly working_grant_activate: {
        readonly type: "object";
        readonly properties: {
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
                readonly required: ("id" | "rootSessionId" | "revision" | "digest")[];
                readonly additionalProperties: false;
            };
            readonly threadLimit: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly metricArtifact: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly syntheticFixture: {
                readonly type: "object";
                readonly properties: {
                    readonly fixtureRef: {
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
                            readonly generatorVersion: {
                                readonly const: "numeric-regression-v1";
                            };
                            readonly profile: {
                                readonly const: "numeric-regression-v1";
                            };
                            readonly seed: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly splitDigest: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("id" | "seed" | "digest" | "size" | "generatorVersion" | "profile" | "splitDigest")[];
                        readonly additionalProperties: false;
                    };
                    readonly inputPath: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly inputArgumentIndex: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: ("fixtureRef" | "inputPath" | "inputArgumentIndex")[];
                readonly additionalProperties: false;
            };
            readonly kind: {
                readonly const: "working-grant";
            };
            readonly developmentTaskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly templateManifestDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sourceRevisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
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
                    readonly restoreEpoch: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly baselineSnapshot: {
                readonly type: "object";
                readonly properties: {
                    readonly digest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
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
                                readonly mode: {
                                    readonly enum: readonly ["100644", "100755"];
                                };
                            };
                            readonly required: readonly ["path", "digest", "size"];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                };
                readonly required: readonly ["digest", "files"];
                readonly additionalProperties: false;
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
            readonly environmentImageDigest: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly dockerContext: {
                readonly pattern?: string | undefined;
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
                readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
                readonly additionalProperties: false;
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
                        readonly const: "test-submission";
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
                            readonly const: "working-grant-use";
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
                        readonly developmentTaskId: {
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
                        readonly jobId: {
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
                    readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "developmentTaskId", "manifestDigest", "approvalId", "jobId"];
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
        readonly required: ("version" | "sessionId" | "state" | "id" | "createdAt" | "projectId" | "model" | "usage" | "digest" | "sourceRevisionId" | "kind" | "updatedAt" | "expiresAt" | "approvalId" | "dockerContext" | "effectiveState" | "resources" | "validity" | "reasons" | "dataArtifacts" | "developmentTaskId" | "templateManifestDigest" | "baselineSnapshot" | "command" | "environmentImageDigest" | "expectedArtifacts" | "editablePaths" | "maxTests" | "maxChangedBytes" | "uses")[];
        readonly additionalProperties: false;
    };
    readonly working_grant_revoke: {
        readonly type: "object";
        readonly properties: {
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
                readonly required: ("id" | "rootSessionId" | "revision" | "digest")[];
                readonly additionalProperties: false;
            };
            readonly threadLimit: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly metricArtifact: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly syntheticFixture: {
                readonly type: "object";
                readonly properties: {
                    readonly fixtureRef: {
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
                            readonly generatorVersion: {
                                readonly const: "numeric-regression-v1";
                            };
                            readonly profile: {
                                readonly const: "numeric-regression-v1";
                            };
                            readonly seed: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly splitDigest: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("id" | "seed" | "digest" | "size" | "generatorVersion" | "profile" | "splitDigest")[];
                        readonly additionalProperties: false;
                    };
                    readonly inputPath: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly inputArgumentIndex: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: ("fixtureRef" | "inputPath" | "inputArgumentIndex")[];
                readonly additionalProperties: false;
            };
            readonly kind: {
                readonly const: "working-grant";
            };
            readonly developmentTaskId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly templateManifestDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sourceRevisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
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
                    readonly restoreEpoch: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: readonly ["provider", "model", "thinking"];
                readonly additionalProperties: false;
            };
            readonly baselineSnapshot: {
                readonly type: "object";
                readonly properties: {
                    readonly digest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
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
                                readonly mode: {
                                    readonly enum: readonly ["100644", "100755"];
                                };
                            };
                            readonly required: readonly ["path", "digest", "size"];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                };
                readonly required: readonly ["digest", "files"];
                readonly additionalProperties: false;
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
            readonly environmentImageDigest: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly dockerContext: {
                readonly pattern?: string | undefined;
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
                readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
                readonly additionalProperties: false;
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
                        readonly const: "test-submission";
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
                            readonly const: "working-grant-use";
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
                        readonly developmentTaskId: {
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
                        readonly jobId: {
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
                    readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "grantId", "grantDigest", "grantApprovalId", "developmentTaskId", "manifestDigest", "approvalId", "jobId"];
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
        readonly required: ("version" | "sessionId" | "state" | "id" | "createdAt" | "projectId" | "model" | "usage" | "digest" | "sourceRevisionId" | "kind" | "updatedAt" | "expiresAt" | "approvalId" | "dockerContext" | "effectiveState" | "resources" | "validity" | "reasons" | "dataArtifacts" | "developmentTaskId" | "templateManifestDigest" | "baselineSnapshot" | "command" | "environmentImageDigest" | "expectedArtifacts" | "editablePaths" | "maxTests" | "maxChangedBytes" | "uses")[];
        readonly additionalProperties: false;
    };
};
