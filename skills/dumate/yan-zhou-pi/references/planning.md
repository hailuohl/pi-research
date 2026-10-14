# 问题、计划与实验设计

入口：`python scripts/plan_workflow.py --workspace <workspace> --task T1 --id P1 --spec inputs/plan.json`。
修订加 `--previous P1` 并使用新 ID P2。产物位于本任务 `plans/P1/plan.json` 和 `plan.md`，不会创建正式 Run、启动实验或申请科学批准。

最小计划 JSON（示意字段，不是已完成研究）：

```json
{
  "question": "实际研究问题",
  "scope": "本次处理的材料、指标和边界",
  "constraints": ["既有数据集和计算预算"],
  "success_criteria": ["对实际问题给出可溯源回答"],
  "stop_conditions": ["来源变更或授权范围不足时停止"],
  "clarification_questions": [],
  "hypotheses": [{"statement": "待证伪的假设", "evidence_ids": []}],
  "evidence_ids": [],
  "source_ids": [],
  "steps": ["读取明确选择的材料", "计算计划许可的指标", "检查失败与不确定性"],
  "analysis_mode": "agent_decide",
  "status": "proposal"
}
```

先用包内来源登记、抽取和 evidence 入口建立真实来源，后把当前 task 的 ID 加入计划。hypotheses 中的 evidence_ids 必须是计划 evidence_ids 的子集；evidence 的来源和摘要也必须对应计划实际 source。没有证据时允许 proposal，明确记录 gap 和 partial，不能伪造 known、ready 或确认。

`analysis_mode` 必填：`materials_only` 禁止 statistics/chart 新分析；`required` 明确需要分析；`agent_decide` 允许在本计划 source_ids 授权内选择适用方法。下游不因为计划 complete 就得到了科学批准。

`ready` 要求无待澄清问题且已有选定证据；`confirmed` 额外要求 `user_confirmation` 记录已有真实用户确认的 `origin:"user"`、`statement`、`confirmed_by`、`confirmed_at`、`record_reference`。该记录保存确认出处，脚本不冒充用户确认，也不判定假设成立。

需要设计实验时填写 experiment_design：

```json
{
  "controls": ["数据、评估与训练预算固定"],
  "changed_factors": ["仅改变方法"],
  "data_split": "实际训练/验证/测试划分与泄漏边界",
  "primary_metric": {"name": "实际主指标", "direction": "lower", "unit": "dimensionless"},
  "guardrails": ["保留失败运行并报告计算成本"],
  "repetitions": {"count": 5, "rationale": "来自预期效应与已有变异的理由"},
  "inconclusive_criteria": ["差值区间跨零或关键假设未经核验"]
}
```

计划版本链保存旧 plan_id 和实际 plan.json 哈希；不能循环、跨 task 或静默改变同一问题。重开同 ID 先核对实际来源、依赖、参数、代码和产物字节；变更使用新版本 ID，旧版和失败目录保留。流程锁不自动清理，在确认原进程终态前不重复启动。
