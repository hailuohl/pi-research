export class DomainError extends Error {
    code;
    status;
    details;
    constructor(code, message, status = 409, details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
        this.name = 'DomainError';
    }
}
export function ensure(condition, code, message, status = 409) {
    if (!condition)
        throw new DomainError(code, message, status);
}
export function asError(error) {
    return error instanceof DomainError ? { code: error.code, message: error.message, details: error.details } : { code: 'INTERNAL_ERROR', message: '内部错误；请查看本地服务日志' };
}
//# sourceMappingURL=errors.js.map