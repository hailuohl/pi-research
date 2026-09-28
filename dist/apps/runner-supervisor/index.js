import { appendFileSync, mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { Store, now } from '../../packages/storage/store.js';
import { RunService, TERMINAL } from '../../packages/runners/service.js';
import { EvidenceService } from '../../packages/evidence/service.js';
import { ApprovalService } from '../../packages/policy/approvals.js';
import { TrustedExampleAdapter } from '../../packages/runners/trusted-example.js';
import { superviseDockerRun } from '../../packages/runners/docker-supervisor.js';
import { ensure } from '../../packages/domain/errors.js';
const [dataDir, repoRoot, runId] = process.argv.slice(2);
if (!dataDir || !repoRoot || !runId)
    throw new Error('Usage: supervisor DATA REPO RUN');
const store = new Store(join(dataDir, 'state.db')), ctx = { dataDir, repoRoot, store };
const service = new RunService(ctx, new ApprovalService(ctx), new EvidenceService(ctx));
const controlDir = join(dataDir, 'jobs', runId, 'control');
const run = store.transaction(() => {
    const r = store.get('run', runId);
    if (TERMINAL.includes(r.state))
        return null;
    const docker = r.manifest.contract.runner === 'docker';
    if (r.state === 'queued') {
        try {
            service.assertLaunchable(r);
        }
        catch (error) {
            service.cancelBeforeLaunch(r, error);
            return null;
        }
    }
    else if (!docker || !r.execution || r.execution.leaseUntil > Date.now())
        return null;
    if (store.list('run').some(x => x.id !== runId && ['submitting', 'running', 'cancelling', 'unknown'].includes(x.state)))
        return null;
    if (docker) {
        const before = r.execution ?? { backend: 'docker', dockerContext: r.manifest.contract.dockerContext ?? 'default', containerName: `pi-research-${r.id}`, controlDir, generation: 0, leaseUntil: 0, startRequested: false, recoveryCount: 0 };
        return store.update('run', r.id, r.version, { state: r.state === 'queued' ? 'submitting' : r.state, supervisorPid: process.pid, heartbeat: Date.now(), execution: { ...before, generation: before.generation + 1, leaseUntil: Date.now() + 60000, recoveryCount: before.recoveryCount + (before.generation > 0 ? 1 : 0) } });
    }
    return store.update('run', r.id, r.version, { state: 'submitting', supervisorPid: process.pid, heartbeat: Date.now(), startedAt: now() });
});
if (!run) {
    store.close();
    process.exit(0);
}
mkdirSync(controlDir, { recursive: true, mode: 0o700 });
function receipt(exitCode, state, error, facts) {
    const name = facts ? `terminal-${facts.generation}` : 'terminal', value = { manifestDigest: run.manifestDigest, exitCode, state, ...(error ? { error } : {}), ...(facts ? { facts } : {}) };
    writeFileSync(join(controlDir, `${name}.tmp`), JSON.stringify(value), { mode: 0o600 });
    renameSync(join(controlDir, `${name}.tmp`), join(controlDir, `${name}.json`));
    service.finalize(runId, exitCode, state, error, facts);
}
try {
    if (run.execution) {
        const generation = run.execution.generation;
        const fence = () => { const r = store.get('run', runId); ensure(!TERMINAL.includes(r.state) && r.execution?.generation === generation && r.execution.leaseUntil > Date.now(), 'LEASE_EXPIRED', '监管器已失去作业租约'); };
        await superviseDockerRun(run, {
            read: () => store.get('run', runId), fence,
            assertGrant: r => service.assertExecutionGrant(r),
            patch: value => store.transaction(() => { fence(); const r = store.get('run', runId); if (value.execution?.startRequested && !r.execution.startRequested) {
                ensure(!r.cancelRequested, 'RUN_CANCELLED', '作业已请求取消');
                service.assertExecutionGrant(r);
            } return store.update('run', runId, r.version, value); }),
            finalize: facts => { fence(); receipt(facts.exitCode, facts.state, facts.error, facts); },
        });
    }
    else {
        const adapter = new TrustedExampleAdapter(run, repoRoot);
        let processHandle, timer, timeout, observedCancel = false, timedOut = false, truncated = false, bytes = 0;
        try {
            await adapter.preflight();
            await adapter.stage();
            const log = join(run.outputDir, 'stdout.log');
            writeFileSync(log, '', { mode: 0o600 });
            processHandle = await adapter.start((_stream, chunk) => { const remaining = Math.max(0, 16 * 1024 * 1024 - bytes); bytes += chunk.length; if (remaining)
                appendFileSync(log, chunk.subarray(0, remaining)); if (chunk.length > remaining) {
                truncated = true;
                void processHandle?.cancel();
            } });
            store.transaction(() => { const r = store.get('run', runId); store.update('run', r.id, r.version, { state: r.cancelRequested ? 'cancelling' : 'running', childPid: processHandle.pid, heartbeat: Date.now() }); });
            timer = setInterval(() => { const r = service.heartbeat(runId); if (r.cancelRequested && !observedCancel) {
                observedCancel = true;
                void processHandle.cancel();
            } }, 100);
            timeout = setTimeout(() => { timedOut = true; void processHandle.cancel(); }, run.manifest.contract.timeoutSeconds * 1000);
            const result = await processHandle.completion;
            const error = result.error ?? (timedOut ? '执行超时' : truncated ? '日志达到上限' : result.exitCode === 0 ? undefined : `进程退出：${result.exitCode ?? result.signal}`);
            receipt(result.exitCode, observedCancel ? 'cancelled' : error ? 'failed' : result.exitCode === 0 ? 'succeeded' : 'failed', error);
        }
        catch (error) {
            receipt(null, 'failed', error.message);
        }
        finally {
            if (timer)
                clearInterval(timer);
            if (timeout)
                clearTimeout(timeout);
        }
    }
}
finally {
    store.close();
}
//# sourceMappingURL=index.js.map