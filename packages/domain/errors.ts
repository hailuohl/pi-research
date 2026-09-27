export class DomainError extends Error {
    constructor(public code: string, message: string, public status = 409, public details?: unknown) { super(message); this.name = 'DomainError'; }
}
export function ensure(condition: unknown, code: string, message: string, status = 409): asserts condition {
    if (!condition)
        throw new DomainError(code, message, status);
}
export function asError(error: unknown) {
    return error instanceof DomainError ? { code: error.code, message: error.message, details: error.details } : { code: 'INTERNAL_ERROR', message: '内部错误；请查看本地服务日志' };
}
