export const short = (id) => id ? id.slice(0, 8) : '—';
export const number = (value) => value === undefined ? '—' : Math.abs(value) < 0.001 ? value.toExponential(3) : value.toFixed(5);
export const date = (value) => new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const names = { draft: '草案', stopped: '已停止', proposed: '待批准提案', applied: '已应用', repair: '原节点修复', refill: '补充候选', promote: '晋级下一轮', stop: '停止研究', open: '进行中', closed: '已结束', decided: '已决策', pending: '待处理', queued: '排队中', running: '运行中', succeeded: '执行成功', failed: '失败', cancelled: '已取消', cancelling: '取消中', unknown: '待对账', provisional: '准备中', frozen: '已冻结', archived: '已归档', complete: '完整', incomplete: '不完整', invalid: '无效', accepted: '已验收', rejected: '未通过', disputed: '有争议', output_submitted: '已提交成果', waiting_user: '待人工处理', superseded: '旧版本', blocked: '已阻塞', awaiting_approval: '待批准', active: '进行中', paused: '已暂停', draining: '正在收尾', completed: '已完成', partial: '部分完成', approved: '已批准', stale: '已失效', idle: '空闲', interrupted: '已中止', waiting: '等待中', literature: '文献', designer: '设计', implementer: '实现', analyst: '分析', reviewer: '审查', writer: '写作', coordinator: '主协调者', proposal: '候选', implemented: '已实现', verified: '已实测', integration_unverified: '待真实接入验证', not_implemented: '未实现' };
export const label = (value) => names[value] ?? value;
export function comparisonMetric(data, selected) {
    const e = data.experiments.find(e => e.id === selected) ?? data.experiments[0];
    const definitions = e?.contract?.metrics ?? data.runs.find(r => r.manifest.contractDigest === e?.contractDigest)?.manifest.contract?.metrics;
    const key = Object.keys(definitions ?? {})[0] ?? 'mse'; // compatibility for legacy fixtures without a contract
    return { key, unit: definitions?.[key]?.unit ?? '', direction: definitions?.[key]?.direction ?? 'min', contractDigest: e?.contractDigest };
}
export function comparableRuns(data, selected) {
    const m = comparisonMetric(data, selected);
    return data.runs.filter(r => r.state === 'succeeded' && r.integrity === 'complete' && Number.isFinite(r.metrics?.[m.key]) && r.manifest.contractDigest === m.contractDigest);
}
