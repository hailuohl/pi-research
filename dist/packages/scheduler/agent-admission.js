import { digest } from '../storage/store.js';
import { scope, userOnly } from '../policy/permissions.js';
import { ensure } from '../domain/errors.js';
import { assertWorkspaceReady } from '../workspace/git-service.js';
import { inspectPi } from '../pi-adapter/runtime.js';
const held = (slot) => slot.state !== 'released';
const counts = (slots) => { const c = { reserved: 0, running: 0, stopping: 0, unknown: 0, held: slots.length }; for (const slot of slots)
    if (slot.state !== 'released')
        c[slot.state]++; return c; };
export class AgentAdmissionService {
    c;
    constructor(c) {
        this.c = c;
        c.store.transaction(() => {
            c.store.db.exec("CREATE INDEX IF NOT EXISTS agent_admission_state ON records(kind,json_extract(data,'$.state')) WHERE kind='agent-admission'");
            if (!c.store.maybe('agent-capacity', 'global'))
                c.store.create('agent-capacity', null, { maxWorkers: null }, 'global');
            if (!c.store.db.prepare('SELECT 1 FROM schema_migrations WHERE version=3').get()) {
                for (const session of c.store.list('session').filter(s => s.state === 'running'))
                    c.store.create('agent-admission', session.projectId, { sessionId: session.id, generation: session.generation, ownerHost: 'legacy-unverified', role: session.role, ...(session.teamId ? { teamId: session.teamId } : {}), state: 'unknown', leaseUntil: 0, spawnRequested: true }, digest({ sessionId: session.id, generation: session.generation }));
                c.store.db.prepare("INSERT INTO schema_migrations VALUES(3,datetime('now'))").run();
            }
        });
    }
    slots() { return this.c.store.db.prepare("SELECT data FROM records WHERE kind='agent-admission' AND json_extract(data,'$.state') IN (?,?,?,?)").all('reserved', 'running', 'stopping', 'unknown').map(row => JSON.parse(row.data)); }
    sessionHeld(sessionId) { return this.slots().some(slot => slot.sessionId === sessionId); }
    snapshot(pid) {
        const setting = this.c.store.get('agent-capacity', 'global'), all = this.slots(), global = counts(all);
        const result = { version: setting.version, maxWorkers: null, available: null, unit: 'pi-worker', httpConcurrencyMeasured: false, counts: global };
        if (pid) {
            const project = this.c.store.get('project', pid), slots = all.filter(s => s.projectId === pid), assistantHeld = slots.filter(s => s.role !== 'coordinator').length, available = Math.max(0, project.settings.maxActiveAgents - slots.length), byRole = {};
            for (const slot of slots)
                byRole[slot.role] = (byRole[slot.role] ?? 0) + 1;
            result.project = { projectId: pid, maxActiveAgents: project.settings.maxActiveAgents, maxConcurrentAssistants: project.settings.maxConcurrentAssistants, effectiveMaxAgents: project.settings.maxActiveAgents, counts: counts(slots), assistantHeld, available, assistantAvailable: Math.max(0, Math.min(available, project.settings.maxConcurrentAssistants - assistantHeld)), byRole, blockedBy: [...(slots.length >= project.settings.maxActiveAgents ? ['project-capacity'] : []), ...(assistantHeld >= project.settings.maxConcurrentAssistants ? ['project-assistant-capacity'] : []), ...(slots.some(s => s.state === 'unknown') ? ['unknown-worker-held'] : [])] };
        }
        return result;
    }
    inspect(actor, pid) { userOnly(actor); if (pid)
        scope(actor, pid); const view = this.snapshot(pid); view.queued = this.c.store.list('session', pid).filter(s => s.state === 'queued').slice(0, 50).map(s => { const capacity = this.snapshot(s.projectId), reasons = capacity.project.blockedBy.filter(x => x !== 'project-assistant-capacity' || s.role !== 'coordinator').map(code => ({ code, message: code === 'unknown-worker-held' ? '失联 Worker 的槽位仍保留' : code === 'global-capacity' ? '全局 Pi Worker 槽位已满' : code === 'project-capacity' ? '项目 Agent 上限已满' : '项目助手上限已满' })); try {
        assertWorkspaceReady(this.c, s.id);
    }
    catch {
        reasons.push({ code: 'git-not-ready', message: '私有 Git 工作区尚未就绪' });
    } if (!inspectPi(this.c.repoRoot, s.model).ready)
        reasons.push({ code: 'pi-not-ready', message: 'Pi 本地运行时或模型配置尚未就绪' }); return { sessionId: s.id, role: s.role, reasons }; }); return view; }
    configure(actor, _value) { userOnly(actor); ensure(false, 'HOST_CAPACITY_DISABLED', '本地 Pi 不设置宿主 Worker 上限', 409); }
    check(pid, role, teamId) { const view = this.snapshot(pid); if (!view.project.available)
        return false; if (role !== 'coordinator') {
        if (!view.project.assistantAvailable)
            return false;
        if (teamId) {
            const team = this.c.store.get('team', teamId, pid);
            if (this.slots().filter(s => s.teamId === teamId && s.role !== 'coordinator').length >= team.settings.maxConcurrentAssistants)
                return false;
        }
    } return true; }
    tryAcquire(session, generation, ownerHost, teamId) {
        return this.c.store.transaction(() => { if (this.slots().some(s => s.sessionId === session.id) || !this.check(session.projectId, session.role, teamId))
            return null; return this.c.store.create('agent-admission', session.projectId, { sessionId: session.id, generation, ownerHost, role: session.role, ...(teamId ? { teamId } : {}), state: 'reserved', leaseUntil: Date.now() + 30000, spawnRequested: false }, digest({ sessionId: session.id, generation })); });
    }
    owned(id, ownerHost, generation) { const slot = this.c.store.get('agent-admission', id); ensure(slot.ownerHost === ownerHost && slot.generation === generation, 'LEASE_EXPIRED', 'Agent 准入身份已失效'); return slot; }
    assertOwned(id, ownerHost, generation) { const slot = this.owned(id, ownerHost, generation); ensure(['reserved', 'running'].includes(slot.state) && slot.leaseUntil > Date.now(), 'LEASE_EXPIRED', 'Agent 准入租约已失效'); return slot; }
    markSpawnRequested(id, owner, generation) { return this.c.store.transaction(() => { const s = this.assertOwned(id, owner, generation); return this.c.store.update('agent-admission', id, s.version, { spawnRequested: true }); }); }
    markRunning(id, owner, generation, pid) { return this.c.store.transaction(() => { const s = this.assertOwned(id, owner, generation); return this.c.store.update('agent-admission', id, s.version, { state: 'running', workerPid: pid }); }); }
    heartbeat(id, owner, generation) { return this.c.store.transaction(() => { const s = this.assertOwned(id, owner, generation); return this.c.store.update('agent-admission', id, s.version, { leaseUntil: Date.now() + 30000 }); }); }
    stopping(id, owner, generation) { return this.c.store.transaction(() => { const s = this.owned(id, owner, generation); if (s.state === 'released')
        return s; return this.c.store.update('agent-admission', id, s.version, { state: 'stopping' }); }); }
    release(id, owner, generation, proof) { return this.c.store.transaction(() => { const s = this.owned(id, owner, generation); if (s.state === 'released')
        return s; ensure(proof === 'confirmed-exit' || proof === 'synchronous-fork-failure' && !s.workerPid || proof === 'not-forked' && !s.spawnRequested, 'ADMISSION_RELEASE_DENIED', '已请求启动的 Worker 需要确认退出'); return this.c.store.update('agent-admission', id, s.version, { state: 'released', leaseUntil: 0 }); }); }
    recover() { for (const candidate of this.slots())
        this.c.store.transaction(() => { const s = this.c.store.get('agent-admission', candidate.id); if (s.state === 'released' || s.leaseUntil > Date.now())
            return; let gone = !s.spawnRequested && !s.workerPid; if (s.workerPid) {
            try {
                process.kill(s.workerPid, 0);
            }
            catch (error) {
                gone = error.code === 'ESRCH';
            }
        } const state = gone ? 'released' : 'unknown'; if (s.state !== state || s.leaseUntil !== 0)
            this.c.store.update('agent-admission', s.id, s.version, { state, leaseUntil: 0 }); }); }
}
//# sourceMappingURL=agent-admission.js.map