import {appendFileSync, existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
import {executionTimeStatus} from '../execution/completion-time.js';
import {DockerAdapter} from './docker.js';
import type {DockerRun, DockerRunResult, DockerSupervisorCallbacks, RunExecution, RunnerProcess} from './adapter.js';

/** Runs inside the detached supervisor process; the caller owns SQLite and approval authority. */
export async function superviseDockerRun(initial: DockerRun, callbacks: DockerSupervisorCallbacks): Promise<void> {
    const generation = initial.execution.generation;
    let lostLease = false, logTruncated = false, logsIncomplete = initial.execution.recoveryCount > 0, outputExceeded = false;
    let stream: RunnerProcess | undefined, streamResult: Awaited<RunnerProcess['completion']> | undefined, attachedStart = false, bytes = 0;
    let externalPossible = Boolean(initial.execution.startRequested || initial.execution.containerId || initial.execution.recoveryCount > 0);
    const fence = () => {try {callbacks.fence(); if (callbacks.read().execution.generation !== generation) throw new Error('Formal runner generation lost');} catch (error) {lostLease = true; throw error;}};
    const current = () => {fence(); return callbacks.read();};
    const adapter = new DockerAdapter(initial, fence,callbacks.verifyTarget,callbacks.paths);
    const update = (execution: Partial<RunExecution>, other: Parameters<DockerSupervisorCallbacks['patch']>[0] = {}) => {
        const run = current();
        const next = callbacks.patch({...other, execution: {...run.execution, ...execution}});
        adapter.job.containerId = next.execution.containerId; adapter.job.startRequested = next.execution.startRequested;
        return next;
    };
    const initializeLogs = () => {
        mkdirSync(adapter.job.controlDir, {recursive: true, mode: 0o700});
        for (const name of ['stdout.log', 'stderr.log']) {
            const path = join(adapter.job.controlDir, name);
            if (!existsSync(path)) writeFileSync(path, '', {flag: 'wx', mode: 0o600});
            bytes += lstatSync(path).size;
        }
    };
    const log = (name: 'stdout' | 'stderr', chunk: Buffer) => {
        fence();
        const remaining = Math.max(0, adapter.job.manifest.resources.logBytes - bytes);
        if (chunk.length > remaining) logTruncated = true;
        bytes += chunk.length;
        if (remaining) appendFileSync(join(adapter.job.controlDir, `${name}.log`), chunk.subarray(0, remaining));
    };
    const diagnostic = (error: unknown) => {
        fence();
        const text = error instanceof Error ? error.stack ?? error.message : String(error);
        writeFileSync(join(adapter.job.controlDir, 'diagnostic.log'), Buffer.from(text).subarray(0, 65536), {mode: 0o600});
        log('stderr', Buffer.from('FORMAL_RUN_EXECUTION_FAILED\n'));
    };
    const outputOverLimit = () => {
        const limit = (initial.manifest.contract as {outputBytes?: number}).outputBytes ?? 128 * 1024 * 1024;
        let total = 0, count = 0; const pending = [adapter.job.outputDir];
        try {
            while (pending.length) {
                const dir = pending.pop()!;
                for (const entry of readdirSync(dir, {withFileTypes: true})) {
                    if (++count > 5000 || entry.isSymbolicLink()) return true;
                    const path = join(dir, entry.name), stat = lstatSync(path);
                    if (stat.isDirectory()) pending.push(path); else if (!stat.isFile() || (total += stat.size) > limit) return true;
                }
            }
        } catch {return true;}
        return false;
    };
    const finish = async (state: DockerRunResult['state'], exitCode: number | null, error?: string, incomplete = false) => {
        if (stream) {
            const drained = await Promise.race([stream.completion.then(result => {streamResult = result; return true;}), pause(5000).then(() => false)]);
            if (!drained) {logsIncomplete = true; await stream.detach?.();}
            if (streamResult?.error || (attachedStart && exitCode === 0 && (streamResult?.exitCode !== 0 || streamResult?.signal)) || (!attachedStart && streamResult?.exitCode !== 0)) logsIncomplete = true;
        }
        fence();
        const collected = await adapter.collect();
        outputExceeded ||= collected.outputExceeded || outputOverLimit();
        incomplete ||= logsIncomplete || logTruncated || outputExceeded || collected.incomplete;
        if (state === 'succeeded' && (exitCode !== 0 || incomplete)) state = 'failed';
        const message = [error, ...collected.errors].filter(Boolean).join('; ') || undefined;
        if (message) diagnostic(message);
        update({logTruncated, logsIncomplete, outputExceeded});
        await callbacks.finalize({state, exitCode, error: message, incomplete, logTruncated, outputExceeded, generation});
    };
    const timer = setInterval(() => {
        try {update({leaseUntil: Date.now() + 60000}, {heartbeat: Date.now(), supervisorPid: process.pid});}
        catch {lostLease = true; void stream?.detach?.();}
    }, 3000);
    try {
        fence(); initializeLogs();
        if (current().cancelRequested) throw new Error('Formal run cancelled before preparation');
        callbacks.assertGrant(current());
        await adapter.preflight();
        let container = await adapter.inspect();
        if (!container) {
            if (adapter.job.startRequested || adapter.job.containerId) {logsIncomplete = true; throw new Error('Formal run owned container is confirmed missing');}
            callbacks.assertGrant(current());
            await adapter.stage();
            if (current().cancelRequested) throw new Error('Formal run cancelled before container creation');
            externalPossible = true;
        }
        container = await adapter.submit();
        update({containerId: container.Id, imageId: adapter.imageId});
        if (container.State.Status === 'created') {
            if (adapter.job.startRequested) {
                logsIncomplete = true;
                container = await adapter.reconcile();
                if (!container) {await finish(current().cancelRequested ? 'cancelled' : 'failed', null, 'Ambiguous prior formal start retired without restarting', true); return;}
            } else {
                const run = current();
                if (run.cancelRequested) throw new Error('Formal run cancelled before start');
                callbacks.assertGrant(run);
                update({startRequested: true}, {startedAt: new Date().toISOString()});
                attachedStart = true;
                stream = await adapter.start(log);
            }
        } else if (!adapter.job.startRequested) throw new Error('Formal container ran without persisted start authorization');
        if (!stream) {logsIncomplete = true; stream = await adapter.readLogs(log);}
        void stream.completion.then(result => {streamResult = result;});
        let stopping: DockerRunResult['state'] | undefined, reason: string | undefined;
        while (true) {
            const run = current(); container = await adapter.inspect();
            if (!container) {logsIncomplete = true; throw new Error('Formal owned container disappeared during monitoring');}
            if (['exited', 'dead'].includes(container.State.Status)) {
                if (!stopping) {
                    const timing = executionTimeStatus(run.startedAt, container.State, run.manifest.contract.timeoutSeconds);
                    if (timing === 'invalid') {logsIncomplete = true; stopping = 'failed'; reason = 'Invalid container completion time';}
                    else if (timing === 'exceeded') {stopping = 'failed'; reason = 'Formal run timeout exceeded';}
                }
                await finish(stopping ?? (container.State.ExitCode === 0 ? 'succeeded' : 'failed'), container.State.ExitCode, reason ?? (container.State.Error || undefined)); return;
            }
            if (container.State.Status === 'created' && Date.now() - Date.parse(run.startedAt!) < 10000) {await pause(100); continue;}
            if (!container.State.Running) throw new Error(`Unknown formal container state: ${container.State.Status}`);
            if (run.state !== 'running' && run.state !== 'cancelling') update({}, {state: 'running'});
            const timing = executionTimeStatus(run.startedAt, container.State, run.manifest.contract.timeoutSeconds, undefined, Date.now());
            if (run.cancelRequested) {stopping = 'cancelled'; reason = 'Formal run cancellation requested';}
            else if (timing === 'invalid') {logsIncomplete = true; stopping = 'failed'; reason = 'Invalid container execution time';}
            else if (timing === 'exceeded') {stopping = 'failed'; reason = 'Formal run timeout exceeded';}
            else if (logTruncated || streamResult?.error || streamResult?.signal) {stopping = 'failed'; reason = 'Formal run log stream incomplete'; logsIncomplete = true;}
            else if (outputOverLimit()) {stopping = 'failed'; reason = 'Formal run output limit exceeded'; outputExceeded = true;}
            else {try {callbacks.assertGrant(run);} catch (error) {stopping = 'failed'; reason = (error as Error).message;}}
            if (stopping) await adapter.cancel();
            await pause(250);
        }
    } catch (error) {
        if (!lostLease) {
            try {
                diagnostic(error);
                let stopped = !externalPossible, exitCode: number | null = null;
                if (externalPossible) {
                    let container = await adapter.reconcile();
                    if (container?.State.Running || container?.State.Status === 'created') container = await adapter.cancel();
                    if (!container) logsIncomplete ||= adapter.job.startRequested || Boolean(adapter.job.containerId);
                    stopped = !container || ['exited', 'dead'].includes(container.State.Status) || (container.State.Status === 'created' && !adapter.job.startRequested);
                    if (container && ['exited', 'dead'].includes(container.State.Status)) exitCode = container.State.ExitCode;
                }
                if (stopped) {
                    // Before creation there is no external workload; avoid requiring Docker for failure archival.
                    if (!externalPossible) {
                        update({logsIncomplete: true});
                        await callbacks.finalize({state: current().cancelRequested ? 'cancelled' : 'failed', exitCode, error: (error as Error).message, incomplete: true, logTruncated, outputExceeded, generation});
                    } else await finish(current().cancelRequested ? 'cancelled' : 'failed', exitCode, (error as Error).message, true);
                } else update({leaseUntil: 0, logsIncomplete: true}, {state: 'unknown', integrity: 'incomplete', error: (error as Error).message});
            } catch (recoveryError) {
                if (!lostLease) update({leaseUntil: 0, logsIncomplete: true}, {state: 'unknown', integrity: 'incomplete', error: `${(error as Error).message}; reconciliation: ${(recoveryError as Error).message}`});
            }
        }
    } finally {clearInterval(timer); await stream?.detach?.();}
}
