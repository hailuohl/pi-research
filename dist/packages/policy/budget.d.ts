import { Store } from '../storage/store.js';
interface Budget {
    ownerId: string;
    limit: number;
    unit: 'agent-attempt';
}
interface Reservation {
    ownerId: string;
    subjectId: string;
    amount: number;
    used: number;
    state: 'reserved' | 'settled' | 'unknown';
}
/** Scheduling credits are a hard attempt limit, not a provider billing guarantee. */
export declare class BudgetService {
    private store;
    constructor(store: Store);
    configure(projectId: string, ownerId: string, limit: number): import("../domain/types.js").Row<Budget>;
    summary(ownerId: string): {
        limit: number;
        used: number;
        reserved: number;
        unknown: number;
        available: number;
        unit: "agent-attempt";
    };
    reserve(projectId: string, ownerId: string, subjectId: string, amount: number): import("../domain/types.js").Row<Reservation>;
    settle(id: string, used: number): import("../domain/types.js").Row<Reservation>;
    markUnknown(id: string): import("../domain/types.js").Row<Reservation>;
}
export {};
