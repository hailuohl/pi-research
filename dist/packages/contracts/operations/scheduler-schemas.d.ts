export declare const SCHEDULER_INPUT_SCHEMAS: {
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
};
export declare const SCHEDULER_OUTPUT_SCHEMAS: {
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
                        readonly required: ("maxRuns" | "cpus" | "memoryMb" | "maxDevelopment" | "maxJobs" | "maxQueued")[];
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
                    readonly documents: {
                        readonly type: "integer";
                    };
                    readonly publications: {
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
                readonly required: ("unknown" | "cpus" | "memoryMb" | "documents" | "development" | "runs" | "publications" | "jobs")[];
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
                    readonly documents: {
                        readonly type: "integer";
                    };
                    readonly publications: {
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
                readonly required: ("cpus" | "memoryMb" | "documents" | "development" | "runs" | "publications" | "jobs")[];
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
                            readonly enum: readonly ["docker", "trusted-example", "ssh"];
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
                                    readonly required: ("maxRuns" | "cpus" | "memoryMb" | "maxDevelopment" | "maxJobs" | "maxQueued")[];
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
                                readonly documents: {
                                    readonly type: "integer";
                                };
                                readonly publications: {
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
                            readonly required: ("unknown" | "cpus" | "memoryMb" | "documents" | "development" | "runs" | "publications" | "jobs")[];
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
                                readonly documents: {
                                    readonly type: "integer";
                                };
                                readonly publications: {
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
                            readonly required: ("cpus" | "memoryMb" | "documents" | "development" | "runs" | "publications" | "jobs")[];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly required: ("usage" | "targetId" | "available" | "configuration" | "backend" | "contexts")[];
                    readonly additionalProperties: false;
                };
            };
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly kind: {
                            readonly enum: readonly ["run", "development", "document", "publication"];
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
                            readonly enum: readonly ["docker", "trusted-example", "ssh"];
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
                    readonly required: ("id" | "state" | "generation" | "kind" | "projectId" | "reason" | "leaseUntil" | "targetId" | "backend" | "held" | "requested" | "sequence" | "nextAttemptAt")[];
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
        readonly required: ("queued" | "nextCursor" | "targets" | "usage" | "scope" | "available" | "configuration" | "items")[];
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
                readonly required: ("maxRuns" | "cpus" | "memoryMb" | "maxDevelopment" | "maxJobs" | "maxQueued")[];
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
    readonly model_http_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly version: {
                        readonly type: "integer";
                    };
                    readonly maxRequests: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("version" | "maxRequests")[];
                readonly additionalProperties: false;
            };
            readonly scope: {
                readonly const: "shared-data-directory";
            };
            readonly unit: {
                readonly const: "pi-http-request";
            };
            readonly counts: {
                readonly type: "object";
                readonly properties: {
                    readonly queued: {
                        readonly type: "integer";
                    };
                    readonly active: {
                        readonly type: "integer";
                    };
                    readonly unknown: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("active" | "queued" | "unknown")[];
                readonly additionalProperties: false;
            };
            readonly available: {
                readonly type: "integer";
            };
            readonly coverage: {
                readonly enum: readonly ["managed-fetch", "legacy-workers-present"];
            };
            readonly legacyWorkerCount: {
                readonly type: "integer";
            };
            readonly supportedApis: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly sessionId: {
                            readonly type: "string";
                        };
                        readonly provider: {
                            readonly type: "string";
                        };
                        readonly model: {
                            readonly type: "string";
                        };
                        readonly state: {
                            readonly enum: readonly ["queued", "active", "unknown", "succeeded", "failed", "cancelled", "interrupted"];
                        };
                        readonly queuedAt: {
                            readonly type: "string";
                        };
                        readonly startedAt: {
                            readonly type: "string";
                        };
                        readonly endedAt: {
                            readonly type: "string";
                        };
                        readonly httpStatus: {
                            readonly type: "integer";
                        };
                        readonly receivedBytes: {
                            readonly type: "integer";
                        };
                        readonly outcome: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("id" | "sessionId" | "model" | "state" | "provider" | "queuedAt")[];
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
        readonly required: ("nextCursor" | "coverage" | "scope" | "available" | "configuration" | "items" | "unit" | "counts" | "supportedApis" | "legacyWorkerCount")[];
        readonly additionalProperties: false;
    };
    readonly model_http_configure: {
        readonly type: "object";
        readonly properties: {
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly version: {
                        readonly type: "integer";
                    };
                    readonly maxRequests: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("version" | "maxRequests")[];
                readonly additionalProperties: false;
            };
            readonly scope: {
                readonly const: "shared-data-directory";
            };
            readonly unit: {
                readonly const: "pi-http-request";
            };
            readonly counts: {
                readonly type: "object";
                readonly properties: {
                    readonly queued: {
                        readonly type: "integer";
                    };
                    readonly active: {
                        readonly type: "integer";
                    };
                    readonly unknown: {
                        readonly type: "integer";
                    };
                };
                readonly required: ("active" | "queued" | "unknown")[];
                readonly additionalProperties: false;
            };
            readonly available: {
                readonly type: "integer";
            };
            readonly coverage: {
                readonly enum: readonly ["managed-fetch", "legacy-workers-present"];
            };
            readonly legacyWorkerCount: {
                readonly type: "integer";
            };
            readonly supportedApis: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly sessionId: {
                            readonly type: "string";
                        };
                        readonly provider: {
                            readonly type: "string";
                        };
                        readonly model: {
                            readonly type: "string";
                        };
                        readonly state: {
                            readonly enum: readonly ["queued", "active", "unknown", "succeeded", "failed", "cancelled", "interrupted"];
                        };
                        readonly queuedAt: {
                            readonly type: "string";
                        };
                        readonly startedAt: {
                            readonly type: "string";
                        };
                        readonly endedAt: {
                            readonly type: "string";
                        };
                        readonly httpStatus: {
                            readonly type: "integer";
                        };
                        readonly receivedBytes: {
                            readonly type: "integer";
                        };
                        readonly outcome: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("id" | "sessionId" | "model" | "state" | "provider" | "queuedAt")[];
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
        readonly required: ("nextCursor" | "coverage" | "scope" | "available" | "configuration" | "items" | "unit" | "counts" | "supportedApis" | "legacyWorkerCount")[];
        readonly additionalProperties: false;
    };
};
