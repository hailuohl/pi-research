import { DomainError, ensure } from '../domain/errors.js';
export function object(value: unknown): Record<string, unknown> { ensure(value !== null && typeof value === 'object' && !Array.isArray(value), 'INVALID_INPUT', '需要 JSON 对象', 400); return value as Record<string, unknown>; }
export function text(value: unknown, name: string, max = 10000, empty = false): string { ensure(typeof value === 'string' && (empty || value.trim().length > 0) && value.length <= max, 'INVALID_INPUT', `${name} 必须是长度不超过 ${max} 的文本`, 400); return value; }
export function integer(value: unknown, name: string, min = 0, max = 1000000): number { ensure(typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max, 'INVALID_INPUT', `${name} 必须在 ${min}–${max} 范围内`, 400); return value; }
export function strings(value: unknown, name: string, max = 100): string[] { ensure(Array.isArray(value) && value.length <= max, 'INVALID_INPUT', `${name} 必须是数组且最多 ${max} 项`, 400); return value.map(x => text(x, name, 1000)); }
export function oneOf<T extends string>(value: unknown, values: readonly T[], name: string): T { ensure(typeof value === 'string' && values.includes(value as T), 'INVALID_INPUT', `${name} 的取值无效`, 400); return value as T; }
export function bool(value: unknown, name: string): boolean { ensure(typeof value === 'boolean', 'INVALID_INPUT', `${name} 必须是布尔值`, 400); return value; }
export function expected(value: unknown): number { return integer(value, 'expectedVersion', 1); }
export function finiteMetrics(value: unknown): Record<string, number> {
    const result = object(value);
    for (const [key, x] of Object.entries(result)) {
        if (typeof x !== 'number' || !Number.isFinite(x))
            throw new DomainError('INVALID_METRICS', `指标 ${key} 不是有限数值`, 400);
    }
    return result as Record<string, number>;
}
