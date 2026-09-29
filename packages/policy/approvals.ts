import { assertProjectWritable } from '../policy/lifecycle.js';
import type { AppContext } from '../domain/context.js';
import type { Actor, Approval } from '../domain/types.js';
import { userOnly, scope } from './permissions.js';
import { ensure } from '../domain/errors.js';
import { now } from '../storage/store.js';
import {assertWorkingGrantReference} from './working-grant-validation.js';
export class ApprovalService {
    constructor(private c: AppContext) { }
    request(projectId: string, subjectKind: string, subjectId: string, digest: string, scopeName: string, reason: string) { assertProjectWritable(this.c.store,projectId); return this.c.store.create<Approval>('approval', projectId, { subjectKind, subjectId, digest, scope: scopeName, status: 'pending', reason }); }
    decide(actor: Actor, id: string, version: number, approved: boolean) { userOnly(actor); return this.c.store.transaction(() => { const a = this.c.store.get<Approval>('approval', id); scope(actor, a.projectId!); assertProjectWritable(this.c.store,a.projectId!); ensure(a.status === 'pending', 'APPROVAL_NOT_PENDING', '审批已处理或失效'); const result = this.c.store.update<Approval>('approval', id, version, { status: approved ? 'approved' : 'rejected', decidedAt: now() }); this.c.store.event(a.projectId, 'approval.decided', { id, approved, subjectKind: a.subjectKind, subjectId: a.subjectId }); return result; }); }
    assert(id: string, projectId: string, subjectId: string, digest: string, requiredScope: string) { const a = this.c.store.get<Approval>('approval', id, projectId); ensure(a.subjectId === subjectId && a.digest === digest && a.scope === requiredScope, 'APPROVAL_STALE', '批准内容与当前请求不一致'); ensure(a.status === 'approved', a.status === 'stale' ? 'APPROVAL_STALE' : 'APPROVAL_REQUIRED', '需要用户批准当前版本'); if(a.workingGrant){ensure(requiredScope==='development.test'&&a.subjectKind==='development-task','APPROVAL_STALE','私有实现授权不能派生其他权限');assertWorkingGrantReference(this.c.store,projectId,a.workingGrant);}return a; }
    stale(subjectId: string) {
        for (const a of this.c.store.list<Approval>('approval').filter(a => a.subjectId === subjectId && a.status !== 'stale'))
            this.c.store.update<Approval>('approval', a.id, a.version, { status: 'stale' });
    }
}
