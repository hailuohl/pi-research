import type { ResearchContract, Manifest } from '../domain/types.js';
export declare const EXAMPLE_CONTRACT: ResearchContract;
export declare function validateContract(value: unknown): ResearchContract;
export declare function verifyTrustedExample(manifest: Manifest, repoRoot: string): void;
