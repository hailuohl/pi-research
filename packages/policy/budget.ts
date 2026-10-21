import { Store } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
interface Budget {
    ownerId: string;
    limit: number | null;
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
export class BudgetService {
    constructor(private store: Store) { }
    configure(projectId: string, ownerId: string, limit: number | null) { ensure(limit===null||Number.isSafeInteger(limit) && limit >= 0, 'INVALID_INPUT', '无效额度', 400); return this.store.create<Budget>('budget', projectId, { ownerId, limit, unit: 'agent-attempt' }, ownerId); }
    summary(ownerId: string) { const budget = this.store.get<Budget>('budget', ownerId); const rs = this.store.list<Reservation>('reservation', budget.projectId!).filter(x => x.ownerId === ownerId); const used = rs.reduce((s, r) => s + (r.state === 'settled' ? r.used : 0), 0); const reserved = rs.reduce((s, r) => s + (r.state === 'reserved' ? r.amount : 0), 0); const unknown = rs.reduce((s, r) => s + (r.state === 'unknown' ? r.amount : 0), 0); return { limit: budget.limit, used, reserved, unknown, available: budget.limit===null?null:budget.limit - used - reserved - unknown, unit: budget.unit }; }
    canReserve(ownerId:string,amount:number){const available=this.summary(ownerId).available;return available===null||available>=amount;}
    reserve(projectId: string, ownerId: string, subjectId: string, amount: number) {
        return this.store.transaction(() => {
            this.store.get('budget', ownerId, projectId);
            ensure(Number.isSafeInteger(amount) && amount > 0, 'INVALID_INPUT', '预留必须为正整数', 400);
            const old = this.store.list<Reservation>('reservation', projectId).find(x => x.ownerId === ownerId && x.subjectId === subjectId);
            if (old) {
                ensure(old.amount === amount, 'IDEMPOTENCY_CONFLICT', '已存在不同额度的预留');
                return old;
            }
            ensure(this.canReserve(ownerId,amount), 'BUDGET_EXCEEDED', '团队执行额度不足');
            return this.store.create<Reservation>('reservation', projectId, { ownerId, subjectId, amount, used: 0, state: 'reserved' });
        });
    }
    settle(id: string, used: number) {
        return this.store.transaction(() => {
            const r = this.store.get<Reservation>('reservation', id);
            ensure(Number.isSafeInteger(used) && used >= 0 && used <= r.amount, 'INVALID_INPUT', '结算量超出预留', 400);
            if (r.state === 'settled') {
                ensure(r.used === used, 'IDEMPOTENCY_CONFLICT', '不能改变已结算用量');
                return r;
            }
            return this.store.update<Reservation>('reservation', id, r.version, { used, state: 'settled' });
        });
    }
    markUnknown(id: string) {
        const r = this.store.get<Reservation>('reservation', id);
        if (r.state === 'settled')
            return r;
        return this.store.update<Reservation>('reservation', id, r.version, { state: 'unknown' });
    }
}
