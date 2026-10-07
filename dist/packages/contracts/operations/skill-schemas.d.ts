export declare const SKILL_REQUIREMENTS_SCHEMA: {
    readonly type: "object";
    readonly properties: {
        readonly tools: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
        readonly backends: {
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
    };
    readonly required: ("artifactIds" | "tools" | "backends")[];
    readonly additionalProperties: false;
};
export declare const SKILL_INPUT_SCHEMAS: {
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
    readonly skill_package_upload: {
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
    readonly skill_package_enable: {
        readonly type: "object";
        readonly properties: {
            readonly revisionId: {
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
        readonly required: readonly ["revisionId", "expectedVersion"];
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
    readonly skill_package_delete: {
        readonly type: "object";
        readonly properties: {
            readonly revisionId: {
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
        readonly required: readonly ["revisionId", "expectedVersion"];
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
            readonly disabledBuiltinIds: {
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
};
export declare const SKILL_OUTPUT_SCHEMAS: {
    readonly skill_package_import: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "skill-package-revision";
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
            readonly packageId: {
                readonly type: "string";
            };
            readonly revisionTag: {
                readonly type: "string";
            };
            readonly description: {
                readonly type: "string";
            };
            readonly roles: {
                readonly type: "array";
                readonly items: {
                    readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                };
            };
            readonly license: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly requirements: {
                readonly type: "object";
                readonly properties: {
                    readonly tools: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly backends: {
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
                };
                readonly required: ("artifactIds" | "tools" | "backends")[];
                readonly additionalProperties: false;
            };
            readonly files: {
                readonly type: "array";
                readonly items: {
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
                        readonly mediaType: {
                            readonly const: "image/png";
                        };
                    };
                    readonly required: readonly ["path", "digest", "size"];
                    readonly additionalProperties: false;
                };
            };
            readonly contentDigest: {
                readonly type: "string";
            };
            readonly authorization: {
                readonly enum: readonly ["text-only", "text-with-static-assets"];
            };
        };
        readonly required: ("version" | "id" | "createdAt" | "kind" | "files" | "license" | "projectId" | "updatedAt" | "description" | "contentDigest" | "roles" | "authorization" | "packageId" | "revisionTag" | "requirements")[];
        readonly additionalProperties: false;
    };
    readonly skill_package_upload: {
        readonly type: "object";
        readonly properties: {
            readonly revision: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly kind: {
                        readonly const: "skill-package-revision";
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
                    readonly packageId: {
                        readonly type: "string";
                    };
                    readonly revisionTag: {
                        readonly type: "string";
                    };
                    readonly description: {
                        readonly type: "string";
                    };
                    readonly roles: {
                        readonly type: "array";
                        readonly items: {
                            readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                        };
                    };
                    readonly license: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly requirements: {
                        readonly type: "object";
                        readonly properties: {
                            readonly tools: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly backends: {
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
                        };
                        readonly required: ("artifactIds" | "tools" | "backends")[];
                        readonly additionalProperties: false;
                    };
                    readonly files: {
                        readonly type: "array";
                        readonly items: {
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
                                readonly mediaType: {
                                    readonly const: "image/png";
                                };
                            };
                            readonly required: readonly ["path", "digest", "size"];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly contentDigest: {
                        readonly type: "string";
                    };
                    readonly authorization: {
                        readonly enum: readonly ["text-only", "text-with-static-assets"];
                    };
                };
                readonly required: ("version" | "id" | "createdAt" | "kind" | "files" | "license" | "projectId" | "updatedAt" | "description" | "contentDigest" | "roles" | "authorization" | "packageId" | "revisionTag" | "requirements")[];
                readonly additionalProperties: false;
            };
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly version: {
                        readonly type: "integer";
                    };
                    readonly bundleId: {
                        readonly type: "string";
                    };
                    readonly builtinBundleId: {
                        readonly type: "string";
                    };
                    readonly revisionIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly disabledBuiltinIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
                readonly required: ("version" | "revisionIds" | "disabledBuiltinIds" | "bundleId" | "builtinBundleId")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("revision" | "configuration")[];
        readonly additionalProperties: false;
    };
    readonly skill_package_enable: {
        readonly type: "object";
        readonly properties: {
            readonly revision: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly kind: {
                        readonly const: "skill-package-revision";
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
                    readonly packageId: {
                        readonly type: "string";
                    };
                    readonly revisionTag: {
                        readonly type: "string";
                    };
                    readonly description: {
                        readonly type: "string";
                    };
                    readonly roles: {
                        readonly type: "array";
                        readonly items: {
                            readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                        };
                    };
                    readonly license: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly requirements: {
                        readonly type: "object";
                        readonly properties: {
                            readonly tools: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly backends: {
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
                        };
                        readonly required: ("artifactIds" | "tools" | "backends")[];
                        readonly additionalProperties: false;
                    };
                    readonly files: {
                        readonly type: "array";
                        readonly items: {
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
                                readonly mediaType: {
                                    readonly const: "image/png";
                                };
                            };
                            readonly required: readonly ["path", "digest", "size"];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly contentDigest: {
                        readonly type: "string";
                    };
                    readonly authorization: {
                        readonly enum: readonly ["text-only", "text-with-static-assets"];
                    };
                };
                readonly required: ("version" | "id" | "createdAt" | "kind" | "files" | "license" | "projectId" | "updatedAt" | "description" | "contentDigest" | "roles" | "authorization" | "packageId" | "revisionTag" | "requirements")[];
                readonly additionalProperties: false;
            };
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly version: {
                        readonly type: "integer";
                    };
                    readonly bundleId: {
                        readonly type: "string";
                    };
                    readonly builtinBundleId: {
                        readonly type: "string";
                    };
                    readonly revisionIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly disabledBuiltinIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
                readonly required: ("version" | "revisionIds" | "disabledBuiltinIds" | "bundleId" | "builtinBundleId")[];
                readonly additionalProperties: false;
            };
        };
        readonly required: ("revision" | "configuration")[];
        readonly additionalProperties: false;
    };
    readonly skill_package_list: {
        readonly type: "object";
        readonly properties: {
            readonly configuration: {
                readonly type: "object";
                readonly properties: {
                    readonly version: {
                        readonly type: "integer";
                    };
                    readonly bundleId: {
                        readonly type: "string";
                    };
                    readonly builtinBundleId: {
                        readonly type: "string";
                    };
                    readonly revisionIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly disabledBuiltinIds: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
                readonly required: ("version" | "revisionIds" | "disabledBuiltinIds" | "bundleId" | "builtinBundleId")[];
                readonly additionalProperties: false;
            };
            readonly revisions: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly revision: {
                            readonly type: "object";
                            readonly properties: {
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly kind: {
                                    readonly const: "skill-package-revision";
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
                                readonly packageId: {
                                    readonly type: "string";
                                };
                                readonly revisionTag: {
                                    readonly type: "string";
                                };
                                readonly description: {
                                    readonly type: "string";
                                };
                                readonly roles: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                                    };
                                };
                                readonly license: {
                                    readonly anyOf: readonly [{
                                        readonly type: "string";
                                    }, {
                                        readonly type: "null";
                                    }];
                                };
                                readonly requirements: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly tools: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly backends: {
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
                                    };
                                    readonly required: ("artifactIds" | "tools" | "backends")[];
                                    readonly additionalProperties: false;
                                };
                                readonly files: {
                                    readonly type: "array";
                                    readonly items: {
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
                                            readonly mediaType: {
                                                readonly const: "image/png";
                                            };
                                        };
                                        readonly required: readonly ["path", "digest", "size"];
                                        readonly additionalProperties: false;
                                    };
                                };
                                readonly contentDigest: {
                                    readonly type: "string";
                                };
                                readonly authorization: {
                                    readonly enum: readonly ["text-only", "text-with-static-assets"];
                                };
                            };
                            readonly required: ("version" | "id" | "createdAt" | "kind" | "files" | "license" | "projectId" | "updatedAt" | "description" | "contentDigest" | "roles" | "authorization" | "packageId" | "revisionTag" | "requirements")[];
                            readonly additionalProperties: false;
                        };
                        readonly reviews: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly kind: {
                                        readonly const: "skill-review";
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
                                    readonly revisionId: {
                                        readonly type: "string";
                                    };
                                    readonly contentDigest: {
                                        readonly type: "string";
                                    };
                                    readonly decision: {
                                        readonly enum: readonly ["approved", "rejected"];
                                    };
                                    readonly note: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("version" | "id" | "createdAt" | "kind" | "revisionId" | "projectId" | "updatedAt" | "contentDigest" | "decision" | "note")[];
                                readonly additionalProperties: false;
                            };
                        };
                        readonly revocations: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly kind: {
                                        readonly const: "skill-revocation";
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
                                    readonly revisionId: {
                                        readonly type: "string";
                                    };
                                    readonly contentDigest: {
                                        readonly type: "string";
                                    };
                                    readonly note: {
                                        readonly type: "string";
                                    };
                                };
                                readonly required: ("version" | "id" | "createdAt" | "kind" | "revisionId" | "projectId" | "updatedAt" | "contentDigest" | "note")[];
                                readonly additionalProperties: false;
                            };
                        };
                    };
                    readonly required: ("revision" | "reviews" | "revocations")[];
                    readonly additionalProperties: false;
                };
            };
            readonly builtinReleases: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly bundleId: {
                            readonly type: "string";
                        };
                        readonly current: {
                            readonly type: "boolean";
                        };
                        readonly skillCount: {
                            readonly type: "integer";
                        };
                    };
                    readonly required: ("current" | "bundleId" | "skillCount")[];
                    readonly additionalProperties: false;
                };
            };
            readonly builtinSkills: {
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
                    readonly required: ("id" | "digest" | "source" | "resources" | "description")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("configuration" | "revisions" | "builtinReleases" | "builtinSkills")[];
        readonly additionalProperties: false;
    };
    readonly skill_package_inspect: {
        readonly type: "object";
        readonly properties: {
            readonly revision: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                    };
                    readonly kind: {
                        readonly const: "skill-package-revision";
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
                    readonly packageId: {
                        readonly type: "string";
                    };
                    readonly revisionTag: {
                        readonly type: "string";
                    };
                    readonly description: {
                        readonly type: "string";
                    };
                    readonly roles: {
                        readonly type: "array";
                        readonly items: {
                            readonly enum: readonly ["coordinator", "literature", "designer", "implementer", "analyst", "reviewer", "writer"];
                        };
                    };
                    readonly license: {
                        readonly anyOf: readonly [{
                            readonly type: "string";
                        }, {
                            readonly type: "null";
                        }];
                    };
                    readonly requirements: {
                        readonly type: "object";
                        readonly properties: {
                            readonly tools: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "string";
                                };
                            };
                            readonly backends: {
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
                        };
                        readonly required: ("artifactIds" | "tools" | "backends")[];
                        readonly additionalProperties: false;
                    };
                    readonly files: {
                        readonly type: "array";
                        readonly items: {
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
                                readonly mediaType: {
                                    readonly const: "image/png";
                                };
                            };
                            readonly required: readonly ["path", "digest", "size"];
                            readonly additionalProperties: false;
                        };
                    };
                    readonly contentDigest: {
                        readonly type: "string";
                    };
                    readonly authorization: {
                        readonly enum: readonly ["text-only", "text-with-static-assets"];
                    };
                };
                readonly required: ("version" | "id" | "createdAt" | "kind" | "files" | "license" | "projectId" | "updatedAt" | "description" | "contentDigest" | "roles" | "authorization" | "packageId" | "revisionTag" | "requirements")[];
                readonly additionalProperties: false;
            };
            readonly reviews: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "skill-review";
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
                        readonly revisionId: {
                            readonly type: "string";
                        };
                        readonly contentDigest: {
                            readonly type: "string";
                        };
                        readonly decision: {
                            readonly enum: readonly ["approved", "rejected"];
                        };
                        readonly note: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("version" | "id" | "createdAt" | "kind" | "revisionId" | "projectId" | "updatedAt" | "contentDigest" | "decision" | "note")[];
                    readonly additionalProperties: false;
                };
            };
            readonly revocations: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly const: "skill-revocation";
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
                        readonly revisionId: {
                            readonly type: "string";
                        };
                        readonly contentDigest: {
                            readonly type: "string";
                        };
                        readonly note: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("version" | "id" | "createdAt" | "kind" | "revisionId" | "projectId" | "updatedAt" | "contentDigest" | "note")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("revision" | "reviews" | "revocations")[];
        readonly additionalProperties: false;
    };
    readonly skill_package_read: {
        readonly anyOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly revisionId: {
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
            };
            readonly required: readonly ["revisionId", "resource", "content", "digest"];
            readonly additionalProperties: false;
        }, {
            readonly type: "object";
            readonly properties: {
                readonly revisionId: {
                    readonly type: "string";
                };
                readonly resource: {
                    readonly type: "string";
                };
                readonly digest: {
                    readonly type: "string";
                };
                readonly mediaType: {
                    readonly const: "image/png";
                };
                readonly contentBase64: {
                    readonly type: "string";
                };
            };
            readonly required: readonly ["revisionId", "resource", "digest", "mediaType", "contentBase64"];
            readonly additionalProperties: false;
        }];
    };
    readonly skill_package_review: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "skill-review";
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
            readonly revisionId: {
                readonly type: "string";
            };
            readonly contentDigest: {
                readonly type: "string";
            };
            readonly decision: {
                readonly enum: readonly ["approved", "rejected"];
            };
            readonly note: {
                readonly type: "string";
            };
        };
        readonly required: ("version" | "id" | "createdAt" | "kind" | "revisionId" | "projectId" | "updatedAt" | "contentDigest" | "decision" | "note")[];
        readonly additionalProperties: false;
    };
    readonly skill_package_revoke: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
            };
            readonly kind: {
                readonly const: "skill-revocation";
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
            readonly revisionId: {
                readonly type: "string";
            };
            readonly contentDigest: {
                readonly type: "string";
            };
            readonly note: {
                readonly type: "string";
            };
        };
        readonly required: ("version" | "id" | "createdAt" | "kind" | "revisionId" | "projectId" | "updatedAt" | "contentDigest" | "note")[];
        readonly additionalProperties: false;
    };
    readonly skill_package_delete: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly bundleId: {
                readonly type: "string";
            };
            readonly builtinBundleId: {
                readonly type: "string";
            };
            readonly revisionIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly disabledBuiltinIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly required: ("version" | "revisionIds" | "disabledBuiltinIds" | "bundleId" | "builtinBundleId")[];
        readonly additionalProperties: false;
    };
    readonly skill_bundle_configure: {
        readonly type: "object";
        readonly properties: {
            readonly version: {
                readonly type: "integer";
            };
            readonly bundleId: {
                readonly type: "string";
            };
            readonly builtinBundleId: {
                readonly type: "string";
            };
            readonly revisionIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly disabledBuiltinIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly required: readonly ["version", "bundleId", "revisionIds"];
        readonly additionalProperties: false;
    };
    readonly skill_session_select: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
                readonly type: "string";
            };
            readonly version: {
                readonly type: "integer";
            };
            readonly skillBundleId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly skillIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly ready: {
                readonly type: "boolean";
            };
            readonly missing: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly skillId: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly enum: readonly ["tool", "backend", "artifact", "binding"];
                        };
                        readonly value: {
                            readonly type: "string";
                        };
                        readonly reason: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("kind" | "reason" | "value" | "skillId")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("version" | "ready" | "sessionId" | "skillIds" | "skillBundleId" | "missing")[];
        readonly additionalProperties: false;
    };
    readonly skill_preflight: {
        readonly type: "object";
        readonly properties: {
            readonly sessionId: {
                readonly type: "string";
            };
            readonly version: {
                readonly type: "integer";
            };
            readonly skillBundleId: {
                readonly anyOf: readonly [{
                    readonly type: "string";
                }, {
                    readonly type: "null";
                }];
            };
            readonly skillIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
            readonly ready: {
                readonly type: "boolean";
            };
            readonly missing: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly skillId: {
                            readonly type: "string";
                        };
                        readonly kind: {
                            readonly enum: readonly ["tool", "backend", "artifact", "binding"];
                        };
                        readonly value: {
                            readonly type: "string";
                        };
                        readonly reason: {
                            readonly type: "string";
                        };
                    };
                    readonly required: ("kind" | "reason" | "value" | "skillId")[];
                    readonly additionalProperties: false;
                };
            };
        };
        readonly required: ("version" | "ready" | "sessionId" | "skillIds" | "skillBundleId" | "missing")[];
        readonly additionalProperties: false;
    };
};
