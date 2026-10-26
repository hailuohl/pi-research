export declare const SYNTHETIC_FIXTURE_REF_SCHEMA: {
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
export declare const SYNTHETIC_FIXTURE_BINDING_SCHEMA: {
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
export declare const DRAFT_ROLE_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly path: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly role: {
            readonly enum: readonly ["protocol", "implementation", "notes"];
        };
    };
    readonly required: ("role" | "path")[];
    readonly additionalProperties: false;
};
export declare const PROTOCOL_DOCUMENT_SCHEMA: {
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
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly compilerVersion: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
    };
    readonly required: ("digest" | "path" | "compilerVersion")[];
    readonly additionalProperties: false;
};
declare const specificationSchema: {
    readonly type: "object";
    readonly properties: {
        readonly version: {
            readonly const: 1;
        };
        readonly literatureSources: {
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
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly recordsPointer: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly recordIdField: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly doiField: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: ("digest" | "path" | "recordsPointer" | "recordIdField" | "doiField")[];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
        readonly quantitative: {
            readonly anyOf: readonly [{
                readonly type: "object";
                readonly properties: {
                    readonly type: {
                        readonly const: "descriptive";
                    };
                };
                readonly required: "type"[];
                readonly additionalProperties: false;
            }, {
                readonly type: "object";
                readonly properties: {
                    readonly type: {
                        readonly const: "comparison";
                    };
                    readonly template: {
                        readonly const: "positive-benefit-v1";
                    };
                    readonly gain: {
                        readonly type: "object";
                        readonly properties: {
                            readonly metric: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly unit: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("unit" | "metric")[];
                        readonly additionalProperties: false;
                    };
                    readonly interval: {
                        readonly type: "object";
                        readonly properties: {
                            readonly lowerMetric: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly upperMetric: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly unit: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("unit" | "lowerMetric" | "upperMetric")[];
                        readonly additionalProperties: false;
                    };
                    readonly minimumGain: {
                        readonly maximum?: number | undefined;
                        readonly minimum?: number | undefined;
                        readonly type: "number";
                    };
                    readonly decisionOutputs: {
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly artifactPath: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly jsonPointer: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: ("artifactPath" | "jsonPointer")[];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                };
                readonly required: ("type" | "template" | "decisionOutputs" | "minimumGain" | "gain" | "interval")[];
                readonly additionalProperties: false;
            }, {
                readonly type: "object";
                readonly properties: {
                    readonly type: {
                        readonly const: "comparison";
                    };
                    readonly template: {
                        readonly const: "paired-rmse-delta-v1";
                    };
                    readonly outcomeUnit: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly witness: {
                        readonly type: "object";
                        readonly properties: {
                            readonly artifactPath: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly recordsPointer: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly idField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly observedField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly baselinePredictionField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly candidatePredictionField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("artifactPath" | "recordsPointer" | "idField" | "observedField" | "baselinePredictionField" | "candidatePredictionField")[];
                        readonly additionalProperties: false;
                    };
                    readonly metrics: {
                        readonly type: "object";
                        readonly properties: {
                            readonly baselineRmse: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly candidateRmse: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly gain: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("baselineRmse" | "candidateRmse" | "gain")[];
                        readonly additionalProperties: false;
                    };
                    readonly minimumGain: {
                        readonly maximum?: number | undefined;
                        readonly minimum?: number | undefined;
                        readonly type: "number";
                    };
                    readonly decisionOutputs: {
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly artifactPath: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly jsonPointer: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: ("artifactPath" | "jsonPointer")[];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                };
                readonly required: ("type" | "template" | "decisionOutputs" | "outcomeUnit" | "witness" | "metrics" | "minimumGain")[];
                readonly additionalProperties: false;
            }, {
                readonly type: "object";
                readonly properties: {
                    readonly type: {
                        readonly const: "comparison";
                    };
                    readonly template: {
                        readonly const: "paired-rmse-plan-v1";
                    };
                    readonly outcomeUnit: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly witness: {
                        readonly type: "object";
                        readonly properties: {
                            readonly artifactPath: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly recordsPointer: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly idField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly observedField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly baselinePredictionField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly candidatePredictionField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("artifactPath" | "recordsPointer" | "idField" | "observedField" | "baselinePredictionField" | "candidatePredictionField")[];
                        readonly additionalProperties: false;
                    };
                    readonly metrics: {
                        readonly type: "object";
                        readonly properties: {
                            readonly baselineRmse: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly candidateRmse: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly gain: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("baselineRmse" | "candidateRmse" | "gain")[];
                        readonly additionalProperties: false;
                    };
                    readonly minimumGain: {
                        readonly maximum?: number | undefined;
                        readonly minimum?: number | undefined;
                        readonly type: "number";
                    };
                    readonly decisionOutputs: {
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly artifactPath: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly jsonPointer: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: ("artifactPath" | "jsonPointer")[];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                    readonly precisionGate: {
                        readonly anyOf: readonly [{
                            readonly type: "object";
                            readonly properties: {
                                readonly maxHalfWidth: {
                                    readonly maximum?: number | undefined;
                                    readonly minimum?: number | undefined;
                                    readonly type: "number";
                                };
                            };
                            readonly required: "maxHalfWidth"[];
                            readonly additionalProperties: false;
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly developmentData: {
                        readonly type: "object";
                        readonly properties: {
                            readonly mode: {
                                readonly const: "host-synthetic-only";
                            };
                            readonly profile: {
                                readonly const: "numeric-regression-v1";
                            };
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
                            readonly inputArgumentIndex: {
                                readonly type: "integer";
                                readonly minimum: number;
                                readonly maximum: number;
                            };
                        };
                        readonly required: ("mode" | "profile" | "fixtureRef" | "inputArgumentIndex")[];
                        readonly additionalProperties: false;
                    };
                    readonly plan: {
                        readonly type: "object";
                        readonly properties: {
                            readonly formalInput: {
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
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                    readonly predictorField: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                    readonly outcomeField: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                };
                                readonly required: ("digest" | "path" | "predictorField" | "outcomeField")[];
                                readonly additionalProperties: false;
                            };
                            readonly models: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly baseline: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly family: {
                                                readonly const: "polynomial";
                                            };
                                            readonly degree: {
                                                readonly const: 1;
                                            };
                                        };
                                        readonly required: ("family" | "degree")[];
                                        readonly additionalProperties: false;
                                    };
                                    readonly candidate: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly family: {
                                                readonly const: "polynomial";
                                            };
                                            readonly degree: {
                                                readonly const: 2;
                                            };
                                        };
                                        readonly required: ("family" | "degree")[];
                                        readonly additionalProperties: false;
                                    };
                                };
                                readonly required: ("candidate" | "baseline")[];
                                readonly additionalProperties: false;
                            };
                            readonly preprocessing: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly duplicates: {
                                        readonly enum: readonly ["retain", "drop-exact"];
                                    };
                                    readonly missing: {
                                        readonly enum: readonly ["reject", "drop-complete-case"];
                                    };
                                    readonly scaling: {
                                        readonly const: "training-only";
                                    };
                                };
                                readonly required: ("duplicates" | "missing" | "scaling")[];
                                readonly additionalProperties: false;
                            };
                            readonly split: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly testFraction: {
                                        readonly maximum?: number | undefined;
                                        readonly minimum?: number | undefined;
                                        readonly type: "number";
                                    };
                                    readonly seed: {
                                        readonly type: "integer";
                                        readonly minimum: number;
                                        readonly maximum: number;
                                    };
                                };
                                readonly required: ("seed" | "testFraction")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly required: ("split" | "models" | "formalInput" | "preprocessing")[];
                        readonly additionalProperties: false;
                    };
                    readonly provenanceArtifact: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: ("type" | "template" | "decisionOutputs" | "outcomeUnit" | "witness" | "metrics" | "minimumGain" | "precisionGate" | "developmentData" | "plan" | "provenanceArtifact")[];
                readonly additionalProperties: false;
            }, {
                readonly type: "object";
                readonly properties: {
                    readonly template: {
                        readonly const: "paired-rmse-plan-v2";
                    };
                    readonly outputProfile: {
                        readonly const: "paired-evidence-only-v1";
                    };
                    readonly fitImplementation: {
                        readonly type: "object";
                        readonly properties: {
                            readonly path: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly entryPoint: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("path" | "entryPoint")[];
                        readonly additionalProperties: false;
                    };
                    readonly type: {
                        readonly const: "comparison";
                    };
                    readonly outcomeUnit: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                    readonly witness: {
                        readonly type: "object";
                        readonly properties: {
                            readonly artifactPath: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly recordsPointer: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly idField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly observedField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly baselinePredictionField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly candidatePredictionField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("artifactPath" | "recordsPointer" | "idField" | "observedField" | "baselinePredictionField" | "candidatePredictionField")[];
                        readonly additionalProperties: false;
                    };
                    readonly metrics: {
                        readonly type: "object";
                        readonly properties: {
                            readonly baselineRmse: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly candidateRmse: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly gain: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("baselineRmse" | "candidateRmse" | "gain")[];
                        readonly additionalProperties: false;
                    };
                    readonly minimumGain: {
                        readonly maximum?: number | undefined;
                        readonly minimum?: number | undefined;
                        readonly type: "number";
                    };
                    readonly precisionGate: {
                        readonly anyOf: readonly [{
                            readonly type: "object";
                            readonly properties: {
                                readonly maxHalfWidth: {
                                    readonly maximum?: number | undefined;
                                    readonly minimum?: number | undefined;
                                    readonly type: "number";
                                };
                            };
                            readonly required: "maxHalfWidth"[];
                            readonly additionalProperties: false;
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly developmentData: {
                        readonly type: "object";
                        readonly properties: {
                            readonly mode: {
                                readonly const: "host-synthetic-only";
                            };
                            readonly profile: {
                                readonly const: "numeric-regression-v1";
                            };
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
                            readonly inputArgumentIndex: {
                                readonly type: "integer";
                                readonly minimum: number;
                                readonly maximum: number;
                            };
                        };
                        readonly required: ("mode" | "profile" | "fixtureRef" | "inputArgumentIndex")[];
                        readonly additionalProperties: false;
                    };
                    readonly plan: {
                        readonly type: "object";
                        readonly properties: {
                            readonly formalInput: {
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
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                    readonly predictorField: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                    readonly outcomeField: {
                                        readonly pattern?: string | undefined;
                                        readonly type: "string";
                                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                        readonly minLength: number;
                                        readonly maxLength: number;
                                    };
                                };
                                readonly required: ("digest" | "path" | "predictorField" | "outcomeField")[];
                                readonly additionalProperties: false;
                            };
                            readonly models: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly baseline: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly family: {
                                                readonly const: "polynomial";
                                            };
                                            readonly degree: {
                                                readonly const: 1;
                                            };
                                        };
                                        readonly required: ("family" | "degree")[];
                                        readonly additionalProperties: false;
                                    };
                                    readonly candidate: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly family: {
                                                readonly const: "polynomial";
                                            };
                                            readonly degree: {
                                                readonly const: 2;
                                            };
                                        };
                                        readonly required: ("family" | "degree")[];
                                        readonly additionalProperties: false;
                                    };
                                };
                                readonly required: ("candidate" | "baseline")[];
                                readonly additionalProperties: false;
                            };
                            readonly preprocessing: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly duplicates: {
                                        readonly enum: readonly ["retain", "drop-exact"];
                                    };
                                    readonly missing: {
                                        readonly enum: readonly ["reject", "drop-complete-case"];
                                    };
                                    readonly scaling: {
                                        readonly const: "training-only";
                                    };
                                };
                                readonly required: ("duplicates" | "missing" | "scaling")[];
                                readonly additionalProperties: false;
                            };
                            readonly split: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly testFraction: {
                                        readonly maximum?: number | undefined;
                                        readonly minimum?: number | undefined;
                                        readonly type: "number";
                                    };
                                    readonly seed: {
                                        readonly type: "integer";
                                        readonly minimum: number;
                                        readonly maximum: number;
                                    };
                                };
                                readonly required: ("seed" | "testFraction")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly required: ("split" | "models" | "formalInput" | "preprocessing")[];
                        readonly additionalProperties: false;
                    };
                    readonly provenanceArtifact: {
                        readonly pattern?: string | undefined;
                        readonly type: "string";
                        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                        readonly minLength: number;
                        readonly maxLength: number;
                    };
                };
                readonly required: ("type" | "template" | "outcomeUnit" | "witness" | "metrics" | "minimumGain" | "precisionGate" | "developmentData" | "plan" | "provenanceArtifact" | "outputProfile" | "fitImplementation")[];
                readonly additionalProperties: false;
            }];
        };
    };
    readonly required: ("version" | "literatureSources" | "quantitative")[];
    readonly additionalProperties: false;
};
type SpecificationSchemaShape = typeof specificationSchema;
export interface MethodSpecificationSchema extends SpecificationSchemaShape {
}
export declare const METHOD_SPECIFICATION_SCHEMA: MethodSpecificationSchema;
export declare const METHOD_CONTRACT_INPUT_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly protocolPath: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly specification: MethodSpecificationSchema;
    };
    readonly required: ("protocolPath" | "specification")[];
    readonly additionalProperties: false;
};
declare const frozenSchema: {
    readonly type: "object";
    readonly properties: {
        readonly protocolPath: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly specification: MethodSpecificationSchema;
        readonly compilerVersion: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly contractDigest: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly protocolDigest: {
            readonly pattern?: string | undefined;
            readonly type: "string";
            readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
            readonly minLength: number;
            readonly maxLength: number;
        };
        readonly literatureLedger: {
            readonly type: "object";
            readonly properties: {
                readonly sources: {
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
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly recordsPointer: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly recordIdField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly doiField: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                        };
                        readonly required: ("digest" | "path" | "recordsPointer" | "recordIdField" | "doiField")[];
                        readonly additionalProperties: false;
                    };
                    readonly minItems: number;
                };
                readonly records: {
                    readonly maxItems?: number | undefined;
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly sourcePath: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly sourceDigest: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly pointer: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly recordIdentity: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly recordId: {
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
                            readonly doi: {
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
                            readonly reportCandidateId: {
                                readonly pattern?: string | undefined;
                                readonly type: "string";
                                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                readonly minLength: number;
                                readonly maxLength: number;
                            };
                            readonly studyIdentity: {
                                readonly const: "unknown";
                            };
                        };
                        readonly required: ("doi" | "sourceDigest" | "recordId" | "studyIdentity" | "sourcePath" | "pointer" | "recordIdentity" | "reportCandidateId")[];
                        readonly additionalProperties: false;
                    };
                    readonly minItems: number;
                };
                readonly recordsObserved: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly reportCandidates: {
                    readonly type: "integer";
                    readonly minimum: number;
                    readonly maximum: number;
                };
                readonly confirmedStudyMappings: {
                    readonly const: 0;
                };
                readonly totalStudies: {
                    readonly const: null;
                };
            };
            readonly required: ("sources" | "records" | "confirmedStudyMappings" | "totalStudies" | "recordsObserved" | "reportCandidates")[];
            readonly additionalProperties: false;
        };
        readonly boundaryExamples: {
            readonly maxItems?: number | undefined;
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly gain: {
                        readonly maximum?: number | undefined;
                        readonly minimum?: number | undefined;
                        readonly type: "number";
                    };
                    readonly lower: {
                        readonly maximum?: number | undefined;
                        readonly minimum?: number | undefined;
                        readonly type: "number";
                    };
                    readonly upper: {
                        readonly maximum?: number | undefined;
                        readonly minimum?: number | undefined;
                        readonly type: "number";
                    };
                    readonly decision: {
                        readonly enum: readonly ["criterion_met", "nonpositive_estimate", "inconclusive"];
                    };
                    readonly halfWidth: {
                        readonly maximum?: number | undefined;
                        readonly minimum?: number | undefined;
                        readonly type: "number";
                    };
                    readonly precisionGate: {
                        readonly anyOf: readonly [{
                            readonly type: "object";
                            readonly properties: {
                                readonly maxHalfWidth: {
                                    readonly maximum?: number | undefined;
                                    readonly minimum?: number | undefined;
                                    readonly type: "number";
                                };
                            };
                            readonly required: "maxHalfWidth"[];
                            readonly additionalProperties: false;
                        }, {
                            readonly type: "null";
                        }];
                    };
                };
                readonly required: ("precisionGate" | "gain" | "lower" | "upper" | "halfWidth" | "decision")[];
                readonly additionalProperties: false;
            };
            readonly minItems: number;
        };
    };
    readonly required: ("contractDigest" | "boundaryExamples" | "protocolDigest" | "compilerVersion" | "protocolPath" | "specification" | "literatureLedger")[];
    readonly additionalProperties: false;
};
type FrozenSchemaShape = typeof frozenSchema;
export interface FrozenMethodContractSchema extends FrozenSchemaShape {
}
export declare const FROZEN_METHOD_CONTRACT_SCHEMA: FrozenMethodContractSchema;
export declare const METHOD_REQUIREMENTS_SCHEMA: {
    readonly maxItems?: number | undefined;
    readonly type: "array";
    readonly items: {
        readonly enum: readonly ["literature-identity", "quantitative-decision", "structured-paired-protocol", "closed-paired-evidence"];
    };
    readonly minItems: number;
};
export declare const METHOD_INPUT_SCHEMAS: {
    readonly research_method_compile: {
        readonly type: "object";
        readonly properties: {
            readonly specification: MethodSpecificationSchema;
        };
        readonly required: "specification"[];
        readonly additionalProperties: false;
    };
    readonly research_fixture_prepare: {
        readonly type: "object";
        readonly properties: {
            readonly profile: {
                readonly const: "numeric-regression-v1";
            };
            readonly outputProfile: {
                readonly const: "paired-evidence-only-v1";
            };
        };
        readonly required: ("profile" | "outputProfile")[];
        readonly additionalProperties: false;
    };
};
export declare const METHOD_OUTPUT_SCHEMAS: {
    readonly research_method_compile: {
        readonly type: "object";
        readonly properties: {
            readonly protocol: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly specification: MethodSpecificationSchema;
            readonly compilerVersion: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly contractDigest: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly protocolDigest: {
                readonly pattern?: string | undefined;
                readonly type: "string";
                readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                readonly minLength: number;
                readonly maxLength: number;
            };
            readonly literatureLedger: {
                readonly type: "object";
                readonly properties: {
                    readonly sources: {
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
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly recordsPointer: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly recordIdField: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly doiField: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                            };
                            readonly required: ("digest" | "path" | "recordsPointer" | "recordIdField" | "doiField")[];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                    readonly records: {
                        readonly maxItems?: number | undefined;
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly sourcePath: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly sourceDigest: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly pointer: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly recordIdentity: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly recordId: {
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
                                readonly doi: {
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
                                readonly reportCandidateId: {
                                    readonly pattern?: string | undefined;
                                    readonly type: "string";
                                    readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
                                    readonly minLength: number;
                                    readonly maxLength: number;
                                };
                                readonly studyIdentity: {
                                    readonly const: "unknown";
                                };
                            };
                            readonly required: ("doi" | "sourceDigest" | "recordId" | "studyIdentity" | "sourcePath" | "pointer" | "recordIdentity" | "reportCandidateId")[];
                            readonly additionalProperties: false;
                        };
                        readonly minItems: number;
                    };
                    readonly recordsObserved: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly reportCandidates: {
                        readonly type: "integer";
                        readonly minimum: number;
                        readonly maximum: number;
                    };
                    readonly confirmedStudyMappings: {
                        readonly const: 0;
                    };
                    readonly totalStudies: {
                        readonly const: null;
                    };
                };
                readonly required: ("sources" | "records" | "confirmedStudyMappings" | "totalStudies" | "recordsObserved" | "reportCandidates")[];
                readonly additionalProperties: false;
            };
            readonly boundaryExamples: {
                readonly maxItems?: number | undefined;
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly gain: {
                            readonly maximum?: number | undefined;
                            readonly minimum?: number | undefined;
                            readonly type: "number";
                        };
                        readonly lower: {
                            readonly maximum?: number | undefined;
                            readonly minimum?: number | undefined;
                            readonly type: "number";
                        };
                        readonly upper: {
                            readonly maximum?: number | undefined;
                            readonly minimum?: number | undefined;
                            readonly type: "number";
                        };
                        readonly decision: {
                            readonly enum: readonly ["criterion_met", "nonpositive_estimate", "inconclusive"];
                        };
                        readonly halfWidth: {
                            readonly maximum?: number | undefined;
                            readonly minimum?: number | undefined;
                            readonly type: "number";
                        };
                        readonly precisionGate: {
                            readonly anyOf: readonly [{
                                readonly type: "object";
                                readonly properties: {
                                    readonly maxHalfWidth: {
                                        readonly maximum?: number | undefined;
                                        readonly minimum?: number | undefined;
                                        readonly type: "number";
                                    };
                                };
                                readonly required: "maxHalfWidth"[];
                                readonly additionalProperties: false;
                            }, {
                                readonly type: "null";
                            }];
                        };
                    };
                    readonly required: ("precisionGate" | "gain" | "lower" | "upper" | "halfWidth" | "decision")[];
                    readonly additionalProperties: false;
                };
                readonly minItems: number;
            };
        };
        readonly required: ("contractDigest" | "boundaryExamples" | "protocolDigest" | "protocol" | "compilerVersion" | "specification" | "literatureLedger")[];
        readonly additionalProperties: false;
    };
    readonly research_fixture_prepare: {
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
            readonly inputFormat: {
                readonly type: "object";
                readonly properties: {
                    readonly format: {
                        readonly const: "json-object-rows-v1";
                    };
                    readonly recordsPointer: {
                        readonly const: "/rows";
                    };
                    readonly fields: {
                        readonly type: "object";
                        readonly properties: {
                            readonly rowId: {
                                readonly const: "rowId";
                            };
                            readonly partition: {
                                readonly const: "partition";
                            };
                            readonly predictor: {
                                readonly const: "x";
                            };
                            readonly observed: {
                                readonly const: "observed";
                            };
                        };
                        readonly required: ("predictor" | "rowId" | "partition" | "observed")[];
                        readonly additionalProperties: false;
                    };
                    readonly partitions: {
                        readonly type: "object";
                        readonly properties: {
                            readonly train: {
                                readonly const: "train";
                            };
                            readonly test: {
                                readonly const: "test";
                            };
                        };
                        readonly required: ("train" | "test")[];
                        readonly additionalProperties: false;
                    };
                };
                readonly required: ("format" | "fields" | "recordsPointer" | "partitions")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("inputFormat" | "fixtureRef" | "inputPath")[];
        readonly additionalProperties: false;
    };
};
export {};
