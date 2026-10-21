import { ensure } from '../domain/errors.js';
/** Scheduling credits are a hard attempt limit, not a provider billing guarantee. */
export class BudgetService {
    store;
    constructor(store) {
        this.store = store;
    }
    configure(projectId, ownerId, limit) { ensure(limit === null || Number.isSafeInteger(limit) && limit >= 0, 'INVALID_INPUT', '无效额度', 400); return this.store.create('budget', projectId, { ownerId, limit, unit: 'agent-attempt' }, ownerId); }
    summary(ownerId) { const budget = this.store.get('budget', ownerId); const rs = this.store.list('reservation', budget.projectId).filter(x => x.ownerId === ownerId); const used = rs.reduce((s, r) => s + (r.state === 'settled' ? r.used : 0), 0); const reserved = rs.reduce((s, r) => s + (r.state === 'reserved' ? r.amount : 0), 0); const unknown = rs.reduce((s, r) => s + (r.state === 'unknown' ? r.amount : 0), 0); return { limit: budget.limit, used, reserved, unknown, available: budget.limit === null ? null : budget.limit - used - reserved - unknown, unit: budget.unit }; }
    canReserve(ownerId, amount) { const available = this.summary(ownerId).available; return available === null || available >= amount; }
    reserve(projectId, ownerId, subjectId, amount) {
        return this.store.transaction(() => {
            this.store.get('budget', ownerId, projectId);
            ensure(Number.isSafeInteger(amount) && amount > 0, 'INVALID_INPUT', '预留必须为正整数', 400);
            const old = this.store.list('reservation', projectId).find(x => x.ownerId === ownerId && x.subjectId === subjectId);
            if (old) {
                ensure(old.amount === amount, 'IDEMPOTENCY_CONFLICT', '已存在不同额度的预留');
                return old;
            }
            ensure(this.canReserve(ownerId, amount), 'BUDGET_EXCEEDED', '团队执行额度不足');
            return this.store.create('reservation', projectId, { ownerId, subjectId, amount, used: 0, state: 'reserved' });
        });
    }
    settle(id, used) {
        return this.store.transaction(() => {
            const r = this.store.get('reservation', id);
            ensure(Number.isSafeInteger(used) && used >= 0 && used <= r.amount, 'INVALID_INPUT', '结算量超出预留', 400);
            if (r.state === 'settled') {
                ensure(r.used === used, 'IDEMPOTENCY_CONFLICT', '不能改变已结算用量');
                return r;
            }
            return this.store.update('reservation', id, r.version, { used, state: 'settled' });
        });
    }
    markUnknown(id) {
        const r = this.store.get('reservation', id);
        if (r.state === 'settled')
            return r;
        return this.store.update('reservation', id, r.version, { state: 'unknown' });
    }
}
//# sourceMappingURL=budget.js.map