export declare function object(value: unknown): Record<string, unknown>;
export declare function text(value: unknown, name: string, max?: number, empty?: boolean): string;
export declare function integer(value: unknown, name: string, min?: number, max?: number): number;
export declare function strings(value: unknown, name: string, max?: number): string[];
export declare function oneOf<T extends string>(value: unknown, values: readonly T[], name: string): T;
export declare function bool(value: unknown, name: string): boolean;
export declare function expected(value: unknown): number;
export declare function finiteMetrics(value: unknown): Record<string, number>;
