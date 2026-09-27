import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { integer, object, oneOf, strings, text } from '../contracts/validation.js';
export const EXAMPLE_CONTRACT = { command: ['node', 'experiment.mjs'], environment: {}, datasetVersion: 'synthetic-quadratic-v1', evaluationProtocolVersion: 'deterministic-split-180-60-v1', metrics: { mse: { unit: 'squared-target', direction: 'min' }, r2: { unit: 'dimensionless', direction: 'max' }, train_mse: { unit: 'squared-target', direction: 'min' } }, expectedArtifacts: ['metrics.json', 'predictions.csv', 'model.json'], timeoutSeconds: 30, runner: 'trusted-example', cpus: 1, memoryMb: 256 };
export function validateContract(value) {
    const x = object(value);
    const runner = oneOf(x.runner, ['trusted-example', 'docker'], 'runner');
    if (runner === 'trusted-example') {
        ensure(digest(x) === digest(EXAMPLE_CONTRACT), 'CONTRACT_INVALID', '可信示例使用固定运行契约', 400);
        return structuredClone(EXAMPLE_CONTRACT);
    }
    const image = text(x.image, 'image', 250);
    ensure(/^[a-zA-Z0-9./:_-]+@sha256:[a-f0-9]{64}$/.test(image), 'IMAGE_DIGEST_REQUIRED', '容器镜像必须固定 @sha256 摘要', 400);
    const metrics = object(x.metrics);
    ensure(Object.keys(metrics).length > 0, 'INVALID_INPUT', '请声明至少一个指标', 400);
    const parsed = {};
    for (const [k, v] of Object.entries(metrics)) {
        const m = object(v);
        parsed[text(k, 'metric key', 80)] = { unit: text(m.unit, 'unit', 100), direction: oneOf(m.direction, ['min', 'max'], 'direction') };
    }
    const command = strings(x.command, 'command', 30);
    ensure(command.length > 0, 'INVALID_INPUT', '执行入口不能为空', 400);
    return { runner, image, command, environment: {}, datasetVersion: text(x.datasetVersion, 'datasetVersion', 200), evaluationProtocolVersion: text(x.evaluationProtocolVersion, 'evaluationProtocolVersion', 200), metrics: parsed, expectedArtifacts: strings(x.expectedArtifacts, 'expectedArtifacts', 30), timeoutSeconds: integer(x.timeoutSeconds ?? 300, 'timeoutSeconds', 1, 86400), cpus: integer(x.cpus ?? 1, 'cpus', 1, 64), memoryMb: integer(x.memoryMb ?? 1024, 'memoryMb', 64, 65536) };
}
export function verifyTrustedExample(manifest, repoRoot) {
    if (manifest.contract.runner !== 'trusted-example')
        return;
    ensure(digest(manifest.contract) === digest(EXAMPLE_CONTRACT), 'UNTRUSTED_HOST_EXECUTION', '可信示例契约已修改', 403);
    const entry = manifest.sourceFiles.find(f => f.path === 'experiment.mjs');
    ensure(entry && entry.digest === digest(readFileSync(join(repoRoot, 'examples', 'curve-fit', 'experiment.mjs'))), 'UNTRUSTED_HOST_EXECUTION', '任意代码不能使用宿主示例 Runner；请配置容器执行', 403);
    const config = object(JSON.parse(readFileSync(join(manifest.snapshotPath, 'config.json'), 'utf8')));
    ensure(Object.keys(config).every(k => ['polynomialDegree', 'ridge', 'sleepMs', 'omitMetrics'].includes(k)), 'INVALID_INPUT', '示例配置包含未知参数', 400);
    integer(config.polynomialDegree, 'polynomialDegree', 0, 5);
    ensure(typeof config.ridge === 'number' && Number.isFinite(config.ridge) && config.ridge >= 0 && config.ridge <= 10, 'INVALID_INPUT', 'ridge 范围为 0–10', 400);
    if (config.sleepMs !== undefined)
        integer(config.sleepMs, 'sleepMs', 0, 10000);
    if (config.omitMetrics !== undefined)
        ensure(typeof config.omitMetrics === 'boolean', 'INVALID_INPUT', 'omitMetrics 必须为布尔值', 400);
}
//# sourceMappingURL=contracts.js.map