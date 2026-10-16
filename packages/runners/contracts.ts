import { readFileSync } from 'node:fs';
import type {DataPaths} from '../storage/data-paths.js';
import { join } from 'node:path';
import type { ResearchContract, Manifest } from '../domain/types.js';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { integer, object, oneOf, strings, text } from '../contracts/validation.js';
import {safePath} from '../workspace/files.js';
import {validateGpu} from './gpu.js';
export const EXAMPLE_CONTRACT: ResearchContract = { command: ['node', 'experiment.mjs'], environment: {}, datasetVersion: 'synthetic-quadratic-v1', evaluationProtocolVersion: 'deterministic-split-180-60-v1', metrics: { mse: { unit: 'squared-target', direction: 'min' }, r2: { unit: 'dimensionless', direction: 'max' }, train_mse: { unit: 'squared-target', direction: 'min' } }, expectedArtifacts: ['metrics.json', 'predictions.csv', 'model.json'], timeoutSeconds: 30, runner: 'trusted-example', cpus: 1, memoryMb: 256 };
export function validateContract(value: unknown): ResearchContract {
    const x = object(value);
    const runner = oneOf(x.runner, ['trusted-example', 'local', 'docker', 'ssh'] as const, 'runner');
    if (runner === 'trusted-example') {
        ensure(digest(x) === digest(EXAMPLE_CONTRACT), 'CONTRACT_INVALID', '可信示例使用固定运行契约', 400);
        return structuredClone(EXAMPLE_CONTRACT);
    }
    ensure(Object.keys(x).every(k=>['runner','localRuntimeId','gpu','image','command','environment','datasetVersion','evaluationProtocolVersion','metrics','expectedArtifacts','timeoutSeconds','cpus','threadLimit','memoryMb','dockerContext','sshTargetId','pids','workMb','logBytes','outputBytes','networkPolicy'].includes(k)),'CONTRACT_INVALID','运行契约包含未知字段',400);
    ensure(runner==='docker'||x.threadLimit===undefined,'CONTRACT_INVALID','线程上限仅支持 Docker 运行契约',400);
    const threadLimit=x.threadLimit===undefined?undefined:integer(x.threadLimit,'threadLimit',1,64);
    const gpu=x.gpu===undefined?undefined:validateGpu(x.gpu);
    const localRuntimeId=runner==='local'?text(x.localRuntimeId,'localRuntimeId',80):undefined;
    ensure(runner==='local'?x.image===undefined&&x.dockerContext===undefined&&x.sshTargetId===undefined:x.localRuntimeId===undefined,'CONTRACT_INVALID','运行时字段与后端不符',400);
    ensure(runner==='ssh'?x.dockerContext===undefined:x.sshTargetId===undefined,'CONTRACT_INVALID','运行目标字段与后端不符',400);
    const sshTargetId=runner==='ssh'?text(x.sshTargetId,'sshTargetId',80):undefined;
    if(sshTargetId)ensure(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(sshTargetId),'CONTRACT_INVALID','SSH 目标标识无效',400);
    ensure(x.environment===undefined||Object.keys(object(x.environment)).length===0,'CONTRACT_INVALID','本批不允许把宿主环境或密钥传入容器',400);
    ensure(runner==='local'?x.networkPolicy==='host':x.networkPolicy===undefined||x.networkPolicy==='none','CONTRACT_INVALID','本地可信运行需明确 networkPolicy:host；容器运行必须禁网',400);
    const image = runner==='local'?undefined:text(x.image, 'image', 250);
    ensure(runner==='local'||/^[a-zA-Z0-9./:_-]+@sha256:[a-f0-9]{64}$/.test(image!), 'IMAGE_DIGEST_REQUIRED', '容器镜像必须固定 @sha256 摘要', 400);
    const metrics = object(x.metrics);
    ensure(Object.keys(metrics).length > 0 && Object.keys(metrics).length<=32, 'INVALID_INPUT', '请声明 1–32 个指标', 400);
    const parsed: ResearchContract['metrics'] = Object.create(null);
    for (const [k, v] of Object.entries(metrics)) {
        const m = object(v);
        ensure(Object.keys(m).every(k=>k==='unit'||k==='direction'),'CONTRACT_INVALID','指标声明包含未知字段',400);
        parsed[text(k, 'metric key', 80)] = { unit: text(m.unit, 'unit', 100), direction: oneOf(m.direction, ['min', 'max'] as const, 'direction') };
    }
    ensure(Array.isArray(x.command)&&x.command.length<=30,'INVALID_INPUT','command 必须是最多30项的 argv',400);
    const command=x.command.map((arg,i)=>text(arg,'command',1000,i>0));
    ensure(command.length > 0, 'INVALID_INPUT', '执行入口不能为空', 400);
    if(runner==='local')ensure(/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(localRuntimeId!)&&command[0]===localRuntimeId,'LOCAL_RUNTIME_INVALID','本地 command 第一项必须是已配置的运行时 ID',400);
    ensure(command.every(arg=>!arg.includes('\0')),'INVALID_INPUT','argv 不能包含 NUL',400);
    const expectedArtifacts=strings(x.expectedArtifacts,'expectedArtifacts',30);
    ensure(expectedArtifacts.includes('metrics.json')&&new Set(expectedArtifacts).size===expectedArtifacts.length,'CONTRACT_INVALID','必需产物应包含 metrics.json 且不重复',400);
    for(const path of expectedArtifacts){safePath(process.cwd(),path);ensure(path.split('/').every(p=>!!p&&!/[\x00-\x1f:]/.test(p)&&!/[. ]$/.test(p))&&!['stdout.log','stderr.log','execution.json'].includes(path),'CONTRACT_INVALID','产物路径必须规范且不能占用宿主日志名称',400);}
    const dockerContext=text(x.dockerContext??'default','dockerContext',100);ensure(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(dockerContext),'CONTRACT_INVALID','Docker context 无效',400);
    return { runner,...(threadLimit===undefined?{}:{threadLimit}),...(image?{image}:{}),command, environment: {}, datasetVersion: text(x.datasetVersion, 'datasetVersion', 200), evaluationProtocolVersion: text(x.evaluationProtocolVersion, 'evaluationProtocolVersion', 200), metrics: parsed, expectedArtifacts, timeoutSeconds: integer(x.timeoutSeconds ?? 300, 'timeoutSeconds', 1, 86400), cpus: integer(x.cpus ?? 1, 'cpus', 1, 64), memoryMb: integer(x.memoryMb ?? 1024, 'memoryMb', 64, 65536),...(runner==='local'?{localRuntimeId}:runner==='ssh'?{sshTargetId}:{dockerContext}),...(gpu?{gpu}:{}),networkPolicy:runner==='local'?'host':'none',pids:integer(x.pids??128,'pids',16,512),workMb:integer(x.workMb??256,'workMb',16,1024),logBytes:integer(x.logBytes??16*1024*1024,'logBytes',1,16*1024*1024),outputBytes:integer(x.outputBytes??128*1024*1024,'outputBytes',1,128*1024*1024) };
}
export function verifyTrustedExample(manifest: Manifest, repoRoot: string, paths?:DataPaths) {
    if (manifest.contract.runner !== 'trusted-example')
        return;
    ensure(digest(manifest.contract) === digest(EXAMPLE_CONTRACT), 'UNTRUSTED_HOST_EXECUTION', '可信示例契约已修改', 403);
    const entry = manifest.sourceFiles.find(f => f.path === 'experiment.mjs');
    ensure(entry && entry.digest === digest(readFileSync(join(repoRoot, 'examples', 'curve-fit', 'experiment.mjs'))), 'UNTRUSTED_HOST_EXECUTION', '任意代码不能使用宿主示例 Runner；请配置容器执行', 403);
    const config = object(JSON.parse(readFileSync(join(paths?paths.physical(manifest.snapshotPath):manifest.snapshotPath, 'config.json'), 'utf8')));
    ensure(Object.keys(config).every(k => ['polynomialDegree', 'ridge', 'sleepMs', 'omitMetrics'].includes(k)), 'INVALID_INPUT', '示例配置包含未知参数', 400);
    integer(config.polynomialDegree, 'polynomialDegree', 0, 5);
    ensure(typeof config.ridge === 'number' && Number.isFinite(config.ridge) && config.ridge >= 0 && config.ridge <= 10, 'INVALID_INPUT', 'ridge 范围为 0–10', 400);
    if (config.sleepMs !== undefined)
        integer(config.sleepMs, 'sleepMs', 0, 10000);
    if (config.omitMetrics !== undefined)
        ensure(typeof config.omitMetrics === 'boolean', 'INVALID_INPUT', 'omitMetrics 必须为布尔值', 400);
}
