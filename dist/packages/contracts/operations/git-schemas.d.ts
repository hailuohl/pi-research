export declare const GIT_INPUT_SCHEMAS: {
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
};
export declare const GIT_OUTPUT_SCHEMAS: {
    readonly workspace_history_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly state: {
                readonly enum: readonly ["unbound", "pending", "ready", "conflict", "failed"];
            };
            readonly sourceRevisionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly branch: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly head: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly operationId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly operationState: {
                readonly enum: readonly ["queued", "running", "complete", "conflict", "failed"];
            };
            readonly error: {
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
        readonly required: readonly ["sessionId", "state"];
        readonly additionalProperties: false;
    };
    readonly workspace_history_diff: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly head: {
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
                        readonly status: {
                            readonly enum: readonly ["added", "modified", "deleted"];
                        };
                        readonly beforeDigest: {
                            readonly anyOf: readonly [{
                                minLength: number;
                                pattern: string;
                                type: "string";
                                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly afterDigest: {
                            readonly anyOf: readonly [{
                                minLength: number;
                                pattern: string;
                                type: "string";
                                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                maxLength: number;
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly beforeMode: {
                            readonly anyOf: readonly [{
                                readonly enum: readonly ["100644", "100755"];
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly afterMode: {
                            readonly anyOf: readonly [{
                                readonly enum: readonly ["100644", "100755"];
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: readonly ["path", "status", "beforeDigest", "afterDigest", "beforeMode", "afterMode"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
        };
        readonly required: readonly ["sessionId", "head", "sourceDigest", "files"];
        readonly additionalProperties: false;
    };
    readonly workspace_history_commit: {
        readonly type: "object";
        readonly properties: {
            readonly operationId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly action: {
                readonly enum: readonly ["source", "checkout", "commit"];
            };
            readonly state: {
                readonly enum: readonly ["queued", "running", "complete", "conflict", "failed"];
            };
            readonly sourceRevisionId: {
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
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly gitCommit: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly error: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["operationId", "action", "state", "sourceRevisionId", "sourceDigest"];
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
            readonly action: {
                readonly enum: readonly ["source", "checkout", "commit"];
            };
            readonly state: {
                readonly enum: readonly ["queued", "running", "complete", "conflict", "failed"];
            };
            readonly sourceRevisionId: {
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
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly gitCommit: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly error: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["operationId", "action", "state", "sourceRevisionId", "sourceDigest"];
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
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
        };
        readonly required: readonly ["path", "mode", "sourceDigest"];
        readonly additionalProperties: false;
    };
};
