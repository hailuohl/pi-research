import { spawn } from 'node:child_process';
import { chmodSync, mkdirSync, lstatSync, readdirSync } from 'node:fs';
import { createArgs, physicalDockerJob, docker, dockerEnv, inspect, preflight, retireUncertainStart, stageInputs } from '../execution/docker.js';
import { safePath } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
export function formalDockerJob(run) {
    const c = run.manifest.contract;
    if (c.runner !== 'docker' || !c.image)
        throw new Error('Formal Docker adapter requires a pinned Docker contract');
    return { id: run.id, manifestDigest: run.manifestDigest, containerName: run.execution.containerName, containerId: run.execution.containerId, startRequested: run.execution.startRequested, outputDir: run.outputDir, controlDir: run.execution.controlDir,
        manifest: { inputSnapshot: { path: run.manifest.snapshotPath, digest: run.manifest.snapshotDigest, files: run.manifest.sourceFiles }, dataArtifacts: run.manifest.dataArtifacts ?? [], command: c.command, environmentImageDigest: c.image, dockerContext: run.execution.dockerContext,
            resources: { cpus: c.cpus, memoryMb: c.memoryMb, pids: c.pids ?? 512, workMb: c.workMb ?? 1024, logBytes: c.logBytes ?? 16 * 1024 * 1024 } } };
}
export class DockerAdapter {
    run;
    fence;
    verifyTarget;
    capabilities = { backend: 'docker', isolated: true, recoverable: true };
    job;
    imageId;
    constructor(run, fence, verifyTarget, paths) {
        this.run = run;
        this.fence = fence;
        this.verifyTarget = verifyTarget;
        const job = formalDockerJob(run);
        this.job = paths ? physicalDockerJob(job, paths) : job;
        this.imageId = run.execution.imageId;
    }
    async guarded(fn) { await this.verifyTarget?.(); this.fence(); const result = await fn(); await this.verifyTarget?.(); this.fence(); return result; }
    async preflight() { this.imageId = await this.guarded(() => preflight(this.job.manifest.dockerContext, this.job.manifest.environmentImageDigest)); }
    async stage() {
        this.fence();
        mkdirSync(this.job.outputDir, { recursive: true, mode: 0o777 });
        chmodSync(this.job.outputDir, 0o777);
        mkdirSync(this.job.controlDir, { recursive: true, mode: 0o700 });
        stageInputs(this.job);
    }
    async inspect() { return this.guarded(() => inspect(this.job)); }
    /** Create-or-adopt only. Starting requires a separately persisted startRequested fence. */
    async submit() {
        let container = await this.inspect();
        if (!container) {
            if (this.job.startRequested || this.job.containerId)
                throw new Error('Formal run container is confirmed missing; never resubmit');
            if (!this.imageId)
                throw new Error('Docker preflight is required before submission');
            this.fence();
            try {
                await this.guarded(() => docker(this.job.manifest.dockerContext, createArgs(this.job)));
            }
            catch (error) {
                container = await this.inspect();
                if (!container)
                    throw error;
            }
            container ??= await this.inspect();
            if (!container)
                throw new Error('Created formal run container cannot be observed');
        }
        if (this.imageId && container.Image !== this.imageId)
            throw new Error('Formal run container image identity mismatch');
        this.job.containerId = container.Id;
        return container;
    }
    async capture(args, onLog) {
        await this.verifyTarget?.();
        this.fence();
        const child = spawn('docker', ['--context', this.job.manifest.dockerContext, ...args, this.job.containerId], { shell: false, windowsHide: true, env: dockerEnv(), stdio: ['ignore', 'pipe', 'pipe'] });
        const completion = new Promise(resolve => {
            let error;
            child.stdout.on('data', (chunk) => { try {
                this.fence();
                onLog('stdout', chunk);
            }
            catch (e) {
                error = e.message;
                child.kill();
            } });
            child.stderr.on('data', (chunk) => { try {
                this.fence();
                onLog('stderr', chunk);
            }
            catch (e) {
                error = e.message;
                child.kill();
            } });
            child.on('error', e => { error = e.message; });
            child.on('close', (exitCode, signal) => resolve({ exitCode, signal, ...(error ? { error } : {}) }));
        });
        try {
            await this.verifyTarget?.();
            this.fence();
        }
        catch (error) {
            child.kill();
            await completion;
            throw error;
        }
        return { pid: child.pid, completion, cancel: async () => { await this.cancel(); }, detach: async () => { child.kill(); } };
    }
    async start(onLog) {
        if (!this.job.startRequested)
            throw new Error('Start intent must be persisted before Docker start');
        const container = await this.inspect();
        if (!container || container.State.Status !== 'created')
            throw new Error('Formal run container is not in the one-time start state');
        return this.capture(['start', '--attach'], onLog);
    }
    async readLogs(onLog) {
        const container = await this.inspect();
        if (!container)
            throw new Error('Formal run container is missing during log recovery');
        return this.capture(['logs', '--follow'], onLog);
    }
    async cancel() {
        const container = await this.inspect();
        if (container?.State.Status === 'created')
            return this.retireStart();
        if (container?.State.Running)
            await this.guarded(() => docker(this.job.manifest.dockerContext, ['kill', container.Id]));
        return this.inspect();
    }
    async reconcile() {
        const container = await this.inspect();
        if (container?.State.Status === 'created' && this.job.startRequested)
            return this.retireStart();
        return container;
    }
    retireStart() { return retireUncertainStart(this.job, this.fence, (context, args) => this.guarded(() => docker(context, args)), () => this.inspect()); }
    /** Validate stopped output without granting it evidence authority; RunService archives it. */
    async collect() {
        const container = await this.inspect();
        if (container && !['exited', 'dead'].includes(container.State.Status))
            throw new Error('Cannot collect a formal run before confirmed exit');
        const errors = [], expected = new Set(this.run.manifest.contract.expectedArtifacts), max = this.run.manifest.contract.outputBytes ?? 128 * 1024 * 1024;
        let bytes = 0, count = 0, outputExceeded = false;
        const walk = (relative, depth) => {
            if (depth > 32)
                throw new Error('Formal output depth limit exceeded');
            for (const entry of readdirSync(safePath(this.job.outputDir, relative, true), { withFileTypes: true })) {
                if (++count > 5000)
                    throw new Error('Formal output count limit exceeded');
                const path = relative ? `${relative}/${entry.name}` : entry.name;
                if (entry.isSymbolicLink())
                    throw new Error('Formal output cannot contain symlinks');
                if (entry.isDirectory()) {
                    walk(path, depth + 1);
                    continue;
                }
                const full = safePath(this.job.outputDir, path), stat = lstatSync(full);
                if (!stat.isFile())
                    throw new Error('Formal output must be a regular file');
                bytes += stat.size;
                if (bytes > max) {
                    outputExceeded = true;
                    throw new Error('Formal output byte limit exceeded');
                }
                readStableFile(this.job.outputDir, path, Math.min(max, 32 * 1024 * 1024));
                expected.delete(path);
            }
        };
        try {
            walk('', 0);
        }
        catch (error) {
            errors.push(error.message);
        }
        for (const path of expected)
            errors.push(`Missing expected formal artifact: ${path}`);
        return { incomplete: !container || errors.length > 0, outputExceeded, errors };
    }
}
//# sourceMappingURL=docker.js.map