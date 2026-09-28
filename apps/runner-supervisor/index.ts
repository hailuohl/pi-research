import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { Store, now } from '../../packages/storage/store.js';
import { RunService } from '../../packages/runners/service.js';
import { EvidenceService } from '../../packages/evidence/service.js';
import { ApprovalService } from '../../packages/policy/approvals.js';
import type { Run } from '../../packages/domain/types.js';
import { verifySnapshot } from '../../packages/workspace/files.js';
import { verifyTrustedExample } from '../../packages/runners/contracts.js';
const [dataDir, repoRoot, runId] = process.argv.slice(2);
if (!dataDir || !repoRoot || !runId)
    throw new Error('Usage: supervisor DATA REPO RUN');
const store = new Store(join(dataDir, 'state.db')), ctx = { dataDir, repoRoot, store };
const service = new RunService(ctx, new ApprovalService(ctx), new EvidenceService(ctx));
const run = store.transaction(() => {
    const r = store.get<Run>('run', runId);
    if (r.state !== 'queued' || r.startedAt || r.childPid) return null;
    try { service.assertLaunchable(r); }
    catch (error) { service.cancelBeforeLaunch(r, error); return null; }
    if (store.list<Run>('run').some(x => x.id !== runId && ['submitting', 'running', 'cancelling', 'unknown'].includes(x.state)))
        return null;
    return store.update<Run>('run', r.id, r.version, { state: 'submitting', supervisorPid: process.pid, heartbeat: Date.now(), startedAt: now() });
});
if (!run) {
    store.close();
    process.exit(0);
}
const controlDir = join(dataDir, 'jobs', runId, 'control');
mkdirSync(controlDir, { recursive: true, mode: 0o700 });
let done = false, observedCancel = false, timedOut = false;
let timer: NodeJS.Timeout | undefined;
let timeout: NodeJS.Timeout | undefined;
let forceKill: NodeJS.Timeout | undefined;
const finish = (code: number | null, state: 'succeeded' | 'failed' | 'cancelled', error?: string) => {
    if (done)
        return;
    done = true;
    if (timer)
        clearInterval(timer);
    if (timeout)
        clearTimeout(timeout);
    if (forceKill)
        clearTimeout(forceKill);
    const receipt = { manifestDigest: run.manifestDigest, exitCode: code, state, ...(error ? { error } : {}) };
    writeFileSync(join(controlDir, 'terminal.tmp'), JSON.stringify(receipt), { mode: 0o600 });
    renameSync(join(controlDir, 'terminal.tmp'), join(controlDir, 'terminal.json'));
    try {
        service.finalize(runId, code, state, error);
    }
    finally {
        store.close();
    }
};
try {
    verifySnapshot(run.manifest.snapshotPath, run.manifest.sourceFiles);
    verifyTrustedExample(run.manifest, repoRoot);
    const contract = run.manifest.contract;
    const containerName = 'pi-research-' + runId;
    let command: string, args: string[];
    if (contract.runner === 'trusted-example') {
        command = process.execPath;
        args = [join(run.manifest.snapshotPath, 'experiment.mjs')];
    }
    else {
        command = 'docker';
        args = ['run', '--rm', '--name', containerName, '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--pids-limit', '128', '--cpus', String(contract.cpus), '--memory', contract.memoryMb + 'm', '--tmpfs', '/tmp:rw,nosuid,nodev,size=128m', '--mount', `type=bind,src=${run.manifest.snapshotPath},dst=/work,readonly`, '--mount', `type=bind,src=${run.outputDir},dst=/output`, '--workdir', '/work', '--env', 'PI_OUTPUT_DIR=/output', contract.image!, ...contract.command];
    }
    const log = createWriteStream(join(run.outputDir, 'stdout.log'), { flags: 'a', mode: 0o600 });
    const child = spawn(command, args, { cwd: run.manifest.snapshotPath, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH ?? '', SystemRoot: process.env.SystemRoot ?? '', HOME: controlDir, PI_OUTPUT_DIR: run.outputDir }, windowsHide: true });
    let logBytes = 0;
    const write = (chunk: Buffer) => {
        logBytes += chunk.length;
        if (logBytes <= 16 * 1024 * 1024)
            log.write(chunk);
        else
            stop(false);
    };
    child.stdout?.on('data', write);
    child.stderr?.on('data', write);
    const stop = (cancelled: boolean) => {
        observedCancel = observedCancel || cancelled;
        const kill = (signal: NodeJS.Signals) => {
            if (contract.runner === 'docker')
                spawnSync('docker', ['kill', '--signal', signal, containerName], { timeout: 3000, stdio: 'ignore' });
            else {
                try {
                    if (process.platform !== 'win32' && child.pid)
                        process.kill(-child.pid, signal);
                    else
                        child.kill(signal);
                }
                catch { }
            }
        };
        kill('SIGTERM');
        forceKill = setTimeout(() => kill('SIGKILL'), 1500);
    };
    store.transaction(() => {
        const current = store.get<Run>('run', runId);
        store.update<Run>('run', runId, current.version, { state: current.cancelRequested ? 'cancelling' : 'running', childPid: child.pid, heartbeat: Date.now() });
    });
    timer = setInterval(() => {
        const r = service.heartbeat(runId);
        if (r.cancelRequested && !observedCancel)
            stop(true);
    }, 100);
    timeout = setTimeout(() => { timedOut = true; stop(false); }, contract.timeoutSeconds * 1000);
    child.on('error', e => { log.end(() => finish(null, 'failed', e.message)); });
    child.on('close', (code, signal) => { log.end(() => { const state = code === 0 ? 'succeeded' : observedCancel ? 'cancelled' : 'failed'; finish(code, state, timedOut ? '执行超时' : code === 0 ? undefined : `进程退出：${code ?? signal}`); }); });
}
catch (e) {
    finish(null, 'failed', (e as Error).message);
}
