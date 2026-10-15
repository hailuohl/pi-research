import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, writeFileSync, lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { ResearchApp } from '../../packages/research-app.js';
import { physicalDockerJob, docker, dockerEnv, createArgs, stageInputs, inspect as inspectDocker, retireUncertainStart } from '../../packages/execution/docker.js';
import { verifyCompilerImage } from '../../packages/publications/build-service.js';
import { PUBLICATION_TERMINAL } from '../../packages/publications/build-types.js';
const [dataDir, repoRoot, id, generationText] = process.argv.slice(2);
if (!dataDir || !repoRoot || !id || !generationText)
    throw Error('Usage: publication-worker DATA REPO JOB GENERATION');
const generation = Number(generationText), app = new ResearchApp(dataDir, repoRoot), store = app.store;
let lost = false, logger, closed, logError = false, truncated = false, bytes = 0, attachCode, attachSignal, incomplete = false, externalPossible = true;
const current = () => { const j = store.get('publication-build-job', id); if (j.generation !== generation || j.leaseUntil <= Date.now() || PUBLICATION_TERMINAL.includes(j.state)) {
    lost = true;
    throw Error('PUBLICATION_LEASE_EXPIRED');
} return j; };
const patch = (value) => store.transaction(() => { const j = current(); return store.update('publication-build-job', id, j.version, value); });
const checked = async (fn) => { await app.compute.verifyTarget('publication', id); current(); const result = await fn(); await app.compute.verifyTarget('publication', id); current(); return result; };
const inspect = () => checked(() => inspectDocker(physicalDockerJob(current(), store.paths)));
const timer = setInterval(() => { try {
    patch({ leaseUntil: Date.now() + 60000, workerPid: process.pid });
}
catch {
    lost = true;
    logger?.kill();
} }, 3000);
function sizeExceeded() { const j = current(); let total = 0; try {
    const entries = readdirSync(store.paths.physical(j.outputDir), { withFileTypes: true });
    if (entries.length > 201)
        return true;
    for (const entry of entries) {
        if (!entry.isFile() || entry.isSymbolicLink())
            return true;
        total += lstatSync(join(store.paths.physical(j.outputDir), entry.name)).size;
        if (total > j.manifest.resources.outputBytes)
            return true;
    }
}
catch {
    return true;
} return false; }
async function stop() { const j = current(), c = await inspect(); if (c?.State.Status === 'created')
    return retireUncertainStart(physicalDockerJob(j, store.paths), current, (context, args) => checked(() => docker(context, args)), () => inspect()); if (c?.State.Running)
    await checked(() => docker(j.manifest.dockerContext, ['kill', c.Id])); return inspect(); }
function capture(start) { const j = current(); logger = spawn('docker', ['--context', j.manifest.dockerContext, ...(start ? ['start', '--attach'] : ['logs', '--follow']), j.containerId], { shell: false, windowsHide: true, env: dockerEnv(), stdio: ['ignore', 'pipe', 'pipe'] }); for (const [stream, name] of [[logger.stdout, 'stdout.log'], [logger.stderr, 'stderr.log']])
    stream.on('data', (chunk) => { try {
        current();
        const remaining = Math.max(0, j.manifest.resources.logBytes - bytes);
        bytes += chunk.length;
        if (chunk.length > remaining)
            truncated = true;
        if (remaining)
            appendFileSync(join(store.paths.physical(j.controlDir), name), chunk.subarray(0, remaining));
    }
    catch {
        logError = true;
        logger?.kill();
    } }); closed = new Promise(resolve => { logger.on('error', () => { logError = true; resolve(); }); logger.on('close', (code, signal) => { if (start) {
    attachCode = code;
    attachSignal = signal;
}
else if (code !== 0)
    logError = true; resolve(); }); }); }
async function finish(state, exitCode, error) { if (closed) {
    const drained = await Promise.race([closed.then(() => true), pause(5000).then(() => false)]);
    if (!drained) {
        logError = true;
        logger?.kill();
        await closed;
    }
} const j = current(); incomplete ||= j.recoveryCount > 0 || logError || truncated || exitCode === 0 && attachCode !== undefined && (attachCode !== 0 || !!attachSignal); if (state === 'succeeded' && incomplete)
    state = 'failed'; app.publicationBuilds.finalize(id, { state, exitCode, error, incomplete, logTruncated: truncated, generation }); }
