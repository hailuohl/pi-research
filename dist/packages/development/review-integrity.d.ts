import type { Store } from '../storage/store.js';
import { type SourceIntegrityContext } from '../storage/source-integrity.js';
import type { ResearchSourceInput } from '../research-workflows/source-inputs.js';
export declare const currentReviewIntegrity: (store: Store, jobId: string) => SourceIntegrityContext | undefined;
export declare function withReviewIntegrity<T>(store: Store, pid: string, jobId: string, inputs: ResearchSourceInput[] | undefined, mode: 'authority' | 'full', fn: (context: SourceIntegrityContext) => T): T;
