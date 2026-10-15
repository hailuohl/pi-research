import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { arch, cpus, freemem, totalmem } from 'node:os';
import { join } from 'node:path';
import { ensure } from '../domain/errors.js';
import { integer, object, text } from '../contracts/validation.js';
import { userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';
import { currentDockerContext } from './gpu.js';
export const CONNECTION_TTL_MS = 30000;
/** Observations are separate from frozen execution identities and never contain stderr or credentials. */
export class ComputeConnectionService {
    c;
    constructor(c) {
        this.c = c;
    }
    observation(id, kind = 'compute-connection') { return this.c.store.maybe(kind, id)?.observation; }
    save(id, observation, kind) { const old = this.c.store.maybe(kind, id); if (old)
        this.c.store.update(kind, id, old.version, { observation });
    else
        this.c.store.create(kind, null, { observation }, id); }
    begin(id, configurationDigest, kind = 'compute-connection') { return this.c.store.transaction(() => { const attempt = randomUUID(); this.save(id, { attempt, status: 'unverified', ...(configurationDigest ? { configurationDigest } : {}) }, kind); return attempt; }); }
    finish(id, attempt, value, kind = 'compute-connection') { return this.c.store.transaction(() => { if (this.observation(id, kind)?.attempt !== attempt)
        return false; const checkedAt = new Date().toISOString(); this.save(id, { ...value, attempt, checkedAt, ...(value.status === 'verified' ? { validUntil: new Date(Date.now() + CONNECTION_TTL_MS).toISOString() } : {}) }, kind); return true; }); }
    invalidateSsh(id, configurationDigest) { this.begin('ssh:' + id, configurationDigest); this.begin('ssh:' + id, configurationDigest, 'compute-gpu-observation'); }
    preferences(id) { const row = this.c.store.maybe('ssh-target-preferences', id); return { version: row?.version ?? 0, cpu: row?.cpu ?? true, gpu: row?.gpu ?? false }; }
    configurePreferences(actor, value, targets) { userOnly(actor); const x = object(value), id = text(x.id, 'id', 80); ensure(Object.keys(x).every(k => ['id', 'expectedVersion', 'cpu', 'gpu'].includes(k)) && typeof x.cpu === 'boolean' && typeof x.gpu === 'boolean' && (x.cpu || x.gpu), 'INVALID_INPUT', '至少选择 CPU 或 GPU 调用偏好', 400); return this.c.store.transaction(() => { targets.inspect(actor, id); const old = this.c.store.maybe('ssh-target-preferences', id); ensure((old?.version ?? 0) === integer(x.expectedVersion, 'expectedVersion', 0), 'VERSION_CONFLICT', 'SSH 调用偏好已变化'); if (old)
        this.c.store.update('ssh-target-preferences', id, old.version, { cpu: x.cpu, gpu: x.gpu });
    else
        this.c.store.create('ssh-target-preferences', null, { cpu: x.cpu, gpu: x.gpu }, id); return { id, ...this.preferences(id) }; }); }
    state(observation, configurationDigest) { if (!observation || configurationDigest && observation.configurationDigest !== configurationDigest)
        return { status: 'unverified' }; const { checkedAt, validUntil, errorCode, targetId } = observation, status = observation.status === 'verified' && (!validUntil || !Number.isFinite(Date.parse(validUntil)) || Date.parse(validUntil) <= Date.now()) ? 'stale' : observation.status; return { status, ...(checkedAt ? { checkedAt } : {}), ...(validUntil ? { validUntil } : {}), ...(errorCode ? { errorCode } : {}), ...(targetId ? { targetId } : {}) }; }
    contextState(context, state, endpoint) { const row = this.c.store.db.prepare('SELECT status,target_id,endpoint FROM compute_contexts WHERE context=?').get(context); if (row?.status === 'unavailable')
        return { ...state, status: 'unavailable', errorCode: state.errorCode ?? 'COMPUTE_TARGET_UNAVAILABLE' }; if (state.status === 'verified' && (!row || row.status !== 'ready' || row.target_id !== state.targetId || endpoint && row.endpoint !== endpoint))
        return { ...state, status: 'unverified' }; return state; }
    docker(context) { const observation = this.observation('docker:' + context), state = this.contextState(context, this.state(observation)); return { context, runTarget: { runner: 'docker', dockerContext: context }, ...state, ...(state.status === 'verified' && observation?.serverVersion ? { serverVersion: observation.serverVersion } : {}), ...(state.status === 'verified' && observation?.cpus !== undefined ? { cpus: observation.cpus } : {}), ...(state.status === 'verified' && observation?.memoryMb !== undefined ? { memoryMb: observation.memoryMb } : {}) }; }
    list(actor, targets) {
        const contexts = new Set(this.c.store.db.prepare("SELECT context FROM compute_contexts WHERE context NOT LIKE 'ssh:%'").all().map(r => String(r.context)));
        for (const row of this.c.store.list('compute-connection'))
            if (row.id.startsWith('docker:'))
                contexts.add(row.id.slice(7));
        const ssh = targets.directory().map(({ target: t, configurationDigest }) => this.ssh(actor, t, configurationDigest));
        return { docker: [...contexts].map(context => this.docker(context)), ssh };
    }
    ssh(actor, t, configurationDigest) {
        const state = this.contextState('ssh:' + t.id, this.state(this.observation('ssh:' + t.id), configurationDigest), t.verified ? configurationDigest + ':' + t.verified.protocolDigest : undefined), gpu = this.observation('ssh:' + t.id, 'compute-gpu-observation');
        let currentProtocol = false;
        try {
            currentProtocol = t.verified?.protocolDigest === digest(readFileSync(join(this.c.repoRoot, 'scripts', 'ssh-runner-gpu.py')));
        }
        catch { /* Missing local protocol cannot advertise execution capability. */ }
        const reservation = this.c.store.maybe('ssh-setup', t.id);
        const cpu = !reservation && state.status === 'verified' && t.gpuProtocol === true && t.verified?.gpuProtocol === true && t.verified.configDigest === configurationDigest && t.verified.targetId === state.targetId && currentProtocol;
        const gpuValid = cpu && this.state(gpu, configurationDigest).status === 'verified' && gpu?.targetId === state.targetId;
        const gpuDevices = gpuValid ? gpu?.devices ?? [] : [];
        const observation = this.observation('ssh:' + t.id), health = observation?.configurationDigest === configurationDigest ? { supervisor: observation.supervisor, docker: observation.docker, workspace: observation.workspace } : {};
        return { id: t.id, configurationVersion: t.version, runTarget: { runner: 'ssh', sshTargetId: t.id }, ...state, preferences: this.preferences(t.id), capabilities: { cpu, gpu: gpuDevices.length > 0 }, gpuDevices, gpuStatus: gpuValid ? 'verified' : cpu ? this.state(gpu, configurationDigest).status : 'unverified', ...(state.status === 'verified' && observation?.cpus !== undefined ? { cpus: observation.cpus } : {}), ...(state.status === 'verified' && observation?.memoryMb !== undefined ? { memoryMb: observation.memoryMb } : {}), ...(t.managed ? { managed: true, ...health, setup: reservation ? (reservation.until <= Date.now() ? 'unknown' : reservation.state) : 'idle' } : {}), ...(gpuValid && gpu?.validUntil ? { gpuValidUntil: gpu.validUntil } : {}), ...(actor.type === 'user' ? { host: t.host, port: t.port, user: t.user, remoteRoot: t.remoteRoot } : {}) };
    }
}
export function localHardware() { const devices = cpus(); return { cpuModel: devices[0]?.model ?? 'unknown', logicalCpus: devices.length, totalMemoryMb: Math.floor(totalmem() / 1048576), freeMemoryMb: Math.floor(freemem() / 1048576), arch: arch() }; }
/** Explicit HTTP lifecycle only; each target progresses independently and never overlaps itself. */
export class ComputeConnectionMonitor {
    app;
    intervalMs;
    currentContext;
    timer;
    pending = new Map();
    stopped = true;
    detectedContext;
    get currentDockerContext() { return this.detectedContext; }
    constructor(app, intervalMs = 20000, currentContext = currentDockerContext) {
        this.app = app;
        this.intervalMs = intervalMs;
        this.currentContext = currentContext;
    }
    start() { if (!this.stopped)
        return; this.stopped = false; this.tick(); this.timer = setInterval(() => this.tick(), this.intervalMs); this.timer.unref(); }
    launch(id, probe) { if (this.stopped || this.pending.has(id))
        return; const pending = Promise.resolve().then(() => { this.validate(); return probe(); }).catch(() => { }).finally(() => { this.pending.delete(id); }); this.pending.set(id, pending); }
    validate = () => ensure(!this.stopped, 'SERVER_CLOSING', '计算连接检测已停止', 503);
    tick() {
        if (this.stopped)
            return;
        this.launch('docker', async () => { let context; try {
            context = text(this.currentContext(), 'context', 100);
            this.validate();
            this.detectedContext = context;
        }
        catch {
            this.validate();
            this.detectedContext = 'current';
            const connections = new ComputeConnectionService(this.app.context), attempt = connections.begin('docker:current');
            connections.finish('docker:current', attempt, { status: 'unavailable', errorCode: 'COMPUTE_TARGET_UNAVAILABLE' });
            return;
        } await this.app.compute.probeContext({ type: 'user' }, context, this.validate, true); });
        try {
            for (const { target } of this.app.sshTargets.directory()) {
                const reservation = this.app.store.maybe('ssh-setup', target.id);
                if (reservation?.state !== 'installing')
                    this.launch('ssh:' + target.id, () => this.app.sshTargets.observe(target.id, this.validate));
            }
        }
        catch { /* Invalid saved directory cannot prevent local Docker observation. */ }
    }
    async stop() { this.stopped = true; if (this.timer)
        clearInterval(this.timer); this.timer = undefined; await Promise.allSettled([...this.pending.values()]); }
}
//# sourceMappingURL=compute-connections.js.map