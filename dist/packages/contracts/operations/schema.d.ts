export type JsonValue = null | boolean | number | string | JsonValue[] | {
    [key: string]: JsonValue;
};
type SchemaType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
/** The finite JSON Schema vocabulary used by operation contracts (draft 2020-12 compatible). */
export interface JsonSchema {
    readonly type?: SchemaType | readonly SchemaType[];
    readonly description?: string;
    readonly properties?: Readonly<Record<string, JsonSchema>>;
    readonly required?: readonly string[];
    readonly additionalProperties?: boolean | JsonSchema;
    readonly propertyNames?: JsonSchema;
    readonly minProperties?: number;
    readonly maxProperties?: number;
    readonly items?: JsonSchema;
    readonly minItems?: number;
    readonly maxItems?: number;
    readonly uniqueItems?: boolean;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly pattern?: string;
    readonly format?: 'date';
    readonly minimum?: number;
    readonly maximum?: number;
    readonly enum?: readonly JsonValue[];
    readonly const?: JsonValue;
    readonly anyOf?: readonly JsonSchema[];
}
type RequiredKeys<S> = S extends {
    readonly required: readonly (infer K)[];
} ? Extract<K, string> : never;
export type InferSchema<S> = S extends {
    readonly const: infer V;
} ? V : S extends {
    readonly enum: readonly (infer V)[];
} ? V : S extends {
    readonly anyOf: readonly (infer V)[];
} ? InferSchema<V> : S extends {
    readonly type: 'string';
} ? string : S extends {
    readonly type: 'number' | 'integer';
} ? number : S extends {
    readonly type: 'boolean';
} ? boolean : S extends {
    readonly type: 'null';
} ? null : S extends {
    readonly type: 'array';
    readonly items: infer I;
} ? InferSchema<I>[] : S extends {
    readonly type: 'object';
    readonly properties: infer P;
} ? {
    [K in keyof P as K extends RequiredKeys<S> ? K : never]: InferSchema<P[K]>;
} & {
    [K in keyof P as K extends RequiredKeys<S> ? never : K]?: InferSchema<P[K]>;
} : S extends {
    readonly type: 'object';
    readonly additionalProperties: infer A;
} ? Record<string, InferSchema<A>> : S extends {
    readonly type: 'object';
} ? Record<string, JsonValue> : JsonValue;
export declare const s: {
    string: (max?: number, min?: number) => {
        readonly pattern?: string | undefined;
        readonly type: "string";
        readonly description: "Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.";
        readonly minLength: number;
        readonly maxLength: number;
    };
    integer: (min?: number, max?: number) => {
        readonly type: "integer";
        readonly minimum: number;
        readonly maximum: number;
    };
    number: (min?: number, max?: number) => {
        readonly maximum?: number | undefined;
        readonly minimum?: number | undefined;
        readonly type: "number";
    };
    boolean: () => {
        readonly type: "boolean";
    };
    object: <const P extends Record<string, JsonSchema>, const R extends readonly (keyof P & string)[] = readonly []>(properties: P, required?: R) => {
        readonly type: "object";
        readonly properties: P;
        readonly required: R;
        readonly additionalProperties: false;
    };
    array: <const I extends JsonSchema>(items: I, max?: number, min?: number) => {
        readonly maxItems?: number | undefined;
        readonly type: "array";
        readonly items: I;
        readonly minItems: number;
    };
    enum: <const V extends readonly JsonValue[]>(values: V) => {
        readonly enum: V;
    };
    nullable: <const S extends JsonSchema>(schema: S) => {
        readonly anyOf: readonly [S, {
            readonly type: "null";
        }];
    };
    json: (description: string) => {
        description: string;
    };
};
/** No coercion/default insertion: callers and persisted idempotency inputs retain their exact values. */
export declare function validateSchema(schema: JsonSchema, value: unknown, mode?: 'input' | 'output'): void;
export {};
