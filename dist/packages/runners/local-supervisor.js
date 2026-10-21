import { superviseLegacyLocalRun } from './local-supervisor-v1.js';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, appendFileSync, renameSync, readdirSync, lstatSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import { LocalRuntimeService, localEnvironment } from './local-runtime.js';
import { assertGpuDevices, nativeGpuInventory } from './gpu.js';
import { verifySnapshot, safePath } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { environmentVariables } from '../runtime/environment.js';
export async function superviseLocalRun(initial, c, callbacks) {
    if (!initial.execution.localExecutionId)
        return superviseLegacyLocalRun(initial, c, callbacks);
    const generation = initial.execution.generation, executionId = initial.execution.localExecutionId, control = c.store.paths.physical(initial.execution.controlDir), output = c.store.paths.physical(initial.outputDir), work = join(control, 'work');
    let possible = initial.execution.startRequested, lost = false;
    const read = () => { callbacks.fence(); return callbacks.read(); };
    const patch = (value) => { const r = read(); return callbacks.patch({ ...value, execution: { ...r.execution, ...value.execution } }); };
    const receipt = (name) => { const value = JSON.parse(readStableFile(control, name, 65536).toString('utf8')); ensure(value.version === 2 && value.executionId === executionId && value.manifestDigest === initial.manifestDigest, 'LOCAL_STATE_UNKNOWN', '本地回执身份不符'); return value; };
    // Fencing and publication share the database lock; an older controller cannot publish after takeover.
    let lastCommand;
    const command = (cancel = false) => c.store.transaction(() => { callbacks.fence(); if (lastCommand === cancel)
        return; const path = join(control, 'native-control.json'); writeFileSync(path + '.' + generation + '.tmp', JSON.stringify({ version: 2, executionId, manifestDigest: initial.manifestDigest, generation, cancel }), { mode: 0o600 }); renameSync(path + '.' + generation + '.tmp', path); lastCommand = cancel; });
    const finish = (state, exitCode, error, incomplete = false, localCompletion) => callbacks.finalize({ generation, state, exitCode, error, incomplete, logTruncated: false, outputExceeded: false, ...(localCompletion ? { localCompletion } : {}) });
    const timer = setInterval(() => { try {
        const r = read();
        patch({ heartbeat: Date.now(), execution: { ...r.execution, leaseUntil: Date.now() + 60000 } });
    }
    catch {
        lost = true;
    } }, 3000);
    let clearEnvironment = () => { };
    try {
        const run = read();
        ensure(executionId, 'LOCAL_STATE_UNKNOWN', '旧本地作业没有可恢复执行身份；不按旧PID操作');
        if (!possible) {
            callbacks.assertGrant(run);
            const runtime = new LocalRuntimeService(c).resolve(run.manifest.contract.localRuntimeId, run.manifest.localRuntime);
            if (/^Python\s|^v\d/.test(runtime.runtimeVersion))
                ensure(run.manifest.sourceFiles.some(f => f.path === run.manifest.contract.command[1]), 'LOCAL_ENTRY_INVALID', 'Python/Node入口必须是已批准源码文件');
            if (run.manifest.contract.gpu)
                assertGpuDevices(run.manifest.contract.gpu, await nativeGpuInventory());
            verifySnapshot(c.store.paths.physical(run.manifest.snapshotPath), run.manifest.sourceFiles);
            mkdirSync(work, { recursive: true, mode: 0o700 });
            mkdirSync(output, { recursive: true, mode: 0o700 });
            for (const f of run.manifest.sourceFiles) {
                const bytes = readStableFile(c.store.paths.physical(run.manifest.snapshotPath), f.path, f.size);
                ensure(digest(bytes) === f.digest, 'SNAPSHOT_CORRUPTED', '固定源码已变化');
                const path = safePath(work, f.path);
                mkdirSync(dirname(path), { recursive: true });
                writeFileSync(path, bytes, { flag: 'wx', mode: f.mode === '100755' ? 0o700 : 0o600 });
            }
            const temp = join(control, 'tmp');
            mkdirSync(temp, { recursive: true });
            const specPath = join(control, 'native-spec.json'), baseEnvironment = localEnvironment(temp, output, run.manifest.contract.gpu?.deviceIds), spec = { version: 2, executionId, manifestDigest: run.manifestDigest, generation, deadline: Date.now() + run.manifest.contract.timeoutSeconds * 1000, executable: runtime.executable, argv: run.manifest.contract.command.slice(1), env: { ...environmentVariables(c.dataDir), ...baseEnvironment }, work, control };
            writeFileSync(specPath, JSON.stringify(spec), { mode: 0o600 });
            let cleared = false;
            clearEnvironment = () => { if (!cleared) {
                writeFileSync(specPath, JSON.stringify({ ...spec, env: baseEnvironment }), { mode: 0o600 });
                cleared = true;
            } };
            c.store.transaction(() => { callbacks.assertGrant(read()); ensure(!read().cancelRequested, 'RUN_CANCELLED', '作业已取消'); patch({ startedAt: new Date().toISOString(), execution: { ...read().execution, startRequested: true } }); command(); });
            possible = true;
            const child = process.platform === 'win32' ? spawn(process.execPath, [join(c.repoRoot, 'scripts', 'local-windows-launcher-v2.mjs'), specPath], { windowsHide: true, detached: true, env: localEnvironment(temp, output), stdio: ['ignore', 'inherit', 'inherit'] }) : spawn(process.execPath, [join(c.repoRoot, 'scripts', 'local-posix-runner-v2.mjs'), specPath], { detached: true, env: localEnvironment(temp, output), stdio: 'ignore' });
            child.on('error', error => appendFileSync(join(control, 'supervisor.log'), 'LOCAL_HELPER_SPAWN: ' + String(error.code) + '\n'));
            child.unref();
        }
        else {
            ensure(existsSync(join(control, 'native-start.json')) || existsSync(join(control, 'native-result.json')), 'LOCAL_STATE_UNKNOWN', '启动效果尚未确认，禁止重复启动');
            if (existsSync(join(control, 'native-start.json')))
                receipt('native-start.json');
            clearEnvironment = () => { if (existsSync(join(control, 'native-spec.json'))) {
                const spec = receipt('native-spec.json');
                writeFileSync(join(control, 'native-spec.json'), JSON.stringify({ ...spec, env: localEnvironment(join(control, 'tmp'), output, run.manifest.contract.gpu?.deviceIds) }), { mode: 0o600 });
            } };
            clearEnvironment();
            command();
        }
        let stopping, reason;
        const observedAt = Date.now();
        const outputSize = () => { let total = 0, count = 0; const pending = [output]; while (pending.length)
            for (const e of readdirSync(pending.pop(), { withFileTypes: true })) {
                ensure(++count <= 5000 && !e.isSymbolicLink(), 'OUTPUT_LIMIT', '输出数量或类型无效');
                const p = join(e.parentPath, e.name), stat = lstatSync(p);
                if (stat.isDirectory())
                    pending.push(p);
                else {
                    ensure(stat.isFile(), 'OUTPUT_LIMIT', '输出类型无效');
                    total += stat.size;
                }
            } return total; };
        while (!existsSync(join(control, 'native-result.json'))) {
            const r = read();
            if (lost)
                throw new Error('LEASE_EXPIRED');
            if (r.cancelRequested) {
                stopping = 'cancelled';
                reason = 'RUN_CANCELLED';
            }
            else if (Date.now() > Date.parse(r.startedAt) + r.manifest.contract.timeoutSeconds * 1000) {
                stopping = 'failed';
                reason = 'LOCAL_TIMEOUT';
            }
            else
                try {
                    callbacks.assertGrant(r);
                    const logBytes = ['stdout.log', 'stderr.log'].reduce((sum, n) => sum + (existsSync(join(control, n)) ? lstatSync(join(control, n)).size : 0), 0);
                    ensure(logBytes <= r.manifest.contract.logBytes && outputSize() <= r.manifest.contract.outputBytes, 'OUTPUT_LIMIT', '日志或输出超过上限');
                }
                catch (error) {
                    stopping = 'failed';
                    reason = error.code ?? 'LOCAL_MONITOR_FAILED';
                }
            command(!!stopping);
            if (process.platform === 'win32' && existsSync(join(control, 'native-helper-exit.json')))
                ensure(receipt('native-helper-exit.json').exitCode === 0 && existsSync(join(control, 'native-result.json')), 'LOCAL_STATE_UNKNOWN', 'helper退出但没有有效终态证明');
            if (existsSync(join(control, 'native-start.json'))) {
                receipt('native-start.json');
                clearEnvironment();
                if (['submitting', 'unknown'].includes(r.state))
                    patch({ state: r.cancelRequested ? 'cancelling' : 'running' });
            }
            if (Date.now() - observedAt > 15000) {
                const beat = receipt('native-heartbeat.json');
                ensure(Number.isFinite(beat.observedAt) && Date.now() - beat.observedAt < 15000, 'LOCAL_STATE_UNKNOWN', '原本地helper失联；保留未知屏障');
            }
            await pause(100);
        }
        clearEnvironment();
        const result = receipt('native-result.json');
        ensure(result.exitCode === null || Number.isSafeInteger(result.exitCode), 'LOCAL_STATE_UNKNOWN', '本地退出状态无效');
        if (process.platform === 'win32') {
            ensure(result.stopped === true, 'LOCAL_STATE_UNKNOWN', '尚未确认进程树终止');
            const deadline = Date.now() + 10000;
            while (!existsSync(join(control, 'native-helper-exit.json')) && Date.now() < deadline) {
                read();
                await pause(50);
            }
            ensure(receipt('native-helper-exit.json').exitCode === 0, 'LOCAL_STATE_UNKNOWN', '原helper未正常退出');
        }
        else {
            ensure(Number.isSafeInteger(result.leaderPid) && result.leaderPid > 0, 'LOCAL_STATE_UNKNOWN', '进程组身份缺失');
            let stopped = false;
            for (let attempt = 0; attempt < 20; attempt++) {
                const ps = spawnSync('/bin/ps', ['-axo', 'pgid=,stat='], { encoding: 'utf8', timeout: 5000 });
                ensure(ps.status === 0, 'LOCAL_STATE_UNKNOWN', '无法核对进程组');
                stopped = !ps.stdout.split('\n').some(line => { const [group, status] = line.trim().split(/\s+/); return Number(group) === result.leaderPid && !status?.startsWith('Z'); });
                if (stopped)
                    break;
                await pause(50);
            }
            ensure(stopped, 'LOCAL_STATE_UNKNOWN', '尚未确认进程组终止');
        }
        if (result.timedOut) {
            stopping = 'failed';
            reason = 'LOCAL_TIMEOUT';
        }
        else if (result.cancelled) {
            stopping ??= 'cancelled';
            reason ??= 'RUN_CANCELLED';
        }
        const completion = { version: 2, executionId, manifestDigest: initial.manifestDigest, stopped: true, exitCode: result.exitCode, cancelled: !!stopping };
        await finish(stopping ?? (result.exitCode === 0 ? 'succeeded' : 'failed'), result.exitCode, reason ?? result.error, !!stopping || result.exitCode === null, completion);
    }
    catch (error) {
        if (!lost) {
            try {
                const r = read(), code = error.code ?? 'LOCAL_PROTOCOL_FAILED';
                if (possible)
                    patch({ state: 'unknown', integrity: 'incomplete', error: 'LOCAL_STATE_UNKNOWN: ' + code + '；保留资源，不按旧 PID 重启或取消', execution: { ...r.execution, leaseUntil: 0 } });
                else
                    await finish(r.cancelRequested ? 'cancelled' : 'failed', null, code, true);
            }
            catch { /* A newer authority owns state. */ }
        }
    }
    finally {
        clearInterval(timer);
    }
}
//# sourceMappingURL=local-supervisor.js.map