import type { InferSchema, JsonSchema } from './schema.js';
declare const string: {
    readonly type: "string";
};
declare const number: {
    readonly type: "number";
};
declare const integer: {
    readonly type: "integer";
};
declare const boolean: {
    readonly type: "boolean";
};
declare const nullableString: {
    readonly anyOf: readonly [{
        readonly type: "string";
    }, {
        readonly type: "null";
    }];
};
declare const strings: {
    readonly type: "array";
    readonly items: {
        readonly type: "string";
    };
};
declare const enumeration: <const V extends string[]>(...values: V) => {
    readonly type: "string";
    readonly enum: V;
};
declare const array: <const I extends JsonSchema>(items: I) => {
    readonly type: "array";
    readonly items: I;
};
declare const object: <const P extends Record<string, JsonSchema>, const O extends readonly (keyof P & string)[] = []>(properties: P, optional?: O) => {
    readonly type: "object";
    readonly properties: P;
    readonly required: Exclude<keyof P & string, O[number]>[];
    readonly additionalProperties: false;
};
declare const row: <const K extends string, const P extends Record<string, JsonSchema>, const O extends readonly (keyof P & string)[] = []>(kind: K, properties: P, optional?: O) => {
    readonly type: "object";
    readonly properties: {
        readonly id: {
            readonly type: "string";
        };
        readonly kind: {
            readonly const: K;
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
    } & P;
    readonly required: (Exclude<"id", O[number]> | Exclude<"kind", O[number]> | Exclude<"projectId", O[number]> | Exclude<"version", O[number]> | Exclude<"createdAt", O[number]> | Exclude<"updatedAt", O[number]> | Exclude<keyof P & string, O[number]>)[];
    readonly additionalProperties: false;
};
declare const nullable: <const S extends JsonSchema>(schema: S) => {
    readonly anyOf: readonly [S, {
        readonly type: "null";
    }];
};
/** All public tool success bodies. Fixed records are closed; only named service-owned dictionaries are open. */
export declare const OUTPUT_SCHEMAS: {
    readonly run_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "run";
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
            readonly experimentId: {
                readonly type: "string";
            };
            readonly intentId: {
                readonly type: "string";
            };
            readonly manifest: {
                readonly type: "object";
                readonly properties: {
                    readonly experimentId: {
                        readonly type: "string";
                    };
                    readonly experimentVersion: {
                        readonly type: "integer";
                    };
                    readonly experimentRevision: {
                        readonly type: "integer";
                    };
                    readonly contract: {
                        readonly type: "object";
                        readonly properties: {
                            readonly command: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly environment: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly type: "string";
                                };
                            };
                            readonly datasetVersion: {
                                readonly type: "string";
                            };
                            readonly evaluationProtocolVersion: {
                                readonly type: "string";
                            };
                            readonly metrics: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly unit: {
                                            readonly type: "string";
                                        };
                                        readonly direction: {
                                            readonly type: "string";
                                            readonly enum: ["min", "max"];
                                        };
                                    };
                                    readonly required: ("unit" | "direction")[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly expectedArtifacts: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly timeoutSeconds: {
                                readonly type: "integer";
                            };
                            readonly runner: {
                                readonly type: "string";
                                readonly enum: ["trusted-example", "docker"];
                            };
                            readonly image: {
                                readonly type: "string";
                            };
                            readonly cpus: {
                                readonly type: "integer";
                            };
                            readonly memoryMb: {
                                readonly type: "integer";
                            };
                            readonly dockerContext: {
                                readonly type: "string";
                            };
                            readonly pids: {
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
                            readonly networkPolicy: {
                                readonly const: "none";
                            };
                        };
                        readonly required: ("cpus" | "memoryMb" | "command" | "expectedArtifacts" | "timeoutSeconds" | "metrics" | "runner" | "environment" | "datasetVersion" | "evaluationProtocolVersion")[];
                        readonly additionalProperties: false;
                    };
                    readonly contractDigest: {
                        readonly type: "string";
                    };
                    readonly snapshotDigest: {
                        readonly type: "string";
                    };
                    readonly snapshotPath: {
                        readonly type: "string";
                    };
                    readonly sourceFiles: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly path: {
                                    readonly type: "string";
                                };
                                readonly size: {
                                    readonly type: "integer";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                                readonly mode: {
                                    readonly type: "string";
                                    readonly enum: ["100644", "100755"];
                                };
                            };
                            readonly required: ("path" | "size" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly createdAt: {
                        readonly type: "string";
                    };
                    readonly sourceRevisionId: {
                        readonly type: "string";
                    };
                    readonly gitCommit: {
                        readonly type: "string";
                    };
                };
                readonly required: ("createdAt" | "experimentId" | "contractDigest" | "contract" | "sourceFiles" | "experimentVersion" | "experimentRevision" | "snapshotDigest" | "snapshotPath")[];
                readonly additionalProperties: false;
            };
            readonly manifestDigest: {
                readonly type: "string";
            };
            readonly state: {
                readonly type: "string";
                readonly enum: ["queued", "submitting", "running", "cancelling", "succeeded", "failed", "cancelled", "unknown"];
            };
            readonly integrity: {
                readonly type: "string";
                readonly enum: ["pending", "complete", "incomplete", "invalid"];
            };
            readonly judgment: {
                readonly type: "string";
                readonly enum: ["pending", "supported", "not_supported", "inconclusive"];
            };
            readonly answerDisposition: {
                readonly type: "string";
                readonly enum: ["answered", "unanswered", "needs_review"];
            };
            readonly answerReviewId: {
                readonly type: "string";
            };
            readonly outputDir: {
                readonly type: "string";
            };
            readonly supervisorPid: {
                readonly type: "integer";
            };
            readonly childPid: {
                readonly type: "integer";
            };
            readonly heartbeat: {
                readonly type: "number";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly exitCode: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                }, {
                    readonly type: "null";
                }];
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly metrics: {
                readonly type: "object";
                readonly additionalProperties: {
                    readonly type: "number";
                };
            };
            readonly error: {
                readonly type: "string";
            };
            readonly artifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly evidenceIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly execution: {
                readonly type: "object";
                readonly properties: {
                    readonly backend: {
                        readonly const: "docker";
                    };
                    readonly dockerContext: {
                        readonly type: "string";
                    };
                    readonly containerName: {
                        readonly type: "string";
                    };
                    readonly containerId: {
                        readonly type: "string";
                    };
                    readonly imageId: {
                        readonly type: "string";
                    };
                    readonly controlDir: {
                        readonly type: "string";
                    };
                    readonly generation: {
                        readonly type: "integer";
                    };
                    readonly leaseUntil: {
                        readonly type: "number";
                    };
                    readonly startRequested: {
                        readonly type: "boolean";
                    };
                    readonly recoveryCount: {
                        readonly type: "integer";
                    };
                    readonly logTruncated: {
                        readonly type: "boolean";
                    };
                    readonly logsIncomplete: {
                        readonly type: "boolean";
                    };
                    readonly outputExceeded: {
                        readonly type: "boolean";
                    };
                };
                readonly required: ("generation" | "backend" | "leaseUntil" | "containerName" | "controlDir" | "startRequested" | "recoveryCount" | "dockerContext")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "experimentId" | "evidenceIds" | "state" | "integrity" | "judgment" | "manifestDigest" | "manifest" | "outputDir" | "cancelRequested" | "artifactIds" | "intentId")[];
        readonly additionalProperties: false;
    };
    readonly reviewed_change_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "change-proposal";
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
            readonly baseExperimentId: {
                readonly type: "string";
            };
            readonly baseRevision: {
                readonly type: "integer";
            };
            readonly baseSnapshot: {
                readonly type: "object";
                readonly properties: {
                    readonly digest: {
                        readonly type: "string";
                    };
                    readonly path: {
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
                                readonly size: {
                                    readonly type: "integer";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                                readonly mode: {
                                    readonly type: "string";
                                    readonly enum: ["100644", "100755"];
                                };
                            };
                            readonly required: ("path" | "size" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                };
                readonly required: ("path" | "digest" | "files")[];
                readonly additionalProperties: false;
            };
            readonly contractDigest: {
                readonly type: "string";
            };
            readonly title: {
                readonly type: "string";
            };
            readonly hypothesis: {
                readonly type: "string";
            };
            readonly changes: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly type: "string";
                        };
                        readonly expectedDigest: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly artifactId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly artifactDigest: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly taskId: {
                            readonly type: "string";
                        };
                        readonly taskResultDigest: {
                            readonly type: "string";
                        };
                        readonly sourceAcceptanceId: {
                            readonly type: "string";
                        };
                        readonly mode: {
                            readonly type: "string";
                            readonly enum: ["100644", "100755"];
                        };
                        readonly beforeMode: {
                            readonly type: "string";
                            readonly enum: ["100644", "100755"];
                        };
                    };
                    readonly required: ("path" | "artifactId" | "expectedDigest" | "artifactDigest")[];
                    readonly additionalProperties: false;
                };
            };
            readonly candidateSnapshot: {
                readonly type: "object";
                readonly properties: {
                    readonly digest: {
                        readonly type: "string";
                    };
                    readonly path: {
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
                                readonly size: {
                                    readonly type: "integer";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                                readonly mode: {
                                    readonly type: "string";
                                    readonly enum: ["100644", "100755"];
                                };
                            };
                            readonly required: ("path" | "size" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                };
                readonly required: ("path" | "digest" | "files")[];
                readonly additionalProperties: false;
            };
            readonly digest: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly state: {
                readonly type: "string";
                readonly enum: ["prepared", "applied"];
            };
            readonly testsStatus: {
                readonly type: "string";
                readonly enum: ["not_run", "passed"];
            };
            readonly testJobId: {
                readonly type: "string";
            };
            readonly appliedExperimentId: {
                readonly type: "string";
            };
            readonly sourceValidity: {
                readonly type: "string";
                readonly enum: ["current", "stale"];
            };
            readonly invalidatedBy: {
                readonly type: "string";
            };
            readonly flow: {
                readonly const: "reviewed-development";
            };
            readonly reviewId: {
                readonly type: "string";
            };
            readonly reviewAcceptanceId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "digest" | "approvalId" | "title" | "state" | "baseExperimentId" | "baseRevision" | "baseSnapshot" | "contractDigest" | "hypothesis" | "changes" | "candidateSnapshot" | "testsStatus")[];
        readonly additionalProperties: false;
    };
    readonly workspace_list: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
                readonly path: {
                    readonly type: "string";
                };
                readonly size: {
                    readonly type: "integer";
                };
                readonly digest: {
                    readonly type: "string";
                };
            };
            readonly required: ("path" | "size")[];
            readonly additionalProperties: false;
        };
    };
    readonly artifact_read: {
        readonly type: "object";
        readonly properties: {
            readonly artifactId: {
                readonly type: "string";
            };
            readonly digest: {
                readonly type: "string";
            };
            readonly title: {
                readonly type: "string";
            };
            readonly mediaType: {
                readonly type: "string";
            };
            readonly content: {
                readonly type: "string";
            };
            readonly cursor: {
                readonly type: "integer";
            };
            readonly complete: {
                readonly type: "boolean";
            };
        };
        readonly required: ("complete" | "cursor" | "digest" | "title" | "mediaType" | "artifactId" | "content")[];
        readonly additionalProperties: false;
    };
    readonly artifact_create: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "artifact";
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
            readonly digest: {
                readonly type: "string";
            };
            readonly size: {
                readonly type: "integer";
            };
            readonly path: {
                readonly type: "string";
            };
            readonly mediaType: {
                readonly type: "string";
            };
            readonly origin: {
                readonly type: "string";
            };
            readonly wakeupId: {
                readonly type: "string";
            };
            readonly runId: {
                readonly type: "string";
            };
            readonly taskId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "path" | "size" | "digest" | "title" | "mediaType" | "origin")[];
        readonly additionalProperties: false;
    };
    readonly report_create: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "artifact";
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
            readonly digest: {
                readonly type: "string";
            };
            readonly size: {
                readonly type: "integer";
            };
            readonly path: {
                readonly type: "string";
            };
            readonly mediaType: {
                readonly type: "string";
            };
            readonly origin: {
                readonly type: "string";
            };
            readonly wakeupId: {
                readonly type: "string";
            };
            readonly runId: {
                readonly type: "string";
            };
            readonly taskId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "path" | "size" | "digest" | "title" | "mediaType" | "origin")[];
        readonly additionalProperties: false;
    };
    readonly report_export: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "artifact";
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
            readonly digest: {
                readonly type: "string";
            };
            readonly size: {
                readonly type: "integer";
            };
            readonly path: {
                readonly type: "string";
            };
            readonly mediaType: {
                readonly type: "string";
            };
            readonly origin: {
                readonly type: "string";
            };
            readonly wakeupId: {
                readonly type: "string";
            };
            readonly runId: {
                readonly type: "string";
            };
            readonly taskId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "path" | "size" | "digest" | "title" | "mediaType" | "origin")[];
        readonly additionalProperties: false;
    };
    readonly evidence_register: {
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
                readonly type: "string";
                readonly enum: ["artifact", "run", "paper", "code"];
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
            readonly runId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "type" | "digest" | "description" | "artifactId" | "locator" | "quote")[];
        readonly additionalProperties: false;
    };
    readonly evidence_read: {
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
                readonly type: "string";
                readonly enum: ["artifact", "run", "paper", "code"];
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
            readonly runId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "type" | "digest" | "description" | "artifactId" | "locator" | "quote")[];
        readonly additionalProperties: false;
    };
    readonly session_notice_read: {
        readonly type: "object";
        readonly properties: {
            readonly messageId: {
                readonly type: "string";
            };
            readonly content: {
                readonly type: "string";
            };
            readonly cursor: {
                readonly type: "integer";
            };
            readonly complete: {
                readonly type: "boolean";
            };
        };
        readonly required: ("complete" | "cursor" | "content" | "messageId")[];
        readonly additionalProperties: false;
    };
    readonly run_logs: {
        readonly type: "object";
        readonly properties: {
            readonly content: {
                readonly type: "string";
            };
            readonly cursor: {
                readonly type: "integer";
            };
            readonly complete: {
                readonly type: "boolean";
            };
            readonly start: {
                readonly type: "integer";
            };
            readonly size: {
                readonly type: "integer";
            };
            readonly identity: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
        };
        readonly required: ("complete" | "cursor" | "size" | "start" | "identity" | "content")[];
        readonly additionalProperties: false;
    };
    readonly run_source_list: {
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
            readonly sourceDigest: {
                readonly type: "string";
            };
            readonly gitCommit: {
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
                        readonly size: {
                            readonly type: "integer";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly mode: {
                            readonly type: "string";
                            readonly enum: ["100644", "100755"];
                        };
                    };
                    readonly required: ("path" | "size" | "digest")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("sourceDigest" | "experimentId" | "revision" | "files" | "runId")[];
        readonly additionalProperties: false;
    };
    readonly run_source_read: {
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
            readonly sourceDigest: {
                readonly type: "string";
            };
            readonly gitCommit: {
                readonly type: "string";
            };
            readonly path: {
                readonly type: "string";
            };
            readonly size: {
                readonly type: "integer";
            };
            readonly digest: {
                readonly type: "string";
            };
            readonly mode: {
                readonly type: "string";
                readonly enum: ["100644", "100755"];
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
            readonly content: {
                readonly type: "string";
            };
        };
        readonly required: ("complete" | "cursor" | "path" | "size" | "digest" | "sourceDigest" | "experimentId" | "revision" | "runId" | "end" | "content")[];
        readonly additionalProperties: false;
    };
    readonly approval_request: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                };
                readonly kind: {
                    readonly const: "approval";
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
                readonly subjectKind: {
                    readonly type: "string";
                };
                readonly subjectId: {
                    readonly type: "string";
                };
                readonly digest: {
                    readonly type: "string";
                };
                readonly scope: {
                    readonly type: "string";
                };
                readonly status: {
                    readonly type: "string";
                    readonly enum: ["pending", "approved", "rejected", "stale"];
                };
                readonly reason: {
                    readonly type: "string";
                };
                readonly decidedAt: {
                    readonly type: "string";
                };
            };
            readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "digest" | "status" | "scope" | "reason" | "subjectKind" | "subjectId")[];
            readonly additionalProperties: false;
        };
    };
    readonly experiment_plan_submit: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "experiment";
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
            readonly hypothesis: {
                readonly type: "string";
            };
            readonly parentId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly lifecycle: {
                readonly type: "string";
                readonly enum: ["provisional", "frozen", "archived"];
            };
            readonly changeProposalId: {
                readonly type: "string";
            };
            readonly contract: {
                readonly type: "object";
                readonly properties: {
                    readonly command: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly environment: {
                        readonly type: "object";
                        readonly additionalProperties: {
                            readonly type: "string";
                        };
                    };
                    readonly datasetVersion: {
                        readonly type: "string";
                    };
                    readonly evaluationProtocolVersion: {
                        readonly type: "string";
                    };
                    readonly metrics: {
                        readonly type: "object";
                        readonly additionalProperties: {
                            readonly type: "object";
                            readonly properties: {
                                readonly unit: {
                                    readonly type: "string";
                                };
                                readonly direction: {
                                    readonly type: "string";
                                    readonly enum: ["min", "max"];
                                };
                            };
                            readonly required: ("unit" | "direction")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly expectedArtifacts: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly timeoutSeconds: {
                        readonly type: "integer";
                    };
                    readonly runner: {
                        readonly type: "string";
                        readonly enum: ["trusted-example", "docker"];
                    };
                    readonly image: {
                        readonly type: "string";
                    };
                    readonly cpus: {
                        readonly type: "integer";
                    };
                    readonly memoryMb: {
                        readonly type: "integer";
                    };
                    readonly dockerContext: {
                        readonly type: "string";
                    };
                    readonly pids: {
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
                    readonly networkPolicy: {
                        readonly const: "none";
                    };
                };
                readonly required: ("cpus" | "memoryMb" | "command" | "expectedArtifacts" | "timeoutSeconds" | "metrics" | "runner" | "environment" | "datasetVersion" | "evaluationProtocolVersion")[];
                readonly additionalProperties: false;
            };
            readonly contractDigest: {
                readonly type: "string";
            };
            readonly workspace: {
                readonly type: "string";
            };
            readonly notes: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly revision: {
                readonly type: "integer";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "revision" | "parentId" | "title" | "contractDigest" | "hypothesis" | "workspace" | "contract" | "lifecycle" | "notes")[];
        readonly additionalProperties: false;
    };
    readonly collaboration_plan_submit: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "team";
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
            readonly rootSessionId: {
                readonly type: "string";
            };
            readonly goal: {
                readonly type: "string";
            };
            readonly state: {
                readonly type: "string";
                readonly enum: ["awaiting_approval", "active", "paused", "draining", "completed", "partial", "failed", "cancelled"];
            };
            readonly settings: {
                readonly type: "object";
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                    };
                    readonly strategy: {
                        readonly type: "string";
                        readonly enum: ["adaptive", "manual"];
                    };
                    readonly maxActiveAgents: {
                        readonly type: "integer";
                    };
                    readonly maxConcurrentAssistants: {
                        readonly type: "integer";
                    };
                    readonly maxTasksPerTeam: {
                        readonly type: "integer";
                    };
                    readonly maxTaskAttempts: {
                        readonly type: "integer";
                    };
                    readonly requirePlanConfirmation: {
                        readonly type: "boolean";
                    };
                    readonly shutdownPolicy: {
                        readonly const: "drain";
                    };
                };
                readonly required: ("maxActiveAgents" | "maxConcurrentAssistants" | "strategy" | "shutdownPolicy" | "enabled" | "maxTasksPerTeam" | "maxTaskAttempts" | "requirePlanConfirmation")[];
                readonly additionalProperties: false;
            };
            readonly delegationEnabled: {
                readonly type: "boolean";
            };
            readonly planVersion: {
                readonly type: "integer";
            };
            readonly directiveVersion: {
                readonly type: "integer";
            };
            readonly planDigest: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly summarySent: {
                readonly type: "boolean";
            };
            readonly autoSummarize: {
                readonly type: "boolean";
            };
            readonly blockReason: {
                readonly type: "string";
            };
            readonly sourceRevisionId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "approvalId" | "planVersion" | "directiveVersion" | "state" | "settings" | "goal" | "rootSessionId" | "delegationEnabled" | "planDigest" | "summarySent")[];
        readonly additionalProperties: false;
    };
    readonly agent_delegate: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "team";
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
            readonly rootSessionId: {
                readonly type: "string";
            };
            readonly goal: {
                readonly type: "string";
            };
            readonly state: {
                readonly type: "string";
                readonly enum: ["awaiting_approval", "active", "paused", "draining", "completed", "partial", "failed", "cancelled"];
            };
            readonly settings: {
                readonly type: "object";
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                    };
                    readonly strategy: {
                        readonly type: "string";
                        readonly enum: ["adaptive", "manual"];
                    };
                    readonly maxActiveAgents: {
                        readonly type: "integer";
                    };
                    readonly maxConcurrentAssistants: {
                        readonly type: "integer";
                    };
                    readonly maxTasksPerTeam: {
                        readonly type: "integer";
                    };
                    readonly maxTaskAttempts: {
                        readonly type: "integer";
                    };
                    readonly requirePlanConfirmation: {
                        readonly type: "boolean";
                    };
                    readonly shutdownPolicy: {
                        readonly const: "drain";
                    };
                };
                readonly required: ("maxActiveAgents" | "maxConcurrentAssistants" | "strategy" | "shutdownPolicy" | "enabled" | "maxTasksPerTeam" | "maxTaskAttempts" | "requirePlanConfirmation")[];
                readonly additionalProperties: false;
            };
            readonly delegationEnabled: {
                readonly type: "boolean";
            };
            readonly planVersion: {
                readonly type: "integer";
            };
            readonly directiveVersion: {
                readonly type: "integer";
            };
            readonly planDigest: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly summarySent: {
                readonly type: "boolean";
            };
            readonly autoSummarize: {
                readonly type: "boolean";
            };
            readonly blockReason: {
                readonly type: "string";
            };
            readonly sourceRevisionId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "approvalId" | "planVersion" | "directiveVersion" | "state" | "settings" | "goal" | "rootSessionId" | "delegationEnabled" | "planDigest" | "summarySent")[];
        readonly additionalProperties: false;
    };
    readonly task_inspect: {
        readonly type: "array";
        readonly items: {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                };
                readonly kind: {
                    readonly const: "task";
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
                readonly key: {
                    readonly type: "string";
                };
                readonly role: {
                    readonly type: "string";
                    readonly enum: ["literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                };
                readonly objective: {
                    readonly type: "string";
                };
                readonly dependencies: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly critical: {
                    readonly type: "boolean";
                };
                readonly reviewOf: {
                    readonly type: "string";
                };
                readonly required: {
                    readonly type: "boolean";
                };
                readonly inputEvidenceIds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly expectedOutputs: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: ["report", "dataset", "patch", "analysis", "review", "code", "text"];
                            };
                            readonly schemaId: {
                                readonly type: "string";
                                readonly enum: ["report", "text", "csv", "json", "patch", "code", "review"];
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly mediaType: {
                                readonly type: "string";
                            };
                            readonly minBytes: {
                                readonly type: "integer";
                            };
                        };
                        readonly required: ("kind" | "required" | "schemaId")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly acceptanceRuleIds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly teamId: {
                    readonly type: "string";
                };
                readonly sessionId: {
                    readonly type: "string";
                };
                readonly execution: {
                    readonly type: "string";
                    readonly enum: ["pending", "running", "output_submitted", "failed", "cancelled", "blocked", "superseded", "waiting_user"];
                };
                readonly acceptance: {
                    readonly type: "string";
                    readonly enum: ["pending", "accepted", "rejected", "disputed"];
                };
                readonly planVersion: {
                    readonly type: "integer";
                };
                readonly directiveVersion: {
                    readonly type: "integer";
                };
                readonly attemptCount: {
                    readonly type: "integer";
                };
                readonly generation: {
                    readonly type: "integer";
                };
                readonly attemptId: {
                    readonly type: "string";
                };
                readonly blockReason: {
                    readonly type: "string";
                };
                readonly result: {
                    readonly type: "object";
                    readonly properties: {
                        readonly summary: {
                            readonly type: "string";
                        };
                        readonly outcome: {
                            readonly type: "string";
                            readonly enum: ["completed", "partial", "blocked"];
                        };
                        readonly evidenceIds: {
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
                        readonly claims: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly statement: {
                                        readonly type: "string";
                                    };
                                    readonly evidenceIds: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly limitations: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly required: ("statement" | "evidenceIds" | "limitations")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly unresolvedQuestions: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly verdict: {
                            readonly type: "string";
                            readonly enum: ["accept", "reject", "disputed"];
                        };
                    };
                    readonly required: ("outcome" | "evidenceIds" | "artifactIds" | "claims" | "unresolvedQuestions" | "summary")[];
                    readonly additionalProperties: false;
                };
                readonly reviewId: {
                    readonly type: "string";
                };
            };
            readonly required: ("key" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "teamId" | "execution" | "acceptance" | "generation" | "planVersion" | "directiveVersion" | "attemptCount" | "role" | "objective" | "dependencies")[];
            readonly additionalProperties: false;
        };
    };
    readonly task_result_read: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly key: {
                readonly type: "string";
            };
            readonly execution: {
                readonly type: "string";
                readonly enum: ["pending", "running", "output_submitted", "failed", "cancelled", "blocked", "superseded", "waiting_user"];
            };
            readonly acceptance: {
                readonly type: "string";
                readonly enum: ["pending", "accepted", "rejected", "disputed"];
            };
            readonly result: {
                readonly type: "object";
                readonly properties: {
                    readonly summary: {
                        readonly type: "string";
                    };
                    readonly outcome: {
                        readonly type: "string";
                        readonly enum: ["completed", "partial", "blocked"];
                    };
                    readonly evidenceIds: {
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
                    readonly claims: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly statement: {
                                    readonly type: "string";
                                };
                                readonly evidenceIds: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly limitations: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly required: ("statement" | "evidenceIds" | "limitations")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly unresolvedQuestions: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly verdict: {
                        readonly type: "string";
                        readonly enum: ["accept", "reject", "disputed"];
                    };
                };
                readonly required: ("outcome" | "evidenceIds" | "artifactIds" | "claims" | "unresolvedQuestions" | "summary")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("key" | "id" | "execution" | "acceptance")[];
        readonly additionalProperties: false;
    };
    readonly task_context_read: {
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly schemaVersion: {
                    readonly const: 1;
                };
                readonly taskId: {
                    readonly type: "string";
                };
                readonly teamId: {
                    readonly type: "string";
                };
                readonly goal: {
                    readonly type: "string";
                };
                readonly objective: {
                    readonly type: "string";
                };
                readonly role: {
                    readonly type: "string";
                    readonly enum: ["literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                };
                readonly planVersion: {
                    readonly type: "integer";
                };
                readonly directiveVersion: {
                    readonly type: "integer";
                };
                readonly inputEvidenceIds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly expectedOutputs: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: ["report", "dataset", "patch", "analysis", "review", "code", "text"];
                            };
                            readonly schemaId: {
                                readonly type: "string";
                                readonly enum: ["report", "text", "csv", "json", "patch", "code", "review"];
                            };
                            readonly required: {
                                readonly type: "boolean";
                            };
                            readonly title: {
                                readonly type: "string";
                            };
                            readonly mediaType: {
                                readonly type: "string";
                            };
                            readonly minBytes: {
                                readonly type: "integer";
                            };
                        };
                        readonly required: ("kind" | "required" | "schemaId")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly acceptanceRuleIds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly upstream: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly key: {
                                readonly type: "string";
                            };
                            readonly result: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly summary: {
                                        readonly type: "string";
                                    };
                                    readonly outcome: {
                                        readonly type: "string";
                                        readonly enum: ["completed", "partial", "blocked"];
                                    };
                                    readonly evidenceIds: {
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
                                    readonly claims: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly statement: {
                                                    readonly type: "string";
                                                };
                                                readonly evidenceIds: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly limitations: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly required: ("statement" | "evidenceIds" | "limitations")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                    readonly unresolvedQuestions: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly verdict: {
                                        readonly type: "string";
                                        readonly enum: ["accept", "reject", "disputed"];
                                    };
                                };
                                readonly required: ("outcome" | "evidenceIds" | "artifactIds" | "claims" | "unresolvedQuestions" | "summary")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly required: ("key" | "id")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly reviewOf: {
                    readonly anyOf: readonly [{
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly key: {
                                readonly type: "string";
                            };
                            readonly result: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly summary: {
                                        readonly type: "string";
                                    };
                                    readonly outcome: {
                                        readonly type: "string";
                                        readonly enum: ["completed", "partial", "blocked"];
                                    };
                                    readonly evidenceIds: {
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
                                    readonly claims: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly statement: {
                                                    readonly type: "string";
                                                };
                                                readonly evidenceIds: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly limitations: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly required: ("statement" | "evidenceIds" | "limitations")[];
                                            readonly additionalProperties: false;
                                        };
                                    };
                                    readonly unresolvedQuestions: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly verdict: {
                                        readonly type: "string";
                                        readonly enum: ["accept", "reject", "disputed"];
                                    };
                                };
                                readonly required: ("outcome" | "evidenceIds" | "artifactIds" | "claims" | "unresolvedQuestions" | "summary")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly required: ("key" | "id")[];
                        readonly additionalProperties: false;
                    }, {
                        readonly type: "null";
                    }];
                };
                readonly restrictions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly stopConditions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly source: {
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
                    readonly required: ("sourceDigest" | "snapshotId" | "experimentId" | "revision")[];
                    readonly additionalProperties: false;
                };
                readonly developmentReview: {
                    readonly type: "object";
                    readonly properties: {
                        readonly reviewId: {
                            readonly type: "string";
                        };
                        readonly jobId: {
                            readonly type: "string";
                        };
                        readonly sourceDigest: {
                            readonly type: "string";
                        };
                        readonly manifestEvidenceId: {
                            readonly type: "string";
                        };
                        readonly testEvidenceIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                    };
                    readonly required: ("jobId" | "sourceDigest" | "manifestEvidenceId" | "testEvidenceIds" | "reviewId")[];
                    readonly additionalProperties: false;
                };
            };
            readonly required: ("teamId" | "taskId" | "reviewOf" | "planVersion" | "directiveVersion" | "role" | "objective" | "inputEvidenceIds" | "expectedOutputs" | "acceptanceRuleIds" | "goal" | "schemaVersion" | "upstream" | "restrictions" | "stopConditions")[];
            readonly additionalProperties: false;
        }, {
            readonly type: "null";
        }];
    };
    readonly task_progress_report: {
        readonly type: "object";
        readonly properties: {
            readonly seq: {
                readonly type: "integer";
            };
            readonly id: {
                readonly type: "string";
            };
            readonly projectId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly type: {
                readonly const: "task.progress";
            };
            readonly payload: {
                readonly type: "object";
                readonly properties: {
                    readonly sessionId: {
                        readonly type: "string";
                    };
                    readonly taskId: {
                        readonly type: "string";
                    };
                    readonly message: {
                        readonly type: "string";
                    };
                };
                readonly required: ("sessionId" | "message")[];
                readonly additionalProperties: false;
            };
            readonly createdAt: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "projectId" | "createdAt" | "seq" | "type" | "payload")[];
        readonly additionalProperties: false;
    };
    readonly research_skill_list: {
        readonly type: "object";
        readonly properties: {
            readonly bundleId: {
                readonly type: "string";
            };
            readonly skills: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly description: {
                            readonly type: "string";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly resources: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly source: {
                            readonly type: "object";
                            readonly properties: {
                                readonly repository: {
                                    readonly type: "string";
                                };
                                readonly commit: {
                                    readonly type: "string";
                                };
                                readonly path: {
                                    readonly type: "string";
                                };
                                readonly blob: {
                                    readonly type: "string";
                                };
                            };
                            readonly required: ("path" | "commit" | "blob" | "repository")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("id" | "digest" | "source" | "description" | "resources")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("skills" | "bundleId")[];
        readonly additionalProperties: false;
    };
    readonly research_skill_read: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly resource: {
                readonly type: "string";
            };
            readonly content: {
                readonly type: "string";
            };
            readonly digest: {
                readonly type: "string";
            };
            readonly bundleId: {
                readonly type: "string";
            };
            readonly source: {
                readonly type: "object";
                readonly properties: {
                    readonly repository: {
                        readonly type: "string";
                    };
                    readonly commit: {
                        readonly type: "string";
                    };
                    readonly path: {
                        readonly type: "string";
                    };
                    readonly blob: {
                        readonly type: "string";
                    };
                };
                readonly required: ("path" | "commit" | "blob" | "repository")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("id" | "digest" | "source" | "content" | "resource" | "bundleId")[];
        readonly additionalProperties: false;
    };
    readonly connector_status: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly enabled: {
                readonly type: "object";
                readonly properties: {
                    readonly alphaxiv: {
                        readonly type: "boolean";
                    };
                    readonly openalex: {
                        readonly type: "boolean";
                    };
                    readonly biorxiv: {
                        readonly type: "boolean";
                    };
                    readonly pubmed: {
                        readonly type: "boolean";
                    };
                    readonly crossref: {
                        readonly type: "boolean";
                    };
                };
                readonly required: ("alphaxiv" | "openalex" | "biorxiv" | "pubmed" | "crossref")[];
                readonly additionalProperties: false;
            };
            readonly requestLimit: {
                readonly type: "integer";
            };
            readonly requestsUsed: {
                readonly type: "integer";
            };
            readonly credentials: {
                readonly type: "object";
                readonly properties: {
                    readonly openalexKeyConfigured: {
                        readonly type: "boolean";
                    };
                    readonly ncbiKeyConfigured: {
                        readonly type: "boolean";
                    };
                    readonly ncbiEmailConfigured: {
                        readonly type: "boolean";
                    };
                };
                readonly required: ("openalexKeyConfigured" | "ncbiKeyConfigured" | "ncbiEmailConfigured")[];
                readonly additionalProperties: false;
            };
            readonly capabilities: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly category: {
                            readonly type: "string";
                            readonly enum: ["literature", "compute", "collaboration", "publication"];
                        };
                        readonly operations: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly implementation: {
                            readonly type: "string";
                            readonly enum: ["http-adapter", "existing-runner", "not-implemented", "existing-service"];
                        };
                        readonly verification: {
                            readonly type: "string";
                            readonly enum: ["fixture-only", "local-example-tested", "not-live-tested", "unavailable", "local-tests"];
                        };
                        readonly credential: {
                            readonly type: "string";
                        };
                        readonly content: {
                            readonly type: "string";
                        };
                        readonly limitation: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("id" | "category" | "implementation" | "verification" | "operations")[];
                    readonly additionalProperties: false;
                };
            };
            readonly budgetUnit: {
                readonly type: "string";
            };
            readonly defaults: {
                readonly type: "string";
            };
        };
        readonly required: ("version" | "enabled" | "credentials" | "capabilities" | "requestLimit" | "requestsUsed" | "budgetUnit" | "defaults")[];
        readonly additionalProperties: false;
    };
    readonly literature_search: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "literature-search";
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
            readonly source: {
                readonly const: "crossref";
            };
            readonly retrievedAt: {
                readonly type: "string";
            };
            readonly coverage: {
                readonly const: "metadata-only";
            };
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly doi: {
                            readonly type: "string";
                        };
                        readonly title: {
                            readonly type: "string";
                        };
                        readonly authors: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly date: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "integer";
                            };
                        };
                        readonly journal: {
                            readonly type: "string";
                        };
                        readonly url: {
                            readonly type: "string";
                        };
                        readonly fullTextRead: {
                            readonly const: false;
                        };
                        readonly source: {
                            readonly const: "crossref";
                        };
                    };
                    readonly required: ("source" | "title" | "date" | "url" | "fullTextRead" | "doi" | "authors" | "journal")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "source" | "query" | "items" | "retrievedAt" | "coverage")[];
        readonly additionalProperties: false;
    };
    readonly literature_discover: {
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
                            readonly type: "string";
                            readonly enum: ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                    };
                    readonly limit: {
                        readonly type: "integer";
                    };
                    readonly strategy: {
                        readonly type: "string";
                        readonly enum: ["keyword", "embedding"];
                    };
                    readonly prioritize: {
                        readonly type: "string";
                        readonly enum: ["default", "recency", "historical", "popular"];
                    };
                    readonly publishedAfter: {
                        readonly type: "string";
                    };
                    readonly publishedBefore: {
                        readonly type: "string";
                    };
                };
                readonly required: ("limit" | "sources" | "query" | "strategy" | "prioritize")[];
                readonly additionalProperties: false;
            };
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly source: {
                            readonly type: "string";
                            readonly enum: ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
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
                                        readonly type: "string";
                                        readonly enum: ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
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
                    readonly required: ("id" | "source" | "title" | "abstract" | "duplicates" | "contentKind" | "url" | "fullTextRead" | "publicationDate")[];
                    readonly additionalProperties: false;
                };
            };
            readonly sources: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly source: {
                            readonly type: "string";
                            readonly enum: ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly enum: ["succeeded", "failed", "disabled"];
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
                readonly type: "string";
                readonly enum: ["complete", "partial"];
            };
            readonly retrievedAt: {
                readonly type: "string";
            };
            readonly coverage: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "status" | "scopeTaskId" | "scopeAttemptId" | "sources" | "query" | "items" | "retrievedAt" | "scopeSessionId" | "coverage" | "request" | "settingsVersion")[];
        readonly additionalProperties: false;
    };
    readonly project_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly textCorpus: {
                readonly type: "object";
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                    };
                    readonly version: {
                        readonly type: "integer";
                    };
                    readonly corpusId: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly sources: {
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
                                readonly title: {
                                    readonly type: "string";
                                };
                                readonly size: {
                                    readonly type: "integer";
                                };
                            };
                            readonly required: ("size" | "digest" | "title" | "artifactId")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly method: {
                        readonly type: "string";
                    };
                    readonly parserVersion: {
                        readonly type: "string";
                    };
                    readonly limits: {
                        readonly type: "object";
                        readonly properties: {
                            readonly files: {
                                readonly type: "integer";
                            };
                            readonly fileBytes: {
                                readonly type: "integer";
                            };
                            readonly totalBytes: {
                                readonly type: "integer";
                            };
                            readonly chunks: {
                                readonly type: "integer";
                            };
                        };
                        readonly required: ("files" | "fileBytes" | "totalBytes" | "chunks")[];
                        readonly additionalProperties: false;
                    };
                    readonly networkCalls: {
                        readonly const: 0;
                    };
                    readonly modelCalls: {
                        readonly const: 0;
                    };
                };
                readonly required: ("version" | "limits" | "sources" | "enabled" | "networkCalls" | "modelCalls" | "corpusId" | "method" | "parserVersion")[];
                readonly additionalProperties: false;
            };
            readonly project: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly name: {
                        readonly type: "string";
                    };
                };
                readonly required: ("id" | "name")[];
                readonly additionalProperties: false;
            };
            readonly experiments: {
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
                        readonly lifecycle: {
                            readonly type: "string";
                            readonly enum: ["provisional", "frozen", "archived"];
                        };
                        readonly revision: {
                            readonly type: "integer";
                        };
                    };
                    readonly required: ("id" | "title" | "lifecycle")[];
                    readonly additionalProperties: false;
                };
            };
            readonly runs: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly state: {
                            readonly type: "string";
                            readonly enum: ["queued", "submitting", "running", "cancelling", "succeeded", "failed", "cancelled", "unknown"];
                        };
                        readonly integrity: {
                            readonly type: "string";
                            readonly enum: ["pending", "complete", "incomplete", "invalid"];
                        };
                        readonly evidenceIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                    };
                    readonly required: ("id" | "evidenceIds" | "state" | "integrity")[];
                    readonly additionalProperties: false;
                };
            };
            readonly evidenceIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly required: ("project" | "evidenceIds" | "runs" | "textCorpus" | "experiments")[];
        readonly additionalProperties: false;
    };
    readonly text_evidence_search: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "text-evidence-search";
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
            readonly limit: {
                readonly type: "integer";
            };
            readonly mmrLambda: {
                readonly type: "number";
            };
            readonly deduplicateExact: {
                readonly type: "boolean";
            };
            readonly artifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly corpusId: {
                readonly type: "string";
            };
            readonly configurationVersion: {
                readonly type: "integer";
            };
            readonly method: {
                readonly type: "string";
            };
            readonly status: {
                readonly type: "string";
                readonly enum: ["matches", "no_lexical_match"];
            };
            readonly hits: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly chunkId: {
                            readonly type: "string";
                        };
                        readonly quote: {
                            readonly type: "string";
                        };
                        readonly alternativeSources: {
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
                                    readonly title: {
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
                                    readonly lineStart: {
                                        readonly type: "integer";
                                    };
                                    readonly lineEnd: {
                                        readonly type: "integer";
                                    };
                                };
                                readonly required: ("digest" | "title" | "artifactId" | "locator" | "lineStart" | "lineEnd")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly score: {
                            readonly type: "number";
                        };
                        readonly evidenceId: {
                            readonly type: "string";
                        };
                        readonly sourceKind: {
                            readonly const: "user_imported_text";
                        };
                        readonly offsetUnit: {
                            readonly const: "utf16-code-unit";
                        };
                        readonly page: {
                            readonly type: "null";
                        };
                        readonly artifactId: {
                            readonly type: "string";
                        };
                        readonly digest: {
                            readonly type: "string";
                        };
                        readonly title: {
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
                        readonly lineStart: {
                            readonly type: "integer";
                        };
                        readonly lineEnd: {
                            readonly type: "integer";
                        };
                    };
                    readonly required: ("digest" | "title" | "artifactId" | "evidenceId" | "locator" | "quote" | "lineStart" | "lineEnd" | "alternativeSources" | "sourceKind" | "offsetUnit" | "page" | "chunkId" | "score")[];
                    readonly additionalProperties: false;
                };
            };
            readonly coverage: {
                readonly type: "object";
                readonly properties: {
                    readonly sourceCount: {
                        readonly type: "integer";
                    };
                    readonly totalChunks: {
                        readonly type: "integer";
                    };
                    readonly matchingChunks: {
                        readonly type: "integer";
                    };
                    readonly exactDuplicatesGrouped: {
                        readonly type: "integer";
                    };
                    readonly uniqueChunks: {
                        readonly type: "integer";
                    };
                    readonly candidatesConsidered: {
                        readonly type: "integer";
                    };
                    readonly candidateLimitReached: {
                        readonly type: "boolean";
                    };
                    readonly resultsTruncated: {
                        readonly type: "boolean";
                    };
                };
                readonly required: ("sourceCount" | "totalChunks" | "matchingChunks" | "exactDuplicatesGrouped" | "uniqueChunks" | "candidatesConsidered" | "candidateLimitReached" | "resultsTruncated")[];
                readonly additionalProperties: false;
            };
            readonly usage: {
                readonly type: "object";
                readonly properties: {
                    readonly modelCalls: {
                        readonly const: 0;
                    };
                    readonly networkCalls: {
                        readonly const: 0;
                    };
                };
                readonly required: ("networkCalls" | "modelCalls")[];
                readonly additionalProperties: false;
            };
            readonly limitations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "limit" | "limitations" | "status" | "artifactIds" | "query" | "usage" | "deduplicateExact" | "mmrLambda" | "coverage" | "corpusId" | "method" | "hits" | "configurationVersion")[];
        readonly additionalProperties: false;
    };
    readonly campaign_enroll: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "campaign-member";
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
            readonly experimentId: {
                readonly type: "string";
            };
            readonly intentId: {
                readonly type: "string";
            };
            readonly required: {
                readonly type: "boolean";
            };
            readonly repairDecisionId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "experimentId" | "required" | "campaignId" | "intentId" | "roundId")[];
        readonly additionalProperties: false;
    };
    readonly campaign_decision_submit: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "campaign-decision";
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
            readonly action: {
                readonly type: "string";
                readonly enum: ["repair", "refill", "promote", "stop"];
            };
            readonly reason: {
                readonly type: "string";
            };
            readonly observationIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly selectedRunId: {
                readonly type: "string";
            };
            readonly candidates: {
                readonly type: "array";
                readonly items: {
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
                            readonly additionalProperties: {};
                        };
                    };
                    readonly required: ("title" | "hypothesis" | "config")[];
                    readonly additionalProperties: false;
                };
            };
            readonly inputDigest: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly decisionDigest: {
                readonly type: "string";
            };
            readonly status: {
                readonly type: "string";
                readonly enum: ["proposed", "applied"];
            };
            readonly appliedAt: {
                readonly type: "string";
            };
            readonly effects: {
                readonly type: "object";
                readonly properties: {
                    readonly experimentIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly intentIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly roundId: {
                        readonly type: "string";
                    };
                    readonly stopped: {
                        readonly type: "boolean";
                    };
                };
                readonly required: ("roundId" | "experimentIds" | "intentIds" | "stopped")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "approvalId" | "status" | "action" | "reason" | "campaignId" | "observationIds" | "candidates" | "inputDigest" | "roundId" | "decisionDigest")[];
        readonly additionalProperties: false;
    };
    readonly campaign_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly campaign: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly kind: {
                        readonly const: "campaign";
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
                    readonly goal: {
                        readonly type: "string";
                    };
                    readonly rootSessionId: {
                        readonly type: "string";
                    };
                    readonly rootModel: {
                        readonly type: "object";
                        readonly properties: {
                            readonly provider: {
                                readonly type: "string";
                            };
                            readonly model: {
                                readonly type: "string";
                            };
                            readonly thinking: {
                                readonly type: "string";
                                readonly enum: ["off", "minimal", "low", "medium", "high", "xhigh"];
                            };
                        };
                        readonly required: ("model" | "thinking" | "provider")[];
                        readonly additionalProperties: false;
                    };
                    readonly baselineExperimentId: {
                        readonly type: "string";
                    };
                    readonly focusExperimentId: {
                        readonly type: "string";
                    };
                    readonly contractDigest: {
                        readonly type: "string";
                    };
                    readonly primaryMetric: {
                        readonly type: "string";
                    };
                    readonly direction: {
                        readonly type: "string";
                        readonly enum: ["min", "max"];
                    };
                    readonly state: {
                        readonly type: "string";
                        readonly enum: ["draft", "active", "paused", "stopped"];
                    };
                    readonly currentRoundId: {
                        readonly type: "string";
                    };
                    readonly roundNumber: {
                        readonly type: "integer";
                    };
                    readonly limits: {
                        readonly type: "object";
                        readonly properties: {
                            readonly maxRounds: {
                                readonly type: "integer";
                            };
                            readonly maxCandidatesPerRound: {
                                readonly type: "integer";
                            };
                            readonly maxUnansweredRunsPerNode: {
                                readonly type: "integer";
                            };
                            readonly maxConsecutiveRegressions: {
                                readonly type: "integer";
                            };
                            readonly maxAnalysisAttempts: {
                                readonly type: "integer";
                            };
                            readonly deadline: {
                                readonly type: "string";
                            };
                        };
                        readonly required: ("maxRounds" | "maxCandidatesPerRound" | "maxUnansweredRunsPerNode" | "maxConsecutiveRegressions" | "maxAnalysisAttempts")[];
                        readonly additionalProperties: false;
                    };
                    readonly autoAnalyze: {
                        readonly type: "boolean";
                    };
                    readonly approvalId: {
                        readonly type: "string";
                    };
                    readonly planDigest: {
                        readonly type: "string";
                    };
                    readonly consecutiveRegressions: {
                        readonly type: "integer";
                    };
                    readonly stopReason: {
                        readonly type: "string";
                    };
                };
                readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "approvalId" | "state" | "contractDigest" | "limits" | "direction" | "goal" | "rootSessionId" | "planDigest" | "rootModel" | "baselineExperimentId" | "focusExperimentId" | "primaryMetric" | "currentRoundId" | "roundNumber" | "autoAnalyze" | "consecutiveRegressions")[];
                readonly additionalProperties: false;
            };
            readonly members: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "campaign-member";
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
                        readonly experimentId: {
                            readonly type: "string";
                        };
                        readonly intentId: {
                            readonly type: "string";
                        };
                        readonly required: {
                            readonly type: "boolean";
                        };
                        readonly repairDecisionId: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "experimentId" | "required" | "campaignId" | "intentId" | "roundId")[];
                    readonly additionalProperties: false;
                };
            };
            readonly rounds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "research-round";
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
                        readonly number: {
                            readonly type: "integer";
                        };
                        readonly parentExperimentId: {
                            readonly type: "string";
                        };
                        readonly state: {
                            readonly type: "string";
                            readonly enum: ["open", "closed"];
                        };
                        readonly decisionId: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("number" | "id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "state" | "campaignId" | "parentExperimentId")[];
                    readonly additionalProperties: false;
                };
            };
            readonly observations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "run-observation";
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
                        readonly memberId: {
                            readonly type: "string";
                        };
                        readonly runId: {
                            readonly type: "string";
                        };
                        readonly experimentId: {
                            readonly type: "string";
                        };
                        readonly manifestDigest: {
                            readonly type: "string";
                        };
                        readonly contentDigest: {
                            readonly type: "string";
                        };
                        readonly executionState: {
                            readonly type: "string";
                            readonly enum: ["queued", "submitting", "running", "cancelling", "succeeded", "failed", "cancelled", "unknown"];
                        };
                        readonly integrity: {
                            readonly type: "string";
                            readonly enum: ["pending", "complete", "incomplete", "invalid"];
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
                        readonly validation: {
                            readonly type: "string";
                            readonly enum: ["verified", "incomplete", "invalid"];
                        };
                        readonly explanation: {
                            readonly type: "string";
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly enum: ["pending", "decided"];
                        };
                        readonly decisionId: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "experimentId" | "runId" | "evidenceIds" | "status" | "integrity" | "manifestDigest" | "metrics" | "campaignId" | "roundId" | "validation" | "memberId" | "contentDigest" | "executionState" | "explanation")[];
                    readonly additionalProperties: false;
                };
            };
            readonly decisions: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "campaign-decision";
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
                        readonly action: {
                            readonly type: "string";
                            readonly enum: ["repair", "refill", "promote", "stop"];
                        };
                        readonly reason: {
                            readonly type: "string";
                        };
                        readonly observationIds: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly selectedRunId: {
                            readonly type: "string";
                        };
                        readonly candidates: {
                            readonly type: "array";
                            readonly items: {
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
                                        readonly additionalProperties: {};
                                    };
                                };
                                readonly required: ("title" | "hypothesis" | "config")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly inputDigest: {
                            readonly type: "string";
                        };
                        readonly approvalId: {
                            readonly type: "string";
                        };
                        readonly decisionDigest: {
                            readonly type: "string";
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly enum: ["proposed", "applied"];
                        };
                        readonly appliedAt: {
                            readonly type: "string";
                        };
                        readonly effects: {
                            readonly type: "object";
                            readonly properties: {
                                readonly experimentIds: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly intentIds: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly roundId: {
                                    readonly type: "string";
                                };
                                readonly stopped: {
                                    readonly type: "boolean";
                                };
                            };
                            readonly required: ("roundId" | "experimentIds" | "intentIds" | "stopped")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "approvalId" | "status" | "action" | "reason" | "campaignId" | "observationIds" | "candidates" | "inputDigest" | "roundId" | "decisionDigest")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("campaign" | "members" | "rounds" | "observations" | "decisions")[];
        readonly additionalProperties: false;
    };
    readonly experiment_source_list: {
        readonly type: "object";
        readonly properties: {
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
            readonly snapshotId: {
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
            readonly revision: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
        };
        readonly required: readonly ["snapshotId", "experimentId", "revision", "sourceDigest", "files"];
        readonly additionalProperties: false;
    };
    readonly experiment_source_read: {
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
            readonly cursor: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly end: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly complete: {
                readonly type: "boolean";
            };
            readonly content: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly snapshotId: {
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
            readonly revision: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
        };
        readonly required: readonly ["snapshotId", "experimentId", "revision", "sourceDigest", "path", "digest", "size", "cursor", "end", "complete", "content"];
        readonly additionalProperties: false;
    };
    readonly experiment_source_diff: {
        readonly type: "object";
        readonly properties: {
            readonly from: {
                readonly type: "object";
                readonly properties: {
                    snapshotId: {
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
                    revision: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    sourceDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                };
                readonly required: readonly ["snapshotId", "experimentId", "revision", "sourceDigest"];
                readonly additionalProperties: false;
            };
            readonly to: {
                readonly type: "object";
                readonly properties: {
                    snapshotId: {
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
                    revision: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    sourceDigest: {
                        minLength: number;
                        pattern: string;
                        type: "string";
                        description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        maxLength: number;
                    };
                };
                readonly required: readonly ["snapshotId", "experimentId", "revision", "sourceDigest"];
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
                    readonly required: readonly ["path", "status", "beforeDigest", "afterDigest"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
        };
        readonly required: readonly ["from", "to", "files"];
        readonly additionalProperties: false;
    };
    readonly workspace_prepare_from_revision: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly sessionVersion: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly prepared: {
                readonly type: "boolean";
            };
            readonly gitState: {
                readonly enum: readonly ["pending", "ready", "conflict", "failed"];
            };
            readonly gitOperationId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly snapshotId: {
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
            readonly revision: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
        };
        readonly required: readonly ["snapshotId", "experimentId", "revision", "sourceDigest", "sessionId", "sessionVersion", "prepared"];
        readonly additionalProperties: false;
    };
    readonly run_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "run-intent";
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
            readonly experimentId: {
                readonly type: "string";
            };
            readonly manifest: {
                readonly type: "object";
                readonly properties: {
                    readonly experimentId: {
                        readonly type: "string";
                    };
                    readonly experimentVersion: {
                        readonly type: "integer";
                    };
                    readonly experimentRevision: {
                        readonly type: "integer";
                    };
                    readonly contract: {
                        readonly type: "object";
                        readonly properties: {
                            readonly command: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly environment: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly type: "string";
                                };
                            };
                            readonly datasetVersion: {
                                readonly type: "string";
                            };
                            readonly evaluationProtocolVersion: {
                                readonly type: "string";
                            };
                            readonly metrics: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly unit: {
                                            readonly type: "string";
                                        };
                                        readonly direction: {
                                            readonly type: "string";
                                            readonly enum: ["min", "max"];
                                        };
                                    };
                                    readonly required: ("unit" | "direction")[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly expectedArtifacts: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly timeoutSeconds: {
                                readonly type: "integer";
                            };
                            readonly runner: {
                                readonly type: "string";
                                readonly enum: ["trusted-example", "docker"];
                            };
                            readonly image: {
                                readonly type: "string";
                            };
                            readonly cpus: {
                                readonly type: "integer";
                            };
                            readonly memoryMb: {
                                readonly type: "integer";
                            };
                            readonly dockerContext: {
                                readonly type: "string";
                            };
                            readonly pids: {
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
                            readonly networkPolicy: {
                                readonly const: "none";
                            };
                        };
                        readonly required: ("cpus" | "memoryMb" | "command" | "expectedArtifacts" | "timeoutSeconds" | "metrics" | "runner" | "environment" | "datasetVersion" | "evaluationProtocolVersion")[];
                        readonly additionalProperties: false;
                    };
                    readonly contractDigest: {
                        readonly type: "string";
                    };
                    readonly snapshotDigest: {
                        readonly type: "string";
                    };
                    readonly snapshotPath: {
                        readonly type: "string";
                    };
                    readonly sourceFiles: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly path: {
                                    readonly type: "string";
                                };
                                readonly size: {
                                    readonly type: "integer";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                                readonly mode: {
                                    readonly type: "string";
                                    readonly enum: ["100644", "100755"];
                                };
                            };
                            readonly required: ("path" | "size" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly createdAt: {
                        readonly type: "string";
                    };
                    readonly sourceRevisionId: {
                        readonly type: "string";
                    };
                    readonly gitCommit: {
                        readonly type: "string";
                    };
                };
                readonly required: ("createdAt" | "experimentId" | "contractDigest" | "contract" | "sourceFiles" | "experimentVersion" | "experimentRevision" | "snapshotDigest" | "snapshotPath")[];
                readonly additionalProperties: false;
            };
            readonly manifestDigest: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly status: {
                readonly type: "string";
                readonly enum: ["prepared", "submitted"];
            };
            readonly runId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "approvalId" | "experimentId" | "status" | "manifestDigest" | "manifest")[];
        readonly additionalProperties: false;
    };
    readonly run_submit: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "run";
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
            readonly experimentId: {
                readonly type: "string";
            };
            readonly intentId: {
                readonly type: "string";
            };
            readonly manifest: {
                readonly type: "object";
                readonly properties: {
                    readonly experimentId: {
                        readonly type: "string";
                    };
                    readonly experimentVersion: {
                        readonly type: "integer";
                    };
                    readonly experimentRevision: {
                        readonly type: "integer";
                    };
                    readonly contract: {
                        readonly type: "object";
                        readonly properties: {
                            readonly command: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly environment: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly type: "string";
                                };
                            };
                            readonly datasetVersion: {
                                readonly type: "string";
                            };
                            readonly evaluationProtocolVersion: {
                                readonly type: "string";
                            };
                            readonly metrics: {
                                readonly type: "object";
                                readonly additionalProperties: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly unit: {
                                            readonly type: "string";
                                        };
                                        readonly direction: {
                                            readonly type: "string";
                                            readonly enum: ["min", "max"];
                                        };
                                    };
                                    readonly required: ("unit" | "direction")[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly expectedArtifacts: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly timeoutSeconds: {
                                readonly type: "integer";
                            };
                            readonly runner: {
                                readonly type: "string";
                                readonly enum: ["trusted-example", "docker"];
                            };
                            readonly image: {
                                readonly type: "string";
                            };
                            readonly cpus: {
                                readonly type: "integer";
                            };
                            readonly memoryMb: {
                                readonly type: "integer";
                            };
                            readonly dockerContext: {
                                readonly type: "string";
                            };
                            readonly pids: {
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
                            readonly networkPolicy: {
                                readonly const: "none";
                            };
                        };
                        readonly required: ("cpus" | "memoryMb" | "command" | "expectedArtifacts" | "timeoutSeconds" | "metrics" | "runner" | "environment" | "datasetVersion" | "evaluationProtocolVersion")[];
                        readonly additionalProperties: false;
                    };
                    readonly contractDigest: {
                        readonly type: "string";
                    };
                    readonly snapshotDigest: {
                        readonly type: "string";
                    };
                    readonly snapshotPath: {
                        readonly type: "string";
                    };
                    readonly sourceFiles: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly path: {
                                    readonly type: "string";
                                };
                                readonly size: {
                                    readonly type: "integer";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                                readonly mode: {
                                    readonly type: "string";
                                    readonly enum: ["100644", "100755"];
                                };
                            };
                            readonly required: ("path" | "size" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly createdAt: {
                        readonly type: "string";
                    };
                    readonly sourceRevisionId: {
                        readonly type: "string";
                    };
                    readonly gitCommit: {
                        readonly type: "string";
                    };
                };
                readonly required: ("createdAt" | "experimentId" | "contractDigest" | "contract" | "sourceFiles" | "experimentVersion" | "experimentRevision" | "snapshotDigest" | "snapshotPath")[];
                readonly additionalProperties: false;
            };
            readonly manifestDigest: {
                readonly type: "string";
            };
            readonly state: {
                readonly type: "string";
                readonly enum: ["queued", "submitting", "running", "cancelling", "succeeded", "failed", "cancelled", "unknown"];
            };
            readonly integrity: {
                readonly type: "string";
                readonly enum: ["pending", "complete", "incomplete", "invalid"];
            };
            readonly judgment: {
                readonly type: "string";
                readonly enum: ["pending", "supported", "not_supported", "inconclusive"];
            };
            readonly answerDisposition: {
                readonly type: "string";
                readonly enum: ["answered", "unanswered", "needs_review"];
            };
            readonly answerReviewId: {
                readonly type: "string";
            };
            readonly outputDir: {
                readonly type: "string";
            };
            readonly supervisorPid: {
                readonly type: "integer";
            };
            readonly childPid: {
                readonly type: "integer";
            };
            readonly heartbeat: {
                readonly type: "number";
            };
            readonly startedAt: {
                readonly type: "string";
            };
            readonly endedAt: {
                readonly type: "string";
            };
            readonly exitCode: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                }, {
                    readonly type: "null";
                }];
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
            readonly metrics: {
                readonly type: "object";
                readonly additionalProperties: {
                    readonly type: "number";
                };
            };
            readonly error: {
                readonly type: "string";
            };
            readonly artifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly evidenceIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly execution: {
                readonly type: "object";
                readonly properties: {
                    readonly backend: {
                        readonly const: "docker";
                    };
                    readonly dockerContext: {
                        readonly type: "string";
                    };
                    readonly containerName: {
                        readonly type: "string";
                    };
                    readonly containerId: {
                        readonly type: "string";
                    };
                    readonly imageId: {
                        readonly type: "string";
                    };
                    readonly controlDir: {
                        readonly type: "string";
                    };
                    readonly generation: {
                        readonly type: "integer";
                    };
                    readonly leaseUntil: {
                        readonly type: "number";
                    };
                    readonly startRequested: {
                        readonly type: "boolean";
                    };
                    readonly recoveryCount: {
                        readonly type: "integer";
                    };
                    readonly logTruncated: {
                        readonly type: "boolean";
                    };
                    readonly logsIncomplete: {
                        readonly type: "boolean";
                    };
                    readonly outputExceeded: {
                        readonly type: "boolean";
                    };
                };
                readonly required: ("generation" | "backend" | "leaseUntil" | "containerName" | "controlDir" | "startRequested" | "recoveryCount" | "dockerContext")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "experimentId" | "evidenceIds" | "state" | "integrity" | "judgment" | "manifestDigest" | "manifest" | "outputDir" | "cancelRequested" | "artifactIds" | "intentId")[];
        readonly additionalProperties: false;
    };
    readonly workspace_read: {
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
            readonly size: {
                readonly type: "integer";
            };
        };
        readonly required: ("path" | "size" | "digest" | "content")[];
        readonly additionalProperties: false;
    };
    readonly workspace_write: {
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
        };
        readonly required: ("path" | "size" | "digest")[];
        readonly additionalProperties: false;
    };
    readonly change_proposal_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "change-proposal";
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
            readonly baseExperimentId: {
                readonly type: "string";
            };
            readonly baseRevision: {
                readonly type: "integer";
            };
            readonly baseSnapshot: {
                readonly type: "object";
                readonly properties: {
                    readonly digest: {
                        readonly type: "string";
                    };
                    readonly path: {
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
                                readonly size: {
                                    readonly type: "integer";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                                readonly mode: {
                                    readonly type: "string";
                                    readonly enum: ["100644", "100755"];
                                };
                            };
                            readonly required: ("path" | "size" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                };
                readonly required: ("path" | "digest" | "files")[];
                readonly additionalProperties: false;
            };
            readonly contractDigest: {
                readonly type: "string";
            };
            readonly title: {
                readonly type: "string";
            };
            readonly hypothesis: {
                readonly type: "string";
            };
            readonly changes: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly path: {
                            readonly type: "string";
                        };
                        readonly expectedDigest: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly artifactId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly artifactDigest: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly taskId: {
                            readonly type: "string";
                        };
                        readonly taskResultDigest: {
                            readonly type: "string";
                        };
                        readonly sourceAcceptanceId: {
                            readonly type: "string";
                        };
                        readonly mode: {
                            readonly type: "string";
                            readonly enum: ["100644", "100755"];
                        };
                        readonly beforeMode: {
                            readonly type: "string";
                            readonly enum: ["100644", "100755"];
                        };
                    };
                    readonly required: ("path" | "artifactId" | "expectedDigest" | "artifactDigest")[];
                    readonly additionalProperties: false;
                };
            };
            readonly candidateSnapshot: {
                readonly type: "object";
                readonly properties: {
                    readonly digest: {
                        readonly type: "string";
                    };
                    readonly path: {
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
                                readonly size: {
                                    readonly type: "integer";
                                };
                                readonly digest: {
                                    readonly type: "string";
                                };
                                readonly mode: {
                                    readonly type: "string";
                                    readonly enum: ["100644", "100755"];
                                };
                            };
                            readonly required: ("path" | "size" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                };
                readonly required: ("path" | "digest" | "files")[];
                readonly additionalProperties: false;
            };
            readonly digest: {
                readonly type: "string";
            };
            readonly approvalId: {
                readonly type: "string";
            };
            readonly state: {
                readonly type: "string";
                readonly enum: ["prepared", "applied"];
            };
            readonly testsStatus: {
                readonly type: "string";
                readonly enum: ["not_run", "passed"];
            };
            readonly testJobId: {
                readonly type: "string";
            };
            readonly appliedExperimentId: {
                readonly type: "string";
            };
            readonly sourceValidity: {
                readonly type: "string";
                readonly enum: ["current", "stale"];
            };
            readonly invalidatedBy: {
                readonly type: "string";
            };
            readonly flow: {
                readonly const: "reviewed-development";
            };
            readonly reviewId: {
                readonly type: "string";
            };
            readonly reviewAcceptanceId: {
                readonly type: "string";
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "digest" | "approvalId" | "title" | "state" | "baseExperimentId" | "baseRevision" | "baseSnapshot" | "contractDigest" | "hypothesis" | "changes" | "candidateSnapshot" | "testsStatus")[];
        readonly additionalProperties: false;
    };
    readonly task_result_submit: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "task-result";
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
            readonly taskId: {
                readonly type: "string";
            };
            readonly attemptId: {
                readonly type: "string";
            };
            readonly planVersion: {
                readonly type: "integer";
            };
            readonly directiveVersion: {
                readonly type: "integer";
            };
            readonly inputDigest: {
                readonly type: "string";
            };
            readonly digest: {
                readonly type: "string";
            };
            readonly result: {
                readonly type: "object";
                readonly properties: {
                    readonly summary: {
                        readonly type: "string";
                    };
                    readonly outcome: {
                        readonly type: "string";
                        readonly enum: ["completed", "partial", "blocked"];
                    };
                    readonly evidenceIds: {
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
                    readonly claims: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly statement: {
                                    readonly type: "string";
                                };
                                readonly evidenceIds: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly limitations: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly required: ("statement" | "evidenceIds" | "limitations")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly unresolvedQuestions: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly verdict: {
                        readonly type: "string";
                        readonly enum: ["accept", "reject", "disputed"];
                    };
                };
                readonly required: ("outcome" | "evidenceIds" | "artifactIds" | "claims" | "unresolvedQuestions" | "summary")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "digest" | "taskId" | "result" | "planVersion" | "directiveVersion" | "attemptId" | "inputDigest")[];
        readonly additionalProperties: false;
    };
    readonly paper_read: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "paper-read";
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
            readonly source: {
                readonly type: "string";
                readonly enum: ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
            };
            readonly idInSource: {
                readonly type: "string";
            };
            readonly requestedId: {
                readonly type: "string";
            };
            readonly title: {
                readonly type: "string";
            };
            readonly sourceUrl: {
                readonly type: "string";
            };
            readonly contentKind: {
                readonly type: "string";
                readonly enum: ["metadata", "abstract", "full_text"];
            };
            readonly versionAssurance: {
                readonly type: "string";
                readonly enum: ["requested-address-unverified", "provider-record"];
            };
            readonly pageMapping: {
                readonly const: "unavailable";
            };
            readonly artifactId: {
                readonly type: "string";
            };
            readonly artifactDigest: {
                readonly type: "string";
            };
            readonly rawArtifactIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly fullTextRead: {
                readonly type: "boolean";
            };
            readonly retrievedAt: {
                readonly type: "string";
            };
            readonly scopeSessionId: {
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
            readonly sourceResponses: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly url: {
                            readonly type: "string";
                        };
                        readonly contentType: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("url" | "contentType")[];
                    readonly additionalProperties: false;
                };
            };
            readonly limitations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "source" | "title" | "limitations" | "scopeAttemptId" | "artifactId" | "artifactDigest" | "contentKind" | "versionAssurance" | "pageMapping" | "sourceResponses" | "idInSource" | "requestedId" | "sourceUrl" | "rawArtifactIds" | "fullTextRead" | "retrievedAt" | "scopeSessionId")[];
        readonly additionalProperties: false;
    };
    readonly compute_target_probe: {
        readonly type: "object";
        readonly properties: {
            readonly context: {
                readonly type: "string";
            };
            readonly targetId: {
                readonly type: "string";
            };
            readonly backend: {
                readonly const: "docker";
            };
            readonly observedAt: {
                readonly type: "string";
            };
        };
        readonly required: ("targetId" | "context" | "backend" | "observedAt")[];
        readonly additionalProperties: false;
    };
    readonly compute_queue_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly scope: {
                readonly const: "shared-data-directory";
            };
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly version: {
                        readonly type: "integer";
                    };
                    readonly targetId: {
                        readonly type: "string";
                    };
                    readonly limits: {
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
                        readonly required: ("maxRuns" | "maxDevelopment" | "cpus" | "memoryMb" | "maxJobs" | "maxQueued")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly required: ("version" | "targetId" | "limits")[];
                readonly additionalProperties: false;
            };
            readonly usage: {
                readonly type: "object";
                readonly properties: {
                    readonly jobs: {
                        readonly type: "integer";
                    };
                    readonly runs: {
                        readonly type: "integer";
                    };
                    readonly development: {
                        readonly type: "integer";
                    };
                    readonly cpus: {
                        readonly type: "number";
                    };
                    readonly memoryMb: {
                        readonly type: "integer";
                    };
                    readonly unknown: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("unknown" | "development" | "jobs" | "runs" | "cpus" | "memoryMb")[];
                readonly additionalProperties: false;
            };
            readonly available: {
                readonly type: "object";
                readonly properties: {
                    readonly jobs: {
                        readonly type: "integer";
                    };
                    readonly runs: {
                        readonly type: "integer";
                    };
                    readonly development: {
                        readonly type: "integer";
                    };
                    readonly cpus: {
                        readonly anyOf: readonly [{
                            readonly type: "number";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly memoryMb: {
                        readonly anyOf: readonly [{
                            readonly type: "integer";
                        }, {
                            readonly type: "null";
                        }];
                    };
                };
                readonly required: ("development" | "jobs" | "runs" | "cpus" | "memoryMb")[];
                readonly additionalProperties: false;
            };
            readonly queued: {
                readonly type: "integer";
            };
            readonly targets: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly targetId: {
                            readonly type: "string";
                        };
                        readonly backend: {
                            readonly enum: readonly ["docker", "trusted-example"];
                        };
                        readonly contexts: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                        readonly configuration: {
                            readonly type: "object";
                            readonly properties: {
                                readonly version: {
                                    readonly type: "integer";
                                };
                                readonly targetId: {
                                    readonly type: "string";
                                };
                                readonly limits: {
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
                                    readonly required: ("maxRuns" | "maxDevelopment" | "cpus" | "memoryMb" | "maxJobs" | "maxQueued")[];
                                    readonly additionalProperties: false;
                                };
                            };
                            readonly required: ("version" | "targetId" | "limits")[];
                            readonly additionalProperties: false;
                        };
                        readonly usage: {
                            readonly type: "object";
                            readonly properties: {
                                readonly jobs: {
                                    readonly type: "integer";
                                };
                                readonly runs: {
                                    readonly type: "integer";
                                };
                                readonly development: {
                                    readonly type: "integer";
                                };
                                readonly cpus: {
                                    readonly type: "number";
                                };
                                readonly memoryMb: {
                                    readonly type: "integer";
                                };
                                readonly unknown: {
                                    readonly type: "integer";
                                };
                            };
                            readonly required: ("unknown" | "development" | "jobs" | "runs" | "cpus" | "memoryMb")[];
                            readonly additionalProperties: false;
                        };
                        readonly available: {
                            readonly type: "object";
                            readonly properties: {
                                readonly jobs: {
                                    readonly type: "integer";
                                };
                                readonly runs: {
                                    readonly type: "integer";
                                };
                                readonly development: {
                                    readonly type: "integer";
                                };
                                readonly cpus: {
                                    readonly anyOf: readonly [{
                                        readonly type: "number";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly memoryMb: {
                                    readonly anyOf: readonly [{
                                        readonly type: "integer";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                            };
                            readonly required: ("development" | "jobs" | "runs" | "cpus" | "memoryMb")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("targetId" | "backend" | "available" | "contexts" | "configuration" | "usage")[];
                    readonly additionalProperties: false;
                };
            };
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly enum: readonly ["run", "development"];
                        };
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly projectId: {
                            readonly type: "string";
                        };
                        readonly sequence: {
                            readonly type: "integer";
                        };
                        readonly state: {
                            readonly type: "string";
                        };
                        readonly held: {
                            readonly type: "boolean";
                        };
                        readonly backend: {
                            readonly enum: readonly ["docker", "trusted-example"];
                        };
                        readonly targetId: {
                            readonly anyOf: readonly [{
                                readonly type: "string";
                            }, {
                                readonly type: "null";
                            }];
                        };
                        readonly requested: {
                            readonly type: "object";
                            readonly properties: {
                                readonly cpus: {
                                    readonly type: "number";
                                };
                                readonly memoryMb: {
                                    readonly type: "integer";
                                };
                            };
                            readonly required: ("cpus" | "memoryMb")[];
                            readonly additionalProperties: false;
                        };
                        readonly generation: {
                            readonly type: "integer";
                        };
                        readonly leaseUntil: {
                            readonly type: "integer";
                        };
                        readonly nextAttemptAt: {
                            readonly type: "integer";
                        };
                        readonly reason: {
                            readonly enum: readonly ["ready", "worker_active", "recovery_due", "target_unresolved", "target_unavailable", "target_changed", "legacy_target_unknown", "request_too_large", "host_capacity", "target_capacity", "earlier_job", "recovery_backoff", "manual_recovery_required"];
                        };
                    };
                    readonly required: ("id" | "kind" | "projectId" | "generation" | "state" | "targetId" | "sequence" | "backend" | "leaseUntil" | "held" | "requested" | "reason" | "nextAttemptAt")[];
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
        readonly required: ("queued" | "available" | "scope" | "targets" | "configuration" | "usage" | "items" | "nextCursor")[];
        readonly additionalProperties: false;
    };
    readonly compute_capacity_configure: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly targetId: {
                readonly type: "string";
            };
            readonly limits: {
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
                readonly required: ("maxRuns" | "maxDevelopment" | "cpus" | "memoryMb" | "maxJobs" | "maxQueued")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("version" | "targetId" | "limits")[];
        readonly additionalProperties: false;
    };
    readonly agent_capacity_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly maxWorkers: {
                readonly type: "integer";
            };
            readonly available: {
                readonly type: "integer";
            };
            readonly unit: {
                readonly const: "pi-worker";
            };
            readonly httpConcurrencyMeasured: {
                readonly const: false;
            };
            readonly counts: {
                readonly type: "object";
                readonly properties: {
                    readonly reserved: {
                        readonly type: "integer";
                    };
                    readonly running: {
                        readonly type: "integer";
                    };
                    readonly stopping: {
                        readonly type: "integer";
                    };
                    readonly unknown: {
                        readonly type: "integer";
                    };
                    readonly held: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("running" | "unknown" | "reserved" | "stopping" | "held")[];
                readonly additionalProperties: false;
            };
            readonly queued: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly sessionId: {
                            readonly type: "string";
                        };
                        readonly role: {
                            readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                        };
                        readonly reasons: {
                            readonly type: "array";
                            readonly items: {
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
                        };
                    };
                    readonly required: ("sessionId" | "role" | "reasons")[];
                    readonly additionalProperties: false;
                };
            };
            readonly project: {
                readonly type: "object";
                readonly properties: {
                    readonly projectId: {
                        readonly type: "string";
                    };
                    readonly maxActiveAgents: {
                        readonly type: "integer";
                    };
                    readonly maxConcurrentAssistants: {
                        readonly type: "integer";
                    };
                    readonly effectiveMaxAgents: {
                        readonly type: "integer";
                    };
                    readonly counts: {
                        readonly type: "object";
                        readonly properties: {
                            readonly reserved: {
                                readonly type: "integer";
                            };
                            readonly running: {
                                readonly type: "integer";
                            };
                            readonly stopping: {
                                readonly type: "integer";
                            };
                            readonly unknown: {
                                readonly type: "integer";
                            };
                            readonly held: {
                                readonly type: "integer";
                            };
                        };
                        readonly required: ("running" | "unknown" | "reserved" | "stopping" | "held")[];
                        readonly additionalProperties: false;
                    };
                    readonly assistantHeld: {
                        readonly type: "integer";
                    };
                    readonly available: {
                        readonly type: "integer";
                    };
                    readonly assistantAvailable: {
                        readonly type: "integer";
                    };
                    readonly byRole: {
                        readonly type: "object";
                        readonly propertyNames: {
                            readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                        };
                        readonly additionalProperties: {
                            readonly type: "integer";
                        };
                    };
                    readonly blockedBy: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
                readonly required: ("projectId" | "maxActiveAgents" | "maxConcurrentAssistants" | "assistantHeld" | "available" | "byRole" | "blockedBy" | "effectiveMaxAgents" | "counts" | "assistantAvailable")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("version" | "available" | "maxWorkers" | "unit" | "httpConcurrencyMeasured" | "counts")[];
        readonly additionalProperties: false;
    };
    readonly agent_capacity_configure: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly maxWorkers: {
                readonly type: "integer";
            };
            readonly available: {
                readonly type: "integer";
            };
            readonly unit: {
                readonly const: "pi-worker";
            };
            readonly httpConcurrencyMeasured: {
                readonly const: false;
            };
            readonly counts: {
                readonly type: "object";
                readonly properties: {
                    readonly reserved: {
                        readonly type: "integer";
                    };
                    readonly running: {
                        readonly type: "integer";
                    };
                    readonly stopping: {
                        readonly type: "integer";
                    };
                    readonly unknown: {
                        readonly type: "integer";
                    };
                    readonly held: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("running" | "unknown" | "reserved" | "stopping" | "held")[];
                readonly additionalProperties: false;
            };
            readonly queued: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly sessionId: {
                            readonly type: "string";
                        };
                        readonly role: {
                            readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                        };
                        readonly reasons: {
                            readonly type: "array";
                            readonly items: {
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
                        };
                    };
                    readonly required: ("sessionId" | "role" | "reasons")[];
                    readonly additionalProperties: false;
                };
            };
            readonly project: {
                readonly type: "object";
                readonly properties: {
                    readonly projectId: {
                        readonly type: "string";
                    };
                    readonly maxActiveAgents: {
                        readonly type: "integer";
                    };
                    readonly maxConcurrentAssistants: {
                        readonly type: "integer";
                    };
                    readonly effectiveMaxAgents: {
                        readonly type: "integer";
                    };
                    readonly counts: {
                        readonly type: "object";
                        readonly properties: {
                            readonly reserved: {
                                readonly type: "integer";
                            };
                            readonly running: {
                                readonly type: "integer";
                            };
                            readonly stopping: {
                                readonly type: "integer";
                            };
                            readonly unknown: {
                                readonly type: "integer";
                            };
                            readonly held: {
                                readonly type: "integer";
                            };
                        };
                        readonly required: ("running" | "unknown" | "reserved" | "stopping" | "held")[];
                        readonly additionalProperties: false;
                    };
                    readonly assistantHeld: {
                        readonly type: "integer";
                    };
                    readonly available: {
                        readonly type: "integer";
                    };
                    readonly assistantAvailable: {
                        readonly type: "integer";
                    };
                    readonly byRole: {
                        readonly type: "object";
                        readonly propertyNames: {
                            readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                        };
                        readonly additionalProperties: {
                            readonly type: "integer";
                        };
                    };
                    readonly blockedBy: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
                readonly required: ("projectId" | "maxActiveAgents" | "maxConcurrentAssistants" | "assistantHeld" | "available" | "byRole" | "blockedBy" | "effectiveMaxAgents" | "counts" | "assistantAvailable")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("version" | "available" | "maxWorkers" | "unit" | "httpConcurrencyMeasured" | "counts")[];
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
                            readonly enum: readonly ["run", "run-source", "artifact", "evidence", "development-job", "development-review", "claim"];
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
                                readonly required: ("value" | "referenceId" | "name" | "unit")[];
                                readonly additionalProperties: false;
                            };
                        };
                    };
                    readonly required: ("sourceDigest" | "experimentId" | "revision" | "runId" | "state" | "integrity" | "judgment" | "metrics")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("id" | "validity" | "title" | "integrity" | "runs" | "formatVersion" | "reasons" | "references" | "artifactId")[];
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
                        readonly enum: readonly ["run", "run-source", "artifact", "evidence", "development-job", "development-review", "claim"];
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
        readonly required: ("complete" | "cursor" | "mediaType" | "end" | "reference" | "content")[];
        readonly additionalProperties: false;
    };
    readonly development_review_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly producerSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly baseSourceRevisionId: {
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
            readonly taskId: {
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
            readonly manifestEvidenceId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly testEvidenceIds: {
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
            readonly requiredEvidenceIds: {
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
            readonly digest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly status: {
                readonly enum: readonly ["awaiting_approval", "pending", "running", "passed", "rejected", "disputed", "failed", "stale"];
            };
            readonly reviewerSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly verdict: {
                readonly enum: readonly ["accept", "reject", "disputed"];
            };
            readonly reviewId: {
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
            readonly sourceDigest: {
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
        };
        readonly required: readonly ["id", "reviewId", "jobId", "sourceDigest", "producerSessionId", "teamId", "taskId", "approvalId", "manifestEvidenceId", "testEvidenceIds", "requiredEvidenceIds", "digest", "status"];
        readonly additionalProperties: false;
    };
    readonly development_review_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly producerSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly baseSourceRevisionId: {
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
            readonly taskId: {
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
            readonly manifestEvidenceId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly testEvidenceIds: {
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
            readonly requiredEvidenceIds: {
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
            readonly digest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly status: {
                readonly enum: readonly ["awaiting_approval", "pending", "running", "passed", "rejected", "disputed", "failed", "stale"];
            };
            readonly reviewerSessionId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly verdict: {
                readonly enum: readonly ["accept", "reject", "disputed"];
            };
            readonly reviewId: {
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
            readonly sourceDigest: {
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
        };
        readonly required: readonly ["id", "reviewId", "jobId", "sourceDigest", "producerSessionId", "teamId", "taskId", "approvalId", "manifestEvidenceId", "testEvidenceIds", "requiredEvidenceIds", "digest", "status"];
        readonly additionalProperties: false;
    };
    readonly development_review_source_list: {
        readonly type: "object";
        readonly properties: {
            readonly files: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        path: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        size: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                        digest: {
                            minLength: number;
                            pattern: string;
                            type: "string";
                            description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            maxLength: number;
                        };
                        mode: {
                            readonly enum: readonly ["100644", "100755"];
                        };
                    };
                    readonly required: readonly ["path", "size", "digest"];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
            readonly reviewId: {
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
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
        };
        readonly required: readonly ["reviewId", "jobId", "sourceDigest", "files"];
        readonly additionalProperties: false;
    };
    readonly development_review_source_read: {
        readonly type: "object";
        readonly properties: {
            readonly cursor: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly end: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly complete: {
                readonly type: "boolean";
            };
            readonly content: {
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
            readonly reviewId: {
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
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
        };
        readonly required: readonly ["reviewId", "jobId", "sourceDigest", "path", "size", "digest", "cursor", "end", "complete", "content"];
        readonly additionalProperties: false;
    };
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
    readonly development_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly kind: {
                readonly const: "development-task";
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
            readonly developmentTaskId: {
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
            readonly manifest: {
                readonly type: "object";
                readonly properties: {
                    readonly purpose: {
                        readonly const: "development-test";
                    };
                    readonly sessionId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly inputSnapshot: {
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
                    readonly sourceRevisionId: {
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
                            readonly pattern?: string | undefined;
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
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly resources: {
                        readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
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
                        readonly additionalProperties: false;
                    };
                    readonly networkPolicy: {
                        readonly const: "none";
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
                    readonly sessionGeneration: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: readonly ["purpose", "sessionId", "inputSnapshot", "command", "environmentImageDigest", "dockerContext", "resources", "networkPolicy", "deadline", "expectedArtifacts", "dataArtifacts"];
                readonly additionalProperties: false;
            };
            readonly manifestDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly grantId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly state: {
                readonly enum: readonly ["prepared", "submitted"];
            };
            readonly jobId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
        };
        readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "developmentTaskId", "title", "sessionId", "sourceDigest", "manifest", "manifestDigest", "grantId", "state"];
        readonly additionalProperties: false;
    };
    readonly development_submit: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
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
            readonly developmentTaskId: {
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
            readonly version: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly manifestDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly manifest: {
                readonly type: "object";
                readonly properties: {
                    readonly purpose: {
                        readonly const: "development-test";
                    };
                    readonly sessionId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly inputSnapshot: {
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
                    readonly sourceRevisionId: {
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
                            readonly pattern?: string | undefined;
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
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly resources: {
                        readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
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
                        readonly additionalProperties: false;
                    };
                    readonly networkPolicy: {
                        readonly const: "none";
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
                    readonly sessionGeneration: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: readonly ["purpose", "sessionId", "inputSnapshot", "command", "environmentImageDigest", "dockerContext", "resources", "networkPolicy", "deadline", "expectedArtifacts", "dataArtifacts"];
                readonly additionalProperties: false;
            };
            readonly imageId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly grantId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly state: {
                readonly enum: readonly ["queued", "starting", "running", "succeeded", "failed", "cancelled", "timed_out", "unknown"];
            };
            readonly integrity: {
                readonly enum: readonly ["pending", "complete", "incomplete", "invalid"];
            };
            readonly exitCode: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
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
            readonly startedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly endedAt: {
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
            readonly stdoutArtifactId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly stderrArtifactId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly reportArtifactId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly logTruncated: {
                readonly type: "boolean";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
        };
        readonly required: readonly ["id", "jobId", "developmentTaskId", "sessionId", "version", "sourceDigest", "manifestDigest", "manifest", "grantId", "state", "integrity", "exitCode", "artifactIds", "cancelRequested"];
        readonly additionalProperties: false;
    };
    readonly development_inspect: {
        readonly type: "object";
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly kind: {
                    readonly const: "development-task";
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
                readonly developmentTaskId: {
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
                readonly manifest: {
                    readonly type: "object";
                    readonly properties: {
                        readonly purpose: {
                            readonly const: "development-test";
                        };
                        readonly sessionId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly inputSnapshot: {
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
                        readonly sourceRevisionId: {
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
                                readonly pattern?: string | undefined;
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
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly resources: {
                            readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
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
                            readonly additionalProperties: false;
                        };
                        readonly networkPolicy: {
                            readonly const: "none";
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
                        readonly sessionGeneration: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                    };
                    readonly required: readonly ["purpose", "sessionId", "inputSnapshot", "command", "environmentImageDigest", "dockerContext", "resources", "networkPolicy", "deadline", "expectedArtifacts", "dataArtifacts"];
                    readonly additionalProperties: false;
                };
                readonly manifestDigest: {
                    minLength: number;
                    pattern: string;
                    type: "string";
                    description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    maxLength: number;
                };
                readonly grantId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly state: {
                    readonly enum: readonly ["prepared", "submitted"];
                };
                readonly jobId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
            };
            readonly required: readonly ["id", "kind", "projectId", "version", "createdAt", "updatedAt", "developmentTaskId", "title", "sessionId", "sourceDigest", "manifest", "manifestDigest", "grantId", "state"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
                readonly id: {
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
                readonly developmentTaskId: {
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
                readonly version: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly sourceDigest: {
                    minLength: number;
                    pattern: string;
                    type: "string";
                    description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    maxLength: number;
                };
                readonly manifestDigest: {
                    minLength: number;
                    pattern: string;
                    type: "string";
                    description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    maxLength: number;
                };
                readonly manifest: {
                    readonly type: "object";
                    readonly properties: {
                        readonly purpose: {
                            readonly const: "development-test";
                        };
                        readonly sessionId: {
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly inputSnapshot: {
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
                        readonly sourceRevisionId: {
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
                                readonly pattern?: string | undefined;
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
                            readonly pattern?: string | undefined;
                            readonly type: "string";
                            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                            readonly minLength: number;
                            readonly maxLength: number;
                        };
                        readonly resources: {
                            readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
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
                            readonly additionalProperties: false;
                        };
                        readonly networkPolicy: {
                            readonly const: "none";
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
                        readonly sessionGeneration: {
                            readonly type: "integer";
                            readonly minimum: number;
                            readonly maximum: number;
                        };
                    };
                    readonly required: readonly ["purpose", "sessionId", "inputSnapshot", "command", "environmentImageDigest", "dockerContext", "resources", "networkPolicy", "deadline", "expectedArtifacts", "dataArtifacts"];
                    readonly additionalProperties: false;
                };
                readonly imageId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly grantId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly state: {
                    readonly enum: readonly ["queued", "starting", "running", "succeeded", "failed", "cancelled", "timed_out", "unknown"];
                };
                readonly integrity: {
                    readonly enum: readonly ["pending", "complete", "incomplete", "invalid"];
                };
                readonly exitCode: {
                    readonly anyOf: readonly [{
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
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
                readonly startedAt: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly endedAt: {
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
                readonly stdoutArtifactId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly stderrArtifactId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly reportArtifactId: {
                    readonly pattern?: string | undefined;
                    readonly type: "string";
                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                    readonly minLength: number;
                    readonly maxLength: number;
                };
                readonly logTruncated: {
                    readonly type: "boolean";
                };
                readonly cancelRequested: {
                    readonly type: "boolean";
                };
            };
            readonly required: readonly ["id", "jobId", "developmentTaskId", "sessionId", "version", "sourceDigest", "manifestDigest", "manifest", "grantId", "state", "integrity", "exitCode", "artifactIds", "cancelRequested"];
            readonly additionalProperties: false;
        }];
    };
    readonly development_cancel: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
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
            readonly developmentTaskId: {
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
            readonly version: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly sourceDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly manifestDigest: {
                minLength: number;
                pattern: string;
                type: "string";
                description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                maxLength: number;
            };
            readonly manifest: {
                readonly type: "object";
                readonly properties: {
                    readonly purpose: {
                        readonly const: "development-test";
                    };
                    readonly sessionId: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly inputSnapshot: {
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
                    readonly sourceRevisionId: {
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
                            readonly pattern?: string | undefined;
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
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly resources: {
                        readonly required: readonly ["cpus", "memoryMb", "pids", "timeoutSeconds", "workMb", "outputBytes", "logBytes"];
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
                        readonly additionalProperties: false;
                    };
                    readonly networkPolicy: {
                        readonly const: "none";
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
                    readonly sessionGeneration: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                };
                readonly required: readonly ["purpose", "sessionId", "inputSnapshot", "command", "environmentImageDigest", "dockerContext", "resources", "networkPolicy", "deadline", "expectedArtifacts", "dataArtifacts"];
                readonly additionalProperties: false;
            };
            readonly imageId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly grantId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly state: {
                readonly enum: readonly ["queued", "starting", "running", "succeeded", "failed", "cancelled", "timed_out", "unknown"];
            };
            readonly integrity: {
                readonly enum: readonly ["pending", "complete", "incomplete", "invalid"];
            };
            readonly exitCode: {
                readonly anyOf: readonly [{
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
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
            readonly startedAt: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly endedAt: {
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
            readonly stdoutArtifactId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly stderrArtifactId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly reportArtifactId: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly logTruncated: {
                readonly type: "boolean";
            };
            readonly cancelRequested: {
                readonly type: "boolean";
            };
        };
        readonly required: readonly ["id", "jobId", "developmentTaskId", "sessionId", "version", "sourceDigest", "manifestDigest", "manifest", "grantId", "state", "integrity", "exitCode", "artifactIds", "cancelRequested"];
        readonly additionalProperties: false;
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
            readonly content: {
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
            readonly complete: {
                readonly type: "boolean";
            };
            readonly start: {
                readonly type: "integer";
                readonly minimum: number;
                readonly maximum: number;
            };
            readonly size: {
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
        readonly required: readonly ["jobId", "stream", "content", "cursor", "complete", "start", "size", "identity"];
        readonly additionalProperties: false;
    };
};
export { string, number, integer, boolean, nullableString, strings, enumeration, array, object, row, nullable };
export type OperationOutput<N extends keyof typeof OUTPUT_SCHEMAS> = InferSchema<(typeof OUTPUT_SCHEMAS)[N]>;
