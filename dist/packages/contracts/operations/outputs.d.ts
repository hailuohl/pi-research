import type { InferSchema } from './schema.js';
/** Success payloads are the existing service records, including durable replay fields. */
export declare const OUTPUT_SCHEMAS: {
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
                                    readonly required: ("direction" | "unit")[];
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
                        };
                        readonly required: ("runner" | "command" | "environment" | "metrics" | "timeoutSeconds" | "cpus" | "memoryMb" | "datasetVersion" | "evaluationProtocolVersion" | "expectedArtifacts")[];
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
                            };
                            readonly required: ("path" | "size" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly createdAt: {
                        readonly type: "string";
                    };
                };
                readonly required: ("createdAt" | "contract" | "experimentId" | "sourceFiles" | "experimentVersion" | "experimentRevision" | "contractDigest" | "snapshotDigest" | "snapshotPath")[];
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
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "experimentId" | "status" | "manifest" | "manifestDigest" | "approvalId")[];
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
                                    readonly required: ("direction" | "unit")[];
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
                        };
                        readonly required: ("runner" | "command" | "environment" | "metrics" | "timeoutSeconds" | "cpus" | "memoryMb" | "datasetVersion" | "evaluationProtocolVersion" | "expectedArtifacts")[];
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
                            };
                            readonly required: ("path" | "size" | "digest")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly createdAt: {
                        readonly type: "string";
                    };
                };
                readonly required: ("createdAt" | "contract" | "experimentId" | "sourceFiles" | "experimentVersion" | "experimentRevision" | "contractDigest" | "snapshotDigest" | "snapshotPath")[];
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
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "intentId" | "artifactIds" | "experimentId" | "evidenceIds" | "manifest" | "manifestDigest" | "state" | "integrity" | "judgment" | "outputDir" | "cancelRequested")[];
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
                readonly const: "not_run";
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
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "digest" | "title" | "hypothesis" | "changes" | "baseExperimentId" | "contractDigest" | "approvalId" | "state" | "testsStatus" | "baseRevision" | "baseSnapshot" | "candidateSnapshot")[];
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
                            readonly required: ("evidenceIds" | "limitations" | "statement")[];
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
                readonly required: ("artifactIds" | "outcome" | "evidenceIds" | "claims" | "unresolvedQuestions" | "summary")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "digest" | "taskId" | "attemptId" | "planVersion" | "directiveVersion" | "inputDigest" | "result")[];
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
        readonly required: ("id" | "kind" | "projectId" | "version" | "createdAt" | "updatedAt" | "source" | "title" | "artifactId" | "limitations" | "artifactDigest" | "contentKind" | "versionAssurance" | "pageMapping" | "sourceResponses" | "idInSource" | "requestedId" | "sourceUrl" | "rawArtifactIds" | "fullTextRead" | "retrievedAt" | "scopeSessionId" | "scopeAttemptId")[];
        readonly additionalProperties: false;
    };
};
export type OperationOutput<N extends keyof typeof OUTPUT_SCHEMAS> = InferSchema<(typeof OUTPUT_SCHEMAS)[N]>;
