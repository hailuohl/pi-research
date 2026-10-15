/** Explicit bundled computation demo. Uses no LLM and never runs arbitrary imported code. */
import { setTimeout as delay } from 'node:timers/promises';
import { USER } from '../../packages/domain/types.js';
import { ensure } from '../../packages/domain/errors.js';
export async function campaignDemo(app, progress = () => { }) {
    ensure(app.store.list('run').every(r => ['succeeded', 'failed', 'cancelled'].includes(r.state)), 'ACTIVE_RUNS', '有活动或未知 Run；先对账，不重复提交示例');
    const project = app.projects.create(USER, { name: '持续研究 · 固定数值验证', description: '真实曲线拟合与持久化决定；不调用 Pi，不证明材料或论文结论。', template: 'curve-fit' });
    const session = app.sessions.create(USER, project.id, { title: '持续研究主会话' });
    app.sessions.system(session.id, '本活动由显式 demo-campaign 命令建立。4 次计算均为随包哈希校验数值示例；决定由确定性 CLI 脚本提出，不是 LLM 推理。');
    const baseline = app.experiments.create(USER, project.id, { title: '基线 · 一阶模型', hypothesis: '检查固定合成数据上的拟合误差', config: { polynomialDegree: 1, ridge: 0.000001 } });
    const draft = app.campaigns.create(USER, project.id, { rootSessionId: session.id, baselineExperimentId: baseline.id, goal: '以同一协议比较候选，再沿保留父节点建立下一轮', primaryMetric: 'mse', autoAnalyze: false, limits: { maxRounds: 3, maxCandidatesPerRound: 4, maxAnalysisAttempts: 0 } });
    const approve = (id) => { const a = app.store.get('approval', id); return app.approvals.decide(USER, id, a.version, true); };
    // The user-issued demo command consents only to this bounded bundled program. No provider calls.
    approve(draft.approvalId);
    app.campaigns.activate(USER, draft.id, draft.version);
    const c = () => app.campaigns.get(USER, draft.id);
    const runIds = [];
    const execute = async (intentId) => {
        const intent = app.store.get('run-intent', intentId);
        approve(intent.approvalId);
        let r = app.runs.submit(USER, intentId);
        runIds.push(r.id);
        const deadline = Date.now() + 45000;
        while (!['succeeded', 'failed', 'cancelled', 'unknown'].includes(r.state)) {
            ensure(Date.now() < deadline, 'DEMO_WAIT_TIMEOUT', '等待超时，保留 Run 供对账；不重复提交');
            app.runs.reconcile();
            app.runs.launchPending();
            await delay(60);
            r = app.runs.get(USER, r.id);
        }
        ensure(r.state === 'succeeded' && r.integrity === 'complete', 'DEMO_RUN_FAILED', `数值计算未完成：${r.state}/${r.integrity}`);
        app.campaigns.observe();
        progress(`Run ${r.id.slice(0, 8)} · 实测 mse=${r.metrics.mse}`);
        return r;
    };
    const baseIntent = app.runs.prepare(USER, baseline.id);
    app.campaigns.enroll(USER, draft.id, { intentId: baseIntent.id, expectedVersion: c().version });
    await execute(baseIntent.id);
    const observations = () => app.campaigns.observations(USER, draft.id);
    const decide = (body) => {
        const d = app.decisions.propose(USER, draft.id, { ...body, expectedVersion: c().version });
        approve(d.approvalId);
        return app.decisions.apply(USER, d.id, d.version);
    };
    const refill = decide({ action: 'refill', reason: '一阶结果已实测；比较同一父节点下二阶与三阶配置', observationIds: observations().map(o => o.id), candidates: [
            { title: '候选 A · 二阶模型', hypothesis: '固定协议的二阶候选', config: { polynomialDegree: 2, ridge: 0.000001 } },
            { title: '候选 B · 三阶模型', hypothesis: '固定协议的三阶候选', config: { polynomialDegree: 3, ridge: 0.000001 } }
        ] });
    const candidates = [];
    for (const id of refill.effects.intentIds)
        candidates.push(await execute(id));
    const selected = candidates.reduce((a, b) => a.metrics.mse <= b.metrics.mse ? a : b);
    const degree = candidates.indexOf(selected) === 0 ? 2 : 3;
    const promotion = decide({ action: 'promote', reason: '按两个已完成候选的实际 mse 保留较低者；只适用于本次固定合成数据比较', observationIds: observations().map(o => o.id), selectedRunId: selected.id, candidates: [
            { title: '下一轮 · 岭参数变体', hypothesis: '保留父节点后改变岭参数，结果仍待真实运行', config: { polynomialDegree: degree, ridge: 0.01 } }
        ] });
    await execute(promotion.effects.intentIds[0]);
    decide({ action: 'stop', reason: '用户授权的 4 次随包数值验证已完成；不继续搜索、不调用模型', observationIds: observations().filter(o => o.roundId === c().currentRoundId).map(o => o.id) });
    app.wakeups.reconcile();
    const runs = runIds.map(id => app.runs.get(USER, id)), decisions = app.campaigns.decisions(USER, draft.id);
    const report = app.reports.create(USER, project.id, { title: '持续研究活动 · 实测数值比较', runIds });
    const workflow = app.evidence.put(project.id, 'campaign-trace.json', Buffer.from(JSON.stringify({ campaign: c(), rounds: app.campaigns.rounds(USER, draft.id), decisions, observations: observations() }, null, 2)), 'application/json', 'campaign-demo');
    return { version: '0.3.2-experimental', aiUsed: false, projectId: project.id, sessionId: session.id, campaign: c(), rounds: app.campaigns.rounds(USER, draft.id), decisions, observations: observations(),
        runs: runs.map(r => ({ id: r.id, experimentId: r.experimentId, state: r.state, integrity: r.integrity, metrics: r.metrics, snapshotDigest: r.manifest.snapshotDigest, evidenceIds: r.evidenceIds })),
        retainedExperimentId: selected.experimentId, nextExperimentId: promotion.effects.experimentIds[0], reportId: report.id, reportPath: report.path, traceArtifactId: workflow.id,
        limitations: '固定合成数据实际运算；仅验证业务流程和恢复，不是 Pi/多模型/DFT/论文复现测试。' };
}
//# sourceMappingURL=campaign-demo.js.map