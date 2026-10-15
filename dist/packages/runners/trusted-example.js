import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { verifySnapshot } from '../workspace/files.js';
import { verifyTrustedExample } from './contracts.js';
/** This host backend runs only the bundled, hash-verified numerical example. */
export class TrustedExampleAdapter {
    run;
    repoRoot;
    paths;
    capabilities = { backend: 'trusted-example', isolated: false, recoverable: false };
    started = false;
    controlDir;
    snapshotDir;
    outputDir;
    constructor(run, repoRoot, paths) {
        this.run = run;
        this.repoRoot = repoRoot;
        this.paths = paths;
        this.outputDir = paths ? paths.physical(run.outputDir) : run.outputDir;
        this.snapshotDir = paths ? paths.physical(run.manifest.snapshotPath) : run.manifest.snapshotPath;
        this.controlDir = join(dirname(this.outputDir), 'control');
    }
    async preflight() {
        ensure(this.run.manifest.contract.runner === 'trusted-example', 'UNTRUSTED_HOST_EXECUTION', '可信示例适配器不能执行其他运行器', 403);
        verifyTrustedExample(this.run.manifest, this.repoRoot, this.paths);
        ensure(digest(this.run.manifest) === this.run.manifestDigest && digest(this.run.manifest.contract) === this.run.manifest.contractDigest && digest(this.run.manifest.sourceFiles) === this.run.manifest.snapshotDigest, 'MANIFEST_CORRUPTED', '运行清单摘要不一致');
        verifySnapshot(this.snapshotDir, this.run.manifest.sourceFiles);
    }
    async stage() { mkdirSync(this.controlDir, { recursive: true, mode: 0o700 }); mkdirSync(this.outputDir, { recursive: true, mode: 0o700 }); }
    async start(onLog) {
        await this.preflight();
        await this.stage();
        ensure(!this.started, 'RUN_ALREADY_STARTED', '同一适配器不能重复启动宿主进程');
        this.started = true;
        const child = spawn(process.execPath, [join(this.snapshotDir, 'experiment.mjs')], {
            cwd: this.snapshotDir, detached: process.platform !== 'win32', shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
            env: { PATH: process.env.PATH ?? '', SystemRoot: process.env.SystemRoot ?? '', HOME: this.controlDir, PI_OUTPUT_DIR: this.outputDir },
        });
        let closed = false, error, forceKill;
        const kill = (signal) => { if (closed)
            return; try {
            if (process.platform !== 'win32' && child.pid)
                process.kill(-child.pid, signal);
            else
                child.kill(signal);
        }
        catch { /* A process that exited between inspection and signal needs no further signal. */ } };
        const stop = () => { if (closed || forceKill)
            return; kill('SIGTERM'); forceKill = setTimeout(() => kill('SIGKILL'), 1500); };
        const completion = new Promise(resolve => {
            child.once('error', e => { error = e.message; });
            child.once('close', (exitCode, signal) => { closed = true; if (forceKill)
                clearTimeout(forceKill); resolve({ exitCode, signal, ...(error ? { error } : {}) }); });
        });
        for (const [stream, name] of [[child.stdout, 'stdout'], [child.stderr, 'stderr']])
            stream.on('data', (chunk) => { try {
                onLog(name, chunk);
            }
            catch (e) {
                error = e.message;
                stop();
            } });
        return { pid: child.pid, completion, cancel: async () => { stop(); await completion; } };
    }
}
//# sourceMappingURL=trusted-example.js.map