import type { Actor } from '../domain/types.js';
import type { AppContext } from '../domain/context.js';
export declare class LiteratureService {
    private c;
    constructor(c: AppContext);
    /** Metadata-only Crossref search. A search hit is never full-text evidence. */
    search(projectId: string, query: string, limit?: number, key?: string, validate?: () => void, actor?: Actor): Promise<any>;
}
