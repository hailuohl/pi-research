import { DomainError } from '../../domain/errors.js';
export const s = {
    string: (max = 10000, min = 1) => ({ type: 'string', description: 'Lengths count Unicode code points; existing services may additionally enforce UTF-16 code-unit limits.', minLength: min, maxLength: max, ...(min ? { pattern: '\\S' } : {}) }),
    integer: (min = 0, max = 1000000) => ({ type: 'integer', minimum: min, maximum: max }),
    number: (min, max) => ({ type: 'number', ...(min === undefined ? {} : { minimum: min }), ...(max === undefined ? {} : { maximum: max }) }),
    boolean: () => ({ type: 'boolean' }),
    object: (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false }),
    array: (items, max, min = 0) => ({ type: 'array', items, minItems: min, ...(max === undefined ? {} : { maxItems: max }) }),
    enum: (values) => ({ enum: values }),
    nullable: (schema) => ({ anyOf: [schema, { type: 'null' }] }),
    json: (description) => ({ description }),
};
/** No coercion/default insertion: callers and persisted idempotency inputs retain their exact values. */
export function validateSchema(schema, value, mode = 'input') {
    const fail = (path, reason) => { throw new DomainError(mode === 'input' ? 'INVALID_INPUT' : 'INVALID_OUTPUT', `${path}: ${reason}`, mode === 'input' ? 400 : 500); };
    const ancestors = new Set();
    const json = (v, path) => {
        if (v === null || typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v))
            return;
        if (typeof v !== 'object' || ancestors.has(v))
            fail(path, '需要有限、无循环的 JSON 值');
        const o = v;
        if (!Array.isArray(o) && Object.getPrototypeOf(o) !== Object.prototype && Object.getPrototypeOf(o) !== null)
            fail(path, '需要 JSON 对象');
        if (Object.getOwnPropertySymbols(o).length)
            fail(path, 'JSON 不支持 Symbol 字段');
        ancestors.add(o);
        if (Array.isArray(o))
            for (let i = 0; i < o.length; i++)
                json(o[i], `${path}[${i}]`);
        else
            for (const [key, item] of Object.entries(o))
                json(item, `${path}.${key}`);
        ancestors.delete(o);
    };
    json(value, '$');
    const equal = (a, b) => {
        if (a === b)
            return true;
        if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b))
            return false;
        const x = a, y = b, keys = Object.keys(x);
        return keys.length === Object.keys(y).length && keys.every(k => Object.hasOwn(y, k) && equal(x[k], y[k]));
    };
    const check = (rule, v, path) => {
        if (rule.anyOf && !rule.anyOf.some(branch => { try {
            check(branch, v, path);
            return true;
        }
        catch (error) {
            if (error instanceof DomainError)
                return false;
            throw error;
        } }))
            fail(path, '不符合允许的结构');
        if (Object.hasOwn(rule, 'const') && !equal(v, rule.const))
            fail(path, '不符合固定值');
        if (rule.enum && !rule.enum.some(item => equal(item, v)))
            fail(path, '不在允许的取值内');
        const matches = (type) => type === 'null' ? v === null : type === 'array' ? Array.isArray(v) : type === 'object' ? !!v && typeof v === 'object' && !Array.isArray(v) : type === 'integer' ? typeof v === 'number' && Number.isSafeInteger(v) : typeof v === type;
        if (rule.type && !(Array.isArray(rule.type) ? rule.type : [rule.type]).some(t => matches(t)))
            fail(path, '类型不正确');
        if (typeof v === 'string') {
            // JSON Schema lengths count Unicode code points, including supplementary characters once.
            const length = [...v].length;
            if (rule.minLength !== undefined && length < rule.minLength || rule.maxLength !== undefined && length > rule.maxLength)
                fail(path, '文本长度超出范围');
            if (rule.pattern && !new RegExp(rule.pattern, 'u').test(v))
                fail(path, '文本格式不正确');
            if (rule.format === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v))
                fail(path, '需要有效 YYYY-MM-DD 日期');
        }
        if (typeof v === 'number' && (rule.minimum !== undefined && v < rule.minimum || rule.maximum !== undefined && v > rule.maximum))
            fail(path, '数值超出范围');
        if (Array.isArray(v)) {
            if (rule.minItems !== undefined && v.length < rule.minItems || rule.maxItems !== undefined && v.length > rule.maxItems)
                fail(path, '数组长度超出范围');
            if (rule.uniqueItems && v.some((item, i) => v.slice(0, i).some(previous => equal(previous, item))))
                fail(path, '数组不允许重复项');
            if (rule.items)
                v.forEach((item, i) => check(rule.items, item, `${path}[${i}]`));
        }
        else if (v !== null && typeof v === 'object') {
            const object = v, keys = Object.keys(object);
            if (rule.minProperties !== undefined && keys.length < rule.minProperties || rule.maxProperties !== undefined && keys.length > rule.maxProperties)
                fail(path, '对象字段数量超出范围');
            for (const key of rule.required ?? [])
                if (!Object.hasOwn(object, key))
                    fail(`${path}.${key}`, '缺少必需字段');
            for (const key of keys) {
                if (rule.propertyNames)
                    check(rule.propertyNames, key, `${path}.${key}`);
                if (rule.properties && Object.hasOwn(rule.properties, key))
                    check(rule.properties[key], object[key], `${path}.${key}`);
                else if (rule.additionalProperties === false)
                    fail(`${path}.${key}`, '未知字段');
                else if (typeof rule.additionalProperties === 'object')
                    check(rule.additionalProperties, object[key], `${path}.${key}`);
            }
        }
    };
    check(schema, value, '$');
}
//# sourceMappingURL=schema.js.map