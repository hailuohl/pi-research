import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { ResearchApp } from '../../packages/research-app.js';
import { physicalDockerJob, docker, dockerEnv, inspect as inspectDocker, preflight, createArgs, stageInputs, retireUncertainStart } from '../../packages/execution/docker.js';
import { LEASE_MS } from '../../packages/execution/service.js';
import { SANDBOX_TERMINAL } from '../../packages/execution/contracts.js';
const [dataDir, repoRoot, jobId, rawGeneration] = process.argv.slice(2);
if (!dataDir || !repoRoot || !jobId || !rawGeneration)
    throw new Error('Usage: execution-worker DATA REPO JOB GENERATION');
const generation = Number(rawGeneration), app = new ResearchApp(dataDir, repoRoot), store = app.store;
let logger, logClosed, logError, truncated = false, bytes = 0, lostLease = false;
let externalPossible = true;
let incomplete = false, diagnosticWritten = false;
let attachResult;
const current = () => {
    const j = store.get('sandbox-job', jobId);
    if (j.generation !== generation || SANDBOX_TERMINAL.includes(j.state) || j.leaseUntil < Date.now()) {
        lostLease = true;
        throw new Error('Worker lease lost');
    }
    return j;
};
const patch = (value) => store.transaction(() => { const j = current(); return store.update('sandbox-job', j.id, j.version, value); });
const renew = () => patch({ leaseUntil: Date.now() + LEASE_MS, workerPid: process.pid });
async function checked(fn) { await app.compute.verifyTarget('development', jobId); current(); const result = await fn(); await app.compute.verifyTarget('development', jobId); current(); return result; }
async function inspect(job) { return checked(() => inspectDocker(physicalDockerJob(job, store.paths))); }
function initializeLogs() {
    const job = current();
    mkdirSync(store.paths.physical(job.controlDir), { recursive: true, mode: 0o700 });
    for (const name of ['stdout.log', 'stderr.log']) {
        const path = join(store.paths.physical(job.controlDir), name);
        if (!existsSync(path))
            writeFileSync(path, '', { mode: 0o600, flag: 'wx' });
    }
}
function diagnostic(error) {
    const job = current();
    initializeLogs();
    const code = job.startRequested ? 'EXECUTION_FAILED' : 'PREFLIGHT_FAILED';
    const available = Math.max(0, job.manifest.resources.logBytes - lstatSync(join(store.paths.physical(job.controlDir), 'stdout.log')).size - lstatSync(join(store.paths.physical(job.controlDir), 'stderr.log')).size);
    const message = Buffer.from(`${code}\n`);
    appendFileSync(join(store.paths.physical(job.controlDir), 'stderr.log'), message.subarray(0, available));
    bytes += Math.min(available, message.length);
    if (available < message.length)
        truncated = true;
    writeFileSync(join(store.paths.physical(job.controlDir), 'diagnostic.log'), Buffer.from(String(error instanceof Error ? error.stack ?? error.message : error)).subarray(0, 65536), { mode: 0o600 });
    diagnosticWritten = true;
}
const timer = setInterval(() => { try {
    renew();
}
catch {
    lostLease = true;
    logger?.kill();
} }, 3000);
function outputSize(path) {
    let size = 0, count = 0;
    const pending = [path];
    try {
        while (pending.length)
            for (const e of readdirSync(pending.pop(), { withFileTypes: true })) {
                if (++count > 10000)
                    return Infinity;
                const p = join(e.parentPath, e.name), s = lstatSync(p);
                if (s.isSymbolicLink())
                    continue;
                if (s.isDirectory())
                    pending.push(p);
                else
                    size += s.size;
            }
    }
    catch {
        return Infinity;
    }
    return size;
}
async function stopOwned() {
    const job = current(), container = await inspect(job);
    current();
    if (container?.State.Running)
        await checked(() => docker(job.manifest.dockerContext, ['kill', container.Id]));
}
function collectLogs(start = false) {
    const job = current();
    initializeLogs();
    bytes = 0;
    // A recovered worker cannot prove an uninterrupted log stream; finalize marks it incomplete.
    for (const name of ['stdout.log', 'stderr.log']) {
        const path = join(store.paths.physical(job.controlDir), name);
        if (existsSync(path))
            bytes += lstatSync(path).size;
        else
            writeFileSync(path, '', { mode: 0o600 });
    }
    logger = spawn('docker', ['--context', job.manifest.dockerContext, ...(start ? ['start', '--attach'] : ['logs', '--follow']), job.containerId], { shell: false, windowsHide: true, env: dockerEnv(), stdio: ['ignore', 'pipe', 'pipe'] });
    for (const [stream, name] of [[logger.stdout, 'stdout.log'], [logger.stderr, 'stderr.log']])
        stream.on('data', (chunk) => {
            try {
                current();
            }
            catch {
                return;
            }
            const remaining = Math.max(0, job.manifest.resources.logBytes - bytes);
            if (chunk.length > remaining)
                truncated = true;
            bytes += chunk.length;
            try {
                if (remaining)
                    appendFileSync(join(store.paths.physical(job.controlDir), name), chunk.subarray(0, remaining));
            }
            catch (error) {
                logError = error.message;
            }
        });
    logClosed = new Promise(resolve => {
        logger.on('error', error => { logError = error.message; resolve(); });
        logger.on('close', (code, signal) => { if (start)
            attachResult = { code, signal };
        else if (code !== 0)
            logError ??= `Docker logs exited ${code}`; resolve(); });
    });
}
async function finish(state, exitCode, error) {
    if (logClosed) {
        const drained = await Promise.race([logClosed.then(() => true), pause(5000).then(() => false)]);
        if (!drained) {
            logError ??= 'Log stream did not finish';
            logger?.kill();
            await logClosed;
        }
    }
    const job = current();
    if (exitCode === 0 && attachResult && (attachResult.code !== 0 || attachResult.signal))
        logError ??= 'Docker attach stream ended abnormally';
    if ((error || logError) && !diagnosticWritten)
        diagnostic(error ?? logError);
    if (state === 'succeeded' && (truncated || logError || job.recoveryCount > 0))
        state = 'failed';
    app.development.finalize(jobId, { state, exitCode, error: error ?? logError, logTruncated: truncated, recovered: job.recoveryCount > 0 || Boolean(logError), incomplete, generation });
}
try {
    let job = renew();
    initializeLogs();
    externalPossible = Boolean(job.startRequested || job.containerId || job.recoveryCount > 0);
    if (job.cancelRequested)
        throw new Error('Cancellation requested before preparation');
    const imageId = await checked(() => preflight(job.manifest.dockerContext, job.manifest.environmentImageDigest));
    job = current();
    if (job.cancelRequested)
        throw new Error('Cancellation requested before container creation');
    let container = await inspect(job);
    if (!container) {
        if (job.startRequested || job.containerId) {
            incomplete = true;
            throw new Error('Previously owned container is confirmed missing; execution evidence incomplete');
        }
        app.development.assertCurrent(current());
        job = patch({ imageId });
        stageInputs(physicalDockerJob(job, store.paths));
        job = current();
        if (job.cancelRequested)
            throw new Error('Cancellation requested before container creation');
        externalPossible = true;
        try {
            await checked(() => docker(job.manifest.dockerContext, createArgs(physicalDockerJob(job, store.paths))));
        }
        catch (error) {
            container = await inspect(current());
            if (!container)
                throw error;
        }
        container ??= await inspect(current());
        if (!container)
            throw new Error('Created container cannot be observed');
    }
    if (container.Image !== imageId)
        throw new Error('Container image identity mismatch');
    job = patch({ containerId: container.Id, imageId });
    if (container.State.Status === 'created') {
        if (job.startRequested)
            throw new Error('Prior start request has an unknown outcome; refusing to restart');
        if (job.cancelRequested) {
            await finish('cancelled', null, 'Cancelled before container start');
        }
        else {
            job = store.transaction(() => {
                const latest = current();
                if (latest.cancelRequested)
                    throw new Error('Cancellation requested before container start');
                app.development.assertCurrent(latest);
                return patch({ startRequested: true, startedAt: new Date().toISOString() });
            });
            await checked(async () => collectLogs(true));
        }
    }
    else if (!job.startRequested)
        throw new Error('Container ran without persisted start authorization');
    if (!SANDBOX_TERMINAL.includes(store.get('sandbox-job', jobId).state)) {
        if (!logger)
            await checked(async () => collectLogs());
        let stopping, reason;
        while (true) {
            job = current();
            container = await inspect(job);
            if (!container) {
                incomplete = true;
                throw new Error('Owned container is confirmed missing during monitoring');
            }
            if (container.State.Status === 'exited' || container.State.Status === 'dead') {
                if (outputSize(store.paths.physical(job.outputDir)) > job.manifest.resources.outputBytes) {
                    incomplete = true;
                    stopping = 'failed';
                    reason = 'Sandbox output limit exceeded';
                }
                await finish(stopping ?? (container.State.ExitCode === 0 ? 'succeeded' : 'failed'), container.State.ExitCode, reason ?? (container.State.Error || undefined));
                break;
            }
            if (container.State.Status === 'created' && Date.now() - Date.parse(job.startedAt) < 10000) {
                await pause(100);
                continue;
            }
            if (!container.State.Running)
                throw new Error(`Uncertain container state: ${container.State.Status}`);
            if (job.state !== 'running')
                job = patch({ state: 'running' });
            if (job.cancelRequested) {
                stopping = 'cancelled';
                reason = 'Cancellation requested';
            }
            else if (Date.now() >= Math.min(Date.parse(job.manifest.deadline), Date.parse(job.startedAt ?? container.State.StartedAt) + job.manifest.resources.timeoutSeconds * 1000)) {
                stopping = 'timed_out';
                reason = 'Sandbox deadline or timeout exceeded';
            }
            else if (truncated || logError) {
                stopping = 'failed';
                reason = logError ?? 'Sandbox log limit exceeded';
            }
            else if (outputSize(store.paths.physical(job.outputDir)) > job.manifest.resources.outputBytes) {
                incomplete = true;
                stopping = 'failed';
                reason = 'Sandbox output limit exceeded';
            }
            else {
                try {
                    app.development.assertCurrent(job, false);
                }
                catch (error) {
                    stopping = 'failed';
                    reason = error.message;
                }
            }
            if (stopping)
                await stopOwned();
            await pause(250);
        }
    }
}
catch (error) {
    if (!lostLease) {
        try {
            const job = current();
            diagnostic(error);
            let stopped = !externalPossible, exitCode = null;
            if (externalPossible) {
                let observed = await inspect(job);
                if (observed?.State.Status === 'created' && job.startRequested) {
                    incomplete = true;
                    observed = await retireUncertainStart(physicalDockerJob(job, store.paths), current, (context, args) => checked(() => docker(context, args)), () => inspect(job));
                }
                if (observed?.State.Running) {
                    await stopOwned();
                    observed = await inspect(current());
                }
                stopped = observed ? ['exited', 'dead'].includes(observed.State.Status) || (observed.State.Status === 'created' && !job.startRequested) : true;
                if (!observed && (job.startRequested || job.containerId))
                    incomplete = true;
                if (observed?.State.Status === 'exited' || observed?.State.Status === 'dead')
                    exitCode = observed.State.ExitCode;
            }
            if (stopped)
                await finish(job.cancelRequested ? 'cancelled' : 'failed', exitCode, error.message);
            else
                patch({ state: 'unknown', integrity: 'incomplete', error: error.message, leaseUntil: 0 });
        }
        catch (recoveryError) {
            if (!lostLease)
                patch({ state: 'unknown', integrity: 'incomplete', error: `${error.message}; recovery/finalize: ${recoveryError.message}`, leaseUntil: 0 });
        }
    }
}
finally {
    clearInterval(timer);
    logger?.kill();
    await app.compute.stop();
    store.close();
}
//# sourceMappingURL=index.js.map