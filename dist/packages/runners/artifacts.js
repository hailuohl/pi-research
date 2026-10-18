import { readdirSync, existsSync } from 'node:fs';
import { SYSTEM } from '../domain/types.js';
import { readStableFile } from '../workspace/stable-file.js';
import { safePath } from '../workspace/files.js';
import { finiteMetrics } from '../contracts/validation.js';
import { asError, ensure } from '../domain/errors.js';
import { environmentSecrets, redactEnvironment } from '../runtime/environment.js';
import { closedPaired, methodHostPaths, assertMethodSnapshot, methodAttachments, methodResult } from '../research-workflows/method-contracts.js';
/** Collect first, then derive completeness exclusively from the immutable archive. */
export function collectRunArtifacts(run, evidence, paths, successful = true) {
    const secretValues = paths && run.execution?.backend === 'local' ? environmentSecrets(paths.dataDir) : [];
    const mask = (value) => paths && secretValues.length ? redactEnvironment(paths.dataDir, value) : value;
    const publicBytes = (bytes) => {
        if (!secretValues.some(secret => bytes.includes(Buffer.from(secret))))
            return bytes;
        let value;
        try {
            value = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            ensure(!value.includes('\0'), 'RUN_SECRET_BINARY', '二进制产物包含环境变量值，未归档', 409);
        }
        catch {
            ensure(false, 'RUN_SECRET_BINARY', '二进制产物包含环境变量值，未归档', 409);
        }
        return Buffer.from(mask(value));
    };
    if (paths)
        run = { ...run, outputDir: paths.physical(run.outputDir), ...(run.execution ? { execution: { ...run.execution, controlDir: paths.physical(run.execution.controlDir) } } : {}) };
    const controlNames = new Set();
    const artifacts = new Map(), errors = [], evidenceIds = [];
    let methods, methodInvalid = false;
    try {
        if (run.manifest.methodContractDigest)
            ensure(run.manifest.researchBrief, 'METHOD_CONTRACT_CORRUPTED', '方法运行缺少原研究计划');
        methods = run.manifest.researchBrief ? evidence.fixedResearchMethods(run.projectId, run.manifest.researchBrief, run.manifest.methodContractDigest) : undefined;
        if (methods)
            assertMethodSnapshot(methods.contract, run.manifest.sourceFiles, 'formal');
    }
    catch (error) {
        methodInvalid = true;
        errors.push(asError(error).code);
    }
    let total = 0, entries = 0, unsafe = false;
    const walk = (relative, depth) => {
        ensure(depth <= 32, 'OUTPUT_DEPTH_LIMIT', '产物目录层级过深');
        const dir = safePath(run.outputDir, relative, true);
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            ensure(++entries <= 5000, 'OUTPUT_COUNT_LIMIT', '产物数量超过5000项');
            const path = relative ? `${relative}/${entry.name}` : entry.name;
            try {
                ensure(!secretValues.some(secret => path.includes(secret)), 'RUN_SECRET_PATH', '产物路径包含环境变量值，未归档', 409);
                ensure(!entry.isSymbolicLink(), 'PATH_DENIED', `${path}: 不接受符号链接`);
                if (entry.isDirectory()) {
                    walk(path, depth + 1);
                    continue;
                }
                const bytes = readStableFile(run.outputDir, path, path === 'metrics.json' ? 1024 * 1024 : 32 * 1024 * 1024);
                ensure(total + bytes.length <= (run.manifest.contract.outputBytes ?? 128 * 1024 * 1024), 'OUTPUT_TOTAL_LIMIT', '本地归档超过运行契约的输出上限');
                total += bytes.length;
                const type = path.endsWith('.json') ? 'application/json' : path.endsWith('.csv') ? 'text/csv' : 'text/plain';
                const methodReserved = !!methods && methodHostPaths(methods.contract).includes(path), reserved = !!run.execution && ['stdout.log', 'stderr.log', 'execution.json'].includes(path) || methodReserved;
                let archived = bytes;
                if (path === 'metrics.json' && secretValues.length) {
                    const numeric = finiteMetrics(JSON.parse(bytes.toString('utf8')));
                    ensure(!Object.keys(numeric).some(key => secretValues.some(secret => key.includes(secret))), 'RUN_SECRET_METRIC', '指标名称包含环境变量值，未归档', 409);
                    // Numeric measurements are typed data, not credential-bearing narrative.
                }
                else
                    archived = publicBytes(bytes);
                const title = reserved ? `output/${path}` : path;
                artifacts.set(title, evidence.put(run.projectId, title, archived, type, 'run', { runId: run.id }));
                if (reserved) {
                    unsafe = true;
                    errors.push(methodReserved ? `METHOD_ARTIFACT_RESERVED: ${path}: 输出占用了宿主规范方法名称` : `${path}: 输出占用了宿主日志或回执名称`);
                }
            }
            catch (error) {
                const e = asError(error);
                if (e.code === 'PATH_DENIED' || e.code === 'ARTIFACT_CHANGED' || e.code.startsWith('RUN_SECRET_'))
                    unsafe = true;
                errors.push(mask(`${path}: ${e.message}`));
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
                artifacts.set(name, evidence.put(run.projectId, name, publicBytes(bytes), 'text/plain', 'run', { runId: run.id }));
                controlNames.add(name);
            }
            catch (error) {
                errors.push(`${name}: ${asError(error).message}`);
            }
        }
    let integrity = unsafe || methodInvalid ? 'invalid' : 'incomplete';
    let metrics;
    const metric = artifacts.get('metrics.json');
    if (metric) {
        try {
            const raw = evidence.read(SYSTEM, metric.id).bytes.toString('utf8');
            metrics = finiteMetrics(JSON.parse(raw));
            ensure(Object.keys(run.manifest.contract.metrics).every(k => typeof metrics[k] === 'number'), 'INVALID_METRICS', '缺少契约声明的指标');
            if (methods && !unsafe) {
                const archived = [...artifacts.values()].map(a => ({ ...a, bytes: evidence.read(SYSTEM, a.id).bytes })), result = methodResult(methods.contract, { ...metric, bytes: evidence.read(SYSTEM, metric.id).bytes }, metrics, { sourceDigest: run.manifest.snapshotDigest, subjectId: run.id }, closedPaired(methods.contract) ? archived.filter(a => !controlNames.has(a.title)) : archived, undefined, { sourceFiles: run.manifest.sourceFiles, logs: archived.filter(a => controlNames.has(a.title)), successful }), attachments = methodAttachments(methods.contract, methods.protocol, result, archived);
                ensure(total + [...attachments.values()].reduce((n, b) => n + b.length, 0) <= (run.manifest.contract.outputBytes ?? 128 * 1024 * 1024), 'METHOD_OUTPUT_LIMIT', '宿主方法附件与候选输出合计超过固定归档字节上限');
                for (const [name, bytes] of attachments)
                    artifacts.set(name, evidence.put(run.projectId, name, bytes, name.endsWith('.md') ? 'text/markdown' : name.endsWith('.csv') ? 'text/csv' : 'application/json', 'run', { runId: run.id }));
            }
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