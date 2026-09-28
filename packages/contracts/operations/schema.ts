import { DomainError } from '../../domain/errors.js';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
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
type RequiredKeys<S> = S extends { readonly required: readonly (infer K)[] } ? Extract<K, string> : never;
export type InferSchema<S> = S extends { readonly const: infer V } ? V
    : S extends { readonly enum: readonly (infer V)[] } ? V
    : S extends { readonly anyOf: readonly (infer V)[] } ? InferSchema<V>
    : S extends { readonly type: 'string' } ? string
    : S extends { readonly type: 'number' | 'integer' } ? number
    : S extends { readonly type: 'boolean' } ? boolean
    : S extends { readonly type: 'null' } ? null
    : S extends { readonly type: 'array'; readonly items: infer I } ? InferSchema<I>[]
    : S extends { readonly type: 'object'; readonly properties: infer P } ?
        { [K in keyof P as K extends RequiredKeys<S> ? K : never]: InferSchema<P[K]> } &
        { [K in keyof P as K extends RequiredKeys<S> ? never : K]?: InferSchema<P[K]> }
    : S extends { readonly type: 'object'; readonly additionalProperties: infer A } ? Record<string, InferSchema<A>>
    : S extends { readonly type: 'object' } ? Record<string, JsonValue>
    : JsonValue;

export const s = {
    string: (max = 10000, min = 1) => ({ type: 'string', description: 'Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.', minLength: min, maxLength: max, ...(min ? { pattern: '\\S' } : {}) } as const),
    integer: (min = 0, max = 1000000) => ({ type: 'integer', minimum: min, maximum: max } as const),
    number: (min?: number, max?: number) => ({ type: 'number', ...(min === undefined ? {} : { minimum: min }), ...(max === undefined ? {} : { maximum: max }) } as const),
    boolean: () => ({ type: 'boolean' } as const),
    object: <const P extends Record<string, JsonSchema>, const R extends readonly (keyof P & string)[] = readonly []>(properties: P, required: R = [] as unknown as R) => ({ type: 'object', properties, required, additionalProperties: false } as const),
    array: <const I extends JsonSchema>(items: I, max?: number, min = 0) => ({ type: 'array', items, minItems: min, ...(max === undefined ? {} : { maxItems: max }) } as const),
    enum: <const V extends readonly JsonValue[]>(values: V) => ({ enum: values } as const),
    nullable: <const S extends JsonSchema>(schema: S) => ({ anyOf: [schema, { type: 'null' }] } as const),
    json: (description: string) => ({ description }),
};

/** No coercion/default insertion: callers and persisted idempotency inputs retain their exact values. */
export function validateSchema(schema: JsonSchema, value: unknown, mode: 'input' | 'output' = 'input'): void {
    const fail = (path: string, reason: string): never => { throw new DomainError(mode === 'input' ? 'INVALID_INPUT' : 'INVALID_OUTPUT', `${path}: ${reason}`, mode === 'input' ? 400 : 500); };
    const ancestors = new Set<object>();
    const json = (v: unknown, path: string): void => {
        if (v === null || typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v)) return;
        if (typeof v !== 'object' || ancestors.has(v)) fail(path, '需要有限、无循环的 JSON 值');
        const o = v as object;
        if (!Array.isArray(o) && Object.getPrototypeOf(o) !== Object.prototype && Object.getPrototypeOf(o) !== null) fail(path, '需要 JSON 对象');
        if (Object.getOwnPropertySymbols(o).length) fail(path, 'JSON 不支持 Symbol 字段');
        ancestors.add(o);
        if (Array.isArray(o)) for (let i = 0; i < o.length; i++) json(o[i], `${path}[${i}]`);
        else for (const [key, item] of Object.entries(o)) json(item, `${path}.${key}`);
        ancestors.delete(o);
    };
    json(value, '$');
    const equal = (a: unknown, b: unknown): boolean => {
        if (a === b) return true;
        if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
        const x = a as Record<string, unknown>, y = b as Record<string, unknown>, keys = Object.keys(x);
        return keys.length === Object.keys(y).length && keys.every(k => Object.hasOwn(y, k) && equal(x[k], y[k]));
    };
    const check = (rule: JsonSchema, v: unknown, path: string): void => {
        if (rule.anyOf && !rule.anyOf.some(branch => { try { check(branch, v, path); return true; } catch (error) { if (error instanceof DomainError) return false; throw error; } })) fail(path, '不符合允许的结构');
        if (Object.hasOwn(rule, 'const') && !equal(v, rule.const)) fail(path, '不符合固定值');
        if (rule.enum && !rule.enum.some(item => equal(item, v))) fail(path, '不在允许的取值内');
        const matches = (type: SchemaType) => type === 'null' ? v === null : type === 'array' ? Array.isArray(v) : type === 'object' ? !!v && typeof v === 'object' && !Array.isArray(v) : type === 'integer' ? typeof v === 'number' && Number.isSafeInteger(v) : typeof v === type;
        if (rule.type && !(Array.isArray(rule.type) ? rule.type : [rule.type]).some(t => matches(t as SchemaType))) fail(path, '类型不正确');
        if (typeof v === 'string') {
            // JSON Schema lengths count Unicode code points, including supplementary characters once.
            const length = [...v].length;
            if (rule.minLength !== undefined && length < rule.minLength || rule.maxLength !== undefined && length > rule.maxLength) fail(path, '文本长度超出范围');
            if (rule.pattern && !new RegExp(rule.pattern, 'u').test(v)) fail(path, '文本格式不正确');
            if (rule.format === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v)) fail(path, '需要有效 YYYY-MM-DD 日期');
        }
        if (typeof v === 'number' && (rule.minimum !== undefined && v < rule.minimum || rule.maximum !== undefined && v > rule.maximum)) fail(path, '数值超出范围');
        if (Array.isArray(v)) {
            if (rule.minItems !== undefined && v.length < rule.minItems || rule.maxItems !== undefined && v.length > rule.maxItems) fail(path, '数组长度超出范围');
            if (rule.uniqueItems && v.some((item, i) => v.slice(0, i).some(previous => equal(previous, item)))) fail(path, '数组不允许重复项');
            if (rule.items) v.forEach((item, i) => check(rule.items!, item, `${path}[${i}]`));
        } else if (v !== null && typeof v === 'object') {
            const object = v as Record<string, unknown>, keys = Object.keys(object);
            if (rule.minProperties !== undefined && keys.length < rule.minProperties || rule.maxProperties !== undefined && keys.length > rule.maxProperties) fail(path, '对象字段数量超出范围');
            for (const key of rule.required ?? []) if (!Object.hasOwn(object, key)) fail(`${path}.${key}`, '缺少必需字段');
            for (const key of keys) {
                if (rule.propertyNames) check(rule.propertyNames, key, `${path}.${key}`);
                if (rule.properties && Object.hasOwn(rule.properties, key)) check(rule.properties[key], object[key], `${path}.${key}`);
                else if (rule.additionalProperties === false) fail(`${path}.${key}`, '未知字段');
                else if (typeof rule.additionalProperties === 'object') check(rule.additionalProperties, object[key], `${path}.${key}`);
            }
        }
    };
    check(schema, value, '$');
}
