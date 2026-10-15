export declare class DomainError extends Error {
    code: string;
    status: number;
    details?: unknown | undefined;
    constructor(code: string, message: string, status?: number, details?: unknown | undefined);
}
export declare function ensure(condition: unknown, code: string, message: string, status?: number): asserts condition;
export declare function asError(error: unknown): {
    code: string;
    message: string;
    details: unknown;
} | {
    code: string;
    message: string;
    details?: undefined;
};
