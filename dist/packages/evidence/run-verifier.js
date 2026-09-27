import { SYSTEM } from '../domain/types.js';
import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { finiteMetrics } from '../contracts/validation.js';
/** Shared report/observation verifier; persistence status alone is never proof. */
export function verifyRunRecord(run, evidence) {
    ensure(run.manifestDigest === digest(run.manifest), 'MANIFEST_CORRUPTED', '运行清单摘要不一致');
    ensure(run.manifest.contractDigest === digest(run.manifest.contract), 'CONTRACT_CHANGED', '运行契约摘要不一致');
    const artifacts = run.artifactIds.map(id => evidence.read(SYSTEM, id));
    ensure(artifacts.every(a => a.artifact.projectId === run.projectId && a.artifact.runId === run.id && a.bytes.length === a.artifact.size), 'RUN_ARTIFACT_INVALID', '产物大小或运行归属无效');
    const refs = run.evidenceIds.map(id => evidence.verify(run.projectId, id));
    ensure(refs.every(e => e.runId === run.id && run.artifactIds.includes(e.artifactId)), 'EVIDENCE_INVALID', '证据归属或产物清单无效');
    if (run.integrity === 'complete') {
        ensure(run.manifest.contract.expectedArtifacts.every(path => artifacts.some(a => a.artifact.title === path)), 'RUN_ARTIFACT_MISSING', '完整结果缺少必需的不可变归档文件');
        ensure(!!run.metrics, 'EVIDENCE_REQUIRED', '完整结果缺少指标');
    }
    if (!run.metrics)
        return undefined;
    const matches = artifacts.filter(a => a.artifact.title === 'metrics.json');
    ensure(matches.length === 1 && refs.some(e => e.artifactId === matches[0].artifact.id), 'EVIDENCE_REQUIRED', '缺少唯一的原始指标及定位证据');
    const measured = finiteMetrics(JSON.parse(matches[0].bytes.toString('utf8')));
    ensure(digest(measured) === digest(run.metrics), 'METRIC_EVIDENCE_MISMATCH', '数据库指标与不可变原始产物不一致');
    ensure(Object.keys(run.manifest.contract.metrics).every(k => typeof measured[k] === 'number'), 'INVALID_METRICS', '缺少契约声明指标');
    return measured;
}
//# sourceMappingURL=run-verifier.js.map