try {
    let job = patch({ leaseUntil: Date.now() + 60000, workerPid: process.pid });
    externalPossible = !!(job.startRequested || job.containerId || job.recoveryCount);
    incomplete = job.recoveryCount > 0;
    mkdirSync(store.paths.physical(job.controlDir), { recursive: true, mode: 0o700 });
    for (const name of ['stdout.log', 'stderr.log']) {
        const path = join(store.paths.physical(job.controlDir), name);
        if (existsSync(path))
            bytes += lstatSync(path).size;
        else
            writeFileSync(path, '', { mode: 0o600 });
    }
    if (job.cancelRequested)
        throw Error('PUBLICATION_CANCELLED');
    app.publicationBuilds.assertCurrent(job);
    const imageId = await checked(() => verifyCompilerImage(job.manifest.dockerContext, job.manifest.environmentImageDigest, job.manifest));
    let container = await inspect();
    if (!container) {
        if (job.startRequested || job.containerId) {
            incomplete = true;
            throw Error('PUBLICATION_CONTAINER_MISSING');
        }
        job = current();
        if (job.cancelRequested)
            throw Error('PUBLICATION_CANCELLED');
        stageInputs(physicalDockerJob(job, store.paths));
        app.publicationBuilds.assertCurrent(current());
        externalPossible = true;
        try {
            await checked(() => docker(job.manifest.dockerContext, createArgs(physicalDockerJob(job, store.paths))));
        }
        catch (error) {
            container = await inspect();
            if (!container)
                throw error;
        }
        container ??= await inspect();
        if (!container)
            throw Error('PUBLICATION_CONTAINER_UNKNOWN');
    }
    if (container.Image !== imageId)
        throw Error('PUBLICATION_IMAGE_MISMATCH');
    job = patch({ containerId: container.Id, imageId });
    if (container.State.Status === 'created') {
        if (job.startRequested) {
            incomplete = true;
            await stop();
            throw Error('PUBLICATION_START_OUTCOME_UNKNOWN');
        }
        app.publicationBuilds.assertCurrent(current());
        job = store.transaction(() => { const j = current(); if (j.cancelRequested)
            throw Error('PUBLICATION_CANCELLED'); app.publicationBuilds.assertCurrent(j, false); return patch({ startRequested: true, startedAt: new Date().toISOString() }); });
        await checked(async () => capture(true));
    }
    else if (!job.startRequested)
        throw Error('PUBLICATION_START_NOT_AUTHORIZED');
    if (!logger)
        await checked(async () => capture(false));
    let stopped, reason;
    while (true) {
        job = current();
        container = await inspect();
        if (!container) {
            incomplete = true;
            throw Error('PUBLICATION_CONTAINER_MISSING');
        }
        if (['exited', 'dead'].includes(container.State.Status)) {
            if (sizeExceeded()) {
                incomplete = true;
                stopped = 'failed';
                reason = 'PUBLICATION_OUTPUT_LIMIT';
            }
            await finish(stopped ?? (container.State.ExitCode === 0 ? 'succeeded' : 'failed'), container.State.ExitCode, reason ?? (container.State.ExitCode === 0 ? undefined : 'PUBLICATION_PARSER_FAILED'));
            break;
        }
        if (container.State.Status === 'created' && Date.now() - Date.parse(job.startedAt) < 10000) {
            await pause(200);
            continue;
        }
        if (!container.State.Running)
            throw Error('PUBLICATION_CONTAINER_UNKNOWN');
        if (job.state !== 'running')
            job = patch({ state: 'running' });
        if (job.cancelRequested) {
            stopped = 'cancelled';
            reason = 'PUBLICATION_CANCELLED';
        }
        else if (Date.now() > Date.parse(job.startedAt ?? container.State.StartedAt) + job.manifest.resources.timeoutSeconds * 1000) {
            stopped = 'timed_out';
            reason = 'PUBLICATION_PARSE_TIMEOUT';
        }
        else if (truncated || logError || sizeExceeded()) {
            incomplete = true;
            stopped = 'failed';
            reason = 'PUBLICATION_OUTPUT_OR_LOG_LIMIT';
        }
        else
            try {
                app.publicationBuilds.assertCurrent(job, false);
            }
            catch {
                stopped = 'failed';
                reason = 'PUBLICATION_APPROVAL_OR_SOURCE_STALE';
            }
        if (stopped)
            await stop();
        await pause(500);
    }
}
catch (error) {
    if (!lost)
        try {
            const j = current();
            if (!externalPossible) {
                await finish(j.cancelRequested ? 'cancelled' : 'failed', null, 'PUBLICATION_PREFLIGHT_FAILED');
            }
            else {
                const observed = await stop();
                if (!observed || ['exited', 'dead'].includes(observed.State.Status)) {
                    incomplete = true;
                    await finish(j.cancelRequested ? 'cancelled' : 'failed', observed?.State.ExitCode ?? null, 'PUBLICATION_EXECUTION_INCOMPLETE');
                }
                else
                    patch({ state: 'unknown', integrity: 'incomplete', leaseUntil: 0, error: 'PUBLICATION_EXECUTION_UNKNOWN' });
            }
        }
        catch {
            if (!lost)
                patch({ state: 'unknown', integrity: 'incomplete', leaseUntil: 0, error: 'PUBLICATION_TARGET_OR_COLLECTION_UNKNOWN' });
        }
}
finally {
    clearInterval(timer);
    logger?.kill();
    await app.compute.stop();
    app.close();
}
//# sourceMappingURL=index.js.map