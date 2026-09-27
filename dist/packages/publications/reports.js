import { assertProjectWritable } from '../policy/lifecycle.js';
import { verifyRunRecord } from '../evidence/run-verifier.js';
import { scope, userOnly } from '../policy/permissions.js';
import { object, text, strings } from '../contracts/validation.js';
import { ensure } from '../domain/errors.js';
export class ReportService {
    c;
    evidence;
    constructor(c, evidence) {
        this.c = c;
        this.evidence = evidence;
    }
    create(actor, projectId, value) {
        userOnly(actor);
        scope(actor, projectId);
        return this.c.store.transaction(() => {
            assertProjectWritable(this.c.store, projectId);
            const x = object(value), title = text(x.title ?? '研究结果记录', 'title', 200), runIds = strings(x.runIds ?? [], 'runIds', 100), claimIds = strings(x.claimIds ?? [], 'claimIds', 100);
            const runs = runIds.map(id => this.c.store.get('run', id, projectId));
            const claims = claimIds.map(id => this.c.store.get('claim', id, projectId));
            ensure(runs.length + claims.length > 0, 'REPORT_EMPTY', '请选择真实运行或已采纳结论', 400);
            ensure(runs.every(r => ['succeeded', 'failed', 'cancelled'].includes(r.state)), 'RUN_NOT_TERMINAL', '未终态运行不能列为最终结果');
            ensure(new Set(runs.map(r => r.manifest.contractDigest)).size <= 1, 'INCOMPARABLE_CONTRACTS', '不同运行契约不能直接合并比较');
            claims.forEach(c => { ensure(c.status === 'accepted', 'CLAIM_NOT_ACCEPTED', '报告确定性结论只允许已采纳 Claim'); this.evidence.assertClaimCurrent(c); });
            runs.forEach(r => verifyRunRecord(r, this.evidence));
            const body = [`# ${title}`, `\n生成时间：${new Date().toISOString()}`, `\n这是根据数据库中实际运行和已采纳 Claim 生成的确定性记录，不是新的模型推断。进程成功不等于假设成立。`, ...runs.map(r => `\n## Run ${r.id}\n\n执行：${r.state}；完整性：${r.integrity}；科研判断：${r.judgment}；问题回答状态：${r.answerDisposition ?? (r.metrics ? 'answered' : '未评议')}（不是假设成立的证明）\n\n固定入口：\`${r.manifest.contract.command.join(' ')}\`\n\n数据：${r.manifest.contract.datasetVersion}；评估：${r.manifest.contract.evaluationProtocolVersion}\n\n快照：\`${r.manifest.snapshotDigest}\`\n\n${r.metrics ? '| 指标 | 实测值 | 单位 |\n|---|---:|---|\n' + Object.entries(r.metrics).map(([k, v]) => `| ${k} | ${v} | ${r.manifest.contract.metrics[k]?.unit ?? '未定义'} |`).join('\n') : '未获得完整实测指标。'}\n\n证据：${r.evidenceIds.map(id => `[${id}](pi-research://evidence/${id})`).join('、') || '无有效指标证据。'}`), ...claims.map(c => `\n## 已采纳结论\n\n${c.statement}\n\n限制：${c.limitations.join('；') || '未填写；不意味着不存在限制。'}\n\n证据：${c.evidenceIds.map(id => `[${id}](pi-research://evidence/${id})`).join('、')}`), '\n## 可追溯性与限制\n\n曲线拟合模板使用固定合成数据，仅验证工作流，不能当作材料性能、DFT 计算或论文复现结果。引用格式由工作台的证据页解析；导出 Markdown 后保留 ID 以便回查。'].join('\n');
            const artifact = this.evidence.put(projectId, title + '.md', Buffer.from(body), 'text/markdown', 'report');
            this.c.store.create('report', projectId, { artifactId: artifact.id, runIds, claimIds, evidenceIds: [...new Set([...runs.flatMap(r => r.evidenceIds), ...claims.flatMap(c => c.evidenceIds)])] });
            this.c.store.event(projectId, 'report.created', { artifactId: artifact.id, runIds, claimIds });
            return artifact;
        });
    }
}
//# sourceMappingURL=reports.js.map