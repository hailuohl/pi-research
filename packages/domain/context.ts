import type { Store } from '../storage/store.js';
export interface AppContext {
    store: Store;
    dataDir: string;
    repoRoot: string;
}
