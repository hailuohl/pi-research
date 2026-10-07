import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { ensure, DomainError } from '../domain/errors.js';
import { object, text, integer } from '../contracts/validation.js';
import { userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';
import { sshRequest } from './ssh.js';
import { ComputeConnectionService } from './compute-connections.js';
export class SshTargetService {
    c;
    request;
    constructor(c, request = sshRequest) {
        this.c = c;
        this.request = request;
    }
    file() { return join(this.c.dataDir, 'ssh-targets.json'); }
    read() { return existsSync(this.file()) ? JSON.parse(readFileSync(this.file(), 'utf8')) : {}; }
    write(all) { mkdirSync(this.c.dataDir, { recursive: true, mode: 0o700 }); const tmp = this.file() + '.tmp'; writeFileSync(tmp, JSON.stringify(all), { mode: 0o600 }); renameSync(tmp, this.file()); }
    configure(actor, value) {
        userOnly(actor);
        const x = object(value);
        ensure(Object.keys(x).every(k => ['id', 'host', 'port', 'user', 'identityFile', 'knownHostsFile', 'remoteRoot', 'expectedVersion', 'gpuProtocol'].includes(k)), 'INVALID_INPUT', 'SSH 目标包含未知字段', 400);
        ensure(x.gpuProtocol === undefined || typeof x.gpuProtocol === 'boolean', 'INVALID_INPUT', 'gpuProtocol 必须为布尔值');
        const id = text(x.id, 'id', 80), host = text(x.host, 'host', 253), user = text(x.user, 'user', 64), remoteRoot = text(x.remoteRoot, 'remoteRoot', 500);
        ensure(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id) && /^[a-zA-Z0-9][a-zA-Z0-9.:-]*$/.test(host) && /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(user), 'INVALID_INPUT', 'SSH 目标名称、主机或用户无效', 400);
        ensure(/^\/[A-Za-z0-9_./-]+$/.test(remoteRoot) && !remoteRoot.split('/').slice(1).some(p => !p || p === '.' || p === '..') && remoteRoot.split('/').length > 2, 'INVALID_INPUT', 'SSH 工作根目录必须是固定规范绝对路径', 400);
        const local = (v, k) => { const p = text(v, k, 2000); ensure(isAbsolute(p) && lstatSync(p).isFile() && !lstatSync(p).isSymbolicLink(), 'INVALID_INPUT', 'SSH 身份和 known_hosts 必须是宿主普通文件', 400); return resolve(p); };
        const identityFile = local(x.identityFile, 'identityFile'), knownHostsFile = local(x.knownHostsFile, 'knownHostsFile');
        return this.c.store.transaction(() => {
            const all = this.read(), before = all[id];
            ensure((before?.version ?? 0) === integer(x.expectedVersion ?? 0, 'expectedVersion', 0), 'VERSION_CONFLICT', 'SSH 目标版本已变化');
            ensure(!this.c.store.db.prepare("SELECT 1 FROM compute_queue WHERE context_name=? AND phase NOT IN ('succeeded','failed','cancelled','timed_out') LIMIT 1").get('ssh:' + id), 'SSH_TARGET_BUSY', '目标仍有等待、运行或未知作业，不能改写配置');
            const target = { id, ...(x.gpuProtocol === true ? { gpuProtocol: true } : {}), version: (before?.version ?? 0) + 1, host, port: integer(x.port ?? 22, 'port', 1, 65535), user, remoteRoot, identityFile, knownHostsFile, identityDigest: digest(readFileSync(identityFile)), hostKeyDigest: digest(readFileSync(knownHostsFile)) };
            all[id] = target;
            this.write(all);
            new ComputeConnectionService(this.c).invalidateSsh(id, this.configDigest(target));
            this.c.store.db.prepare("UPDATE compute_contexts SET status='unresolved',next_probe_at=0 WHERE context=?").run('ssh:' + id);
            return { id, version: target.version, verified: false };
        });
    }
    configDigest(t) { const { verified, ...config } = t; return digest(config); }
    directory() { return Object.values(this.read()).map(target => ({ target, configurationDigest: this.configDigest(target) })); }
    inspect(actor, id) { userOnly(actor); const t = this.read()[id]; ensure(t, 'SSH_TARGET_NOT_FOUND', 'SSH 目标未配置', 404); const { host, port, user, identityFile, knownHostsFile, remoteRoot, version } = t; return { id, version, host, port, user, identityFile, knownHostsFile, remoteRoot, gpuProtocol: t.gpuProtocol === true }; }
    privateTarget(id) { const t = this.read()[id]; ensure(t, 'SSH_TARGET_NOT_FOUND', 'SSH 目标未配置', 404); ensure(digest(readFileSync(t.identityFile)) === t.identityDigest && digest(readFileSync(t.knownHostsFile)) === t.hostKeyDigest, 'SSH_TARGET_CHANGED', 'SSH 身份或固定主机密钥文件已变化'); return t; }
    frozen(id, currentProtocol = false) { const t = this.privateTarget(id); ensure(t.verified && t.verified.configDigest === this.configDigest(t), 'SSH_TARGET_PROBE_REQUIRED', '请先由用户验证 SSH 目标'); if (currentProtocol) {
        ensure(t.gpuProtocol === true && t.verified.gpuProtocol === true, 'SSH_PROTOCOL_UPGRADE_REQUIRED', '新 SSH 启动（含 CPU）需要独立新版监管协议；旧未启动作业保留待取消，请配置新版目标后重新准备批准', 409);
        ensure(t.verified.protocolDigest === digest(readFileSync(join(this.c.repoRoot, 'scripts', 'ssh-runner-gpu.py'))), 'SSH_PROTOCOL_MISMATCH', '新运行必须使用当前已验证监管协议；旧 handle 仅允许原协议对账');
    } return structuredClone(t.verified); }
    assertFrozen(target, currentProtocol = false) { ensure(digest(this.frozen(target.id, currentProtocol)) === digest(target), 'SSH_TARGET_CHANGED', 'SSH 目标与批准的身份不符'); }
    list(actor) { userOnly(actor); return Object.values(this.read()).map(t => t.verified ?? { id: t.id, version: t.version, verified: false }); }
    get(actor, id) { userOnly(actor); return this.frozen(id); }
    async probe(actor, id) { userOnly(actor); return this.verify(id); }
    async verify(id) {
        const saved = this.read()[id];
        ensure(saved, 'SSH_TARGET_NOT_FOUND', 'SSH 目标未配置', 404);
        const configurationDigest = this.configDigest(saved), connections = new ComputeConnectionService(this.c), attempt = connections.begin('ssh:' + id, configurationDigest);
        try {
            const t = this.privateTarget(id), reply = await this.request(t, { op: 'probe' });
            const active = this.c.store.db.prepare("SELECT 1 FROM compute_queue q JOIN records r ON r.kind='run' AND r.id=q.id WHERE q.kind='run' AND q.context_name=? AND q.held=1 AND json_extract(r.data,'$.execution.startRequested')=1 LIMIT 1").get('ssh:' + id);
            const protocolDigest = active && t.verified ? t.verified.protocolDigest : digest(readFileSync(join(this.c.repoRoot, 'scripts', t.gpuProtocol ? 'ssh-runner-gpu.py' : 'ssh-runner.py')));
            ensure(reply.protocolDigest === protocolDigest && typeof reply.engineId === 'string' && /^[A-Za-z0-9._:-]{1,200}$/.test(reply.engineId), 'SSH_PROTOCOL_MISMATCH', '远端监管器或 Linux Docker 引擎身份不符');
            const target = { id: t.id, ...(t.gpuProtocol ? { gpuProtocol: true } : {}), version: t.version, hostKeyDigest: t.hostKeyDigest, configDigest: this.configDigest(t), engineId: reply.engineId, protocolDigest, targetId: 'ssh-' + digest(reply.engineId) };
            this.c.store.transaction(() => { const all = this.read(); ensure(all[id] && this.configDigest(all[id]) === target.configDigest && target.configDigest === configurationDigest && connections.observation('ssh:' + id)?.attempt === attempt, 'SSH_TARGET_CHANGED', '验证期间 SSH 配置或观察发生变化'); all[id].verified = target; this.write(all); connections.finish('ssh:' + id, attempt, { configurationDigest, status: 'verified', targetId: target.targetId }); this.c.store.db.prepare("INSERT INTO compute_contexts(context,target_id,engine_id,endpoint,status,next_probe_at) VALUES(?,?,?,?,'ready',?) ON CONFLICT(context) DO UPDATE SET target_id=excluded.target_id,engine_id=excluded.engine_id,endpoint=excluded.endpoint,status='ready',next_probe_at=excluded.next_probe_at,probe_until=0,failures=0,last_error=NULL").run('ssh:' + id, target.targetId, target.engineId, target.configDigest + ':' + target.protocolDigest, Date.now() + 30000); });
            return target;
        }
        catch (error) {
            const code = error instanceof DomainError && ['SSH_TARGET_CHANGED', 'SSH_PROTOCOL_MISMATCH', 'SSH_PROTOCOL_INVALID', 'SSH_REMOTE_REJECTED'].includes(error.code) ? error.code : 'SSH_TARGET_UNAVAILABLE';
            this.c.store.transaction(() => { const current = this.read()[id]; if (current && this.configDigest(current) === configurationDigest && connections.finish('ssh:' + id, attempt, { configurationDigest, status: 'unavailable', errorCode: code }))
                this.c.store.db.prepare("UPDATE compute_contexts SET status='unavailable',next_probe_at=?,last_error=? WHERE context=?").run(Date.now() + 5000, code, 'ssh:' + id); });
            throw new DomainError(code, '无法核对 SSH 目标；请检查配置后重新核验', 409);
        }
    }
}
//# sourceMappingURL=ssh-targets.js.map