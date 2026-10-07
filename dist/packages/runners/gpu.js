import { spawn, spawnSync } from 'node:child_process';
import { ensure, DomainError } from '../domain/errors.js';
import { object, text, oneOf } from '../contracts/validation.js';
import { userOnly } from '../policy/permissions.js';
import { docker, dockerEnv, preflight, probeDockerTarget } from '../execution/docker.js';
import { hostIdentity, localEnvironment, LocalRuntimeService } from './local-runtime.js';
import { SshTargetService } from './ssh-targets.js';
import { sshRequest } from './ssh.js';
export function validateGpu(value) {
    const x = object(value);
    ensure(Object.keys(x).every(k => k === 'vendor' || k === 'deviceIds') && x.vendor === 'nvidia' && Array.isArray(x.deviceIds) && x.deviceIds.length > 0 && x.deviceIds.length <= 16, 'GPU_INVALID', 'GPU 必须声明 NVIDIA 完整 UUID 列表', 400);
    const ids = x.deviceIds.map(id => text(id, 'GPU UUID', 80));
    ensure(ids.every(id => /^GPU-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) && new Set(ids).size === ids.length, 'GPU_INVALID', 'GPU UUID 必须完整、小写且不重复，不能使用索引或 all', 400);
    return { vendor: 'nvidia', deviceIds: ids };
}
export function parseGpuInventory(stdout) {
    ensure(typeof stdout === 'string' && stdout.length <= 65536, 'GPU_PROBE_INVALID', 'GPU 探测响应无效');
    const devices = stdout.trim().split(/\r?\n/).filter(Boolean).map(line => { const [uuid, name, memory, ...extra] = line.split(',').map(s => s.trim()); ensure(!extra.length && /^GPU-[0-9a-f-]{36}$/.test(uuid) && name && Number.isFinite(Number(memory)) && Number(memory) > 0, 'GPU_PROBE_INVALID', 'GPU 探测响应无效'); validateGpu({ vendor: 'nvidia', deviceIds: [uuid] }); return { uuid, name, memoryMb: Number(memory) }; });
    ensure(new Set(devices.map(d => d.uuid)).size === devices.length, 'GPU_PROBE_INVALID', 'GPU 身份重复');
    return devices;
}
export async function nativeGpuInventory() {
    ensure(process.platform !== 'darwin', 'GPU_UNAVAILABLE', 'macOS 本地 NVIDIA CUDA 不可用', 409);
    const stdout = await new Promise((resolve, reject) => { const child = spawn('nvidia-smi', ['--query-gpu=uuid,name,memory.total', '--format=csv,noheader,nounits'], { windowsHide: true, shell: false, env: localEnvironment(process.cwd(), process.cwd()), stdio: ['ignore', 'pipe', 'pipe'] }); let data = ''; const fail = () => reject(new DomainError('GPU_UNAVAILABLE', '无法核对 NVIDIA 驱动与设备', 409)); const timer = setTimeout(() => child.kill(), 10000); child.stdout.on('data', b => { data += b; if (data.length > 65536)
        child.kill(); }); child.stderr.resume(); child.on('error', fail); child.on('close', code => { clearTimeout(timer); code === 0 && data.length <= 65536 ? resolve(data) : fail(); }); });
    return parseGpuInventory(stdout);
}
export function assertGpuDevices(request, devices) { ensure(request.deviceIds.every(id => devices.some(d => d.uuid === id)), 'GPU_UNAVAILABLE', '批准的 GPU 不存在于当前目标；不会改用其他设备或 CPU', 409); }
export function currentDockerContext() { const result = spawnSync('docker', ['context', 'show'], { encoding: 'utf8', timeout: 10000, maxBuffer: 65536, windowsHide: true, env: dockerEnv() }); ensure(result.status === 0, 'COMPUTE_TARGET_UNAVAILABLE', '无法读取当前 Docker context', 409); const context = result.stdout.trim(); ensure(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(context), 'COMPUTE_TARGET_UNAVAILABLE', '当前 Docker context 无效', 409); return context; }
export class GpuService {
    c;
    constructor(c) {
        this.c = c;
    }
    list() { return this.c.store.db.prepare("SELECT data FROM records WHERE kind='gpu-target'").all().map(r => JSON.parse(String(r.data)).target); }
    saved(contract) {
        const target = this.list().find(t => t.backend === contract.runner && (t.backend === 'local' ? t.targetId === hostIdentity() : t.backend === 'docker' ? t.context === (contract.dockerContext ?? 'default') : t.sshTargetId === contract.sshTargetId));
        ensure(target, 'GPU_PROBE_REQUIRED', '请先核对所选目标的 NVIDIA 设备', 409);
        assertGpuDevices(contract.gpu, target.devices);
        return target;
    }
    async probe(actor, value) {
        userOnly(actor);
        const x = object(value), backend = oneOf(x.backend, ['local', 'docker', 'ssh'], 'backend');
        let target;
        ensure(backend === 'local' ? x.context === undefined && x.sshTargetId === undefined && x.image === undefined : backend === 'docker' ? x.sshTargetId === undefined && x.localRuntimeId === undefined : x.context === undefined && x.localRuntimeId === undefined, 'GPU_PROBE_INVALID', 'GPU 目标参数与后端不符', 400);
        if (backend === 'local') {
            const runtimes = new LocalRuntimeService(this.c), id = x.localRuntimeId === undefined ? runtimes.list().find(r => /^Python\s/i.test(r.runtimeVersion))?.id : text(x.localRuntimeId, 'localRuntimeId', 80);
            ensure(id, 'GPU_RUNTIME_UNAVAILABLE', '请先配置已有 Python 运行时用于 NVIDIA 验证', 409);
            const runtime = runtimes.resolve(id);
            ensure(/^Python\s/i.test(runtime.runtimeVersion), 'GPU_RUNTIME_UNAVAILABLE', 'NVIDIA 验证需要已配置的 Python 运行时', 409);
            const check = spawnSync(runtime.executable, ['-I', '-c', "import ctypes,os; d=ctypes.WinDLL('nvcuda.dll') if os.name=='nt' else ctypes.CDLL('libcuda.so.1'); assert d.cuInit(0)==0; n=ctypes.c_int(); assert d.cuDeviceGetCount(ctypes.byref(n))==0 and n.value>0"], { windowsHide: true, timeout: 10000, maxBuffer: 65536, env: { ...localEnvironment(this.c.dataDir, this.c.dataDir), CUDA_VISIBLE_DEVICES: undefined } });
            ensure(check.status === 0, 'GPU_RUNTIME_UNAVAILABLE', '所选 Python 无法访问 NVIDIA CUDA Driver；不自动安装或切回 CPU', 409);
            target = { backend, targetId: hostIdentity(), localRuntimeId: id, observedAt: new Date().toISOString(), devices: await nativeGpuInventory() };
        }
        else if (backend === 'docker') {
            const context = text(x.context ?? currentDockerContext(), 'context', 100), image = text(x.image, 'image', 250);
            await preflight(context, image);
            const identity = await probeDockerTarget(context);
            const output = await docker(context, ['run', '--rm', '--pull', 'never', '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--gpus', 'all', '--env', 'NVIDIA_DRIVER_CAPABILITIES=compute,utility', '--entrypoint', 'nvidia-smi', image, '--query-gpu=uuid,name,memory.total', '--format=csv,noheader,nounits'], 30000);
            const after = await probeDockerTarget(context);
            ensure(after.engineId === identity.engineId && after.endpoint === identity.endpoint, 'COMPUTE_TARGET_CHANGED', 'GPU 探测期间目标变化');
            target = { backend, targetId: identity.targetId, context, observedAt: new Date().toISOString(), devices: parseGpuInventory(output) };
        }
        else {
            const targets = new SshTargetService(this.c), id = text(x.sshTargetId, 'sshTargetId', 80), frozen = targets.frozen(id, true);
            ensure(frozen.gpuProtocol === true, 'GPU_UNAVAILABLE', '此 SSH 目标尚未配置独立 GPU 协议');
            const result = await sshRequest(targets.privateTarget(id), { op: 'gpu-probe', image: text(x.image, 'image', 250) });
            targets.assertFrozen(frozen);
            ensure(result.engineId === frozen.engineId && result.protocolDigest === frozen.protocolDigest, 'SSH_TARGET_CHANGED', 'GPU 探测回复目标与固定身份不符');
            target = { backend, targetId: frozen.targetId, sshTargetId: id, observedAt: new Date().toISOString(), devices: parseGpuInventory(result.inventory) };
        }
        const id = target.backend + ':' + (target.context ?? target.sshTargetId ?? target.targetId);
        this.c.store.transaction(() => { const old = this.c.store.maybe('gpu-target', id); if (old)
            this.c.store.update('gpu-target', id, old.version, { target });
        else
            this.c.store.create('gpu-target', null, { target }, id); });
        return target;
    }
}
//# sourceMappingURL=gpu.js.map