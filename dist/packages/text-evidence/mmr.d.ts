export interface RankedVector {
    score: number;
    vector: Map<string, number>;
}
export declare function dot(a: Map<string, number>, b: Map<string, number>): number;
/** Inputs must be sorted by decreasing query similarity and contain unit vectors. */
export declare function selectMMR<T extends RankedVector>(items: T[], limit: number, lambda: number): T[];
