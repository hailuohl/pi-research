import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, chmodSync, existsSync, renameSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readStableFile } from '../workspace/stable-file.js';
import { safePath } from '../workspace/files.js';
import { digest } from '../storage/store.js';
export const JOB_LABEL = 'pi-research.sandbox-job';
export const MANIFEST_LABEL = 'pi-research.manifest';
// Legacy snapshots without modes default to ordinary, non-executable files.
export const BOOTSTRAP = 'cp -R /source/. /work/ && chmod -R u+rwX /work && find /work -type f -exec chmod 644 {} + && exec "$@"';
function sourceBootstrap(job) {
    const executable = job.manifest.inputSnapshot.files.filter(f => f.mode === '100755').map(f => {
        safePath(job.manifest.inputSnapshot.path, f.path);
        return "'/work/" + f.path.replace(/'/g, "'\\''") + "'";
    });
    return executable.length ? BOOTSTRAP.replace(' && exec', ` && chmod 755 -- ${executable.join(' ')} && exec`) : BOOTSTRAP;
}
export function stageInputs(job) {
    if (job.startRequested || job.containerId)
        throw new Error('Cannot modify inputs after container creation');
    const stage = (name, files) => {
        const destination = join(job.controlDir, name);
        if (existsSync(destination)) {
            for (const f of files) {
                const bytes = readStableFile(destination, f.target, f.size);
                if (bytes.length !== f.size || digest(bytes) !== f.digest)
                    throw new Error('Staged input digest mismatch');
            }
            return;
        }
        const temp = join(job.controlDir, `${name}-${randomUUID()}`);
        mkdirSync(temp, { recursive: true, mode: 0o755 });
        chmodSync(temp, 0o755);
        for (const f of files) {
            const bytes = readStableFile(f.root, f.path, f.size);
            if (bytes.length !== f.size || digest(bytes) !== f.digest)
                throw new Error('Input digest mismatch during staging');
            const target = safePath(temp, f.target);
            mkdirSync(dirname(target), { recursive: true, mode: 0o755 });
            for (let dir = dirname(target); dir !== temp; dir = dirname(dir))
                chmodSync(dir, 0o755);
            if (f.mode !== undefined && f.mode !== '100644' && f.mode !== '100755')
                throw new Error('Unsupported source file mode');
            const mode = f.mode === '100755' ? 0o555 : 0o444;
            writeFileSync(target, bytes, { mode, flag: 'wx' });
            chmodSync(target, mode);
        }
        renameSync(temp, destination);
    };
    stage('source', job.manifest.inputSnapshot.files.map(f => ({ ...f, root: job.manifest.inputSnapshot.path, target: f.path })));
    stage('data', job.manifest.dataArtifacts.map(a => ({ ...a, root: dirname(a.path), path: basename(a.path), target: a.id })));
    const bootstrap = join(job.controlDir, 'bootstrap.sh'), script = sourceBootstrap(job);
    if (existsSync(bootstrap)) {
        if (readStableFile(job.controlDir, 'bootstrap.sh', Buffer.byteLength(script)).toString() !== script)
            throw new Error('Sandbox bootstrap mismatch');
    }
    else {
        writeFileSync(bootstrap, script, { mode: 0o444, flag: 'wx' });
        chmodSync(bootstrap, 0o444);
    }
}
export function dockerEnv() {
    return Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
}
export async function docker(context, args, timeout = 10000, limit = 1024 * 1024) {
    return new Promise((resolve, reject) => {
        const child = spawn('docker', ['--context', context, ...args], { shell: false, windowsHide: true, env: dockerEnv(), stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '', stderr = '', bytes = 0, failure;
        const timer = setTimeout(() => { failure = new Error('Docker command timed out; external state is unknown'); child.kill(); }, timeout);
        for (const [stream, isError] of [[child.stdout, false], [child.stderr, true]])
            stream.on('data', (chunk) => {
                bytes += chunk.length;
                if (bytes > limit) {
                    failure = new Error('Docker response exceeded limit');
                    child.kill();
                    return;
                }
                if (isError)
                    stderr += chunk.toString();
                else
                    stdout += chunk.toString();
            });
        child.on('error', error => { clearTimeout(timer); reject(error); });
        child.on('close', code => { clearTimeout(timer); failure ? reject(failure) : code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr || `Docker exited ${code}`)); });
    });
}
export async function preflight(context, image) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(context))
        throw new Error('Explicit Docker context required');
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*@sha256:[a-f0-9]{64}$/.test(image))
        throw new Error('Docker image must be pinned by sha256 digest');
    const contexts = JSON.parse(await docker(context, ['context', 'inspect', context]));
    const endpoint = contexts[0]?.Endpoints?.docker?.Host;
    if (typeof endpoint !== 'string' || !(/^(unix:\/\/\/[^\0\r\n]+|npipe:\/\/\/\/\.\/pipe\/[^\0\r\n]+)$/.test(endpoint)))
        throw new Error('Only local Unix socket or named pipe Docker contexts are permitted');
    if (await docker(context, ['info', '--format', '{{.OSType}}']) !== 'linux')
        throw new Error('Linux containers are required');
    return docker(context, ['image', 'inspect', '--format', '{{.Id}}', image]);
}
/** Read-only local engine identity; context aliases are not independent compute targets. */
export async function probeDockerTarget(context) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(context))
        throw new Error('Explicit Docker context required');
    const configured = JSON.parse(await docker(context, ['context', 'inspect', context])), endpoint = configured[0]?.Endpoints?.docker?.Host;
    if (typeof endpoint !== 'string' || !(/^(unix:\/\/\/[^\0\r\n]+|npipe:\/\/\/\/\.\/pipe\/[^\0\r\n]+)$/.test(endpoint)))
        throw new Error('Only local Docker endpoints are supported');
    const info = JSON.parse(await docker(context, ['info', '--format', '{{json .}}']));
    if (info.OSType !== 'linux' || typeof info.ID !== 'string' || !/^[A-Za-z0-9._:-]{1,200}$/.test(info.ID))
        throw new Error('A Linux Docker engine identity is required');
    return { targetId: 'docker-' + digest(info.ID), engineId: info.ID, endpoint: endpoint.startsWith('npipe:') ? endpoint.toLowerCase() : endpoint };
}
export async function inspect(job) {
    try {
        const value = JSON.parse(await docker(job.manifest.dockerContext, ['inspect', '--type', 'container', job.containerId ?? job.containerName]))[0];
        if (value.Config.Labels?.[JOB_LABEL] !== job.id || value.Config.Labels?.[MANIFEST_LABEL] !== job.manifestDigest || (job.containerId && value.Id !== job.containerId))
            throw new Error('Container ownership mismatch');
        return value;
    }
    catch (error) {
        if (/No such (object|container)/i.test(error.message))
            return null;
        throw error;
    }
}
/** Retire an ambiguous prior start without ever issuing another start request. */
export async function retireUncertainStart(job, fence, run = docker, read = inspect) {
    let container = await read(job);
    fence();
    if (container?.State.Status === 'created') {
        try {
            await run(job.manifest.dockerContext, ['rm', container.Id]);
        }
        catch { /* A concurrent start may have made non-forced removal fail. Inspect again. */ }
        container = await read(job);
        fence();
    }
    if (container?.State.Running) {
        await run(job.manifest.dockerContext, ['kill', container.Id]);
        container = await read(job);
        fence();
    }
    return container;
}
export function createArgs(job) {
    const m = job.manifest, r = m.resources;
    const mount = (path, target, readonly) => {
        if (/[\0\r\n,]/.test(path))
            throw new Error('Unsupported bind mount path');
        return ['--mount', `type=bind,src=${path},dst=${target}${readonly ? ',readonly' : ''}`];
    };
    return ['create', '--pull', 'never', '--name', job.containerName, '--label', `${JOB_LABEL}=${job.id}`, '--label', `${MANIFEST_LABEL}=${job.manifestDigest}`,
        '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--pids-limit', String(r.pids), '--cpus', String(r.cpus), '--memory', `${r.memoryMb}m`, '--memory-swap', `${r.memoryMb}m`, '--user', '65532:65532',
        '--tmpfs', `/work:rw,nosuid,nodev,exec,uid=65532,gid=65532,mode=1777,size=${r.workMb}m`, '--tmpfs', '/tmp:rw,nosuid,nodev,noexec,uid=65532,gid=65532,mode=1777,size=32m',
        ...mount(join(job.controlDir, 'source'), '/source', true), ...mount(join(job.controlDir, 'bootstrap.sh'), '/pi-bootstrap.sh', true), ...m.dataArtifacts.flatMap(a => mount(join(job.controlDir, 'data', a.id), `/data/${a.id}`, true)), ...mount(job.outputDir, '/output', false),
        '--workdir', '/work', '--env', 'PI_OUTPUT_DIR=/output', '--env', 'PYTHONDONTWRITEBYTECODE=1', '--env', 'HOME=/tmp', '--log-driver', 'local', '--log-opt', `max-size=${Math.max(1, Math.ceil(r.logBytes / 1048576))}m`, '--log-opt', 'max-file=1', '--log-opt', 'compress=false',
        '--entrypoint', '/bin/sh', m.environmentImageDigest, '/pi-bootstrap.sh', ...m.command];
}
//# sourceMappingURL=docker.js.map