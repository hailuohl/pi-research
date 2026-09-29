import { readdirSync, existsSync } from 'node:fs';
import { SYSTEM } from '../domain/types.js';
import { readStableFile } from '../workspace/stable-file.js';
import { safePath } from '../workspace/files.js';
import { finiteMetrics } from '../contracts/validation.js';
import { asError, ensure } from '../domain/errors.js';
/** Collect first, then derive completeness exclusively from the immutable archive. */
export function collectRunArtifacts(run, evidence, paths) {
    if (paths)
        run = { ...run, outputDir: paths.physical(run.outputDir), ...(run.execution ? { execution: { ...run.execution, controlDir: paths.physical(run.execution.controlDir) } } : {}) };
    const artifacts = new Map(), errors = [], evidenceIds = [];
    let total = 0, entries = 0, unsafe = false;
    const walk = (relative, depth) => {
        ensure(depth <= 32, 'OUTPUT_DEPTH_LIMIT', '产物目录层级过深');
        const dir = safePath(run.outputDir, relative, true);
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            ensure(++entries <= 5000, 'OUTPUT_COUNT_LIMIT', '产物数量超过5000项');
            const path = relative ? `${relative}/${entry.name}` : entry.name;
            try {
                ensure(!entry.isSymbolicLink(), 'PATH_DENIED', `${path}: 不接受符号链接`);
                if (entry.isDirectory()) {
                    walk(path, depth + 1);
                    continue;
                }
                const bytes = readStableFile(run.outputDir, path, path === 'metrics.json' ? 1024 * 1024 : 32 * 1024 * 1024);
                ensure(total + bytes.length <= (run.manifest.contract.outputBytes ?? 128 * 1024 * 1024), 'OUTPUT_TOTAL_LIMIT', '本地归档超过运行契约的输出上限');
                total += bytes.length;
                const type = path.endsWith('.json') ? 'application/json' : path.endsWith('.csv') ? 'text/csv' : 'text/plain';
                const reserved = !!run.execution && ['stdout.log', 'stderr.log', 'execution.json'].includes(path);
                const title = reserved ? `output/${path}` : path;
                artifacts.set(title, evidence.put(run.projectId, title, bytes, type, 'run', { runId: run.id }));
                if (reserved) {
                    unsafe = true;
                    errors.push(`${path}: 输出占用了宿主日志或回执名称`);
                }
            }
            catch (error) {
                const e = asError(error);
                if (e.code === 'PATH_DENIED' || e.code === 'ARTIFACT_CHANGED')
                    unsafe = true;
                errors.push(`${path}: ${e.message}`);
            }
        }
    };
    try {
        walk('', 0);
    }
    catch (error) {
        unsafe = true;
        errors.push(asError(error).message);
    }
    if (run.execution)
        for (const name of ['stdout.log', 'stderr.log', 'diagnostic.log']) {
            const path = safePath(run.execution.controlDir, name);
            if (name === 'diagnostic.log' && !existsSync(path))
                continue;
            try {
                const bytes = !existsSync(path) && !run.execution.startRequested ? Buffer.alloc(0) : readStableFile(run.execution.controlDir, name, name === 'diagnostic.log' ? 65536 : run.manifest.contract.logBytes ?? 16 * 1024 * 1024);
                artifacts.set(name, evidence.put(run.projectId, name, bytes, 'text/plain', 'run', { runId: run.id }));
            }
            catch (error) {
                errors.push(`${name}: ${asError(error).message}`);
            }
        }
    let integrity = unsafe ? 'invalid' : 'incomplete';
    let metrics;
    const metric = artifacts.get('metrics.json');
    if (metric) {
        try {
            const raw = evidence.read(SYSTEM, metric.id).bytes.toString('utf8');
            metrics = finiteMetrics(JSON.parse(raw));
            ensure(Object.keys(run.manifest.contract.metrics).every(k => typeof metrics[k] === 'number'), 'INVALID_METRICS', '缺少契约声明的指标');
            evidenceIds.push(evidence.register(SYSTEM, run.projectId, metric.id, 0, raw.length, '真实运行输出指标（解释仍需审核）', 'run', run.id).id);
        }
        catch (error) {
            metrics = undefined;
            integrity = 'invalid';
            errors.push(asError(error).message);
        }
    }
    else
        errors.push('metrics.json: 缺少有效的已归档指标文件');
    const missing = run.manifest.contract.expectedArtifacts.filter(path => !artifacts.has(path));
    missing.forEach(path => errors.push(`${path}: 必需产物未归档为普通文件`));
    if (metrics && !missing.length && !errors.length && integrity !== 'invalid')
        integrity = 'complete';
    return { artifactIds: [...artifacts.values()].map(a => a.id), evidenceIds, metrics, integrity, errors };
}
//# sourceMappingURL=artifacts.js.map